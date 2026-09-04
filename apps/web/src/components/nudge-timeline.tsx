'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { ackNudge } from '@/lib/api';

export interface NudgeItem {
  id: string;
  type: string;
  sentAt: string;
  payload: {
    title: string;
    body: string;
  };
  actionTaken?: string | null;
}

interface NudgeTimelineProps {
  nudges: NudgeItem[];
  onActionComplete?: () => void;
}

export function NudgeTimeline({ nudges: initialNudges, onActionComplete }: NudgeTimelineProps) {
  const [nudges, setNudges] = React.useState<NudgeItem[]>(initialNudges);

  React.useEffect(() => {
    setNudges(initialNudges);
  }, [initialNudges]);

  const handleAction = async (id: string, action: string) => {
    try {
      await ackNudge(id, action);
      setNudges(prev =>
        prev.map(n => (n.id === id ? { ...n, actionTaken: action } : n))
      );
      if (onActionComplete) onActionComplete();
    } catch {
      // Local optimistic update
      setNudges(prev =>
        prev.map(n => (n.id === id ? { ...n, actionTaken: action } : n))
      );
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'gst_proximity':
        return <ShieldAlert className="h-4 w-4 text-amber-500" />;
      case 'advance_tax_due':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case 'low_buffer_warning':
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-3">
      {nudges.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-sm">
          No compliance nudges right now. You're completely up to date!
        </Card>
      ) : (
        nudges.map((nudge) => (
          <Card key={nudge.id} className="overflow-hidden border shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-muted p-2 shrink-0">
                    {getIcon(nudge.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-foreground">
                        {nudge.payload?.title || 'System Alert'}
                      </h4>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(nudge.sentAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {nudge.payload?.body}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {nudge.actionTaken ? (
                    <Badge variant="success" className="gap-1 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" />
                      {nudge.actionTaken === 'set_aside_confirmed'
                        ? 'Set Aside'
                        : nudge.actionTaken === 'registered_gst'
                        ? 'GST Initiated'
                        : 'Done'}
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(nudge.id, 'set_aside_confirmed')}
                      className="text-xs h-8 gap-1"
                    >
                      <span>Take Action</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
