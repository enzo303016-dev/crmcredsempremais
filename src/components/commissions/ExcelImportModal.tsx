import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { excelImportService } from '../../services/excelImportService';
import {
  Bank,
  Product,
  Agreement,
  ExcelImportValidationResult,
  ParsedExcelRuleRow,
  ExcelImportExecutionResult,
} from '../../types/crm';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Layers,
  ArrowRight,
  RefreshCw,
  Plus,
  ShieldAlert,
  Info,
  Building2,
  HelpCircle,
  FileText,
  Trash2,
  Eye,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  banks: Bank[];
  products: Product[];
  agreements: Agreement[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  banks,
  products,
  agreements,
}) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flow steps: 1: select file, 2: analyze & validate, 3: result
  const [step, setStep] = useState<'select' | 'preview' | 'success'>('select');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [validationResult, setValidationResult] = useState<ExcelImportValidationResult | null>(null);

  // Import mode
  const [importMode, setImportMode] = useState<'add' | 'overwrite'>('add');
  const [isImporting, setIsImporting] = useState(false);
  const [importExecutionResult, setImportExecutionResult] = useState<ExcelImportExecutionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Conflict resolutions per rowNumber: 'keep_existing' | 'overwrite_with_excel' | 'skip'
  const [conflictDecisions, setConflictDecisions] = useState<Record<number, 'keep_existing' | 'overwrite_with_excel' | 'skip'>>({});

  // Overwrite Confirmation Dialog state
  const [isConfirmOverwriteOpen, setIsConfirmOverwriteOpen] = useState(false);

  // Filters for preview table
  const [previewFilter, setPreviewFilter] = useState<'all' | 'new' | 'conflict' | 'duplicate' | 'invalid'>('all');
  const [selectedSheetFilter, setSelectedSheetFilter] = useState<string>('TODAS');

  // Quick Bank Creation Modal state
  const [quickBankName, setQuickBankName] = useState<string>('');
  const [isQuickBankOpen, setIsQuickBankOpen] = useState(false);
  const [isCreatingBank, setIsCreatingBank] = useState(false);

  // Quick Product Creation Modal state
  const [quickProductInfo, setQuickProductInfo] = useState<{ bancoNome: string; produtoNome: string } | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // Quick Agreement Creation Modal state
  const [quickAgreeInfo, setQuickAgreeInfo] = useState<{ bancoNome: string; produtoNome: string; convenioNome: string } | null>(null);
  const [isCreatingAgree, setIsCreatingAgree] = useState(false);

  const canManageBanks = apiService.hasPermission(currentUser, 'gerenciar_bancos') || apiService.hasPermission(currentUser, 'criar_banco');
  const canManageProducts = apiService.hasPermission(currentUser, 'gerenciar_produtos') || apiService.hasPermission(currentUser, 'criar_produto');
  const canManageAgreements = apiService.hasPermission(currentUser, 'gerenciar_produtos') || apiService.hasPermission(currentUser, 'criar_convenio');

  if (!isOpen) return null;

  // Handle file select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorMessage('Por favor, selecione um arquivo válido do Excel (.xlsx ou .xls).');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setIsParsing(true);

    try {
      const currentBanks = apiService.getBanks();
      const currentProducts = apiService.getProducts();
      const currentAgreements = apiService.getAgreements();
      const currentRules = apiService.getCommissionRules();

      const result = await excelImportService.parseExcelFile(
        file,
        currentBanks,
        currentProducts,
        currentAgreements,
        currentRules
      );

      // Initialize default conflict decisions
      const initialDecisions: Record<number, 'keep_existing' | 'overwrite_with_excel' | 'skip'> = {};
      result.conflictRows.forEach((r) => {
        initialDecisions[r.rowNumber] = 'keep_existing';
      });
      setConflictDecisions(initialDecisions);

      setValidationResult(result);
      setStep('preview');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar arquivo Excel.');
    } finally {
      setIsParsing(false);
    }
  };

  // Re-run validation after manual entity creation
  const handleRevalidate = async () => {
    if (!selectedFile) return;
    setIsParsing(true);
    try {
      const currentBanks = apiService.getBanks();
      const currentProducts = apiService.getProducts();
      const currentAgreements = apiService.getAgreements();
      const currentRules = apiService.getCommissionRules();

      const result = await excelImportService.parseExcelFile(
        selectedFile,
        currentBanks,
        currentProducts,
        currentAgreements,
        currentRules
      );
      setValidationResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao revalidar dados.');
    } finally {
      setIsParsing(false);
    }
  };

  // Quick Bank Creation
  const handleCreateQuickBank = async (bankName: string) => {
    if (!currentUser) return;
    setIsCreatingBank(true);
    try {
      await apiService.createBank(
        {
          nome: bankName,
          codigo_bancario: '',
          cnpj: '',
          status: 'Ativo',
          observacoes: 'Cadastrado a partir do assistente de importação Excel',
        },
        currentUser
      );
      setIsQuickBankOpen(false);
      setQuickBankName('');
      await handleRevalidate();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar banco.');
    } finally {
      setIsCreatingBank(false);
    }
  };

  // Quick Product Creation
  const handleCreateQuickProduct = async (bankName: string, productName: string) => {
    if (!currentUser) return;
    setIsCreatingProduct(true);
    try {
      const currentBanks = apiService.getBanks();
      const matched = currentBanks.find(
        (b) => b.nome.toLowerCase().includes(bankName.toLowerCase()) || bankName.toLowerCase().includes(b.nome.toLowerCase())
      );
      if (!matched) {
        throw new Error(`Banco "${bankName}" não encontrado para associar o produto.`);
      }

      await apiService.createProduct(
        {
          banco_id: matched.id,
          banco_nome: matched.nome,
          nome: productName,
          codigo_produto: '',
          descricao: `Modalidade cadastrada para ${matched.nome}`,
          status: 'Ativo',
          observacoes: '',
        },
        currentUser
      );
      setQuickProductInfo(null);
      await handleRevalidate();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar produto.');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // Quick Agreement Creation
  const handleCreateQuickAgreement = async (bankName: string, productName: string, agreementName: string) => {
    if (!currentUser) return;
    setIsCreatingAgree(true);
    try {
      const currentBanks = apiService.getBanks();
      const currentProducts = apiService.getProducts();

      const matchedBank = currentBanks.find(
        (b) => b.nome.toLowerCase().includes(bankName.toLowerCase()) || bankName.toLowerCase().includes(b.nome.toLowerCase())
      );
      if (!matchedBank) throw new Error(`Banco "${bankName}" não encontrado.`);

      const matchedProduct = currentProducts.find(
        (p) => p.banco_id === matchedBank.id && (p.nome.toLowerCase().includes(productName.toLowerCase()) || productName.toLowerCase().includes(p.nome.toLowerCase()))
      );
      if (!matchedProduct) throw new Error(`Produto "${productName}" não encontrado para ${matchedBank.nome}.`);

      await apiService.createAgreement(
        {
          banco_id: matchedBank.id,
          banco_nome: matchedBank.nome,
          produto_id: matchedProduct.id,
          produto_nome: matchedProduct.nome,
          nome: agreementName,
          codigo_convenio: '',
          observacoes: '',
          status: 'Ativo',
        },
        currentUser
      );
      setQuickAgreeInfo(null);
      await handleRevalidate();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar convênio.');
    } finally {
      setIsCreatingAgree(false);
    }
  };

  // Trigger Import with confirmation if overwrite
  const handleInitiateImport = () => {
    if (!validationResult || !currentUser) return;

    if (validationResult.validRows.length === 0) {
      setErrorMessage('Não há regras válidas para importar. Corrija os erros listados ou cadastre os bancos, produtos e convênios faltantes.');
      return;
    }

    if (importMode === 'overwrite') {
      setIsConfirmOverwriteOpen(true);
    } else {
      executeImportProcess();
    }
  };

  // Execute Import (with transaction rollback support)
  const executeImportProcess = async () => {
    if (!validationResult || !currentUser) return;

    setIsImporting(true);
    setIsConfirmOverwriteOpen(false);
    setErrorMessage(null);

    try {
      const execResult = await apiService.batchImportCommissionRules(
        validationResult.validRows,
        importMode,
        validationResult.fileName,
        currentUser,
        conflictDecisions
      );
      setImportExecutionResult(execResult);
      setStep('success');
      onImportSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao executar importação de regras.');
    } finally {
      setIsImporting(false);
    }
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const blob = excelImportService.generateSampleExcelBlob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MODELO_IMPORTACAO_COMISSOES_CRED_SEMPRE.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Filtered rows for preview table
  const displayedRows = validationResult
    ? (previewFilter === 'new'
        ? validationResult.newValidRows
        : previewFilter === 'conflict'
        ? validationResult.conflictRows
        : previewFilter === 'duplicate'
        ? validationResult.duplicateRows
        : previewFilter === 'invalid'
        ? validationResult.invalidRows
        : [...validationResult.validRows, ...validationResult.invalidRows]
      ).filter((r) => (selectedSheetFilter === 'TODAS' ? true : r.sheetName === selectedSheetFilter))
    : [];

  const banksInFile = validationResult
    ? Array.from(new Set(validationResult.validRows.map((r) => r.bancoNome).filter(Boolean)))
    : [];

  const existingRulesCountForBanksInFile = validationResult
    ? apiService.getCommissionRules().filter((r) => validationResult.validRows.some((vr) => vr.bancoId === r.banco_id)).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full my-8 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#022859] text-white p-5 border-b border-[#034AA6] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#034AA6] border border-[#F2B807]/40 flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5 text-[#F2B807]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#F2B807] text-[#022859]">
                  Fase 4 • Parte 2
                </span>
                <span className="text-xs text-blue-200 font-semibold">Motor de Importação Excel</span>
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Importação em Massa de Regras de Comissão (.xlsx / .xls)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-[#034AA6] hover:bg-[#022859] border border-[#F2B807]/50 text-[#F2B807] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Baixar planilha de exemplo com múltiplas abas"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Planilha Modelo (.xlsx)</span>
            </button>

            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-step Breadcrumb */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3 font-bold">
            <div className={`flex items-center gap-1.5 ${step === 'select' ? 'text-[#034AA6]' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === 'select' ? 'bg-[#034AA6] text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                1
              </span>
              <span>Selecionar Arquivo</span>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />

            <div className={`flex items-center gap-1.5 ${step === 'preview' ? 'text-[#034AA6]' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === 'preview' ? 'bg-[#034AA6] text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                2
              </span>
              <span>Validação, Conflitos & Duplicidades</span>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />

            <div className={`flex items-center gap-1.5 ${step === 'success' ? 'text-emerald-700' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                3
              </span>
              <span>Importação Concluída</span>
            </div>
          </div>

          {selectedFile && (
            <div className="text-[11px] text-slate-600 font-medium">
              Arquivo: <strong className="text-[#022859]">{selectedFile.name}</strong> ({formatFileSize(selectedFile.size)})
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Atenção na Importação</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* STEP 1: SELECT FILE */}
          {step === 'select' && (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#034AA6]/40 hover:border-[#034AA6] bg-[#034AA6]/5 hover:bg-[#034AA6]/10 rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#034AA6] text-[#F2B807] flex items-center justify-center shadow-lg">
                  {isParsing ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-[#022859]">
                    {isParsing ? 'Lendo e Analisando Planilha...' : 'Clique para selecionar ou arraste sua planilha Excel'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Formatos aceitos: <strong>.xlsx</strong> e <strong>.xls</strong> com uma ou várias abas (ex: ITAU, PAN, BMG, SAFRA, BRADESCO).
                  </p>
                </div>

                <button
                  type="button"
                  className="px-5 py-2.5 bg-[#034AA6] hover:bg-[#022859] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#F2B807]" />
                  <span>Selecionar Arquivo do Computador</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
              </div>

              {/* Guidelines */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-extrabold text-[#022859]">
                  <ShieldCheck className="w-4 h-4 text-[#034AA6]" />
                  <span>Diretrizes de Segurança & Integridade:</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-700">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <p className="font-bold text-[#034AA6]">1. Identificação de Banco & Abas:</p>
                    <p>• Prioridade 1: Coluna <strong>"Banco"</strong>.</p>
                    <p>• Prioridade 2: Nome da <strong>Aba</strong>.</p>
                    <p>• Bancos devem estar previamente cadastrados.</p>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <p className="font-bold text-[#F28907]">2. Proteção contra Duplicidade:</p>
                    <p>• Regras idênticas são identificadas e não duplicadas.</p>
                    <p>• Convênio em branco = <strong>"Todos os convênios"</strong>.</p>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <p className="font-bold text-emerald-800">3. Gestão de Conflitos & Rollback:</p>
                    <p>• Conflitos exigem decisão explícita do admin.</p>
                    <p>• Transação com rollback automático em falhas.</p>
                    <p>• Backup lógico preservado na auditoria.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW, CONFLICTS & DUPLICATES */}
          {step === 'preview' && validationResult && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Total Linhas</span>
                  <span className="text-xl font-black text-[#022859] font-mono">{validationResult.totalRows}</span>
                  <span className="text-[10px] text-slate-400 block">{validationResult.totalSheets} abas</span>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">Regras Novas</span>
                  <span className="text-xl font-black text-emerald-700 font-mono">{validationResult.newValidRows.length}</span>
                  <span className="text-[10px] text-emerald-600 block">Sem duplicidade</span>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-center">
                  <span className="text-[10px] font-extrabold text-amber-900 uppercase block">Conflitos</span>
                  <span className="text-xl font-black text-amber-700 font-mono">{validationResult.conflictRows.length}</span>
                  <span className="text-[10px] text-amber-800 block">Decisão requerida</span>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <span className="text-[10px] font-extrabold text-blue-800 uppercase block">Duplicadas</span>
                  <span className="text-xl font-black text-[#034AA6] font-mono">{validationResult.duplicateRows.length}</span>
                  <span className="text-[10px] text-blue-600 block">Serão ignoradas</span>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <span className="text-[10px] font-extrabold text-rose-800 uppercase block">Com Erro</span>
                  <span className="text-xl font-black text-rose-700 font-mono">{validationResult.invalidRows.length}</span>
                  <span className="text-[10px] text-rose-600 block">Entidade inexistente</span>
                </div>
              </div>

              {/* UNRESOLVED ENTITIES (BANK, PRODUCT, AGREEMENT) */}
              {(validationResult.unresolvedBanks.length > 0 ||
                validationResult.unresolvedProducts.length > 0 ||
                validationResult.unresolvedAgreements.length > 0) && (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-rose-950">
                        Entidades Não Cadastradas no CRM — A importação destas linhas está bloqueada
                      </h4>
                      <p className="text-[11px] text-rose-900 mt-0.5">
                        O sistema <strong>não cadastra entidades automaticamente</strong> durante a importação. Apenas usuários autorizados podem cadastrar as entidades necessárias.
                      </p>
                    </div>
                  </div>

                  {/* Missing Banks */}
                  {validationResult.unresolvedBanks.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-rose-200">
                      <p className="text-[11px] font-bold text-rose-950">Bancos Não Encontrados:</p>
                      <div className="flex flex-wrap gap-2">
                        {validationResult.unresolvedBanks.map((bName, i) => (
                          <div
                            key={i}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-300 rounded-xl text-xs text-rose-950 shadow-sm"
                          >
                            <Building2 className="w-3.5 h-3.5 text-rose-700" />
                            <span>Banco não encontrado no cadastro: <strong>{bName}</strong></span>
                            {canManageBanks && (
                              <button
                                onClick={() => {
                                  setQuickBankName(bName);
                                  setIsQuickBankOpen(true);
                                }}
                                className="px-2 py-0.5 bg-[#034AA6] hover:bg-[#022859] text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Cadastrar Banco
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Products */}
                  {validationResult.unresolvedProducts.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-rose-200">
                      <p className="text-[11px] font-bold text-rose-950">Produtos Não Encontrados:</p>
                      <div className="flex flex-wrap gap-2">
                        {validationResult.unresolvedProducts.map((pInfo, i) => (
                          <div
                            key={i}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-300 rounded-xl text-xs text-rose-950 shadow-sm"
                          >
                            <span>Produto não encontrado no cadastro: <strong>{pInfo.banco} → {pInfo.produto}</strong></span>
                            {canManageProducts && (
                              <button
                                onClick={() => {
                                  setQuickProductInfo({ bancoNome: pInfo.banco, produtoNome: pInfo.produto });
                                }}
                                className="px-2 py-0.5 bg-[#034AA6] hover:bg-[#022859] text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Cadastrar Produto
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Agreements */}
                  {validationResult.unresolvedAgreements.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-rose-200">
                      <p className="text-[11px] font-bold text-rose-950">Convênios Não Encontrados:</p>
                      <div className="flex flex-wrap gap-2">
                        {validationResult.unresolvedAgreements.map((aInfo, i) => (
                          <div
                            key={i}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-300 rounded-xl text-xs text-rose-950 shadow-sm"
                          >
                            <span>Convênio não encontrado no cadastro: <strong>{aInfo.banco} → {aInfo.produto} → {aInfo.convenio}</strong></span>
                            {canManageAgreements && (
                              <button
                                onClick={() => {
                                  setQuickAgreeInfo({ bancoNome: aInfo.banco, produtoNome: aInfo.produto, convenioNome: aInfo.convenio });
                                }}
                                className="px-2 py-0.5 bg-[#034AA6] hover:bg-[#022859] text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Cadastrar Convênio
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CONFLICTS DECISION PANEL */}
              {validationResult.conflictRows.length > 0 && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black text-amber-950">
                          CONFLITO DE REGRA ({validationResult.conflictRows.length}) — Decisão Explícita Obrigatória
                        </h4>
                        <p className="text-[11px] text-amber-800">
                          Foram encontradas regras equivalentes já cadastradas, porém com <strong>valores de comissão diferentes</strong>. O sistema não substitui silenciosamente.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const updated: Record<number, 'keep_existing' | 'overwrite_with_excel' | 'skip'> = {};
                          validationResult.conflictRows.forEach((r) => (updated[r.rowNumber] = 'keep_existing'));
                          setConflictDecisions(updated);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Manter Todas Existentes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated: Record<number, 'keep_existing' | 'overwrite_with_excel' | 'skip'> = {};
                          validationResult.conflictRows.forEach((r) => (updated[r.rowNumber] = 'overwrite_with_excel'));
                          setConflictDecisions(updated);
                        }}
                        className="px-2.5 py-1 bg-[#034AA6] hover:bg-[#022859] text-white rounded-lg text-[10px] font-bold cursor-pointer shadow-sm"
                      >
                        Substituir Todas pelo Excel
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {validationResult.conflictRows.map((cRow) => {
                      const currentDecision = conflictDecisions[cRow.rowNumber] || 'keep_existing';
                      const existing = cRow.matchedExistingRule;

                      return (
                        <div
                          key={cRow.rowNumber}
                          className="p-3 bg-white border border-amber-200 rounded-xl text-xs space-y-2 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-[#022859]">
                              <span>Linha #{cRow.rowNumber} ({cRow.sheetName}): </span>
                              <strong>{cRow.bancoNome}</strong> • {cRow.produtoNome} • {cRow.convenioNome} ({cRow.prazoMin}-{cRow.prazoMax}x)
                            </div>

                            {/* Decision selector */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setConflictDecisions({ ...conflictDecisions, [cRow.rowNumber]: 'keep_existing' })}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  currentDecision === 'keep_existing'
                                    ? 'bg-slate-700 text-white font-extrabold shadow-sm'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                [Manter Existente]
                              </button>
                              <button
                                type="button"
                                onClick={() => setConflictDecisions({ ...conflictDecisions, [cRow.rowNumber]: 'overwrite_with_excel' })}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  currentDecision === 'overwrite_with_excel'
                                    ? 'bg-[#034AA6] text-white font-extrabold shadow-sm'
                                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                                }`}
                              >
                                [Substituir pela Regra do Excel]
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] bg-amber-50/60 p-2 rounded-lg border border-amber-200">
                            <div>
                              <span className="text-[10px] font-extrabold text-slate-600 block">Regra Existente no CRM:</span>
                              <span className="font-bold text-slate-800">
                                Banco: {existing?.valor_comissao_banco ?? existing?.valor_comissao}% | Vendedor: {existing?.valor_comissao_vendedor}%
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-extrabold text-[#034AA6] block">Regra do Arquivo Excel:</span>
                              <span className="font-bold text-[#034AA6]">
                                Banco: {cRow.valorComissaoBanco}% | Vendedor: {cRow.valorComissaoVendedor}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* IMPORT MODE SELECTION */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="block text-xs font-bold text-[#022859]">
                  Modo de Importação:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    onClick={() => setImportMode('add')}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      importMode === 'add'
                        ? 'bg-white border-[#034AA6] ring-2 ring-[#034AA6]/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-100/60 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-extrabold text-[#022859]">
                      <input
                        type="radio"
                        checked={importMode === 'add'}
                        onChange={() => setImportMode('add')}
                        className="text-[#034AA6]"
                      />
                      <span>Adicionar às regras existentes (Incremental)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 pl-5">
                      Adiciona regras novas, ignora duplicadas automaticamente e respeita as decisões de conflito. Nunca sobrescreve silenciosamente.
                    </p>
                  </div>

                  <div
                    onClick={() => setImportMode('overwrite')}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      importMode === 'overwrite'
                        ? 'bg-white border-[#034AA6] ring-2 ring-[#034AA6]/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-100/60 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-extrabold text-[#022859]">
                      <input
                        type="radio"
                        checked={importMode === 'overwrite'}
                        onChange={() => setImportMode('overwrite')}
                        className="text-[#034AA6]"
                      />
                      <span>Substituir regras dos bancos selecionados</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 pl-5">
                      Exige confirmação explícita. Remove regras anteriores dos bancos na planilha e gera backup lógico completo na auditoria.
                    </p>
                  </div>
                </div>
              </div>

              {/* TABLE PREVIEW & FILTER */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <button
                      onClick={() => setPreviewFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        previewFilter === 'all'
                          ? 'bg-[#034AA6] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Todas ({validationResult.totalRows})
                    </button>
                    <button
                      onClick={() => setPreviewFilter('new')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        previewFilter === 'new'
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      Novas ({validationResult.newValidRows.length})
                    </button>
                    <button
                      onClick={() => setPreviewFilter('conflict')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        previewFilter === 'conflict'
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      Conflitos ({validationResult.conflictRows.length})
                    </button>
                    <button
                      onClick={() => setPreviewFilter('duplicate')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        previewFilter === 'duplicate'
                          ? 'bg-blue-700 text-white shadow-sm'
                          : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                      }`}
                    >
                      Duplicadas ({validationResult.duplicateRows.length})
                    </button>
                    <button
                      onClick={() => setPreviewFilter('invalid')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        previewFilter === 'invalid'
                          ? 'bg-rose-700 text-white shadow-sm'
                          : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                      }`}
                    >
                      Com Erro ({validationResult.invalidRows.length})
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Mostrando <strong>{displayedRows.length}</strong> de {validationResult.totalRows} linhas
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#022859] text-white text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10">
                        <th className="p-2.5">Linha / Aba</th>
                        <th className="p-2.5">Banco & Produto</th>
                        <th className="p-2.5">Convênio</th>
                        <th className="p-2.5">Prazo</th>
                        <th className="p-2.5">Faixa Valor</th>
                        <th className="p-2.5">Comissão Banco</th>
                        <th className="p-2.5">Comissão Vendedor</th>
                        <th className="p-2.5 text-center">Status / Validação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {displayedRows.length > 0 ? (
                        displayedRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50 transition-colors ${
                              row.statusTag === 'DUPLICADA'
                                ? 'bg-blue-50/30'
                                : row.statusTag === 'CONFLITO'
                                ? 'bg-amber-50/40'
                                : !row.isValid
                                ? 'bg-rose-50/40'
                                : ''
                            }`}
                          >
                            <td className="p-2.5 font-mono text-slate-500">
                              <span className="font-bold text-[#022859]">L#{row.rowNumber}</span>
                              <span className="text-[10px] block text-slate-400">({row.sheetName})</span>
                            </td>

                            <td className="p-2.5">
                              <p className="font-extrabold text-[#022859]">{row.bancoNome}</p>
                              <p className="text-slate-600">{row.produtoNome}</p>
                            </td>

                            <td className="p-2.5 text-slate-700">
                              {row.convenioNome ? (
                                <span>{row.convenioNome}</span>
                              ) : (
                                <span className="text-slate-400 italic">Todos os convênios</span>
                              )}
                            </td>

                            <td className="p-2.5 font-semibold text-slate-800">
                              {row.prazoMin} a {row.prazoMax} m
                            </td>

                            <td className="p-2.5 text-slate-700 font-mono">
                              R$ {row.valorMin.toLocaleString('pt-BR')} - {row.valorMax.toLocaleString('pt-BR')}
                            </td>

                            <td className="p-2.5 font-extrabold text-[#034AA6]">
                              {row.tipoComissaoBanco === 'PERCENTUAL'
                                ? `${row.valorComissaoBanco}%`
                                : `R$ ${row.valorComissaoBanco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </td>

                            <td className="p-2.5 font-extrabold text-[#F28907]">
                              {row.tipoComissaoVendedor === 'PERCENTUAL_DO_BANCO'
                                ? `${row.valorComissaoVendedor}% Banco`
                                : row.tipoComissaoVendedor === 'PERCENTUAL_DA_OPERACAO'
                                ? `${row.valorComissaoVendedor}% Op`
                                : `R$ ${row.valorComissaoVendedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </td>

                            <td className="p-2.5 text-center">
                              {row.statusTag === 'NOVA' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  Nova Regra
                                </span>
                              )}

                              {row.statusTag === 'DUPLICADA' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300" title="DUPLICADA — já cadastrada no CRM e não será importada.">
                                  <Info className="w-3 h-3 text-[#034AA6]" />
                                  DUPLICADA
                                </span>
                              )}

                              {row.statusTag === 'CONFLITO' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300" title={row.conflictInfo?.diffDescription}>
                                  <AlertTriangle className="w-3 h-3 text-amber-700" />
                                  CONFLITO
                                </span>
                              )}

                              {!row.isValid && (
                                <div className="space-y-0.5 text-left max-w-xs">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    <X className="w-3 h-3 text-rose-600" />
                                    Inválida
                                  </span>
                                  {row.errors.map((err, errIdx) => (
                                    <p key={errIdx} className="text-[10px] text-rose-700 font-medium">
                                      • {err}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-500 italic">
                            Nenhuma linha encontrada para o filtro selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS RESULT */}
          {step === 'success' && importExecutionResult && (
            <div className="py-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-[#022859]">
                  Importação Executada com Sucesso!
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  A transação foi concluída com integridade relacional, proteção contra duplicidades e auditoria gravada.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto text-xs">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Regras Inseridas</span>
                  <span className="text-2xl font-black text-emerald-700">{importExecutionResult.importedCount}</span>
                </div>

                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-900 uppercase block">Conflitos Atualizados</span>
                  <span className="text-2xl font-black text-amber-800">{importExecutionResult.updatedConflictsCount}</span>
                </div>

                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Duplicadas Ignoradas</span>
                  <span className="text-2xl font-black text-[#034AA6]">{importExecutionResult.skippedDuplicatesCount}</span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">Bancos Atualizados</span>
                  <span className="text-2xl font-black text-[#022859]">{importExecutionResult.overwrittenBanks.length}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 max-w-xl mx-auto">
                Bancos processados: <strong>{importExecutionResult.overwrittenBanks.join(', ')}</strong>
                {importExecutionResult.backupSnapshotId && (
                  <span className="block text-[10px] text-emerald-700 font-semibold mt-0.5">
                    • Backup Lógico registrado sob ID: #{importExecutionResult.backupSnapshotId}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            {step === 'preview' && (
              <button
                onClick={() => {
                  setStep('select');
                  setSelectedFile(null);
                  setValidationResult(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Voltar e Escolher Outro Arquivo
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step !== 'success' ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>

                {step === 'preview' && validationResult && (
                  <button
                    onClick={handleInitiateImport}
                    disabled={isImporting || validationResult.validRows.length === 0}
                    className={`px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                      validationResult.validRows.length > 0 && !isImporting
                        ? 'bg-[#034AA6] hover:bg-[#022859] text-white'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#F2B807]" />
                        <span>Processando Transação...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#F2B807]" />
                        <span>
                          {importMode === 'overwrite'
                            ? 'Substituir Regras dos Bancos...'
                            : `Importar ${validationResult.newValidRows.length + Object.values(conflictDecisions).filter((d) => d === 'overwrite_with_excel').length} Regras Válidas`}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#034AA6] hover:bg-[#022859] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Concluir e Ver Regras no CRM
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRM OVERWRITE MODAL */}
      {isConfirmOverwriteOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border-2 border-[#034AA6] p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-amber-100 rounded-xl text-amber-800">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-[#022859]">
                  Confirmação de Substituição
                </h4>
                <p className="text-xs text-slate-500">Transação com Backup Lógico Automático</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2 text-amber-900">
              <p className="font-extrabold">
                Serão substituídas {existingRulesCountForBanksInFile} regras existentes dos bancos selecionados:
              </p>
              <p className="font-bold text-[#034AA6] bg-white p-2 rounded-lg border border-amber-300">
                {banksInFile.join(', ')}
              </p>
              <p className="text-[11px] text-slate-600">
                • Todas as regras anteriores destes bancos serão arquivadas no log de auditoria com backup serializado antes da substituição.
                <br />
                • Caso ocorra qualquer falha, o sistema fará ROLLBACK automático.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOverwriteOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeImportProcess}
                className="px-4 py-2 bg-[#034AA6] hover:bg-[#022859] text-white text-xs font-black rounded-xl shadow-md cursor-pointer"
              >
                Confirmar Substituição com Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK CREATE BANK POPUP */}
      {isQuickBankOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="text-sm font-extrabold text-[#022859] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#034AA6]" />
              Cadastrar Banco Parceiro
            </h4>
            <p className="text-xs text-slate-600">
              Cadastre o banco no CRM para liberar a validação da planilha:
            </p>
            <input
              type="text"
              value={quickBankName}
              onChange={(e) => setQuickBankName(e.target.value)}
              placeholder="Nome do Banco (ex: Banco Safra)"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsQuickBankOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleCreateQuickBank(quickBankName)}
                disabled={isCreatingBank || !quickBankName.trim()}
                className="px-4 py-1.5 bg-[#034AA6] hover:bg-[#022859] text-white text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                {isCreatingBank ? 'Cadastrando...' : 'Cadastrar e Revalidar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK CREATE PRODUCT POPUP */}
      {quickProductInfo && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="text-sm font-extrabold text-[#022859] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#034AA6]" />
              Cadastrar Produto para {quickProductInfo.bancoNome}
            </h4>
            <p className="text-xs text-slate-600">
              Confirme a criação da modalidade de crédito para o banco parceiro:
            </p>
            <input
              type="text"
              value={quickProductInfo.produtoNome}
              onChange={(e) => setQuickProductInfo({ ...quickProductInfo, produtoNome: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setQuickProductInfo(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleCreateQuickProduct(quickProductInfo.bancoNome, quickProductInfo.produtoNome)}
                disabled={isCreatingProduct || !quickProductInfo.produtoNome.trim()}
                className="px-4 py-1.5 bg-[#034AA6] hover:bg-[#022859] text-white text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                {isCreatingProduct ? 'Cadastrando...' : 'Cadastrar e Revalidar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK CREATE AGREEMENT POPUP */}
      {quickAgreeInfo && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="text-sm font-extrabold text-[#022859] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#034AA6]" />
              Cadastrar Convênio para {quickAgreeInfo.produtoNome}
            </h4>
            <p className="text-xs text-slate-600">
              Confirme a criação do convênio para o produto do banco {quickAgreeInfo.bancoNome}:
            </p>
            <input
              type="text"
              value={quickAgreeInfo.convenioNome}
              onChange={(e) => setQuickAgreeInfo({ ...quickAgreeInfo, convenioNome: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034AA6]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setQuickAgreeInfo(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleCreateQuickAgreement(quickAgreeInfo.bancoNome, quickAgreeInfo.produtoNome, quickAgreeInfo.convenioNome)}
                disabled={isCreatingAgree || !quickAgreeInfo.convenioNome.trim()}
                className="px-4 py-1.5 bg-[#034AA6] hover:bg-[#022859] text-white text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                {isCreatingAgree ? 'Cadastrando...' : 'Cadastrar e Revalidar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
