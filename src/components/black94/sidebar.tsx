'use client';

import React from 'react';
import { useApp } from '@/lib/black94-store';
import type { AppPage } from '@/lib/black94-types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  LayoutDashboard, FileText, Building2, Brain, ShieldCheck, FileDown, ClipboardCheck, DollarSign,
  CheckSquare, Users, Bot, BarChart3, CalendarDays, Search, Settings, LogOut, Menu, ChevronLeft, X
} from 'lucide-react';
import { toast } from 'sonner';

interface NavItem {
  id: AppPage;
  label: string;
  icon: React.ReactNode;
  accent?: string;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  { title: '', items: [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  ]},
  { title: 'Documents', items: [
    { id: 'resolutions', label: 'Resolutions', icon: <FileText className="w-4 h-4" /> },
    { id: 'profile', label: 'Business Profile', icon: <Building2 className="w-4 h-4" /> },
    { id: 'memory', label: 'Company Memory', icon: <Brain className="w-4 h-4" /> },
  ]},
  { title: 'Legal & Compliance', items: [
    { id: 'contracts', label: 'NDA & Contracts', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'policies', label: 'Policy Generator', icon: <FileDown className="w-4 h-4" /> },
    { id: 'compliance', label: 'Compliance Copilot', icon: <ClipboardCheck className="w-4 h-4" /> },
  ]},
  { title: 'Operations', items: [
    { id: 'fundraising', label: 'Fundraising', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'approvals', label: 'Approvals', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'vendors', label: 'Vendors & Clients', icon: <Users className="w-4 h-4" /> },
  ]},
  { title: 'Intelligence', items: [
    { id: 'chat', label: 'AI Assistant', icon: <Bot className="w-4 h-4" />, accent: 'text-amber-400' },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'diligence', label: 'Due Diligence', icon: <Search className="w-4 h-4" /> },
  ]},
  { title: '', items: [
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ]},
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { currentPage, setCurrentPage, logout, settings, resolutions, approvals, compliance, chatHistory } = useApp();

  const pendingApprovals = approvals.filter(a => a.status === 'Pending').length;
  const complianceIssues = compliance.filter(c => c.status === 'overdue' || c.status === 'due-soon').length;

  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page);
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/15 to-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
          <img src="/black94-logo.png" alt="B94" className="w-7 h-7 object-contain rounded" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold tracking-tight text-white leading-tight">BLACK94</h1>
          <p className="text-[9px] text-white/30 uppercase tracking-[0.15em] leading-tight">AI Corporate OS</p>
        </div>
      </div>
      <Separator className="bg-white/[0.06]" />

      {/* Nav */}
      <ScrollArea className="flex-1 px-2 py-3">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="text-[9px] text-white/20 uppercase tracking-[0.15em] font-semibold px-3 mb-1.5 mt-3">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = currentPage === item.id;
                const badge = item.id === 'approvals' && pendingApprovals > 0 ? pendingApprovals :
                              item.id === 'compliance' && complianceIssues > 0 ? complianceIssues :
                              item.id === 'chat' && chatHistory.length > 0 ? undefined : undefined;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left group ${
                      isActive
                        ? 'bg-white/[0.08] text-white border-l-2 border-emerald-400'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className={isActive ? 'text-emerald-400' : (item.accent || 'text-white/30 group-hover:text-white/50')}>
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {badge && (
                      <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center justify-center">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </ScrollArea>

      {/* Bottom */}
      <div className="p-3 border-t border-white/[0.06] space-y-1">
        <div className="px-3 py-1.5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/60">
            {settings.companyName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white/50 font-medium truncate">{settings.companyName}</p>
            <p className="text-[9px] text-white/25">{settings.constitution}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { logout(); toast.success('Logged out'); }}
          className="w-full justify-start text-white/30 hover:text-red-400 hover:bg-red-500/10 gap-2 px-3 py-1.5 h-8 text-[12px]"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-[240px] shrink-0 border-r border-white/[0.06] h-screen sticky top-0">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden text-white/50 hover:text-white hover:bg-white/10">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[260px] bg-[#050505] border-white/[0.06]">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SidebarContent onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
