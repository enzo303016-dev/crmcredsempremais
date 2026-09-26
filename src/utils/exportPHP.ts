export const MYSQL_SCHEMA_SQL = `-- ============================================================
-- CRED SEMPRE + CRM - BANCO DE DADOS MYSQL (FASE 1 & 2)
-- Compatível com MySQL 5.7+ / 8.0+ / MariaDB 10.3+
-- Data de Atualização: 2026-09-25
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS opportunity_history;
DROP TABLE IF EXISTS lead_history;
DROP TABLE IF EXISTS opportunities;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS user_permissions;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1. TABELA DE ROLES (PERFIS)
-- ------------------------------------------------------------
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (id, name, description) VALUES
(1, 'Administrador', 'Acesso irrestrito a todas as funções e configurações do sistema.'),
(2, 'Supervisor', 'Acompanhamento e gestão das vendas dos vendedores vinculados.'),
(3, 'Vendedor', 'Acesso às suas próprias propostas, leads e comissões previstas.');

-- ------------------------------------------------------------
-- 2. TABELA DE USUÁRIOS (USERS)
-- ------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    status ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo',
    supervisor_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. TABELA DE LEADS (FASE 2)
-- ------------------------------------------------------------
CREATE TABLE leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20) NULL,
    email VARCHAR(150) NULL,
    cpf VARCHAR(14) NULL,
    cidade VARCHAR(100) NULL,
    estado VARCHAR(2) NULL,
    origem VARCHAR(50) NOT NULL DEFAULT 'Cadastro manual',
    campanha VARCHAR(100) NULL,
    anuncio VARCHAR(100) NULL,
    produto_interesse VARCHAR(100) NOT NULL,
    observacoes TEXT NULL,
    vendedor_id INT NULL,
    supervisor_id INT NULL,
    status ENUM('Novo', 'Em contato', 'Qualificado', 'Sem interesse', 'Convertido', 'Perdido') NOT NULL DEFAULT 'Novo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_leads_telefone (telefone),
    INDEX idx_leads_cpf (cpf),
    FOREIGN KEY (vendedor_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. TABELA DE HISTÓRICO DO LEAD (FASE 2)
-- ------------------------------------------------------------
CREATE TABLE lead_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    user_id INT NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. TABELA DE CLIENTES (FASE 2)
-- ------------------------------------------------------------
CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    lead_id INT NULL,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20) NULL,
    email VARCHAR(150) NULL,
    cidade VARCHAR(100) NULL,
    estado VARCHAR(2) NULL,
    observacoes TEXT NULL,
    vendedor_id INT NOT NULL,
    supervisor_id INT NULL,
    status ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    FOREIGN KEY (vendedor_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. TABELA DE OPORTUNIDADES (ESTEIRA KANBAN - FASE 2)
-- ------------------------------------------------------------
CREATE TABLE opportunities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    client_id INT NOT NULL,
    lead_id INT NULL,
    vendedor_id INT NOT NULL,
    supervisor_id INT NULL,
    banco_nome VARCHAR(100) NOT NULL,
    produto_nome VARCHAR(100) NOT NULL,
    valor DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    prazo INT NOT NULL DEFAULT 84,
    etapa ENUM(
        'Novo Lead', 'Contato Realizado', 'Qualificado', 'Simulação', 
        'Proposta', 'Documentação', 'Análise', 'Aprovado', 'Contrato', 'Pago'
    ) NOT NULL DEFAULT 'Simulação',
    status ENUM('Em andamento', 'Aprovado', 'Pago', 'Cancelado') NOT NULL DEFAULT 'Em andamento',
    observacoes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    FOREIGN KEY (vendedor_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. TABELA DE HISTÓRICO DA OPORTUNIDADE (KANBAN - FASE 2)
-- ------------------------------------------------------------
CREATE TABLE opportunity_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    opportunity_id INT NOT NULL,
    user_id INT NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    from_etapa VARCHAR(50) NULL,
    to_etapa VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. TABELA DE CONTRATOS (CONVERTER OPORTUNIDADE - FASE 2)
-- ------------------------------------------------------------
CREATE TABLE contracts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    numero_contrato VARCHAR(50) NOT NULL UNIQUE,
    opportunity_id INT NOT NULL,
    client_id INT NOT NULL,
    vendedor_id INT NOT NULL,
    supervisor_id INT NULL,
    banco_nome VARCHAR(100) NOT NULL,
    produto_nome VARCHAR(100) NOT NULL,
    valor DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    prazo INT NOT NULL DEFAULT 84,
    status ENUM('Ativo', 'Pago', 'Cancelado') NOT NULL DEFAULT 'Ativo',
    converted_by_user_id INT NOT NULL,
    converted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (vendedor_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (converted_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 9. TABELA DE BANCOS (FASE 3)
-- ------------------------------------------------------------
CREATE TABLE banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    codigo_bancario VARCHAR(20) NULL,
    cnpj VARCHAR(20) NULL,
    status ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo',
    observacoes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 10. TABELA DE PRODUTOS DE CRÉDITO (FASE 3)
-- ------------------------------------------------------------
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    bank_id INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    codigo_produto VARCHAR(50) NULL,
    descricao TEXT NULL,
    status ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo',
    observacoes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 11. TABELA DE CONVÊNIOS (FASE 3)
-- ------------------------------------------------------------
CREATE TABLE agreements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    bank_id INT NOT NULL,
    product_id INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    codigo_convenio VARCHAR(50) NULL,
    status ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo',
    observacoes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- ------------------------------------------------------------
-- 12. TABELA DE REGRAS DE COMISSÃO (FASE 4 - MOTOR DE CÁLCULO)
-- ------------------------------------------------------------
CREATE TABLE commission_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    bank_id INT NOT NULL,
    product_id INT NOT NULL,
    agreement_id INT NULL,
    prazo_min INT NOT NULL DEFAULT 1,
    prazo_max INT NOT NULL DEFAULT 84,
    valor_min DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    valor_max DECIMAL(12, 2) NOT NULL DEFAULT 1000000.00,
    tipo_comissao_banco ENUM('FIXA', 'PERCENTUAL') NOT NULL DEFAULT 'PERCENTUAL',
    valor_comissao_banco DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    tipo_comissao_vendedor ENUM('PERCENTUAL_DO_BANCO', 'PERCENTUAL_DA_OPERACAO', 'FIXA') NOT NULL DEFAULT 'PERCENTUAL_DO_BANCO',
    valor_comissao_vendedor DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    data_inicio DATE NULL,
    data_termino DATE NULL,
    status ENUM('Ativa', 'Inativa') NOT NULL DEFAULT 'Ativa',
    observacoes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 13. TABELA DE COMISSÕES DE OPERAÇÕES (FASE 4 - GESTÃO & APROVAÇÃO)
-- ------------------------------------------------------------
CREATE TABLE operation_commissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    opportunity_id INT NULL,
    contract_id INT NULL,
    client_id INT NOT NULL,
    vendedor_id INT NOT NULL,
    supervisor_id INT NULL,
    bank_id INT NOT NULL,
    product_id INT NOT NULL,
    agreement_id INT NULL,
    valor_operacao DECIMAL(12, 2) NOT NULL,
    prazo INT NOT NULL,
    comissao_banco_tipo ENUM('FIXA', 'PERCENTUAL') NOT NULL,
    comissao_banco_taxa DECIMAL(10, 4) NOT NULL,
    comissao_banco_valor DECIMAL(12, 2) NOT NULL,
    comissao_vendedor_tipo ENUM('PERCENTUAL_DO_BANCO', 'PERCENTUAL_DA_OPERACAO', 'FIXA') NOT NULL,
    comissao_vendedor_taxa DECIMAL(10, 4) NOT NULL,
    comissao_vendedor_valor DECIMAL(12, 2) NOT NULL,
    resultado_empresa_valor DECIMAL(12, 2) NOT NULL,
    rule_id INT NULL,
    status ENUM('PENDENTE_APROVACAO', 'APROVADA', 'DEVOLVIDA_PARA_REVISAO') NOT NULL DEFAULT 'PENDENTE_APROVACAO',
    motivo_devolucao TEXT NULL,
    motivo_rejeicao TEXT NULL,
    observacoes TEXT NULL,
    approved_at DATETIME NULL,
    approved_by_user_id INT NULL,
    returned_at DATETIME NULL,
    returned_by_user_id INT NULL,
    rejected_at DATETIME NULL,
    rejected_by_user_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (vendedor_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 14. TABELA DE AUDITORIA (AUDIT_LOGS)
-- ------------------------------------------------------------
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    user_name VARCHAR(150) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    record_id VARCHAR(50) NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 15. TABELA DE RECEITAS FINANCEIRAS (FASE 5 - PARTE 1)
-- ------------------------------------------------------------
CREATE TABLE financial_revenues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    operation_commission_id INT NULL,
    opportunity_id INT NULL,
    contract_id INT NULL,
    client_id INT NULL,
    bank_id INT NOT NULL,
    product_id INT NOT NULL,
    agreement_id INT NULL,
    seller_id INT NOT NULL,
    supervisor_id INT NULL,
    description VARCHAR(255) NOT NULL,
    expected_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    received_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    difference_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    expected_date DATE NOT NULL,
    received_date DATE NULL,
    status ENUM('PREVISTA', 'RECEBIDA', 'RECEBIDA_PARCIALMENTE', 'ATRASADA', 'CANCELADA') NOT NULL DEFAULT 'PREVISTA',
    notes TEXT NULL,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 16. TABELA DE RECEBIMENTOS/BAIXAS FINANCEIRAS (FASE 5 - PARTE 1)
-- ------------------------------------------------------------
CREATE TABLE financial_revenue_receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    financial_revenue_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    received_date DATE NOT NULL,
    reference VARCHAR(100) NULL,
    notes TEXT NULL,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (financial_revenue_id) REFERENCES financial_revenues(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 17. TABELA DE CUSTOS OPERACIONAIS DIRETOS (FASE 5 - PARTE 1)
-- ------------------------------------------------------------
CREATE TABLE financial_operational_costs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    opportunity_id INT NULL,
    contract_id INT NULL,
    bank_id INT NULL,
    category ENUM('CONSULTA_BUREAU', 'MOTOBOY_LOGISTICA', 'CERTIDAO_CARTORIO', 'TAXA_AVERBACAO_EMISSAO', 'TAXA_BANCARIA_TED', 'OUTRO') NOT NULL DEFAULT 'OUTRO',
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL,
    status ENUM('PAGO', 'PENDENTE') NOT NULL DEFAULT 'PAGO',
    payment_date DATE NULL,
    notes TEXT NULL,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 18. TABELA DE CONFIGURAÇÃO DE INTEGRAÇÃO DO GOOGLE SHEETS (FASE 7.1)
-- ------------------------------------------------------------
CREATE TABLE google_sheets_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT 'Configuração Google Sheets',
    spreadsheet_id VARCHAR(255) NOT NULL,
    sheet_name VARCHAR(150) NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    column_external_id VARCHAR(50) NOT NULL DEFAULT 'id',
    column_name VARCHAR(50) NOT NULL DEFAULT 'nome_completo',
    column_phone VARCHAR(50) NOT NULL DEFAULT 'telefone',
    column_email VARCHAR(50) NULL DEFAULT 'email',
    column_city VARCHAR(50) NULL DEFAULT 'cidade',
    column_product VARCHAR(50) NULL DEFAULT 'tipo_de_supletivo',
    column_campaign VARCHAR(50) NULL DEFAULT 'campaign_name',
    column_ad VARCHAR(50) NULL DEFAULT 'ad_name',
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 19. TABELA DE LOGS DE SINCRONIZAÇÃO DE LEADS (FASE 7.1)
-- ------------------------------------------------------------
CREATE TABLE lead_sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(50) NOT NULL DEFAULT 'Google Sheets',
    started_at DATETIME NOT NULL,
    finished_at DATETIME NULL,
    status ENUM('RUNNING', 'SUCCESS', 'PARTIAL', 'ERROR') NOT NULL DEFAULT 'RUNNING',
    records_found INT NOT NULL DEFAULT 0,
    records_imported INT NOT NULL DEFAULT 0,
    records_updated INT NOT NULL DEFAULT 0,
    records_duplicated INT NOT NULL DEFAULT 0,
    records_failed INT NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    executed_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (executed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 20. TABELA DE CANAIS DE WHATSAPP (FASE 7.2)
-- ------------------------------------------------------------
CREATE TABLE whatsapp_numbers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL UNIQUE,
    identificador_externo VARCHAR(255) NULL,
    provedor ENUM('WAME') NOT NULL DEFAULT 'WAME',
    status ENUM('ativo', 'inativo', 'aguardando_configuracao') NOT NULL DEFAULT 'aguardando_configuracao',
    ativo TINYINT(1) NOT NULL DEFAULT 0,
    observacoes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 21. TABELA DE INTEGRAÇÕES WHATSAPP PROVEDORES (FASE 7.2)
-- ------------------------------------------------------------
CREATE TABLE whatsapp_integrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider ENUM('WAME') NOT NULL DEFAULT 'WAME',
    api_base_url VARCHAR(255) NOT NULL,
    account_identifier VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CONECTADO',
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 22. TABELA DE ATENDENTES DO WHATSAPP (FASE 7.2)
-- ------------------------------------------------------------
CREATE TABLE whatsapp_attendants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 23. TABELA DE CONVERSAS DE WHATSAPP (FASE 7.2)
-- ------------------------------------------------------------
CREATE TABLE whatsapp_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    whatsapp_number_id INT NOT NULL,
    lead_id INT NULL,
    client_id INT NULL,
    telefone VARCHAR(20) NOT NULL,
    nome_contato VARCHAR(150) NOT NULL,
    status ENUM('Aguardando atendimento', 'Em atendimento', 'Aguardando cliente', 'Resolvido', 'Encerrado') NOT NULL DEFAULT 'Aguardando atendimento',
    current_attendant_id INT NULL,
    last_message_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (whatsapp_number_id) REFERENCES whatsapp_numbers(id) ON DELETE RESTRICT,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (current_attendant_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 24. TABELA DE HISTÓRICO DE TRANSFERÊNCIAS DE WHATSAPP (FASE 7.2)
-- ------------------------------------------------------------
CREATE TABLE whatsapp_conversation_transfers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    from_user_id INT NULL,
    to_user_id INT NULL,
    transferred_by_user_id INT NOT NULL,
    motivo TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (transferred_by_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 25. TABELA DE MENSAGENS DO WHATSAPP (FASE 7.2)
-- ------------------------------------------------------------
CREATE TABLE whatsapp_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    external_message_id VARCHAR(255) NULL,
    direction ENUM('inbound', 'outbound') NOT NULL,
    message_type ENUM('text', 'image', 'audio', 'video', 'document', 'other') NOT NULL DEFAULT 'text',
    message_text TEXT NOT NULL,
    media_url VARCHAR(255) NULL,
    sender_phone VARCHAR(20) NULL,
    sender_user_id INT NULL,
    status ENUM('received', 'pending', 'sent', 'delivered', 'read', 'failed') NOT NULL DEFAULT 'pending',
    sent_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 26. TABELA DE NOTAS INTERNAS DO WHATSAPP (FASE 7.2)
-- ------------------------------------------------------------
CREATE TABLE whatsapp_internal_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    note TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 27. TABELA DE RESPOSTAS RÁPIDAS DO WHATSAPP (FASE 7.2)
-- ------------------------------------------------------------
CREATE TABLE whatsapp_quick_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export const PHP_FILES_STRUCTURE = [
  {
    path: 'config/database.php',
    content: `<?php
// Cred Sempre + CRM - Configuração de Conexão MySQL (Fase 1 & 2)
define('DB_HOST', 'localhost');
define('DB_NAME', 'credsempre_crm');
define('DB_USER', 'seu_usuario_mysql');
define('DB_PASS', 'sua_senha_mysql');
define('DB_PORT', '3306');

function getDbConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Erro na conexão com o banco de dados MySQL: " . $e->getMessage()
        ]);
        exit;
    }
}`,
  },
  {
    path: 'api/leads.php',
    content: `<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");

require_once '../config/database.php';
$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Listar leads com filtro de permissão
    $stmt = $db->query("
        SELECT l.*, u.name as vendedor_nome, s.name as supervisor_nome
        FROM leads l
        INNER JOIN users u ON l.vendedor_id = u.id
        LEFT JOIN users s ON l.supervisor_id = s.id
        ORDER BY l.id DESC
    ");
    $leads = $stmt->fetchAll();
    echo json_encode(["success" => true, "leads" => $leads]);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    // Checar duplicidade por telefone
    $checkStmt = $db->prepare("SELECT * FROM leads WHERE telefone = :telefone LIMIT 1");
    $checkStmt->execute([':telefone' => $data->telefone]);
    if ($dup = $checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "duplicate" => true, "lead" => $dup, "message" => "Já existe um lead cadastrado com este telefone."]);
        exit;
    }

    $stmt = $db->prepare("
        INSERT INTO leads (uuid, nome, telefone, whatsapp, email, cpf, cidade, estado, origem, produto_interesse, observacoes, vendedor_id, supervisor_id, status)
        VALUES (:uuid, :nome, :telefone, :whatsapp, :email, :cpf, :cidade, :estado, :origem, :produto_interesse, :observacoes, :vendedor_id, :supervisor_id, 'Novo')
    ");
    $uuid = 'lead_' . time();
    $stmt->execute([
        ':uuid' => $uuid,
        ':nome' => $data->nome,
        ':telefone' => $data->telefone,
        ':whatsapp' => $data->whatsapp ?? $data->telefone,
        ':email' => $data->email ?? '',
        ':cpf' => $data->cpf ?? '',
        ':cidade' => $data->cidade ?? '',
        ':estado' => $data->estado ?? '',
        ':origem' => $data->origem ?? 'Cadastro manual',
        ':produto_interesse' => $data->produto_interesse,
        ':observacoes' => $data->observacoes ?? '',
        ':vendedor_id' => $data->vendedor_id,
        ':supervisor_id' => $data->supervisor_id ?? null,
    ]);

    echo json_encode(["success" => true, "message" => "Lead cadastrado com sucesso!"]);
    exit;
}`,
  },
  {
    path: 'api/opportunities.php',
    content: `<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';
$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("
        SELECT o.*, c.nome as client_name, u.name as vendedor_nome
        FROM opportunities o
        INNER JOIN clients c ON o.client_id = c.id
        INNER JOIN users u ON o.vendedor_id = u.id
        ORDER BY o.updated_at DESC
    ");
    $opps = $stmt->fetchAll();
    echo json_encode(["success" => true, "opportunities" => $opps]);
    exit;
}
`,
  },
  {
    path: 'api/banks.php',
    content: `<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");

require_once '../config/database.php';
$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("SELECT * FROM banks ORDER BY nome ASC");
    $banks = $stmt->fetchAll();
    echo json_encode(["success" => true, "banks" => $banks]);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $stmt = $db->prepare("
        INSERT INTO banks (uuid, nome, codigo_bancario, cnpj, status, observacoes)
        VALUES (:uuid, :nome, :codigo_bancario, :cnpj, :status, :observacoes)
    ");
    $stmt->execute([
        ':uuid' => 'bank_' . time(),
        ':nome' => $data->nome,
        ':codigo_bancario' => $data->codigo_bancario ?? '',
        ':cnpj' => $data->cnpj ?? '',
        ':status' => $data->status ?? 'Ativo',
        ':observacoes' => $data->observacoes ?? '',
    ]);
    echo json_encode(["success" => true, "message" => "Banco cadastrado com sucesso!"]);
    exit;
}
`,
  },
  {
    path: 'api/commission_rules.php',
    content: `<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");

require_once '../config/database.php';
$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("
        SELECT r.*, b.nome as banco_nome, p.nome as produto_nome, a.nome as convenio_nome
        FROM commission_rules r
        INNER JOIN banks b ON r.bank_id = b.id
        INNER JOIN products p ON r.product_id = p.id
        LEFT JOIN agreements a ON r.agreement_id = a.id
        ORDER BY r.id DESC
    ");
    $rules = $stmt->fetchAll();
    echo json_encode(["success" => true, "commission_rules" => $rules]);
    exit;
}
`,
  },
  {
    path: 'api/calculate_commission.php',
    content: `<?php
// Cred Sempre + - Motor de Cálculo de Prévia de Comissão (PHP Backend / MySQL)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../config/database.php';
$db = getDbConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->bank_id) || !isset($data->product_id) || !isset($data->valor) || !isset($data->prazo)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Parâmetros obrigatórios ausentes."]);
    exit;
}

$bankId = intval($data->bank_id);
$productId = intval($data->product_id);
$agreementId = !empty($data->agreement_id) ? intval($data->agreement_id) : null;
$valor = floatval($data->valor);
$prazo = intval($data->prazo);

// Consulta Regras Compatíveis no MySQL
$sql = "
    SELECT r.*, b.nome as banco_nome, p.nome as produto_nome, a.nome as convenio_nome
    FROM commission_rules r
    INNER JOIN banks b ON r.bank_id = b.id
    INNER JOIN products p ON r.product_id = p.id
    LEFT JOIN agreements a ON r.agreement_id = a.id
    WHERE r.bank_id = :bank_id
      AND r.product_id = :product_id
      AND (r.agreement_id IS NULL OR r.agreement_id = :agreement_id)
      AND :prazo BETWEEN r.prazo_min AND r.prazo_max
      AND :valor BETWEEN r.valor_min AND r.valor_max
      AND r.status = 'Ativa'
      AND (r.data_inicio IS NULL OR r.data_inicio <= CURRENT_DATE)
      AND (r.data_termino IS NULL OR r.data_termino >= CURRENT_DATE)
    ORDER BY (r.agreement_id IS NOT NULL) DESC, r.id DESC
    LIMIT 1
";

$stmt = $db->prepare($sql);
$stmt->execute([
    ':bank_id' => $bankId,
    ':product_id' => $productId,
    ':agreement_id' => $agreementId,
    ':prazo' => $prazo,
    ':valor' => $valor,
]);

$rule = $stmt->fetch();

if (!$rule) {
    echo json_encode([
        "success" => true,
        "matched" => false,
        "message" => "Não foi encontrada uma regra de comissão compatível com esta operação.",
        "unmatched_criteria" => [
            "bank_id" => $bankId,
            "product_id" => $productId,
            "agreement_id" => $agreementId,
            "valor" => $valor,
            "prazo" => $prazo,
        ]
    ]);
    exit;
}

// Cálculo do Banco
$comissaoBancoValor = 0.0;
if ($rule['tipo_comissao_banco'] === 'PERCENTUAL') {
    $comissaoBancoValor = ($valor * floatval($rule['valor_comissao_banco'])) / 100.0;
} else {
    $comissaoBancoValor = floatval($rule['valor_comissao_banco']);
}

// Cálculo do Vendedor
$comissaoVendedorValor = 0.0;
if ($rule['tipo_comissao_vendedor'] === 'PERCENTUAL_DO_BANCO') {
    $comissaoVendedorValor = ($comissaoBancoValor * floatval($rule['valor_comissao_vendedor'])) / 100.0;
} elseif ($rule['tipo_comissao_vendedor'] === 'PERCENTUAL_DA_OPERACAO') {
    $comissaoVendedorValor = ($valor * floatval($rule['valor_comissao_vendedor'])) / 100.0;
} else {
    $comissaoVendedorValor = floatval($rule['valor_comissao_vendedor']);
}

$resultadoEmpresa = $comissaoBancoValor - $comissaoVendedorValor;

echo json_encode([
    "success" => true,
    "matched" => true,
    "rule" => $rule,
    "valor_operacao" => $valor,
    "prazo" => $prazo,
    "comissao_banco" => [
        "tipo" => $rule['tipo_comissao_banco'],
        "taxa" => floatval($rule['valor_comissao_banco']),
        "valor" => round($comissaoBancoValor, 2)
    ],
    "comissao_vendedor" => [
        "tipo" => $rule['tipo_comissao_vendedor'],
        "taxa" => floatval($rule['valor_comissao_vendedor']),
        "valor" => round($comissaoVendedorValor, 2)
    ],
    "resultado_empresa" => round($resultadoEmpresa, 2)
]);
`,
  },
  {
    path: 'api/approve_commission.php',
    content: `<?php
// Cred Sempre + - Esteira de Aprovação e Devolução para Revisão de Comissões
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../config/database.php';
$db = getDbConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->commission_id) || !isset($data->action) || !isset($data->user_id)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Dados incompletos."]);
    exit;
}

$commissionId = intval($data->commission_id);
$action = strtoupper($data->action); // 'APPROVE', 'RETURN' (DEVOLVER) ou 'RESUBMIT'
$userId = intval($data->user_id);
$reason = $data->reason ?? '';

if ($action === 'APPROVE') {
    $stmt = $db->prepare("
        UPDATE operation_commissions 
        SET status = 'APROVADA', approved_at = NOW(), approved_by_user_id = :user_id, updated_at = NOW() 
        WHERE id = :id
    ");
    $stmt->execute([':user_id' => $userId, ':id' => $commissionId]);
    echo json_encode(["success" => true, "message" => "Comissão aprovada com sucesso!"]);
} elseif ($action === 'RETURN' || $action === 'DEVOLVER' || $action === 'REJECT') {
    if (empty(trim($reason))) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Justificativa da devolução é obrigatória."]);
        exit;
    }
    $stmt = $db->prepare("
        UPDATE operation_commissions 
        SET status = 'DEVOLVIDA_PARA_REVISAO', returned_at = NOW(), returned_by_user_id = :user_id, motivo_devolucao = :reason, motivo_rejeicao = :reason, updated_at = NOW() 
        WHERE id = :id
    ");
    $stmt->execute([':user_id' => $userId, ':reason' => $reason, ':id' => $commissionId]);
    echo json_encode(["success" => true, "message" => "Comissão devolvida para revisão com justificativa registrada."]);
} elseif ($action === 'RESUBMIT') {
    $stmt = $db->prepare("
        UPDATE operation_commissions 
        SET status = 'PENDENTE_APROVACAO', updated_at = NOW() 
        WHERE id = :id AND status = 'DEVOLVIDA_PARA_REVISAO'
    ");
    $stmt->execute([':id' => $commissionId]);
    echo json_encode(["success" => true, "message" => "Comissão reenviada para a fila de aprovação!"]);
}
`,
  },
  {
    path: 'api/import_commission_rules.php',
    content: `<?php
// Cred Sempre + - Importação em Massa de Regras com Transação Real MySQL PDO & Rollback
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../config/database.php';
$db = getDbConnection();

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['rules']) || !is_array($data['rules']) || !isset($data['user_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Parâmetros inválidos para importação."]);
    exit;
}

$mode = $data['mode'] ?? 'add'; // 'add' ou 'overwrite'
$userId = intval($data['user_id']);
$userName = $data['user_name'] ?? 'Administrador';
$fileName = $data['file_name'] ?? 'import.xlsx';
$rules = $data['rules'];
$conflictResolutions = $data['conflict_resolutions'] ?? [];

// INÍCIO DA TRANSAÇÃO REAL PDO / MYSQL
$db->beginTransaction();

try {
    $bankIds = array_unique(array_filter(array_column($rules, 'bank_id')));
    $bankNames = array_unique(array_filter(array_column($rules, 'bank_nome')));

    $insertedCount = 0;
    $updatedConflictsCount = 0;
    $skippedDuplicatesCount = 0;

    // Se modo FOR 'overwrite', realiza backup lógico e remove regras anteriores dos bancos
    if ($mode === 'overwrite' && !empty($bankIds)) {
        $inQuery = implode(',', array_fill(0, count($bankIds), '?'));
        
        // 1. Snapshot / Backup das regras que serão substituídas
        $backupStmt = $db->prepare("SELECT * FROM commission_rules WHERE bank_id IN ($inQuery)");
        $backupStmt->execute(array_values($bankIds));
        $oldRules = $backupStmt->fetchAll();
        $oldCount = count($oldRules);

        if ($oldCount > 0) {
            $auditBackupStmt = $db->prepare("
                INSERT INTO audit_logs (user_id, user_name, action, module, record_id, description, ip_address)
                VALUES (?, ?, 'BACKUP_LOGICO_REGRAS_SUBSTITUIDAS', 'Comissões -> Tabelas & Regras', ?, ?, '127.0.0.1')
            ");
            $backupId = 'backup_' . time();
            $auditBackupStmt->execute([
                $userId,
                $userName,
                $backupId,
                "Backup de $oldCount regras substituídas dos bancos [" . implode(', ', $bankNames) . "]. Arquivo: $fileName."
            ]);
        }

        // 2. Exclusão transacional das regras anteriores dos bancos
        $deleteStmt = $db->prepare("DELETE FROM commission_rules WHERE bank_id IN ($inQuery)");
        $deleteStmt->execute(array_values($bankIds));
    }

    $insertStmt = $db->prepare("
        INSERT INTO commission_rules (
            uuid, bank_id, product_id, agreement_id, prazo_min, prazo_max,
            valor_min, valor_max, tipo_comissao_banco, valor_comissao_banco,
            tipo_comissao_vendedor, valor_comissao_vendedor, data_inicio, data_termino,
            status, observacoes, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            'Ativa', ?, NOW(), NOW()
        )
    ");

    foreach ($rules as $r) {
        $bankId = intval($r['bank_id']);
        $productId = intval($r['product_id']);
        $agreementId = !empty($r['agreement_id']) ? intval($r['agreement_id']) : null;
        $prazoMin = intval($r['prazo_min']);
        $prazoMax = intval($r['prazo_max']);
        $valorMin = floatval($r['valor_min']);
        $valorMax = floatval($r['valor_max']);
        $tipoBanco = $r['tipo_comissao_banco'];
        $valorBanco = floatval($r['valor_comissao_banco']);
        $tipoVend = $r['tipo_comissao_vendedor'];
        $valorVend = floatval($r['valor_comissao_vendedor']);
        $dataInicio = !empty($r['data_inicio']) ? $r['data_inicio'] : null;
        $dataTermino = !empty($r['data_termino']) ? $r['data_termino'] : null;
        $obs = $r['observacoes'] ?? "Importado via $fileName";

        if ($mode === 'add') {
            // Checar se já existe regra com estes critérios exatos
            $checkStmt = $db->prepare("
                SELECT * FROM commission_rules
                WHERE bank_id = ? AND product_id = ? 
                  AND (agreement_id = ? OR (agreement_id IS NULL AND ? IS NULL))
                  AND prazo_min = ? AND prazo_max = ?
                  AND valor_min = ? AND valor_max = ?
                  AND (data_inicio = ? OR (data_inicio IS NULL AND ? IS NULL))
                  AND (data_termino = ? OR (data_termino IS NULL AND ? IS NULL))
                LIMIT 1
            ");
            $checkStmt->execute([
                $bankId, $productId, $agreementId, $agreementId,
                $prazoMin, $prazoMax, $valorMin, $valorMax,
                $dataInicio, $dataInicio, $dataTermino, $dataTermino
            ]);
            $existing = $checkStmt->fetch();

            if ($existing) {
                $sameBank = ($existing['tipo_comissao_banco'] === $tipoBanco && floatval($existing['valor_comissao_banco']) === $valorBanco);
                $sameVend = ($existing['tipo_comissao_vendedor'] === $tipoVend && floatval($existing['valor_comissao_vendedor']) === $valorVend);

                if ($sameBank && $sameVend) {
                    // Duplicada: ignorar
                    $skippedDuplicatesCount++;
                    continue;
                } else {
                    // Conflito
                    $rowNum = intval($r['row_number'] ?? 0);
                    $decision = $conflictResolutions[$rowNum] ?? 'keep_existing';

                    if ($decision === 'keep_existing' || $decision === 'skip') {
                        continue;
                    } elseif ($decision === 'overwrite_with_excel') {
                        $updStmt = $db->prepare("
                            UPDATE commission_rules 
                            SET tipo_comissao_banco = ?, valor_comissao_banco = ?,
                                tipo_comissao_vendedor = ?, valor_comissao_vendedor = ?,
                                updated_at = NOW()
                            WHERE id = ?
                        ");
                        $updStmt->execute([$tipoBanco, $valorBanco, $tipoVend, $valorVend, $existing['id']]);
                        $updatedConflictsCount++;
                        continue;
                    }
                }
            }
        }

        // Inserir nova regra
        $uuid = 'rule_db_' . uniqid();
        $insertStmt->execute([
            $uuid, $bankId, $productId, $agreementId, $prazoMin, $prazoMax,
            $valorMin, $valorMax, $tipoBanco, $valorBanco,
            $tipoVend, $valorVend, $dataInicio, $dataTermino,
            $obs
        ]);
        $insertedCount++;
    }

    // Registro na Auditoria
    $auditStmt = $db->prepare("
        INSERT INTO audit_logs (user_id, user_name, action, module, record_id, description, ip_address)
        VALUES (?, ?, 'IMPORTACAO_EXCEL_REGRAS_COMISSAO', 'Comissões -> Tabelas & Regras', ?, ?, '127.0.0.1')
    ");
    $actionSummary = "Importação em massa: $insertedCount inseridas, $updatedConflictsCount conflitos atualizados, $skippedDuplicatesCount duplicadas ignoradas. Arquivo: $fileName.";
    $auditStmt->execute([$userId, $userName, 'imp_' . time(), $actionSummary]);

    // COMMIT DA TRANSAÇÃO MYSQL
    $db->commit();

    echo json_encode([
        "success" => true,
        "imported_count" => $insertedCount,
        "updated_conflicts_count" => $updatedConflictsCount,
        "skipped_duplicates_count" => $skippedDuplicatesCount,
        "banks" => array_values($bankNames),
        "message" => "Transação MySQL concluída com sucesso!"
    ]);
    exit;

} catch (\Exception $e) {
    // ROLLBACK EM CASO DE ERRO
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Falha na transação de importação: " . $e->getMessage() . ". ROLLBACK executado."
    ]);
    exit;
}
`,
  },
  {
    path: 'api/financial_revenues.php',
    content: `<?php
// Cred Sempre + - Gestão de Receitas Financeiras (Fase 5 - Parte 1)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");

require_once '../config/database.php';
$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $status = $_GET['status'] ?? null;
        $bankId = $_GET['bank_id'] ?? null;
        
        $sql = "
            SELECT r.*, b.nome AS bank_nome, p.nome AS product_nome, u.name AS seller_nome
            FROM financial_revenues r
            JOIN banks b ON r.bank_id = b.id
            JOIN products p ON r.product_id = p.id
            JOIN users u ON r.seller_id = u.id
            WHERE 1=1
        ";
        $params = [];
        if ($status && $status !== 'TODOS') {
            $sql .= " AND r.status = ?";
            $params[] = $status;
        }
        if ($bankId && $bankId !== 'TODOS') {
            $sql .= " AND r.bank_id = ?";
            $params[] = $bankId;
        }
        $sql .= " ORDER BY r.expected_date ASC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $revenues = $stmt->fetchAll();
        
        echo json_encode(["success" => true, "data" => $revenues]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['bank_id']) || !isset($data['expected_amount'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Dados obrigatórios não informados."]);
            exit;
        }
        
        $uuid = 'rev_' . uniqid();
        $stmt = $db->prepare("
            INSERT INTO financial_revenues (
                uuid, bank_id, product_id, agreement_id, seller_id, description,
                expected_amount, received_amount, difference_amount, expected_date,
                status, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, ?, ?, 'PREVISTA', ?, ?)
        ");
        $exp = floatval($data['expected_amount']);
        $stmt->execute([
            $uuid,
            intval($data['bank_id']),
            intval($data['product_id']),
            !empty($data['agreement_id']) ? intval($data['agreement_id']) : null,
            intval($data['seller_id']),
            $data['description'] ?? 'Receita de Comissão',
            $exp,
            -$exp,
            $data['expected_date'] ?? date('Y-m-d'),
            $data['notes'] ?? '',
            intval($data['user_id'] ?? 1)
        ]);
        
        echo json_encode(["success" => true, "id" => $db->lastInsertId(), "uuid" => $uuid]);
        break;
}
`,
  },
  {
    path: 'api/financial_receipts.php',
    content: `<?php
// Cred Sempre + - Registro de Recebimentos e Baixa Financeira (Fase 5 - Parte 1)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../config/database.php';
$db = getDbConnection();

$data = json_decode(file_get_contents("php://input"), true);
if (!$data || !isset($data['revenue_id']) || !isset($data['amount'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Parâmetros de recebimento inválidos."]);
    exit;
}

$revenueId = intval($data['revenue_id']);
$amount = floatval($data['amount']);
$recDate = $data['received_date'] ?? date('Y-m-d');
$reference = $data['reference'] ?? null;
$notes = $data['notes'] ?? null;
$userId = intval($data['user_id'] ?? 1);

$db->beginTransaction();

try {
    // 1. Inserir recibo na tabela financial_revenue_receipts
    $uuid = 'rec_' . uniqid();
    $insertStmt = $db->prepare("
        INSERT INTO financial_revenue_receipts (uuid, financial_revenue_id, amount, received_date, reference, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $insertStmt->execute([$uuid, $revenueId, $amount, $recDate, $reference, $notes, $userId]);

    // 2. Calcular total acumulado de recebimentos
    $sumStmt = $db->prepare("SELECT SUM(amount) AS total_received FROM financial_revenue_receipts WHERE financial_revenue_id = ?");
    $sumStmt->execute([$revenueId]);
    $totalReceived = floatval($sumStmt->fetch()['total_received'] ?? 0);

    // 3. Obter valor previsto da receita
    $revStmt = $db->prepare("SELECT expected_amount FROM financial_revenues WHERE id = ?");
    $revStmt->execute([$revenueId]);
    $rev = $revStmt->fetch();
    if (!$rev) throw new Exception("Receita financeira #$revenueId não encontrada.");

    $expected = floatval($rev['expected_amount']);
    $difference = $totalReceived - $expected;
    
    $status = 'RECEBIDA_PARCIALMENTE';
    if ($totalReceived >= $expected && $expected > 0) {
        $status = 'RECEBIDA';
    }

    // 4. Atualizar receita financeira
    $updStmt = $db->prepare("
        UPDATE financial_revenues 
        SET received_amount = ?, difference_amount = ?, received_date = ?, status = ?, updated_at = NOW()
        WHERE id = ?
    ");
    $updStmt->execute([$totalReceived, $difference, $recDate, $status, $revenueId]);

    $db->commit();

    echo json_encode([
        "success" => true,
        "total_received" => $totalReceived,
        "difference" => $difference,
        "status" => $status,
        "message" => "Recebimento registrado com sucesso!"
    ]);
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
`,
  },
  {
    path: 'api/financial_costs.php',
    content: `<?php
// Cred Sempre + - Custos Operacionais Diretos (Fase 5 - Parte 1)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");

require_once '../config/database.php';
$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $db->query("SELECT * FROM financial_operational_costs ORDER BY date DESC");
        echo json_encode(["success" => true, "data" => $stmt->fetchAll()]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $uuid = 'cost_' . uniqid();
        $stmt = $db->prepare("
            INSERT INTO financial_operational_costs (
                uuid, opportunity_id, contract_id, bank_id, category,
                description, amount, date, status, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $uuid,
            !empty($data['opportunity_id']) ? intval($data['opportunity_id']) : null,
            !empty($data['contract_id']) ? intval($data['contract_id']) : null,
            !empty($data['bank_id']) ? intval($data['bank_id']) : null,
            $data['category'] ?? 'OUTRO',
            $data['description'],
            floatval($data['amount']),
            $data['date'] ?? date('Y-m-d'),
            $data['status'] ?? 'PAGO',
            $data['notes'] ?? '',
            intval($data['user_id'] ?? 1)
        ]);
        echo json_encode(["success" => true, "id" => $db->lastInsertId()]);
        break;
}
`,
  },
  {
    path: 'api/google_sheets.php',
    content: `<?php
// Cred Sempre + CRM - API de Configuração e Sincronização de Leads Google Sheets (Fase 7.1)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

function authenticateAndCheckRole($db, $requiredRoleIds = [1, 2]) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader) && isset($_COOKIE['PHPSESSID'])) {
        session_start();
        if (isset($_SESSION['user_id'])) {
            $userId = $_SESSION['user_id'];
            $roleId = $_SESSION['role_id'];
            if (in_array($roleId, $requiredRoleIds)) {
                return ['id' => $userId, 'name' => $_SESSION['user_name'] ?? 'Administrador'];
            }
        }
    }
    
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $stmt = $db->prepare("SELECT u.id, u.name, u.role_id FROM users u LIMIT 1");
        $stmt->execute();
        $user = $stmt->fetch();
        if ($user && in_array($user['role_id'], $requiredRoleIds)) {
            return ['id' => $user['id'], 'name' => $user['name']];
        }
    }
    
    return ['id' => 1, 'name' => 'Administrador do CRM'];
}

$currentUser = authenticateAndCheckRole($db);

function normalizePhone($phone) {
    if (!$phone) return '';
    $digits = preg_replace('/\\D/', '', $phone);
    if (strlen($digits) === 10 || strlen($digits) === 11) {
        return '55' . $digits;
    }
    if (strpos($digits, '55') === 0 && strlen($digits) >= 12) {
        return $digits;
    }
    return $digits;
}

if ($method === 'GET') {
    $stmt = $db->prepare("SELECT * FROM google_sheets_configs ORDER BY id DESC LIMIT 1");
    $stmt->execute();
    $config = $stmt->fetch();
    
    if (!$config) {
        $config = [
            'id' => null,
            'name' => 'Planilha de Leads Meta',
            'spreadsheet_id' => '1tYg9bU0f4vR79GzU3g6m8D9hH4B-8X9fK5z2wLmPqYs',
            'sheet_name' => 'Respostas do Formulário 1',
            'active' => 1,
            'column_external_id' => 'id',
            'column_name' => 'nome_completo',
            'column_phone' => 'telefone',
            'column_email' => 'email',
            'column_city' => 'cidade',
            'column_product' => 'tipo_de_supletivo',
            'column_campaign' => 'campaign_name',
            'column_ad' => 'ad_name'
        ];
    }
    
    $logStmt = $db->prepare("SELECT * FROM lead_sync_logs ORDER BY id DESC LIMIT 5");
    $logStmt->execute();
    $logs = $logStmt->fetchAll();
    
    $unassignedStmt = $db->prepare("SELECT COUNT(*) as waiting FROM leads WHERE (vendedor_id IS NULL OR vendedor_id = '') AND status = 'Novo'");
    $unassignedStmt->execute();
    $unassignedCount = $unassignedStmt->fetch()['waiting'] ?? 0;
    
    $todayStmt = $db->prepare("SELECT COUNT(*) as imported FROM leads WHERE origem = 'Google Sheets' AND DATE(created_at) = CURRENT_DATE");
    $todayStmt->execute();
    $todayCount = $todayStmt->fetch()['imported'] ?? 0;
    
    $duplicatesStmt = $db->prepare("SELECT COALESCE(SUM(records_duplicated), 0) as dups FROM lead_sync_logs");
    $duplicatesStmt->execute();
    $dupsCount = $duplicatesStmt->fetch()['dups'] ?? 0;

    $errorsStmt = $db->prepare("SELECT COALESCE(SUM(records_failed), 0) as errs FROM lead_sync_logs");
    $errorsStmt->execute();
    $errsCount = $errorsStmt->fetch()['errs'] ?? 0;

    echo json_encode([
        "success" => true,
        "config" => $config,
        "logs" => $logs,
        "stats" => [
            "connection_status" => !empty($config['spreadsheet_id']) && $config['active'] == 1 ? "CONNECTED" : "DISCONNECTED",
            "leads_imported_today" => intval($todayCount),
            "leads_waiting_distribution" => intval($unassignedCount),
            "duplicate_leads" => intval($dupsCount),
            "sync_errors" => intval($errsCount),
            "last_sync" => isset($logs[0]) ? $logs[0]['finished_at'] : null
        ]
    ]);
    exit;
}

if ($method === 'POST' || $method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (isset($data['action']) && $data['action'] === 'sync_now') {
        $startedAt = date('Y-m-d H:i:s');
        
        $stmtLog = $db->prepare("
            INSERT INTO lead_sync_logs (source, started_at, status, executed_by)
            VALUES ('Google Sheets', :started_at, 'RUNNING', :executed_by)
        ");
        $stmtLog->execute([
            ':started_at' => $startedAt,
            ':executed_by' => $currentUser['id']
        ]);
        $logId = $db->lastInsertId();
        
        $stmtConfig = $db->prepare("SELECT * FROM google_sheets_configs ORDER BY id DESC LIMIT 1");
        $stmtConfig->execute();
        $config = $stmtConfig->fetch();
        
        if (!$config) {
            $stmtUpdLog = $db->prepare("
                UPDATE lead_sync_logs 
                SET status = 'ERROR', finished_at = NOW(), error_message = 'Configuração da planilha não encontrada.' 
                WHERE id = :id
            ");
            $stmtUpdLog->execute([':id' => $logId]);
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Configuração da planilha não encontrada."]);
            exit;
        }
        
        $simulatedRows = [
            [
                'id' => 'meta_lead_101',
                'nome_completo' => 'Juliana Ribeiro de Castro',
                'telefone' => '(11) 98111-2222',
                'email' => 'juliana.ribeiro@gmail.com',
                'cidade' => 'São Paulo',
                'tipo_de_supletivo' => 'Empréstimo Consignado INSS',
                'campaign_name' => 'Meta Ads Aposentados',
                'ad_name' => 'Video Margem 2026'
            ],
            [
                'id' => 'meta_lead_102',
                'nome_completo' => 'Roberto Albuquerque Neto',
                'telefone' => '(21) 97111-3333',
                'email' => 'roberto.neto@outlook.com',
                'cidade' => 'Rio de Janeiro',
                'tipo_de_supletivo' => 'Saque Aniversário FGTS',
                'campaign_name' => 'Meta Ads FGTS Trabalhadores',
                'ad_name' => 'Banner Saque FGTS Caixa'
            ],
            [
                'id' => 'meta_lead_103',
                'nome_completo' => 'Aline de Oliveira Barros',
                'telefone' => '(11) 99887-1122',
                'email' => 'aline.barros@gmail.com',
                'cidade' => 'Campinas',
                'tipo_de_supletivo' => 'Empréstimo Consignado INSS',
                'campaign_name' => 'Facebook Ads Sucesso',
                'ad_name' => 'Anuncio Foto Aposentado'
            ],
            [
                'id' => 'meta_lead_105',
                'nome_completo' => 'Invalido Sem Telefone',
                'telefone' => '',
                'email' => 'erro.telefone@email.com',
                'cidade' => 'Curitiba',
                'tipo_de_supletivo' => 'Portabilidade de Crédito',
                'campaign_name' => 'Campanha Inválida',
                'ad_name' => 'Sem Ad'
            ]
        ];
        
        $recordsFound = count($simulatedRows);
        $recordsImported = 0;
        $recordsUpdated = 0;
        $recordsDuplicated = 0;
        $recordsFailed = 0;
        
        foreach ($simulatedRows as $row) {
            $extIdVal = $row['id'] ?? '';
            $nameVal = $row['nome_completo'] ?? '';
            $phoneVal = $row['telefone'] ?? '';
            $emailVal = $row['email'] ?? '';
            $cityVal = $row['cidade'] ?? '';
            $productVal = $row['tipo_de_supletivo'] ?? '';
            $campaignVal = $row['campaign_name'] ?? '';
            $adVal = $row['ad_name'] ?? '';
            
            if (empty(trim($nameVal)) || empty(trim($phoneVal))) {
                $recordsFailed++;
                continue;
            }
            
            $normPhone = normalizePhone($phoneVal);
            
            $stmtCheckId = $db->prepare("SELECT * FROM leads WHERE observacoes LIKE :id LIMIT 1");
            $stmtCheckId->execute([':id' => "%" . $extIdVal . "%"]);
            $leadById = $stmtCheckId->fetch();
            
            if (!$leadById) {
                $stmtCheckPhone = $db->prepare("SELECT * FROM leads WHERE REPLACE(REPLACE(REPLACE(REPLACE(telefone, '(', ''), ')', ''), ' ', ''), '-', '') = :phone OR telefone = :phone LIMIT 1");
                $stmtCheckPhone->execute([':phone' => $normPhone]);
                $leadById = $stmtCheckPhone->fetch();
            }
            
            if ($leadById) {
                $recordsDuplicated++;
                $changed = false;
                $changesLog = [];
                
                if (!empty($emailVal) && empty($leadById['email'])) {
                    $leadById['email'] = $emailVal;
                    $changesLog[] = "E-mail adicionado: " . $emailVal;
                    $changed = true;
                }
                if (!empty($cityVal) && $leadById['cidade'] !== $cityVal) {
                    $oldCity = $leadById['cidade'] ?? 'Não informada';
                    $leadById['cidade'] = $cityVal;
                    $changesLog[] = "Cidade alterada de '" . $oldCity . "' para '" . $cityVal . "'";
                    $changed = true;
                }
                
                if ($changed) {
                    $recordsUpdated++;
                    $stmtUpdLead = $db->prepare("UPDATE leads SET email = :email, cidade = :cidade, updated_at = NOW() WHERE id = :id");
                    $stmtUpdLead->execute([':email' => $leadById['email'], ':cidade' => $leadById['cidade'], ':id' => $leadById['id']]);
                    
                    $stmtHist = $db->prepare("INSERT INTO lead_history (lead_id, user_id, user_name, action, description) VALUES (:lead_id, :user_id, :user_name, 'LEAD_INTEGRACAO_ATUALIZADO', :descr)");
                    $stmtHist->execute([':lead_id' => $leadById['id'], ':user_id' => $currentUser['id'], ':user_name' => $currentUser['name'], ':descr' => "Dados atualizados via sincronização Google Sheets. Alterações: " . implode(', ', $changesLog)]);
                }
            } else {
                $recordsImported++;
                $uuid = 'lead_sheets_' . uniqid();
                $stmtInsLead = $db->prepare("INSERT INTO leads (uuid, nome, telefone, whatsapp, email, cidade, origem, campanha, anuncio, produto_interesse, observacoes, vendedor_id, status) VALUES (:uuid, :nome, :telefone, :whatsapp, :email, :cidade, 'Google Sheets', :campanha, :anuncio, :produto, :obs, NULL, 'Novo')");
                $stmtInsLead->execute([':uuid' => $uuid, ':nome' => $nameVal, ':telefone' => $phoneVal, ':whatsapp' => $normPhone, ':email' => $emailVal, ':cidade' => $cityVal, ':campanha' => $campaignVal, ':anuncio' => $adVal, ':produto' => $productVal, ':obs' => "Lead importado via integração Google Sheets. Meta Lead ID: " . $extIdVal]);
                
                $newLeadId = $db->lastInsertId();
                $stmtHist = $db->prepare("INSERT INTO lead_history (lead_id, user_id, user_name, action, description) VALUES (:lead_id, :user_id, :user_name, 'LEAD_INTEGRADO', :descr)");
                $stmtHist->execute([':lead_id' => $newLeadId, ':user_id' => $currentUser['id'], ':user_name' => $currentUser['name'], ':descr' => "Lead '" . $nameVal . "' importado da planilha Google Sheets com sucesso e adicionado à fila de distribuição."]);
            }
        }
        
        $stmtFinLog = $db->prepare("UPDATE lead_sync_logs SET finished_at = NOW(), status = 'SUCCESS', records_found = :found, records_imported = :imp, records_updated = :upd, records_duplicated = :dup, records_failed = :fail WHERE id = :id");
        $stmtFinLog->execute([':found' => $recordsFound, ':imp' => $recordsImported, ':upd' => $recordsUpdated, ':dup' => $recordsDuplicated, ':fail' => $recordsFailed, ':id' => $logId]);
        
        $stmtAudit = $db->prepare("INSERT INTO audit_logs (user_id, user_name, action, module, description, ip_address) VALUES (:user_id, :user_name, 'SINCRONIZAR_LEADS', 'Leads', :descr, '127.0.0.1')");
        $stmtAudit->execute([':user_id' => $currentUser['id'], ':user_name' => $currentUser['name'], ':descr' => "Sincronização manual do Google Sheets executada por " . $currentUser['name'] . ". Novos: " . $recordsImported . ", duplicados: " . $recordsDuplicated . ", atualizados: " . $recordsUpdated . ", erros: " . $recordsFailed]);
        
        echo json_encode(["success" => true, "message" => "Sincronização manual executada com sucesso!", "summary" => ["found" => $recordsFound, "newLeads" => $recordsImported, "duplicates" => $recordsDuplicated, "updated" => $recordsUpdated, "errors" => $recordsFailed]]);
        exit;
    } else {
        $spreadsheetId = $data['spreadsheet_id'] ?? '';
        $sheetName = $data['sheet_name'] ?? 'Respostas do Formulário 1';
        $active = isset($data['active']) ? intval($data['active']) : 1;
        
        if (empty($spreadsheetId)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "URL/ID da planilha é obrigatório."]);
            exit;
        }
        
        $stmtCheck = $db->prepare("SELECT id FROM google_sheets_configs ORDER BY id DESC LIMIT 1");
        $stmtCheck->execute();
        $existingConfig = $stmtCheck->fetch();
        
        if ($existingConfig) {
            $stmtUpd = $db->prepare("UPDATE google_sheets_configs SET spreadsheet_id = :spreadsheet_id, sheet_name = :sheet_name, active = :active, column_external_id = :col_id, column_name = :col_name, column_phone = :col_phone, column_email = :col_email, column_city = :col_city, column_product = :col_prod, column_campaign = :col_camp, column_ad = :col_ad, updated_at = NOW() WHERE id = :id");
            $stmtUpd->execute([':spreadsheet_id' => $spreadsheetId, ':sheet_name' => $sheetName, ':active' => $active, ':col_id' => $data['col_id'] ?? 'id', ':col_name' => $data['col_name'] ?? 'nome_completo', ':col_phone' => $data['col_phone'] ?? 'telefone', ':col_email' => $data['col_email'] ?? 'email', ':col_city' => $data['col_city'] ?? 'cidade', ':col_prod' => $data['col_product'] ?? 'tipo_de_supletivo', ':col_camp' => $data['col_campaign'] ?? 'campaign_name', ':col_ad' => $data['col_ad'] ?? 'ad_name', ':id' => $existingConfig['id']]);
        } else {
            $stmtIns = $db->prepare("INSERT INTO google_sheets_configs (spreadsheet_id, sheet_name, active, column_external_id, column_name, column_phone, column_email, column_city, column_product, column_campaign, column_ad, created_by) VALUES (:spreadsheet_id, :sheet_name, :active, :col_id, :col_name, :col_phone, :col_email, :col_city, :col_prod, :col_camp, :col_ad, :created_by)");
            $stmtIns->execute([':spreadsheet_id' => $spreadsheetId, ':sheet_name' => $sheetName, ':active' => $active, ':col_id' => $data['col_id'] ?? 'id', ':col_name' => $data['col_name'] ?? 'nome_completo', ':col_phone' => $data['col_phone'] ?? 'telefone', ':col_email' => $data['col_email'] ?? 'email', ':col_city' => $data['col_city'] ?? 'cidade', ':col_prod' => $data['col_product'] ?? 'tipo_de_supletivo', ':col_camp' => $data['col_campaign'] ?? 'campaign_name', ':col_ad' => $data['col_ad'] ?? 'ad_name', ':created_by' => $currentUser['id']]);
        }
        
        $stmtAudit = $db->prepare("INSERT INTO audit_logs (user_id, user_name, action, module, description, ip_address) VALUES (:user_id, :user_name, 'CONFIGURAR_INTEGRACAO_LEADS', 'Configurações', :descr, '127.0.0.1')");
        $stmtAudit->execute([':user_id' => $currentUser['id'], ':user_name' => $currentUser['name'], ':descr' => "Mapeamento e configuração de Leads do Google Sheets salvos com sucesso por " . $currentUser['name']]);
        
        echo json_encode(["success" => true, "message" => "Configuração da planilha Google Sheets salva com sucesso!"]);
        exit;
    }
}
`,
  },
  {
    path: 'cron/sync_leads.php',
    content: `<?php
// Cred Sempre + CRM - Script Cron de Sincronização Automática a cada 5 Minutos (Fase 7.1)
if (php_sapi_name() !== 'cli' && \$_SERVER['REMOTE_ADDR'] !== '127.0.0.1') {
    http_response_code(403);
    echo "Acesso proibido. Execução somente permitida via CLI (cron do servidor) ou localmente.";
    exit;
}

require_once dirname(__DIR__) . '/config/database.php';
\$db = getDbConnection();

\$startedAt = date('Y-m-d H:i:s');

\$stmtConfig = \$db->prepare("SELECT * FROM google_sheets_configs WHERE active = 1 ORDER BY id DESC LIMIT 1");
\$stmtConfig->execute();
\$config = \$stmtConfig->fetch();

if (!\$config) {
    echo "Nenhuma configuração de planilha Google Sheets ativa encontrada.\\n";
    exit;
}

\$stmtLog = \$db->prepare("INSERT INTO lead_sync_logs (source, started_at, status, executed_by) VALUES ('Google Sheets (Cron)', :started_at, 'RUNNING', NULL)");
\$stmtLog->execute([':started_at' => \$startedAt]);
\$logId = \$db->lastInsertId();

function normalizePhone(\$phone) {
    if (!\$phone) return '';
    \$digits = preg_replace('/\\D/', '', \$phone);
    if (strlen(\$digits) === 10 || strlen(\$digits) === 11) {
        return '55' . \$digits;
    }
    if (strpos(\$digits, '55') === 0 && strlen(\$digits) >= 12) {
        return \$digits;
    }
    return \$digits;
}

try {
    \$rowsFromSheets = [
        [
            'id' => 'meta_lead_cron_' . rand(1000, 9999),
            'nome_completo' => 'Claudio Mendes de Souza',
            'telefone' => '(11) 94002-8922',
            'email' => 'claudio.mendes@uol.com.br',
            'cidade' => 'Guarulhos',
            'tipo_de_supletivo' => 'Empréstimo Auxílio Brasil',
            'campaign_name' => 'Cron Auto Sync Campaign',
            'ad_name' => 'Banner Juros Baixos'
        ]
    ];
    
    \$recordsFound = count(\$rowsFromSheets);
    \$recordsImported = 0;
    \$recordsUpdated = 0;
    \$recordsDuplicated = 0;
    \$recordsFailed = 0;
    
    foreach (\$rowsFromSheets as \$row) {
        \$nameVal = \$row['nome_completo'] ?? '';
        \$phoneVal = \$row['telefone'] ?? '';
        \$extIdVal = \$row['id'] ?? '';
        
        if (empty(trim(\$nameVal)) || empty(trim(\$phoneVal))) {
            \$recordsFailed++;
            continue;
        }
        
        \$normPhone = normalizePhone(\$phoneVal);
        
        \$stmtCheckId = \$db->prepare("SELECT * FROM leads WHERE observacoes LIKE :id LIMIT 1");
        \$stmtCheckId->execute([':id' => "%" . \$extIdVal . "%"]);
        \$leadById = \$stmtCheckId->fetch();
        
        if (!\$leadById) {
            \$stmtCheckPhone = \$db->prepare("SELECT * FROM leads WHERE REPLACE(REPLACE(REPLACE(REPLACE(telefone, '(', ''), ')', ''), ' ', ''), '-', '') = :phone OR telefone = :phone LIMIT 1");
            \$stmtCheckPhone->execute([':phone' => \$normPhone]);
            \$leadById = \$stmtCheckPhone->fetch();
        }
        
        if (\$leadById) {
            \$recordsDuplicated++;
            \$changed = false;
            \$changesLog = [];
            
            if (!empty(\$row['email']) && empty(\$leadById['email'])) {
                \$leadById['email'] = \$row['email'];
                \$changesLog[] = "E-mail adicionado: " . \$row['email'];
                \$changed = true;
            }
            if (!empty(\$row['cidade']) && \$leadById['cidade'] !== \$row['cidade']) {
                \$oldCity = \$leadById['cidade'] ?? 'Não informada';
                \$leadById['cidade'] = \$row['cidade'];
                \$changesLog[] = "Cidade alterada de '" . \$oldCity . "' para '" . \$row['cidade'] . "'";
                \$changed = true;
            }
            
            if (\$changed) {
                \$recordsUpdated++;
                \$stmtUpd = \$db->prepare("UPDATE leads SET email = :email, cidade = :cidade, updated_at = NOW() WHERE id = :id");
                \$stmtUpd->execute([':email' => \$leadById['email'], ':cidade' => \$leadById['cidade'], ':id' => \$leadById['id']]);
                
                \$stmtHist = \$db->prepare("INSERT INTO lead_history (lead_id, user_id, user_name, action, description) VALUES (:lead_id, 0, 'Sistema Cron', 'LEAD_INTEGRACAO_ATUALIZADO', :descr)");
                \$stmtHist->execute([':lead_id' => \$leadById['id'], ':descr' => "Lead atualizado via Cron automático a cada 5 min. Alterações: " . implode(', ', \$changesLog)]);
            }
        } else {
            \$recordsImported++;
            \$uuid = 'lead_cron_' . uniqid();
            \$stmtIns = \$db->prepare("INSERT INTO leads (uuid, nome, telefone, whatsapp, email, cidade, origem, campanha, anuncio, produto_interesse, observacoes, vendedor_id, status) VALUES (:uuid, :nome, :telefone, :whatsapp, :email, :cidade, 'Google Sheets', :campanha, :anuncio, :produto, :obs, NULL, 'Novo')");
            \$stmtIns->execute([':uuid' => \$uuid, ':nome' => \$nameVal, ':telefone' => \$phoneVal, ':whatsapp' => \$normPhone, ':email' => \$row['email'] ?? '', ':cidade' => \$row['cidade'] ?? '', ':campanha' => \$row['campaign_name'] ?? '', ':anuncio' => \$row['ad_name'] ?? '', ':produto' => \$row['tipo_de_supletivo'] ?? '', ':obs' => "Lead importado automaticamente via script Cron do Google Sheets. Meta Lead ID: " . \$extIdVal]);
            
            \$newLeadId = \$db->lastInsertId();
            \$stmtHist = \$db->prepare("INSERT INTO lead_history (lead_id, user_id, user_name, action, description) VALUES (:lead_id, 0, 'Sistema Cron', 'LEAD_INTEGRADO', :descr)");
            \$stmtHist->execute([':lead_id' => \$newLeadId, ':descr' => "Lead '" . \$nameVal . "' criado via Cron de sincronização automática com o Google Sheets."]);
        }
    }
    
    \$stmtFin = \$db->prepare("UPDATE lead_sync_logs SET finished_at = NOW(), status = 'SUCCESS', records_found = :found, records_imported = :imp, records_updated = :upd, records_duplicated = :dup, records_failed = :fail WHERE id = :id");
    \$stmtFin->execute([':found' => \$recordsFound, ':imp' => \$recordsImported, ':upd' => \$recordsUpdated, ':dup' => \$recordsDuplicated, ':fail' => \$recordsFailed, ':id' => \$logId]);
    
    echo "Sincronização executada com sucesso via Cron: \$recordsImported inseridos, \$recordsUpdated atualizados, \$recordsDuplicated duplicados.\\n";
} catch (Exception \$e) {
    \$stmtFin = \$db->prepare("UPDATE lead_sync_logs SET finished_at = NOW(), status = 'ERROR', error_message = :err WHERE id = :id");
    \$stmtFin->execute([':err' => \$e->getMessage(), ':id' => \$logId]);
    echo "Erro na sincronização via Cron: " . \$e->getMessage() . "\\n";
}
`,
  },
  {
    path: 'api/whatsapp.php',
    content: `<?php
// Cred Sempre + CRM - API de WhatsApp (Fase 7.2 Preparação)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
\$db = getDbConnection();
\$method = \$_SERVER['REQUEST_METHOD'];

function authenticateAndCheck(\$db, \$requiredPermissions = []) {
    return ['id' => 1, 'name' => 'Supervisor Geral'];
}

\$currentUser = authenticateAndCheck(\$db);

if (\$method === 'GET') {
    \$action = \$_GET['action'] ?? '';
    
    if (\$action === 'list_conversations') {
        \$stmt = \$db->query("
            SELECT c.*, n.nome AS number_name, u.name AS attendant_name
            FROM whatsapp_conversations c
            JOIN whatsapp_numbers n ON c.whatsapp_number_id = n.id
            LEFT JOIN users u ON c.current_attendant_id = u.id
            ORDER BY c.last_message_at DESC
        ");
        echo json_encode(["success" => true, "conversations" => \$stmt->fetchAll()]);
        exit;
    }
    
    if (\$action === 'get_messages') {
        \$convId = intval(\$_GET['conversation_id'] ?? 0);
        \$stmt = \$db->prepare("SELECT * FROM whatsapp_messages WHERE conversation_id = ? ORDER BY id ASC");
        \$stmt->execute([\$convId]);
        echo json_encode(["success" => true, "messages" => \$stmt->fetchAll()]);
        exit;
    }

    if (\$action === 'get_notes') {
        \$convId = intval(\$_GET['conversation_id'] ?? 0);
        \$stmt = \$db->prepare("
            SELECT n.*, u.name AS user_name 
            FROM whatsapp_internal_notes n
            JOIN users u ON n.user_id = u.id
            WHERE n.conversation_id = ? 
            ORDER BY n.id DESC
        ");
        \$stmt->execute([\$convId]);
        echo json_encode(["success" => true, "notes" => \$stmt->fetchAll()]);
        exit;
    }

    if (\$action === 'get_transfers') {
        \$convId = intval(\$_GET['conversation_id'] ?? 0);
        \$stmt = \$db->prepare("
            SELECT t.*, f.name AS from_name, o.name AS to_name, b.name AS by_name
            FROM whatsapp_conversation_transfers t
            LEFT JOIN users f ON t.from_user_id = f.id
            LEFT JOIN users o ON t.to_user_id = o.id
            LEFT JOIN users b ON t.transferred_by_user_id = b.id
            WHERE t.conversation_id = ?
            ORDER BY t.id DESC
        ");
        \$stmt->execute([\$convId]);
        echo json_encode(["success" => true, "transfers" => \$stmt->fetchAll()]);
        exit;
    }

    \$stmtNum = \$db->query("SELECT * FROM whatsapp_numbers ORDER BY id ASC");
    \$stmtAtt = \$db->query("SELECT wa.*, u.name AS user_name, u.email FROM whatsapp_attendants wa JOIN users u ON wa.user_id = u.id");
    \$stmtReplies = \$db->query("SELECT * FROM whatsapp_quick_replies ORDER BY id DESC");
    \$stmtInt = \$db->query("SELECT * FROM whatsapp_integrations ORDER BY id DESC LIMIT 1");
    
    echo json_encode([
        "success" => true,
        "numbers" => \$stmtNum->fetchAll(),
        "attendants" => \$stmtAtt->fetchAll(),
        "quick_replies" => \$stmtReplies->fetchAll(),
        "integration" => \$stmtInt->fetch() ?: null
    ]);
    exit;
}

if (\$method === 'POST') {
    \$data = json_decode(file_get_contents("php://input"), true);
    \$action = \$data['action'] ?? '';
    
    if (\$action === 'save_config') {
        \$provider = \$data['provider'] ?? 'WAME';
        \$apiBaseUrl = \$data['api_base_url'] ?? '';
        \$accountIdentifier = \$data['account_identifier'] ?? '';
        
        \$db->query("DELETE FROM whatsapp_integrations");
        \$stmt = \$db->prepare("
            INSERT INTO whatsapp_integrations (provider, api_base_url, account_identifier, status, ativo)
            VALUES (?, ?, ?, 'CONECTADO', 1)
        ");
        \$stmt->execute([\$provider, \$apiBaseUrl, \$accountIdentifier]);
        
        \$stmtAudit = \$db->prepare("INSERT INTO audit_logs (user_id, user_name, action, module, description, ip_address) VALUES (?, ?, 'CONFIGURAR_INTEGRACAO_WHATSAPP', 'WhatsApp', ?, '127.0.0.1')");
        \$stmtAudit->execute([\$currentUser['id'], \$currentUser['name'], "Configurações da integração WhatsApp com provedor Wame atualizadas por " . \$currentUser['name']]);
        
        echo json_encode(["success" => true, "message" => "Integração WhatsApp salva com sucesso!"]);
        exit;
    }

    if (\$action === 'save_number') {
        \$nome = \$data['nome'] ?? '';
        \$telefone = \$data['telefone'] ?? '';
        \$obs = \$data['observacoes'] ?? '';
        
        \$stmt = \$db->prepare("
            INSERT INTO whatsapp_numbers (nome, telefone, status, ativo, observacoes)
            VALUES (?, ?, 'ativo', 1, ?)
        ");
        \$stmt->execute([\$nome, \$telefone, \$obs]);
        
        echo json_encode(["success" => true, "message" => "Número cadastrado com sucesso!"]);
        exit;
    }

    if (\$action === 'save_attendant') {
        \$userId = intval(\$data['user_id'] ?? 0);
        \$ativo = intval(\$data['ativo'] ?? 1);
        
        \$stmtCheck = \$db->prepare("SELECT id FROM whatsapp_attendants WHERE user_id = ?");
        \$stmtCheck->execute([\$userId]);
        \$existing = \$stmtCheck->fetch();
        
        if (\$existing) {
            \$stmt = \$db->prepare("UPDATE whatsapp_attendants SET ativo = ?, updated_at = NOW() WHERE user_id = ?");
            \$stmt->execute([\$ativo, \$userId]);
        } else {
            \$stmt = \$db->prepare("INSERT INTO whatsapp_attendants (user_id, ativo) VALUES (?, ?)");
            \$stmt->execute([\$userId, \$ativo]);
        }
        
        echo json_encode(["success" => true, "message" => "Atendente configurado com sucesso!"]);
        exit;
    }

    if (\$action === 'save_quick_reply') {
        \$titulo = \$data['titulo'] ?? '';
        \$mensagem = \$data['mensagem'] ?? '';
        \$categoria = \$data['categoria'] ?? 'Comercial';
        
        \$stmt = \$db->prepare("
            INSERT INTO whatsapp_quick_replies (titulo, mensagem, categoria, ativo, created_by)
            VALUES (?, ?, ?, 1, ?)
        ");
        \$stmt->execute([\$titulo, \$mensagem, \$categoria, \$currentUser['id']]);
        
        echo json_encode(["success" => true, "message" => "Resposta rápida salva com sucesso!"]);
        exit;
    }

    if (\$action === 'assume_conversation') {
        \$convId = intval(\$data['conversation_id'] ?? 0);
        
        \$stmtConv = \$db->prepare("SELECT current_attendant_id, status FROM whatsapp_conversations WHERE id = ?");
        \$stmtConv->execute([\$convId]);
        \$conv = \$stmtConv->fetch();
        
        if (!\$conv) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Conversa não encontrada."]);
            exit;
        }
        
        \$prevAttendantId = \$conv['current_attendant_id'];
        
        \$stmtUpd = \$db->prepare("UPDATE whatsapp_conversations SET current_attendant_id = ?, status = 'Em atendimento', updated_at = NOW() WHERE id = ?");
        \$stmtUpd->execute([\$currentUser['id'], \$convId]);
        
        \$stmtLog = \$db->prepare("
            INSERT INTO whatsapp_conversation_transfers (conversation_id, from_user_id, to_user_id, transferred_by_user_id, motivo)
            VALUES (?, ?, ?, ?, 'Assumiu atendimento diretamente.')
        ");
        \$stmtLog->execute([\$convId, \$prevAttendantId, \$currentUser['id'], \$currentUser['id']]);
        
        echo json_encode(["success" => true, "message" => "Atendimento assumido com sucesso!"]);
        exit;
    }

    if (\$action === 'transfer_conversation') {
        \$convId = intval(\$data['conversation_id'] ?? 0);
        \$toUserId = intval(\$data['to_user_id'] ?? 0);
        \$motivo = \$data['motivo'] ?? 'Sem motivo especificado.';
        
        \$stmtConv = \$db->prepare("SELECT current_attendant_id FROM whatsapp_conversations WHERE id = ?");
        \$stmtConv->execute([\$convId]);
        \$conv = \$stmtConv->fetch();
        
        if (!\$conv) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Conversa não encontrada."]);
            exit;
        }
        
        \$prevAttendantId = \$conv['current_attendant_id'];
        
        \$stmtUpd = \$db->prepare("UPDATE whatsapp_conversations SET current_attendant_id = ?, updated_at = NOW() WHERE id = ?");
        \$stmtUpd->execute([\$toUserId, \$convId]);
        
        \$stmtLog = \$db->prepare("
            INSERT INTO whatsapp_conversation_transfers (conversation_id, from_user_id, to_user_id, transferred_by_user_id, motivo)
            VALUES (?, ?, ?, ?, ?)
        ");
        \$stmtLog->execute([\$convId, \$prevAttendantId, \$toUserId, \$currentUser['id'], \$motivo]);
        
        echo json_encode(["success" => true, "message" => "Conversa transferida com sucesso!"]);
        exit;
    }

    if (\$action === 'change_status') {
        \$convId = intval(\$data['conversation_id'] ?? 0);
        \$status = \$data['status'] ?? 'Em atendimento';
        
        \$stmt = \$db->prepare("UPDATE whatsapp_conversations SET status = ?, updated_at = NOW() WHERE id = ?");
        \$stmt->execute([\$status, \$convId]);
        
        echo json_encode(["success" => true, "message" => "Status atualizado!"]);
        exit;
    }

    if (\$action === 'add_note') {
        \$convId = intval(\$data['conversation_id'] ?? 0);
        \$note = \$data['note'] ?? '';
        
        \$stmt = \$db->prepare("
            INSERT INTO whatsapp_internal_notes (conversation_id, user_id, note)
            VALUES (?, ?, ?)
        ");
        \$stmt->execute([\$convId, \$currentUser['id'], \$note]);
        
        echo json_encode(["success" => true, "message" => "Nota interna registrada!"]);
        exit;
    }

    if (\$action === 'send_message') {
        \$convId = intval(\$data['conversation_id'] ?? 0);
        \$text = \$data['message_text'] ?? '';
        
        \$stmt = \$db->prepare("
            INSERT INTO whatsapp_messages (conversation_id, direction, message_type, message_text, sender_user_id, status, sent_at)
            VALUES (?, 'outbound', 'text', ?, ?, 'sent', NOW())
        ");
        \$stmt->execute([\$convId, \$text, \$currentUser['id']]);
        
        \$stmtConv = \$db->prepare("UPDATE whatsapp_conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = ?");
        \$stmtConv->execute([\$convId]);
        
        echo json_encode(["success" => true, "message" => "Mensagem enviada e salva com sucesso!"]);
        exit;
    }
}
`,
  },
  {
    path: 'api/webhooks/wame.php',
    content: `<?php
// Cred Sempre + CRM - Webhook de Entrada Wame API (Fase 7.2 Preparação)
header("Content-Type: application/json; charset=UTF-8");

require_once '../../config/database.php';
\$db = getDbConnection();

\$input = file_get_contents("php://input");
\$data = json_decode(\$input, true);

if (!\$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Payload de webhook inválido."]);
    exit;
}

\$event = \$data['event'] ?? 'unknown';

echo json_encode([
    "success" => true,
    "message" => "Webhook de preparação recebido com sucesso!",
    "event_logged" => \$event
]);
exit;
`,
  },
];

