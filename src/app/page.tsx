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
  FileText, Upload, Stamp, PenTool, Settings, Plus, Trash2, Download, Eye, Copy, CheckCircle2, Building2, Calendar, MapPin, User, AlertCircle, Loader2, ExternalLink, FileDown, Lock, Shield, LogOut, Sparkles, Wand2, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

// --- Constants ---
const CLOUD_FUNCTION_URL = 'https://aihandler-pjfzlcns3a-el.a.run.app';
const SYNC_DEBOUNCE_MS = 1500;

// --- LocalStorage Helpers ---
function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage write failed:', e);
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

// --- Cloud Sync Helper ---
async function cloudSyncPush(data: { resolutions: BoardResolution[]; settings: CompanySettings; signature: string | null; stamp: string | null }) {
  try {
    await fetch(`${CLOUD_FUNCTION_URL}/data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.warn('Cloud sync push failed:', e);
  }
}

async function cloudSyncPull(): Promise<{ resolutions: BoardResolution[]; settings: CompanySettings; signature: string | null; stamp: string | null } | null> {
  try {
    const res = await fetch(`${CLOUD_FUNCTION_URL}/data`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Cloud sync pull failed:', e);
    return null;
  }
}

// --- Types ---
interface CompanySettings {
  companyName: string;
  legalName: string;
  constitution: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  cin: string;
  authorityName: string;
  authorityTitle: string;
  state: string;
  district: string;
  pinCode: string;
}

interface BoardResolution {
  id: string;
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
  status: string;
  createdAt: string;
  updatedAt: string;
}

// --- Company Data from GST Certificate ---
const PDF_COMPANY_DATA: Partial<CompanySettings> = {
  legalName: 'PRABHU DASU PALLI',
  companyName: 'Black94',
  constitution: 'Proprietorship',
  gstin: '37DFRPP8787L1Z0',
  address: 'D.No. 3-144, Peda Rapeta Satyavaram, Near Community Hall, Penumantra, Maruteru, West Godavari, Andhra Pradesh - 534122',
  state: 'Andhra Pradesh',
  district: 'West Godavari',
  pinCode: '534122',
  authorityName: 'PRABHU DASU PALLI',
  authorityTitle: 'Proprietor',
};

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'Black94',
  legalName: 'PRABHU DASU PALLI',
  constitution: 'Proprietorship',
  gstin: '37DFRPP8787L1Z0',
  address: 'D.No. 3-144, Peda Rapeta Satyavaram, Near Community Hall, Penumantra, Maruteru, West Godavari, Andhra Pradesh - 534122',
  phone: '',
  email: '',
  cin: '',
  authorityName: 'PRABHU DASU PALLI',
  authorityTitle: 'Proprietor',
  state: 'Andhra Pradesh',
  district: 'West Godavari',
  pinCode: '534122',
};

// --- Password Hash (simple but effective for static site) ---
let _computedHash: string | null = null;

async function getOwnerPasswordHash(): Promise<string> {
  if (_computedHash) return _computedHash;
  const encoder = new TextEncoder();
  const data = encoder.encode('11221122' + 'black94_salt_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  _computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return _computedHash;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'black94_salt_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- AI Smart Resolution Builder ---
interface ParsedResolution {
  title: string;
  preamble: string;
  resolvedText: string;
  venue: string;
  resolvedBy: string;
  secondedBy: string;
  authorityName: string;
  authorityTitle: string;
}

async function aiGenerateResolution(input: string, settings: CompanySettings): Promise<ParsedResolution> {
  try {
    const response = await fetch(`${CLOUD_FUNCTION_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: input, settings }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server error ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      title: data.title || '',
      preamble: data.preamble || '',
      resolvedText: data.resolvedText || '',
      venue: data.venue || `Registered Office, ${settings.district}`,
      resolvedBy: data.resolvedBy || settings.authorityName,
      secondedBy: data.secondedBy || '',
      authorityName: data.authorityName || settings.authorityName,
      authorityTitle: data.authorityTitle || settings.authorityTitle,
    };
  } catch (err) {
    console.warn('AI service unavailable, using smart parser:', err);
    return smartParseDescription(input, settings);
  }
}

// --- Smart Resolution Parser (fallback) ---
function smartParseDescription(input: string, settings: CompanySettings): ParsedResolution {
  const text = input.trim();
  const result: ParsedResolution = {
    title: '',
    preamble: '',
    resolvedText: '',
    venue: `Registered Office, ${settings.district}`,
    resolvedBy: '',
    secondedBy: '',
    authorityName: settings.authorityName,
    authorityTitle: settings.authorityTitle,
  };

  // Extract proposed by / seconded by
  const proposedMatch = text.match(/(?:proposed\s*by|proposer)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
  const secondedMatch = text.match(/(?:seconded\s*by|seconder)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
  if (proposedMatch) result.resolvedBy = proposedMatch[1].trim();
  if (secondedMatch) result.secondedBy = secondedMatch[1].trim();

  // Clean text (remove extracted fields)
  let cleanText = text
    .replace(/(?:proposed\s*by|proposer)[:\s]+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/gi, '')
    .replace(/(?:seconded\s*by|seconder)[:\s]+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/gi, '')
    .replace(/(?:resolution\s*(?:for|regarding|to|about)\s*[:\-]?\s*)/gi, '')
    .trim();

  const lines = cleanText.split(/[.\n]+/).map(l => l.trim()).filter(l => l.length > 5);
  if (lines.length === 0) {
    result.title = 'Board Resolution';
    result.resolvedText = text.trim();
    return result;
  }

  // Extract title from first meaningful line
  const titleLine = lines[0];
  result.title = titleLine
    .replace(/^(?:the\s+)?(?:board\s+(?:hereby\s+)?)?(?:hereby\s+)?(?:it\s+is\s+)?/i, '')
    .replace(/^(?:we\s+(?:want\s+to|need\s+to|should|shall)\s+)/i, '')
    .replace(/^(?:i\s+(?:want|need)\s+to\s+)/i, '')
    .replace(/^(?:please|kindly)\s+/i, '')
    .replace(/\s+and\s+.*$/s, '')
    .trim();
  result.title = result.title
    .split(/\s+/)
    .map((w: string, i: number) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : (w.length > 3 ? w.toLowerCase() : w.toLowerCase()))
    .join(' ');
  // Capitalize important words
  const importantWords = ['appointment', 'approval', 'authorization', 'opening', 'closing', 'bank', 'account', 'director', 'managing', 'annual', 'budget', 'payment', 'salary', 'transfer', 'allotment', 'creation', 'issuance', 'removal', 'change', 'adoption', 'ratification', 'amendment', 'resolution'];
  result.title = result.title.replace(/\b(\w+)/g, (match: string) => importantWords.includes(match.toLowerCase()) ? match.charAt(0).toUpperCase() + match.slice(1).toLowerCase() : match);

  // Build body from remaining lines
  const bodyLines = lines.slice(1).filter((l: string) => l.trim().length > 5);
  const fullBody = bodyLines.length > 0 ? bodyLines.join('. ').trim() : (lines.length > 1 ? lines.slice(1).join('. ').trim() : cleanText.replace(lines[0], '').trim());

  // Generate preamble based on title keywords
  const titleLower = result.title.toLowerCase();
  let preambleTemplate = '';
  if (/bank\s*account|current\s*account|savings\s*account/.test(titleLower)) {
    preambleTemplate = `WHEREAS, the ${settings.companyName} requires a bank account for its day-to-day business operations and financial transactions;`;
  } else if (/appointment|appoint|director|managing/.test(titleLower)) {
    preambleTemplate = `WHEREAS, it is considered necessary and expedient to appoint a suitable person to the position for the efficient management and growth of ${settings.companyName};`;
  } else if (/budget|financial|annual/.test(titleLower)) {
    preambleTemplate = `WHEREAS, the Board of ${settings.companyName} deems it necessary to approve the financial estimates for the smooth operations of the business during the ensuing financial year;`;
  } else if (/payment|salary|remuneration|compensation/.test(titleLower)) {
    preambleTemplate = `WHEREAS, it is considered appropriate to approve the payment of remuneration for the services rendered to ${settings.companyName};`;
  } else if (/loan|borrowing|mortgage|charge/.test(titleLower)) {
    preambleTemplate = `WHEREAS, ${settings.companyName} requires financial assistance for its business operations and it is deemed necessary to avail the said facility;`;
  } else if (/transfer|allotment|share|equity/.test(titleLower)) {
    preambleTemplate = `WHEREAS, it is considered expedient to undertake the transfer of shares in the interest of the business and its stakeholders;`;
  } else if (/opening|close|closing|branch|office/.test(titleLower)) {
    preambleTemplate = `WHEREAS, it is considered beneficial for the business expansion of ${settings.companyName} to undertake the said activity;`;
  } else if (/agreement|contract|partnership|mou|memorandum/.test(titleLower)) {
    preambleTemplate = `WHEREAS, it is considered necessary in the interest of ${settings.companyName} to enter into the said arrangement for the furtherance of its business objectives;`;
  } else {
    preambleTemplate = `WHEREAS, it is considered necessary and in the best interest of ${settings.companyName} to undertake the said action for the efficient conduct of its business affairs;`;
  }
  result.preamble = preambleTemplate;

  // Build professional resolved text
  if (fullBody.length > 0) {
    const polished = fullBody
      .replace(/^(?:we\s+(?:want|need|should|shall|have\s+decided)\s+to)/gi, 'the Board hereby resolves to')
      .replace(/^(?:the\s+)?board\s+(?:hereby\s+)?/gi, '')
      .replace(/^(?:it\s+is\s+)?hereby\s+(?:resolved|approved|decided)\s+that/gi, '')
      .replace(/^(?:i\s+(?:want|need)\s+to)/gi, '')
      .replace(/^(?:please|kindly)\s+/gi, '')
      .replace(/\bi\s+(?:will|shall|want|need)\s+/gi, 'the Company shall ')
      .replace(/\bwe\s+(?:will|shall|want|need)\s+/gi, 'the Board shall ')
      .replace(/\bfor\s+our\s+/gi, `for ${settings.companyName} `)
      .replace(/\bour\s+business/gi, `the business of ${settings.companyName}`)
      .replace(/\bour\s+company/gi, settings.companyName)
      .replace(/\bmy\s+company/gi, settings.companyName)
      .replace(/\bthe\s+account\s+(?:will|shall)\s+be\s+operated\s+by/gi, 'the account shall be jointly operated by');

    const sentences = polished.split(/(?<=[.!?])\s+/).filter((s: string) => s.trim().length > 0);
    const formalSentences = sentences.map((s: string) => {
      s = s.trim();
      if (!s) return '';
      s = s.charAt(0).toUpperCase() + s.slice(1);
      if (!/[.!?]$/.test(s)) s += '.';
      return s;
    }).filter(Boolean);

    if (formalSentences.length > 0) {
      // Smart opening based on action type
      let opening = '';
      if (/open|create|establish|setup/.test(titleLower)) {
        opening = `RESOLVED THAT, subject to the necessary approvals and compliance with applicable laws, ${settings.companyName} shall `;
      } else if (/appoint|designate/.test(titleLower)) {
        opening = 'RESOLVED THAT, the appointment of ';
      } else if (/approve|sanction|accept/.test(titleLower)) {
        opening = 'RESOLVED THAT, the Board hereby approves and ratifies ';
      } else if (/transfer|allot|issue/.test(titleLower)) {
        opening = 'RESOLVED THAT, the Board hereby authorizes ';
      } else {
        opening = `RESOLVED THAT, the Board of ${settings.companyName} hereby `;
      }
      const firstSentence = formalSentences[0].replace(/^[A-Z]/, (c: string) => c.toLowerCase());
      formalSentences[0] = opening + firstSentence;
      result.resolvedText = formalSentences.join(' ');
    } else {
      result.resolvedText = `RESOLVED THAT, the Board of ${settings.companyName} hereby approves and authorizes the ${result.title.toLowerCase()} as described herein.`;
    }
  } else {
    result.resolvedText = `RESOLVED THAT, the Board of ${settings.companyName} hereby approves and authorizes the ${result.title.toLowerCase()} as set forth in the description provided.`;
  }

  return result;
}

// --- Login Component ---
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Please enter the password');
      return;
    }
    setLoading(true);
    const ownerHash = await getOwnerPasswordHash();
    const inputHash = await hashPassword(password);

    if (inputHash === ownerHash) {
      setToStorage('black94_auth', { authenticated: true, timestamp: Date.now() });
 toast.success('Welcome back to Black94 Board Resolution System');
      onLogin();
    } else {
      setError('Incorrect password. Access denied.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className={`w-full max-w-md transition-transform ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 mx-auto mb-4 flex items-center justify-center overflow-hidden">
            <img src="/black94-logo.png" alt="Black94" className="w-16 h-16 object-contain rounded" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Black94</h1>
          <p className="text-sm text-white/40 mt-1 uppercase tracking-widest">Board Resolution System</p>
        </div>

        <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <Lock className="w-6 h-6 text-white/60" />
            </div>
            <CardTitle className="text-white text-lg">Access Control</CardTitle>
            <CardDescription className="text-white/40">
              This system is restricted to authorized personnel only.
              <br />Enter your access password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-white/70 text-sm font-medium">Password</Label>
              <Input
                type="password"
                placeholder="Enter access password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                autoFocus
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              onClick={handleLogin}
              disabled={loading || !password}
              className="bg-white text-black hover:bg-white/90 font-semibold w-full gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Unlock System
            </Button>

            <div className="flex items-center justify-center gap-2 pt-1">
              <Shield className="w-3 h-3 text-white/20" />
              <p className="text-[10px] text-white/20 text-center">
                Private &amp; Confidential &middot; Black94 Proprietorship
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-white/20 mt-6">
          &copy; {new Date().getFullYear()} Black94 &middot; {PDF_COMPANY_DATA.gstin} &middot; Confidential
        </p>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function BoardResolutionApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [resolutions, setResolutions] = useState<BoardResolution[]>([]);
  const [activeTab, setActiveTab] = useState('create');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

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

  const [settingsForm, setSettingsForm] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [smartDescription, setSmartDescription] = useState('');
  const [smartLoading, setSmartLoading] = useState(false);

  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<'signature' | 'stamp' | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [syncing, setSyncing] = useState(false);

  const signatureInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Debounced cloud sync push
  const scheduleCloudSync = useCallback((resolutionsList: BoardResolution[], currentSettings: CompanySettings, sig: string | null, stmp: string | null) => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      cloudSyncPush({ resolutions: resolutionsList, settings: currentSettings, signature: sig, stamp: stmp });
      setSyncing(false);
    }, SYNC_DEBOUNCE_MS);
  }, []);

  // Auth check + load data (localStorage first, then cloud sync)
  useEffect(() => {
    const auth = getFromStorage<{ authenticated: boolean; timestamp: number } | null>('black94_auth', null);
    if (auth && auth.authenticated) {
      setIsAuthenticated(true);
    }

    // Load settings, merge with PDF data
    const savedSettings = getFromStorage<CompanySettings>('black94_settings', DEFAULT_SETTINGS);
    const mergedSettings = { ...DEFAULT_SETTINGS, ...savedSettings };
    setSettings(mergedSettings);
    setSettingsForm(mergedSettings);

    const savedResolutions = getFromStorage<BoardResolution[]>('black94_resolutions', []);
    setResolutions(savedResolutions);

    const savedSignature = getFromStorage<string | null>('black94_signature', null);
    const savedStamp = getFromStorage<string | null>('black94_stamp', null);
    setSignaturePreview(savedSignature);
    setStampPreview(savedStamp);

    // Auto-set resolution number
    const nextNum = generateResolutionNumber(savedResolutions);
    setForm(prev => ({ ...prev, resolutionNumber: nextNum, authorityName: mergedSettings.authorityName, authorityTitle: mergedSettings.authorityTitle }));

    // Pull from cloud and merge (cloud wins if newer)
    cloudSyncPull().then(cloudData => {
      if (cloudData && cloudData.resolutions && cloudData.resolutions.length > 0) {
        // Merge: combine local and cloud resolutions, deduplicate by ID
        const localIds = new Set(savedResolutions.map(r => r.id));
        const newFromCloud = cloudData.resolutions.filter(r => !localIds.has(r.id));
        if (newFromCloud.length > 0) {
          const merged = [...newFromCloud, ...savedResolutions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setResolutions(merged);
          setToStorage('black94_resolutions', merged);
        }
      }
      if (cloudData?.settings) {
        const mergedS = { ...DEFAULT_SETTINGS, ...cloudData.settings };
        setSettings(mergedS);
        setSettingsForm(mergedS);
        setToStorage('black94_settings', mergedS);
      }
      if (cloudData?.signature && !savedSignature) {
        setSignaturePreview(cloudData.signature);
        setToStorage('black94_signature', cloudData.signature);
      }
      if (cloudData?.stamp && !savedStamp) {
        setStampPreview(cloudData.stamp);
        setToStorage('black94_stamp', cloudData.stamp);
      }
    });

    setLoading(false);
  }, []);

  // Auto resolution number
  const generateResolutionNumber = useCallback((existingResolutions?: BoardResolution[]) => {
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const nextYear = (now.getFullYear() + 1).toString().slice(2);
    const prefix = `BLK94/${currentYear}-${nextYear}`;

    const resList = existingResolutions || resolutions;
    let count = 1;
    if (resList.length > 0) {
      const match = resList[0].resolutionNumber.match(/\/(\d+)$/);
      if (match) {
        count = parseInt(match[1]) + 1;
      }
    }
    return `${prefix}/${count.toString().padStart(3, '0')}`;
  }, [resolutions]);

  // AI Smart Resolution Builder
  const handleSmartParse = async () => {
    if (!smartDescription.trim()) {
      toast.error('Please enter a description to generate the resolution');
      return;
    }
    setSmartLoading(true);
    try {
      const parsed = await aiGenerateResolution(smartDescription, settingsForm);
      const nextNum = generateResolutionNumber();

      setForm(prev => ({
        ...prev,
        resolutionNumber: nextNum,
        title: parsed.title || prev.title,
        preamble: parsed.preamble || prev.preamble,
        resolvedText: parsed.resolvedText || prev.resolvedText,
        venue: parsed.venue || prev.venue,
        resolvedBy: parsed.resolvedBy || prev.resolvedBy,
        secondedBy: parsed.secondedBy || prev.secondedBy,
        authorityName: parsed.authorityName || prev.authorityName,
        authorityTitle: parsed.authorityTitle || prev.authorityTitle,
      }));

      toast.success('AI generated a professional board resolution!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate resolution. Please try again or fill fields manually.');
    } finally {
      setSmartLoading(false);
    }
  };

  // Signature upload
  const handleSignatureUpload = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File size must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSignaturePreview(base64);
      setToStorage('black94_signature', base64);
      toast.success('Signature saved successfully');
    };
    reader.readAsDataURL(file);
  };

  // Stamp upload
  const handleStampUpload = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File size must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setStampPreview(base64);
      setToStorage('black94_stamp', base64);
      toast.success('Stamp saved successfully');
    };
    reader.readAsDataURL(file);
  };

  // Save settings
  const handleSaveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      setSettings(settingsForm);
      setToStorage('black94_settings', settingsForm);
      toast.success('Settings saved successfully');
      setSaving(false);
    }, 300);
  };

  // Create resolution
  const handleCreateResolution = () => {
    if (!form.title || !form.resolvedText || !form.resolutionNumber) {
      toast.error('Please fill in the required fields');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const newResolution: BoardResolution = {
        id: generateId(),
        resolutionNumber: form.resolutionNumber,
        title: form.title,
        date: form.date,
        venue: form.venue,
        preamble: form.preamble,
        resolvedText: form.resolvedText,
        resolvedBy: form.resolvedBy,
        secondedBy: form.secondedBy,
        authorityName: form.authorityName || settingsForm.authorityName,
        authorityTitle: form.authorityTitle || settingsForm.authorityTitle,
        status: 'final',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [newResolution, ...resolutions];
      setResolutions(updated);
      setToStorage('black94_resolutions', updated);
      // Sync to cloud
      cloudSyncPush({ resolutions: updated, settings: settingsForm, signature: signaturePreview, stamp: stampPreview });
      toast.success('Board Resolution created successfully');

      const nextNum = generateResolutionNumber(updated);
      setForm({
        resolutionNumber: nextNum,
        title: '',
        date: new Date().toISOString().split('T')[0],
        venue: '',
        preamble: '',
        resolvedText: '',
        resolvedBy: '',
        secondedBy: '',
        authorityName: settingsForm.authorityName,
        authorityTitle: settingsForm.authorityTitle,
      });
      setSmartDescription('');
      setActiveTab('history');
      setSaving(false);
    }, 300);
  };

  // Delete resolution
  const handleDeleteResolution = (id: string) => {
    const updated = resolutions.filter((r) => r.id !== id);
    setResolutions(updated);
    setToStorage('black94_resolutions', updated);
    cloudSyncPush({ resolutions: updated, settings: settingsForm, signature: signaturePreview, stamp: stampPreview });
    toast.success('Resolution deleted');
  };

  // Logout
  const handleLogout = () => {
    setToStorage('black94_auth', null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent, type: 'signature' | 'stamp') => { e.preventDefault(); setDragOver(type); };
  const handleDragLeave = () => { setDragOver(null); };
  const handleDrop = (e: React.DragEvent, type: 'signature' | 'stamp') => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (type === 'signature') {
        handleSignatureUpload(file).then(() => {
          // Sync to cloud after signature upload
          cloudSyncPush({ resolutions, settings: settingsForm, signature: signaturePreview, stamp: stampPreview });
        });
      } else {
        handleStampUpload(file).then(() => {
          cloudSyncPush({ resolutions, settings: settingsForm, signature: signaturePreview, stamp: stampPreview });
        });
      }
    }
  };

  // PDF Generation
  const generatePDF = async (resolution?: BoardResolution) => {
    if (!previewRef.current) return;
    setGeneratingPdf(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');
      const a4WidthPx = 794;
      const a4HeightPx = 1123;

      // Create a hidden clone at full size (no CSS transform scaling) for accurate capture
      const clone = previewRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = `${a4WidthPx}px`;
      clone.style.transform = 'none';
      clone.style.zIndex = '-1';
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: a4WidthPx,
        windowWidth: a4WidthPx,
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Calculate proper dimensions maintaining aspect ratio
      const canvasWidth = canvas.width;  // pixel width at 2x scale
      const canvasHeight = canvas.height;
      const imgWidthMM = pdfWidth;  // always full page width
      const imgHeightMM = (canvasHeight / canvasWidth) * imgWidthMM;

      // If content fits in one page, center it; otherwise paginate
      if (imgHeightMM <= pdfHeight) {
        // Center vertically if shorter than page
        const yOffset = Math.max(0, (pdfHeight - imgHeightMM) / 2);
        pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidthMM, imgHeightMM);
      } else {
        // Multi-page: slice the canvas image into A4-sized chunks
        const sourcePageHeightPx = (a4HeightPx / a4WidthPx) * canvasWidth;
        let remainingHeight = canvasHeight;
        let sourceY = 0;
        let pageNum = 0;
        while (remainingHeight > 0) {
          if (pageNum > 0) pdf.addPage();
          const sliceHeight = Math.min(sourcePageHeightPx, remainingHeight);
          // Create a sub-canvas for this page slice
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvasWidth;
          pageCanvas.height = sliceHeight;
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, sourceY, canvasWidth, sliceHeight, 0, 0, canvasWidth, sliceHeight);
            const sliceData = pageCanvas.toDataURL('image/png');
            const sliceHeightMM = (sliceHeight / canvasWidth) * imgWidthMM;
            pdf.addImage(sliceData, 'PNG', 0, 0, imgWidthMM, sliceHeightMM);
          }
          remainingHeight -= sliceHeight;
          sourceY += sliceHeight;
          pageNum++;
        }
      }

      pdf.save(resolution ? `Board_Resolution_${resolution.resolutionNumber}.pdf` : 'Board_Resolution.pdf');
      toast.success('PDF generated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // --- Loading State ---
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

  // --- Login Gate ---
  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  // --- Main App ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
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
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1.5 px-3 hidden sm:flex">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </Badge>
              )}
              <Badge variant="secondary" className="bg-white/5 text-white/50 border-white/10 px-3">
                {resolutions.length} Resolution{resolutions.length !== 1 ? 's' : ''}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/40 hover:text-white hover:bg-white/10 gap-1.5">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white/5 border border-white/10 h-auto p-1 w-full sm:w-auto">
            <TabsTrigger value="create" className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/50 px-4 py-2 text-sm font-medium gap-2 transition-all flex-1 sm:flex-none justify-center">
              <Plus className="w-4 h-4" /> Create
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/50 px-4 py-2 text-sm font-medium gap-2 transition-all flex-1 sm:flex-none justify-center">
              <FileText className="w-4 h-4" /> History
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/50 px-4 py-2 text-sm font-medium gap-2 transition-all flex-1 sm:flex-none justify-center">
              <Settings className="w-4 h-4" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* CREATE TAB */}
          <TabsContent value="create" className="space-y-6">
            {/* Smart Description Block */}
            <Card className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] border-white/10 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none" />
              <CardHeader className="pb-3 relative">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Smart Resolution Builder
                </CardTitle>
                <CardDescription className="text-white/40">
                  Describe your resolution in plain English. AI will write a professional board resolution with proper legal language and auto-fill all fields.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative">
                <Textarea
                  placeholder={`Describe what the resolution is about in simple words.\n\nExample:\nWe want to open a current bank account with SBI for our business. The account will be operated by Prabhu Dasu Palli. Proposed by him only.`}
                  value={smartDescription}
                  onChange={(e) => setSmartDescription(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/25 focus:ring-white/10 min-h-[100px] resize-y text-sm leading-relaxed"
                />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-white/25 flex items-center gap-1">
                    <Wand2 className="w-3 h-3" />
                    Just describe it naturally - AI handles the professional writing
                  </p>
                  <Button
                    onClick={handleSmartParse}
                    disabled={!smartDescription.trim() || smartLoading}
                    variant="outline"
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 gap-2"
                  >
                    {smartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {smartLoading ? 'Generating...' : 'Generate Resolution'}
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                      Fill in or edit the details for the board resolution
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white/70 text-sm font-medium flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Resolution Number (Auto)
                        </Label>
                        <Input
                          value={form.resolutionNumber}
                          onChange={(e) => setForm({ ...form, resolutionNumber: e.target.value })}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10 font-mono text-sm"
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
                          placeholder="e.g., Registered Office"
                          value={form.venue}
                          onChange={(e) => setForm({ ...form, venue: e.target.value })}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/70 text-sm font-medium">GSTIN</Label>
                        <Input
                          value={settingsForm.gstin}
                          readOnly
                          className="bg-white/5 border-white/10 text-white/40 cursor-not-allowed font-mono text-sm"
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
                        placeholder='e.g., the Board of Directors hereby approves the annual budget...'
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
                        <Label className="text-white/70 text-sm font-medium">Authorized Signatory</Label>
                        <Input
                          value={form.authorityName}
                          onChange={(e) => setForm({ ...form, authorityName: e.target.value })}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/70 text-sm font-medium">Designation</Label>
                        <Input
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
                          const nextNum = generateResolutionNumber();
                          setForm({
                            resolutionNumber: nextNum,
                            title: '',
                            date: new Date().toISOString().split('T')[0],
                            venue: '',
                            preamble: '',
                            resolvedText: '',
                            resolvedBy: '',
                            secondedBy: '',
                            authorityName: settingsForm.authorityName,
                            authorityTitle: settingsForm.authorityTitle,
                          });
                          setSmartDescription('');
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
                <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-white/60" />
                      Signature &amp; Stamp
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50 font-medium uppercase tracking-wider">Signature</span>
                        {signaturePreview && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0">Saved</Badge>}
                      </div>
                      {signaturePreview ? (
                        <div className="relative group rounded-lg overflow-hidden border border-white/10 bg-white p-2">
                          <img src={signaturePreview} alt="Signature" className="w-full h-20 object-contain" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button size="sm" variant="secondary" onClick={() => signatureInputRef.current?.click()} className="text-xs">Change</Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragOver === 'signature' ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/20'}`}
                          onClick={() => signatureInputRef.current?.click()}
                          onDragOver={(e) => handleDragOver(e, 'signature')}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'signature')}
                        >
                          <Upload className="w-6 h-6 text-white/30 mx-auto mb-1" />
                          <p className="text-xs text-white/30">Click or drag to upload</p>
                        </div>
                      )}
                      <input ref={signatureInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSignatureUpload(f); }} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50 font-medium uppercase tracking-wider">Company Stamp</span>
                        {stampPreview && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0">Saved</Badge>}
                      </div>
                      {stampPreview ? (
                        <div className="relative group rounded-lg overflow-hidden border border-white/10 bg-white p-2">
                          <img src={stampPreview} alt="Stamp" className="w-full h-20 object-contain" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button size="sm" variant="secondary" onClick={() => stampInputRef.current?.click()} className="text-xs">Change</Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragOver === 'stamp' ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/20'}`}
                          onClick={() => stampInputRef.current?.click()}
                          onDragOver={(e) => handleDragOver(e, 'stamp')}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'stamp')}
                        >
                          <Stamp className="w-6 h-6 text-white/30 mx-auto mb-1" />
                          <p className="text-xs text-white/30">Click or drag to upload</p>
                        </div>
                      )}
                      <input ref={stampInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleStampUpload(f); }} />
                    </div>
                  </CardContent>
                </Card>

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
                    <p className="text-xs text-white/40">{settingsForm.constitution}</p>
                    <p className="text-xs text-white/40 font-mono">GSTIN: {settingsForm.gstin}</p>
                    <p className="text-xs text-white/40">{settingsForm.legalName}</p>
                    <p className="text-[10px] text-white/25 pt-1">
                      Data extracted from GST REG-06 certificate
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
                <p className="text-sm text-white/40 mt-1">{resolutions.length} resolution{resolutions.length !== 1 ? 's' : ''} on record</p>
              </div>
              <Button onClick={() => setActiveTab('create')} className="bg-white text-black hover:bg-white/90 font-semibold gap-2">
                <Plus className="w-4 h-4" /> New Resolution
              </Button>
            </div>

            {resolutions.length === 0 ? (
              <Card className="bg-white/[0.03] border-white/10">
                <CardContent className="py-16 text-center">
                  <FileText className="w-12 h-12 text-white/15 mx-auto mb-4" />
                  <p className="text-white/40 text-lg font-medium">No resolutions yet</p>
                  <p className="text-white/25 text-sm mt-1">Create your first board resolution to get started</p>
                  <Button onClick={() => setActiveTab('create')} variant="outline" className="mt-6 border-white/10 text-white/60 hover:bg-white/5 hover:text-white">
                    Create First Resolution
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-3">
                  {resolutions.map((res) => (
                    <Card key={res.id} className="bg-white/[0.03] border-white/10 hover:bg-white/[0.05] transition-colors group">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="secondary" className="bg-white/10 text-white/70 text-[10px] font-mono shrink-0">{res.resolutionNumber}</Badge>
                              <Badge variant="secondary" className={`text-[10px] px-2 py-0 ${res.status === 'final' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                {res.status === 'final' ? 'Final' : 'Draft'}
                              </Badge>
                            </div>
                            <h3 className="text-white font-semibold text-sm sm:text-base truncate">{res.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(res.date)}</span>
                              {res.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{res.venue}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-white/40 hover:text-white hover:bg-white/10" onClick={() => {
                                  setForm({
                                    resolutionNumber: res.resolutionNumber, title: res.title, date: res.date,
                                    venue: res.venue || '', preamble: res.preamble || '', resolvedText: res.resolvedText,
                                    resolvedBy: res.resolvedBy || '', secondedBy: res.secondedBy || '',
                                    authorityName: res.authorityName || '', authorityTitle: res.authorityTitle || '',
                                  });
                                  setPreviewOpen(true);
                                }}>
                                  <Eye className="w-4 h-4" />
                                  <span className="hidden sm:inline ml-1">Preview</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto bg-[#111] border-white/10">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Preview Resolution</DialogTitle>
                                  <DialogDescription className="text-white/40">{res.resolutionNumber} - {res.title}</DialogDescription>
                                </DialogHeader>
                                <div className="mt-4 overflow-x-auto">
                                  <div className="flex justify-center">
                                    <div style={{ transform: 'scale(0.82)', transformOrigin: 'top center', width: '794px' }}>
                                      <ResolutionPreview
                                        ref={previewRef}
                                        form={form}
                                        signaturePreview={signaturePreview}
                                        stampPreview={stampPreview}
                                        settingsForm={settingsForm}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end mt-4 gap-2">
                                    <Button onClick={() => generatePDF(res)} disabled={generatingPdf} className="bg-white text-black hover:bg-white/90 font-semibold gap-2">
                                      {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                      Download PDF
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button size="sm" variant="ghost" className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteResolution(res.id)}>
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
              <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-white/60" />
                    Company Details
                  </CardTitle>
                  <CardDescription className="text-white/40">Pre-filled from your GST Registration Certificate (REG-06)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Trade Name</Label>
                      <Input value={settingsForm.companyName} onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Legal Name</Label>
                      <Input value={settingsForm.legalName} onChange={(e) => setSettingsForm({ ...settingsForm, legalName: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">GSTIN</Label>
                      <Input value={settingsForm.gstin} onChange={(e) => setSettingsForm({ ...settingsForm, gstin: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10 font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Constitution</Label>
                      <Input value={settingsForm.constitution} onChange={(e) => setSettingsForm({ ...settingsForm, constitution: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm font-medium">Registered Address</Label>
                    <Textarea value={settingsForm.address} onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10 min-h-[60px] resize-y" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Phone</Label>
                      <Input value={settingsForm.phone} onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Email</Label>
                      <Input value={settingsForm.email} onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })} placeholder="company@email.com" className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Default Signatory</Label>
                      <Input value={settingsForm.authorityName} onChange={(e) => setSettingsForm({ ...settingsForm, authorityName: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm font-medium">Default Designation</Label>
                      <Input value={settingsForm.authorityTitle} onChange={(e) => setSettingsForm({ ...settingsForm, authorityTitle: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-white/25 focus:ring-white/10" />
                    </div>
                  </div>
                  <Button onClick={handleSaveSettings} disabled={saving} className="bg-white text-black hover:bg-white/90 font-semibold w-full mt-2">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Save Settings
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <PenTool className="w-5 h-5 text-white/60" />
                      Upload Signature
                    </CardTitle>
                    <CardDescription className="text-white/40">Upload your authorized signature for all resolutions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {signaturePreview ? (
                      <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-white p-4">
                        <img src={signaturePreview} alt="Signature" className="w-full h-32 object-contain" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <Button size="sm" variant="secondary" onClick={() => signatureInputRef.current?.click()}>Change</Button>
                          <Button size="sm" variant="destructive" onClick={() => { setSignaturePreview(null); setToStorage('black94_signature', null); toast.success('Signature removed'); }}>Remove</Button>
                        </div>
                      </div>
                    ) : (
                      <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver === 'signature' ? 'border-white/40 bg-white/5 scale-[1.02]' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'}`}
                        onClick={() => signatureInputRef.current?.click()}
                        onDragOver={(e) => handleDragOver(e, 'signature')} onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'signature')}>
                        <PenTool className="w-10 h-10 text-white/20 mx-auto mb-3" />
                        <p className="text-sm text-white/40 font-medium">Drop your signature image here</p>
                        <p className="text-xs text-white/25 mt-1">PNG, JPG, WEBP up to 5MB</p>
                      </div>
                    )}
                    <p className="text-[11px] text-white/25 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Recommended: Transparent PNG for best results
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Stamp className="w-5 h-5 text-white/60" />
                      Upload Company Stamp
                    </CardTitle>
                    <CardDescription className="text-white/40">Upload your traditional company stamp</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stampPreview ? (
                      <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-white p-4">
                        <img src={stampPreview} alt="Stamp" className="w-full h-32 object-contain" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <Button size="sm" variant="secondary" onClick={() => stampInputRef.current?.click()}>Change</Button>
                          <Button size="sm" variant="destructive" onClick={() => { setStampPreview(null); setToStorage('black94_stamp', null); toast.success('Stamp removed'); }}>Remove</Button>
                        </div>
                      </div>
                    ) : (
                      <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver === 'stamp' ? 'border-white/40 bg-white/5 scale-[1.02]' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'}`}
                        onClick={() => stampInputRef.current?.click()}
                        onDragOver={(e) => handleDragOver(e, 'stamp')} onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'stamp')}>
                        <Stamp className="w-10 h-10 text-white/20 mx-auto mb-3" />
                        <p className="text-sm text-white/40 font-medium">Drop your company stamp image here</p>
                        <p className="text-xs text-white/25 mt-1">PNG, JPG, WEBP up to 5MB</p>
                      </div>
                    )}
                    <p className="text-[11px] text-white/25 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Recommended: Transparent PNG for authentic appearance
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
              <span className="text-xs text-white/30">&copy; {new Date().getFullYear()} {settingsForm.companyName}. All rights reserved.</span>
            </div>
            <p className="text-[10px] text-white/20">
              {settingsForm.gstin} &middot; {settingsForm.constitution} &middot; Confidential Document Generator
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Resolution Preview Component ---
const ResolutionPreview = React.forwardRef<HTMLDivElement, {
  form: {
    resolutionNumber: string; title: string; date: string; venue: string;
    preamble: string; resolvedText: string; resolvedBy: string; secondedBy: string;
    authorityName: string; authorityTitle: string;
  };
  signaturePreview: string | null;
  stampPreview: string | null;
  settingsForm: CompanySettings;
}>(({ form, signaturePreview, stampPreview, settingsForm }, ref) => {
  const companyName = settingsForm.companyName || 'Black94';
  const legalName = settingsForm.legalName || '';
  const gstin = settingsForm.gstin || '';
  const address = settingsForm.address || '';
  const constitution = settingsForm.constitution || '';

  const formattedDate = form.date ? new Date(form.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  return (
    <div
      ref={ref}
      style={{
        width: '794px',
        minHeight: '1123px',
        background: '#ffffff',
        fontFamily: "'Georgia', 'Times New Roman', 'Palatino Linotype', serif",
        color: '#1a1a1a',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Deep Black Header */}
      <div style={{
        background: '#0a0a0a',
        padding: '20px 56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <img
            src="/black94-logo.png"
            alt={companyName}
            style={{ height: '56px', width: '56px', objectFit: 'contain', borderRadius: '6px' }}
          />
          <div>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              color: '#ffffff',
              margin: 0,
              lineHeight: '1.2',
            }}>
              {companyName}
            </h1>
            {legalName && (
              <p style={{
                fontSize: '9.5px',
                color: '#888888',
                fontStyle: 'italic',
                margin: '3px 0 0 0',
                letterSpacing: '0.5px',
              }}>
                {legalName} ({constitution})
              </p>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {gstin && (
            <p style={{
              fontSize: '9px',
              color: '#bbbbbb',
              margin: '0 0 2px 0',
              letterSpacing: '0.5px',
            }}>
              GSTIN: {gstin}
            </p>
          )}
          {address && (
            <p style={{
              fontSize: '8px',
              color: '#999999',
              margin: 0,
              lineHeight: '1.4',
              maxWidth: '320px',
              textAlign: 'right',
            }}>
              {address}
            </p>
          )}
        </div>
        {/* Gold accent line */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #b8941f 0%, #d4b84a 30%, #f0d678 50%, #d4b84a 70%, #b8941f 100%)',
        }} />
      </div>

      {/* Body Content */}
      <div style={{ padding: '32px 56px 24px 56px' }}>
        {/* Resolution Metadata Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '18px',
          padding: '10px 0',
          borderTop: '1px solid #e0e0e0',
          borderBottom: '1px solid #e0e0e0',
        }}>
          <div>
            <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#999999', fontWeight: 'bold' }}>Resolution No</span>
            <p style={{ fontSize: '11px', fontFamily: "'Courier New', monospace", fontWeight: 'bold', color: '#1a1a1a', margin: '2px 0 0 0' }}>{form.resolutionNumber}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            {form.venue && (
              <>
                <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#999999', fontWeight: 'bold' }}>Venue</span>
                <p style={{ fontSize: '10px', color: '#333333', margin: '2px 0 0 0' }}>{form.venue}</p>
              </>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#999999', fontWeight: 'bold' }}>Date</span>
            <p style={{ fontSize: '10px', color: '#333333', margin: '2px 0 0 0' }}>{formattedDate}</p>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <p style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#1a1a1a',
            margin: 0,
            lineHeight: '1.4',
            textTransform: 'capitalize',
          }}>
            {form.title || 'Board Resolution'}
          </p>
        </div>

        {/* Preamble */}
        {form.preamble && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{
              fontSize: '10.5px',
              lineHeight: '1.7',
              color: '#333333',
              fontStyle: 'italic',
              textAlign: 'justify',
              margin: 0,
            }}>
              {form.preamble}
            </p>
          </div>
        )}

        {/* Resolved Text */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '10.5px',
            lineHeight: '1.7',
            color: '#222222',
            textAlign: 'justify',
          }}>
            <p style={{ margin: 0 }}>{form.resolvedText}</p>
          </div>
        </div>

        {/* Proposed / Seconded By */}
        {(form.resolvedBy || form.secondedBy) && (
          <div style={{
            display: 'flex',
            gap: '48px',
            marginBottom: '24px',
          }}>
            {form.resolvedBy && (
              <div>
                <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#999999', fontWeight: 'bold' }}>Proposed By</span>
                <p style={{ fontSize: '10px', color: '#1a1a1a', margin: '2px 0 0 0', fontWeight: '600' }}>{form.resolvedBy}</p>
              </div>
            )}
            {form.secondedBy && (
              <div>
                <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#999999', fontWeight: 'bold' }}>Seconded By</span>
                <p style={{ fontSize: '10px', color: '#1a1a1a', margin: '2px 0 0 0', fontWeight: '600' }}>{form.secondedBy}</p>
              </div>
            )}
          </div>
        )}

        <div style={{ borderTop: '1px solid #d0d0d0', margin: '8px 0 0 0' }} />

        {/* Signature Block */}
        <div style={{
          marginTop: '48px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}>
          <div style={{ textAlign: 'center', minWidth: '260px' }}>
            {signaturePreview && (
              <div style={{ marginBottom: '6px', minHeight: '70px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <img
                  src={signaturePreview}
                  alt="Authorized Signature"
                  style={{ height: '70px', maxWidth: '220px', width: 'auto', objectFit: 'contain' }}
                />
              </div>
            )}
            <div style={{ borderTop: '1.5px solid #1a1a1a', paddingTop: '8px' }}>
              <p style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                margin: 0,
              }}>
                {form.authorityName || settingsForm.authorityName || '___________________________'}
              </p>
              <p style={{
                fontSize: '9px',
                color: '#555555',
                margin: '2px 0 0 0',
              }}>
                {form.authorityTitle || settingsForm.authorityTitle || 'Authorized Signatory'}
              </p>
              <p style={{
                fontSize: '9px',
                color: '#555555',
                margin: '1px 0 0 0',
              }}>
                {companyName}
              </p>
            </div>
          </div>

          <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
            {stampPreview && (
              <img
                src={stampPreview}
                alt="Company Stamp"
                style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  height: '100px',
                  width: 'auto',
                  objectFit: 'contain',
                  opacity: 0.75,
                  transform: 'rotate(-12deg)',
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom gold bar */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #b8941f 0%, #d4b84a 30%, #f0d678 50%, #d4b84a 70%, #b8941f 100%)',
      }} />
    </div>
  );
});

ResolutionPreview.displayName = 'ResolutionPreview';
