import React from 'react';
import { User } from '../../types/crm';
import { formatDate } from '../../utils/formatters';
import { PERMISSION_DEFINITIONS, ROLE_DEFAULT_PERMISSIONS } from '../../data/seedData';
import { X, UserCheck, ShieldCheck, Mail, Phone, Calendar, Users, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  allUsers: User[];
  onOpenPermissions: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  onClose,
  user,
  allUsers,
  onOpenPermissions,
}) => {
  if (!isOpen || !user) return null;

  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[user.role] || {};
  const userOverrides = user.permissions || {};

  const activePermissionsCount = PERMISSION_DEFINITIONS.filter((p) => {
    if (typeof userOverrides[p.key] === 'boolean') {
      return userOverrides[p.key];
    }
    return roleDefaults[p.key];
  }).length;

  const teamSellers = allUsers.filter((u) => u.supervisor_id === user.id && u.role === 'Vendedor');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl relative my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-extrabold text-sm">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{user.name}</h3>
              <p className="text-[11px] text-slate-400 font-mono">{user.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Main Info Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block uppercase">Perfil</span>
              <span className="font-bold text-emerald-400 text-xs">{user.role}</span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-500 block uppercase">Status</span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  user.status === 'Ativo'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {user.status}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-500 block uppercase">Permissões</span>
              <span className="font-mono font-bold text-slate-200">
                {activePermissionsCount} / {PERMISSION_DEFINITIONS.length} ativas
              </span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl">
            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contatos e Documentos</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
              <div>
                <span className="text-slate-500 text-[10px] block">CPF:</span>
                <span className="font-mono font-medium">{user.cpf}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">E-mail:</span>
                <span className="font-medium truncate block">{user.email}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">Telefone:</span>
                <span className="font-mono">{user.phone}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">WhatsApp:</span>
                <span className="font-mono">{user.whatsapp}</span>
              </div>
            </div>
          </div>

          {/* Supervisor / Team Section */}
          {user.role === 'Vendedor' && (
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-blue-300">Supervisor Responsável</span>
              </div>
              <p className="text-slate-200 font-semibold text-xs">
                {user.supervisor_name || 'Nenhum supervisor atrelado'}
              </p>
            </div>
          )}

          {user.role === 'Supervisor' && (
            <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">Equipe de Vendedores Vinculados</span>
                </div>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded">
                  {teamSellers.length} membro(s)
                </span>
              </div>

              {teamSellers.length === 0 ? (
                <p className="text-slate-500 text-[11px] italic">Nenhum vendedor associado a este supervisor.</p>
              ) : (
                <div className="space-y-1 pt-1">
                  {teamSellers.map((seller) => (
                    <div
                      key={seller.id}
                      className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-[11px]"
                    >
                      <span className="text-slate-200 font-semibold">{seller.name}</span>
                      <span className="text-slate-400 font-mono">{seller.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Creation Timestamp */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Cadastrado em {formatDate(user.created_at)}</span>
            </span>
            <span>Atualizado em {formatDate(user.updated_at)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onOpenPermissions}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gerenciar Permissões</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
