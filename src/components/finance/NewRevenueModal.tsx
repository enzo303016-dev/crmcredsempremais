import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { Bank, Product, Agreement, User } from '../../types/crm';
import {
  DollarSign,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
} from 'lucide-react';

interface NewRevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRevenueCreated: () => void;
  banks: Bank[];
  products: Product[];
  agreements: Agreement[];
  sellers: User[];
}

export const NewRevenueModal: React.FC<NewRevenueModalProps> = ({
  isOpen,
  onClose,
  onRevenueCreated,
  banks,
  products,
  agreements,
  sellers,
}) => {
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const [bankId, setBankId] = useState<string>(banks[0]?.id || '');
  const [productId, setProductId] = useState<string>(products[0]?.id || '');
  const [agreementId, setAgreementId] = useState<string>('');
  const [sellerId, setSellerId] = useState<string>(currentUser?.id || sellers[0]?.id || '');
  const [description, setDescription] = useState<string>('');
  const [clientNome, setClientNome] = useState<string>('');
  const [contractNumero, setContractNumero] = useState<string>('');
  const [expectedAmount, setExpectedAmount] = useState<string>('');
  const [expectedDate, setExpectedDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableProducts = products.filter((p) => p.banco_id === bankId);
  const availableAgreements = agreements.filter((a) => a.produto_id === productId);

  const handleBankChange = (newBankId: string) => {
    setBankId(newBankId);
    const prods = products.filter((p) => p.banco_id === newBankId);
    if (prods.length > 0) {
      setProductId(prods[0].id);
      const agrees = agreements.filter((a) => a.produto_id === prods[0].id);
      setAgreementId(agrees[0]?.id || '');
    } else {
      setProductId('');
      setAgreementId('');
    }
  };

  const handleProductChange = (newProdId: string) => {
    setProductId(newProdId);
    const agrees = agreements.filter((a) => a.produto_id === newProdId);
    setAgreementId(agrees[0]?.id || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const val = parseFloat(expectedAmount);
    if (isNaN(val) || val <= 0) {
      setErrorMessage('Informe um valor previsto de comissão válido maior que zero.');
      return;
    }

    if (!bankId) {
      setErrorMessage('Selecione o banco parceiro.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.createFinancialRevenue(
        {
          bank_id: bankId,
          product_id: productId || undefined,
          agreement_id: agreementId || undefined,
          seller_id: sellerId,
          client_nome: clientNome.trim() || undefined,
          contract_numero: contractNumero.trim() || undefined,
          description: description.trim() || undefined,
          expected_amount: val,
          expected_date: expectedDate,
          notes: notes.trim() || undefined,
        },
        currentUser
      );

      onRevenueCreated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar receita financeira.');
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
                Nova Receita de Comissão Manual
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
                Banco Parceiro *
              </label>
              <select
                required
                value={bankId}
                onChange={(e) => handleBankChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Produto / Linha *
              </label>
              <select
                value={productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              >
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Convênio (Opcional)
              </label>
              <select
                value={agreementId}
                onChange={(e) => setAgreementId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              >
                <option value="">Geral / Todos os Convênios</option>
                {availableAgreements.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vendedor Responsável
              </label>
              <select
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              >
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome do Cliente (Opcional)
              </label>
              <input
                type="text"
                value={clientNome}
                onChange={(e) => setClientNome(e.target.value)}
                placeholder="Ex: Maria das Graças"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nº Contrato / Proposta
              </label>
              <input
                type="text"
                value={contractNumero}
                onChange={(e) => setContractNumero(e.target.value)}
                placeholder="Ex: CTR-2026-9912"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valor Previsto de Comissão (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Previsão de Recebimento *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  required
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações Adicionais
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas sobre a grade ou acordo bancário..."
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
              <span>{isSubmitting ? 'Cadastrando...' : 'Cadastrar Receita'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
