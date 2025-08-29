import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { ValidationError } from '../utils/errors';
import { config } from '../config';

// Extend FastifyReply to include cookie methods
declare module 'fastify' {
  interface FastifyReply {
    setCookie(name: string, value: string, options?: any): FastifyReply;
    clearCookie(name: string, options?: any): FastifyReply;
  }
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // Validate request body
    const validation = registerSchema.safeParse(request.body);
    if (!validation.success) {
      throw new ValidationError(
        'Validation failed',
        validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      );
    }

    const { user, tokens } = await authService.register(validation.data);

    // Set cookies
    this.setAuthCookies(reply, tokens);

    reply.status(201).send({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        tokens,
      },
    });
  }

  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // Validate request body
    const validation = loginSchema.safeParse(request.body);
    if (!validation.success) {
      throw new ValidationError(
        'Validation failed',
        validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      );
    }

    const { user, tokens } = await authService.login(validation.data);

    // Set cookies
    this.setAuthCookies(reply, tokens);

    reply.send({
      success: true,
      message: 'Login successful',
      data: {
        user,
        tokens,
      },
    });
  }

  async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // Get refresh token from cookies or Authorization header
    let refreshToken: string | undefined;

    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      refreshToken = authHeader.substring(7);
    }

    if (!refreshToken && request.cookies) {
      refreshToken = request.cookies.refreshToken;
    }

    if (!refreshToken) {
      throw new ValidationError('Refresh token required');
    }

    const tokens = await authService.refreshToken(refreshToken);

    // Set new cookies
    this.setAuthCookies(reply, tokens);

    reply.send({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        tokens,
      },
    });
  }

  async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new ValidationError('User not authenticated');
    }

    await authService.logout(request.user.userId);

    // Clear cookies
    this.clearAuthCookies(reply);

    reply.send({
      success: true,
      message: 'Logout successful',
    });
  }

  async logoutAllDevices(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new ValidationError('User not authenticated');
    }

    await authService.logoutAllDevices(request.user.userId);

    // Clear cookies
    this.clearAuthCookies(reply);

    reply.send({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  }

  async getProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new ValidationError('User not authenticated');
    }

    const user = await userService.getUserProfile(request.user.userId);

    reply.send({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user,
      },
    });
  }

  async changePassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new ValidationError('User not authenticated');
    }

    // Validate request body
    const validation = changePasswordSchema.safeParse(request.body);
    if (!validation.success) {
      throw new ValidationError(
        'Validation failed',
        validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      );
    }

    const { currentPassword, newPassword } = validation.data;

    await authService.changePassword(request.user.userId, currentPassword, newPassword);

    // Clear cookies since all tokens are invalidated
    this.clearAuthCookies(reply);

    reply.send({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  }

  private setAuthCookies(reply: FastifyReply, tokens: { accessToken: string; refreshToken: string }): void {
    const cookieOptions = {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE,
      path: '/',
    };

    // Set access token cookie (expires in 15 minutes by default)
    reply.setCookie('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });

    // Set refresh token cookie (expires in 7 days by default)
    reply.setCookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
  }

  private clearAuthCookies(reply: FastifyReply): void {
    const cookieOptions = {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE,
      path: '/',
    };

    reply.clearCookie('accessToken', cookieOptions);
    reply.clearCookie('refreshToken', cookieOptions);
  }
}

export const authController = new AuthController();
export default authController; 