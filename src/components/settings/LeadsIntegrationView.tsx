import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { GoogleSheetsConfig, LeadSyncResult, Lead } from '../../types/crm';
import { formatDate } from '../../utils/formatters';
import {
  RefreshCw,
  Database,
  Sliders,
  Users,
  Check,
  AlertTriangle,
  Play,
  CheckSquare,
  Square,
  ShieldCheck,
  Save,
  Clock,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export const LeadsIntegrationView: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Config & Result States
  const [config, setConfig] = useState<GoogleSheetsConfig>({
    spreadsheet_id: '',
    sheet_name: '',
    col_id: '',
    col_name: '',
    col_phone: '',
    col_email: '',
    col_city: '',
    col_product: '',
    col_campaign: '',
    col_ad: ''
  });
  
  const [syncResult, setSyncResult] = useState<LeadSyncResult>({
    last_sync: null,
    next_sync: null,
    connection_status: 'DISCONNECTED',
    leads_imported_today: 0,
    leads_waiting_distribution: 0,
    duplicate_leads: 0,
    sync_errors: 0
  });

  // UI States
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [syncSummary, setSyncSummary] = useState<{
    found: number;
    newLeads: number;
    duplicates: number;
    updated: number;
    errors: number;
  } | null>(null);
  
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Queue State
  const [waitingLeads, setWaitingLeads] = useState<Lead[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [targetSellerId, setTargetSellerId] = useState('');
  const [isDistributing, setIsDistributing] = useState(false);

  // Load configuration and data
  const loadData = () => {
    const currentConfig = apiService.getGoogleSheetsConfig();
    const currentResult = apiService.getLeadSyncResult();
    setConfig(currentConfig);
    setSyncResult(currentResult);
    
    // Get leads awaiting distribution
    const allLeads = apiService.getLeads(currentUser);
    const unassigned = allLeads.filter(
      (l) => (l.vendedor_id === '' || l.vendedor_id === 'unassigned') && l.status === 'Novo'
    );
    setWaitingLeads(unassigned);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const activeSellers = apiService.getUsers().filter(
    (u) => u.role === 'Vendedor' && u.status === 'Ativo'
  );

  // Handle Save Configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setFeedbackMsg(null);
    try {
      await apiService.saveGoogleSheetsConfig(config, currentUser);
      setFeedbackMsg({ type: 'success', text: 'Configurações de integração salvas com sucesso!' });
      loadData();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erro ao salvar configurações.' });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Handle Trigger Synchronization
  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncSummary(null);
    setFeedbackMsg(null);
    try {
      const summary = await apiService.syncLeadsNow(currentUser);
      setSyncSummary(summary);
      loadData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Falha ao sincronizar leads.' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Selection
  const handleToggleSelectLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((item) => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedLeadIds.length === waitingLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(waitingLeads.map((l) => l.id));
    }
  };

  // Handle Distribute Selected Leads
  const handleDistributeLeads = async () => {
    if (selectedLeadIds.length === 0) {
      alert('Selecione pelo menos um lead para distribuir.');
      return;
    }
    if (!targetSellerId) {
      alert('Selecione o vendedor de destino.');
      return;
    }

    setIsDistributing(true);
    try {
      await apiService.distributeLeadsFila(selectedLeadIds, targetSellerId, currentUser);
      alert(`${selectedLeadIds.length} lead(s) distribuído(s) com sucesso para o vendedor selecionado!`);
      setSelectedLeadIds([]);
      setTargetSellerId('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao distribuir leads.');
    } finally {
      setIsDistributing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stats and Status Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Status Connection Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status da Conexão</span>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-3 h-3 rounded-full animate-pulse ${syncResult.connection_status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="text-base font-extrabold text-[#022859]">
                {syncResult.connection_status === 'CONNECTED' ? '🟢 Conectado' : '🔴 Não conectado'}
              </span>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-3 text-[11px] text-slate-500 space-y-1 font-medium">
            <div className="flex justify-between">
              <span>Última Sincronização:</span>
              <span className="font-mono text-[#034AA6] font-bold">
                {syncResult.last_sync ? formatDate(syncResult.last_sync) : 'Nunca'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Próxima Sincronização:</span>
              <span className="font-mono text-emerald-600 font-bold">
                {syncResult.next_sync ? formatDate(syncResult.next_sync) : 'Agendada (5m)'}
              </span>
            </div>
          </div>
        </div>

        {/* Leads waiting distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aguardando Distribuição</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#F28907]">{syncResult.leads_waiting_distribution}</span>
              <span className="text-xs font-semibold text-slate-500">leads na fila</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Novos registros importados prontos para distribuição.</p>
        </div>

        {/* Leads imported today */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Leads Importados Hoje</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#034AA6]">{syncResult.leads_imported_today}</span>
              <span className="text-xs font-semibold text-slate-500">cadastros</span>
            </div>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-3 mt-3 text-[11px] text-slate-500">
            <span>Duplicados identificados:</span>
            <span className="font-bold text-amber-500 font-mono">{syncResult.duplicate_leads}</span>
          </div>
        </div>

        {/* Sync Errors */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Erros de Sincronização</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-black ${syncResult.sync_errors > 0 ? 'text-rose-500' : 'text-slate-700'}`}>
                {syncResult.sync_errors}
              </span>
              <span className="text-xs font-semibold text-slate-500">ocorrências</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Registros ignorados por falta de nome ou telefone obrigatório.</p>
        </div>
      </div>

      {/* Synchronize Action Block */}
      <div className="bg-gradient-to-r from-[#022859] to-[#034AA6] border border-[#034AA6]/50 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F2B807]" />
            <h3 className="text-base font-extrabold">Sincronização Manual com Google Sheets</h3>
          </div>
          <p className="text-xs text-blue-100 max-w-xl">
            Clique para forçar uma varredura imediata na planilha configurada. O sistema irá buscar novas linhas,
            validar os dados cadastrais obrigatórios e deduplicar os registros automaticamente.
          </p>
        </div>

        <button
          onClick={handleSyncNow}
          disabled={isSyncing || !config.spreadsheet_id}
          className="px-6 py-3 bg-[#F2B807] hover:bg-[#e0a805] text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-yellow-500/10 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}</span>
        </button>
      </div>

      {/* Sync Success Summary Card */}
      {syncSummary && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-emerald-800">
            <ShieldCheck className="w-5 h-5" />
            <h4 className="text-sm font-bold">Sincronização concluída com sucesso!</h4>
          </div>
          <p className="text-xs text-emerald-700">
            A varredura foi finalizada de acordo com as regras de normalização e deduplicação do Cred Sempre +.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="bg-white border border-emerald-100 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Encontrados</span>
              <span className="text-base font-black text-[#022859] font-mono">{syncSummary.found}</span>
            </div>
            <div className="bg-white border border-emerald-100 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Novos Leads</span>
              <span className="text-base font-black text-emerald-600 font-mono">{syncSummary.newLeads}</span>
            </div>
            <div className="bg-white border border-emerald-100 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Duplicados</span>
              <span className="text-base font-black text-amber-500 font-mono">{syncSummary.duplicates}</span>
            </div>
            <div className="bg-white border border-emerald-100 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Atualizados</span>
              <span className="text-base font-black text-blue-600 font-mono">{syncSummary.updated}</span>
            </div>
            <div className="bg-white border border-emerald-100 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Erros (Ignorados)</span>
              <span className="text-base font-black text-rose-500 font-mono">{syncSummary.errors}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Configurations & Queue Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Mapping Configuration Form */}
        <div className="xl:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-[#034AA6]" />
            <h3 className="text-sm font-bold text-[#022859]">Configuração do Mapeamento</h3>
          </div>

          {feedbackMsg && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${feedbackMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
              {feedbackMsg.type === 'success' ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Spreadsheet ID ou URL da Planilha *</label>
              <input
                type="text"
                value={config.spreadsheet_id}
                onChange={(e) => setConfig({ ...config, spreadsheet_id: e.target.value })}
                placeholder="Ex: 1tYg9bU0f4vR79GzU3g6m8D9hH4B-..."
                required
                className="w-full bg-[#F2F2F2] border border-slate-200 focus:border-[#034AA6] rounded-xl p-2.5 text-[#022859] placeholder-slate-400 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Nome da Aba (Tab Name) *</label>
              <input
                type="text"
                value={config.sheet_name}
                onChange={(e) => setConfig({ ...config, sheet_name: e.target.value })}
                placeholder="Ex: Respostas do Formulário 1"
                required
                className="w-full bg-[#F2F2F2] border border-slate-200 focus:border-[#034AA6] rounded-xl p-2.5 text-[#022859] placeholder-slate-400 outline-none"
              />
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Mapeamento de Colunas</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-500 mb-0.5">Coluna de ID (Meta)</label>
                  <input
                    type="text"
                    value={config.col_id}
                    onChange={(e) => setConfig({ ...config, col_id: e.target.value })}
                    placeholder="id"
                    className="w-full bg-white border border-slate-200 focus:border-[#034AA6] rounded-xl p-2 text-[#022859] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 mb-0.5">Coluna de Nome *</label>
                  <input
                    type="text"
                    value={config.col_name}
                    onChange={(e) => setConfig({ ...config, col_name: e.target.value })}
                    placeholder="nome_completo"
                    required
                    className="w-full bg-white border border-slate-200 focus:border-[#034AA6] rounded-xl p-2 text-[#022859] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-500 mb-0.5">Coluna de Telefone *</label>
                  <input
                    type="text"
                    value={config.col_phone}
                    onChange={(e) => setConfig({ ...config, col_phone: e.target.value })}
                    placeholder="telefone"
                    required
                    className="w-full bg-white border border-slate-200 focus:border-[#034AA6] rounded-xl p-2 text-[#022859] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 mb-0.5">Coluna de E-mail</label>
                  <input
                    type="text"
                    value={config.col_email}
                    onChange={(e) => setConfig({ ...config, col_email: e.target.value })}
                    placeholder="email"
                    className="w-full bg-white border border-slate-200 focus:border-[#034AA6] rounded-xl p-2 text-[#022859] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-500 mb-0.5">Coluna de Cidade</label>
                  <input
                    type="text"
                    value={config.col_city}
                    onChange={(e) => setConfig({ ...config, col_city: e.target.value })}
                    placeholder="cidade"
                    className="w-full bg-white border border-slate-200 focus:border-[#034AA6] rounded-xl p-2 text-[#022859] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 mb-0.5">Coluna de Produto/Interesse</label>
                  <input
                    type="text"
                    value={config.col_product}
                    onChange={(e) => setConfig({ ...config, col_product: e.target.value })}
                    placeholder="tipo_de_supletivo"
                    className="w-full bg-white border border-slate-200 focus:border-[#034AA6] rounded-xl p-2 text-[#022859] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-500 mb-0.5">Coluna de Campanha</label>
                  <input
                    type="text"
                    value={config.col_campaign}
                    onChange={(e) => setConfig({ ...config, col_campaign: e.target.value })}
                    placeholder="campaign_name"
                    className="w-full bg-white border border-slate-200 focus:border-[#034AA6] rounded-xl p-2 text-[#022859] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 mb-0.5">Coluna de Anúncio</label>
                  <input
                    type="text"
                    value={config.col_ad}
                    onChange={(e) => setConfig({ ...config, col_ad: e.target.value })}
                    placeholder="ad_name"
                    className="w-full bg-white border border-slate-200 focus:border-[#034AA6] rounded-xl p-2 text-[#022859] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Shield Credentials Notification */}
            <div className="bg-[#022859]/5 border border-[#034AA6]/20 rounded-xl p-3.5 flex items-start gap-2.5 text-slate-600 leading-relaxed text-[11px]">
              <ShieldCheck className="w-4 h-4 text-[#034AA6] shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-[#022859] block">Segurança de Credenciais Garantida</span>
                As credenciais do Google API (Client ID, Access e Refresh Tokens) permanecem protegidas no backend
                servidor. O frontend se conecta exclusivamente de forma segura.
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingConfig}
              className="w-full py-2.5 bg-[#034AA6] hover:bg-[#022859] border border-[#F2B807]/30 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingConfig ? 'Salvando...' : 'Salvar Mapeamento'}</span>
            </button>
          </form>
        </div>

        {/* Fila de Novos Leads (Aguardando Distribuição) */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F28907]" />
                <div>
                  <h3 className="text-sm font-bold text-[#022859]">📥 Leads Aguardando Distribuição</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Leads importados sem vendedor atribuído.</p>
                </div>
              </div>

              {/* Distribute actions panel */}
              {selectedLeadIds.length > 0 && (
                <div className="flex items-center gap-1.5 bg-[#F28907]/10 border border-[#F28907]/30 p-1.5 rounded-xl text-xs">
                  <span className="px-2 font-bold text-[#F28907]">{selectedLeadIds.length} sel.</span>
                  <select
                    value={targetSellerId}
                    onChange={(e) => setTargetSellerId(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-[11px] outline-none cursor-pointer text-[#022859] font-semibold"
                  >
                    <option value="">Destinar para Vendedor...</option>
                    {activeSellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleDistributeLeads}
                    disabled={isDistributing || !targetSellerId}
                    className="bg-[#034AA6] hover:bg-[#022859] text-white font-bold py-1 px-3 rounded-lg text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isDistributing ? 'Enviando...' : 'Distribuir'}
                  </button>
                </div>
              )}
            </div>

            {/* Leads Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#022859]/5 text-[#022859] font-mono text-[9px] uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-2.5 w-8">
                      <button
                        onClick={handleToggleSelectAll}
                        disabled={waitingLeads.length === 0}
                        className="text-slate-400 hover:text-[#034AA6] transition-colors cursor-pointer"
                      >
                        {selectedLeadIds.length === waitingLeads.length && waitingLeads.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-[#034AA6]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-3 py-2.5">Nome / Telefone</th>
                    <th className="px-3 py-2.5">Cidade</th>
                    <th className="px-3 py-2.5">Origem / Campanha</th>
                    <th className="px-3 py-2.5">Anúncio</th>
                    <th className="px-3 py-2.5">Interesse / Produto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitingLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-[#022859]">Fila de distribuição vazia!</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Novos leads importados via Google Sheets aparecerão aqui para distribuição.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    waitingLeads.map((lead) => {
                      const isSelected = selectedLeadIds.includes(lead.id);
                      return (
                        <tr
                          key={lead.id}
                          className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}
                        >
                          <td className="px-3 py-3">
                            <button
                              onClick={() => handleToggleSelectLead(lead.id)}
                              className="text-slate-400 hover:text-[#034AA6] transition-colors cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#034AA6]" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-3">
                            <div>
                              <p className="font-bold text-[#022859]">{lead.nome}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{lead.telefone}</p>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-semibold text-slate-600">{lead.cidade || 'Não informada'}</td>
                          <td className="px-3 py-3">
                            <div className="space-y-0.5">
                              <span className="inline-block px-1.5 py-0.2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-bold rounded">
                                {lead.origem}
                              </span>
                              <p className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]" title={lead.campanha}>
                                {lead.campanha || '-'}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-500 truncate max-w-[100px]" title={lead.anuncio}>
                            {lead.anuncio || '-'}
                          </td>
                          <td className="px-3 py-3 font-bold text-[#034AA6] truncate max-w-[140px]" title={lead.produto_interesse}>
                            {lead.produto_interesse}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {waitingLeads.length > 0 && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Mostrando {waitingLeads.length} lead(s) na fila aguardando vendedor.</span>
              <span>Selecione leads e use a barra de distribuição superior para lotes.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
