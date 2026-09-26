import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  FinancialGeneralExpense,
  GeneralExpenseCategory,
  GeneralExpenseStatus,
} from '../../types/crm';
import {
  Receipt,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
  ClipboardList,
} from 'lucide-react';

interface GeneralExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: FinancialGeneralExpense | null;
  onExpenseSaved: () => void;
}

export const GeneralExpenseModal: React.FC<GeneralExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
  onExpenseSaved,
}) => {
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const [category, setCategory] = useState<GeneralExpenseCategory>(expenseToEdit?.category || 'ALUGUEL');
  const [description, setDescription] = useState<string>(expenseToEdit?.description || '');
  const [amount, setAmount] = useState<string>(expenseToEdit ? expenseToEdit.amount.toString() : '');
  const [dueDate, setDueDate] = useState<string>(expenseToEdit?.due_date || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<GeneralExpenseStatus>(expenseToEdit?.status || 'PENDENTE');
  const [notes, setNotes] = useState<string>(expenseToEdit?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('Informe um valor de despesa válido maior que zero.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Informe a descrição da despesa geral.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (expenseToEdit) {
        await apiService.updateFinancialGeneralExpense(
          expenseToEdit.id,
          {
            category,
            description: description.trim(),
            amount: amountNum,
            due_date: dueDate,
            status,
            notes: notes.trim(),
          },
          currentUser
        );
      } else {
        await apiService.createFinancialGeneralExpense(
          {
            category,
            description: description.trim(),
            amount: amountNum,
            due_date: dueDate,
            status,
            notes: notes.trim(),
          },
          currentUser
        );
      }

      onExpenseSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar despesa geral.');
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
              <Receipt className="w-5 h-5 text-[#F2B807]" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#F2B807] text-[#022859]">
                Fase 5 • Financeiro
              </span>
              <h3 className="text-base font-black text-white tracking-tight mt-0.5">
                {expenseToEdit ? 'Editar Despesa Geral' : 'Lançar Nova Despesa Geral'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Categoria da Despesa *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GeneralExpenseCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              >
                <option value="ALUGUEL">Aluguel</option>
                <option value="TELEFONE">Telefone</option>
                <option value="INTERNET">Internet</option>
                <option value="TRAFEGO_PAGO">Tráfego Pago</option>
                <option value="SALARIOS">Salários</option>
                <option value="COMISSOES_VENDEDORES">Comissões de Vendedores</option>
                <option value="FERRAMENTAS">Ferramentas / Software</option>
                <option value="CONTABILIDADE">Contabilidade</option>
                <option value="HOSPEDAGEM">Hospedagem / Servidores</option>
                <option value="MATERIAL_ESCRITORIO">Material de Escritório</option>
                <option value="OUTROS">Outros Custos / Gerais</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valor da Despesa (R$) *
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
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descrição da Despesa *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Conta de internet Fibra Ótica Vivo - Vencimento Setembro"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data de Vencimento *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status do Pagamento *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GeneralExpenseStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              >
                <option value="PENDENTE">PENDENTE (A pagar)</option>
                <option value="PAGO">PAGO (Quitado)</option>
                <option value="CANCELADO">CANCELADO (Estornado / Suspenso)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações / Notas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais sobre a despesa ou número do boleto..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
              <span>{isSubmitting ? 'Salvando...' : expenseToEdit ? 'Salvar Alterações' : 'Lançar Despesa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
