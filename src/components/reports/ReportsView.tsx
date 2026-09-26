import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  FileText,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Table,
  FileCheck,
  TrendingUp,
  Percent,
  Wallet,
  UserCheck,
  Building,
  Package,
  CheckSquare,
  MessageSquare,
  LayoutDashboard
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  CommercialFunnelChart,
  ProductionPeriodChart,
  ProductionBySellerChart,
  CommissionsChart,
  FinancialOverviewChart,
  TasksChart,
  WhatsAppChart,
  EmptyChartState
} from './ReportCharts';

export const ReportsView: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'Administrador';

  // Filtros
  const [periodo, setPeriodo] = useState('este_mes');
  const [vendedorId, setVendedorId] = useState('ALL');
  const [bancoId, setBancoId] = useState('ALL');

  // Aba ativa
  const [activeTab, setActiveTab] = useState<'geral' | 'leads' | 'oportunidades' | 'contratos' | 'producao' | 'comissoes' | 'financeiro' | 'vendedores' | 'bancos' | 'produtos' | 'tarefas' | 'whatsapp'>('geral');

  // Estados para dados reais da API (sem mocks)
  const [summaryData, setSummaryData] = useState<any>(null);
  const [leadsReport, setLeadsReport] = useState<any[]>([]);
  const [oppsReport, setOppsReport] = useState<any[]>([]);
  const [contractsReport, setContractsReport] = useState<any[]>([]);
  const [productionReport, setProductionReport] = useState<any[]>([]);
  const [commissionsReport, setCommissionsReport] = useState<any[]>([]);
  const [financeReport, setFinanceReport] = useState<any[]>([]);
  const [sellersReport, setSellersReport] = useState<any[]>([]);
  const [banksReport, setBanksReport] = useState<any[]>([]);
  const [productsReport, setProductsReport] = useState<any[]>([]);
  const [tasksReport, setTasksReport] = useState<any[]>([]);
  const [whatsappReport, setWhatsappReport] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchApiData = async () => {
      try {
        setApiError(null);
        const res = await fetch(`/api/reports.php?action=summary&periodo=${periodo}&vendedor_id=${vendedorId}&banco_id=${bancoId}`);
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          throw new Error('Ambiente de preview sem suporte a PHP (Aguardando servidor de produção).');
        }
        const json = await res.json();
        if (json.success && json.summary && isMounted) {
          setSummaryData(json.summary);
        }
      } catch (err: any) {
        if (isMounted) setApiError(err.message);
      }
    };

    const fetchLeadsReport = async () => {
      try {
        const res = await fetch(`/api/reports.php?action=leads`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && Array.isArray(json.leads_report) && isMounted) {
            setLeadsReport(json.leads_report);
          }
        }
      } catch (e) {}
    };

    const fetchOppsReport = async () => {
      try {
        const res = await fetch(`/api/reports.php?action=opportunities`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && Array.isArray(json.opportunities_report) && isMounted) {
            setOppsReport(json.opportunities_report);
          }
        }
      } catch (e) {}
    };

    const fetchProductionReport = async () => {
      try {
        const res = await fetch(`/api/reports.php?action=production`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && Array.isArray(json.contracts_report) && isMounted) {
            setContractsReport(json.contracts_report);
            setProductionReport(json.contracts_report);
          }
        }
      } catch (e) {}
    };

    const fetchCommissionsReport = async () => {
      try {
        const res = await fetch(`/api/reports.php?action=commissions`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && Array.isArray(json.commissions_report) && isMounted) {
            setCommissionsReport(json.commissions_report);
          }
        }
      } catch (e) {}
    };

    const fetchFinanceReport = async () => {
      try {
        const res = await fetch(`/api/reports.php?action=finance`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && Array.isArray(json.finance_report) && isMounted) {
            setFinanceReport(json.finance_report);
          }
        }
      } catch (e) {}
    };

    const fetchSellersReport = async () => {
      try {
        const res = await fetch(`/api/reports.php?action=sellers`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && Array.isArray(json.sellers_report) && isMounted) {
            setSellersReport(json.sellers_report);
          }
        }
      } catch (e) {}
    };

    const fetchBanksReport = async () => {
      try {
        const res = await fetch(`/api/reports.php?action=banks`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && Array.isArray(json.banks_report) && isMounted) {
            setBanksReport(json.banks_report);
          }
        }
      } catch (e) {}
    };

    const fetchProductsReport = async () => {
      try {
        const res = await fetch(`/api/reports.php?action=products`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && Array.isArray(json.products_report) && isMounted) {
            setProductsReport(json.products_report);
          }
        }
      } catch (e) {}
    };

    const fetchTasksReport = async () => {
      try {
        const res = await fetch(`/api/reports.php?action=tasks`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && Array.isArray(json.tasks_report) && isMounted) {
            setTasksReport(json.tasks_report);
          }
        }
      } catch (e) {}
    };

    const fetchWhatsappReport = async () => {
      try {
        const res = await fetch(`/api/reports.php?action=whatsapp`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && json.whatsapp_report && isMounted) {
            setWhatsappReport(json.whatsapp_report);
          }
        }
      } catch (e) {}
    };

    fetchApiData();
    fetchLeadsReport();
    fetchOppsReport();
    fetchProductionReport();
    fetchCommissionsReport();
    fetchFinanceReport();
    fetchSellersReport();
    fetchBanksReport();
    fetchProductsReport();
    fetchTasksReport();
    fetchWhatsappReport();
    return () => { isMounted = false; };
  }, [periodo, vendedorId, bancoId]);

  // Cálculos de indicadores para tarefas e WhatsApp
  const totalTasks = Array.isArray(tasksReport) ? tasksReport.length : 0;
  const pendingTasks = Array.isArray(tasksReport) ? tasksReport.filter(t => t.status === 'Pendente' || t.status === 'pendente').length : 0;
  const completedTasks = Array.isArray(tasksReport) ? tasksReport.filter(t => t.status === 'Concluída' || t.status === 'concluida').length : 0;
  const overdueTasks = Array.isArray(tasksReport) ? tasksReport.filter(t => t.status === 'Atrasada' || t.status === 'atrasada').length : 0;

  const totalConversas = whatsappReport?.total_conversas !== undefined ? whatsappReport.total_conversas : '—';
  const conversasAbertas = whatsappReport?.conversas_abertas !== undefined ? whatsappReport.conversas_abertas : '—';
  const conversasEncerradas = whatsappReport?.conversas_encerradas !== undefined ? whatsappReport.conversas_encerradas : '—';

  // Preparação de dados para os 7 gráficos
  const funnelData = {
    leads: summaryData?.leads_recebidos !== undefined ? summaryData.leads_recebidos : '—',
    oportunidades: summaryData?.oportunidades_total !== undefined ? summaryData.oportunidades_total : '—',
    propostas: summaryData?.oportunidades_total !== undefined ? summaryData.oportunidades_total : '—',
    contratos: summaryData?.contratos_total !== undefined ? summaryData.contratos_total : '—',
    pagos: summaryData?.contratos_total !== undefined ? summaryData.contratos_total : '—',
  };
  const hasRealFunnelData = summaryData !== null && summaryData !== undefined && summaryData.leads_recebidos !== undefined;

  const totalProd = summaryData?.producao_total !== undefined ? summaryData.producao_total : '—';
  const hasRealProdData = summaryData !== null && summaryData !== undefined && summaryData.producao_total !== undefined;

  const sellersChartData = Array.isArray(sellersReport) ? sellersReport.map((s: any) => ({
    nome: s.nome || s.vendedor_nome || 'Vendedor',
    producao_total: Number(s.producao_total || 0),
    contratos_qtd: Number(s.contratos_qtd || 0)
  })) : [];
  const hasRealSellersData = sellersChartData.length > 0;

  const commissionData = {
    previstas: Number(summaryData?.comissao_prevista || 0),
    aprovadas: Number(summaryData?.comissao_aprovada || 0)
  };
  const hasRealCommissionData = summaryData !== null && summaryData !== undefined && (summaryData.comissao_prevista !== undefined || summaryData.comissao_aprovada !== undefined);

  const financeData = {
    receita: Number(summaryData?.receita || 0),
    despesas: Number(summaryData?.despesas || 0),
    comissoes: Number(summaryData?.comissao_aprovada || summaryData?.comissao_prevista || 0),
    lucro_liquido: Number(summaryData?.lucro_liquido || 0)
  };
  const hasRealFinanceData = summaryData !== null && summaryData !== undefined && summaryData.receita !== undefined;

  const taskData = {
    pendentes: pendingTasks,
    concluidas: completedTasks,
    atrasadas: overdueTasks
  };
  const hasRealTaskData = Array.isArray(tasksReport) && tasksReport.length > 0;

  const whatsappChartData = {
    conversas_abertas: conversasAbertas,
    conversas_encerradas: conversasEncerradas,
    mensagens_total: whatsappReport?.total_mensagens !== undefined ? whatsappReport.total_mensagens : (whatsappReport?.mensagens_enviadas !== undefined ? Number(whatsappReport.mensagens_enviadas || 0) + Number(whatsappReport.mensagens_recebidas || 0) : '—'),
    mensagens_enviadas: whatsappReport?.mensagens_enviadas !== undefined ? whatsappReport.mensagens_enviadas : '—',
    mensagens_recebidas: whatsappReport?.mensagens_recebidas !== undefined ? whatsappReport.mensagens_recebidas : '—'
  };
  const hasRealWhatsAppData = whatsappReport !== null && whatsappReport !== undefined && (whatsappReport.total_conversas !== undefined || whatsappReport.conversas_abertas !== undefined);

  // Helper comum para cabeçalho de PDF
  const createBasePDF = (title: string) => {
    const doc = new jsPDF() as any;
    const now = new Date();
    const dataHora = now.toLocaleString('pt-BR');

    doc.setFillColor(2, 40, 89); // #022859
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Cred Sempre +', 14, 16);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 150, 16, { align: 'right' });

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.text(`Data/Hora: ${dataHora}`, 14, 32);
    doc.text(`Usuário: ${currentUser?.name || 'Sistema'} (${currentUser?.role || 'Usuário'})`, 14, 38);
    doc.text(`Período: ${periodo === 'este_mes' ? 'Este Mês' : periodo === 'ultimos_7_dias' ? 'Últimos 7 dias' : 'Mês Anterior'}`, 120, 32);
    doc.text(`Vendedor / Banco: ${vendedorId === 'ALL' ? 'Todos' : vendedorId} / ${bancoId === 'ALL' ? 'Todos' : bancoId}`, 120, 38);

    return doc;
  };

  // Funções de Exportação PDF para cada relatório
  const handleExportPDF = () => {
    const doc = createBasePDF('Relatório Geral / Consolidado');
    const tableData = [
      ['Setor Comercial', 'Leads Recebidos', summaryData?.leads_recebidos !== undefined ? String(summaryData.leads_recebidos) : '—'],
      ['Setor Comercial', 'Oportunidades', summaryData?.oportunidades_total !== undefined ? String(summaryData.oportunidades_total) : '—'],
      ['Setor Comercial', 'Contratos Emitidos', summaryData?.contratos_total !== undefined ? String(summaryData.contratos_total) : '—'],
      ['Setor Comercial', 'Produção Total', summaryData?.producao_total !== undefined ? `R$ ${Number(summaryData.producao_total).toFixed(2)}` : '—'],
      ['Setor Financeiro', 'Comissão Prevista', summaryData?.comissao_prevista !== undefined ? `R$ ${Number(summaryData.comissao_prevista).toFixed(2)}` : '—'],
      ['Setor Financeiro', 'Comissão Aprovada', summaryData?.comissao_aprovada !== undefined ? `R$ ${Number(summaryData.comissao_aprovada).toFixed(2)}` : '—'],
      ['Setor Financeiro', 'Receita Estimada', summaryData?.receita !== undefined ? `R$ ${Number(summaryData.receita).toFixed(2)}` : '—'],
      ['Setor Financeiro', 'Lucro Líquido', summaryData?.lucro_liquido !== undefined ? `R$ ${Number(summaryData.lucro_liquido).toFixed(2)}` : '—'],
      ['Setor Operacional', 'Tarefas Pendentes', String(pendingTasks)],
      ['Setor Operacional', 'Tarefas Atrasadas', String(overdueTasks)],
      ['Setor Operacional', 'Conversas Abertas (WhatsApp)', String(conversasAbertas)],
      ['Setor Operacional', 'Conversas Encerradas (WhatsApp)', String(conversasEncerradas)],
    ];

    doc.autoTable({
      startY: 45,
      head: [['Setor', 'Indicador', 'Valor']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [3, 74, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didDrawPage: (data: any) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Cred Sempre + — Relatório Geral / Consolidado — Página ${data.pageNumber}`, 14, 290);
      }
    });
    doc.save(`relatorio_geral_consolidado_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportLeadsPDF = () => {
    const doc = createBasePDF('Relatório de Leads');
    const tableData = !Array.isArray(leadsReport) || leadsReport.length === 0 ? 
      [['Aguardando API PHP em produção', '—']] :
      leadsReport.map((item: any) => [item.status || 'Indefinido', String(item.qtd || 0)]);

    doc.autoTable({
      startY: 45,
      head: [['Status do Lead', 'Quantidade']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [3, 74, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didDrawPage: (data: any) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Cred Sempre + — Relatório de Leads — Página ${data.pageNumber}`, 14, 290);
      }
    });
    doc.save(`relatorio-leads-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportOppsPDF = () => {
    const doc = createBasePDF('Relatório de Oportunidades');
    const tableData = !Array.isArray(oppsReport) || oppsReport.length === 0 ? 
      [['Nenhuma oportunidade encontrada', '—', '—']] :
      oppsReport.map((item: any) => [item.stage || 'Indefinido', String(item.qtd || 0), `R$ ${Number(item.valor || 0).toFixed(2)}`]);

    doc.autoTable({
      startY: 45,
      head: [['Etapa / Estágio', 'Quantidade', 'Valor Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [3, 74, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      didDrawPage: (data: any) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Cred Sempre + — Relatório de Oportunidades — Página ${data.pageNumber}`, 14, 290);
      }
    });
    doc.save(`relatorio-oportunidades-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportContractsPDF = () => {
    const doc = createBasePDF('Relatório de Contratos');
    const tableData = !Array.isArray(contractsReport) || contractsReport.length === 0 ? 
      [['Nenhum contrato encontrado', '—', '—', '—', '—']] :
      contractsReport.map((c: any) => [c.numero_contrato || c.id || '—', c.cliente_nome || 'Cliente', c.banco_nome || 'Banco', c.status || 'Ativo', `R$ ${Number(c.valor || 0).toFixed(2)}`]);

    doc.autoTable({
      startY: 45,
      head: [['Nº Contrato', 'Cliente', 'Banco', 'Status', 'Valor']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [3, 74, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      didDrawPage: (data: any) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Cred Sempre + — Relatório de Contratos — Página ${data.pageNumber}`, 14, 290);
      }
    });
    doc.save(`relatorio-contratos-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportProductionPDF = () => {
    const doc = createBasePDF('Relatório de Produção');
    const tableData = !Array.isArray(productionReport) || productionReport.length === 0 ? 
      [['Nenhum registro encontrado', '—', '—', '—', '—']] :
      productionReport.map((p: any) => [p.numero_contrato || p.id || '—', p.cliente_nome || 'Cliente', p.banco_nome || 'Banco', p.status || 'Concluído', `R$ ${Number(p.valor || 0).toFixed(2)}`]);

    doc.autoTable({
      startY: 45,
      head: [['Identificador', 'Cliente / Convênio', 'Banco', 'Situação', 'Volume Produzido']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [3, 74, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      didDrawPage: (data: any) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Cred Sempre + — Relatório de Produção — Página ${data.pageNumber}`, 14, 290);
      }
    });
    doc.save(`relatorio-producao-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportCommissionsPDF = () => {
    const doc = createBasePDF('Relatório de Comissões');
    const tableData = !Array.isArray(commissionsReport) || commissionsReport.length === 0 ? 
      [['Nenhuma comissão encontrada', '—', '—', '—', '—']] :
      commissionsReport.map((comm: any) => [comm.contrato_id || comm.id || '—', comm.vendedor_nome || 'Vendedor', comm.banco_nome || 'Banco', comm.status || 'Prevista', `R$ ${Number(comm.valor || 0).toFixed(2)}`]);

    doc.autoTable({
      startY: 45,
      head: [['Contrato / Ref', 'Vendedor', 'Banco', 'Status Comissão', 'Valor da Comissão']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [3, 74, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      didDrawPage: (data: any) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Cred Sempre + — Relatório de Comissões — Página ${data.pageNumber}`, 14, 290);
      }
    });
    doc.save(`relatorio-comissoes-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportFinancePDF = () => {
    const doc = createBasePDF('Relatório Financeiro');
    const tableData = !Array.isArray(financeReport) || financeReport.length === 0 ? 
      [['Nenhum registro encontrado', '—', '—', '—']] :
      financeReport.map((fin: any) => [fin.descricao || fin.item || '—', fin.categoria || 'Geral', `R$ ${Number(fin.valor_previsto || 0).toFixed(2)}`, `R$ ${Number(fin.valor_realizado || fin.valor || 0).toFixed(2)}`]);

    doc.autoTable({
      startY: 45,
      head: [['Item / Descrição', 'Categoria', 'Valor Previsto', 'Valor Realizado']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [3, 74, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      didDrawPage: (data: any) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Cred Sempre + — Relatório Financeiro — Página ${data.pageNumber}`, 14, 290);
      }
    });
    doc.save(`relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportSellersPDF = () => {
    const doc = createBasePDF('Relatório de Vendedores');
    const tableData = !Array.isArray(sellersReport) || sellersReport.length === 0 ? 
      [['Nenhum vendedor encontrado', '—', '—', '—', '—', '—']] :
      sellersReport.map((seller: any) => [seller.nome || seller.vendedor_nome || '—', String(seller.leads_qtd || 0), String(seller.oportunidades_qtd || 0), String(seller.contratos_qtd || 0), `R$ ${Number(seller.producao_total || 0).toFixed(2)}`, `R$ ${Number(seller.comissoes_total || 0).toFixed(2)}`]);

    doc.autoTable({
      startY: 45,
      head: [['Vendedor', 'Leads', 'Oportunidades', 'Contratos', 'Produção Total', 'Comissões']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [3, 74, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      didDrawPage: (data: any) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Cred Sempre + — Relatório de Vendedores — Página ${data.pageNumber}`, 14, 290);
      }
    });
    doc.save(`relatorio-vendedores-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportBanksPDF = () => {
    const doc = createBasePDF('Relatório de Bancos');
    const tableData = !Array.isArray(banksReport) || banksReport.length === 0 ? 
      [['Nenhum banco encontrado', '—', '—', '—']] :
      banksReport.map((bank: any) => [bank.banco_nome || bank.nome || '—', String(bank.contratos_qtd || 0), `R$ ${Number(bank.producao_total || 0).toFixed(2)}`, `R$ ${Number(bank.comissoes_total || 0).toFixed(2)}`]);

    doc.autoTable({
      startY: 45,
      head: [['Banco / Instituição', 'Contratos', 'Volume Produzido', 'Comissões']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [3, 74, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      didDrawPage: (data: any) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Cred Sempre + — Relatório de Bancos — Página ${data.pageNumber}`, 14, 290);
      }
    });
    doc.save(`relatorio-bancos-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportProductsPDF = () => {
    const doc = createBasePDF('Relatório de Produtos');
    const tableData = !Array.isArray(productsReport) || productsReport.length === 0 ? 
      [['Nenhum produto encontrado', '—', '—', '—', '—']] :
      productsReport.map((prod: any) => [prod.produto_nome || prod.nome || '—', prod.banco_nome || '—', String(prod.contratos_qtd || 0), `R$ ${Number(prod.producao_total || 0).toFixed(2)}`, `R$ ${Number(prod.comissoes_total || 0).toFixed(2)}`]);

    doc.autoTable({
      startY: 45,
      head: [['Produto', 'Banco', 'Contratos', 'Volume Produzido', 'Comissões']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [3, 74, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      didDrawPage: (data: any) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Cred Sempre + — Relatório de Produtos — Página ${data.pageNumber}`, 14, 290);
      }
    });
    doc.save(`relatorio-produtos-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportTasksPDF = () => {
    const doc = createBasePDF('Relatório de Tarefas');
    const tableData = !Array.isArray(tasksReport) || tasksReport.length === 0 ? 
      [['Nenhuma tarefa encontrada', '—', '—', '—', '—', '—']] :
      tasksReport.map((t: any) => [t.titulo || t.tarefa || '—', t.responsavel || t.vendedor_nome || '—', t.cliente_nome || '—', t.prioridade || 'Normal', t.status || 'Pendente', t.data_limite || t.data || '—']);

    doc.autoTable({
      startY: 45,
      head: [['Tarefa / Assunto', 'Responsável', 'Cliente / Lead', 'Prioridade', 'Status', 'Data Limite']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [3, 74, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      didDrawPage: (data: any) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Cred Sempre + — Relatório de Tarefas — Página ${data.pageNumber}`, 14, 290);
      }
    });
    doc.save(`relatorio-tarefas-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportWhatsappPDF = () => {
    const doc = createBasePDF('Relatório de WhatsApp');
    const lines = whatsappReport && Array.isArray(whatsappReport.linhas) ? whatsappReport.linhas : [];
    const tableData = lines.length === 0 ? 
      [['Nenhum dado de WhatsApp encontrado', '—', '—', '—', '—']] :
      lines.map((w: any) => [w.numero || w.nome || '—', String(w.conversas_abertas || 0), String(w.conversas_encerradas || 0), String(w.mensagens_enviadas || 0), String(w.mensagens_recebidas || 0)]);

    doc.autoTable({
      startY: 45,
      head: [['Linha / Número WhatsApp', 'Conversas Abertas', 'Conversas Encerradas', 'Mensagens Enviadas', 'Mensagens Recebidas']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [3, 74, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      didDrawPage: (data: any) => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Cred Sempre + — Relatório de WhatsApp — Página ${data.pageNumber}`, 14, 290);
      }
    });
    doc.save(`relatorio-whatsapp-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Helper comum para exportação Excel (.xlsx real)
  const exportToExcel = (title: string, headers: string[], rows: any[][], fileName: string) => {
    const wb = XLSX.utils.book_new();
    const sheetData = [
      ['Cred Sempre +'],
      [`Relatório: ${title}`],
      [`Data/Hora: ${new Date().toLocaleString('pt-BR')}`],
      [`Usuário: ${currentUser?.name || 'Sistema'} (${currentUser?.role || 'Usuário'})`],
      [`Período: ${periodo === 'este_mes' ? 'Este Mês' : periodo === 'ultimos_7_dias' ? 'Últimos 7 dias' : 'Mês Anterior'}`],
      [`Vendedor / Banco: ${vendedorId === 'ALL' ? 'Todos' : vendedorId} / ${bancoId === 'ALL' ? 'Todos' : bancoId}`],
      [], // linha em branco
      headers,
      ...rows
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Configurar largura aproximada de colunas
    const colWidths = headers.map((h, i) => {
      let maxLen = h.length;
      rows.forEach(r => {
        const val = r[i] !== undefined && r[i] !== null ? String(r[i]) : '';
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(Math.max(maxLen + 4, 15), 50) };
    });
    ws['!cols'] = colWidths;

    const sheetName = title.replace(/[\/\?\\*:]/g, ' ').substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
  };

  // Funções de Exportação Excel (.xlsx) para cada relatório
  const handleExportExcel = () => {
    const tableData = [
      ['Setor Comercial', 'Leads Recebidos', summaryData?.leads_recebidos !== undefined ? String(summaryData.leads_recebidos) : '—'],
      ['Setor Comercial', 'Oportunidades', summaryData?.oportunidades_total !== undefined ? String(summaryData.oportunidades_total) : '—'],
      ['Setor Comercial', 'Contratos Emitidos', summaryData?.contratos_total !== undefined ? String(summaryData.contratos_total) : '—'],
      ['Setor Comercial', 'Produção Total', summaryData?.producao_total !== undefined ? `R$ ${Number(summaryData.producao_total).toFixed(2)}` : '—'],
      ['Setor Financeiro', 'Comissão Prevista', summaryData?.comissao_prevista !== undefined ? `R$ ${Number(summaryData.comissao_prevista).toFixed(2)}` : '—'],
      ['Setor Financeiro', 'Comissão Aprovada', summaryData?.comissao_aprovada !== undefined ? `R$ ${Number(summaryData.comissao_aprovada).toFixed(2)}` : '—'],
      ['Setor Financeiro', 'Receita Estimada', summaryData?.receita !== undefined ? `R$ ${Number(summaryData.receita).toFixed(2)}` : '—'],
      ['Setor Financeiro', 'Lucro Líquido', summaryData?.lucro_liquido !== undefined ? `R$ ${Number(summaryData.lucro_liquido).toFixed(2)}` : '—'],
      ['Setor Operacional', 'Tarefas Pendentes', String(pendingTasks)],
      ['Setor Operacional', 'Tarefas Atrasadas', String(overdueTasks)],
      ['Setor Operacional', 'Conversas Abertas (WhatsApp)', String(conversasAbertas)],
      ['Setor Operacional', 'Conversas Encerradas (WhatsApp)', String(conversasEncerradas)],
    ];
    exportToExcel('Relatório Geral / Consolidado', ['Setor', 'Indicador', 'Valor'], tableData, `relatorio_geral_consolidado_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportLeadsExcel = () => {
    const tableData = !Array.isArray(leadsReport) || leadsReport.length === 0 ? 
      [['Aguardando API PHP em produção', '—']] :
      leadsReport.map((item: any) => [item.status || 'Indefinido', String(item.qtd || 0)]);
    exportToExcel('Relatório de Leads', ['Status do Lead', 'Quantidade'], tableData, `relatorio-leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportOppsExcel = () => {
    const tableData = !Array.isArray(oppsReport) || oppsReport.length === 0 ? 
      [['Nenhuma oportunidade encontrada', '—', '—']] :
      oppsReport.map((item: any) => [item.stage || 'Indefinido', String(item.qtd || 0), `R$ ${Number(item.valor || 0).toFixed(2)}`]);
    exportToExcel('Relatório de Oportunidades', ['Etapa / Estágio', 'Quantidade', 'Valor Total'], tableData, `relatorio-oportunidades-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportContractsExcel = () => {
    const tableData = !Array.isArray(contractsReport) || contractsReport.length === 0 ? 
      [['Nenhum contrato encontrado', '—', '—', '—', '—']] :
      contractsReport.map((c: any) => [c.numero_contrato || c.id || '—', c.cliente_nome || 'Cliente', c.banco_nome || 'Banco', c.status || 'Ativo', `R$ ${Number(c.valor || 0).toFixed(2)}`]);
    exportToExcel('Relatório de Contratos', ['Nº Contrato', 'Cliente', 'Banco', 'Status', 'Valor'], tableData, `relatorio-contratos-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportProductionExcel = () => {
    const tableData = !Array.isArray(productionReport) || productionReport.length === 0 ? 
      [['Nenhum registro encontrado', '—', '—', '—', '—']] :
      productionReport.map((p: any) => [p.numero_contrato || p.id || '—', p.cliente_nome || 'Cliente', p.banco_nome || 'Banco', p.status || 'Concluído', `R$ ${Number(p.valor || 0).toFixed(2)}`]);
    exportToExcel('Relatório de Produção', ['Identificador', 'Cliente / Convênio', 'Banco', 'Situação', 'Volume Produzido'], tableData, `relatorio-producao-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportCommissionsExcel = () => {
    const tableData = !Array.isArray(commissionsReport) || commissionsReport.length === 0 ? 
      [['Nenhuma comissão encontrada', '—', '—', '—', '—']] :
      commissionsReport.map((comm: any) => [comm.contrato_id || comm.id || '—', comm.vendedor_nome || 'Vendedor', comm.banco_nome || 'Banco', comm.status || 'Prevista', `R$ ${Number(comm.valor || 0).toFixed(2)}`]);
    exportToExcel('Relatório de Comissões', ['Contrato / Ref', 'Vendedor', 'Banco', 'Status Comissão', 'Valor da Comissão'], tableData, `relatorio-comissoes-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportFinanceExcel = () => {
    const tableData = !Array.isArray(financeReport) || financeReport.length === 0 ? 
      [['Nenhum registro encontrado', '—', '—', '—']] :
      financeReport.map((fin: any) => [fin.descricao || fin.item || '—', fin.categoria || 'Geral', `R$ ${Number(fin.valor_previsto || 0).toFixed(2)}`, `R$ ${Number(fin.valor_realizado || fin.valor || 0).toFixed(2)}`]);
    exportToExcel('Relatório Financeiro', ['Item / Descrição', 'Categoria', 'Valor Previsto', 'Valor Realizado'], tableData, `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportSellersExcel = () => {
    const tableData = !Array.isArray(sellersReport) || sellersReport.length === 0 ? 
      [['Nenhum vendedor encontrado', '—', '—', '—', '—', '—']] :
      sellersReport.map((seller: any) => [seller.nome || seller.vendedor_nome || '—', String(seller.leads_qtd || 0), String(seller.oportunidades_qtd || 0), String(seller.contratos_qtd || 0), `R$ ${Number(seller.producao_total || 0).toFixed(2)}`, `R$ ${Number(seller.comissoes_total || 0).toFixed(2)}`]);
    exportToExcel('Relatório de Vendedores', ['Vendedor', 'Leads', 'Oportunidades', 'Contratos', 'Produção Total', 'Comissões'], tableData, `relatorio-vendedores-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportBanksExcel = () => {
    const tableData = !Array.isArray(banksReport) || banksReport.length === 0 ? 
      [['Nenhum banco encontrado', '—', '—', '—']] :
      banksReport.map((bank: any) => [bank.banco_nome || bank.nome || '—', String(bank.contratos_qtd || 0), `R$ ${Number(bank.producao_total || 0).toFixed(2)}`, `R$ ${Number(bank.comissoes_total || 0).toFixed(2)}`]);
    exportToExcel('Relatório de Bancos', ['Banco / Instituição', 'Contratos', 'Volume Produzido', 'Comissões'], tableData, `relatorio-bancos-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportProductsExcel = () => {
    const tableData = !Array.isArray(productsReport) || productsReport.length === 0 ? 
      [['Nenhum produto encontrado', '—', '—', '—', '—']] :
      productsReport.map((prod: any) => [prod.produto_nome || prod.nome || '—', prod.banco_nome || '—', String(prod.contratos_qtd || 0), `R$ ${Number(prod.producao_total || 0).toFixed(2)}`, `R$ ${Number(prod.comissoes_total || 0).toFixed(2)}`]);
    exportToExcel('Relatório de Produtos', ['Produto', 'Banco', 'Contratos', 'Volume Produzido', 'Comissões'], tableData, `relatorio-produtos-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportTasksExcel = () => {
    const tableData = !Array.isArray(tasksReport) || tasksReport.length === 0 ? 
      [['Nenhuma tarefa encontrada', '—', '—', '—', '—', '—']] :
      tasksReport.map((t: any) => [t.titulo || t.tarefa || '—', t.responsavel || t.vendedor_nome || '—', t.cliente_nome || '—', t.prioridade || 'Normal', t.status || 'Pendente', t.data_limite || t.data || '—']);
    exportToExcel('Relatório de Tarefas', ['Tarefa / Assunto', 'Responsável', 'Cliente / Lead', 'Prioridade', 'Status', 'Data Limite'], tableData, `relatorio-tarefas-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportWhatsappExcel = () => {
    const lines = whatsappReport && Array.isArray(whatsappReport.linhas) ? whatsappReport.linhas : [];
    const tableData = lines.length === 0 ? 
      [['Nenhum dado de WhatsApp encontrado', '—', '—', '—', '—']] :
      lines.map((w: any) => [w.numero || w.nome || '—', String(w.conversas_abertas || 0), String(w.conversas_encerradas || 0), String(w.mensagens_enviadas || 0), String(w.mensagens_recebidas || 0)]);
    exportToExcel('Relatório de WhatsApp', ['Linha / Número WhatsApp', 'Conversas Abertas', 'Conversas Encerradas', 'Mensagens Enviadas', 'Mensagens Recebidas'], tableData, `relatorio-whatsapp-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="bg-[#022859] text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#F2B807]" />
            Relatórios e Indicadores — Cred Sempre +
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Módulo consolidado de relatórios com exportação em PDF e Excel (.xlsx).
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'geral' && (
            <>
              <button onClick={handleExportPDF} className="bg-[#F2B807] hover:bg-[#d9a406] text-[#022859] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <Download className="w-4 h-4" /> Exportar PDF
              </button>
              <button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
              </button>
            </>
          )}
          {activeTab === 'leads' && (
            <>
              <button onClick={handleExportLeadsPDF} className="bg-[#F2B807] hover:bg-[#d9a406] text-[#022859] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <Download className="w-4 h-4" /> Exportar PDF
              </button>
              <button onClick={handleExportLeadsExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
              </button>
            </>
          )}
          {activeTab === 'oportunidades' && (
            <>
              <button onClick={handleExportOppsPDF} className="bg-[#F2B807] hover:bg-[#d9a406] text-[#022859] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <Download className="w-4 h-4" /> Exportar PDF
              </button>
              <button onClick={handleExportOppsExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
              </button>
            </>
          )}
          {activeTab === 'contratos' && (
            <>
              <button onClick={handleExportContractsPDF} className="bg-[#F2B807] hover:bg-[#d9a406] text-[#022859] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <Download className="w-4 h-4" /> Exportar PDF
              </button>
              <button onClick={handleExportContractsExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
              </button>
            </>
          )}
          {activeTab === 'producao' && (
            <>
              <button onClick={handleExportProductionPDF} className="bg-[#F2B807] hover:bg-[#d9a406] text-[#022859] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <Download className="w-4 h-4" /> Exportar PDF
              </button>
              <button onClick={handleExportProductionExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
              </button>
            </>
          )}
          {activeTab === 'comissoes' && (
            <>
              <button onClick={handleExportCommissionsPDF} className="bg-[#F2B807] hover:bg-[#d9a406] text-[#022859] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <Download className="w-4 h-4" /> Exportar PDF
              </button>
              <button onClick={handleExportCommissionsExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
              </button>
            </>
          )}
          {activeTab === 'financeiro' && (
            <>
              <button onClick={handleExportFinancePDF} className="bg-[#F2B807] hover:bg-[#d9a406] text-[#022859] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <Download className="w-4 h-4" /> Exportar PDF
              </button>
              <button onClick={handleExportFinanceExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
              </button>
            </>
          )}
          {activeTab === 'vendedores' && (
            <>
              <button onClick={handleExportSellersPDF} className="bg-[#F2B807] hover:bg-[#d9a406] text-[#022859] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <Download className="w-4 h-4" /> Exportar PDF
              </button>
              <button onClick={handleExportSellersExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
              </button>
            </>
          )}
          {activeTab === 'bancos' && (
            <>
              <button onClick={handleExportBanksPDF} className="bg-[#F2B807] hover:bg-[#d9a406] text-[#022859] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <Download className="w-4 h-4" /> Exportar PDF
              </button>
              <button onClick={handleExportBanksExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
              </button>
            </>
          )}
          {activeTab === 'produtos' && (
            <>
              <button onClick={handleExportProductsPDF} className="bg-[#F2B807] hover:bg-[#d9a406] text-[#022859] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <Download className="w-4 h-4" /> Exportar PDF
              </button>
              <button onClick={handleExportProductsExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
              </button>
            </>
          )}
          {activeTab === 'tarefas' && (
            <>
              <button onClick={handleExportTasksPDF} className="bg-[#F2B807] hover:bg-[#d9a406] text-[#022859] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <Download className="w-4 h-4" /> Exportar PDF
              </button>
              <button onClick={handleExportTasksExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
              </button>
            </>
          )}
          {activeTab === 'whatsapp' && (
            <>
              <button onClick={handleExportWhatsappPDF} className="bg-[#F2B807] hover:bg-[#d9a406] text-[#022859] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <Download className="w-4 h-4" /> Exportar PDF
              </button>
              <button onClick={handleExportWhatsappExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors">
                <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
              </button>
            </>
          )}
        </div>
      </div>

      {apiError && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Aviso do Preview: {apiError} (Dados reais serão carregados quando o servidor PHP estiver ativo em produção).</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setActiveTab('geral')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${activeTab === 'geral' ? 'bg-[#034AA6] text-white' : 'bg-white text-slate-700'}`}>Geral / Consolidado</button>
        <button onClick={() => setActiveTab('leads')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${activeTab === 'leads' ? 'bg-[#034AA6] text-white' : 'bg-white text-slate-700'}`}>Leads</button>
        <button onClick={() => setActiveTab('oportunidades')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${activeTab === 'oportunidades' ? 'bg-[#034AA6] text-white' : 'bg-white text-slate-700'}`}>Oportunidades</button>
        <button onClick={() => setActiveTab('contratos')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${activeTab === 'contratos' ? 'bg-[#034AA6] text-white' : 'bg-white text-slate-700'}`}>Contratos</button>
        <button onClick={() => setActiveTab('producao')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${activeTab === 'producao' ? 'bg-[#034AA6] text-white' : 'bg-white text-slate-700'}`}>Produção</button>
        <button onClick={() => setActiveTab('comissoes')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${activeTab === 'comissoes' ? 'bg-[#034AA6] text-white' : 'bg-white text-slate-700'}`}>Comissões</button>
        <button onClick={() => setActiveTab('financeiro')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${activeTab === 'financeiro' ? 'bg-[#034AA6] text-white' : 'bg-white text-slate-700'}`}>Financeiro</button>
        <button onClick={() => setActiveTab('vendedores')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${activeTab === 'vendedores' ? 'bg-[#034AA6] text-white' : 'bg-white text-slate-700'}`}>Vendedores</button>
        <button onClick={() => setActiveTab('bancos')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${activeTab === 'bancos' ? 'bg-[#034AA6] text-white' : 'bg-white text-slate-700'}`}>Bancos</button>
        <button onClick={() => setActiveTab('produtos')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${activeTab === 'produtos' ? 'bg-[#034AA6] text-white' : 'bg-white text-slate-700'}`}>Produtos</button>
        <button onClick={() => setActiveTab('tarefas')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${activeTab === 'tarefas' ? 'bg-[#034AA6] text-white' : 'bg-white text-slate-700'}`}>Tarefas</button>
        <button onClick={() => setActiveTab('whatsapp')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${activeTab === 'whatsapp' ? 'bg-[#034AA6] text-white' : 'bg-white text-slate-700'}`}>WhatsApp</button>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Período</label>
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="w-full bg-[#F2F2F2] border border-slate-200 rounded-xl p-2 text-xs text-[#022859] font-bold">
            <option value="este_mes">Este Mês</option>
            <option value="ultimos_7_dias">Últimos 7 dias</option>
            <option value="mes_anterior">Mês Anterior</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Vendedor</label>
          <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className="w-full bg-[#F2F2F2] border border-slate-200 rounded-xl p-2 text-xs text-[#022859] font-bold">
            <option value="ALL">Todos</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Banco</label>
          <select value={bancoId} onChange={(e) => setBancoId(e.target.value)} className="w-full bg-[#F2F2F2] border border-slate-200 rounded-xl p-2 text-xs text-[#022859] font-bold">
            <option value="ALL">Todos</option>
          </select>
        </div>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      {activeTab === 'geral' && (
        <div className="space-y-6">
          {/* 3 Blocos de Indicadores Visuais: Comercial, Financeiro, Operacional */}
          <div className="space-y-4">
            {/* Setor Comercial */}
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#034AA6]" />
                Indicadores Comerciais
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Leads</span>
                  <p className="text-xl font-extrabold text-[#022859] mt-1">{summaryData?.leads_recebidos !== undefined ? summaryData.leads_recebidos : '—'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Oportunidades</span>
                  <p className="text-xl font-extrabold text-[#034AA6] mt-1">{summaryData?.oportunidades_total !== undefined ? summaryData.oportunidades_total : '—'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Contratos</span>
                  <p className="text-xl font-extrabold text-emerald-600 mt-1">{summaryData?.contratos_total !== undefined ? summaryData.contratos_total : '—'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Produção Total</span>
                  <p className="text-xl font-extrabold text-[#022859] mt-1">{summaryData?.producao_total !== undefined ? `R$ ${Number(summaryData.producao_total).toFixed(2)}` : '—'}</p>
                </div>
              </div>
            </div>

            {/* Setor Financeiro */}
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#F2B807]" />
                Indicadores Financeiros
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Receita Estimada</span>
                  <p className="text-xl font-extrabold text-[#034AA6] mt-1">{summaryData?.receita !== undefined ? `R$ ${Number(summaryData.receita).toFixed(2)}` : '—'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Comissões Previstas</span>
                  <p className="text-xl font-extrabold text-amber-600 mt-1">{summaryData?.comissao_prevista !== undefined ? `R$ ${Number(summaryData.comissao_prevista).toFixed(2)}` : '—'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Comissões Aprovadas</span>
                  <p className="text-xl font-extrabold text-emerald-600 mt-1">{summaryData?.comissao_aprovada !== undefined ? `R$ ${Number(summaryData.comissao_aprovada).toFixed(2)}` : '—'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Lucro Líquido</span>
                  <p className="text-xl font-extrabold text-emerald-600 mt-1">{summaryData?.lucro_liquido !== undefined ? `R$ ${Number(summaryData.lucro_liquido).toFixed(2)}` : '—'}</p>
                </div>
              </div>
            </div>

            {/* Setor Operacional */}
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-slate-600" />
                Indicadores Operacionais
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Tarefas Pendentes</span>
                  <p className="text-xl font-extrabold text-amber-600 mt-1">{hasRealTaskData ? pendingTasks : '—'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Tarefas Atrasadas</span>
                  <p className="text-xl font-extrabold text-red-600 mt-1">{hasRealTaskData ? overdueTasks : '—'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">WhatsApp Abertas</span>
                  <p className="text-xl font-extrabold text-[#034AA6] mt-1">{hasRealWhatsAppData ? conversasAbertas : '—'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">WhatsApp Encerradas</span>
                  <p className="text-xl font-extrabold text-emerald-600 mt-1">{hasRealWhatsAppData ? conversasEncerradas : '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid dos 7 Gráficos da Fase 7.8 */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#034AA6]" />
              Painel de Gráficos e Distribuições
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CommercialFunnelChart data={funnelData} hasRealData={hasRealFunnelData} />
              <ProductionPeriodChart periodo={periodo} totalProducao={totalProd} hasRealData={hasRealProdData} />
              <ProductionBySellerChart sellers={sellersChartData} hasRealData={hasRealSellersData} />
              <CommissionsChart data={commissionData} hasRealData={hasRealCommissionData} />
              <FinancialOverviewChart data={financeData} hasRealData={hasRealFinanceData} />
              <TasksChart data={taskData} hasRealData={hasRealTaskData} />
              <div className="md:col-span-2">
                <WhatsAppChart data={whatsappChartData} hasRealData={hasRealWhatsAppData} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="space-y-6">
          <CommercialFunnelChart data={funnelData} hasRealData={hasRealFunnelData} />
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#022859] mb-4">Relatório Analítico de Leads</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-mono text-[10px] uppercase border-b">
                  <th className="p-2.5 text-left">Status</th>
                  <th className="p-2.5 text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {leadsReport.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2.5 font-bold">{item.status}</td>
                    <td className="p-2.5 text-right font-mono">{item.qtd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'oportunidades' && (
        <div className="space-y-6">
          <CommercialFunnelChart data={funnelData} hasRealData={hasRealFunnelData} />

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#022859] mb-4">Relatório Analítico de Oportunidades</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-mono text-[10px] uppercase border-b">
                  <th className="p-2.5 text-left">Etapa / Estágio</th>
                  <th className="p-2.5 text-center">Quantidade</th>
                  <th className="p-2.5 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {oppsReport.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2.5 font-bold">{item.stage}</td>
                    <td className="p-2.5 text-center font-mono">{item.qtd}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-600">R$ {Number(item.valor || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'contratos' && (
        <div className="space-y-6">
          <ProductionPeriodChart periodo={periodo} totalProducao={totalProd} hasRealData={hasRealProdData} />

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#022859] mb-4">Relatório de Contratos</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-mono text-[10px] uppercase border-b">
                  <th className="p-2.5 text-left">Nº Contrato</th>
                  <th className="p-2.5 text-left">Cliente</th>
                  <th className="p-2.5 text-left">Banco</th>
                  <th className="p-2.5 text-left">Status</th>
                  <th className="p-2.5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {contractsReport.map((c, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2.5 font-mono font-bold">{c.numero_contrato || c.id}</td>
                    <td className="p-2.5">{c.cliente_nome}</td>
                    <td className="p-2.5">{c.banco_nome}</td>
                    <td className="p-2.5 font-bold">{c.status}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-600">R$ {Number(c.valor || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'producao' && (
        <div className="space-y-6">
          <ProductionPeriodChart periodo={periodo} totalProducao={totalProd} hasRealData={hasRealProdData} />

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#022859] mb-4">Relatório de Produção</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-mono text-[10px] uppercase border-b">
                  <th className="p-2.5 text-left">Identificador</th>
                  <th className="p-2.5 text-left">Cliente</th>
                  <th className="p-2.5 text-left">Banco</th>
                  <th className="p-2.5 text-left">Situação</th>
                  <th className="p-2.5 text-right">Volume</th>
                </tr>
              </thead>
              <tbody>
                {productionReport.map((p, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2.5 font-mono">{p.numero_contrato || p.id}</td>
                    <td className="p-2.5">{p.cliente_nome}</td>
                    <td className="p-2.5">{p.banco_nome}</td>
                    <td className="p-2.5">{p.status}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-600">R$ {Number(p.valor || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'comissoes' && (
        <div className="space-y-6">
          <CommissionsChart data={commissionData} hasRealData={hasRealCommissionData} />

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#022859] mb-4">Relatório de Comissões</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-mono text-[10px] uppercase border-b">
                  <th className="p-2.5 text-left">Contrato</th>
                  <th className="p-2.5 text-left">Vendedor</th>
                  <th className="p-2.5 text-left">Banco</th>
                  <th className="p-2.5 text-left">Status</th>
                  <th className="p-2.5 text-right">Comissão</th>
                </tr>
              </thead>
              <tbody>
                {commissionsReport.map((comm, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2.5 font-mono">{comm.contrato_id}</td>
                    <td className="p-2.5">{comm.vendedor_nome}</td>
                    <td className="p-2.5">{comm.banco_nome}</td>
                    <td className="p-2.5">{comm.status}</td>
                    <td className="p-2.5 text-right font-mono text-amber-600">R$ {Number(comm.valor || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'financeiro' && (
        <div className="space-y-6">
          <FinancialOverviewChart data={financeData} hasRealData={hasRealFinanceData} />

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#022859] mb-4">Relatório Financeiro</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-mono text-[10px] uppercase border-b">
                  <th className="p-2.5 text-left">Descrição</th>
                  <th className="p-2.5 text-left">Categoria</th>
                  <th className="p-2.5 text-right">Previsto</th>
                  <th className="p-2.5 text-right">Realizado</th>
                </tr>
              </thead>
              <tbody>
                {financeReport.map((fin, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2.5 font-bold">{fin.descricao}</td>
                    <td className="p-2.5">{fin.categoria}</td>
                    <td className="p-2.5 text-right font-mono">R$ {Number(fin.valor_previsto || 0).toFixed(2)}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-600">R$ {Number(fin.valor_realizado || fin.valor || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'vendedores' && (
        <div className="space-y-6">
          <ProductionBySellerChart sellers={sellersChartData} hasRealData={hasRealSellersData} />

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#022859] mb-4">Relatório de Vendedores</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-mono text-[10px] uppercase border-b">
                  <th className="p-2.5 text-left">Vendedor</th>
                  <th className="p-2.5 text-center">Leads</th>
                  <th className="p-2.5 text-center">Oportunidades</th>
                  <th className="p-2.5 text-center">Contratos</th>
                  <th className="p-2.5 text-right">Produção</th>
                  <th className="p-2.5 text-right">Comissões</th>
                </tr>
              </thead>
              <tbody>
                {sellersReport.map((s, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2.5 font-bold">{s.nome}</td>
                    <td className="p-2.5 text-center font-mono">{s.leads_qtd}</td>
                    <td className="p-2.5 text-center font-mono">{s.oportunidades_qtd}</td>
                    <td className="p-2.5 text-center font-mono">{s.contratos_qtd}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-600">R$ {Number(s.producao_total || 0).toFixed(2)}</td>
                    <td className="p-2.5 text-right font-mono text-amber-600">R$ {Number(s.comissoes_total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'bancos' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#022859] mb-4">Relatório de Bancos</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-mono text-[10px] uppercase border-b">
                  <th className="p-2.5 text-left">Banco</th>
                  <th className="p-2.5 text-center">Contratos</th>
                  <th className="p-2.5 text-right">Produção</th>
                  <th className="p-2.5 text-right">Comissões</th>
                </tr>
              </thead>
              <tbody>
                {banksReport.map((b, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2.5 font-bold">{b.banco_nome}</td>
                    <td className="p-2.5 text-center font-mono">{b.contratos_qtd}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-600">R$ {Number(b.producao_total || 0).toFixed(2)}</td>
                    <td className="p-2.5 text-right font-mono text-amber-600">R$ {Number(b.comissoes_total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'produtos' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#022859] mb-4">Relatório de Produtos</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-mono text-[10px] uppercase border-b">
                  <th className="p-2.5 text-left">Produto</th>
                  <th className="p-2.5 text-left">Banco</th>
                  <th className="p-2.5 text-center">Contratos</th>
                  <th className="p-2.5 text-right">Produção</th>
                  <th className="p-2.5 text-right">Comissões</th>
                </tr>
              </thead>
              <tbody>
                {productsReport.map((pr, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2.5 font-bold">{pr.produto_nome}</td>
                    <td className="p-2.5">{pr.banco_nome}</td>
                    <td className="p-2.5 text-center font-mono">{pr.contratos_qtd}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-600">R$ {Number(pr.producao_total || 0).toFixed(2)}</td>
                    <td className="p-2.5 text-right font-mono text-amber-600">R$ {Number(pr.comissoes_total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tarefas' && (
        <div className="space-y-6">
          <TasksChart data={taskData} hasRealData={hasRealTaskData} />

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#022859] mb-4">Relatório de Tarefas</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-mono text-[10px] uppercase border-b">
                  <th className="p-2.5 text-left">Tarefa</th>
                  <th className="p-2.5 text-left">Responsável</th>
                  <th className="p-2.5 text-left">Cliente</th>
                  <th className="p-2.5 text-left">Prioridade</th>
                  <th className="p-2.5 text-left">Status</th>
                  <th className="p-2.5 text-right">Data Limite</th>
                </tr>
              </thead>
              <tbody>
                {tasksReport.map((t, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2.5 font-bold">{t.titulo || t.tarefa}</td>
                    <td className="p-2.5">{t.responsavel || t.vendedor_nome}</td>
                    <td className="p-2.5">{t.cliente_nome}</td>
                    <td className="p-2.5">{t.prioridade}</td>
                    <td className="p-2.5 font-bold">{t.status}</td>
                    <td className="p-2.5 text-right font-mono">{t.data_limite || t.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          <WhatsAppChart data={whatsappChartData} hasRealData={hasRealWhatsAppData} />

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#022859] mb-4">Relatório de WhatsApp</h3>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-mono text-[10px] uppercase border-b">
                  <th className="p-2.5 text-left">Linha / Número</th>
                  <th className="p-2.5 text-center">Abertas</th>
                  <th className="p-2.5 text-center">Encerradas</th>
                  <th className="p-2.5 text-right">Enviadas</th>
                  <th className="p-2.5 text-right">Recebidas</th>
                </tr>
              </thead>
              <tbody>
                {whatsappReport && Array.isArray(whatsappReport.linhas) && whatsappReport.linhas.map((w: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2.5 font-bold">{w.numero || w.nome}</td>
                    <td className="p-2.5 text-center font-mono">{w.conversas_abertas}</td>
                    <td className="p-2.5 text-center font-mono">{w.conversas_encerradas}</td>
                    <td className="p-2.5 text-right font-mono">{w.mensagens_enviadas}</td>
                    <td className="p-2.5 text-right font-mono">{w.mensagens_recebidas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
