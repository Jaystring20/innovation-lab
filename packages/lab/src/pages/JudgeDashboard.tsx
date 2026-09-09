import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import Panel from '@/components/Panel';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatusPill from '@/components/lab/StatusPill';
import ScoreForm from '@/components/lab/ScoreForm';
import { useAuth } from '@/contexts/AuthContext';
import { DELIVERABLE_LABEL, judgeQueue, type JudgeQueueItem } from '@/lib/lab';
import { DIVISION_SHORT } from '@/lib/store';
import { cn } from '@/lib/utils';

/**
 * A judge's review queue.
 *
 * Submissions are identified by division and stage only — the school and team
 * name are deliberately not shown, so scoring is not anchored on who submitted.
 */
const JudgeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { session, role, loading: authLoading } = useAuth();
  const [items, setItems] = useState<JudgeQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!session) navigate('/lab', { replace: true });
    else if (role === 'organizer') navigate('/organizer', { replace: true });
    else if (role === 'teacher') navigate('/lab/dashboard', { replace: true });
  }, [authLoading, session, role, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await judgeQueue());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session && role === 'judge') load();
  }, [session, role, load]);

  if (authLoading || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const pending = items.filter((i) => !i.my_score).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />

      <motion.main
        className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Review queue</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {loading
                ? 'Loading…'
                : items.length === 0
                  ? 'Nothing assigned to you yet.'
                  : `${items.length} assigned · ${pending} awaiting your score`}
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && (
          <GlassCard className="mb-4" hover={false}>
            <p className="text-sm text-red-400">{error}</p>
          </GlassCard>
        )}

        <div className="space-y-3">
          {items.map((item) => {
            const open = openId === item.submission_id;
            const links = [
              { label: 'Video / demo', url: item.payload?.video_url },
              { label: 'Docs / prompt log', url: item.payload?.doc_url },
              { label: 'Repository', url: item.payload?.repo_url },
            ].filter((l) => l.url);

            return (
              <GlassCard key={item.submission_id} className="p-0 overflow-hidden" hover={false}>
                <button
                  onClick={() => setOpenId(open ? null : item.submission_id)}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {item.stage_name} · {DIVISION_SHORT[item.division]}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {DELIVERABLE_LABEL[item.stage_kind]}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {item.my_score ? (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Scored
                      </span>
                    ) : (
                      <StatusPill status={item.status} />
                    )}
                    <ChevronDown
                      className={cn(
                        'w-5 h-5 text-muted-foreground transition-transform',
                        open && 'rotate-180',
                      )}
                    />
                  </div>
                </button>

                {open && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-4 grid lg:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                        Submission
                      </p>
                      {links.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {item.stage_kind === 'live'
                            ? 'Scored from the live presentation.'
                            : 'No links submitted.'}
                        </p>
                      ) : (
                        <ul className="space-y-1.5 mb-3">
                          {links.map((l) => (
                            <li key={l.label}>
                              <a
                                href={l.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
                              >
                                {l.label} <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                      {item.payload?.notes && (
                        <div>
                          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                            Team notes
                          </p>
                          <p className="text-sm text-foreground/90 bg-white/5 rounded-lg p-3 border border-white/5">
                            {item.payload.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="lg:border-l lg:border-white/5 lg:pl-6">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                        Your score
                      </p>
                      <ScoreForm
                        submissionId={item.submission_id}
                        judgeId={session.user.id}
                        existing={item.my_score}
                        onScored={load}
                      />
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}

          {!loading && items.length === 0 && (
            <GlassCard hover={false}>
              <p className="text-sm text-muted-foreground">
                The organizer assigns submissions to judges. Once you have assignments they
                appear here, grouped by stage.
              </p>
            </GlassCard>
          )}
        </div>
      </motion.main>
    </div>
  );
};

export default JudgeDashboard;
