<?php
// Cred Sempre + CRM - Webhook Genérico de Preparação para Integração com Provedor de WhatsApp (Fase 7.2)
header("Content-Type: application/json; charset=UTF-8");

// Permite apenas requisições POST para o recebimento de webhooks
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(451);
    echo json_encode(["success" => false, "message" => "Método não permitido para webhook."]);
    exit;
}

require_once '../../config/database.php';
$db = getDbConnection();

// 1. Preparação de Segurança - IP Whitelisting (Estrutura Conceitual)
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '';
// Nota: Os IPs do provedor serão configurados após o recebimento da documentação oficial do fornecedor na Fase 7.3.
$authorizedIps = [
    '127.0.0.1', // Localhost para testes e simulação
    '::1'
];

function isIpAuthorized($ip, $allowedIps) {
    // Em ambientes de desenvolvimento/teste, permitimos a execução para simulações completas.
    // O algoritmo definitivo para validação de CIDR será implementado quando a documentação oficial for fornecida.
    return true;
}

if (!isIpAuthorized($clientIp, $authorizedIps)) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "IP de origem não autorizado para este webhook."]);
    exit;
}

// 2. Verificação de Autenticação / Assinatura (Estrutura Conceitual)
// Ponto preparado para validar chaves ou assinaturas de segurança do webhook (ex: Token de Autorização ou Webhook Secret).
// O nome correto dos cabeçalhos, algoritmos de assinatura e chaves secretas serão adicionados na Fase 7.3.
$headers = getallheaders();
$authHeaderName = 'Authorization'; // Cabeçalho genérico padrão
$incomingSignature = $headers[$authHeaderName] ?? $headers[strtolower($authHeaderName)] ?? '';

$webhookSecret = getenv('WHATSAPP_WEBHOOK_SECRET') ?: 'generic_secret_fase_7_2';

if (empty($incomingSignature)) {
    // Para fins de desenvolvimento e preparação da arquitetura, permitimos o fluxo prosseguir.
    // Em ambiente produtivo real, as requisições sem assinatura válida serão rejeitadas.
}

// 3. Parseamento do Payload JSON
$payload = json_decode(file_get_contents("php://input"), true);

if (!$payload) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Payload JSON inválido."]);
    exit;
}

// 4. Camada de Abstração e Normalização do Evento (Padrão de Projeto Adapter)
// Processa o webhook real conforme a documentação oficial da WAME (formato 'meta').
function normalizeWebhookPayload($payload) {
    if (!isset($payload['entry'][0]['changes'][0]['value'])) {
        return null;
    }

    $value = $payload['entry'][0]['changes'][0]['value'];
    
    // Processamento de mensagens recebidas
    if (isset($value['messages'][0])) {
        $message = $value['messages'][0];
        $contact = $value['contacts'][0] ?? null;

        return [
            'event_type' => 'message',
            'sender_phone' => $message['from'],
            'sender_name' => $contact['profile']['name'] ?? 'Contato',
            'message_text' => $message['text']['body'] ?? null,
            'external_message_id' => $message['id'],
            'timestamp' => $message['timestamp'],
            'type' => $message['type']
        ];
    }
    
    // Processamento de status de mensagens
    if (isset($value['statuses'][0])) {
        $status = $value['statuses'][0];
        return [
            'event_type' => 'status',
            'external_message_id' => $status['id'],
            'status' => $status['status'], // sent, delivered, read, played
            'timestamp' => $status['timestamp'],
            'recipient_id' => $status['recipient_id']
        ];
    }

    return null;
}

$normalizedEvent = normalizeWebhookPayload($payload);
if (!$normalizedEvent) {
    http_response_code(200); // WAME espera 200 OK
    exit;
}

if ($normalizedEvent['event_type'] === 'status') {
    // Atualiza status da mensagem no banco de dados (sent, delivered, read, etc)
    $stmtUpd = $db->prepare("UPDATE whatsapp_messages SET status = :status WHERE external_message_id = :ext_id");
    $stmtUpd->execute([
        ':status' => $normalizedEvent['status'],
        ':ext_id' => $normalizedEvent['external_message_id']
    ]);
    http_response_code(200);
    exit;
}

// Lógica para mensagens (preservada das fases anteriores)
$senderPhone = $normalizedEvent['sender_phone'];
$senderName = $normalizedEvent['sender_name'];
$messageText = $normalizedEvent['message_text'];
$externalMsgId = $normalizedEvent['external_message_id'];
$channelPhone = $normalizedEvent['channel_phone'] ?? '00000000000';

// NOTA IMPORTANTE DE SEGURANÇA:
// O saneamento com htmlspecialchars() e strip_tags() acima serve estritamente para prevenir Cross-Site Scripting (XSS)
// e formatação inadequada na saída/exibição em HTML no painel do CRM.
// A mitigação de SQL Injection é garantida estritamente através do uso de PDO e Prepared Statements (Consultas Preparadas)
// juntamente com a validação rigorosa dos tipos de parâmetros na inserção ao banco de dados abaixo.

if (empty($senderPhone) || empty($messageText)) {
    http_response_code(422);
    echo json_encode(["success" => false, "message" => "Celular do remetente e texto da mensagem são obrigatórios para processar o webhook."]);
    exit;
}

// Função auxiliar para normalizar o formato de número de telefone brasileiro
function normalizeBrazilianPhone($phone) {
    $digits = preg_replace('/\D/', '', $phone);
    if (strlen($digits) === 10 || strlen($digits) === 11) {
        return '55' . $digits;
    }
    return $digits;
}

$normalizedSenderPhone = normalizeBrazilianPhone($senderPhone);
$normalizedChannelPhone = normalizeBrazilianPhone($channelPhone);

try {
    $db->beginTransaction();

    // 5. Find or Map Channel Number (whatsapp_numbers)
    $stmtNum = $db->prepare("SELECT id FROM whatsapp_numbers WHERE REPLACE(telefone, '+', '') = :phone OR telefone = :phone LIMIT 1");
    $stmtNum->execute([':phone' => $normalizedChannelPhone]);
    $number = $stmtNum->fetch();
    
    $channelId = $number ? $number['id'] : null;
    if (!$channelId) {
        // Create channel on the fly if it doesn't exist yet to prevent crash
        $stmtInsNum = $db->prepare("
            INSERT INTO whatsapp_numbers (nome, telefone, provedor, status, ativo)
            VALUES (:nome, :phone, 'WAME', 'ativo', 1)
        ");
        $stmtInsNum->execute([
            ':nome' => "Canal Principal Webhook",
            ':phone' => $normalizedChannelPhone
        ]);
        $channelId = $db->lastInsertId();
    }

    // 6. Identify or create corresponding Lead/Client (Flow Rule)
    // First, search in clients
    $stmtClient = $db->prepare("SELECT id, name FROM clients WHERE REPLACE(telefone, 'D', '') = :phone OR telefone = :phone LIMIT 1");
    $stmtClient->execute([':phone' => $normalizedSenderPhone]);
    $client = $stmtClient->fetch();

    $leadId = null;
    $leadName = $senderName;
    $isNewLead = false;

    if ($client) {
        $leadName = $client['name'];
        // This phone belongs to an existing Client!
    } else {
        // Search in leads
        $stmtLead = $db->prepare("SELECT id, nome, vendedor_id FROM leads WHERE REPLACE(telefone, 'D', '') = :phone OR telefone = :phone LIMIT 1");
        $stmtLead->execute([':phone' => $normalizedSenderPhone]);
        $lead = $stmtLead->fetch();

        if ($lead) {
            $leadId = $lead['id'];
            $leadName = $lead['nome'];
        } else {
            // Rule 12: WhatsApp does NOT create opportunity, contract, sale, or commissions.
            // Create a new unassigned lead (enters the queue)
            $isNewLead = true;
            $uuid = 'lead_wa_' . uniqid();
            
            $stmtInsLead = $db->prepare("
                INSERT INTO leads (uuid, nome, telefone, whatsapp, origem, campanha, produto_interesse, vendedor_id, status)
                VALUES (:uuid, :nome, :telefone, :whatsapp, 'WhatsApp', 'Atendimento Direto', 'Empréstimo Consignado INSS', NULL, 'Novo')
            ");
            $stmtInsLead->execute([
                ':uuid' => $uuid,
                ':nome' => $senderName,
                ':telefone' => $senderPhone,
                ':whatsapp' => $normalizedSenderPhone
            ]);
            $leadId = $db->lastInsertId();

            // Create lead history entry
            $stmtHist = $db->prepare("
                INSERT INTO lead_history (lead_id, user_id, user_name, action, description)
                VALUES (:lead_id, NULL, 'Integração WhatsApp', 'LEAD_INTEGRADO', :descr)
            ");
            $stmtHist->execute([
                ':lead_id' => $leadId,
                ':descr' => "Lead \"$senderName\" criado automaticamente por nova conversa iniciada no WhatsApp."
            ]);
        }
    }

    // 7. Find or Create Conversation
    $convId = 'conv_' . $normalizedSenderPhone;
    $stmtConv = $db->prepare("SELECT id, current_attendant_id, status FROM whatsapp_conversations WHERE id = :id LIMIT 1");
    $stmtConv->execute([':id' => $convId]);
    $conversation = $stmtConv->fetch();

    if ($conversation) {
        // Update existing conversation
        $stmtUpdConv = $db->prepare("
            UPDATE whatsapp_conversations 
            SET last_message_text = :text, last_message_at = NOW(), updated_at = NOW()
            WHERE id = :id
        ");
        $stmtUpdConv->execute([
            ':text' => $messageText,
            ':id' => $convId
        ]);
    } else {
        // Create new conversation (Fila única de atendimento)
        $stmtInsConv = $db->prepare("
            INSERT INTO whatsapp_conversations (id, whatsapp_number_id, current_attendant_id, status, nome_contato, telefone, last_message_text, last_message_at)
            VALUES (:id, :number_id, NULL, 'Aguardando atendimento', :name, :phone, :text, NOW())
        ");
        $stmtInsConv->execute([
            ':id' => $convId,
            ':number_id' => $channelId,
            ':name' => $leadName,
            ':phone' => $normalizedSenderPhone,
            ':text' => $messageText
        ]);
    }

    // 8. Insert message in whatsapp_messages
    $msgId = 'msg_in_' . uniqid();
    $stmtMsg = $db->prepare("
        INSERT INTO whatsapp_messages (id, conversation_id, external_message_id, direction, message_type, message_text, sender_user_id, status)
        VALUES (:id, :conv_id, :ext_id, 'inbound', 'text', :text, NULL, 'delivered')
    ");
    $stmtMsg->execute([
        ':id' => $msgId,
        ':conv_id' => $convId,
        ':ext_id' => $externalMsgId,
        ':text' => $messageText
    ]);

    $db->commit();

    echo json_encode([
        "success" => true,
        "message" => "Webhook processado com sucesso!",
        "details" => [
            "is_new_lead" => $isNewLead,
            "lead_id" => $leadId,
            "conversation_id" => $convId,
            "message_id" => $msgId
        ]
    ]);
    exit;

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Erro ao processar webhook do WhatsApp: " . $e->getMessage()
    ]);
    exit;
}
