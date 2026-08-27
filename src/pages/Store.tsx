import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import GlassOrbs from '@/components/GlassOrbs';
import GlassCard from '@/components/GlassCard';
import GlowButton from '@/components/GlowButton';
import { listKits, registerOrder, naira, DIVISION_LABELS, type Kit } from '@/lib/store';

const inputCls =
  'w-full bg-secondary/50 border border-white/10 rounded-lg py-2.5 px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all';

const Store: React.FC = () => {
  const navigate = useNavigate();
  const [kits, setKits] = useState<Kit[]>([]);
  const [loadingKits, setLoadingKits] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [division, setDivision] = useState<Kit['division'] | null>(null);
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
    listKits()
      .then(setKits)
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoadingKits(false));
  }, []);

  const selectedKit = kits.find((k) => k.division === division) ?? null;
  const total = selectedKit
    ? Number(selectedKit.unit_price) * Number(form.teamCount || 0)
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedKit) return setError('Please select your division first.');
    if (!form.schoolName || !form.contactName || !form.contactEmail || !form.contactPhone) {
      return setError('Please fill in all school and contact details.');
    }
    setSubmitting(true);
    try {
      const ref = await registerOrder({
        ...form,
        teamCount: Number(form.teamCount),
        division: selectedKit.division,
        kitId: selectedKit.id,
      });
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
          <h1 className="text-2xl font-bold text-foreground mt-1">
            Order your division kit
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Select your school&apos;s division to see the kit, its full component list,
            and price. Registration closes September 25, 2026.
          </p>
        </header>

        {loadingKits ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading kits…
          </div>
        ) : loadError ? (
          <GlassCard>
            <p className="text-destructive-foreground text-sm">{loadError}</p>
          </GlassCard>
        ) : (
          <div className="grid gap-3 mb-7">
            {kits.map((kit) => {
              const active = division === kit.division;
              return (
                <button
                  key={kit.id}
                  type="button"
                  onClick={() => setDivision(kit.division)}
                  className={`text-left glass-card p-4 transition-all ${
                    active ? 'border-primary/60 bg-slate-800/60' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex justify-between items-baseline">
                    <strong className="text-foreground">
                      {DIVISION_LABELS[kit.division]}
                    </strong>
                    <span className="font-bold text-primary">
                      {naira.format(kit.unit_price)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{kit.name}</div>
                  {active && (
                    <ul className="mt-3 pl-4 text-sm text-muted-foreground list-disc space-y-1">
                      {kit.bom.map((item, i) => (
                        <li key={i}>
                          {item.component} × {item.qty}
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {division && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4"
          >
            <h2 className="text-lg font-semibold text-foreground">School &amp; team details</h2>

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

            <div className="flex justify-between py-3 border-t border-white/10 text-lg font-bold text-foreground">
              <span>Total</span>
              <span>{naira.format(total)}</span>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <GlowButton type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting…' : 'Register & get payment instructions'}
            </GlowButton>
          </motion.form>
        )}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="grid gap-1.5 text-sm text-muted-foreground">
    {label}
    {children}
  </label>
);

export default Store;
