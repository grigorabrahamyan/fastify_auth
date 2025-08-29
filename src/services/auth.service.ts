import type { LoginRequest, RegisterRequest, AuthResponse, AuthTokens, User } from '../types';
import { userService } from './user.service';
import { jwtService } from './jwt.service';
import { refreshTokenService } from './refresh-token.service';
import { databaseService } from './database.service';
import { AuthenticationError, ValidationError } from '../utils/errors';

class AuthService {
  async register(userData: RegisterRequest): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    // Create user
    const user = await userService.createUser(userData);
    
    // Generate tokens
    const tokens = jwtService.generateTokens(user.id, user.email, 1);
    
    // Store refresh token in database
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days
    
    // Generate unique session ID
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    await refreshTokenService.createRefreshToken(
      tokens.refreshToken,
      user.id,
      1,
      sessionId,
      refreshTokenExpiry
    );
    
    return {
      user,
      tokens,
    };
  }

  async login(credentials: LoginRequest): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    const { email, password } = credentials;

    // Validate input
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Find user
    const user = await userService.findUserByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Validate password
    const isValidPassword = await userService.validatePassword(password, user.password);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Get current token version from database
    const tokenVersion = await refreshTokenService.getUserTokenVersion(user.id);

    // Generate tokens
    const tokens = jwtService.generateTokens(user.id, user.email, tokenVersion);
    
    // Store refresh token in database
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days
    
    // Generate unique session ID
    const loginSessionId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    await refreshTokenService.createRefreshToken(
      tokens.refreshToken,
      user.id,
      tokenVersion,
      loginSessionId,
      refreshTokenExpiry
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Use database transaction to ensure atomicity and proper token invalidation
    return await databaseService.prisma.$transaction(async (prisma: any) => {
      // Find and verify refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken) {
        throw new AuthenticationError('Invalid or expired refresh token');
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        // Delete expired token
        await prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
        throw new AuthenticationError('Refresh token has expired');
      }

      // Verify JWT refresh token signature
      const payload = jwtService.verifyRefreshToken(refreshToken);
      
      // Double-check user exists
      const user = await userService.findUserById(payload.userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Check token version matches
      if (payload.tokenVersion !== storedToken.tokenVersion) {
        throw new AuthenticationError('Invalid refresh token version');
      }

      // Generate new tokens with incremented version for security
      const newTokenVersion = storedToken.tokenVersion + 1;
      const tokens = jwtService.generateTokens(user.id, user.email, newTokenVersion);
      
      // Delete ALL refresh tokens for this user (invalidates all sessions)
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });
      
      // Create new refresh token with new version
      const newRefreshTokenExpiry = new Date();
      newRefreshTokenExpiry.setDate(newRefreshTokenExpiry.getDate() + 7); // 7 days
      
      // Generate unique session ID
      const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
      
      await prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          tokenVersion: newTokenVersion,
          sessionId,
          expiresAt: newRefreshTokenExpiry,
        },
      });
      
      return tokens;
    });
  }

  async logout(userId: string): Promise<void> {
    // Delete all refresh tokens for this user
    await refreshTokenService.deleteAllUserRefreshTokens(userId);
  }

  async logoutAllDevices(userId: string): Promise<void> {
    // Same as logout - delete all refresh tokens
    await this.logout(userId);
  }

  async validateAccessToken(token: string): Promise<{ userId: string; email: string }> {
    try {
      const payload = jwtService.verifyAccessToken(token);
      
      // Check if user still exists
      const user = await userService.findUserById(payload.userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      return {
        userId: payload.userId,
        email: payload.email,
      };
    } catch (error) {
      throw new AuthenticationError('Invalid or expired access token');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get user
    const user = await userService.findUserById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Validate current password
    const isValidPassword = await userService.validatePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Update password
    await userService.updatePassword(userId, newPassword);

    // Invalidate all tokens
    await this.logout(userId);
  }

  // Development helper methods
  async getUserTokenVersion(userId: string): Promise<number> {
    return await refreshTokenService.getUserTokenVersion(userId);
  }

  async clearAllTokenVersions(): Promise<void> {
    await refreshTokenService.clearAllRefreshTokens();
  }
}

export const authService = new AuthService();
export default authService; 