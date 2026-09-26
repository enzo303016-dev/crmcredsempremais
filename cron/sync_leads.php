<?php
// Cred Sempre + CRM - Script Cron de Sincronização Automática a cada 5 Minutos (Fase 7.1)
if (php_sapi_name() !== 'cli' && $_SERVER['REMOTE_ADDR'] !== '127.0.0.1') {
    http_response_code(403);
    echo "Acesso proibido. Execução somente permitida via CLI (cron do servidor) ou localmente.";
    exit;
}

require_once dirname(__DIR__) . '/config/database.php';
$db = getDbConnection();

$startedAt = date('Y-m-d H:i:s');

// 1. Carregar Configuração Ativa do Banco MySQL
$stmtConfig = $db->prepare("SELECT * FROM google_sheets_configs WHERE active = 1 ORDER BY id DESC LIMIT 1");
$stmtConfig->execute();
$config = $stmtConfig->fetch();

if (!$config) {
    echo "Nenhuma configuração de planilha Google Sheets ativa encontrada.\n";
    exit;
}

// Log start of automated execution
$stmtLog = $db->prepare("
    INSERT INTO lead_sync_logs (source, started_at, status, executed_by)
    VALUES ('Google Sheets (Cron)', :started_at, 'RUNNING', NULL)
");
$stmtLog->execute([':started_at' => $startedAt]);
$logId = $db->lastInsertId();

function normalizePhone($phone) {
    if (!$phone) return '';
    $digits = preg_replace('/\D/', '', $phone);
    if (strlen($digits) === 10 || strlen($digits) === 11) {
        return '55' . $digits;
    }
    if (strpos($digits, '55') === 0 && strlen($digits) >= 12) {
        return $digits;
    }
    return $digits;
}

try {
    // 2. Acessar a Planilha Google Sheets / Buscar novos registros
    // No ambiente real do servidor, isto usaria o Google API PHP SDK:
    // $client = new Google\Client();
    // $client->setAuthConfig($serviceAccountCredentialsPath);
    // $service = new Google\Service\Sheets($client);
    // $response = $service->spreadsheets_values->get($config['spreadsheet_id'], $config['sheet_name']);
    // $rows = $response->getValues();
    
    // Simular novos dados obtidos pelo Cron do Google Sheets
    $rowsFromSheets = [
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
    
    $recordsFound = count($rowsFromSheets);
    $recordsImported = 0;
    $recordsUpdated = 0;
    $recordsDuplicated = 0;
    $recordsFailed = 0;
    
    foreach ($rowsFromSheets as $row) {
        $nameVal = $row['nome_completo'] ?? '';
        $phoneVal = $row['telefone'] ?? '';
        $extIdVal = $row['id'] ?? '';
        
        if (empty(trim($nameVal)) || empty(trim($phoneVal))) {
            $recordsFailed++;
            continue;
        }
        
        $normPhone = normalizePhone($phoneVal);
        
        // 3. Deduplicação Real MySQL
        // Prioridade 1: Meta Lead ID
        $stmtCheckId = $db->prepare("SELECT * FROM leads WHERE observacoes LIKE :id LIMIT 1");
        $stmtCheckId->execute([':id' => "%" . $extIdVal . "%"]);
        $leadById = $stmtCheckId->fetch();
        
        if (!$leadById) {
            // Prioridade 2: Telefone normalizado
            $stmtCheckPhone = $db->prepare("SELECT * FROM leads WHERE REPLACE(REPLACE(REPLACE(REPLACE(telefone, '(', ''), ')', ''), ' ', ''), '-', '') = :phone OR telefone = :phone LIMIT 1");
            $stmtCheckPhone->execute([':phone' => $normPhone]);
            $leadById = $stmtCheckPhone->fetch();
        }
        
        if ($leadById) {
            $recordsDuplicated++;
            $changed = false;
            $changesLog = [];
            
            if (!empty($row['email']) && empty($leadById['email'])) {
                $leadById['email'] = $row['email'];
                $changesLog[] = "E-mail adicionado: " . $row['email'];
                $changed = true;
            }
            if (!empty($row['cidade']) && $leadById['cidade'] !== $row['cidade']) {
                $oldCity = $leadById['cidade'] ?? 'Não informada';
                $leadById['cidade'] = $row['cidade'];
                $changesLog[] = "Cidade alterada de '$oldCity' para '" . $row['cidade'] . "'";
                $changed = true;
            }
            
            if ($changed) {
                $recordsUpdated++;
                $stmtUpd = $db->prepare("UPDATE leads SET email = :email, cidade = :cidade, updated_at = NOW() WHERE id = :id");
                $stmtUpd->execute([
                    ':email' => $leadById['email'],
                    ':cidade' => $leadById['cidade'],
                    ':id' => $leadById['id']
                ]);
                
                // Gravar histórico
                $stmtHist = $db->prepare("
                    INSERT INTO lead_history (lead_id, user_id, user_name, action, description)
                    VALUES (:lead_id, 0, 'Sistema Cron', 'LEAD_INTEGRACAO_ATUALIZADO', :descr)
                ");
                $stmtHist->execute([
                    ':lead_id' => $leadById['id'],
                    ':descr' => "Lead atualizado via Cron automático a cada 5 min. Alterações: " . implode(', ', $changesLog) . "."
                ]);
            }
        } else {
            // 4. Inserir lead não distribuído na fila de novos leads no MySQL
            $recordsImported++;
            $uuid = 'lead_cron_' . uniqid();
            
            $stmtIns = $db->prepare("
                INSERT INTO leads (uuid, nome, telefone, whatsapp, email, cidade, origem, campanha, anuncio, produto_interesse, observacoes, vendedor_id, status)
                VALUES (:uuid, :nome, :telefone, :whatsapp, :email, :cidade, 'Google Sheets', :campanha, :anuncio, :produto, :obs, NULL, 'Novo')
            ");
            $stmtIns->execute([
                ':uuid' => $uuid,
                ':nome' => $nameVal,
                ':telefone' => $phoneVal,
                ':whatsapp' => $normPhone,
                ':email' => $row['email'] ?? '',
                ':cidade' => $row['cidade'] ?? '',
                ':campanha' => $row['campaign_name'] ?? '',
                ':anuncio' => $row['ad_name'] ?? '',
                ':produto' => $row['tipo_de_supletivo'] ?? '',
                ':obs' => "Lead importado automaticamente via script Cron do Google Sheets. Meta Lead ID: $extIdVal."
            ]);
            
            $newLeadId = $db->lastInsertId();
            
            // Gravar histórico
            $stmtHist = $db->prepare("
                INSERT INTO lead_history (lead_id, user_id, user_name, action, description)
                VALUES (:lead_id, 0, 'Sistema Cron', 'LEAD_INTEGRADO', :descr)
            ");
            $stmtHist->execute([
                ':lead_id' => $newLeadId,
                ':descr' => "Lead '$nameVal' criado via Cron de sincronização automática com o Google Sheets."
            ]);
        }
    }
    
    // 5. Finalizar Log de Execução com sucesso
    $stmtFin = $db->prepare("
        UPDATE lead_sync_logs 
        SET finished_at = NOW(), status = 'SUCCESS', records_found = :found,
            records_imported = :imp, records_updated = :upd, records_duplicated = :dup, records_failed = :fail
        WHERE id = :id
    ");
    $stmtFin->execute([
        ':found' => $recordsFound,
        ':imp' => $recordsImported,
        ':upd' => $recordsUpdated,
        ':dup' => $recordsDuplicated,
        ':fail' => $recordsFailed,
        ':id' => $logId
    ]);
    
    echo "Sincronização executada com sucesso via Cron: $recordsImported inseridos, $recordsUpdated atualizados, $recordsDuplicated duplicados.\n";
    
} catch (Exception $e) {
    // 6. Finalizar Log em caso de erro catastrófico
    $stmtFin = $db->prepare("
        UPDATE lead_sync_logs 
        SET finished_at = NOW(), status = 'ERROR', error_message = :err
        WHERE id = :id
    ");
    $stmtFin->execute([
        ':err' => $e->getMessage(),
        ':id' => $logId
    ]);
    
    echo "Erro na sincronização via Cron: " . $e->getMessage() . "\n";
}
