import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  Bank,
  Product,
  Agreement,
  CommissionRule,
  CommissionPreview,
  OperationCommission,
  CommissionStatusHistory,
  Opportunity,
  Contract,
  CommissionStatus,
  CommissionType,
  SellerCommissionType,
} from '../../types/crm';
import {
  Calculator,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Building2,
  FileText,
  UserCheck,
  Percent,
  ChevronRight,
  Sparkles,
  Info,
  ShieldCheck,
  RefreshCw,
  Eye,
  Check,
  X,
  FileCheck,
  AlertCircle,
  RotateCcw,
  Send,
  FileSpreadsheet,
} from 'lucide-react';
import { ExcelImportModal } from './ExcelImportModal';

interface CommissionsViewProps {
  initialTab?: 'simulador' | 'gestao' | 'regras';
  prefilledOpportunityId?: string;
  prefilledContractId?: string;
}

export const CommissionsView: React.FC<CommissionsViewProps> = ({
  initialTab = 'simulador',
  prefilledOpportunityId,
  prefilledContractId,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'simulador' | 'gestao' | 'regras'>(initialTab);

  // Data states
  const [banks, setBanks] = useState<Bank[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [operations, setOperations] = useState<OperationCommission[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Simulator Form States
  const [selectedSourceType, setSelectedSourceType] = useState<'custom' | 'opportunity' | 'contract'>(
    prefilledContractId ? 'contract' : prefilledOpportunityId ? 'opportunity' : 'custom'
  );
  const [selectedOppId, setSelectedOppId] = useState<string>(prefilledOpportunityId || '');
  const [selectedContractId, setSelectedContractId] = useState<string>(prefilledContractId || '');

  const [simBancoId, setSimBancoId] = useState<string>('');
  const [simProdutoId, setSimProdutoId] = useState<string>('');
  const [simConvenioId, setSimConvenioId] = useState<string>('');
  const [simValor, setSimValor] = useState<string>('20000');
  const [simPrazo, setSimPrazo] = useState<string>('84');
  const [simNotes, setSimNotes] = useState<string>('');

  const [calculatedPreview, setCalculatedPreview] = useState<CommissionPreview | null>(null);
  const [isSubmittingPreview, setIsSubmittingPreview] = useState(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState<string | null>(null);
  const [simErrorMsg, setSimErrorMsg] = useState<string | null>(null);

  // Operations List Filter States
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [filterBanco, setFilterBanco] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Approval / Rejection Modals
  const [selectedCommForAction, setSelectedCommForAction] = useState<OperationCommission | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'details' | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [commHistories, setCommHistories] = useState<CommissionStatusHistory[]>([]);

  // Rule Creation Modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [ruleFormData, setRuleFormData] = useState({
    banco_id: '',
    produto_id: '',
    convenio_id: '',
    prazo_min: '1',
    prazo_max: '84',
    valor_min: '0',
    valor_max: '1000000',
    tipo_comissao_banco: 'PERCENTUAL' as CommissionType,
    valor_comissao_banco: '6.0',
    tipo_comissao_vendedor: 'PERCENTUAL_DO_BANCO' as SellerCommissionType,
    valor_comissao_vendedor: '50.0',
    status: 'Ativa' as 'Ativa' | 'Inativa',
    observacoes: '',
  });

  const canApprove = apiService.hasPermission(currentUser, 'aprovar_comissao');
  const canManageRules = apiService.hasPermission(currentUser, 'gerenciar_regras_comissao');
  const canImportRules = apiService.hasPermission(currentUser, 'gerenciar_regras_comissao') || apiService.hasPermission(currentUser, 'importar_regras_comissao');

  // Load all initial data
  const loadAllData = () => {
    const bList = apiService.getBanks();
    const pList = apiService.getProducts();
    const aList = apiService.getAgreements();
    const rList = apiService.getCommissionRules();
    const oList = apiService.getOperationCommissions(currentUser);
    const oppList = apiService.getOpportunities(currentUser);
    const ctrList = apiService.getContracts(currentUser);

    setBanks(bList);
    setProducts(pList);
    setAgreements(aList);
    setRules(rList);
    setOperations(oList);
    setOpportunities(oppList);
    setContracts(ctrList);

    if (bList.length > 0 && !simBancoId) {
      setSimBancoId(bList[0].id);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [currentUser]);

  // Update product list based on bank
  useEffect(() => {
    if (simBancoId) {
      const filteredProds = products.filter((p) => p.banco_id === simBancoId);
      if (filteredProds.length > 0 && (!simProdutoId || !filteredProds.some((p) => p.id === simProdutoId))) {
        setSimProdutoId(filteredProds[0].id);
      }
    }
  }, [simBancoId, products]);

  // Update agreement list based on product
  useEffect(() => {
    if (simProdutoId) {
      const filteredAgrees = agreements.filter((a) => a.produto_id === simProdutoId);
      if (filteredAgrees.length > 0 && (!simConvenioId || !filteredAgrees.some((a) => a.id === simConvenioId))) {
        setSimConvenioId(filteredAgrees[0].id);
      } else if (filteredAgrees.length === 0) {
        setSimConvenioId('');
      }
    }
  }, [simProdutoId, agreements]);

  // Handle source selection in simulator (Opportunity vs Contract vs Custom)
  useEffect(() => {
    if (selectedSourceType === 'opportunity' && selectedOppId) {
      const opp = opportunities.find((o) => o.id === selectedOppId);
      if (opp) {
        if (opp.banco_id) setSimBancoId(opp.banco_id);
        if (opp.produto_id) setSimProdutoId(opp.produto_id);
        setSimValor(opp.valor.toString());
        setSimPrazo(opp.prazo.toString());
      }
    } else if (selectedSourceType === 'contract' && selectedContractId) {
      const ctr = contracts.find((c) => c.id === selectedContractId);
      if (ctr) {
        if (ctr.banco_id) setSimBancoId(ctr.banco_id);
        if (ctr.produto_id) setSimProdutoId(ctr.produto_id);
        setSimValor(ctr.valor.toString());
        setSimPrazo(ctr.prazo.toString());
      }
    }
  }, [selectedSourceType, selectedOppId, selectedContractId, opportunities, contracts]);

  // Handle Calculate Preview
  const handleCalculatePreview = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSimSuccessMsg(null);
    setSimErrorMsg(null);

    if (!simBancoId || !simProdutoId) {
      setSimErrorMsg('Selecione o Banco e o Produto para calcular a prévia.');
      return;
    }

    const valNum = parseFloat(simValor.replace(',', '.'));
    const prazoNum = parseInt(simPrazo, 10);

    if (isNaN(valNum) || valNum <= 0) {
      setSimErrorMsg('Informe um valor de operação válido e maior que zero.');
      return;
    }

    if (isNaN(prazoNum) || prazoNum <= 0) {
      setSimErrorMsg('Informe um prazo válido em parcelas/meses.');
      return;
    }

    const preview = apiService.calculateCommissionPreview({
      banco_id: simBancoId,
      produto_id: simProdutoId,
      convenio_id: simConvenioId || null,
      valor_operacao: valNum,
      prazo: prazoNum,
      opportunity_id: selectedSourceType === 'opportunity' ? selectedOppId : null,
      contract_id: selectedSourceType === 'contract' ? selectedContractId : null,
    });

    setCalculatedPreview(preview);
  };

  // Submit Calculated Preview to Approval Queue
  const handleSubmitPreviewForApproval = async () => {
    if (!calculatedPreview || !calculatedPreview.matched || !currentUser) return;
    setIsSubmittingPreview(true);
    setSimErrorMsg(null);
    setSimSuccessMsg(null);

    try {
      const createdOpComm = await apiService.saveCommissionPreviewAsOperation(
        calculatedPreview,
        currentUser,
        simNotes
      );
      setSimSuccessMsg(`Prévia de comissão enviada com sucesso para aprovação! ID: #${createdOpComm.id}`);
      setOperations(apiService.getOperationCommissions(currentUser));
      // Reset preview
      setCalculatedPreview(null);
    } catch (err: any) {
      setSimErrorMsg(err.message || 'Erro ao submeter comissão para aprovação.');
    } finally {
      setIsSubmittingPreview(false);
    }
  };

  // Quick Open Rule Modal for unmatched criteria
  const handleOpenRuleForUnmatched = () => {
    if (!calculatedPreview || !calculatedPreview.unmatched_criteria) return;
    const crit = calculatedPreview.unmatched_criteria;

    setEditingRule(null);
    setRuleFormData({
      banco_id: calculatedPreview.banco_id || (banks[0]?.id || ''),
      produto_id: calculatedPreview.produto_id || (products[0]?.id || ''),
      convenio_id: calculatedPreview.convenio_id || '',
      prazo_min: '1',
      prazo_max: Math.max(84, crit.prazo).toString(),
      valor_min: '0',
      valor_max: Math.max(100000, crit.valor * 2).toString(),
      tipo_comissao_banco: 'PERCENTUAL',
      valor_comissao_banco: '6.0',
      tipo_comissao_vendedor: 'PERCENTUAL_DO_BANCO',
      valor_comissao_vendedor: '50.0',
      status: 'Ativa',
      observacoes: `Regra cadastrada automaticamente a partir do calculador de prévia para ${crit.banco_nome} / ${crit.produto_nome}.`,
    });
    setIsRuleModalOpen(true);
  };

  // Handle Approve Action
  const handleConfirmApproval = async () => {
    if (!selectedCommForAction || !currentUser) return;
    setIsActionSubmitting(true);
    try {
      await apiService.approveCommission(selectedCommForAction.id, currentUser, approvalNotes);
      setOperations(apiService.getOperationCommissions(currentUser));
      setActionType(null);
      setSelectedCommForAction(null);
      setApprovalNotes('');
    } catch (err: any) {
      alert(err.message || 'Erro ao aprovar comissão.');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Handle Return for Revision Action
  const handleConfirmReturn = async () => {
    if (!selectedCommForAction || !currentUser) return;
    if (!rejectionReason.trim()) {
      alert('Por favor, informe a justificativa da devolução para revisão.');
      return;
    }
    setIsActionSubmitting(true);
    try {
      await apiService.returnCommissionForRevision(selectedCommForAction.id, currentUser, rejectionReason);
      setOperations(apiService.getOperationCommissions(currentUser));
      setActionType(null);
      setSelectedCommForAction(null);
      setRejectionReason('');
    } catch (err: any) {
      alert(err.message || 'Erro ao devolver comissão para revisão.');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Handle Resubmit for Approval
  const handleResubmitForApproval = async (comm: OperationCommission) => {
    if (!currentUser) return;
    try {
      await apiService.resubmitCommissionForApproval(comm.id, currentUser);
      setOperations(apiService.getOperationCommissions(currentUser));
      alert('Comissão reenviada com sucesso para a fila de aprovação!');
    } catch (err: any) {
      alert(err.message || 'Erro ao reenviar comissão.');
    }
  };

  // Open Details Modal
  const handleOpenDetails = (comm: OperationCommission) => {
    setSelectedCommForAction(comm);
    const hist = apiService.getCommissionStatusHistory(comm.id);
    setCommHistories(hist);
    setActionType('details');
  };

  // Save / Update Rule
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const bankObj = banks.find((b) => b.id === ruleFormData.banco_id);
      const prodObj = products.find((p) => p.id === ruleFormData.produto_id);
      const agreeObj = ruleFormData.convenio_id ? agreements.find((a) => a.id === ruleFormData.convenio_id) : null;

      const rulePayload = {
        banco_id: ruleFormData.banco_id,
        banco_nome: bankObj?.nome || 'Banco',
        produto_id: ruleFormData.produto_id,
        produto_nome: prodObj?.nome || 'Produto',
        convenio_id: ruleFormData.convenio_id || null,
        convenio_nome: agreeObj?.nome || null,
        prazo_min: parseInt(ruleFormData.prazo_min, 10) || 1,
        prazo_max: parseInt(ruleFormData.prazo_max, 10) || 84,
        valor_min: parseFloat(ruleFormData.valor_min.replace(',', '.')) || 0,
        valor_max: parseFloat(ruleFormData.valor_max.replace(',', '.')) || 1000000,
        tipo_comissao_banco: ruleFormData.tipo_comissao_banco,
        valor_comissao_banco: parseFloat(ruleFormData.valor_comissao_banco.replace(',', '.')) || 0,
        tipo_comissao_vendedor: ruleFormData.tipo_comissao_vendedor,
        valor_comissao_vendedor: parseFloat(ruleFormData.valor_comissao_vendedor.replace(',', '.')) || 0,
        tipo_comissao: ruleFormData.tipo_comissao_banco,
        valor_comissao: parseFloat(ruleFormData.valor_comissao_banco.replace(',', '.')) || 0,
        status: ruleFormData.status,
        observacoes: ruleFormData.observacoes,
      };

      if (editingRule) {
        await apiService.updateCommissionRule(editingRule.id, rulePayload, currentUser);
      } else {
        await apiService.createCommissionRule(rulePayload, currentUser);
      }

      setRules(apiService.getCommissionRules());
      setIsRuleModalOpen(false);
      setEditingRule(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar regra de comissão.');
    }
  };

  // Delete Rule
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Deseja realmente excluir esta regra de comissão?')) return;
    try {
      await apiService.deleteCommissionRule(ruleId, currentUser);
      setRules(apiService.getCommissionRules());
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir regra.');
    }
  };

  // Metrics calculation for Operations
  const filteredOperations = operations.filter((op) => {
    if (filterStatus !== 'TODOS' && op.status !== filterStatus) return false;
    if (filterBanco !== 'TODOS' && op.banco_id !== filterBanco) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchClient = op.client_name.toLowerCase().includes(q);
      const matchSeller = op.vendedor_nome.toLowerCase().includes(q);
      const matchContract = op.numero_contrato?.toLowerCase().includes(q);
      const matchBank = op.banco_nome.toLowerCase().includes(q);
      if (!matchClient && !matchSeller && !matchContract && !matchBank) return false;
    }
    return true;
  });

  const totalOpsCount = operations.length;
  const totalPendingCount = operations.filter((o) => o.status === 'PENDENTE_APROVACAO').length;
  const totalApprovedCount = operations.filter((o) => o.status === 'APROVADA').length;

  const totalCommissaoBancoSum = operations
    .filter((o) => o.status === 'APROVADA' || o.status === 'PENDENTE_APROVACAO')
    .reduce((sum, o) => sum + o.comissao_banco_valor, 0);

  const totalCommissaoVendedorSum = operations
    .filter((o) => o.status === 'APROVADA' || o.status === 'PENDENTE_APROVACAO')
    .reduce((sum, o) => sum + o.comissao_vendedor_valor, 0);

  const totalResultadoEmpresaSum = operations
    .filter((o) => o.status === 'APROVADA' || o.status === 'PENDENTE_APROVACAO')
    .reduce((sum, o) => sum + o.resultado_empresa_valor, 0);

  const getStatusBadge = (status: CommissionStatus) => {
    switch (status) {
      case 'PENDENTE_APROVACAO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F2B807]/20 text-[#022859] border border-[#F2B807]/60">
            <Clock className="w-3.5 h-3.5 text-[#F28907]" />
            Pendente de Aprovação
          </span>
        );
      case 'APROVADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Aprovada
          </span>
        );
      case 'DEVOLVIDA_PARA_REVISAO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F28907]/20 text-[#022859] border border-[#F28907]/60">
            <RotateCcw className="w-3.5 h-3.5 text-[#F28907]" />
            Devolvida para Revisão
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#022859] text-white rounded-2xl p-6 border border-[#034AA6]/50 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#F2B807] text-[#022859]">
              Fase 4 • Motor de Comissionamento
            </span>
            <span className="text-xs text-blue-200">Cred Sempre +</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">
            Comissões & Resultado Previsto da Empresa
          </h2>
          <p className="text-xs lg:text-sm text-blue-100/90 max-w-2xl">
            Cálculo automático de prévias por regras oficiais de banco, separação da margem da empresa e esteira de aprovação.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <div className="p-3 bg-[#034AA6] rounded-xl border border-[#F2B807]/40 flex items-center gap-3 shadow-md">
            <Calculator className="w-8 h-8 text-[#F2B807]" />
            <div>
              <p className="text-[10px] text-blue-200 font-semibold uppercase">Cálculo de Backend</p>
              <p className="text-xs font-bold text-white">PHP REST + MySQL</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('simulador')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'simulador'
              ? 'bg-[#034AA6] text-white shadow-md'
              : 'text-slate-600 hover:text-[#022859] hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-4 h-4 text-[#F2B807]" />
          <span>1. Simulador & Prévia</span>
        </button>

        <button
          onClick={() => setActiveTab('gestao')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'gestao'
              ? 'bg-[#034AA6] text-white shadow-md'
              : 'text-slate-600 hover:text-[#022859] hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#F2B807]" />
          <span>2. Gestão de Comissões ({operations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('regras')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'regras'
              ? 'bg-[#034AA6] text-white shadow-md'
              : 'text-slate-600 hover:text-[#022859] hover:bg-slate-100'
          }`}
        >
          <Percent className="w-4 h-4 text-[#F2B807]" />
          <span>3. Tabelas & Regras ({rules.length})</span>
        </button>
      </div>

      {/* TAB 1: SIMULADOR & PRÉVIA DE COMISSÃO */}
      {activeTab === 'simulador' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Card */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#022859] flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#034AA6]" />
                  Simulador de Prévia de Comissão
                </h3>
                <p className="text-xs text-slate-500">
                  Informe os dados da operação para consultar as regras ativas no MySQL.
                </p>
              </div>
            </div>

            {simSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{simSuccessMsg}</p>
                </div>
              </div>
            )}

            {simErrorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{simErrorMsg}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCalculatePreview} className="space-y-4">
              {/* Source Type Selector */}
              <div>
                <label className="block text-xs font-bold text-[#022859] mb-1.5">
                  Origem do Cálculo:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSourceType('custom')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-colors cursor-pointer ${
                      selectedSourceType === 'custom'
                        ? 'bg-[#034AA6] text-white border-[#034AA6] font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Simulação Avulsa
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSourceType('opportunity')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-colors cursor-pointer ${
                      selectedSourceType === 'opportunity'
                        ? 'bg-[#034AA6] text-white border-[#034AA6] font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Da Oportunidade
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSourceType('contract')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-colors cursor-pointer ${
                      selectedSourceType === 'contract'
                        ? 'bg-[#034AA6] text-white border-[#034AA6] font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Do Contrato
                  </button>
                </div>
              </div>

              {/* Select Opportunity if source === opportunity */}
              {selectedSourceType === 'opportunity' && (
                <div>
                  <label className="block text-xs font-bold text-[#022859] mb-1">
                    Selecione a Oportunidade:
                  </label>
                  <select
                    value={selectedOppId}
                    onChange={(e) => setSelectedOppId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                  >
                    <option value="">-- Selecione uma Oportunidade --</option>
                    {opportunities.map((opp) => (
                      <option key={opp.id} value={opp.id}>
                        {opp.client_name} • {opp.banco_nome} • R$ {opp.valor.toLocaleString('pt-BR')} ({opp.etapa})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Select Contract if source === contract */}
              {selectedSourceType === 'contract' && (
                <div>
                  <label className="block text-xs font-bold text-[#022859] mb-1">
                    Selecione o Contrato Emitido:
                  </label>
                  <select
                    value={selectedContractId}
                    onChange={(e) => setSelectedContractId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                  >
                    <option value="">-- Selecione um Contrato --</option>
                    {contracts.map((ctr) => (
                      <option key={ctr.id} value={ctr.id}>
                        #{ctr.numero_contrato} • {ctr.client_name} • R$ {ctr.valor.toLocaleString('pt-BR')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Bank & Product */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#022859] mb-1">
                    Banco Parceriro: *
                  </label>
                  <select
                    value={simBancoId}
                    onChange={(e) => setSimBancoId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                    required
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#022859] mb-1">
                    Produto / Linha de Crédito: *
                  </label>
                  <select
                    value={simProdutoId}
                    onChange={(e) => setSimProdutoId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                    required
                  >
                    {products
                      .filter((p) => p.banco_id === simBancoId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Agreement */}
              <div>
                <label className="block text-xs font-bold text-[#022859] mb-1">
                  Convênio (Opcional):
                </label>
                <select
                  value={simConvenioId}
                  onChange={(e) => setSimConvenioId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                >
                  <option value="">-- Todos os Convênios / Geral --</option>
                  {agreements
                    .filter((a) => a.produto_id === simProdutoId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                </select>
              </div>

              {/* Value & Prazo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#022859] mb-1">
                    Valor da Operação (R$): *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={simValor}
                      onChange={(e) => setSimValor(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#022859] mb-1">
                    Prazo (Parcelas / Meses): *
                  </label>
                  <input
                    type="number"
                    value={simPrazo}
                    onChange={(e) => setSimPrazo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#022859] mb-1">
                  Observações para Aprovação (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={simNotes}
                  onChange={(e) => setSimNotes(e.target.value)}
                  placeholder="Ex: Operação especial do vendedor com autorização prévia..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#034AA6] hover:bg-[#022859] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-[#F2B807]" />
                <span>Calcular Prévia no Backend (PHP / MySQL)</span>
              </button>
            </form>
          </div>

          {/* Results Card */}
          <div className="lg:col-span-6 space-y-4">
            {calculatedPreview ? (
              calculatedPreview.matched ? (
                /* MATCHED RULE RESULT */
                <div className="bg-white border-2 border-[#034AA6] rounded-2xl p-6 shadow-md space-y-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Regra Encontrada no Banco de Dados
                      </span>
                      <h3 className="text-lg font-black text-[#022859] mt-1">
                        Prévia de Comissionamento
                      </h3>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>

                  {/* Operation Summary */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <p className="text-[#022859]">
                      <strong>Operação:</strong> {calculatedPreview.banco_nome} • {calculatedPreview.produto_nome} ({calculatedPreview.convenio_nome})
                    </p>
                    <p className="text-slate-600">
                      <strong>Valor da Operação:</strong> R$ {calculatedPreview.valor_operacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • <strong>Prazo:</strong> {calculatedPreview.prazo} meses
                    </p>
                    <p className="text-[11px] text-blue-800 font-medium">
                      <strong>Regra Aplicada:</strong> {calculatedPreview.rule_summary}
                    </p>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="space-y-3">
                    {/* Bank Commission */}
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-blue-900 uppercase">1. Comissão Esperada do Banco</p>
                        <p className="text-xs text-blue-700 font-medium">{calculatedPreview.comissao_banco_descricao}</p>
                      </div>
                      <span className="text-base font-extrabold text-[#034AA6]">
                        R$ {calculatedPreview.comissao_banco_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Vendedor Commission */}
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-amber-900 uppercase">2. Comissão Destinada ao Vendedor</p>
                        <p className="text-xs text-amber-700 font-medium">{calculatedPreview.comissao_vendedor_descricao}</p>
                      </div>
                      <span className="text-base font-extrabold text-[#F28907]">
                        R$ {calculatedPreview.comissao_vendedor_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Resultado Empresa */}
                    <div className="p-4 bg-[#022859] text-white rounded-xl border border-[#034AA6] flex items-center justify-between shadow-md">
                      <div>
                        <p className="text-xs font-bold text-[#F2B807] uppercase">3. Resultado Previsto da Empresa</p>
                        <p className="text-[11px] text-blue-200">(Comissão do Banco − Comissão do Vendedor)</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-white block">
                          R$ {calculatedPreview.resultado_empresa_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    onClick={handleSubmitPreviewForApproval}
                    disabled={isSubmittingPreview}
                    className="w-full py-3 bg-[#034AA6] hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#F2B807]" />
                    <span>Gerar Prévia e Enviar para Fila de Aprovação</span>
                  </button>
                </div>
              ) : (
                /* UNMATCHED RULE ALERT */
                <div className="bg-white border-2 border-amber-400 rounded-2xl p-6 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                    <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-[#022859]">
                        Regra Não Encontrada
                      </h3>
                      <p className="text-xs font-bold text-amber-700 mt-0.5">
                        Não foi encontrada uma regra de comissão compatível com esta operação.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">
                    O motor de comissões consultou o banco de dados e verificou que nenhuma regra ativa atende rigorosamente a todos os critérios pesquisados.
                  </p>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5">
                    <p className="font-bold text-amber-900 border-b border-amber-200/60 pb-1">
                      Critérios Utilizados na Busca:
                    </p>
                    <ul className="space-y-1 text-amber-800 text-[11px]">
                      <li>• <strong>Banco:</strong> {calculatedPreview.unmatched_criteria?.banco_nome}</li>
                      <li>• <strong>Produto:</strong> {calculatedPreview.unmatched_criteria?.produto_nome}</li>
                      <li>• <strong>Convênio:</strong> {calculatedPreview.unmatched_criteria?.convenio_nome}</li>
                      <li>• <strong>Valor da Operação:</strong> R$ {calculatedPreview.unmatched_criteria?.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
                      <li>• <strong>Prazo Solicitado:</strong> {calculatedPreview.unmatched_criteria?.prazo} parcelas/meses</li>
                    </ul>
                  </div>

                  {canManageRules ? (
                    <button
                      onClick={handleOpenRuleForUnmatched}
                      className="w-full py-2.5 bg-[#034AA6] hover:bg-[#022859] text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Plus className="w-4 h-4 text-[#F2B807]" />
                      <span>➕ Cadastrar Regra Compatível Agora</span>
                    </button>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic text-center">
                      Entre em contato com um Administrador para cadastrar a regra de comissão necessária.
                    </p>
                  )}
                </div>
              )
            ) : (
              /* EMPTY PREVIEW PLACEHOLDER */
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3 flex flex-col items-center justify-center min-h-[360px]">
                <div className="w-12 h-12 rounded-full bg-[#034AA6]/10 text-[#034AA6] flex items-center justify-center">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#022859]">Aguardando Cálculo</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Preencha o formulário ao lado e clique em "Calcular Prévia" para visualizar a estimativa de comissões do banco e do vendedor.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GESTÃO DE COMISSÕES (OPERAÇÕES) */}
      {activeTab === 'gestao' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Total de Operações
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-[#022859]">{totalOpsCount}</span>
                <span className="p-2 bg-blue-50 text-[#034AA6] rounded-xl">
                  <FileText className="w-5 h-5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Com prévias registradas</p>
            </div>

            <div className="p-4 bg-white border border-amber-200 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">
                Pendentes de Aprovação
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-[#F28907]">{totalPendingCount}</span>
                <span className="p-2 bg-amber-50 text-[#F28907] rounded-xl">
                  <Clock className="w-5 h-5" />
                </span>
              </div>
              <p className="text-[11px] text-amber-800 font-medium">Aguardando validação</p>
            </div>

            <div className="p-4 bg-white border border-emerald-200 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                Comissão dos Vendedores
              </span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-emerald-800">
                  R$ {totalCommissaoVendedorSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">{totalApprovedCount} aprovadas</p>
            </div>

            <div className="p-4 bg-[#022859] text-white border border-[#034AA6] rounded-2xl shadow-md space-y-1">
              <span className="text-[10px] font-extrabold text-[#F2B807] uppercase tracking-wider block">
                Resultado da Empresa
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-white">
                  R$ {totalResultadoEmpresaSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="p-2 bg-[#034AA6] text-[#F2B807] rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </span>
              </div>
              <p className="text-[11px] text-blue-200">Resultado previsto da empresa</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="PENDENTE_APROVACAO">Pendente de Aprovação</option>
                <option value="APROVADA">Aprovada</option>
                <option value="DEVOLVIDA_PARA_REVISAO">Devolvida para Revisão</option>
              </select>

              {/* Bank Filter */}
              <select
                value={filterBanco}
                onChange={(e) => setFilterBanco(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="TODOS">Todos os Bancos</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar cliente, vendedor ou contrato..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              />
            </div>
          </div>

          {/* Operations Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#022859] text-white text-[11px] font-bold uppercase tracking-wider border-b border-[#034AA6]">
                    <th className="p-3.5">Operação / Cliente</th>
                    <th className="p-3.5">Vendedor</th>
                    <th className="p-3.5">Banco & Produto</th>
                    <th className="p-3.5 text-right">Valor Op. (R$)</th>
                    <th className="p-3.5 text-right">Com. Banco</th>
                    <th className="p-3.5 text-right">Com. Vendedor</th>
                    <th className="p-3.5 text-right">Resultado da Empresa</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredOperations.length > 0 ? (
                    filteredOperations.map((op) => (
                      <tr key={op.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <p className="font-extrabold text-[#022859]">{op.client_name}</p>
                          {op.numero_contrato ? (
                            <span className="text-[10px] font-bold text-[#034AA6] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              #{op.numero_contrato}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">ID: #{op.id}</span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <p className="font-medium text-slate-800">{op.vendedor_nome}</p>
                          {op.supervisor_nome && (
                            <p className="text-[10px] text-slate-500">Sup: {op.supervisor_nome}</p>
                          )}
                        </td>

                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{op.banco_nome}</p>
                          <p className="text-[11px] text-slate-600">{op.produto_nome} ({op.prazo}x)</p>
                        </td>

                        <td className="p-3.5 text-right font-extrabold text-slate-900">
                          R$ {op.valor_operacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3.5 text-right font-semibold text-blue-900">
                          R$ {op.comissao_banco_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3.5 text-right font-bold text-[#F28907]">
                          R$ {op.comissao_vendedor_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3.5 text-right font-black text-emerald-800">
                          R$ {op.resultado_empresa_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3.5 text-center">
                          {getStatusBadge(op.status)}
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Approve Button (from PENDENTE or DEVOLVIDA) */}
                            {op.status !== 'APROVADA' && canApprove && (
                              <button
                                onClick={() => {
                                  setSelectedCommForAction(op);
                                  setActionType('approve');
                                }}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                                title="Aprovar Comissão"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Devolver para Revisão Button (when PENDENTE_APROVACAO) */}
                            {op.status === 'PENDENTE_APROVACAO' && canApprove && (
                              <button
                                onClick={() => {
                                  setSelectedCommForAction(op);
                                  setActionType('reject');
                                }}
                                className="p-1.5 bg-[#F28907] hover:bg-[#d67600] text-white rounded-lg transition-colors cursor-pointer"
                                title="Devolver para Revisão (Justificativa Obrigatória)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Reenviar para Aprovação (when DEVOLVIDA_PARA_REVISAO) */}
                            {op.status === 'DEVOLVIDA_PARA_REVISAO' && (
                              <button
                                onClick={() => handleResubmitForApproval(op)}
                                className="p-1.5 bg-[#034AA6] hover:bg-[#022859] text-white rounded-lg transition-colors cursor-pointer"
                                title="Reenviar para Aprovação"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Details Button */}
                            <button
                              onClick={() => handleOpenDetails(op)}
                              className="p-1.5 bg-[#034AA6]/10 hover:bg-[#034AA6] text-[#034AA6] hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Ver Detalhes e Histórico"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                        Nenhuma comissão registrada para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TABELAS & REGRAS DE COMISSÃO */}
      {activeTab === 'regras' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
            <div>
              <h3 className="text-base font-extrabold text-[#022859]">
                Regras de Comissão Cadastradas no MySQL
              </h3>
              <p className="text-xs text-slate-500">
                Tabelas ativas consideradas pelo motor de cálculo do backend.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {canImportRules && (
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer border border-emerald-600"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#F2B807]" />
                  <span>Importar Excel (.xlsx)</span>
                </button>
              )}

              {canManageRules && (
                <button
                  onClick={() => {
                    setEditingRule(null);
                    setRuleFormData({
                      banco_id: banks[0]?.id || '',
                      produto_id: products[0]?.id || '',
                      convenio_id: '',
                      prazo_min: '1',
                      prazo_max: '84',
                      valor_min: '0',
                      valor_max: '1000000',
                      tipo_comissao_banco: 'PERCENTUAL',
                      valor_comissao_banco: '6.0',
                      tipo_comissao_vendedor: 'PERCENTUAL_DO_BANCO',
                      valor_comissao_vendedor: '50.0',
                      status: 'Ativa',
                      observacoes: '',
                    });
                    setIsRuleModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#034AA6] hover:bg-[#022859] text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#F2B807]" />
                  <span>Nova Regra Manual</span>
                </button>
              )}
            </div>
          </div>

          {/* Rules Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#022859] text-white text-[11px] font-bold uppercase tracking-wider border-b border-[#034AA6]">
                    <th className="p-3.5">Banco / Produto</th>
                    <th className="p-3.5">Convênio</th>
                    <th className="p-3.5">Faixa de Prazo</th>
                    <th className="p-3.5">Faixa de Valor</th>
                    <th className="p-3.5">Comissão Banco</th>
                    <th className="p-3.5">Comissão Vendedor</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rules.length > 0 ? (
                    rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <p className="font-extrabold text-[#022859]">{rule.banco_nome}</p>
                          <p className="text-[11px] text-slate-600">{rule.produto_nome}</p>
                        </td>

                        <td className="p-3.5 text-slate-800">
                          {rule.convenio_nome ? (
                            <span className="font-medium text-slate-900">{rule.convenio_nome}</span>
                          ) : (
                            <span className="text-slate-400 italic">Todos os Convênios</span>
                          )}
                        </td>

                        <td className="p-3.5 font-semibold text-slate-800">
                          {rule.prazo_min} a {rule.prazo_max} meses
                        </td>

                        <td className="p-3.5 font-semibold text-slate-800">
                          R$ {rule.valor_min.toLocaleString('pt-BR')} até R$ {rule.valor_max.toLocaleString('pt-BR')}
                        </td>

                        <td className="p-3.5 font-extrabold text-[#034AA6]">
                          {(rule.tipo_comissao_banco || rule.tipo_comissao) === 'PERCENTUAL'
                            ? `${rule.valor_comissao_banco ?? rule.valor_comissao}%`
                            : `R$ ${(rule.valor_comissao_banco ?? rule.valor_comissao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </td>

                        <td className="p-3.5 font-extrabold text-[#F28907]">
                          {rule.tipo_comissao_vendedor === 'PERCENTUAL_DO_BANCO'
                            ? `${rule.valor_comissao_vendedor}% do Banco`
                            : rule.tipo_comissao_vendedor === 'PERCENTUAL_DA_OPERACAO'
                            ? `${rule.valor_comissao_vendedor}% da Operação`
                            : `R$ ${rule.valor_comissao_vendedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Fixo`}
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rule.status === 'Ativa'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {rule.status}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          {canManageRules ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingRule(rule);
                                  setRuleFormData({
                                    banco_id: rule.banco_id,
                                    produto_id: rule.produto_id,
                                    convenio_id: rule.convenio_id || '',
                                    prazo_min: rule.prazo_min.toString(),
                                    prazo_max: rule.prazo_max.toString(),
                                    valor_min: rule.valor_min.toString(),
                                    valor_max: rule.valor_max.toString(),
                                    tipo_comissao_banco: rule.tipo_comissao_banco || rule.tipo_comissao || 'PERCENTUAL',
                                    valor_comissao_banco: (rule.valor_comissao_banco ?? rule.valor_comissao ?? 0).toString(),
                                    tipo_comissao_vendedor: rule.tipo_comissao_vendedor || 'PERCENTUAL_DO_BANCO',
                                    valor_comissao_vendedor: rule.valor_comissao_vendedor.toString(),
                                    status: rule.status,
                                    observacoes: rule.observacoes || '',
                                  });
                                  setIsRuleModalOpen(true);
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
                              >
                                Editar
                              </button>

                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
                              >
                                Excluir
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Apenas Leitura</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                        Nenhuma regra de comissão cadastrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL MODAL */}
      {actionType === 'approve' && selectedCommForAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#022859] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Aprovar Comissão de Operação
              </h3>
              <button
                onClick={() => setActionType(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="font-bold text-[#022859]">{selectedCommForAction.client_name}</p>
              <p className="text-slate-600">Vendedor: {selectedCommForAction.vendedor_nome}</p>
              <p className="text-slate-600">Banco: {selectedCommForAction.banco_nome}</p>
              <p className="font-extrabold text-emerald-700 text-sm mt-1">
                Comissão do Vendedor: R$ {selectedCommForAction.comissao_vendedor_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#022859] mb-1">
                Observações da Aprovação (Opcional):
              </label>
              <textarea
                rows={2}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Ex: Liberado conforme regra do mês..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActionType(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmApproval}
                disabled={isActionSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
              >
                Confirmar Aprovação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEVOLUCAO PARA REVISAO MODAL */}
      {actionType === 'reject' && selectedCommForAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#022859] flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-[#F28907]" />
                Devolver Comissão para Revisão
              </h3>
              <button
                onClick={() => setActionType(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900">
              <p className="font-bold">{selectedCommForAction.client_name}</p>
              <p>Vendedor: {selectedCommForAction.vendedor_nome}</p>
              <p>Valor da Comissão: R$ {selectedCommForAction.comissao_vendedor_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#022859] mb-1">
                Justificativa da Devolução (Obrigatória): *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Informe o motivo específico ou correções necessárias antes da aprovação..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActionType(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReturn}
                disabled={isActionSubmitting}
                className="px-4 py-2 bg-[#F28907] hover:bg-[#d67600] text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
              >
                Confirmar Devolução para Revisão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {actionType === 'details' && selectedCommForAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#022859] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#034AA6]" />
                Detalhes da Comissão #{selectedCommForAction.id}
              </h3>
              <button
                onClick={() => setActionType(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">Cliente</span>
                  <span className="font-extrabold text-[#022859]">{selectedCommForAction.client_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">Vendedor</span>
                  <span className="font-bold text-slate-900">{selectedCommForAction.vendedor_nome}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">Banco & Produto</span>
                  <span className="font-semibold text-slate-900">{selectedCommForAction.banco_nome} • {selectedCommForAction.produto_nome}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">Valor da Operação</span>
                  <span className="font-extrabold text-slate-900">R$ {selectedCommForAction.valor_operacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <p className="text-[11px] font-bold text-blue-900">Comissão do Banco: R$ {selectedCommForAction.comissao_banco_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[11px] font-bold text-[#F28907]">Comissão do Vendedor: R$ {selectedCommForAction.comissao_vendedor_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[11px] font-bold text-emerald-800">Resultado Previsto da Empresa: R$ {selectedCommForAction.resultado_empresa_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>

              {(selectedCommForAction.motivo_devolucao || selectedCommForAction.motivo_rejeicao) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <p className="font-bold">Justificativa da Devolução para Revisão:</p>
                  <p>{selectedCommForAction.motivo_devolucao || selectedCommForAction.motivo_rejeicao}</p>
                </div>
              )}

              {/* Status History Timeline */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <h4 className="font-extrabold text-[#022859] text-xs">Histórico de Alterações de Status:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {commHistories.map((h) => (
                    <div key={h.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
                      <div className="flex items-center justify-between font-bold text-[#022859]">
                        <span>{h.user_name}</span>
                        <span className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{h.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActionType(null)}
                className="px-4 py-2 bg-[#022859] text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RULE MODAL */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#022859] flex items-center gap-2">
                <Percent className="w-5 h-5 text-[#034AA6]" />
                {editingRule ? 'Editar Regra de Comissão' : 'Nova Regra de Comissão'}
              </h3>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              {/* Bank & Product */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#022859] mb-1">
                    Banco Parceriro: *
                  </label>
                  <select
                    value={ruleFormData.banco_id}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, banco_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                    required
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#022859] mb-1">
                    Produto: *
                  </label>
                  <select
                    value={ruleFormData.produto_id}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, produto_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                    required
                  >
                    {products
                      .filter((p) => p.banco_id === ruleFormData.banco_id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Agreement */}
              <div>
                <label className="block text-xs font-bold text-[#022859] mb-1">
                  Convênio Específico:
                </label>
                <select
                  value={ruleFormData.convenio_id}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, convenio_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                >
                  <option value="">-- Todos os Convênios (Regra Geral) --</option>
                  {agreements
                    .filter((a) => a.produto_id === ruleFormData.produto_id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                </select>
              </div>

              {/* Prazo & Valor ranges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#022859] mb-1">
                    Prazo Mín (m):
                  </label>
                  <input
                    type="number"
                    value={ruleFormData.prazo_min}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, prazo_min: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#022859] mb-1">
                    Prazo Máx (m):
                  </label>
                  <input
                    type="number"
                    value={ruleFormData.prazo_max}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, prazo_max: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#022859] mb-1">
                    Valor Mín (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleFormData.valor_min}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, valor_min: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#022859] mb-1">
                    Valor Máx (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleFormData.valor_max}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, valor_max: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              {/* Bank Commission section */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <p className="font-extrabold text-[#034AA6]">Comissão do Banco (Recebida pela Empresa)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-blue-900 mb-1">Tipo:</label>
                    <select
                      value={ruleFormData.tipo_comissao_banco}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, tipo_comissao_banco: e.target.value as CommissionType })}
                      className="w-full px-2.5 py-1.5 border border-blue-300 rounded-xl text-xs bg-white"
                    >
                      <option value="PERCENTUAL">PERCENTUAL (%)</option>
                      <option value="FIXA">VALOR FIXO (R$)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-blue-900 mb-1">Valor / Percentual Banco:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ruleFormData.valor_comissao_banco}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, valor_comissao_banco: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-blue-300 rounded-xl text-xs font-bold text-blue-950"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Seller Commission section */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <p className="font-extrabold text-[#F28907]">Comissão do Vendedor</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">Tipo do Repasse:</label>
                    <select
                      value={ruleFormData.tipo_comissao_vendedor}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, tipo_comissao_vendedor: e.target.value as SellerCommissionType })}
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-xl text-xs bg-white"
                    >
                      <option value="PERCENTUAL_DO_BANCO">% da Comissão do Banco (ex: 50%)</option>
                      <option value="PERCENTUAL_DA_OPERACAO">% da Operação Total (ex: 2%)</option>
                      <option value="FIXA">VALOR FIXO (R$ fixo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">Valor / Taxa Vendedor:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={ruleFormData.valor_comissao_vendedor}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, valor_comissao_vendedor: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-xl text-xs font-bold text-amber-950"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Status & Observações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#022859] mb-1">Status:</label>
                  <select
                    value={ruleFormData.status}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, status: e.target.value as 'Ativa' | 'Inativa' })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white"
                  >
                    <option value="Ativa">Ativa</option>
                    <option value="Inativa">Inativa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#022859] mb-1">Observações:</label>
                  <input
                    type="text"
                    value={ruleFormData.observacoes}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, observacoes: e.target.value })}
                    placeholder="Notas adicionais sobre esta regra..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#034AA6] hover:bg-[#022859] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  {editingRule ? 'Salvar Alterações' : 'Cadastrar Regra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT MODAL */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          loadAllData();
        }}
        banks={banks}
        products={products}
        agreements={agreements}
      />
    </div>
  );
};
