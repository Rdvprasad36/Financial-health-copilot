import { Controller, Get, Post, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApprovalGateService } from './approval-gate.service';

@Controller()
export class NudgeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalGateService: ApprovalGateService,
  ) {}

  @Get('nudges')
  async listNudges(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.prisma.nudge.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
    });
  }

  @Post('nudges/:id/ack')
  async acknowledgeNudge(
    @Param('id') id: string,
    @Body() body: { actionTaken?: string }
  ) {
    return this.prisma.nudge.update({
      where: { id },
      data: {
        acknowledgedAt: new Date(),
        actionTaken: body.actionTaken || 'acknowledged',
      },
    });
  }

  @Post('actions/confirm-gst-registration')
  async createGstRegistrationAction(@Body() body: { userId: string }) {
    if (!body.userId) {
      throw new BadRequestException('userId is required');
    }
    return this.approvalGateService.suggest(body.userId, 'gst_registration', {});
  }

  @Post('actions/:id/confirm')
  async confirmAction(
    @Param('id') id: string,
    @Body() body: { userId: string }
  ) {
    if (!body.userId) {
      throw new BadRequestException('userId is required');
    }
    return this.approvalGateService.confirm(id, body.userId);
  }
}
