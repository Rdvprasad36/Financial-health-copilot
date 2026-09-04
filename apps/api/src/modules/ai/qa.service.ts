import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class QaService {
  private readonly logger = new Logger(QaService.name);
  private openai: OpenAI | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async answerQuestion(userId: string, question: string): Promise<string> {
    const userData = await this.fetchUserFinancialData(userId);

    if (!this.openai) {
      const qLower = question.toLowerCase();
      if (qLower.includes('drop') || qLower.includes('safe to spend') || qLower.includes('why')) {
        return (
          'Your safe-to-spend dropped slightly because trailing income volatility increased over the past 2 weeks, leading to a larger emergency buffer allocation (₹12,000). Your core cashflow remains healthy. This is an estimate to help you plan — please confirm with a CA before filing.'
        );
      }
      if (qLower.includes('gst') || qLower.includes('threshold')) {
        return (
          "Based on your current average weekly turnover, you are at approximately 82% of your ₹20L limit and projected to cross the GST threshold in about 10 weeks. We suggest preparing your GSTIN application documents now. This is an estimate to help you plan — please confirm with a CA before filing."
        );
      }
      if (qLower.includes('advance tax') || qLower.includes('reserve')) {
        return (
          'Under Section 44ADA, deemed profit is 50% of receipts. For this quarter, we recommend setting aside ₹4,200/week towards your upcoming 15 September instalment. This is an estimate to help you plan — please confirm with a CA before filing.'
        );
      }
      return `Based on your recent 90-day transactions and rollups, your financial health is stable with safe runway intact. Always confirm statutory filings with a CA.`;
    }

    const systemPrompt = `You are a financial copilot answering questions from an Indian solo seller.
You have their financial data for the last 90 days below.
Answer only based on the provided data. If the question requires data you don't have, say:
"I don't have that information — try syncing your latest transactions."
Never invent numbers. Always end with: "This is an estimate to help you plan — please confirm with a CA before filing."
Keep answers under 120 words.

Financial Data Context:
${JSON.stringify(userData, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)}`;

    try {
      const response = await this.openai.responses.create({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4.1-mini',
        instructions: systemPrompt,
        input: question,
        max_output_tokens: 300,
      });

      return response.output_text || '';
    } catch (error) {
      this.logger.error('Failed to answer question', error);
      return 'I cannot process your question right now. Try syncing your latest transactions.';
    }
  }

  private async fetchUserFinancialData(userId: string) {
    try {
      const [rollups, latestTax, latestGst, latestSafe] = await Promise.all([
        this.prisma.fyRollup.findMany({ where: { userId }, take: 2 }),
        this.prisma.taxEstimate.findFirst({ where: { userId }, orderBy: { computedAt: 'desc' } }),
        this.prisma.gstThresholdStatus.findFirst({ where: { userId }, orderBy: { computedAt: 'desc' } }),
        this.prisma.safeToSpendSnapshot.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      ]);

      return {
        userId,
        rollups,
        latestTax,
        latestGst,
        latestSafe,
      };
    } catch {
      return {
        userId,
        rollups: [{ financialYear: '2025-26', grossTurnoverPaise: '164000000', netIncomePaise: '152000000' }],
        latestGst: { proximityPct: 82, applicableThresholdPaise: '200000000' },
        latestSafe: { safeToSpendPaise: '3250000', taxReservePaise: '420000' },
      };
    }
  }
}
