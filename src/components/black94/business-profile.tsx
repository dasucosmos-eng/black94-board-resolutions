'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/black94-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateId, callAIGeneric } from '@/lib/black94-utils';
import type { BusinessProfile, Director, BankAccount, Shareholder, License, Product, KeyPersonnel } from '@/lib/black94-types';
import {
  Building2, Users, Landmark, PieChart, Award, Package, UserCircle, Plus, Trash2,
  Loader2, Sparkles, CheckCircle2, Upload, Download, Globe, Phone, Mail, MapPin
} from 'lucide-react';
import { toast } from 'sonner';

export function BusinessProfilePage() {
  const { settings, updateSettings, profile, updateProfile, addActivity } = useApp();
  const [activeSection, setActiveSection] = useState('company');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');

  const sections = [
    { id: 'company', label: 'Company Basics', icon: <Building2 className="w-4 h-4" /> },
    { id: 'address', label: 'Address & Contact', icon: <MapPin className="w-4 h-4" /> },
    { id: 'directors', label: 'Directors/Partners', icon: <Users className="w-4 h-4" /> },
    { id: 'banks', label: 'Bank Accounts', icon: <Landmark className="w-4 h-4" /> },
    { id: 'shareholders', label: 'Shareholders', icon: <PieChart className="w-4 h-4" /> },
    { id: 'licenses', label: 'Licenses', icon: <Award className="w-4 h-4" /> },
    { id: 'products', label: 'Products/Services', icon: <Package className="w-4 h-4" /> },
    { id: 'personnel', label: 'Key Personnel', icon: <UserCircle className="w-4 h-4" /> },
  ];

  // Profile completeness
  const completeness = useMemo(() => {
    let filled = 0;
    let total = 10;
    if (settings.companyName) filled++;
    if (settings.legalName) filled++;
    if (settings.gstin) filled++;
    if (settings.phone) filled++;
    if (settings.email) filled++;
    if (settings.address) filled++;
    if (profile.directors.length > 0) filled++;
    if (profile.bankAccounts.length > 0) filled++;
    if (profile.shareholders.length > 0) filled++;
    if (profile.products.length > 0) filled++;
    return Math.round((filled / total) * 100);
  }, [settings, profile]);

  const handleUpdateSettings = (updates: Record<string, string>) => {
    updateSettings({ ...settings, ...updates });
  };

  const handleAddDirector = () => {
    const d: Director = { id: generateId(), name: '', designation: '', din: '', pan: '', appointmentDate: '' };
    updateProfile({ ...profile, directors: [...profile.directors, d] });
  };
  const handleUpdateDirector = (id: string, updates: Partial<Director>) => {
    updateProfile({ ...profile, directors: profile.directors.map(d => d.id === id ? { ...d, ...updates } : d) });
  };
  const handleDeleteDirector = (id: string) => {
    updateProfile({ ...profile, directors: profile.directors.filter(d => d.id !== id) });
  };

  const handleAddBank = () => {
    const b: BankAccount = { id: generateId(), bankName: '', branch: '', accountNumber: '', ifsc: '', type: 'Current' };
    updateProfile({ ...profile, bankAccounts: [...profile.bankAccounts, b] });
  };
  const handleUpdateBank = (id: string, updates: Partial<BankAccount>) => {
    updateProfile({ ...profile, bankAccounts: profile.bankAccounts.map(b => b.id === id ? { ...b, ...updates } : b) });
  };
  const handleDeleteBank = (id: string) => {
    updateProfile({ ...profile, bankAccounts: profile.bankAccounts.filter(b => b.id !== id) });
  };

  const handleAddShareholder = () => {
    const s: Shareholder = { id: generateId(), name: '', sharesHeld: 0, percentage: 0, type: 'Founder' };
    updateProfile({ ...profile, shareholders: [...profile.shareholders, s] });
  };
  const handleUpdateShareholder = (id: string, updates: Partial<Shareholder>) => {
    updateProfile({ ...profile, shareholders: profile.shareholders.map(s => s.id === id ? { ...s, ...updates } : s) });
  };
  const handleDeleteShareholder = (id: string) => {
    updateProfile({ ...profile, shareholders: profile.shareholders.filter(s => s.id !== id) });
  };

  const handleAddLicense = () => {
    const l: License = { id: generateId(), type: '', number: '', expiryDate: '', issuingAuthority: '' };
    updateProfile({ ...profile, licenses: [...profile.licenses, l] });
  };
  const handleUpdateLicense = (id: string, updates: Partial<License>) => {
    updateProfile({ ...profile, licenses: profile.licenses.map(l => l.id === id ? { ...l, ...updates } : l) });
  };
  const handleDeleteLicense = (id: string) => {
    updateProfile({ ...profile, licenses: profile.licenses.filter(l => l.id !== id) });
  };

  const handleAddProduct = () => {
    const p: Product = { id: generateId(), name: '', category: '', description: '' };
    updateProfile({ ...profile, products: [...profile.products, p] });
  };
  const handleUpdateProduct = (id: string, updates: Partial<Product>) => {
    updateProfile({ ...profile, products: profile.products.map(p => p.id === id ? { ...p, ...updates } : p) });
  };
  const handleDeleteProduct = (id: string) => {
    updateProfile({ ...profile, products: profile.products.filter(p => p.id !== id) });
  };

  const handleAddPersonnel = () => {
    const p: KeyPersonnel = { id: generateId(), name: '', role: '', department: '', contact: '' };
    updateProfile({ ...profile, keyPersonnel: [...profile.keyPersonnel, p] });
  };
  const handleUpdatePersonnel = (id: string, updates: Partial<KeyPersonnel>) => {
    updateProfile({ ...profile, keyPersonnel: profile.keyPersonnel.map(p => p.id === id ? { ...p, ...updates } : p) });
  };
  const handleDeletePersonnel = (id: string) => {
    updateProfile({ ...profile, keyPersonnel: profile.keyPersonnel.filter(p => p.id !== id) });
  };

  const handleGenerateProfile = async () => {
    setAiLoading(true);
    try {
      const result = await callAIGeneric(`Generate a professional company profile document for ${settings.companyName} (${settings.legalName}), a ${settings.constitution} registered at ${settings.address}, GSTIN: ${settings.gstin}, ${settings.state}. Directors: ${profile.directors.map(d => d.name).join(', ') || 'N/A'}. Products: ${profile.products.map(p => p.name).join(', ') || 'N/A'}. Write a 300-word professional company profile.`);
      setAiResult(result);
      addActivity('Profile Generated', 'AI generated company profile document', 'profile');
    } catch { toast.error('Failed to generate profile'); }
    setAiLoading(false);
  };

  const saveAndNotify = () => {
    addActivity('Profile Updated', 'Business profile information updated', 'profile');
    toast.success('Profile saved successfully');
  };

  const inputCls = "bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm h-9";
  const labelCls = "text-white/60 text-xs font-medium";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Business Profile</h1>
          <p className="text-sm text-white/40">Complete company information hub</p>
        </div>
        <Button onClick={saveAndNotify} className="bg-white text-black hover:bg-white/90 font-semibold gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4" /> Save All
        </Button>
      </div>

      {/* Completeness */}
      <Card className="bg-white/[0.02] border-white/[0.06]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Profile Completeness</span>
            <span className="text-sm font-semibold text-white">{completeness}%</span>
          </div>
          <Progress value={completeness} className="h-2 bg-white/[0.06]" />
        </CardContent>
      </Card>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Section Nav */}
        <div className="lg:w-48 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeSection === s.id ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'}`}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeSection === 'company' && (
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardHeader><CardTitle className="text-white text-base">Company Basics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className={labelCls}>Trade Name</Label><Input value={settings.companyName} onChange={e => handleUpdateSettings({ companyName: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1.5"><Label className={labelCls}>Legal Name</Label><Input value={settings.legalName} onChange={e => handleUpdateSettings({ legalName: e.target.value })} className={inputCls} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className={labelCls}>Constitution</Label><Input value={settings.constitution} onChange={e => handleUpdateSettings({ constitution: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1.5"><Label className={labelCls}>CIN</Label><Input value={settings.cin} onChange={e => handleUpdateSettings({ cin: e.target.value })} placeholder="e.g., U12345AP2025PTC123456" className={inputCls} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className={labelCls}>GSTIN</Label><Input value={settings.gstin} onChange={e => handleUpdateSettings({ gstin: e.target.value })} className={`${inputCls} font-mono`} /></div>
                  <div className="space-y-1.5"><Label className={labelCls}>TAN</Label><Input value={settings.tan} onChange={e => handleUpdateSettings({ tan: e.target.value })} placeholder="Tax Deduction Account Number" className={inputCls} /></div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'address' && (
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardHeader><CardTitle className="text-white text-base">Address & Contact</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5"><Label className={labelCls}>Registered Address</Label><Textarea value={settings.address} onChange={e => handleUpdateSettings({ address: e.target.value })} className={`${inputCls} min-h-[60px] resize-y`} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5"><Label className={labelCls}>State</Label><Input value={settings.state} onChange={e => handleUpdateSettings({ state: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1.5"><Label className={labelCls}>District</Label><Input value={settings.district} onChange={e => handleUpdateSettings({ district: e.target.value })} className={inputCls} /></div>
                  <div className="space-y-1.5"><Label className={labelCls}>PIN Code</Label><Input value={settings.pinCode} onChange={e => handleUpdateSettings({ pinCode: e.target.value })} className={inputCls} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5"><Label className={labelCls}>Phone</Label><Input value={settings.phone} onChange={e => handleUpdateSettings({ phone: e.target.value })} placeholder="+91 XXXXX XXXXX" className={inputCls} /></div>
                  <div className="space-y-1.5"><Label className={labelCls}>Email</Label><Input value={settings.email} onChange={e => handleUpdateSettings({ email: e.target.value })} placeholder="company@email.com" className={inputCls} /></div>
                  <div className="space-y-1.5"><Label className={labelCls}>Website</Label><Input value={settings.website} onChange={e => handleUpdateSettings({ website: e.target.value })} placeholder="https://example.com" className={inputCls} /></div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'directors' && (
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-white text-base">Directors / Partners</CardTitle>
                <Button size="sm" variant="outline" onClick={handleAddDirector} className="border-white/10 text-white/50 hover:bg-white/[0.04] gap-1 text-xs"><Plus className="w-3 h-3" /> Add</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.directors.length === 0 && <p className="text-white/25 text-sm text-center py-4">No directors added yet</p>}
                {profile.directors.map((d, i) => (
                  <div key={d.id} className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04] space-y-3">
                    <div className="flex items-center justify-between"><span className="text-xs text-white/40 font-medium">Director #{i + 1}</span><Button size="sm" variant="ghost" onClick={() => handleDeleteDirector(d.id)} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"><Trash2 className="w-3 h-3" /></Button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className={labelCls}>Name</Label><Input value={d.name} onChange={e => handleUpdateDirector(d.id, { name: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>Designation</Label><Input value={d.designation} onChange={e => handleUpdateDirector(d.id, { designation: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>DIN</Label><Input value={d.din} onChange={e => handleUpdateDirector(d.id, { din: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>PAN</Label><Input value={d.pan} onChange={e => handleUpdateDirector(d.id, { pan: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>Appointment Date</Label><Input type="date" value={d.appointmentDate} onChange={e => handleUpdateDirector(d.id, { appointmentDate: e.target.value })} className={inputCls} /></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeSection === 'banks' && (
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-white text-base">Bank Accounts</CardTitle>
                <Button size="sm" variant="outline" onClick={handleAddBank} className="border-white/10 text-white/50 hover:bg-white/[0.04] gap-1 text-xs"><Plus className="w-3 h-3" /> Add</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.bankAccounts.length === 0 && <p className="text-white/25 text-sm text-center py-4">No bank accounts added yet</p>}
                {profile.bankAccounts.map((b) => (
                  <div key={b.id} className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04] space-y-3">
                    <div className="flex items-center justify-between"><Badge variant="secondary" className="bg-blue-500/10 text-blue-400 text-[10px]">{b.type}</Badge><Button size="sm" variant="ghost" onClick={() => handleDeleteBank(b.id)} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"><Trash2 className="w-3 h-3" /></Button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className={labelCls}>Bank Name</Label><Input value={b.bankName} onChange={e => handleUpdateBank(b.id, { bankName: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>Branch</Label><Input value={b.branch} onChange={e => handleUpdateBank(b.id, { branch: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>Account Number</Label><Input value={b.accountNumber} onChange={e => handleUpdateBank(b.id, { accountNumber: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>IFSC</Label><Input value={b.ifsc} onChange={e => handleUpdateBank(b.id, { ifsc: e.target.value })} className={`${inputCls} font-mono uppercase`} /></div>
                      <div className="space-y-1"><Label className={labelCls}>Type</Label>
                        <Select value={b.type} onValueChange={v => handleUpdateBank(b.id, { type: v as 'Current' | 'Savings' })}>
                          <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#111] border-white/10"><SelectItem value="Current" className="text-white/70">Current</SelectItem><SelectItem value="Savings" className="text-white/70">Savings</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeSection === 'shareholders' && (
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-white text-base">Shareholders</CardTitle>
                <Button size="sm" variant="outline" onClick={handleAddShareholder} className="border-white/10 text-white/50 hover:bg-white/[0.04] gap-1 text-xs"><Plus className="w-3 h-3" /> Add</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.shareholders.length === 0 && <p className="text-white/25 text-sm text-center py-4">No shareholders added yet</p>}
                {profile.shareholders.map((s) => (
                  <div key={s.id} className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04] space-y-3">
                    <div className="flex items-center justify-between"><Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-[10px]">{s.type}</Badge><Button size="sm" variant="ghost" onClick={() => handleDeleteShareholder(s.id)} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"><Trash2 className="w-3 h-3" /></Button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="space-y-1"><Label className={labelCls}>Name</Label><Input value={s.name} onChange={e => handleUpdateShareholder(s.id, { name: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>Shares Held</Label><Input type="number" value={s.sharesHeld} onChange={e => handleUpdateShareholder(s.id, { sharesHeld: parseInt(e.target.value) || 0 })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>Percentage</Label><Input type="number" step="0.01" value={s.percentage} onChange={e => handleUpdateShareholder(s.id, { percentage: parseFloat(e.target.value) || 0 })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>Type</Label>
                        <Select value={s.type} onValueChange={v => handleUpdateShareholder(s.id, { type: v as 'Founder' | 'Employee' | 'Investor' })}>
                          <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#111] border-white/10"><SelectItem value="Founder" className="text-white/70">Founder</SelectItem><SelectItem value="Employee" className="text-white/70">Employee</SelectItem><SelectItem value="Investor" className="text-white/70">Investor</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeSection === 'licenses' && (
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-white text-base">Licenses</CardTitle>
                <Button size="sm" variant="outline" onClick={handleAddLicense} className="border-white/10 text-white/50 hover:bg-white/[0.04] gap-1 text-xs"><Plus className="w-3 h-3" /> Add</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.licenses.length === 0 && <p className="text-white/25 text-sm text-center py-4">No licenses added yet</p>}
                {profile.licenses.map((l) => (
                  <div key={l.id} className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04] space-y-3">
                    <div className="flex items-center justify-between"><span className="text-xs text-white/40">{l.type || 'New License'}</span><Button size="sm" variant="ghost" onClick={() => handleDeleteLicense(l.id)} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"><Trash2 className="w-3 h-3" /></Button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className={labelCls}>License Type</Label><Input value={l.type} onChange={e => handleUpdateLicense(l.id, { type: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>Number</Label><Input value={l.number} onChange={e => handleUpdateLicense(l.id, { number: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>Expiry Date</Label><Input type="date" value={l.expiryDate} onChange={e => handleUpdateLicense(l.id, { expiryDate: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>Issuing Authority</Label><Input value={l.issuingAuthority} onChange={e => handleUpdateLicense(l.id, { issuingAuthority: e.target.value })} className={inputCls} /></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeSection === 'products' && (
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-white text-base">Products & Services</CardTitle>
                <Button size="sm" variant="outline" onClick={handleAddProduct} className="border-white/10 text-white/50 hover:bg-white/[0.04] gap-1 text-xs"><Plus className="w-3 h-3" /> Add</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.products.length === 0 && <p className="text-white/25 text-sm text-center py-4">No products/services added yet</p>}
                {profile.products.map((p) => (
                  <div key={p.id} className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04] space-y-3">
                    <div className="flex items-center justify-between"><span className="text-xs text-white/40">{p.name || 'New Product'}</span><Button size="sm" variant="ghost" onClick={() => handleDeleteProduct(p.id)} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"><Trash2 className="w-3 h-3" /></Button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className={labelCls}>Name</Label><Input value={p.name} onChange={e => handleUpdateProduct(p.id, { name: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>Category</Label><Input value={p.category} onChange={e => handleUpdateProduct(p.id, { category: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1 sm:col-span-2"><Label className={labelCls}>Description</Label><Textarea value={p.description} onChange={e => handleUpdateProduct(p.id, { description: e.target.value })} className={`${inputCls} min-h-[60px] resize-y`} /></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeSection === 'personnel' && (
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-white text-base">Key Personnel</CardTitle>
                <Button size="sm" variant="outline" onClick={handleAddPersonnel} className="border-white/10 text-white/50 hover:bg-white/[0.04] gap-1 text-xs"><Plus className="w-3 h-3" /> Add</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.keyPersonnel.length === 0 && <p className="text-white/25 text-sm text-center py-4">No personnel added yet</p>}
                {profile.keyPersonnel.map((p) => (
                  <div key={p.id} className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04] space-y-3">
                    <div className="flex items-center justify-between"><span className="text-xs text-white/40">{p.name || 'New Personnel'}</span><Button size="sm" variant="ghost" onClick={() => handleDeletePersonnel(p.id)} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"><Trash2 className="w-3 h-3" /></Button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className={labelCls}>Name</Label><Input value={p.name} onChange={e => handleUpdatePersonnel(p.id, { name: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>Role</Label><Input value={p.role} onChange={e => handleUpdatePersonnel(p.id, { role: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>Department</Label><Input value={p.department} onChange={e => handleUpdatePersonnel(p.id, { department: e.target.value })} className={inputCls} /></div>
                      <div className="space-y-1"><Label className={labelCls}>Contact</Label><Input value={p.contact} onChange={e => handleUpdatePersonnel(p.id, { contact: e.target.value })} className={inputCls} /></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* AI Generate */}
      <Card className="bg-gradient-to-br from-amber-500/[0.04] to-transparent border-amber-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-400" /> AI Company Profile Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiResult ? (
            <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
              <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{aiResult}</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(aiResult)} className="border-white/10 text-white/50 text-xs"><Download className="w-3 h-3 mr-1" /> Copy</Button>
                <Button size="sm" variant="ghost" onClick={() => setAiResult('')} className="text-white/30 text-xs">Dismiss</Button>
              </div>
            </div>
          ) : (
            <Button onClick={handleGenerateProfile} disabled={aiLoading} className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2 text-sm" variant="outline">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiLoading ? 'Generating...' : 'Generate Company Profile Document'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
