# Modern Authentication API with Fastify

A production-ready Node.js authentication API built with Fastify, featuring JWT tokens, refresh tokens, secure cookie storage, and comprehensive error handling.

## Features

- 🔐 **JWT Authentication** - Access tokens with 15-minute expiry
- 🔄 **Refresh Tokens** - 7-day refresh tokens for seamless authentication
- 🍪 **Secure Cookies** - HttpOnly cookies with proper security configurations
- 🛡️ **CORS Protection** - Configurable CORS with credential support
- 🎯 **Modern Architecture** - Clean separation of concerns with services, controllers, and middleware
- 📝 **Input Validation** - Zod schema validation for all endpoints
- 🚨 **Error Handling** - Comprehensive error handling with custom error classes
- 🔒 **Password Security** - bcrypt with salt rounds for secure password hashing
- 📊 **TypeScript** - Full TypeScript support with strict type checking

## Tech Stack

- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT + Refresh Tokens
- **Validation**: Zod
- **Password Hashing**: bcryptjs
- **CORS**: @fastify/cors
- **Cookies**: @fastify/cookie

## Architecture

```
backend/
├── src/
│   ├── config/           # Environment configuration
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth & error handling
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic (auth, user, jwt, database)
│   ├── types/           # TypeScript definitions
│   ├── utils/           # Utilities (errors)
│   └── server.ts        # Main server
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Sample data
└── package.json         # Dependencies & scripts
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

Set up PostgreSQL and initialize the database:

```bash
# Automatic setup (installs PostgreSQL if needed)
npm run db:setup
```

**OR manually:**

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb auth_db

# Copy environment file
cp env.example .env

# Update DATABASE_URL in .env file:
# DATABASE_URL=postgresql://postgres:@localhost:5432/auth_db

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Seed with sample data
npm run db:seed
```

### 3. Start Development Server

```bash
npm run start:dev
```

The server will start on `http://localhost:3001`

### 4. Run the Interactive Demo

Start both the API server and demo HTML page:

```bash
npm run demo
# OR
./run-demo.sh
```

This will:
- Start the API server on `http://localhost:3001`
- Start the demo page on `http://localhost:8000/demo.html`
- Automatically open the demo in your browser

### 5. Test the API (CLI)

Run the included test script to verify all endpoints work:

```bash
./test-api.sh
```

This will test all authentication endpoints including registration, login, token refresh, protected routes, and logout.

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API documentation |
| GET | `/health` | Health check |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh access token |

### Protected Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/profile` | Get user profile |
| POST | `/api/auth/logout` | Logout (invalidate session) |
| POST | `/api/auth/logout-all` | Logout from all devices |
| POST | `/api/auth/change-password` | Change password |

## Usage Examples

### Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Access Protected Route

Using Bearer Token:
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Using Cookies (automatic after login):
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -b "accessToken=YOUR_ACCESS_TOKEN"
```

### Refresh Token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -b "refreshToken=YOUR_REFRESH_TOKEN"
```

## Authentication Flow

1. **Register/Login** → Receive access token (15m) + refresh token (7d)
2. **API Requests** → Include access token in Authorization header or cookies
3. **Token Expires** → Use refresh token to get new access token
4. **Logout** → Invalidate tokens by incrementing user's token version

## Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Security**: Signed with separate secrets, includes issuer/audience
- **Token Versioning**: Prevent replay attacks with token versions
- **Secure Cookies**: HttpOnly, Secure (in production), SameSite protection
- **CORS**: Configurable origins with credential support
- **Input Validation**: Zod schemas prevent malformed requests
- **Error Handling**: Sanitized error responses (no sensitive data leakage)

## Configuration

All configuration is handled through environment variables with validation:

- **DATABASE_URL**: PostgreSQL connection string
- **JWT_SECRET**: Must be at least 32 characters
- **JWT_REFRESH_SECRET**: Must be at least 32 characters  
- **COOKIE_SECRET**: Must be at least 32 characters
- **COOKIE_SECURE**: Set to `true` in production
- **CORS_ORIGIN**: Comma-separated list of allowed origins

### Sample .env file:
```bash
# Database
DATABASE_URL=postgresql://postgres:@localhost:5432/auth_db

# Server
PORT=3001
NODE_ENV=development

# JWT (use strong secrets in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-at-least-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-at-least-32-chars

# Cookies
COOKIE_SECRET=your-super-secret-cookie-key-change-this-in-production-at-least-32-chars
```

## Database Management

### Available Commands:
- `npm run db:setup` - Complete database setup (installs PostgreSQL if needed)
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database (⚠️ deletes all data)

### Sample Users (after seeding):
- `admin@example.com` / `adminpassword123`
- `user@example.com` / `userpassword123`  
- `demo@example.com` / `demopassword123`

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong secrets (32+ characters)
3. Set `COOKIE_SECURE=true`
4. Configure proper CORS origins
5. Use HTTPS for all requests
6. Set up proper PostgreSQL instance
7. Run database migrations: `npx prisma migrate deploy`

## Error Responses

All errors follow this structure:

```json
{
  "error": {
    "statusCode": 400,
    "message": "Validation failed",
    "code": "VALIDATION_ERROR"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/auth/login",
  "method": "POST"
}
```

## Development

### Available Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Adding New Features

1. Define types in `src/types/`
2. Implement business logic in `src/services/`
3. Create controllers in `src/controllers/`
4. Add routes in `src/routes/`
5. Add middleware if needed in `src/middleware/`

## License

MIT 