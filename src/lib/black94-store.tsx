'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { AppData, AppPage, CompanySettings, BoardResolution, BusinessProfile, MemoryEntry, Contract, Policy, ComplianceItem, ApprovalRequest, Vendor, Client, ChatMessage, TimelineEvent, DueDiligenceCategory, ActivityEntry } from './black94-types';
import { getFromStorage, setToStorage, generateId, getDefaultAppData, DEFAULT_SETTINGS, cloudSyncPush, cloudSyncPull, generateResolutionNumber, timeAgo, CLOUD_FUNCTION_URL, SYNC_DEBOUNCE_MS } from './black94-utils';

interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;

  // Navigation
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Settings
  settings: CompanySettings;
  updateSettings: (s: CompanySettings) => void;

  // Signature/Stamp
  signature: string | null;
  setSignature: (s: string | null) => void;
  stamp: string | null;
  setStamp: (s: string | null) => void;

  // Resolutions
  resolutions: BoardResolution[];
  addResolution: (r: BoardResolution) => void;
  updateResolution: (r: BoardResolution) => void;
  deleteResolution: (id: string) => void;

  // Business Profile
  profile: BusinessProfile;
  updateProfile: (p: BusinessProfile) => void;

  // Company Memory
  memory: MemoryEntry[];
  addMemory: (m: MemoryEntry) => void;
  updateMemory: (m: MemoryEntry) => void;
  deleteMemory: (id: string) => void;

  // Contracts
  contracts: Contract[];
  addContract: (c: Contract) => void;
  updateContract: (c: Contract) => void;
  deleteContract: (id: string) => void;

  // Policies
  policies: Policy[];
  addPolicy: (p: Policy) => void;
  updatePolicy: (p: Policy) => void;
  deletePolicy: (id: string) => void;

  // Compliance
  compliance: ComplianceItem[];
  updateCompliance: (items: ComplianceItem[]) => void;

  // Approvals
  approvals: ApprovalRequest[];
  addApproval: (a: ApprovalRequest) => void;
  updateApproval: (a: ApprovalRequest) => void;
  deleteApproval: (id: string) => void;

  // Vendors
  vendors: Vendor[];
  addVendor: (v: Vendor) => void;
  updateVendor: (v: Vendor) => void;
  deleteVendor: (id: string) => void;

  // Clients
  clients: Client[];
  addClient: (c: Client) => void;
  updateClient: (c: Client) => void;
  deleteClient: (id: string) => void;

  // Chat
  chatHistory: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;

  // Timeline
  timeline: TimelineEvent[];
  addTimelineEvent: (e: TimelineEvent) => void;

  // Due Diligence
  diligence: DueDiligenceCategory[];
  updateDiligence: (d: DueDiligenceCategory[]) => void;

  // Activities
  activities: ActivityEntry[];
  addActivity: (action: string, description: string, category: string) => void;

  // AI
  callAIGeneric: (prompt: string) => Promise<string>;

  // Loading
  loading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => { if (typeof window === 'undefined') return false; const a = getFromStorage<{ authenticated: boolean } | null>('black94_auth', null); return a?.authenticated || false; });
  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<CompanySettings>(() => { const s = getFromStorage<CompanySettings>('black94_settings', DEFAULT_SETTINGS); return { ...DEFAULT_SETTINGS, ...s }; });
  const [signature, setSignatureState] = useState<string | null>(() => getFromStorage<string | null>('black94_signature', null));
  const [stamp, setStampState] = useState<string | null>(() => getFromStorage<string | null>('black94_stamp', null));
  const [resolutions, setResolutions] = useState<BoardResolution[]>(() => getFromStorage<BoardResolution[]>('black94_resolutions', []));
  const [profile, setProfile] = useState<BusinessProfile>(() => getFromStorage<BusinessProfile>('black94_profile', getDefaultAppData().profile));
  const [memory, setMemory] = useState<MemoryEntry[]>(() => getFromStorage<MemoryEntry[]>('black94_memory', []));
  const [contracts, setContracts] = useState<Contract[]>(() => getFromStorage<Contract[]>('black94_contracts', []));
  const [policies, setPolicies] = useState<Policy[]>(() => getFromStorage<Policy[]>('black94_policies', []));
  const [compliance, setCompliance] = useState<ComplianceItem[]>(() => getFromStorage<ComplianceItem[]>('black94_compliance', getDefaultAppData().compliance));
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() => getFromStorage<ApprovalRequest[]>('black94_approvals', []));
  const [vendors, setVendors] = useState<Vendor[]>(() => getFromStorage<Vendor[]>('black94_vendors', []));
  const [clients, setClients] = useState<Client[]>(() => getFromStorage<Client[]>('black94_clients', []));
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => getFromStorage<ChatMessage[]>('black94_chatHistory', []));
  const [timeline, setTimeline] = useState<TimelineEvent[]>(() => getFromStorage<TimelineEvent[]>('black94_timeline', []));
  const [diligence, setDiligence] = useState<DueDiligenceCategory[]>(() => getFromStorage<DueDiligenceCategory[]>('black94_diligence', getDefaultAppData().diligence));
  const [activities, setActivities] = useState<ActivityEntry[]>(() => getFromStorage<ActivityEntry[]>('black94_activities', []));

  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cloud sync pull on mount
  useEffect(() => {
    cloudSyncPull().then(cloudData => {
      if (cloudData) {
        if (cloudData.settings) { setSettings({ ...DEFAULT_SETTINGS, ...cloudData.settings }); setToStorage('black94_settings', cloudData.settings); }
        if (cloudData.resolutions?.length) { setResolutions(prev => { const merged = [...cloudData.resolutions!, ...prev]; const map = new Map(merged.map(r => [r.id, r])); return Array.from(map.values()); }); }
        if (cloudData.signature && !signature) setSignatureState(cloudData.signature);
        if (cloudData.stamp && !stamp) setStampState(cloudData.stamp);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Debounced cloud sync
  const scheduleSync = useCallback((data: Record<string, unknown>) => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => cloudSyncPush(data), SYNC_DEBOUNCE_MS);
  }, []);

  // Auth
  const login = useCallback(() => {
    setToStorage('black94_auth', { authenticated: true });
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setToStorage('black94_auth', null);
    setIsAuthenticated(false);
  }, []);

  // Settings
  const updateSettings = useCallback((s: CompanySettings) => {
    setSettings(s);
    setToStorage('black94_settings', s);
    scheduleSync({ settings: s });
  }, [scheduleSync]);

  // Signature/Stamp
  const setSignature = useCallback((s: string | null) => {
    setSignatureState(s);
    setToStorage('black94_signature', s);
    scheduleSync({ signature: s });
  }, [scheduleSync]);
  const setStamp = useCallback((s: string | null) => {
    setStampState(s);
    setToStorage('black94_stamp', s);
    scheduleSync({ stamp: s });
  }, [scheduleSync]);

  // Resolutions
  const addResolution = useCallback((r: BoardResolution) => {
    setResolutions(prev => { const u = [r, ...prev]; setToStorage('black94_resolutions', u); scheduleSync({ resolutions: u }); return u; });
  }, [scheduleSync]);
  const updateResolution = useCallback((r: BoardResolution) => {
    setResolutions(prev => { const u = prev.map(x => x.id === r.id ? r : x); setToStorage('black94_resolutions', u); scheduleSync({ resolutions: u }); return u; });
  }, [scheduleSync]);
  const deleteResolution = useCallback((id: string) => {
    setResolutions(prev => { const u = prev.filter(x => x.id !== id); setToStorage('black94_resolutions', u); scheduleSync({ resolutions: u }); return u; });
  }, [scheduleSync]);

  // Profile
  const updateProfile = useCallback((p: BusinessProfile) => {
    setProfile(p);
    setToStorage('black94_profile', p);
  }, []);

  // Memory
  const addMemory = useCallback((m: MemoryEntry) => {
    setMemory(prev => { const u = [m, ...prev]; setToStorage('black94_memory', u); return u; });
  }, []);
  const updateMemory = useCallback((m: MemoryEntry) => {
    setMemory(prev => { const u = prev.map(x => x.id === m.id ? m : x); setToStorage('black94_memory', u); return u; });
  }, []);
  const deleteMemory = useCallback((id: string) => {
    setMemory(prev => { const u = prev.filter(x => x.id !== id); setToStorage('black94_memory', u); return u; });
  }, []);

  // Contracts
  const addContract = useCallback((c: Contract) => {
    setContracts(prev => { const u = [c, ...prev]; setToStorage('black94_contracts', u); return u; });
  }, []);
  const updateContract = useCallback((c: Contract) => {
    setContracts(prev => { const u = prev.map(x => x.id === c.id ? c : x); setToStorage('black94_contracts', u); return u; });
  }, []);
  const deleteContract = useCallback((id: string) => {
    setContracts(prev => { const u = prev.filter(x => x.id !== id); setToStorage('black94_contracts', u); return u; });
  }, []);

  // Policies
  const addPolicy = useCallback((p: Policy) => {
    setPolicies(prev => { const u = [p, ...prev]; setToStorage('black94_policies', u); return u; });
  }, []);
  const updatePolicy = useCallback((p: Policy) => {
    setPolicies(prev => { const u = prev.map(x => x.id === p.id ? p : x); setToStorage('black94_policies', u); return u; });
  }, []);
  const deletePolicy = useCallback((id: string) => {
    setPolicies(prev => { const u = prev.filter(x => x.id !== id); setToStorage('black94_policies', u); return u; });
  }, []);

  // Compliance
  const updateComplianceFn = useCallback((items: ComplianceItem[]) => {
    setCompliance(items);
    setToStorage('black94_compliance', items);
  }, []);

  // Approvals
  const addApproval = useCallback((a: ApprovalRequest) => {
    setApprovals(prev => { const u = [a, ...prev]; setToStorage('black94_approvals', u); return u; });
  }, []);
  const updateApproval = useCallback((a: ApprovalRequest) => {
    setApprovals(prev => { const u = prev.map(x => x.id === a.id ? a : x); setToStorage('black94_approvals', u); return u; });
  }, []);
  const deleteApproval = useCallback((id: string) => {
    setApprovals(prev => { const u = prev.filter(x => x.id !== id); setToStorage('black94_approvals', u); return u; });
  }, []);

  // Vendors
  const addVendor = useCallback((v: Vendor) => {
    setVendors(prev => { const u = [v, ...prev]; setToStorage('black94_vendors', u); return u; });
  }, []);
  const updateVendor = useCallback((v: Vendor) => {
    setVendors(prev => { const u = prev.map(x => x.id === v.id ? v : x); setToStorage('black94_vendors', u); return u; });
  }, []);
  const deleteVendor = useCallback((id: string) => {
    setVendors(prev => { const u = prev.filter(x => x.id !== id); setToStorage('black94_vendors', u); return u; });
  }, []);

  // Clients
  const addClient = useCallback((c: Client) => {
    setClients(prev => { const u = [c, ...prev]; setToStorage('black94_clients', u); return u; });
  }, []);
  const updateClient = useCallback((c: Client) => {
    setClients(prev => { const u = prev.map(x => x.id === c.id ? c : x); setToStorage('black94_clients', u); return u; });
  }, []);
  const deleteClient = useCallback((id: string) => {
    setClients(prev => { const u = prev.filter(x => x.id !== id); setToStorage('black94_clients', u); return u; });
  }, []);

  // Chat
  const addChatMessage = useCallback((msg: ChatMessage) => {
    setChatHistory(prev => { const u = [...prev, msg]; setToStorage('black94_chatHistory', u); return u; });
  }, []);
  const clearChat = useCallback(() => {
    setChatHistory([]);
    setToStorage('black94_chatHistory', []);
  }, []);

  // Timeline
  const addTimelineEvent = useCallback((e: TimelineEvent) => {
    setTimeline(prev => { const u = [e, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); setToStorage('black94_timeline', u); return u; });
  }, []);

  // Due Diligence
  const updateDiligenceFn = useCallback((d: DueDiligenceCategory[]) => {
    setDiligence(d);
    setToStorage('black94_diligence', d);
  }, []);

  // Activities
  const addActivity = useCallback((action: string, description: string, category: string) => {
    const entry: ActivityEntry = { id: generateId(), action, description, category, timestamp: new Date().toISOString() };
    setActivities(prev => { const u = [entry, ...prev].slice(0, 50); setToStorage('black94_activities', u); return u; });
  }, []);

  // AI
  const callAIGeneric = useCallback(async (prompt: string): Promise<string> => {
    const response = await fetch(`${CLOUD_FUNCTION_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'chat', description: prompt, settings }),
    });
    if (!response.ok) throw new Error('AI service error');
    const data = await response.json();
    return data.content || data.resolvedText || data.text || JSON.stringify(data);
  }, [settings]);

  return (
    <AppContext.Provider value={{
      isAuthenticated, login, logout,
      currentPage, setCurrentPage, sidebarOpen, setSidebarOpen,
      settings, updateSettings,
      signature, setSignature, stamp, setStamp,
      resolutions, addResolution, updateResolution, deleteResolution,
      profile, updateProfile,
      memory, addMemory, updateMemory, deleteMemory,
      contracts, addContract, updateContract, deleteContract,
      policies, addPolicy, updatePolicy, deletePolicy,
      compliance, updateCompliance: updateComplianceFn,
      approvals, addApproval, updateApproval, deleteApproval,
      vendors, addVendor, updateVendor, deleteVendor,
      clients, addClient, updateClient, deleteClient,
      chatHistory, addChatMessage, clearChat,
      timeline, addTimelineEvent,
      diligence, updateDiligence: updateDiligenceFn,
      activities, addActivity,
      callAIGeneric,
      loading,
    }}>
      {children}
    </AppContext.Provider>
  );
}
