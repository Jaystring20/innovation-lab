import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  GraduationCap,
  LogOut,
  Loader2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import GlowButton from '@/components/GlowButton';
import { useAuth } from '@/contexts/AuthContext';
import {
  listAllOrders,
  setOrderStatus,
  proofUrl,
  naira,
  DIVISION_SHORT,
  STATUS_LABELS,
  type AdminOrder,
  type OrderStatus,
} from '@/lib/store';
import steamFoundryLogo from '@/assets/steam-foundry-logo.png';

type Section = 'store' | 'lab';

const nextActions: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  registered: { to: 'paid', label: 'Mark paid' },
  payment_pending: { to: 'paid', label: 'Confirm payment' },
  paid: { to: 'dispatched', label: 'Mark dispatched' },
};

const badgeCls: Record<string, string> = {
  registered: 'bg-amber-500/15 text-amber-400',
  payment_pending: 'bg-amber-500/15 text-amber-400',
  paid: 'bg-emerald-500/15 text-emerald-400',
  dispatched: 'bg-sky-500/15 text-sky-400',
  cancelled: 'bg-red-500/15 text-red-400',
};

const OrganizerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading, organizerName, signOut } = useAuth();
  const [section, setSection] = useState<Section>('store');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !session) navigate('/organizer/login', { replace: true });
  }, [authLoading, session, navigate]);

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

  useEffect(() => {
    if (session) refresh();
  }, [session]);

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
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function openProof(path: string) {
    const url = await proofUrl(path);
    if (url) window.open(url, '_blank');
    else setError('Could not generate a link for that proof.');
  }

  if (authLoading || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Sidebar */}
      <aside className="glass-sidebar w-60 hidden md:flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <img src={steamFoundryLogo} alt="" className="w-9 h-9 object-contain" />
          <div>
            <p className="font-bold text-foreground leading-tight">STEAM Foundry</p>
            <p className="text-xs text-muted-foreground">Organizer console</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <SideItem
            active={section === 'store'}
            icon={<Package className="w-5 h-5" />}
            label="Store — Orders"
            onClick={() => setSection('store')}
          />
          <SideItem
            active={section === 'lab'}
            icon={<GraduationCap className="w-5 h-5" />}
            label="Lab — Cohorts"
            onClick={() => setSection('lab')}
          />
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => signOut().then(() => navigate('/'))}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-white/10 transition-all"
          >
            <LogOut className="w-5 h-5" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 glass-card rounded-none border-x-0 border-t-0 flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {section === 'store' ? 'Store — Orders' : 'Lab — Cohorts'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="text-primary">{organizerName}</span>
            </p>
          </div>
          {/* Mobile section toggle */}
          <div className="flex md:hidden gap-2">
            <button
              onClick={() => setSection('store')}
              className={`px-3 py-1.5 rounded-md text-sm ${section === 'store' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
            >
              Store
            </button>
            <button
              onClick={() => setSection('lab')}
              className={`px-3 py-1.5 rounded-md text-sm ${section === 'lab' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
            >
              Lab
            </button>
          </div>
        </header>

        <motion.main
          className="flex-1 overflow-y-auto p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {section === 'store' ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                <Stat label="Total orders" value={String(stats.total)} />
                <Stat label="Awaiting review" value={String(stats.awaiting)} />
                <Stat label="Paid" value={String(stats.paid)} />
                <Stat label="Dispatched" value={String(stats.dispatched)} />
                <Stat label="Confirmed revenue" value={naira.format(stats.revenue)} />
              </div>

              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  {loading ? 'Loading…' : `${orders.length} order(s)`}
                </p>
                <button
                  onClick={refresh}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
                >
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>

              {error && (
                <GlassCard className="mb-4">
                  <p className="text-sm text-red-400">{error}</p>
                </GlassCard>
              )}

              <GlassCard className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-white/10">
                      <th className="p-3 font-medium">Reference</th>
                      <th className="p-3 font-medium">School</th>
                      <th className="p-3 font-medium">Division</th>
                      <th className="p-3 font-medium">Teams</th>
                      <th className="p-3 font-medium">Total</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Proof</th>
                      <th className="p-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const action = nextActions[o.status];
                      return (
                        <tr key={o.id} className="border-b border-white/5 last:border-0">
                          <td className="p-3 font-mono text-foreground">{o.order_reference}</td>
                          <td className="p-3">
                            <div className="text-foreground">{o.schools?.name ?? '—'}</div>
                            <div className="text-xs text-muted-foreground">
                              {o.schools?.contact_name} · {o.schools?.contact_email}
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">{DIVISION_SHORT[o.division]}</td>
                          <td className="p-3 text-muted-foreground">{o.team_count}</td>
                          <td className="p-3 text-foreground">{naira.format(o.total_amount)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${badgeCls[o.status]}`}>
                              {STATUS_LABELS[o.status]}
                            </span>
                          </td>
                          <td className="p-3">
                            {o.proof_of_payment_url ? (
                              <button
                                onClick={() => openProof(o.proof_of_payment_url!)}
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                              >
                                View <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            {action && (
                              <GlowButton
                                size="sm"
                                disabled={busyId === o.id}
                                onClick={() => advance(o, action.to)}
                              >
                                {busyId === o.id ? '…' : action.label}
                              </GlowButton>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {!loading && orders.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-muted-foreground">
                          No orders yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </GlassCard>
            </>
          ) : (
            <GlassCard>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/15">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Lab cohorts</h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-prose">
                    Once schools have paid for their kits, their teams become Lab
                    cohorts here — tier assignment, mission unlocks, and live-class
                    scheduling. This module plugs into the same Supabase project; the
                    schema for missions and XP is the next build step.
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
        </motion.main>
      </div>
    </div>
  );
};

const SideItem: React.FC<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
      active ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-white/10'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="glass-card p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
  </div>
);

export default OrganizerDashboard;
