/**
 * Business Zones types and pricing constants
 */

// ============ Zone Plan Pricing ============

export type PlanCycle = 'monthly' | 'yearly';

export interface ZonePlan {
  code: string;
  memberLimit: number;
  monthlyPrice: number; // KZT
  yearlyPrice: number;  // KZT (full year)
}

export const ZONE_PLANS: ZonePlan[] = [
  { code: 'business_5', memberLimit: 5, monthlyPrice: 3045, yearlyPrice: 36540 },
  { code: 'business_50', memberLimit: 50, monthlyPrice: 15225, yearlyPrice: 182700 },
  { code: 'business_100', memberLimit: 100, monthlyPrice: 38080, yearlyPrice: 297000 },
  { code: 'business_300', memberLimit: 300, monthlyPrice: 76125, yearlyPrice: 548100 },
  { code: 'business_700', memberLimit: 700, monthlyPrice: 121800, yearlyPrice: 913500 },
  { code: 'business_1000', memberLimit: 1000, monthlyPrice: 152250, yearlyPrice: 1169280 },
  { code: 'business_unl', memberLimit: 999999, monthlyPrice: 182700, yearlyPrice: 1461600 },
];

export function getPlanCode(baseCode: string, cycle: PlanCycle): string {
  return `${baseCode}_${cycle === 'monthly' ? 'm' : 'y'}`;
}

export function getPlanByCode(planCode: string): ZonePlan | undefined {
  const base = planCode.replace(/_[my]$/, '');
  return ZONE_PLANS.find(p => p.code === base);
}

export function getMemberLimitFromPlan(planCode: string): number {
  const plan = getPlanByCode(planCode);
  return plan?.memberLimit ?? 5;
}

// ============ Zone Types ============

export type ZonePlanStatus = 'active' | 'past_due' | 'canceled' | 'grace' | 'locked';
export type ZoneMemberRole = 'owner' | 'admin' | 'member' | 'viewer';
export type ZoneMemberStatus = 'active' | 'suspended';
export type ZoneInviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';
export type DealStatus = 'open' | 'won' | 'lost';
export type InvoiceStatus = 'created' | 'paid' | 'failed' | 'expired';
export type ConversationStatus = 'open' | 'closed' | 'archived';
export type MessageDirection = 'inbound' | 'outbound';

export interface Zone {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_user_id: string;
  plan_code: string;
  plan_cycle: PlanCycle;
  plan_status: ZonePlanStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  grace_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface ZoneMember {
  id: string;
  zone_id: string;
  user_id: string;
  role: ZoneMemberRole;
  status: ZoneMemberStatus;
  joined_at: string;
  // Joined from user_profiles
  display_name?: string;
  avatar_url?: string;
  email?: string;
}

export interface ZoneInvite {
  id: string;
  zone_id: string;
  email: string;
  role: ZoneMemberRole;
  token: string;
  status: ZoneInviteStatus;
  expires_at: string;
  created_by: string;
  created_at: string;
}

export interface ZoneContact {
  id: string;
  zone_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  telegram_user_id: string | null;
  telegram_username: string | null;
  tags: string[];
  owner_user_id: string | null;
  // CRM fields
  company: string | null;
  position: string | null;
  address: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ContactNoteType = 'note' | 'call' | 'email' | 'meeting' | 'task';

export interface ZoneContactNote {
  id: string;
  zone_id: string;
  contact_id: string;
  type: ContactNoteType;
  content: string;
  created_by: string;
  created_at: string;
}

export interface ZoneDealStage {
  id: string;
  zone_id: string;
  name: string;
  color: string;
  order_index: number;
  is_default: boolean;
}

export interface ZoneDeal {
  id: string;
  zone_id: string;
  contact_id: string | null;
  title: string;
  stage_id: string | null;
  value_amount: number;
  currency: string;
  next_step: string | null;
  next_step_at: string | null;
  assigned_to: string | null;
  status: DealStatus;
  lost_reason: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  contact?: ZoneContact;
  stage?: ZoneDealStage;
  products?: ZoneDealProduct[];
}

export interface ZoneDealActivity {
  id: string;
  deal_id: string;
  zone_id: string;
  type: string;
  summary: string;
  happened_at: string;
  created_by: string;
  created_at: string;
}

export interface ZoneProduct {
  id: string;
  zone_id: string;
  name: string;
  description: string | null;
  unit_price: number;
  currency: string;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ZoneDealProduct {
  id: string;
  deal_id: string;
  zone_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface ZoneInvoice {
  id: string;
  zone_id: string;
  deal_id: string | null;
  contact_id: string | null;
  amount: number;
  currency: string;
  description: string | null;
  status: InvoiceStatus;
  invoice_number: number | null;
  robokassa_invoice_id: string | null;
  pay_url: string | null;
  created_at: string;
  paid_at: string | null;
  // Joined
  items?: ZoneInvoiceItem[];
  contact?: ZoneContact;
}

export interface ZoneInvoiceItem {
  id: string;
  invoice_id: string;
  zone_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ZoneTask {
  id: string;
  zone_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  contact_id: string | null;
  deal_id: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  // Joined
  contact?: ZoneContact;
  deal?: ZoneDeal;
  checklist?: ZoneTaskChecklistItem[];
}

export interface ZoneTaskChecklistItem {
  id: string;
  task_id: string;
  zone_id: string;
  title: string;
  is_done: boolean;
  order_index: number;
  created_at: string;
}

// ============ Zone Context ============

export interface ZoneContextValue {
  currentZone: Zone | null;
  zones: Zone[];
  loading: boolean;
  setCurrentZone: (zone: Zone) => void;
  isReadOnly: boolean; // true if zone is grace/locked
  myRole: ZoneMemberRole | null;
}
