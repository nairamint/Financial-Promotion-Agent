import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Analysis } from './pages/Analysis';
import { AuditLog } from './pages/AuditLog';
import { ARGovernance } from './pages/ARGovernance';
import { TestingSuite } from './pages/TestingSuite';
import { Workflow } from './pages/Workflow';
import { Repository } from './pages/Repository';
import { BoardAdvisory } from './pages/BoardAdvisory';
import { Reports } from './pages/Reports';
import { Favorites } from './pages/Favorites';
import { Trash } from './pages/Trash';
import { Admin } from './pages/Admin';
import { Integrations } from './pages/Integrations';
import { UATPortal } from './pages/UATPortal';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('repository');
  const [activeId, setActiveId] = useState<string | undefined>(undefined);

  const handleNavigate = (page: string, id?: string) => {
      setActivePage(page);
      setActiveId(id);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'repository':
        return <Repository onNavigate={handleNavigate} />;
      case 'review':
        return <Analysis key={activeId || 'new'} initialPromotionId={activeId} />;
      case 'workflow':
        return <Workflow />;
      case 'audit':
        return <AuditLog />;
      case 'ar-governance':
        return <ARGovernance />;
      case 'uat':
        return <UATPortal />;
      case 'testing':
        return <TestingSuite />;
      case 'board-advisory':
        return <BoardAdvisory />;
      case 'reports':
        return <Reports />;
      case 'favorites':
        return <Favorites onNavigate={handleNavigate} />;
      case 'trash':
        return <Trash />;
      case 'admin':
        return <Admin />;
      case 'integrations':
        return <Integrations />;
      default:
        return <Repository onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout activePage={activePage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
};

export default App;