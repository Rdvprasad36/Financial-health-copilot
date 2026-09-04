import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private generateToken(userId: string): string {
    const secret = this.config.get<string>('NEXTAUTH_SECRET') || 'default-secret';
    // Simple mock JWT for hackathon since we don't have @nestjs/jwt installed by default
    const payload = Buffer.from(JSON.stringify({ userId })).toString('base64');
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64');
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.${signature}`;
  }

  async register(email: string, password: string, fullName: string) {
    const hashedPassword = this.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        businessType: 'freelancer',
        stateCode: 'MH',
      },
    });

    const token = this.generateToken(user.id);
    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const hashedPassword = this.hashPassword(password);
    if (user.passwordHash !== hashedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id);
    return { user, token };
  }

  async validateToken(token: string) {
    const secret = this.config.get<string>('NEXTAUTH_SECRET') || 'default-secret';
    try {
      const [, payloadBase64, signature] = token.split('.');
      const expectedSignature = crypto.createHmac('sha256', secret).update(payloadBase64).digest('base64');

      if (signature !== expectedSignature) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
      const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
      return user;
    } catch {
      return null;
    }
  }
}
