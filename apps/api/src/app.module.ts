import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { ForecastModule } from './modules/forecast/forecast.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { NudgeModule } from './modules/nudge/nudge.module';
import { AiModule } from './modules/ai/ai.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SimulateModule } from './modules/simulate/simulate.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 60,  // 60 requests per minute globally
      },
    ]),

    // BullMQ for background jobs
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),

    // Cron/scheduled tasks
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    ComplianceModule,
    ForecastModule,
    IngestionModule,
    NudgeModule,
    AiModule,
    DashboardModule,
    SimulateModule,
  ],
})
export class AppModule {}
