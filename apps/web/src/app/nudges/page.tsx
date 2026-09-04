'use client';

import React, { useState, useEffect } from 'react';
import { NudgeTimeline, NudgeItem } from '@/components/nudge-timeline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchNudges, DEMO_USER_ID } from '@/lib/api';
import { Bell, CheckCircle2, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export default function NudgesPage() {
  const [nudges, setNudges] = useState<NudgeItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'gst' | 'tax'>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchNudges(DEMO_USER_ID);
      setNudges(data);
    } catch {
      // Handled in api
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredNudges = nudges.filter((n) => {
    if (filter === 'gst') return n.type === 'gst_proximity';
    if (filter === 'tax') return n.type === 'advance_tax_due';
    return true;
  });

  const totalNudges = nudges.length;
  const actedCount = nudges.filter((n) => n.actionTaken).length;
  const actionRate = totalNudges > 0 ? Math.round((actedCount / totalNudges) * 100) : 100;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Compliance Nudge Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Automated alerts, tax reminders, and compliance audit trail.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          className="self-start sm:self-auto text-xs h-8 gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Stats Bar (Section 1 Core Promise) */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-xs font-medium text-muted-foreground">Total Nudges</div>
            <div className="text-2xl font-bold text-foreground mt-0.5">{totalNudges}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 text-center">
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Action Rate (KPI)
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {actionRate}%
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-xs font-medium text-muted-foreground">Autonomous Engine</div>
            <div className="text-sm font-semibold text-primary mt-1 flex items-center justify-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              Daily 6 AM Cron
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 border-b pb-2">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
          className="text-xs h-8"
        >
          All Nudges ({totalNudges})
        </Button>
        <Button
          variant={filter === 'gst' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('gst')}
          className="text-xs h-8 gap-1"
        >
          <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
          GST Alerts
        </Button>
        <Button
          variant={filter === 'tax' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('tax')}
          className="text-xs h-8 gap-1"
        >
          <Bell className="h-3.5 w-3.5 text-blue-500" />
          Advance Tax Due
        </Button>
      </div>

      {/* Timeline List */}
      <NudgeTimeline nudges={filteredNudges} onActionComplete={loadData} />
    </div>
  );
}
