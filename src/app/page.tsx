'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from '@/lib/black94-store';
import { getFromStorage, getOwnerPasswordHash, hashPassword, CLOUD_FUNCTION_URL, PDF_COMPANY_DATA } from '@/lib/black94-utils';
import { Sidebar, MobileSidebar } from '@/components/black94/sidebar';
import { DashboardPage } from '@/components/black94/dashboard';
import { ResolutionsPage } from '@/components/black94/resolutions';
import { BusinessProfilePage } from '@/components/black94/business-profile';
import { ChatPage } from '@/components/black94/chat';
import { MemoryPage } from '@/components/black94/memory';
import { ContractsPage } from '@/components/black94/contracts';
import { CompliancePage, PolicyPage } from '@/components/black94/compliance';
import { FundraisingPage, ApprovalsPage, VendorsPage } from '@/components/black94/operations';
import { ReportsPage, TimelinePage, DiligencePage, SettingsPage } from '@/components/black94/intelligence';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Lock, Shield, Loader2, AlertCircle, FileText } from 'lucide-react';
import type { AppPage } from '@/lib/black94-types';

// ===== LOGIN PAGE =====
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) { setError('Enter password'); return; }
    setLoading(true);
    try {
      const ownerHash = await getOwnerPasswordHash();
      const inputHash = await hashPassword(password);
      if (inputHash === ownerHash) {
        getFromStorage('black94_auth', null);
        localStorage.setItem('black94_auth', JSON.stringify({ authenticated: true, timestamp: Date.now() }));
        toast.success('Welcome to Black94 AI Corporate OS');
        onLogin();
      } else {
        setError('Incorrect password. Access denied.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch { setError('Authentication error'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className={`w-full max-w-md transition-transform ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 mx-auto mb-4 flex items-center justify-center overflow-hidden">
            <img src="/black94-logo.png" alt="Black94" className="w-16 h-16 object-contain rounded" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Black94</h1>
          <p className="text-sm text-white/40 mt-1 uppercase tracking-widest">AI Corporate OS</p>
        </div>
        <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <Lock className="w-6 h-6 text-white/60" />
            </div>
            <CardTitle className="text-white text-lg">Access Control</CardTitle>
            <CardDescription className="text-white/40">Restricted to authorized personnel only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-white/70 text-sm font-medium">Password</Label>
              <Input type="password" placeholder="Enter access password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10" />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <Button onClick={handleLogin} disabled={loading || !password} className="bg-white text-black hover:bg-white/90 font-semibold w-full gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Unlock System
            </Button>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Shield className="w-3 h-3 text-white/20" />
              <p className="text-[10px] text-white/20 text-center">Private &amp; Confidential &middot; Black94 Proprietorship</p>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-[10px] text-white/20 mt-6">&copy; {new Date().getFullYear()} Black94 &middot; {PDF_COMPANY_DATA.gstin} &middot; Confidential</p>
      </div>
    </div>
  );
}

// ===== MAIN APP SHELL =====
function AppShell() {
  const { isAuthenticated, login, currentPage, setCurrentPage, loading, settings } = useApp();
  const [authChecked, setAuthChecked] = useState(false);

  // Check auth on mount
  React.useEffect(() => {
    const auth = getFromStorage<{ authenticated: boolean } | null>('black94_auth', null);
    if (auth?.authenticated) login();
    setAuthChecked(true);
  }, []);

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
            <FileText className="w-8 h-8 text-white/60 animate-pulse" />
          </div>
          <p className="text-white/40 text-sm font-medium">Loading Black94 AI Corporate OS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'resolutions': return <ResolutionsPage />;
      case 'profile': return <BusinessProfilePage />;
      case 'memory': return <MemoryPage />;
      case 'contracts': return <ContractsPage />;
      case 'policies': return <PolicyPage />;
      case 'compliance': return <CompliancePage />;
      case 'fundraising': return <FundraisingPage />;
      case 'approvals': return <ApprovalsPage />;
      case 'vendors': return <VendorsPage />;
      case 'chat': return <ChatPage />;
      case 'reports': return <ReportsPage />;
      case 'timeline': return <TimelinePage />;
      case 'diligence': return <DiligencePage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  const pageTitle: Record<AppPage, string> = {
    dashboard: 'Dashboard', resolutions: 'Board Resolutions', profile: 'Business Profile',
    memory: 'Company Memory', contracts: 'NDA & Contracts', policies: 'Policy Generator',
    compliance: 'Compliance Copilot', fundraising: 'Fundraising', approvals: 'Smart Approvals',
    vendors: 'Vendors & Clients', chat: 'AI Assistant', reports: 'Business Reports',
    timeline: 'Timeline', diligence: 'Due Diligence', settings: 'Settings',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-xl">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <MobileSidebar />
              <h2 className="text-sm font-semibold text-white/80">{pageTitle[currentPage]}</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/50">
                {settings.companyName.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8 max-w-6xl w-full">
          {renderPage()}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] mt-auto">
          <div className="px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img src="/black94-logo.png" alt="" className="w-4 h-4 rounded object-contain" />
              <span className="text-[10px] text-white/20">&copy; {new Date().getFullYear()} {settings.companyName}. All rights reserved.</span>
            </div>
            <p className="text-[10px] text-white/15">{settings.gstin} &middot; AI Corporate OS v2.0</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ===== ROOT EXPORT =====
export default function Black94CorporateOS() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
