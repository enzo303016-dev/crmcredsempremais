import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { FinancialRevenue } from '../../types/crm';
import {
  DollarSign,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Building2,
  Info,
} from 'lucide-react';

interface RegisterReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  revenue: FinancialRevenue | null;
  onReceiptRegistered: () => void;
}

export const RegisterReceiptModal: React.FC<RegisterReceiptModalProps> = ({
  isOpen,
  onClose,
  revenue,
  onReceiptRegistered,
}) => {
  const { currentUser } = useAuth();

  if (!isOpen || !revenue) return null;

  const remainingBalance = Math.max(0, revenue.expected_amount - revenue.received_amount);

  const [amount, setAmount] = useState<string>(remainingBalance > 0 ? remainingBalance.toString() : revenue.expected_amount.toString());
  const [receivedDate, setReceivedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const enteredAmount = parseFloat(amount) || 0;
  const projectTotalReceived = revenue.received_amount + enteredAmount;
  const isFullPayment = projectTotalReceived >= revenue.expected_amount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isNaN(enteredAmount) || enteredAmount <= 0) {
      setErrorMessage('Por favor, informe um valor de recebimento válido maior que zero.');
      return;
    }

    if (!receivedDate) {
      setErrorMessage('A data de recebimento é obrigatória.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.registerRevenueReceipt(
        revenue.id,
        {
          amount: enteredAmount,
          received_date: receivedDate,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        currentUser
      );

      onReceiptRegistered();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao registrar recebimento financeiro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#022859] text-white p-5 border-b border-[#034AA6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#034AA6] border border-[#F2B807]/40 flex items-center justify-center shadow-md">
              <DollarSign className="w-5 h-5 text-[#F2B807]" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#F2B807] text-[#022859]">
                Fase 5 • Financeiro
              </span>
              <h3 className="text-base font-black text-white tracking-tight mt-0.5">
                Registrar Recebimento de Banco
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

        {/* Revenue Context Box */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#034AA6]" />
              <strong className="text-[#022859]">{revenue.bank_nome}</strong>
              <span className="text-slate-400">•</span>
              <span className="text-slate-700">{revenue.product_nome}</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">#{revenue.id}</span>
          </div>

          <p className="text-[11px] text-slate-600 truncate">{revenue.description}</p>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 font-mono text-[11px]">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Valor Previsto</span>
              <strong className="text-[#022859]">
                R$ {revenue.expected_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Já Recebido</span>
              <strong className="text-emerald-700">
                R$ {revenue.received_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Saldo Pendente</span>
              <strong className={remainingBalance > 0 ? 'text-[#F28907]' : 'text-slate-500'}>
                R$ {remainingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Valor Deste Recebimento (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                placeholder="0,00"
              />
            </div>
            {remainingBalance > 0 && enteredAmount !== remainingBalance && (
              <button
                type="button"
                onClick={() => setAmount(remainingBalance.toString())}
                className="text-[10px] text-[#034AA6] font-bold hover:underline mt-1 block"
              >
                Preencher saldo restante (R$ {remainingBalance.toFixed(2)})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data do Recebimento *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  required
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Comprovante / Referência Bancária
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: TED-9841, PIX, Lote 15"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações do Recebimento
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais sobre a liquidação bancária..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
            />
          </div>

          {/* Status Preview Card */}
          <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            isFullPayment
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            <div className="flex items-center gap-2">
              <Info className={`w-4 h-4 shrink-0 ${isFullPayment ? 'text-emerald-700' : 'text-amber-700'}`} />
              <div>
                <span className="font-bold block">
                  Status resultante: {isFullPayment ? 'RECEBIDA (Integral)' : 'RECEBIDA_PARCIALMENTE'}
                </span>
                <span className="text-[10px] opacity-80">
                  Total após recebimento: R$ {projectTotalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {revenue.expected_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
              isFullPayment ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
            }`}>
              {isFullPayment ? 'RECEBIDA' : 'PARCIAL'}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#034AA6] hover:bg-[#022859] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-[#F2B807]" />
              <span>{isSubmitting ? 'Gravando...' : 'Confirmar Recebimento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
