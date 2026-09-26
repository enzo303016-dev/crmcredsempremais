<?php
// Cred Sempre + CRM - API de Relatórios e Indicadores (Fase 7.8)
header("Content-Type: application/json; charset=UTF-8");
require_once '../config/database.php';
$db = getDbConnection();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'summary';

// Filtros comuns
$periodo = $_GET['periodo'] ?? 'este_mes';
$vendedorId = $_GET['vendedor_id'] ?? 'ALL';
$bancoId = $_GET['banco_id'] ?? 'ALL';

// Construção de condições de data (exemplo básico seguro)
$dateCondition = "1=1";
if ($periodo === 'hoje') {
    $dateCondition = "DATE(created_at) = CURDATE()";
} elseif ($periodo === 'ontem') {
    $dateCondition = "DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
} elseif ($periodo === 'ultimos_7_dias') {
    $dateCondition = "created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
} elseif ($periodo === 'este_mes') {
    $dateCondition = "YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())";
} elseif ($periodo === 'mes_anterior') {
    $dateCondition = "YEAR(created_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH)) AND MONTH(created_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))";
} elseif ($periodo === 'este_ano') {
    $dateCondition = "YEAR(created_at) = YEAR(NOW())";
}

try {
    if ($action === 'summary' || $action === 'general') {
        // Leads count
        $stmtLeads = $db->query("SELECT COUNT(*) as total FROM leads WHERE $dateCondition");
        $leadsCount = $stmtLeads->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // Opportunities
        $stmtOpps = $db->query("SELECT COUNT(*) as total, COALESCE(SUM(valor), 0) as valor_total FROM opportunities WHERE $dateCondition");
        $opps = $stmtOpps->fetch(PDO::FETCH_ASSOC);

        // Contracts
        $stmtContracts = $db->query("SELECT COUNT(*) as total, COALESCE(SUM(valor), 0) as valor_total FROM contracts WHERE $dateCondition");
        $contracts = $stmtContracts->fetch(PDO::FETCH_ASSOC);

        // Commissions
        $stmtCommissions = $db->query("SELECT status, COALESCE(SUM(valor), 0) as total FROM commissions WHERE $dateCondition GROUP BY status");
        $commissionsData = $stmtCommissions->fetchAll(PDO::FETCH_ASSOC);

        $comissaoPrevista = 0;
        $comissaoAprovada = 0;
        foreach ($commissionsData as $c) {
            if ($c['status'] === 'Prevista') $comissaoPrevista += $c['total'];
            if ($c['status'] === 'Aprovada' || $c['status'] === 'Paga') $comissaoAprovada += $c['total'];
        }

        $producaoTotal = $contracts['valor_total'];
        $receita = $producaoTotal * 0.05;
        $despesas = 15400;
        $lucroLiquido = $receita - $despesas;
        $rentabilidade = $receita > 0 ? ($lucroLiquido / $receita) * 100 : 0;

        echo json_encode([
            'success' => true,
            'summary' => [
                'leads_recebidos' => intval($leadsCount),
                'oportunidades_total' => intval($opps['total']),
                'oportunidades_valor' => floatval($opps['valor_total']),
                'contratos_total' => intval($contracts['total']),
                'producao_total' => floatval($producaoTotal),
                'comissao_prevista' => floatval($comissaoPrevista),
                'comissao_aprovada' => floatval($comissaoAprovada),
                'receita' => floatval($receita),
                'despesas' => floatval($despesas),
                'lucro_liquido' => floatval($lucroLiquido),
                'rentabilidade' => floatval($rentabilidade)
            ]
        ]);
        exit;
    }

    if ($action === 'leads') {
        $stmt = $db->query("SELECT status, COUNT(*) as qtd FROM leads GROUP BY status");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'leads_report' => $data]);
        exit;
    }

    if ($action === 'opportunities') {
        $stmt = $db->query("SELECT stage, COUNT(*) as qtd, COALESCE(SUM(valor), 0) as valor FROM opportunities GROUP BY stage");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'opportunities_report' => $data]);
        exit;
    }

    if ($action === 'contracts' || $action === 'production') {
        $stmt = $db->query("SELECT * FROM contracts ORDER BY created_at DESC LIMIT 100");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'contracts_report' => $data]);
        exit;
    }

    if ($action === 'commissions') {
        $stmt = $db->query("SELECT status, COUNT(*) as qtd, COALESCE(SUM(valor), 0) as valor FROM commissions GROUP BY status");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'commissions_report' => $data]);
        exit;
    }

    if ($action === 'tasks') {
        $stmt = $db->query("SELECT status, prioridade, tipo, COUNT(*) as qtd FROM tasks GROUP BY status, prioridade, tipo");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'tasks_report' => $data]);
        exit;
    }

    if ($action === 'whatsapp') {
        $stmt = $db->query("SELECT status, COUNT(*) as qtd FROM whatsapp_conversations GROUP BY status");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'whatsapp_report' => $data]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Ação de relatório não encontrada.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
