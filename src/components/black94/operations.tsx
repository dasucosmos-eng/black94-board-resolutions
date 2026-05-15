'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/black94-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateId, callAIGeneric, formatDate } from '@/lib/black94-utils';
import type { ApprovalRequest, Vendor, Client } from '@/lib/black94-types';
import { DollarSign, Plus, Trash2, Loader2, Sparkles, CheckCircle2, XCircle, Clock, Users, Building2, Search, PieChart, FileText } from 'lucide-react';
import { toast } from 'sonner';

// ===== FUNDRAISING =====
export function FundraisingPage() {
  const { settings, profile, callAIGeneric, addActivity, addTimelineEvent } = useApp();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [tab, setTab] = useState('prepare');
  const [form, setForm] = useState({ amount: '', type: 'Equity', timeline: '', revenue: '', costs: '', profit: '' });

  const handlePrepare = async () => {
    setLoading(true);
    try {
      const data = `Company: ${settings.companyName} (${settings.legalName}), ${settings.constitution}
Address: ${settings.address}
Directors: ${profile.directors.map(d => d.name).join(', ') || 'N/A'}
Products: ${profile.products.map(p => `${p.name} (${p.category})`).join(', ') || 'N/A'}
Revenue: ${form.revenue || 'N/A'}, Costs: ${form.costs || 'N/A'}, Profit: ${form.profit || 'N/A'}
Funding Required: ${form.amount || 'N/A'}, Type: ${form.type}, Timeline: ${form.timeline || 'N/A'}`;

      const r = await callAIGeneric(`You are a startup fundraising advisor. Based on this company data, generate an investor-ready summary including: 1) Company Overview 2) Business Model 3) Market Opportunity 4) Financial Summary 5) Funding Requirements 6) Use of Funds 7) Key Risks 8) Legal Documents Checklist 9) Compliance Gaps 10) Recommendations.\n\n${data}`);
      setResult(r);
      addActivity('Fundraise Prepared', `Prepared for ${form.type} funding of ₹${form.amount || 'TBD'}`, 'fundraising');
    } catch { toast.error('Failed'); }
    setLoading(false);
  };

  const handleCapTable = async () => {
    setLoading(true);
    try {
      const shareholders = profile.shareholders.map(s => `${s.name}: ${s.sharesHeld} shares (${s.percentage}%, ${s.type})`).join('\n');
      const r = await callAIGeneric(`Generate a cap table analysis for ${settings.companyName}:\n${shareholders || 'No shareholders data yet.'}\n\nInclude: Cap table visualization, dilution scenarios, and recommendations.`);
      setResult(r);
    } catch { toast.error('Failed'); }
    setLoading(false);
  };

  const inputCls = "bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm h-9";

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold text-white">Fundraising Automation</h1><p className="text-sm text-white/40">Prepare for investment & manage cap table</p></div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white/5 border border-white/10 h-auto p-1">
          <TabsTrigger value="prepare" className="text-xs">Investment Prep</TabsTrigger>
          <TabsTrigger value="captable" className="text-xs">Cap Table</TabsTrigger>
          <TabsTrigger value="checklist" className="text-xs">Data Room</TabsTrigger>
        </TabsList>

        <TabsContent value="prepare" className="space-y-4">
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardHeader><CardTitle className="text-white text-base">Prepare for Investment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-white/60 text-xs">Funding Amount (₹)</Label><Input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g., 5000000" className={inputCls} /></div>
                <div className="space-y-1.5"><Label className="text-white/60 text-xs">Funding Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#111] border-white/10"><SelectItem value="Equity">Equity</SelectItem><SelectItem value="Debt">Debt</SelectItem><SelectItem value="Convertible Note">Convertible Note</SelectItem><SelectItem value="SAFE">SAFE</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-white/60 text-xs">Timeline</Label><Input value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })} placeholder="e.g., Q4 2025" className={inputCls} /></div>
                <div className="space-y-1.5"><Label className="text-white/60 text-xs">Annual Revenue (₹)</Label><Input value={form.revenue} onChange={e => setForm({ ...form, revenue: e.target.value })} className={inputCls} /></div>
                <div className="space-y-1.5"><Label className="text-white/60 text-xs">Annual Costs (₹)</Label><Input value={form.costs} onChange={e => setForm({ ...form, costs: e.target.value })} className={inputCls} /></div>
                <div className="space-y-1.5"><Label className="text-white/60 text-xs">Annual Profit (₹)</Label><Input value={form.profit} onChange={e => setForm({ ...form, profit: e.target.value })} className={inputCls} /></div>
              </div>
              <Button onClick={handlePrepare} disabled={loading} variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2 text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate Investor Package
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="captable" className="space-y-4">
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2"><PieChart className="w-5 h-5 text-emerald-400" /> Cap Table</CardTitle>
              <Button onClick={handleCapTable} disabled={loading} variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1 text-xs">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Analyze
              </Button>
            </CardHeader>
            <CardContent>
              {profile.shareholders.length === 0 ? (
                <p className="text-white/25 text-sm text-center py-6">No shareholders in cap table. Add them in Business Profile.</p>
              ) : (
                <div className="space-y-2">
                  {profile.shareholders.map((s, i) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/30 w-6">{i + 1}.</span>
                        <div><p className="text-sm text-white font-medium">{s.name}</p><p className="text-[10px] text-white/30">{s.type} · {s.sharesHeld} shares</p></div>
                      </div>
                      <div className="text-right"><p className="text-sm font-semibold text-emerald-400">{s.percentage}%</p></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardHeader><CardTitle className="text-white text-base">Data Room Checklist</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {['Certificate of Incorporation', 'GST Registration', 'PAN Card', 'Board Resolutions', 'Financial Statements (3Y)', 'Tax Returns (3Y)', 'Bank Statements (12M)', 'All Contracts', 'Shareholder Agreement', 'Director KYC', 'License Certificates', 'IP Documents', 'Employee Records', 'Compliance Certificates', 'Cap Table'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-white/[0.02] rounded border border-white/[0.04] text-xs text-white/40">
                    <div className="w-4 h-4 rounded border border-white/10 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {result && <Card className="bg-gradient-to-br from-amber-500/[0.04] to-transparent border-amber-500/10"><CardContent className="p-4"><pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed max-h-[500px] overflow-y-auto">{result}</pre></CardContent></Card>}
    </div>
  );
}

// ===== APPROVALS =====
export function ApprovalsPage() {
  const { approvals, addApproval, updateApproval, deleteApproval, addActivity } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', amount: '', priority: 'Medium' as const, department: '', approver: '' });

  const pending = approvals.filter(a => a.status === 'Pending').length;
  const approved = approvals.filter(a => a.status === 'Approved').length;
  const rejected = approvals.filter(a => a.status === 'Rejected').length;

  const handleCreate = () => {
    if (!form.title) { toast.error('Title is required'); return; }
    const req: ApprovalRequest = {
      id: generateId(), title: form.title, description: form.description,
      amount: parseFloat(form.amount) || 0, priority: form.priority,
      department: form.department, requiredApprover: form.approver,
      status: 'Pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addApproval(req);
    addActivity('Approval Request', `"${form.title}" created`, 'approval');
    toast.success('Approval request created');
    setForm({ title: '', description: '', amount: '', priority: 'Medium', department: '', approver: '' });
    setShowForm(false);
  };

  const handleAction = (id: string, status: 'Approved' | 'Rejected') => {
    updateApproval({ ...approvals.find(a => a.id === id)!, status, updatedAt: new Date().toISOString() });
    addActivity(`Approval ${status}`, `Request ${status.toLowerCase()}`, 'approval');
    toast.success(`Request ${status.toLowerCase()}`);
  };

  const inputCls = "bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm h-9";
  const priorityColor = (p: string) => p === 'Urgent' ? 'bg-red-500/10 text-red-400' : p === 'High' ? 'bg-amber-500/10 text-amber-400' : p === 'Medium' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/10 text-white/40';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold text-white">Smart Approvals</h1><p className="text-sm text-white/40">{pending} pending · {approved} approved · {rejected} rejected</p></div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-white text-black hover:bg-white/90 font-semibold gap-2 text-sm"><Plus className="w-4 h-4" /> New Request</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-amber-500/[0.04] border-amber-500/10"><CardContent className="p-4 text-center"><Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" /><p className="text-xl font-bold">{pending}</p><p className="text-xs text-white/40">Pending</p></CardContent></Card>
        <Card className="bg-emerald-500/[0.04] border-emerald-500/10"><CardContent className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" /><p className="text-xl font-bold">{approved}</p><p className="text-xs text-white/40">Approved</p></CardContent></Card>
        <Card className="bg-red-500/[0.04] border-red-500/10"><CardContent className="p-4 text-center"><XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" /><p className="text-xl font-bold">{rejected}</p><p className="text-xs text-white/40">Rejected</p></CardContent></Card>
      </div>

      {showForm && (
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader><CardTitle className="text-white text-base">New Approval Request</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2"><Label className="text-white/60 text-xs">Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1.5"><Label className="text-white/60 text-xs">Amount (₹)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1.5"><Label className="text-white/60 text-xs">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v as 'Low' | 'Medium' | 'High' | 'Urgent' })}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10"><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Urgent">Urgent</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-white/60 text-xs">Department</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1.5"><Label className="text-white/60 text-xs">Required Approver</Label><Input value={form.approver} onChange={e => setForm({ ...form, approver: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label className="text-white/60 text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputCls} min-h-[60px] resize-y`} /></div>
            </div>
            <Button onClick={handleCreate} className="bg-white text-black hover:bg-white/90 font-semibold gap-2 text-sm"><Plus className="w-4 h-4" /> Create Request</Button>
          </CardContent>
        </Card>
      )}

      {approvals.length === 0 ? (
        <Card className="bg-white/[0.02] border-white/[0.06]"><CardContent className="py-12 text-center"><CheckCircle2 className="w-10 h-10 text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No approval requests yet</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {approvals.map(a => (
            <Card key={a.id} className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="secondary" className={`text-[10px] ${priorityColor(a.priority)}`}>{a.priority}</Badge>
                      <Badge variant="secondary" className={`text-[10px] ${a.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' : a.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : a.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-white/10 text-white/40'}`}>{a.status}</Badge>
                      {a.department && <span className="text-[10px] text-white/30">{a.department}</span>}
                    </div>
                    <h3 className="text-white font-medium text-sm">{a.title}</h3>
                    {a.description && <p className="text-xs text-white/40 mt-0.5">{a.description}</p>}
                    {a.amount > 0 && <p className="text-xs text-emerald-400 mt-1">₹{a.amount.toLocaleString('en-IN')}</p>}
                    <p className="text-[10px] text-white/20 mt-1">{formatDate(a.createdAt)}</p>
                  </div>
                  {a.status === 'Pending' && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => handleAction(a.id, 'Approved')} className="text-emerald-400 hover:bg-emerald-500/10 h-8 px-3 text-xs">Approve</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleAction(a.id, 'Rejected')} className="text-red-400 hover:bg-red-500/10 h-8 px-3 text-xs">Reject</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== VENDORS & CLIENTS =====
export function VendorsPage() {
  const { vendors, addVendor, updateVendor, deleteVendor, clients, addClient, updateClient, deleteClient, callAIGeneric, addActivity } = useApp();
  const [tab, setTab] = useState<'vendors' | 'clients'>('vendors');
  const [showVForm, setShowVForm] = useState(false);
  const [showCForm, setShowCForm] = useState(false);
  const [vForm, setVForm] = useState({ name: '', category: '', contactPerson: '', phone: '', email: '', contractDetails: '', startDate: '', endDate: '', paymentTerms: '', creditLimit: '' });
  const [cForm, setCForm] = useState({ name: '', industry: '', contactPerson: '', phone: '', email: '', contractValue: '', startDate: '', endDate: '', paymentStatus: 'Pending' as const, outstandingAmount: '' });

  const handleAddVendor = () => {
    if (!vForm.name) { toast.error('Name required'); return; }
    const v: Vendor = { id: generateId(), ...vForm, creditLimit: parseFloat(vForm.creditLimit) || 0, status: 'Active' };
    addVendor(v); addActivity('Vendor Added', vForm.name, 'vendor');
    toast.success('Vendor added'); setShowVForm(false);
    setVForm({ name: '', category: '', contactPerson: '', phone: '', email: '', contractDetails: '', startDate: '', endDate: '', paymentTerms: '', creditLimit: '' });
  };
  const handleAddClient = () => {
    if (!cForm.name) { toast.error('Name required'); return; }
    const c: Client = { id: generateId(), ...cForm, contractValue: parseFloat(cForm.contractValue) || 0, outstandingAmount: parseFloat(cForm.outstandingAmount) || 0 };
    addClient(c); addActivity('Client Added', cForm.name, 'vendor');
    toast.success('Client added'); setShowCForm(false);
    setCForm({ name: '', industry: '', contactPerson: '', phone: '', email: '', contractValue: '', startDate: '', endDate: '', paymentStatus: 'Pending', outstandingAmount: '' });
  };

  const inputCls = "bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm h-9";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold text-white">Vendors & Clients</h1><p className="text-sm text-white/40">{vendors.length} vendors · {clients.length} clients</p></div>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as 'vendors' | 'clients')}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="vendors" className="text-xs gap-1"><Building2 className="w-3 h-3" /> Vendors ({vendors.length})</TabsTrigger>
          <TabsTrigger value="clients" className="text-xs gap-1"><Users className="w-3 h-3" /> Clients ({clients.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="space-y-4">
          <Button onClick={() => setShowVForm(!showVForm)} className="bg-white text-black hover:bg-white/90 font-semibold gap-2 text-sm"><Plus className="w-4 h-4" /> Add Vendor</Button>
          {showVForm && (
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1"><Label className="text-white/60 text-xs">Name *</Label><Input value={vForm.name} onChange={e => setVForm({ ...vForm, name: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1"><Label className="text-white/60 text-xs">Category</Label><Input value={vForm.category} onChange={e => setVForm({ ...vForm, category: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1"><Label className="text-white/60 text-xs">Contact Person</Label><Input value={vForm.contactPerson} onChange={e => setVForm({ ...vForm, contactPerson: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1"><Label className="text-white/60 text-xs">Phone</Label><Input value={vForm.phone} onChange={e => setVForm({ ...vForm, phone: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1"><Label className="text-white/60 text-xs">Email</Label><Input value={vForm.email} onChange={e => setVForm({ ...vForm, email: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1"><Label className="text-white/60 text-xs">Payment Terms</Label><Input value={vForm.paymentTerms} onChange={e => setVForm({ ...vForm, paymentTerms: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1"><Label className="text-white/60 text-xs">Start Date</Label><Input type="date" value={vForm.startDate} onChange={e => setVForm({ ...vForm, startDate: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1"><Label className="text-white/60 text-xs">End Date</Label><Input type="date" value={vForm.endDate} onChange={e => setVForm({ ...vForm, endDate: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1"><Label className="text-white/60 text-xs">Credit Limit (₹)</Label><Input type="number" value={vForm.creditLimit} onChange={e => setVForm({ ...vForm, creditLimit: e.target.value })} className={inputCls} /></div>
                </div>
                <div className="flex gap-2"><Button onClick={handleAddVendor} className="bg-white text-black hover:bg-white/90 font-semibold gap-2 text-sm">Save</Button><Button onClick={() => setShowVForm(false)} variant="ghost" className="text-white/40 text-sm">Cancel</Button></div>
              </CardContent>
            </Card>
          )}
          {vendors.length === 0 ? (
            <Card className="bg-white/[0.02] border-white/[0.06]"><CardContent className="py-12 text-center"><Building2 className="w-10 h-10 text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No vendors yet</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {vendors.map(v => (
                <Card key={v.id} className="bg-white/[0.02] border-white/[0.06]">
                  <CardContent className="p-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1"><h3 className="text-white font-medium text-sm">{v.name}</h3><Badge variant="secondary" className={`text-[10px] ${v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{v.status}</Badge></div>
                      {v.category && <p className="text-xs text-white/30">{v.category}</p>}
                      {v.contactPerson && <p className="text-xs text-white/30">{v.contactPerson} · {v.phone}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => { deleteVendor(v.id); toast.success('Deleted'); }} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"><Trash2 className="w-3 h-3" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Button onClick={() => setShowCForm(!showCForm)} className="bg-white text-black hover:bg-white/90 font-semibold gap-2 text-sm"><Plus className="w-4 h-4" /> Add Client</Button>
          {showCForm && (
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1"><Label className="text-white/60 text-xs">Name *</Label><Input value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1"><Label className="text-white/60 text-xs">Industry</Label><Input value={cForm.industry} onChange={e => setCForm({ ...cForm, industry: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1"><Label className="text-white/60 text-xs">Contact Person</Label><Input value={cForm.contactPerson} onChange={e => setCForm({ ...cForm, contactPerson: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1"><Label className="text-white/60 text-xs">Contract Value (₹)</Label><Input type="number" value={cForm.contractValue} onChange={e => setCForm({ ...cForm, contractValue: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1"><Label className="text-white/60 text-xs">Start Date</Label><Input type="date" value={cForm.startDate} onChange={e => setCForm({ ...cForm, startDate: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1"><Label className="text-white/60 text-xs">End Date</Label><Input type="date" value={cForm.endDate} onChange={e => setCForm({ ...cForm, endDate: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1"><Label className="text-white/60 text-xs">Outstanding (₹)</Label><Input type="number" value={cForm.outstandingAmount} onChange={e => setCForm({ ...cForm, outstandingAmount: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1"><Label className="text-white/60 text-xs">Payment Status</Label>
                    <Select value={cForm.paymentStatus} onValueChange={v => setCForm({ ...cForm, paymentStatus: v as 'Paid' | 'Pending' | 'Overdue' })}>
                      <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#111] border-white/10"><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Overdue">Overdue</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2"><Button onClick={handleAddClient} className="bg-white text-black hover:bg-white/90 font-semibold gap-2 text-sm">Save</Button><Button onClick={() => setShowCForm(false)} variant="ghost" className="text-white/40 text-sm">Cancel</Button></div>
              </CardContent>
            </Card>
          )}
          {clients.length === 0 ? (
            <Card className="bg-white/[0.02] border-white/[0.06]"><CardContent className="py-12 text-center"><Users className="w-10 h-10 text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No clients yet</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {clients.map(c => (
                <Card key={c.id} className="bg-white/[0.02] border-white/[0.06]">
                  <CardContent className="p-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1"><h3 className="text-white font-medium text-sm">{c.name}</h3><Badge variant="secondary" className={`text-[10px] ${c.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : c.paymentStatus === 'Overdue' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>{c.paymentStatus}</Badge></div>
                      {c.industry && <p className="text-xs text-white/30">{c.industry}</p>}
                      {c.contractValue > 0 && <p className="text-xs text-emerald-400">₹{c.contractValue.toLocaleString('en-IN')}</p>}
                      {c.outstandingAmount > 0 && <p className="text-xs text-red-400">Outstanding: ₹{c.outstandingAmount.toLocaleString('en-IN')}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => { deleteClient(c.id); toast.success('Deleted'); }} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"><Trash2 className="w-3 h-3" /></Button>
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
