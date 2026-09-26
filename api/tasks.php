<?php
// Cred Sempre + CRM - API de Tarefas (Fase 7.5)
header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';
$db = getDbConnection();

// Autenticação básica (reutilizar padrão)
// Assumindo existência de sistema de autenticação nas fases anteriores
$currentUser = ['id' => 'usr_admin_1', 'name' => 'Admin']; // Mock temporário

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? '';

// CREATE
if ($method === 'POST' && $action === 'create') {
    $stmt = $db->prepare("INSERT INTO tasks (user_id, lead_id, cliente_id, oportunidade_id, tipo, titulo, descricao, data_vencimento, prioridade, status, criado_por) VALUES (:user_id, :lead_id, :cliente_id, :oportunidade_id, :tipo, :titulo, :descricao, :data_vencimento, :prioridade, 'Pendente', :criado_por)");
    $stmt->execute([
        ':user_id' => $data['user_id'] ?? $currentUser['id'],
        ':lead_id' => $data['lead_id'] ?? null,
        ':cliente_id' => $data['cliente_id'] ?? null,
        ':oportunidade_id' => $data['oportunidade_id'] ?? null,
        ':tipo' => $data['tipo'],
        ':titulo' => $data['titulo'],
        ':descricao' => $data['descricao'],
        ':data_vencimento' => $data['data_vencimento'],
        ':prioridade' => $data['prioridade'],
        ':criado_por' => $currentUser['id']
    ]);
    echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
    exit;
}

// READ
if ($method === 'GET') {
    $sql = "SELECT * FROM tasks WHERE 1=1";
    if (isset($_GET['status'])) $sql .= " AND status = :status";
    $stmt = $db->prepare($sql);
    if (isset($_GET['status'])) $stmt->execute([':status' => $_GET['status']]);
    else $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

// UPDATE/COMPLETE/CANCEL
if ($method === 'POST' && in_array($action, ['update', 'complete', 'cancel'])) {
    $id = $data['id'];
    if ($action === 'complete') {
        $stmt = $db->prepare("UPDATE tasks SET status = 'Concluída', concluido_por = :user, concluido_em = NOW() WHERE id = :id");
        $stmt->execute([':user' => $currentUser['id'], ':id' => $id]);
    } elseif ($action === 'cancel') {
        $stmt = $db->prepare("UPDATE tasks SET status = 'Cancelada' WHERE id = :id");
        $stmt->execute([':id' => $id]);
    } else {
        // update (título, descrição, etc)
        $stmt = $db->prepare("UPDATE tasks SET titulo = :titulo, descricao = :descricao, data_vencimento = :data WHERE id = :id");
        $stmt->execute([':titulo' => $data['titulo'], ':descricao' => $data['descricao'], ':data' => $data['data_vencimento'], ':id' => $id]);
    }
    echo json_encode(['success' => true]);
    exit;
}
