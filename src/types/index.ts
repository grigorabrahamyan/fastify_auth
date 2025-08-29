export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  message: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  code?: string;
  details?: any;
}

export interface Config {
  PORT: number;
  HOST: string;
  NODE_ENV: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  COOKIE_SECRET: string;
  COOKIE_SECURE: boolean;
  COOKIE_SAME_SITE: 'strict' | 'lax' | 'none';
  CORS_ORIGIN: string;
  CORS_CREDENTIALS: boolean;
}

export interface RefreshTokenData {
  id: string;
  token: string;
  userId: string;
  tokenVersion: number;
  sessionId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
} 