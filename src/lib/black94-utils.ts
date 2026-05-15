// ===== BLACK94 AI CORPORATE OS - Shared Utilities =====

import type { AppData, CompanySettings, BoardResolution, ParsedResolution } from './black94-types';

export const CLOUD_FUNCTION_URL = 'https://aihandler-pjfzlcns3a-el.a.run.app';
export const SYNC_DEBOUNCE_MS = 2000;

// --- LocalStorage Helpers ---
export function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage write failed:', e);
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatShortDate(dateStr);
}

// --- Cloud Sync ---
export async function cloudSyncPush(data: Partial<AppData>): Promise<void> {
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

export async function cloudSyncPull(): Promise<Partial<AppData> | null> {
  try {
    const res = await fetch(`${CLOUD_FUNCTION_URL}/data`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Cloud sync pull failed:', e);
    return null;
  }
}

// --- Default Data ---
export const PDF_COMPANY_DATA: Partial<CompanySettings> = {
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

export const DEFAULT_SETTINGS: CompanySettings = {
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
  website: '',
  tan: '',
};

export function getDefaultAppData(): AppData {
  return {
    resolutions: [],
    settings: DEFAULT_SETTINGS,
    signature: null,
    stamp: null,
    profile: {
      directors: [],
      bankAccounts: [],
      shareholders: [],
      licenses: [],
      products: [],
      keyPersonnel: [],
    },
    memory: [],
    contracts: [],
    policies: [],
    compliance: getDefaultCompliance(),
    approvals: [],
    vendors: [],
    clients: [],
    chatHistory: [],
    timeline: [],
    diligence: getDefaultDiligence(),
    activities: [],
  };
}

export function getDefaultCompliance() {
  const today = new Date();
  const fyEnd = `${today.getFullYear()}-03-31`;
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const quarterlyEnd = new Date(today);
  const qMonth = [3, 6, 9, 12].find(m => m > today.getMonth() + 1) || 12;
  quarterlyEnd.setMonth(qMonth - 1, 30);
  return [
    { id: generateId(), category: 'GST', name: 'GSTR-1 (Monthly)', status: 'compliant' as const, dueDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-11`, lastFiled: `${today.getFullYear()}-${String(today.getMonth()).padStart(2, '0')}-10`, notes: '' },
    { id: generateId(), category: 'GST', name: 'GSTR-3B (Monthly)', status: 'compliant' as const, dueDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-20`, lastFiled: `${today.getFullYear()}-${String(today.getMonth()).padStart(2, '0')}-18`, notes: '' },
    { id: generateId(), category: 'GST', name: 'GSTR-9 (Annual)', status: 'upcoming' as const, dueDate: fyEnd, lastFiled: `${today.getFullYear() - 1}-12-31`, notes: '' },
    { id: generateId(), category: 'TDS', name: 'TDS Return (Quarterly)', status: 'upcoming' as const, dueDate: quarterlyEnd.toISOString().split('T')[0], lastFiled: '', notes: '' },
    { id: generateId(), category: 'Income Tax', name: 'ITR Filing', status: 'upcoming' as const, dueDate: fyEnd, lastFiled: `${today.getFullYear() - 1}-07-31`, notes: '' },
    { id: generateId(), category: 'ROC', name: 'Annual ROC Filing', status: 'upcoming' as const, dueDate: `${today.getFullYear()}-10-30`, lastFiled: `${today.getFullYear() - 1}-10-28`, notes: '' },
    { id: generateId(), category: 'Board', name: 'Board Meeting (Quarterly)', status: 'upcoming' as const, dueDate: quarterlyEnd.toISOString().split('T')[0], lastFiled: '', notes: '' },
    { id: generateId(), category: 'Financial', name: 'Financial Year End', status: 'upcoming' as const, dueDate: fyEnd, lastFiled: '', notes: '' },
  ];
}

export function getDefaultDiligence() {
  return [
    { name: 'Incorporation Documents', documents: [
      { id: generateId(), name: 'Certificate of Incorporation', status: 'missing' as const, description: 'Official certificate of business registration' },
      { id: generateId(), name: 'GST Registration Certificate', status: 'missing' as const, description: 'GST REG-06 certificate' },
      { id: generateId(), name: 'PAN Card (Business)', status: 'missing' as const, description: 'Business PAN card' },
    ]},
    { name: 'Board Resolutions', documents: [
      { id: generateId(), name: 'Bank Account Opening Resolutions', status: 'missing' as const, description: 'All bank account related resolutions' },
      { id: generateId(), name: 'Director Appointment Resolutions', status: 'missing' as const, description: 'Director/partner appointment documents' },
    ]},
    { name: 'Tax Records', documents: [
      { id: generateId(), name: 'GST Returns (Last 3 Years)', status: 'missing' as const, description: 'GSTR-1, GSTR-3B, GSTR-9' },
      { id: generateId(), name: 'Income Tax Returns', status: 'missing' as const, description: 'ITR filings for last 3 years' },
      { id: generateId(), name: 'TDS Certificates', status: 'missing' as const, description: 'Form 16/16A certificates' },
    ]},
    { name: 'Financial Statements', documents: [
      { id: generateId(), name: 'Balance Sheet (Last 3 Years)', status: 'missing' as const, description: 'Audited/unaltered balance sheets' },
      { id: generateId(), name: 'Profit & Loss Statement', status: 'missing' as const, description: 'Annual P&L statements' },
      { id: generateId(), name: 'Bank Statements (Last 12 Months)', status: 'missing' as const, description: 'All bank account statements' },
    ]},
    { name: 'Contracts & Agreements', documents: [
      { id: generateId(), name: 'Vendor Agreements', status: 'missing' as const, description: 'All active vendor contracts' },
      { id: generateId(), name: 'Client Contracts', status: 'missing' as const, description: 'All active client contracts' },
      { id: generateId(), name: 'NDA Agreements', status: 'missing' as const, description: 'Non-disclosure agreements' },
    ]},
    { name: 'Licenses & Registrations', documents: [
      { id: generateId(), name: 'Trade License', status: 'missing' as const, description: 'Local trade/municipal license' },
      { id: generateId(), name: 'Professional Tax Registration', status: 'missing' as const, description: 'PT registration certificate' },
    ]},
    { name: 'Compliance Certificates', documents: [
      { id: generateId(), name: 'ROC Compliance Certificate', status: 'missing' as const, description: 'Annual ROC filing certificate' },
      { id: generateId(), name: 'Tax Clearance Certificate', status: 'missing' as const, description: 'No-dues certificate from tax authorities' },
    ]},
    { name: 'Employee Records', documents: [
      { id: generateId(), name: 'Employee Register', status: 'missing' as const, description: 'Complete employee records' },
      { id: generateId(), name: 'PF/ESI Registration', status: 'missing' as const, description: 'Provident fund & ESI registration' },
    ]},
  ];
}

// --- Password Hash ---
let _computedHash: string | null = null;

export async function getOwnerPasswordHash(): Promise<string> {
  if (_computedHash) return _computedHash;
  const encoder = new TextEncoder();
  const data = encoder.encode('11221122' + 'black94_salt_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  _computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return _computedHash;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'black94_salt_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- AI Call Helpers ---
export async function callAIGeneric(prompt: string, settings?: CompanySettings): Promise<string> {
  const response = await fetch(`${CLOUD_FUNCTION_URL}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'chat',
      description: prompt,
      settings: settings || {},
    }),
  });
  if (!response.ok) throw new Error('AI service error');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.content || data.resolvedText || data.text || JSON.stringify(data);
}

export async function callAIResolution(input: string, settings: CompanySettings): Promise<ParsedResolution> {
  try {
    const response = await fetch(`${CLOUD_FUNCTION_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: input, settings }),
    });
    if (!response.ok) throw new Error(`Server error ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
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

export function smartParseDescription(input: string, settings: CompanySettings): ParsedResolution {
  const text = input.trim();
  const result: ParsedResolution = {
    title: '', preamble: '', resolvedText: '',
    venue: `Registered Office, ${settings.district}`,
    resolvedBy: '', secondedBy: '',
    authorityName: settings.authorityName,
    authorityTitle: settings.authorityTitle,
  };
  const proposedMatch = text.match(/(?:proposed\s*by|proposer)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
  const secondedMatch = text.match(/(?:seconded\s*by|seconder)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
  if (proposedMatch) result.resolvedBy = proposedMatch[1].trim();
  if (secondedMatch) result.secondedBy = secondedMatch[1].trim();

  let cleanText = text
    .replace(/(?:proposed\s*by|proposer)[:\s]+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/gi, '')
    .replace(/(?:seconded\s*by|seconder)[:\s]+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/gi, '')
    .replace(/(?:resolution\s*(?:for|regarding|to|about)\s*[:\-]?\s*)/gi, '')
    .trim();

  const lines = cleanText.split(/[.\n]+/).map(l => l.trim()).filter(l => l.length > 5);
  if (lines.length === 0) { result.title = 'Board Resolution'; result.resolvedText = text.trim(); return result; }

  result.title = lines[0]
    .replace(/^(?:the\s+)?(?:board\s+(?:hereby\s+)?)?(?:hereby\s+)?(?:it\s+is\s+)?/i, '')
    .replace(/^(?:we\s+(?:want\s+to|need\s+to|should|shall)\s+)/i, '')
    .replace(/^(?:i\s+(?:want|need)\s+to\s+)/i, '')
    .replace(/^(?:please|kindly)\s+/i, '')
    .trim();
  result.title = result.title.split(/\s+/).map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()).join(' ');

  const titleLower = result.title.toLowerCase();
  if (/bank\s*account|current\s*account/.test(titleLower)) {
    result.preamble = `WHEREAS, the ${settings.companyName} requires a bank account for its day-to-day business operations and financial transactions;`;
  } else if (/appointment|appoint/.test(titleLower)) {
    result.preamble = `WHEREAS, it is considered necessary to appoint a suitable person for the efficient management of ${settings.companyName};`;
  } else {
    result.preamble = `WHEREAS, it is considered necessary and in the best interest of ${settings.companyName} to undertake the said action;`;
  }

  const bodyLines = lines.slice(1).filter(l => l.trim().length > 5);
  const fullBody = bodyLines.length > 0 ? bodyLines.join('. ').trim() : '';
  if (fullBody.length > 0) {
    result.resolvedText = `RESOLVED THAT, the Board of ${settings.companyName} hereby approves and authorizes ${fullBody}.`;
  } else {
    result.resolvedText = `RESOLVED THAT, the Board of ${settings.companyName} hereby approves and authorizes the ${result.title.toLowerCase()} as described herein.`;
  }
  return result;
}

export function generateResolutionNumber(existingResolutions: BoardResolution[]): string {
  const now = new Date();
  const prefix = `BLK94/${now.getFullYear()}-${(now.getFullYear() + 1).toString().slice(2)}`;
  let count = 1;
  if (existingResolutions.length > 0) {
    const match = existingResolutions[0].resolutionNumber?.match(/\/(\d+)$/);
    if (match) count = parseInt(match[1]) + 1;
  }
  return `${prefix}/${count.toString().padStart(3, '0')}`;
}

// Resolution categories
export const RESOLUTION_CATEGORIES = ['Banking', 'Tax', 'Legal', 'Operational', 'HR', 'Fundraising', 'General'];
export const RESOLUTION_TEMPLATES = [
  { title: 'Bank Account Opening', category: 'Banking', desc: 'Open a current/savings bank account' },
  { title: 'Director Appointment', category: 'Legal', desc: 'Appoint a new director/partner' },
  { title: 'Annual Budget Approval', category: 'Financial', desc: 'Approve annual financial budget' },
  { title: 'Share Allotment', category: 'Fundraising', desc: 'Allot shares to investors' },
  { title: 'Loan Authorization', category: 'Banking', desc: 'Authorize a business loan' },
  { title: 'Vendor Agreement Approval', category: 'Operational', desc: 'Approve vendor agreement' },
];

export const NDA_TYPES = ['Employee NDA', 'Client NDA', 'Vendor NDA', 'Mutual NDA', 'Startup Confidentiality Agreement', 'Consultant NDA'];
export const CONTRACT_TYPES = ['Service Agreement', 'Vendor Agreement', 'Employment Contract', 'Consultancy Agreement', 'Partnership Agreement'];
export const POLICY_TYPES = ['HR Policy', 'Leave Policy', 'Privacy Policy', 'IT Policy', 'Social Media Policy', 'Employee Handbook', 'Sexual Harassment Policy', 'Work From Home Policy', 'Travel & Expense Policy', 'Code of Conduct'];
export const MEMORY_CATEGORIES = ['Board Decision', 'Meeting Notes', 'Contract Notes', 'Vendor Discussions', 'Investor Conversations', 'Policy Decisions', 'Historical Changes', 'General Notes'];
