import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { Clock, AlertTriangle, Plus, X, Save, Edit2, Check, Search, User as UserIcon, Building2, Filter } from 'lucide-react';

export const TasksView: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'Administrador';

  const [tasks, setTasks] = useState<any[]>([]);
  const [clientsAndLeads, setClientsAndLeads] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // Form Fields
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('Atendimento');
  const [dataVencimento, setDataVencimento] = useState('');
  const [prioridade, setPrioridade] = useState('Normal');
  const [selectedUserId, setSelectedUserId] = useState(currentUser?.id || '');
  const [selectedClientSearch, setSelectedClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const tasksData = await apiService.getTasks();
      setTasks(tasksData);

      const clientsData = apiService.getClients(currentUser);
      const leadsData = apiService.getLeads(currentUser);
      const combined = [
        ...clientsData.map((c: any) => ({ id: c.id, nome: c.nome, telefone: c.telefone || c.whatsapp || '', type: 'Cliente' })),
        ...leadsData.map((l: any) => ({ id: l.id, nome: l.nome, telefone: l.telefone || l.whatsapp || '', type: 'Lead' }))
      ];
      setClientsAndLeads(combined);

      const allUsers = apiService.getUsers();
      setUsersList(allUsers);
    } catch (e) {
      console.error('Erro ao carregar dados da view de tarefas:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setTitulo('');
    setDescricao('');
    setTipo('Atendimento');
    setDataVencimento(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));
    setPrioridade('Normal');
    setSelectedUserId(currentUser?.id || '');
    setSelectedClientId(null);
    setSelectedClientName(null);
    setSelectedClientSearch('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: any) => {
    setEditingTask(task);
    setTitulo(task.titulo);
    setDescricao(task.descricao || '');
    setTipo(task.tipo || 'Atendimento');
    setDataVencimento(task.data_vencimento ? task.data_vencimento.slice(0, 16) : '');
    setPrioridade(task.prioridade || 'Normal');
    setSelectedUserId(task.user_id || currentUser?.id || '');
    setSelectedClientId(task.cliente_id || task.lead_id || null);
    
    const found = clientsAndLeads.find(c => String(c.id) === String(task.cliente_id || task.lead_id));
    setSelectedClientName(found ? found.name || found.nome : (task.cliente_nome || null));
    setSelectedClientSearch(found ? found.name || found.nome : '');

    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setFormError('Informe o título da tarefa.');
      return;
    }
    if (!dataVencimento) {
      setFormError('Informe a data de vencimento.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        user_id: isAdmin ? selectedUserId : currentUser?.id,
        cliente_id: selectedClientId || undefined,
        lead_id: selectedClientId || undefined, // Compatibilidade com ambos
        tipo,
        titulo,
        descricao,
        data_vencimento: dataVencimento,
        prioridade
      };

      if (editingTask) {
        await apiService.updateTask({
          id: editingTask.id,
          titulo,
          descricao,
          data_vencimento: dataVencimento,
          prioridade
        });
      } else {
        await apiService.createTask({
          ...payload,
          lead_id: selectedClientId || undefined
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar tarefa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (taskId: string | number) => {
    try {
      await apiService.completeTask(taskId);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Erro ao concluir tarefa.');
    }
  };

  // Filtragem de clientes e leads para seleção no formulário
  const filteredClientsSearch = clientsAndLeads.filter(c => 
    c.nome.toLowerCase().includes(selectedClientSearch.toLowerCase()) ||
    c.telefone.includes(selectedClientSearch)
  );

  // Filtragem principal de tarefas conforme RBAC e Filtros
  const accessibleTasks = tasks.filter(t => {
    if (!isAdmin) {
      // Vendedor só vê tarefas atribuídas a ele
      if (t.user_id && t.user_id !== currentUser?.id) return false;
    }

    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.prioridade !== priorityFilter) return false;
    if (typeFilter !== 'ALL' && t.tipo !== typeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.titulo?.toLowerCase().includes(q);
      const matchDesc = t.descricao?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#022859] text-white rounded-2xl p-5 shadow-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#F2B807]" />
            {isAdmin ? 'Gerenciamento de Todas as Tarefas' : 'Minhas Tarefas e Prazos'}
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            {isAdmin ? 'Visão administrativa completa de tarefas, prazos e distribuição de equipe.' : 'Organização operacional dos seus compromissos e atendimento.'}
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#034AA6] hover:bg-[#022859] border border-[#F2B807]/50 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-[#F2B807]" />
          <span>+ Nova Tarefa</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Pesquisar</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F2F2F2] border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#022859] outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#F2F2F2] border border-slate-200 rounded-xl py-2 px-3 text-xs text-[#022859] outline-none font-bold cursor-pointer"
            >
              <option value="ALL">Todos os Status</option>
              <option value="Pendente">Pendentes</option>
              <option value="Concluída">Concluídas</option>
              <option value="Cancelada">Canceladas</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Prioridade</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-[#F2F2F2] border border-slate-200 rounded-xl py-2 px-3 text-xs text-[#022859] outline-none font-bold cursor-pointer"
            >
              <option value="ALL">Todas Prioridades</option>
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Tipo</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-[#F2F2F2] border border-slate-200 rounded-xl py-2 px-3 text-xs text-[#022859] outline-none font-bold cursor-pointer"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="Atendimento">Atendimento</option>
              <option value="Ligação">Ligação</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Documentação">Documentação</option>
              <option value="Financeiro">Financeiro</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span className="font-mono font-bold text-[#034AA6]">{accessibleTasks.length} tarefa(s) encontrada(s)</span>
          {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || typeFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => { setStatusFilter('ALL'); setPriorityFilter('ALL'); setTypeFilter('ALL'); setSearchQuery(''); }}
              className="text-[#034AA6] font-bold hover:underline cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-mono text-[10px] uppercase border-b border-slate-200">
                <th className="border-b p-3 text-left">Título / Descrição</th>
                <th className="border-b p-3 text-left">Cliente / Lead</th>
                <th className="border-b p-3 text-left">Responsável</th>
                <th className="border-b p-3 text-left">Tipo</th>
                <th className="border-b p-3 text-left">Prioridade</th>
                <th className="border-b p-3 text-left">Status</th>
                <th className="border-b p-3 text-left">Vencimento</th>
                <th className="border-b p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accessibleTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600 text-sm">Nenhuma tarefa encontrada.</p>
                    <p className="text-xs text-slate-400 mt-1">Crie sua primeira tarefa operacional para organizar seu atendimento.</p>
                    <button
                      onClick={handleOpenCreate}
                      className="mt-4 px-4 py-2 bg-[#034AA6] text-white font-bold text-xs rounded-xl shadow hover:bg-[#022859] transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Criar Primeira Tarefa</span>
                    </button>
                  </td>
                </tr>
              ) : (
                accessibleTasks.map(t => {
                  const assignedUser = usersList.find(u => String(u.id) === String(t.user_id));
                  const linkedClient = clientsAndLeads.find(c => String(c.id) === String(t.cliente_id || t.lead_id));
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="border-b p-3">
                        <p className="font-extrabold text-[#022859]">{t.titulo}</p>
                        {t.descricao && <p className="text-[11px] text-slate-500 mt-0.5">{t.descricao}</p>}
                      </td>
                      <td className="border-b p-3">
                        {linkedClient ? (
                          <div>
                            <p className="font-bold text-slate-700">{linkedClient.nome}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{linkedClient.telefone || 'Sem tel'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Tarefa Interna</span>
                        )}
                      </td>
                      <td className="border-b p-3 font-medium text-slate-700">
                        {assignedUser ? assignedUser.name : (t.user_id || 'Não atribuído')}
                      </td>
                      <td className="border-b p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">
                          {t.tipo || 'Atendimento'}
                        </span>
                      </td>
                      <td className="border-b p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.prioridade === 'Urgente'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : t.prioridade === 'Alta'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>
                          {t.prioridade || 'Normal'}
                        </span>
                      </td>
                      <td className="border-b p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'Concluída'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : t.status === 'Cancelada'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-blue-50 text-[#034AA6] border border-blue-200'
                        }`}>
                          {t.status || 'Pendente'}
                        </span>
                      </td>
                      <td className="border-b p-3 font-mono text-slate-600">
                        {t.data_vencimento ? new Date(t.data_vencimento).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="border-b p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status !== 'Concluída' && (
                            <button
                              onClick={() => handleComplete(t.id)}
                              title="Concluir Tarefa"
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(t)}
                            title="Editar Tarefa"
                            className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
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

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="text-base font-bold text-white">
                {editingTask ? 'Editar Tarefa' : 'Nova Tarefa Operacional'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Título da Tarefa *</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Retornar ligação para cliente"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-[#034AA6] rounded-xl p-2.5 text-white placeholder-slate-500 outline-none"
                />
              </div>

              {/* Cliente / Lead Search Selection */}
              <div className="relative">
                <label className="block font-semibold text-slate-300 mb-1">Cliente / Lead Vinculado (Opcional)</label>
                {selectedClientId ? (
                  <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#F2B807]" />
                      <span className="font-bold">{selectedClientName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedClientId(null); setSelectedClientName(null); setSelectedClientSearch(''); }}
                      className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar cliente ou lead por nome ou telefone..."
                        value={selectedClientSearch}
                        onChange={(e) => {
                          setSelectedClientSearch(e.target.value);
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-[#034AA6] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                    {showClientDropdown && selectedClientSearch.trim().length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-800/60">
                        {filteredClientsSearch.length === 0 ? (
                          <div className="p-3 text-slate-400 text-center">Nenhum cliente ou lead encontrado.</div>
                        ) : (
                          filteredClientsSearch.map(c => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setSelectedClientId(c.id);
                                setSelectedClientName(c.nome);
                                setSelectedClientSearch(c.nome);
                                setShowClientDropdown(false);
                              }}
                              className="p-2.5 hover:bg-slate-900 cursor-pointer flex items-center justify-between text-white"
                            >
                              <span className="font-bold">{c.nome}</span>
                              <span className="text-[11px] text-slate-400 font-mono">{c.telefone} ({c.type})</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Responsável (Admin only) */}
              {isAdmin && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Responsável pela Tarefa</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-[#034AA6] rounded-xl p-2.5 text-white outline-none cursor-pointer font-medium"
                  >
                    {usersList.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tipo de Tarefa</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-[#034AA6] rounded-xl p-2.5 text-white outline-none cursor-pointer"
                  >
                    <option value="Atendimento">Atendimento</option>
                    <option value="Ligação">Ligação</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Documentação">Documentação</option>
                    <option value="Financeiro">Financeiro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Prioridade</label>
                  <select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-[#034AA6] rounded-xl p-2.5 text-white outline-none cursor-pointer"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Data e Hora de Vencimento *</label>
                <input
                  type="datetime-local"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-[#034AA6] rounded-xl p-2.5 text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Descrição / Detalhes</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  placeholder="Informações adicionais da tarefa..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-[#034AA6] rounded-xl p-2.5 text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#034AA6] hover:bg-[#022859] text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
