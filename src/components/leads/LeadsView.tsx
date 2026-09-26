import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  Lead,
  LeadStatus,
  LeadSource,
  LeadHistoryItem,
  User,
} from '../../types/crm';
import { formatCPF, formatPhone, formatDate } from '../../utils/formatters';
import {
  Users,
  Search,
  UserPlus,
  Filter,
  Eye,
  Edit2,
  MessageCircle,
  UserCheck,
  PlusCircle,
  AlertTriangle,
  X,
  Clock,
  Send,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Save,
  CheckCircle2,
  Tag,
} from 'lucide-react';

export const LeadsView: React.FC<{
  onOpenCreateOpportunityForClient?: (clientId: string) => void;
  onNavigateToClients?: () => void;
}> = ({ onNavigateToClients }) => {
  const { currentUser, hasPermission, refreshUser } = useAuth();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [origemFilter, setOrigemFilter] = useState<string>('ALL');
  const [vendedorFilter, setVendedorFilter] = useState<string>('ALL');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Duplicity Alert Modal
  const [duplicateFoundLead, setDuplicateFoundLead] = useState<Lead | null>(null);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  // Detail Modal
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Distribute Modal
  const [distributeLeadItem, setDistributeLeadItem] = useState<Lead | null>(null);
  const [distributeTargetSellerId, setDistributeTargetSellerId] = useState('');

  // Form Fields State
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [origem, setOrigem] = useState<LeadSource>('Cadastro manual');
  const [campanha, setCampanha] = useState('');
  const [anuncio, setAnuncio] = useState('');
  const [produtoInteresse, setProdutoInteresse] = useState('Empréstimo Consignado INSS');
  const [observacoes, setObservacoes] = useState('');
  const [vendedorId, setVendedorId] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Distribution Queue Panel States
  const [showQueuePanel, setShowQueuePanel] = useState(false);
  const [selectedQueueIds, setSelectedQueueIds] = useState<string[]>([]);
  const [queueSellerId, setQueueSellerId] = useState('');
  const [isQueueDistributing, setIsQueueDistributing] = useState(false);

  const leads = apiService.getLeads(currentUser);
  const users = apiService.getUsers();
  const sellers = users.filter((u) => u.role === 'Vendedor' && u.status === 'Ativo');

  // Leads in queue awaiting distribution
  const waitingLeads = leads.filter(
    (l) => (l.vendedor_id === '' || l.vendedor_id === 'unassigned') && l.status === 'Novo'
  );

  const handleDistributeQueueLeads = async () => {
    if (selectedQueueIds.length === 0) {
      alert('Selecione pelo menos um lead para distribuir.');
      return;
    }
    if (!queueSellerId) {
      alert('Selecione o vendedor de destino.');
      return;
    }

    setIsQueueDistributing(true);
    try {
      await apiService.distributeLeadsFila(selectedQueueIds, queueSellerId, currentUser);
      alert(`${selectedQueueIds.length} lead(s) distribuído(s) com sucesso para o vendedor selecionado!`);
      setSelectedQueueIds([]);
      setQueueSellerId('');
      setShowQueuePanel(false);
      refreshUser();
    } catch (err: any) {
      alert(err.message || 'Erro ao distribuir leads.');
    } finally {
      setIsQueueDistributing(false);
    }
  };

  // Permissions
  const canCreate = hasPermission('criar_lead') || hasPermission('criar_leads');
  const canEdit = hasPermission('editar_lead') || hasPermission('editar_leads');
  const canDistribute =
    hasPermission('distribuir_leads') ||
    currentUser?.role === 'Administrador' ||
    currentUser?.role === 'Supervisor';
  const canConvert = hasPermission('converter_lead');

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.telefone.includes(searchTerm) ||
      l.cpf.includes(searchTerm) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchesOrigem = origemFilter === 'ALL' || l.origem === origemFilter;
    const matchesVendedor = vendedorFilter === 'ALL' || l.vendedor_id === vendedorFilter;

    return matchesSearch && matchesStatus && matchesOrigem && matchesVendedor;
  });

  const resetForm = () => {
    setNome('');
    setTelefone('');
    setWhatsapp('');
    setEmail('');
    setCpf('');
    setCidade('');
    setEstado('');
    setOrigem('Cadastro manual');
    setCampanha('');
    setAnuncio('');
    setProdutoInteresse('Empréstimo Consignado INSS');
    setObservacoes('');
    setVendedorId(currentUser?.id || (sellers.length > 0 ? sellers[0].id : ''));
    setEditingLead(null);
    setFormError(null);
    setDuplicateFoundLead(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setNome(lead.nome);
    setTelefone(lead.telefone);
    setWhatsapp(lead.whatsapp || lead.telefone);
    setEmail(lead.email || '');
    setCpf(lead.cpf || '');
    setCidade(lead.cidade || '');
    setEstado(lead.estado || '');
    setOrigem(lead.origem);
    setCampanha(lead.campanha || '');
    setAnuncio(lead.anuncio || '');
    setProdutoInteresse(lead.produto_interesse);
    setObservacoes(lead.observacoes || '');
    setVendedorId(lead.vendedor_id);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nome.trim()) {
      setFormError('Informe o nome completo do lead.');
      return;
    }
    if (!telefone.trim() || telefone.replace(/\D/g, '').length < 8) {
      setFormError('Informe um telefone válido.');
      return;
    }

    const payload = {
      nome,
      telefone,
      whatsapp: whatsapp || telefone,
      email,
      cpf,
      cidade,
      estado,
      origem,
      campanha,
      anuncio,
      produto_interesse: produtoInteresse,
      observacoes,
      vendedor_id: vendedorId || currentUser?.id,
    };

    // Check duplicity if creating new
    if (!editingLead) {
      const duplicate = apiService.findDuplicateLead({ phone: telefone, cpf });
      if (duplicate) {
        setDuplicateFoundLead(duplicate);
        setPendingFormData(payload);
        return;
      }
    }

    await saveLead(payload);
  };

  const saveLead = async (payload: any) => {
    if (!currentUser) return;
    try {
      setIsSubmitting(true);
      if (editingLead) {
        await apiService.updateLead(editingLead.id, payload, currentUser);
      } else {
        await apiService.createLead(payload, currentUser);
      }
      setIsModalOpen(false);
      resetForm();
      refreshUser();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenExistingFromDuplicate = () => {
    if (duplicateFoundLead) {
      const target = duplicateFoundLead;
      setIsModalOpen(false);
      setDuplicateFoundLead(null);
      setDetailLead(target);
    }
  };

  const handleUpdateExistingFromDuplicate = () => {
    if (duplicateFoundLead && pendingFormData) {
      setEditingLead(duplicateFoundLead);
      setDuplicateFoundLead(null);
    }
  };

  const handleStatusChangeInDetail = async (newStatus: LeadStatus) => {
    if (!detailLead || !currentUser) return;
    try {
      const updated = await apiService.updateLeadStatus(
        detailLead.id,
        newStatus,
        currentUser,
        newNoteText.trim()
      );
      setDetailLead({ ...updated });
      setNewNoteText('');
      refreshUser();
    } catch (e: any) {
      alert(e.message || 'Erro ao alterar status.');
    }
  };

  const handleAddNoteInDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailLead || !currentUser || !newNoteText.trim()) return;

    apiService.addLeadHistoryItem(
      detailLead.id,
      currentUser,
      'OBSERVACAO_ADICIONADA',
      newNoteText.trim()
    );
    setNewNoteText('');
    setDetailLead({ ...detailLead }); // trigger re-render
  };

  const handleConvertLead = async (lead: Lead) => {
    if (!currentUser) return;
    const confirm = window.confirm(
      `Este lead "${lead.nome}" será transformado em cliente. Deseja continuar?`
    );
    if (!confirm) return;

    try {
      await apiService.convertLeadToClient(lead.id, currentUser);
      refreshUser();
      alert(`Lead "${lead.nome}" foi convertido em cliente com sucesso!`);
      if (onNavigateToClients) onNavigateToClients();
    } catch (err: any) {
      alert(err.message || 'Erro ao converter lead.');
    }
  };

  const handleConfirmDistribution = async () => {
    if (!distributeLeadItem || !distributeTargetSellerId || !currentUser) return;
    try {
      await apiService.distributeLead(
        distributeLeadItem.id,
        distributeTargetSellerId,
        currentUser
      );
      setDistributeLeadItem(null);
      refreshUser();
    } catch (err: any) {
      alert(err.message || 'Erro ao distribuir lead.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#022859] border border-[#034AA6]/40 text-white rounded-2xl p-5 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#F2B807]" />
            <h2 className="text-lg font-extrabold text-white">Leads e Prospecção</h2>
            <span className="px-2.5 py-0.5 bg-[#034AA6] border border-[#F2B807]/40 text-[#F2B807] text-xs font-mono font-bold rounded-full">
              {filteredLeads.length} registrado(s)
            </span>
          </div>
          <p className="text-xs text-blue-200 mt-1">
            Gestão de potenciais tomadores de crédito, origens de campanha e conversão.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-[#034AA6] hover:bg-[#022859] border border-[#F2B807]/50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#F2B807]" />
            <span>+ Novo Lead</span>
          </button>
        )}
      </div>

      {/* 📥 Fila de Novos Leads — Leads Aguardando Distribuição */}
      {canDistribute && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Card Header Summary */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#F28907]/10 text-[#F28907] rounded-xl border border-[#F28907]/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#022859]">📥 Fila de Novos Leads (Aguardando Distribuição)</h3>
                  <span className="px-2 py-0.5 bg-[#F28907] text-white text-[10px] font-bold rounded-full font-mono">
                    {waitingLeads.length} lead(s)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Novos leads importados automaticamente ou via planilha que aguardam vendedor responsável.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowQueuePanel(!showQueuePanel)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#022859] font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{showQueuePanel ? 'Ocultar Fila ✕' : 'Expandir e Distribuir ⚡'}</span>
            </button>
          </div>

          {/* Detailed Queue List and Action Panel */}
          {showQueuePanel && (
            <div className="p-5 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-4 duration-150">
              {/* Batch Actions Header */}
              {selectedQueueIds.length > 0 && (
                <div className="p-3 bg-[#F28907]/10 border border-[#F28907]/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-bold text-[#F28907]">
                    {selectedQueueIds.length} lead(s) selecionado(s) para distribuição em lote:
                  </span>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={queueSellerId}
                      onChange={(e) => setQueueSellerId(e.target.value)}
                      className="bg-white border border-slate-200 focus:border-[#034AA6] rounded-xl py-1.5 px-3 text-xs text-[#022859] outline-none cursor-pointer font-bold"
                    >
                      <option value="">Selecione o vendedor de destino...</option>
                      {sellers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleDistributeQueueLeads}
                      disabled={isQueueDistributing || !queueSellerId}
                      className="px-4 py-1.5 bg-[#034AA6] hover:bg-[#022859] text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isQueueDistributing ? 'Atribuindo...' : 'Confirmar Distribuição'}
                    </button>
                  </div>
                </div>
              )}

              {/* Table of waiting leads */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#022859]/5 text-[#022859] font-mono text-[9px] uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-3 py-2 w-8">
                        <button
                          onClick={() => {
                            if (selectedQueueIds.length === waitingLeads.length) {
                              setSelectedQueueIds([]);
                            } else {
                              setSelectedQueueIds(waitingLeads.map((l) => l.id));
                            }
                          }}
                          className="text-slate-400 hover:text-[#034AA6] cursor-pointer"
                        >
                          {selectedQueueIds.length === waitingLeads.length && waitingLeads.length > 0 ? (
                            <CheckCircle2 className="w-4 h-4 text-[#034AA6]" />
                          ) : (
                            <div className="w-4 h-4 border border-slate-300 rounded" />
                          )}
                        </button>
                      </th>
                      <th className="px-3 py-2.5">Nome Lead</th>
                      <th className="px-3 py-2.5">Telefone</th>
                      <th className="px-3 py-2.5">Cidade/UF</th>
                      <th className="px-3 py-2.5">Origem</th>
                      <th className="px-3 py-2.5">Campanha/Anúncio</th>
                      <th className="px-3 py-2.5">Interesse / Produto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {waitingLeads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Nenhum lead aguardando distribuição na fila.
                        </td>
                      </tr>
                    ) : (
                      waitingLeads.map((lead) => {
                        const isSelected = selectedQueueIds.includes(lead.id);
                        return (
                          <tr key={lead.id} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-blue-50/20' : ''}`}>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedQueueIds(selectedQueueIds.filter((id) => id !== lead.id));
                                  } else {
                                    setSelectedQueueIds([...selectedQueueIds, lead.id]);
                                  }
                                }}
                                className="text-slate-400 hover:text-[#034AA6] cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#034AA6]" />
                                ) : (
                                  <div className="w-4 h-4 border border-slate-300 rounded" />
                                )}
                              </button>
                            </td>
                            <td className="px-3 py-2.5 font-bold text-[#022859]">{lead.nome}</td>
                            <td className="px-3 py-2.5 font-mono text-slate-500">{lead.telefone}</td>
                            <td className="px-3 py-2.5 font-semibold text-slate-600">{lead.cidade || 'Não informada'}</td>
                            <td className="px-3 py-2.5">
                              <span className="inline-block px-1.5 py-0.2 bg-[#F2F2F2] border border-slate-200 text-[#022859] text-[9px] font-bold rounded">
                                {lead.origem}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <p className="text-[10px] text-slate-500 font-bold truncate max-w-[120px]" title={lead.campanha}>{lead.campanha || '-'}</p>
                              <p className="text-[9px] text-slate-400 truncate max-w-[120px]" title={lead.anuncio}>{lead.anuncio || '-'}</p>
                            </td>
                            <td className="px-3 py-2.5 font-bold text-[#034AA6]">{lead.produto_interesse}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, telefone ou CPF..."
            className="w-full bg-[#F2F2F2] border border-slate-200 focus:border-[#034AA6] rounded-xl py-2 pl-9 pr-3 text-xs text-[#022859] placeholder-slate-400 outline-none"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full bg-[#F2F2F2] border border-slate-200 focus:border-[#034AA6] rounded-xl py-2 px-3 text-xs text-[#022859] outline-none cursor-pointer font-medium"
        >
          <option value="ALL">Todos os Status</option>
          <option value="Novo">Novo</option>
          <option value="Em contato">Em contato</option>
          <option value="Qualificado">Qualificado</option>
          <option value="Sem interesse">Sem interesse</option>
          <option value="Convertido">Convertido</option>
          <option value="Perdido">Perdido</option>
        </select>

        {/* Origem Filter */}
        <select
          value={origemFilter}
          onChange={(e) => setOrigemFilter(e.target.value)}
          className="w-full bg-[#F2F2F2] border border-slate-200 focus:border-[#034AA6] rounded-xl py-2 px-3 text-xs text-[#022859] outline-none cursor-pointer font-medium"
        >
          <option value="ALL">Todas as Origens</option>
          <option value="Facebook">Facebook Ads</option>
          <option value="Instagram">Instagram</option>
          <option value="Google">Google</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Indicação">Indicação</option>

          <option value="Site">Site</option>
          <option value="Cadastro manual">Cadastro Manual</option>
        </select>

        {/* Vendedor Filter */}
        <select
          value={vendedorFilter}
          onChange={(e) => setVendedorFilter(e.target.value)}
          className="w-full bg-[#F2F2F2] border border-slate-200 focus:border-[#034AA6] rounded-xl py-2 px-3 text-xs text-[#022859] outline-none cursor-pointer font-medium"
        >
          <option value="ALL">Todos os Vendedores</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#022859] border-b border-[#034AA6]/30 text-white uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Nome Lead / Contato</th>
                <th className="px-4 py-3.5">Origem / Produto</th>
                <th className="px-4 py-3.5">Vendedor Responsável</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Data Cadastro</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="font-semibold">Nenhum lead encontrado com os filtros selecionados.</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const waUrl = apiService.formatWhatsAppUrl(
                    lead.whatsapp || lead.telefone,
                    `Olá ${lead.nome}, sou ${lead.vendedor_nome} da Cred Sempre +. Como posso te ajudar com a simulação de ${lead.produto_interesse}?`
                  );

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      {/* Name & Contact */}
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-extrabold text-[#022859]">{lead.nome}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {lead.telefone} {lead.cidade ? `• ${lead.cidade}/${lead.estado}` : ''}
                          </p>
                        </div>
                      </td>

                      {/* Origem & Produto */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 bg-[#F2F2F2] border border-slate-200 text-[#022859] text-[10px] font-bold rounded">
                            {lead.origem}
                          </span>
                          <p className="text-[11px] font-bold text-[#034AA6] truncate max-w-[160px]">
                            {lead.produto_interesse}
                          </p>
                        </div>
                      </td>

                      {/* Vendedor */}
                      <td className="px-4 py-3.5">
                        <div className="text-[#022859] font-bold text-xs">
                          {lead.vendedor_nome}
                          {lead.supervisor_nome && (
                            <span className="block text-[10px] text-slate-500 font-normal">
                              Sup: {lead.supervisor_nome}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            lead.status === 'Novo'
                              ? 'bg-[#034AA6]/10 text-[#034AA6] border-[#034AA6]/30'
                              : lead.status === 'Em contato'
                              ? 'bg-[#F28907]/10 text-[#F28907] border-[#F28907]/30'
                              : lead.status === 'Qualificado'
                              ? 'bg-[#022859]/10 text-[#022859] border-[#022859]/30'
                              : lead.status === 'Convertido'
                              ? 'bg-[#034AA6] text-white border-[#F2B807]/50'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">
                        {formatDate(lead.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir no WhatsApp"
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          {/* Detail */}
                          <button
                            onClick={() => setDetailLead(lead)}
                            title="Visualizar Ficha Completa"
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEditModal(lead)}
                              title="Editar Lead"
                              className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Distribute */}
                          {canDistribute && (
                            <button
                              onClick={() => {
                                setDistributeLeadItem(lead);
                                setDistributeTargetSellerId(lead.vendedor_id);
                              }}
                              title="Distribuir Lead"
                              className="p-1.5 text-slate-400 hover:text-blue-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Convert to Client */}
                          {canConvert && lead.status !== 'Convertido' && (
                            <button
                              onClick={() => handleConvertLead(lead)}
                              title="Converter em Cliente"
                              className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowRight className="w-3 h-3" />
                              <span className="hidden sm:inline">Cliente</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl relative my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingLead ? 'Editar Lead' : 'Novo Lead / Oportunidade'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cadastre o potencial tomador de crédito consignado ou empréstimo
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Maria das Dores Mello"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Telefone Principal *</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">CPF</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Ex: São Paulo"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value.toUpperCase())}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 uppercase font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Origem do Lead *</label>
                  <select
                    value={origem}
                    onChange={(e) => setOrigem(e.target.value as LeadSource)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                  >
                    <option value="Cadastro manual">Cadastro Manual</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Facebook">Facebook Ads</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Google">Google</option>
                    <option value="Indicação">Indicação</option>
                    <option value="Site">Site da Corretora</option>

                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Produto de Interesse *</label>
                  <select
                    value={produtoInteresse}
                    onChange={(e) => setProdutoInteresse(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                  >
                    <option value="Empréstimo Consignado INSS">Empréstimo Consignado INSS</option>
                    <option value="Consignado SIAPE">Consignado SIAPE</option>

                    <option value="Saque Aniversário FGTS">Saque Aniversário FGTS</option>
                    <option value="Cartão Benefício Consignado">Cartão Benefício Consignado</option>
                    <option value="Refinanciamento com Troco">Refinanciamento com Troco</option>
                    <option value="Portabilidade de Crédito">Portabilidade de Crédito</option>
                    <option value="Empréstimo Pessoal">Empréstimo Pessoal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Campanha (Opcional)</label>
                  <input
                    type="text"
                    value={campanha}
                    onChange={(e) => setCampanha(e.target.value)}
                    placeholder="Ex: Meta Ads INSS 84x"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Anúncio (Opcional)</label>
                  <input
                    type="text"
                    value={anuncio}
                    onChange={(e) => setAnuncio(e.target.value)}
                    placeholder="Ex: Anúncio Imagem Aumento Margem"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              {/* Vendedor Responsavel */}
              {(currentUser?.role === 'Administrador' || currentUser?.role === 'Supervisor') && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Vendedor Atribuído</label>
                  <select
                    value={vendedorId}
                    onChange={(e) => setVendedorId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                  >
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observações do Atendimento</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                  placeholder="Informações adicionais, valores simulados, horário de preferência..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingLead ? 'Salvar Alterações' : 'Cadastrar Lead'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Found Warning Modal */}
      {duplicateFoundLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-white text-center">
              Aviso: Já existe um lead cadastrado com estes dados!
            </h3>
            <p className="text-xs text-slate-400 text-center mt-1">
              O sistema identificou uma possível duplicidade de telefone ou CPF.
            </p>

            <div className="mt-4 p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5">
              <p className="font-bold text-slate-200">{duplicateFoundLead.nome}</p>
              <p className="text-slate-400 font-mono text-[11px]">
                Telefone: {duplicateFoundLead.telefone}
              </p>
              {duplicateFoundLead.cpf && (
                <p className="text-slate-400 font-mono text-[11px]">
                  CPF: {duplicateFoundLead.cpf}
                </p>
              )}
              <p className="text-emerald-400 text-[11px] font-semibold">
                Vendedor: {duplicateFoundLead.vendedor_nome} • Status: {duplicateFoundLead.status}
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={handleOpenExistingFromDuplicate}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Abrir Cadastro Existente
              </button>
              <button
                type="button"
                onClick={handleUpdateExistingFromDuplicate}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Atualizar Cadastro Existente
              </button>
              <button
                type="button"
                onClick={() => setDuplicateFoundLead(null)}
                className="w-full py-2 bg-transparent text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail & Timeline Drawer */}
      {detailLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold">
                  {detailLead.nome.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{detailLead.nome}</h3>
                  <p className="text-[11px] font-mono text-slate-400">{detailLead.id}</p>
                </div>
              </div>

              <button
                onClick={() => setDetailLead(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Status Change Bar */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Status do Lead na Esteira
                </span>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      'Novo',
                      'Em contato',
                      'Qualificado',
                      'Sem interesse',
                      'Convertido',
                      'Perdido',
                    ] as LeadStatus[]
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChangeInDetail(st)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        detailLead.status === st
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* General Data Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold uppercase">Telefone</span>
                  <span className="font-mono text-slate-200">{detailLead.telefone}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold uppercase">WhatsApp</span>
                  <span className="font-mono text-emerald-400">{detailLead.whatsapp || detailLead.telefone}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold uppercase">CPF</span>
                  <span className="font-mono text-slate-200">{detailLead.cpf || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold uppercase">Origem</span>
                  <span className="text-slate-200 font-bold">{detailLead.origem}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold uppercase">Produto</span>
                  <span className="text-emerald-400 font-bold">{detailLead.produto_interesse}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold uppercase">Vendedor</span>
                  <span className="text-slate-200">{detailLead.vendedor_nome}</span>
                </div>
              </div>

              {/* Notes & History Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Histórico & Linha do Tempo do Atendimento</span>
                </h4>

                {/* Add Note Form */}
                <form onSubmit={handleAddNoteInDetail} className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Adicionar observação sobre o cliente..."
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Registrar</span>
                  </button>
                </form>

                {/* Timeline list */}
                <div className="space-y-2 border-l-2 border-slate-800 pl-4 ml-2 pt-1">
                  {apiService.getLeadHistory(detailLead.id).map((item) => (
                    <div key={item.id} className="relative pb-3">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full absolute -left-[21px] top-1 border-2 border-slate-900" />
                      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 mb-0.5">
                        <span className="font-bold text-slate-300">{item.user_name}</span>
                        <span className="font-mono">{formatDate(item.created_at)}</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
              {canConvert && detailLead.status !== 'Convertido' && (
                <button
                  onClick={() => handleConvertLead(detailLead)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Converter em Cliente</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setDetailLead(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer ml-auto"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Distribution Modal */}
      {distributeLeadItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white mb-1">
              Distribuir Lead: {distributeLeadItem.nome}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Selecione o novo vendedor responsável para este atendimento.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vendedor Responsável
                </label>
                <select
                  value={distributeTargetSellerId}
                  onChange={(e) => setDistributeTargetSellerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-2.5 text-xs text-white outline-none cursor-pointer"
                >
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => setDistributeLeadItem(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDistribution}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  Confirmar Reatribuição
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
