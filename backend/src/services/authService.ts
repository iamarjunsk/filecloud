import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  isAdmin: boolean;
}

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    const tokens = this.generateTokens(user);

    return { user, ...tokens };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() },
      },
    });

    const tokens = this.generateTokens(user);

    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        quota: user.quota,
        usedQuota: user.usedQuota,
      },
      ...tokens,
    };
  },

  async refresh(refreshToken: string) {
    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new Error('Invalid refresh token');
    }

    const user = session.user;
    const tokens = this.generateTokens(user);

    await prisma.session.update({
      where: { id: session.id },
      data: { token: tokens.refreshToken },
    });

    return tokens;
  },

  async logout(refreshToken: string) {
    await prisma.session.deleteMany({
      where: { token: refreshToken },
    });
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        quota: true,
        usedQuota: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },

  generateTokens(user: { id: string; email: string; isAdmin: boolean }) {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  },
};
