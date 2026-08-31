import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Panel from '@/components/Panel';
import StageTracker from './StageTracker';
import SubmissionForm from './SubmissionForm';
import FeedbackPanel from './FeedbackPanel';
import StatusPill from './StatusPill';
import {
  listTeamSubmissions,
  type Stage,
  type Submission,
  type Team,
} from '@/lib/lab';

/** One team's run through the funnel: stepper → deliverable → feedback. */
const TeamPanel: React.FC<{ team: Team; stages: Stage[] }> = ({ team, stages }) => {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listTeamSubmissions(team.id)
      .then((rows) => {
        if (!alive) return;
        setSubs(rows);
        // Open the earliest stage that still needs work, else the last one.
        const ordered = [...rows].sort(
          (a, b) => stageOrd(stages, a.stage_id) - stageOrd(stages, b.stage_id),
        );
        const next = ordered.find((s) => s.status !== 'scored') ?? ordered[ordered.length - 1];
        setActiveStageId(next?.stage_id ?? null);
      })
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [team.id, stages]);

  const activeStage = stages.find((s) => s.id === activeStageId) ?? null;
  const activeSub = subs.find((s) => s.stage_id === activeStageId) ?? null;

  if (loading) {
    return (
      <Panel>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading {team.name}…
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="space-y-5" hover={false}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-foreground">{team.name}</h3>
          {team.eliminated_after_stage ? (
            <p className="text-sm text-red-400 mt-0.5">
              Not advanced past Stage {team.eliminated_after_stage}
            </p>
          ) : team.advanced_at ? (
            <p className="text-sm text-emerald-400 mt-0.5">Advanced to the finals</p>
          ) : null}
        </div>
        {activeSub && <StatusPill status={activeSub.status} />}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <StageTracker
        stages={stages}
        submissions={subs}
        activeStageId={activeStageId}
        onSelect={setActiveStageId}
      />

      {activeStage && activeSub && (
        <motion.div
          key={activeStage.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid lg:grid-cols-2 gap-6 pt-2 border-t border-white/5"
        >
          <div className="pt-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              {activeStage.name}
            </p>
            <SubmissionForm
              stage={activeStage}
              submission={activeSub}
              onSaved={(updated) =>
                setSubs((rows) => rows.map((r) => (r.id === updated.id ? updated : r)))
              }
            />
          </div>
          <div className="pt-4 lg:border-l lg:border-white/5 lg:pl-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Judge feedback
            </p>
            <FeedbackPanel submissionId={activeSub.id} />
          </div>
        </motion.div>
      )}
    </Panel>
  );
};

function stageOrd(stages: Stage[], stageId: string): number {
  return stages.find((s) => s.id === stageId)?.ord ?? 99;
}

export default TeamPanel;
