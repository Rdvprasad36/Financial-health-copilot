import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { LanguagePreference, NudgeType } from '@fhc/shared';

@Injectable()
export class NudgeCopyService {
  private readonly logger = new Logger(NudgeCopyService.name);
  private openai: OpenAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async generateNudgeCopy(type: NudgeType, data: Record<string, unknown>, languagePreference: LanguagePreference): Promise<string> {
    if (!this.openai) {
      return this.getMockNudge(type, data);
    }

    let systemPrompt = `You are writing a brief notification for an Indian solo seller/creator.
Generate a short, actionable message under 280 characters.
Be warm and supportive, not alarming.
Use only the numbers provided in the input — never invent figures.
End with a clear call-to-action.`;

    if (languagePreference === 'hinglish') {
      systemPrompt += '\nRespond in conversational Hindi-English mix (Hinglish).';
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify({ type, data }) },
        ],
        max_tokens: 150,
      });

      return response.choices[0]?.message?.content || this.getMockNudge(type, data);
    } catch (error) {
      this.logger.warn('OpenAI nudge copy failed, using fallback', error);
      return this.getMockNudge(type, data);
    }
  }

  private getMockNudge(type: NudgeType, data: Record<string, unknown>): string {
    return `Hey! Just a quick reminder about your ${type}. Check your dashboard for more details!`;
  }
}
