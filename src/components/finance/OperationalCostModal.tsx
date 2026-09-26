import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  FinancialOperationalCost,
  OperationalCostCategory,
  OperationalCostStatus,
  Bank,
  Opportunity,
  Contract,
} from '../../types/crm';
import {
  Receipt,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  ClipboardList,
  FileCheck,
} from 'lucide-react';

interface OperationalCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  costToEdit?: FinancialOperationalCost | null;
  onCostSaved: () => void;
  banks: Bank[];
  opportunities: Opportunity[];
  contracts: Contract[];
}

export const OperationalCostModal: React.FC<OperationalCostModalProps> = ({
  isOpen,
  onClose,
  costToEdit,
  onCostSaved,
  banks,
  opportunities,
  contracts,
}) => {
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const [category, setCategory] = useState<OperationalCostCategory>(costToEdit?.category || 'CONSULTA_BUREAU');
  const [description, setDescription] = useState<string>(costToEdit?.description || '');
  const [amount, setAmount] = useState<string>(costToEdit ? costToEdit.amount.toString() : '');
  const [date, setDate] = useState<string>(costToEdit?.date || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<OperationalCostStatus>(costToEdit?.status || 'PAGO');
  const [opportunityId, setOpportunityId] = useState<string>(costToEdit?.opportunity_id || '');
  const [bankId, setBankId] = useState<string>(costToEdit?.bank_id || '');
  const [notes, setNotes] = useState<string>(costToEdit?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('Informe um valor de custo válido maior que zero.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Informe a descrição do custo operacional.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (costToEdit) {
        await apiService.updateFinancialOperationalCost(
          costToEdit.id,
          {
            category,
            description: description.trim(),
            amount: amountNum,
            date,
            status,
            opportunity_id: opportunityId || undefined,
            bank_id: bankId || undefined,
            notes: notes.trim(),
          },
          currentUser
        );
      } else {
        await apiService.createFinancialOperationalCost(
          {
            category,
            description: description.trim(),
            amount: amountNum,
            date,
            status,
            opportunity_id: opportunityId || undefined,
            bank_id: bankId || undefined,
            notes: notes.trim(),
          },
          currentUser
        );
      }

      onCostSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar custo operacional.');
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
                {costToEdit ? 'Editar Custo Operacional' : 'Lançar Custo Operacional Direto'}
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
                Categoria do Custo *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as OperationalCostCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              >
                <option value="CONSULTA_BUREAU">Consulta CPF / Margem / Score</option>
                <option value="MOTOBOY_LOGISTICA">Motoboy / Coleta e Entrega</option>
                <option value="CERTIDAO_CARTORIO">Certidão / Cartório / DED</option>
                <option value="TAXA_AVERBACAO_EMISSAO">Taxa Averbação / Emissão CCB</option>
                <option value="TAXA_BANCARIA_TED">Taxa Bancária / TED / PIX</option>
                <option value="OUTRO">Outros Custos Diretos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valor do Custo (R$) *
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
              Descrição do Custo *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Coleta de assinatura presencial com motoboy contrato #0901"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data do Custo *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
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
                onChange={(e) => setStatus(e.target.value as OperationalCostStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              >
                <option value="PAGO">PAGO (Quitado)</option>
                <option value="PENDENTE">PENDENTE (A pagar)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vincular à Oportunidade (Opcional)
              </label>
              <select
                value={opportunityId}
                onChange={(e) => setOpportunityId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              >
                <option value="">Nenhuma / Custo Geral</option>
                {opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.banco_nome} - {opp.produto_nome} ({opp.client_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vincular ao Banco (Opcional)
              </label>
              <select
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              >
                <option value="">Nenhum Banco Específico</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações / Referência de Recibo
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Número de nota fiscal, recibo ou detalhes adicionais..."
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
              <span>{isSubmitting ? 'Salvando...' : costToEdit ? 'Salvar Alterações' : 'Lançar Custo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
