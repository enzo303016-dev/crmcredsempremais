import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  FileCheck,
  Building2,
  BadgePercent,
  UserCog,
  DollarSign,
  HelpCircle,
  BarChart3,
  Settings,
  X,
  Sparkles,
  MessageSquare,
  Calendar,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface MenuItemDef {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  isFuture?: boolean;
  badge?: string;
}

export const SIDEBAR_ITEMS: MenuItemDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { id: 'clientes', label: 'Clientes', icon: UserCheck },
  { id: 'oportunidades', label: 'Oportunidades (Kanban)', icon: ClipboardList },
  { id: 'agenda', label: 'Agenda', icon: Calendar, badge: 'Fase 7.6' },
  { id: 'tarefas', label: 'Minhas Tarefas', icon: FileCheck },
  { id: 'contratos', label: 'Contratos Emitidos', icon: FileCheck },
  { id: 'bancos', label: 'Bancos e Produtos', icon: Building2 },
  { id: 'comissoes', label: 'Comissões & Resultado', icon: BadgePercent },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'usuarios', label: 'Vendedores / Equipe', icon: UserCog },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3, badge: 'Fase 7.8' },
  { id: 'ajuda', label: 'Central de Ajuda', icon: HelpCircle },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { currentUser } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#022859] text-white border-r border-[#034AA6]/40 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-5 border-b border-[#034AA6]/40 flex items-center justify-between bg-[#022859]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#034AA6] border border-[#F2B807]/50 flex items-center justify-center shadow-md shrink-0">
              <Building2 className="w-5 h-5 text-[#F2B807] font-bold" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block leading-tight">
                Cred <span className="text-[#F2B807]">Sempre</span> <span className="text-[#F28907]">+</span>
              </span>
              <span className="text-[10px] text-blue-200/80 font-medium tracking-wide uppercase block">
                CRM de Crédito
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="text-blue-200 hover:text-white lg:hidden p-1 rounded-lg hover:bg-[#034AA6]/50"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase Badge */}
        <div className="px-4 pt-3 pb-1">
          <div className="p-2.5 bg-[#034AA6]/30 border border-[#F2B807]/40 rounded-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F2B807] shrink-0" />
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-white block">CRM CRED SEMPRE +</span>
              <span className="text-blue-200 text-[10px]">Gestão Oficial de Vendas</span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#034AA6] text-white border border-[#F2B807]/50 shadow-md font-bold'
                    : 'text-blue-100/80 hover:text-white hover:bg-[#034AA6]/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#F2B807]' : 'text-blue-300/70'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.isFuture && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#F28907] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer User Info */}
        <div className="p-4 border-t border-[#034AA6]/40 bg-[#011B3D]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#034AA6] border border-[#F2B807]/40 flex items-center justify-center font-bold text-xs text-[#F2B807] shrink-0">
              {currentUser?.name.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-[#F2B807] font-medium truncate">{currentUser?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
