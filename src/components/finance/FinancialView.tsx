import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  FinancialRevenue,
  FinancialOperationalCost,
  FinancialGeneralExpense,
  FinancialOverviewSummary,
  Bank,
  Product,
  Agreement,
  User,
  Opportunity,
  Contract,
  OperationCommission,
  GeneralExpenseCategory,
  GeneralExpenseStatus,
} from '../../types/crm';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  Filter,
  Search,
  Plus,
  RefreshCw,
  Building2,
  FileText,
  History,
  TrendingDown,
  Sparkles,
  PieChart,
  SlidersHorizontal,
  ChevronRight,
  CreditCard,
  Layers,
  FileCheck,
  Check,
  Eye,
  Trash2,
  Edit2,
  ShieldCheck,
  Coins,
  Ban,
  UserCheck,
} from 'lucide-react';
import { RegisterReceiptModal } from './RegisterReceiptModal';
import { ReceiptHistoryModal } from './ReceiptHistoryModal';
import { OperationalCostModal } from './OperationalCostModal';
import { NewRevenueModal } from './NewRevenueModal';
import { GeneralExpenseModal } from './GeneralExpenseModal';

interface FinancialViewProps {
  initialTab?: 'visao' | 'receitas' | 'custos' | 'despesas' | 'dre' | 'comissoes';
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  initialTab = 'visao',
}) => {
  const { currentUser } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'visao' | 'receitas' | 'custos' | 'despesas' | 'dre' | 'comissoes'>(initialTab);

  // Data states
  const [revenues, setRevenues] = useState<FinancialRevenue[]>([]);
  const [costs, setCosts] = useState<FinancialOperationalCost[]>([]);
  const [expenses, setExpenses] = useState<FinancialGeneralExpense[]>([]);
  const [summary, setSummary] = useState<FinancialOverviewSummary | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [operationCommissions, setOperationCommissions] = useState<OperationCommission[]>([]);

  // Filters for Revenues
  const [revenueStatusFilter, setRevenueStatusFilter] = useState<string>('TODOS');
  const [revenueBankFilter, setRevenueBankFilter] = useState<string>('TODOS');
  const [revenueSearch, setRevenueSearch] = useState<string>('');

  // Filters for Costs
  const [costStatusFilter, setCostStatusFilter] = useState<string>('TODOS');
  const [costCategoryFilter, setCostCategoryFilter] = useState<string>('TODOS');
  const [costSearch, setCostSearch] = useState<string>('');

  // Filters for Expenses
  const [expenseStatusFilter, setExpenseStatusFilter] = useState<string>('TODOS');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('TODOS');
  const [expenseSearch, setExpenseSearch] = useState<string>('');

  // Modals state
  const [selectedRevenueForReceipt, setSelectedRevenueForReceipt] = useState<FinancialRevenue | null>(null);
  const [selectedRevenueForHistory, setSelectedRevenueForHistory] = useState<FinancialRevenue | null>(null);
  const [isNewRevenueOpen, setIsNewRevenueOpen] = useState(false);

  const [costToEdit, setCostToEdit] = useState<FinancialOperationalCost | null>(null);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);

  const [expenseToEdit, setExpenseToEdit] = useState<FinancialGeneralExpense | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const [isSyncingCommissions, setIsSyncingCommissions] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const canManageRevenues = apiService.hasPermission(currentUser, 'visualizar_financeiro') || apiService.hasPermission(currentUser, 'gerenciar_receitas');
  const canRegisterReceipt = apiService.hasPermission(currentUser, 'visualizar_financeiro') || apiService.hasPermission(currentUser, 'registrar_recebimento');
  const canManageCosts = apiService.hasPermission(currentUser, 'visualizar_financeiro') || apiService.hasPermission(currentUser, 'gerenciar_custos_operacionais');

  const loadAllFinancialData = () => {
    const revs = apiService.getFinancialRevenues({
      status: revenueStatusFilter,
      bank_id: revenueBankFilter,
      search: revenueSearch,
    });
    setRevenues(revs);

    const csts = apiService.getFinancialOperationalCosts({
      status: costStatusFilter,
      category: costCategoryFilter,
      search: costSearch,
    });
    setCosts(csts);

    const exps = apiService.getFinancialGeneralExpenses({
      status: expenseStatusFilter,
      category: expenseCategoryFilter,
      search: expenseSearch,
    });
    setExpenses(exps);

    const summ = apiService.getFinancialOverviewSummary({
      bank_id: revenueBankFilter,
    });
    setSummary(summ);

    setBanks(apiService.getBanks());
    setProducts(apiService.getProducts());
    setAgreements(apiService.getAgreements());
    setUsers(apiService.getUsers());
    setOpportunities(apiService.getOpportunities(currentUser));
    setContracts(apiService.getContracts(currentUser));
    setOperationCommissions(apiService.getOperationCommissions(currentUser));
  };

  useEffect(() => {
    loadAllFinancialData();
  }, [
    revenueStatusFilter,
    revenueBankFilter,
    revenueSearch,
    costStatusFilter,
    costCategoryFilter,
    costSearch,
    expenseStatusFilter,
    expenseCategoryFilter,
    expenseSearch,
  ]);

  // Sync approved commissions to revenues
  const handleSyncCommissions = async () => {
    if (!currentUser) return;
    setIsSyncingCommissions(true);
    setSyncFeedback(null);
    try {
      const res = await apiService.syncApprovedCommissionsToRevenues(currentUser);
      if (res.syncedCount > 0) {
        setSyncFeedback(`Sucesso! ${res.syncedCount} nova(s) receita(s) financeira(s) gerada(s) a partir das comissões aprovadas.`);
      } else {
        setSyncFeedback('Todas as comissões aprovadas já estão sincronizadas com o financeiro.');
      }
      loadAllFinancialData();
    } catch (err: any) {
      alert(err.message || 'Erro ao sincronizar comissões com o financeiro.');
    } finally {
      setIsSyncingCommissions(false);
    }
  };

  // Toggle Cost status (Pago / Pendente)
  const handleToggleCostStatus = async (cost: FinancialOperationalCost) => {
    if (!currentUser) return;
    const newStatus = cost.status === 'PAGO' ? 'PENDENTE' : 'PAGO';
    try {
      await apiService.updateFinancialOperationalCost(
        cost.id,
        {
          status: newStatus,
          payment_date: newStatus === 'PAGO' ? new Date().toISOString().split('T')[0] : null,
        },
        currentUser
      );
      loadAllFinancialData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status do custo.');
    }
  };

  // Delete Cost
  const handleDeleteCost = async (costId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este custo operacional?')) return;
    try {
      await apiService.deleteFinancialOperationalCost(costId, currentUser);
      loadAllFinancialData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir custo.');
    }
  };

  // Toggle Expense Status (Pago / Pendente)
  const handleToggleExpenseStatus = async (expense: FinancialGeneralExpense) => {
    if (!currentUser) return;
    const newStatus = expense.status === 'PAGO' ? 'PENDENTE' : 'PAGO';
    try {
      await apiService.updateFinancialGeneralExpense(
        expense.id,
        {
          status: newStatus,
          payment_date: newStatus === 'PAGO' ? new Date().toISOString().split('T')[0] : null,
        },
        currentUser
      );
      loadAllFinancialData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status da despesa.');
    }
  };

  // Cancel Expense
  const handleCancelExpense = async (expense: FinancialGeneralExpense) => {
    if (!currentUser) return;
    if (!window.confirm('Tem certeza que deseja cancelar esta despesa geral?')) return;
    try {
      await apiService.updateFinancialGeneralExpense(
        expense.id,
        {
          status: 'CANCELADO',
          payment_date: null,
        },
        currentUser
      );
      loadAllFinancialData();
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar despesa.');
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente esta despesa geral?')) return;
    try {
      await apiService.deleteFinancialGeneralExpense(expenseId, currentUser);
      loadAllFinancialData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir despesa.');
    }
  };

  // Pay Seller Commission Repasse
  const handlePaySellerCommission = async (commissionId: string) => {
    if (!currentUser) return;
    if (!window.confirm('Tem certeza que deseja registrar o pagamento desta comissão para o vendedor?')) return;
    try {
      await apiService.paySellerCommission(
        commissionId,
        new Date().toISOString().split('T')[0],
        currentUser
      );
      loadAllFinancialData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar pagamento de comissão.');
    }
  };

  // Category labels helper for Costs
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'CONSULTA_BUREAU':
        return { label: 'Consulta CPF / Bureau', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'MOTOBOY_LOGISTICA':
        return { label: 'Motoboy / Logística', color: 'bg-amber-100 text-amber-900 border-amber-200' };
      case 'CERTIDAO_CARTORIO':
        return { label: 'Certidão / Cartório', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'TAXA_AVERBACAO_EMISSAO':
        return { label: 'Taxa Averbação / CCB', color: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'TAXA_BANCARIA_TED':
        return { label: 'Taxa Bancária / TED', color: 'bg-slate-100 text-slate-800 border-slate-200' };
      default:
        return { label: 'Outro Custo', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  // Category labels helper for General Expenses
  const getExpenseCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'ALUGUEL':
        return { label: 'Aluguel', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'TELEFONE':
        return { label: 'Telefone', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
      case 'INTERNET':
        return { label: 'Internet', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'TRAFEGO_PAGO':
        return { label: 'Tráfego Pago', color: 'bg-pink-100 text-pink-800 border-pink-200' };
      case 'SALARIOS':
        return { label: 'Salários', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'COMISSOES_VENDEDORES':
        return { label: 'Comissões de Vendedores', color: 'bg-amber-100 text-amber-900 border-amber-200' };
      case 'FERRAMENTAS':
        return { label: 'Ferramentas / Software', color: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'CONTABILIDADE':
        return { label: 'Contabilidade', color: 'bg-slate-100 text-slate-800 border-slate-200' };
      case 'HOSPEDAGEM':
        return { label: 'Hospedagem / Servidores', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'MATERIAL_ESCRITORIO':
        return { label: 'Material de Escritório', color: 'bg-orange-100 text-orange-800 border-orange-200' };
      default:
        return { label: 'Outros Gerais', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#022859] via-[#034AA6] to-[#022859] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F2B807] text-[#022859]">
                Fase 5 • Parte 2
              </span>
              <span className="text-xs text-blue-200 font-semibold">
                Despesas, DRE, Repasses & Rentabilidade
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <DollarSign className="w-7 h-7 text-[#F2B807]" />
              Gestão Financeira, DRE & Rentabilidade
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-2xl">
              Controle avançado de despesas administrativas gerais, liquidação de comissões devidas aos vendedores, e análise em tempo real do Demonstrativo de Resultado do Exercício (DRE) com Lucro Líquido e Rentabilidade.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canManageRevenues && activeTab === 'receitas' && (
              <button
                onClick={handleSyncCommissions}
                disabled={isSyncingCommissions}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-sm cursor-pointer disabled:opacity-50"
                title="Gera receitas financeiras para todas as comissões aprovadas na Fase 4"
              >
                <RefreshCw className={`w-4 h-4 text-[#F2B807] ${isSyncingCommissions ? 'animate-spin' : ''}`} />
                <span>{isSyncingCommissions ? 'Sincronizando...' : 'Sincronizar Comissões'}</span>
              </button>
            )}

            {canManageRevenues && activeTab === 'despesas' && (
              <button
                onClick={() => {
                  setExpenseToEdit(null);
                  setIsExpenseModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#F2B807] hover:bg-[#F28907] text-[#022859] hover:text-white rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Lançar Despesa</span>
              </button>
            )}

            {canManageRevenues && activeTab === 'receitas' && (
              <button
                onClick={() => setIsNewRevenueOpen(true)}
                className="px-4 py-2.5 bg-[#F2B807] hover:bg-[#F28907] text-[#022859] hover:text-white rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Receita</span>
              </button>
            )}
          </div>
        </div>

        {syncFeedback && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs text-emerald-200 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{syncFeedback}</span>
            </div>
            <button onClick={() => setSyncFeedback(null)} className="text-emerald-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('visao')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'visao'
              ? 'bg-[#034AA6] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PieChart className="w-4 h-4 text-[#F2B807]" />
          <span>Painel de Visão</span>
        </button>

        <button
          onClick={() => setActiveTab('receitas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'receitas'
              ? 'bg-[#034AA6] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4 text-[#F2B807]" />
          <span>Receitas ({revenues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('custos')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'custos'
              ? 'bg-[#034AA6] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4 text-[#F2B807]" />
          <span>Custos Operacionais ({costs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('despesas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'despesas'
              ? 'bg-[#034AA6] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4 text-[#F2B807]" />
          <span>Despesas Gerais ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('comissoes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'comissoes'
              ? 'bg-[#034AA6] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4 text-[#F2B807]" />
          <span>Repasses & Comissões</span>
        </button>

        <button
          onClick={() => setActiveTab('dre')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'dre'
              ? 'bg-[#034AA6] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-[#F2B807]" />
          <span>DRE Simplificado</span>
        </button>
      </div>

      {/* TAB 1: VISÃO FINANCEIRA */}
      {activeTab === 'visao' && summary && (
        <div className="space-y-6">
          {/* Main KPI Cards - ROW 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Recebido */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-2 bg-gradient-to-br from-white to-emerald-50/20">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <span>Comissões Recebidas (Receita Real)</span>
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                R$ {summary.totalReceivedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500">
                Previsto total: R$ {summary.totalExpectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Custos Operacionais Pagos */}
            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm space-y-2 bg-gradient-to-br from-white to-rose-50/20">
              <div className="flex items-center justify-between text-rose-800 text-xs font-bold uppercase tracking-wider">
                <span>Custos Operacionais Pagos</span>
                <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <Receipt className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono">
                R$ {summary.paidOperationalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500">
                Previsto total: R$ {summary.totalOperationalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Despesas Gerais Pagas */}
            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-2 bg-gradient-to-br from-white to-amber-50/20">
              <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wider">
                <span>Despesas Gerais Pagas</span>
                <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <CreditCard className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-amber-700 font-mono">
                R$ {summary.paidGeneralExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500">
                Previsto total: R$ {summary.totalGeneralExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Comissões Vendedores Pagas */}
            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm space-y-2 bg-gradient-to-br from-white to-blue-50/20">
              <div className="flex items-center justify-between text-blue-800 text-xs font-bold uppercase tracking-wider">
                <span>Repasses Pagos a Vendedores</span>
                <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <UserCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-blue-700 font-mono">
                R$ {summary.paidSellerCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500">
                Pendente repasse: R$ {summary.pendingSellerCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Core Results - ROW 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Resultado Operacional */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Resultado Operacional</span>
                <span className="p-1.5 rounded-lg bg-slate-100 text-[#034AA6]">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-[#022859] font-mono">
                R$ {summary.netOperationalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500">
                Recebidos (-) Custos operacionais pagos
              </p>
            </div>

            {/* LUCRO LÍQUIDO */}
            <div className="bg-gradient-to-br from-emerald-800 to-teal-950 p-5 rounded-2xl shadow-lg space-y-2 text-white border border-emerald-500/30">
              <div className="flex items-center justify-between text-emerald-200 text-xs font-bold uppercase tracking-wider">
                <span>Lucro Líquido Realizado</span>
                <span className="p-2 rounded-xl bg-white/10 text-[#F2B807]">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </span>
              </div>
              <div className="text-3xl font-black text-[#F2B807] font-mono">
                R$ {summary.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-emerald-100">
                Realizado: Faturamento bruto (-) Comissões vendedores (-) Custos operacionais (-) Despesas administrativas
              </p>
            </div>

            {/* RENTABILIDADE */}
            <div className="bg-gradient-to-br from-[#022859] to-[#034AA6] p-5 rounded-2xl shadow-lg space-y-2 text-white border border-[#034AA6]/30">
              <div className="flex items-center justify-between text-blue-200 text-xs font-bold uppercase tracking-wider">
                <span>Rentabilidade Realizada</span>
                <span className="p-2 rounded-xl bg-white/10 text-white">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-black text-[#F2B807] font-mono">
                {summary.profitability.toFixed(1)}%
              </div>
              <p className="text-[11px] text-blue-100">
                Métrica: Lucro Líquido Realizado ÷ Receita Efetiva Recebida × 100
              </p>
            </div>
          </div>

          {/* Progress and Receivables Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receivables Status Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-[#022859] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#034AA6]" />
                Composição do Fluxo de Receitas
              </h3>

              <div className="space-y-3">
                {/* Progress Bar */}
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    style={{
                      width: `${summary.totalExpectedRevenue > 0 ? (summary.totalReceivedRevenue / summary.totalExpectedRevenue) * 100 : 0}%`,
                    }}
                    className="bg-emerald-500 h-full transition-all"
                    title="Recebidas"
                  />
                  <div
                    style={{
                      width: `${summary.totalExpectedRevenue > 0 ? (summary.totalPendingRevenue / summary.totalExpectedRevenue) * 100 : 0}%`,
                    }}
                    className="bg-[#034AA6] h-full transition-all"
                    title="Previstas / Em Aberto"
                  />
                  <div
                    style={{
                      width: `${summary.totalExpectedRevenue > 0 ? (summary.totalDelayedRevenue / summary.totalExpectedRevenue) * 100 : 0}%`,
                    }}
                    className="bg-rose-500 h-full transition-all"
                    title="Atrasadas"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 block font-bold font-sans">Recebidas</span>
                    <strong className="text-emerald-700">
                      R$ {summary.totalReceivedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                    <span className="text-[10px] text-[#034AA6] block font-bold font-sans">A Vencer / Aberto</span>
                    <strong className="text-[#034AA6]">
                      R$ {summary.totalPendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] text-rose-800 block font-bold font-sans">Atrasadas</span>
                    <strong className="text-rose-700">
                      R$ {summary.totalDelayedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* General Expenses Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#022859] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#034AA6]" />
                  Despesas Gerais da Empresa
                </h3>
                <button
                  onClick={() => setActiveTab('despesas')}
                  className="text-xs text-[#034AA6] font-bold hover:underline flex items-center gap-1"
                >
                  Ver todas <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {expenses.slice(0, 4).map((e) => {
                  const badge = getExpenseCategoryBadge(e.category);
                  return (
                    <div
                      key={e.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <strong className="text-slate-800">{e.description}</strong>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Vencimento: {new Date(e.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <div className="text-right">
                        <strong className="text-amber-700 font-mono text-sm block">
                          R$ {e.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>
                        <span className={`text-[10px] font-bold ${
                          e.status === 'PAGO'
                            ? 'text-emerald-600'
                            : e.status === 'CANCELADO'
                            ? 'text-rose-500 line-through'
                            : 'text-amber-600'
                        }`}>
                          {e.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECEITAS DE COMISSÃO */}
      {activeTab === 'receitas' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-56">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={revenueSearch}
                  onChange={(e) => setRevenueSearch(e.target.value)}
                  placeholder="Buscar por cliente, banco, contrato..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                />
              </div>

              <select
                value={revenueStatusFilter}
                onChange={(e) => setRevenueStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="PREVISTA">PREVISTA</option>
                <option value="RECEBIDA">RECEBIDA</option>
                <option value="RECEBIDA_PARCIALMENTE">RECEBIDA_PARCIALMENTE</option>
                <option value="ATRASADA">ATRASADA</option>
                <option value="CANCELADA">CANCELADA</option>
              </select>

              <select
                value={revenueBankFilter}
                onChange={(e) => setRevenueBankFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="TODOS">Todos os Bancos</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">
                Total de <strong>{revenues.length}</strong> receita(s)
              </span>
            </div>
          </div>

          {/* Revenues Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#022859] text-white text-[11px] font-bold uppercase tracking-wider border-b border-[#034AA6]">
                    <th className="p-3.5">ID / Contrato</th>
                    <th className="p-3.5">Banco / Modalidade</th>
                    <th className="p-3.5">Cliente & Vendedor</th>
                    <th className="p-3.5 text-right">Previsto</th>
                    <th className="p-3.5 text-right">Recebido</th>
                    <th className="p-3.5 text-right">Diferença / Saldo</th>
                    <th className="p-3.5">Vencimento</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {revenues.length > 0 ? (
                    revenues.map((rev) => {
                      const remaining = Math.max(0, rev.expected_amount - rev.received_amount);

                      return (
                        <tr key={rev.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-mono">
                            <span className="font-bold text-[#022859]">
                              {rev.contract_numero || rev.id}
                            </span>
                            {rev.contract_numero && (
                              <span className="text-[10px] block text-slate-400">#{rev.id}</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <div className="font-extrabold text-[#022859] flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#034AA6]" />
                              <span>{rev.bank_nome}</span>
                            </div>
                            <div className="text-slate-600 text-[10px]">
                              {rev.product_nome} {rev.agreement_nome ? `• ${rev.agreement_nome}` : ''}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="font-bold text-slate-800">
                              {rev.client_nome || 'Cliente Geral'}
                            </div>
                            <div className="text-slate-500 text-[10px]">
                              Vend: {rev.seller_nome}
                            </div>
                          </td>

                          <td className="p-3.5 text-right font-mono font-bold text-[#022859]">
                            R$ {rev.expected_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                            R$ {rev.received_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3.5 text-right font-mono">
                            {remaining > 0 ? (
                              <span className="text-[#F28907] font-bold">
                                - R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-bold">Quitado</span>
                            )}
                          </td>

                          <td className="p-3.5 font-mono text-slate-600">
                            {new Date(rev.expected_date).toLocaleDateString('pt-BR')}
                            {rev.received_date && (
                              <span className="text-[10px] text-emerald-600 block">
                                Pago: {new Date(rev.received_date).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              rev.status === 'RECEBIDA'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : rev.status === 'RECEBIDA_PARCIALMENTE'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : rev.status === 'ATRASADA'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}>
                              {rev.status === 'RECEBIDA' && <Check className="w-3 h-3 text-emerald-600" />}
                              {rev.status === 'ATRASADA' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                              {rev.status}
                            </span>
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {canRegisterReceipt && rev.status !== 'RECEBIDA' && (
                                <button
                                  onClick={() => setSelectedRevenueForReceipt(rev)}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                  title="Registrar recebimento parcial ou total"
                                >
                                  <DollarSign className="w-3 h-3 text-[#F2B807]" />
                                  <span>Dar Baixa</span>
                                </button>
                              )}

                              <button
                                onClick={() => setSelectedRevenueForHistory(rev)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer transition-colors"
                                title="Ver histórico de recebimentos"
                              >
                                <History className="w-3.5 h-3.5 text-[#034AA6]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                        Nenhuma receita financeira encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOS OPERACIONAIS */}
      {activeTab === 'custos' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-56">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={costSearch}
                  onChange={(e) => setCostSearch(e.target.value)}
                  placeholder="Buscar custos por descrição..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                />
              </div>

              <select
                value={costCategoryFilter}
                onChange={(e) => setCostCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="TODOS">Todas as Categorias</option>
                <option value="CONSULTA_BUREAU">Consulta CPF / Bureau</option>
                <option value="MOTOBOY_LOGISTICA">Motoboy / Logística</option>
                <option value="CERTIDAO_CARTORIO">Certidões / Cartório</option>
                <option value="TAXA_AVERBACAO_EMISSAO">Taxa Averbação / CCB</option>
                <option value="TAXA_BANCARIA_TED">Taxa Bancária / TED</option>
                <option value="OUTRO">Outros</option>
              </select>

              <select
                value={costStatusFilter}
                onChange={(e) => setCostStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="PAGO">PAGO</option>
                <option value="PENDENTE">PENDENTE</option>
              </select>
            </div>

            {canManageCosts && (
              <button
                onClick={() => {
                  setCostToEdit(null);
                  setIsCostModalOpen(true);
                }}
                className="px-4 py-2 bg-[#034AA6] hover:bg-[#022859] text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#F2B807]" />
                <span>Novo Custo Operacional</span>
              </button>
            )}
          </div>

          {/* Costs Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#022859] text-white text-[11px] font-bold uppercase tracking-wider border-b border-[#034AA6]">
                    <th className="p-3.5">Categoria</th>
                    <th className="p-3.5">Descrição</th>
                    <th className="p-3.5">Vínculo / Operação</th>
                    <th className="p-3.5">Data</th>
                    <th className="p-3.5 text-right">Valor (R$)</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {costs.length > 0 ? (
                    costs.map((cost) => {
                      const badge = getCategoryBadge(cost.category);

                      return (
                        <tr key={cost.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>

                          <td className="p-3.5 font-bold text-slate-800">
                            {cost.description}
                            {cost.notes && (
                              <p className="text-[10px] text-slate-400 font-normal italic">
                                {cost.notes}
                              </p>
                            )}
                          </td>

                          <td className="p-3.5 text-slate-600">
                            {cost.opportunity_title ? (
                              <div>
                                <span className="font-semibold text-[#022859]">{cost.opportunity_title}</span>
                                {cost.client_nome && <span className="text-[10px] block text-slate-400">{cost.client_nome}</span>}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Geral / Sem vínculo</span>
                            )}
                          </td>

                          <td className="p-3.5 font-mono text-slate-600">
                            {new Date(cost.date).toLocaleDateString('pt-BR')}
                          </td>

                          <td className="p-3.5 text-right font-mono font-black text-rose-700 text-sm">
                            R$ {cost.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleToggleCostStatus(cost)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                                cost.status === 'PAGO'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                              }`}
                              title="Clique para alternar entre Pago e Pendente"
                            >
                              {cost.status === 'PAGO' ? '✓ PAGO' : '⏳ PENDENTE'}
                            </button>
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setCostToEdit(cost);
                                  setIsCostModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer transition-colors"
                                title="Editar custo"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-[#034AA6]" />
                              </button>

                              <button
                                onClick={() => handleDeleteCost(cost.id)}
                                className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-700 rounded-lg text-xs cursor-pointer transition-colors"
                                title="Excluir custo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                        Nenhum custo operacional lançado para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DESPESAS GERAIS */}
      {activeTab === 'despesas' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-56">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  placeholder="Buscar despesas por descrição..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                />
              </div>

              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="TODOS">Todas as Categorias</option>
                <option value="ALUGUEL">Aluguel</option>
                <option value="TELEFONE">Telefone</option>
                <option value="INTERNET">Internet</option>
                <option value="TRAFEGO_PAGO">Tráfego Pago</option>
                <option value="SALARIOS">Salários</option>
                <option value="COMISSOES_VENDEDORES">Comissões de Vendedores</option>
                <option value="FERRAMENTAS">Ferramentas / Software</option>
                <option value="CONTABILIDADE">Contabilidade</option>
                <option value="HOSPEDAGEM">Hospedagem</option>
                <option value="MATERIAL_ESCRITORIO">Material de Escritório</option>
                <option value="OUTROS">Outros</option>
              </select>

              <select
                value={expenseStatusFilter}
                onChange={(e) => setExpenseStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="PAGO">PAGO</option>
                <option value="PENDENTE">PENDENTE</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
            </div>

            {canManageCosts && (
              <button
                onClick={() => {
                  setExpenseToEdit(null);
                  setIsExpenseModalOpen(true);
                }}
                className="px-4 py-2 bg-[#034AA6] hover:bg-[#022859] text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#F2B807]" />
                <span>Nova Despesa Geral</span>
              </button>
            )}
          </div>

          {/* Expenses Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#022859] text-white text-[11px] font-bold uppercase tracking-wider border-b border-[#034AA6]">
                    <th className="p-3.5">Categoria</th>
                    <th className="p-3.5">Descrição</th>
                    <th className="p-3.5">Vencimento</th>
                    <th className="p-3.5 text-right">Valor (R$)</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {expenses.length > 0 ? (
                    expenses.map((expense) => {
                      const badge = getExpenseCategoryBadge(expense.category);

                      return (
                        <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>

                          <td className="p-3.5 font-bold text-slate-800">
                            {expense.description}
                            {expense.notes && (
                              <p className="text-[10px] text-slate-400 font-normal italic">
                                {expense.notes}
                              </p>
                            )}
                          </td>

                          <td className="p-3.5 font-mono text-slate-600">
                            {new Date(expense.due_date).toLocaleDateString('pt-BR')}
                            {expense.payment_date && (
                              <p className="text-[10px] text-emerald-600 font-semibold font-sans">
                                Pago: {new Date(expense.payment_date).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </td>

                          <td className="p-3.5 text-right font-mono font-black text-amber-700 text-sm">
                            R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleToggleExpenseStatus(expense)}
                              disabled={expense.status === 'CANCELADO'}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                                expense.status === 'PAGO'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 cursor-pointer'
                                  : expense.status === 'CANCELADO'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200 line-through opacity-60'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 cursor-pointer'
                              }`}
                              title={expense.status !== 'CANCELADO' ? "Clique para alternar entre Pago e Pendente" : "Despesa Cancelada"}
                            >
                              {expense.status === 'PAGO' && '✓ PAGO'}
                              {expense.status === 'PENDENTE' && '⏳ PENDENTE'}
                              {expense.status === 'CANCELADO' && '✖ CANCELADA'}
                            </button>
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {expense.status !== 'CANCELADO' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setExpenseToEdit(expense);
                                      setIsExpenseModalOpen(true);
                                    }}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer transition-colors"
                                    title="Editar despesa"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-[#034AA6]" />
                                  </button>

                                  <button
                                    onClick={() => handleCancelExpense(expense)}
                                    className="p-1.5 bg-slate-100 hover:bg-rose-50 text-rose-700 rounded-lg text-xs cursor-pointer transition-colors"
                                    title="Cancelar despesa"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-700 rounded-lg text-xs cursor-pointer transition-colors"
                                title="Excluir despesa permanentemente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                        Nenhuma despesa geral encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REPASSES & COMISSÕES (INTEGRAÇÃO COM FASE 4) */}
      {activeTab === 'comissoes' && (
        <div className="space-y-6">
          {/* Section 1: Seller Commissions (Pagamento de comissões) */}
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2 text-amber-950">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-600" />
                <h4 className="font-black text-sm text-[#022859]">
                  Pagamento de Comissões dos Vendedores (Repasses)
                </h4>
              </div>
              <p className="text-[11px] text-amber-900">
                Lista de comissões devidas aos vendedores geradas de operações aprovadas na Fase 4. Registre o pagamento de repasse individualmente para consolidação do Lucro Líquido corporativo.
              </p>
            </div>

            {/* Seller Commissions Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#022859] text-white text-[11px] font-bold uppercase tracking-wider border-b border-[#034AA6]">
                      <th className="p-3.5">ID / Operação</th>
                      <th className="p-3.5">Vendedor Beneficiário</th>
                      <th className="p-3.5 text-right font-semibold">Base de Operação</th>
                      <th className="p-3.5 text-right">Repasse Devido (R$)</th>
                      <th className="p-3.5 text-center">Status Repasse</th>
                      <th className="p-3.5 text-center">Data Pagamento</th>
                      <th className="p-3.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {operationCommissions.filter((comm) => comm.status === 'APROVADA').length > 0 ? (
                      operationCommissions
                        .filter((comm) => comm.status === 'APROVADA')
                        .map((comm) => {
                          const isPaid = comm.comissao_vendedor_status === 'PAGO';

                          return (
                            <tr key={comm.id} className="hover:bg-slate-50 transition-colors animate-in fade-in">
                              <td className="p-3.5">
                                <span className="font-bold text-[#022859] block">
                                  {comm.client_name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {comm.banco_nome} • {comm.produto_nome} (#{comm.id})
                                </span>
                              </td>

                              <td className="p-3.5 font-bold text-slate-800">
                                {comm.vendedor_nome}
                              </td>

                              <td className="p-3.5 text-right font-mono text-slate-600">
                                R$ {comm.valor_operacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>

                              <td className="p-3.5 text-right font-mono font-black text-amber-700 text-sm">
                                R$ {comm.comissao_vendedor_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>

                              <td className="p-3.5 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  isPaid
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}>
                                  {isPaid ? '✓ PAGO' : '⏳ PENDENTE'}
                                </span>
                              </td>

                              <td className="p-3.5 text-center font-mono text-slate-600">
                                {comm.comissao_vendedor_data_pagamento
                                  ? new Date(comm.comissao_vendedor_data_pagamento).toLocaleDateString('pt-BR')
                                  : <span className="text-slate-400 italic">-</span>}
                              </td>

                              <td className="p-3.5 text-center">
                                {!isPaid ? (
                                  <button
                                    onClick={() => handlePaySellerCommission(comm.id)}
                                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-black transition-all shadow-xs flex items-center gap-1.5 mx-auto cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5 text-[#F2B807]" />
                                    <span>Pagar Repasse</span>
                                  </button>
                                ) : (
                                  <span className="text-emerald-600 font-bold text-[10px] flex items-center justify-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Pago
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                          Nenhuma comissão de vendedor aprovada pendente de repasse.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 2: Incoming bank commissions (Comissões a receber) */}
          <div className="space-y-4 pt-6 border-t border-slate-200">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs space-y-2 text-blue-950">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#034AA6]" />
                <h4 className="font-black text-sm text-[#022859]">
                  Comissões Bancárias a Receber (Contratos da Empresa)
                </h4>
              </div>
              <p className="text-[11px] text-blue-900">
                Visualização do vínculo entre as comissões calculadas na Fase 4 e a receita financeira correspondente.
              </p>
            </div>

            {/* Incoming Commissions Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#022859] text-white text-[11px] font-bold uppercase tracking-wider border-b border-[#034AA6]">
                      <th className="p-3.5">ID / Operação</th>
                      <th className="p-3.5">Banco & Produto</th>
                      <th className="p-3.5">Vendedor Responsável</th>
                      <th className="p-3.5 text-right">Comissão Banco</th>
                      <th className="p-3.5 text-right font-semibold">Repasse Vendedor</th>
                      <th className="p-3.5 text-right font-black">Empresa Líquido</th>
                      <th className="p-3.5 text-center">Status Aprovação</th>
                      <th className="p-3.5 text-center">Sincronizado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {operationCommissions.map((comm) => {
                      const linkedRevenue = revenues.find(
                        (r) => r.operation_commission_id === comm.id || r.opportunity_id === comm.opportunity_id
                      );

                      return (
                        <tr key={comm.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5">
                            <span className="font-bold text-[#022859] block">
                              {comm.client_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">#{comm.id}</span>
                          </td>

                          <td className="p-3.5">
                            <strong className="text-slate-800">{comm.banco_nome}</strong>
                            <p className="text-[10px] text-slate-500">{comm.produto_nome}</p>
                          </td>

                          <td className="p-3.5 text-slate-700">
                            {comm.vendedor_nome}
                          </td>

                          <td className="p-3.5 text-right font-mono font-bold text-[#034AA6]">
                            R$ {comm.comissao_banco_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3.5 text-right font-mono text-slate-600">
                            R$ {comm.comissao_vendedor_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3.5 text-right font-mono font-black text-emerald-700">
                            R$ {comm.resultado_empresa_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              comm.status === 'APROVADA'
                                ? 'bg-emerald-100 text-emerald-800'
                                : comm.status === 'DEVOLVIDA_PARA_REVISAO'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}>
                              {comm.status}
                            </span>
                          </td>

                          <td className="p-3.5 text-center">
                            {linkedRevenue ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                linkedRevenue.status === 'RECEBIDA'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-blue-50 text-blue-800 border-blue-300'
                              }`}>
                                ✓ {linkedRevenue.status}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                Não Sincronizado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DRE SIMPLIFICADO (DEMONSTRATIVO DE RESULTADO) */}
      {activeTab === 'dre' && summary && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#022859] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#034AA6]" />
                  Demonstrativo de Resultado do Exercício (DRE Simplificado)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Relatório financeiro que compara os resultados previstos/projetados versus os resultados efetivamente liquidados/realizados.
                </p>
              </div>

              <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                Emissão: {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>

            {/* DRE Rows Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-4 w-1/2">Grupo / Linha do DRE</th>
                    <th className="p-4 text-right">Projetado (Previsto)</th>
                    <th className="p-4 text-right">Realizado (Efetivado)</th>
                    <th className="p-4 text-center">Desvio / Realização</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {/* RECEITAS */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-[#022859] flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>(=) RECEITA BRUTA (Comissões de Bancos)</span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-700">
                      R$ {summary.totalExpectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-mono font-black text-emerald-700">
                      R$ {summary.totalReceivedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center font-bold">
                      {summary.totalExpectedRevenue > 0 ? (
                        <span className="text-emerald-700">
                          {((summary.totalReceivedRevenue / summary.totalExpectedRevenue) * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>

                  {/* CUSTOS OPERACIONAIS */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-[#022859] flex items-center gap-2 pl-6">
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                      <span>(-) CUSTOS OPERACIONAIS DIRETOS</span>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600">
                      - R$ {summary.totalOperationalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-rose-700">
                      - R$ {summary.paidOperationalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center font-medium">
                      {summary.totalOperationalCosts > 0 ? (
                        <span className="text-rose-700">
                          {((summary.paidOperationalCosts / summary.totalOperationalCosts) * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>

                  {/* RESULTADO OPERACIONAL */}
                  <tr className="bg-slate-50/50 font-bold">
                    <td className="p-4 text-[#022859] flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-[#034AA6]" />
                      <span>(=) RESULTADO OPERACIONAL BRUTO</span>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-700">
                      R$ {summary.projectedGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-mono text-[#022859]">
                      R$ {summary.netOperationalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-[#034AA6]">Realizado</span>
                    </td>
                  </tr>

                  {/* COMISSÕES DOS VENDEDORES */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-[#022859] flex items-center gap-2 pl-6">
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                      <span>(-) COMISSÕES E REPASSES DOS VENDEDORES</span>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600">
                      - R$ {summary.totalSellerCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-rose-700">
                      - R$ {summary.paidSellerCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center font-medium">
                      {summary.totalSellerCommissions > 0 ? (
                        <span className="text-rose-700">
                          {((summary.paidSellerCommissions / summary.totalSellerCommissions) * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>

                  {/* DESPESAS GERAIS */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-[#022859] flex items-center gap-2 pl-6">
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                      <span>(-) DESPESAS GERAIS E ADMINISTRATIVAS</span>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600">
                      - R$ {summary.totalGeneralExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-rose-700">
                      - R$ {summary.paidGeneralExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center font-medium">
                      {summary.totalGeneralExpenses > 0 ? (
                        <span className="text-rose-700">
                          {((summary.paidGeneralExpenses / summary.totalGeneralExpenses) * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>

                  {/* LUCRO LÍQUIDO */}
                  <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-600">
                    <td className="p-4 text-emerald-900 flex items-center gap-2 text-sm uppercase">
                      <Sparkles className="w-4 h-4 text-[#F2B807]" />
                      <span>(=) LUCRO LÍQUIDO DO EXERCÍCIO</span>
                    </td>
                    <td className="p-4 text-right font-mono text-emerald-800 text-sm">
                      R$ {summary.projectedNetProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-mono font-black text-emerald-700 text-base">
                      R$ {summary.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center text-sm font-black text-emerald-700">
                      Realizado
                    </td>
                  </tr>

                  {/* RENTABILIDADE */}
                  <tr className="bg-blue-50 font-bold">
                    <td className="p-4 text-[#022859] flex items-center gap-2 text-sm uppercase">
                      <TrendingUp className="w-4 h-4 text-[#F2B807]" />
                      <span>RENTABILIDADE (%)</span>
                    </td>
                    <td className="p-4 text-right font-mono text-blue-800 text-sm">
                      {summary.projectedProfitability.toFixed(1)}%
                    </td>
                    <td className="p-4 text-right font-mono font-black text-blue-700 text-base">
                      {summary.profitability.toFixed(1)}%
                    </td>
                    <td className="p-4 text-center text-sm font-black text-blue-700">
                      Realizada
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <RegisterReceiptModal
        isOpen={!!selectedRevenueForReceipt}
        onClose={() => setSelectedRevenueForReceipt(null)}
        revenue={selectedRevenueForReceipt}
        onReceiptRegistered={() => {
          loadAllFinancialData();
        }}
      />

      <ReceiptHistoryModal
        isOpen={!!selectedRevenueForHistory}
        onClose={() => setSelectedRevenueForHistory(null)}
        revenue={selectedRevenueForHistory}
      />

      <OperationalCostModal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        costToEdit={costToEdit}
        onCostSaved={() => {
          loadAllFinancialData();
        }}
        banks={banks}
        opportunities={opportunities}
        contracts={contracts}
      />

      <NewRevenueModal
        isOpen={isNewRevenueOpen}
        onClose={() => setIsNewRevenueOpen(false)}
        onRevenueCreated={() => {
          loadAllFinancialData();
        }}
        banks={banks}
        products={products}
        agreements={agreements}
        sellers={users.filter((u) => u.role === 'Vendedor' || u.role === 'Administrador')}
      />

      <GeneralExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expenseToEdit={expenseToEdit}
        onExpenseSaved={() => {
          loadAllFinancialData();
        }}
      />
    </div>
  );
};
