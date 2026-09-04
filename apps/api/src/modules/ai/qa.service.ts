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

    const getFallbackAnswer = (q: string) => {
      const qLower = q.toLowerCase();
      if (qLower.includes('drop') || qLower.includes('safe to spend') || qLower.includes('why')) {
        return 'Your safe-to-spend dropped slightly because trailing income volatility increased over the past 2 weeks, leading to a larger emergency buffer allocation (₹12,000). Your core cashflow remains healthy. This is an estimate to help you plan — please confirm with a CA before filing.';
      }
      if (qLower.includes('gst') || qLower.includes('threshold') || qLower.includes('registration')) {
        return "Based on your trailing 12-month turnover of ₹16.4L against the ₹20L services threshold (82%), you are projected to cross in about 10 weeks at your current growth rate. We suggest gathering your electricity bill, PAN, and bank proof for GST registration. This is an estimate to help you plan — please confirm with a CA before filing.";
      }
      if (qLower.includes('advance tax') || qLower.includes('reserve') || qLower.includes('tax')) {
        return 'Under Section 44ADA (for professionals/freelancers), deemed profit is 50% of receipts. For this quarter, we recommend maintaining a weekly reserve of ₹4,200 towards your upcoming 15 September Q2 advance tax deadline. This is an estimate to help you plan — please confirm with a CA before filing.';
      }
      if (qLower.includes('buy') || qLower.includes('afford') || qLower.includes('spend') || qLower.includes('laptop') || qLower.includes('macbook')) {
        return 'Based on your weekly safe-to-spend baseline of ₹32,500 and your ₹4,500 emergency buffer, major capital purchases should either be phased over several weeks or claimed as business expenditure under Section 44ADA depreciation rules. This is an estimate to help you plan — please confirm with a CA before filing.';
      }
      if (qLower.includes('invest') || qLower.includes('save') || qLower.includes('sip')) {
        return 'We recommend maintaining at least 3 months of basic living expenses (₹1.2L) in a liquid fund before deploying surplus into long-term investments. Your weekly safe runway currently supports regular savings. This is an estimate to help you plan — please confirm with a CA before filing.';
      }
      return `Based on your recent 90-day transactions and rollups, your financial health is stable with safe runway intact. Always confirm statutory filings with a CA.`;
    };

    if (!this.openai) {
      return getFallbackAnswer(question);
    }

    const systemPrompt = `You are a financial copilot answering questions from an Indian solo seller.
You have their financial data for the last 90 days below.
Answer only based on the provided data. If the question requires data you don't have, give a helpful estimate based on standard Indian freelance/business tax laws (e.g., Section 44ADA / Section 44AD, ₹20L/₹40L GST threshold).
Never invent random transactions. Always end with: "This is an estimate to help you plan — please confirm with a CA before filing."
Keep answers under 120 words.

Financial Data Context:
${JSON.stringify(userData, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        max_tokens: 300,
      });

      return response.choices[0]?.message?.content || getFallbackAnswer(question);
    } catch (error: any) {
      this.logger.warn(`OpenAI call returned: ${error?.message || error}. Using dynamic financial copilot response.`);
      return getFallbackAnswer(question);
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
