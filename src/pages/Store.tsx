import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Loader2, Lock, Package, Truck } from 'lucide-react';
import GlassOrbs from '@/components/GlassOrbs';
import GlassCard from '@/components/GlassCard';
import GlowButton from '@/components/GlowButton';
import {
  listKits,
  getStoreSettings,
  registerOrder,
  sendOrderConfirmation,
  kitPriceFor,
  naira,
  DIVISION_LABELS,
  DISPATCH_NOTES,
  type Fulfilment,
  type Kit,
  type StoreSettings,
} from '@/lib/store';

const inputCls =
  'w-full bg-secondary/50 border border-white/10 rounded-lg py-2.5 px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all';

const Store: React.FC = () => {
  const navigate = useNavigate();
  const [kits, setKits] = useState<Kit[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [division, setDivision] = useState<Kit['division'] | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [fulfilment, setFulfilment] = useState<Fulfilment>('delivery_lagos');
  const [fulfilmentTouched, setFulfilmentTouched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    schoolName: '',
    state: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    teamCount: 1,
  });

  useEffect(() => {
    Promise.all([listKits(), getStoreSettings()])
      .then(([k, s]) => {
        setKits(k);
        setSettings(s);
      })
      .catch((e) => setLoadError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const kit = kits.find((k) => k.division === division) ?? null;

  // Reset the component selection whenever the division changes.
  useEffect(() => {
    setExcluded(new Set());
  }, [division]);

  // Nudge the fulfilment choice from the state field, until the user picks one.
  useEffect(() => {
    if (fulfilmentTouched) return;
    const s = form.state.trim().toLowerCase();
    if (s === 'lagos') setFulfilment('delivery_lagos');
    else if (s.length > 2) setFulfilment('delivery_outside');
  }, [form.state, fulfilmentTouched]);

  const deliveryFee = useMemo(() => {
    if (!settings) return 0;
    if (fulfilment === 'pickup') return 0;
    return fulfilment === 'delivery_lagos'
      ? Number(settings.lagos_delivery_fee)
      : Number(settings.outside_lagos_delivery_fee);
  }, [settings, fulfilment]);

  const perTeam = kit ? kitPriceFor(kit.bom, excluded) : 0;
  const teams = Math.max(1, Number(form.teamCount) || 1);
  const total = perTeam * teams + deliveryFee;

  function toggle(component: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(component)) next.delete(component);
      else next.add(component);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!kit) return setError('Please select your division first.');
    if (!form.schoolName || !form.contactName || !form.contactEmail || !form.contactPhone) {
      return setError('Please fill in all school and contact details.');
    }
    setSubmitting(true);
    try {
      const ref = await registerOrder({
        ...form,
        teamCount: teams,
        division: kit.division,
        fulfilment,
        excludedComponents: [...excluded],
      });
      void sendOrderConfirmation(ref);
      navigate(`/order/${ref}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden">
      <GlassOrbs />
      <div className="relative z-10 max-w-2xl mx-auto px-5 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <header className="mb-8">
          <p className="text-sm font-semibold tracking-wider text-primary">
            APEN 2026 · INNOVATION STORE
          </p>
          <h1 className="text-2xl font-bold text-foreground mt-1">Order your division kit</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Pick your division, choose the components you need, and see your total.
            Registration closes September 25, 2026.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading kits…
          </div>
        ) : loadError ? (
          <GlassCard>
            <p className="text-destructive-foreground text-sm">{loadError}</p>
          </GlassCard>
        ) : (
          <>
            {/* Division picker */}
            <div className="grid gap-3 mb-7">
              {kits.map((k) => {
                const active = division === k.division;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setDivision(k.division)}
                    className={`text-left glass-card p-4 transition-all ${
                      active ? 'border-primary/60 bg-slate-800/60' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex justify-between items-baseline gap-3">
                      <strong className="text-foreground">{DIVISION_LABELS[k.division]}</strong>
                      <span className="font-bold text-primary whitespace-nowrap">
                        {naira.format(k.unit_price)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {k.name} · full kit price
                    </div>
                  </button>
                );
              })}
            </div>

            {kit && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Components */}
                <GlassCard>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Components</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    The controller board is always included so every team builds the same
                    standardized project. Untick anything else you already have.
                  </p>
                  <ul className="divide-y divide-white/5">
                    {kit.bom.map((item) => {
                      const isExcluded = excluded.has(item.component);
                      const line = Number(item.qty) * Number(item.unit_price);
                      return (
                        <li key={item.component} className="py-2.5 flex items-center gap-3">
                          <button
                            type="button"
                            disabled={item.required}
                            onClick={() => toggle(item.component)}
                            aria-pressed={!isExcluded}
                            className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                              item.required
                                ? 'bg-primary/30 border-primary/40 cursor-not-allowed'
                                : isExcluded
                                  ? 'bg-transparent border-white/20 hover:border-white/40'
                                  : 'bg-primary border-primary'
                            }`}
                          >
                            {item.required ? (
                              <Lock className="w-3 h-3 text-primary" />
                            ) : !isExcluded ? (
                              <Check className="w-3.5 h-3.5 text-primary-foreground" />
                            ) : null}
                          </button>
                          <span
                            className={`flex-1 text-sm ${
                              isExcluded ? 'text-muted-foreground line-through' : 'text-foreground'
                            }`}
                          >
                            {item.component}
                            {item.qty > 1 && (
                              <span className="text-muted-foreground"> × {item.qty}</span>
                            )}
                          </span>
                          <span
                            className={`text-sm tabular-nums ${
                              isExcluded ? 'text-muted-foreground/50' : 'text-muted-foreground'
                            }`}
                          >
                            {naira.format(line)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex justify-between pt-3 mt-1 border-t border-white/10 text-sm">
                    <span className="text-muted-foreground">Kit price per team</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {naira.format(perTeam)}
                    </span>
                  </div>
                </GlassCard>

                {/* Fulfilment */}
                <GlassCard>
                  <h2 className="text-lg font-semibold text-foreground mb-3">Delivery</h2>
                  <div className="space-y-2">
                    <FulfilmentOption
                      icon={<Truck className="w-4 h-4" />}
                      label="Delivery within Lagos"
                      hint="Flat fee"
                      price={settings ? Number(settings.lagos_delivery_fee) : 0}
                      selected={fulfilment === 'delivery_lagos'}
                      onSelect={() => {
                        setFulfilment('delivery_lagos');
                        setFulfilmentTouched(true);
                      }}
                    />
                    <FulfilmentOption
                      icon={<Truck className="w-4 h-4" />}
                      label="Delivery outside Lagos"
                      hint="Estimate — APEN confirms by your location"
                      price={settings ? Number(settings.outside_lagos_delivery_fee) : 0}
                      selected={fulfilment === 'delivery_outside'}
                      onSelect={() => {
                        setFulfilment('delivery_outside');
                        setFulfilmentTouched(true);
                      }}
                    />
                    {settings?.pickup_enabled && (
                      <FulfilmentOption
                        icon={<Package className="w-4 h-4" />}
                        label="Pickup — collect in Lagos"
                        hint={settings.pickup_location}
                        price={0}
                        selected={fulfilment === 'pickup'}
                        onSelect={() => {
                          setFulfilment('pickup');
                          setFulfilmentTouched(true);
                        }}
                      />
                    )}
                  </div>
                </GlassCard>

                {/* School details + summary */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">School &amp; contact</h2>

                  <Field label="School name">
                    <input
                      className={inputCls}
                      required
                      value={form.schoolName}
                      onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                    />
                  </Field>
                  <Field label="State">
                    <input
                      className={inputCls}
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="e.g. Lagos"
                    />
                  </Field>
                  <Field label="STEM teacher / contact name">
                    <input
                      className={inputCls}
                      required
                      value={form.contactName}
                      onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    />
                  </Field>
                  <Field label="Contact email">
                    <input
                      className={inputCls}
                      type="email"
                      required
                      value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    />
                  </Field>
                  <Field label="Contact phone">
                    <input
                      className={inputCls}
                      required
                      value={form.contactPhone}
                      onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    />
                  </Field>
                  <Field label="Number of teams (1 kit per team)">
                    <input
                      className={inputCls}
                      type="number"
                      min={1}
                      required
                      value={form.teamCount}
                      onChange={(e) => setForm({ ...form, teamCount: Number(e.target.value) })}
                    />
                  </Field>

                  <GlassCard hover={false} className="space-y-1.5">
                    <SummaryRow
                      label={`Kit × ${teams} team${teams === 1 ? '' : 's'}`}
                      value={naira.format(perTeam * teams)}
                    />
                    <SummaryRow
                      label={
                        fulfilment === 'pickup'
                          ? 'Pickup'
                          : fulfilment === 'delivery_lagos'
                            ? 'Delivery (within Lagos)'
                            : 'Delivery (outside Lagos, estimate)'
                      }
                      value={deliveryFee === 0 ? 'Free' : naira.format(deliveryFee)}
                    />
                    <div className="flex justify-between pt-2 border-t border-white/10 text-lg font-bold text-foreground">
                      <span>Total</span>
                      <span className="tabular-nums">{naira.format(total)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Every registered school receives a kit. Dispatched {DISPATCH_NOTES[fulfilment]}.
                    </p>
                  </GlassCard>

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <GlowButton type="submit" disabled={submitting} className="w-full">
                    {submitting ? 'Submitting…' : 'Register & get payment instructions'}
                  </GlowButton>
                </form>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const FulfilmentOption: React.FC<{
  icon: React.ReactNode;
  label: string;
  hint: string;
  price: number;
  selected: boolean;
  onSelect: () => void;
}> = ({ icon, label, hint, price, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full text-left rounded-lg border-2 p-3 flex items-start gap-3 transition-colors ${
      selected ? 'border-primary/60 bg-primary/10' : 'border-white/10 hover:bg-white/5'
    }`}
  >
    <span className="mt-0.5 text-primary">{icon}</span>
    <span className="flex-1 min-w-0">
      <span className="flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-sm text-foreground tabular-nums whitespace-nowrap">
          {price === 0 ? 'Free' : `+ ${naira.format(price)}`}
        </span>
      </span>
      <span className="block text-xs text-muted-foreground mt-0.5">{hint}</span>
    </span>
  </button>
);

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground tabular-nums">{value}</span>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="grid gap-1.5 text-sm text-muted-foreground">
    {label}
    {children}
  </label>
);

export default Store;
