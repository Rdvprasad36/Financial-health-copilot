import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NudgeSchedulerService } from './nudge-scheduler.service';
import { ApprovalGateService } from './approval-gate.service';
import { NotificationService } from './notification.service';
import { NudgeController } from './nudge.controller';
import { ComplianceModule } from '../compliance/compliance.module';
import { ForecastModule } from '../forecast/forecast.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'nudge',
    }),
    ComplianceModule,
    ForecastModule,
  ],
  controllers: [NudgeController],
  providers: [
    NudgeSchedulerService,
    ApprovalGateService,
    NotificationService,
  ],
  exports: [
    NudgeSchedulerService,
    ApprovalGateService,
    NotificationService,
  ],
})
export class NudgeModule {}
