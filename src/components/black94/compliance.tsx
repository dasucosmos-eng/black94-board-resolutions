'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/black94-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateId, callAIGeneric, POLICY_TYPES, formatDate } from '@/lib/black94-utils';
import type { Policy, ComplianceItem } from '@/lib/black94-types';
import { ClipboardCheck, Plus, Trash2, Search, Loader2, Sparkles, CheckCircle2, AlertTriangle, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function CompliancePage() {
  const { compliance, updateCompliance, callAIGeneric, addActivity } = useApp();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');

  const score = useMemo(() => compliance.length > 0 ? Math.round((compliance.filter(c => c.status === 'compliant').length / compliance.length) * 100) : 100, [compliance]);
  const overdue = compliance.filter(c => c.status === 'overdue').length;
  const upcoming = compliance.filter(c => c.status === 'upcoming' || c.status === 'due-soon').length;
  const compliant = compliance.filter(c => c.status === 'compliant').length;

  const handleStatusChange = (id: string, status: ComplianceItem['status']) => {
    updateCompliance(compliance.map(c => c.id === id ? { ...c, status } : c));
  };

  const handleNotesChange = (id: string, notes: string) => {
    updateCompliance(compliance.map(c => c.id === id ? { ...c, notes } : c));
  };

  const handleDateChange = (id: string, dueDate: string) => {
    updateCompliance(compliance.map(c => c.id === id ? { ...c, dueDate } : c));
  };

  const handleCheckCompliance = async () => {
    setAiLoading(true);
    try {
      const items = compliance.map(c => `${c.name} (${c.category}): Status=${c.status}, Due=${c.dueDate}, Last Filed=${c.lastFiled}`).join('\n');
      const result = await callAIGeneric(`You are a compliance expert for ${settings.companyName}, a ${settings.constitution} in India. Review these compliance items and provide specific recommendations:

${items}

Provide: 1) Items needing immediate attention 2) Upcoming deadlines 3) Recommendations 4) Penalties for non-compliance`);
      setAiResult(result);
      addActivity('Compliance Check', 'AI compliance review completed', 'compliance');
    } catch { toast.error('Failed to check compliance'); }
    setAiLoading(false);
  };

  const { settings } = useApp();
  const statusColor = (s: string) => {
    switch (s) { case 'compliant': return 'bg-emerald-500/10 text-emerald-400'; case 'overdue': return 'bg-red-500/10 text-red-400'; case 'due-soon': return 'bg-yellow-500/10 text-yellow-400'; case 'upcoming': return 'bg-blue-500/10 text-blue-400'; default: return 'bg-white/10 text-white/40'; }
  };
  const inputCls = "bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm h-9";

  const categories = [...new Set(compliance.map(c => c.category))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold text-white">Compliance Copilot</h1><p className="text-sm text-white/40">Monitor all regulatory requirements</p></div>
        <Button onClick={handleCheckCompliance} disabled={aiLoading} variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2 text-sm">
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Check Compliance
        </Button>
      </div>

      {/* Score */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-emerald-500/[0.06] border-emerald-500/10"><CardContent className="p-4 text-center"><CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" /><p className="text-2xl font-bold text-white">{score}%</p><p className="text-xs text-white/40">Compliance Score</p></CardContent></Card>
        <Card className="bg-emerald-500/[0.04] border-emerald-500/10"><CardContent className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" /><p className="text-xl font-bold text-white">{compliant}</p><p className="text-xs text-white/40">Compliant</p></CardContent></Card>
        <Card className="bg-red-500/[0.04] border-red-500/10"><CardContent className="p-4 text-center"><AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" /><p className="text-xl font-bold text-white">{overdue}</p><p className="text-xs text-white/40">Overdue</p></CardContent></Card>
        <Card className="bg-blue-500/[0.04] border-blue-500/10"><CardContent className="p-4 text-center"><Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" /><p className="text-xl font-bold text-white">{upcoming}</p><p className="text-xs text-white/40">Upcoming</p></CardContent></Card>
      </div>

      {/* Progress Bar */}
      <Card className="bg-white/[0.02] border-white/[0.06]"><CardContent className="p-4">
        <div className="flex items-center justify-between mb-2"><span className="text-sm text-white/60">Overall Compliance</span><span className="text-sm font-semibold text-white">{score}%</span></div>
        <Progress value={score} className="h-2 bg-white/[0.06]" />
      </CardContent></Card>

      {/* AI Result */}
      {aiResult && <Card className="bg-gradient-to-br from-amber-500/[0.04] to-transparent border-amber-500/10"><CardContent className="p-4"><pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed max-h-[300px] overflow-y-auto">{aiResult}</pre></CardContent></Card>}

      {/* Items by Category */}
      {categories.map(cat => (
        <div key={cat}>
          <h2 className="text-sm font-semibold text-white/60 mb-2">{cat}</h2>
          <div className="space-y-2 mb-4">
            {compliance.filter(c => c.category === cat).map(item => (
              <Card key={item.id} className="bg-white/[0.02] border-white/[0.06]">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium text-sm">{item.name}</h3>
                        <Badge variant="secondary" className={`text-[10px] ${statusColor(item.status)}`}>{item.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/30">
                        <span>Due: {item.dueDate}</span>
                        {item.lastFiled && <span>Last: {item.lastFiled}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={item.status} onValueChange={v => handleStatusChange(item.id, v as ComplianceItem['status'])}>
                        <SelectTrigger className="w-28 h-8 bg-white/5 border-white/10 text-xs text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#111] border-white/10">
                          <SelectItem value="compliant" className="text-emerald-400">Compliant</SelectItem>
                          <SelectItem value="overdue" className="text-red-400">Overdue</SelectItem>
                          <SelectItem value="due-soon" className="text-yellow-400">Due Soon</SelectItem>
                          <SelectItem value="upcoming" className="text-blue-400">Upcoming</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="date" value={item.dueDate} onChange={e => handleDateChange(item.id, e.target.value)} className="w-36 h-8 bg-white/5 border-white/10 text-white text-xs [color-scheme:dark]" />
                    </div>
                  </div>
                  <div className="mt-2"><Input value={item.notes} onChange={e => handleNotesChange(item.id, e.target.value)} placeholder="Add notes..." className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 text-xs h-8" /></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PolicyPage() {
  const { policies, addPolicy, deletePolicy, callAIGeneric, addActivity } = useApp();
  const [showGen, setShowGen] = useState(false);
  const [policyType, setPolicyType] = useState(POLICY_TYPES[0]);
  const [loading, setLoading] = useState(false);
  const [genResult, setGenResult] = useState('');
  const [search, setSearch] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await callAIGeneric(`Generate a complete, professional ${policyType} document for ${settings.companyName}, a ${settings.constitution} registered in ${settings.state}. Include: Introduction, Scope, Policy Statements, Procedures, Responsibilities, Compliance, Effective Date. Write in formal corporate language.`);
      setGenResult(result);
      addActivity('Policy Generated', `${policyType} generated`, 'policy');
    } catch { toast.error('Failed to generate policy'); }
    setLoading(false);
  };

  const handleSave = () => {
    if (!genResult) return;
    const policy: Policy = { id: generateId(), type: policyType, title: policyType, content: genResult, effectiveDate: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    addPolicy(policy);
    toast.success('Policy saved');
    setGenResult('');
    setShowGen(false);
  };

  const { settings } = useApp();
  const filtered = policies.filter(p => !search || p.type.toLowerCase().includes(search.toLowerCase()));
  const inputCls = "bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm h-9";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold text-white">AI Policy Generator</h1><p className="text-sm text-white/40">{policies.length} policies on record</p></div>
        <Button onClick={() => setShowGen(!showGen)} className="bg-white text-black hover:bg-white/90 font-semibold gap-2 text-sm"><Plus className="w-4 h-4" /> {showGen ? 'Cancel' : 'Generate Policy'}</Button>
      </div>

      {showGen && (
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader><CardTitle className="text-white text-base">Generate New Policy</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs font-medium">Policy Type</Label>
              <Select value={policyType} onValueChange={setPolicyType}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#111] border-white/10">{POLICY_TYPES.map(t => <SelectItem key={t} value={t} className="text-white/70">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={loading} variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2 text-sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate {policyType}
            </Button>
          </CardContent>
        </Card>
      )}

      {genResult && (
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-white text-sm">Generated: {policyType}</CardTitle>
            <Button size="sm" onClick={handleSave} className="bg-white text-black hover:bg-white/90 font-semibold gap-1 text-xs"><Plus className="w-3 h-3" /> Save</Button>
          </CardHeader>
          <CardContent><pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed max-h-[500px] overflow-y-auto">{genResult}</pre></CardContent>
        </Card>
      )}

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" /><Input placeholder="Search policies..." value={search} onChange={e => setSearch(e.target.value)} className={`pl-9 ${inputCls}`} /></div>

      {filtered.length === 0 ? (
        <Card className="bg-white/[0.02] border-white/[0.06]"><CardContent className="py-12 text-center"><FileText className="w-10 h-10 text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No policies yet. Generate your first policy above.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <Card key={p.id} className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-[10px] mb-1">{p.type}</Badge>
                  <p className="text-xs text-white/30">Effective: {formatDate(p.effectiveDate)} · Created: {formatDate(p.createdAt)}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => { deletePolicy(p.id); toast.success('Deleted'); }} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"><Trash2 className="w-3 h-3" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
