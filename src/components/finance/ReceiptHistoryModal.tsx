import React from 'react';
import { FinancialRevenue } from '../../types/crm';
import {
  History,
  X,
  Calendar,
  CreditCard,
  User,
  DollarSign,
  CheckCircle2,
  Building2,
  FileText,
} from 'lucide-react';

interface ReceiptHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  revenue: FinancialRevenue | null;
}

export const ReceiptHistoryModal: React.FC<ReceiptHistoryModalProps> = ({
  isOpen,
  onClose,
  revenue,
}) => {
  if (!isOpen || !revenue) return null;

  const receipts = revenue.receipts || [];
  const remaining = Math.max(0, revenue.expected_amount - revenue.received_amount);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#022859] text-white p-5 border-b border-[#034AA6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#034AA6] border border-[#F2B807]/40 flex items-center justify-center shadow-md">
              <History className="w-5 h-5 text-[#F2B807]" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#F2B807] text-[#022859]">
                Histórico Financeiro
              </span>
              <h3 className="text-base font-black text-white tracking-tight mt-0.5">
                Histórico de Recebimentos da Receita
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Revenue Summary */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#034AA6]" />
              <strong className="text-[#022859]">{revenue.bank_nome}</strong>
              <span className="text-slate-400">•</span>
              <span>{revenue.product_nome}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
              revenue.status === 'RECEBIDA'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : revenue.status === 'RECEBIDA_PARCIALMENTE'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : revenue.status === 'ATRASADA'
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-blue-100 text-blue-800 border border-blue-300'
            }`}>
              {revenue.status}
            </span>
          </div>

          <p className="text-[11px] text-slate-600">{revenue.description}</p>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 font-mono text-[11px]">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Valor Previsto</span>
              <strong className="text-[#022859]">
                R$ {revenue.expected_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Total Recebido</span>
              <strong className="text-emerald-700">
                R$ {revenue.received_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Saldo Restante</span>
              <strong className={remaining > 0 ? 'text-[#F28907]' : 'text-slate-500'}>
                R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
        </div>

        {/* Timeline list */}
        <div className="p-5 max-h-80 overflow-y-auto space-y-3">
          <h4 className="text-xs font-black text-[#022859] flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#034AA6]" />
            <span>Lançamentos de Recebimento ({receipts.length})</span>
          </h4>

          {receipts.length > 0 ? (
            <div className="space-y-2.5">
              {receipts.map((rec, index) => (
                <div
                  key={rec.id}
                  className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold font-mono">
                        #{index + 1}
                      </span>
                      <strong className="text-sm font-black text-emerald-700 font-mono">
                        R$ {rec.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-[#034AA6]" />
                      <span>{new Date(rec.received_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {rec.reference && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ref / Comprovante: <strong>{rec.reference}</strong></span>
                    </div>
                  )}

                  {rec.notes && (
                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{rec.notes}"
                    </p>
                  )}

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span>Registrado por: <strong>{rec.created_by_name || 'Administrador'}</strong></span>
                    <span>{new Date(rec.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 italic text-xs">
              Nenhum recebimento registrado para esta receita financeira.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#034AA6] hover:bg-[#022859] text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
