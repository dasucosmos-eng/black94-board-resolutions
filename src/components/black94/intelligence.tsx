'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/black94-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateId, callAIGeneric, formatDate } from '@/lib/black94-utils';
import type { TimelineEvent, DueDiligenceCategory } from '@/lib/black94-types';
import { BarChart3, CalendarDays, Search, Download, Sparkles, Loader2, FileText, CheckCircle2, XCircle, Clock, Building2 } from 'lucide-react';
import { toast } from 'sonner';

// ===== REPORTS =====
export function ReportsPage() {
  const { settings, resolutions, contracts, policies, compliance, approvals, vendors, clients, callAIGeneric, addActivity } = useApp();
  const [reportType, setReportType] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');

  const reportTypes = [
    { id: 'monthly', label: 'Monthly Business Summary' },
    { id: 'compliance', label: 'Compliance Status Report' },
    { id: 'board', label: 'Board Activity Report' },
    { id: 'financial', label: 'Financial Overview' },
    { id: 'approvals', label: 'Pending Approvals Report' },
    { id: 'resolution', label: 'Resolution Summary' },
    { id: 'vendor', label: 'Vendor/Client Status' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = `Company: ${settings.companyName}
Resolutions: ${resolutions.length} (${resolutions.map(r => `${r.title} (${r.date})`).join(', ') || 'None'})
Contracts: ${contracts.length}
Policies: ${policies.length} (${policies.map(p => p.type).join(', ') || 'None'})
Compliance Score: ${compliance.length > 0 ? Math.round((compliance.filter(c => c.status === 'compliant').length / compliance.length) * 100) : 100}%
Pending Approvals: ${approvals.filter(a => a.status === 'Pending').length}
Vendors: ${vendors.length}, Clients: ${clients.length}`;

      const r = await callAIGeneric(`Generate a professional ${reportTypes.find(r => r.id === reportType)?.label || reportType} for:
${data}

Write a comprehensive report with sections, statistics, and actionable insights.`);
      setReport(r);
      addActivity('Report Generated', `${reportTypes.find(r => r.id === reportType)?.label}`, 'report');
    } catch { toast.error('Failed to generate report'); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold text-white">Business Reports</h1><p className="text-sm text-white/40">AI-generated business intelligence</p></div>

      <Card className="bg-white/[0.02] border-white/[0.06]">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {reportTypes.map(r => (
              <button key={r.id} onClick={() => setReportType(r.id)} className={`p-3 rounded-lg text-xs text-left transition-all ${reportType === r.id ? 'bg-white/[0.08] text-white border border-white/10' : 'bg-white/[0.02] text-white/40 border border-white/[0.04] hover:bg-white/[0.04]'}`}>
                {r.label}
              </button>
            ))}
          </div>
          <Button onClick={handleGenerate} disabled={loading} variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2 text-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate Report
          </Button>
        </CardContent>
      </Card>

      {report && (
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-white text-sm">{reportTypes.find(r => r.id === reportType)?.label}</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(report)} className="text-white/30 hover:text-white/50 text-xs gap-1"><Download className="w-3 h-3" /> Copy</Button>
          </CardHeader>
          <CardContent><pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed">{report}</pre></CardContent>
        </Card>
      )}
    </div>
  );
}

// ===== TIMELINE =====
export function TimelinePage() {
  const { timeline, resolutions, contracts, compliance, policies, approvals, memory, addActivity, settings } = useApp();
  const [filterCat, setFilterCat] = useState('all');
  const [search, setSearch] = useState('');

  const allEvents = useMemo(() => {
    const events = [...timeline];
    resolutions.forEach(r => events.push({ id: r.id + '_res', title: r.title, description: `Resolution ${r.resolutionNumber}`, category: 'Resolution', date: r.date, createdAt: r.createdAt }));
    contracts.forEach(c => events.push({ id: c.id + '_con', title: c.title, description: `${c.type} with ${c.party2}`, category: 'Contract', date: c.createdAt, createdAt: c.createdAt }));
    policies.forEach(p => events.push({ id: p.id + '_pol', title: p.type, description: 'Policy created', category: 'Policy', date: p.createdAt, createdAt: p.createdAt }));
    memory.forEach(m => events.push({ id: m.id + '_mem', title: m.title, description: m.content.slice(0, 100), category: 'Memory', date: m.date, createdAt: m.createdAt }));
    approvals.forEach(a => events.push({ id: a.id + '_app', title: a.title, description: `${a.status} - ${a.department || 'General'}`, category: 'Approval', date: a.createdAt, createdAt: a.createdAt }));
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [timeline, resolutions, contracts, policies, memory, approvals]);

  const categories = ['all', ...new Set(allEvents.map(e => e.category))];
  const filtered = allEvents.filter(e => {
    if (filterCat !== 'all' && e.category !== filterCat) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const catColor = (cat: string) => {
    switch (cat) {
      case 'Resolution': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Contract': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Policy': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Approval': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Memory': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default: return 'bg-white/10 text-white/40 border-white/10';
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold text-white">Business Timeline</h1><p className="text-sm text-white/40">{allEvents.length} events across all modules</p></div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" /><Input placeholder="Search timeline..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm" /></div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent className="bg-[#111] border-white/10">{categories.map(c => <SelectItem key={c} value={c} className="text-white/70">{c === 'all' ? 'All' : c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="bg-white/[0.02] border-white/[0.06]"><CardContent className="py-12 text-center"><CalendarDays className="w-10 h-10 text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No timeline events yet</p></CardContent></Card>
      ) : (
        <div className="relative pl-8 space-y-0">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-white/[0.06]" />
          {filtered.map((e, i) => (
            <div key={i} className="relative pb-6">
              <div className={`absolute left-[-20px] w-2.5 h-2.5 rounded-full border-2 ${e.category === 'Resolution' ? 'bg-emerald-400 border-emerald-400' : e.category === 'Contract' ? 'bg-blue-400 border-blue-400' : e.category === 'Policy' ? 'bg-purple-400 border-purple-400' : 'bg-white/20 border-white/20'}`} />
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="secondary" className={`text-[10px] border ${catColor(e.category)}`}>{e.category}</Badge>
                    <span className="text-[10px] text-white/25">{formatDate(e.date)}</span>
                  </div>
                  <h3 className="text-white font-medium text-sm">{e.title}</h3>
                  {e.description && <p className="text-xs text-white/30 mt-1">{e.description}</p>}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== DUE DILIGENCE =====
export function DiligencePage() {
  const { diligence, updateDiligence, addActivity } = useApp();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');

  const totalDocs = diligence.reduce((sum, cat) => sum + cat.documents.length, 0);
  const uploadedDocs = diligence.reduce((sum, cat) => sum + cat.documents.filter(d => d.status === 'uploaded').length, 0);
  const progress = totalDocs > 0 ? Math.round((uploadedDocs / totalDocs) * 100) : 0;

  const toggleDoc = (catIdx: number, docId: string) => {
    const updated = diligence.map((cat, ci) => {
      if (ci !== catIdx) return cat;
      return { ...cat, documents: cat.documents.map(d => d.id === docId ? { ...d, status: d.status === 'uploaded' ? 'missing' as const : 'uploaded' as const } : d) };
    });
    updateDiligence(updated);
    setToStorage('black94_diligence', updated);
  };

  const { settings: diligenceSettings } = useApp();
  const handleCheck = async () => {
    setAiLoading(true);
    try {
      const r = await callAIGeneric(`Generate a due diligence readiness assessment for ${diligenceSettings.companyName || 'the company'}.
Categories: ${diligence.map(c => `${c.name}: ${c.documents.filter(d => d.status === 'uploaded').length}/${c.documents.length} documents`).join(', ')}
Overall progress: ${progress}%

Provide: 1) Readiness score 2) Missing critical documents 3) Recommendations 4) Risk assessment 5) Priority action items.`);
      setAiResult(r);
    } catch { toast.error('Check failed'); }
    setAiLoading(false);
  };

  // Simple localStorage helper for diligence toggle
  function setToStorage(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold text-white">Due Diligence Room</h1><p className="text-sm text-white/40">Document readiness for investors</p></div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-emerald-500/[0.04] border-emerald-500/10"><CardContent className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" /><p className="text-xl font-bold">{uploadedDocs}/{totalDocs}</p><p className="text-xs text-white/40">Documents</p></CardContent></Card>
        <Card className="bg-blue-500/[0.04] border-blue-500/10"><CardContent className="p-4 text-center"><Building2 className="w-5 h-5 text-blue-400 mx-auto mb-1" /><p className="text-xl font-bold">{diligence.length}</p><p className="text-xs text-white/40">Categories</p></CardContent></Card>
        <Card className="bg-amber-500/[0.04] border-amber-500/10"><CardContent className="p-4 text-center"><Sparkles className="w-5 h-5 text-amber-400 mx-auto mb-1" /><p className="text-xl font-bold">{progress}%</p><p className="text-xs text-white/40">Progress</p></CardContent></Card>
      </div>

      <Card className="bg-white/[0.02] border-white/[0.06]"><CardContent className="p-4">
        <div className="flex items-center justify-between mb-2"><span className="text-sm text-white/60">Readiness Progress</span><span className="text-sm font-semibold">{progress}%</span></div>
        <Progress value={progress} className="h-2 bg-white/[0.06]" />
      </CardContent></Card>

      {diligence.map((cat, ci) => (
        <div key={ci}>
          <h2 className="text-sm font-semibold text-white/60 mb-2 flex items-center gap-2">
            {cat.name}
            <Badge variant="secondary" className="text-[10px] bg-white/10 text-white/40">
              {cat.documents.filter(d => d.status === 'uploaded').length}/{cat.documents.length}
            </Badge>
          </h2>
          <div className="space-y-1.5 mb-4">
            {cat.documents.map(doc => (
              <div key={doc.id} onClick={() => toggleDoc(ci, doc.id)} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${doc.status === 'uploaded' ? 'bg-emerald-500/[0.04] border-emerald-500/10' : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${doc.status === 'uploaded' ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                  {doc.status === 'uploaded' && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${doc.status === 'uploaded' ? 'text-emerald-400' : 'text-white/60'}`}>{doc.name}</p>
                  <p className="text-[10px] text-white/25">{doc.description}</p>
                </div>
                <Badge variant="secondary" className={`text-[10px] shrink-0 ${doc.status === 'uploaded' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {doc.status === 'uploaded' ? 'Uploaded' : 'Missing'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== SETTINGS =====
export function SettingsPage() {
  const { settings, updateSettings, signature, setSignature, stamp, setStamp } = useApp();
  const [settingsForm, setSettingsForm] = useState(settings);
  const [sigDragOver, setSigDragOver] = useState(false);
  const [stampDragOver, setStampDragOver] = useState(false);
  const sigRef = React.useRef<HTMLInputElement>(null);
  const stampRef = React.useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateSettings(settingsForm);
    toast.success('Settings saved');
  };

  const handleFileUpload = (file: File, type: 'signature' | 'stamp') => {
    if (!file.type.startsWith('image/')) { toast.error('Upload an image'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'signature') setSignature(base64);
      else setStamp(base64);
      toast.success(`${type} saved`);
    };
    reader.readAsDataURL(file);
  };

  const inputCls = "bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm h-9";

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold text-white">Settings</h1><p className="text-sm text-white/40">Manage your corporate OS configuration</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader><CardTitle className="text-white text-base">Company Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-white/60 text-xs">Trade Name</label><Input value={settingsForm.companyName} onChange={e => setSettingsForm({ ...settingsForm, companyName: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1.5"><label className="text-white/60 text-xs">Legal Name</label><Input value={settingsForm.legalName} onChange={e => setSettingsForm({ ...settingsForm, legalName: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1.5"><label className="text-white/60 text-xs">Constitution</label><Input value={settingsForm.constitution} onChange={e => setSettingsForm({ ...settingsForm, constitution: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1.5"><label className="text-white/60 text-xs">GSTIN</label><Input value={settingsForm.gstin} onChange={e => setSettingsForm({ ...settingsForm, gstin: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1.5"><label className="text-white/60 text-xs">CIN</label><Input value={settingsForm.cin} onChange={e => setSettingsForm({ ...settingsForm, cin: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1.5"><label className="text-white/60 text-xs">PAN</label><Input value={settingsForm.authorityName} onChange={e => setSettingsForm({ ...settingsForm, authorityName: e.target.value })} className={inputCls} /></div>
            </div>
            <div className="space-y-1.5"><label className="text-white/60 text-xs">Address</label><Input value={settingsForm.address} onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })} className={inputCls} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5"><label className="text-white/60 text-xs">State</label><Input value={settingsForm.state} onChange={e => setSettingsForm({ ...settingsForm, state: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1.5"><label className="text-white/60 text-xs">District</label><Input value={settingsForm.district} onChange={e => setSettingsForm({ ...settingsForm, district: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1.5"><label className="text-white/60 text-xs">PIN Code</label><Input value={settingsForm.pinCode} onChange={e => setSettingsForm({ ...settingsForm, pinCode: e.target.value })} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-white/60 text-xs">Phone</label><Input value={settingsForm.phone} onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1.5"><label className="text-white/60 text-xs">Email</label><Input value={settingsForm.email} onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-white/60 text-xs">Authority Name</label><Input value={settingsForm.authorityName} onChange={e => setSettingsForm({ ...settingsForm, authorityName: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1.5"><label className="text-white/60 text-xs">Authority Title</label><Input value={settingsForm.authorityTitle} onChange={e => setSettingsForm({ ...settingsForm, authorityTitle: e.target.value })} className={inputCls} /></div>
            </div>
            <Button onClick={handleSave} className="bg-white text-black hover:bg-white/90 font-semibold w-full gap-2 text-sm">Save Settings</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardHeader><CardTitle className="text-white text-base">Signature</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {signature ? (
                <div className="relative group rounded-lg overflow-hidden border border-white/10 bg-white p-3">
                  <img src={signature} alt="sig" className="w-full h-24 object-contain" />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => sigRef.current?.click()} className="text-xs">Change</Button>
                    <Button size="sm" variant="destructive" onClick={() => setSignature(null)} className="text-xs">Remove</Button>
                  </div>
                </div>
              ) : (
                <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${sigDragOver ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/20'}`} onClick={() => sigRef.current?.click()} onDragOver={e => { e.preventDefault(); setSigDragOver(true); }} onDragLeave={() => setSigDragOver(false)} onDrop={e => { e.preventDefault(); setSigDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f, 'signature'); }}>
                  <p className="text-sm text-white/40">Click or drag to upload signature</p>
                </div>
              )}
              <input ref={sigRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'signature'); }} />
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardHeader><CardTitle className="text-white text-base">Company Stamp</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {stamp ? (
                <div className="relative group rounded-lg overflow-hidden border border-white/10 bg-white p-3">
                  <img src={stamp} alt="stamp" className="w-full h-24 object-contain" />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => stampRef.current?.click()} className="text-xs">Change</Button>
                    <Button size="sm" variant="destructive" onClick={() => setStamp(null)} className="text-xs">Remove</Button>
                  </div>
                </div>
              ) : (
                <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${stampDragOver ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/20'}`} onClick={() => stampRef.current?.click()} onDragOver={e => { e.preventDefault(); setStampDragOver(true); }} onDragLeave={() => setStampDragOver(false)} onDrop={e => { e.preventDefault(); setStampDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f, 'stamp'); }}>
                  <p className="text-sm text-white/40">Click or drag to upload stamp</p>
                </div>
              )}
              <input ref={stampRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'stamp'); }} />
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardHeader><CardTitle className="text-white text-base">About</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs text-white/40">
              <p>Black94 AI Corporate OS v2.0</p>
              <p>Your intelligent corporate management platform.</p>
              <p className="text-white/20">All data stored locally & synced to cloud securely.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
