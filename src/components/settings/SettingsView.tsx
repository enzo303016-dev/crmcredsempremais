import React, { useState } from 'react';
import { apiService } from '../../services/apiService';
import { MYSQL_SCHEMA_SQL, PHP_FILES_STRUCTURE } from '../../utils/exportPHP';
import { formatDate } from '../../utils/formatters';
import { LeadsIntegrationView } from './LeadsIntegrationView';
import {
  Settings,
  Database,
  Code2,
  FileCode,
  Copy,
  Check,
  Download,
  Activity,
  Search,
  ShieldCheck,
  Server,
  Terminal,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'sql' | 'php' | 'audit' | 'leads_integration'>('system');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedPhpFile, setCopiedPhpFile] = useState<string | null>(null);
  const [selectedPhpFileIndex, setSelectedPhpFileIndex] = useState<number>(0);
  const [auditSearch, setAuditSearch] = useState('');

  const auditLogs = apiService.getAuditLogs();

  const handleCopySql = () => {
    navigator.clipboard.writeText(MYSQL_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadSql = () => {
    const element = document.createElement('a');
    const file = new Blob([MYSQL_SCHEMA_SQL], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'credsempre_crm_schema_fase1.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyPhp = (path: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedPhpFile(path);
    setTimeout(() => setCopiedPhpFile(null), 2000);
  };

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.user_name.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.description.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.module.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-extrabold text-white">Configurações & Instalação Backend</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Exporte o banco MySQL, arquivos PHP REST e audite os registros de segurança do sistema.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('system')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'system'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sistema
          </button>
          <button
            onClick={() => setActiveTab('leads_integration')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'leads_integration'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Integração de Leads 🔄
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'sql'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Banco MySQL (SQL)
          </button>
          <button
            onClick={() => setActiveTab('php')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'php'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            API PHP REST
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Auditoria ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* Tab Content: System Info */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <Server className="w-6 h-6 text-emerald-400 mb-2" />
              <h3 className="text-sm font-bold text-white">Ambiente do Servidor</h3>
              <p className="text-xs text-slate-400 mt-1">PHP 8.2+ • PDO MySQL • Apache Mod_Rewrite</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <ShieldCheck className="w-6 h-6 text-blue-400 mb-2" />
              <h3 className="text-sm font-bold text-white">Criptografia & Senhas</h3>
              <p className="text-xs text-slate-400 mt-1">password_hash BCRYPT • Validação RBAC</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <Database className="w-6 h-6 text-purple-400 mb-2" />
              <h3 className="text-sm font-bold text-white">Estrutura SQL</h3>
              <p className="text-xs text-slate-400 mt-1">7 Tabelas com Relacionamentos e Audit Logs</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3">Guia de Implantação em Servidor PHP / cPanel</h3>
            <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside">
              <li>Crie um banco de dados MySQL em seu provedor de hospedagem (e.g. cPanel, Hostinger, AWS).</li>
              <li>Acesse a aba <strong>"Banco MySQL (SQL)"</strong> acima e execute o script na ferramenta phpMyAdmin.</li>
              <li>Acesse a aba <strong>"API PHP REST"</strong>, copie os arquivos e insira as credenciais no arquivo <code className="text-emerald-400 font-mono">config/database.php</code>.</li>
              <li>Realize o build do frontend React e envie os arquivos estáticos compilados para a pasta pública do seu servidor.</li>
            </ol>
          </div>
        </div>
      )}

      {/* Tab Content: MySQL Schema */}
      {activeTab === 'sql' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Script SQL de Inicialização (schema.sql)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Tabelas: users, roles, permissions, role_permissions, user_permissions, sessions, audit_logs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySql}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
              </button>

              <button
                onClick={handleDownloadSql}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar .SQL</span>
              </button>
            </div>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl text-[11px] text-slate-300 font-mono overflow-x-auto max-h-[500px] border border-slate-800/80 selection:bg-emerald-500/30">
            {MYSQL_SCHEMA_SQL}
          </pre>
        </div>
      )}

      {/* Tab Content: PHP REST API */}
      {activeTab === 'php' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>Código-Fonte dos Endpoints PHP REST</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                A estrutura backend inclui PDO, validação de sessão e registro de auditoria.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleCopyPhp(
                    PHP_FILES_STRUCTURE[selectedPhpFileIndex].path,
                    PHP_FILES_STRUCTURE[selectedPhpFileIndex].content
                  )
                }
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedPhpFile === PHP_FILES_STRUCTURE[selectedPhpFileIndex].path ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>
                  {copiedPhpFile === PHP_FILES_STRUCTURE[selectedPhpFileIndex].path
                    ? 'Copiado!'
                    : 'Copiar Arquivo Atual'}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* File List */}
            <div className="space-y-1 bg-slate-950 p-2 rounded-xl border border-slate-800/80">
              {PHP_FILES_STRUCTURE.map((file, idx) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedPhpFileIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer ${
                    selectedPhpFileIndex === idx
                      ? 'bg-slate-800 text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.path}</span>
                </button>
              ))}
            </div>

            {/* Code View */}
            <div className="md:col-span-3">
              <div className="bg-slate-950 p-2 px-3 rounded-t-xl border border-b-0 border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{PHP_FILES_STRUCTURE[selectedPhpFileIndex].path}</span>
                <span>PHP 8.x PDO</span>
              </div>
              <pre className="bg-slate-950 p-4 rounded-b-xl text-[11px] text-slate-300 font-mono overflow-x-auto max-h-[450px] border border-slate-800/80">
                {PHP_FILES_STRUCTURE[selectedPhpFileIndex].content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Histórico Completo de Auditoria (audit_logs)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Registro imutável de ações: login, alterações de dados, permissões e status.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Filtrar por usuário ou ação..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-3 py-3">Data / Hora</th>
                  <th className="px-3 py-3">Usuário</th>
                  <th className="px-3 py-3">Ação</th>
                  <th className="px-3 py-3">Módulo</th>
                  <th className="px-3 py-3">Descrição</th>
                  <th className="px-3 py-3 font-right">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-200 whitespace-nowrap">
                      {log.user_name}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 bg-slate-800 text-emerald-400 font-mono text-[10px] font-semibold rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">{log.module}</td>
                    <td className="px-3 py-2.5 text-slate-300 max-w-md">{log.description}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Google Sheets Lead Integration */}
      {activeTab === 'leads_integration' && <LeadsIntegrationView />}
    </div>
  );
};
