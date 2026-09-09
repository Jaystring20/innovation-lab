import { useMemo } from 'react';
import Panel from '@/components/Panel';
import { Mail } from 'lucide-react';
import type { LabData } from './LabConsole';

interface PeoplePanelProps {
  data: LabData;
  onChanged: () => void;
}

const PeoplePanel: React.FC<PeoplePanelProps> = ({ data }) => {
  const stats = useMemo(() => {
    const schools = new Set(data.schools.map((s) => s.id)).size;
    const teachers = new Set(
      data.teams.map((t) => data.schools.find((s) => s.id === t.school_id)).filter(Boolean)
    ).size;
    const judges = data.judges.length;
    const unlinked = data.unlinkedTeachers.length;

    return { schools, teachers, judges, unlinked };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Panel hover={false} className="p-3">
          <p className="text-xs text-muted-foreground">Schools</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.schools}</p>
        </Panel>
        <Panel hover={false} className="p-3">
          <p className="text-xs text-muted-foreground">Teachers</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.teachers}</p>
        </Panel>
        <Panel hover={false} className="p-3">
          <p className="text-xs text-muted-foreground">Judges</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.judges}</p>
        </Panel>
        <Panel hover={false} className="p-3 bg-warn/10">
          <p className="text-xs text-muted-foreground">Unlinked</p>
          <p className="text-2xl font-bold text-warn mt-1">{stats.unlinked}</p>
        </Panel>
      </div>

      {/* Judges */}
      <div>
        <h3 className="font-bold text-foreground mb-3">Judges ({data.judges.length})</h3>
        <div className="space-y-2">
          {data.judges.map((judge) => (
            <Panel key={judge.id} hover className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{judge.full_name || 'Unnamed'}</p>
                <p className="text-xs text-muted-foreground">{judge.email}</p>
              </div>
              <a
                href={`mailto:${judge.email}`}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </Panel>
          ))}
        </div>
      </div>

      {/* Unlinked Teachers */}
      {data.unlinkedTeachers.length > 0 && (
        <div>
          <h3 className="font-bold text-foreground mb-3 text-warn">
            Unlinked Teachers ({data.unlinkedTeachers.length})
          </h3>
          <Panel hover={false} className="p-4 bg-warn/10 border border-warn/20 mb-3">
            <p className="text-sm text-warn">
              These teachers have registered but are not yet linked to a school. Link them in the Schools list.
            </p>
          </Panel>
          <div className="space-y-2">
            {data.unlinkedTeachers.map((teacher) => (
              <Panel key={teacher.id} hover className="p-3">
                <div>
                  <p className="font-medium text-foreground">{teacher.full_name || 'Unnamed'}</p>
                  <p className="text-xs text-muted-foreground">{teacher.email}</p>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PeoplePanel;
