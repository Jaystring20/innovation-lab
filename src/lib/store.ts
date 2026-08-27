import { supabase } from './supabase';

/* ------------------------------------------------------------------ *
 * APEN 2026 Innovation Store — data layer (client-side, RLS-backed)
 * ------------------------------------------------------------------ */

export type Division = 'primary' | 'secondary' | 'sixth_form';

export type OrderStatus =
  | 'registered'
  | 'payment_pending'
  | 'paid'
  | 'dispatched'
  | 'cancelled';

export interface BomItem {
  component: string;
  qty: number;
}

export interface Kit {
  id: string;
  division: Division;
  name: string;
  unit_price: number;
  bom: BomItem[];
  created_at: string;
}

export interface OrderStatusRow {
  order_reference: string;
  division: Division;
  team_count: number;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  paid_at: string | null;
  dispatched_at: string | null;
}

/** Full order row joined with school — organizer view only (RLS gated). */
export interface AdminOrder {
  id: string;
  order_reference: string;
  division: Division;
  team_count: number;
  kit_unit_price: number;
  total_amount: number;
  status: OrderStatus;
  proof_of_payment_url: string | null;
  created_at: string;
  paid_at: string | null;
  dispatched_at: string | null;
  schools: {
    name: string;
    state: string | null;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
  } | null;
}

export const DIVISION_LABELS: Record<Division, string> = {
  primary: 'Primary School (Ages 7–12) — Agriculture',
  secondary: 'Secondary School (Ages 13–16) — Power',
  sixth_form: 'Sixth Form (Ages 16–18) — Security',
};

export const DIVISION_SHORT: Record<Division, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  sixth_form: 'Sixth Form',
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  registered: 'Registered',
  payment_pending: 'Payment Pending Review',
  paid: 'Paid',
  dispatched: 'Kit Dispatched',
  cancelled: 'Cancelled',
};

export const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

/** Short, human-friendly, hard-to-guess order reference. e.g. APEN-7K2QX9 */
export function generateOrderReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `APEN-${code}`;
}

/* ----------------------------- Public ----------------------------- */

export async function listKits(): Promise<Kit[]> {
  const { data, error } = await supabase.from('kits').select('*').order('unit_price');
  if (error) throw new Error(error.message);
  return (data ?? []) as Kit[];
}

export interface RegisterInput {
  schoolName: string;
  state: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  division: Division;
  kitId: string;
  teamCount: number;
}

export async function registerOrder(input: RegisterInput): Promise<string> {
  if (input.teamCount < 1) throw new Error('Team count must be at least 1.');

  // Snapshot the price server-side of trust: re-read the kit, never trust a client price.
  const { data: kit, error: kitError } = await supabase
    .from('kits')
    .select('*')
    .eq('id', input.kitId)
    .single();
  if (kitError || !kit) throw new Error('Kit not found.');

  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .insert({
      name: input.schoolName,
      state: input.state || null,
      contact_name: input.contactName,
      contact_email: input.contactEmail,
      contact_phone: input.contactPhone,
      division: input.division,
    })
    .select()
    .single();
  if (schoolError || !school) throw new Error(schoolError?.message ?? 'Could not register school.');

  const orderReference = generateOrderReference();
  const totalAmount = Number(kit.unit_price) * Number(input.teamCount);

  const { error: orderError } = await supabase.from('orders').insert({
    school_id: school.id,
    kit_id: kit.id,
    division: input.division,
    team_count: input.teamCount,
    kit_unit_price: kit.unit_price,
    total_amount: totalAmount,
    status: 'registered',
    order_reference: orderReference,
  });
  if (orderError) throw new Error(orderError.message);

  return orderReference;
}

export async function getOrderStatus(ref: string): Promise<OrderStatusRow | null> {
  const { data, error } = await supabase.rpc('get_order_status', { ref });
  if (error) throw new Error(error.message);
  if (!data || (data as OrderStatusRow[]).length === 0) return null;
  return (data as OrderStatusRow[])[0];
}

export async function submitPaymentProof(ref: string, file: File): Promise<void> {
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${ref}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('payment-proofs')
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const { error: rpcError } = await supabase.rpc('submit_payment_proof', {
    ref,
    proof_path: path,
  });
  if (rpcError) throw new Error(rpcError.message);
}

/* --------------------------- Organizer --------------------------- */

export async function listAllOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_reference, division, team_count, kit_unit_price, total_amount, status, proof_of_payment_url, created_at, paid_at, dispatched_at, schools ( name, state, contact_name, contact_email, contact_phone )',
    )
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AdminOrder[];
}

export async function setOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === 'paid') patch.paid_at = new Date().toISOString();
  if (status === 'dispatched') patch.dispatched_at = new Date().toISOString();

  const { error } = await supabase.from('orders').update(patch).eq('id', orderId);
  if (error) throw new Error(error.message);
}

/** Signed URL for a stored payment proof (organizers only). */
export async function proofUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(path, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}
