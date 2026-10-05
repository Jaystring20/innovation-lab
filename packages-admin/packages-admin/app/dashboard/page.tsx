import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">
          Admin Dashboard
        </h1>
        <p className="text-slate-600">
          Manage Learning Lab content and Competition stages
        </p>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Learning Lab Card */}
        <Link href="/modules/learning-lab">
          <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Learning Lab
            </h2>
            <p className="text-slate-600 mb-4">
              Manage levels, lessons, assessments, and missions
            </p>
            <div className="text-primary-600 font-medium">
              Go to Learning Lab →
            </div>
          </div>
        </Link>

        {/* Competition Card */}
        <Link href="/modules/competition">
          <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              APEN Competition
            </h2>
            <p className="text-slate-600 mb-4">
              Manage stages, teams, submissions, and scoring
            </p>
            <div className="text-primary-600 font-medium">
              Go to Competition →
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Quick Stats
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded p-4 border border-slate-200">
            <div className="text-2xl font-bold text-slate-900">24</div>
            <div className="text-sm text-slate-600">Active Levels</div>
          </div>
          <div className="bg-white rounded p-4 border border-slate-200">
            <div className="text-2xl font-bold text-slate-900">156</div>
            <div className="text-sm text-slate-600">Enrolled Students</div>
          </div>
          <div className="bg-white rounded p-4 border border-slate-200">
            <div className="text-2xl font-bold text-slate-900">8</div>
            <div className="text-sm text-slate-600">Running Competitions</div>
          </div>
          <div className="bg-white rounded p-4 border border-slate-200">
            <div className="text-2xl font-bold text-slate-900">312</div>
            <div className="text-sm text-slate-600">Total Submissions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
