import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Award, Download, ExternalLink } from 'lucide-react';
import Panel from '@/components/Panel';
import { getPortfolio } from '@/lib/student';
import type { StudentSubmissionView } from '@/lib/student';

interface PortfolioProps {
  teamId: string;
}

export const Portfolio: React.FC<PortfolioProps> = ({ teamId }) => {
  const [portfolio, setPortfolio] = useState<Record<string, StudentSubmissionView[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPortfolio(teamId);
        setPortfolio(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [teamId]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <p className="text-sm text-muted-foreground">Loading portfolio…</p>
      </div>
    );

  if (error)
    return (
      <Panel className="bg-danger/10 border-danger/30" hover={false}>
        <p className="text-sm text-danger">{error}</p>
      </Panel>
    );

  const stages = ['design', 'build', 'intelligize', 'battle'];

  return (
    <div className="space-y-6">
      {stages.map((stageName) => {
        const submissions = portfolio[stageName] ?? [];
        return (
          <div key={stageName}>
            <h3 className="text-lg font-semibold text-foreground mb-3 capitalize">
              {stageName === 'intelligize' ? 'Intelligize' : stageName}
            </h3>

            {submissions.length === 0 ? (
              <Panel hover={false}>
                <p className="text-sm text-muted-foreground text-center py-4">
                  No submissions completed for this stage yet.
                </p>
              </Panel>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission, idx) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Panel
                      hover
                      className="space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground">
                            {submission.stage_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Submitted {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'pending'}
                          </p>
                        </div>
                        <Award className="w-5 h-5 text-primary flex-shrink-0" />
                      </div>

                      {submission.payload?.video_url && (
                        <a
                          href={submission.payload.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View video submission
                        </a>
                      )}

                      {submission.payload?.doc_url && (
                        <a
                          href={submission.payload.doc_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download documentation
                        </a>
                      )}

                      {submission.payload?.notes && (
                        <div className="bg-surface rounded p-2 mt-2">
                          <p className="text-xs text-muted-foreground">
                            {submission.payload.notes}
                          </p>
                        </div>
                      )}
                    </Panel>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Portfolio;
