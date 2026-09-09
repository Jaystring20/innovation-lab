import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, Truck, MessageCircle } from 'lucide-react';
import Backdrop from '@/components/Backdrop';
import Panel from '@/components/Panel';
import GlowButton from '@/components/GlowButton';
import { BANK_DETAILS } from '@/config/bank';
import {
  getOrderStatus,
  submitPaymentProof,
  recoverOrderReferences,
  markWhatsappPinged,
  whatsappPayLink,
  naira,
  DIVISION_LABELS,
  STATUS_LABELS,
  FULFILMENT_LABELS,
  DISPATCH_NOTES,
  WHATSAPP_DISPLAY,
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

  async function handleWhatsapp() {
    if (!order || !reference) return;
    const link = whatsappPayLink(reference, order.total_amount);
    window.open(link, '_blank', 'noopener');
    try {
      await markWhatsappPinged(reference);
      setOrder({ ...order, whatsapp_pinged_at: new Date().toISOString() });
    } catch {
      /* the badge is a nicety — a failed ping flag is not worth surfacing */
    }
  }

  const wrap = 'min-h-screen bg-background relative overflow-hidden';
  const inner = 'relative z-10 max-w-xl mx-auto px-5 py-12';

  // No reference in the URL — show a lookup box.
  if (!reference) {
    return (
      <div className={wrap}>
        <Backdrop />
        <div className={inner}>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-4">Track your order</h1>
          <Panel>
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
                className="w-full bg-secondary/50 border border-border rounded-lg py-2.5 px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <GlowButton type="submit" className="w-full">Look up</GlowButton>
            </form>
          </Panel>

          <Panel className="mt-4">
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
                className="w-full bg-secondary/50 border border-border rounded-lg py-2.5 px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className={wrap}>
      <Backdrop />
      <div className={inner}>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : notFound ? (
          <Panel>
            <p className="text-muted-foreground">
              We couldn&apos;t find an order with reference{' '}
              <strong className="text-foreground">{reference}</strong>.
            </p>
          </Panel>
        ) : order ? (
          <>
            <p className="text-sm font-semibold tracking-wider text-primary">
              APEN 2026 · ORDER STATUS
            </p>
            <h1 className="text-2xl font-bold text-foreground mt-1 mb-6">{reference}</h1>

            <Panel className="mb-4">
              <Row label="Division" value={DIVISION_LABELS[order.division]} />
              <Row label="Teams / kits" value={String(order.team_count)} />
              <Row
                label={`Kit × ${order.team_count}`}
                value={naira.format(Number(order.kit_unit_price) * order.team_count)}
              />
              <Row
                label={
                  order.fulfilment ? FULFILMENT_LABELS[order.fulfilment] : 'Delivery'
                }
                value={
                  Number(order.delivery_fee) === 0
                    ? 'Free'
                    : naira.format(order.delivery_fee)
                }
              />
              <div className="flex justify-between py-2 border-t border-border mt-1 font-bold text-foreground">
                <span>Total</span>
                <span className="tabular-nums">{naira.format(order.total_amount)}</span>
              </div>
              <Row
                label="Status"
                value={
                  <span className={`font-bold ${statusColor[order.status] ?? 'text-foreground'}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                }
              />
            </Panel>

            {order.line_items && order.line_items.length > 0 && (
              <Panel className="mb-4">
                <h2 className="text-base font-semibold text-foreground mb-2">
                  Kit contents (per team)
                </h2>
                <ul className="text-sm divide-y divide-white/5">
                  {order.line_items.map((li) => (
                    <li
                      key={li.component}
                      className={`py-2 flex justify-between gap-3 ${
                        li.included ? 'text-foreground' : 'text-muted-foreground/50 line-through'
                      }`}
                    >
                      <span>
                        {li.component}
                        {li.qty > 1 && <span className="text-muted-foreground"> × {li.qty}</span>}
                      </span>
                      <span className="tabular-nums">
                        {naira.format(Number(li.qty) * Number(li.unit_price))}
                      </span>
                    </li>
                  ))}
                </ul>
                {order.line_items.some((li) => !li.included) && (
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    Struck-through items were not ordered.
                  </p>
                )}
              </Panel>
            )}

            {(order.status === 'registered' || order.status === 'payment_pending') && (
              <Panel>
                <h2 className="text-base font-semibold text-foreground mb-2">
                  Payment instructions
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Transfer <strong className="text-foreground">{naira.format(order.total_amount)}</strong>{' '}
                  to the account below, using{' '}
                  <strong className="text-foreground">{reference}</strong> as your transfer
                  narration.
                </p>

                <div className="bg-surface/30 border border-border rounded-lg p-3 mt-3 text-sm text-muted-foreground space-y-1">
                  <div>Bank: {BANK_DETAILS.name}</div>
                  <div>Account name: {BANK_DETAILS.accountName}</div>
                  <div>Account number: {BANK_DETAILS.accountNumber}</div>
                </div>

                <p className="text-sm text-muted-foreground mt-4 mb-2">
                  Then confirm your payment — either upload your proof here, or send it on
                  WhatsApp to <strong className="text-foreground">{WHATSAPP_DISPLAY}</strong>{' '}
                  quoting <strong className="text-foreground">{reference}</strong>.
                </p>

                <button
                  type="button"
                  onClick={handleWhatsapp}
                  className="inline-flex items-center gap-2 rounded-lg bg-ok px-4 py-2.5 text-sm font-semibold text-white hover:bg-ok/90 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Confirm payment on WhatsApp
                </button>
                {order.whatsapp_pinged_at && (
                  <p className="text-xs text-emerald-400 mt-2">
                    We&apos;ve noted your WhatsApp message — the organizer will confirm shortly.
                  </p>
                )}

                {order.status === 'registered' && (
                  <form onSubmit={handleUpload} className="mt-4 grid gap-3 border-t border-border pt-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Or upload proof here
                    </p>
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
              </Panel>
            )}

            {order.status === 'paid' && (
              <Panel>
                <p className="flex items-start gap-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>
                    Payment confirmed. Every registered school receives a kit — yours is
                    being prepared and will be dispatched{' '}
                    {order.fulfilment ? DISPATCH_NOTES[order.fulfilment] : 'after payment is confirmed'}.
                    A receipt has been emailed to you.
                  </span>
                </p>
              </Panel>
            )}
            {order.status === 'dispatched' && (
              <Panel>
                <p className="flex items-center gap-2 text-sky-400">
                  <Truck className="w-5 h-5" /> Your kit has been dispatched. 🎉
                </p>
              </Panel>
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
