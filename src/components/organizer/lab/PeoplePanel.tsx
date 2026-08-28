import { useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { linkTeacher } from '@/lib/lab';
import { DIVISION_SHORT } from '@/lib/store';
import type { LabData } from './LabConsole';

/**
 * Linking teacher accounts to schools — the step that turns a signed-up
 * teacher into one who can see their teams. Deliberately manual: a teacher
 * cannot claim a school, so the organizer confirms the match.
 */
const PeoplePanel: React.FC<{ data: LabData; onChanged: () => void }> = ({
  data,
  onChanged,
}) => {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, string>>({});

  async function link(profileId: string) {
    const schoolId = picked[profileId];
    if (!schoolId) return;
    setBusyId(profileId);
    setError(null);
    try {
      await linkTeacher(profileId, schoolId);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <GlassCard hover={false}>
          <p className="text-sm text-red-400">{error}</p>
        </GlassCard>
      )}

      <GlassCard hover={false}>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Teacher accounts waiting to be linked
        </p>
        {data.unlinkedTeachers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No unlinked teacher accounts. New sign-ups from <code className="text-primary">/lab</code>{' '}
            appear here.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.unlinkedTeachers.map((t) => (
              <li key={t.id} className="flex items-end gap-3 flex-wrap">
                <div className="min-w-[200px] flex-1">
                  <p className="text-foreground">{t.full_name ?? '(no name)'}</p>
                  <p className="text-sm text-muted-foreground">{t.email}</p>
                </div>
                <select
                  value={picked[t.id] ?? ''}
                  onChange={(e) => setPicked((p) => ({ ...p, [t.id]: e.target.value }))}
                  className="bg-secondary/40 border-2 border-white/10 rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/60 min-w-[220px]"
                >
                  <option value="">Link to school…</option>
                  {data.schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({DIVISION_SHORT[s.division]})
                    </option>
                  ))}
                </select>
                <button
                  disabled={busyId === t.id || !picked[t.id]}
                  onClick={() => link(t.id)}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors disabled:opacity-40"
                >
                  {busyId === t.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  Link
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <GlassCard hover={false}>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Judges</p>
        {data.judges.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No judges yet. A judge signs up at <code className="text-primary">/lab</code>, then
            an organizer promotes them in the Supabase dashboard — see LAB_SETUP.md.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {data.judges.map((j) => (
              <li key={j.id} className="text-sm">
                <span className="text-foreground">{j.full_name ?? '(no name)'}</span>
                <span className="text-muted-foreground"> · {j.email}</span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
};

export default PeoplePanel;
