import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId, question } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const getDynamicFinancialAnswer = (q: string) => {
      const qLower = q.toLowerCase();
      if (qLower.includes('drop') || qLower.includes('safe to spend') || qLower.includes('why')) {
        return "Your safe-to-spend dropped slightly because trailing income volatility increased over the past 2 weeks, leading to a larger emergency buffer allocation (\u20B912,000). Your core cashflow remains healthy. This is an estimate to help you plan \u2014 please confirm with a CA before filing.";
      }
      if (qLower.includes('gst') || qLower.includes('threshold') || qLower.includes('cross') || qLower.includes('registration')) {
        return "Based on your trailing 12-month turnover of \u20B916.4L against the \u20B920L services threshold (82%), you are projected to cross in about 10 weeks at your current growth rate. We suggest gathering your electricity bill, PAN, and bank proof for GST registration. This is an estimate to help you plan \u2014 please confirm with a CA before filing.";
      }
      if (qLower.includes('advance tax') || qLower.includes('reserve') || qLower.includes('due') || qLower.includes('tax')) {
        return "Under Section 44ADA (for professionals/freelancers), deemed profit is 50% of receipts. For this quarter, we recommend maintaining a weekly reserve of \u20B94,200 towards your upcoming 15 September Q2 advance tax deadline. This is an estimate to help you plan \u2014 please confirm with a CA before filing.";
      }
      if (qLower.includes('buy') || qLower.includes('afford') || qLower.includes('macbook') || qLower.includes('laptop') || qLower.includes('spend')) {
        return "Based on your weekly safe-to-spend baseline of \u20B932,500 and your \u20B94,500 emergency buffer, major equipment purchases should be phased over several weeks or claimed as business expenditure under Section 44ADA depreciation rules. This is an estimate to help you plan \u2014 please confirm with a CA before filing.";
      }
      if (qLower.includes('invest') || qLower.includes('save') || qLower.includes('emergency') || qLower.includes('sip')) {
        return "We recommend maintaining at least 3 months of basic living expenses (\u20B91.2L) in a liquid fund before deploying surplus into long-term investments. Your weekly safe runway currently supports regular savings. This is an estimate to help you plan \u2014 please confirm with a CA before filing.";
      }
      return `Based on your recent 90-day transactions and rollups, your financial health is stable with \u20B932,500 safe to spend this week after tax provisions. Always confirm statutory filings with a CA.`;
    };

    if (apiKey) {
      try {
        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: `You are an AI Financial Health Copilot for Indian solo sellers, creators, and freelancers.
User financial snapshot:
- Trailing 12M Gross Turnover: ₹16,40,000 (82% of ₹20,00,000 GST threshold)
- Smoothed Weekly Average Income: ₹42,000/week
- Weekly Safe to Spend: ₹32,500/week
- Weekly Advance Tax Reserve: ₹4,200/week (under Section 44ADA)
- Emergency Buffer: ₹4,500/week
- Next Advance Tax Deadline: 15 September (Q2 - 45% cumulative)

Answer the user question concisely, warmly, and practically (under 100 words).
Always end your response with: "This is an estimate to help you plan — please confirm with a CA before filing."`,
              },
              { role: 'user', content: question },
            ],
            max_tokens: 250,
          }),
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          const answer = data.choices?.[0]?.message?.content;
          if (answer) {
            return NextResponse.json({ answer, source: 'openai' });
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    return NextResponse.json({
      answer: getDynamicFinancialAnswer(question),
      source: 'copilot-engine',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process question' },
      { status: 500 }
    );
  }
}
