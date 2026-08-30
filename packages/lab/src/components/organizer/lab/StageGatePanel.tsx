import { useState } from 'react';
import { ChevronRight, AlertCircle } from 'lucide-react';
import Panel from '@/components/Panel';
import GlowButton from '@/components/GlowButton';
import { cn } from '@/lib/utils';
import type { LabData } from './LabConsole';

interface StagGatePanelProps {
  data: LabData;
  onChanged: () => void;
}

const StageGatePanel: React.FC<StagGatePanelProps> = ({ data }) => {
  const [busy, setBusy] = useState(false);

  const stages = data.stages.sort((a, b) => a.ord - b.ord);

  return (
    <div className="space-y-6">
      {stages.map((stage, idx) => {
        const nextStage = stages[idx + 1];
        const shouldAdvance = stage.advance_count ? stage.advance_count : null;

        return (
          <div key={stage.id}>
            <Panel hover={false} className="p-4 mb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-foreground">{stage.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {shouldAdvance ? `Top ${shouldAdvance} advance` : 'Final stage'}
                  </p>
                </div>
                {shouldAdvance && (
                  <GlowButton type="button" disabled={busy} size="sm">
                    <span className="flex items-center gap-1">
                      Advance {shouldAdvance}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </GlowButton>
                )}
              </div>
            </Panel>

            {nextStage && (
              <div className="flex items-center justify-center my-4">
                <div className="h-8 w-0.5 bg-border"></div>
              </div>
            )}
          </div>
        );
      })}

      <Panel hover={false} className="bg-warn/10 border border-warn/20 p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-warn flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground text-sm">Gate actions are permanent</p>
            <p className="text-xs text-muted-foreground mt-1">
              Advancing or eliminating teams cannot be undone. Confirm with the event organizer before proceeding.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
};

export default StageGatePanel;
