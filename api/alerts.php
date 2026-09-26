<?php
// Cred Sempre + CRM - API de Alertas Operacionais (Fase 7.5)
header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';
$db = getDbConnection();

// Retorna contagens de alertas
$alerts = [
    'leads_sem_atendimento' => $db->query("SELECT COUNT(*) FROM leads WHERE status = 'Novo'")->fetchColumn(),
    'leads_sem_proxima_acao' => $db->query("SELECT COUNT(*) FROM leads WHERE next_action IS NULL AND status != 'Perdido'")->fetchColumn(),
    'tarefas_atrasadas' => $db->query("SELECT COUNT(*) FROM tasks WHERE status = 'Pendente' AND data_vencimento < NOW()")->fetchColumn(),
    'oportunidades_paradas' => $db->query("SELECT COUNT(*) FROM opportunities WHERE updated_at < NOW() - INTERVAL 7 DAY")->fetchColumn(),
    'conversas_aguardando' => $db->query("SELECT COUNT(*) FROM whatsapp_conversations WHERE status = 'Aguardando atendimento'")->fetchColumn()
];

echo json_encode($alerts);
