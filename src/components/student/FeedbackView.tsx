import { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Award, AlertCircle } from 'lucide-react';
import Panel from '@/components/Panel';
import { getFeedback } from '@/lib/lab';
import type { Feedback } from '@/lib/lab';

interface FeedbackViewProps {
  submissionId: string;
  stageName: string;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({
  submissionId,
  stageName,
}) => {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getFeedback(submissionId);
        setFeedback(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [submissionId]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <p className="text-sm text-muted-foreground">Loading feedback…</p>
      </div>
    );

  if (error)
    return (
      <Panel className="bg-danger/10 border-danger/30" hover={false}>
        <p className="text-sm text-danger">{error}</p>
      </Panel>
    );

  if (!feedback)
    return (
      <Panel hover={false}>
        <p className="text-sm text-muted-foreground text-center py-4">
          Feedback not yet released. Check back soon!
        </p>
      </Panel>
    );

  const rubricItems = [
    { label: 'Design Thinking & Empathy', score: feedback.avg_design, max: 20 },
    { label: 'Hardware Execution & Build Quality', score: feedback.avg_hardware, max: 30 },
    { label: 'AI Innovation & "Intelligize" Layer', score: feedback.avg_ai, max: 30 },
    { label: 'Presentation & Documentation', score: feedback.avg_presentation, max: 20 },
  ];

  return (
    <div className="space-y-4">
      <Panel className="space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">{stageName} Feedback</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Reviewed by {feedback.judge_count} judge{feedback.judge_count !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Overall Score */}
        {feedback.avg_total !== null && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className="text-3xl font-bold text-primary">
                  {feedback.avg_total.toFixed(1)}/100
                </p>
              </div>
              <Award className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>
        )}

        {/* Rubric Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Scoring Breakdown</p>
          {rubricItems.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold text-foreground">
                  {item.score?.toFixed(1) ?? '—'}/{item.max}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{
                    width: item.score ? `${(item.score / item.max) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Comments */}
      {feedback.comments && feedback.comments.length > 0 && (
        <Panel className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-foreground">Judge Comments</h4>
          </div>
          <div className="space-y-2">
            {feedback.comments.map((comment, idx) => (
              <div
                key={idx}
                className="bg-surface rounded-lg p-3 border border-border/50"
              >
                <p className="text-sm text-foreground">{comment}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Next Steps */}
      <Panel className="bg-info/10 border-info/30" hover={false}>
        <div className="flex gap-3">
          <AlertCircle className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-info mb-1">Next Steps</p>
            <p className="text-xs text-info/80">
              Review the feedback carefully and use it to improve your solution in the next stage.
              Great learning happens when we iterate on feedback!
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
};

export default FeedbackView;
