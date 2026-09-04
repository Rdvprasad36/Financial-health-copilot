import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NudgePayload, NudgeChannel } from '@fhc/shared';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  /**
   * Dispatches a nudge to the specified channels
   */
  async dispatch(userId: string, nudge: NudgePayload, channels: NudgeChannel[]): Promise<void> {
    for (const channel of channels) {
      try {
        if (channel === 'in_app') {
          await this.sendInApp(userId, nudge);
        } else {
          this.logger.log(`External notification disabled; saved in-app alert for ${userId}: ${nudge.title}`);
        }
      } catch (error) {
        this.logger.error(`Failed to send nudge via ${channel}: ${error}`);
      }
    }
  }

  /**
   * Saves the nudge for in-app display
   */
  async sendInApp(userId: string, nudge: NudgePayload): Promise<void> {
    const tierKey = (nudge.data as any)?.tierKey || null;
    await this.prisma.nudge.create({
      data: {
        userId,
        type: nudge.type,
        channel: 'in_app',
        payload: {
          title: nudge.title,
          body: nudge.body,
          ...nudge.data,
        },
        tierKey,
        sentAt: new Date(),
      },
    });
  }
}
