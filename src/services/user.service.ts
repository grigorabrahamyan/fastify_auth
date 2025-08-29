import bcrypt from 'bcryptjs';
import type { User, RegisterRequest } from '../types';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';
import { databaseService } from './database.service';
import { config } from '../config';

class UserService {
  async createUser(userData: RegisterRequest): Promise<Omit<User, 'password'>> {
    const { email, password } = userData;

    // Validate input
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    if (!this.isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Check if user already exists
    const existingUser = await databaseService.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user in database
    const user = await databaseService.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await databaseService.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return user;
  }

  async findUserById(id: string): Promise<User | null> {
    const user = await databaseService.prisma.user.findUnique({
      where: { id },
    });

    return user;
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    // Check if user exists
    const user = await databaseService.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await databaseService.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await databaseService.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Delete user (cascade will handle refresh tokens)
    await databaseService.prisma.user.delete({
      where: { id: userId },
    });
  }

  async getUserProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await databaseService.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Development helper methods
  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await databaseService.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        password: false,
      },
    });

    return users;
  }

  async clearAllUsers(): Promise<void> {
    if (config.NODE_ENV !== 'development') {
      throw new Error('User clearing is only allowed in development environment');
    }

    await databaseService.prisma.user.deleteMany();
  }
}

export const userService = new UserService();
export default userService; 