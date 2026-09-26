import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { Client, Opportunity, User } from '../../types/crm';
import { formatCPF, formatPhone, formatDate, formatCurrency } from '../../utils/formatters';
import {
  UserCheck,
  Search,
  UserPlus,
  Filter,
  Eye,
  Edit2,
  MessageCircle,
  PlusCircle,
  X,
  FileText,
  Clock,
  Briefcase,
  Building2,
  Save,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  FolderOpen,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';

import { OpportunityModal } from '../opportunities/OpportunityModal';

interface ClientsViewProps {
  onOpenCreateOpportunityForClient?: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onOpenCreateOpportunityForClient,
}) => {
  const { currentUser, hasPermission, refreshUser } = useAuth();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [vendedorFilter, setVendedorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail Drawer State
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<
    'dados' | 'oportunidades' | 'historico' | 'documentos'
  >('dados');

  // Create Client Modal State
  const [isCreateModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientForNewOpp, setClientForNewOpp] = useState<Client | null>(null);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [vendedorId, setVendedorId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client Documents state
  const [clientDocuments, setClientDocuments] = useState<any[]>([]);
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [docCategory, setDocCategory] = useState('RG');
  const [docDescription, setDocDescription] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [viewingDocUrl, setViewingDocUrl] = useState<string | null>(null);
  const [viewingDocType, setViewingDocType] = useState<string | null>(null);

  const loadClientDocs = async (clientId: string) => {
    try {
      const docs = await apiService.getClientDocuments(clientId);
      setClientDocuments(docs);
    } catch (e) {
      console.error('Erro ao carregar documentos:', e);
    }
  };

  const clients = apiService.getClients(currentUser);
  const opportunities = apiService.getOpportunities(currentUser);
  const users = apiService.getUsers();
  const sellers = users.filter((u) => u.role === 'Vendedor' && u.status === 'Ativo');

  const canCreate = hasPermission('criar_cliente') || hasPermission('criar_clientes');
  const canConvertToContract = hasPermission('virar_contrato');

  const handleConvertToContractInClients = async (opp: Opportunity) => {
    if (!currentUser) return;
    if (!canConvertToContract) {
      alert('Você não possui permissão para converter esta oportunidade em contrato.');
      return;
    }
    if (opp.has_contract) {
      alert('Esta oportunidade já foi convertida em contrato.');
      return;
    }
    const confirmMsg = `Deseja converter a oportunidade do Banco ${opp.banco_nome} (R$ ${opp.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) em um CONTRATO OFICIAL?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await apiService.convertToContract(opp.id, currentUser);
      refreshUser();
      alert(`Contrato #${res.contract.numero_contrato} gerado com sucesso!`);
    } catch (e: any) {
      alert(e.message || 'Erro ao converter para contrato.');
    }
  };
  const canEdit = hasPermission('editar_cliente') || hasPermission('editar_clientes');

  // Filtered
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cpf.includes(searchTerm) ||
      c.telefone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVendedor = vendedorFilter === 'ALL' || c.vendedor_id === vendedorFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesVendedor && matchesStatus;
  });

  const resetForm = () => {
    setNome('');
    setCpf('');
    setTelefone('');
    setWhatsapp('');
    setEmail('');
    setCidade('');
    setEstado('');
    setObservacoes('');
    setVendedorId(currentUser?.id || (sellers.length > 0 ? sellers[0].id : ''));
    setEditingClient(null);
    setFormError(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setNome(client.nome);
    setCpf(client.cpf || '');
    setTelefone(client.telefone);
    setWhatsapp(client.whatsapp || client.telefone);
    setEmail(client.email || '');
    setCidade(client.cidade || '');
    setEstado(client.estado || '');
    setObservacoes(client.observacoes || '');
    setVendedorId(client.vendedor_id);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nome.trim()) {
      setFormError('O nome completo do cliente é obrigatório.');
      return;
    }
    if (!telefone.trim()) {
      setFormError('O telefone de contato é obrigatório.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingClient) {
        await apiService.updateClient(
          editingClient.id,
          {
            nome,
            cpf,
            telefone,
            whatsapp: whatsapp || telefone,
            email,
            cidade,
            estado,
            observacoes,
            vendedor_id: vendedorId || currentUser?.id,
          },
          currentUser!
        );
      } else {
        await apiService.createClient(
          {
            nome,
            cpf,
            telefone,
            whatsapp: whatsapp || telefone,
            email,
            cidade,
            estado,
            observacoes,
            vendedor_id: vendedorId || currentUser?.id,
          },
          currentUser!
        );
      }
      setIsModalOpen(false);
      resetForm();
      refreshUser();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#022859] border border-[#034AA6]/40 text-white rounded-2xl p-5 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#F2B807]" />
            <h2 className="text-lg font-extrabold text-white">Clientes Efetivados</h2>
            <span className="px-2.5 py-0.5 bg-[#034AA6] border border-[#F2B807]/40 text-[#F2B807] text-xs font-mono font-bold rounded-full">
              {filteredClients.length} cadastrado(s)
            </span>
          </div>
          <p className="text-xs text-blue-200 mt-1">
            Base de clientes convertidos com histórico de propostas e documentação.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-[#034AA6] hover:bg-[#022859] border border-[#F2B807]/50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#F2B807]" />
            <span>+ Novo Cliente</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cliente por nome, CPF ou telefone..."
            className="w-full bg-[#F2F2F2] border border-slate-200 focus:border-[#034AA6] rounded-xl py-2 pl-9 pr-3 text-xs text-[#022859] placeholder-slate-400 outline-none"
          />
        </div>

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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full bg-[#F2F2F2] border border-slate-200 focus:border-[#034AA6] rounded-xl py-2 px-3 text-xs text-[#022859] outline-none cursor-pointer font-medium"
        >
          <option value="ALL">Todos os Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
        </select>
      </div>

      {/* Clients Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#022859] border-b border-[#034AA6]/30 text-white uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Nome Cliente / CPF</th>
                <th className="px-4 py-3.5">Contato / Localidade</th>
                <th className="px-4 py-3.5">Vendedor Responsável</th>
                <th className="px-4 py-3.5">Oportunidades</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="font-semibold">Nenhum cliente cadastrado no momento.</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const clientOpps = opportunities.filter((o) => o.client_id === client.id);
                  const waUrl = apiService.formatWhatsAppUrl(client.whatsapp || client.telefone);

                  return (
                    <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-extrabold text-[#022859]">{client.nome}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {client.cpf || 'Sem CPF'}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[11px] text-slate-600">
                          <p className="font-semibold text-[#022859]">{client.telefone}</p>
                          <p className="text-slate-400 text-[10px]">
                            {client.cidade ? `${client.cidade}/${client.estado}` : '-'}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-bold text-[#022859]">{client.vendedor_nome}</p>
                        {client.supervisor_nome && (
                          <p className="text-[10px] text-slate-500">Sup: {client.supervisor_nome}</p>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-0.5 bg-[#034AA6]/10 border border-[#034AA6]/30 text-[#034AA6] font-mono font-bold rounded-full">
                          {clientOpps.length} proposta(s)
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            client.status === 'Ativo'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {client.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Conversar no WhatsApp"
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          {/* Nova Oportunidade */}
                          <button
                            onClick={() => {
                              if (onOpenCreateOpportunityForClient) {
                                onOpenCreateOpportunityForClient(client);
                              } else {
                                setClientForNewOpp(client);
                              }
                            }}
                            title="Nova Oportunidade"
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Detail */}
                          <button
                            onClick={() => {
                              setDetailClient(client);
                              setDetailActiveTab('dados');
                            }}
                            title="Visualizar Ficha do Cliente"
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEditModal(client)}
                              title="Editar Cliente"
                              className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
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

      {/* Create / Edit Client Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl relative my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cadastre o cliente de crédito para simulações e propostas
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
              <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitClient} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João da Silva Sauro"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">CPF *</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Telefone *</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white font-mono placeholder-slate-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 outline-none"
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
                    placeholder="Cidade"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value.toUpperCase())}
                    placeholder="UF"
                    maxLength={2}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white uppercase font-mono placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              {(currentUser?.role === 'Administrador' || currentUser?.role === 'Supervisor') && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Vendedor Responsável</label>
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
                <label className="block font-semibold text-slate-300 mb-1">Observações</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                  placeholder="Informações do convênio (INSS, SIAPE, Forças Armadas)..."
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
                  <span>{editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Detail Drawer */}
      {detailClient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold">
                  {detailClient.nome.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{detailClient.nome}</h3>
                  <p className="text-[11px] font-mono text-slate-400">CPF: {detailClient.cpf || '-'}</p>
                </div>
              </div>

              <button
                onClick={() => setDetailClient(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Tabs */}
            <div className="px-6 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center gap-2 text-xs">
              <button
                onClick={() => setDetailActiveTab('dados')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  detailActiveTab === 'dados'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dados Pessoais
              </button>
              <button
                onClick={() => setDetailActiveTab('oportunidades')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  detailActiveTab === 'oportunidades'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Oportunidades ({opportunities.filter((o) => o.client_id === detailClient.id).length})
              </button>
              <button
                onClick={() => setDetailActiveTab('historico')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  detailActiveTab === 'historico'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Histórico
              </button>
              <button
                onClick={() => {
                  setDetailActiveTab('documentos');
                  if (detailClient) loadClientDocs(detailClient.id);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  detailActiveTab === 'documentos'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Documentos ({clientDocuments.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {detailActiveTab === 'dados' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase text-slate-400 border-b border-slate-800 pb-2">
                      Informações Principais
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-500 block">CPF</span>
                        <span className="font-mono font-bold text-white">{detailClient.cpf}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Telefone</span>
                        <span className="font-mono">{detailClient.telefone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">WhatsApp</span>
                        <span className="font-mono text-emerald-400">
                          {detailClient.whatsapp || detailClient.telefone}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">E-mail</span>
                        <span>{detailClient.email || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Localidade</span>
                        <span>
                          {detailClient.cidade ? `${detailClient.cidade}/${detailClient.estado}` : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Cadastrado em</span>
                        <span className="font-mono">{formatDate(detailClient.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Responsaveis */}
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase text-slate-400 border-b border-slate-800 pb-2">
                      Equipe Responsável
                    </h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Vendedor Atribuído</span>
                        <span className="font-bold text-emerald-400">{detailClient.vendedor_nome}</span>
                      </div>
                      {detailClient.supervisor_nome && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Supervisor</span>
                          <span className="font-bold text-blue-400">{detailClient.supervisor_nome}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {detailClient.observacoes && (
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Observações do Cliente
                      </span>
                      <p className="text-slate-300 leading-relaxed">{detailClient.observacoes}</p>
                    </div>
                  )}
                </div>
              )}

              {detailActiveTab === 'oportunidades' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">Propostas e Contratos Ativos</h4>
                    <button
                      onClick={() => {
                        const target = detailClient;
                        setDetailClient(null);
                        if (onOpenCreateOpportunityForClient) {
                          onOpenCreateOpportunityForClient(target);
                        } else {
                          setClientForNewOpp(target);
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Nova Oportunidade</span>
                    </button>
                  </div>

                  {opportunities.filter((o) => o.client_id === detailClient.id).length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                      <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      <p>Nenhuma oportunidade cadastrada para este cliente.</p>
                    </div>
                  ) : (
                    opportunities
                      .filter((o) => o.client_id === detailClient.id)
                      .map((opp) => (
                        <div
                          key={opp.id}
                          className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{opp.banco_nome}</span>
                              {opp.has_contract && (
                                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold rounded-full flex items-center gap-1">
                                  <FileCheck className="w-3 h-3" />
                                  <span>Contrato Emitido</span>
                                </span>
                              )}
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full">
                              {opp.etapa}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400 text-[11px]">
                            <span>{opp.produto_nome}</span>
                            <span className="font-mono text-white font-bold">
                              {formatCurrency(opp.valor)} ({opp.prazo}x)
                            </span>
                          </div>

                          {!opp.has_contract && canConvertToContract && (
                            <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleConvertToContractInClients(opp)}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>Virar Contrato</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              )}

              {detailActiveTab === 'historico' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white">Linha do Tempo do Cliente</h4>
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs">
                    <p className="text-emerald-400 font-bold">Cliente Efetivado</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Cadastrado em {formatDate(detailClient.created_at)} por {detailClient.vendedor_nome}.
                    </p>
                  </div>
                </div>
              )}

              {detailActiveTab === 'documentos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">Documentos do Cliente</h4>
                      <p className="text-[11px] text-slate-400">Gerenciamento de RG, CPF, comprovantes e contratos.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDocCategory('RG');
                        setDocDescription('');
                        setDocFile(null);
                        setDocUploadError(null);
                        setIsUploadDocModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+ Adicionar Documento</span>
                    </button>
                  </div>

                  {clientDocuments.length === 0 ? (
                    <div className="p-8 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-3">
                      <FolderOpen className="w-10 h-10 text-slate-600 mx-auto" />
                      <h4 className="text-xs font-bold text-white">Nenhum documento cadastrado</h4>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Clique em "+ Adicionar Documento" para enviar fotos ou arquivos PDF (máximo 10 MB).
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {clientDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-xs text-emerald-400 shrink-0 uppercase">
                              {doc.extension || 'PDF'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-slate-800 text-slate-200 text-[10px] font-bold rounded">
                                  {doc.category}
                                </span>
                                <h5 className="font-bold text-white truncate text-xs">{doc.original_name}</h5>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 truncate">
                                {doc.extension?.toUpperCase()} • {(doc.file_size / (1024 * 1024)).toFixed(2)} MB • Enviado em {formatDate(doc.created_at)} por {doc.uploaded_by}
                              </p>
                              {doc.description && (
                                <p className="text-[11px] text-slate-300 italic mt-1">"{doc.description}"</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const url = `/api/client_documents.php?action=view&id=${doc.id}`;
                                setViewingDocUrl(url);
                                setViewingDocType(doc.extension);
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                            >
                              Visualizar
                            </button>
                            <a
                              href={`/api/client_documents.php?action=download&id=${doc.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                            >
                              Baixar
                            </a>
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm('Tem certeza que deseja excluir este documento?')) {
                                  try {
                                    await apiService.deleteClientDocument(doc.id, detailClient.id);
                                    await loadClientDocs(detailClient.id);
                                  } catch (e: any) {
                                    alert(e.message || 'Erro ao excluir documento.');
                                  }
                                }
                              }}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex justify-end shrink-0">
              <button
                onClick={() => setDetailClient(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload Documento */}
      {isUploadDocModalOpen && detailClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="text-base font-bold text-white">Adicionar Documento</h3>
              <button
                onClick={() => setIsUploadDocModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {docUploadError && (
              <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{docUploadError}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!docFile) {
                  setDocUploadError('Selecione um arquivo para enviar.');
                  return;
                }
                if (docFile.size > 10 * 1024 * 1024) {
                  setDocUploadError('O arquivo excede o limite de 10 MB.');
                  return;
                }

                try {
                  setIsUploadingDoc(true);
                  setDocUploadError(null);

                  const formData = new FormData();
                  formData.append('client_id', detailClient.id);
                  formData.append('category', docCategory);
                  formData.append('description', docDescription);
                  formData.append('file', docFile);

                  await apiService.uploadClientDocument(formData);
                  setIsUploadDocModalOpen(false);
                  await loadClientDocs(detailClient.id);
                } catch (err: any) {
                  setDocUploadError(err.message || 'Falha ao enviar documento.');
                } finally {
                  setIsUploadingDoc(false);
                }
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Cliente</label>
                <input
                  type="text"
                  disabled
                  value={detailClient.nome}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-400 outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Categoria do Documento *</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none cursor-pointer font-medium"
                >
                  <option value="RG">RG</option>
                  <option value="CPF">CPF</option>
                  <option value="Comprovante de residência">Comprovante de residência</option>
                  <option value="Comprovante de renda">Comprovante de renda</option>
                  <option value="Extrato bancário">Extrato bancário</option>
                  <option value="Contrato">Contrato</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Arquivo (JPG, JPEG, PNG, PDF - máx 10 MB) *</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setDocFile(e.target.files[0]);
                    }
                  }}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500 file:text-slate-950 hover:file:bg-emerald-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Descrição / Observações (Opcional)</label>
                <textarea
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  rows={2}
                  placeholder="Ex: RG frente e verso atualizado..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadDocModalOpen(false)}
                  disabled={isUploadingDoc}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploadingDoc}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isUploadingDoc ? 'Enviando documento...' : 'Enviar Documento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizador de Documento */}
      {viewingDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-base font-bold text-white">Visualizador de Documento</h3>
              <div className="flex items-center gap-2">
                <a
                  href={viewingDocUrl.replace('action=view', 'action=download')}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-colors"
                >
                  Baixar Arquivo
                </a>
                <button
                  onClick={() => {
                    setViewingDocUrl(null);
                    setViewingDocType(null);
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 p-4 flex items-center justify-center overflow-auto">
              {viewingDocType === 'pdf' ? (
                <iframe src={viewingDocUrl} className="w-full h-full rounded-xl border border-slate-800" title="PDF Viewer" />
              ) : (
                <img src={viewingDocUrl} alt="Documento" className="max-w-full max-h-full object-contain rounded-xl border border-slate-800 shadow-lg" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Local Opportunity Modal */}
      {clientForNewOpp && (
        <OpportunityModal
          isOpen={true}
          onClose={() => setClientForNewOpp(null)}
          preSelectedClient={clientForNewOpp}
          onSuccess={() => {
            setClientForNewOpp(null);
            refreshUser();
          }}
        />
      )}
    </div>
  );
};
