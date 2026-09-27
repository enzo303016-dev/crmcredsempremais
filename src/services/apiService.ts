import {
  User,
  AuditLog,
  UserRole,
  PermissionKey,
  UserStatus,
  Lead,
  LeadStatus,
  LeadSource,
  LeadHistoryItem,
  Client,
  ClientStatus,
  Opportunity,
  OpportunityStage,
  OpportunityStatus,
  OpportunityHistoryItem,
  Contract,
  Bank,
  Product,
  Agreement,
  CommissionRule,
  CommissionPreview,
  OperationCommission,
  CommissionStatusHistory,
  CommissionStatus,
  SellerCommissionType,
  ParsedExcelRuleRow,
  ExcelImportExecutionResult,
  FinancialRevenue,
  FinancialRevenueStatus,
  FinancialRevenueReceipt,
  FinancialOperationalCost,
  OperationalCostCategory,
  OperationalCostStatus,
  FinancialOverviewSummary,
  FinancialGeneralExpense,
  GeneralExpenseCategory,
  GeneralExpenseStatus,
  TrainingContent,
  GoogleSheetsConfig,
  LeadSyncResult,
  WhatsAppNumber,
  WhatsAppIntegration,
  WhatsAppAttendant,
  WhatsAppConversation,
  WhatsAppTransfer,
  WhatsAppMessage,
  WhatsAppInternalNote,
  WhatsAppQuickReply,
} from '../types/crm';
import {
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
  ROLE_DEFAULT_PERMISSIONS,
  INITIAL_LEADS,
  INITIAL_CLIENTS,
  INITIAL_OPPORTUNITIES,
  INITIAL_LEAD_HISTORY,
  INITIAL_OPPORTUNITY_HISTORY,
  INITIAL_CONTRACTS,
  INITIAL_BANKS,
  INITIAL_PRODUCTS,
  INITIAL_AGREEMENTS,
  INITIAL_COMMISSION_RULES,
  INITIAL_OPERATION_COMMISSIONS,
  INITIAL_COMMISSION_STATUS_HISTORY,
  INITIAL_FINANCIAL_REVENUES,
  INITIAL_FINANCIAL_REVENUE_RECEIPTS,
  INITIAL_FINANCIAL_OPERATIONAL_COSTS,
  INITIAL_FINANCIAL_GENERAL_EXPENSES,
  INITIAL_HELP_CONTENTS,
} from '../data/seedData';

const USERS_STORAGE_KEY = 'credsempre_crm_users_v1';
const AUDIT_STORAGE_KEY = 'credsempre_crm_audit_v1';
const CURRENT_USER_KEY = 'credsempre_crm_session_v1';
const LEADS_STORAGE_KEY = 'credsempre_crm_leads_v1';
const CLIENTS_STORAGE_KEY = 'credsempre_crm_clients_v1';
const OPPORTUNITIES_STORAGE_KEY = 'credsempre_crm_opportunities_v1';
const LEAD_HISTORY_STORAGE_KEY = 'credsempre_crm_lead_history_v1';
const OPP_HISTORY_STORAGE_KEY = 'credsempre_crm_opp_history_v1';
const CONTRACTS_STORAGE_KEY = 'credsempre_crm_contracts_v1';
const BANKS_STORAGE_KEY = 'credsempre_crm_banks_v1';
const PRODUCTS_STORAGE_KEY = 'credsempre_crm_products_v1';
const AGREEMENTS_STORAGE_KEY = 'credsempre_crm_agreements_v1';
const COMMISSIONS_STORAGE_KEY = 'credsempre_crm_commissions_v1';
const OPERATION_COMMISSIONS_STORAGE_KEY = 'credsempre_crm_operation_commissions_v1';
const COMMISSION_HISTORIES_STORAGE_KEY = 'credsempre_crm_commission_histories_v1';
const FINANCIAL_REVENUES_STORAGE_KEY = 'credsempre_crm_financial_revenues_v1';
const FINANCIAL_RECEIPTS_STORAGE_KEY = 'credsempre_crm_financial_receipts_v1';
const FINANCIAL_COSTS_STORAGE_KEY = 'credsempre_crm_financial_costs_v1';
const FINANCIAL_EXPENSES_STORAGE_KEY = 'credsempre_crm_financial_expenses_v1';
const HELP_CONTENTS_STORAGE_KEY = 'credsempre_crm_help_contents_v1';
const SHEETS_CONFIG_STORAGE_KEY = 'credsempre_crm_sheets_config_v1';
const SHEETS_SYNC_STORAGE_KEY = 'credsempre_crm_sheets_sync_v1';

// WhatsApp keys
const WA_NUMBERS_KEY = 'credsempre_crm_wa_numbers_v1';
const WA_INTEGRATIONS_KEY = 'credsempre_crm_wa_integrations_v1';
const WA_ATTENDANTS_KEY = 'credsempre_crm_wa_attendants_v1';
const WA_CONVERSATIONS_KEY = 'credsempre_crm_wa_conversations_v1';
const WA_MESSAGES_KEY = 'credsempre_crm_wa_messages_v1';
const WA_TRANSFERS_KEY = 'credsempre_crm_wa_transfers_v1';
const WA_NOTES_KEY = 'credsempre_crm_wa_notes_v1';
const WA_QUICK_REPLIES_KEY = 'credsempre_crm_wa_quick_replies_v1';

class ApiService {
  private users: User[] = [];
  private auditLogs: AuditLog[] = [];
  private leads: Lead[] = [];
  private clients: Client[] = [];
  private opportunities: Opportunity[] = [];
  private leadHistories: LeadHistoryItem[] = [];
  private oppHistories: OpportunityHistoryItem[] = [];
  private contracts: Contract[] = [];
  private banks: Bank[] = [];
  private products: Product[] = [];
  private agreements: Agreement[] = [];
  private commissionRules: CommissionRule[] = [];
  private operationCommissions: OperationCommission[] = [];
  private commissionHistories: CommissionStatusHistory[] = [];
  private financialRevenues: FinancialRevenue[] = [];
  private financialReceipts: FinancialRevenueReceipt[] = [];
  private financialCosts: FinancialOperationalCost[] = [];
  private financialExpenses: FinancialGeneralExpense[] = [];
  private helpContents: TrainingContent[] = [];
  private googleSheetsConfig: GoogleSheetsConfig | null = null;
  private leadSyncResult: LeadSyncResult | null = null;

  // WhatsApp - Fase 7.2
  private whatsappNumbers: WhatsAppNumber[] = [];
  private whatsappIntegrations: WhatsAppIntegration[] = [];
  private whatsappAttendants: WhatsAppAttendant[] = [];
  private whatsappConversations: WhatsAppConversation[] = [];
  private whatsappMessages: WhatsAppMessage[] = [];
  private whatsappTransfers: WhatsAppTransfer[] = [];
  private whatsappInternalNotes: WhatsAppInternalNote[] = [];
  private whatsappQuickReplies: WhatsAppQuickReply[] = [];

  constructor() {
    this.loadFromStorage();
    this.fetchGoogleSheetsConfig().catch(() => {});
  }

  private loadFromStorage(): void {
    try {
      // Users
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      this.users = storedUsers ? JSON.parse(storedUsers) : [...INITIAL_USERS];
      if (!storedUsers) this.saveUsersToStorage();

      // Audit Logs
      const storedAudit = localStorage.getItem(AUDIT_STORAGE_KEY);
      this.auditLogs = storedAudit ? JSON.parse(storedAudit) : [...INITIAL_AUDIT_LOGS];
      if (!storedAudit) this.saveAuditToStorage();

      // Leads
      const storedLeads = localStorage.getItem(LEADS_STORAGE_KEY);
      this.leads = storedLeads ? JSON.parse(storedLeads) : [...INITIAL_LEADS];
      if (!storedLeads) localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(this.leads));

      // Clients
      const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
      this.clients = storedClients ? JSON.parse(storedClients) : [...INITIAL_CLIENTS];
      if (!storedClients) localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(this.clients));

      // Opportunities
      const storedOpps = localStorage.getItem(OPPORTUNITIES_STORAGE_KEY);
      this.opportunities = storedOpps ? JSON.parse(storedOpps) : [...INITIAL_OPPORTUNITIES];
      if (!storedOpps) localStorage.setItem(OPPORTUNITIES_STORAGE_KEY, JSON.stringify(this.opportunities));

      // Lead History
      const storedLHist = localStorage.getItem(LEAD_HISTORY_STORAGE_KEY);
      this.leadHistories = storedLHist ? JSON.parse(storedLHist) : [...INITIAL_LEAD_HISTORY];
      if (!storedLHist) localStorage.setItem(LEAD_HISTORY_STORAGE_KEY, JSON.stringify(this.leadHistories));

      // Opportunity History
      const storedOHist = localStorage.getItem(OPP_HISTORY_STORAGE_KEY);
      this.oppHistories = storedOHist ? JSON.parse(storedOHist) : [...INITIAL_OPPORTUNITY_HISTORY];
      if (!storedOHist) localStorage.setItem(OPP_HISTORY_STORAGE_KEY, JSON.stringify(this.oppHistories));

      // Contracts
      const storedCtr = localStorage.getItem(CONTRACTS_STORAGE_KEY);
      this.contracts = storedCtr ? JSON.parse(storedCtr) : [...INITIAL_CONTRACTS];
      if (!storedCtr) localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(this.contracts));

      // Banks
      const storedBanks = localStorage.getItem(BANKS_STORAGE_KEY);
      this.banks = storedBanks ? JSON.parse(storedBanks) : [...INITIAL_BANKS];
      if (!storedBanks) localStorage.setItem(BANKS_STORAGE_KEY, JSON.stringify(this.banks));

      // Products
      const storedProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      this.products = storedProds ? JSON.parse(storedProds) : [...INITIAL_PRODUCTS];
      if (!storedProds) localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(this.products));

      // Agreements
      const storedAgrees = localStorage.getItem(AGREEMENTS_STORAGE_KEY);
      this.agreements = storedAgrees ? JSON.parse(storedAgrees) : [...INITIAL_AGREEMENTS];
      if (!storedAgrees) localStorage.setItem(AGREEMENTS_STORAGE_KEY, JSON.stringify(this.agreements));

      // Commission Rules
      const storedRules = localStorage.getItem(COMMISSIONS_STORAGE_KEY);
      this.commissionRules = storedRules ? JSON.parse(storedRules) : [...INITIAL_COMMISSION_RULES];
      if (!storedRules) localStorage.setItem(COMMISSIONS_STORAGE_KEY, JSON.stringify(this.commissionRules));

      // Operation Commissions
      const storedOpComm = localStorage.getItem(OPERATION_COMMISSIONS_STORAGE_KEY);
      this.operationCommissions = storedOpComm ? JSON.parse(storedOpComm) : [...INITIAL_OPERATION_COMMISSIONS];
      if (!storedOpComm) localStorage.setItem(OPERATION_COMMISSIONS_STORAGE_KEY, JSON.stringify(this.operationCommissions));

      // Commission Histories
      const storedCHist = localStorage.getItem(COMMISSION_HISTORIES_STORAGE_KEY);
      this.commissionHistories = storedCHist ? JSON.parse(storedCHist) : [...INITIAL_COMMISSION_STATUS_HISTORY];
      if (!storedCHist) localStorage.setItem(COMMISSION_HISTORIES_STORAGE_KEY, JSON.stringify(this.commissionHistories));

      // Financial Revenues
      const storedRevenues = localStorage.getItem(FINANCIAL_REVENUES_STORAGE_KEY);
      this.financialRevenues = storedRevenues ? JSON.parse(storedRevenues) : [...INITIAL_FINANCIAL_REVENUES];
      if (!storedRevenues) localStorage.setItem(FINANCIAL_REVENUES_STORAGE_KEY, JSON.stringify(this.financialRevenues));

      // Financial Receipts
      const storedReceipts = localStorage.getItem(FINANCIAL_RECEIPTS_STORAGE_KEY);
      this.financialReceipts = storedReceipts ? JSON.parse(storedReceipts) : [...INITIAL_FINANCIAL_REVENUE_RECEIPTS];
      if (!storedReceipts) localStorage.setItem(FINANCIAL_RECEIPTS_STORAGE_KEY, JSON.stringify(this.financialReceipts));

      // Financial Costs
      const storedCosts = localStorage.getItem(FINANCIAL_COSTS_STORAGE_KEY);
      this.financialCosts = storedCosts ? JSON.parse(storedCosts) : [...INITIAL_FINANCIAL_OPERATIONAL_COSTS];
      if (!storedCosts) localStorage.setItem(FINANCIAL_COSTS_STORAGE_KEY, JSON.stringify(this.financialCosts));

      // Financial Expenses
      const storedExpenses = localStorage.getItem(FINANCIAL_EXPENSES_STORAGE_KEY);
      this.financialExpenses = storedExpenses ? JSON.parse(storedExpenses) : [...INITIAL_FINANCIAL_GENERAL_EXPENSES];
      if (!storedExpenses) localStorage.setItem(FINANCIAL_EXPENSES_STORAGE_KEY, JSON.stringify(this.financialExpenses));

      // Help Center & Trainings
      const storedHelp = localStorage.getItem(HELP_CONTENTS_STORAGE_KEY);
      this.helpContents = storedHelp ? JSON.parse(storedHelp) : [...INITIAL_HELP_CONTENTS];
      if (!storedHelp) localStorage.setItem(HELP_CONTENTS_STORAGE_KEY, JSON.stringify(this.helpContents));

      // Google Sheets Config
      const storedSheetsConfig = localStorage.getItem(SHEETS_CONFIG_STORAGE_KEY);
      this.googleSheetsConfig = storedSheetsConfig ? JSON.parse(storedSheetsConfig) : {
        spreadsheet_id: '1tYg9bU0f4vR79GzU3g6m8D9hH4B-8X9fK5z2wLmPqYs',
        sheet_name: 'Respostas do Formulário 1',
        col_id: 'id',
        col_name: 'nome_completo',
        col_phone: 'telefone',
        col_email: 'email',
        col_city: 'cidade',
        col_product: 'tipo_de_supletivo',
        col_campaign: 'campaign_name',
        col_ad: 'ad_name'
      };
      if (!storedSheetsConfig) localStorage.setItem(SHEETS_CONFIG_STORAGE_KEY, JSON.stringify(this.googleSheetsConfig));

      // Google Sheets Sync Result
      const storedSheetsSync = localStorage.getItem(SHEETS_SYNC_STORAGE_KEY);
      this.leadSyncResult = storedSheetsSync ? JSON.parse(storedSheetsSync) : {
        last_sync: null,
        next_sync: null,
        connection_status: 'DISCONNECTED',
        leads_imported_today: 0,
        leads_waiting_distribution: 0,
        duplicate_leads: 0,
        sync_errors: 0
      };
      if (!storedSheetsSync) localStorage.setItem(SHEETS_SYNC_STORAGE_KEY, JSON.stringify(this.leadSyncResult));

      // WhatsApp Numbers Seed
      const storedWANumbers = localStorage.getItem(WA_NUMBERS_KEY);
      this.whatsappNumbers = storedWANumbers ? JSON.parse(storedWANumbers) : [
        {
          id: 'num_1',
          nome: 'WhatsApp Comercial Principal',
          telefone: '5511999999999',
          identificador_externo: 'wame_main_01',
          provedor: 'WAME',
          status: 'ativo',
          ativo: true,
          observacoes: 'Canal de atendimento principal para vendas Cred Sempre +.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'num_2',
          nome: 'WhatsApp de Suporte Consignado',
          telefone: '5521888888888',
          identificador_externo: 'wame_support_02',
          provedor: 'WAME',
          status: 'ativo',
          ativo: true,
          observacoes: 'Suporte pós-venda e acompanhamento de averbação.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'num_3',
          nome: 'WhatsApp Financeiro',
          telefone: '5511777777777',
          identificador_externo: '',
          provedor: 'WAME',
          status: 'aguardando_configuracao',
          ativo: false,
          observacoes: 'Aguardando liberação de token pelo provedor Wame.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      if (!storedWANumbers) localStorage.setItem(WA_NUMBERS_KEY, JSON.stringify(this.whatsappNumbers));

      // WhatsApp Integrations Seed
      const storedWAIntegrations = localStorage.getItem(WA_INTEGRATIONS_KEY);
      this.whatsappIntegrations = storedWAIntegrations ? JSON.parse(storedWAIntegrations) : [
        {
          id: 'int_1',
          provider: 'WAME',
          api_base_url: 'https://api.wame.example.com/v1',
          account_identifier: 'credsempre_corporativo',
          status: 'CONECTADO',
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      if (!storedWAIntegrations) localStorage.setItem(WA_INTEGRATIONS_KEY, JSON.stringify(this.whatsappIntegrations));

      // WhatsApp Attendants Seed (N:N relationship - which attendant handles which number)
      const storedWAAttendants = localStorage.getItem(WA_ATTENDANTS_KEY);
      this.whatsappAttendants = storedWAAttendants ? JSON.parse(storedWAAttendants) : [
        {
          id: 'att_1',
          user_id: 'usr_vend_1', // João
          user_name: 'João Pedro Martins',
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'att_2',
          user_id: 'usr_vend_2', // Maria
          user_name: 'Maria Eduarda Santos',
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'att_3',
          user_id: 'usr_admin_1', // Admin
          user_name: 'Carlos Silva (Administrador Geral)',
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      if (!storedWAAttendants) localStorage.setItem(WA_ATTENDANTS_KEY, JSON.stringify(this.whatsappAttendants));

      // WhatsApp Conversations Seed
      const storedWAConversations = localStorage.getItem(WA_CONVERSATIONS_KEY);
      this.whatsappConversations = storedWAConversations ? JSON.parse(storedWAConversations) : [
        {
          id: 'conv_1',
          whatsapp_number_id: 'num_1',
          lead_id: 'lead_1',
          client_id: null,
          telefone: '5511981112222',
          nome_contato: 'Juliana Ribeiro de Castro',
          status: 'Em atendimento',
          current_attendant_id: 'usr_vend_1', // Attending by João
          last_message_text: 'Olá João! Já verifiquei a proposta e gostaria de prosseguir.',
          last_message_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'conv_2',
          whatsapp_number_id: 'num_1',
          lead_id: 'lead_2',
          client_id: null,
          telefone: '5521971113333',
          nome_contato: 'Roberto Albuquerque Neto',
          status: 'Em atendimento',
          current_attendant_id: 'usr_vend_2', // Attending by Maria
          last_message_text: 'Qual o prazo para o saque aniversário cair na conta?',
          last_message_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 min ago
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'conv_3',
          whatsapp_number_id: 'num_1',
          lead_id: 'lead_3',
          client_id: null,
          telefone: '5511940028922',
          nome_contato: 'Claudio Mendes de Souza',
          status: 'Aguardando atendimento', // Fila!
          current_attendant_id: null, // None yet
          last_message_text: 'Quero fazer a simulação do consignado do INSS, sou aposentado.',
          last_message_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 min ago
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'conv_4',
          whatsapp_number_id: 'num_2',
          lead_id: 'lead_4',
          client_id: null,
          telefone: '5511998871122',
          nome_contato: 'Aline de Oliveira Barros',
          status: 'Aguardando cliente',
          current_attendant_id: 'usr_vend_1', // Attending by João
          last_message_text: 'Encaminhei o PDF do contracheque, aguardo retorno.',
          last_message_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'conv_5',
          whatsapp_number_id: 'num_1',
          lead_id: 'lead_5',
          client_id: null,
          telefone: '5531961114444',
          nome_contato: 'Marcos de Souza Neves',
          status: 'Resolvido',
          current_attendant_id: 'usr_admin_1',
          last_message_text: 'Obrigado pelo atendimento rápido, Carlos!',
          last_message_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      if (!storedWAConversations) localStorage.setItem(WA_CONVERSATIONS_KEY, JSON.stringify(this.whatsappConversations));

      // WhatsApp Messages Seed
      const storedWAMessages = localStorage.getItem(WA_MESSAGES_KEY);
      this.whatsappMessages = storedWAMessages ? JSON.parse(storedWAMessages) : [
        // Conversation 1 (Juliana)
        {
          id: 'msg_1_1',
          conversation_id: 'conv_1',
          external_message_id: 'msg_ext_001',
          direction: 'inbound',
          message_type: 'text',
          message_text: 'Olá! Vi o anúncio da Cred Sempre + e gostaria de fazer uma simulação de margem do INSS.',
          sender_phone: '5511981112222',
          status: 'read',
          sent_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        },
        {
          id: 'msg_1_2',
          conversation_id: 'conv_1',
          external_message_id: 'msg_ext_002',
          direction: 'outbound',
          message_type: 'text',
          message_text: 'Olá Juliana! Sou o João, atendente responsável. Com certeza, vou simular as melhores taxas para você. Me confirma o seu CPF por gentileza?',
          sender_user_id: 'usr_vend_1',
          status: 'read',
          sent_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 55 * 60 * 1000).toISOString()
        },
        {
          id: 'msg_1_3',
          conversation_id: 'conv_1',
          external_message_id: 'msg_ext_003',
          direction: 'inbound',
          message_type: 'text',
          message_text: 'Olá João! Já verifiquei a proposta e gostaria de prosseguir.',
          sender_phone: '5511981112222',
          status: 'read',
          sent_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        // Conversation 2 (Roberto)
        {
          id: 'msg_2_1',
          conversation_id: 'conv_2',
          external_message_id: 'msg_ext_004',
          direction: 'inbound',
          message_type: 'text',
          message_text: 'Quero antecipar meu FGTS. Como funciona?',
          sender_phone: '5521971113333',
          status: 'read',
          sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'msg_2_2',
          conversation_id: 'conv_2',
          external_message_id: 'msg_ext_005',
          direction: 'outbound',
          message_type: 'text',
          message_text: 'Olá Roberto! Sou a Maria Eduarda, vou te auxiliar. Nós conseguimos antecipar até 10 parcelas do seu saque aniversário com taxas a partir de 1,49% a.m.',
          sender_user_id: 'usr_vend_2',
          status: 'read',
          sent_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'msg_2_3',
          conversation_id: 'conv_2',
          external_message_id: 'msg_ext_006',
          direction: 'inbound',
          message_type: 'text',
          message_text: 'Qual o prazo para o saque aniversário cair na conta?',
          sender_phone: '5521971113333',
          status: 'read',
          sent_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
        },
        // Conversation 3 (Claudio - Queue)
        {
          id: 'msg_3_1',
          conversation_id: 'conv_3',
          external_message_id: 'msg_ext_007',
          direction: 'inbound',
          message_type: 'text',
          message_text: 'Quero fazer a simulação do consignado do INSS, sou aposentado.',
          sender_phone: '5511940028922',
          status: 'received',
          sent_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString()
        }
      ];
      if (!storedWAMessages) localStorage.setItem(WA_MESSAGES_KEY, JSON.stringify(this.whatsappMessages));

      // WhatsApp Transfers Seed
      const storedWATransfers = localStorage.getItem(WA_TRANSFERS_KEY);
      this.whatsappTransfers = storedWATransfers ? JSON.parse(storedWATransfers) : [
        {
          id: 'tr_1',
          conversation_id: 'conv_1',
          from_user_id: null,
          to_user_id: 'usr_vend_1',
          transferred_by_user_id: 'usr_sup_1',
          motivo: 'Atendimento direcionado para fila comercial INSS.',
          created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString()
        }
      ];
      if (!storedWATransfers) localStorage.setItem(WA_TRANSFERS_KEY, JSON.stringify(this.whatsappTransfers));

      // WhatsApp Internal Notes Seed
      const storedWANotes = localStorage.getItem(WA_NOTES_KEY);
      this.whatsappInternalNotes = storedWANotes ? JSON.parse(storedWANotes) : [
        {
          id: 'note_1',
          conversation_id: 'conv_1',
          user_id: 'usr_vend_1',
          user_name: 'João Pedro Martins',
          note: 'Cliente muito interessada. Possui margem livre estimada em R$ 350,00. Aguardando formalização.',
          created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 40 * 60 * 1000).toISOString()
        }
      ];
      if (!storedWANotes) localStorage.setItem(WA_NOTES_KEY, JSON.stringify(this.whatsappInternalNotes));

      // WhatsApp Quick Replies Seed
      const storedWAQuickReplies = localStorage.getItem(WA_QUICK_REPLIES_KEY);
      this.whatsappQuickReplies = storedWAQuickReplies ? JSON.parse(storedWAQuickReplies) : [
        {
          id: 'qr_1',
          titulo: 'Saudação Inicial',
          mensagem: 'Olá! Seja muito bem-vindo à Cred Sempre +. Sou consultor de crédito e vou te apresentar as melhores oportunidades de empréstimo consignado ou saque FGTS hoje. Como posso te chamar?',
          categoria: 'Saudação',
          ativo: true,
          created_by: 'usr_admin_1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'qr_2',
          titulo: 'Documentos Necessários',
          mensagem: 'Para dar andamento à sua simulação e emitir seu contrato, preciso que me envie fotos nítidas dos seguintes documentos:\n1. RG ou CNH (Frente e Verso)\n2. Comprovante de Residência recente\n3. Extrato do benefício ou contracheque',
          categoria: 'Documentação',
          ativo: true,
          created_by: 'usr_admin_1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'qr_3',
          titulo: 'Simulação Realizada',
          mensagem: 'Excelente notícia! Sua simulação foi pré-aprovada com as seguintes condições:\n- Valor Liberado: R$ [VALOR_LIBERADO]\n- Valor da Parcela: R$ [PARCELA]\n- Taxa de Juros: [TAXA]% a.m.\n\nPodemos emitir o link de formalização digital?',
          categoria: 'Simulação',
          ativo: true,
          created_by: 'usr_admin_1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'qr_4',
          titulo: 'Acompanhamento do Link',
          mensagem: 'Olá! Passando para lembrar que o link de formalização digital do seu contrato foi enviado para o seu SMS/E-mail. Consegue acessar para fazermos a assinatura fácil por foto?',
          categoria: 'Acompanhamento',
          ativo: true,
          created_by: 'usr_admin_1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'qr_5',
          titulo: 'Agradecimento e Conclusão',
          mensagem: 'Perfeito! Seu contrato foi enviado para o banco e está em fase de averbação. O dinheiro deve cair em sua conta em poucas horas. Agradecemos a confiança na Cred Sempre +!',
          categoria: 'Encerramento',
          ativo: true,
          created_by: 'usr_admin_1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      if (!storedWAQuickReplies) localStorage.setItem(WA_QUICK_REPLIES_KEY, JSON.stringify(this.whatsappQuickReplies));
    } catch (e) {
      console.error('Erro ao carregar dados do localStorage:', e);
      this.users = [...INITIAL_USERS];
      this.auditLogs = [...INITIAL_AUDIT_LOGS];
      this.leads = [...INITIAL_LEADS];
      this.clients = [...INITIAL_CLIENTS];
      this.opportunities = [...INITIAL_OPPORTUNITIES];
      this.leadHistories = [...INITIAL_LEAD_HISTORY];
      this.oppHistories = [...INITIAL_OPPORTUNITY_HISTORY];
      this.contracts = [...INITIAL_CONTRACTS];
      this.banks = [...INITIAL_BANKS];
      this.products = [...INITIAL_PRODUCTS];
      this.agreements = [...INITIAL_AGREEMENTS];
      this.commissionRules = [...INITIAL_COMMISSION_RULES];
      this.operationCommissions = [...INITIAL_OPERATION_COMMISSIONS];
      this.commissionHistories = [...INITIAL_COMMISSION_STATUS_HISTORY];
      this.financialRevenues = [...INITIAL_FINANCIAL_REVENUES];
      this.financialReceipts = [...INITIAL_FINANCIAL_REVENUE_RECEIPTS];
      this.financialCosts = [...INITIAL_FINANCIAL_OPERATIONAL_COSTS];
      this.financialExpenses = [...INITIAL_FINANCIAL_GENERAL_EXPENSES];
      this.helpContents = [...INITIAL_HELP_CONTENTS];
      this.googleSheetsConfig = {
        spreadsheet_id: '1tYg9bU0f4vR79GzU3g6m8D9hH4B-8X9fK5z2wLmPqYs',
        sheet_name: 'Respostas do Formulário 1',
        col_id: 'id',
        col_name: 'nome_completo',
        col_phone: 'telefone',
        col_email: 'email',
        col_city: 'cidade',
        col_product: 'tipo_de_supletivo',
        col_campaign: 'campaign_name',
        col_ad: 'ad_name'
      };
      this.leadSyncResult = {
        last_sync: null,
        next_sync: null,
        connection_status: 'DISCONNECTED',
        leads_imported_today: 0,
        leads_waiting_distribution: 0,
        duplicate_leads: 0,
        sync_errors: 0
      };
    }
  }

  private saveFinancialRevenuesToStorage(): void {
    localStorage.setItem(FINANCIAL_REVENUES_STORAGE_KEY, JSON.stringify(this.financialRevenues));
  }

  private saveFinancialReceiptsToStorage(): void {
    localStorage.setItem(FINANCIAL_RECEIPTS_STORAGE_KEY, JSON.stringify(this.financialReceipts));
  }

  private saveFinancialCostsToStorage(): void {
    localStorage.setItem(FINANCIAL_COSTS_STORAGE_KEY, JSON.stringify(this.financialCosts));
  }

  private saveFinancialExpensesToStorage(): void {
    localStorage.setItem(FINANCIAL_EXPENSES_STORAGE_KEY, JSON.stringify(this.financialExpenses));
  }

  private saveHelpContentsToStorage(): void {
    localStorage.setItem(HELP_CONTENTS_STORAGE_KEY, JSON.stringify(this.helpContents));
  }

  private saveOperationCommissionsToStorage(): void {
    localStorage.setItem(OPERATION_COMMISSIONS_STORAGE_KEY, JSON.stringify(this.operationCommissions));
  }

  private saveCommissionHistoriesToStorage(): void {
    localStorage.setItem(COMMISSION_HISTORIES_STORAGE_KEY, JSON.stringify(this.commissionHistories));
  }

  private saveBanksToStorage(): void {
    localStorage.setItem(BANKS_STORAGE_KEY, JSON.stringify(this.banks));
  }

  private saveProductsToStorage(): void {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(this.products));
  }

  private saveAgreementsToStorage(): void {
    localStorage.setItem(AGREEMENTS_STORAGE_KEY, JSON.stringify(this.agreements));
  }

  private saveCommissionRulesToStorage(): void {
    localStorage.setItem(COMMISSIONS_STORAGE_KEY, JSON.stringify(this.commissionRules));
  }

  private saveUsersToStorage(): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users));
  }

  private saveAuditToStorage(): void {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.auditLogs));
  }

  private saveLeadsToStorage(): void {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(this.leads));
  }

  private saveClientsToStorage(): void {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(this.clients));
  }

  private saveOpportunitiesToStorage(): void {
    localStorage.setItem(OPPORTUNITIES_STORAGE_KEY, JSON.stringify(this.opportunities));
  }

  private saveLeadHistoryToStorage(): void {
    localStorage.setItem(LEAD_HISTORY_STORAGE_KEY, JSON.stringify(this.leadHistories));
  }

  private saveOppHistoryToStorage(): void {
    localStorage.setItem(OPP_HISTORY_STORAGE_KEY, JSON.stringify(this.oppHistories));
  }

  private saveContractsToStorage(): void {
    localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(this.contracts));
  }

  public logAudit(
    currentUser: User | null,
    action: string,
    module: string,
    description: string,
    recordId?: string
  ): AuditLog {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      user_id: currentUser ? currentUser.id : 'sistema',
      user_name: currentUser ? currentUser.name : 'Sistema Cred Sempre +',
      action,
      module,
      record_id: recordId || null,
      description,
      ip_address: '189.40.122.15', // Simulated IP
      created_at: new Date().toISOString(),
    };

    this.auditLogs = [newLog, ...this.auditLogs];
    this.saveAuditToStorage();
    return newLog;
  }

  public async login(email: string, pass: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !pass) {
      throw new Error('E-mail e senha são obrigatórios.');
    }

    const response = await fetch('/api/auth.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        action: 'login',
        email: cleanEmail,
        password: pass,
      }),
    });

    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      throw new Error('Resposta inválida do servidor de autenticação.');
    }

    if (!response.ok || !payload?.success || !payload?.user) {
      throw new Error(payload?.message || 'E-mail ou senha incorretos.');
    }

    const user = payload.user as User;

    if (user.status === 'Inativo') {
      throw new Error('Usuário inativo. Entre em contato com o Administrador.');
    }

    this.logAudit(
      user,
      'LOGIN',
      'Autenticação',
      `Login efetuado com sucesso pelo perfil ${user.role}.`
    );

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }

  public getCurrentSessionUser(): User | null {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      if (!data) return null;
      return JSON.parse(data) as User;
    } catch {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
  }

  public async logout(currentUser: User | null): Promise<void> {
    if (currentUser) {
      this.logAudit(
        currentUser,
        'LOGOUT',
        'Autenticação',
        `Sessão encerrada pelo usuário.`
      );
    }
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  public getUsers(): User[] {
    return this.users.map((u) => {
      if (u.supervisor_id) {
        const sup = this.users.find((s) => s.id === u.supervisor_id);
        return {
          ...u,
          supervisor_name: sup ? sup.name : u.supervisor_name || 'Desconhecido',
        };
      }
      return u;
    });
  }

  public getSupervisors(): User[] {
    return this.getUsers().filter((u) => u.role === 'Supervisor' && u.status === 'Ativo');
  }

  public async createUser(
    userData: {
      name: string;
      cpf: string;
      phone: string;
      whatsapp: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      supervisor_id?: string | null;
    },
    currentUser: User
  ): Promise<User> {
    await new Promise((res) => setTimeout(res, 300));

    const cleanEmail = userData.email.trim().toLowerCase();
    if (this.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    const cleanCPF = userData.cpf.trim();
    if (this.users.some((u) => u.cpf === cleanCPF)) {
      throw new Error('Já existe um usuário cadastrado com este CPF.');
    }

    let supName: string | null = null;
    if (userData.role === 'Vendedor' && userData.supervisor_id) {
      const sup = this.users.find((s) => s.id === userData.supervisor_id);
      if (sup) supName = sup.name;
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: userData.name.trim(),
      cpf: cleanCPF,
      phone: userData.phone.trim(),
      whatsapp: userData.whatsapp.trim(),
      email: cleanEmail,
      role: userData.role,
      status: userData.status,
      supervisor_id: userData.role === 'Vendedor' ? userData.supervisor_id : null,
      supervisor_name: userData.role === 'Vendedor' ? supName : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      permissions: {},
    };

    this.users.push(newUser);
    this.saveUsersToStorage();

    this.logAudit(
      currentUser,
      'CRIAR_USUARIO',
      'Equipe e Usuários',
      `Novo usuário "${newUser.name}" (${newUser.role}) criado no sistema.`,
      newUser.id
    );

    return newUser;
  }

  public async updateUser(
    userId: string,
    userData: {
      name: string;
      cpf: string;
      phone: string;
      whatsapp: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      supervisor_id?: string | null;
    },
    currentUser: User
  ): Promise<User> {
    await new Promise((res) => setTimeout(res, 300));

    const index = this.users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error('Usuário não encontrado.');
    }

    const existing = this.users[index];

    const cleanEmail = userData.email.trim().toLowerCase();
    if (cleanEmail !== existing.email.toLowerCase()) {
      if (this.users.some((u) => u.email.toLowerCase() === cleanEmail && u.id !== userId)) {
        throw new Error('Já existe outro usuário cadastrado com este e-mail.');
      }
    }

    let supName: string | null = null;
    if (userData.role === 'Vendedor' && userData.supervisor_id) {
      const sup = this.users.find((s) => s.id === userData.supervisor_id);
      if (sup) supName = sup.name;
    }

    const updated: User = {
      ...existing,
      name: userData.name.trim(),
      cpf: userData.cpf.trim(),
      phone: userData.phone.trim(),
      whatsapp: userData.whatsapp.trim(),
      email: cleanEmail,
      role: userData.role,
      status: userData.status,
      supervisor_id: userData.role === 'Vendedor' ? userData.supervisor_id : null,
      supervisor_name: userData.role === 'Vendedor' ? supName : null,
      updated_at: new Date().toISOString(),
    };

    this.users[index] = updated;
    this.saveUsersToStorage();

    this.logAudit(
      currentUser,
      'EDITAR_USUARIO',
      'Equipe e Usuários',
      `Dados do usuário "${updated.name}" alterados por ${currentUser.name}.`,
      updated.id
    );

    return updated;
  }

  public async toggleUserStatus(userId: string, currentUser: User): Promise<User> {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('Usuário não encontrado.');

    if (user.id === currentUser.id) {
      throw new Error('Você não pode desativar seu próprio usuário logado.');
    }

    const newStatus: UserStatus = user.status === 'Ativo' ? 'Inativo' : 'Ativo';
    user.status = newStatus;
    user.updated_at = new Date().toISOString();

    this.saveUsersToStorage();

    this.logAudit(
      currentUser,
      'ALTERAR_STATUS',
      'Equipe e Usuários',
      `Status do usuário "${user.name}" alterado para ${newStatus}.`,
      user.id
    );

    return user;
  }

  public async updateUserPermissions(
    userId: string,
    permissions: Partial<Record<PermissionKey, boolean>>,
    currentUser: User
  ): Promise<User> {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('Usuário não encontrado.');

    user.permissions = permissions;
    user.updated_at = new Date().toISOString();

    this.saveUsersToStorage();

    this.logAudit(
      currentUser,
      'ALTERAR_PERMISSOES',
      'Permissões',
      `Permissões do usuário "${user.name}" atualizadas por ${currentUser.name}.`,
      user.id
    );

    return user;
  }

  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public hasPermission(user: User | null, permKey: PermissionKey): boolean {
    if (!user) return false;

    if (user.permissions && typeof user.permissions[permKey] === 'boolean') {
      return user.permissions[permKey]!;
    }

    const roleDefaults = ROLE_DEFAULT_PERMISSIONS[user.role];
    if (roleDefaults && typeof roleDefaults[permKey] === 'boolean') {
      return roleDefaults[permKey];
    }

    return false;
  }

  // ======================================================
  // FASE 2: LEADS METHODS & DUPLICITY CHECK
  // ======================================================

  public getLeads(currentUser: User | null): Lead[] {
    if (!currentUser) return [];

    const canSeeTeam =
      currentUser.role === 'Administrador' ||
      this.hasPermission(currentUser, 'visualizar_vendas_equipe');

    if (currentUser.role === 'Administrador') {
      return this.leads;
    }

    if (currentUser.role === 'Supervisor') {
      // Supervisor sees leads assigned to themselves or sellers in their team
      const teamSellers = this.users
        .filter((u) => u.supervisor_id === currentUser.id)
        .map((u) => u.id);
      return this.leads.filter(
        (l) =>
          l.supervisor_id === currentUser.id ||
          l.vendedor_id === currentUser.id ||
          teamSellers.includes(l.vendedor_id)
      );
    }

    if (canSeeTeam) {
      return this.leads;
    }

    // Default Vendedor: sees own leads
    return this.leads.filter((l) => l.vendedor_id === currentUser.id);
  }

  public findDuplicateLead(params: {
    phone?: string;
    cpf?: string;
    excludeId?: string;
  }): Lead | null {
    const phoneDigits = params.phone ? params.phone.replace(/\D/g, '') : '';
    const cpfDigits = params.cpf ? params.cpf.replace(/\D/g, '') : '';

    for (const lead of this.leads) {
      if (params.excludeId && lead.id === params.excludeId) continue;

      const leadPhoneDigits = lead.telefone.replace(/\D/g, '');
      const leadCpfDigits = lead.cpf ? lead.cpf.replace(/\D/g, '') : '';

      if (phoneDigits && phoneDigits.length >= 8 && leadPhoneDigits === phoneDigits) {
        return lead;
      }

      if (cpfDigits && cpfDigits.length === 11 && leadCpfDigits === cpfDigits) {
        return lead;
      }
    }

    return null;
  }

  public async createLead(
    leadData: {
      nome: string;
      telefone: string;
      whatsapp?: string;
      email?: string;
      cpf?: string;
      cidade?: string;
      estado?: string;
      origem: LeadSource;
      campanha?: string;
      anuncio?: string;
      produto_interesse: string;
      observacoes?: string;
      vendedor_id?: string;
    },
    currentUser: User
  ): Promise<Lead> {
    await new Promise((res) => setTimeout(res, 300));

    let assignedSellerId = leadData.vendedor_id || currentUser.id;
    let assignedSellerName = currentUser.name;
    let assignedSupId = currentUser.supervisor_id || null;
    let assignedSupName = currentUser.supervisor_name || null;

    if (leadData.vendedor_id && leadData.vendedor_id !== currentUser.id) {
      const targetSeller = this.users.find((u) => u.id === leadData.vendedor_id);
      if (targetSeller) {
        assignedSellerId = targetSeller.id;
        assignedSellerName = targetSeller.name;
        assignedSupId = targetSeller.supervisor_id || null;
        assignedSupName = targetSeller.supervisor_name || null;
      }
    }

    const newLead: Lead = {
      id: `lead_${Date.now()}`,
      nome: leadData.nome.trim(),
      telefone: leadData.telefone.trim(),
      whatsapp: (leadData.whatsapp || leadData.telefone).trim(),
      email: (leadData.email || '').trim(),
      cpf: (leadData.cpf || '').trim(),
      cidade: (leadData.cidade || '').trim(),
      estado: (leadData.estado || '').trim(),
      origem: leadData.origem || 'Cadastro manual',
      campanha: leadData.campanha || '',
      anuncio: leadData.anuncio || '',
      produto_interesse: leadData.produto_interesse || 'Consignado Geral',
      observacoes: leadData.observacoes || '',
      vendedor_id: assignedSellerId,
      vendedor_nome: assignedSellerName,
      supervisor_id: assignedSupId,
      supervisor_nome: assignedSupName,
      status: 'Novo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.leads.unshift(newLead);
    this.saveLeadsToStorage();

    // Lead History
    this.addLeadHistoryItem(
      newLead.id,
      currentUser,
      'LEAD_CRIADO',
      `Lead "${newLead.nome}" cadastrado com sucesso por ${currentUser.name}.`
    );

    // Audit Log
    this.logAudit(
      currentUser,
      'CRIAR_LEAD',
      'Leads',
      `Lead "${newLead.nome}" (${newLead.origem}) cadastrado e atribuído a ${assignedSellerName}.`,
      newLead.id
    );

    return newLead;
  }

  public async updateLead(
    leadId: string,
    leadData: Partial<Lead>,
    currentUser: User
  ): Promise<Lead> {
    await new Promise((res) => setTimeout(res, 300));

    const index = this.leads.findIndex((l) => l.id === leadId);
    if (index === -1) throw new Error('Lead não encontrado.');

    const old = this.leads[index];
    const updated: Lead = {
      ...old,
      ...leadData,
      updated_at: new Date().toISOString(),
    };

    this.leads[index] = updated;
    this.saveLeadsToStorage();

    this.addLeadHistoryItem(
      updated.id,
      currentUser,
      'LEAD_EDITADO',
      `Dados do lead alterados por ${currentUser.name}.`
    );

    this.logAudit(
      currentUser,
      'EDITAR_LEAD',
      'Leads',
      `Lead "${updated.nome}" atualizado por ${currentUser.name}.`,
      updated.id
    );

    return updated;
  }

  public async updateLeadStatus(
    leadId: string,
    newStatus: LeadStatus,
    currentUser: User,
    noteText?: string
  ): Promise<Lead> {
    const lead = this.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead não encontrado.');

    const oldStatus = lead.status;
    lead.status = newStatus;
    lead.updated_at = new Date().toISOString();

    this.saveLeadsToStorage();

    const desc = noteText
      ? `Status alterado de "${oldStatus}" para "${newStatus}". Obs: ${noteText}`
      : `Status alterado de "${oldStatus}" para "${newStatus}".`;

    this.addLeadHistoryItem(lead.id, currentUser, 'STATUS_ALTERADO', desc);

    this.logAudit(
      currentUser,
      'ALTERAR_STATUS_LEAD',
      'Leads',
      `Status do lead "${lead.nome}" alterado de ${oldStatus} para ${newStatus}.`,
      lead.id
    );

    return lead;
  }

  public async distributeLead(
    leadId: string,
    targetSellerId: string,
    currentUser: User
  ): Promise<Lead> {
    const lead = this.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead não encontrado.');

    const targetSeller = this.users.find((u) => u.id === targetSellerId);
    if (!targetSeller) throw new Error('Vendedor selecionado não existe.');

    const oldSellerName = lead.vendedor_nome;
    lead.vendedor_id = targetSeller.id;
    lead.vendedor_nome = targetSeller.name;
    lead.supervisor_id = targetSeller.supervisor_id || null;
    lead.supervisor_nome = targetSeller.supervisor_name || null;
    lead.updated_at = new Date().toISOString();

    this.saveLeadsToStorage();

    this.addLeadHistoryItem(
      lead.id,
      currentUser,
      'DISTRIBUICAO_LEAD',
      `Lead redistribuído de "${oldSellerName}" para "${targetSeller.name}".`
    );

    this.logAudit(
      currentUser,
      'DISTRIBUIR_LEAD',
      'Leads',
      `Lead "${lead.nome}" reatribuído para ${targetSeller.name}.`,
      lead.id
    );

    return lead;
  }

  public addLeadHistoryItem(
    leadId: string,
    currentUser: User,
    action: string,
    description: string
  ): void {
    const item: LeadHistoryItem = {
      id: `lhist_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      lead_id: leadId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action,
      description,
      created_at: new Date().toISOString(),
    };
    this.leadHistories.unshift(item);
    this.saveLeadHistoryToStorage();
  }

  public getLeadHistory(leadId: string): LeadHistoryItem[] {
    return this.leadHistories.filter((h) => h.lead_id === leadId);
  }

  // ======================================================
  // FASE 2: CLIENTS METHODS & CONVERSION
  // ======================================================

  public getClients(currentUser: User | null): Client[] {
    if (!currentUser) return [];

    const canSeeTeam =
      currentUser.role === 'Administrador' ||
      this.hasPermission(currentUser, 'visualizar_vendas_equipe');

    if (currentUser.role === 'Administrador') {
      return this.clients;
    }

    if (currentUser.role === 'Supervisor') {
      const teamSellers = this.users
        .filter((u) => u.supervisor_id === currentUser.id)
        .map((u) => u.id);
      return this.clients.filter(
        (c) =>
          c.supervisor_id === currentUser.id ||
          c.vendedor_id === currentUser.id ||
          teamSellers.includes(c.vendedor_id)
      );
    }

    if (canSeeTeam) {
      return this.clients;
    }

    return this.clients.filter((c) => c.vendedor_id === currentUser.id);
  }

  public async convertLeadToClient(leadId: string, currentUser: User): Promise<Client> {
    await new Promise((res) => setTimeout(res, 400));

    const lead = this.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead não encontrado.');

    // Check if client already exists with same lead_id or CPF
    const existingClientByLead = this.clients.find((c) => c.lead_id === lead.id);
    if (existingClientByLead) {
      return existingClientByLead;
    }

    if (lead.cpf) {
      const existingByCpf = this.clients.find(
        (c) => c.cpf && c.cpf.replace(/\D/g, '') === lead.cpf.replace(/\D/g, '')
      );
      if (existingByCpf) {
        // Link lead and return existing
        existingByCpf.lead_id = lead.id;
        lead.status = 'Convertido';
        this.saveClientsToStorage();
        this.saveLeadsToStorage();
        return existingByCpf;
      }
    }

    const newClient: Client = {
      id: `cli_${Date.now()}`,
      lead_id: lead.id,
      nome: lead.nome,
      cpf: lead.cpf,
      telefone: lead.telefone,
      whatsapp: lead.whatsapp,
      email: lead.email,
      cidade: lead.cidade,
      estado: lead.estado,
      observacoes: lead.observacoes,
      vendedor_id: lead.vendedor_id,
      vendedor_nome: lead.vendedor_nome,
      supervisor_id: lead.supervisor_id,
      supervisor_nome: lead.supervisor_nome,
      status: 'Ativo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.clients.unshift(newClient);
    this.saveClientsToStorage();

    // Update lead status
    lead.status = 'Convertido';
    lead.updated_at = new Date().toISOString();
    this.saveLeadsToStorage();

    this.addLeadHistoryItem(
      lead.id,
      currentUser,
      'CONVERTIDO_EM_CLIENTE',
      `Lead convertido em cliente ("${newClient.nome}") por ${currentUser.name}.`
    );

    this.logAudit(
      currentUser,
      'CONVERTER_LEAD',
      'Clientes',
      `Lead "${lead.nome}" transformado com sucesso no cliente ${newClient.id}.`,
      newClient.id
    );

    return newClient;
  }

  public async createClient(
    clientData: {
      nome: string;
      cpf: string;
      telefone: string;
      whatsapp?: string;
      email?: string;
      cidade?: string;
      estado?: string;
      observacoes?: string;
      vendedor_id?: string;
    },
    currentUser: User
  ): Promise<Client> {
    await new Promise((res) => setTimeout(res, 300));

    let sellerId = clientData.vendedor_id || currentUser.id;
    let sellerName = currentUser.name;
    let supId = currentUser.supervisor_id || null;
    let supName = currentUser.supervisor_name || null;

    if (clientData.vendedor_id) {
      const seller = this.users.find((u) => u.id === clientData.vendedor_id);
      if (seller) {
        sellerId = seller.id;
        sellerName = seller.name;
        supId = seller.supervisor_id || null;
        supName = seller.supervisor_name || null;
      }
    }

    const newClient: Client = {
      id: `cli_${Date.now()}`,
      nome: clientData.nome.trim(),
      cpf: clientData.cpf.trim(),
      telefone: clientData.telefone.trim(),
      whatsapp: (clientData.whatsapp || clientData.telefone).trim(),
      email: (clientData.email || '').trim(),
      cidade: (clientData.cidade || '').trim(),
      estado: (clientData.estado || '').trim(),
      observacoes: clientData.observacoes || '',
      vendedor_id: sellerId,
      vendedor_nome: sellerName,
      supervisor_id: supId,
      supervisor_nome: supName,
      status: 'Ativo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.clients.unshift(newClient);
    this.saveClientsToStorage();

    this.logAudit(
      currentUser,
      'CRIAR_CLIENTE',
      'Clientes',
      `Novo cliente "${newClient.nome}" cadastrado diretamente por ${currentUser.name}.`,
      newClient.id
    );

    return newClient;
  }

  public async updateClient(
    clientId: string,
    clientData: Partial<Client>,
    currentUser: User
  ): Promise<Client> {
    const index = this.clients.findIndex((c) => c.id === clientId);
    if (index === -1) throw new Error('Cliente não encontrado.');

    const old = this.clients[index];
    const updated: Client = {
      ...old,
      ...clientData,
      updated_at: new Date().toISOString(),
    };

    this.clients[index] = updated;
    this.saveClientsToStorage();

    this.logAudit(
      currentUser,
      'EDITAR_CLIENTE',
      'Clientes',
      `Dados do cliente "${updated.nome}" atualizados por ${currentUser.name}.`,
      updated.id
    );

    return updated;
  }

  // ======================================================
  // FASE 2: OPPORTUNITIES & KANBAN METHODS
  // ======================================================

  public getOpportunities(currentUser: User | null): Opportunity[] {
    if (!currentUser) return [];

    const canSeeTeam =
      currentUser.role === 'Administrador' ||
      this.hasPermission(currentUser, 'visualizar_vendas_equipe');

    if (currentUser.role === 'Administrador') {
      return this.opportunities;
    }

    if (currentUser.role === 'Supervisor') {
      const teamSellers = this.users
        .filter((u) => u.supervisor_id === currentUser.id)
        .map((u) => u.id);
      return this.opportunities.filter(
        (o) =>
          o.supervisor_id === currentUser.id ||
          o.vendedor_id === currentUser.id ||
          teamSellers.includes(o.vendedor_id)
      );
    }

    if (canSeeTeam) {
      return this.opportunities;
    }

    return this.opportunities.filter((o) => o.vendedor_id === currentUser.id);
  }

  public async createOpportunity(
    opData: {
      client_id: string;
      lead_id?: string | null;
      banco_nome: string;
      produto_nome: string;
      valor: number;
      prazo: number;
      etapa?: OpportunityStage;
      observacoes?: string;
    },
    currentUser: User
  ): Promise<Opportunity> {
    await new Promise((res) => setTimeout(res, 300));

    const client = this.clients.find((c) => c.id === opData.client_id);
    if (!client) throw new Error('Cliente não encontrado para gerar oportunidade.');

    const newOpp: Opportunity = {
      id: `opp_${Date.now()}`,
      client_id: client.id,
      client_name: client.nome,
      lead_id: opData.lead_id || client.lead_id || null,
      vendedor_id: client.vendedor_id,
      vendedor_nome: client.vendedor_nome,
      supervisor_id: client.supervisor_id,
      supervisor_nome: client.supervisor_nome,
      banco_id: `banco_${opData.banco_nome.toLowerCase().replace(/\s+/g, '_')}`,
      banco_nome: opData.banco_nome.trim(),
      produto_id: `prod_${opData.produto_nome.toLowerCase().replace(/\s+/g, '_')}`,
      produto_nome: opData.produto_nome.trim(),
      valor: Number(opData.valor) || 0,
      prazo: Number(opData.prazo) || 84,
      etapa: opData.etapa || 'Simulação',
      status: 'Em andamento',
      observacoes: opData.observacoes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.opportunities.unshift(newOpp);
    this.saveOpportunitiesToStorage();

    // History log
    const histItem: OpportunityHistoryItem = {
      id: `ophist_${Date.now()}`,
      opportunity_id: newOpp.id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      from_etapa: null,
      to_etapa: newOpp.etapa,
      description: `Oportunidade de ${newOpp.banco_nome} criada na etapa "${newOpp.etapa}" no valor de R$ ${newOpp.valor.toFixed(
        2
      )}.`,
      created_at: new Date().toISOString(),
    };
    this.oppHistories.unshift(histItem);
    this.saveOppHistoryToStorage();

    this.logAudit(
      currentUser,
      'CRIAR_OPORTUNIDADE',
      'Oportunidades',
      `Nova proposta R$ ${newOpp.valor.toFixed(2)} (${newOpp.banco_nome}) gerada para ${newOpp.client_name}.`,
      newOpp.id
    );

    return newOpp;
  }

  public async updateOpportunityStage(
    opportunityId: string,
    newStage: OpportunityStage,
    currentUser: User
  ): Promise<Opportunity> {
    const opp = this.opportunities.find((o) => o.id === opportunityId);
    if (!opp) throw new Error('Oportunidade não encontrada.');

    const oldStage = opp.etapa;
    if (oldStage === newStage) return opp;

    opp.etapa = newStage;
    if (newStage === 'Aprovado') opp.status = 'Aprovado';
    if (newStage === 'Pago') opp.status = 'Pago';
    opp.updated_at = new Date().toISOString();

    this.saveOpportunitiesToStorage();

    // History
    const histItem: OpportunityHistoryItem = {
      id: `ophist_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      opportunity_id: opp.id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      from_etapa: oldStage,
      to_etapa: newStage,
      description: `Etapa alterada de "${oldStage}" para "${newStage}" por ${currentUser.name}.`,
      created_at: new Date().toISOString(),
    };
    this.oppHistories.unshift(histItem);
    this.saveOppHistoryToStorage();

    this.logAudit(
      currentUser,
      'MOVER_KANBAN',
      'Oportunidades',
      `Proposta de R$ ${opp.valor.toFixed(2)} (${opp.client_name}) movida no Kanban de "${oldStage}" para "${newStage}".`,
      opp.id
    );

    return opp;
  }

  public getOpportunityHistory(opportunityId: string): OpportunityHistoryItem[] {
    return this.oppHistories.filter((h) => h.opportunity_id === opportunityId);
  }

  // ======================================================
  // CONTRATOS & CONVERSÃO DE OPORTUNIDADES ("VIRAR CONTRATO")
  // ======================================================

  public getContracts(currentUser: User | null): Contract[] {
    if (!currentUser) return [];

    const canSeeTeam =
      currentUser.role === 'Administrador' ||
      this.hasPermission(currentUser, 'visualizar_vendas_equipe');

    if (currentUser.role === 'Administrador') {
      return this.contracts;
    }

    if (currentUser.role === 'Supervisor') {
      const teamSellers = this.users
        .filter((u) => u.supervisor_id === currentUser.id)
        .map((u) => u.id);
      return this.contracts.filter(
        (c) =>
          c.supervisor_id === currentUser.id ||
          c.vendedor_id === currentUser.id ||
          teamSellers.includes(c.vendedor_id)
      );
    }

    if (canSeeTeam) {
      return this.contracts;
    }

    return this.contracts.filter((c) => c.vendedor_id === currentUser.id);
  }

  public getContractByOpportunityId(opportunityId: string): Contract | null {
    return this.contracts.find((c) => c.opportunity_id === opportunityId) || null;
  }

  public async convertToContract(
    opportunityId: string,
    currentUser: User
  ): Promise<{ opportunity: Opportunity; contract: Contract }> {
    await new Promise((res) => setTimeout(res, 350));

    // Permission check
    const canConvert = this.hasPermission(currentUser, 'virar_contrato');
    if (!canConvert) {
      throw new Error('Você não possui permissão para converter esta oportunidade em contrato.');
    }

    const opp = this.opportunities.find((o) => o.id === opportunityId);
    if (!opp) {
      throw new Error('Oportunidade não encontrada.');
    }

    // Check if contract already exists
    const existingContract = this.contracts.find((c) => c.opportunity_id === opportunityId);
    if (opp.has_contract || existingContract) {
      throw new Error('Esta oportunidade já foi convertida em contrato! Não é possível emitir um contrato duplicado.');
    }

    const client = this.clients.find((c) => c.id === opp.client_id);
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const contractNumber = `CTR-${year}-${randomNum}`;
    const nowIso = new Date().toISOString();

    const newContract: Contract = {
      id: `ctr_${Date.now()}`,
      numero_contrato: contractNumber,
      opportunity_id: opp.id,
      client_id: opp.client_id,
      client_name: opp.client_name,
      client_cpf: client?.cpf || '',
      vendedor_id: opp.vendedor_id,
      vendedor_nome: opp.vendedor_nome,
      supervisor_id: opp.supervisor_id,
      supervisor_nome: opp.supervisor_nome,
      banco_id: opp.banco_id,
      banco_nome: opp.banco_nome,
      produto_id: opp.produto_id,
      produto_nome: opp.produto_nome,
      valor: opp.valor,
      prazo: opp.prazo,
      status: 'Ativo',
      converted_by_user_id: currentUser.id,
      converted_by_user_name: currentUser.name,
      converted_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Store new contract
    this.contracts.unshift(newContract);
    this.saveContractsToStorage();

    // Update Opportunity flag and stage
    opp.has_contract = true;
    opp.contract_id = newContract.id;
    opp.converted_at = nowIso;
    opp.converted_by_user_id = currentUser.id;
    opp.converted_by_user_name = currentUser.name;
    opp.etapa = 'Contrato';
    if (opp.status === 'Em andamento') {
      opp.status = 'Aprovado';
    }
    opp.updated_at = nowIso;
    this.saveOpportunitiesToStorage();

    // Register Opportunity History
    const formattedDate = new Date(nowIso).toLocaleString('pt-BR');
    const histItem: OpportunityHistoryItem = {
      id: `ophist_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      opportunity_id: opp.id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      from_etapa: opp.etapa,
      to_etapa: 'Contrato',
      description: `Operação convertida com sucesso no Contrato #${newContract.numero_contrato} por ${currentUser.name} em ${formattedDate}.`,
      created_at: nowIso,
    };
    this.oppHistories.unshift(histItem);
    this.saveOppHistoryToStorage();

    // Audit Log
    this.logAudit(
      currentUser,
      'VIRAR_CONTRATO',
      'Contratos',
      `Oportunidade "${opp.id}" (${opp.client_name} - ${opp.banco_nome} R$ ${opp.valor.toFixed(
        2
      )}) convertida no Contrato #${newContract.numero_contrato}.`,
      newContract.id
    );

    return { opportunity: opp, contract: newContract };
  }

  // ======================================================
  // FASE 3 — BANCOS, PRODUTOS, CONVÊNIOS E REGRAS DE COMISSÃO
  // ======================================================

  // BANCOS
  public getBanks(): Bank[] {
    return this.banks;
  }

  public async createBank(
    data: Omit<Bank, 'id' | 'created_at' | 'updated_at'>,
    currentUser: User | null
  ): Promise<Bank> {
    await new Promise((res) => setTimeout(res, 300));
    const nowIso = new Date().toISOString();
    const newBank: Bank = {
      id: `bank_${Date.now()}`,
      ...data,
      created_at: nowIso,
      updated_at: nowIso,
    };
    this.banks.unshift(newBank);
    this.saveBanksToStorage();
    this.logAudit(
      currentUser,
      'CRIAR_BANCO',
      'Configurações -> Bancos',
      `Banco "${newBank.nome}" (Cód: ${newBank.codigo_bancario}) cadastrado com sucesso.`,
      newBank.id
    );
    return newBank;
  }

  public async updateBank(
    id: string,
    data: Partial<Omit<Bank, 'id' | 'created_at' | 'updated_at'>>,
    currentUser: User | null
  ): Promise<Bank> {
    await new Promise((res) => setTimeout(res, 300));
    const bank = this.banks.find((b) => b.id === id);
    if (!bank) throw new Error('Banco não encontrado.');

    Object.assign(bank, data);
    bank.updated_at = new Date().toISOString();
    this.saveBanksToStorage();

    // Cascade name update to products/agreements/commission rules if name changed
    if (data.nome) {
      this.products.forEach((p) => {
        if (p.banco_id === id) p.banco_nome = data.nome!;
      });
      this.saveProductsToStorage();

      this.agreements.forEach((a) => {
        if (a.banco_id === id) a.banco_nome = data.nome!;
      });
      this.saveAgreementsToStorage();

      this.commissionRules.forEach((r) => {
        if (r.banco_id === id) r.banco_nome = data.nome!;
      });
      this.saveCommissionRulesToStorage();
    }

    this.logAudit(
      currentUser,
      'EDITAR_BANCO',
      'Configurações -> Bancos',
      `Banco "${bank.nome}" atualizado.`,
      bank.id
    );
    return bank;
  }

  public async toggleBankStatus(id: string, currentUser: User | null): Promise<Bank> {
    await new Promise((res) => setTimeout(res, 250));
    const bank = this.banks.find((b) => b.id === id);
    if (!bank) throw new Error('Banco não encontrado.');

    bank.status = bank.status === 'Ativo' ? 'Inativo' : 'Ativo';
    bank.updated_at = new Date().toISOString();
    this.saveBanksToStorage();

    this.logAudit(
      currentUser,
      'ALTERAR_STATUS_BANCO',
      'Configurações -> Bancos',
      `Status do banco "${bank.nome}" alterado para ${bank.status}.`,
      bank.id
    );
    return bank;
  }

  // PRODUTOS
  public getProducts(): Product[] {
    return this.products;
  }

  public async createProduct(
    data: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
    currentUser: User | null
  ): Promise<Product> {
    await new Promise((res) => setTimeout(res, 300));
    const nowIso = new Date().toISOString();
    const bank = this.banks.find((b) => b.id === data.banco_id);
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      ...data,
      banco_nome: bank?.nome || data.banco_nome,
      created_at: nowIso,
      updated_at: nowIso,
    };
    this.products.unshift(newProduct);
    this.saveProductsToStorage();

    this.logAudit(
      currentUser,
      'CRIAR_PRODUTO',
      'Configurações -> Produtos',
      `Produto "${newProduct.nome}" cadastrado para o banco "${newProduct.banco_nome}".`,
      newProduct.id
    );
    return newProduct;
  }

  public async updateProduct(
    id: string,
    data: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>,
    currentUser: User | null
  ): Promise<Product> {
    await new Promise((res) => setTimeout(res, 300));
    const product = this.products.find((p) => p.id === id);
    if (!product) throw new Error('Produto não encontrado.');

    if (data.banco_id) {
      const bank = this.banks.find((b) => b.id === data.banco_id);
      if (bank) data.banco_nome = bank.nome;
    }

    Object.assign(product, data);
    product.updated_at = new Date().toISOString();
    this.saveProductsToStorage();

    // Cascade name to agreements and rules
    if (data.nome) {
      this.agreements.forEach((a) => {
        if (a.produto_id === id) a.produto_nome = data.nome!;
      });
      this.saveAgreementsToStorage();

      this.commissionRules.forEach((r) => {
        if (r.produto_id === id) r.produto_nome = data.nome!;
      });
      this.saveCommissionRulesToStorage();
    }

    this.logAudit(
      currentUser,
      'EDITAR_PRODUTO',
      'Configurações -> Produtos',
      `Produto "${product.nome}" atualizado.`,
      product.id
    );
    return product;
  }

  public async toggleProductStatus(id: string, currentUser: User | null): Promise<Product> {
    await new Promise((res) => setTimeout(res, 250));
    const product = this.products.find((p) => p.id === id);
    if (!product) throw new Error('Produto não encontrado.');

    product.status = product.status === 'Ativo' ? 'Inativo' : 'Ativo';
    product.updated_at = new Date().toISOString();
    this.saveProductsToStorage();

    this.logAudit(
      currentUser,
      'ALTERAR_STATUS_PRODUTO',
      'Configurações -> Produtos',
      `Status do produto "${product.nome}" alterado para ${product.status}.`,
      product.id
    );
    return product;
  }

  // CONVÊNIOS
  public getAgreements(): Agreement[] {
    return this.agreements;
  }

  public async createAgreement(
    data: Omit<Agreement, 'id' | 'created_at' | 'updated_at'>,
    currentUser: User | null
  ): Promise<Agreement> {
    await new Promise((res) => setTimeout(res, 300));
    const nowIso = new Date().toISOString();
    const bank = this.banks.find((b) => b.id === data.banco_id);
    const product = this.products.find((p) => p.id === data.produto_id);

    const newAgreement: Agreement = {
      id: `ag_${Date.now()}`,
      ...data,
      banco_nome: bank?.nome || data.banco_nome,
      produto_nome: product?.nome || data.produto_nome,
      created_at: nowIso,
      updated_at: nowIso,
    };
    this.agreements.unshift(newAgreement);
    this.saveAgreementsToStorage();

    this.logAudit(
      currentUser,
      'CRIAR_CONVENIO',
      'Configurações -> Convênios',
      `Convênio "${newAgreement.nome}" cadastrado.`,
      newAgreement.id
    );
    return newAgreement;
  }

  public async updateAgreement(
    id: string,
    data: Partial<Omit<Agreement, 'id' | 'created_at' | 'updated_at'>>,
    currentUser: User | null
  ): Promise<Agreement> {
    await new Promise((res) => setTimeout(res, 300));
    const agreement = this.agreements.find((a) => a.id === id);
    if (!agreement) throw new Error('Convênio não encontrado.');

    if (data.banco_id) {
      const bank = this.banks.find((b) => b.id === data.banco_id);
      if (bank) data.banco_nome = bank.nome;
    }
    if (data.produto_id) {
      const prod = this.products.find((p) => p.id === data.produto_id);
      if (prod) data.produto_nome = prod.nome;
    }

    Object.assign(agreement, data);
    agreement.updated_at = new Date().toISOString();
    this.saveAgreementsToStorage();

    if (data.nome) {
      this.commissionRules.forEach((r) => {
        if (r.convenio_id === id) r.convenio_nome = data.nome!;
      });
      this.saveCommissionRulesToStorage();
    }

    this.logAudit(
      currentUser,
      'EDITAR_CONVENIO',
      'Configurações -> Convênios',
      `Convênio "${agreement.nome}" atualizado.`,
      agreement.id
    );
    return agreement;
  }

  public async toggleAgreementStatus(id: string, currentUser: User | null): Promise<Agreement> {
    await new Promise((res) => setTimeout(res, 250));
    const agreement = this.agreements.find((a) => a.id === id);
    if (!agreement) throw new Error('Convênio não encontrado.');

    agreement.status = agreement.status === 'Ativo' ? 'Inativo' : 'Ativo';
    agreement.updated_at = new Date().toISOString();
    this.saveAgreementsToStorage();

    this.logAudit(
      currentUser,
      'ALTERAR_STATUS_CONVENIO',
      'Configurações -> Convênios',
      `Status do convênio "${agreement.nome}" alterado para ${agreement.status}.`,
      agreement.id
    );
    return agreement;
  }

  public async deleteAgreement(id: string, currentUser: User | null): Promise<void> {
    await new Promise((res) => setTimeout(res, 250));
    const index = this.agreements.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Convênio não encontrado.');

    // Check dependency in commission rules
    const hasRules = this.commissionRules.some((r) => r.convenio_id === id);
    if (hasRules) {
      throw new Error('Não é possível excluir este convênio pois existem regras de comissão vinculadas a ele.');
    }

    const removed = this.agreements.splice(index, 1)[0];
    this.saveAgreementsToStorage();

    this.logAudit(
      currentUser,
      'EXCLUIR_CONVENIO',
      'Configurações -> Convênios',
      `Convênio "${removed.nome}" excluído.`,
      id
    );
  }

  // REGRAS DE COMISSÃO (FASE 3 & 4)
  public getCommissionRules(): CommissionRule[] {
    return this.commissionRules;
  }

  // ======================================================
  // FASE 4 — MOTOR DE COMISSIONAMENTO, PRÉVIA E APROVAÇÃO
  // ======================================================

  public calculateCommissionPreview(params: {
    banco_id: string;
    produto_id: string;
    convenio_id?: string | null;
    valor_operacao: number;
    prazo: number;
    opportunity_id?: string | null;
    contract_id?: string | null;
  }): CommissionPreview {
    const bank = this.banks.find((b) => b.id === params.banco_id);
    const prod = this.products.find((p) => p.id === params.produto_id);
    const agree = params.convenio_id ? this.agreements.find((a) => a.id === params.convenio_id) : null;

    const bankName = bank ? bank.nome : 'Banco';
    const prodName = prod ? prod.nome : 'Produto';
    const agreeName = agree ? agree.nome : params.convenio_id ? 'Convênio' : 'Todos os Convênios';

    const valor = Number(params.valor_operacao) || 0;
    const prazo = Number(params.prazo) || 1;

    // Filter active candidate rules
    const activeRules = this.commissionRules.filter((r) => r.status === 'Ativa');

    const matchedRules = activeRules.filter((r) => {
      if (r.banco_id !== params.banco_id) return false;
      if (r.produto_id !== params.produto_id) return false;

      // Agreement check: match if exact agreement or if rule applies to all agreements (null/empty)
      if (r.convenio_id && params.convenio_id && r.convenio_id !== params.convenio_id) {
        return false;
      }

      // Prazo range
      if (prazo < r.prazo_min || prazo > r.prazo_max) return false;

      // Valor range
      if (valor < r.valor_min || valor > r.valor_max) return false;

      // Dates if defined
      const today = new Date().toISOString().split('T')[0];
      if (r.data_inicio && today < r.data_inicio) return false;
      if (r.data_termino && today > r.data_termino) return false;

      return true;
    });

    // If candidate rules exist, prefer exact agreement match if available
    let bestRule = matchedRules.find((r) => params.convenio_id && r.convenio_id === params.convenio_id);
    if (!bestRule && matchedRules.length > 0) {
      bestRule = matchedRules[0];
    }

    if (!bestRule) {
      return {
        opportunity_id: params.opportunity_id || null,
        contract_id: params.contract_id || null,
        banco_id: params.banco_id,
        banco_nome: bankName,
        produto_id: params.produto_id,
        produto_nome: prodName,
        convenio_id: params.convenio_id || null,
        convenio_nome: agreeName,
        valor_operacao: valor,
        prazo: prazo,
        matched: false,
        comissao_banco_valor: 0,
        comissao_banco_descricao: 'Nenhuma regra encontrada',
        comissao_vendedor_valor: 0,
        comissao_vendedor_descricao: 'Nenhuma regra encontrada',
        resultado_empresa_valor: 0,
        unmatched_criteria: {
          banco_nome: bankName,
          produto_nome: prodName,
          convenio_nome: agreeName,
          valor: valor,
          prazo: prazo,
        },
      };
    }

    // Calculate Bank Commission
    const tipoBanco = bestRule.tipo_comissao_banco || bestRule.tipo_comissao || 'PERCENTUAL';
    const taxaBanco = bestRule.valor_comissao_banco ?? bestRule.valor_comissao ?? 0;
    let bancoValor = 0;
    let bancoDesc = '';

    if (tipoBanco === 'PERCENTUAL') {
      bancoValor = (valor * taxaBanco) / 100;
      bancoDesc = `${taxaBanco.toFixed(2)}% (R$ ${bancoValor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })})`;
    } else {
      bancoValor = taxaBanco;
      bancoDesc = `R$ ${bancoValor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} (Fixo)`;
    }

    // Calculate Seller Commission
    const tipoVend: SellerCommissionType = bestRule.tipo_comissao_vendedor || 'PERCENTUAL_DO_BANCO';
    const taxaVend = bestRule.valor_comissao_vendedor ?? 0;
    let vendValor = 0;
    let vendDesc = '';

    if (tipoVend === 'PERCENTUAL_DO_BANCO') {
      vendValor = (bancoValor * taxaVend) / 100;
      vendDesc = `${taxaVend.toFixed(2)}% da Comissão do Banco (R$ ${vendValor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })})`;
    } else if (tipoVend === 'PERCENTUAL_DA_OPERACAO') {
      vendValor = (valor * taxaVend) / 100;
      vendDesc = `${taxaVend.toFixed(2)}% do Valor da Operação (R$ ${vendValor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })})`;
    } else {
      vendValor = taxaVend;
      vendDesc = `R$ ${vendValor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} (Fixo)`;
    }

    const resultadoEmpresa = bancoValor - vendValor;

    // Attach opportunity / contract context if available
    let clientName: string | null = null;
    let clientId: string | null = null;
    let sellerName: string | null = null;
    let sellerId: string | null = null;

    if (params.opportunity_id) {
      const opp = this.opportunities.find((o) => o.id === params.opportunity_id);
      if (opp) {
        clientName = opp.client_name;
        clientId = opp.client_id;
        sellerName = opp.vendedor_nome;
        sellerId = opp.vendedor_id;
      }
    } else if (params.contract_id) {
      const ctr = this.contracts.find((c) => c.id === params.contract_id);
      if (ctr) {
        clientName = ctr.client_name;
        clientId = ctr.client_id;
        sellerName = ctr.vendedor_nome;
        sellerId = ctr.vendedor_id;
      }
    }

    return {
      opportunity_id: params.opportunity_id || null,
      contract_id: params.contract_id || null,
      client_id: clientId,
      client_name: clientName,
      vendedor_id: sellerId,
      vendedor_nome: sellerName,
      banco_id: params.banco_id,
      banco_nome: bankName,
      produto_id: params.produto_id,
      produto_nome: prodName,
      convenio_id: params.convenio_id || null,
      convenio_nome: agreeName,
      valor_operacao: valor,
      prazo: prazo,
      matched: true,
      rule_id: bestRule.id,
      rule_summary: `${bankName} / ${prodName} / ${agreeName} (Prazo: ${bestRule.prazo_min}-${bestRule.prazo_max}m)`,
      comissao_banco_tipo: tipoBanco,
      comissao_banco_taxa: taxaBanco,
      comissao_banco_valor: bancoValor,
      comissao_banco_descricao: bancoDesc,
      comissao_vendedor_tipo: tipoVend,
      comissao_vendedor_taxa: taxaVend,
      comissao_vendedor_valor: vendValor,
      comissao_vendedor_descricao: vendDesc,
      resultado_empresa_valor: resultadoEmpresa,
    };
  }

  public getOperationCommissions(currentUser: User | null): OperationCommission[] {
    if (!currentUser) return [];

    const canSeeTeam =
      currentUser.role === 'Administrador' ||
      this.hasPermission(currentUser, 'visualizar_vendas_equipe');

    if (currentUser.role === 'Administrador') {
      return this.operationCommissions;
    }

    if (currentUser.role === 'Supervisor') {
      const teamSellers = this.users
        .filter((u) => u.supervisor_id === currentUser.id)
        .map((u) => u.id);
      return this.operationCommissions.filter(
        (c) =>
          c.supervisor_id === currentUser.id ||
          c.vendedor_id === currentUser.id ||
          teamSellers.includes(c.vendedor_id)
      );
    }

    if (canSeeTeam) {
      return this.operationCommissions;
    }

    return this.operationCommissions.filter((c) => c.vendedor_id === currentUser.id);
  }

  public async saveCommissionPreviewAsOperation(
    preview: CommissionPreview,
    currentUser: User,
    notes?: string
  ): Promise<OperationCommission> {
    await new Promise((res) => setTimeout(res, 300));

    if (!preview.matched) {
      throw new Error('Não é possível submeter uma comissão sem regra compatível cadastrada.');
    }

    let clientName = preview.client_name || 'Cliente';
    let clientId = preview.client_id || 'cli_demo';
    let sellerId = preview.vendedor_id || currentUser.id;
    let sellerName = preview.vendedor_nome || currentUser.name;
    let supId = currentUser.supervisor_id || null;
    let supName = currentUser.supervisor_name || null;
    let contractNumber: string | null = null;

    if (preview.contract_id) {
      const ctr = this.contracts.find((c) => c.id === preview.contract_id);
      if (ctr) {
        clientName = ctr.client_name;
        clientId = ctr.client_id;
        sellerId = ctr.vendedor_id;
        sellerName = ctr.vendedor_nome;
        supId = ctr.supervisor_id || null;
        supName = ctr.supervisor_nome || null;
        contractNumber = ctr.numero_contrato;
      }
    } else if (preview.opportunity_id) {
      const opp = this.opportunities.find((o) => o.id === preview.opportunity_id);
      if (opp) {
        clientName = opp.client_name;
        clientId = opp.client_id;
        sellerId = opp.vendedor_id;
        sellerName = opp.vendedor_nome;
        supId = opp.supervisor_id || null;
        supName = opp.supervisor_nome || null;
      }
    }

    const nowIso = new Date().toISOString();
    const newCommission: OperationCommission = {
      id: `opcomm_${Date.now()}`,
      opportunity_id: preview.opportunity_id || null,
      contract_id: preview.contract_id || null,
      numero_contrato: contractNumber,
      client_id: clientId,
      client_name: clientName,
      vendedor_id: sellerId,
      vendedor_nome: sellerName,
      supervisor_id: supId,
      supervisor_nome: supName,
      banco_id: preview.banco_id,
      banco_nome: preview.banco_nome,
      produto_id: preview.produto_id,
      produto_nome: preview.produto_nome,
      convenio_id: preview.convenio_id || null,
      convenio_nome: preview.convenio_nome || null,
      valor_operacao: preview.valor_operacao,
      prazo: preview.prazo,
      comissao_banco_tipo: preview.comissao_banco_tipo || 'PERCENTUAL',
      comissao_banco_taxa: preview.comissao_banco_taxa || 0,
      comissao_banco_valor: preview.comissao_banco_valor,
      comissao_vendedor_tipo: preview.comissao_vendedor_tipo || 'PERCENTUAL_DO_BANCO',
      comissao_vendedor_taxa: preview.comissao_vendedor_taxa || 0,
      comissao_vendedor_valor: preview.comissao_vendedor_valor,
      resultado_empresa_valor: preview.resultado_empresa_valor,
      rule_id: preview.rule_id || null,
      status: 'PENDENTE_APROVACAO',
      observacoes: notes || 'Prévia de comissão gerada via simulador.',
      created_at: nowIso,
      updated_at: nowIso,
    };

    this.operationCommissions.unshift(newCommission);
    this.saveOperationCommissionsToStorage();

    // History
    const hItem: CommissionStatusHistory = {
      id: `cstat_${Date.now()}`,
      commission_id: newCommission.id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      from_status: null,
      to_status: 'PENDENTE_APROVACAO',
      description: `Prévia calculada e submetida para aprovação por ${currentUser.name}.`,
      created_at: nowIso,
    };
    this.commissionHistories.unshift(hItem);
    this.saveCommissionHistoriesToStorage();

    this.logAudit(
      currentUser,
      'CALCULAR_PREVIA_COMISSAO',
      'Comissões',
      `Prévia R$ ${newCommission.comissao_vendedor_valor.toFixed(2)} submetida para aprovação (${newCommission.client_name} - ${newCommission.banco_nome}).`,
      newCommission.id
    );

    return newCommission;
  }

  public async approveCommission(
    commissionId: string,
    currentUser: User,
    notes?: string
  ): Promise<OperationCommission> {
    await new Promise((res) => setTimeout(res, 300));

    if (!this.hasPermission(currentUser, 'aprovar_comissao')) {
      throw new Error('Você não possui permissão para aprovar comissões.');
    }

    const comm = this.operationCommissions.find((c) => c.id === commissionId);
    if (!comm) throw new Error('Registro de comissão não encontrado.');

    if (comm.status === 'APROVADA') {
      throw new Error('Esta comissão já está aprovada.');
    }

    const oldStatus = comm.status;
    const nowIso = new Date().toISOString();

    comm.status = 'APROVADA';
    comm.approved_at = nowIso;
    comm.approved_by_user_id = currentUser.id;
    comm.approved_by_user_name = currentUser.name;
    if (notes) comm.observacoes = `${comm.observacoes ? `${comm.observacoes}\n` : ''}Aprovação: ${notes}`;
    comm.updated_at = nowIso;

    this.saveOperationCommissionsToStorage();

    const hItem: CommissionStatusHistory = {
      id: `cstat_${Date.now()}`,
      commission_id: comm.id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      from_status: oldStatus,
      to_status: 'APROVADA',
      description: `Comissão aprovada por ${currentUser.name}. ${notes ? `Obs: ${notes}` : ''}`,
      created_at: nowIso,
    };
    this.commissionHistories.unshift(hItem);
    this.saveCommissionHistoriesToStorage();

    this.logAudit(
      currentUser,
      'APROVAR_COMISSAO',
      'Comissões',
      `Comissão "${comm.id}" de R$ ${comm.comissao_vendedor_valor.toFixed(2)} APROVADA por ${currentUser.name}.`,
      comm.id
    );

    return comm;
  }

  public async returnCommissionForRevision(
    commissionId: string,
    currentUser: User,
    reason: string
  ): Promise<OperationCommission> {
    await new Promise((res) => setTimeout(res, 300));

    if (!this.hasPermission(currentUser, 'devolver_comissao') && !this.hasPermission(currentUser, 'rejeitar_comissao') && !this.hasPermission(currentUser, 'aprovar_comissao')) {
      throw new Error('Você não possui permissão para devolver comissões para revisão.');
    }

    if (!reason || reason.trim().length < 3) {
      throw new Error('É obrigatório informar a justificativa para devolver a comissão para revisão.');
    }

    const comm = this.operationCommissions.find((c) => c.id === commissionId);
    if (!comm) throw new Error('Registro de comissão não encontrado.');

    if (comm.status === 'APROVADA') {
      throw new Error('Esta comissão já foi aprovada e não pode ser devolvida.');
    }

    const oldStatus = comm.status;
    const nowIso = new Date().toISOString();

    comm.status = 'DEVOLVIDA_PARA_REVISAO';
    comm.returned_at = nowIso;
    comm.returned_by_user_id = currentUser.id;
    comm.returned_by_user_name = currentUser.name;
    comm.motivo_devolucao = reason.trim();
    comm.motivo_rejeicao = reason.trim();
    comm.updated_at = nowIso;

    this.saveOperationCommissionsToStorage();

    const hItem: CommissionStatusHistory = {
      id: `cstat_${Date.now()}`,
      commission_id: comm.id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      from_status: oldStatus,
      to_status: 'DEVOLVIDA_PARA_REVISAO',
      description: `Comissão DEVOLVIDA PARA REVISÃO por ${currentUser.name}. Justificativa: ${reason.trim()}`,
      created_at: nowIso,
    };
    this.commissionHistories.unshift(hItem);
    this.saveCommissionHistoriesToStorage();

    this.logAudit(
      currentUser,
      'DEVOLVER_COMISSAO_REVISAO',
      'Comissões',
      `Comissão "${comm.id}" DEVOLVIDA PARA REVISÃO por ${currentUser.name}. Justificativa: ${reason.trim()}`,
      comm.id
    );

    return comm;
  }

  // Alias para retrocompatibilidade
  public async rejectCommission(
    commissionId: string,
    currentUser: User,
    reason: string
  ): Promise<OperationCommission> {
    return this.returnCommissionForRevision(commissionId, currentUser, reason);
  }

  public async resubmitCommissionForApproval(
    commissionId: string,
    currentUser: User,
    notes?: string
  ): Promise<OperationCommission> {
    await new Promise((res) => setTimeout(res, 300));

    const comm = this.operationCommissions.find((c) => c.id === commissionId);
    if (!comm) throw new Error('Registro de comissão não encontrado.');

    if (comm.status !== 'DEVOLVIDA_PARA_REVISAO') {
      throw new Error('Apenas comissões devolvidas para revisão podem ser reenviadas.');
    }

    const oldStatus = comm.status;
    const nowIso = new Date().toISOString();

    comm.status = 'PENDENTE_APROVACAO';
    if (notes) {
      comm.observacoes = `${comm.observacoes ? `${comm.observacoes}\n` : ''}Reenvio: ${notes}`;
    }
    comm.updated_at = nowIso;

    this.saveOperationCommissionsToStorage();

    const hItem: CommissionStatusHistory = {
      id: `cstat_${Date.now()}`,
      commission_id: comm.id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      from_status: oldStatus,
      to_status: 'PENDENTE_APROVACAO',
      description: `Comissão REENVIADA PARA APROVAÇÃO por ${currentUser.name}.${notes ? ` Nota: ${notes}` : ''}`,
      created_at: nowIso,
    };
    this.commissionHistories.unshift(hItem);
    this.saveCommissionHistoriesToStorage();

    this.logAudit(
      currentUser,
      'REENVIAR_COMISSAO_APROVACAO',
      'Comissões',
      `Comissão "${comm.id}" reenviada para aprovação por ${currentUser.name}.`,
      comm.id
    );

    return comm;
  }

  public getCommissionStatusHistory(commissionId: string): CommissionStatusHistory[] {
    return this.commissionHistories.filter((h) => h.commission_id === commissionId);
  }

  public async createCommissionRule(
    data: Omit<CommissionRule, 'id' | 'created_at' | 'updated_at'>,
    currentUser: User | null
  ): Promise<CommissionRule> {
    await new Promise((res) => setTimeout(res, 300));
    const nowIso = new Date().toISOString();

    const bank = this.banks.find((b) => b.id === data.banco_id);
    const prod = this.products.find((p) => p.id === data.produto_id);
    const agree = data.convenio_id ? this.agreements.find((a) => a.id === data.convenio_id) : null;

    const newRule: CommissionRule = {
      id: `rule_${Date.now()}`,
      ...data,
      banco_nome: bank?.nome || data.banco_nome,
      produto_nome: prod?.nome || data.produto_nome,
      convenio_nome: agree?.nome || data.convenio_nome,
      created_at: nowIso,
      updated_at: nowIso,
    };

    this.commissionRules.unshift(newRule);
    this.saveCommissionRulesToStorage();

    this.logAudit(
      currentUser,
      'CRIAR_REGRA_COMISSAO',
      'Configurações -> Regras de Comissão',
      `Regra de comissão cadastrada para ${newRule.banco_nome} / ${newRule.produto_nome} (${newRule.tipo_comissao}: ${newRule.valor_comissao}).`,
      newRule.id
    );
    return newRule;
  }

  public async updateCommissionRule(
    id: string,
    data: Partial<Omit<CommissionRule, 'id' | 'created_at' | 'updated_at'>>,
    currentUser: User | null
  ): Promise<CommissionRule> {
    await new Promise((res) => setTimeout(res, 300));
    const rule = this.commissionRules.find((r) => r.id === id);
    if (!rule) throw new Error('Regra de comissão não encontrada.');

    if (data.banco_id) {
      const bank = this.banks.find((b) => b.id === data.banco_id);
      if (bank) data.banco_nome = bank.nome;
    }
    if (data.produto_id) {
      const prod = this.products.find((p) => p.id === data.produto_id);
      if (prod) data.produto_nome = prod.nome;
    }
    if (data.convenio_id) {
      const agree = this.agreements.find((a) => a.id === data.convenio_id);
      if (agree) data.convenio_nome = agree.nome;
    }

    Object.assign(rule, data);
    rule.updated_at = new Date().toISOString();
    this.saveCommissionRulesToStorage();

    this.logAudit(
      currentUser,
      'EDITAR_REGRA_COMISSAO',
      'Configurações -> Regras de Comissão',
      `Regra de comissão "${rule.id}" atualizada.`,
      rule.id
    );
    return rule;
  }

  public async deleteCommissionRule(id: string, currentUser: User | null): Promise<void> {
    await new Promise((res) => setTimeout(res, 250));
    const index = this.commissionRules.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Regra de comissão não encontrada.');

    const removed = this.commissionRules.splice(index, 1)[0];
    this.saveCommissionRulesToStorage();

    this.logAudit(
      currentUser,
      'EXCLUIR_REGRA_COMISSAO',
      'Configurações -> Regras de Comissão',
      `Regra de comissão "${removed.id}" excluída.`,
      id
    );
  }

  public async batchImportCommissionRules(
    validRows: ParsedExcelRuleRow[],
    mode: 'add' | 'overwrite',
    fileName: string,
    currentUser: User | null,
    conflictResolutions: Record<number, 'keep_existing' | 'overwrite_with_excel' | 'skip'> = {}
  ): Promise<ExcelImportExecutionResult> {
    await new Promise((res) => setTimeout(res, 400));

    if (!currentUser) throw new Error('Usuário não autenticado.');
    if (!this.hasPermission(currentUser, 'gerenciar_regras_comissao') && !this.hasPermission(currentUser, 'importar_regras_comissao')) {
      throw new Error('Você não possui permissão para importar regras de comissão.');
    }

    if (!validRows || validRows.length === 0) {
      throw new Error('Nenhuma regra válida para importar.');
    }

    // TRANSAÇÃO: Criar snapshot em memória antes de qualquer alteração
    const snapshotBefore = JSON.parse(JSON.stringify(this.commissionRules)) as CommissionRule[];
    const nowStr = new Date().toISOString();

    try {
      const banksInImport = Array.from(new Set(validRows.map((r) => r.bancoId).filter(Boolean))) as string[];
      const bankNamesInImport = Array.from(new Set(validRows.map((r) => r.bancoNome).filter(Boolean))) as string[];

      let countBefore = 0;
      let replacedRulesSnapshot: CommissionRule[] = [];

      // MODO SUBSTITUIÇÃO: Fazer backup lógico das regras anteriores dos bancos
      if (mode === 'overwrite' && banksInImport.length > 0) {
        replacedRulesSnapshot = this.commissionRules.filter((r) => banksInImport.includes(r.banco_id));
        countBefore = replacedRulesSnapshot.length;

        // Registrar Backup Lógico na Auditoria antes de limpar
        if (countBefore > 0) {
          this.logAudit(
            currentUser,
            'BACKUP_LOGICO_REGRAS_SUBSTITUIDAS',
            'Comissões -> Tabelas & Regras',
            `Backup prévio de ${countBefore} regras substituídas dos bancos [${bankNamesInImport.join(', ')}]. Arquivo: "${fileName}".`,
            `backup_${Date.now()}`
          );
        }

        // Remover regras anteriores dos bancos selecionados
        this.commissionRules = this.commissionRules.filter((r) => !banksInImport.includes(r.banco_id));
      }

      const createdRules: CommissionRule[] = [];
      let skippedDuplicatesCount = 0;
      let updatedConflictsCount = 0;

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        if (!row.bancoId || !row.produtoId) continue;

        // No modo incremental ('add'), respeitar duplicidades e conflitos
        if (mode === 'add') {
          if (row.isDuplicate || row.statusTag === 'DUPLICADA') {
            skippedDuplicatesCount++;
            continue; // Ignorar duplicadas
          }

          if (row.hasConflict || row.statusTag === 'CONFLITO') {
            const decision = conflictResolutions[row.rowNumber] || row.conflictInfo?.action || 'keep_existing';

            if (decision === 'keep_existing' || decision === 'skip') {
              continue; // Mantém a regra existente no banco sem alteração
            }

            if (decision === 'overwrite_with_excel' && row.matchedExistingRule) {
              // Atualizar regra existente com os valores da planilha
              const existingIdx = this.commissionRules.findIndex((r) => r.id === row.matchedExistingRule?.id);
              if (existingIdx !== -1) {
                const oldRuleCopy = { ...this.commissionRules[existingIdx] };
                this.commissionRules[existingIdx] = {
                  ...this.commissionRules[existingIdx],
                  tipo_comissao_banco: row.tipoComissaoBanco,
                  valor_comissao_banco: row.valorComissaoBanco,
                  tipo_comissao_vendedor: row.tipoComissaoVendedor,
                  valor_comissao_vendedor: row.valorComissaoVendedor,
                  tipo_comissao: row.tipoComissaoBanco,
                  valor_comissao: row.valorComissaoBanco,
                  updated_at: nowStr,
                };
                updatedConflictsCount++;

                // Log de auditoria detalhado da substituição do conflito
                this.logAudit(
                  currentUser,
                  'SUBSTITUICAO_REGRA_CONFLITO',
                  'Comissões -> Tabelas & Regras',
                  `Regra #${oldRuleCopy.id} (${row.bancoNome} - ${row.produtoNome}) atualizada via resolução de conflito Excel. Banco: ${oldRuleCopy.valor_comissao_banco}% -> ${row.valorComissaoBanco}%, Vendedor: ${oldRuleCopy.valor_comissao_vendedor}% -> ${row.valorComissaoVendedor}%. Arquivo: "${fileName}".`,
                  oldRuleCopy.id
                );
                continue;
              }
            }
          }
        }

        // Criar nova regra
        const ruleId = `rule_imp_${Date.now()}_${i + 1}_${Math.random().toString(36).substr(2, 4)}`;

        const newRule: CommissionRule = {
          id: ruleId,
          banco_id: row.bancoId,
          banco_nome: row.bancoNome || 'Banco',
          produto_id: row.produtoId,
          produto_nome: row.produtoNome || 'Produto',
          convenio_id: row.convenioId || null,
          convenio_nome: row.convenioId ? row.convenioNome : null,
          prazo_min: row.prazoMin,
          prazo_max: row.prazoMax,
          valor_min: row.valorMin,
          valor_max: row.valorMax,
          tipo_comissao_banco: row.tipoComissaoBanco,
          valor_comissao_banco: row.valorComissaoBanco,
          tipo_comissao_vendedor: row.tipoComissaoVendedor,
          valor_comissao_vendedor: row.valorComissaoVendedor,
          tipo_comissao: row.tipoComissaoBanco,
          valor_comissao: row.valorComissaoBanco,
          data_inicio: row.dataInicio || null,
          data_termino: row.dataTermino || null,
          status: 'Ativa',
          observacoes: row.observacoes || `Importado de ${fileName}`,
          created_at: nowStr,
          updated_at: nowStr,
        };

        this.commissionRules.unshift(newRule);
        createdRules.push(newRule);
      }

      this.saveCommissionRulesToStorage();

      const finalBanksList: string[] = bankNamesInImport.filter((b): b is string => Boolean(b));

      this.logAudit(
        currentUser,
        'IMPORTACAO_EXCEL_REGRAS_COMISSAO',
        'Comissões -> Tabelas & Regras',
        `Importação em massa concluída: ${createdRules.length} novas regras inseridas, ${updatedConflictsCount} conflitos atualizados, ${skippedDuplicatesCount} duplicidades ignoradas do arquivo "${fileName}". Modo: ${
          mode === 'overwrite' ? `Substituição (${countBefore} anteriores removidas)` : 'Incremental'
        }. Bancos: ${finalBanksList.join(', ')}.`,
        `import_${Date.now()}`
      );

      return {
        importedCount: createdRules.length,
        updatedConflictsCount,
        skippedDuplicatesCount,
        overwrittenBanks: finalBanksList,
        createdRules,
        backupSnapshotId: mode === 'overwrite' ? `backup_${Date.now()}` : undefined,
        timestamp: nowStr,
      };
    } catch (err) {
      // ROLLBACK: Em caso de erro, restaura o snapshot original sem alterações parciais
      this.commissionRules = snapshotBefore;
      this.saveCommissionRulesToStorage();

      this.logAudit(
        currentUser,
        'ROLLBACK_IMPORTACAO_EXCEL',
        'Comissões -> Tabelas & Regras',
        `Rollback executado na importação do arquivo "${fileName}". Estado das regras restaurado com sucesso. Erro: ${(err as any)?.message || 'Erro desconhecido'}.`
      );

      throw new Error(`Falha na transação de importação: ${(err as any)?.message || 'Erro inesperado'}. O sistema executou ROLLBACK e nenhuma alteração foi gravada.`);
    }
  }

  // ======================================================
  // FASE 5 - MÓDULO FINANCEIRO | PARTE 1
  // RECEITAS, CUSTOS OPERACIONAIS & HISTÓRICO DE RECEBIMENTOS
  // ======================================================

  public getFinancialRevenues(filters?: {
    status?: string;
    bank_id?: string;
    seller_id?: string;
    search?: string;
  }): FinancialRevenue[] {
    let result = [...this.financialRevenues];

    if (filters?.status && filters.status !== 'TODOS') {
      result = result.filter((r) => r.status === filters.status);
    }
    if (filters?.bank_id && filters.bank_id !== 'TODOS') {
      result = result.filter((r) => r.bank_id === filters.bank_id);
    }
    if (filters?.seller_id && filters.seller_id !== 'TODOS') {
      result = result.filter((r) => r.seller_id === filters.seller_id);
    }
    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          r.bank_nome.toLowerCase().includes(q) ||
          r.product_nome.toLowerCase().includes(q) ||
          (r.client_nome && r.client_nome.toLowerCase().includes(q)) ||
          (r.contract_numero && r.contract_numero.toLowerCase().includes(q)) ||
          r.seller_nome.toLowerCase().includes(q)
      );
    }

    // Attach receipts to each revenue
    return result.map((rev) => {
      const receipts = this.financialReceipts.filter((rc) => rc.financial_revenue_id === rev.id);
      return {
        ...rev,
        receipts,
      };
    });
  }

  public getFinancialRevenueById(id: string): FinancialRevenue | null {
    const rev = this.financialRevenues.find((r) => r.id === id);
    if (!rev) return null;
    const receipts = this.financialReceipts.filter((rc) => rc.financial_revenue_id === rev.id);
    return {
      ...rev,
      receipts,
    };
  }

  public async createFinancialRevenue(
    data: Partial<FinancialRevenue>,
    currentUser: User | null
  ): Promise<FinancialRevenue> {
    await new Promise((res) => setTimeout(res, 250));

    if (!currentUser) throw new Error('Usuário não autenticado.');
    if (!this.hasPermission(currentUser, 'visualizar_financeiro') && !this.hasPermission(currentUser, 'gerenciar_receitas')) {
      throw new Error('Você não possui permissão para cadastrar receitas financeiras.');
    }

    if (!data.bank_id || !data.expected_amount || data.expected_amount <= 0) {
      throw new Error('Banco e valor previsto são obrigatórios.');
    }

    const nowStr = new Date().toISOString();
    const id = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const bank = this.banks.find((b) => b.id === data.bank_id);
    const product = this.products.find((p) => p.id === data.product_id);
    const agreement = this.agreements.find((a) => a.id === data.agreement_id);
    const opportunity = data.opportunity_id ? this.opportunities.find((o) => o.id === data.opportunity_id) : undefined;
    const contract = data.contract_id ? this.contracts.find((c) => c.id === data.contract_id) : undefined;
    const seller = data.seller_id ? this.users.find((u) => u.id === data.seller_id) : currentUser;

    const expectedAmount = Number(data.expected_amount) || 0;
    const receivedAmount = Number(data.received_amount) || 0;
    const differenceAmount = receivedAmount - expectedAmount;

    let status: FinancialRevenueStatus = data.status || 'PREVISTA';
    if (receivedAmount >= expectedAmount && expectedAmount > 0) {
      status = 'RECEBIDA';
    } else if (receivedAmount > 0 && receivedAmount < expectedAmount) {
      status = 'RECEBIDA_PARCIALMENTE';
    } else if (receivedAmount === 0 && data.expected_date && new Date(data.expected_date) < new Date()) {
      status = 'ATRASADA';
    }

    const newRev: FinancialRevenue = {
      id,
      operation_commission_id: data.operation_commission_id || null,
      opportunity_id: data.opportunity_id || (opportunity ? opportunity.id : `manual_${Date.now()}`),
      opportunity_title: data.opportunity_title || (opportunity ? `${opportunity.banco_nome} - ${opportunity.produto_nome} (${opportunity.client_name})` : `Operação ${bank?.nome || 'Banco'}`),
      contract_id: data.contract_id || (contract ? contract.id : null),
      contract_numero: data.contract_numero || (contract ? contract.numero_contrato : null),
      client_id: data.client_id || (opportunity ? opportunity.client_id : null),
      client_nome: data.client_nome || (opportunity ? opportunity.client_name : null),
      bank_id: data.bank_id,
      bank_nome: data.bank_nome || (bank ? bank.nome : 'Banco'),
      product_id: data.product_id || (product ? product.id : ''),
      product_nome: data.product_nome || (product ? product.nome : 'Produto'),
      agreement_id: data.agreement_id || (agreement ? agreement.id : null),
      agreement_nome: data.agreement_nome || (agreement ? agreement.nome : null),
      seller_id: seller?.id || currentUser.id,
      seller_nome: seller?.name || currentUser.name,
      supervisor_id: data.supervisor_id || (opportunity?.supervisor_id || null),
      supervisor_nome: data.supervisor_nome || (opportunity?.supervisor_nome || null),
      description: data.description || `Receita de Comissão ${bank?.nome || ''} - ${product?.nome || ''}`,
      expected_amount: expectedAmount,
      received_amount: receivedAmount,
      difference_amount: differenceAmount,
      expected_date: data.expected_date || new Date().toISOString().split('T')[0],
      received_date: data.received_date || (receivedAmount > 0 ? nowStr.split('T')[0] : null),
      status,
      notes: data.notes || '',
      created_by: currentUser.id,
      created_by_name: currentUser.name,
      created_at: nowStr,
      updated_at: nowStr,
    };

    this.financialRevenues.unshift(newRev);
    this.saveFinancialRevenuesToStorage();

    this.logAudit(
      currentUser,
      'CRIAR_RECEITA_FINANCEIRA',
      'Financeiro -> Receitas',
      `Receita financeira #${id} criada: R$ ${expectedAmount.toFixed(2)} prevista do banco ${newRev.bank_nome}.`,
      id
    );

    return newRev;
  }

  public async syncApprovedCommissionsToRevenues(
    currentUser: User | null
  ): Promise<{ syncedCount: number; alreadyExistingCount: number }> {
    await new Promise((res) => setTimeout(res, 300));

    if (!currentUser) throw new Error('Usuário não autenticado.');
    if (!this.hasPermission(currentUser, 'visualizar_financeiro') && !this.hasPermission(currentUser, 'gerenciar_receitas')) {
      throw new Error('Você não possui permissão para sincronizar receitas financeiras.');
    }

    const approvedComms = this.operationCommissions.filter((c) => c.status === 'APROVADA');
    let syncedCount = 0;
    let alreadyExistingCount = 0;
    const nowStr = new Date().toISOString();

    for (const comm of approvedComms) {
      // Check if already linked
      const exists = this.financialRevenues.some(
        (r) => r.operation_commission_id === comm.id || (r.opportunity_id === comm.opportunity_id && comm.opportunity_id)
      );

      if (exists) {
        alreadyExistingCount++;
        continue;
      }

      const opp = this.opportunities.find((o) => o.id === comm.opportunity_id);
      const ctr = this.contracts.find((c) => c.opportunity_id === comm.opportunity_id);

      const bankExpected = comm.comissao_banco_valor || 0;
      const id = `rev_sync_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const oppTitle = opp ? `${opp.banco_nome} - ${opp.produto_nome} (${opp.client_name})` : `${comm.banco_nome} - ${comm.produto_nome} (${comm.client_name})`;

      const newRev: FinancialRevenue = {
        id,
        operation_commission_id: comm.id,
        opportunity_id: comm.opportunity_id || (opp ? opp.id : `comm_opp_${comm.id}`),
        opportunity_title: oppTitle,
        contract_id: comm.contract_id || (ctr ? ctr.id : null),
        contract_numero: comm.numero_contrato || (ctr ? ctr.numero_contrato : null),
        client_id: comm.client_id || (opp ? opp.client_id : null),
        client_nome: comm.client_name || (opp ? opp.client_name : null),
        bank_id: comm.banco_id,
        bank_nome: comm.banco_nome,
        product_id: comm.produto_id,
        product_nome: comm.produto_nome,
        agreement_id: comm.convenio_id || null,
        agreement_nome: comm.convenio_nome || null,
        seller_id: comm.vendedor_id,
        seller_nome: comm.vendedor_nome,
        supervisor_id: comm.supervisor_id || (opp ? opp.supervisor_id : null),
        supervisor_nome: comm.supervisor_nome || (opp ? opp.supervisor_nome : null),
        description: `Receita comissão banco ${comm.banco_nome} - ${oppTitle}`,
        expected_amount: bankExpected,
        received_amount: 0.0,
        difference_amount: -bankExpected,
        expected_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 dias
        received_date: null,
        status: 'PREVISTA',
        notes: `Gerada automaticamente da comissão aprovada #${comm.id}`,
        created_by: currentUser.id,
        created_by_name: currentUser.name,
        created_at: nowStr,
        updated_at: nowStr,
      };

      this.financialRevenues.unshift(newRev);
      syncedCount++;
    }

    if (syncedCount > 0) {
      this.saveFinancialRevenuesToStorage();
      this.logAudit(
        currentUser,
        'SINCRONIZAR_COMISSOES_FINANCEIRO',
        'Financeiro -> Receitas',
        `Sincronização executada: ${syncedCount} novas receitas financeiras geradas a partir de comissões aprovadas.`,
        `sync_${Date.now()}`
      );
    }

    return { syncedCount, alreadyExistingCount };
  }

  public async registerRevenueReceipt(
    revenueId: string,
    receiptData: {
      amount: number;
      received_date: string;
      reference?: string;
      notes?: string;
    },
    currentUser: User | null
  ): Promise<{ revenue: FinancialRevenue; receipt: FinancialRevenueReceipt }> {
    await new Promise((res) => setTimeout(res, 250));

    if (!currentUser) throw new Error('Usuário não autenticado.');
    if (!this.hasPermission(currentUser, 'visualizar_financeiro') && !this.hasPermission(currentUser, 'registrar_recebimento')) {
      throw new Error('Você não possui permissão para registrar recebimentos financeiros.');
    }

    const revIndex = this.financialRevenues.findIndex((r) => r.id === revenueId);
    if (revIndex === -1) throw new Error('Receita financeira não encontrada.');

    const revenue = this.financialRevenues[revIndex];
    const amountNum = Number(receiptData.amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('O valor recebido deve ser maior que zero.');
    }

    const nowStr = new Date().toISOString();
    const receiptId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const newReceipt: FinancialRevenueReceipt = {
      id: receiptId,
      financial_revenue_id: revenueId,
      amount: amountNum,
      received_date: receiptData.received_date || nowStr.split('T')[0],
      reference: receiptData.reference || null,
      notes: receiptData.notes || null,
      created_by: currentUser.id,
      created_by_name: currentUser.name,
      created_at: nowStr,
    };

    this.financialReceipts.push(newReceipt);
    this.saveFinancialReceiptsToStorage();

    // Recalculate revenue cumulative amounts
    const revenueReceipts = this.financialReceipts.filter((r) => r.financial_revenue_id === revenueId);
    const newTotalReceived = revenueReceipts.reduce((acc, curr) => acc + curr.amount, 0);
    const newDifference = newTotalReceived - revenue.expected_amount;

    let newStatus: FinancialRevenueStatus = revenue.status;
    if (newTotalReceived >= revenue.expected_amount && revenue.expected_amount > 0) {
      newStatus = 'RECEBIDA';
    } else if (newTotalReceived > 0) {
      newStatus = 'RECEBIDA_PARCIALMENTE';
    }

    this.financialRevenues[revIndex] = {
      ...revenue,
      received_amount: newTotalReceived,
      difference_amount: newDifference,
      received_date: receiptData.received_date || nowStr.split('T')[0],
      status: newStatus,
      updated_at: nowStr,
    };

    this.saveFinancialRevenuesToStorage();

    this.logAudit(
      currentUser,
      'REGISTRAR_RECEBIMENTO_FINANCEIRO',
      'Financeiro -> Receitas',
      `Recebimento de R$ ${amountNum.toFixed(2)} registrado para a receita #${revenue.id} (${revenue.bank_nome}). Total recebido: R$ ${newTotalReceived.toFixed(2)} / R$ ${revenue.expected_amount.toFixed(2)}. Status: ${newStatus}.`,
      receiptId
    );

    return {
      revenue: {
        ...this.financialRevenues[revIndex],
        receipts: revenueReceipts,
      },
      receipt: newReceipt,
    };
  }

  public async updateFinancialRevenueStatus(
    id: string,
    status: FinancialRevenueStatus,
    currentUser: User | null
  ): Promise<FinancialRevenue> {
    await new Promise((res) => setTimeout(res, 200));
    if (!currentUser) throw new Error('Usuário não autenticado.');

    const revIndex = this.financialRevenues.findIndex((r) => r.id === id);
    if (revIndex === -1) throw new Error('Receita financeira não encontrada.');

    const rev = this.financialRevenues[revIndex];
    const prevStatus = rev.status;

    rev.status = status;
    rev.updated_at = new Date().toISOString();
    this.saveFinancialRevenuesToStorage();

    this.logAudit(
      currentUser,
      'ATUALIZAR_STATUS_RECEITA',
      'Financeiro -> Receitas',
      `Status da receita #${id} (${rev.bank_nome}) alterado de "${prevStatus}" para "${status}" por ${currentUser?.name || 'Sistema'}.`,
      id
    );

    return rev;
  }

  public async deleteFinancialRevenue(id: string, currentUser: User | null): Promise<void> {
    await new Promise((res) => setTimeout(res, 200));
    if (!currentUser) throw new Error('Usuário não autenticado.');

    const index = this.financialRevenues.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Receita financeira não encontrada.');

    const removed = this.financialRevenues.splice(index, 1)[0];
    this.saveFinancialRevenuesToStorage();

    // Remove associated receipts
    this.financialReceipts = this.financialReceipts.filter((rc) => rc.financial_revenue_id !== id);
    this.saveFinancialReceiptsToStorage();

    this.logAudit(
      currentUser,
      'EXCLUIR_RECEITA_FINANCEIRA',
      'Financeiro -> Receitas',
      `Receita financeira #${removed.id} (${removed.bank_nome} - R$ ${removed.expected_amount}) excluída.`,
      id
    );
  }

  // ======================================================
  // CUSTOS OPERACIONAIS (DIRETOS DA OPERAÇÃO)
  // ======================================================

  public getFinancialOperationalCosts(filters?: {
    status?: string;
    category?: string;
    bank_id?: string;
    search?: string;
  }): FinancialOperationalCost[] {
    let result = [...this.financialCosts];

    if (filters?.status && filters.status !== 'TODOS') {
      result = result.filter((c) => c.status === filters.status);
    }
    if (filters?.category && filters.category !== 'TODOS') {
      result = result.filter((c) => c.category === filters.category);
    }
    if (filters?.bank_id && filters.bank_id !== 'TODOS') {
      result = result.filter((c) => c.bank_id === filters.bank_id);
    }
    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.description.toLowerCase().includes(q) ||
          (c.bank_nome && c.bank_nome.toLowerCase().includes(q)) ||
          (c.opportunity_title && c.opportunity_title.toLowerCase().includes(q)) ||
          (c.client_nome && c.client_nome.toLowerCase().includes(q))
      );
    }

    return result;
  }

  public async createFinancialOperationalCost(
    data: Partial<FinancialOperationalCost>,
    currentUser: User | null
  ): Promise<FinancialOperationalCost> {
    await new Promise((res) => setTimeout(res, 250));

    if (!currentUser) throw new Error('Usuário não autenticado.');
    if (!this.hasPermission(currentUser, 'visualizar_financeiro') && !this.hasPermission(currentUser, 'gerenciar_custos_operacionais')) {
      throw new Error('Você não possui permissão para cadastrar custos operacionais.');
    }

    if (!data.description || !data.amount || data.amount <= 0) {
      throw new Error('Descrição e valor do custo são obrigatórios.');
    }

    const nowStr = new Date().toISOString();
    const id = `cost_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const opp = data.opportunity_id ? this.opportunities.find((o) => o.id === data.opportunity_id) : undefined;
    const ctr = data.contract_id ? this.contracts.find((c) => c.id === data.contract_id) : undefined;
    const bank = data.bank_id ? this.banks.find((b) => b.id === data.bank_id) : undefined;

    const newCost: FinancialOperationalCost = {
      id,
      opportunity_id: data.opportunity_id || (opp ? opp.id : null),
      opportunity_title: data.opportunity_title || (opp ? `${opp.banco_nome} - ${opp.produto_nome} (${opp.client_name})` : null),
      contract_id: data.contract_id || (ctr ? ctr.id : null),
      contract_numero: data.contract_numero || (ctr ? ctr.numero_contrato : null),
      client_id: data.client_id || (opp ? opp.client_id : null),
      client_nome: data.client_nome || (opp ? opp.client_name : null),
      bank_id: data.bank_id || (bank ? bank.id : null),
      bank_nome: data.bank_nome || (bank ? bank.nome : null),
      category: data.category || 'OUTRO',
      description: data.description,
      amount: Number(data.amount) || 0,
      date: data.date || nowStr.split('T')[0],
      status: data.status || 'PAGO',
      payment_date: data.status === 'PAGO' ? (data.payment_date || nowStr.split('T')[0]) : null,
      notes: data.notes || '',
      created_by: currentUser.id,
      created_by_name: currentUser.name,
      created_at: nowStr,
      updated_at: nowStr,
    };

    this.financialCosts.unshift(newCost);
    this.saveFinancialCostsToStorage();

    this.logAudit(
      currentUser,
      'CRIAR_CUSTO_OPERACIONAL',
      'Financeiro -> Custos Operacionais',
      `Custo operacional #${id} lançado: R$ ${newCost.amount.toFixed(2)} (${newCost.description} - ${newCost.category}).`,
      id
    );

    return newCost;
  }

  public async updateFinancialOperationalCost(
    id: string,
    data: Partial<FinancialOperationalCost>,
    currentUser: User | null
  ): Promise<FinancialOperationalCost> {
    await new Promise((res) => setTimeout(res, 200));
    if (!currentUser) throw new Error('Usuário não autenticado.');

    const idx = this.financialCosts.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Custo operacional não encontrado.');

    const cost = this.financialCosts[idx];
    const prevAmount = cost.amount;
    const prevStatus = cost.status;
    const prevDesc = cost.description;

    Object.assign(cost, data);
    cost.updated_at = new Date().toISOString();

    if (data.status === 'PAGO' && !cost.payment_date) {
      cost.payment_date = new Date().toISOString().split('T')[0];
    } else if (data.status === 'PENDENTE') {
      cost.payment_date = null;
    }

    this.saveFinancialCostsToStorage();

    const amountChange = prevAmount !== cost.amount ? ` Valor anterior: R$ ${prevAmount.toFixed(2)} -> Valor novo: R$ ${cost.amount.toFixed(2)}.` : '';
    const statusChange = prevStatus !== cost.status ? ` Status anterior: ${prevStatus} -> Status novo: ${cost.status}.` : '';
    const descChange = prevDesc !== cost.description ? ` Descrição anterior: "${prevDesc}" -> Descrição nova: "${cost.description}".` : '';

    this.logAudit(
      currentUser,
      'EDITAR_CUSTO_OPERACIONAL',
      'Financeiro -> Custos Operacionais',
      `Custo operacional #${id} atualizado por ${currentUser?.name || 'Sistema'}.${amountChange}${statusChange}${descChange}`,
      id
    );

    return cost;
  }

  public async deleteFinancialOperationalCost(id: string, currentUser: User | null): Promise<void> {
    await new Promise((res) => setTimeout(res, 200));
    if (!currentUser) throw new Error('Usuário não autenticado.');

    const idx = this.financialCosts.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Custo operacional não encontrado.');

    const removed = this.financialCosts.splice(idx, 1)[0];
    this.saveFinancialCostsToStorage();

    this.logAudit(
      currentUser,
      'EXCLUIR_CUSTO_OPERACIONAL',
      'Financeiro -> Custos Operacionais',
      `Custo operacional #${removed.id} (${removed.description} - R$ ${removed.amount}) excluído.`,
      id
    );
  }

  // ======================================================
  // SUMÁRIO DA VISÃO FINANCEIRA
  // ======================================================

  public getFinancialGeneralExpenses(filters?: {
    status?: string;
    category?: string;
    search?: string;
  }): FinancialGeneralExpense[] {
    let result = [...this.financialExpenses];

    if (filters?.status && filters.status !== 'TODOS') {
      result = result.filter((c) => c.status === filters.status);
    }
    if (filters?.category && filters.category !== 'TODOS') {
      result = result.filter((c) => c.category === filters.category);
    }
    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    return result;
  }

  public async createFinancialGeneralExpense(
    data: Partial<FinancialGeneralExpense>,
    currentUser: User | null
  ): Promise<FinancialGeneralExpense> {
    await new Promise((res) => setTimeout(res, 250));

    if (!currentUser) throw new Error('Usuário não autenticado.');
    if (!this.hasPermission(currentUser, 'visualizar_financeiro') && !this.hasPermission(currentUser, 'gerenciar_custos_operacionais')) {
      throw new Error('Você não possui permissão para cadastrar despesas gerais.');
    }

    if (!data.description || !data.amount || data.amount <= 0 || !data.category) {
      throw new Error('Descrição, categoria e valor da despesa são obrigatórios.');
    }

    const nowStr = new Date().toISOString();
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const newExpense: FinancialGeneralExpense = {
      id,
      category: data.category as GeneralExpenseCategory,
      description: data.description,
      amount: Number(data.amount) || 0,
      due_date: data.due_date || nowStr.split('T')[0],
      status: data.status || 'PENDENTE',
      payment_date: data.status === 'PAGO' ? (data.payment_date || nowStr.split('T')[0]) : null,
      notes: data.notes || '',
      created_by: currentUser.id,
      created_by_name: currentUser.name,
      created_at: nowStr,
      updated_at: nowStr,
    };

    this.financialExpenses.unshift(newExpense);
    this.saveFinancialExpensesToStorage();

    this.logAudit(
      currentUser,
      'CRIAR_DESPESA_GERAL',
      'Financeiro -> Despesas Gerais',
      `Despesa geral #${id} lançada: R$ ${newExpense.amount.toFixed(2)} (${newExpense.description} - ${newExpense.category}).`,
      id
    );

    return newExpense;
  }

  public async updateFinancialGeneralExpense(
    id: string,
    data: Partial<FinancialGeneralExpense>,
    currentUser: User | null
  ): Promise<FinancialGeneralExpense> {
    await new Promise((res) => setTimeout(res, 200));
    if (!currentUser) throw new Error('Usuário não autenticado.');

    const idx = this.financialExpenses.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Despesa geral não encontrada.');

    const expense = this.financialExpenses[idx];
    const prevAmount = expense.amount;
    const prevStatus = expense.status;
    const prevDesc = expense.description;

    Object.assign(expense, data);
    expense.updated_at = new Date().toISOString();

    if (data.status === 'PAGO' && !expense.payment_date) {
      expense.payment_date = new Date().toISOString().split('T')[0];
    } else if (data.status !== 'PAGO') {
      expense.payment_date = null;
    }

    this.saveFinancialExpensesToStorage();

    const amountChange = prevAmount !== expense.amount ? ` Valor anterior: R$ ${prevAmount.toFixed(2)} -> Valor novo: R$ ${expense.amount.toFixed(2)}.` : '';
    const statusChange = prevStatus !== expense.status ? ` Status anterior: ${prevStatus} -> Status novo: ${expense.status}.` : '';
    const descChange = prevDesc !== expense.description ? ` Descrição anterior: "${prevDesc}" -> Descrição nova: "${expense.description}".` : '';

    this.logAudit(
      currentUser,
      'EDITAR_DESPESA_GERAL',
      'Financeiro -> Despesas Gerais',
      `Despesa geral #${id} atualizada por ${currentUser?.name || 'Sistema'}.${amountChange}${statusChange}${descChange}`,
      id
    );

    return expense;
  }

  public async deleteFinancialGeneralExpense(id: string, currentUser: User | null): Promise<void> {
    await new Promise((res) => setTimeout(res, 200));
    if (!currentUser) throw new Error('Usuário não autenticado.');

    const idx = this.financialExpenses.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Despesa geral não encontrada.');

    const removed = this.financialExpenses.splice(idx, 1)[0];
    this.saveFinancialExpensesToStorage();

    this.logAudit(
      currentUser,
      'EXCLUIR_DESPESA_GERAL',
      'Financeiro -> Despesas Gerais',
      `Despesa geral #${removed.id} (${removed.description} - R$ ${removed.amount}) excluída.`,
      id
    );
  }

  public async paySellerCommission(
    commissionId: string,
    paymentDate: string,
    currentUser: User | null
  ): Promise<OperationCommission> {
    await new Promise((res) => setTimeout(res, 250));

    if (!currentUser) throw new Error('Usuário não autenticado.');
    if (!this.hasPermission(currentUser, 'visualizar_financeiro') && !this.hasPermission(currentUser, 'registrar_recebimento')) {
      throw new Error('Você não possui permissão para registrar pagamento de comissões.');
    }

    const idx = this.operationCommissions.findIndex((c) => c.id === commissionId);
    if (idx === -1) throw new Error('Registro de comissão não encontrado.');

    const comm = this.operationCommissions[idx];

    comm.comissao_vendedor_status = 'PAGO';
    comm.comissao_vendedor_data_pagamento = paymentDate || new Date().toISOString().split('T')[0];
    comm.updated_at = new Date().toISOString();

    this.saveOperationCommissionsToStorage();

    this.logAudit(
      currentUser,
      'PAGAR_COMISSAO_VENDEDOR',
      'Financeiro -> Comissões Vendedores',
      `Pagamento de comissão realizado para o vendedor ${comm.vendedor_nome} no valor de R$ ${comm.comissao_vendedor_valor.toFixed(2)} referente à operação #${comm.id}.`,
      comm.id
    );

    return comm;
  }

  // ======================================================
  // SUMÁRIO DA VISÃO FINANCEIRA
  // ======================================================

  public getFinancialOverviewSummary(filters?: { bank_id?: string; seller_id?: string }): FinancialOverviewSummary {
    let revenues = [...this.financialRevenues];
    let costs = [...this.financialCosts];
    let expenses = [...this.financialExpenses];
    let commissions = [...this.operationCommissions];

    if (filters?.bank_id && filters.bank_id !== 'TODOS') {
      revenues = revenues.filter((r) => r.bank_id === filters.bank_id);
      costs = costs.filter((c) => c.bank_id === filters.bank_id);
    }

    if (filters?.seller_id && filters.seller_id !== 'TODOS') {
      revenues = revenues.filter((r) => r.seller_id === filters.seller_id);
      commissions = commissions.filter((c) => c.vendedor_id === filters.seller_id);
    }

    const totalExpectedRevenue = revenues.reduce((acc, r) => acc + r.expected_amount, 0);
    const totalReceivedRevenue = revenues.reduce((acc, r) => acc + r.received_amount, 0);
    const totalPendingRevenue = revenues
      .filter((r) => r.status === 'PREVISTA' || r.status === 'RECEBIDA_PARCIALMENTE')
      .reduce((acc, r) => acc + Math.max(0, r.expected_amount - r.received_amount), 0);
    const totalDelayedRevenue = revenues
      .filter((r) => r.status === 'ATRASADA')
      .reduce((acc, r) => acc + Math.max(0, r.expected_amount - r.received_amount), 0);

    const totalOperationalCosts = costs.reduce((acc, c) => acc + c.amount, 0);
    const paidOperationalCosts = costs.filter((c) => c.status === 'PAGO').reduce((acc, c) => acc + c.amount, 0);
    const pendingOperationalCosts = costs.filter((c) => c.status === 'PENDENTE').reduce((acc, c) => acc + c.amount, 0);

    const netOperationalGross = totalReceivedRevenue - paidOperationalCosts;
    const projectedGross = totalExpectedRevenue - totalOperationalCosts;

    // FASE 5 - PARTE 2 CALCULATIONS
    const totalGeneralExpenses = expenses.filter((e) => e.status !== 'CANCELADO').reduce((acc, e) => acc + e.amount, 0);
    const paidGeneralExpenses = expenses.filter((e) => e.status === 'PAGO').reduce((acc, e) => acc + e.amount, 0);
    const pendingGeneralExpenses = expenses.filter((e) => e.status === 'PENDENTE').reduce((acc, e) => acc + e.amount, 0);

    // Only approved commissions from Fase 4 are counted as payables
    const approvedComms = commissions.filter((c) => c.status === 'APROVADA');
    const totalSellerCommissions = approvedComms.reduce((acc, c) => acc + c.comissao_vendedor_valor, 0);
    const paidSellerCommissions = approvedComms.filter((c) => c.comissao_vendedor_status === 'PAGO').reduce((acc, c) => acc + c.comissao_vendedor_valor, 0);
    const pendingSellerCommissions = approvedComms.filter((c) => c.comissao_vendedor_status !== 'PAGO').reduce((acc, c) => acc + c.comissao_vendedor_valor, 0);

    // Rule 2: LUCRO LÍQUIDO = Receitas recebidas - comissões vendedores pagas - custos pagos - despesas pagas
    const netProfit = totalReceivedRevenue - paidSellerCommissions - paidOperationalCosts - paidGeneralExpenses;
    
    // PROJECTED LUCRO LÍQUIDO = Receitas previstas - comissões vendedores totais - custos totais - despesas gerais totais
    const projectedNetProfit = totalExpectedRevenue - totalSellerCommissions - totalOperationalCosts - totalGeneralExpenses;

    // Rule 3: RENTABILIDADE = Lucro Líquido / Receita Recebida * 100
    const profitability = totalReceivedRevenue > 0 ? (netProfit / totalReceivedRevenue) * 100 : 0;
    const projectedProfitability = totalExpectedRevenue > 0 ? (projectedNetProfit / totalExpectedRevenue) * 100 : 0;

    return {
      totalExpectedRevenue,
      totalReceivedRevenue,
      totalPendingRevenue,
      totalDelayedRevenue,
      totalOperationalCosts,
      paidOperationalCosts,
      pendingOperationalCosts,
      netOperationalGross,
      projectedGross,
      
      // FASE 5 - PARTE 2
      totalGeneralExpenses,
      paidGeneralExpenses,
      pendingGeneralExpenses,
      totalSellerCommissions,
      paidSellerCommissions,
      pendingSellerCommissions,
      netProfit,
      projectedNetProfit,
      profitability,
      projectedProfitability,
    };
  }

  // ======================================================
  // FASE 6 - CENTRAL DE AJUDA E TREINAMENTO
  // ======================================================

  public getHelpContents(filters?: {
    type?: string;
    bank_id?: string;
    product_id?: string;
    search?: string;
  }): TrainingContent[] {
    let result = [...this.helpContents];

    if (filters?.type && filters.type !== 'TODOS') {
      result = result.filter((h) => h.content_type === filters.type);
    }
    if (filters?.bank_id && filters.bank_id !== 'TODOS') {
      result = result.filter((h) => h.bank_id === filters.bank_id);
    }
    if (filters?.product_id && filters.product_id !== 'TODOS') {
      result = result.filter((h) => h.product_id === filters.product_id);
    }
    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q) ||
          (h.bank_nome && h.bank_nome.toLowerCase().includes(q)) ||
          (h.product_nome && h.product_nome.toLowerCase().includes(q)) ||
          (h.content_body && h.content_body.toLowerCase().includes(q))
      );
    }

    // Sort by order_index, then by created_at desc
    return result.sort((a, b) => {
      if (a.order_index !== b.order_index) {
        return a.order_index - b.order_index;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  public async createHelpContent(
    data: Partial<TrainingContent>,
    currentUser: User | null
  ): Promise<TrainingContent> {
    await new Promise((res) => setTimeout(res, 250));

    if (!currentUser) throw new Error('Usuário não autenticado.');
    if (!this.hasPermission(currentUser, 'gerenciar_treinamentos')) {
      throw new Error('Você não possui permissão para gerenciar a Central de Ajuda.');
    }

    if (!data.title || !data.content_type || !data.category) {
      throw new Error('Título, tipo de conteúdo e categoria são obrigatórios.');
    }

    const nowStr = new Date().toISOString();
    const id = `hlp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const bank = data.bank_id ? this.banks.find((b) => b.id === data.bank_id) : null;
    const product = data.product_id ? this.products.find((p) => p.id === data.product_id) : null;

    const newContent: TrainingContent = {
      id,
      title: data.title.trim(),
      description: data.description || '',
      content_type: data.content_type,
      category: data.category,
      bank_id: data.bank_id || null,
      bank_nome: bank ? bank.nome : null,
      product_id: data.product_id || null,
      product_nome: product ? product.nome : null,
      video_url: data.video_url || null,
      file_url: data.file_url || null,
      thumbnail_url: data.thumbnail_url || null,
      content_body: data.content_body || null,
      status: data.status || 'ATIVO',
      featured: !!data.featured,
      required: !!data.required,
      order_index: Number(data.order_index) || 0,
      created_by: currentUser.id,
      created_by_name: currentUser.name,
      created_at: nowStr,
      updated_at: nowStr,
    };

    this.helpContents.push(newContent);
    this.saveHelpContentsToStorage();

    this.logAudit(
      currentUser,
      'CRIAR_CONTEUDO_AJUDA',
      'Central de Ajuda',
      `Novo conteúdo lançado na Central de Ajuda: "${newContent.title}" (${newContent.content_type}).`,
      id
    );

    return newContent;
  }

  public async updateHelpContent(
    id: string,
    data: Partial<TrainingContent>,
    currentUser: User | null
  ): Promise<TrainingContent> {
    await new Promise((res) => setTimeout(res, 200));

    if (!currentUser) throw new Error('Usuário não autenticado.');
    if (!this.hasPermission(currentUser, 'gerenciar_treinamentos')) {
      throw new Error('Você não possui permissão para gerenciar a Central de Ajuda.');
    }

    const idx = this.helpContents.findIndex((h) => h.id === id);
    if (idx === -1) throw new Error('Conteúdo de ajuda não encontrado.');

    const content = this.helpContents[idx];
    const prevTitle = content.title;
    const prevType = content.content_type;

    const bank = data.bank_id ? this.banks.find((b) => b.id === data.bank_id) : null;
    const product = data.product_id ? this.products.find((p) => p.id === data.product_id) : null;

    Object.assign(content, data);
    content.updated_at = new Date().toISOString();

    if (data.bank_id) {
      content.bank_nome = bank ? bank.nome : null;
    } else if (data.bank_id === null) {
      content.bank_nome = null;
    }

    if (data.product_id) {
      content.product_nome = product ? product.nome : null;
    } else if (data.product_id === null) {
      content.product_nome = null;
    }

    this.saveHelpContentsToStorage();

    const titleChange = prevTitle !== content.title ? ` Título anterior: "${prevTitle}" -> Título novo: "${content.title}".` : '';
    const typeChange = prevType !== content.content_type ? ` Tipo anterior: ${prevType} -> Tipo novo: ${content.content_type}.` : '';

    this.logAudit(
      currentUser,
      'EDITAR_CONTEUDO_AJUDA',
      'Central de Ajuda',
      `Conteúdo de ajuda "${content.title}" atualizado por ${currentUser.name}.${titleChange}${typeChange}`,
      id
    );

    return content;
  }

  public async deleteHelpContent(id: string, currentUser: User | null): Promise<void> {
    await new Promise((res) => setTimeout(res, 200));

    if (!currentUser) throw new Error('Usuário não autenticado.');
    if (!this.hasPermission(currentUser, 'gerenciar_treinamentos')) {
      throw new Error('Você não possui permissão para gerenciar a Central de Ajuda.');
    }

    const idx = this.helpContents.findIndex((h) => h.id === id);
    if (idx === -1) throw new Error('Conteúdo de ajuda não encontrado.');

    const removed = this.helpContents.splice(idx, 1)[0];
    this.saveHelpContentsToStorage();

    this.logAudit(
      currentUser,
      'EXCLUIR_CONTEUDO_AJUDA',
      'Central de Ajuda',
      `Conteúdo "${removed.title}" (${removed.content_type}) excluído permanentemente por ${currentUser.name}.`,
      id
    );
  }

  // ======================================================
  // FASE 7.1 - INTEGRACAO GOOGLE SHEETS LEADS
  // ======================================================

  public async fetchGoogleSheetsConfig(): Promise<void> {
    const isProd = import.meta.env.PROD;
    try {
      const response = await fetch('/api/google_sheets.php');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.config) {
            this.googleSheetsConfig = {
              spreadsheet_id: data.config.spreadsheet_id,
              sheet_name: data.config.sheet_name,
              col_id: data.config.column_external_id || data.config.col_id || 'id',
              col_name: data.config.column_name || data.config.col_name || 'nome_completo',
              col_phone: data.config.column_phone || data.config.col_phone || 'telefone',
              col_email: data.config.column_email || data.config.col_email || 'email',
              col_city: data.config.column_city || data.config.col_city || 'cidade',
              col_product: data.config.column_product || data.config.col_product || 'tipo_de_supletivo',
              col_campaign: data.config.column_campaign || data.config.col_campaign || 'campaign_name',
              col_ad: data.config.column_ad || data.config.col_ad || 'ad_name',
            };
            localStorage.setItem(SHEETS_CONFIG_STORAGE_KEY, JSON.stringify(this.googleSheetsConfig));
          }
          if (data.stats) {
            this.leadSyncResult = {
              last_sync: data.stats.last_sync,
              next_sync: data.stats.last_sync ? new Date(new Date(data.stats.last_sync).getTime() + 5 * 60 * 1000).toISOString() : null,
              connection_status: data.stats.connection_status,
              leads_imported_today: data.stats.leads_imported_today,
              leads_waiting_distribution: data.stats.leads_waiting_distribution,
              duplicate_leads: data.stats.duplicate_leads,
              sync_errors: data.stats.sync_errors,
            };
            localStorage.setItem(SHEETS_SYNC_STORAGE_KEY, JSON.stringify(this.leadSyncResult));
          }
        } else {
          if (isProd) {
            throw new Error(data.message || 'Erro do servidor ao carregar as configurações de integração.');
          }
        }
      } else {
        if (isProd) {
          throw new Error(`Erro HTTP ${response.status} ao carregar as configurações de integração.`);
        }
      }
    } catch (e) {
      if (isProd) {
        throw e;
      }
      console.warn('Backend REST API do Google Sheets não disponível, utilizando simulação local do cliente.', e);
    }
  }

  public getGoogleSheetsConfig(): GoogleSheetsConfig {
    if (!this.googleSheetsConfig) {
      this.googleSheetsConfig = {
        spreadsheet_id: '1tYg9bU0f4vR79GzU3g6m8D9hH4B-8X9fK5z2wLmPqYs',
        sheet_name: 'Respostas do Formulário 1',
        col_id: 'id',
        col_name: 'nome_completo',
        col_phone: 'telefone',
        col_email: 'email',
        col_city: 'cidade',
        col_product: 'tipo_de_supletivo',
        col_campaign: 'campaign_name',
        col_ad: 'ad_name'
      };
    }
    return this.googleSheetsConfig;
  }

  public async saveGoogleSheetsConfig(config: GoogleSheetsConfig, currentUser: User | null): Promise<void> {
    const isProd = import.meta.env.PROD;
    try {
      const response = await fetch('/api/google_sheets.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token_for_${currentUser?.id || 'admin'}`
        },
        body: JSON.stringify({
          spreadsheet_id: config.spreadsheet_id,
          sheet_name: config.sheet_name,
          active: 1,
          col_id: config.col_id,
          col_name: config.col_name,
          col_phone: config.col_phone,
          col_email: config.col_email,
          col_city: config.col_city,
          col_product: config.col_product,
          col_campaign: config.col_campaign,
          col_ad: config.col_ad,
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Configurações de integração persistidas no MySQL via PHP REST API com sucesso!');
          this.googleSheetsConfig = { ...config };
          localStorage.setItem(SHEETS_CONFIG_STORAGE_KEY, JSON.stringify(this.googleSheetsConfig));
          if (this.leadSyncResult) {
            this.leadSyncResult.connection_status = config.spreadsheet_id ? 'CONNECTED' : 'DISCONNECTED';
            this.saveLeadSyncResult(this.leadSyncResult);
          }
          this.logAudit(
            currentUser,
            'CONFIGURAR_INTEGRACAO_LEADS',
            'Configurações',
            `Configuração da planilha Google Sheets de Leads atualizada: Planilha ID "${config.spreadsheet_id}", Aba "${config.sheet_name}".`
          );
          return;
        } else {
          if (isProd) {
            throw new Error(data.message || 'Erro do servidor ao salvar as configurações.');
          }
        }
      } else {
        if (isProd) {
          throw new Error(`Erro HTTP ${response.status} ao salvar as configurações.`);
        }
      }
    } catch (e) {
      if (isProd) {
        throw e;
      }
      console.warn('Real backend fetch failed, performing local high-fidelity simulation.', e);
    }

    this.googleSheetsConfig = { ...config };
    localStorage.setItem(SHEETS_CONFIG_STORAGE_KEY, JSON.stringify(this.googleSheetsConfig));

    // Update connection status
    if (this.leadSyncResult) {
      this.leadSyncResult.connection_status = config.spreadsheet_id ? 'CONNECTED' : 'DISCONNECTED';
      this.saveLeadSyncResult(this.leadSyncResult);
    }

    this.logAudit(
      currentUser,
      'CONFIGURAR_INTEGRACAO_LEADS',
      'Configurações',
      `Configuração da planilha Google Sheets de Leads atualizada: Planilha ID "${config.spreadsheet_id}", Aba "${config.sheet_name}".`
    );
  }

  public getLeadSyncResult(): LeadSyncResult {
    const unassignedLeads = this.leads.filter(
      (l) => (l.vendedor_id === '' || l.vendedor_id === 'unassigned' || !l.vendedor_id) && l.status === 'Novo'
    ).length;

    if (!this.leadSyncResult) {
      this.leadSyncResult = {
        last_sync: null,
        next_sync: null,
        connection_status: 'DISCONNECTED',
        leads_imported_today: 0,
        leads_waiting_distribution: unassignedLeads,
        duplicate_leads: 0,
        sync_errors: 0
      };
    } else {
      this.leadSyncResult.leads_waiting_distribution = unassignedLeads;
    }

    return this.leadSyncResult;
  }

  public saveLeadSyncResult(result: LeadSyncResult): void {
    this.leadSyncResult = { ...result };
    localStorage.setItem(SHEETS_SYNC_STORAGE_KEY, JSON.stringify(this.leadSyncResult));
  }

  public normalizePhone(phone: string): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    
    // Treat Brazilian numbers consistently
    // If it is 10 or 11 digits (e.g. 11999999999), add 55 country code
    if (digits.length === 10 || digits.length === 11) {
      return '55' + digits;
    }
    // If it's already 55 + 11 digits or similar, preserve it
    if (digits.startsWith('55') && digits.length >= 12) {
      return digits;
    }
    return digits;
  }

  public async syncLeadsNow(currentUser: User | null): Promise<{
    found: number;
    newLeads: number;
    duplicates: number;
    updated: number;
    errors: number;
  }> {
    if (!currentUser) throw new Error('Usuário não autenticado.');
    const isProd = import.meta.env.PROD;

    // 1. Try real PHP REST API sync call first
    try {
      const response = await fetch('/api/google_sheets.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token_for_${currentUser.id}`
        },
        body: JSON.stringify({
          action: 'sync_now'
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.summary) {
          console.log('Sincronização manual executada no MySQL + PHP REST API com sucesso!');
          
          // Let's mock load the synchronized unassigned leads in the React UI so they are immediately viewable!
          const newLeadsCount = data.summary.newLeads;
          for (let i = 0; i < newLeadsCount; i++) {
            const mockExtId = `meta_lead_api_${Date.now()}_${i}`;
            const isDuplicate = this.leads.some(l => l.observacoes?.includes(mockExtId));
            if (!isDuplicate) {
              const newLead: Lead = {
                id: `lead_sync_${Date.now()}_${i}`,
                nome: i === 0 ? 'Juliana Ribeiro de Castro' : (i === 1 ? 'Roberto Albuquerque Neto' : 'Claudio Mendes de Souza'),
                telefone: i === 0 ? '(11) 98111-2222' : (i === 1 ? '(21) 97111-3333' : '(11) 94002-8922'),
                whatsapp: i === 0 ? '5511981112222' : (i === 1 ? '5521971113333' : '5511940028922'),
                email: i === 0 ? 'juliana.ribeiro@gmail.com' : (i === 1 ? 'roberto.neto@outlook.com' : 'claudio.mendes@uol.com.br'),
                cpf: '',
                cidade: i === 0 ? 'São Paulo' : (i === 1 ? 'Rio de Janeiro' : 'Guarulhos'),
                estado: 'SP',
                origem: 'Google Sheets',
                campanha: i === 0 ? 'Meta Ads Aposentados' : (i === 1 ? 'Meta Ads FGTS Trabalhadores' : 'Cron Auto Sync Campaign'),
                anuncio: i === 0 ? 'Video Margem 2026' : (i === 1 ? 'Banner Saque FGTS Caixa' : 'Banner Juros Baixos'),
                produto_interesse: i === 0 ? 'Empréstimo Consignado INSS' : (i === 1 ? 'Saque Aniversário FGTS' : 'Empréstimo Auxílio Brasil'),
                observacoes: `Lead importado via integração Google Sheets. Meta Lead ID: ${mockExtId}`,
                vendedor_id: '', // Em branco para a fila de distribuição
                vendedor_nome: 'Sem Distribuição',
                supervisor_id: null,
                supervisor_nome: null,
                status: 'Novo',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              this.leads.unshift(newLead);
            }
          }
          this.saveLeadsToStorage();
          
          await this.fetchGoogleSheetsConfig();
          return data.summary;
        } else {
          if (isProd) {
            throw new Error(data.message || 'Falha na sincronização via API PHP.');
          }
        }
      } else {
        if (isProd) {
          throw new Error(`Erro HTTP ${response.status} na API PHP ao tentar sincronizar.`);
        }
      }
    } catch (e) {
      if (isProd) {
        throw e;
      }
      console.warn('REST API do Google Sheets não disponível (dev mode). Executando simulação de alta fidelidade.');
    }

    // 2. High fidelity simulation fallback (Vite client SPA mode)
    await new Promise((res) => setTimeout(res, 1500)); // Simulate networking
    if (!currentUser) throw new Error('Usuário não autenticado.');

    const config = this.getGoogleSheetsConfig();
    const result = this.getLeadSyncResult();

    // Simulating sheet rows (representing new rows from Google Sheets / Meta API)
    const simulatedSheetRows = [
      {
        id: 'meta_lead_101',
        nome_completo: 'Juliana Ribeiro de Castro',
        telefone: '(11) 98111-2222',
        email: 'juliana.ribeiro@gmail.com',
        cidade: 'São Paulo',
        tipo_de_supletivo: 'Empréstimo Consignado INSS',
        campaign_name: 'Meta Ads Aposentados',
        ad_name: 'Video Margem 2026'
      },
      {
        id: 'meta_lead_102',
        nome_completo: 'Roberto Albuquerque Neto',
        telefone: '(21) 97111-3333',
        email: 'roberto.neto@outlook.com',
        cidade: 'Rio de Janeiro',
        tipo_de_supletivo: 'Saque Aniversário FGTS',
        campaign_name: 'Meta Ads FGTS Trabalhadores',
        ad_name: 'Banner Saque FGTS Caixa'
      },
      {
        id: 'meta_lead_103', // Duplicated from INITIAL_LEADS (Aline de Oliveira Barros) by phone
        nome_completo: 'Aline de Oliveira Barros',
        telefone: '(11) 99887-1122',
        email: 'aline.barros@gmail.com',
        cidade: 'Campinas', // Updated city
        tipo_de_supletivo: 'Empréstimo Consignado INSS',
        campaign_name: 'Facebook Ads Sucesso',
        ad_name: 'Anuncio Foto Aposentado'
      },
      {
        id: 'meta_lead_104',
        nome_completo: 'Marcos de Souza Neves',
        telefone: '(31) 96111-4444',
        email: 'marcos.neves@gmail.com',
        cidade: 'Belo Horizonte',
        tipo_de_supletivo: 'Refinanciamento com Troco',
        campaign_name: 'Meta Ads Refinanciamento',
        ad_name: 'Anuncio Juros Reduzidos'
      },
      {
        id: 'meta_lead_105', // Sync Error (Missing phone)
        nome_completo: 'Invalido Sem Telefone',
        telefone: '',
        email: 'erro.telefone@email.com',
        cidade: 'Curitiba',
        tipo_de_supletivo: 'Portabilidade de Crédito',
        campaign_name: 'Campanha Inválida',
        ad_name: 'Sem Ad'
      }
    ];

    let found = 0;
    let newLeads = 0;
    let duplicates = 0;
    let updated = 0;
    let errors = 0;

    for (const row of simulatedSheetRows) {
      found++;

      // Minimum requirements validation (Name and Phone)
      if (!row.nome_completo || !row.nome_completo.trim() || !row.telefone || !row.telefone.trim()) {
        errors++;
        continue;
      }

      const normalizedRowPhone = this.normalizePhone(row.telefone);
      
      // Deduplication Rule
      // Check 1: Meta Lead ID (if it exists, we check if we already imported a lead with this id)
      // Check 2: Phone Number (normalized)
      let existingLead: Lead | null = null;

      // Search by Meta Lead ID inside lead's observations or details (we can store meta lead id in campanha or check existing leads)
      for (const lead of this.leads) {
        // Compare normalized phone digits
        const leadPhoneNorm = this.normalizePhone(lead.telefone);
        if (leadPhoneNorm === normalizedRowPhone) {
          existingLead = lead;
          break;
        }

        // Compare by campaign meta lead id identifier or description
        if (lead.observacoes && lead.observacoes.includes(row.id)) {
          existingLead = lead;
          break;
        }
      }

      if (existingLead) {
        duplicates++;
        // Lead exists: NÃO criar outro. Avaliar se existem novos dados.
        let changed = false;
        const changesLog: string[] = [];

        if (row.email && row.email.trim() && !existingLead.email) {
          existingLead.email = row.email.trim();
          changesLog.push('E-mail adicionado');
          changed = true;
        }
        if (row.cidade && row.cidade.trim() && existingLead.cidade !== row.cidade.trim()) {
          const oldCity = existingLead.cidade || 'Não informada';
          existingLead.cidade = row.cidade.trim();
          changesLog.push(`Cidade alterada de "${oldCity}" para "${row.cidade.trim()}"`);
          changed = true;
        }
        if (row.campaign_name && row.campaign_name.trim() && existingLead.campanha !== row.campaign_name.trim()) {
          existingLead.campanha = row.campaign_name.trim();
          changesLog.push(`Campanha atualizada para "${row.campaign_name.trim()}"`);
          changed = true;
        }
        if (row.ad_name && row.ad_name.trim() && existingLead.anuncio !== row.ad_name.trim()) {
          existingLead.anuncio = row.ad_name.trim();
          changesLog.push(`Anúncio atualizado para "${row.ad_name.trim()}"`);
          changed = true;
        }

        if (changed) {
          updated++;
          existingLead.updated_at = new Date().toISOString();
          
          this.addLeadHistoryItem(
            existingLead.id,
            currentUser,
            'LEAD_INTEGRACAO_ATUALIZADO',
            `Lead atualizado via integração com Google Sheets. Alterações: ${changesLog.join(', ')}.`
          );
        }
      } else {
        // Create new unassigned lead that enters the queue
        newLeads++;
        const newLead: Lead = {
          id: `lead_sync_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          nome: row.nome_completo.trim(),
          telefone: row.telefone.trim(),
          whatsapp: row.telefone.trim(),
          email: row.email.trim(),
          cpf: '',
          cidade: row.cidade.trim(),
          estado: 'SP', // Default state
          origem: 'Google Sheets',
          campanha: row.campaign_name.trim(),
          anuncio: row.ad_name.trim(),
          produto_interesse: row.tipo_de_supletivo.trim(),
          observacoes: `Lead importado automaticamente via integração Google Sheets. Meta Lead ID: ${row.id}.`,
          vendedor_id: '', // Em branco para a fila de distribuição
          vendedor_nome: 'Sem Distribuição',
          supervisor_id: null,
          supervisor_nome: null,
          status: 'Novo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        this.leads.unshift(newLead);

        this.addLeadHistoryItem(
          newLead.id,
          currentUser,
          'LEAD_INTEGRADO',
          `Lead "${newLead.nome}" importado da planilha Google Sheets com sucesso e adicionado à fila de distribuição.`
        );
      }
    }

    this.saveLeadsToStorage();

    // Update synchronization statistics
    const nowIso = new Date().toISOString();
    result.last_sync = nowIso;
    result.next_sync = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // +5 min
    result.connection_status = 'CONNECTED';
    result.leads_imported_today += newLeads;
    result.duplicate_leads += duplicates;
    result.sync_errors += errors;

    this.saveLeadSyncResult(result);

    this.logAudit(
      currentUser,
      'SINCRONIZAR_LEADS',
      'Leads',
      `Sincronização manual do Google Sheets executada por ${currentUser.name}. Resumo: ${newLeads} novos, ${duplicates} duplicados, ${updated} atualizados, ${errors} erros.`
    );

    return { found, newLeads, duplicates, updated, errors };
  }

  public async distributeLeadsFila(
    leadIds: string[],
    vendedorId: string,
    currentUser: User | null
  ): Promise<void> {
    await new Promise((res) => setTimeout(res, 400));
    if (!currentUser) throw new Error('Usuário não autenticado.');

    const targetSeller = this.users.find((u) => u.id === vendedorId);
    if (!targetSeller) throw new Error('Vendedor não encontrado no sistema.');

    let distributedCount = 0;

    for (const id of leadIds) {
      const lead = this.leads.find((l) => l.id === id);
      if (lead) {
        lead.vendedor_id = targetSeller.id;
        lead.vendedor_nome = targetSeller.name;
        lead.supervisor_id = targetSeller.supervisor_id || null;
        lead.supervisor_nome = targetSeller.supervisor_name || null;
        lead.updated_at = new Date().toISOString();
        distributedCount++;

        this.addLeadHistoryItem(
          lead.id,
          currentUser,
          'DISTRIBUICAO_LEAD',
          `Lead atribuído ao vendedor ${targetSeller.name} via Fila de Distribuição por ${currentUser.name}.`
        );
      }
    }

    if (distributedCount > 0) {
      this.saveLeadsToStorage();

      this.logAudit(
        currentUser,
        'DISTRIBUIR_LEADS_FILA',
        'Leads',
        `Distribuição em lote de ${distributedCount} leads da fila para o vendedor ${targetSeller.name} executada por ${currentUser.name}.`
      );
    }
  }

  // ======================================================
  // FASE 7.2 - WHATSAPP MULTIATENDIMENTO METODOS
  // ======================================================

  public getWhatsAppNumbers(): WhatsAppNumber[] {
    return this.whatsappNumbers;
  }

  public getWhatsAppIntegrations(): WhatsAppIntegration[] {
    return this.whatsappIntegrations;
  }

  public getWhatsAppAttendants(): WhatsAppAttendant[] {
    return this.whatsappAttendants;
  }

  public getWhatsAppConversations(): WhatsAppConversation[] {
    return this.whatsappConversations;
  }

  public getWhatsAppMessages(conversationId: string): WhatsAppMessage[] {
    return this.whatsappMessages.filter((m) => m.conversation_id === conversationId);
  }

  public getWhatsAppTransfers(conversationId: string): WhatsAppTransfer[] {
    return this.whatsappTransfers.filter((t) => t.conversation_id === conversationId);
  }

  public getWhatsAppInternalNotes(conversationId: string): WhatsAppInternalNote[] {
    return this.whatsappInternalNotes.filter((n) => n.conversation_id === conversationId);
  }

  public getWhatsAppQuickReplies(): WhatsAppQuickReply[] {
    return this.whatsappQuickReplies;
  }

  public async fetchWhatsAppState(currentUser: User | null): Promise<void> {
    const isProd = import.meta.env.PROD;
    try {
      const response = await fetch('/api/whatsapp.php?action=get_state', {
        headers: {
          'Authorization': `Bearer mock_token_for_${currentUser?.id || 'admin'}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.numbers) {
            this.whatsappNumbers = data.numbers.map((n: any) => ({
              ...n,
              ativo: n.ativo === 1 || n.ativo === true || n.ativo === '1'
            }));
            localStorage.setItem(WA_NUMBERS_KEY, JSON.stringify(this.whatsappNumbers));
          }
          if (data.integrations) {
            this.whatsappIntegrations = data.integrations.map((i: any) => ({
              ...i,
              ativo: i.ativo === 1 || i.ativo === true || i.ativo === '1'
            }));
            localStorage.setItem(WA_INTEGRATIONS_KEY, JSON.stringify(this.whatsappIntegrations));
          }
          if (data.attendants) {
            this.whatsappAttendants = data.attendants.map((a: any) => ({
              ...a,
              ativo: a.ativo === 1 || a.ativo === true || a.ativo === '1'
            }));
            localStorage.setItem(WA_ATTENDANTS_KEY, JSON.stringify(this.whatsappAttendants));
          }
          if (data.conversations) {
            this.whatsappConversations = data.conversations;
            localStorage.setItem(WA_CONVERSATIONS_KEY, JSON.stringify(this.whatsappConversations));
          }
          if (data.quickReplies) {
            this.whatsappQuickReplies = data.quickReplies.map((q: any) => ({
              ...q,
              ativo: q.ativo === 1 || q.ativo === true || q.ativo === '1'
            }));
            localStorage.setItem(WA_QUICK_REPLIES_KEY, JSON.stringify(this.whatsappQuickReplies));
          }
        } else {
          if (isProd) {
            throw new Error(data.message || 'Erro ao carregar o estado do WhatsApp do servidor.');
          }
        }
      } else {
        if (isProd) {
          throw new Error(`Erro HTTP ${response.status} ao carregar o estado do WhatsApp.`);
        }
      }
    } catch (e) {
      if (isProd) {
        throw e;
      }
      console.warn('REST API do WhatsApp não disponível (dev mode). Utilizando simulação local do cliente.', e);
    }
  }

  public async fetchWhatsAppMessages(conversationId: string, currentUser: User | null): Promise<void> {
    const isProd = import.meta.env.PROD;
    try {
      const response = await fetch(`/api/whatsapp.php?action=get_messages&conversation_id=${conversationId}`, {
        headers: {
          'Authorization': `Bearer mock_token_for_${currentUser?.id || 'admin'}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          this.whatsappMessages = this.whatsappMessages.filter(m => m.conversation_id !== conversationId).concat(data.messages);
          localStorage.setItem(WA_MESSAGES_KEY, JSON.stringify(this.whatsappMessages));
        } else if (isProd) {
          throw new Error(data.message || 'Erro ao buscar mensagens do servidor.');
        }
      } else if (isProd) {
        throw new Error(`Erro HTTP ${response.status} ao buscar mensagens.`);
      }
    } catch (e) {
      if (isProd) throw e;
      console.warn('REST API não disponível para mensagens. Usando simulação.', e);
    }
  }

  public async fetchWhatsAppTransfers(conversationId: string, currentUser: User | null): Promise<void> {
    const isProd = import.meta.env.PROD;
    try {
      const response = await fetch(`/api/whatsapp.php?action=get_transfers&conversation_id=${conversationId}`, {
        headers: {
          'Authorization': `Bearer mock_token_for_${currentUser?.id || 'admin'}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.transfers) {
          this.whatsappTransfers = this.whatsappTransfers.filter(t => t.conversation_id !== conversationId).concat(data.transfers);
          localStorage.setItem(WA_TRANSFERS_KEY, JSON.stringify(this.whatsappTransfers));
        } else if (isProd) {
          throw new Error(data.message || 'Erro ao buscar transferências do servidor.');
        }
      } else if (isProd) {
        throw new Error(`Erro HTTP ${response.status} ao buscar transferências.`);
      }
    } catch (e) {
      if (isProd) throw e;
      console.warn('REST API não disponível para transferências. Usando simulação.', e);
    }
  }

  public async fetchWhatsAppInternalNotes(conversationId: string, currentUser: User | null): Promise<void> {
    const isProd = import.meta.env.PROD;
    try {
      const response = await fetch(`/api/whatsapp.php?action=get_notes&conversation_id=${conversationId}`, {
        headers: {
          'Authorization': `Bearer mock_token_for_${currentUser?.id || 'admin'}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.notes) {
          this.whatsappInternalNotes = this.whatsappInternalNotes.filter(n => n.conversation_id !== conversationId).concat(data.notes);
          localStorage.setItem(WA_NOTES_KEY, JSON.stringify(this.whatsappInternalNotes));
        } else if (isProd) {
          throw new Error(data.message || 'Erro ao buscar notas do servidor.');
        }
      } else if (isProd) {
        throw new Error(`Erro HTTP ${response.status} ao buscar notas.`);
      }
    } catch (e) {
      if (isProd) throw e;
      console.warn('REST API não disponível para notas internas. Usando simulação.', e);
    }
  }

  private saveWhatsAppNumbersToStorage(): void {
    localStorage.setItem(WA_NUMBERS_KEY, JSON.stringify(this.whatsappNumbers));
  }

  private saveWhatsAppConversationsToStorage(): void {
    localStorage.setItem(WA_CONVERSATIONS_KEY, JSON.stringify(this.whatsappConversations));
  }

  private saveWhatsAppMessagesToStorage(): void {
    localStorage.setItem(WA_MESSAGES_KEY, JSON.stringify(this.whatsappMessages));
  }

  private saveWhatsAppTransfersToStorage(): void {
    localStorage.setItem(WA_TRANSFERS_KEY, JSON.stringify(this.whatsappTransfers));
  }

  private saveWhatsAppInternalNotesToStorage(): void {
    localStorage.setItem(WA_NOTES_KEY, JSON.stringify(this.whatsappInternalNotes));
  }

  private saveWhatsAppQuickRepliesToStorage(): void {
    localStorage.setItem(WA_QUICK_REPLIES_KEY, JSON.stringify(this.whatsappQuickReplies));
  }

  public async saveWhatsAppConfig(
    provider: 'WAME',
    apiBaseUrl: string,
    accountIdentifier: string,
    currentUser: User | null
  ): Promise<void> {
    const isProd = import.meta.env.PROD;
    if (isProd) {
      const response = await fetch('/api/whatsapp.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token_for_${currentUser?.id || 'admin'}`
        },
        body: JSON.stringify({
          action: 'save_config',
          provider,
          api_base_url: apiBaseUrl,
          account_identifier: accountIdentifier
        })
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao salvar a configuração da integração.`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Erro ao salvar configuração do WhatsApp.');
      }
    }

    // Update in memory too
    this.whatsappIntegrations = [
      {
        id: 'int_1',
        provider,
        api_base_url: apiBaseUrl,
        account_identifier: accountIdentifier,
        status: 'CONECTADO',
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(WA_INTEGRATIONS_KEY, JSON.stringify(this.whatsappIntegrations));

    this.logAudit(
      currentUser,
      'CONFIGURAR_INTEGRACAO_WHATSAPP',
      'Configurações',
      `Configuração da integração WhatsApp com o provedor ${provider} e identificador "${accountIdentifier}" salva por ${currentUser?.name || 'Sistema'}.`
    );
  }

  public async saveWhatsAppNumberConfig(
    numberData: Omit<WhatsAppNumber, 'id' | 'created_at' | 'updated_at'>,
    currentUser: User | null
  ): Promise<void> {
    const isProd = import.meta.env.PROD;
    if (isProd) {
      const response = await fetch('/api/whatsapp.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token_for_${currentUser?.id || 'admin'}`
        },
        body: JSON.stringify({
          action: 'save_number',
          ...numberData
        })
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao cadastrar número de WhatsApp.`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Erro ao salvar número de WhatsApp.');
      }
    }

    const newNumber: WhatsAppNumber = {
      id: `num_${Date.now()}`,
      ...numberData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.whatsappNumbers.push(newNumber);
    this.saveWhatsAppNumbersToStorage();

    this.logAudit(
      currentUser,
      'CRIAR_NUMERO_WHATSAPP',
      'Configurações',
      `Número de WhatsApp "${numberData.nome}" (${numberData.telefone}) cadastrado com sucesso.`
    );
  }

  public async saveWhatsAppAttendantConfig(
    userId: string,
    ativo: boolean,
    currentUser: User | null
  ): Promise<void> {
    const isProd = import.meta.env.PROD;
    if (isProd) {
      const response = await fetch('/api/whatsapp.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token_for_${currentUser?.id || 'admin'}`
        },
        body: JSON.stringify({
          action: 'save_attendant',
          user_id: userId,
          ativo: ativo ? 1 : 0
        })
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao configurar atendente.`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Erro ao salvar configuração do atendente.');
      }
    }

    const targetUser = this.users.find((u) => u.id === userId);
    if (!targetUser) throw new Error('Usuário não encontrado no sistema.');

    const existingIdx = this.whatsappAttendants.findIndex((a) => a.user_id === userId);
    if (existingIdx !== -1) {
      this.whatsappAttendants[existingIdx].ativo = ativo;
      this.whatsappAttendants[existingIdx].updated_at = new Date().toISOString();
    } else {
      this.whatsappAttendants.push({
        id: `att_${Date.now()}`,
        user_id: userId,
        user_name: targetUser.name,
        ativo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    localStorage.setItem(WA_ATTENDANTS_KEY, JSON.stringify(this.whatsappAttendants));

    this.logAudit(
      currentUser,
      'GERENCIAR_ATENDENTES_WHATSAPP',
      'Configurações',
      `Status do atendente "${targetUser.name}" alterado para ${ativo ? 'Ativo' : 'Inativo'}.`
    );
  }

  public async saveWhatsAppQuickReply(
    replyData: Omit<WhatsAppQuickReply, 'id' | 'created_by' | 'created_at' | 'updated_at'>,
    currentUser: User | null
  ): Promise<void> {
    const isProd = import.meta.env.PROD;
    if (isProd) {
      const response = await fetch('/api/whatsapp.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token_for_${currentUser?.id || 'admin'}`
        },
        body: JSON.stringify({
          action: 'save_quick_reply',
          ...replyData
        })
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao cadastrar resposta rápida.`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Erro ao salvar resposta rápida.');
      }
    }

    const newReply: WhatsAppQuickReply = {
      id: `qr_${Date.now()}`,
      ...replyData,
      created_by: currentUser?.id || 'usr_admin_1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.whatsappQuickReplies.push(newReply);
    this.saveWhatsAppQuickRepliesToStorage();

    this.logAudit(
      currentUser,
      'GERENCIAR_RESPOSTAS_RAPIDAS',
      'WhatsApp',
      `Resposta rápida "${replyData.titulo}" cadastrada com sucesso.`
    );
  }

  public async assumeWhatsAppConversation(conversationId: string, currentUser: User | null): Promise<void> {
    if (!currentUser) throw new Error('Usuário não autenticado.');
    const isProd = import.meta.env.PROD;

    if (isProd) {
      const response = await fetch('/api/whatsapp.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token_for_${currentUser.id}`
        },
        body: JSON.stringify({
          action: 'assume_conversation',
          conversation_id: conversationId
        })
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao assumir atendimento.`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Não foi possível assumir o atendimento.');
      }
    }

    const conversation = this.whatsappConversations.find((c) => c.id === conversationId);
    if (!conversation) throw new Error('Conversa não encontrada.');

    const prevAttendantId = conversation.current_attendant_id;
    conversation.current_attendant_id = currentUser.id;
    conversation.status = 'Em atendimento';
    conversation.updated_at = new Date().toISOString();
    this.saveWhatsAppConversationsToStorage();

    // Log internally
    this.addWhatsAppTransferLog(conversationId, prevAttendantId, currentUser.id, currentUser.id, 'Assumiu o atendimento diretamente.');

    this.logAudit(
      currentUser,
      'ASSUMIR_CONVERSA_WHATSAPP',
      'WhatsApp',
      `Conversa com o contato "${conversation.nome_contato}" (${conversation.telefone}) foi assumida por ${currentUser.name}.`
    );
  }

  public async transferWhatsAppConversation(
    conversationId: string,
    toUserId: string,
    motivo: string,
    currentUser: User | null
  ): Promise<void> {
    if (!currentUser) throw new Error('Usuário não autenticado.');
    const isProd = import.meta.env.PROD;

    if (isProd) {
      const response = await fetch('/api/whatsapp.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token_for_${currentUser.id}`
        },
        body: JSON.stringify({
          action: 'transfer_conversation',
          conversation_id: conversationId,
          to_user_id: toUserId,
          motivo
        })
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao transferir atendimento.`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Não foi possível transferir o atendimento.');
      }
    }

    const conversation = this.whatsappConversations.find((c) => c.id === conversationId);
    if (!conversation) throw new Error('Conversa não encontrada.');

    const targetUser = this.users.find((u) => u.id === toUserId);
    if (!targetUser) throw new Error('Atendente de destino não encontrado.');

    const prevAttendantId = conversation.current_attendant_id;
    conversation.current_attendant_id = toUserId;
    conversation.updated_at = new Date().toISOString();
    this.saveWhatsAppConversationsToStorage();

    // Log transfer history
    this.addWhatsAppTransferLog(conversationId, prevAttendantId, toUserId, currentUser.id, motivo);

    this.logAudit(
      currentUser,
      'TRANSFERIR_CONVERSA_WHATSAPP',
      'WhatsApp',
      `Conversa com o contato "${conversation.nome_contato}" foi transferida para ${targetUser.name} por ${currentUser.name}. Motivo: "${motivo}".`
    );
  }

  private addWhatsAppTransferLog(
    conversationId: string,
    fromUserId: string | null | undefined,
    toUserId: string,
    transferredByUserId: string,
    motivo: string
  ): void {
    const newTransfer: WhatsAppTransfer = {
      id: `tr_${Date.now()}`,
      conversation_id: conversationId,
      from_user_id: fromUserId || null,
      to_user_id: toUserId,
      transferred_by_user_id: transferredByUserId,
      motivo,
      created_at: new Date().toISOString()
    };
    this.whatsappTransfers.push(newTransfer);
    this.saveWhatsAppTransfersToStorage();
  }

  public async changeWhatsAppConversationStatus(
    conversationId: string,
    newStatus: WhatsAppConversation['status'],
    currentUser: User | null
  ): Promise<void> {
    if (!currentUser) throw new Error('Usuário não autenticado.');
    const isProd = import.meta.env.PROD;

    if (isProd) {
      const response = await fetch('/api/whatsapp.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token_for_${currentUser.id}`
        },
        body: JSON.stringify({
          action: 'change_status',
          conversation_id: conversationId,
          status: newStatus
        })
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao alterar o status do atendimento.`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Erro ao alterar o status do atendimento.');
      }
    }

    const conversation = this.whatsappConversations.find((c) => c.id === conversationId);
    if (!conversation) throw new Error('Conversa não encontrada.');

    const oldStatus = conversation.status;
    conversation.status = newStatus;
    conversation.updated_at = new Date().toISOString();
    this.saveWhatsAppConversationsToStorage();

    this.logAudit(
      currentUser,
      'ALTERAR_STATUS_WHATSAPP',
      'WhatsApp',
      `Status do atendimento com "${conversation.nome_contato}" alterado de "${oldStatus}" para "${newStatus}".`
    );
  }

  public async addWhatsAppInternalNote(
    conversationId: string,
    noteText: string,
    currentUser: User | null
  ): Promise<WhatsAppInternalNote> {
    if (!currentUser) throw new Error('Usuário não autenticado.');
    const isProd = import.meta.env.PROD;

    if (isProd) {
      const response = await fetch('/api/whatsapp.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token_for_${currentUser.id}`
        },
        body: JSON.stringify({
          action: 'add_note',
          conversation_id: conversationId,
          note: noteText
        })
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao adicionar nota interna.`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Erro ao salvar nota interna.');
      }
    }

    const newNote: WhatsAppInternalNote = {
      id: `note_${Date.now()}`,
      conversation_id: conversationId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      note: noteText,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.whatsappInternalNotes.push(newNote);
    this.saveWhatsAppInternalNotesToStorage();

    return newNote;
  }

  public async sendWhatsAppMessage(
    conversationId: string,
    messageText: string,
    currentUser: User | null
  ): Promise<WhatsAppMessage> {
    if (!currentUser) throw new Error('Usuário não autenticado.');
    const isProd = import.meta.env.PROD;

    if (isProd) {
      // Prepared endpoint. In Phase 7.2 we DO NOT call real Wame endpoints,
      // but we do hit our PHP API which acts as the generic interface.
      const response = await fetch('/api/whatsapp.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token_for_${currentUser.id}`
        },
        body: JSON.stringify({
          action: 'send_message',
          conversation_id: conversationId,
          message_text: messageText
        })
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao enviar mensagem pelo WhatsApp.`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Falha ao enviar mensagem de WhatsApp.');
      }
    }

    const conversation = this.whatsappConversations.find((c) => c.id === conversationId);
    if (!conversation) throw new Error('Conversa não encontrada.');

    const newMessage: WhatsAppMessage = {
      id: `msg_out_${Date.now()}`,
      conversation_id: conversationId,
      external_message_id: `msg_ext_${Date.now()}`,
      direction: 'outbound',
      message_type: 'text',
      message_text: messageText,
      sender_user_id: currentUser.id,
      status: 'sent',
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    this.whatsappMessages.push(newMessage);
    this.saveWhatsAppMessagesToStorage();

    // Update conversation metadata
    conversation.last_message_text = messageText;
    conversation.last_message_at = new Date().toISOString();
    conversation.updated_at = new Date().toISOString();
    this.saveWhatsAppConversationsToStorage();

    return newMessage;
  }

  public async identifyOrPrepareLeadByPhone(phone: string, currentUser: User | null): Promise<{
    lead_id: string;
    nome: string;
    isNew: boolean;
    type: 'lead' | 'client';
  }> {
    if (!currentUser) throw new Error('Usuário não autenticado.');
    const cleanPhone = this.normalizePhone(phone);

    // 1. Search in existing leads
    for (const lead of this.leads) {
      const normL = this.normalizePhone(lead.telefone);
      if (normL === cleanPhone || lead.telefone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')) {
        return { lead_id: lead.id, nome: lead.nome, isNew: false, type: 'lead' };
      }
    }

    // 2. Search in existing clients
    for (const client of this.clients) {
      const normC = this.normalizePhone(client.telefone);
      if (normC === cleanPhone || client.telefone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')) {
        return { lead_id: client.id, nome: client.nome, isNew: false, type: 'client' };
      }
    }

    // 3. Create a new lead as fallback (waiting queue)
    const newLeadId = `lead_wa_${Date.now()}`;
    const newLead: Lead = {
      id: newLeadId,
      nome: `Contato WhatsApp ${phone}`,
      telefone: phone,
      whatsapp: cleanPhone,
      email: '',
      cpf: '',
      cidade: '',
      estado: 'SP',
      origem: 'WhatsApp',
      campanha: 'Atendimento Direto',
      anuncio: '',
      produto_interesse: 'Empréstimo Consignado INSS',
      observacoes: 'Lead criado automaticamente por interação no WhatsApp.',
      vendedor_id: '', // Goes to the unassigned queue
      vendedor_nome: 'Sem Distribuição',
      supervisor_id: null,
      supervisor_nome: null,
      status: 'Novo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.leads.unshift(newLead);
    this.saveLeadsToStorage();

    this.addLeadHistoryItem(
      newLeadId,
      currentUser,
      'LEAD_INTEGRADO',
      `Lead "${newLead.nome}" criado automaticamente pelo atendimento WhatsApp.`
    );

    return { lead_id: newLeadId, nome: newLead.nome, isNew: true, type: 'lead' };
  }

  // ======================================================
  // TASKS - FASE 7.5
  // ======================================================

  public async getTasks(): Promise<any[]> {
    const isProd = import.meta.env.PROD;
    if (isProd) {
      try {
        const response = await fetch('/api/tasks.php', {
          headers: {
            'Authorization': `Bearer mock_token`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) return data;
        }
      } catch (e) {
        console.error('Erro ao buscar tarefas do MySQL:', e);
      }
    }
    // Fallback/Local development storage
    const stored = localStorage.getItem('credsempre_crm_tasks_v1');
    return stored ? JSON.parse(stored) : [];
  }

  public async createTask(taskData: {
    user_id?: string;
    lead_id?: string;
    cliente_id?: string;
    oportunidade_id?: string;
    tipo: string;
    titulo: string;
    descricao: string;
    data_vencimento: string;
    prioridade: string;
  }): Promise<any> {
    const isProd = import.meta.env.PROD;
    if (isProd) {
      const response = await fetch('/api/tasks.php?action=create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token`
        },
        body: JSON.stringify(taskData)
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao criar tarefa.`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Falha ao salvar tarefa no MySQL.');
      }
      return data;
    }

    // Local storage fallback
    const stored = localStorage.getItem('credsempre_crm_tasks_v1');
    const tasks = stored ? JSON.parse(stored) : [];
    const newTask = {
      id: Date.now(),
      ...taskData,
      status: 'Pendente',
      created_at: new Date().toISOString()
    };
    tasks.unshift(newTask);
    localStorage.setItem('credsempre_crm_tasks_v1', JSON.stringify(tasks));
    return { success: true, id: newTask.id };
  }

  public async updateTask(taskData: {
    id: number | string;
    titulo: string;
    descricao: string;
    data_vencimento: string;
    prioridade?: string;
  }): Promise<any> {
    const isProd = import.meta.env.PROD;
    if (isProd) {
      const response = await fetch('/api/tasks.php?action=update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token`
        },
        body: JSON.stringify(taskData)
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao atualizar tarefa.`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Falha ao atualizar tarefa.');
      }
      return data;
    }

    const stored = localStorage.getItem('credsempre_crm_tasks_v1');
    const tasks = stored ? JSON.parse(stored) : [];
    const idx = tasks.findIndex((t: any) => String(t.id) === String(taskData.id));
    if (idx !== -1) {
      tasks[idx].titulo = taskData.titulo;
      tasks[idx].descricao = taskData.descricao;
      tasks[idx].data_vencimento = taskData.data_vencimento;
      if (taskData.prioridade) tasks[idx].prioridade = taskData.prioridade;
      localStorage.setItem('credsempre_crm_tasks_v1', JSON.stringify(tasks));
    }
    return { success: true };
  }

  public async completeTask(taskId: number | string): Promise<any> {
    const isProd = import.meta.env.PROD;
    if (isProd) {
      const response = await fetch('/api/tasks.php?action=complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token`
        },
        body: JSON.stringify({ id: taskId })
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao concluir tarefa.`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Falha ao concluir tarefa.');
      }
      return data;
    }

    const stored = localStorage.getItem('credsempre_crm_tasks_v1');
    const tasks = stored ? JSON.parse(stored) : [];
    const idx = tasks.findIndex((t: any) => String(t.id) === String(taskId));
    if (idx !== -1) {
      tasks[idx].status = 'Concluída';
      localStorage.setItem('credsempre_crm_tasks_v1', JSON.stringify(tasks));
    }
    return { success: true };
  }

  public async cancelTask(taskId: number | string): Promise<any> {
    const isProd = import.meta.env.PROD;
    if (isProd) {
      const response = await fetch('/api/tasks.php?action=cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token`
        },
        body: JSON.stringify({ id: taskId })
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao cancelar tarefa.`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Falha ao cancelar tarefa.');
      }
      return data;
    }

    const stored = localStorage.getItem('credsempre_crm_tasks_v1');
    const tasks = stored ? JSON.parse(stored) : [];
    const idx = tasks.findIndex((t: any) => String(t.id) === String(taskId));
    if (idx !== -1) {
      tasks[idx].status = 'Cancelada';
      localStorage.setItem('credsempre_crm_tasks_v1', JSON.stringify(tasks));
    }
    return { success: true };
  }

  // ======================================================
  // CLIENT DOCUMENTS - FASE 7.7
  // ======================================================

  public async getClientDocuments(clientId: string): Promise<any[]> {
    const isProd = import.meta.env.PROD;
    if (isProd) {
      try {
        const response = await fetch(`/api/client_documents.php?action=list&client_id=${clientId}`, {
          headers: { 'Authorization': `Bearer mock_token` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.documents)) return data.documents;
        }
      } catch (e) {
        console.error('Erro ao buscar documentos do cliente do MySQL:', e);
      }
    }
    // Fallback/Local storage
    const stored = localStorage.getItem(`credsempre_crm_client_docs_${clientId}`);
    return stored ? JSON.parse(stored) : [];
  }

  public async uploadClientDocument(formData: FormData): Promise<any> {
    const isProd = import.meta.env.PROD;
    const clientId = formData.get('client_id');

    if (isProd) {
      const response = await fetch('/api/client_documents.php?action=upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer mock_token` },
        body: formData
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao enviar documento.`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Falha ao salvar documento no servidor.');
      }
      return data;
    }

    // Local storage fallback for dev
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string || '';

    if (!file) throw new Error('Nenhum arquivo enviado.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Arquivo muito grande. O tamanho máximo permitido é 10 MB.');

    const newDoc = {
      id: Date.now(),
      client_id: clientId,
      category,
      original_name: file.name,
      extension: file.name.split('.').pop() || '',
      mime_type: file.type || 'application/octet-stream',
      file_size: file.size,
      description,
      uploaded_by: 'Administrador (Dev)',
      status: 'Ativo',
      created_at: new Date().toISOString()
    };

    const storedKey = `credsempre_crm_client_docs_${clientId}`;
    const stored = localStorage.getItem(storedKey);
    const docs = stored ? JSON.parse(stored) : [];
    docs.unshift(newDoc);
    localStorage.setItem(storedKey, JSON.stringify(docs));

    return { success: true, id: newDoc.id, message: 'Documento enviado com sucesso.' };
  }

  public async deleteClientDocument(docId: string | number, clientId: string | number): Promise<any> {
    const isProd = import.meta.env.PROD;
    if (isProd) {
      const response = await fetch('/api/client_documents.php?action=delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock_token`
        },
        body: JSON.stringify({ id: docId })
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao excluir documento.`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Falha ao excluir documento.');
      }
      return data;
    }

    const storedKey = `credsempre_crm_client_docs_${clientId}`;
    const stored = localStorage.getItem(storedKey);
    if (stored) {
      let docs = JSON.parse(stored);
      docs = docs.filter((d: any) => String(d.id) !== String(docId));
      localStorage.setItem(storedKey, JSON.stringify(docs));
    }
    return { success: true };
  }

  public formatWhatsAppUrl(phone: string, text = ''): string {
    const digits = phone.replace(/\D/g, '');
    let cleanNumber = digits;

    if (digits.length === 10 || digits.length === 11) {
      cleanNumber = `55${digits}`;
    }

    const encodedText = encodeURIComponent(text);
    return `https://wa.me/${cleanNumber}${encodedText ? `?text=${encodedText}` : ''}`;
  }
}

export const apiService = new ApiService();

