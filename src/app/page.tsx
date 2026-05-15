'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText, Upload, Stamp, PenTool, Settings, Plus, Trash2, Download, Eye, Copy, CheckCircle2, Building2, Calendar, MapPin, User, AlertCircle, Loader2, ExternalLink, FileDown
} from 'lucide-react';
import { toast } from 'sonner';

interface CompanySettings {
  id: string;
  companyName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  cin: string | null;
  stampData: string | null;
  signatureData: string | null;
  authorityName: string | null;
  authorityTitle: string | null;
}

interface BoardResolution {
  id: string;
  resolutionNumber: string;
  title: string;
  date: string;
  venue: string | null;
  preamble: string | null;
  resolvedText: string;
  resolvedBy: string | null;
  secondedBy: string | null;
  authorityName: string | null;
  authorityTitle: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function BoardResolutionApp() {
  // State
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [resolutions, setResolutions] = useState<BoardResolution[]>([]);
  const [activeTab, setActiveTab] = useState('create');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Form state
  const [form, setForm] = useState({
    resolutionNumber: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    venue: '',
    preamble: '',
    resolvedText: '',
    resolvedBy: '',
    secondedBy: '',
    authorityName: '',
    authorityTitle: '',
  });

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    companyName: 'Black94',
    address: '',
    phone: '',
    email: '',
    cin: '',
    authorityName: '',
    authorityTitle: '',
  });

  // Upload states
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<'signature' | 'stamp' | null>(null);

  const signatureInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsRes, resolutionsRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/resolutions'),
      ]);
      const settingsData = await settingsRes.json();
      const resolutionsData = await resolutionsRes.json();

      setSettings(settingsData);
      setResolutions(resolutionsData);
      setSignaturePreview(settingsData.signatureData);
      setStampPreview(settingsData.stampData);
      setSettingsForm({
        companyName: settingsData.companyName || 'Black94',
        address: settingsData.address || '',
        phone: settingsData.phone || '',
        email: settingsData.email || '',
        cin: settingsData.cin || '',
        authorityName: settingsData.authorityName || '',
        authorityTitle: settingsData.authorityTitle || '',
      });
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Handle signature upload
  const handleSignatureUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/upload-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signatureData: base64 }),
        });
        if (res.ok) {
          setSignaturePreview(base64);
          toast.success('Signature saved successfully');
        }
      } catch {
        toast.error('Failed to save signature');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle stamp upload
  const handleStampUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/upload-stamp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stampData: base64 }),
        });
        if (res.ok) {
          setStampPreview(base64);
          toast.success('Stamp saved successfully');
        }
      } catch {
        toast.error('Failed to save stamp');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save settings
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        toast.success('Settings saved successfully');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Create resolution
  const handleCreateResolution = async () => {
    if (!form.title || !form.resolvedText || !form.resolutionNumber) {
      toast.error('Please fill in the required fields (Resolution Number, Title, and Resolved Text)');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/resolutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          authorityName: form.authorityName || settingsForm.authorityName || '',
          authorityTitle: form.authorityTitle || settingsForm.authorityTitle || '',
          status: 'final',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResolutions((prev) => [data, ...prev]);
        toast.success('Board Resolution created successfully');
        setForm({
          resolutionNumber: '',
          title: '',
          date: new Date().toISOString().split('T')[0],
          venue: '',
          preamble: '',
          resolvedText: '',
          resolvedBy: '',
          secondedBy: '',
          authorityName: '',
          authorityTitle: '',
        });
        setActiveTab('history');
      }
    } catch {
      toast.error('Failed to create resolution');
    } finally {
      setSaving(false);
    }
  };

  // Delete resolution
  const handleDeleteResolution = async (id: string) => {
    try {
      const res = await fetch(`/api/resolutions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setResolutions((prev) => prev.filter((r) => r.id !== id));
        toast.success('Resolution deleted');
      }
    } catch {
      toast.error('Failed to delete resolution');
    }
  };

  // Generate next resolution number
  const getNextResolutionNumber = useCallback(() => {
    if (resolutions.length === 0) return 'BLK94/2025-26/001';
    const last = resolutions[0];
    const match = last.resolutionNumber.match(/(\d+)$/);
    if (match) {
      const nextNum = parseInt(match[1]) + 1;
      return last.resolutionNumber.replace(/\d+$/, nextNum.toString().padStart(3, '0'));
    }
    return 'BLK94/2025-26/001';
  }, [resolutions]);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, type: 'signature' | 'stamp') => {
    e.preventDefault();
    setDragOver(type);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, type: 'signature' | 'stamp') => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (type === 'signature') handleSignatureUpload(file);
      else handleStampUpload(file);
    }
  };

  // PDF Generation
  const generatePDF = async (resolution?: BoardResolution) => {
    if (!previewRef.current) return;
    setGeneratingPdf(true);

    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;

      pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
      const fileName = resolution
        ? `Board_Resolution_${resolution.resolutionNumber}.pdf`
        : 'Board_Resolution.pdf';
      pdf.save(fileName);
      toast.success('PDF generated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
            <FileText className="w-8 h-8 text-white/60 animate-pulse" />
          </div>
          <p className="text-white/40 text-sm font-medium">Loading Board Resolution System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/15 to-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                <img src="/black94-logo.png" alt="Black94" className="w-8 h-8 object-contain rounded" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">Black94</h1>
                <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">Board Resolution System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {signaturePreview && stampPreview && (
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1.5 px-3">
                  <CheckCircle2 className="w-3 h-3" />
                  Ready
                </Badge>
              )}
              <Badge variant="secondary" className="bg-white/5 text-white/50 border-white/10 px-3">
                {resolutions.length} Resolution{resolutions.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white/5 border border-white/10 h-auto p-1">
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/50 px-4 py-2 text-sm font-medium gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/50 px-4 py-2 text-sm font-medium gap-2 transition-all"
            >
              <FileText className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/50 px-4 py-2 text-sm font-medium gap-2 transition-all"
            >
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* CREATE TAB */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-white/60" />
                      Resolution Details
                    </CardTitle>
                    <CardDescription className="text-white/40">
                      Fill in the details for the new board resolution
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white/70 text-sm font-medium">Resolution Number *</Label>
                        <Input
                          placeholder="BLK94/2025-26/001"
                          value={form.resolutionNumber}
                          onChange={(e) => setForm({ ...form, resolutionNumber: e.target.value })}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/70 text-sm font-medium flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Date *
                        </Label>
                        <Input
                          type="date"
                          value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10 [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Title *</Label>
                      <Input
                        placeholder="e.g., Approval of Annual Budget for FY 2025-26"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white/70 text-sm font-medium flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> Venue
                        </Label>
                        <Input
                          placeholder="e.g., Registered Office, Mumbai"
                          value={form.venue}
                          onChange={(e) => setForm({ ...form, venue: e.target.value })}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/70 text-sm font-medium">CIN</Label>
                        <Input
                          placeholder="Company Identification Number"
                          value={settingsForm.cin}
                          readOnly
                          className="bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Preamble / Background</Label>
                      <Textarea
                        placeholder="Provide context or background for this resolution..."
                        value={form.preamble}
                        onChange={(e) => setForm({ ...form, preamble: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10 min-h-[80px] resize-y"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">
                        &quot;RESOLVED THAT&quot; Text *
                      </Label>
                      <Textarea
                        placeholder='e.g., the Board of Directors hereby approves the annual budget of INR 50,00,00,000 (Fifty Crores) for the financial year 2025-2026...'
                        value={form.resolvedText}
                        onChange={(e) => setForm({ ...form, resolvedText: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10 min-h-[120px] resize-y"
                      />
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white/70 text-sm font-medium flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Proposed By
                        </Label>
                        <Input
                          placeholder="Director Name"
                          value={form.resolvedBy}
                          onChange={(e) => setForm({ ...form, resolvedBy: e.target.value })}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/70 text-sm font-medium">Seconded By</Label>
                        <Input
                          placeholder="Director Name"
                          value={form.secondedBy}
                          onChange={(e) => setForm({ ...form, secondedBy: e.target.value })}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white/70 text-sm font-medium">Authorized Signatory Name</Label>
                        <Input
                          placeholder={settingsForm.authorityName || 'Enter name'}
                          value={form.authorityName}
                          onChange={(e) => setForm({ ...form, authorityName: e.target.value })}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/70 text-sm font-medium">Designation</Label>
                        <Input
                          placeholder={settingsForm.authorityTitle || 'e.g., Managing Director'}
                          value={form.authorityTitle}
                          onChange={(e) => setForm({ ...form, authorityTitle: e.target.value })}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={handleCreateResolution}
                        disabled={saving || !form.title || !form.resolvedText || !form.resolutionNumber}
                        className="bg-white text-black hover:bg-white/90 font-semibold px-6"
                      >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Create Resolution
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setForm({
                            resolutionNumber: getNextResolutionNumber(),
                            title: '',
                            date: new Date().toISOString().split('T')[0],
                            venue: '',
                            preamble: '',
                            resolvedText: '',
                            resolvedBy: '',
                            secondedBy: '',
                            authorityName: settingsForm.authorityName || '',
                            authorityTitle: settingsForm.authorityTitle || '',
                          });
                        }}
                        className="border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
                      >
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Upload Status */}
                <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-white/60" />
                      Signature & Stamp
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50 font-medium uppercase tracking-wider">Signature</span>
                        {signaturePreview && (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0">
                            Saved
                          </Badge>
                        )}
                      </div>
                      {signaturePreview ? (
                        <div className="relative group rounded-lg overflow-hidden border border-white/10 bg-white p-2">
                          <img src={signaturePreview} alt="Signature" className="w-full h-20 object-contain" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => signatureInputRef.current?.click()}
                              className="text-xs"
                            >
                              Change
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                            dragOver === 'signature' ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/20'
                          }`}
                          onClick={() => signatureInputRef.current?.click()}
                          onDragOver={(e) => handleDragOver(e, 'signature')}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'signature')}
                        >
                          <Upload className="w-6 h-6 text-white/30 mx-auto mb-1" />
                          <p className="text-xs text-white/30">Click or drag to upload</p>
                        </div>
                      )}
                      <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSignatureUpload(file);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50 font-medium uppercase tracking-wider">Company Stamp</span>
                        {stampPreview && (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0">
                            Saved
                          </Badge>
                        )}
                      </div>
                      {stampPreview ? (
                        <div className="relative group rounded-lg overflow-hidden border border-white/10 bg-white p-2">
                          <img src={stampPreview} alt="Stamp" className="w-full h-20 object-contain" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => stampInputRef.current?.click()}
                              className="text-xs"
                            >
                              Change
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                            dragOver === 'stamp' ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/20'
                          }`}
                          onClick={() => stampInputRef.current?.click()}
                          onDragOver={(e) => handleDragOver(e, 'stamp')}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'stamp')}
                        >
                          <Stamp className="w-6 h-6 text-white/30 mx-auto mb-1" />
                          <p className="text-xs text-white/30">Click or drag to upload</p>
                        </div>
                      )}
                      <input
                        ref={stampInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleStampUpload(file);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Info */}
                <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-white/60" />
                      Company Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src="/black94-logo.png" alt="Black94" className="w-6 h-6 rounded object-contain" />
                      <span className="text-sm font-semibold text-white">{settingsForm.companyName}</span>
                    </div>
                    {settingsForm.cin && (
                      <p className="text-xs text-white/40">CIN: {settingsForm.cin}</p>
                    )}
                    {settingsForm.address && (
                      <p className="text-xs text-white/40">{settingsForm.address}</p>
                    )}
                    <p className="text-[10px] text-white/25 pt-1">
                      Upload your signature and stamp in Settings to auto-apply on all resolutions.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Resolution History</h2>
                <p className="text-sm text-white/40 mt-1">
                  {resolutions.length} resolution{resolutions.length !== 1 ? 's' : ''} on record
                </p>
              </div>
              <Button
                onClick={() => setActiveTab('create')}
                className="bg-white text-black hover:bg-white/90 font-semibold gap-2"
              >
                <Plus className="w-4 h-4" />
                New Resolution
              </Button>
            </div>

            {resolutions.length === 0 ? (
              <Card className="bg-white/[0.03] border-white/10">
                <CardContent className="py-16 text-center">
                  <FileText className="w-12 h-12 text-white/15 mx-auto mb-4" />
                  <p className="text-white/40 text-lg font-medium">No resolutions yet</p>
                  <p className="text-white/25 text-sm mt-1">Create your first board resolution to get started</p>
                  <Button
                    onClick={() => setActiveTab('create')}
                    variant="outline"
                    className="mt-6 border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
                  >
                    Create First Resolution
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-3">
                  {resolutions.map((res) => (
                    <Card
                      key={res.id}
                      className="bg-white/[0.03] border-white/10 hover:bg-white/[0.05] transition-colors group"
                    >
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="secondary" className="bg-white/10 text-white/70 text-[10px] font-mono shrink-0">
                                {res.resolutionNumber}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] px-2 py-0 ${
                                  res.status === 'final'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}
                              >
                                {res.status === 'final' ? 'Final' : 'Draft'}
                              </Badge>
                            </div>
                            <h3 className="text-white font-semibold text-sm sm:text-base truncate">{res.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(res.date)}
                              </span>
                              {res.venue && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {res.venue}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-white/40 hover:text-white hover:bg-white/10"
                                  onClick={() => {
                                    setForm({
                                      resolutionNumber: res.resolutionNumber,
                                      title: res.title,
                                      date: res.date,
                                      venue: res.venue || '',
                                      preamble: res.preamble || '',
                                      resolvedText: res.resolvedText,
                                      resolvedBy: res.resolvedBy || '',
                                      secondedBy: res.secondedBy || '',
                                      authorityName: res.authorityName || '',
                                      authorityTitle: res.authorityTitle || '',
                                    });
                                    setPreviewOpen(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                  <span className="hidden sm:inline ml-1">Preview</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#111] border-white/10">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Preview Resolution</DialogTitle>
                                  <DialogDescription className="text-white/40">
                                    {res.resolutionNumber} - {res.title}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="mt-4">
                                  <ResolutionPreview
                                    ref={previewRef}
                                    form={form}
                                    settings={settings}
                                    signaturePreview={signaturePreview}
                                    stampPreview={stampPreview}
                                    settingsForm={settingsForm}
                                  />
                                  <div className="flex justify-end mt-4 gap-2">
                                    <Button
                                      onClick={() => generatePDF(res)}
                                      disabled={generatingPdf}
                                      className="bg-white text-black hover:bg-white/90 font-semibold gap-2"
                                    >
                                      {generatingPdf ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <FileDown className="w-4 h-4" />
                                      )}
                                      Download PDF
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDeleteResolution(res.id)}
                            >
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
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Details */}
              <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-white/60" />
                    Company Details
                  </CardTitle>
                  <CardDescription className="text-white/40">
                    Manage your company information that appears on all resolutions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm font-medium">Company Name</Label>
                    <Input
                      value={settingsForm.companyName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm font-medium">CIN (Corporate Identity Number)</Label>
                    <Input
                      value={settingsForm.cin}
                      onChange={(e) => setSettingsForm({ ...settingsForm, cin: e.target.value })}
                      placeholder="e.g., U74999MH2020PTC345678"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm font-medium">Registered Address</Label>
                    <Textarea
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                      placeholder="Full registered address"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10 min-h-[60px] resize-y"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Phone</Label>
                      <Input
                        value={settingsForm.phone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                        placeholder="+91 XXXXX XXXXX"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Email</Label>
                      <Input
                        value={settingsForm.email}
                        onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                        placeholder="company@email.com"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Default Signatory Name</Label>
                      <Input
                        value={settingsForm.authorityName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, authorityName: e.target.value })}
                        placeholder="Authorized person name"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Default Designation</Label>
                      <Input
                        value={settingsForm.authorityTitle}
                        onChange={(e) => setSettingsForm({ ...settingsForm, authorityTitle: e.target.value })}
                        placeholder="e.g., Managing Director"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="bg-white text-black hover:bg-white/90 font-semibold w-full mt-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Save Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Signature & Stamp Upload */}
              <div className="space-y-6">
                <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <PenTool className="w-5 h-5 text-white/60" />
                      Upload Signature
                    </CardTitle>
                    <CardDescription className="text-white/40">
                      Upload your authorized signature. It will be applied to all board resolutions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {signaturePreview ? (
                      <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-white p-4">
                        <img src={signaturePreview} alt="Signature" className="w-full h-32 object-contain" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => signatureInputRef.current?.click()}
                          >
                            Change
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              await fetch('/api/upload-signature', { method: 'DELETE' });
                              setSignaturePreview(null);
                              toast.success('Signature removed');
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                          dragOver === 'signature' ? 'border-white/40 bg-white/5 scale-[1.02]' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                        }`}
                        onClick={() => signatureInputRef.current?.click()}
                        onDragOver={(e) => handleDragOver(e, 'signature')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'signature')}
                      >
                        <PenTool className="w-10 h-10 text-white/20 mx-auto mb-3" />
                        <p className="text-sm text-white/40 font-medium">Drop your signature image here</p>
                        <p className="text-xs text-white/25 mt-1">PNG, JPG, WEBP up to 5MB</p>
                      </div>
                    )}
                    <p className="text-[11px] text-white/25 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Recommended: Transparent PNG with white background for best results
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Stamp className="w-5 h-5 text-white/60" />
                      Upload Company Stamp
                    </CardTitle>
                    <CardDescription className="text-white/40">
                      Upload your traditional company stamp. It will be applied to all board resolutions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stampPreview ? (
                      <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-white p-4">
                        <img src={stampPreview} alt="Stamp" className="w-full h-32 object-contain" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => stampInputRef.current?.click()}
                          >
                            Change
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              await fetch('/api/upload-stamp', { method: 'DELETE' });
                              setStampPreview(null);
                              toast.success('Stamp removed');
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                          dragOver === 'stamp' ? 'border-white/40 bg-white/5 scale-[1.02]' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                        }`}
                        onClick={() => stampInputRef.current?.click()}
                        onDragOver={(e) => handleDragOver(e, 'stamp')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'stamp')}
                      >
                        <Stamp className="w-10 h-10 text-white/20 mx-auto mb-3" />
                        <p className="text-sm text-white/40 font-medium">Drop your company stamp image here</p>
                        <p className="text-xs text-white/25 mt-1">PNG, JPG, WEBP up to 5MB</p>
                      </div>
                    )}
                    <p className="text-[11px] text-white/25 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Recommended: Transparent PNG for authentic stamp appearance
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/black94-logo.png" alt="Black94" className="w-5 h-5 rounded object-contain" />
              <span className="text-xs text-white/30">
                &copy; {new Date().getFullYear()} {settingsForm.companyName || 'Black94'}. All rights reserved.
              </span>
            </div>
            <p className="text-[10px] text-white/20">
              Board Resolution System &middot; Confidential Document Generator
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Resolution Preview Component
const ResolutionPreview = React.forwardRef<HTMLDivElement, {
  form: {
    resolutionNumber: string;
    title: string;
    date: string;
    venue: string;
    preamble: string;
    resolvedText: string;
    resolvedBy: string;
    secondedBy: string;
    authorityName: string;
    authorityTitle: string;
  };
  settings: CompanySettings | null;
  signaturePreview: string | null;
  stampPreview: string | null;
  settingsForm: {
    companyName: string;
    address: string;
    phone: string;
    email: string;
    cin: string;
    authorityName: string;
    authorityTitle: string;
  };
}>(({ form, settings, signaturePreview, stampPreview, settingsForm }, ref) => {
  const companyName = settingsForm.companyName || 'Black94';
  const cin = settingsForm.cin || '';
  const address = settingsForm.address || '';

  const formattedDate = form.date
    ? new Date(form.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div
      ref={ref}
      className="bg-white text-black p-12 sm:p-16 max-w-[210mm] mx-auto font-serif"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <img
            src="/black94-logo.png"
            alt={companyName}
            className="h-16 w-auto object-contain"
          />
        </div>
        <div className="border-t-2 border-black pt-4">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-black">
            {companyName}
          </h1>
          {cin && (
            <p className="text-xs text-gray-600 mt-1 tracking-wide">CIN: {cin}</p>
          )}
          {address && (
            <p className="text-xs text-gray-600 mt-1">{address}</p>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-10">
        <div className="inline-block border-2 border-black px-8 py-2">
          <h2 className="text-xl font-bold uppercase tracking-[0.2em]">Board Resolution</h2>
        </div>
      </div>

      {/* Resolution Number and Date */}
      <div className="flex justify-between items-start mb-8 text-sm">
        <div>
          <p className="font-semibold text-black">Resolution No:</p>
          <p className="font-mono">{form.resolutionNumber}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-black">Date:</p>
          <p>{formattedDate}</p>
        </div>
      </div>

      {form.venue && (
        <div className="mb-6 text-sm">
          <p className="font-semibold text-black">Venue:</p>
          <p>{form.venue}</p>
        </div>
      )}

      {/* Preamble */}
      {form.preamble && (
        <div className="mb-6 text-sm leading-relaxed">
          <p className="mb-2 italic text-gray-700">{form.preamble}</p>
        </div>
      )}

      {/* Resolved Text */}
      <div className="mb-10">
        <p className="text-sm font-bold mb-2">&quot;RESOLVED THAT&quot;</p>
        <div className="text-sm leading-[1.8] text-gray-800 pl-4 border-l-2 border-gray-300">
          <p>{form.resolvedText}</p>
        </div>
      </div>

      {/* Resolved By / Seconded By */}
      {(form.resolvedBy || form.secondedBy) && (
        <div className="mb-10 flex gap-12 text-sm">
          {form.resolvedBy && (
            <div>
              <p className="font-semibold text-black">Proposed By:</p>
              <p>{form.resolvedBy}</p>
            </div>
          )}
          {form.secondedBy && (
            <div>
              <p className="font-semibold text-black">Seconded By:</p>
              <p>{form.secondedBy}</p>
            </div>
          )}
        </div>
      )}

      {/* Separator */}
      <div className="border-t border-gray-300 my-10" />

      {/* Signature Area */}
      <div className="relative mt-16">
        <div className="flex items-end justify-between">
          {/* Signature */}
          <div className="text-center">
            {signaturePreview && (
              <div className="mb-2">
                <img
                  src={signaturePreview}
                  alt="Authorized Signature"
                  className="h-16 w-auto mx-auto object-contain"
                />
              </div>
            )}
            <div className="border-t border-black pt-2 min-w-[200px]">
              <p className="font-semibold text-sm text-black">
                {form.authorityName || settingsForm.authorityName || '___________________________'}
              </p>
              <p className="text-xs text-gray-600">
                {form.authorityTitle || settingsForm.authorityTitle || 'Authorized Signatory'}
              </p>
              <p className="text-xs text-gray-600">{companyName}</p>
            </div>
          </div>

          {/* Stamp */}
          <div className="relative">
            {stampPreview && (
              <div className="absolute -top-8 -right-8 opacity-70">
                <img
                  src={stampPreview}
                  alt="Company Stamp"
                  className="h-24 w-auto object-contain rotate-[-12deg]"
                  style={{ transform: 'rotate(-12deg)' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-16 pt-6 border-t border-gray-200 text-center">
        <p className="text-[9px] text-gray-400 tracking-wide">
          This is a computer-generated Board Resolution document of {companyName}.
        </p>
        <p className="text-[9px] text-gray-400 tracking-wide mt-0.5">
          Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
});

ResolutionPreview.displayName = 'ResolutionPreview';
