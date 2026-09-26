-- Cred Sempre + CRM - WhatsApp Multiatendimento Database Schema (Fase 7.2)
-- Tabelas necessárias para preparar a arquitetura do WhatsApp Multiatendimento com WAME API

-- 1. Canais de Entrada de WhatsApp
CREATE TABLE IF NOT EXISTS `whatsapp_numbers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nome` VARCHAR(255) NOT NULL,
    `telefone` VARCHAR(50) NOT NULL,
    `identificador_externo` VARCHAR(255) NULL,
    `provedor` VARCHAR(50) DEFAULT 'WAME',
    `status` VARCHAR(50) DEFAULT 'aguardando_configuracao',
    `ativo` TINYINT(1) DEFAULT 1,
    `observacoes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Configurações Globais do Provedor de Integração
CREATE TABLE IF NOT EXISTS `whatsapp_integrations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `provider` VARCHAR(50) DEFAULT 'WAME',
    `api_base_url` VARCHAR(255) NOT NULL,
    `account_identifier` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'ATIVO',
    `ativo` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Atendentes Habilitados para WhatsApp
CREATE TABLE IF NOT EXISTS `whatsapp_attendants` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `ativo` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Conversas / Atendimentos Ativos
CREATE TABLE IF NOT EXISTS `whatsapp_conversations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `whatsapp_number_id` INT NOT NULL,
    `current_attendant_id` INT NULL,
    `status` VARCHAR(50) DEFAULT 'Aguardando atendimento',
    `nome_contato` VARCHAR(255) NOT NULL,
    `telefone` VARCHAR(50) NOT NULL,
    `last_message_text` TEXT NULL,
    `last_message_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_phone` (`telefone`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Histórico de Mensagens de WhatsApp (Inbound / Outbound)
CREATE TABLE IF NOT EXISTS `whatsapp_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `conversation_id` INT NOT NULL,
    `external_message_id` VARCHAR(255) NULL,
    `direction` VARCHAR(20) NOT NULL, -- 'inbound' ou 'outbound'
    `message_type` VARCHAR(20) DEFAULT 'text',
    `message_text` TEXT NOT NULL,
    `sender_user_id` INT NULL, -- ID do Atendente se for outbound
    `status` VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'read'
    `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY `idx_conv_id` (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Histórico Completo de Transferências de Conversas
CREATE TABLE IF NOT EXISTS `whatsapp_conversation_transfers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `conversation_id` INT NOT NULL,
    `from_user_id` INT NULL,
    `to_user_id` INT NOT NULL,
    `transferred_by_user_id` INT NOT NULL,
    `motivo` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY `idx_transfer_conv` (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Histórico de Notas Internas (Supervisão / Anotações)
CREATE TABLE IF NOT EXISTS `whatsapp_internal_notes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `conversation_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `note` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_notes_conv` (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Cadastro de Respostas Rápidas (Mensagens Pré-formatadas)
CREATE TABLE IF NOT EXISTS `whatsapp_quick_replies` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `titulo` VARCHAR(255) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `categoria` VARCHAR(100) DEFAULT 'Comercial',
    `ativo` TINYINT(1) DEFAULT 1,
    `created_by` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
