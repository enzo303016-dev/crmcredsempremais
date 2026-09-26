import React from 'react';
import { Sparkles, ArrowRight, Layers, Database, ShieldCheck } from 'lucide-react';

interface FutureModuleProps {
  title: string;
  badge: string;
  description: string;
  plannedFeatures: string[];
}

export const FutureModuleView: React.FC<FutureModuleProps> = ({
  title,
  badge,
  description,
  plannedFeatures,
}) => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Módulo em Estruturação • {badge}</span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">{title}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{description}</p>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl shrink-0 text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">
              Status da Arquitetura
            </span>
            <span className="text-xs font-bold text-emerald-400">Estrutura RBAC Pronta</span>
          </div>
        </div>
      </div>

      {/* Planned Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Funcionalidades Previstas para este Módulo</span>
          </h3>

          <ul className="space-y-2 text-xs text-slate-300">
            {plannedFeatures.map((feat, idx) => (
              <li
                key={idx}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Preparação no Banco de Dados MySQL</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Na <strong>Fase 1</strong>, a matriz de permissões para este módulo já foi totalmente criada no banco de dados (<code className="text-emerald-400 font-mono">permissions</code> e <code className="text-emerald-400 font-mono">user_permissions</code>).
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Controle de Acesso Já Ativo</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Apenas perfis e usuários autorizados poderão acessar e manipular dados quando as telas deste módulo forem implementadas na próxima fase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
