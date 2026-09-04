import { Controller, Post, Body } from '@nestjs/common';
import { SimulateService } from './simulate.service';

@Controller('simulate')
export class SimulateController {
  constructor(private readonly simulateService: SimulateService) {}

  @Post()
  simulate(@Body() body: { userId: string; extraIncomePaise: number; months: number }) {
    return this.simulateService.simulate(body);
  }
}
