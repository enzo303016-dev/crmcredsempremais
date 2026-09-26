import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Save, 
  Building2, 
  Search,
  Check,
  Edit2,
  ListFilter
} from 'lucide-react';

export const AgendaView: React.FC<{ onOpenCreateTask?: () => void }> = ({ onOpenCreateTask }) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'Administrador';

  const [tasks, setTasks] = useState<any[]>([]);
  const [clientsAndLeads, setClientsAndLeads] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // View mode: 'day' | 'week' | 'month'
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Filters
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [onlyVencidas, setOnlyVencidas] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Task creation/editing (reusing TasksView logic)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
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
      console.error('Erro ao carregar dados da agenda:', e);
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
    setSelectedClientName(found ? found.nome : (task.cliente_nome || null));
    setSelectedClientSearch(found ? found.nome : '');

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
        lead_id: selectedClientId || undefined,
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

  // Date Navigation Helpers
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
    else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
    else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calculations for Today Resumo
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 23, 59, 59);

  const myTasksBase = tasks.filter(t => {
    if (!isAdmin && t.user_id && t.user_id !== currentUser?.id) return false;
    return true;
  });

  const todayTasks = myTasksBase.filter(t => {
    if (!t.data_vencimento) return false;
    const d = new Date(t.data_vencimento);
    return d >= todayStart && d <= todayEnd;
  });

  const totalToday = todayTasks.length;
  const pendentesToday = todayTasks.filter(t => t.status === 'Pendente').length;
  const concluidasToday = todayTasks.filter(t => t.status === 'Concluída').length;
  const vencidasCount = myTasksBase.filter(t => t.status === 'Pendente' && new Date(t.data_vencimento) < now).length;
  const urgentesCount = myTasksBase.filter(t => t.status === 'Pendente' && t.prioridade === 'Urgente').length;

  // Filter tasks for Agenda View
  const filteredTasks = tasks.filter(t => {
    if (!isAdmin) {
      if (t.user_id && t.user_id !== currentUser?.id) return false;
    } else {
      if (selectedUserFilter !== 'ALL' && t.user_id !== selectedUserFilter) return false;
    }

    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.prioridade !== priorityFilter) return false;
    if (typeFilter !== 'ALL' && t.tipo !== typeFilter) return false;
    if (onlyVencidas && !(t.status === 'Pendente' && new Date(t.data_vencimento) < now)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.titulo?.toLowerCase().includes(q);
      const matchDesc = t.descricao?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  // Next upcoming tasks (sorted)
  const upcomingTasks = [...myTasksBase]
    .filter(t => t.status === 'Pendente' && new Date(t.data_vencimento) >= now)
    .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
    .slice(0, 5);

  // Week days calculation
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    start.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(start);
      nextDay.setDate(start.getDate() + i);
      days.push(nextDay);
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);

  // Month days calculation
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Previous month filler
    for (let i = firstDayIndex; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    // Current month days
    for (let i = 1; i <= lastDay; i++) {
      const currDate = new Date(year, month, i);
      days.push({ date: currDate, isCurrentMonth: true });
    }
    return days;
  };

  const monthDays = getMonthDays(currentDate);

  const filteredClientsSearch = clientsAndLeads.filter(c => 
    c.nome.toLowerCase().includes(selectedClientSearch.toLowerCase()) ||
    c.telefone.includes(selectedClientSearch)
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#022859] text-white rounded-2xl p-5 shadow-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#F2B807]" />
            Agenda Operacional
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Visualização calendarizada e acompanhamento operacional de tarefas e compromissos.
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

      {/* Resumo de Hoje e Próximas Tarefas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Hoje Resumo */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Resumo de Hoje</h3>
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-[#034AA6] px-2 py-0.5 rounded-full border border-blue-200">
                {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-xl font-extrabold text-[#022859] block">{totalToday}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tarefas Hoje</span>
              </div>
              <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3 text-center">
                <span className="text-xl font-extrabold text-[#034AA6] block">{pendentesToday}</span>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Pendentes</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <span className="text-xl font-extrabold text-emerald-600 block">{concluidasToday}</span>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Concluídas</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                <span className="text-xl font-extrabold text-rose-600 block">{vencidasCount}</span>
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Vencidas</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Urgentes abertas:</span>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded-full text-[10px]">
              {urgentesCount} tarefa(s)
            </span>
          </div>
        </div>

        {/* Card Próximas Tarefas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#034AA6]" />
                Próximas Tarefas Pendentes
              </h3>
              <span className="text-xs font-mono text-slate-400 font-bold">{upcomingTasks.length} na fila</span>
            </div>
            <div className="mt-3 space-y-2.5">
              {upcomingTasks.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">Nenhuma tarefa futura pendente.</div>
              ) : (
                upcomingTasks.map(t => {
                  const linkedClient = clientsAndLeads.find(c => String(c.id) === String(t.cliente_id || t.lead_id));
                  const isVencida = new Date(t.data_vencimento) < now;
                  return (
                    <div key={t.id} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold font-mono shrink-0 ${
                          isVencida ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-[#034AA6]'
                        }`}>
                          {t.data_vencimento ? new Date(t.data_vencimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-[#022859] truncate">{t.titulo}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {linkedClient ? linkedClient.nome : 'Tarefa Interna'} • <span className="font-semibold text-slate-700">{t.tipo}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.prioridade === 'Urgente' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {t.prioridade}
                        </span>
                        <button
                          onClick={() => handleComplete(t.id)}
                          title="Concluir"
                          className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls & View Selectors */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Date Navigator */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 bg-[#034AA6] text-white font-bold text-xs rounded-xl shadow hover:bg-[#022859] transition-all cursor-pointer"
            >
              Hoje
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Próximo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="font-extrabold text-sm text-[#022859]">
              {viewMode === 'day' && currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              {viewMode === 'week' && `Semana de ${weekDays[0].toLocaleDateString('pt-BR')} a ${weekDays[6].toLocaleDateString('pt-BR')}`}
              {viewMode === 'month' && currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-[#F2F2F2] p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'day' ? 'bg-[#034AA6] text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'week' ? 'bg-[#034AA6] text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'month' ? 'bg-[#034AA6] text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mês
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Pesquisar</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F2F2F2] border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#022859] outline-none font-medium"
              />
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Responsável</label>
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="w-full bg-[#F2F2F2] border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-[#022859] outline-none font-bold cursor-pointer"
              >
                <option value="ALL">Todos os Responsáveis</option>
                {usersList.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#F2F2F2] border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-[#022859] outline-none font-bold cursor-pointer"
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
              className="w-full bg-[#F2F2F2] border border-slate-200 rounded-xl py-1.5 px-3 text-xs text-[#022859] outline-none font-bold cursor-pointer"
            >
              <option value="ALL">Todas Prioridades</option>
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={onlyVencidas}
                onChange={(e) => setOnlyVencidas(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#034AA6] focus:ring-[#034AA6]"
              />
              <span className="text-xs font-bold text-rose-600">Somente Vencidas</span>
            </label>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* VISÃO DIÁRIA */}
      {/* ====================================================== */}
      {viewMode === 'day' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-[#022859] uppercase tracking-wide">
              {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </h2>
          </div>

          <div className="space-y-3">
            {(() => {
              const dayTasks = filteredTasks.filter(t => {
                if (!t.data_vencimento) return false;
                const d = new Date(t.data_vencimento);
                return d.getDate() === currentDate.getDate() &&
                       d.getMonth() === currentDate.getMonth() &&
                       d.getFullYear() === currentDate.getFullYear();
              }).sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());

              if (dayTasks.length === 0) {
                return <div className="py-12 text-center text-slate-400 text-xs">Nenhuma tarefa agendada para este dia.</div>;
              }

              return dayTasks.map(t => {
                const linkedClient = clientsAndLeads.find(c => String(c.id) === String(t.cliente_id || t.lead_id));
                const assignedUser = usersList.find(u => String(u.id) === String(t.user_id));
                const isVencida = t.status === 'Pendente' && new Date(t.data_vencimento) < now;

                return (
                  <div key={t.id} className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isVencida ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="px-3 py-2 bg-[#022859] text-white font-mono font-bold rounded-xl text-xs shrink-0 shadow">
                        {new Date(t.data_vencimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-[#022859]">{t.titulo}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                            {t.tipo}
                          </span>
                          {isVencida && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                              VENCIDA
                            </span>
                          )}
                        </div>
                        {t.descricao && <p className="text-xs text-slate-600 mt-1">{t.descricao}</p>}
                        <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                          <span>👤 Cliente: <strong className="text-slate-700">{linkedClient ? linkedClient.nome : 'Tarefa Interna'}</strong></span>
                          <span>📌 Responsável: <strong className="text-slate-700">{assignedUser ? assignedUser.name : 'Atribuído'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        t.status === 'Concluída' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-50 text-[#034AA6] border border-blue-200'
                      }`}>
                        {t.status}
                      </span>
                      {t.status !== 'Concluída' && (
                        <button
                          onClick={() => handleComplete(t.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Concluir</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* VISÃO SEMANAL */}
      {/* ====================================================== */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day, idx) => {
            const isToday = day.getDate() === now.getDate() && day.getMonth() === now.getMonth() && day.getFullYear() === now.getFullYear();
            const dayTasks = filteredTasks.filter(t => {
              if (!t.data_vencimento) return false;
              const d = new Date(t.data_vencimento);
              return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
            }).sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());

            return (
              <div key={idx} className={`bg-white border rounded-2xl p-3 shadow-sm flex flex-col ${isToday ? 'border-[#034AA6] ring-2 ring-[#034AA6]/20' : 'border-slate-200'}`}>
                <div className={`p-2 rounded-xl text-center mb-3 ${isToday ? 'bg-[#034AA6] text-white font-bold' : 'bg-slate-50 text-slate-700'}`}>
                  <span className="text-[10px] uppercase font-mono block">
                    {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </span>
                  <span className="text-sm font-extrabold">
                    {day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto max-h-[450px]">
                  {dayTasks.length === 0 ? (
                    <div className="py-8 text-center text-slate-300 text-[11px]">Sem tarefas</div>
                  ) : (
                    dayTasks.map(t => {
                      const isVencida = t.status === 'Pendente' && new Date(t.data_vencimento) < now;
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleOpenEdit(t)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-md ${
                            isVencida ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 hover:bg-blue-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-bold text-[10px] text-[#034AA6]">
                              {new Date(t.data_vencimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              t.prioridade === 'Urgente' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {t.prioridade}
                            </span>
                          </div>
                          <p className="font-extrabold text-[#022859] truncate text-[11px]">{t.titulo}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{t.tipo}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ====================================================== */}
      {/* VISÃO MENSAL */}
      {/* ====================================================== */}
      {viewMode === 'month' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center font-mono text-[11px] uppercase font-bold text-slate-500">
            <div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div><div>Dom</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((item, idx) => {
              const isToday = item.date.getDate() === now.getDate() && item.date.getMonth() === now.getMonth() && item.date.getFullYear() === now.getFullYear();
              const dayTasks = filteredTasks.filter(t => {
                if (!t.data_vencimento) return false;
                const d = new Date(t.data_vencimento);
                return d.getDate() === item.date.getDate() && d.getMonth() === item.date.getMonth() && d.getFullYear() === item.date.getFullYear();
              });

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] border rounded-xl p-2 flex flex-col justify-between transition-all ${
                    !item.isCurrentMonth ? 'bg-slate-50/50 text-slate-400 border-slate-100' : 'bg-white border-slate-200'
                  } ${isToday ? 'ring-2 ring-[#034AA6] border-transparent font-bold' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-extrabold ${isToday ? 'bg-[#034AA6] text-white px-1.5 py-0.5 rounded' : 'text-slate-700'}`}>
                      {item.date.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-mono bg-blue-100 text-[#034AA6] px-1.5 py-0.2 rounded-full font-bold">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-y-auto max-h-[70px]">
                    {dayTasks.slice(0, 2).map(t => (
                      <div
                        key={t.id}
                        onClick={() => handleOpenEdit(t)}
                        className="p-1 bg-[#022859]/5 hover:bg-[#034AA6]/20 rounded text-[10px] truncate font-medium text-[#022859] cursor-pointer"
                        title={t.titulo}
                      >
                        {t.titulo}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <span className="text-[9px] text-slate-400 block text-center font-bold">
                        +{dayTasks.length - 2} mais
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Criar/Editar (Reutilizado idêntico ao TasksView) */}
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
