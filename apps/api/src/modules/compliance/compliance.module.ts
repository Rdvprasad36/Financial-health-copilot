import { Module } from '@nestjs/common';
import { GstService } from './gst.service';
import { AdvanceTaxService } from './advance-tax.service';
import { ComplianceController } from './compliance.controller';

@Module({
  controllers: [ComplianceController],
  providers: [GstService, AdvanceTaxService],
  exports: [GstService, AdvanceTaxService],
})
export class ComplianceModule {}
