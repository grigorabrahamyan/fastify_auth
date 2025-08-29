import type { RefreshTokenData } from '../types';
import { databaseService } from './database.service';
import { AuthenticationError, NotFoundError } from '../utils/errors';
import { config } from '../config';

class RefreshTokenService {
  async createRefreshToken(
    token: string,
    userId: string,
    tokenVersion: number,
    sessionId: string,
    expiresAt: Date
  ): Promise<RefreshTokenData> {
    // Clean up expired tokens for this user first
    await this.cleanupExpiredTokens(userId);

    const refreshToken = await databaseService.prisma.refreshToken.create({
      data: {
        token,
        userId,
        tokenVersion,
        sessionId,
        expiresAt,
      },
    });

    return refreshToken;
  }

  async findRefreshToken(token: string): Promise<RefreshTokenData | null> {
    const refreshToken = await databaseService.prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    // Check if token is expired
    if (refreshToken && refreshToken.expiresAt < new Date()) {
      // Delete expired token
      await this.deleteRefreshToken(refreshToken.id);
      return null;
    }

    return refreshToken;
  }

  async deleteRefreshToken(id: string): Promise<void> {
    try {
      await databaseService.prisma.refreshToken.delete({
        where: { id },
      });
    } catch (error) {
      // Token might already be deleted, ignore error
    }
  }

  async deleteRefreshTokenByToken(token: string): Promise<void> {
    try {
      await databaseService.prisma.refreshToken.delete({
        where: { token },
      });
    } catch (error) {
      // Token might already be deleted, ignore error
    }
  }

  async deleteRefreshTokenBySessionId(sessionId: string): Promise<void> {
    try {
      await databaseService.prisma.refreshToken.delete({
        where: { sessionId },
      });
    } catch (error) {
      // Token might already be deleted, ignore error
    }
  }

  async deleteAllUserRefreshTokens(userId: string): Promise<void> {
    await databaseService.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async updateTokenVersion(userId: string, newVersion: number): Promise<void> {
    // Delete all existing tokens for this user since version changed
    await this.deleteAllUserRefreshTokens(userId);
  }

  async getUserTokenVersion(userId: string): Promise<number> {
    const latestToken = await databaseService.prisma.refreshToken.findFirst({
      where: { userId },
      orderBy: { tokenVersion: 'desc' },
      select: { tokenVersion: true },
    });

    return latestToken?.tokenVersion || 1;
  }

  async cleanupExpiredTokens(userId?: string): Promise<void> {
    const where = {
      expiresAt: {
        lt: new Date(),
      },
      ...(userId && { userId }),
    };

    await databaseService.prisma.refreshToken.deleteMany({
      where,
    });
  }

  async cleanupAllExpiredTokens(): Promise<void> {
    await this.cleanupExpiredTokens();
  }

  // Development helper methods
  async getAllRefreshTokens(): Promise<RefreshTokenData[]> {
    if (config.NODE_ENV !== 'development') {
      throw new Error('This method is only available in development');
    }

    return databaseService.prisma.refreshToken.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async clearAllRefreshTokens(): Promise<void> {
    if (config.NODE_ENV !== 'development') {
      throw new Error('Token clearing is only allowed in development environment');
    }

    await databaseService.prisma.refreshToken.deleteMany();
  }
}

export const refreshTokenService = new RefreshTokenService();
export default refreshTokenService; 