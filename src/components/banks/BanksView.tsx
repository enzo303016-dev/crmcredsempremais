import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  Bank,
  Product,
  Agreement,
  CommissionRule,
  BankStatus,
  ProductStatus,
  AgreementStatus,
  CommissionType,
} from '../../types/crm';
import { formatCurrency } from '../../utils/formatters';
import {
  Building2,
  Package,
  FileCheck2,
  BadgePercent,
  Plus,
  Search,
  Edit2,
  Power,
  Trash2,
  Sparkles,
  X,
  CheckCircle2,
  XCircle,
  Info,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const BanksView: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'banks' | 'products' | 'agreements' | 'commissions'>('banks');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedBankFilter, setSelectedBankFilter] = useState('');

  // Modals state
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null);

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);

  // Form states
  const [bankForm, setBankForm] = useState({
    nome: '',
    codigo_bancario: '',
    cnpj: '',
    status: 'Ativo' as BankStatus,
    observacoes: '',
  });

  const [productForm, setProductForm] = useState({
    banco_id: '',
    nome: '',
    codigo_produto: '',
    descricao: '',
    status: 'Ativo' as ProductStatus,
    observacoes: '',
  });

  const [agreementForm, setAgreementForm] = useState({
    banco_id: '',
    produto_id: '',
    nome: '',
    codigo_convenio: '',
    status: 'Ativo' as AgreementStatus,
    observacoes: '',
  });

  const [ruleForm, setRuleForm] = useState({
    banco_id: '',
    produto_id: '',
    convenio_id: '',
    prazo_min: 1,
    prazo_max: 84,
    valor_min: 1000,
    valor_max: 100000,
    tipo_comissao_banco: 'PERCENTUAL' as CommissionType,
    valor_comissao_banco: 6,
    tipo_comissao_vendedor: 'PERCENTUAL_DO_BANCO' as any,
    valor_comissao_vendedor: 50,
    tipo_comissao: 'PERCENTUAL' as CommissionType,
    valor_comissao: 6,
    status: 'Ativa' as 'Ativa' | 'Inativa',
    observacoes: '',
  });

  // Data fetching
  const banks = apiService.getBanks();
  const products = apiService.getProducts();
  const agreements = apiService.getAgreements();
  const commissionRules = apiService.getCommissionRules();

  // Permissions check
  const isAdmin = currentUser?.role === 'Administrador';
  const canManageBanks = isAdmin || hasPermission('gerenciar_bancos') || hasPermission('visualizar_bancos');
  const canCreateBank = isAdmin || hasPermission('criar_banco') || hasPermission('gerenciar_bancos');
  const canEditBank = isAdmin || hasPermission('editar_banco') || hasPermission('gerenciar_bancos');
  const canToggleBank = isAdmin || hasPermission('ativar_banco') || hasPermission('gerenciar_bancos');

  const canManageProducts = isAdmin || hasPermission('gerenciar_produtos') || hasPermission('visualizar_produtos');
  const canCreateProduct = isAdmin || hasPermission('criar_produto') || hasPermission('gerenciar_produtos');
  const canEditProduct = isAdmin || hasPermission('editar_produto') || hasPermission('gerenciar_produtos');

  const canManageAgreements = isAdmin || hasPermission('visualizar_convenios') || hasPermission('gerenciar_bancos');
  const canCreateAgreement = isAdmin || hasPermission('criar_convenio') || hasPermission('gerenciar_bancos');

  const canManageRules = isAdmin || hasPermission('visualizar_regras_comissao') || hasPermission('gerenciar_bancos');
  const canCreateRule = isAdmin || hasPermission('criar_regra_comissao') || hasPermission('gerenciar_bancos');

  // Filtered lists
  const filteredBanks = banks.filter(
    (b) =>
      b.nome.toLowerCase().includes(search.toLowerCase()) ||
      b.codigo_bancario.includes(search) ||
      b.cnpj.includes(search)
  );

  const filteredProducts = products.filter((p) => {
    const matchesBank = !selectedBankFilter || p.banco_id === selectedBankFilter;
    const matchesSearch =
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.banco_nome.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo_produto.toLowerCase().includes(search.toLowerCase());
    return matchesBank && matchesSearch;
  });

  const filteredAgreements = agreements.filter((a) => {
    const matchesBank = !selectedBankFilter || a.banco_id === selectedBankFilter;
    const matchesSearch =
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.banco_nome.toLowerCase().includes(search.toLowerCase()) ||
      a.produto_nome.toLowerCase().includes(search.toLowerCase()) ||
      a.codigo_convenio.toLowerCase().includes(search.toLowerCase());
    return matchesBank && matchesSearch;
  });

  const filteredRules = commissionRules.filter((r) => {
    const matchesBank = !selectedBankFilter || r.banco_id === selectedBankFilter;
    const matchesSearch =
      r.banco_nome.toLowerCase().includes(search.toLowerCase()) ||
      r.produto_nome.toLowerCase().includes(search.toLowerCase()) ||
      (r.convenio_nome && r.convenio_nome.toLowerCase().includes(search.toLowerCase()));
    return matchesBank && matchesSearch;
  });

  // Handlers for Banks
  const handleOpenBankModal = (bank?: Bank) => {
    if (bank) {
      setEditingBank(bank);
      setBankForm({
        nome: bank.nome,
        codigo_bancario: bank.codigo_bancario,
        cnpj: bank.cnpj,
        status: bank.status,
        observacoes: bank.observacoes,
      });
    } else {
      setEditingBank(null);
      setBankForm({
        nome: '',
        codigo_bancario: '',
        cnpj: '',
        status: 'Ativo',
        observacoes: '',
      });
    }
    setIsBankModalOpen(true);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.nome.trim()) {
      alert('Informe o nome do banco.');
      return;
    }
    try {
      if (editingBank) {
        await apiService.updateBank(editingBank.id, bankForm, currentUser);
      } else {
        await apiService.createBank(bankForm, currentUser);
      }
      setIsBankModalOpen(false);
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar banco.');
    }
  };

  const handleToggleBank = async (id: string) => {
    try {
      await apiService.toggleBankStatus(id, currentUser);
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status.');
    }
  };

  // Handlers for Products
  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        banco_id: product.banco_id,
        nome: product.nome,
        codigo_produto: product.codigo_produto,
        descricao: product.descricao,
        status: product.status,
        observacoes: product.observacoes,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        banco_id: banks[0]?.id || '',
        nome: '',
        codigo_produto: '',
        descricao: '',
        status: 'Ativo',
        observacoes: '',
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.banco_id) {
      alert('Selecione um banco.');
      return;
    }
    if (!productForm.nome.trim()) {
      alert('Informe o nome do produto.');
      return;
    }
    try {
      if (editingProduct) {
        await apiService.updateProduct(editingProduct.id, productForm, currentUser);
      } else {
        const bank = banks.find((b) => b.id === productForm.banco_id);
        await apiService.createProduct(
          { ...productForm, banco_nome: bank?.nome || '' },
          currentUser
        );
      }
      setIsProductModalOpen(false);
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar produto.');
    }
  };

  const handleToggleProduct = async (id: string) => {
    try {
      await apiService.toggleProductStatus(id, currentUser);
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status.');
    }
  };

  // Handlers for Agreements
  const handleOpenAgreementModal = (agreement?: Agreement) => {
    if (agreement) {
      setEditingAgreement(agreement);
      setAgreementForm({
        banco_id: agreement.banco_id,
        produto_id: agreement.produto_id,
        nome: agreement.nome,
        codigo_convenio: agreement.codigo_convenio,
        status: agreement.status,
        observacoes: agreement.observacoes,
      });
    } else {
      setEditingAgreement(null);
      const defaultBankId = banks[0]?.id || '';
      const availableProds = products.filter((p) => p.banco_id === defaultBankId);
      setAgreementForm({
        banco_id: defaultBankId,
        produto_id: availableProds[0]?.id || '',
        nome: '',
        codigo_convenio: '',
        status: 'Ativo',
        observacoes: '',
      });
    }
    setIsAgreementModalOpen(true);
  };

  const handleSaveAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreementForm.banco_id || !agreementForm.produto_id) {
      alert('Selecione o banco e o produto correspondentes.');
      return;
    }
    if (!agreementForm.nome.trim()) {
      alert('Informe o nome do convênio.');
      return;
    }
    try {
      if (editingAgreement) {
        await apiService.updateAgreement(editingAgreement.id, agreementForm, currentUser);
      } else {
        const bank = banks.find((b) => b.id === agreementForm.banco_id);
        const prod = products.find((p) => p.id === agreementForm.produto_id);
        await apiService.createAgreement(
          {
            ...agreementForm,
            banco_nome: bank?.nome || '',
            produto_nome: prod?.nome || '',
          },
          currentUser
        );
      }
      setIsAgreementModalOpen(false);
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar convênio.');
    }
  };

  const handleToggleAgreement = async (id: string) => {
    try {
      await apiService.toggleAgreementStatus(id, currentUser);
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status.');
    }
  };

  const handleDeleteAgreement = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este convênio?')) return;
    try {
      await apiService.deleteAgreement(id, currentUser);
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir convênio.');
    }
  };

  // Handlers for Commission Rules
  const handleOpenRuleModal = (rule?: CommissionRule) => {
    if (rule) {
      setEditingRule(rule);
      setRuleForm({
        banco_id: rule.banco_id,
        produto_id: rule.produto_id,
        convenio_id: rule.convenio_id || '',
        prazo_min: rule.prazo_min,
        prazo_max: rule.prazo_max,
        valor_min: rule.valor_min,
        valor_max: rule.valor_max,
        tipo_comissao_banco: rule.tipo_comissao_banco || rule.tipo_comissao || 'PERCENTUAL',
        valor_comissao_banco: rule.valor_comissao_banco ?? rule.valor_comissao ?? 6,
        tipo_comissao_vendedor: rule.tipo_comissao_vendedor || 'PERCENTUAL_DO_BANCO',
        valor_comissao_vendedor: rule.valor_comissao_vendedor ?? 50,
        tipo_comissao: rule.tipo_comissao_banco || rule.tipo_comissao || 'PERCENTUAL',
        valor_comissao: rule.valor_comissao_banco ?? rule.valor_comissao ?? 6,
        status: rule.status,
        observacoes: rule.observacoes,
      });
    } else {
      setEditingRule(null);
      const defaultBankId = banks[0]?.id || '';
      const availableProds = products.filter((p) => p.banco_id === defaultBankId);
      const availableAgrees = agreements.filter((a) => a.banco_id === defaultBankId);

      setRuleForm({
        banco_id: defaultBankId,
        produto_id: availableProds[0]?.id || '',
        convenio_id: availableAgrees[0]?.id || '',
        prazo_min: 1,
        prazo_max: 84,
        valor_min: 1000,
        valor_max: 100000,
        tipo_comissao_banco: 'PERCENTUAL',
        valor_comissao_banco: 6,
        tipo_comissao_vendedor: 'PERCENTUAL_DO_BANCO',
        valor_comissao_vendedor: 50,
        tipo_comissao: 'PERCENTUAL',
        valor_comissao: 6,
        status: 'Ativa',
        observacoes: '',
      });
    }
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.banco_id || !ruleForm.produto_id) {
      alert('Selecione o banco e o produto.');
      return;
    }
    try {
      if (editingRule) {
        await apiService.updateCommissionRule(editingRule.id, ruleForm, currentUser);
      } else {
        const bank = banks.find((b) => b.id === ruleForm.banco_id);
        const prod = products.find((p) => p.id === ruleForm.produto_id);
        const agree = agreements.find((a) => a.id === ruleForm.convenio_id);
        await apiService.createCommissionRule(
          {
            ...ruleForm,
            banco_nome: bank?.nome || '',
            produto_nome: prod?.nome || '',
            convenio_nome: agree?.nome || null,
          },
          currentUser
        );
      }
      setIsRuleModalOpen(false);
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar regra.');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta regra de comissão?')) return;
    try {
      await apiService.deleteCommissionRule(id, currentUser);
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir regra.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white">Bancos, Produtos & Regras de Comissão</h2>
            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full">
              FASE 3 • Estrutura do Sistema
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestão parametrizada de instituições bancárias, produtos de crédito, convênios operacionais e tabela de regras.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('banks')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'banks'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Bancos ({banks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'products'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Produtos ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('agreements')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'agreements'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Convênios ({agreements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'commissions'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BadgePercent className="w-3.5 h-3.5" />
            <span>Regras de Comissão ({commissionRules.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar registros..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none transition-colors"
            />
          </div>

          {activeTab !== 'banks' && (
            <select
              value={selectedBankFilter}
              onChange={(e) => setSelectedBankFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
            >
              <option value="">Todos os Bancos</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Create Buttons according to active tab */}
        {activeTab === 'banks' && canCreateBank && (
          <button
            onClick={() => handleOpenBankModal()}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Banco</span>
          </button>
        )}

        {activeTab === 'products' && canCreateProduct && (
          <button
            onClick={() => handleOpenProductModal()}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Produto</span>
          </button>
        )}

        {activeTab === 'agreements' && canCreateAgreement && (
          <button
            onClick={() => handleOpenAgreementModal()}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Convênio</span>
          </button>
        )}

        {activeTab === 'commissions' && canCreateRule && (
          <button
            onClick={() => handleOpenRuleModal()}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova Regra de Comissão</span>
          </button>
        )}
      </div>

      {/* TAB 1: BANCOS */}
      {activeTab === 'banks' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Banco / Instituição</th>
                  <th className="px-4 py-3">Código Bancário</th>
                  <th className="px-4 py-3">CNPJ</th>
                  <th className="px-4 py-3">Produtos Vinculados</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBanks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Nenhum banco encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredBanks.map((bank) => {
                    const prodCount = products.filter((p) => p.banco_id === bank.id).length;
                    return (
                      <tr key={bank.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{bank.nome}</span>
                          </div>
                          {bank.observacoes && (
                            <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                              {bank.observacoes}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-300">{bank.codigo_bancario}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">{bank.cnpj || 'Não informado'}</td>
                        <td className="px-4 py-3 font-mono">
                          <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-full text-slate-300 font-bold">
                            {prodCount} Produtos
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              bank.status === 'Ativo'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {bank.status === 'Ativo' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            <span>{bank.status}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          {canEditBank && (
                            <button
                              onClick={() => handleOpenBankModal(bank)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Editar Banco"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canToggleBank && (
                            <button
                              onClick={() => handleToggleBank(bank.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                bank.status === 'Ativo'
                                  ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              }`}
                              title={bank.status === 'Ativo' ? 'Desativar Banco' : 'Ativar Banco'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUTOS */}
      {activeTab === 'products' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Produto / Modalidade</th>
                  <th className="px-4 py-3">Banco Pertencente</th>
                  <th className="px-4 py-3">Código Produto</th>
                  <th className="px-4 py-3">Convênios Vinculados</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Nenhum produto cadastrado.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const agreeCount = agreements.filter((a) => a.produto_id === prod.id).length;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-white block">{prod.nome}</span>
                          <span className="text-[10px] text-slate-400">{prod.descricao}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-300">{prod.banco_nome}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-400">{prod.codigo_produto}</td>
                        <td className="px-4 py-3 font-mono">
                          <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-full text-slate-300 font-bold">
                            {agreeCount} Convênios
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              prod.status === 'Ativo'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {prod.status === 'Ativo' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            <span>{prod.status}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          {canEditProduct && (
                            <button
                              onClick={() => handleOpenProductModal(prod)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Editar Produto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleProduct(prod.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              prod.status === 'Ativo'
                                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                            title={prod.status === 'Ativo' ? 'Desativar Produto' : 'Ativar Produto'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONVÊNIOS */}
      {activeTab === 'agreements' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Convênio</th>
                  <th className="px-4 py-3">Banco</th>
                  <th className="px-4 py-3">Produto Vinculado</th>
                  <th className="px-4 py-3">Código Convênio</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAgreements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Nenhum convênio cadastrado.
                    </td>
                  </tr>
                ) : (
                  filteredAgreements.map((ag) => (
                    <tr key={ag.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-white">{ag.nome}</td>
                      <td className="px-4 py-3 font-semibold text-slate-300">{ag.banco_nome}</td>
                      <td className="px-4 py-3 text-slate-300">{ag.produto_nome}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-400">{ag.codigo_convenio}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            ag.status === 'Ativo'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {ag.status === 'Ativo' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{ag.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => handleOpenAgreementModal(ag)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Editar Convênio"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleAgreement(ag.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            ag.status === 'Ativo'
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                          title={ag.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgreement(ag.id)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Excluir Convênio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REGRAS DE COMISSÃO (PREPARAÇÃO FASE 4) */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-2xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <span className="font-bold text-white block">
                Estrutura de Regras de Comissionamento (Preparada para Fase 4)
              </span>
              <p>
                Nesta etapa da Fase 3, o banco de dados e as telas de cadastro de regras foram completamente estruturados.
                Na Fase 4, o motor de cálculo automático lerá essas regras por Banco, Produto, Convênio, Prazo e Faixa de Valor para aplicar a comissão prevista e liberada.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Banco & Produto</th>
                    <th className="px-4 py-3">Convênio</th>
                    <th className="px-4 py-3">Faixa de Prazo</th>
                    <th className="px-4 py-3">Faixa de Valor (R$)</th>
                    <th className="px-4 py-3">Comissão</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        Nenhuma regra de comissão cadastrada.
                      </td>
                    </tr>
                  ) : (
                    filteredRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-white block">{rule.banco_nome}</span>
                          <span className="text-[10px] text-slate-400">{rule.produto_nome}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-300">
                          {rule.convenio_nome || 'Todos os Convênios'}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {rule.prazo_min}x a {rule.prazo_max}x
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {formatCurrency(rule.valor_min)} até {formatCurrency(rule.valor_max)}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold rounded-lg text-xs">
                            {(rule.tipo_comissao_banco || rule.tipo_comissao) === 'PERCENTUAL'
                              ? `${(rule.valor_comissao_banco ?? rule.valor_comissao ?? 0).toFixed(2)}%`
                              : formatCurrency(rule.valor_comissao_banco ?? rule.valor_comissao ?? 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              rule.status === 'Ativa'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {rule.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            onClick={() => handleOpenRuleModal(rule)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Editar Regra"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Regra"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BANK MODAL */}
      {isBankModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsBankModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-extrabold text-white">
                {editingBank ? 'Editar Banco' : 'Cadastrar Novo Banco'}
              </h3>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Nome da Instituição *</label>
                <input
                  type="text"
                  value={bankForm.nome}
                  onChange={(e) => setBankForm({ ...bankForm, nome: e.target.value })}
                  placeholder="Ex: Banco do Brasil, Itaú..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Código Bancário</label>
                  <input
                    type="text"
                    value={bankForm.codigo_bancario}
                    onChange={(e) => setBankForm({ ...bankForm, codigo_bancario: e.target.value })}
                    placeholder="Ex: 001, 341..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={bankForm.cnpj}
                    onChange={(e) => setBankForm({ ...bankForm, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Status</label>
                <select
                  value={bankForm.status}
                  onChange={(e) => setBankForm({ ...bankForm, status: e.target.value as BankStatus })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Observações Operacionais</label>
                <textarea
                  value={bankForm.observacoes}
                  onChange={(e) => setBankForm({ ...bankForm, observacoes: e.target.value })}
                  placeholder="Instruções para a equipe de vendas..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Salvar Banco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-extrabold text-white">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Banco Parceiro *</label>
                <select
                  value={productForm.banco_id}
                  onChange={(e) => setProductForm({ ...productForm, banco_id: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                >
                  <option value="">Selecione um banco...</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    value={productForm.nome}
                    onChange={(e) => setProductForm({ ...productForm, nome: e.target.value })}
                    placeholder="Ex: Empréstimo INSS"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Código Produto</label>
                  <input
                    type="text"
                    value={productForm.codigo_produto}
                    onChange={(e) => setProductForm({ ...productForm, codigo_produto: e.target.value })}
                    placeholder="Ex: INSS-01"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Descrição</label>
                <input
                  type="text"
                  value={productForm.descricao}
                  onChange={(e) => setProductForm({ ...productForm, descricao: e.target.value })}
                  placeholder="Modalidade de crédito até 84 parcelas..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Status</label>
                <select
                  value={productForm.status}
                  onChange={(e) => setProductForm({ ...productForm, status: e.target.value as ProductStatus })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AGREEMENT MODAL */}
      {isAgreementModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsAgreementModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-extrabold text-white">
                {editingAgreement ? 'Editar Convênio' : 'Cadastrar Novo Convênio'}
              </h3>
            </div>

            <form onSubmit={handleSaveAgreement} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Banco *</label>
                <select
                  value={agreementForm.banco_id}
                  onChange={(e) => {
                    const bId = e.target.value;
                    const availableProds = products.filter((p) => p.banco_id === bId);
                    setAgreementForm({
                      ...agreementForm,
                      banco_id: bId,
                      produto_id: availableProds[0]?.id || '',
                    });
                  }}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                >
                  <option value="">Selecione um banco...</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Produto Vinculado *</label>
                <select
                  value={agreementForm.produto_id}
                  onChange={(e) => setAgreementForm({ ...agreementForm, produto_id: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                >
                  <option value="">Selecione o produto...</option>
                  {products
                    .filter((p) => p.banco_id === agreementForm.banco_id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Nome do Convênio *</label>
                  <input
                    type="text"
                    value={agreementForm.nome}
                    onChange={(e) => setAgreementForm({ ...agreementForm, nome: e.target.value })}
                    placeholder="Ex: INSS, SIAPE..."
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Código Convênio</label>
                  <input
                    type="text"
                    value={agreementForm.codigo_convenio}
                    onChange={(e) => setAgreementForm({ ...agreementForm, codigo_convenio: e.target.value })}
                    placeholder="CONV-01"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Status</label>
                <select
                  value={agreementForm.status}
                  onChange={(e) => setAgreementForm({ ...agreementForm, status: e.target.value as AgreementStatus })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAgreementModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Salvar Convênio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RULE MODAL */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsRuleModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <BadgePercent className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-extrabold text-white">
                {editingRule ? 'Editar Regra de Comissão' : 'Cadastrar Regra de Comissão'}
              </h3>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Banco *</label>
                  <select
                    value={ruleForm.banco_id}
                    onChange={(e) => {
                      const bId = e.target.value;
                      const availableProds = products.filter((p) => p.banco_id === bId);
                      const availableAgrees = agreements.filter((a) => a.banco_id === bId);
                      setRuleForm({
                        ...ruleForm,
                        banco_id: bId,
                        produto_id: availableProds[0]?.id || '',
                        convenio_id: availableAgrees[0]?.id || '',
                      });
                    }}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  >
                    <option value="">Selecione um banco...</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Produto *</label>
                  <select
                    value={ruleForm.produto_id}
                    onChange={(e) => setRuleForm({ ...ruleForm, produto_id: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  >
                    <option value="">Selecione o produto...</option>
                    {products
                      .filter((p) => p.banco_id === ruleForm.banco_id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Convênio (Opcional)</label>
                <select
                  value={ruleForm.convenio_id}
                  onChange={(e) => setRuleForm({ ...ruleForm, convenio_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                >
                  <option value="">Aplica-se a todos os convênios</option>
                  {agreements
                    .filter((a) => a.banco_id === ruleForm.banco_id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Prazo Mínimo (Meses)</label>
                  <input
                    type="number"
                    value={ruleForm.prazo_min}
                    onChange={(e) => setRuleForm({ ...ruleForm, prazo_min: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Prazo Máximo (Meses)</label>
                  <input
                    type="number"
                    value={ruleForm.prazo_max}
                    onChange={(e) => setRuleForm({ ...ruleForm, prazo_max: parseInt(e.target.value) || 84 })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Valor Mínimo (R$)</label>
                  <input
                    type="number"
                    value={ruleForm.valor_min}
                    onChange={(e) => setRuleForm({ ...ruleForm, valor_min: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Valor Máximo (R$)</label>
                  <input
                    type="number"
                    value={ruleForm.valor_max}
                    onChange={(e) => setRuleForm({ ...ruleForm, valor_max: parseFloat(e.target.value) || 100000 })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Tipo de Comissão *</label>
                  <select
                    value={ruleForm.tipo_comissao}
                    onChange={(e) => setRuleForm({ ...ruleForm, tipo_comissao: e.target.value as CommissionType })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  >
                    <option value="PERCENTUAL">PERCENTUAL (%)</option>
                    <option value="FIXA">FIXA (R$ Valor Fixo)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">
                    {ruleForm.tipo_comissao === 'PERCENTUAL' ? 'Percentual (%)' : 'Valor Fixo (R$)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleForm.valor_comissao}
                    onChange={(e) => setRuleForm({ ...ruleForm, valor_comissao: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Salvar Regra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
