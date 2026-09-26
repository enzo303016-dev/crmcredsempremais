import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Header } from './components/layout/Header';
import { Sidebar, SIDEBAR_ITEMS } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { UsersView } from './components/users/UsersView';
import { SettingsView } from './components/settings/SettingsView';
import { HelpCenterView } from './components/help/HelpCenterView';
import { LeadsView } from './components/leads/LeadsView';
import { ClientsView } from './components/clients/ClientsView';
import { KanbanView } from './components/opportunities/KanbanView';
import { ContractsView } from './components/contracts/ContractsView';
import { BanksView } from './components/banks/BanksView';
import { CommissionsView } from './components/commissions/CommissionsView';
import { FinancialView } from './components/finance/FinancialView';
import { FutureModuleView } from './components/common/FutureModuleView';
import { WhatsAppInboxView } from './components/whatsapp/WhatsAppInboxView';
import { TasksView } from './components/tasks/TasksView';
import { AgendaView } from './components/agenda/AgendaView';
import { ReportsView } from './components/reports/ReportsView';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#034AA6] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-[#022859]">Carregando Cred Sempre + CRM...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const currentTabDef = SIDEBAR_ITEMS.find((item) => item.id === currentTab);
  const currentTabTitle = currentTabDef ? currentTabDef.label : 'Cred Sempre +';

  return (
    <div className="min-h-screen bg-[#F2F2F2] text-[#022859] flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tabId) => setCurrentTab(tabId)}
        isOpenMobile={isOpenMobileSidebar}
        onCloseMobile={() => setIsOpenMobileSidebar(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Header */}
        <Header
          currentTabTitle={currentTabTitle}
          onOpenMobileSidebar={() => setIsOpenMobileSidebar(true)}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateToUsers={() => setCurrentTab('usuarios')}
              onNavigateToTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'leads' && <LeadsView />}

          {currentTab === 'tarefas' && <TasksView />}

          {currentTab === 'agenda' && <AgendaView />}

          {currentTab === 'whatsapp' && <WhatsAppInboxView />}

          {currentTab === 'clientes' && <ClientsView />}

          {currentTab === 'oportunidades' && <KanbanView />}

          {currentTab === 'contratos' && <ContractsView />}

          {currentTab === 'bancos' && <BanksView />}

          {currentTab === 'comissoes' && <CommissionsView />}

          {currentTab === 'usuarios' && <UsersView />}

          {currentTab === 'configuracoes' && <SettingsView />}

          {currentTab === 'ajuda' && (
            <HelpCenterView onNavigateToConfig={() => setCurrentTab('configuracoes')} />
          )}

          {currentTab === 'financeiro' && <FinancialView />}

          {currentTab === 'relatorios' && <ReportsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
