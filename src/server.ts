import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { config } from './config';
import { authRoutes } from './routes/auth.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { databaseService } from './services/database.service';

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'development' ? 'info' : 'warn',
    transport: config.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
});

async function buildServer() {
  try {
    // Initialize database connection
    await databaseService.connect();

    // Register CORS plugin
    await fastify.register(cors, {
      origin: (origin, callback) => {
        const allowedOrigins = config.CORS_ORIGIN.split(',').map(o => o.trim());
        
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'), false);
        }
      },
      credentials: config.CORS_CREDENTIALS,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    // Register cookie plugin
    await fastify.register(cookie, {
      secret: config.COOKIE_SECRET,
      parseOptions: {
        httpOnly: true,
        secure: config.COOKIE_SECURE,
        sameSite: config.COOKIE_SAME_SITE,
      },
    });

    // Health check endpoint
    fastify.get('/health', async (request, reply) => {
      const dbHealth = await databaseService.healthCheck();
      
      return {
        status: dbHealth ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
        database: dbHealth ? 'connected' : 'disconnected',
      };
    });

    // API documentation endpoint
    fastify.get('/', async (request, reply) => {
      return {
        name: 'Auth API',
        version: '1.0.0',
        description: 'Modern Node.js authentication API with Fastify',
        endpoints: {
          health: 'GET /health',
          auth: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            refresh: 'POST /api/auth/refresh',
            logout: 'POST /api/auth/logout',
            logoutAll: 'POST /api/auth/logout-all',
            profile: 'GET /api/auth/profile',
            changePassword: 'POST /api/auth/change-password',
          },
        },
        documentation: 'Visit the endpoints above for detailed schema information',
      };
    });

    // Register authentication routes
    await fastify.register(authRoutes, { prefix: '/api/auth' });

    // Register error handlers
    fastify.setErrorHandler(errorHandler);
    fastify.setNotFoundHandler(notFoundHandler);

    return fastify;
  } catch (error) {
    fastify.log.error(error);
    throw error;
  }
}

async function start() {
  try {
    const server = await buildServer();
    
    await server.listen({
      host: config.HOST,
      port: config.PORT,
    });

    server.log.info(`🚀 Server is running on http://${config.HOST}:${config.PORT}`);
    server.log.info(`📚 API Documentation available at http://${config.HOST}:${config.PORT}`);
    server.log.info(`🏥 Health check available at http://${config.HOST}:${config.PORT}/health`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await databaseService.disconnect();
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await databaseService.disconnect();
  await fastify.close();
  process.exit(0);
});

// Start server if this file is run directly
if (require.main === module) {
  start();
}

export { buildServer, start };
export default fastify; 