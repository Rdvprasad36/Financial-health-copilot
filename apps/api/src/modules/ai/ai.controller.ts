import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ExplainerService } from './explainer.service';
import { QaService } from './qa.service';
import { ExplainerInput } from '@fhc/shared';

@Controller()
export class AiController {
  constructor(
    private readonly explainerService: ExplainerService,
    private readonly qaService: QaService,
  ) {}

  @Get('dashboard/explainer')
  async getExplainer(
    @Query('userId') userId: string,
    @Query('proximity_pct') proximity_pct: number,
    @Query('average_weeks_remaining') average_weeks_remaining: number,
    @Query('languagePreference') languagePreference: any,
  ) {
    const input: ExplainerInput = {
      userId,
      proximity_pct: Number(proximity_pct || 0),
      average_weeks_remaining: Number(average_weeks_remaining || 0),
      languagePreference: languagePreference || 'en',
    } as any;
    const explanation = await this.explainerService.generateExplanation(input);
    return { explanation };
  }

  @Post('ask')
  async askQuestion(@Body() body: { userId: string; question: string }) {
    const answer = await this.qaService.answerQuestion(body.userId, body.question);
    return { answer };
  }
}
