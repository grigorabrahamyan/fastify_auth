import type { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';
import { AuthenticationError } from '../utils/errors';

// Extend FastifyRequest to include user and cookies
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
    };
    cookies: {
      [key: string]: string | undefined;
      accessToken?: string;
      refreshToken?: string;
    };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    // Try to get token from Authorization header first
    let token: string | undefined;
    
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no Bearer token, try to get from cookies
    if (!token) {
      token = request.cookies.accessToken;
    }

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Validate token and get user info
    const user = await authService.validateAccessToken(token);
    
    // Attach user to request
    request.user = user;
    
  } catch (error) {
    throw new AuthenticationError('Invalid or expired access token');
  }
}

export async function optionalAuthenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    // Try to get token from Authorization header first
    let token: string | undefined;
    
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no Bearer token, try to get from cookies
    if (!token) {
      token = request.cookies.accessToken;
    }

    if (token) {
      try {
        // Validate token and get user info
        const user = await authService.validateAccessToken(token);
        
        // Attach user to request
        request.user = user;
      } catch {
        // Token is invalid, but we don't throw error for optional auth
        request.user = undefined;
      }
    }
  } catch {
    // Ignore errors for optional authentication
    request.user = undefined;
  }
}

export function requireRole(roles: string[]) {
  return async function(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new AuthenticationError('Authentication required');
    }

    // For this simple implementation, we'll skip role checking
    // In a real app, you'd check user roles here
    // const userRoles = await getUserRoles(request.user.userId);
    // if (!roles.some(role => userRoles.includes(role))) {
    //   throw new AuthorizationError('Insufficient permissions');
    // }
  };
} 