import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  WhatsAppNumber,
  WhatsAppIntegration,
  WhatsAppAttendant,
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppTransfer,
  WhatsAppInternalNote,
  WhatsAppQuickReply,
  User,
} from '../../types/crm';
import { formatDate } from '../../utils/formatters';
import {
  MessageSquare,
  Send,
  UserPlus,
  RefreshCw,
  Phone,
  UserCheck,
  CheckCircle,
  HelpCircle,
  FileText,
  Sliders,
  Database,
  PlusCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag,
  Clock,
  ExternalLink,
  MessageCircle,
  Search,
  Save,
} from 'lucide-react';

export const WhatsAppInboxView: React.FC = () => {
  const { currentUser, hasPermission, refreshUser } = useAuth();

  // Tab State: 'inbox' | 'numbers' | 'attendants' | 'quick_replies' | 'integration'
  const [activeTab, setActiveTab] = useState<'inbox' | 'numbers' | 'attendants' | 'quick_replies' | 'integration'>('inbox');

  // WhatsApp Lists from Service
  const [numbers, setNumbers] = useState<WhatsAppNumber[]>([]);
  const [integrations, setIntegrations] = useState<WhatsAppIntegration[]>([]);
  const [attendants, setAttendants] = useState<WhatsAppAttendant[]>([]);
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [quickReplies, setQuickReplies] = useState<WhatsAppQuickReply[]>([]);

  // Selection state
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [notes, setNotes] = useState<WhatsAppInternalNote[]>([]);
  const [transfers, setTransfers] = useState<WhatsAppTransfer[]>([]);

  // Inbox UI Filter
  const [statusFilter, setStatusFilter] = useState<WhatsAppConversation['status'] | 'ALL'>('Em atendimento');
  const [searchQuery, setSearchTerm] = useState('');

  // Modals / Panels States
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const [showNewNumberModal, setShowNumberModal] = useState(false);
  const [showNewReplyModal, setShowReplyModal] = useState(false);

  // New item inputs
  const [newNumNome, setNewNumNome] = useState('');
  const [newNumFone, setNewNumPhone] = useState('');
  const [newNumObs, setNewNumObs] = useState('');

  const [newQrTitle, setNewQrTitle] = useState('');
  const [newQrMsg, setNewQrMsg] = useState('');
  const [newQrCat, setNewQrCat] = useState('');

  // Configuration inputs
  const [apiBaseUrl, setApiBaseUrl] = useState('https://api.wame.example.com/v1');
  const [accountIdentifier, setAccountIdentifier] = useState('credsempre_corporativo');

  // Messaging Inputs
  const [typedMessage, setTypedMessage] = useState('');
  const [noteText, setNoteText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load all data
  const loadWhatsAppState = async () => {
    try {
      await apiService.fetchWhatsAppState(currentUser);
    } catch (err) {
      console.error('Erro ao buscar estado do WhatsApp:', err);
    }

    const listNums = apiService.getWhatsAppNumbers();
    const listInts = apiService.getWhatsAppIntegrations();
    const listAtts = apiService.getWhatsAppAttendants();
    const listConvs = apiService.getWhatsAppConversations();
    const listReplies = apiService.getWhatsAppQuickReplies();

    setNumbers(listNums);
    setIntegrations(listInts);
    setAttendants(listAtts);
    setConversations(listConvs);
    setQuickReplies(listReplies);

    if (listInts.length > 0) {
      setApiBaseUrl(listInts[0].api_base_url);
      setAccountIdentifier(listInts[0].account_identifier);
    }

    // Refresh selected conversation details
    if (selectedConvId) {
      const conv = listConvs.find((c) => c.id === selectedConvId);
      if (conv) {
        setSelectedConversation(conv);
        try {
          await Promise.all([
            apiService.fetchWhatsAppMessages(selectedConvId, currentUser),
            apiService.fetchWhatsAppTransfers(selectedConvId, currentUser),
            apiService.fetchWhatsAppInternalNotes(selectedConvId, currentUser)
          ]);
        } catch (err) {
          console.error('Erro ao buscar detalhes da conversa:', err);
        }
        setMessages(apiService.getWhatsAppMessages(selectedConvId));
        setNotes(apiService.getWhatsAppInternalNotes(selectedConvId));
        setTransfers(apiService.getWhatsAppTransfers(selectedConvId));
      } else {
        setSelectedConvId(null);
        setSelectedConversation(null);
      }
    }
  };

  useEffect(() => {
    loadWhatsAppState();
  }, [selectedConvId]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Assume Attending
  const handleAssume = async (convId: string) => {
    try {
      await apiService.assumeWhatsAppConversation(convId, currentUser);
      loadWhatsAppState();
    } catch (err: any) {
      alert(err.message || 'Erro ao assumir atendimento.');
    }
  };

  // Handle Transfer Conversa
  const handleTransfer = async () => {
    if (!selectedConvId || !transferTargetId) return;
    try {
      await apiService.transferWhatsAppConversation(
        selectedConvId,
        transferTargetId,
        transferReason.trim() || 'Sem motivo especificado.',
        currentUser
      );
      setShowTransferModal(false);
      setTransferTargetId('');
      setTransferReason('');
      loadWhatsAppState();
    } catch (err: any) {
      alert(err.message || 'Erro ao transferir atendimento.');
    }
  };

  // Handle Change Status
  const handleStatusChange = async (convId: string, status: WhatsAppConversation['status']) => {
    try {
      await apiService.changeWhatsAppConversationStatus(convId, status, currentUser);
      loadWhatsAppState();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status.');
    }
  };

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !typedMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await apiService.sendWhatsAppMessage(selectedConvId, typedMessage.trim(), currentUser);
      setTypedMessage('');
      loadWhatsAppState();
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar mensagem.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle Add Note Interna
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !noteText.trim() || isAddingNote) return;

    setIsAddingNote(true);
    try {
      await apiService.addWhatsAppInternalNote(selectedConvId, noteText.trim(), currentUser);
      setNoteText('');
      loadWhatsAppState();
    } catch (err: any) {
      alert(err.message || 'Erro ao adicionar nota.');
    } finally {
      setIsAddingNote(false);
    }
  };

  // Handle Save Integration Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.saveWhatsAppConfig('WAME', apiBaseUrl, accountIdentifier, currentUser);
      alert('Configuração de integração com WAME salva com sucesso!');
      loadWhatsAppState();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configuração.');
    }
  };

  // Handle Save New Number
  const handleAddNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumNome || !newNumFone) return;

    try {
      await apiService.saveWhatsAppNumberConfig(
        {
          nome: newNumNome,
          telefone: newNumFone.replace(/\D/g, ''),
          provedor: 'WAME',
          status: 'ativo',
          ativo: true,
          observacoes: newNumObs
        },
        currentUser
      );
      setNewNumNome('');
      setNewNumPhone('');
      setNewNumObs('');
      setShowNumberModal(false);
      loadWhatsAppState();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar número.');
    }
  };

  // Handle Save Quick Reply
  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQrTitle || !newQrMsg) return;

    try {
      await apiService.saveWhatsAppQuickReply(
        {
          titulo: newQrTitle,
          mensagem: newQrMsg,
          categoria: newQrCat || 'Comercial',
          ativo: true
        },
        currentUser
      );
      setNewQrTitle('');
      setNewQrMsg('');
      setNewQrCat('');
      setShowReplyModal(false);
      loadWhatsAppState();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar resposta rápida.');
    }
  };

  // Handle Toggle Attendant
  const handleToggleAttendant = async (userId: string, currentStatus: boolean) => {
    try {
      await apiService.saveWhatsAppAttendantConfig(userId, !currentStatus, currentUser);
      loadWhatsAppState();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status do atendente.');
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesQuery =
      c.nome_contato.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.telefone.includes(searchQuery);
    return matchesStatus && matchesQuery;
  });

  const activeSellers = apiService.getUsers().filter(
    (u) => u.status === 'Ativo'
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Row (Breadcrumb Trail + Action) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#022859] border border-[#034AA6]/40 text-white rounded-2xl p-5 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#F2B807]" />
            <h2 className="text-lg font-extrabold text-white">WhatsApp / Multiatendimento</h2>
            <span className="text-xs text-blue-200">·</span>
            <span className="text-xs text-blue-200 font-medium">Fase 7.2 Preparação</span>
          </div>
          <p className="text-xs text-blue-200 mt-1">
            Gestão multiagente de conversas, fila única de atendimento, notas de supervisão e mapeamento de canais Wame.
          </p>
        </div>

        {/* Segmented Tabs Navigation */}
        <div className="flex flex-wrap gap-1 bg-[#011B3D]/80 p-1 rounded-xl border border-[#034AA6]/30">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'inbox' ? 'bg-[#034AA6] text-[#F2B807] shadow-sm' : 'text-blue-100 hover:text-white'}`}
          >
            Caixa de Entrada
          </button>
          <button
            onClick={() => setActiveTab('numbers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'numbers' ? 'bg-[#034AA6] text-[#F2B807] shadow-sm' : 'text-blue-100 hover:text-white'}`}
          >
            Números (Canais)
          </button>
          <button
            onClick={() => setActiveTab('attendants')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'attendants' ? 'bg-[#034AA6] text-[#F2B807] shadow-sm' : 'text-blue-100 hover:text-white'}`}
          >
            Atendentes
          </button>
          <button
            onClick={() => setActiveTab('quick_replies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'quick_replies' ? 'bg-[#034AA6] text-[#F2B807] shadow-sm' : 'text-blue-100 hover:text-white'}`}
          >
            Respostas Rápidas
          </button>
          {hasPermission('configurar_integracao_whatsapp') && (
            <button
              onClick={() => setActiveTab('integration')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'integration' ? 'bg-[#034AA6] text-[#F2B807] shadow-sm' : 'text-blue-100 hover:text-white'}`}
            >
              Conectar Wame
            </button>
          )}
        </div>
      </div>

      {/* 2. TAB CONTENT VIEW */}

      {/* ================================== TAB: INBOX ================================== */}
      {activeTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-270px)] min-h-[580px]">
          {/* COLUMN 1: CONVERSATIONS LIST (4 cols) */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            {/* Search and Filters Header */}
            <div className="p-3.5 border-b border-slate-100 space-y-3 bg-slate-50/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar contato ou celular..."
                  className="w-full bg-white border border-slate-200 focus:border-[#034AA6] rounded-xl py-1.5 pl-8 pr-3 text-xs outline-none text-[#022859] placeholder-slate-400"
                />
              </div>

              {/* Status segmented filters */}
              <div className="flex flex-wrap gap-1">
                {(['Aguardando atendimento', 'Em atendimento', 'Aguardando cliente', 'Resolvido', 'ALL'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#034AA6] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? 'Todos' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredConversations.length === 0 ? (
                <div className="py-12 px-4 text-center text-slate-400">
                  <MessageCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-xs">Nenhum atendimento</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Nesta aba de filtro.</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const num = numbers.find((n) => n.id === conv.whatsapp_number_id);
                  const isSelected = selectedConvId === conv.id;
                  const attendant = activeSellers.find((u) => u.id === conv.current_attendant_id);

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer text-xs space-y-1.5 relative ${
                        isSelected ? 'bg-blue-50/40 border-l-4 border-[#034AA6]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[#022859] truncate max-w-[130px]" title={conv.nome_contato}>
                          {conv.nome_contato}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                        <span className="font-mono text-slate-400">{conv.telefone}</span>
                        <span>·</span>
                        <span className="truncate max-w-[80px] text-[#034AA6] font-semibold">{num ? num.nome : 'Canal'}</span>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate leading-relaxed">
                        {conv.last_message_text || 'Sem mensagens registradas'}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 border rounded-full ${
                            conv.status === 'Aguardando atendimento'
                              ? 'bg-rose-50 border-rose-200 text-rose-600'
                              : conv.status === 'Em atendimento'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                              : conv.status === 'Aguardando cliente'
                              ? 'bg-amber-50 border-amber-200 text-amber-600'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          {conv.status}
                        </span>

                        <span className="text-[10px] font-bold text-slate-500">
                          {attendant ? `👤 ${attendant.name.split(' ')[0]}` : '👤 Sem atendente'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: MESSAGE STREAM & ACTION INPUTS (5 cols) */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            {selectedConversation ? (
              <>
                {/* Chat Panel Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-[#022859]">{selectedConversation.nome_contato}</h4>
                      <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-mono rounded">
                        {selectedConversation.telefone}
                      </span>
                    </div>
                    {/* Canal details */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 font-medium">
                      <span>Canais ativos:</span>
                      <span className="text-[#034AA6] font-bold font-mono">
                        {numbers.find((n) => n.id === selectedConversation.whatsapp_number_id)?.nome || 'Canal Geral'}
                      </span>
                      <span>·</span>
                      <span className="text-emerald-600 font-bold">Número compartilhado</span>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#022859] font-bold text-[10px] rounded-lg cursor-pointer transition-all flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Transferir</span>
                    </button>

                    {selectedConversation.current_attendant_id !== currentUser?.id && (
                      <button
                        onClick={() => handleAssume(selectedConversation.id)}
                        className="px-2.5 py-1.5 bg-[#034AA6] hover:bg-[#022859] text-white font-extrabold text-[10px] rounded-lg cursor-pointer transition-all shadow-sm flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Assumir</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Stream View */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50/60 space-y-4">
                  {messages.length === 0 ? (
                    <div className="py-24 text-center text-slate-400">
                      <p className="font-semibold text-xs">Preparado para integração.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Nenhuma mensagem registrada nesta conversa.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isInbound = msg.direction === 'inbound';
                      const userSender = apiService.getUsers().find((u) => u.id === msg.sender_user_id);

                      return (
                        <div key={msg.id} className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                              isInbound
                                ? 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                : 'bg-[#034AA6] text-white rounded-tr-none'
                            }`}
                          >
                            {/* Sender Info for Outbound */}
                            {!isInbound && (
                              <span className="block text-[9px] font-bold text-blue-200 mb-0.5">
                                {userSender ? userSender.name.split(' ')[0] : 'Consultor'}
                              </span>
                            )}

                            <p className="whitespace-pre-wrap">{msg.message_text}</p>

                            <div className="flex items-center justify-end gap-1.5 mt-1 text-[9px] text-slate-400 select-none">
                              <span className={isInbound ? 'text-slate-400' : 'text-blue-100'}>
                                {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {!isInbound && (
                                <span className="text-blue-200 font-bold uppercase tracking-wider font-mono">
                                  {msg.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Controls Bar (Tabs: Enviar mensagem / Nota interna) */}
                <div className="border-t border-slate-100 bg-white p-3 space-y-3 shrink-0">
                  {/* Select Quick Reply Shortcut if sending message */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Respostas rápidas:</span>
                    {quickReplies.filter(r => r.ativo).map((reply) => (
                      <button
                        key={reply.id}
                        type="button"
                        onClick={() => setTypedMessage(reply.mensagem)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold rounded border border-slate-200 cursor-pointer shrink-0 transition-all"
                        title={reply.mensagem}
                      >
                        {reply.titulo}
                      </button>
                    ))}
                  </div>

                  {/* Dual Action Forms */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Form 1: Enviar WhatsApp */}
                    <form onSubmit={handleSendMessage} className="space-y-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">💬 Enviar WhatsApp Comercial</span>
                      <div className="flex gap-1.5">
                        <textarea
                          rows={2}
                          value={typedMessage}
                          onChange={(e) => setTypedMessage(e.target.value)}
                          placeholder="Digite a mensagem para o cliente..."
                          className="flex-1 bg-[#F2F2F2] border border-slate-200 focus:border-[#034AA6] rounded-xl p-2 text-xs outline-none text-[#022859] resize-none"
                        />
                        <button
                          type="submit"
                          disabled={!typedMessage.trim() || isSending}
                          className="px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>

                    {/* Form 2: Adicionar Nota Interna (Supervisor/Consultor) */}
                    <form onSubmit={handleAddNote} className="space-y-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">📝 Nota Interna (Supervisor/Histórico)</span>
                      <div className="flex gap-1.5">
                        <textarea
                          rows={2}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Notas internas não são enviadas ao cliente..."
                          className="flex-1 bg-[#F2F2F2] border border-slate-200 focus:border-amber-500 rounded-xl p-2 text-xs outline-none text-[#022859] resize-none"
                        />
                        <button
                          type="submit"
                          disabled={!noteText.trim() || isAddingNote}
                          className="px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 text-[#034AA6]/30 mb-2 animate-bounce" />
                <h4 className="text-sm font-bold text-[#022859]">Nenhuma conversa ativa selecionada</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Selecione uma conversa na coluna de entrada para ler o histórico, enviar mensagens ou assumir atendimentos.
                </p>
              </div>
            )}
          </div>

          {/* COLUMN 3: LEAD/CLIENT DETAILS PANELS (3 cols) */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between overflow-y-auto space-y-4">
            {selectedConversation ? (
              <>
                <div className="space-y-4">
                  {/* Lead Summary Card */}
                  <div className="pb-3 border-b border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Perfil Vinculado</span>
                    <h5 className="text-sm font-black text-[#022859] mt-1">{selectedConversation.nome_contato}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Celular: {selectedConversation.telefone}</p>
                  </div>

                  {/* Linked Status */}
                  <div className="bg-[#022859]/5 border border-[#034AA6]/15 rounded-xl p-3 space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Atendimento Atual</span>
                    
                    <div className="space-y-1.5 text-xs text-[#022859]">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Status:</span>
                        <span className="font-bold">{selectedConversation.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Atendente:</span>
                        <span className="font-bold">
                          {activeSellers.find(u => u.id === selectedConversation.current_attendant_id)?.name || 'Sem Atribuição'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Canal:</span>
                        <span className="font-semibold text-[#034AA6]">
                          {numbers.find(n => n.id === selectedConversation.whatsapp_number_id)?.nome || 'Comercial'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Flow Status Toggle */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Mudar Status</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleStatusChange(selectedConversation.id, 'Aguardando cliente')}
                        className="py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold rounded-lg cursor-pointer text-[10px] text-center"
                      >
                        Aguardando Cliente
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedConversation.id, 'Resolvido')}
                        className="py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-lg cursor-pointer text-[10px] text-center"
                      >
                        Atend. Resolvido
                      </button>
                    </div>
                  </div>

                  {/* Internal Notes Panel */}
                  <div className="space-y-2.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      <span>Histórico de Notas Internas</span>
                    </span>

                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {notes.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">Nenhuma anotação de supervisão.</p>
                      ) : (
                        notes.map((n) => (
                          <div key={n.id} className="p-2 bg-amber-50/40 border border-amber-200/50 rounded-xl space-y-1">
                            <p className="text-[10px] text-slate-600 leading-relaxed font-medium">{n.note}</p>
                            <div className="flex justify-between items-center text-[8px] text-slate-400 font-semibold font-mono">
                              <span>Por: {n.user_name}</span>
                              <span>{new Date(n.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Transfers Timeline */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Linha de Transferências</span>
                    </span>

                    <div className="space-y-2 max-h-[120px] overflow-y-auto divide-y divide-slate-100 pr-1">
                      {transfers.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">Conversa original sem reatribuição.</p>
                      ) : (
                        transfers.map((t) => {
                          const fromUser = apiService.getUsers().find((u) => u.id === t.from_user_id);
                          const toUser = apiService.getUsers().find((u) => u.id === t.to_user_id);
                          const byUser = apiService.getUsers().find((u) => u.id === t.transferred_by_user_id);

                          return (
                            <div key={t.id} className="pt-2 text-[10px] space-y-0.5">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-extrabold text-[#022859]">{fromUser ? fromUser.name.split(' ')[0] : 'Fila'}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span className="font-extrabold text-[#034AA6]">{toUser ? toUser.name.split(' ')[0] : 'Consultor'}</span>
                              </div>
                              <p className="text-slate-400 text-[9px] italic">Por: {byUser ? byUser.name : 'Sistema'}</p>
                              <p className="text-slate-500 text-[10px] leading-tight mt-1">"{t.motivo}"</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Warnings */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-400 leading-normal">
                  <p className="font-bold text-[#022859]">Fluxo Comercial Protegido</p>
                  A integrações não criam propostas ou contratos automaticamente. Use os menus do CRM para o fluxo de vendas.
                </div>
              </>
            ) : (
              <div className="py-24 text-center text-slate-400 italic text-xs">
                Nenhum detalhe ativo.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================== TAB: NUMBERS ================================== */}
      {activeTab === 'numbers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#022859]">Configuração de Canais (Números de WhatsApp)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Defina os canais de entrada de conversas Wame compartilhados.</p>
            </div>

            {hasPermission('configurar_numeros_whatsapp') && (
              <button
                onClick={() => setShowNumberModal(true)}
                className="px-4 py-2 bg-[#034AA6] hover:bg-[#022859] border border-[#F2B807]/30 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <PlusCircle className="w-4 h-4 text-[#F2B807]" />
                <span>+ Novo Canal WhatsApp</span>
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#022859] text-white uppercase font-mono text-[9px]">
                  <tr>
                    <th className="px-4 py-3.5">Nome do Canal</th>
                    <th className="px-4 py-3.5">Telefone</th>
                    <th className="px-4 py-3.5">Status Provedor</th>
                    <th className="px-4 py-3.5">Identificador Externo (WAME)</th>
                    <th className="px-4 py-3.5">Provedor</th>
                    <th className="px-4 py-3.5">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {numbers.map((num) => (
                    <tr key={num.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-[#022859]">{num.nome}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-500 font-semibold">{num.telefone}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            num.status === 'ativo'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                              : 'bg-rose-50 border-rose-200 text-rose-600'
                          }`}
                        >
                          {num.status === 'ativo' ? '🟢 Ativo' : '🟡 Pendente'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">{num.identificador_externo || '-'}</td>
                      <td className="px-4 py-3.5 font-bold text-[#034AA6]">{num.provedor}</td>
                      <td className="px-4 py-3.5 text-slate-400">{num.observacoes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================== TAB: ATTENDANTS ================================== */}
      {activeTab === 'attendants' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#022859]">Gerenciamento de Atendentes do WhatsApp</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Habilite ou revogue o acesso de usuários do CRM para realizarem atendimento e usarem os números de WhatsApp compartilhados.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#022859] text-white uppercase font-mono text-[9px]">
                  <tr>
                    <th className="px-4 py-3.5">Nome do Usuário</th>
                    <th className="px-4 py-3.5">E-mail</th>
                    <th className="px-4 py-3.5">Perfil CRM</th>
                    <th className="px-4 py-3.5">Habilitado Atendimento WA</th>
                    <th className="px-4 py-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {apiService.getUsers().map((u) => {
                    const waAtt = attendants.find((a) => a.user_id === u.id);
                    const isEnabled = waAtt ? waAtt.ativo : false;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-[#022859]">{u.name}</td>
                        <td className="px-4 py-3.5 text-slate-400 font-mono">{u.email}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-lg text-[10px]">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold">
                          {isEnabled ? (
                            <span className="text-emerald-600">🟢 Habilitado</span>
                          ) : (
                            <span className="text-slate-400">🔴 Desabilitado</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {hasPermission('gerenciar_atendentes_whatsapp') && (
                            <button
                              onClick={() => handleToggleAttendant(u.id, isEnabled)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                                isEnabled
                                  ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100'
                                  : 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                              }`}
                            >
                              {isEnabled ? 'Revogar Acesso' : 'Habilitar'}
                            </button>
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
      )}

      {/* ================================== TAB: QUICK REPLIES ================================== */}
      {activeTab === 'quick_replies' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#022859]">Respostas Rápidas (WhatsApp)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Cadastre mensagens pré-formatadas para agilizar o atendimento.</p>
            </div>

            {hasPermission('gerenciar_respostas_rapidas') && (
              <button
                onClick={() => setShowReplyModal(true)}
                className="px-4 py-2 bg-[#034AA6] hover:bg-[#022859] border border-[#F2B807]/30 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <PlusCircle className="w-4 h-4 text-[#F2B807]" />
                <span>+ Nova Resposta Rápida</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickReplies.map((reply) => (
              <div key={reply.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="font-extrabold text-[#022859] text-xs">{reply.titulo}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-50 border border-blue-200 text-[#034AA6] rounded uppercase">
                      {reply.categoria}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-wrap">{reply.mensagem}</p>
                </div>

                <div className="text-[9px] text-slate-400 pt-2 border-t border-slate-50 font-medium">
                  Ativa: {reply.ativo ? 'Sim 🟢' : 'Não 🔴'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================== TAB: INTEGRATION ================================== */}
      {activeTab === 'integration' && (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#022859]">Configuração Wame API Provedor</h3>
            <p className="text-xs text-slate-400 mt-0.5">Prepare os endpoints seguros do servidor de WhatsApp.</p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Provedor Integrado</label>
                <input
                  type="text"
                  value="WAME API"
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-500 font-bold outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Status Provedor</label>
                <input
                  type="text"
                  value="ARQUITETURA PREPARADA (PRONTO PARA FASE 7.3)"
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-emerald-600 font-bold outline-none cursor-not-allowed text-[10px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">API Base URL (Wame Endpoint) *</label>
              <input
                type="url"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                placeholder="Ex: https://api.wame.example.com/v1"
                required
                className="w-full bg-[#F2F2F2] border border-slate-200 focus:border-[#034AA6] rounded-xl p-2.5 text-[#022859] outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Identificador de Conta (Account ID / Token Key) *</label>
              <input
                type="text"
                value={accountIdentifier}
                onChange={(e) => setAccountIdentifier(e.target.value)}
                placeholder="Ex: credsempre_corporativo"
                required
                className="w-full bg-[#F2F2F2] border border-slate-200 focus:border-[#034AA6] rounded-xl p-2.5 text-[#022859] outline-none"
              />
            </div>

            {/* Shield Notification */}
            <div className="bg-[#022859]/5 border border-[#034AA6]/20 rounded-xl p-4 flex items-start gap-2.5 text-slate-600 leading-relaxed text-[11px]">
              <ShieldCheck className="w-5 h-5 text-[#034AA6] shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-[#022859] block">Segurança de Credenciais Wame</span>
                Nenhum token ou chave de API privada da WAME é salva ou transmitida no React ou armazenada no localStorage do cliente. O backend PHP manipula variáveis e hashes sensíveis no lado do servidor para evitar interceptações de segurança.
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#034AA6] hover:bg-[#022859] border border-[#F2B807]/30 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4 text-[#F2B807]" />
              <span>Salvar Integração WAME</span>
            </button>
          </form>
        </div>
      )}

      {/* ================================== MODAL: TRANSFER CONVERSATION ================================== */}
      {showTransferModal && selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 text-xs text-slate-300">
            <h3 className="text-base font-extrabold text-white mb-1">Transferir Conversa</h3>
            <p className="text-slate-400 text-[11px] mb-4">
              Transfira o atendimento de "{selectedConversation.nome_contato}" para outro atendente do CRM.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Selecionar Atendente Disponível *</label>
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                >
                  <option value="">Selecione o atendente...</option>
                  {attendants
                    .filter((a) => a.ativo && a.user_id !== selectedConversation.current_attendant_id)
                    .map((att) => (
                      <option key={att.id} value={att.user_id}>
                        {att.user_name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Motivo Opcional</label>
                <textarea
                  rows={2}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Ex: cliente solicitou esclarecimento financeiro sobre o contrato..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-600 outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={!transferTargetId}
                  className="px-4 py-2 bg-[#034AA6] hover:bg-[#022859] text-white font-extrabold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Transferir Atendimento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================== MODAL: NEW CHANNEL / NUMBER ================================== */}
      {showNewNumberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 text-xs text-slate-300">
            <h3 className="text-base font-extrabold text-white mb-1">Novo Canal WhatsApp</h3>
            <p className="text-slate-400 text-[11px] mb-4">Adicione um novo número para multiatendimento corporativo.</p>

            <form onSubmit={handleAddNumber} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nome do Canal *</label>
                <input
                  type="text"
                  required
                  value={newNumNome}
                  onChange={(e) => setNewNumNome(e.target.value)}
                  placeholder="Ex: WhatsApp Vendas Margem"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Telefone (Somente Números, com DDD) *</label>
                <input
                  type="text"
                  required
                  value={newNumFone}
                  onChange={(e) => setNewNumPhone(e.target.value)}
                  placeholder="Ex: 11999999999"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-600 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observações do Canal</label>
                <textarea
                  rows={2}
                  value={newNumObs}
                  onChange={(e) => setNewNumObs(e.target.value)}
                  placeholder="Notas internas..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-600 outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNumberModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition-all cursor-pointer"
                >
                  Salvar Canal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================== MODAL: NEW QUICK REPLY ================================== */}
      {showNewReplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 text-xs text-slate-300">
            <h3 className="text-base font-extrabold text-white mb-1">Nova Resposta Rápida</h3>
            <p className="text-slate-400 text-[11px] mb-4">Adicione um atalho rápido de texto comercial para envio.</p>

            <form onSubmit={handleAddReply} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Título do Atalho *</label>
                <input
                  type="text"
                  required
                  value={newQrTitle}
                  onChange={(e) => setNewQrTitle(e.target.value)}
                  placeholder="Ex: Saudação INSS"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Categoria *</label>
                <input
                  type="text"
                  required
                  value={newQrCat}
                  onChange={(e) => setNewQrCat(e.target.value)}
                  placeholder="Ex: Saudação, Documentação, Fechamento"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mensagem de Texto *</label>
                <textarea
                  rows={4}
                  required
                  value={newQrMsg}
                  onChange={(e) => setNewQrMsg(e.target.value)}
                  placeholder="Escreva a resposta completa para o cliente..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-white placeholder-slate-600 outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReplyModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition-all cursor-pointer"
                >
                  Salvar Resposta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
