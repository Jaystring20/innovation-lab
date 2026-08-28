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
  unit_price: number;
  required: boolean;
}

/** A line on an order — the component snapshot at the time it was placed. */
export interface OrderLineItem {
  component: string;
  qty: number;
  unit_price: number;
  included: boolean;
}

export type Fulfilment = 'delivery_lagos' | 'delivery_outside' | 'pickup';

export interface Kit {
  id: string;
  division: Division;
  name: string;
  unit_price: number;
  bom: BomItem[];
  created_at: string;
}

export interface StoreSettings {
  lagos_delivery_fee: number;
  outside_lagos_delivery_fee: number;
  pickup_enabled: boolean;
  pickup_location: string;
}

export interface OrderStatusRow {
  order_reference: string;
  division: Division;
  team_count: number;
  kit_unit_price: number;
  delivery_fee: number;
  total_amount: number;
  fulfilment: Fulfilment | null;
  line_items: OrderLineItem[] | null;
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
  delivery_fee: number;
  fulfilment: Fulfilment | null;
  line_items: OrderLineItem[] | null;
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

export const FULFILMENT_LABELS: Record<Fulfilment, string> = {
  delivery_lagos: 'Delivery within Lagos',
  delivery_outside: 'Delivery outside Lagos',
  pickup: 'Pickup (collect in Lagos)',
};

/** Per-team kit price for a given exclusion set — mirrors the Edge Function. */
export function kitPriceFor(bom: BomItem[], excluded: Set<string>): number {
  return bom
    .filter((item) => item.required || !excluded.has(item.component))
    .reduce((sum, item) => sum + Number(item.qty) * Number(item.unit_price), 0);
}

export const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

// Order references are minted server-side in the register-order Edge Function
// using crypto.getRandomValues(). They used to be generated here with
// Math.random(), which is a recoverable PRNG and the wrong primitive for a
// value that authenticates order lookup and proof-of-payment submission.

/* ----------------------------- Public ----------------------------- */

export async function listKits(): Promise<Kit[]> {
  const { data, error } = await supabase.from('kits').select('*').order('unit_price');
  if (error) throw new Error(error.message);
  return (data ?? []) as Kit[];
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase
    .from('store_settings')
    .select('lagos_delivery_fee, outside_lagos_delivery_fee, pickup_enabled, pickup_location')
    .eq('id', 1)
    .single();
  if (error) throw new Error(error.message);
  return data as StoreSettings;
}

export interface RegisterInput {
  schoolName: string;
  state: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  division: Division;
  teamCount: number;
  fulfilment: Fulfilment;
  /** Optional components the school chose not to buy (by exact component name). */
  excludedComponents: string[];
}

/**
 * Registers a school and creates its order.
 *
 * All of this runs in the register-order Edge Function under the service role.
 * The browser has no write access to `schools` or `orders` any more: it used to,
 * and that let anyone holding the publishable key POST an order already marked
 * paid and dispatched. Status, price and reference are decided server-side and
 * are not accepted from here.
 */
export async function registerOrder(input: RegisterInput): Promise<string> {
  const { data, error } = await supabase.functions.invoke('register-order', {
    body: input,
  });

  // A non-2xx from the function carries the user-facing reason in its body;
  // surface that rather than the generic "Edge Function returned a non-2xx".
  if (error) {
    const detail = await readFunctionError(error);
    throw new Error(detail ?? 'Could not complete your registration. Please try again.');
  }
  if (!data?.orderReference) {
    throw new Error('Could not complete your registration. Please try again.');
  }
  return data.orderReference as string;
}

/** Pulls the `error` message out of a FunctionsHttpError response body. */
async function readFunctionError(error: unknown): Promise<string | null> {
  try {
    const res = (error as { context?: Response }).context;
    if (res && typeof res.json === 'function') {
      const body = await res.json();
      if (typeof body?.error === 'string') return body.error;
    }
  } catch {
    // fall through to the generic message
  }
  return null;
}

/**
 * Emails the school its reference and payment instructions.
 *
 * Never throws. A failed send must not cost a school its registration — the
 * order already exists and the reference is on screen either way, so this
 * reports to the console and moves on.
 */
export async function sendOrderConfirmation(ref: string): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('send-order-confirmation', {
      body: { orderReference: ref },
    });
    if (error) {
      console.error('Confirmation email failed:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Confirmation email failed:', e);
    return false;
  }
}

/**
 * Emails every reference registered against an address.
 *
 * Resolves the same way whether or not the address has orders — the server
 * refuses to disclose that, so the UI must not imply it either.
 */
export async function recoverOrderReferences(email: string): Promise<void> {
  const { error } = await supabase.functions.invoke('recover-order-references', {
    body: { email },
  });
  if (error) throw new Error('Could not send the recovery email. Please try again.');
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
      'id, order_reference, division, team_count, kit_unit_price, delivery_fee, fulfilment, line_items, total_amount, status, proof_of_payment_url, created_at, paid_at, dispatched_at, schools ( name, state, contact_name, contact_email, contact_phone )',
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
