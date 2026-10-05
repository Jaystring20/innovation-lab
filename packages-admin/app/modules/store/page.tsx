'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Package,
  Loader2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import {
  listAllOrders,
  setOrderStatus,
  sendPaymentReceipt,
  sendOrderConfirmation,
  proofUrl,
  naira,
  DIVISION_SHORT,
  STATUS_LABELS,
  FULFILMENT_LABELS,
  type AdminOrder,
  type OrderStatus,
} from '@/lib/store';

const nextActions: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  registered: { to: 'paid', label: 'Mark paid' },
  payment_pending: { to: 'paid', label: 'Confirm payment' },
  paid: { to: 'dispatched', label: 'Mark dispatched' },
};

const badgeCls: Record<string, string> = {
  registered: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  payment_pending: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  paid: 'bg-green-500/15 text-green-600 dark:text-green-400',
  dispatched: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  cancelled: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setOrders(await listAllOrders());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const sum = (f: (o: AdminOrder) => boolean) => orders.filter(f).length;
    const revenue = orders
      .filter((o) => o.status === 'paid' || o.status === 'dispatched')
      .reduce((n, o) => n + Number(o.total_amount), 0);
    return {
      total: orders.length,
      awaiting: sum((o) => o.status === 'registered' || o.status === 'payment_pending'),
      paid: sum((o) => o.status === 'paid'),
      dispatched: sum((o) => o.status === 'dispatched'),
      revenue,
    };
  }, [orders]);

  async function advance(o: AdminOrder, to: OrderStatus) {
    setBusyId(o.id);
    try {
      await setOrderStatus(o.id, to);
      if (to === 'paid') {
        void sendPaymentReceipt(o.order_reference).then((ok) => {
          if (!ok) setError(`Marked paid, but the receipt email to ${o.order_reference} did not send.`);
        });
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function resendConfirmation(o: AdminOrder) {
    setResendingId(o.id);
    setError(null);
    try {
      const ok = await sendOrderConfirmation(o.order_reference);
      if (!ok) setError(`Confirmation email to ${o.order_reference} did not send.`);
      await refresh();
    } finally {
      setResendingId(null);
    }
  }

  async function openProof(path: string) {
    const url = await proofUrl(path);
    if (url) window.open(url, '_blank');
    else setError('Could not generate a link for that proof.');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Store</h1>
          <p className="text-muted-foreground mt-2">Manage school orders, payments, and kit delivery</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Stats */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6">
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Total orders" value={String(stats.total)} />
            <StatCard label="Awaiting review" value={String(stats.awaiting)} />
            <StatCard label="Paid" value={String(stats.paid)} />
            <StatCard label="Dispatched" value={String(stats.dispatched)} />
            <StatCard label="Confirmed revenue" value={naira.format(stats.revenue)} />
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="flex gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading…' : `${orders.length} order(s)`}
          </p>
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 disabled:opacity-50 transition-colors font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Orders Table */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6">
            Orders
          </h2>
          <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                <th className="p-3 font-medium">Reference</th>
                <th className="p-3 font-medium">School</th>
                <th className="p-3 font-medium">Division</th>
                <th className="p-3 font-medium">Teams</th>
                <th className="p-3 font-medium">Fulfilment</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Proof</th>
                <th className="p-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin inline" /> Loading orders…
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              )}
              {orders.map((o) => {
                const action = nextActions[o.status];
                return (
                  <tr key={o.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono text-foreground">{o.order_reference}</td>
                    <td className="p-3">
                      <div className="text-foreground font-medium">{o.schools?.name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.schools?.contact_name} · {o.schools?.contact_email}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{DIVISION_SHORT[o.division]}</td>
                    <td className="p-3 text-muted-foreground">{o.team_count}</td>
                    <td className="p-3 text-muted-foreground">
                      {o.fulfilment ? FULFILMENT_LABELS[o.fulfilment] : '—'}
                      {Number(o.delivery_fee) > 0 && (
                        <span className="block text-xs">+{naira.format(o.delivery_fee)}</span>
                      )}
                    </td>
                    <td className="p-3 text-foreground font-semibold">{naira.format(o.total_amount)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${badgeCls[o.status]}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                      {o.confirmation_sent_at && (
                        <span className="block text-[11px] text-green-600 dark:text-green-400 mt-1">
                          confirmation sent
                        </span>
                      )}
                      {o.receipt_sent_at && (
                        <span className="block text-[11px] text-green-600 dark:text-green-400 mt-1">
                          receipt sent
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        {o.proof_of_payment_url ? (
                          <button
                            onClick={() => openProof(o.proof_of_payment_url!)}
                            className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1.5 items-start">
                        {action && (
                          <button
                            onClick={() => advance(o, action.to)}
                            disabled={busyId === o.id}
                            className="text-xs px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary disabled:opacity-50 transition-colors"
                          >
                            {busyId === o.id ? '…' : action.label}
                          </button>
                        )}
                        <button
                          onClick={() => resendConfirmation(o)}
                          disabled={resendingId === o.id}
                          className="text-xs text-muted-foreground hover:text-primary hover:underline disabled:opacity-50 transition-colors"
                        >
                          {resendingId === o.id
                            ? 'Sending…'
                            : o.confirmation_sent_at
                              ? 'Resend confirmation'
                              : 'Send confirmation'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="group panel p-6 cursor-default hover:bg-surface/80 transition-colors">
    <div className="flex flex-col">
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-2 uppercase tracking-wide">{label}</div>
    </div>
  </div>
);
