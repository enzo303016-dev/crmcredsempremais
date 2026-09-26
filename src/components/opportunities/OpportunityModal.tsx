import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { Client, OpportunityStage } from '../../types/crm';
import { X, PlusCircle, Save, DollarSign, Building2, Layers } from 'lucide-react';

interface OpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedClient?: Client | null;
  onSuccess: () => void;
}

export const OpportunityModal: React.FC<OpportunityModalProps> = ({
  isOpen,
  onClose,
  preSelectedClient,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const clients = apiService.getClients(currentUser);

  const [clientId, setClientId] = useState('');
  const [bancoNome, setBancoNome] = useState('Banco do Brasil');
  const [produtoNome, setProdutoNome] = useState('Novo Empréstimo INSS');
  const [valor, setValor] = useState('10000');
  const [prazo, setPrazo] = useState('84');
  const [etapa, setEtapa] = useState<OpportunityStage>('Simulação');
  const [observacoes, setObservacoes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preSelectedClient) {
      setClientId(preSelectedClient.id);
    } else if (clients.length > 0) {
      setClientId(clients[0].id);
    }
  }, [preSelectedClient, isOpen, clients]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!clientId) {
      setFormError('Selecione o cliente para esta proposta.');
      return;
    }
    const numValor = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numValor) || numValor <= 0) {
      setFormError('Informe um valor de crédito válido.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiService.createOpportunity(
        {
          client_id: clientId,
          banco_nome: bancoNome,
          produto_nome: produtoNome,
          valor: numValor,
          prazo: parseInt(prazo, 10) || 84,
          etapa,
          observacoes,
        },
        currentUser!
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao cadastrar oportunidade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nova Oportunidade / Proposta</h3>
              <p className="text-[11px] text-slate-400">
                Simulação e envio de proposta para a esteira comercial
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

        {formError && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Cliente */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Cliente *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              disabled={!!preSelectedClient}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none cursor-pointer disabled:opacity-70"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.cpf ? `CPF: ${c.cpf}` : c.telefone})
                </option>
              ))}
            </select>
          </div>

          {/* Banco e Produto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Banco Parceiro *</label>
              <select
                value={bancoNome}
                onChange={(e) => setBancoNome(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none cursor-pointer"
              >
                <option value="Banco do Brasil">Banco do Brasil</option>
                <option value="Itaú Consignado">Itaú Consignado</option>
                <option value="Bradesco Promotora">Bradesco Promotora</option>
                <option value="Banco C6 Consig">Banco C6 Consig</option>
                <option value="Facta Financeira">Facta Financeira</option>
                <option value="Banrisul">Banrisul</option>
                <option value="Olé Consignado">Olé Consignado</option>
                <option value="Banco Daycoval">Banco Daycoval</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Produto de Crédito *</label>
              <select
                value={produtoNome}
                onChange={(e) => setProdutoNome(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none cursor-pointer"
              >
                <option value="Novo Empréstimo INSS">Novo Empréstimo INSS</option>
                <option value="Consignado SIAPE">Consignado SIAPE</option>
                <option value="Refinanciamento com Troco">Refinanciamento com Troco</option>
                <option value="Portabilidade de Crédito">Portabilidade de Crédito</option>
                <option value="Antecipação Saque FGTS">Antecipação Saque FGTS</option>
                <option value="Cartão Benefício Consignado">Cartão Benefício Consignado</option>
              </select>
            </div>
          </div>

          {/* Valor e Prazo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Valor Solicitado (R$) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="10000,00"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 pl-9 text-white font-mono outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Prazo (Parcelas/Meses) *</label>
              <select
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white font-mono outline-none cursor-pointer"
              >
                <option value="84">84 vezes (INSS / SIAPE)</option>
                <option value="96">96 vezes (Forças Armadas)</option>
                <option value="120">120 vezes (Municípios)</option>
                <option value="12">12 meses (Antecipação FGTS)</option>
                <option value="24">24 vezes</option>
                <option value="36">36 vezes</option>

                <option value="48">48 vezes</option>
                <option value="60">60 vezes</option>
                <option value="72">72 vezes</option>
              </select>
            </div>
          </div>

          {/* Etapa Inicial */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Etapa Inicial na Esteira</label>
            <select
              value={etapa}
              onChange={(e) => setEtapa(e.target.value as OpportunityStage)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none cursor-pointer"
            >
              <option value="Novo Lead">1. Novo Lead</option>
              <option value="Contato Realizado">2. Contato Realizado</option>

              <option value="Qualificado">3. Qualificado</option>
              <option value="Simulação">4. Simulação</option>

              <option value="Proposta">5. Proposta</option>
              <option value="Documentação">6. Documentação</option>

              <option value="Análise">7. Análise</option>
              <option value="Aprovado">8. Aprovado</option>
              <option value="Contrato">9. Contrato</option>
              <option value="Pago">10. Pago</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Observações da Operação</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              placeholder="Número de benefício (NB/Matrícula), margem utilizada..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Criar Proposta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
