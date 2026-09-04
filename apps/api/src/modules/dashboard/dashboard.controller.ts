import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('safe-to-spend')
  getSafeToSpend(@Query('userId') userId: string) {
    return this.dashboardService.getSafeToSpend(userId);
  }

}
