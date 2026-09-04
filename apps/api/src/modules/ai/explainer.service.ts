import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { LanguagePreference, ExplainerInput } from '@fhc/shared';

@Injectable()
export class ExplainerService {
  private readonly logger = new Logger(ExplainerService.name);
  private openai: OpenAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not set, using mock explanations');
    }
  }

  async generateExplanation(input: ExplainerInput | any): Promise<string> {
    const proximity = input?.gstStatus?.proximityPct || input?.proximity_pct || 0;
    const safeRupees = input?.safeToSpend?.safeToSpendPaise
      ? Number(input.safeToSpend.safeToSpendPaise) / 100
      : 32500;
    const taxRupees = input?.safeToSpend?.taxReservePaise
      ? Number(input.safeToSpend.taxReservePaise) / 100
      : 4200;

    if (!this.openai) {
      if (proximity >= 95) {
        return `You're at ₹${(proximity * 0.2).toFixed(1)}L of your ₹20L limit (${proximity.toFixed(0)}%) — just 2 weeks from mandatory GST registration. Please set aside ₹${taxRupees.toLocaleString('en-IN')} for tax this week. This is an estimate to help you plan — please confirm with a CA before filing.`;
      }
      if (proximity >= 80) {
        return `You're at ₹${(proximity * 0.2).toFixed(1)}L of your ₹20L limit (${proximity.toFixed(0)}%) — about 10 good weeks of orders remaining before crossing. Safe to spend ₹${safeRupees.toLocaleString('en-IN')} this week after setting aside ₹${taxRupees.toLocaleString('en-IN')} for tax. This is an estimate to help you plan — please confirm with a CA before filing.`;
      }
      return `Your income is steady with ₹${safeRupees.toLocaleString('en-IN')} safely spendable this week. We've set aside ₹${taxRupees.toLocaleString('en-IN')} for your quarterly advance tax. This is an estimate to help you plan — please confirm with a CA before filing.`;
    }

    let systemPrompt = `You are a financial copilot for Indian solo sellers and creators. You will be given
a JSON object with the user's computed financial figures. Your job:
1. Explain the numbers in one short, warm paragraph — no jargon.
2. If a threshold proximity_pct >= 0.6, clearly state how many "average weeks" of
   income remain before crossing, using only the numbers provided.
3. Suggest ONE concrete next action (e.g. "set aside ₹X before Friday").
4. Never state a tax rate, threshold, or amount that is not present in the input JSON.
5. End with: "This is an estimate to help you plan — please confirm with a CA before filing."
Respond in under 120 words.`;

    if (input.languagePreference === 'hinglish') {
      systemPrompt += '\nRespond in conversational Hindi-English mix (Hinglish).';
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(input) },
        ],
        max_tokens: 300,
      });

      return response.choices[0]?.message?.content || `Safe to spend is ₹${safeRupees.toLocaleString('en-IN')} after reserving ₹${taxRupees.toLocaleString('en-IN')} for advance tax. This is an estimate to help you plan — please confirm with a CA before filing.`;
    } catch (error) {
      this.logger.warn('OpenAI explainer failed or quota reached, using deterministic summary', error);
      return `Safe to spend is ₹${safeRupees.toLocaleString('en-IN')} after reserving ₹${taxRupees.toLocaleString('en-IN')} for advance tax. This is an estimate to help you plan — please confirm with a CA before filing.`;
    }
  }
}
