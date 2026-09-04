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
      setAnswer('Unable to connect to AI copilot service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold">Ask OpenAI Financial Copilot</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {predefinedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(q);
                handleAsk(q);
              }}
              className="text-[11px] bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-full transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Ask anything about your runway, taxes, or GST..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            className="text-xs h-9"
          />
          <Button
            onClick={() => handleAsk()}
            disabled={loading || !question.trim()}
            size="sm"
            className="h-9 px-3 shrink-0"
          >
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {answer && (
          <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10 text-xs text-foreground/90 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Copilot Insight:</span>
            </div>
            <p className="leading-relaxed">{answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
