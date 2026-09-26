export type UserRole = 'Administrador' | 'Supervisor' | 'Vendedor';

export type UserStatus = 'Ativo' | 'Inativo';

export type PermissionKey =
  // Vendas
  | 'visualizar_leads'
  | 'criar_lead'
  | 'criar_leads'
  | 'editar_lead'
  | 'editar_leads'
  | 'excluir_leads'
  | 'distribuir_leads'
  | 'converter_lead'
  | 'visualizar_clientes'
  | 'criar_cliente'
  | 'criar_clientes'
  | 'editar_cliente'
  | 'editar_clientes'
  | 'excluir_clientes'
  | 'visualizar_oportunidades'
  | 'criar_oportunidade'
  | 'criar_oportunidades'
  | 'editar_oportunidade'
  | 'editar_oportunidades'
  | 'excluir_oportunidades'
  | 'visualizar_kanban'
  | 'mover_kanban'
  | 'virar_contrato'
  | 'visualizar_vendas_equipe'
  // Comissões
  | 'visualizar_comissoes_previstas'
  | 'visualizar_comissoes_aprovadas'
  | 'editar_comissao'
  | 'aprovar_comissao'
  | 'rejeitar_comissao'
  | 'devolver_comissao'
  | 'visualizar_comissoes'
  | 'calcular_previa_comissao'
  | 'gerenciar_regras_comissao'
  | 'importar_regras_comissao'
  // Financeiro
  | 'visualizar_financeiro'
  | 'visualizar_despesas'
  | 'visualizar_lucro'
  | 'gerenciar_receitas'
  | 'registrar_recebimento'
  | 'gerenciar_custos_operacionais'
  // Equipe
  | 'visualizar_usuarios'
  | 'criar_usuario'
  | 'editar_usuario'
  | 'gerenciar_permissoes'
  // Configurações
  | 'acessar_configuracoes'
  | 'gerenciar_bancos'
  | 'gerenciar_produtos'
  // Fase 3 - Bancos, Produtos, Convênios e Regras de Comissão
  | 'visualizar_bancos'
  | 'criar_banco'
  | 'editar_banco'
  | 'ativar_banco'
  | 'visualizar_produtos'
  | 'criar_produto'
  | 'editar_produto'
  | 'ativar_produto'
  | 'visualizar_convenios'
  | 'criar_convenio'
  | 'editar_convenio'
  | 'ativar_convenio'
  | 'visualizar_regras_comissao'
  | 'criar_regra_comissao'
  | 'editar_regra_comissao'
  | 'excluir_regra_comissao'
  // Central de Ajuda & Treinamento
  | 'visualizar_treinamentos'
  | 'gerenciar_treinamentos'
  // Entrada de Leads - Fase 7.1
  | 'visualizar_integracao_leads'
  | 'configurar_integracao_leads'
  | 'distribuir_leads_fila'
  // WhatsApp - Fase 7.2
  | 'visualizar_whatsapp'
  | 'visualizar_conversas_whatsapp'
  | 'atender_whatsapp'
  | 'enviar_mensagem_whatsapp'
  | 'transferir_conversa_whatsapp'
  | 'assumir_conversa_whatsapp'
  | 'visualizar_numeros_whatsapp'
  | 'configurar_numeros_whatsapp'
  | 'configurar_integracao_whatsapp'
  | 'gerenciar_atendentes_whatsapp'
  | 'gerenciar_respostas_rapidas'
  | 'visualizar_historico_whatsapp'
  | 'visualizar_auditoria_whatsapp';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  category: 'vendas' | 'comissoes' | 'financeiro' | 'equipe' | 'configuracoes';
}

export interface User {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  whatsapp: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  supervisor_id?: string | null;
  supervisor_name?: string | null;
  created_at: string;
  updated_at: string;
  permissions?: Partial<Record<PermissionKey, boolean>>;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  module: string;
  record_id?: string | null;
  description: string;
  ip_address: string;
  created_at: string;
}

// ------------------------------------
// FASE 2 TYPES - LEADS, CLIENTS, OPPORTUNITIES
// ------------------------------------

export type LeadStatus =
  | 'Novo'
  | 'Em contato'
  | 'Qualificado'
  | 'Sem interesse'
  | 'Convertido'
  | 'Perdido';

export type LeadSource =
  | 'Facebook'
  | 'Instagram'
  | 'Google'
  | 'WhatsApp'
  | 'Indicação'
  | 'Site'
  | 'Cadastro manual'
  | 'Google Sheets'
  | 'Outros';

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cpf: string;
  cidade: string;
  estado: string;
  origem: LeadSource;
  campanha?: string;
  anuncio?: string;
  produto_interesse: string;
  observacoes: string;
  vendedor_id: string;
  vendedor_nome: string;
  supervisor_id?: string | null;
  supervisor_nome?: string | null;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface LeadHistoryItem {
  id: string;
  lead_id: string;
  user_id: string;
  user_name: string;
  action: string;
  description: string;
  created_at: string;
}

export type ClientStatus = 'Ativo' | 'Inativo';

export interface Client {
  id: string;
  lead_id?: string | null;
  nome: string;
  cpf: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cidade: string;
  estado: string;
  observacoes: string;
  vendedor_id: string;
  vendedor_nome: string;
  supervisor_id?: string | null;
  supervisor_nome?: string | null;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
}

export type OpportunityStage =
  | 'Novo Lead'
  | 'Contato Realizado'
  | 'Qualificado'
  | 'Simulação'
  | 'Proposta'
  | 'Documentação'
  | 'Análise'
  | 'Aprovado'
  | 'Contrato'
  | 'Pago';

export type OpportunityStatus = 'Em andamento' | 'Aprovado' | 'Pago' | 'Cancelado';

export interface Opportunity {
  id: string;
  client_id: string;
  client_name: string;
  lead_id?: string | null;
  vendedor_id: string;
  vendedor_nome: string;
  supervisor_id?: string | null;
  supervisor_nome?: string | null;
  banco_id?: string;
  banco_nome: string;
  produto_id?: string;
  produto_nome: string;
  valor: number;
  prazo: number; // parcelas (meses)
  etapa: OpportunityStage;
  status: OpportunityStatus;
  observacoes: string;
  has_contract?: boolean;
  contract_id?: string | null;
  converted_at?: string | null;
  converted_by_user_id?: string | null;
  converted_by_user_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  numero_contrato: string;
  opportunity_id: string;
  client_id: string;
  client_name: string;
  client_cpf?: string;
  vendedor_id: string;
  vendedor_nome: string;
  supervisor_id?: string | null;
  supervisor_nome?: string | null;
  banco_id?: string;
  banco_nome: string;
  produto_id?: string;
  produto_nome: string;
  valor: number;
  prazo: number;
  status: 'Ativo' | 'Pago' | 'Cancelado';
  converted_by_user_id: string;
  converted_by_user_name: string;
  converted_at: string;
  created_at: string;
  updated_at: string;
}

export interface OpportunityHistoryItem {
  id: string;
  opportunity_id: string;
  user_id: string;
  user_name: string;
  from_etapa?: OpportunityStage | null;
  to_etapa: OpportunityStage;
  description: string;
  created_at: string;
}

export interface DashboardMetrics {
  leadsCount: number;
  opportunitiesCount: number;
  totalProduction: number;
  totalCommissions: number;
  totalProfit: number;
  newLeadsCount: number;
  inContactLeadsCount: number;
  inProgressOpsCount: number;
  approvedOpsCount: number;
  paidOpsCount: number;
}

export interface MenuItem {
  id: string;
  label: string;
  iconName: string;
  permission?: PermissionKey;
  isFuture?: boolean;
  phaseNote?: string;
  badge?: string;
}

// ------------------------------------
// FASE 3 TYPES - BANCOS, PRODUTOS, CONVÊNIOS E REGRAS
// ------------------------------------

export type BankStatus = 'Ativo' | 'Inativo';

export interface Bank {
  id: string;
  nome: string;
  codigo_bancario: string;
  cnpj: string;
  status: BankStatus;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export type ProductStatus = 'Ativo' | 'Inativo';

export interface Product {
  id: string;
  banco_id: string;
  banco_nome: string;
  nome: string;
  codigo_produto: string;
  descricao: string;
  status: ProductStatus;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export type AgreementStatus = 'Ativo' | 'Inativo';

export interface Agreement {
  id: string;
  banco_id: string;
  banco_nome: string;
  produto_id: string;
  produto_nome: string;
  nome: string;
  codigo_convenio: string;
  status: AgreementStatus;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export type CommissionType = 'FIXA' | 'PERCENTUAL';
export type SellerCommissionType = 'PERCENTUAL_DO_BANCO' | 'PERCENTUAL_DA_OPERACAO' | 'FIXA';

export interface CommissionRule {
  id: string;
  banco_id: string;
  banco_nome: string;
  produto_id: string;
  produto_nome: string;
  convenio_id?: string | null;
  convenio_nome?: string | null;
  prazo_min: number;
  prazo_max: number;
  valor_min: number;
  valor_max: number;
  
  // Comissão do Banco (Empresa):
  tipo_comissao_banco: CommissionType;
  valor_comissao_banco: number; // Ex: 6.00 para 6% ou 350 para R$ 350,00
  
  // Comissão do Vendedor:
  tipo_comissao_vendedor: SellerCommissionType;
  valor_comissao_vendedor: number; // Ex: 50.00 para 50% do banco, 2.5 para 2.5% da op, ou 500 para R$ 500
  
  // Vigência opcional:
  data_inicio?: string | null;
  data_termino?: string | null;

  status: 'Ativa' | 'Inativa';
  observacoes: string;
  created_at: string;
  updated_at: string;

  // Aliases legados para retrocompatibilidade
  tipo_comissao?: CommissionType;
  valor_comissao?: number;
}

export interface CommissionPreview {
  opportunity_id?: string | null;
  contract_id?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  vendedor_id?: string | null;
  vendedor_nome?: string | null;
  banco_id: string;
  banco_nome: string;
  produto_id: string;
  produto_nome: string;
  convenio_id?: string | null;
  convenio_nome?: string | null;
  valor_operacao: number;
  prazo: number;

  matched: boolean;
  rule_id?: string | null;
  rule_summary?: string | null;

  // Calculados se matched === true:
  comissao_banco_tipo?: CommissionType;
  comissao_banco_taxa?: number;
  comissao_banco_valor: number;
  comissao_banco_descricao: string;

  comissao_vendedor_tipo?: SellerCommissionType;
  comissao_vendedor_taxa?: number;
  comissao_vendedor_valor: number;
  comissao_vendedor_descricao: string;

  resultado_empresa_valor: number; // comissao_banco - comissao_vendedor

  unmatched_criteria?: {
    banco_nome: string;
    produto_nome: string;
    convenio_nome?: string;
    valor: number;
    prazo: number;
  } | null;
}

export type CommissionStatus =
  | 'PENDENTE_APROVACAO'
  | 'APROVADA'
  | 'DEVOLVIDA_PARA_REVISAO';

export interface OperationCommission {
  id: string;
  opportunity_id?: string | null;
  contract_id?: string | null;
  numero_contrato?: string | null;
  client_id: string;
  client_name: string;
  vendedor_id: string;
  vendedor_nome: string;
  supervisor_id?: string | null;
  supervisor_nome?: string | null;

  banco_id: string;
  banco_nome: string;
  produto_id: string;
  produto_nome: string;
  convenio_id?: string | null;
  convenio_nome?: string | null;

  valor_operacao: number;
  prazo: number;

  comissao_banco_tipo: CommissionType;
  comissao_banco_taxa: number;
  comissao_banco_valor: number;

  comissao_vendedor_tipo: SellerCommissionType;
  comissao_vendedor_taxa: number;
  comissao_vendedor_valor: number;

  resultado_empresa_valor: number;

  rule_id?: string | null;
  status: CommissionStatus;

  motivo_devolucao?: string | null;
  motivo_rejeicao?: string | null; // alias compatibilidade
  observacoes?: string | null;

  approved_at?: string | null;
  approved_by_user_id?: string | null;
  approved_by_user_name?: string | null;

  returned_at?: string | null;
  returned_by_user_id?: string | null;
  returned_by_user_name?: string | null;

  rejected_at?: string | null;
  rejected_by_user_id?: string | null;
  rejected_by_user_name?: string | null;

  comissao_vendedor_status?: 'PAGO' | 'PENDENTE';
  comissao_vendedor_data_pagamento?: string | null;

  created_at: string;
  updated_at: string;
}

export interface CommissionStatusHistory {
  id: string;
  commission_id: string;
  user_id: string;
  user_name: string;
  from_status?: CommissionStatus | null;
  to_status: CommissionStatus;
  description: string;
  created_at: string;
}

// ==========================================
// TIPOS DA IMPORTAÇÃO DE REGRAS POR EXCEL (FASE 4 - PARTE 2)
// ==========================================

export interface ExcelSheetInfo {
  sheetName: string;
  rowCount: number;
  validRowsCount: number;
  invalidRowsCount: number;
}

export interface RuleConflictInfo {
  existingRule: CommissionRule;
  diffDescription: string;
  action: 'keep_existing' | 'overwrite_with_excel' | 'skip';
}

export interface ParsedExcelRuleRow {
  rowNumber: number;
  sheetName: string;
  bancoRaw: string;
  produtoRaw: string;
  convenioRaw?: string;
  prazoRaw?: string | number;
  prazoMinRaw?: string | number;
  prazoMaxRaw?: string | number;
  valorMinRaw?: string | number;
  valorMaxRaw?: string | number;
  tipoComissaoBancoRaw?: string;
  comissaoBancoRaw?: string | number;
  tipoComissaoVendedorRaw?: string;
  comissaoVendedorRaw?: string | number;
  vigenciaInicioRaw?: string;
  vigenciaFimRaw?: string;
  observacoesRaw?: string;

  // Normalized / Resolved Fields
  bancoId?: string;
  bancoNome?: string;
  produtoId?: string;
  produtoNome?: string;
  convenioId?: string | null;
  convenioNome?: string | null;
  prazoMin: number;
  prazoMax: number;
  valorMin: number;
  valorMax: number;
  tipoComissaoBanco: CommissionType;
  valorComissaoBanco: number;
  tipoComissaoVendedor: SellerCommissionType;
  valorComissaoVendedor: number;
  dataInicio?: string | null;
  dataTermino?: string | null;
  observacoes?: string;

  // Validation, Duplicity & Conflict
  isValid: boolean;
  isDuplicate: boolean;
  hasConflict: boolean;
  statusTag: 'NOVA' | 'DUPLICADA' | 'CONFLITO' | 'INVALIDA' | 'ENTIDADE_INEXISTENTE';
  matchedExistingRule?: CommissionRule;
  conflictInfo?: RuleConflictInfo;
  errors: string[];
  warnings: string[];
}

export interface ExcelImportValidationResult {
  fileName: string;
  fileSize: number;
  totalSheets: number;
  sheets: ExcelSheetInfo[];
  totalRows: number;
  validRows: ParsedExcelRuleRow[];
  invalidRows: ParsedExcelRuleRow[];
  duplicateRows: ParsedExcelRuleRow[];
  conflictRows: ParsedExcelRuleRow[];
  newValidRows: ParsedExcelRuleRow[];
  unresolvedBanks: string[];
  unresolvedProducts: { banco: string; produto: string }[];
  unresolvedAgreements: { banco: string; produto: string; convenio: string }[];
}

export interface ExcelImportExecutionResult {
  importedCount: number;
  updatedConflictsCount: number;
  skippedDuplicatesCount: number;
  overwrittenBanks: string[];
  createdRules: CommissionRule[];
  backupSnapshotId?: string;
  timestamp: string;
}

// ==========================================
// FASE 5 - FINANCEIRO | PARTE 1
// CONTROLE FINANCEIRO, RECEITAS E CUSTOS OPERACIONAIS
// ==========================================

export type FinancialRevenueStatus =
  | 'PREVISTA'
  | 'RECEBIDA'
  | 'RECEBIDA_PARCIALMENTE'
  | 'ATRASADA'
  | 'CANCELADA';

export interface FinancialRevenueReceipt {
  id: string;
  financial_revenue_id: string;
  amount: number;
  received_date: string;
  reference?: string | null;
  notes?: string | null;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

export interface FinancialRevenue {
  id: string;
  operation_commission_id?: string | null;
  opportunity_id: string;
  opportunity_title?: string | null;
  contract_id?: string | null;
  contract_numero?: string | null;
  client_id?: string | null;
  client_nome?: string | null;
  bank_id: string;
  bank_nome: string;
  product_id: string;
  product_nome: string;
  agreement_id?: string | null;
  agreement_nome?: string | null;
  seller_id: string;
  seller_nome: string;
  supervisor_id?: string | null;
  supervisor_nome?: string | null;
  description: string;
  expected_amount: number;
  received_amount: number;
  difference_amount: number;
  expected_date: string;
  received_date?: string | null;
  status: FinancialRevenueStatus;
  notes?: string | null;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  receipts?: FinancialRevenueReceipt[];
}

export type OperationalCostCategory =
  | 'CONSULTA_BUREAU'
  | 'MOTOBOY_LOGISTICA'
  | 'CERTIDAO_CARTORIO'
  | 'TAXA_AVERBACAO_EMISSAO'
  | 'TAXA_BANCARIA_TED'
  | 'OUTRO';

export type OperationalCostStatus = 'PAGO' | 'PENDENTE';

export interface FinancialOperationalCost {
  id: string;
  opportunity_id?: string | null;
  opportunity_title?: string | null;
  contract_id?: string | null;
  contract_numero?: string | null;
  client_id?: string | null;
  client_nome?: string | null;
  bank_id?: string | null;
  bank_nome?: string | null;
  category: OperationalCostCategory;
  description: string;
  amount: number;
  date: string;
  status: OperationalCostStatus;
  payment_date?: string | null;
  notes?: string | null;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialOverviewSummary {
  totalExpectedRevenue: number;
  totalReceivedRevenue: number;
  totalPendingRevenue: number;
  totalDelayedRevenue: number;
  totalOperationalCosts: number;
  paidOperationalCosts: number;
  pendingOperationalCosts: number;
  netOperationalGross: number; // Received Revenues - Paid Costs
  projectedGross: number; // Expected Revenues - Total Costs
  
  // FASE 5 - PARTE 2: DESPESAS GERAIS, PAGAMENTO DE COMISSÕES E DRE
  totalGeneralExpenses: number;
  paidGeneralExpenses: number;
  pendingGeneralExpenses: number;
  totalSellerCommissions: number;
  paidSellerCommissions: number;
  pendingSellerCommissions: number;
  netProfit: number; // Lucro Líquido Realizado
  projectedNetProfit: number; // Lucro Líquido Projetado
  profitability: number; // Rentabilidade Realizada (%)
  projectedProfitability: number; // Rentabilidade Projetada (%)
}

export type GeneralExpenseCategory =
  | 'ALUGUEL'
  | 'TELEFONE'
  | 'INTERNET'
  | 'TRAFEGO_PAGO'
  | 'SALARIOS'
  | 'COMISSOES_VENDEDORES'
  | 'FERRAMENTAS'
  | 'CONTABILIDADE'
  | 'HOSPEDAGEM'
  | 'MATERIAL_ESCRITORIO'
  | 'OUTROS';

export type GeneralExpenseStatus = 'PAGO' | 'PENDENTE' | 'CANCELADO';

export interface FinancialGeneralExpense {
  id: string;
  category: GeneralExpenseCategory;
  description: string;
  amount: number;
  due_date: string;
  status: GeneralExpenseStatus;
  payment_date?: string | null;
  notes?: string | null;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ==========================================
// FASE 6 - CENTRAL DE AJUDA E TREINAMENTO
// ==========================================

export type TrainingContentType =
  | 'VIDEO'
  | 'PDF'
  | 'MANUAL'
  | 'FAQ'
  | 'SCRIPT'
  | 'PROCEDIMENTO'
  | 'COMUNICADO'
  | 'ARTIGO';

export type TrainingContentStatus = 'ATIVO' | 'INATIVO';

export interface TrainingContent {
  id: string;
  title: string;
  description: string;
  content_type: TrainingContentType;
  category: string; // Ex: 'Básico', 'Banco', 'Vendas', etc.
  bank_id?: string | null;
  bank_nome?: string | null;
  product_id?: string | null;
  product_nome?: string | null;
  video_url?: string | null;
  file_url?: string | null;
  thumbnail_url?: string | null;
  content_body?: string | null;
  status: TrainingContentStatus;
  featured: boolean;
  required: boolean;
  order_index: number;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ==========================================
// FASE 7.1 - INTEGRACAO GOOGLE SHEETS LEADS
// ==========================================

export interface GoogleSheetsConfig {
  spreadsheet_id: string;
  sheet_name: string;
  col_id: string;
  col_name: string;
  col_phone: string;
  col_email: string;
  col_city: string;
  col_product: string;
  col_campaign: string;
  col_ad: string;
}

export interface LeadSyncResult {
  last_sync: string | null;
  next_sync: string | null;
  connection_status: 'CONNECTED' | 'DISCONNECTED';
  leads_imported_today: number;
  leads_waiting_distribution: number;
  duplicate_leads: number;
  sync_errors: number;
}

// ==========================================
// FASE 7.2 - PREPARAÇÃO DA INTEGRAÇÃO WAME API
// ==========================================

export interface WhatsAppNumber {
  id: string;
  nome: string;
  telefone: string;
  identificador_externo?: string;
  provedor: 'WAME';
  status: 'ativo' | 'inativo' | 'aguardando_configuracao';
  ativo: boolean;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppIntegration {
  id: string;
  provider: 'WAME';
  api_base_url: string;
  account_identifier: string;
  status: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppAttendant {
  id: string;
  user_id: string;
  user_name?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConversation {
  id: string;
  whatsapp_number_id: string;
  lead_id?: string | null;
  client_id?: string | null;
  telefone: string;
  nome_contato: string;
  status: 'Aguardando atendimento' | 'Em atendimento' | 'Aguardando cliente' | 'Resolvido' | 'Encerrado';
  current_attendant_id?: string | null;
  last_message_text?: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppTransfer {
  id: string;
  conversation_id: string;
  from_user_id?: string | null;
  to_user_id?: string | null;
  transferred_by_user_id: string;
  motivo?: string;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  external_message_id?: string;
  direction: 'inbound' | 'outbound';
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'other';
  message_text: string;
  media_url?: string;
  sender_phone?: string;
  sender_user_id?: string;
  status: 'received' | 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sent_at: string;
  created_at: string;
}

export interface WhatsAppInternalNote {
  id: string;
  conversation_id: string;
  user_id: string;
  user_name?: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppQuickReply {
  id: string;
  titulo: string;
  mensagem: string;
  categoria: string;
  ativo: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}






