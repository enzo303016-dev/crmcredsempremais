import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  TrainingContent,
  TrainingContentType,
  TrainingContentStatus,
  Bank,
  Product,
} from '../../types/crm';
import {
  X,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Video,
  FileText,
  HelpCircle,
  Megaphone,
} from 'lucide-react';

interface HelpContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentToEdit?: TrainingContent | null;
  onSaved: () => void;
}

export const HelpContentModal: React.FC<HelpContentModalProps> = ({
  isOpen,
  onClose,
  contentToEdit,
  onSaved,
}) => {
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const [title, setTitle] = useState<string>(contentToEdit?.title || '');
  const [description, setDescription] = useState<string>(contentToEdit?.description || '');
  const [contentType, setContentType] = useState<TrainingContentType>(contentToEdit?.content_type || 'VIDEO');
  const [category, setCategory] = useState<string>(contentToEdit?.category || 'Vídeos');
  const [bankId, setBankId] = useState<string>(contentToEdit?.bank_id || '');
  const [productId, setProductId] = useState<string>(contentToEdit?.product_id || '');
  const [videoUrl, setVideoUrl] = useState<string>(contentToEdit?.video_url || '');
  const [fileUrl, setFileUrl] = useState<string>(contentToEdit?.file_url || '');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(contentToEdit?.thumbnail_url || '');
  const [contentBody, setContentBody] = useState<string>(contentToEdit?.content_body || '');
  const [status, setStatus] = useState<TrainingContentStatus>(contentToEdit?.status || 'ATIVO');
  const [featured, setFeatured] = useState<boolean>(contentToEdit?.featured || false);
  const [required, setRequired] = useState<boolean>(contentToEdit?.required || false);
  const [orderIndex, setOrderIndex] = useState<string>(contentToEdit ? contentToEdit.order_index.toString() : '0');

  const [banks, setBanks] = useState<Bank[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setBanks(apiService.getBanks());
    setProducts(apiService.getProducts());
  }, []);

  // Update Category automatically when Content Type changes
  useEffect(() => {
    if (!contentToEdit) {
      switch (contentType) {
        case 'VIDEO':
          setCategory('Vídeos');
          break;
        case 'PDF':
        case 'MANUAL':
          setCategory('Manuais');
          break;
        case 'FAQ':
          setCategory('Perguntas Frequentes');
          break;
        case 'SCRIPT':
          setCategory('Scripts de Atendimento');
          break;
        case 'PROCEDIMENTO':
          setCategory('Procedimentos');
          break;
        case 'COMUNICADO':
          setCategory('Comunicados');
          break;
        default:
          setCategory('Todos os Materiais');
          break;
      }
    }
  }, [contentType, contentToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('O título do material é obrigatório.');
      return;
    }

    if (contentType === 'VIDEO' && !videoUrl.trim()) {
      setErrorMessage('Informe a URL do vídeo (YouTube, Vimeo, etc.).');
      return;
    }

    if ((contentType === 'PDF' || contentType === 'MANUAL') && !fileUrl.trim()) {
      setErrorMessage('Informe a URL do arquivo ou manual.');
      return;
    }

    if (['FAQ', 'SCRIPT', 'PROCEDIMENTO', 'COMUNICADO', 'ARTIGO'].includes(contentType) && !contentBody.trim()) {
      setErrorMessage('O corpo do texto / conteúdo escrito é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        content_type: contentType,
        category,
        bank_id: bankId || null,
        product_id: productId || null,
        video_url: videoUrl.trim() || null,
        file_url: fileUrl.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
        content_body: contentBody.trim() || null,
        status,
        featured,
        required,
        order_index: parseInt(orderIndex) || 0,
      };

      if (contentToEdit) {
        await apiService.updateHelpContent(contentToEdit.id, payload, currentUser);
      } else {
        await apiService.createHelpContent(payload, currentUser);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar conteúdo de treinamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#022859] text-white p-5 border-b border-[#034AA6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#034AA6] border border-[#F2B807]/40 flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 text-[#F2B807]" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#F2B807] text-[#022859]">
                Fase 6 • Central de Ajuda
              </span>
              <h3 className="text-base font-black text-white tracking-tight mt-0.5">
                {contentToEdit ? 'Editar Material de Apoio' : 'Publicar Novo Material de Apoio'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipo de Conteúdo *
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as TrainingContentType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              >
                <option value="VIDEO">Vídeo (YouTube / Vimeo / Externo)</option>
                <option value="PDF">Arquivo PDF</option>
                <option value="MANUAL">Manual Escrito / Tutorial</option>
                <option value="FAQ">Pergunta Frequente (FAQ)</option>
                <option value="SCRIPT">Roteiro / Script de Atendimento</option>
                <option value="PROCEDIMENTO">Procedimento Operacional (POP)</option>
                <option value="COMUNICADO">Comunicado Interno Oficial</option>
                <option value="ARTIGO">Artigo / Documentação Geral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Título do Material *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Como fazer uma proposta de Consignado Itaú"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Breve Descrição / Resumo
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Resumo prático e dicas para evitar devolução de propostas de consignado."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Link to Bank */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vincular a um Banco Parceiro (Opcional)
              </label>
              <select
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="">Nenhum Banco Específico (Geral)</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Link to Product */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vincular a um Produto (Opcional)
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="">Nenhum Produto Específico (Geral)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {contentType === 'VIDEO' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL do Vídeo (YouTube / Vimeo / Outros) *
                </label>
                <input
                  type="url"
                  required={contentType === 'VIDEO'}
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL da Miniatura do Vídeo (Opcional)
                </label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
                />
              </div>
            </div>
          )}

          {(contentType === 'PDF' || contentType === 'MANUAL') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Link do Arquivo / Manual PDF *
              </label>
              <input
                type="url"
                required={contentType === 'PDF' || contentType === 'MANUAL'}
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://credsempre.com.br/manuais/arquivo.pdf"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              />
            </div>
          )}

          {contentType !== 'VIDEO' && contentType !== 'PDF' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Conteúdo Escrito (Suporta Markdown ou Texto Simples) *
              </label>
              <textarea
                rows={6}
                required
                value={contentBody}
                onChange={(e) => setContentBody(e.target.value)}
                placeholder="Escreva aqui o script de vendas, os passos do procedimento (POP), a resposta da dúvida frequente (FAQ) ou o texto do comunicado..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TrainingContentStatus)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
              >
                <option value="ATIVO">ATIVO</option>
                <option value="INATIVO">INATIVO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ordem Exibição
              </label>
              <input
                type="number"
                min="0"
                value={orderIndex}
                onChange={(e) => setOrderIndex(e.target.value)}
                className="w-full px-2 py-1 border border-slate-300 rounded-lg text-center font-bold"
              />
            </div>

            <div className="flex items-center gap-2 pt-5 select-none justify-center">
              <input
                type="checkbox"
                id="featured"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-[#034AA6] focus:ring-0 rounded border-slate-300"
              />
              <label htmlFor="featured" className="text-xs font-bold text-slate-700 cursor-pointer">
                Destaque
              </label>
            </div>

            <div className="flex items-center gap-2 pt-5 select-none justify-center">
              <input
                type="checkbox"
                id="required"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="w-4 h-4 text-rose-600 focus:ring-0 rounded border-slate-300"
              />
              <label htmlFor="required" className="text-xs font-bold text-slate-700 cursor-pointer text-rose-700">
                Obrigatório ⚠️
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#034AA6] hover:bg-[#022859] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-[#F2B807]" />
              <span>{isSubmitting ? 'Salvando...' : contentToEdit ? 'Salvar Alterações' : 'Publicar Material'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
