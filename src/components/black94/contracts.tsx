'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/black94-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateId, callAIGeneric, NDA_TYPES, CONTRACT_TYPES, formatDate } from '@/lib/black94-utils';
import type { Contract } from '@/lib/black94-types';
import { ShieldCheck, Plus, Trash2, Search, Loader2, Sparkles, FileText, Eye, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function ContractsPage() {
  const { contracts, addContract, deleteContract, settings, callAIGeneric, addActivity } = useApp();
  const [activeTab, setActiveTab] = useState<'nda' | 'contracts' | 'analyze' | 'history'>('nda');
  const [loading, setLoading] = useState(false);
  const [genResult, setGenResult] = useState('');
  const [search, setSearch] = useState('');

  // NDA Form
  const [ndaType, setNdaType] = useState(NDA_TYPES[0]);
  const [ndaForm, setNdaForm] = useState({ party1: settings.companyName, party2: '', duration: '2 years', jurisdiction: 'India', restrictions: '' });

  // Contract Form
  const [contractType, setContractType] = useState(CONTRACT_TYPES[0]);
  const [contractForm, setContractForm] = useState({ title: '', party1: settings.companyName, party2: '', terms: '', paymentTerms: '', duration: '' });

  // Clause Analysis
  const [clauseText, setClauseText] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');

  const handleGenerateNDA = async () => {
    setLoading(true);
    try {
      const result = await callAIGeneric(`Generate a professional ${ndaType} for:
Disclosing Party: ${ndaForm.party1}
Receiving Party: ${ndaForm.party2}
Duration: ${ndaForm.duration}
Jurisdiction: ${ndaForm.jurisdiction}
${ndaForm.restrictions ? `Specific restrictions: ${ndaForm.restrictions}` : ''}

Write the complete NDA with all clauses including: definition of confidential information, obligations, exclusions, term, remedies, governing law, and signatures block.`);
      setGenResult(result);
      addActivity('NDA Generated', `${ndaType} for ${ndaForm.party2}`, 'contract');
    } catch { toast.error('Failed to generate NDA'); }
    setLoading(false);
  };

  const handleGenerateContract = async () => {
    setLoading(true);
    try {
      const result = await callAIGeneric(`Generate a professional ${contractType} for:
Party A: ${contractForm.party1}
Party B: ${contractForm.party2}
${contractForm.terms ? `Key Terms: ${contractForm.terms}` : ''}
${contractForm.paymentTerms ? `Payment Terms: ${contractForm.paymentTerms}` : ''}
${contractForm.duration ? `Duration: ${contractForm.duration}` : ''}

Write the complete ${contractType} with all standard clauses.`);
      setGenResult(result);
      addActivity('Contract Generated', `${contractType} with ${contractForm.party2}`, 'contract');
    } catch { toast.error('Failed to generate contract'); }
    setLoading(false);
  };

  const handleSaveContract = (content: string, type: string, subtype: string, party2: string) => {
    const contract: Contract = {
      id: generateId(), type: type === 'NDA' ? 'NDA' : 'Service Agreement',
      subtype, party1: settings.companyName, party2,
      title: `${subtype} - ${party2}`, content, tags: [type, subtype],
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addContract(contract);
    toast.success('Contract saved');
    setGenResult('');
  };

  const handleAnalyze = async () => {
    if (!clauseText.trim()) return;
    setLoading(true);
    try {
      const result = await callAIGeneric(`You are a senior corporate lawyer. Analyze this contract text and identify:
1. RISKY CLAUSES (highlight in red)
2. MISSING PROTECTIONS (highlight in yellow)
3. ONE-SIDED TERMS
4. LIABILITY EXPOSURE
5. IP OWNERSHIP ISSUES
6. TERMINATION CLAUSE ISSUES
7. RECOMMENDATIONS

Contract text:
${clauseText}

Provide clear, actionable analysis.`);
      setAnalysisResult(result);
    } catch { toast.error('Analysis failed'); }
    setLoading(false);
  };

  const filteredContracts = contracts.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.subtype.toLowerCase().includes(search.toLowerCase()));

  const inputCls = "bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm h-9";
  const labelCls = "text-white/60 text-xs font-medium";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">NDA & Contract Intelligence</h1>
        <p className="text-sm text-white/40">{contracts.length} contracts on record</p>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
        <TabsList className="bg-white/5 border border-white/10 h-auto p-1 w-full sm:w-auto">
          <TabsTrigger value="nda" className="text-xs">NDA Generator</TabsTrigger>
          <TabsTrigger value="contracts" className="text-xs">Contract Generator</TabsTrigger>
          <TabsTrigger value="analyze" className="text-xs">Clause Analyzer</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">Saved ({contracts.length})</TabsTrigger>
        </TabsList>

        {/* NDA Generator */}
        <TabsContent value="nda" className="space-y-4">
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Generate NDA</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label className={labelCls}>NDA Type</Label>
                <Select value={ndaType} onValueChange={setNdaType}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10">{NDA_TYPES.map(t => <SelectItem key={t} value={t} className="text-white/70">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className={labelCls}>Disclosing Party</Label><Input value={ndaForm.party1} onChange={e => setNdaForm({ ...ndaForm, party1: e.target.value })} className={inputCls} /></div>
                <div className="space-y-1.5"><Label className={labelCls}>Receiving Party *</Label><Input value={ndaForm.party2} onChange={e => setNdaForm({ ...ndaForm, party2: e.target.value })} className={inputCls} /></div>
                <div className="space-y-1.5"><Label className={labelCls}>Duration</Label><Input value={ndaForm.duration} onChange={e => setNdaForm({ ...ndaForm, duration: e.target.value })} className={inputCls} /></div>
                <div className="space-y-1.5"><Label className={labelCls}>Jurisdiction</Label><Input value={ndaForm.jurisdiction} onChange={e => setNdaForm({ ...ndaForm, jurisdiction: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="space-y-1.5"><Label className={labelCls}>Specific Restrictions</Label><Textarea value={ndaForm.restrictions} onChange={e => setNdaForm({ ...ndaForm, restrictions: e.target.value })} className={`${inputCls} min-h-[60px] resize-y`} placeholder="Any specific restrictions or clauses..." /></div>
              <Button onClick={handleGenerateNDA} disabled={loading || !ndaForm.party2} variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2 text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate NDA
              </Button>
            </CardContent>
          </Card>
          {genResult && (
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-white text-sm">Generated Document</CardTitle>
                <Button size="sm" variant="outline" onClick={() => handleSaveContract(genResult, 'NDA', ndaType, ndaForm.party2)} className="border-white/10 text-white/50 text-xs gap-1"><Plus className="w-3 h-3" /> Save</Button>
              </CardHeader>
              <CardContent><pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed max-h-[400px] overflow-y-auto">{genResult}</pre></CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Contract Generator */}
        <TabsContent value="contracts" className="space-y-4">
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardHeader><CardTitle className="text-white text-base">Generate Contract</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label className={labelCls}>Contract Type</Label>
                <Select value={contractType} onValueChange={setContractType}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10">{CONTRACT_TYPES.map(t => <SelectItem key={t} value={t} className="text-white/70">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className={labelCls}>Party A</Label><Input value={contractForm.party1} onChange={e => setContractForm({ ...contractForm, party1: e.target.value })} className={inputCls} /></div>
                <div className="space-y-1.5"><Label className={labelCls}>Party B *</Label><Input value={contractForm.party2} onChange={e => setContractForm({ ...contractForm, party2: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="space-y-1.5"><Label className={labelCls}>Key Terms</Label><Textarea value={contractForm.terms} onChange={e => setContractForm({ ...contractForm, terms: e.target.value })} className={`${inputCls} min-h-[60px] resize-y`} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className={labelCls}>Payment Terms</Label><Input value={contractForm.paymentTerms} onChange={e => setContractForm({ ...contractForm, paymentTerms: e.target.value })} className={inputCls} /></div>
                <div className="space-y-1.5"><Label className={labelCls}>Duration</Label><Input value={contractForm.duration} onChange={e => setContractForm({ ...contractForm, duration: e.target.value })} className={inputCls} /></div>
              </div>
              <Button onClick={handleGenerateContract} disabled={loading || !contractForm.party2} variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2 text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate Contract
              </Button>
            </CardContent>
          </Card>
          {genResult && (
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-white text-sm">Generated Document</CardTitle>
                <Button size="sm" variant="outline" onClick={() => handleSaveContract(genResult, 'Contract', contractType, contractForm.party2)} className="border-white/10 text-white/50 text-xs gap-1"><Plus className="w-3 h-3" /> Save</Button>
              </CardHeader>
              <CardContent><pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed max-h-[400px] overflow-y-auto">{genResult}</pre></CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Clause Analyzer */}
        <TabsContent value="analyze" className="space-y-4">
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-400" /> Clause Intelligence</CardTitle><CardDescription className="text-white/40">Paste contract text to analyze for risks, missing protections, and recommendations</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={clauseText} onChange={e => setClauseText(e.target.value)} placeholder="Paste contract text here..." className="bg-white/5 border-white/10 text-white placeholder:text-white/20 min-h-[150px] resize-y text-sm" />
              <Button onClick={handleAnalyze} disabled={loading || !clauseText.trim()} variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2 text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Analyze Clauses
              </Button>
            </CardContent>
          </Card>
          {analysisResult && (
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardHeader><CardTitle className="text-white text-sm">Analysis Results</CardTitle></CardHeader>
              <CardContent><pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed max-h-[500px] overflow-y-auto">{analysisResult}</pre></CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Saved Contracts */}
        <TabsContent value="history" className="space-y-4">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" /><Input placeholder="Search contracts..." value={search} onChange={e => setSearch(e.target.value)} className={`pl-9 ${inputCls}`} /></div>
          {filteredContracts.length === 0 ? (
            <Card className="bg-white/[0.02] border-white/[0.06]"><CardContent className="py-12 text-center"><FileText className="w-10 h-10 text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No saved contracts yet</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filteredContracts.map(c => (
                <Card key={c.id} className="bg-white/[0.02] border-white/[0.06]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 text-[10px]">{c.type}</Badge>
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-[10px]">{c.subtype}</Badge>
                        </div>
                        <h3 className="text-white font-medium text-sm">{c.title}</h3>
                        <p className="text-xs text-white/30 mt-1">{c.party1} ↔ {c.party2} · Created {formatDate(c.createdAt)}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => { deleteContract(c.id); toast.success('Deleted'); }} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
