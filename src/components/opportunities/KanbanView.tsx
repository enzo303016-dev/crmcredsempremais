import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  Opportunity,
  OpportunityStage,
  OpportunityHistoryItem,
} from '../../types/crm';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { OpportunityModal } from './OpportunityModal';
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  Filter,
  Building2,
  Clock,
  Phone,
  MessageCircle,
  Eye,
  ChevronRight,
  ChevronLeft,
  X,
  DollarSign,
  AlertCircle,
  Sparkles,
  FileCheck,
} from 'lucide-react';

export const KANBAN_STAGES: { id: OpportunityStage; label: string; color: string }[] = [
  { id: 'Novo Lead', label: '1. Novo Lead', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
  { id: 'Contato Realizado', label: '2. Contato Realizado', color: 'border-sky-500/40 text-sky-400 bg-sky-500/10' },
  { id: 'Qualificado', label: '3. Qualificado', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10' },
  { id: 'Simulação', label: '4. Simulação', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
  { id: 'Proposta', label: '5. Proposta', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
  { id: 'Documentação', label: '6. Documentação', color: 'border-orange-500/40 text-orange-400 bg-orange-500/10' },
  { id: 'Análise', label: '7. Análise Bancária', color: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' },
  { id: 'Aprovado', label: '8. Aprovado', color: 'border-teal-500/40 text-teal-400 bg-teal-500/10' },
  { id: 'Contrato', label: '9. Contrato Emitido', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10' },
  { id: 'Pago', label: '10. Pago / Averbado', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
];

export const KanbanView: React.FC = () => {
  const { currentUser, hasPermission, refreshUser } = useAuth();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [vendedorFilter, setVendedorFilter] = useState('ALL');
  const [bancoFilter, setBancoFilter] = useState('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailOpportunity, setDetailOpportunity] = useState<Opportunity | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Dragging state
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);

  const opportunities = apiService.getOpportunities(currentUser);
  const users = apiService.getUsers();
  const sellers = users.filter((u) => u.role === 'Vendedor' && u.status === 'Ativo');

  const canMove = hasPermission('mover_kanban');
  const canCreate = hasPermission('criar_oportunidade') || hasPermission('criar_oportunidades');
  const canConvertToContract = hasPermission('virar_contrato');

  const handleConvertToContract = async (opp: Opportunity) => {
    if (!currentUser) return;
    if (!canConvertToContract) {
      alert('Você não possui permissão para converter oportunidades em contrato.');
      return;
    }

    if (opp.has_contract) {
      alert('Esta oportunidade já foi convertida em contrato.');
      return;
    }

    const confirmMsg = `Deseja converter a oportunidade de ${opp.client_name} (R$ ${opp.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) em um CONTRATO OFICIAL?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsConverting(true);
      const res = await apiService.convertToContract(opp.id, currentUser);
      setDetailOpportunity(res.opportunity);
      refreshUser();
      alert(`Contrato #${res.contract.numero_contrato} gerado com sucesso!`);
    } catch (e: any) {
      alert(e.message || 'Erro ao converter para contrato.');
    } finally {
      setIsConverting(false);
    }
  };

  // Filtered
  const filteredOpps = opportunities.filter((o) => {
    const matchesSearch =
      o.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.banco_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.produto_nome.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVendedor = vendedorFilter === 'ALL' || o.vendedor_id === vendedorFilter;
    const matchesBanco = bancoFilter === 'ALL' || o.banco_nome === bancoFilter;

    return matchesSearch && matchesVendedor && matchesBanco;
  });

  const handleDragStart = (e: React.DragEvent, oppId: string) => {
    if (!canMove) return;
    setDraggedOppId(oppId);
    e.dataTransfer.setData('text/plain', oppId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: OpportunityStage) => {
    e.preventDefault();
    if (!canMove) return;

    const oppId = e.dataTransfer.getData('text/plain') || draggedOppId;
    if (!oppId || !currentUser) return;

    try {
      await apiService.updateOpportunityStage(oppId, targetStage, currentUser);
      setDraggedOppId(null);
      refreshUser();
    } catch (err: any) {
      alert(err.message || 'Erro ao mover proposta.');
    }
  };

  const handleMoveStageManual = async (
    opp: Opportunity,
    direction: 'prev' | 'next'
  ) => {
    if (!canMove || !currentUser) return;

    const currentIndex = KANBAN_STAGES.findIndex((s) => s.id === opp.etapa);
    if (currentIndex === -1) return;

    let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= KANBAN_STAGES.length) return;

    const targetStage = KANBAN_STAGES[targetIndex].id;
    try {
      await apiService.updateOpportunityStage(opp.id, targetStage, currentUser);
      if (detailOpportunity && detailOpportunity.id === opp.id) {
        setDetailOpportunity({ ...opp, etapa: targetStage });
      }
      refreshUser();
    } catch (e: any) {
      alert(e.message || 'Erro ao alterar etapa.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-extrabold text-white">Esteira Comercial (Kanban)</h2>
            <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-semibold rounded-full">
              {filteredOpps.length} proposta(s)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Acompanhe a esteira de crédito desde o primeiro contato até o pagamento ao cliente.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Nova Proposta</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, banco ou produto..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>

        <select
          value={vendedorFilter}
          onChange={(e) => setVendedorFilter(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white outline-none cursor-pointer"
        >
          <option value="ALL">Todos os Vendedores</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={bancoFilter}
          onChange={(e) => setBancoFilter(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-white outline-none cursor-pointer"
        >
          <option value="ALL">Todos os Bancos</option>
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

      {/* Kanban Board Container (Horizontal Scroll for 10 Columns) */}
      <div className="overflow-x-auto pb-6 pt-2">
        <div className="flex gap-4 min-w-[2800px]">
          {KANBAN_STAGES.map((stage) => {
            const stageOpps = filteredOpps.filter((o) => o.etapa === stage.id);
            const totalStageValue = stageOpps.reduce((acc, curr) => acc + curr.valor, 0);

            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="w-72 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col max-h-[750px] shadow-lg shrink-0"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 rounded-t-2xl">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${stage.color}`}>
                      {stage.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {stageOpps.length}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-300 font-mono mt-1">
                    {formatCurrency(totalStageValue)}
                  </div>
                </div>

                {/* Cards List */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[200px]">
                  {stageOpps.length === 0 ? (
                    <div className="py-8 text-center text-slate-600 text-[11px] border border-dashed border-slate-800/80 rounded-xl">
                      Nenhuma proposta nesta etapa.
                    </div>
                  ) : (
                    stageOpps.map((opp) => (
                      <div
                        key={opp.id}
                        draggable={canMove}
                        onDragStart={(e) => handleDragStart(e, opp.id)}
                        onClick={() => setDetailOpportunity(opp)}
                        className={`p-3.5 bg-slate-950 border border-slate-800/90 rounded-xl space-y-2.5 transition-all hover:border-emerald-500/50 hover:shadow-lg cursor-pointer ${
                          draggedOppId === opp.id ? 'opacity-40 border-dashed border-emerald-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-white leading-tight block">
                              {opp.client_name}
                            </span>
                            {opp.has_contract && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[9px] font-bold rounded-full">
                                <FileCheck className="w-2.5 h-2.5" />
                                <span>Contrato Emitido</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {opp.prazo}x
                          </span>
                        </div>

                        <div className="text-[11px] font-mono font-extrabold text-emerald-400">
                          {formatCurrency(opp.valor)}
                        </div>

                        <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-lg text-[10px] space-y-0.5">
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="font-semibold text-slate-200">{opp.banco_nome}</span>
                            <span className="text-slate-500 truncate max-w-[100px]">
                              {opp.produto_nome}
                            </span>
                          </div>
                          <div className="text-slate-500 font-medium">Vendedor: {opp.vendedor_nome}</div>
                        </div>

                        {/* Mobile / Card Quick Navigation Arrows */}
                        {canMove && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveStageManual(opp, 'prev');
                              }}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                              title="Voltar Etapa"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>

                            <span className="text-slate-500 font-mono text-[9px]">Arraste ou Mova</span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveStageManual(opp, 'next');
                              }}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                              title="Avançar Etapa"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Opportunity Detail Modal */}
      {detailOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">{detailOpportunity.client_name}</h3>
                <p className="text-[11px] font-mono text-slate-400">{detailOpportunity.id}</p>
              </div>

              <button
                onClick={() => setDetailOpportunity(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Valor da Operação</span>
                  <span className="text-emerald-400 font-extrabold text-sm">
                    {formatCurrency(detailOpportunity.valor)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Prazo</span>
                  <span className="text-slate-200 font-bold">{detailOpportunity.prazo} parcelas</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Banco Parceiro</span>
                  <span className="text-slate-200">{detailOpportunity.banco_nome}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Produto</span>
                  <span className="text-slate-200">{detailOpportunity.produto_nome}</span>
                </div>
              </div>

              {/* Virar Contrato Section / Status */}
              {detailOpportunity.has_contract ? (
                <div className="p-3.5 bg-cyan-950/40 border border-cyan-800/70 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-cyan-400" />
                      <span>Contrato Emitido (#{detailOpportunity.contract_id || 'Ativo'})</span>
                    </span>
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold font-mono rounded-full">
                      CONVERTIDO
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Convertido em {formatDate(detailOpportunity.converted_at || detailOpportunity.updated_at)} por{' '}
                    <strong>{detailOpportunity.converted_by_user_name || 'Usuário Responsável'}</strong>.
                  </p>
                </div>
              ) : (
                canConvertToContract && (
                  <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/60 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-emerald-300 block">Virar Contrato Oficial</span>
                      <p className="text-[11px] text-slate-400">
                        Cria o contrato vinculado utilizando os dados do cliente, banco, produto e vendedor.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleConvertToContract(detailOpportunity)}
                      disabled={isConverting}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>{isConverting ? 'Convertendo...' : 'Virar Contrato'}</span>
                    </button>
                  </div>
                )
              )}

              {/* Stage Stepper Navigation */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Etapa Atual</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">{detailOpportunity.etapa}</span>
                  {canMove && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMoveStageManual(detailOpportunity, 'prev')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                      >
                        ← Voltar Etapa
                      </button>
                      <button
                        onClick={() => handleMoveStageManual(detailOpportunity, 'next')}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                      >
                        Avançar Etapa →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* History Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Histórico de Mudanças de Etapa</span>
                </h4>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {apiService.getOpportunityHistory(detailOpportunity.id).map((h) => (
                    <div
                      key={h.id}
                      className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg text-[11px]"
                    >
                      <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                        <span className="font-bold text-slate-300">{h.user_name}</span>
                        <span className="font-mono">{formatDate(h.created_at)}</span>
                      </div>
                      <p className="text-slate-300">{h.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setDetailOpportunity(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Opportunity Modal */}
      <OpportunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refreshUser()}
      />
    </div>
  );
};
