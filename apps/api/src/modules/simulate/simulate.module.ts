import { Module } from '@nestjs/common';
import { SimulateController } from './simulate.controller';
import { SimulateService } from './simulate.service';
import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  imports: [ComplianceModule],
  controllers: [SimulateController],
  providers: [SimulateService],
  exports: [SimulateService],
})
export class SimulateModule {}
