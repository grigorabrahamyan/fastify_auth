import jwt, { SignOptions } from 'jsonwebtoken';
import type { JwtPayload, RefreshTokenPayload, AuthTokens } from '../types';
import { config } from '../config';
import { AuthenticationError } from '../utils/errors';

class JwtService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = config.JWT_SECRET;
    this.refreshTokenSecret = config.JWT_REFRESH_SECRET;
    this.accessTokenExpiry = config.JWT_EXPIRES_IN;
    this.refreshTokenExpiry = config.JWT_REFRESH_EXPIRES_IN;
  }

  generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(
      payload,
      this.accessTokenSecret,
      {
        expiresIn: this.accessTokenExpiry,
        issuer: 'auth-api',
        audience: 'auth-client',
      } as any
    );
  }

  generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(
      payload,
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'auth-api',
        audience: 'auth-client',
      } as any
    );
  }

  generateTokens(userId: string, email: string, tokenVersion: number = 1): AuthTokens {
    // Add timestamp and random component to ensure uniqueness
    const now = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const nanoTime = process.hrtime.bigint().toString();
    
    const accessToken = this.generateAccessToken({ 
      userId, 
      email,
      jti: `access-${now}-${nanoTime}-${random}` // Unique JWT ID
    });
    
    const refreshToken = this.generateRefreshToken({ 
      userId, 
      tokenVersion,
      jti: `refresh-${now}-${nanoTime}-${random}` // Unique JWT ID
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'auth-api',
        audience: 'auth-client',
      }) as JwtPayload;

      return payload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'auth-api',
        audience: 'auth-client',
      }) as RefreshTokenPayload;

      return payload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  decodeToken(token: string): any {
    return jwt.decode(token);
  }

  getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const jwtService = new JwtService();
export default jwtService; 