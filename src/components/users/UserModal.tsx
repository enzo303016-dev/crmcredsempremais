import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../../types/crm';
import { formatCPF, formatPhone } from '../../utils/formatters';
import { X, UserPlus, Save, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: {
    name: string;
    cpf: string;
    phone: string;
    whatsapp: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    supervisor_id?: string | null;
  }) => Promise<void>;
  editingUser?: User | null;
  supervisors: User[];
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUser,
  supervisors,
}) => {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('Vendedor');
  const [status, setStatus] = useState<UserStatus>('Ativo');
  const [supervisorId, setSupervisorId] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name || '');
      setCpf(editingUser.cpf || '');
      setPhone(editingUser.phone || '');
      setWhatsapp(editingUser.whatsapp || '');
      setEmail(editingUser.email || '');
      setPassword(''); // Password blank on edit unless updating
      setRole(editingUser.role);
      setStatus(editingUser.status);
      setSupervisorId(editingUser.supervisor_id || '');
    } else {
      setName('');
      setCpf('');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setPassword('');
      setRole('Vendedor');
      setStatus('Ativo');
      setSupervisorId(supervisors.length > 0 ? supervisors[0].id : '');
    }
    setErrorMessage(null);
  }, [editingUser, isOpen, supervisors]);

  if (!isOpen) return null;

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    // Auto-fill WhatsApp if empty or matching
    if (!whatsapp || whatsapp === phone) {
      setWhatsapp(formatted);
    }
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!name.trim()) {
      setErrorMessage('O nome completo é obrigatório.');
      return;
    }
    if (!cpf.trim() || cpf.replace(/\D/g, '').length !== 11) {
      setErrorMessage('Informe um CPF válido com 11 dígitos.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('O telefone de contato é obrigatório.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Informe um e-mail válido.');
      return;
    }
    if (!editingUser && (!password || password.length < 6)) {
      setErrorMessage('A senha é obrigatória e deve ter pelo menos 6 caracteres.');
      return;
    }
    if (role === 'Vendedor' && !supervisorId) {
      setErrorMessage('Selecione o Supervisor responsável para este vendedor.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        name,
        cpf,
        phone,
        whatsapp: whatsapp || phone,
        email,
        role,
        status,
        supervisor_id: role === 'Vendedor' ? supervisorId : null,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocorreu um erro ao salvar o usuário.');
    } fontFinally: {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl relative my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário na Equipe'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Preencha as informações para cadastro no banco MySQL
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

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Nome Completo */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Nome Completo *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carlos Roberto Silva"
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* CPF e E-mail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">CPF *</label>
              <input
                type="text"
                value={cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                maxLength={14}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 font-mono outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">E-mail corporativo *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@credsempre.com.br"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Telefone e WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Telefone *</label>
              <input
                type="text"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 font-mono outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">WhatsApp</label>
              <input
                type="text"
                value={whatsapp}
                onChange={handleWhatsappChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 font-mono outline-none"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              {editingUser ? 'Alterar Senha (deixe em branco para manter a atual)' : 'Senha de Acesso *'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingUser ? '••••••••' : 'Mínimo 6 caracteres'}
                required={!editingUser}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-2.5 pr-10 text-white placeholder-slate-500 outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Perfil e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Perfil de Acesso *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-2.5 text-white outline-none cursor-pointer"
              >
                <option value="Vendedor">Vendedor</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Status do Usuário *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-2.5 text-white outline-none cursor-pointer"
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>

          {/* Supervisor Responsável (Shown ONLY if role is Vendedor) */}
          {role === 'Vendedor' && (
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl animate-in fade-in duration-100">
              <label className="block font-bold text-blue-300 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Supervisor Responsável *</span>
              </label>
              <p className="text-[10px] text-slate-400 mb-2">
                O vendedor ficará vinculado à esteira de acompanhamento do supervisor selecionado.
              </p>
              {supervisors.length === 0 ? (
                <div className="text-amber-400 text-xs">
                  Aviso: Nenhum supervisor ativo cadastrado. Cadastre um supervisor primeiro.
                </div>
              ) : (
                <select
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                >
                  <option value="">-- Selecione o Supervisor --</option>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
