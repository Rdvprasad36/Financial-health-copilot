import { Module } from '@nestjs/common';
import { SmoothingService } from './smoothing.service';

@Module({
  providers: [SmoothingService],
  exports: [SmoothingService],
})
export class ForecastModule {}
