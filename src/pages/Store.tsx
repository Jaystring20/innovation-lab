import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Loader2, Lock, Package, Truck } from 'lucide-react';
import Backdrop from '@/components/Backdrop';
import Panel from '@/components/Panel';
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
  'w-full bg-secondary/50 border border-border rounded-lg py-2.5 px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all';

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
    address: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    teamCount: 1,
    teacherName: '',
    teacherEmail: '',
  });
  const [teams, setTeams] = useState<Array<{ name: string; students: string[] }>>([
    { name: '', students: ['', '', '', ''] },
  ]);

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

    // Validation
    if (!kit) return setError('Please select your division first.');
    if (!form.schoolName || !form.address || !form.contactName || !form.contactEmail || !form.contactPhone) {
      return setError('Please fill in all school, address, and contact details.');
    }
    if (!form.teacherName || !form.teacherEmail) {
      return setError('Please provide teacher name and email.');
    }

    // Validate teams
    const validTeams = teams.filter(t => t.name.trim());
    if (validTeams.length === 0) {
      return setError('Please create at least one team.');
    }
    for (const team of validTeams) {
      const validStudents = team.students.filter(s => s.trim());
      if (validStudents.length === 0) {
        return setError(`Team "${team.name}" needs at least one student name.`);
      }
    }

    setSubmitting(true);
    try {
      const ref = await registerOrder({
        ...form,
        teamCount: validTeams.length,
        division: kit.division,
        fulfilment,
        excludedComponents: [...excluded],
        teams: validTeams,
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Backdrop />
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
          <Panel>
            <p className="text-destructive-foreground text-sm">{loadError}</p>
          </Panel>
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
                <Panel>
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
                                  ? 'bg-transparent border-border/50 hover:border-border'
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
                  <div className="flex justify-between pt-3 mt-1 border-t border-border text-sm">
                    <span className="text-muted-foreground">Kit price per team</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {naira.format(perTeam)}
                    </span>
                  </div>
                </Panel>

                {/* Fulfilment */}
                <Panel>
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
                </Panel>

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
                  <Field label="Full delivery address">
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={3}
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Street address, building, landmark&#10;City/Town&#10;Postal code (if applicable)"
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

                  {/* Teacher Information */}
                  <div className="border-t border-border pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-foreground mb-3">Primary Teacher</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This teacher will set up the teams and students. An account will be created automatically.
                    </p>
                    <Field label="Teacher name">
                      <input
                        className={inputCls}
                        required
                        value={form.teacherName}
                        onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                        placeholder="Full name"
                      />
                    </Field>
                    <Field label="Teacher email">
                      <input
                        className={inputCls}
                        type="email"
                        required
                        value={form.teacherEmail}
                        onChange={(e) => setForm({ ...form, teacherEmail: e.target.value })}
                        placeholder="teacher@school.edu.ng"
                      />
                    </Field>
                  </div>

                  {/* Teams & Students */}
                  <div className="border-t border-border pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-foreground mb-3">Teams & Students</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Each team gets one kit. All students on a team share one login account for collaboration.
                    </p>
                    <div className="space-y-4">
                      {teams.map((team, teamIdx) => (
                        <Panel key={teamIdx} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Field label={`Team ${teamIdx + 1} name`}>
                              <input
                                className={inputCls}
                                placeholder="e.g., Innovation Builders"
                                value={team.name}
                                onChange={(e) => {
                                  const newTeams = [...teams];
                                  newTeams[teamIdx].name = e.target.value;
                                  setTeams(newTeams);
                                }}
                              />
                            </Field>
                            {teams.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setTeams(teams.filter((_, i) => i !== teamIdx))}
                                className="text-sm text-danger hover:text-danger/80 ml-2 mt-6"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Student names (all share one account)</p>
                            <div className="space-y-2">
                              {team.students.map((student, studentIdx) => (
                                <input
                                  key={studentIdx}
                                  className={inputCls}
                                  placeholder={`Student ${studentIdx + 1}`}
                                  value={student}
                                  onChange={(e) => {
                                    const newTeams = [...teams];
                                    newTeams[teamIdx].students[studentIdx] = e.target.value;
                                    setTeams(newTeams);
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </Panel>
                      ))}
                      <GlowButton
                        type="button"
                        variant="outline"
                        onClick={() => setTeams([...teams, { name: '', students: ['', '', '', ''] }])}
                        className="w-full"
                      >
                        + Add another team
                      </GlowButton>
                    </div>
                  </div>

                  <Panel hover={false} className="space-y-1.5">
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
                    <div className="flex justify-between pt-2 border-t border-border text-lg font-bold text-foreground">
                      <span>Total</span>
                      <span className="tabular-nums">{naira.format(total)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Every registered school receives a kit. Dispatched {DISPATCH_NOTES[fulfilment]}.
                    </p>
                  </Panel>

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
      selected ? 'border-primary/60 bg-primary/10' : 'border-border hover:bg-surface/30'
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
