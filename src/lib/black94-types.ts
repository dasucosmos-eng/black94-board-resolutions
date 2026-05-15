// ===== BLACK94 AI CORPORATE OS - Type Definitions =====

export interface CompanySettings {
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
  website: string;
  tan: string;
}

export interface BoardResolution {
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
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProfile {
  directors: Director[];
  bankAccounts: BankAccount[];
  shareholders: Shareholder[];
  licenses: License[];
  products: Product[];
  keyPersonnel: KeyPersonnel[];
}

export interface Director {
  id: string;
  name: string;
  designation: string;
  din: string;
  pan: string;
  appointmentDate: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  ifsc: string;
  type: 'Current' | 'Savings';
}

export interface Shareholder {
  id: string;
  name: string;
  sharesHeld: number;
  percentage: number;
  type: 'Founder' | 'Employee' | 'Investor';
}

export interface License {
  id: string;
  type: string;
  number: string;
  expiryDate: string;
  issuingAuthority: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface KeyPersonnel {
  id: string;
  name: string;
  role: string;
  department: string;
  contact: string;
}

export interface MemoryEntry {
  id: string;
  title: string;
  category: string;
  content: string;
  date: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type MemoryCategory = 'Board Decision' | 'Meeting Notes' | 'Contract Notes' | 'Vendor Discussions' | 'Investor Conversations' | 'Policy Decisions' | 'Historical Changes' | 'General Notes';

export interface Contract {
  id: string;
  type: 'NDA' | 'Service Agreement' | 'Vendor Agreement' | 'Employment Contract' | 'Consultancy Agreement' | 'Partnership Agreement';
  subtype: string;
  party1: string;
  party2: string;
  title: string;
  content: string;
  tags: string[];
  renewalDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Policy {
  id: string;
  type: string;
  title: string;
  content: string;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceItem {
  id: string;
  category: string;
  name: string;
  status: 'compliant' | 'overdue' | 'upcoming' | 'due-soon';
  dueDate: string;
  lastFiled: string;
  notes: string;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  amount: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  department: string;
  requiredApprover: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  contractDetails: string;
  startDate: string;
  endDate: string;
  paymentTerms: string;
  creditLimit: number;
  status: 'Active' | 'Inactive';
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  contactPerson: string;
  phone: string;
  email: string;
  contractValue: number;
  startDate: string;
  endDate: string;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  outstandingAmount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  createdAt: string;
}

export interface DueDiligenceCategory {
  name: string;
  documents: DueDiligenceDoc[];
}

export interface DueDiligenceDoc {
  id: string;
  name: string;
  status: 'uploaded' | 'missing';
  description: string;
}

export interface ActivityEntry {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  category: string;
}

export type AppPage = 'dashboard' | 'resolutions' | 'profile' | 'memory' | 'contracts' | 'policies' | 'compliance' | 'fundraising' | 'approvals' | 'vendors' | 'chat' | 'reports' | 'timeline' | 'diligence' | 'settings';

export interface AppData {
  resolutions: BoardResolution[];
  settings: CompanySettings;
  signature: string | null;
  stamp: string | null;
  profile: BusinessProfile;
  memory: MemoryEntry[];
  contracts: Contract[];
  policies: Policy[];
  compliance: ComplianceItem[];
  approvals: ApprovalRequest[];
  vendors: Vendor[];
  clients: Client[];
  chatHistory: ChatMessage[];
  timeline: TimelineEvent[];
  diligence: DueDiligenceCategory[];
  activities: ActivityEntry[];
}
