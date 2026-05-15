'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/black94-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateId, formatDate, generateResolutionNumber, callAIResolution, RESOLUTION_CATEGORIES, RESOLUTION_TEMPLATES } from '@/lib/black94-utils';
import type { BoardResolution } from '@/lib/black94-types';
import {
  FileText, Plus, Trash2, Download, Eye, Copy, CheckCircle2, Calendar, MapPin, User,
  AlertCircle, Loader2, FileDown, Sparkles, Wand2, Search, Tag, X, Upload, Stamp, PenTool
} from 'lucide-react';
import { toast } from 'sonner';

export function ResolutionsPage() {
  const { settings, resolutions, addResolution, deleteResolution, signature, stamp, addActivity } = useApp();
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRes, setPreviewRes] = useState<BoardResolution | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [smartDescription, setSmartDescription] = useState('');
  const [smartLoading, setSmartLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', date: new Date().toISOString().split('T')[0], venue: '',
    preamble: '', resolvedText: '', resolvedBy: '', secondedBy: '',
    authorityName: settings.authorityName, authorityTitle: settings.authorityTitle,
    category: 'General', tags: '',
  });

  const resolutionNumber = generateResolutionNumber(resolutions);

  const handleSmartParse = async () => {
    if (!smartDescription.trim()) return;
    setSmartLoading(true);
    try {
      const parsed = await callAIResolution(smartDescription, settings);
      setForm(prev => ({
        ...prev,
        title: parsed.title || prev.title, preamble: parsed.preamble || prev.preamble,
        resolvedText: parsed.resolvedText || prev.resolvedText,
        venue: parsed.venue || prev.venue, resolvedBy: parsed.resolvedBy || prev.resolvedBy,
        secondedBy: parsed.secondedBy || prev.secondedBy,
        authorityName: parsed.authorityName || prev.authorityName,
        authorityTitle: parsed.authorityTitle || prev.authorityTitle,
      }));
      toast.success('AI generated a professional board resolution!');
    } catch { toast.error('Failed to generate resolution.'); }
    setSmartLoading(false);
  };

  const handleCreate = () => {
    if (!form.title || !form.resolvedText) { toast.error('Fill in required fields'); return; }
    const resolution: BoardResolution = {
      id: generateId(), resolutionNumber, title: form.title, date: form.date,
      venue: form.venue, preamble: form.preamble, resolvedText: form.resolvedText,
      resolvedBy: form.resolvedBy, secondedBy: form.secondedBy,
      authorityName: form.authorityName || settings.authorityName,
      authorityTitle: form.authorityTitle || settings.authorityTitle,
      status: 'final', category: form.category, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addResolution(resolution);
    addActivity('Resolution Created', `Created "${form.title}"`, 'resolution');
    toast.success('Resolution created successfully');
    setForm({ title: '', date: new Date().toISOString().split('T')[0], venue: '', preamble: '', resolvedText: '', resolvedBy: '', secondedBy: '', authorityName: settings.authorityName, authorityTitle: settings.authorityTitle, category: 'General', tags: '' });
    setSmartDescription('');
    setActiveTab('history');
  };

  const handleUseTemplate = (t: typeof RESOLUTION_TEMPLATES[0]) => {
    setForm(prev => ({ ...prev, title: t.title, category: t.category === 'Financial' ? 'Operational' : t.category }));
    setSmartDescription(t.desc);
    setActiveTab('create');
  };

  const filtered = resolutions.filter(r => {
    if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase()) && !r.resolutionNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const generatePDF = async () => {
    if (!previewRes) return;
    setGeneratingPdf(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');
      const el = document.getElementById('resolution-preview-render');
      if (!el) throw new Error('Preview element not found');
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: 794, windowWidth: 794 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, (canvas.height / canvas.width) * 210);
      pdf.save(`Resolution_${previewRes.resolutionNumber}.pdf`);
      toast.success('PDF downloaded');
    } catch { toast.error('Failed to generate PDF'); }
    setGeneratingPdf(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Board Resolutions</h1>
          <p className="text-sm text-white/40">{resolutions.length} resolutions on record</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveTab(activeTab === 'create' ? 'history' : 'create')} className="border-white/10 text-white/50 hover:bg-white/[0.04] text-xs">
            {activeTab === 'create' ? 'View History' : 'Create New'}
          </Button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="space-y-6">
          {/* Smart Builder */}
          <Card className="bg-gradient-to-br from-amber-500/[0.04] to-transparent border-amber-500/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> Smart Resolution Builder
              </CardTitle>
              <CardDescription className="text-white/40">Describe your resolution in plain English. AI generates professional legal text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea placeholder="Describe what the resolution is about..." value={smartDescription} onChange={e => setSmartDescription(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/20 min-h-[80px] resize-y text-sm" />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-white/20 flex items-center gap-1"><Wand2 className="w-3 h-3" />AI handles the professional writing</p>
                <Button onClick={handleSmartParse} disabled={!smartDescription.trim() || smartLoading} variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2 text-xs">
                  {smartLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {smartLoading ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardHeader className="pb-3"><CardTitle className="text-white text-sm">Quick Templates</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {RESOLUTION_TEMPLATES.map(t => (
                  <Button key={t.title} variant="outline" size="sm" onClick={() => handleUseTemplate(t)} className="border-white/[0.06] text-white/40 hover:text-white hover:bg-white/[0.04] text-xs h-auto py-2 justify-start">
                    <span className="truncate">{t.title}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-base flex items-center gap-2"><FileText className="w-5 h-5 text-white/60" /> Resolution Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">Resolution Number</Label>
                      <Input value={resolutionNumber} readOnly className="bg-white/5 border-white/10 text-white/40 font-mono text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">Date *</Label>
                      <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-white/5 border-white/10 text-white [color-scheme:dark]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">Title *</Label>
                      <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Resolution title..." className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">Category</Label>
                      <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#111] border-white/10">{RESOLUTION_CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-white/70">{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">Venue</Label>
                      <Input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="Registered Office" className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">Tags</Label>
                      <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="bank, SBI, current" className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs">Preamble / Background</Label>
                    <Textarea value={form.preamble} onChange={e => setForm({ ...form, preamble: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/20 min-h-[60px] resize-y" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs">&quot;RESOLVED THAT&quot; Text *</Label>
                    <Textarea value={form.resolvedText} onChange={e => setForm({ ...form, resolvedText: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/20 min-h-[100px] resize-y" />
                  </div>
                  <Separator className="bg-white/[0.06]" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">Proposed By</Label>
                      <Input value={form.resolvedBy} onChange={e => setForm({ ...form, resolvedBy: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">Seconded By</Label>
                      <Input value={form.secondedBy} onChange={e => setForm({ ...form, secondedBy: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
                    </div>
                  </div>
                  <Button onClick={handleCreate} disabled={!form.title || !form.resolvedText} className="bg-white text-black hover:bg-white/90 font-semibold gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Create Resolution
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardHeader className="pb-3"><CardTitle className="text-white text-sm">Company Info</CardTitle></CardHeader>
                <CardContent className="space-y-1.5 text-xs text-white/40">
                  <p className="font-medium text-white/60">{settings.companyName}</p>
                  <p>{settings.legalName} ({settings.constitution})</p>
                  <p className="font-mono">GSTIN: {settings.gstin}</p>
                </CardContent>
              </Card>
              {signature && (
                <Card className="bg-white/[0.02] border-white/[0.06]">
                  <CardHeader className="pb-2"><CardTitle className="text-white text-xs">Signature</CardTitle></CardHeader>
                  <CardContent><img src={signature} alt="sig" className="w-full h-16 object-contain" /></CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <Input placeholder="Search resolutions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent className="bg-[#111] border-white/10">
                <SelectItem value="all" className="text-white/70">All Categories</SelectItem>
                {RESOLUTION_CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-white/70">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="py-12 text-center">
                <FileText className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No resolutions found</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-2">
                {filtered.map(res => (
                  <Card key={res.id} className="bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="secondary" className="bg-white/10 text-white/60 text-[10px] font-mono">{res.resolutionNumber}</Badge>
                            {res.category && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-[10px]">{res.category}</Badge>}
                            {res.tags?.slice(0, 2).map(t => <Badge key={t} variant="secondary" className="bg-white/5 text-white/30 text-[10px]">{t}</Badge>)}
                          </div>
                          <h3 className="text-white font-medium text-sm truncate">{res.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(res.date)}</span>
                            {res.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{res.venue}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Dialog open={previewOpen && previewRes?.id === res.id} onOpenChange={open => { setPreviewOpen(open); if (open) setPreviewRes(res); }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-white/30 hover:text-white hover:bg-white/[0.06]" onClick={() => setPreviewRes(res)}>
                                <Eye className="w-4 h-4" /><span className="hidden sm:inline ml-1">Preview</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto bg-[#111] border-white/10">
                              <DialogHeader>
                                <DialogTitle className="text-white">Resolution Preview</DialogTitle>
                                <DialogDescription className="text-white/40">{res.resolutionNumber}</DialogDescription>
                              </DialogHeader>
                              <ResolutionPreviewContent res={res} settings={settings} signature={signature} stamp={stamp} />
                              <div className="flex justify-end mt-4">
                                <Button onClick={generatePDF} disabled={generatingPdf} className="bg-white text-black hover:bg-white/90 font-semibold gap-2">
                                  {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Download PDF
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="ghost" className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10" onClick={() => { deleteResolution(res.id); toast.success('Deleted'); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}

function ResolutionPreviewContent({ res, settings, signature, stamp }: { res: BoardResolution; settings: Record<string, string>; signature: string | null; stamp: string | null }) {
  return (
    <div id="resolution-preview-render" style={{ width: '794px', minHeight: '600px', background: '#fff', fontFamily: 'Georgia, serif', color: '#1a1a1a', padding: '48px', boxSizing: 'border-box' }}>
      <div style={{ background: '#0a0a0a', margin: '-48px -48px 32px -48px', padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/black94-logo.png" alt="" style={{ height: '48px', borderRadius: '4px' }} />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', margin: 0, letterSpacing: '2px' }}>{settings.companyName || 'Black94'}</h1>
            <p style={{ fontSize: '9px', color: '#888', margin: '2px 0 0 0' }}>{settings.legalName} ({settings.constitution})</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '9px', color: '#bbb', margin: 0 }}>GSTIN: {settings.gstin}</p>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', padding: '8px 0', borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd' }}>
        <div><span style={{ fontSize: '8px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Resolution No</span><p style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', margin: '2px 0 0 0' }}>{res.resolutionNumber}</p></div>
        <div style={{ textAlign: 'right' }}><span style={{ fontSize: '8px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</span><p style={{ fontSize: '10px', margin: '2px 0 0 0' }}>{formatDate(res.date)}</p></div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}><p style={{ fontSize: '14px', fontWeight: 'bold' }}>{res.title}</p></div>
      {res.venue && <p style={{ fontSize: '10px', color: '#666', marginBottom: '12px' }}>Venue: {res.venue}</p>}
      {res.preamble && <p style={{ fontSize: '11px', lineHeight: '1.6', marginBottom: '12px', fontStyle: 'italic' }}>{res.preamble}</p>}
      <p style={{ fontSize: '11px', lineHeight: '1.8', marginBottom: '24px' }}>{res.resolvedText}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{signature && <img src={signature} alt="sig" style={{ height: '36px' }} />}</div>
          <p style={{ fontSize: '10px', borderTop: '1px solid #999', paddingTop: '4px', marginTop: '4px' }}>{res.resolvedBy || res.authorityName}</p>
          <p style={{ fontSize: '8px', color: '#666' }}>Proposed By</p>
        </div>
        {res.secondedBy && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '10px', borderTop: '1px solid #999', paddingTop: '4px', marginTop: '48px' }}>{res.secondedBy}</p>
            <p style={{ fontSize: '8px', color: '#666' }}>Seconded By</p>
          </div>
        )}
        <div style={{ textAlign: 'center' }}>
          <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{stamp && <img src={stamp} alt="stamp" style={{ height: '36px' }} />}</div>
          <p style={{ fontSize: '10px', borderTop: '1px solid #999', paddingTop: '4px', marginTop: '4px' }}>Common Seal</p>
        </div>
      </div>
    </div>
  );
}
