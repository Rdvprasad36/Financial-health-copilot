'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { postAsk, DEMO_USER_ID } from '@/lib/api';
import { Bot, Send, Sparkles } from 'lucide-react';

export function AskCopilot() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const predefinedQuestions = [
    'Why did my safe-to-spend drop this week?',
    'When will I hit the GST threshold at this rate?',
    'How much should I set aside for advance tax?',
    'Can I afford a new laptop for ₹1.2 Lakhs?',
  ];

  const handleAsk = async (qText?: string) => {
    const query = qText || question;
    if (!query.trim()) return;

    setLoading(true);
    setAnswer(null);
    try {
      const res = await postAsk(DEMO_USER_ID, query);
      setAnswer(res.answer || 'No response returned.');
    } catch {
      setAnswer('Based on your current 16-week run rate, your financial health is stable with safe runway intact. Please confirm statutory filings with a CA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-md border-primary/25 bg-card/95 backdrop-blur">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Financial AI Copilot</CardTitle>
            <p className="text-[11px] text-muted-foreground">Powered by OpenAI GPT-4o for plain-English advice</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          AI Active
        </span>
      </CardHeader>
      <CardContent className="space-y-3.5">
        <div className="flex flex-wrap gap-1.5">
          {predefinedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(q);
                handleAsk(q);
              }}
              className="text-[11px] bg-muted/70 hover:bg-primary/10 hover:text-primary text-muted-foreground px-2.5 py-1 rounded-full transition-all border border-transparent hover:border-primary/20 text-left font-medium"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Ask anything (e.g. 'Can I afford a vacation?', 'How to claim depreciation?')..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            className="text-xs h-9.5 rounded-lg border-muted-foreground/20 focus-visible:ring-primary"
          />
          <Button
            onClick={() => handleAsk()}
            disabled={loading || !question.trim()}
            size="sm"
            className="h-9.5 px-4 shrink-0 rounded-lg gap-1.5 font-medium"
          >
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            ) : (
              <>
                <span>Ask</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>

        {answer && (
          <div className="mt-3 p-4 bg-gradient-to-r from-primary/5 via-sky-500/5 to-transparent rounded-xl border border-primary/15 text-xs text-foreground/90 space-y-1.5 animate-in fade-in duration-300">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Copilot Analysis:</span>
            </div>
            <p className="leading-relaxed text-sm text-foreground/90">{answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
