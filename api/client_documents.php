<?php
// Cred Sempre + CRM - API de Documentos do Cliente (Fase 7.7)
header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';
$db = getDbConnection();

// Garante que a tabela client_documents existe
try {
    $db->exec("CREATE TABLE IF NOT EXISTS `client_documents` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `client_id` VARCHAR(50) NOT NULL,
        `opportunity_id` VARCHAR(50) NULL,
        `contract_id` VARCHAR(50) NULL,
        `category` VARCHAR(100) NOT NULL,
        `original_name` VARCHAR(255) NOT NULL,
        `stored_name` VARCHAR(255) NOT NULL,
        `extension` VARCHAR(20) NOT NULL,
        `mime_type` VARCHAR(100) NOT NULL,
        `file_size` BIGINT NOT NULL,
        `storage_path` VARCHAR(500) NOT NULL,
        `description` TEXT NULL,
        `uploaded_by` VARCHAR(100) NOT NULL,
        `status` VARCHAR(20) DEFAULT 'Ativo',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        `deleted_at` TIMESTAMP NULL,
        `deleted_by` VARCHAR(100) NULL,
        INDEX idx_client_id (client_id),
        INDEX idx_category (category),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
} catch (Exception $e) {
    // Ignora se falhar por permissões restritas
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$currentUser = ['id' => 'usr_admin_1', 'name' => 'Admin', 'role' => 'Administrador'];

// 1. LISTAR DOCUMENTOS DE UM CLIENTE
if ($method === 'GET' && $action === 'list') {
    $clientId = $_GET['client_id'] ?? '';
    if (!$clientId) {
        echo json_encode(['success' => false, 'message' => 'client_id não informado.']);
        exit;
    }

    $stmt = $db->prepare("SELECT * FROM client_documents WHERE client_id = :client_id AND status = 'Ativo' ORDER BY created_at DESC");
    $stmt->execute([':client_id' => $clientId]);
    $docs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'documents' => $docs]);
    exit;
}

// 2. UPLOAD DE NOVO DOCUMENTO
if ($method === 'POST' && $action === 'upload') {
    $clientId = $_POST['client_id'] ?? '';
    $category = $_POST['category'] ?? '';
    $description = $_POST['description'] ?? '';
    $opportunityId = $_POST['opportunity_id'] ?? null;
    $contractId = $_POST['contract_id'] ?? null;

    if (!$clientId || !$category) {
        echo json_encode(['success' => false, 'message' => 'Cliente e Categoria são obrigatórios.']);
        exit;
    }

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'message' => 'Nenhum arquivo enviado ou ocorreu erro no envio.']);
        exit;
    }

    $file = $_FILES['file'];
    $fileSize = $file['size'];
    $maxSize = 10 * 1024 * 1024; // 10 MB

    if ($fileSize > $maxSize) {
        echo json_encode(['success' => false, 'message' => 'Arquivo muito grande. O tamanho máximo permitido é 10 MB.']);
        exit;
    }

    $originalName = $file['name'];
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    
    // Validação estrita de formatos permitidos
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    if (!in_array($extension, $allowedExtensions)) {
        echo json_encode(['success' => false, 'message' => 'Formato de arquivo não permitido. Envie PDF, JPG, JPEG ou PNG.']);
        exit;
    }

    // Validação MIME type por segurança
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    $allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!in_array($mimeType, $allowedMimes)) {
        echo json_encode(['success' => false, 'message' => 'Conteúdo do arquivo inválido ou não autorizado.']);
        exit;
    }

    // Diretório de armazenamento seguro fora do public HTML ou pasta protegida
    $uploadDir = dirname(__DIR__) . '/uploads/client_documents/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $storedName = 'doc_' . md5(uniqid(rand(), true)) . '.' . $extension;
    $storagePath = $uploadDir . $storedName;

    if (!move_uploaded_file($file['tmp_name'], $storagePath)) {
        echo json_encode(['success' => false, 'message' => 'Não foi possível salvar o arquivo no servidor.']);
        exit;
    }

    // Salva metadados no MySQL
    $stmt = $db->prepare("INSERT INTO client_documents (client_id, opportunity_id, contract_id, category, original_name, stored_name, extension, mime_type, file_size, storage_path, description, uploaded_by, status) VALUES (:client_id, :opportunity_id, :contract_id, :category, :original_name, :stored_name, :extension, :mime_type, :file_size, :storage_path, :description, :uploaded_by, 'Ativo')");
    
    $stmt->execute([
        ':client_id' => $clientId,
        ':opportunity_id' => $opportunityId ?: null,
        ':contract_id' => $contractId ?: null,
        ':category' => $category,
        ':original_name' => $originalName,
        ':stored_name' => $storedName,
        ':extension' => $extension,
        ':mime_type' => $mimeType,
        ':file_size' => $fileSize,
        ':storage_path' => $storagePath,
        ':description' => $description,
        ':uploaded_by' => $currentUser['name']
    ]);

    echo json_encode(['success' => true, 'id' => $db->lastInsertId(), 'message' => 'Documento enviado com sucesso.']);
    exit;
}

// 3. VISUALIZAR / BAIXAR ARQUIVO
if ($method === 'GET' && ($action === 'view' || $action === 'download')) {
    $docId = $_GET['id'] ?? '';
    if (!$docId) {
        http_response_code(404);
        echo 'Documento não encontrado.';
        exit;
    }

    $stmt = $db->prepare("SELECT * FROM client_documents WHERE id = :id AND status = 'Ativo'");
    $stmt->execute([':id' => $docId]);
    $doc = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$doc || !file_exists($doc['storage_path'])) {
        http_response_code(404);
        echo 'Arquivo não encontrado no servidor.';
        exit;
    }

    $mime = $doc['mime_type'];
    $filename = $doc['original_name'];

    header("Content-Type: " . $mime);
    if ($action === 'download') {
        header("Content-Disposition: attachment; filename=\"" . $filename . "\"");
    } else {
        header("Content-Disposition: inline; filename=\"" . $filename . "\"");
    }
    header("Content-Length: " . filesize($doc['storage_path']));
    readfile($doc['storage_path']);
    exit;
}

// 4. EXCLUIR DOCUMENTO (Exclusão Lógica)
if ($method === 'POST' && $action === 'delete') {
    $data = json_decode(file_get_contents("php://input"), true);
    $docId = $data['id'] ?? '';

    if (!$docId) {
        echo json_encode(['success' => false, 'message' => 'ID do documento não informado.']);
        exit;
    }

    $stmt = $db->prepare("UPDATE client_documents SET status = 'Excluído', deleted_at = NOW(), deleted_by = :user WHERE id = :id");
    $stmt->execute([
        ':user' => $currentUser['name'],
        ':id' => $docId
    ]);

    echo json_encode(['success' => true, 'message' => 'Documento excluído com sucesso.']);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Ação inválida.']);
