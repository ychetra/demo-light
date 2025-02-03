import { LabLine } from '../components/LabLine';

export const DashboardPage = () => {
  return (
    <div className="dashboard-page">
      <div className="labs-wrapper">
        <LabLine lineNumber={15} />
        <LabLine lineNumber={16} />
      </div>
    </div>
  );
};
