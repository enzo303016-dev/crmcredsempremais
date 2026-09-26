import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles, Building2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail de acesso.');
      return;
    }
    if (!password) {
      setErrorMessage('Por favor, informe sua senha.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao autenticar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
    try {
      setIsSubmitting(true);
      await login(demoEmail, demoPass);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha no acesso de demonstração.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle brand blue background ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#034AA6]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-[#F2B807]/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#022859] text-white border border-[#034AA6]/40 rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Brand Lockup */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-[#034AA6] border border-[#F2B807]/40 text-[#F2B807] text-xs font-bold rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistema CRM • Cred Sempre +</span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-[#034AA6] border border-[#F2B807]/50 flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-[#F2B807] font-bold" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Cred <span className="text-[#F2B807]">Sempre</span> <span className="text-[#F28907]">+</span>
            </h1>
          </div>
          <p className="text-xs text-blue-200">Plataforma Oficial de Gestão de Crédito e Vendas</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-500/20 border border-rose-400/40 rounded-xl text-rose-200 text-xs font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-blue-100 mb-1.5">E-mail corporativo</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-blue-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@credsempre.com.br"
                disabled={isSubmitting}
                className="w-full bg-[#011B3D] border border-[#034AA6] focus:border-[#F2B807] focus:ring-1 focus:ring-[#F2B807] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-blue-300/60 transition-colors outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-blue-100 mb-1.5">Senha de acesso</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-blue-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="w-full bg-[#011B3D] border border-[#034AA6] focus:border-[#F2B807] focus:ring-1 focus:ring-[#F2B807] rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-blue-300/60 transition-colors outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-colors p-1"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#034AA6] hover:bg-[#022859] border border-[#F2B807]/50 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4 text-[#F2B807]" />
              </>
            )}
          </button>
        </form>

        {/* Prominent Demo Mode Entry Button */}
        <div className="mt-6 pt-6 border-t border-[#034AA6]/40 space-y-3">
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@credsempre.com.br', 'admin123')}
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-[#011B3D] hover:bg-[#034AA6]/40 border border-[#F2B807] text-[#F2B807] font-extrabold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 text-[#F2B807] group-hover:rotate-12 transition-transform" />
            <span>Entrar em Modo Demonstração (Admin)</span>
          </button>

          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200 text-center">
            Ou escolha um perfil de demonstração
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@credsempre.com.br', 'admin123')}
              disabled={isSubmitting}
              className="p-2 bg-[#011B3D] hover:bg-[#034AA6]/50 border border-[#034AA6] rounded-xl text-left transition-colors cursor-pointer group"
            >
              <div className="text-[10px] font-extrabold text-[#F2B807]">ADMINISTRADOR</div>
              <div className="text-[11px] font-medium text-white truncate">Carlos Silva</div>
              <div className="text-[9px] text-blue-200 truncate">Acesso Total</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('supervisor.marcos@credsempre.com.br', 'super123')}
              disabled={isSubmitting}
              className="p-2 bg-[#011B3D] hover:bg-[#034AA6]/50 border border-[#034AA6] rounded-xl text-left transition-colors cursor-pointer group"
            >
              <div className="text-[10px] font-extrabold text-blue-200">SUPERVISOR</div>
              <div className="text-[11px] font-medium text-white truncate">Marcos Rocha</div>
              <div className="text-[9px] text-blue-300 truncate">Visão de Equipe</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('vendedor.joao@credsempre.com.br', 'vendedor123')}
              disabled={isSubmitting}
              className="p-2 bg-[#011B3D] hover:bg-[#034AA6]/50 border border-[#034AA6] rounded-xl text-left transition-colors cursor-pointer group"
            >
              <div className="text-[10px] font-extrabold text-[#F28907]">VENDEDOR</div>
              <div className="text-[11px] font-medium text-white truncate">João Martins</div>
              <div className="text-[9px] text-blue-300 truncate">Operacional</div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-[#022859] font-medium relative z-10 flex items-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-[#034AA6]" />
        <span>Cred Sempre + © 2026 • Controle de Sessão e Segurança PHP REST</span>
      </div>
    </div>
  );
};
