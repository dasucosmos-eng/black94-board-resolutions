'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/lib/black94-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatShortDate, timeAgo } from '@/lib/black94-utils';
import {
  FileText, ShieldCheck, CheckSquare, Users, Sparkles, Plus, Bot, ClipboardCheck,
  TrendingUp, ArrowRight, Clock, AlertTriangle, DollarSign
} from 'lucide-react';

export function DashboardPage() {
  const { settings, resolutions, contracts, compliance, approvals, activities, setCurrentPage, callAIGeneric, chatHistory } = useApp();
  const [aiInsight, setAiInsight] = useState('Loading your daily insight...');
  const [loadingInsight, setLoadingInsight] = useState(true);

  const pendingApprovals = approvals.filter(a => a.status === 'Pending').length;
  const complianceScore = compliance.length > 0
    ? Math.round((compliance.filter(c => c.status === 'compliant').length / compliance.length) * 100)
    : 100;
  const overdueCompliance = compliance.filter(c => c.status === 'overdue').length;

  useEffect(() => {
    const loadInsight = async () => {
      try {
        const insight = await callAIGeneric(
          `You are a business advisor for ${settings.companyName} (${settings.legalName}), a ${settings.constitution} registered in ${settings.state} with GSTIN ${settings.gstin}. They have ${resolutions.length} board resolutions, ${contracts.length} contracts, and a compliance score of ${complianceScore}%. Give ONE concise, actionable business insight or tip for today (2-3 sentences max). Be specific to their business context.`
        );
        setAiInsight(insight);
      } catch {
        setAiInsight(`Welcome to Black94 AI Corporate OS. You have ${resolutions.length} resolutions on record. Make sure to check your compliance status and stay updated with all regulatory deadlines.`);
      }
      setLoadingInsight(false);
    };
    loadInsight();
  }, []);

  const recentActivities = activities.slice(0, 5);

  const quickActions = [
    { label: 'New Resolution', icon: <Plus className="w-4 h-4" />, page: 'resolutions' as const },
    { label: 'Generate NDA', icon: <ShieldCheck className="w-4 h-4" />, page: 'contracts' as const },
    { label: 'Chat with AI', icon: <Bot className="w-4 h-4" />, page: 'chat' as const },
    { label: 'Check Compliance', icon: <ClipboardCheck className="w-4 h-4" />, page: 'compliance' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome to {settings.companyName}</h1>
        <p className="text-white/40 mt-1">Your AI-powered corporate command center</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FileText className="w-5 h-5 text-emerald-400" />} label="Total Resolutions" value={resolutions.length.toString()} sub={`Last: ${resolutions.length > 0 ? formatShortDate(resolutions[0].date) : 'N/A'}`} />
        <StatCard icon={<ShieldCheck className="w-5 h-5 text-blue-400" />} label="Active Contracts" value={contracts.length.toString()} sub={`${contracts.filter(c => c.type === 'NDA').length} NDAs`} />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} label="Compliance Score" value={`${complianceScore}%`} sub={complianceScore >= 80 ? 'Good standing' : 'Needs attention'} color={complianceScore >= 80 ? 'emerald' : complianceScore >= 60 ? 'yellow' : 'red'} />
        <StatCard icon={<CheckSquare className="w-5 h-5 text-amber-400" />} label="Pending Approvals" value={pendingApprovals.toString()} sub={overdueCompliance > 0 ? `${overdueCompliance} overdue items` : 'All on track'} color={pendingApprovals > 0 ? 'amber' : 'emerald'} />
      </div>

      {/* AI Insight + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-amber-500/[0.06] to-transparent border-amber-500/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                AI Insight of the Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInsight ? (
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                  Analyzing your business data...
                </div>
              ) : (
                <p className="text-white/60 text-sm leading-relaxed">{aiInsight}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="ghost"
                onClick={() => setCurrentPage(action.page)}
                className="w-full justify-between text-white/50 hover:text-white hover:bg-white/[0.04] px-3 h-10"
              >
                <span className="flex items-center gap-2 text-[13px]">{action.icon}{action.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/20" />
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white/[0.02] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/40" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/25 text-sm">No recent activity yet. Start by creating a resolution or using the AI assistant.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-400/50 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70">{act.action}</p>
                    <p className="text-xs text-white/30 mt-0.5">{act.description}</p>
                  </div>
                  <span className="text-[10px] text-white/20 shrink-0">{timeAgo(act.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = 'emerald' }: { icon: React.ReactNode; label: string; value: string; sub: string; color?: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500/10 to-emerald-500/[0.02] border-emerald-500/10',
    blue: 'from-blue-500/10 to-blue-500/[0.02] border-blue-500/10',
    amber: 'from-amber-500/10 to-amber-500/[0.02] border-amber-500/10',
    red: 'from-red-500/10 to-red-500/[0.02] border-red-500/10',
    yellow: 'from-yellow-500/10 to-yellow-500/[0.02] border-yellow-500/10',
  };
  return (
    <Card className={`bg-gradient-to-br ${colorMap[color] || colorMap.emerald}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          {icon}
          <span className="text-[10px] text-white/25 uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-[11px] text-white/30 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
