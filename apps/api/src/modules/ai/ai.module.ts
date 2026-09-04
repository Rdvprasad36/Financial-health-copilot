import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { ExplainerService } from './explainer.service';
import { NudgeCopyService } from './nudge-copy.service';
import { QaService } from './qa.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AiController],
  providers: [ExplainerService, NudgeCopyService, QaService],
  exports: [ExplainerService, NudgeCopyService, QaService],
})
export class AiModule {}
