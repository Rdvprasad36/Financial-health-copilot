import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ForecastModule } from '../forecast/forecast.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ForecastModule, ComplianceModule, AiModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
