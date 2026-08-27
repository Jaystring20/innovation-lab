import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, Truck } from 'lucide-react';
import GlassOrbs from '@/components/GlassOrbs';
import GlassCard from '@/components/GlassCard';
import GlowButton from '@/components/GlowButton';
import { BANK_DETAILS } from '@/lib/supabase';
import {
  getOrderStatus,
  submitPaymentProof,
  recoverOrderReferences,
  naira,
  DIVISION_LABELS,
  STATUS_LABELS,
  type OrderStatusRow,
} from '@/lib/store';

const statusColor: Record<string, string> = {
  registered: 'text-amber-400',
  payment_pending: 'text-amber-400',
  paid: 'text-emerald-400',
  dispatched: 'text-sky-400',
  cancelled: 'text-red-400',
};

const OrderStatus: React.FC = () => {
  const { reference } = useParams();
  const navigate = useNavigate();
  const [lookup, setLookup] = useState('');
  const [order, setOrder] = useState<OrderStatusRow | null>(null);
  const [loading, setLoading] = useState(!!reference);
  const [notFound, setNotFound] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [recoverMsg, setRecoverMsg] = useState<string | null>(null);

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault();
    setRecovering(true);
    setRecoverMsg(null);
    try {
      await recoverOrderReferences(recoverEmail.trim());
      // Phrased so it reveals nothing about whether the address is registered.
      setRecoverMsg(
        'If that address has any APEN 2026 orders, we have emailed the reference numbers to it.',
      );
      setRecoverEmail('');
    } catch (err) {
      setRecoverMsg((err as Error).message);
    } finally {
      setRecovering(false);
    }
  }

  async function load(ref: string) {
    setLoading(true);
    setNotFound(false);
    try {
      const row = await getOrderStatus(ref);
      if (!row) setNotFound(true);
      else setOrder(row);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (reference) load(reference);
  }, [reference]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !reference) return;
    setUploading(true);
    setMsg(null);
    try {
      await submitPaymentProof(reference, file);
      setMsg("Proof received. We'll confirm your payment shortly.");
      load(reference);
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const wrap = 'min-h-screen bg-[#020617] relative overflow-hidden';
  const inner = 'relative z-10 max-w-xl mx-auto px-5 py-12';

  // No reference in the URL — show a lookup box.
  if (!reference) {
    return (
      <div className={wrap}>
        <GlassOrbs />
        <div className={inner}>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-4">Track your order</h1>
          <GlassCard>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (lookup.trim()) navigate(`/order/${lookup.trim().toUpperCase()}`);
              }}
              className="grid gap-3"
            >
              <input
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
                placeholder="APEN-XXXXXX"
                className="w-full bg-secondary/50 border border-white/10 rounded-lg py-2.5 px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <GlowButton type="submit" className="w-full">Look up</GlowButton>
            </form>
          </GlassCard>

          <GlassCard className="mt-4">
            <h2 className="text-base font-semibold text-foreground mb-1">
              Lost your reference?
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              Enter the email you registered with and we&apos;ll send your reference
              number to it.
            </p>
            <form onSubmit={handleRecover} className="grid gap-3">
              <input
                type="email"
                required
                value={recoverEmail}
                onChange={(e) => setRecoverEmail(e.target.value)}
                placeholder="you@school.edu.ng"
                className="w-full bg-secondary/50 border border-white/10 rounded-lg py-2.5 px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <GlowButton
                type="submit"
                variant="secondary"
                size="sm"
                disabled={recovering}
                className="w-full"
              >
                {recovering ? 'Sending…' : 'Email me my reference'}
              </GlowButton>
              {recoverMsg && (
                <p className="text-sm text-muted-foreground">{recoverMsg}</p>
              )}
            </form>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className={wrap}>
      <GlassOrbs />
      <div className={inner}>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : notFound ? (
          <GlassCard>
            <p className="text-muted-foreground">
              We couldn&apos;t find an order with reference{' '}
              <strong className="text-foreground">{reference}</strong>.
            </p>
          </GlassCard>
        ) : order ? (
          <>
            <p className="text-sm font-semibold tracking-wider text-primary">
              APEN 2026 · ORDER STATUS
            </p>
            <h1 className="text-2xl font-bold text-foreground mt-1 mb-6">{reference}</h1>

            <GlassCard className="mb-4">
              <Row label="Division" value={DIVISION_LABELS[order.division]} />
              <Row label="Teams / kits" value={String(order.team_count)} />
              <Row label="Total" value={naira.format(order.total_amount)} />
              <Row
                label="Status"
                value={
                  <span className={`font-bold ${statusColor[order.status] ?? 'text-foreground'}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                }
              />
            </GlassCard>

            {(order.status === 'registered' || order.status === 'payment_pending') && (
              <GlassCard>
                <h2 className="text-base font-semibold text-foreground mb-2">
                  Payment instructions
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Transfer <strong className="text-foreground">{naira.format(order.total_amount)}</strong>{' '}
                  to the account below, using{' '}
                  <strong className="text-foreground">{reference}</strong> as your transfer
                  narration, then upload your proof of payment.
                </p>

                <div className="bg-white/5 border border-white/10 rounded-lg p-3 mt-3 text-sm text-muted-foreground space-y-1">
                  <div>Bank: {BANK_DETAILS.name}</div>
                  <div>Account name: {BANK_DETAILS.accountName}</div>
                  <div>Account number: {BANK_DETAILS.accountNumber}</div>
                </div>

                {order.status === 'registered' && (
                  <form onSubmit={handleUpload} className="mt-4 grid gap-3">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      required
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:font-medium"
                    />
                    <GlowButton type="submit" disabled={uploading} size="sm" className="w-fit">
                      {uploading ? 'Uploading…' : 'Upload proof of payment'}
                    </GlowButton>
                    {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
                  </form>
                )}
                {order.status === 'payment_pending' && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Proof of payment received — awaiting organizer confirmation.
                  </p>
                )}
              </GlassCard>
            )}

            {order.status === 'paid' && (
              <GlassCard>
                <p className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  Payment confirmed. Your kit ships in the dispatch window (Sep 14–30, 2026).
                </p>
              </GlassCard>
            )}
            {order.status === 'dispatched' && (
              <GlassCard>
                <p className="flex items-center gap-2 text-sky-400">
                  <Truck className="w-5 h-5" /> Your kit has been dispatched. 🎉
                </p>
              </GlassCard>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between py-1.5 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground text-right">{value}</span>
  </div>
);

export default OrderStatus;
