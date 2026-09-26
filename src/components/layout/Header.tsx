import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, ShieldCheck, UserCheck, Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentTabTitle: string;
  onOpenMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTabTitle, onOpenMobileSidebar }) => {
  const { currentUser, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'Administrador':
        return 'bg-[#034AA6] text-white border-[#F2B807]/50';
      case 'Supervisor':
        return 'bg-[#034AA6]/80 text-blue-100 border-[#034AA6]';
      case 'Vendedor':
        return 'bg-[#F28907]/20 text-[#F28907] border-[#F28907]/40';
      default:
        return 'bg-[#034AA6]/50 text-white border-[#034AA6]';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#022859] text-white border-b border-[#034AA6]/40 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-md">
      {/* Left Zone: Mobile Toggle & Tab Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden text-blue-100 hover:text-white p-2 rounded-xl bg-[#034AA6] border border-[#034AA6] cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base lg:text-lg font-bold text-white tracking-tight leading-tight">
            {currentTabTitle}
          </h1>
          <p className="text-[11px] text-blue-200/80 hidden sm:block">
            Cred Sempre + • Gestão Inteligente de Operações
          </p>
        </div>
      </div>

      {/* Right Zone: User Profile, Role Badge, Logout */}
      <div className="flex items-center gap-3">
        {/* Supervisor Tag if Vendedor */}
        {currentUser?.role === 'Vendedor' && currentUser.supervisor_name && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#034AA6]/50 border border-[#034AA6] rounded-lg text-xs text-blue-100">
            <UserCheck className="w-3.5 h-3.5 text-[#F2B807]" />
            <span className="text-[11px]">Sup: <strong className="text-white font-medium">{currentUser.supervisor_name}</strong></span>
          </div>
        )}

        {/* Role Badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${getRoleBadgeStyle(currentUser?.role)}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{currentUser?.role}</span>
        </div>

        {/* Notifications Icon */}
        <div className="relative">
          <button className="text-blue-100 hover:text-white p-2 rounded-xl bg-[#034AA6]/60 border border-[#034AA6] hover:bg-[#034AA6] transition-colors relative cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F2B807] animate-pulse" />
          </button>
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-[#034AA6]/80 border border-[#034AA6] hover:bg-[#034AA6] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#022859] border border-[#F2B807]/50 text-[#F2B807] flex items-center justify-center font-extrabold text-xs">
              {currentUser?.name.charAt(0) || 'U'}
            </div>
            <span className="text-xs font-semibold text-white max-w-[120px] truncate hidden sm:inline">
              {currentUser?.name.split(' ')[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-200" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div
                onClick={() => setShowDropdown(false)}
                className="fixed inset-0 z-40"
              />
              <div className="absolute right-0 mt-2 w-56 bg-[#022859] border border-[#034AA6] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[#034AA6] mb-1">
                  <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
                  <p className="text-[11px] text-blue-200 truncate">{currentUser?.email}</p>
                  <p className="text-[10px] text-[#F2B807] font-bold mt-0.5">{currentUser?.role}</p>
                </div>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair do Sistema</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
