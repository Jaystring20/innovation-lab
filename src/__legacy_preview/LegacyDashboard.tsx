import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import BentoGrid from './BentoGrid';

const LegacyDashboard: React.FC = () => (
  <div className="min-h-screen bg-background flex w-full">
    <DashboardSidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto">
        <BentoGrid />
      </main>
    </div>
  </div>
);

export default LegacyDashboard;
