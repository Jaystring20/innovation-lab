import { supabase } from '@/integrations/supabase/client';

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

export interface OrderLineItem {
  component: string;
  qty: number;
  unit_price: number;
  included: boolean;
}

export type Fulfilment = 'delivery_lagos' | 'delivery_outside' | 'pickup' | 'none';

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
  whatsapp_pinged_at: string | null;
  receipt_sent_at: string | null;
  confirmation_sent_at: string | null;
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
  none: 'No kit (lab access only)',
};

export const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

/* ----------------------------- Organizer ----------------------------- */

export async function listAllOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_reference, division, team_count, kit_unit_price, delivery_fee, fulfilment, line_items, total_amount, status, proof_of_payment_url, created_at, paid_at, dispatched_at, whatsapp_pinged_at, receipt_sent_at, confirmation_sent_at, schools ( name, state, contact_name, contact_email, contact_phone )'
    )
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AdminOrder[];
}

export async function setOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === 'paid') patch.paid_at = new Date().toISOString();
  if (status === 'dispatched') patch.dispatched_at = new Date().toISOString();

  const { error } = await supabase.from('orders').update(patch).eq('id', orderId);
  if (error) throw new Error(error.message);
}

export async function sendPaymentReceipt(orderReference: string): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('send-payment-receipt', {
      body: { orderReference },
    });
    if (error) {
      console.error('Receipt email failed:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Receipt email failed:', e);
    return false;
  }
}

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

export async function proofUrl(path: string): Promise<string | null> {
  try {
    const { data } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  } catch (e) {
    console.error('Could not generate proof URL:', e);
    return null;
  }
}
