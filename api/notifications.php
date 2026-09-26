<?php
// Cred Sempre + CRM - API de Notificações (Fase 7.5)
header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';
$db = getDbConnection();
$currentUser = ['id' => 'usr_admin_1']; // Mock

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// CREATE Notification (called by automations/cron)
function createNotification($db, $userId, $title, $message, $entityType, $entityId) {
    $stmt = $db->prepare("INSERT INTO notifications (usuario_id, titulo, mensagem, entidade_tipo, entidade_id) VALUES (:uid, :tit, :msg, :et, :eid)");
    $stmt->execute([':uid' => $userId, ':tit' => $title, ':msg' => $message, ':et' => $entityType, ':eid' => $entityId]);
}

// READ
if ($method === 'GET' && $action === 'list') {
    $stmt = $db->prepare("SELECT * FROM notifications WHERE usuario_id = :uid ORDER BY criada_em DESC");
    $stmt->execute([':uid' => $currentUser['id']]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

// MARK AS READ
if ($method === 'POST' && $action === 'mark_read') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $db->prepare("UPDATE notifications SET lida = 1, lida_em = NOW() WHERE id = :id AND usuario_id = :uid");
    $stmt->execute([':id' => $data['id'], ':uid' => $currentUser['id']]);
    echo json_encode(['success' => true]);
    exit;
}
