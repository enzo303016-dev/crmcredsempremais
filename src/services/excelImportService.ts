import * as XLSX from 'xlsx';
import {
  Bank,
  Product,
  Agreement,
  CommissionRule,
  CommissionType,
  SellerCommissionType,
  ExcelSheetInfo,
  ParsedExcelRuleRow,
  ExcelImportValidationResult,
  RuleConflictInfo,
} from '../types/crm';

// Normalize string for fuzzy matching (removes accents, lowercase, extra whitespace)
export const normalizeText = (str?: string | null): string => {
  if (!str) return '';
  return str
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ');
};

// Match bank by name or alias
export const findMatchingBank = (rawName: string, banks: Bank[]): Bank | undefined => {
  if (!rawName) return undefined;
  const normRaw = normalizeText(rawName);

  return banks.find((b) => {
    const normBank = normalizeText(b.nome);
    if (normBank === normRaw) return true;
    if (normBank.includes(normRaw) || normRaw.includes(normBank)) return true;
    if (normRaw.includes('itau') && normBank.includes('itau')) return true;
    if (normRaw.includes('pan') && normBank.includes('pan')) return true;
    if (normRaw.includes('bmg') && normBank.includes('bmg')) return true;
    if (normRaw.includes('safra') && normBank.includes('safra')) return true;
    if (normRaw.includes('bradesco') && normBank.includes('bradesco')) return true;
    if (normRaw.includes('santander') && normBank.includes('santander')) return true;
    if (normRaw.includes('facta') && normBank.includes('facta')) return true;
    if (normRaw.includes('c6') && normBank.includes('c6')) return true;
    if (normRaw.includes('daycoval') && normBank.includes('daycoval')) return true;
    return false;
  });
};

// Match product within a bank
export const findMatchingProduct = (rawName: string, bankId: string, products: Product[]): Product | undefined => {
  if (!rawName) return undefined;
  const normRaw = normalizeText(rawName);
  const bankProducts = products.filter((p) => p.banco_id === bankId);

  return bankProducts.find((p) => {
    const normProd = normalizeText(p.nome);
    if (normProd === normRaw) return true;
    if (normProd.includes(normRaw) || normRaw.includes(normProd)) return true;
    if (normRaw.includes('consignado') && normProd.includes('consignado')) return true;
    if (normRaw.includes('fgts') && normProd.includes('fgts')) return true;
    if (normRaw.includes('rmc') && normProd.includes('rmc')) return true;
    if (normRaw.includes('rcc') && normProd.includes('rcc')) return true;
    if (normRaw.includes('pessoal') && normProd.includes('pessoal')) return true;
    if (normRaw.includes('veiculo') && normProd.includes('veiculo')) return true;
    if (normRaw.includes('imovel') && normProd.includes('imovel')) return true;
    return false;
  });
};

// Match agreement within a product
export const findMatchingAgreement = (rawName: string, productId: string, agreements: Agreement[]): Agreement | undefined => {
  if (!rawName || rawName.trim() === '' || rawName === '-' || rawName.toLowerCase() === 'geral' || rawName.toLowerCase() === 'todos' || rawName.toLowerCase().includes('todos os convenios')) {
    return undefined;
  }
  const normRaw = normalizeText(rawName);
  const prodAgreements = agreements.filter((a) => a.produto_id === productId);

  return prodAgreements.find((a) => {
    const normAgree = normalizeText(a.nome);
    if (normAgree === normRaw) return true;
    if (normAgree.includes(normRaw) || normRaw.includes(normAgree)) return true;
    if (normRaw.includes('inss') && normAgree.includes('inss')) return true;
    if (normRaw.includes('siape') && normAgree.includes('siape')) return true;
    if (normRaw.includes('exercito') && normAgree.includes('exercito')) return true;
    if (normRaw.includes('marinha') && normAgree.includes('marinha')) return true;
    if (normRaw.includes('aeronautica') && normAgree.includes('aeronautica')) return true;
    if (normRaw.includes('clt') && normAgree.includes('clt')) return true;
    return false;
  });
};

// Parse flexible number (Brazilian format: 1.234,56 or standard 1234.56, percentage 6%)
export const parseNumberSafe = (val: any, fallback = 0): number => {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;

  let str = val.toString().trim();
  str = str.replace(/R\$/gi, '').replace(/%/g, '').trim();

  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? fallback : parsed;
};

// Parse flexible plazo range
export const parsePrazoRange = (prazoRaw: any, prazoMinRaw: any, prazoMaxRaw: any): { min: number; max: number } => {
  if (prazoMinRaw !== undefined && prazoMinRaw !== '' && prazoMaxRaw !== undefined && prazoMaxRaw !== '') {
    const min = Math.max(1, Math.round(parseNumberSafe(prazoMinRaw, 1)));
    const max = Math.max(min, Math.round(parseNumberSafe(prazoMaxRaw, 84)));
    return { min, max };
  }

  if (prazoRaw !== undefined && prazoRaw !== '') {
    const str = prazoRaw.toString().trim();
    const matchRange = str.match(/(\d+)\s*(?:a|ate|-|to)\s*(\d+)/i);
    if (matchRange) {
      const min = Math.max(1, parseInt(matchRange[1], 10));
      const max = Math.max(min, parseInt(matchRange[2], 10));
      return { min, max };
    }
    const single = Math.max(1, Math.round(parseNumberSafe(str, 84)));
    return { min: single, max: single };
  }

  return { min: 1, max: 84 };
};

// Parse flexible valor range
export const parseValorRange = (valMinRaw: any, valMaxRaw: any): { min: number; max: number } => {
  const min = Math.max(0, parseNumberSafe(valMinRaw, 0));
  const max = Math.max(min, parseNumberSafe(valMaxRaw, 1000000));
  return { min, max };
};

// Parse bank commission type and value
export const parseBankCommission = (
  tipoRaw: any,
  valorRaw: any
): { tipo: CommissionType; valor: number } => {
  const valNum = parseNumberSafe(valorRaw, 0);
  const tipoStr = (tipoRaw || '').toString().toLowerCase();

  if (tipoStr.includes('fix') || tipoStr.includes('r$') || tipoStr.includes('reais') || tipoStr.includes('valor')) {
    return { tipo: 'FIXA', valor: valNum };
  }
  return { tipo: 'PERCENTUAL', valor: valNum };
};

// Parse seller commission type and value
export const parseSellerCommission = (
  tipoRaw: any,
  valorRaw: any
): { tipo: SellerCommissionType; valor: number } => {
  const valNum = parseNumberSafe(valorRaw, 0);
  const tipoStr = (tipoRaw || '').toString().toLowerCase();

  if (tipoStr.includes('fix') || tipoStr.includes('r$') || tipoStr.includes('reais')) {
    return { tipo: 'FIXA', valor: valNum };
  }
  if (tipoStr.includes('operacao') || tipoStr.includes('contrato') || tipoStr.includes('total') || tipoStr.includes('producao')) {
    return { tipo: 'PERCENTUAL_DA_OPERACAO', valor: valNum };
  }
  return { tipo: 'PERCENTUAL_DO_BANCO', valor: valNum };
};

// Parse date string (DD/MM/YYYY, YYYY-MM-DD or Excel date)
export const parseDateSafe = (val: any): string | null => {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }
  const str = val.toString().trim();
  if (!str) return null;

  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    const year = brMatch[3];
    return `${year}-${month}-${day}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }

  return null;
};

export class ExcelImportService {
  /**
   * Parse an uploaded Excel file (.xlsx or .xls) and validate its rows against CRM entities,
   * detecting duplicates, entity mismatches, and rule conflicts.
   */
  public async parseExcelFile(
    file: File,
    banks: Bank[],
    products: Product[],
    agreements: Agreement[],
    existingRules: CommissionRule[] = []
  ): Promise<ExcelImportValidationResult> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

    const sheetsInfo: ExcelSheetInfo[] = [];
    const validRows: ParsedExcelRuleRow[] = [];
    const invalidRows: ParsedExcelRuleRow[] = [];
    const duplicateRows: ParsedExcelRuleRow[] = [];
    const conflictRows: ParsedExcelRuleRow[] = [];
    const newValidRows: ParsedExcelRuleRow[] = [];

    const unresolvedBanksSet = new Set<string>();
    const unresolvedProductsMap = new Map<string, { banco: string; produto: string }>();
    const unresolvedAgreementsMap = new Map<string, { banco: string; produto: string; convenio: string }>();

    let totalRowsCount = 0;
    const seenExcelRuleKeys = new Set<string>();

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
        defval: '',
        raw: false,
      });

      let sheetValidCount = 0;
      let sheetInvalidCount = 0;

      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        const rowNumber = i + 2;
        totalRowsCount++;

        const findCol = (...aliases: string[]) => {
          for (const alias of aliases) {
            const normAlias = normalizeText(alias);
            for (const key of Object.keys(row)) {
              if (normalizeText(key) === normAlias) {
                return row[key];
              }
            }
          }
          return undefined;
        };

        const rawBancoCol = findCol('Banco', 'Instituição', 'Instituicao', 'Banco Parceiro', 'Bank');
        const rawBanco = (rawBancoCol !== undefined && String(rawBancoCol).trim() !== '') ? String(rawBancoCol).trim() : sheetName.trim();

        const rawProduto = String(findCol('Produto', 'Linha de Crédito', 'Linha de Credito', 'Modalidade', 'Product') || '').trim();
        const rawConvenio = String(findCol('Convênio', 'Convenio', 'Órgão', 'Orgao', 'Sub-Produto', 'Agreement') || '').trim();

        const rawPrazo = findCol('Prazo', 'Prazo (Meses)', 'Meses', 'Parcelas');
        const rawPrazoMin = findCol('Prazo Mínimo', 'Prazo Minimo', 'Prazo Min', 'Min Prazo');
        const rawPrazoMax = findCol('Prazo Máximo', 'Prazo Maximo', 'Prazo Max', 'Max Prazo');

        const rawValorMin = findCol('Valor Mínimo', 'Valor Minimo', 'Valor Min', 'Min Valor', 'Faixa De');
        const rawValorMax = findCol('Valor Máximo', 'Valor Maximo', 'Valor Max', 'Max Valor', 'Faixa Até', 'Faixa Ate');

        const rawTipoComissaoBanco = findCol('Tipo Comissão Banco', 'Tipo Comissao Banco', 'Tipo Banco', 'Tipo Comissão', 'Tipo Comissao');
        const rawComissaoBanco = findCol('Comissão Banco', 'Comissao Banco', 'Taxa Banco', '% Banco', 'Comissão', 'Comissao');

        const rawTipoComissaoVendedor = findCol('Tipo Comissão Vendedor', 'Tipo Comissao Vendedor', 'Tipo Vendedor', 'Tipo Repasse');
        const rawComissaoVendedor = findCol('Comissão Vendedor', 'Comissao Vendedor', 'Taxa Vendedor', '% Vendedor', 'Repasse Vendedor', 'Comissão Corretor');

        const rawVigenciaInicio = findCol('Vigência Inicial', 'Vigencia Inicial', 'Data Início', 'Data Inicio', 'Vigência De', 'Vigencia De');
        const rawVigenciaFim = findCol('Vigência Final', 'Vigencia Final', 'Data Fim', 'Data Termino', 'Data Término', 'Vigência Até', 'Vigencia Ate');
        const rawObservacoes = findCol('Observações', 'Observacoes', 'Obs', 'Notas');

        // Skip completely blank rows
        if (!rawBanco && !rawProduto && !rawComissaoBanco) {
          continue;
        }

        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. Resolve Bank (Priority 1: Banco col, Priority 2: Sheet Name)
        const matchedBank = findMatchingBank(rawBanco, banks);
        if (!matchedBank) {
          errors.push(`Banco "${rawBanco}" não encontrado no cadastro do CRM.`);
          unresolvedBanksSet.add(rawBanco);
        }

        // 2. Resolve Product (Must exist for the bank)
        let matchedProduct: Product | undefined;
        if (matchedBank) {
          if (!rawProduto) {
            errors.push(`Coluna Produto está vazia para o banco "${matchedBank.nome}".`);
          } else {
            matchedProduct = findMatchingProduct(rawProduto, matchedBank.id, products);
            if (!matchedProduct) {
              errors.push(`Produto "${rawProduto}" não cadastrado para o banco "${matchedBank.nome}".`);
              const key = `${matchedBank.nome}:::${rawProduto}`;
              unresolvedProductsMap.set(key, { banco: matchedBank.nome, produto: rawProduto });
            }
          }
        } else if (rawProduto) {
          const key = `${rawBanco}:::${rawProduto}`;
          unresolvedProductsMap.set(key, { banco: rawBanco, produto: rawProduto });
        }

        // 3. Resolve Agreement (Convênio)
        let matchedAgreement: Agreement | undefined;
        let isGeneralAgreement = false;

        const isConvenioBlank = !rawConvenio || rawConvenio.trim() === '' || rawConvenio === '-' || rawConvenio.toLowerCase() === 'geral' || rawConvenio.toLowerCase() === 'todos' || rawConvenio.toLowerCase().includes('todos os convenios');

        if (isConvenioBlank) {
          isGeneralAgreement = true;
          matchedAgreement = undefined;
        } else if (matchedBank && matchedProduct) {
          matchedAgreement = findMatchingAgreement(rawConvenio, matchedProduct.id, agreements);
          if (!matchedAgreement) {
            errors.push(`Convênio "${rawConvenio}" não encontrado para o produto "${matchedProduct.nome}".`);
            const aKey = `${matchedBank.nome}:::${matchedProduct.nome}:::${rawConvenio}`;
            unresolvedAgreementsMap.set(aKey, { banco: matchedBank.nome, produto: matchedProduct.nome, convenio: rawConvenio });
          }
        }

        // 4. Resolve Prazos & Valors
        const { min: prazoMin, max: prazoMax } = parsePrazoRange(rawPrazo, rawPrazoMin, rawPrazoMax);
        const { min: valorMin, max: valorMax } = parseValorRange(rawValorMin, rawValorMax);

        if (prazoMin <= 0 || prazoMax <= 0 || prazoMin > prazoMax) {
          errors.push(`Faixa de prazo inválida: ${prazoMin} a ${prazoMax} parcelas.`);
        }

        if (valorMin < 0 || valorMax < 0 || valorMin > valorMax) {
          errors.push(`Faixa de valor inválida: R$ ${valorMin} a R$ ${valorMax}.`);
        }

        // 5. Resolve Commissions
        const bankComm = parseBankCommission(rawTipoComissaoBanco, rawComissaoBanco);
        const vendComm = parseSellerCommission(rawTipoComissaoVendedor, rawComissaoVendedor);

        if (bankComm.valor < 0) {
          errors.push('Comissão do banco não pode ser negativa.');
        }

        if (vendComm.valor < 0) {
          errors.push('Comissão do vendedor não pode ser negativa.');
        }

        const dataInicio = parseDateSafe(rawVigenciaInicio);
        const dataTermino = parseDateSafe(rawVigenciaFim);

        const isValid = errors.length === 0;

        let isDuplicate = false;
        let hasConflict = false;
        let statusTag: 'NOVA' | 'DUPLICADA' | 'CONFLITO' | 'INVALIDA' | 'ENTIDADE_INEXISTENTE' = 'NOVA';
        let matchedExistingRule: CommissionRule | undefined;
        let conflictInfo: RuleConflictInfo | undefined;

        if (!isValid) {
          statusTag = (!matchedBank || !matchedProduct || (!isGeneralAgreement && !matchedAgreement))
            ? 'ENTIDADE_INEXISTENTE'
            : 'INVALIDA';
        } else if (matchedBank && matchedProduct) {
          // Check for Duplicity & Conflict against existing rules in CRM
          const resolvedConvenioId = isGeneralAgreement ? null : (matchedAgreement?.id || null);

          // Find existing rule with matching match-criteria
          const existingMatch = existingRules.find((er) => {
            const sameBank = er.banco_id === matchedBank.id;
            const sameProd = er.produto_id === matchedProduct.id;
            const sameAgree = (er.convenio_id || null) === resolvedConvenioId;
            const samePrazo = er.prazo_min === prazoMin && er.prazo_max === prazoMax;
            const sameValor = er.valor_min === valorMin && er.valor_max === valorMax;
            const sameInicio = (er.data_inicio || null) === (dataInicio || null);
            const sameTermino = (er.data_termino || null) === (dataTermino || null);

            return sameBank && sameProd && sameAgree && samePrazo && sameValor && sameInicio && sameTermino;
          });

          // Also check duplicity within current file
          const excelKey = `${matchedBank.id}:::${matchedProduct.id}:::${resolvedConvenioId}:::${prazoMin}:::${prazoMax}:::${valorMin}:::${valorMax}:::${dataInicio}:::${dataTermino}`;
          const isDuplicatedInFile = seenExcelRuleKeys.has(excelKey);
          seenExcelRuleKeys.add(excelKey);

          if (existingMatch || isDuplicatedInFile) {
            matchedExistingRule = existingMatch;

            if (existingMatch) {
              const existingBankTipo = existingMatch.tipo_comissao_banco || existingMatch.tipo_comissao;
              const existingBankVal = existingMatch.valor_comissao_banco ?? existingMatch.valor_comissao;
              const existingVendTipo = existingMatch.tipo_comissao_vendedor;
              const existingVendVal = existingMatch.valor_comissao_vendedor;

              const isBankIdentical = existingBankTipo === bankComm.tipo && existingBankVal === bankComm.valor;
              const isVendIdentical = existingVendTipo === vendComm.tipo && existingVendVal === vendComm.valor;

              if (isBankIdentical && isVendIdentical) {
                // Exact Duplicate
                isDuplicate = true;
                statusTag = 'DUPLICADA';
                warnings.push('DUPLICADA — já cadastrada no CRM e não será importada.');
              } else {
                // Conflict
                hasConflict = true;
                statusTag = 'CONFLITO';
                const diffDesc = `Banco: ${existingBankVal}${existingBankTipo === 'PERCENTUAL' ? '%' : ' R$'} (Existente) vs ${bankComm.valor}${bankComm.tipo === 'PERCENTUAL' ? '%' : ' R$'} (Excel) | Vendedor: ${existingVendVal}${existingVendTipo === 'PERCENTUAL_DO_BANCO' ? '% Banco' : existingVendTipo === 'PERCENTUAL_DA_OPERACAO' ? '% Op' : ' R$'} vs ${vendComm.valor}${vendComm.tipo === 'PERCENTUAL_DO_BANCO' ? '% Banco' : vendComm.tipo === 'PERCENTUAL_DA_OPERACAO' ? '% Op' : ' R$'}`;
                conflictInfo = {
                  existingRule: existingMatch,
                  diffDescription: diffDesc,
                  action: 'keep_existing',
                };
                warnings.push(`CONFLITO DE REGRA — Diferença encontrada. Exige decisão explícita.`);
              }
            } else if (isDuplicatedInFile) {
              isDuplicate = true;
              statusTag = 'DUPLICADA';
              warnings.push('DUPLICADA — Linha duplicada dentro da própria planilha.');
            }
          } else {
            statusTag = 'NOVA';
          }
        }

        const parsedRow: ParsedExcelRuleRow = {
          rowNumber,
          sheetName,
          bancoRaw: rawBanco,
          produtoRaw: rawProduto,
          convenioRaw: rawConvenio,
          prazoRaw: rawPrazo,
          prazoMinRaw: rawPrazoMin,
          prazoMaxRaw: rawPrazoMax,
          valorMinRaw: rawValorMin,
          valorMaxRaw: rawValorMax,
          tipoComissaoBancoRaw: rawTipoComissaoBanco,
          comissaoBancoRaw: rawComissaoBanco,
          tipoComissaoVendedorRaw: rawTipoComissaoVendedor,
          comissaoVendedorRaw: rawComissaoVendedor,
          vigenciaInicioRaw: rawVigenciaInicio,
          vigenciaFimRaw: rawVigenciaFim,
          observacoesRaw: rawObservacoes,

          bancoId: matchedBank?.id,
          bancoNome: matchedBank?.nome || rawBanco,
          produtoId: matchedProduct?.id,
          produtoNome: matchedProduct?.nome || rawProduto,
          convenioId: isGeneralAgreement ? null : (matchedAgreement?.id || null),
          convenioNome: isGeneralAgreement ? 'Todos os convênios (Regra Geral)' : (matchedAgreement?.nome || rawConvenio),

          prazoMin,
          prazoMax,
          valorMin,
          valorMax,
          tipoComissaoBanco: bankComm.tipo,
          valorComissaoBanco: bankComm.valor,
          tipoComissaoVendedor: vendComm.tipo,
          valorComissaoVendedor: vendComm.valor,
          dataInicio,
          dataTermino,
          observacoes: rawObservacoes ? String(rawObservacoes).trim() : `Importado via Excel (${file.name})`,

          isValid,
          isDuplicate,
          hasConflict,
          statusTag,
          matchedExistingRule,
          conflictInfo,
          errors,
          warnings,
        };

        if (isValid) {
          validRows.push(parsedRow);
          sheetValidCount++;
          if (statusTag === 'DUPLICADA') {
            duplicateRows.push(parsedRow);
          } else if (statusTag === 'CONFLITO') {
            conflictRows.push(parsedRow);
          } else {
            newValidRows.push(parsedRow);
          }
        } else {
          invalidRows.push(parsedRow);
          sheetInvalidCount++;
        }
      }

      sheetsInfo.push({
        sheetName,
        rowCount: sheetValidCount + sheetInvalidCount,
        validRowsCount: sheetValidCount,
        invalidRowsCount: sheetInvalidCount,
      });
    }

    return {
      fileName: file.name,
      fileSize: file.size,
      totalSheets: workbook.SheetNames.length,
      sheets: sheetsInfo,
      totalRows: totalRowsCount,
      validRows,
      invalidRows,
      duplicateRows,
      conflictRows,
      newValidRows,
      unresolvedBanks: Array.from(unresolvedBanksSet),
      unresolvedProducts: Array.from(unresolvedProductsMap.values()),
      unresolvedAgreements: Array.from(unresolvedAgreementsMap.values()),
    };
  }

  /**
   * Generates a sample Excel template (.xlsx) with realistic multi-bank sheets
   */
  public generateSampleExcelBlob(): Blob {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: ITAU
    const itauData = [
      {
        'Banco': 'Itaú Consignado',
        'Produto': 'Empréstimo Consignado',
        'Convênio': 'INSS',
        'Prazo Mínimo': 1,
        'Prazo Máximo': 84,
        'Valor Mínimo': 0,
        'Valor Máximo': 20000,
        'Tipo Comissão Banco': 'Percentual',
        'Comissão Banco': '6.0%',
        'Tipo Comissão Vendedor': 'Percentual da comissão do banco',
        'Comissão Vendedor': '50.0%',
        'Vigência Inicial': '2026-01-01',
        'Vigência Final': '2026-12-31',
        'Observações': 'Tabela oficial Itaú Consignado INSS Padrão',
      },
      {
        'Banco': 'Itaú Consignado',
        'Produto': 'Empréstimo Consignado',
        'Convênio': 'INSS',
        'Prazo Mínimo': 1,
        'Prazo Máximo': 84,
        'Valor Mínimo': 20001,
        'Valor Máximo': 100000,
        'Tipo Comissão Banco': 'Percentual',
        'Comissão Banco': '7.5%',
        'Tipo Comissão Vendedor': 'Percentual da comissão do banco',
        'Comissão Vendedor': '50.0%',
        'Vigência Inicial': '2026-01-01',
        'Vigência Final': '2026-12-31',
        'Observações': 'Tabela Itaú INSS - Faixa Alta com bônus',
      },
      {
        'Banco': 'Itaú Consignado',
        'Produto': 'Empréstimo Consignado',
        'Convênio': 'SIAPE',
        'Prazo Mínimo': 1,
        'Prazo Máximo': 96,
        'Valor Mínimo': 0,
        'Valor Máximo': 150000,
        'Tipo Comissão Banco': 'Percentual',
        'Comissão Banco': '5.5%',
        'Tipo Comissão Vendedor': 'Percentual da comissão do banco',
        'Comissão Vendedor': '45.0%',
        'Vigência Inicial': '2026-01-01',
        'Vigência Final': '2026-12-31',
        'Observações': 'Tabela Itaú Servidor Federal SIAPE',
      },
      {
        'Banco': 'Itaú Consignado',
        'Produto': 'Cartão RMC',
        'Convênio': '',
        'Prazo Mínimo': 1,
        'Prazo Máximo': 84,
        'Valor Mínimo': 0,
        'Valor Máximo': 50000,
        'Tipo Comissão Banco': 'Percentual',
        'Comissão Banco': '8.0%',
        'Tipo Comissão Vendedor': 'Percentual da comissão do banco',
        'Comissão Vendedor': '50.0%',
        'Vigência Inicial': '2026-01-01',
        'Vigência Final': '2026-12-31',
        'Observações': 'Cartão de Crédito Consignado RMC Itaú (Todos os Convênios)',
      },
    ];

    // Sheet 2: C6 BANK
    const c6Data = [
      {
        'Banco': 'Banco C6 Consig',
        'Produto': 'Empréstimo Consignado',
        'Convênio': 'INSS',
        'Prazo Mínimo': 1,
        'Prazo Máximo': 84,
        'Valor Mínimo': 0,
        'Valor Máximo': 30000,
        'Tipo Comissão Banco': 'Percentual',
        'Comissão Banco': '7.0%',
        'Tipo Comissão Vendedor': 'Percentual da comissão do banco',
        'Comissão Vendedor': '50.0%',
        'Vigência Inicial': '2026-01-01',
        'Vigência Final': '2026-12-31',
        'Observações': 'C6 Consignado INSS Tabela Ouro',
      },
      {
        'Banco': 'Banco C6 Consig',
        'Produto': 'Saque Aniversário FGTS',
        'Convênio': '',
        'Prazo Mínimo': 1,
        'Prazo Máximo': 10,
        'Valor Mínimo': 500,
        'Valor Máximo': 50000,
        'Tipo Comissão Banco': 'Percentual',
        'Comissão Banco': '4.5%',
        'Tipo Comissão Vendedor': 'Percentual da comissão do banco',
        'Comissão Vendedor': '40.0%',
        'Vigência Inicial': '2026-01-01',
        'Vigência Final': '2026-12-31',
        'Observações': 'C6 Antecipação FGTS (Regra Geral)',
      },
    ];

    // Sheet 3: FACTA
    const factaData = [
      {
        'Banco': 'Facta Financeira',
        'Produto': 'Empréstimo Pessoal',
        'Convênio': '',
        'Prazo Mínimo': 6,
        'Prazo Máximo': 36,
        'Valor Mínimo': 1000,
        'Valor Máximo': 25000,
        'Tipo Comissão Banco': 'Valor Fixo',
        'Comissão Banco': '450.00',
        'Tipo Comissão Vendedor': 'Valor Fixo',
        'Comissão Vendedor': '200.00',
        'Vigência Inicial': '2026-01-01',
        'Vigência Final': '2026-12-31',
        'Observações': 'Facta Crédito Pessoal com comissão fixa por contrato',
      },
      {
        'Banco': 'Facta Financeira',
        'Produto': 'Empréstimo Consignado',
        'Convênio': 'INSS',
        'Prazo Mínimo': 12,
        'Prazo Máximo': 84,
        'Valor Mínimo': 0,
        'Valor Máximo': 80000,
        'Tipo Comissão Banco': 'Percentual',
        'Comissão Banco': '6.8%',
        'Tipo Comissão Vendedor': 'Percentual da comissão do banco',
        'Comissão Vendedor': '50.0%',
        'Vigência Inicial': '2026-01-01',
        'Vigência Final': '2026-12-31',
        'Observações': 'Facta Consignado INSS Taxa Promocional',
      },
    ];

    // Sheet 4: BRADESCO
    const bradescoData = [
      {
        'Banco': 'Banco Bradesco',
        'Produto': 'Empréstimo Consignado',
        'Convênio': 'INSS',
        'Prazo Mínimo': 1,
        'Prazo Máximo': 84,
        'Valor Mínimo': 0,
        'Valor Máximo': 50000,
        'Tipo Comissão Banco': 'Percentual',
        'Comissão Banco': '5.8%',
        'Tipo Comissão Vendedor': 'Percentual da comissão do banco',
        'Comissão Vendedor': '50.0%',
        'Vigência Inicial': '2026-01-01',
        'Vigência Final': '2026-12-31',
        'Observações': 'Bradesco Promotora INSS',
      },
    ];

    const wsItau = XLSX.utils.json_to_sheet(itauData);
    const wsC6 = XLSX.utils.json_to_sheet(c6Data);
    const wsFacta = XLSX.utils.json_to_sheet(factaData);
    const wsBradesco = XLSX.utils.json_to_sheet(bradescoData);

    XLSX.utils.book_append_sheet(workbook, wsItau, 'ITAU');
    XLSX.utils.book_append_sheet(workbook, wsC6, 'C6_BANK');
    XLSX.utils.book_append_sheet(workbook, wsFacta, 'FACTA');
    XLSX.utils.book_append_sheet(workbook, wsBradesco, 'BRADESCO');

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}

export const excelImportService = new ExcelImportService();
