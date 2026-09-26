import React, { useState, useEffect } from 'react';
import { User, PermissionKey } from '../../types/crm';
import { PERMISSION_DEFINITIONS, ROLE_DEFAULT_PERMISSIONS } from '../../data/seedData';
import { X, ShieldCheck, RefreshCw, Check, Save, Lock, Layers } from 'lucide-react';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (userId: string, permissions: Partial<Record<PermissionKey, boolean>>) => Promise<void>;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [permissions, setPermissions] = useState<Partial<Record<PermissionKey, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      // Start with user existing overrides or copy role defaults
      const current = user.permissions || {};
      setPermissions({ ...current });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[user.role] || {};

  const isGranted = (key: PermissionKey): boolean => {
    if (typeof permissions[key] === 'boolean') {
      return permissions[key]!;
    }
    return !!roleDefaults[key];
  };

  const handleToggle = (key: PermissionKey) => {
    const currentVal = isGranted(key);
    setPermissions((prev) => ({
      ...prev,
      [key]: !currentVal,
    }));
  };

  const handleResetToDefault = () => {
    setPermissions({});
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await onSave(user.id, permissions);
      onClose();
    } catch (e) {
      console.error('Erro ao salvar permissões:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: 'vendas', label: 'Vendas & Esteiras', color: 'border-blue-500/30 text-blue-400 bg-blue-500/10' },
    { id: 'comissoes', label: 'Comissões & Tabelas', color: 'border-purple-500/30 text-purple-400 bg-purple-500/10' },
    { id: 'financeiro', label: 'Financeiro & Lucro', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
    { id: 'equipe', label: 'Equipe & Usuários', color: 'border-amber-500/30 text-amber-400 bg-amber-500/10' },
    { id: 'configuracoes', label: 'Configurações do Sistema', color: 'border-teal-500/30 text-teal-400 bg-teal-500/10' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl relative my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Matriz de Permissões Individuais</h3>
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-emerald-400 text-[10px] font-semibold rounded-full">
                  {user.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ajustando acessos de <strong className="text-white">{user.name}</strong> ({user.email})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-400">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>As alterações personalizadas têm prioridade sobre o perfil padrão.</span>
          </div>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão do Perfil</span>
          </button>
        </div>

        {/* Permissions Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {categories.map((cat) => {
            const catPerms = PERMISSION_DEFINITIONS.filter((p) => p.category === cat.id);
            if (catPerms.length === 0) return null;

            return (
              <div key={cat.id} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800/80">
                  <span className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${cat.color}`}>
                    {cat.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">({catPerms.length} regras)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {catPerms.map((perm) => {
                    const active = isGranted(perm.key);
                    const isOverridden =
                      typeof permissions[perm.key] === 'boolean' &&
                      permissions[perm.key] !== roleDefaults[perm.key];

                    return (
                      <div
                        key={perm.key}
                        onClick={() => handleToggle(perm.key)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          active
                            ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 opacity-70'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md shrink-0 mt-0.5 flex items-center justify-center border font-bold transition-all ${
                            active
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'bg-slate-950 border-slate-700 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-bold text-slate-200">{perm.label}</span>
                            {isOverridden && (
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                Personalizado
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">{perm.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            Todas as alterações são registradas na tabela <code className="text-emerald-400 font-mono">audit_logs</code>.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Matriz de Permissões</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
