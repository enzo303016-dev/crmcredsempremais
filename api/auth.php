<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido.']);
    exit;
}

require_once __DIR__ . '/../config/database.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '{}', true);

if (!is_array($data)) {
    $data = [];
}

$email = strtolower(trim((string)($data['email'] ?? '')));
$password = (string)($data['password'] ?? '');

if ($email === '' || $password === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'E-mail e senha são obrigatórios.']);
    exit;
}

try {
    $pdo = getDbConnection();

    $sql = "
        SELECT
            u.id,
            u.uuid,
            u.name,
            u.cpf,
            u.phone,
            u.whatsapp,
            u.email,
            u.password_hash,
            u.status,
            u.supervisor_id,
            u.created_at,
            u.updated_at,
            r.name AS role_name
        FROM users u
        INNER JOIN roles r ON r.id = u.role_id
        WHERE LOWER(u.email) = :email
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['email' => $email]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($password, (string)$row['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'E-mail ou senha incorretos.']);
        exit;
    }

    if (($row['status'] ?? '') !== 'Ativo') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Usuário inativo. Entre em contato com o Administrador.']);
        exit;
    }

    $roleMap = [
        'Administrador' => 'Administrador',
        'Admin' => 'Administrador',
        'Supervisor' => 'Supervisor',
        'Vendedor' => 'Vendedor',
        'Consultor' => 'Vendedor',
    ];

    $role = $roleMap[(string)$row['role_name']] ?? (string)$row['role_name'];

    $user = [
        'id' => (string)$row['id'],
        'name' => (string)$row['name'],
        'cpf' => (string)$row['cpf'],
        'phone' => (string)$row['phone'],
        'whatsapp' => (string)$row['whatsapp'],
        'email' => (string)$row['email'],
        'role' => $role,
        'status' => (string)$row['status'],
        'supervisor_id' => $row['supervisor_id'] !== null ? (string)$row['supervisor_id'] : null,
        'supervisor_name' => null,
        'created_at' => (string)$row['created_at'],
        'updated_at' => (string)$row['updated_at'],
    ];

    echo json_encode([
        'success' => true,
        'message' => 'Login realizado com sucesso.',
        'user' => $user,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno ao autenticar. Verifique a configuração do banco de dados.',
    ], JSON_UNESCAPED_UNICODE);
}
