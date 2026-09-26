import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { User, UserRole, UserStatus, PermissionKey } from '../../types/crm';
import { formatDate } from '../../utils/formatters';
import { UserModal } from './UserModal';
import { PermissionsModal } from './PermissionsModal';
import { UserDetailModal } from './UserDetailModal';
import {
  Users,
  Search,
  UserPlus,
  ShieldCheck,
  Eye,
  Edit2,
  Lock,
  CheckCircle2,
  XCircle,
  Filter,
  Phone,
  MessageCircle,
  UserCheck,
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { currentUser, hasPermission, refreshUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);

  const users = apiService.getUsers();
  const supervisors = apiService.getSupervisors();

  // Filter logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.cpf.includes(searchTerm);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async (userData: any) => {
    if (!currentUser) return;
    await apiService.createUser(userData, currentUser);
    refreshUser();
  };

  const handleUpdateUser = async (userData: any) => {
    if (!currentUser || !editingUser) return;
    await apiService.updateUser(editingUser.id, userData, currentUser);
    refreshUser();
  };

  const handleToggleStatus = async (user: User) => {
    if (!currentUser) return;
    try {
      await apiService.toggleUserStatus(user.id, currentUser);
      refreshUser();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status.');
    }
  };

  const handleSavePermissions = async (
    userId: string,
    permissions: Partial<Record<PermissionKey, boolean>>
  ) => {
    if (!currentUser) return;
    await apiService.updateUserPermissions(userId, permissions, currentUser);
    refreshUser();
  };

  const canCreate = hasPermission('criar_usuario');
  const canEdit = hasPermission('editar_usuario');
  const canManagePerms = hasPermission('gerenciar_permissoes');

  return (
    <div className="space-y-6">
      {/* Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-extrabold text-white">Equipe e Usuários</h2>
            <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-semibold rounded-full">
              {filteredUsers.length} de {users.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestão completa de usuários, supervisores, vendedores e permissões do sistema.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => {
              setEditingUser(null);
              setIsUserModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Usuário</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou CPF..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white outline-none cursor-pointer"
          >
            <option value="ALL">Todos os Perfis</option>
            <option value="Administrador">Administrador</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Vendedor">Vendedor</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white outline-none cursor-pointer"
          >
            <option value="ALL">Todos os Status</option>
            <option value="Ativo">Apenas Ativos</option>
            <option value="Inativo">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Nome / E-mail</th>
                <th className="px-4 py-3.5">Perfil</th>
                <th className="px-4 py-3.5">Supervisor</th>
                <th className="px-4 py-3.5">Telefone / WhatsApp</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Cadastro</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold">Nenhum usuário encontrado com os filtros aplicados.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* User Name & Email */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400 shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200">{u.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${
                          u.role === 'Administrador'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : u.role === 'Supervisor'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>{u.role}</span>
                      </span>
                    </td>

                    {/* Supervisor */}
                    <td className="px-4 py-3.5">
                      {u.role === 'Vendedor' ? (
                        <span className="text-slate-300 font-medium flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{u.supervisor_name || 'Não vinculado'}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono">-</span>
                      )}
                    </td>

                    {/* Telefone / Whatsapp */}
                    <td className="px-4 py-3.5">
                      <div className="text-slate-300 font-mono text-[11px] space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{u.phone}</span>
                        </div>
                        {u.whatsapp && (
                          <div className="flex items-center gap-1 text-emerald-400">
                            <MessageCircle className="w-3 h-3" />
                            <span>{u.whatsapp}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => canEdit && handleToggleStatus(u)}
                        disabled={!canEdit || u.id === currentUser?.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer disabled:cursor-not-allowed ${
                          u.status === 'Ativo'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                        }`}
                      >
                        {u.status === 'Ativo' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ativo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Inativo</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">
                      {formatDate(u.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Detail */}
                        <button
                          onClick={() => {
                            setDetailUser(u);
                            setIsDetailModalOpen(true);
                          }}
                          title="Visualizar Detalhes"
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setIsUserModalOpen(true);
                            }}
                            title="Editar Usuário"
                            className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Permissions */}
                        {canManagePerms && (
                          <button
                            onClick={() => {
                              setPermissionsUser(u);
                              setIsPermissionsModalOpen(true);
                            }}
                            title="Gerenciar Permissões"
                            className="p-1.5 text-slate-400 hover:text-blue-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create/Edit Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={editingUser ? handleUpdateUser : handleCreateUser}
        editingUser={editingUser}
        supervisors={supervisors}
      />

      {/* Permissions Modal */}
      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        user={permissionsUser}
        onSave={handleSavePermissions}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        user={detailUser}
        allUsers={users}
        onOpenPermissions={() => {
          if (detailUser) {
            setIsDetailModalOpen(false);
            setPermissionsUser(detailUser);
            setIsPermissionsModalOpen(true);
          }
        }}
      />
    </div>
  );
};
