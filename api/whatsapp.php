<?php
// Cred Sempre + CRM - API de WhatsApp Multiatendimento (Fase 7.2)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Ensure all required database tables exist (auto-migration for high-fidelity developer/production environments)
function ensureDatabaseTablesExist($db) {
    try {
        // 1. whatsapp_numbers
        $db->exec("CREATE TABLE IF NOT EXISTS `whatsapp_numbers` (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // 2. whatsapp_integrations
        $db->exec("CREATE TABLE IF NOT EXISTS `whatsapp_integrations` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `provider` VARCHAR(50) DEFAULT 'WAME',
            `api_base_url` VARCHAR(255) NOT NULL,
            `account_identifier` VARCHAR(255) NOT NULL,
            `status` VARCHAR(50) DEFAULT 'ATIVO',
            `ativo` TINYINT(1) DEFAULT 1,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // 3. whatsapp_attendants
        $db->exec("CREATE TABLE IF NOT EXISTS `whatsapp_attendants` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` VARCHAR(50) NOT NULL,
            `ativo` TINYINT(1) DEFAULT 1,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY `unique_user` (`user_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // 4. whatsapp_conversations
        $db->exec("CREATE TABLE IF NOT EXISTS `whatsapp_conversations` (
            `id` VARCHAR(50) PRIMARY KEY,
            `whatsapp_number_id` VARCHAR(50) NOT NULL,
            `current_attendant_id` VARCHAR(50) NULL,
            `status` VARCHAR(50) DEFAULT 'Aguardando atendimento',
            `nome_contato` VARCHAR(255) NOT NULL,
            `telefone` VARCHAR(50) NOT NULL,
            `last_message_text` TEXT NULL,
            `last_message_at` TIMESTAMP NULL,
            `locked_by` VARCHAR(50) NULL,
            `locked_at` TIMESTAMP NULL,
            `next_action` VARCHAR(255) NULL,
            `next_action_date` DATETIME NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // Ensure columns exist (for migration)
        $db->exec("ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `next_action` VARCHAR(255) NULL");
        $db->exec("ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `next_action_date` DATETIME NULL");
        $db->exec("ALTER TABLE `leads` ADD COLUMN IF NOT EXISTS `next_action_responsible_id` VARCHAR(50) NULL");
        $db->exec("ALTER TABLE `opportunities` ADD COLUMN IF NOT EXISTS `next_action` VARCHAR(255) NULL");
        $db->exec("ALTER TABLE `opportunities` ADD COLUMN IF NOT EXISTS `next_action_date` DATETIME NULL");
        $db->exec("ALTER TABLE `opportunities` ADD COLUMN IF NOT EXISTS `next_action_responsible_id` VARCHAR(50) NULL");

        // 5. whatsapp_messages
        $db->exec("CREATE TABLE IF NOT EXISTS `whatsapp_messages` (
            `id` VARCHAR(50) PRIMARY KEY,
            `conversation_id` VARCHAR(50) NOT NULL,
            `external_message_id` VARCHAR(255) NULL,
            `direction` VARCHAR(20) NOT NULL,
            `message_type` VARCHAR(20) DEFAULT 'text',
            `message_text` TEXT NOT NULL,
            `sender_user_id` VARCHAR(50) NULL,
            `status` VARCHAR(20) DEFAULT 'sent',
            `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // 6. whatsapp_conversation_transfers
        $db->exec("CREATE TABLE IF NOT EXISTS `whatsapp_conversation_transfers` (
            `id` VARCHAR(50) PRIMARY KEY,
            `conversation_id` VARCHAR(50) NOT NULL,
            `from_user_id` VARCHAR(50) NULL,
            `to_user_id` VARCHAR(50) NOT NULL,
            `transferred_by_user_id` VARCHAR(50) NOT NULL,
            `motivo` TEXT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // 7. whatsapp_internal_notes
        $db->exec("CREATE TABLE IF NOT EXISTS `whatsapp_internal_notes` (
            `id` VARCHAR(50) PRIMARY KEY,
            `conversation_id` VARCHAR(50) NOT NULL,
            `user_id` VARCHAR(50) NOT NULL,
            `user_name` VARCHAR(255) NOT NULL,
            `note` TEXT NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // 8. whatsapp_quick_replies
        $db->exec("CREATE TABLE IF NOT EXISTS `whatsapp_quick_replies` (
            `id` VARCHAR(50) PRIMARY KEY,
            `titulo` VARCHAR(255) NOT NULL,
            `mensagem` TEXT NOT NULL,
            `categoria` VARCHAR(100) DEFAULT 'Comercial',
            `ativo` TINYINT(1) DEFAULT 1,
            `created_by` VARCHAR(50) NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    } catch (Exception $e) {
        // Silently log or ignore error if tables are locked or already created
    }
}

ensureDatabaseTablesExist($db);

// Helper to authenticate and verify permissions (RBAC)
function authenticateAndCheckRole($db) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader) && isset($_COOKIE['PHPSESSID'])) {
        session_start();
        if (isset($_SESSION['user_id'])) {
            return [
                'id' => $_SESSION['user_id'],
                'name' => $_SESSION['user_name'] ?? 'Administrador',
                'role' => $_SESSION['role'] ?? 'Administrador'
            ];
        }
    }
    
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        // Parse token and identify user (in this system, we fetch a default active user or match the token)
        $userId = str_replace('mock_token_for_', '', $token);
        if (!empty($userId)) {
            $stmt = $db->prepare("SELECT id, name, role FROM users WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch();
            if ($user) {
                return ['id' => $user['id'], 'name' => $user['name'], 'role' => $user['role']];
            }
        }
    }
    
    // Default fallback admin user for simulation or when headers aren't complete
    return ['id' => 'usr_admin_1', 'name' => 'Administrador do CRM', 'role' => 'Administrador'];
}

$currentUser = authenticateAndCheckRole($db);

// --------------------------------------------------------------------------------
// GET ENDPOINTS
// --------------------------------------------------------------------------------
if ($method === 'GET') {
    $action = $_GET['action'] ?? 'get_state';

    if ($action === 'get_state') {
        // Fetch all numbers
        $stmtNum = $db->prepare("SELECT * FROM whatsapp_numbers ORDER BY id ASC");
        $stmtNum->execute();
        $numbers = $stmtNum->fetchAll();

        // Fetch integrations
        $stmtInt = $db->prepare("SELECT * FROM whatsapp_integrations ORDER BY id DESC LIMIT 1");
        $stmtInt->execute();
        $integrations = $stmtInt->fetchAll();

        // Fetch attendants
        $stmtAtt = $db->prepare("SELECT * FROM whatsapp_attendants ORDER BY id ASC");
        $stmtAtt->execute();
        $attendants = $stmtAtt->fetchAll();

        // Fetch conversations
        $stmtConv = $db->prepare("SELECT * FROM whatsapp_conversations ORDER BY last_message_at DESC, created_at DESC");
        $stmtConv->execute();
        $conversations = $stmtConv->fetchAll();

        // Fetch quick replies
        $stmtQr = $db->prepare("SELECT * FROM whatsapp_quick_replies ORDER BY titulo ASC");
        $stmtQr->execute();
        $quickReplies = $stmtQr->fetchAll();

        echo json_encode([
            "success" => true,
            "numbers" => $numbers,
            "integrations" => $integrations,
            "attendants" => $attendants,
            "conversations" => $conversations,
            "quickReplies" => $quickReplies
        ]);
        exit;
    }

    if ($action === 'get_messages') {
        $conversationId = $_GET['conversation_id'] ?? '';
        if (empty($conversationId)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "conversation_id é obrigatório."]);
            exit;
        }

        $stmt = $db->prepare("SELECT * FROM whatsapp_messages WHERE conversation_id = :cid ORDER BY sent_at ASC");
        $stmt->execute([':cid' => $conversationId]);
        $messages = $stmt->fetchAll();

        echo json_encode(["success" => true, "messages" => $messages]);
        exit;
    }

    if ($action === 'get_transfers') {
        $conversationId = $_GET['conversation_id'] ?? '';
        if (empty($conversationId)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "conversation_id é obrigatório."]);
            exit;
        }

        $stmt = $db->prepare("SELECT * FROM whatsapp_conversation_transfers WHERE conversation_id = :cid ORDER BY created_at ASC");
        $stmt->execute([':cid' => $conversationId]);
        $transfers = $stmt->fetchAll();

        echo json_encode(["success" => true, "transfers" => $transfers]);
        exit;
    }

    if ($action === 'get_notes') {
        $conversationId = $_GET['conversation_id'] ?? '';
        if (empty($conversationId)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "conversation_id é obrigatório."]);
            exit;
        }

        $stmt = $db->prepare("SELECT * FROM whatsapp_internal_notes WHERE conversation_id = :cid ORDER BY created_at DESC");
        $stmt->execute([':cid' => $conversationId]);
        $notes = $stmt->fetchAll();

        echo json_encode(["success" => true, "notes" => $notes]);
        exit;
    }

    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Ação GET inválida."]);
    exit;
}

// --------------------------------------------------------------------------------
// POST/PUT ENDPOINTS
// --------------------------------------------------------------------------------
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    if (empty($action)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Ação (action) no payload JSON é obrigatória."]);
        exit;
    }

    // 1. SAVE INTEGRATION CONFIG
    if ($action === 'save_config') {
        $provider = $data['provider'] ?? 'WAME';
        $apiBaseUrl = $data['api_base_url'] ?? '';
        $accountIdentifier = $data['account_identifier'] ?? '';

        if (empty($apiBaseUrl) || empty($accountIdentifier)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "api_base_url e account_identifier são obrigatórios."]);
            exit;
        }

        // Clean out previous config
        $db->exec("DELETE FROM whatsapp_integrations");

        $stmt = $db->prepare("
            INSERT INTO whatsapp_integrations (provider, api_base_url, account_identifier, status, ativo)
            VALUES (:provider, :api_base_url, :account_identifier, 'CONECTADO', 1)
        ");
        $stmt->execute([
            ':provider' => $provider,
            ':api_base_url' => $apiBaseUrl,
            ':account_identifier' => $accountIdentifier
        ]);

        // Audit Log
        $stmtAudit = $db->prepare("
            INSERT INTO audit_logs (user_id, user_name, action, module, description, ip_address)
            VALUES (:user_id, :user_name, 'CONFIGURAR_INTEGRACAO_WHATSAPP', 'WhatsApp', :descr, '127.0.0.1')
        ");
        $stmtAudit->execute([
            ':user_id' => $currentUser['id'],
            ':user_name' => $currentUser['name'],
            ':descr' => "Integração WhatsApp configurada: Provedor $provider, ID de Conta $accountIdentifier."
        ]);

        echo json_encode(["success" => true, "message" => "Configurações salvas no MySQL com sucesso!"]);
        exit;
    }

    // 2. SAVE NUMBER CONFIG
    if ($action === 'save_number') {
        $nome = $data['nome'] ?? '';
        $telefone = $data['telefone'] ?? '';
        $provedor = $data['provedor'] ?? 'WAME';
        $status = $data['status'] ?? 'ativo';
        $ativo = isset($data['ativo']) ? intval($data['ativo']) : 1;
        $observacoes = $data['observacoes'] ?? '';

        if (empty($nome) || empty($telefone)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Nome e Telefone são obrigatórios."]);
            exit;
        }

        $stmt = $db->prepare("
            INSERT INTO whatsapp_numbers (nome, telefone, identificador_externo, provedor, status, ativo, observacoes)
            VALUES (:nome, :telefone, :ext_id, :provedor, :status, :ativo, :obs)
        ");
        $stmt->execute([
            ':nome' => $nome,
            ':telefone' => $telefone,
            ':ext_id' => 'ext_' . uniqid(),
            ':provedor' => $provedor,
            ':status' => $status,
            ':ativo' => $ativo,
            ':obs' => $observacoes
        ]);

        // Audit Log
        $stmtAudit = $db->prepare("
            INSERT INTO audit_logs (user_id, user_name, action, module, description, ip_address)
            VALUES (:user_id, :user_name, 'CRIAR_NUMERO_WHATSAPP', 'WhatsApp', :descr, '127.0.0.1')
        ");
        $stmtAudit->execute([
            ':user_id' => $currentUser['id'],
            ':user_name' => $currentUser['name'],
            ':descr' => "Novo canal de WhatsApp cadastrado: $nome ($telefone)."
        ]);

        echo json_encode(["success" => true, "message" => "Canal de WhatsApp cadastrado com sucesso!"]);
        exit;
    }

    // 3. SAVE ATTENDANT CONFIG
    if ($action === 'save_attendant') {
        $userId = $data['user_id'] ?? '';
        $ativo = isset($data['ativo']) ? intval($data['ativo']) : 1;

        if (empty($userId)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "user_id é obrigatório."]);
            exit;
        }

        $stmt = $db->prepare("
            INSERT INTO whatsapp_attendants (user_id, ativo)
            VALUES (:user_id, :ativo)
            ON DUPLICATE KEY UPDATE ativo = :ativo_upd, updated_at = NOW()
        ");
        $stmt->execute([
            ':user_id' => $userId,
            ':ativo' => $ativo,
            ':ativo_upd' => $ativo
        ]);

        // Audit Log
        $stmtAudit = $db->prepare("
            INSERT INTO audit_logs (user_id, user_name, action, module, description, ip_address)
            VALUES (:user_id, :user_name, 'GERENCIAR_ATENDENTES_WHATSAPP', 'WhatsApp', :descr, '127.0.0.1')
        ");
        $stmtAudit->execute([
            ':user_id' => $currentUser['id'],
            ':user_name' => $currentUser['name'],
            ':descr' => "Permissão de atendimento WhatsApp atualizada para o usuário ID: $userId."
        ]);

        echo json_encode(["success" => true, "message" => "Atendente configurado com sucesso!"]);
        exit;
    }

    // 4. SAVE QUICK REPLY
    if ($action === 'save_quick_reply') {
        $titulo = $data['titulo'] ?? '';
        $mensagem = $data['mensagem'] ?? '';
        $categoria = $data['categoria'] ?? 'Comercial';
        $ativo = isset($data['ativo']) ? intval($data['ativo']) : 1;

        if (empty($titulo) || empty($mensagem)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Título e Mensagem são obrigatórios."]);
            exit;
        }

        $qrId = 'qr_' . uniqid();
        $stmt = $db->prepare("
            INSERT INTO whatsapp_quick_replies (id, titulo, mensagem, categoria, ativo, created_by)
            VALUES (:id, :titulo, :mensagem, :categoria, :ativo, :created_by)
        ");
        $stmt->execute([
            ':id' => $qrId,
            ':titulo' => $titulo,
            ':mensagem' => $mensagem,
            ':categoria' => $categoria,
            ':ativo' => $ativo,
            ':created_by' => $currentUser['id']
        ]);

        // Audit Log
        $stmtAudit = $db->prepare("
            INSERT INTO audit_logs (user_id, user_name, action, module, description, ip_address)
            VALUES (:user_id, :user_name, 'GERENCIAR_RESPOSTAS_RAPIDAS', 'WhatsApp', :descr, '127.0.0.1')
        ");
        $stmtAudit->execute([
            ':user_id' => $currentUser['id'],
            ':user_name' => $currentUser['name'],
            ':descr' => "Nova resposta rápida criada: \"$titulo\"."
        ]);

        echo json_encode(["success" => true, "message" => "Resposta rápida cadastrada com sucesso!"]);
        exit;
    }

    // 5. ASSUME CONVERSATION
    if ($action === 'assume_conversation') {
        $conversationId = $data['conversation_id'] ?? '';

        if (empty($conversationId)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "conversation_id é obrigatório."]);
            exit;
        }

        // Check if locked by someone else
        $stmtCheck = $db->prepare("SELECT locked_by, locked_at FROM whatsapp_conversations WHERE id = :id LIMIT 1");
        $stmtCheck->execute([':id' => $conversationId]);
        $conv = $stmtCheck->fetch();

        if ($conv && $conv['locked_by'] && $conv['locked_by'] !== $currentUser['id'] && strtotime($conv['locked_at']) > strtotime('-5 minutes')) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Conversa está sendo atendida por outro usuário."]);
            exit;
        }

        // Update conversation
        $stmtUpd = $db->prepare("
            UPDATE whatsapp_conversations 
            SET current_attendant_id = :uid, status = 'Em atendimento', locked_by = :uid, locked_at = NOW(), updated_at = NOW()
            WHERE id = :id
        ");
        $stmtUpd->execute([
            ':uid' => $currentUser['id'],
            ':id' => $conversationId
        ]);

        echo json_encode(["success" => true, "message" => "Atendimento assumido com sucesso!"]);
        exit;
    }

    // 9. SEND MESSAGE
    if ($action === 'send_message') {
        $conversationId = $data['conversation_id'] ?? '';
        $messageText = $data['message_text'] ?? '';

        if (empty($conversationId) || empty($messageText)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "conversation_id e message_text são obrigatórios."]);
            exit;
        }

        // Lock check
        $stmtLock = $db->prepare("SELECT locked_by FROM whatsapp_conversations WHERE id = :id LIMIT 1");
        $stmtLock->execute([':id' => $conversationId]);
        $lock = $stmtLock->fetch();

        if ($lock && $lock['locked_by'] && $lock['locked_by'] !== $currentUser['id']) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Você não tem permissão para responder, conversa bloqueada por outro atendente."]);
            exit;
        }

        // Fetch conversation details to get the number and modalidade
        $stmtConv = $db->prepare("SELECT c.whatsapp_number_id, n.telefone, n.provedor FROM whatsapp_conversations c JOIN whatsapp_numbers n ON c.whatsapp_number_id = n.id WHERE c.id = :cid LIMIT 1");
        $stmtConv->execute([':cid' => $conversationId]);
        $conv = $stmtConv->fetch();

        // Fetch API config
        $stmtInt = $db->prepare("SELECT api_base_url, account_identifier FROM whatsapp_integrations LIMIT 1");
        $stmtInt->execute();
        $config = $stmtInt->fetch();

        if (!$conv || !$config) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Erro ao carregar configurações da integração ou conversa."]);
            exit;
        }

        require_once '../lib/WameClient.php';
        $wame = new WameClient($config['api_base_url'], $config['account_identifier']);
        $response = $wame->sendMessage($conv['telefone'], $messageText);

        if (!$response || !isset($response['status']) || $response['status'] !== 'success') {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Erro na API da WAME: " . ($response['error'] ?? 'Erro desconhecido')]);
            exit;
        }

        $msgId = 'msg_out_' . uniqid();
        $extMsgId = $response['id'] ?? 'msg_ext_' . uniqid();

        // 1. Save Outbound Message
        $stmtMsg = $db->prepare("
            INSERT INTO whatsapp_messages (id, conversation_id, external_message_id, direction, message_type, message_text, sender_user_id, status)
            VALUES (:id, :conversation_id, :ext_id, 'outbound', 'text', :message_text, :sender, 'sent')
        ");
        $stmtMsg->execute([
            ':id' => $msgId,
            ':conversation_id' => $conversationId,
            ':ext_id' => $extMsgId,
            ':message_text' => $messageText,
            ':sender' => $currentUser['id']
        ]);

        // 2. Update Conversation Metadata
        $stmtUpdConv = $db->prepare("
            UPDATE whatsapp_conversations 
            SET last_message_text = :text, last_message_at = NOW(), updated_at = NOW(), locked_at = NOW()
            WHERE id = :id
        ");
        $stmtUpdConv->execute([
            ':text' => $messageText,
            ':id' => $conversationId
        ]);

        echo json_encode(["success" => true, "message" => "Mensagem enviada com sucesso!", "external_id" => $extMsgId]);
        exit;
    }

    // 10. SEND MEDIA
    if ($action === 'send_media') {
        $conversationId = $data['conversation_id'] ?? '';
        $url = $data['url'] ?? '';
        $type = $data['type'] ?? 'image'; 
        $caption = $data['caption'] ?? '';
        $mimetype = $data['mimetype'] ?? '';
        $fileName = $data['fileName'] ?? '';
        $provider = $data['provider'] ?? 'whatsapp';

        if (empty($conversationId) || empty($url)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "conversation_id e url são obrigatórios."]);
            exit;
        }

        $stmtConv = $db->prepare("SELECT c.whatsapp_number_id, n.telefone FROM whatsapp_conversations c JOIN whatsapp_numbers n ON c.whatsapp_number_id = n.id WHERE c.id = :cid LIMIT 1");
        $stmtConv->execute([':cid' => $conversationId]);
        $conv = $stmtConv->fetch();

        $stmtInt = $db->prepare("SELECT api_base_url, account_identifier FROM whatsapp_integrations LIMIT 1");
        $stmtInt->execute();
        $config = $stmtInt->fetch();

        require_once '../lib/WameClient.php';
        $wame = new WameClient($config['api_base_url'], $config['account_identifier']);
        
        $response = null;
        switch($type) {
            case 'image': $response = $wame->sendImage($conv['telefone'], $url, $caption, $provider); break;
            case 'audio': $response = $wame->sendAudio($conv['telefone'], $url, $provider); break;
            case 'video': $response = $wame->sendVideo($conv['telefone'], $url, $caption, $provider); break;
            case 'document': $response = $wame->sendDocument($conv['telefone'], $url, $mimetype, $fileName, $provider); break;
        }

        if (!$response || !isset($response['status']) || $response['status'] !== 'success') {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Erro na API da WAME: " . ($response['error'] ?? 'Erro desconhecido')]);
            exit;
        }

        echo json_encode(["success" => true, "message" => "Mídia enviada!"]);
        exit;
    }

// 7. CHANGE STATUS
    if ($action === 'change_status') {
        $conversationId = $data['conversation_id'] ?? '';
        $status = $data['status'] ?? '';
        $nextAction = $data['next_action'] ?? null;
        $nextActionDate = $data['next_action_date'] ?? null;

        if (empty($conversationId) || empty($status)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "conversation_id e status são obrigatórios."]);
            exit;
        }

        // Fetch conversation
        $stmtGet = $db->prepare("SELECT status, nome_contato, telefone FROM whatsapp_conversations WHERE id = :id LIMIT 1");
        $stmtGet->execute([':id' => $conversationId]);
        $conv = $stmtGet->fetch();

        if (!$conv) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Conversa não encontrada."]);
            exit;
        }

        $oldStatus = $conv['status'];

        // Update status and optional next action
        $query = "UPDATE whatsapp_conversations SET status = :status, updated_at = NOW()";
        $params = [':status' => $status, ':id' => $conversationId];
        
        if ($nextAction !== null) {
            $query .= ", next_action = :next_action, next_action_date = :next_action_date";
            $params[':next_action'] = $nextAction;
            $params[':next_action_date'] = $nextActionDate;
        }
        $query .= " WHERE id = :id";

        $stmtUpd = $db->prepare($query);
        $stmtUpd->execute($params);

        // Audit Log
        $stmtAudit = $db->prepare("
            INSERT INTO audit_logs (user_id, user_name, action, module, description, ip_address)
            VALUES (:user_id, :user_name, 'ALTERAR_STATUS_WHATSAPP', 'WhatsApp', :descr, '127.0.0.1')
        ");
        $stmtAudit->execute([
            ':user_id' => $currentUser['id'],
            ':user_name' => $currentUser['name'],
            ':descr' => "Status da conversa com " . $conv['nome_contato'] . " alterado de \"$oldStatus\" para \"$status\"." . ($nextAction ? " Próxima ação: $nextAction em $nextActionDate." : "")
        ]);

        echo json_encode(["success" => true, "message" => "Status alterado com sucesso!"]);
        exit;
    }

    // 8. ADD NOTE
    if ($action === 'add_note') {
        $conversationId = $data['conversation_id'] ?? '';
        $note = $data['note'] ?? '';

        if (empty($conversationId) || empty($note)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "conversation_id e note são obrigatórios."]);
            exit;
        }

        $noteId = 'note_' . uniqid();
        $stmt = $db->prepare("
            INSERT INTO whatsapp_internal_notes (id, conversation_id, user_id, user_name, note)
            VALUES (:id, :conversation_id, :user_id, :user_name, :note)
        ");
        $stmt->execute([
            ':id' => $noteId,
            ':conversation_id' => $conversationId,
            ':user_id' => $currentUser['id'],
            ':user_name' => $currentUser['name'],
            ':note' => $note
        ]);

        echo json_encode(["success" => true, "message" => "Nota interna registrada com sucesso!"]);
        exit;
    }

    // 9. SEND MESSAGE
    if ($action === 'send_message') {
        $conversationId = $data['conversation_id'] ?? '';
        $messageText = $data['message_text'] ?? '';

        if (empty($conversationId) || empty($messageText)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "conversation_id e message_text são obrigatórios."]);
            exit;
        }

        // Fetch conversation details to get the number and modalidade
        $stmtConv = $db->prepare("SELECT c.whatsapp_number_id, n.telefone, n.provedor FROM whatsapp_conversations c JOIN whatsapp_numbers n ON c.whatsapp_number_id = n.id WHERE c.id = :cid LIMIT 1");
        $stmtConv->execute([':cid' => $conversationId]);
        $conv = $stmtConv->fetch();

        // Fetch API config
        $stmtInt = $db->prepare("SELECT api_base_url, account_identifier FROM whatsapp_integrations LIMIT 1");
        $stmtInt->execute();
        $config = $stmtInt->fetch();

        if (!$conv || !$config) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Erro ao carregar configurações da integração ou conversa."]);
            exit;
        }

        require_once '../lib/WameClient.php';
        $wame = new WameClient($config['api_base_url'], $config['account_identifier']);
        $response = $wame->sendMessage($conv['telefone'], $messageText, $data['provider'] ?? 'whatsapp');

        if (!$response || !isset($response['status']) || $response['status'] !== 'success') {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Erro na API da WAME: " . ($response['error'] ?? 'Erro desconhecido')]);
            exit;
        }

        $msgId = 'msg_out_' . uniqid();
        $extMsgId = $response['id'] ?? 'msg_ext_' . uniqid();

        // 1. Save Outbound Message
        $stmtMsg = $db->prepare("
            INSERT INTO whatsapp_messages (id, conversation_id, external_message_id, direction, message_type, message_text, sender_user_id, status)
            VALUES (:id, :conversation_id, :ext_id, 'outbound', 'text', :message_text, :sender, 'sent')
        ");
        $stmtMsg->execute([
            ':id' => $msgId,
            ':conversation_id' => $conversationId,
            ':ext_id' => $extMsgId,
            ':message_text' => $messageText,
            ':sender' => $currentUser['id']
        ]);

        // 2. Update Conversation Metadata
        $stmtUpdConv = $db->prepare("
            UPDATE whatsapp_conversations 
            SET last_message_text = :text, last_message_at = NOW(), updated_at = NOW()
            WHERE id = :id
        ");
        $stmtUpdConv->execute([
            ':text' => $messageText,
            ':id' => $conversationId
        ]);

        echo json_encode(["success" => true, "message" => "Mensagem enviada com sucesso!", "external_id" => $extMsgId]);
        exit;
    }

    // New action for media
    if ($action === 'send_media') {
        $conversationId = $data['conversation_id'] ?? '';
        $url = $data['url'] ?? '';
        $type = $data['type'] ?? 'image'; // image, audio, video, document
        $caption = $data['caption'] ?? '';
        $mimetype = $data['mimetype'] ?? '';
        $fileName = $data['fileName'] ?? '';
        $provider = $data['provider'] ?? 'whatsapp';

        if (empty($conversationId) || empty($url)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "conversation_id e url são obrigatórios."]);
            exit;
        }

        $stmtConv = $db->prepare("SELECT c.whatsapp_number_id, n.telefone FROM whatsapp_conversations c JOIN whatsapp_numbers n ON c.whatsapp_number_id = n.id WHERE c.id = :cid LIMIT 1");
        $stmtConv->execute([':cid' => $conversationId]);
        $conv = $stmtConv->fetch();

        $stmtInt = $db->prepare("SELECT api_base_url, account_identifier FROM whatsapp_integrations LIMIT 1");
        $stmtInt->execute();
        $config = $stmtInt->fetch();

        require_once '../lib/WameClient.php';
        $wame = new WameClient($config['api_base_url'], $config['account_identifier']);
        
        $response = null;
        switch($type) {
            case 'image': $response = $wame->sendImage($conv['telefone'], $url, $caption, $provider); break;
            case 'audio': $response = $wame->sendAudio($conv['telefone'], $url, $provider); break;
            case 'video': $response = $wame->sendVideo($conv['telefone'], $url, $caption, $provider); break;
            case 'document': $response = $wame->sendDocument($conv['telefone'], $url, $mimetype, $fileName, $provider); break;
        }

        if (!$response || !isset($response['status']) || $response['status'] !== 'success') {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Erro na API da WAME."]);
            exit;
        }

        echo json_encode(["success" => true, "message" => "Mídia enviada!"]);
        exit;
    }

    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Ação POST inválida."]);
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Método não permitido."]);
exit;
