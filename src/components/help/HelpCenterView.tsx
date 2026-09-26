import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  TrainingContent,
  TrainingContentType,
  Bank,
  Product,
} from '../../types/crm';
import {
  Search,
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  Building2,
  Layers,
  ChevronRight,
  MessageSquare,
  ClipboardList,
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { HelpContentModal } from './HelpContentModal';

interface HelpCenterViewProps {
  onNavigateToConfig?: () => void;
}

export const HelpCenterView: React.FC<HelpCenterViewProps> = ({ onNavigateToConfig }) => {
  const { currentUser } = useAuth();

  // Active Tab Filter (todos, video, pdf/manual, faq, banco, produto, script, procedimento, comunicado)
  const [activeTab, setActiveTab] = useState<string>('todos');

  // Related Entity filters
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>('TODOS');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('TODOS');

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Loaded Data
  const [helpContents, setHelpContents] = useState<TrainingContent[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Modals / Viewers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contentToEdit, setContentToEdit] = useState<TrainingContent | null>(null);

  // Active Reading modal for articles/scripts/FAQ/announcements
  const [activeReaderItem, setActiveReaderItem] = useState<TrainingContent | null>(null);
  // Active Video modal for streaming
  const [activeVideoItem, setActiveVideoItem] = useState<TrainingContent | null>(null);

  const canManageHelp = apiService.hasPermission(currentUser, 'gerenciar_treinamentos');

  const loadHelpData = () => {
    // Translate activeTab to a specific TrainingContentType if not "todos", "banco", or "produto"
    let typeFilter = 'TODOS';
    if (activeTab === 'video') typeFilter = 'VIDEO';
    if (activeTab === 'pdf') typeFilter = 'PDF'; // We will also fetch MANUAL here
    if (activeTab === 'faq') typeFilter = 'FAQ';
    if (activeTab === 'script') typeFilter = 'SCRIPT';
    if (activeTab === 'procedimento') typeFilter = 'PROCEDIMENTO';
    if (activeTab === 'comunicado') typeFilter = 'COMUNICADO';

    const items = apiService.getHelpContents({
      type: typeFilter,
      bank_id: selectedBankFilter,
      product_id: selectedProductFilter,
      search: searchQuery,
    });

    // Custom filtering for Bank and Product tabs
    let filteredItems = items;
    if (activeTab === 'banco') {
      filteredItems = items.filter((h) => !!h.bank_id);
    } else if (activeTab === 'produto') {
      filteredItems = items.filter((h) => !!h.product_id);
    } else if (activeTab === 'pdf') {
      // PDF Tab fetches both PDF and MANUAL types
      filteredItems = apiService.getHelpContents({
        bank_id: selectedBankFilter,
        product_id: selectedProductFilter,
        search: searchQuery,
      }).filter((h) => h.content_type === 'PDF' || h.content_type === 'MANUAL');
    }

    setHelpContents(filteredItems);
    setBanks(apiService.getBanks());
    setProducts(apiService.getProducts());
  };

  useEffect(() => {
    loadHelpData();
  }, [activeTab, selectedBankFilter, selectedProductFilter, searchQuery]);

  // Quick Action card handler
  const handleQuickAccess = (tab: string) => {
    setActiveTab(tab);
    // Reset secondary filters to see wider results
    setSelectedBankFilter('TODOS');
    setSelectedProductFilter('TODOS');
  };

  // Delete handler
  const handleDeleteContent = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente este material de apoio?')) return;
    try {
      await apiService.deleteHelpContent(id, currentUser);
      loadHelpData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir material.');
    }
  };

  // Helper to extract embeddable youtube video ID
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
      }
      return url; // Fallback
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-xs">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#022859] via-[#034AA6] to-[#022859] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#F2B807] text-[#022859] uppercase tracking-wider">
                Fase 6
              </span>
              <span className="text-xs text-blue-200 font-semibold">
                Central de Ajuda, Suporte e Treinamentos
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-[#F2B807]" />
              Central de Ajuda e Treinamentos
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-2xl">
              Seu portal integrado de capacitação: manuais operacionais de bancos parceiros, roteiros telefônicos validados, procedimentos técnicos e comunicados oficiais.
            </p>
          </div>

          {canManageHelp && (
            <button
              onClick={() => {
                setContentToEdit(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 bg-[#F2B807] hover:bg-[#F28907] text-[#022859] hover:text-white rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Material</span>
            </button>
          )}
        </div>
      </div>

      {/* "Como podemos ajudar?" Search Center */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="max-w-2xl mx-auto text-center space-y-2">
          <h2 className="text-lg font-black text-[#022859] tracking-tight">
            Como podemos ajudar você hoje?
          </h2>
          <p className="text-slate-500 text-xs">
            Digite palavras-chave, bancos, produtos ou procedimentos para encontrar respostas instantâneas.
          </p>

          <div className="relative pt-2">
            <Search className="w-5 h-5 absolute left-4 top-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar treinamento, banco, produto ou procedimento..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6] focus:bg-white shadow-xs transition-all font-semibold"
            />
          </div>
        </div>

        {/* Quick Access Icons Grid */}
        <div className="pt-2">
          <h3 className="text-center text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-3">
            Acesso Rápido a Categorias
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 select-none">
            <button
              onClick={() => handleQuickAccess('video')}
              className="p-3 bg-slate-50 hover:bg-[#034AA6]/5 border border-slate-200 hover:border-[#034AA6] rounded-2xl text-center transition-all cursor-pointer space-y-1.5"
            >
              <Video className="w-5 h-5 text-red-600 mx-auto" />
              <span className="font-extrabold text-[#022859] block text-[10px]">Vídeos</span>
            </button>

            <button
              onClick={() => handleQuickAccess('pdf')}
              className="p-3 bg-slate-50 hover:bg-[#034AA6]/5 border border-slate-200 hover:border-[#034AA6] rounded-2xl text-center transition-all cursor-pointer space-y-1.5"
            >
              <FileText className="w-5 h-5 text-blue-600 mx-auto" />
              <span className="font-extrabold text-[#022859] block text-[10px]">Manuais e PDFs</span>
            </button>

            <button
              onClick={() => handleQuickAccess('faq')}
              className="p-3 bg-slate-50 hover:bg-[#034AA6]/5 border border-slate-200 hover:border-[#034AA6] rounded-2xl text-center transition-all cursor-pointer space-y-1.5"
            >
              <HelpCircle className="w-5 h-5 text-emerald-600 mx-auto" />
              <span className="font-extrabold text-[#022859] block text-[10px]">Perguntas (FAQ)</span>
            </button>

            <button
              onClick={() => handleQuickAccess('banco')}
              className="p-3 bg-slate-50 hover:bg-[#034AA6]/5 border border-slate-200 hover:border-[#034AA6] rounded-2xl text-center transition-all cursor-pointer space-y-1.5"
            >
              <Building2 className="w-5 h-5 text-amber-600 mx-auto" />
              <span className="font-extrabold text-[#022859] block text-[10px]">Por Banco</span>
            </button>

            <button
              onClick={() => handleQuickAccess('produto')}
              className="p-3 bg-slate-50 hover:bg-[#034AA6]/5 border border-slate-200 hover:border-[#034AA6] rounded-2xl text-center transition-all cursor-pointer space-y-1.5"
            >
              <Layers className="w-5 h-5 text-indigo-600 mx-auto" />
              <span className="font-extrabold text-[#022859] block text-[10px]">Por Produto</span>
            </button>

            <button
              onClick={() => handleQuickAccess('script')}
              className="p-3 bg-slate-50 hover:bg-[#034AA6]/5 border border-slate-200 hover:border-[#034AA6] rounded-2xl text-center transition-all cursor-pointer space-y-1.5"
            >
              <MessageSquare className="w-5 h-5 text-pink-600 mx-auto" />
              <span className="font-extrabold text-[#022859] block text-[10px]">Roteiros / Scripts</span>
            </button>

            <button
              onClick={() => handleQuickAccess('procedimento')}
              className="p-3 bg-slate-50 hover:bg-[#034AA6]/5 border border-slate-200 hover:border-[#034AA6] rounded-2xl text-center transition-all cursor-pointer space-y-1.5"
            >
              <ClipboardList className="w-5 h-5 text-teal-600 mx-auto" />
              <span className="font-extrabold text-[#022859] block text-[10px]">Procedimentos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Filters & Content Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Filters Panel */}
        <div className="lg:col-span-1 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4 select-none">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 font-extrabold text-slate-800">
            <SlidersHorizontal className="w-4 h-4 text-[#034AA6]" />
            <span>Filtros Adicionais</span>
          </div>

          {/* Filter by Bank */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Filtrar por Banco</label>
            <select
              value={selectedBankFilter}
              onChange={(e) => setSelectedBankFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#034AA6]"
            >
              <option value="TODOS">Todos os Bancos</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Product */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Filtrar por Produto</label>
            <select
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#034AA6]"
            >
              <option value="TODOS">Todos os Produtos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Clear */}
          {(selectedBankFilter !== 'TODOS' || selectedProductFilter !== 'TODOS' || searchQuery !== '') && (
            <button
              onClick={() => {
                setSelectedBankFilter('TODOS');
                setSelectedProductFilter('TODOS');
                setSearchQuery('');
              }}
              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer block text-center"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Right Side Content Area */}
        <div className="lg:col-span-3 space-y-5">
          {/* Subareas Tab Selector */}
          <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto select-none no-scrollbar">
            <button
              onClick={() => setActiveTab('todos')}
              className={`px-3 py-2 rounded-xl font-bold shrink-0 transition-all text-xs cursor-pointer ${
                activeTab === 'todos'
                  ? 'bg-[#034AA6] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              📚 Todos os Materiais
            </button>

            <button
              onClick={() => setActiveTab('video')}
              className={`px-3 py-2 rounded-xl font-bold shrink-0 transition-all text-xs cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-[#034AA6] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              🎥 Vídeos
            </button>

            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-2 rounded-xl font-bold shrink-0 transition-all text-xs cursor-pointer ${
                activeTab === 'pdf'
                  ? 'bg-[#034AA6] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              📄 Manuais e PDFs
            </button>

            <button
              onClick={() => setActiveTab('faq')}
              className={`px-3 py-2 rounded-xl font-bold shrink-0 transition-all text-xs cursor-pointer ${
                activeTab === 'faq'
                  ? 'bg-[#034AA6] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              ❓ Perguntas Frequentes
            </button>

            <button
              onClick={() => setActiveTab('banco')}
              className={`px-3 py-2 rounded-xl font-bold shrink-0 transition-all text-xs cursor-pointer ${
                activeTab === 'banco'
                  ? 'bg-[#034AA6] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              🏦 Treinamentos por Banco
            </button>

            <button
              onClick={() => setActiveTab('produto')}
              className={`px-3 py-2 rounded-xl font-bold shrink-0 transition-all text-xs cursor-pointer ${
                activeTab === 'produto'
                  ? 'bg-[#034AA6] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              💳 Treinamentos por Produto
            </button>

            <button
              onClick={() => setActiveTab('script')}
              className={`px-3 py-2 rounded-xl font-bold shrink-0 transition-all text-xs cursor-pointer ${
                activeTab === 'script'
                  ? 'bg-[#034AA6] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              🗣️ Scripts de Atendimento
            </button>

            <button
              onClick={() => setActiveTab('procedimento')}
              className={`px-3 py-2 rounded-xl font-bold shrink-0 transition-all text-xs cursor-pointer ${
                activeTab === 'procedimento'
                  ? 'bg-[#034AA6] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              📋 Procedimentos
            </button>

            <button
              onClick={() => setActiveTab('comunicado')}
              className={`px-3 py-2 rounded-xl font-bold shrink-0 transition-all text-xs cursor-pointer ${
                activeTab === 'comunicado'
                  ? 'bg-[#034AA6] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              📢 Comunicados
            </button>
          </div>

          {/* Contents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {helpContents.length > 0 ? (
              helpContents.map((item) => {
                const isVideo = item.content_type === 'VIDEO';
                const isDoc = item.content_type === 'PDF' || item.content_type === 'MANUAL';

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border ${
                      item.required ? 'border-rose-300' : 'border-slate-200'
                    } shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all animate-in fade-in duration-200`}
                  >
                    {/* Header Image or Category Overlay */}
                    {isVideo && item.thumbnail_url ? (
                      <div className="relative h-36 bg-slate-900 group">
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                          <button
                            onClick={() => setActiveVideoItem(item)}
                            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
                          >
                            <Video className="w-6 h-6 ml-0.5" />
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Content Details */}
                    <div className="p-4 space-y-2 flex-grow">
                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          {item.content_type}
                        </span>

                        <div className="flex items-center gap-1">
                          {item.required && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                              Obrigatório ⚠️
                            </span>
                          )}
                          {item.featured && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#F2B807]/20 text-[#022859] border border-[#F2B807]/30">
                              Destaque ★
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="font-extrabold text-[#022859] text-sm leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-slate-500 text-[11px] line-clamp-2">
                        {item.description}
                      </p>

                      {/* Bank & Product Badges */}
                      {(item.bank_nome || item.product_nome) && (
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          {item.bank_nome && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Building2 className="w-3 h-3 text-[#034AA6]" />
                              {item.bank_nome}
                            </span>
                          )}
                          {item.product_nome && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                              <Layers className="w-3 h-3 text-indigo-500" />
                              {item.product_nome}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-[10px] text-slate-400 font-medium">
                        Por: {item.created_by_name || 'Admin'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {canManageHelp && (
                          <>
                            <button
                              onClick={() => {
                                setContentToEdit(item);
                                setIsModalOpen(true);
                              }}
                              className="p-1 bg-white hover:bg-slate-100 border border-slate-200 text-[#034AA6] rounded-lg transition-colors cursor-pointer"
                              title="Editar material"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteContent(item.id)}
                              className="p-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Remover material"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {isVideo ? (
                          <button
                            onClick={() => setActiveVideoItem(item)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Assistir</span>
                          </button>
                        ) : isDoc && item.file_url ? (
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-blue-600 hover:bg-[#034AA6] text-white rounded-lg font-bold transition-all shadow-xs inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#F2B807]" />
                            <span>Abrir PDF</span>
                          </a>
                        ) : (
                          <button
                            onClick={() => setActiveReaderItem(item)}
                            className="px-3 py-1 bg-[#034AA6] hover:bg-[#022859] text-white rounded-lg font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#F2B807]" />
                            <span>Ler Artigo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 p-10 text-center bg-white border border-slate-200 rounded-3xl italic text-slate-500">
                Nenhum material de apoio encontrado correspondente aos filtros selecionados.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: FULL TEXT ARTICLE / SCRIPT READER */}
      {activeReaderItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#022859] text-white p-5 border-b border-[#034AA6] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#034AA6] border border-[#F2B807]/40 flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5 text-[#F2B807]" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#F2B807] text-[#022859]">
                    Leitura do Material
                  </span>
                  <h3 className="text-base font-black text-white tracking-tight mt-0.5">
                    {activeReaderItem.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setActiveReaderItem(null)}
                className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[450px] space-y-4">
              {/* Resumo */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs">
                <strong>Resumo:</strong> {activeReaderItem.description}
              </div>

              {/* Text content with preservation of white spaces */}
              <pre className="text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed select-text p-2">
                {activeReaderItem.content_body}
              </pre>

              {/* Bank & Product details in reader */}
              {(activeReaderItem.bank_nome || activeReaderItem.product_nome) && (
                <div className="flex items-center gap-1.5 pt-4 border-t border-slate-100 flex-wrap select-none">
                  {activeReaderItem.bank_nome && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Building2 className="w-3.5 h-3.5 text-[#034AA6]" />
                      Banco: {activeReaderItem.bank_nome}
                    </span>
                  )}
                  {activeReaderItem.product_nome && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      Produto: {activeReaderItem.product_nome}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Publicado por {activeReaderItem.created_by_name || 'Admin'} em {new Date(activeReaderItem.created_at).toLocaleDateString('pt-BR')}
              </span>
              <button
                onClick={() => setActiveReaderItem(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Fechar Leitura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: STREAMING VIDEO PLAYER */}
      {activeVideoItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#022859] text-white p-4 border-b border-[#034AA6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-[#F2B807]" />
                <h3 className="font-extrabold text-sm">{activeVideoItem.title}</h3>
              </div>
              <button
                onClick={() => setActiveVideoItem(null)}
                className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Frame */}
            <div className="aspect-video bg-black relative">
              {activeVideoItem.video_url?.includes('youtube.com') || activeVideoItem.video_url?.includes('youtu.be') ? (
                <iframe
                  src={getYoutubeEmbedUrl(activeVideoItem.video_url)}
                  title={activeVideoItem.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-3">
                  <AlertCircle className="w-12 h-12 text-[#F2B807]" />
                  <p className="font-bold">Player Local Indisponível</p>
                  <p className="text-xs max-w-sm">
                    Este link de vídeo deve ser acessado de forma externa ou requer credenciais de sua conta.
                  </p>
                  <a
                    href={activeVideoItem.video_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#034AA6] hover:bg-[#022859] text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow"
                  >
                    <span>Assistir em Link Externo</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#F2B807]" />
                  </a>
                </div>
              )}
            </div>

            {/* Footer details */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-slate-500">
              <p className="text-[11px] max-w-md truncate">
                {activeVideoItem.description}
              </p>
              <button
                onClick={() => setActiveVideoItem(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Fechar Vídeo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: HELP CONTENT PUBLISHING MODAL (CRUD) */}
      <HelpContentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setContentToEdit(null);
        }}
        contentToEdit={contentToEdit}
        onSaved={loadHelpData}
      />
    </div>
  );
};
