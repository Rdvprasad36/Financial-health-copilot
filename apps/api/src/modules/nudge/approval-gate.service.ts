import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApprovalStatus } from '@fhc/shared';

@Injectable()
export class ApprovalGateService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates an approval action with 'suggested' status
   */
  async suggest(userId: string, actionType: string, payload: any) {
    return this.prisma.approvalAction.create({
      data: {
        userId,
        actionType,
        payload: payload || {},
        status: 'suggested' as ApprovalStatus,
      },
    });
  }

  /**
   * Transitions from suggested to confirmed
   */
  async confirm(actionId: string, userId: string) {
    const action = await this.prisma.approvalAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new BadRequestException('Action not found');
    }
    if (action.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }
    if (action.status !== 'suggested') {
      throw new BadRequestException(`Cannot confirm action in status: ${action.status}`);
    }

    return this.prisma.approvalAction.update({
      where: { id: actionId },
      data: {
        status: 'confirmed' as ApprovalStatus,
        confirmedAt: new Date(),
      },
    });
  }

  /**
   * Transitions from confirmed to executed
   */
  async execute(actionId: string) {
    const action = await this.prisma.approvalAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new BadRequestException('Action not found');
    }
    if (action.status !== 'confirmed') {
      throw new BadRequestException(`Cannot execute action in status: ${action.status}`);
    }

    return this.prisma.approvalAction.update({
      where: { id: actionId },
      data: {
        status: 'executed' as ApprovalStatus,
        executedAt: new Date(),
      },
    });
  }

  /**
   * Transitions from suggested/confirmed to rejected
   */
  async reject(actionId: string, userId: string) {
    const action = await this.prisma.approvalAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new BadRequestException('Action not found');
    }
    if (action.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }
    if (action.status === 'executed' || action.status === 'rejected') {
      throw new BadRequestException(`Cannot reject action in status: ${action.status}`);
    }

    return this.prisma.approvalAction.update({
      where: { id: actionId },
      data: {
        status: 'rejected' as ApprovalStatus,
      },
    });
  }
}
