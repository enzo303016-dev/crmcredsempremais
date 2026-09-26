<?php
// Cred Sempre + CRM - Script Cron de Automação Operacional (Fase 7.5)
if (php_sapi_name() !== 'cli' && $_SERVER['REMOTE_ADDR'] !== '127.0.0.1') {
    http_response_code(403);
    exit;
}

require_once dirname(__DIR__) . '/config/database.php';
$db = getDbConnection();

function ensureAutomationTablesExist($db) {
    $db->exec("CREATE TABLE IF NOT EXISTS `tasks` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` VARCHAR(50) NOT NULL,
        `lead_id` INT NULL,
        `cliente_id` INT NULL,
        `tipo` VARCHAR(50),
        `titulo` VARCHAR(255),
        `descricao` TEXT,
        `data_vencimento` DATETIME,
        `prioridade` VARCHAR(20) DEFAULT 'Normal',
        `status` VARCHAR(20) DEFAULT 'Pendente',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    $db->exec("CREATE TABLE IF NOT EXISTS `automation_logs` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `event_key` VARCHAR(100) UNIQUE,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    $db->exec("CREATE TABLE IF NOT EXISTS `notifications` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `usuario_id` VARCHAR(50) NOT NULL,
        `titulo` VARCHAR(255),
        `mensagem` TEXT,
        `entidade_tipo` VARCHAR(50),
        `entidade_id` INT,
        `lida` TINYINT(1) DEFAULT 0,
        `criada_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `lida_em` TIMESTAMP NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
}

ensureAutomationTablesExist($db);

// Exemplo: Identificar leads novos sem atendimento (sem tarefas pendentes)
$stmtLeads = $db->prepare("
    SELECT l.id, l.nome 
    FROM leads l 
    LEFT JOIN tasks t ON l.id = t.lead_id AND t.status = 'Pendente'
    WHERE l.status = 'Novo' AND t.id IS NULL
");
$stmtLeads->execute();
$leads = $stmtLeads->fetchAll();

foreach ($leads as $lead) {
// Idempotência: verificar log de automação
    $eventKey = 'lead_new_task_' . $lead['id'];
    $stmtLog = $db->prepare("INSERT IGNORE INTO automation_logs (event_key) VALUES (:key)");
    $stmtLog->execute([':key' => $eventKey]);
    
    if ($stmtLog->rowCount() > 0) {
        $stmtTask = $db->prepare("
            INSERT INTO tasks (user_id, lead_id, tipo, titulo, descricao, data_vencimento)
            VALUES ('usr_admin_1', :lead_id, 'Atendimento', 'Atender Lead Novo', 'Novo lead precisa de contato inicial.', NOW())
        ");
        $stmtTask->execute([':lead_id' => $lead['id']]);
        
        // Create Notification
        $stmtNotif = $db->prepare("INSERT INTO notifications (usuario_id, titulo, mensagem, entidade_tipo, entidade_id) VALUES ('usr_admin_1', 'Novo Lead', 'Novo lead atribuído para atendimento.', 'lead', :lead_id)");
        $stmtNotif->execute([':lead_id' => $lead['id']]);
    }
}

// 2. Oportunidades Paradas
$stmtOpp = $db->prepare("SELECT id, stage, updated_at FROM opportunities WHERE updated_at < NOW() - INTERVAL 7 DAY"); // Simplificado
$stmtOpp->execute();
$opps = $stmtOpp->fetchAll();

foreach ($opps as $opp) {
    $eventKey = 'opp_stalled_' . $opp['id'] . '_' . date('Y-m-d');
    $stmtLog = $db->prepare("INSERT IGNORE INTO automation_logs (event_key) VALUES (:key)");
    $stmtLog->execute([':key' => $eventKey]);
    
    if ($stmtLog->rowCount() > 0) {
        $stmtTask = $db->prepare("INSERT INTO tasks (user_id, oportunidade_id, titulo, descricao) VALUES ('usr_admin_1', :opp_id, 'Oportunidade Parada', 'Oportunidade parou na etapa ' . :stage)");
        $stmtTask->execute([':opp_id' => $opp['id'], ':stage' => $opp['stage']]);
    }
}

echo "Automação executada com sucesso.\n";
