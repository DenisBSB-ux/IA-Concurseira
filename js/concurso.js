/* CONCURSO ATIVO — nome, órgão, cargo, banca, data da prova e demais detalhes.
   O padrão é o TCDF 2026. Ao carregar o edital (PDF ou texto), os campos são extraídos, o usuário confere e aplica:
   o cabeçalho, a contagem regressiva, os detalhes e as mensagens do dia passam a usar o concurso novo.
   Fica no aparelho (localStorage) e sobe para a nuvem junto com o progresso da revisão (vale o mais recente). */
const CONCURSO_KEY = 'ia_concurso_v1';          // formato antigo (um só concurso); migrado para a lista
const CONCURSOS_KEY = 'ia_concursos_v2';        // { lista:[concursos], ativo:id|'padrao', cargo:'', ts }
const CONCURSO_PADRAO = {
  padrao: true, id: 'padrao', nome: 'Analista de Controle Externo — TCDF 2026', orgao: 'Tribunal de Contas do Distrito Federal',
  cargo: 'Analista Administrativo de Controle Externo, Área de Gestão', banca: 'Cebraspe',
  data: '2026-11-22', rotulo: '22/11/2026 (manhã)', link: 'https://www.cebraspe.org.br/concursos/TC_DF_26_ANALISTA',
  remuneracao: 'R$ 14.990,41', vagas: '10 imediatas e cadastro de reserva', itens: [], materias: [], cargos: [], comuns: [], ts: 0
};
let CONCURSO = Object.assign({}, CONCURSO_PADRAO);
let CONC_DB = { lista: [], ativo: 'padrao', cargo: '', escolhido: false, ts: 0 };
const PROVA_TCDF = { data: new Date(2026, 10, 22), rotulo: CONCURSO_PADRAO.rotulo, link: CONCURSO_PADRAO.link };

function concursoLerDB(){
  let d = null; try{ d = JSON.parse(localStorage.getItem(CONCURSOS_KEY) || 'null'); }catch(_){}
  if(!d || typeof d !== 'object' || !Array.isArray(d.lista)){
    d = { lista: [], ativo: 'padrao', cargo: '', ts: 0 };
    let v1 = null; try{ v1 = JSON.parse(localStorage.getItem(CONCURSO_KEY) || 'null'); }catch(_){}
    if(v1 && v1.nome && !v1.padrao){ v1.id = 'c_migrado'; v1.cargos = v1.cargos || []; v1.comuns = v1.comuns || v1.materias || []; d.lista.push(v1); d.ativo = v1.id; d.ts = v1.ts || 1; }
  }
  return d;
}
function concursoGravarDB(){
  CONC_DB.ts = Date.now();
  try{ localStorage.setItem(CONCURSOS_KEY, JSON.stringify(CONC_DB)); }catch(_){}
  concursoCarregar();
  try{ if(typeof sincronizarRevisao === 'function') sincronizarRevisao(); }catch(_){}
}
function concursoMateriasDoCargo(c, cargo){
  const cg = (c.cargos || []).find(x => x.nome === cargo);
  const out = []; (c.comuns || []).concat(cg ? cg.materias || [] : []).forEach(m => { if(m && !out.includes(m)) out.push(m); });
  return out;
}
function concursoCarregar(){
  CONC_DB = concursoLerDB();
  const c = CONC_DB.lista.find(x => x.id === CONC_DB.ativo);
  if(!c || CONC_DB.ativo === 'padrao') CONCURSO = Object.assign({}, CONCURSO_PADRAO);
  else{
    const cargo = (c.cargos || []).some(x => x.nome === CONC_DB.cargo) ? CONC_DB.cargo : ((c.cargos || [])[0] || {}).nome || c.cargo || '';
    CONCURSO = Object.assign({}, CONCURSO_PADRAO, c, { padrao: false, cargo, materias: concursoMateriasDoCargo(c, cargo) });
  }
  concursoAplicar();
}
/* salva (ou atualiza) um concurso da lista e o torna o ativo; null volta ao TCDF */
function concursoSalvar(c){
  if(!c){ CONC_DB.ativo = 'padrao'; CONC_DB.cargo = ''; CONC_DB.escolhido = true; return concursoGravarDB(); }
  const id = c.id || ('c_' + Date.now().toString(36));
  const novo = Object.assign({}, c, { id, padrao: false });
  const i = CONC_DB.lista.findIndex(x => x.id === id);
  if(i >= 0) CONC_DB.lista[i] = novo; else CONC_DB.lista.push(novo);
  CONC_DB.ativo = id; CONC_DB.cargo = ((novo.cargos || [])[0] || {}).nome || '';
  concursoGravarDB();      // a escolha (obrigatória) só vale quando o usuário confirma em "Estudar este"
}
function concursoEscolher(id, cargo){ CONC_DB.ativo = id; CONC_DB.cargo = cargo || ''; CONC_DB.escolhido = true; concursoGravarDB(); }
function concursoExcluir(id){ CONC_DB.lista = CONC_DB.lista.filter(x => x.id !== id); if(CONC_DB.ativo === id){ CONC_DB.ativo = 'padrao'; CONC_DB.cargo = ''; } concursoGravarDB(); }
function concursoDataObj(iso){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}
function concursoAplicar(){
  const c = CONCURSO, d = concursoDataObj(c.data);
  PROVA_TCDF.data = d || new Date(2099, 0, 1);
  PROVA_TCDF.rotulo = c.rotulo || (d ? d.toLocaleDateString('pt-BR') : 'data a definir');
  PROVA_TCDF.link = c.link || '';
  PROVA_TCDF.semData = !d;
  try{ CONFIG.eyebrow = c.orgao || ''; CONFIG.footer = c.padrao ? 'PROCESSO Nº LO-TCDF/2026 · MATERIAL DE ESTUDO PRIVADO' : 'MATERIAL DE ESTUDO PRIVADO · ' + String(c.nome || '').toUpperCase(); }catch(_){}
  try{ document.title = c.padrao ? 'IA Concurseira' : 'IA Concurseira · ' + (c.orgao || c.nome); }catch(_){}
}

/* ---------- extração do edital (heurística; o usuário confere antes de aplicar) ---------- */
const CONC_BANCAS = ['Cebraspe', 'CESPE', 'FGV', 'FCC', 'Vunesp', 'IBFC', 'Quadrix', 'IDECAN', 'AOCP', 'Cesgranrio', 'Fundatec', 'Consulplan', 'IADES', 'IDIB', 'FEPESE', 'Instituto Access', 'Selecon', 'Objetiva Concursos', 'Funcab', 'FUNRIO', 'Instituto Mais', 'Avalia', 'Legalle', 'CEV-UFC', 'Nucepe'];
const CONC_MESES = { janeiro: 1, fevereiro: 2, 'março': 3, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };
function concPad(n){ return String(n).padStart(2, '0'); }
function concDatasDoTexto(t){
  const out = []; let m;
  const r1 = /\b(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})\b/g;
  while((m = r1.exec(t))) out.push({ i: m.index, d: `${m[3]}-${concPad(m[2])}-${concPad(m[1])}`, s: m[0] });
  const r2 = /\b(\d{1,2})\s*(?:º|°)?\s+de\s+(janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})\b/gi;
  while((m = r2.exec(t))) out.push({ i: m.index, d: `${m[3]}-${concPad(CONC_MESES[m[2].toLowerCase()])}-${concPad(m[1])}`, s: m[0] });
  return out.filter(x => { const o = concursoDataObj(x.d); return o && o.getMonth() + 1 === +x.d.slice(5, 7); }).sort((a, b) => a.i - b.i);
}
function editalExtrair(texto){
  const t = String(texto || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ');
  const linhas = t.split('\n').map(s => s.trim()).filter(Boolean);
  const r = { nome: '', orgao: '', cargo: '', banca: '', data: '', rotulo: '', link: '', remuneracao: '', vagas: '', itens: [], materias: [], cargos: [], comuns: [] };
  // órgão
  const reOrg = /^(tribunal|prefeitura|c[âa]mara|assembleia|minist[ée]rio|secretaria|governo|instituto|universidade|fundação|funda[cç][aã]o|defensoria|procuradoria|conselho|banco|empresa|autarquia|companhia|policia|polícia|corpo de bombeiros|agência|ag[êe]ncia)\b.{3,90}$/i;
  const lOrg = linhas.slice(0, 80).find(l => reOrg.test(l) && l.length < 100 && !/edital|concurso/i.test(l));
  if(lOrg) r.orgao = lOrg.replace(/\s+/g, ' ').replace(/[.;:]+$/, '');
  if(!r.orgao){ const m = /(?:pelo|pela|do|da)\s+((?:Tribunal|Prefeitura|C[âa]mara|Assembleia|Minist[ée]rio|Secretaria|Instituto|Universidade|Defensoria|Procuradoria|Conselho|Banco)[^,.;\n]{3,80})/i.exec(t); if(m) r.orgao = m[1].trim(); }
  // banca (a mais citada)
  let melhor = 0; CONC_BANCAS.forEach(b => { const n = (t.match(new RegExp('\\b' + b.replace(/[-]/g, '\\-') + '\\b', 'gi')) || []).length; if(n > melhor){ melhor = n; r.banca = b === 'CESPE' ? 'Cebraspe' : b; } });
  // cargo
  const mCargo = /(?:cargo|cargos?\s*:|emprego|fun[cç][aã]o)\s*[:\-–]?\s*((?:Analista|T[ée]cnico|Auditor|Agente|Professor|Escriv[ãa]o|Delegado|Procurador|Defensor|Oficial|Assistente|M[ée]dico|Engenheiro|Advogado|Perito|Fiscal|Inspetor|Especialista|Soldado)[^\n.;]{0,110})/i.exec(t);
  if(mCargo) r.cargo = mCargo[1].replace(/\s+/g, ' ').trim();
  // nome do concurso
  const lNome = linhas.slice(0, 60).find(l => /edital.*concurso|concurso p[úu]blico/i.test(l) && l.length < 220);
  const sigla = (r.orgao.match(/\b[A-ZÁÉÍÓÚ]{2,8}\b/) || [''])[0];
  const ano = (t.match(/\b(20[2-3]\d)\b/) || [''])[1];
  r.nome = (lNome ? lNome.replace(/^edital\s*(n[ºo°.]*\s*[\d/.-]+)?\s*[-–—:]*\s*/i, '').replace(/\s+/g, ' ') : '') || [r.orgao, ano].filter(Boolean).join(' ');
  if(/^concurso p[úu]blico\s+(para|destinado)/i.test(r.nome) && r.cargo) r.nome = `${r.cargo} — ${r.orgao || ''} ${ano}`.replace(/\s+/g, ' ').trim();
  if(/^concurso p[úu]blico\.?$/i.test(r.nome.trim()) || r.nome.trim().length < 12) r.nome = [r.orgao, ano].filter(Boolean).join(' ') || r.nome;
  if(r.nome.length > 120) r.nome = r.nome.slice(0, 117) + '…';
  // remuneração
  const mRem = /(?:remunera[cç][aã]o|vencimento|sal[aá]rio|subs[ií]dio)[^R\n]{0,60}(R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i.exec(t);
  if(mRem) r.remuneracao = mRem[1].replace(/\s+/g, ' ');
  // vagas
  const mVag = /(\d{1,4})\s*\(?[a-zçãé ]{0,30}\)?\s*vagas?\b[^.\n]{0,60}/i.exec(t);
  if(mVag) r.vagas = mVag[0].replace(/\s+/g, ' ').trim().slice(0, 100);
  // data da prova: a data mais próxima de "prova objetiva"; senão, a primeira data com a palavra "prova"
  const datas = concDatasDoTexto(t); let alvo = null;
  const posProva = []; const rp = /prova\s+objetiva|provas?\s+(?:objetiva|escrita|discursiva)|aplica[cç][aã]o\s+das?\s+provas?/gi; let mp;
  while((mp = rp.exec(t))) posProva.push(mp.index);
  let distMin = 1e9;
  datas.forEach(dt => posProva.forEach(p => { const d = dt.i - p; if(d >= -40 && d < 260 && Math.abs(d) < distMin){ distMin = Math.abs(d); alvo = dt; } }));
  if(!alvo) alvo = datas[0] || null;
  if(alvo){
    r.data = alvo.d;
    const trecho = t.slice(alvo.i, alvo.i + 160).toLowerCase();
    const per = /manh[ãa]/.test(trecho) ? ' (manhã)' : (/tarde/.test(trecho) ? ' (tarde)' : '');
    const hr = /\b(\d{1,2})\s*h(?:\s*(\d{2}))?\b/.exec(trecho);
    r.rotulo = alvo.s.includes('/') ? alvo.s.replace(/\b(\d)\//, '0$1/') : concursoDataObj(alvo.d).toLocaleDateString('pt-BR');
    r.rotulo += per || (hr ? ` (${hr[1]}h${hr[2] || ''})` : '');
  }
  // link
  const mLink = /https?:\/\/[^\s)>\]"]+/i.exec(t); if(mLink) r.link = mLink[0].replace(/[.,;]+$/, '');
  // cargos e matérias: cada "CARGO ...: X" abre um bloco; matérias antes do primeiro cargo (ou sem cargo) são comuns
  const reMat = /^(direito|l[íi]ngua|racioc[íi]nio|inform[áa]tica|matem[áa]tica|contabilidade|administra[cç][aã]o|auditoria|economia|estat[íi]stica|legisla[cç][aã]o|ci[êe]ncia|realidade|atualidades|regimento|[ée]tica|geografia|hist[óo]ria|portugu[êe]s|ingl[êe]s|gest[aã]o|finan[cç]as|licita|controle|tecnologia|banco de dados|an[áa]lise|engenharia|pol[íi]ticas|seguran[cç]a|arquivologia|biologia|f[íi]sica|qu[íi]mica|conhecimentos (do|da|de) |sa[úu]de|educa[cç][aã]o|pedagogia|enfermagem|medicina|odontologia|psicologia|servi[cç]o social|redes|sistemas|programa[cç][aã]o|processo|execu[cç][aã]o|crimin|penal|civil|tribut|previd|trabalho|empresarial|ambiental|urban|elei|human|noções|no[cç][õo]es|raciocinio)/i;
  const reCargo = /^(?:cargo|emprego|cargo\/especialidade|cargo\/[áa]rea)\s*(?:n?[º°o.]?\s*\d+)?\s*[:\-–—]\s*(.{4,120})$/i;
  const reCargoN = /^cargo\s+\d+\s*[:\-–—]?\s*(.{4,120})$/i;
  const cargos = []; const comuns = []; let atual = null, dentro = false, modo = null;
  linhas.forEach(l => {
    const mc = reCargo.exec(l) || reCargoN.exec(l);
    if(mc){
      const nome = mc[1].replace(/\s*\(?\d+\s*vagas?\)?.*$/i, '').replace(/[.;:]+$/, '').replace(/\s+/g, ' ').trim();
      if(nome.length >= 4){ atual = cargos.find(x => x.nome.toLowerCase() === nome.toLowerCase()); if(!atual){ atual = { nome, materias: [] }; cargos.push(atual); } if(dentro) modo = 'cargo'; return; }
    }
    if(/^conhecimentos\s+(b[áa]sicos|gerais|comuns)/i.test(l) && l.length < 80){ dentro = true; modo = 'comum'; }
    else if(/^conhecimentos\s+(espec[ií]ficos|especializados)/i.test(l) && l.length < 80){ dentro = true; modo = 'cargo'; }
    else if(/^(conte[úu]do program[áa]tico|disciplinas?|l[íi]ngua portuguesa|legisla[cç][aã]o)/i.test(l) && l.length < 80){ if(!dentro) modo = atual ? 'cargo' : 'comum'; dentro = true; }
    if(!dentro) return;
    const lim = l.replace(/^[\d.\-•*▪►]+\s*/, '').replace(/[:.;]+$/, '').trim();
    if(lim.length < 4 || lim.length > 70 || !/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(lim) || /\d{3,}/.test(lim) || /^(edital|p[áa]gina|anexo|item|art)/i.test(lim) || /^conhecimentos\s+(b[áa]sicos|gerais|espec[ií]ficos|especializados|comuns)$|^conte[úu]do|^disciplinas?$/i.test(lim)) return;
    if(!reMat.test(lim)) return;
    const alvo = (modo === 'cargo' && atual) ? atual.materias : comuns;
    if(!alvo.includes(lim) && !comuns.includes(lim)) alvo.push(lim);
  });
  r.cargos = cargos.slice(0, 30); r.comuns = comuns.slice(0, 40); r.materias = comuns.slice(0, 40);
  if(!r.cargo && cargos[0]) r.cargo = cargos[0].nome;
  // itens soltos úteis
  const add = (rot, re) => { const m = re.exec(t); if(m) r.itens.push([rot, m[0].replace(/\s+/g, ' ').trim().slice(0, 160)]); };
  add('Requisito', /(?:requisito|escolaridade|forma[cç][aã]o)[^\n]{0,20}:\s*[^\n.]{5,140}/i);
  add('Objetiva', /\d{2,3}\s*(?:\([^)]*\)\s*)?(?:quest[õo]es|itens)[^\n.]{0,120}/i);
  add('Inscrições', /inscri[cç][õo]es[^\n]{0,30}(?:de|at[ée]|das?)\s*\d{1,2}[^\n.]{0,80}/i);
  add('Validade', /validade[^\n]{0,60}(?:\d+\s*\(?[a-zç]*\)?\s*(?:anos?|meses))[^\n.]{0,50}/i);
  return r;
}
async function editalLerArquivo(file){
  const nome = (file.name || '').toLowerCase();
  if(/\.pdf$/.test(nome) || file.type === 'application/pdf'){
    if(typeof pdfjsLib === 'undefined') throw new Error('A leitura de PDF não carregou (sem conexão?). Cole o texto do edital ou recarregue a página.');
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
    let txt = ''; const max = Math.min(pdf.numPages, 120);
    for(let i = 1; i <= max; i++){
      const c = await (await pdf.getPage(i)).getTextContent(); let y = null, lin = '';
      c.items.forEach(it => { const yy = it.transform[5]; if(y !== null && Math.abs(yy - y) > 2){ txt += lin.trim() + '\n'; lin = ''; } y = yy; lin += it.str + ' '; });
      txt += lin.trim() + '\n';
    }
    return txt;
  }
  return await file.text();
}

/* ---------- janela "Carregar edital" ---------- */
function concursoCargosTexto(c){
  const o = []; if((c.comuns || []).length) o.push('## Comuns a todos os cargos', ...c.comuns);
  (c.cargos || []).forEach(x => { o.push('## Cargo: ' + x.nome, ...(x.materias || [])); });
  return o.join('\n');
}
function concursoCargosDeTexto(t){
  const cargos = []; const comuns = []; let alvo = comuns;
  String(t || '').split('\n').map(l => l.trim()).filter(Boolean).forEach(l => {
    const m = /^##\s*(.*)$/.exec(l);
    if(m){ const n = m[1].replace(/^cargo\s*:\s*/i, '').trim(); if(/^comuns/i.test(n)){ alvo = comuns; } else { const x = { nome: n, materias: [] }; cargos.push(x); alvo = x.materias; } return; }
    alvo.push(l);
  });
  return { cargos, comuns };
}
function concursoItensTexto(c){ return (c.itens || []).map(p => p[0] + ': ' + p[1]).join('\n'); }
function concursoItensDeTexto(s){ return String(s || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const i = l.indexOf(':'); return i > 0 && i < 40 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['Detalhe', l]; }); }
function concursoModal(){
  let el = document.getElementById('concurso-modal');
  if(!el){
    el = document.createElement('div'); el.id = 'concurso-modal'; el.className = 'lei-modal'; el.hidden = true;
    el.innerHTML = `<div class="lei-caixa prova-caixa conc-caixa" role="dialog" aria-label="Carregar edital"><div class="lei-barra"><strong>Carregar edital do concurso</strong><button type="button" class="btn-ui" data-conc-fechar="1" title="Fechar">✕</button></div><div class="lei-corpo" id="concurso-corpo"></div></div>`;
    el.addEventListener('mousedown', e => { if(e.target === el && el.dataset.obrig !== '1') el.hidden = true; });
    document.addEventListener('keydown', e => { if(e.key === 'Escape' && !el.hidden && el.dataset.obrig !== '1') el.hidden = true; });
    document.body.appendChild(el);
  }
  return el;
}
function concursoForm(c){
  const v = x => esc(x == null ? '' : String(x));
  const campo = (id, rot, val, tipo, ph) => `<label class="conc-l"><span>${rot}</span><input id="conc-${id}" type="${tipo || 'text'}" value="${v(val)}" placeholder="${v(ph || '')}"></label>`;
  return `
    <div class="conc-up">
      <label class="side-action-btn compact conc-arq">📄 Escolher edital (PDF ou TXT)<input id="conc-arquivo" type="file" accept=".pdf,.txt,.md,text/plain,application/pdf" hidden></label>
      <button type="button" class="side-action-btn compact" data-conc-colar="1">📋 Colar o texto</button>
      <span id="conc-status" class="conc-st"></span>
    </div>
    <textarea id="conc-colado" class="conc-ta" rows="5" placeholder="Cole aqui o texto do edital" hidden></textarea>
    <div class="conc-grade">
      ${campo('nome', 'Nome do concurso', c.nome)}${campo('orgao', 'Órgão', c.orgao)}
      ${campo('cargo', 'Cargo', c.cargo)}${campo('banca', 'Banca', c.banca)}
      ${campo('data', 'Data da prova', c.data, 'date')}${campo('rotulo', 'Texto da data (ex.: 22/11/2026, manhã)', c.rotulo)}
      ${campo('remuneracao', 'Remuneração inicial', c.remuneracao)}${campo('vagas', 'Vagas', c.vagas)}
      ${campo('link', 'Link do edital / banca', c.link, 'url', 'https://')}
    </div>
    <label class="conc-l"><span>Cargos e matérias (use "## Comuns a todos os cargos" e "## Cargo: nome"; uma matéria por linha)</span><textarea id="conc-cargos" class="conc-ta" rows="9">${v(concursoCargosTexto(c))}</textarea></label>
    <label class="conc-l"><span>Outros detalhes (um por linha, no formato "Rótulo: valor")</span><textarea id="conc-itens" class="conc-ta" rows="5">${v(concursoItensTexto(c))}</textarea></label>
    <div class="conc-acoes">
      <button type="button" class="side-action-btn compact" data-conc-aplicar="1">✔ Aplicar ao site</button>
      <button type="button" class="side-action-btn compact" data-conc-padrao="1" title="Volta ao concurso TCDF 2026">↩ Voltar ao TCDF</button>
    </div>
    <small>A leitura é automática e pode errar: confira os campos antes de aplicar. O texto do edital não é enviado a nenhum servidor.</small>`;
}
function concursoLerForm(){
  const g = id => ((document.getElementById('conc-' + id) || {}).value || '').trim();
  return { nome: g('nome'), orgao: g('orgao'), cargo: g('cargo'), banca: g('banca'), data: g('data'), rotulo: g('rotulo'), remuneracao: g('remuneracao'), vagas: g('vagas'), link: g('link'),
    cargos: concursoCargosDeTexto(g('cargos')).cargos, comuns: concursoCargosDeTexto(g('cargos')).comuns, materias: concursoCargosDeTexto(g('cargos')).comuns, itens: concursoItensDeTexto(g('itens')) };
}
function concursoPreencher(r){
  Object.keys(r).forEach(k => { if(k === 'cargos' || k === 'comuns' || k === 'materias') return; const el = document.getElementById('conc-' + k); if(!el) return; el.value = Array.isArray(r[k]) ? (k === 'itens' ? concursoItensTexto({ itens: r[k] }) : r[k].join('\n')) : (r[k] || el.value); });
  const ec = document.getElementById('conc-cargos'); if(ec && (r.cargos || r.comuns)) ec.value = concursoCargosTexto(r);
}
async function concursoProcessarTexto(txt, st){
  const r = editalExtrair(txt);
  concursoPreencher(r);
  const ach = ['nome', 'orgao', 'cargo', 'banca', 'data', 'remuneracao'].filter(k => r[k]).length;
  if(st) st.textContent = `Lido: ${ach} de 6 campos principais encontrados. Confira e ajuste.`;
}
function concursoAbrir(){
  const el = concursoModal(); const corpo = document.getElementById('concurso-corpo');
  el.dataset.obrig = ''; el.querySelector('.lei-barra strong').textContent = 'Carregar edital do concurso';
  corpo.onclick = null; corpo.onchange = null; delete corpo.dataset.sel;
  corpo.innerHTML = concursoForm(CONCURSO.padrao ? CONCURSO_PADRAO : CONCURSO);
  el.hidden = false;
}
document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('[data-conc-abrir],[data-conc-escolher],[data-conc-plano],[data-conc-fechar],[data-conc-colar],[data-conc-aplicar],[data-conc-padrao]'); if(!t) return;
  if(t.hasAttribute('data-conc-abrir')) return concursoAbrir();
  if(t.hasAttribute('data-conc-escolher')) return concursoEscolherAbrir();
  if(t.hasAttribute('data-conc-plano')) return concursoPlanoAbrir();
  if(t.hasAttribute('data-conc-fechar')) { const mm = concursoModal(); if(mm.dataset.obrig === '1') return; mm.hidden = true; if(!CONC_DB.escolhido) concursoEscolherAbrir(); return; }
  if(t.hasAttribute('data-conc-colar')){
    const ta = document.getElementById('conc-colado'); ta.hidden = false; ta.focus();
    if(!ta._ok){ ta._ok = 1; ta.addEventListener('input', () => { clearTimeout(ta._t); ta._t = setTimeout(() => concursoProcessarTexto(ta.value, document.getElementById('conc-status')), 500); }); }
    return;
  }
  if(t.hasAttribute('data-conc-padrao')){
    if(!confirm('Voltar ao concurso TCDF 2026? Os dados do edital carregado serão apagados deste aparelho.')) return;
    concursoSalvar(null); concursoModal().hidden = true; if(typeof render === 'function') render(); return;
  }
  if(t.hasAttribute('data-conc-aplicar')){
    const c = concursoLerForm();
    if(!c.nome){ const s = document.getElementById('conc-status'); if(s) s.textContent = 'Informe pelo menos o nome do concurso.'; return; }
    concursoSalvar(c); concursoModal().hidden = true; if(typeof render === 'function') render(); concursoEscolherAbrir();      // confirma o cargo
  }
});
document.addEventListener('change', async e => {
  if(!e.target || e.target.id !== 'conc-arquivo') return;
  const f = e.target.files && e.target.files[0]; if(!f) return;
  const st = document.getElementById('conc-status'); st.textContent = `Lendo "${f.name}"…`;
  try{ await concursoProcessarTexto(await editalLerArquivo(f), st); }
  catch(err){ st.textContent = 'Não consegui ler o arquivo: ' + (err && err.message ? err.message : err); }
});

/* ---------- textos que dependem do concurso ---------- */
function concursoDetalhesHtml(){
  const c = CONCURSO, li = (r, v) => v ? `<li><b>${esc(r)}:</b> ${esc(v)}</li>` : '';
  return `<ul>${li('Concurso', c.nome)}${li('Órgão', c.orgao)}${li('Cargo', c.cargo)}${li('Banca', c.banca)}${li('Data da prova', PROVA_TCDF.rotulo)}${li('Remuneração inicial', c.remuneracao)}${li('Vagas', c.vagas)}${(c.itens || []).map(p => li(p[0], p[1])).join('')}</ul>
    ${(c.materias || []).length ? `<div class="prova-sub">Matérias do edital</div><ul>${c.materias.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
    <small>Dados lidos do edital: confira no documento oficial${c.link ? ' (link na barra lateral)' : ''}.</small>`;
}
const MOTIVACAO_GERAL = [
  'Constância vence intensidade: um pouco todo dia leva mais longe do que um dia heroico.',
  'O erro de hoje é o acerto do dia da prova.',
  'Leia o item inteiro antes de decidir. A pressa custa pontos.',
  'Revisar vale mais do que ver matéria nova perto da prova.',
  'Caderno de erros: seus pontos mais fáceis de ganhar estão ali.',
  'Respire. Uma questão de cada vez, até o fim da lista.',
  'Você está mais perto da vaga do que ontem.',
  'Cuide do corpo: água, sono e uma caminhada ajudam a memória.',
  'Desconfie dos absolutos: sempre, nunca, somente, exclusivamente.',
  'A banca cobra a letra da lei. Volte ao texto antes de decidir.',
  'Treine no ritmo da prova: tempo também é matéria.',
  'Mais uma semana de consistência e você nota a diferença.'
];
function concursoMotivacao(dias){
  const c = CONCURSO;
  if(dias < 0) return 'Prova realizada. Obrigado pelo esforço: o resultado vem do que você construiu.';
  if(dias === 0) return 'É hoje! Respire fundo, leia com calma e confie no seu preparo.';
  if(dias === 1) return 'Amanhã é o dia. Revise de leve, durma cedo e confie no que estudou.';
  const L = MOTIVACAO_GERAL.slice();
  if(c.cargo) L.push(`Cargo de ${c.cargo}: o estudo de hoje já é parte do seu trabalho de amanhã.`);
  if(c.remuneracao) L.push(`Remuneração inicial de ${c.remuneracao}: foco na rotina.`);
  if(c.banca) L.push(`Estude no estilo da ${c.banca}: treine com as questões dela.`);
  return L[((dias % L.length) + L.length) % L.length];
}

/* ---------- comparação do cargo com as listas que já existem ---------- */
const CONC_CATALOGO = [
  { slug: 'constitucional', nome: 'Direito Constitucional', n: 250, dir: ['constitucional', 'constituicao'], rel: [] },
  { slug: 'administrativo-geral', nome: 'Administrativo (geral)', n: 500, dir: ['direito administrativo', 'administracao publica', 'atos administrativos', 'poderes administrativos'], rel: ['administrativo'] },
  { slug: 'adm-8429', nome: 'Adm: Lei 8.429, 9.784 e 2.834', n: 200, dir: ['improbidade', 'processo administrativo', '8.429', '9.784', '2.834'], rel: ['direito administrativo'] },
  { slug: 'adm-lgpd-lai', nome: 'Adm: LGPD + LAI', n: 203, dir: ['lgpd', 'protecao de dados', 'acesso a informacao', 'lei de acesso'], rel: ['direito administrativo'] },
  { slug: 'afo', nome: 'AFO', n: 300, dir: ['orcamento', 'financas publicas', 'administracao financeira', 'afo', 'responsabilidade fiscal', 'lrf', 'contabilidade publica'], rel: [] },
  { slug: 'analise-dados-ia', nome: 'Análise de Dados e IA', n: 200, dir: ['analise de dados', 'inteligencia artificial', 'ciencia de dados', 'estatistica', 'business intelligence'], rel: ['informatica', 'tecnologia da informacao'] },
  { slug: 'conhec-df', nome: 'Conhecimentos do DF', n: 203, dir: ['conhecimentos do distrito federal', 'realidade do distrito federal', 'historia do distrito federal', 'geografia do distrito federal', 'atualidades do distrito federal', 'conhecimentos do df'], rel: ['distrito federal'] },
  { slug: 'contratos', nome: 'Gestão e Fiscalização de Contratos', n: 200, dir: ['gestao de contratos', 'fiscalizacao de contratos', 'contratos administrativos'], rel: ['licitacoes'] },
  { slug: 'd-tributario', nome: 'Direito Tributário', n: 300, dir: ['tributario', 'tributos', 'codigo tributario'], rel: ['financas publicas'] },
  { slug: 'decreto-44330', nome: 'Decreto 44.330', n: 53, dir: ['44.330', '44330'], rel: [] },
  { slug: 'direito-civil', nome: 'Direito Civil', n: 233, dir: ['direito civil', 'codigo civil'], rel: [] },
  { slug: 'in5', nome: 'IN nº 5', n: 100, dir: ['instrucao normativa 5', 'instrucao normativa n 5', 'in 5', 'in n 5', 'terceirizacao'], rel: ['contratos'] },
  { slug: 'lei-14133', nome: 'Lei 14.133/2021 (Licitações)', n: 232, dir: ['14.133', 'licitacoes', 'licitacao', 'licitacoes e contratos'], rel: ['contratos administrativos'] },
  { slug: 'lei-organica-tcdf', nome: 'Lei Orgânica do TCDF (LC 1/1994)', n: 225, dir: ['lei organica do tcdf', 'lei organica do tribunal de contas', 'lc 1/1994'], rel: ['controle externo', 'tribunal de contas'] },
  { slug: 'lodf', nome: 'LODF', n: 224, dir: ['lei organica do distrito federal', 'lodf', 'lei organica do df'], rel: ['distrito federal'] },
  { slug: 'pdpm', nome: 'PDPM / Mulheres (Lei Maria da Penha)', n: 200, dir: ['maria da penha', 'violencia domestica', 'politicas para mulheres', 'pdpm'], rel: ['mulher', 'genero'] },
  { slug: 'previdenciario', nome: 'Previdenciário', n: 233, dir: ['previdenciario', 'seguridade social', 'previdencia'], rel: [] },
  { slug: 'primeiros-socorros', nome: 'Primeiros Socorros', n: 100, dir: ['primeiros socorros'], rel: [] },
  { slug: 'reg-interno', nome: 'Regimento Interno do TCDF', n: 215, dir: ['regimento interno'], rel: ['tribunal de contas', 'controle externo'] },
  { slug: 'rju-lc840', nome: 'RJU (LC 840/2011)', n: 241, dir: ['840', 'regime juridico dos servidores', 'estatuto dos servidores', 'servidores civis'], rel: ['servidores publicos'] }
];
function concNorm(t){ return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9./ ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function concCatNome(slug){ try{ const e = CONC_CATALOGO.find(x => x.slug === slug); return (typeof RESUMOS_TCDF !== 'undefined' && (RESUMOS_TCDF[slug] || {}).nome) || (e && e.nome) || slug; }catch(_){ return slug; } }
function concCatQtd(e){
  try{ const nm = concNorm(concCatNome(e.slug)); const n = ALL_QUESTIONS.filter(q => !q.duplicataOculta && concNorm(q.materia) === nm).length; if(n) return n; }catch(_){}
  return e.n;
}
/* retorna { diretas:[entradas], relacionadas:[entradas] } para uma matéria do edital */
function concursoCompararMateria(m){
  const t = ' ' + concNorm(m) + ' '; const dir = [], rel = [];
  CONC_CATALOGO.forEach(e => {
    const has = k => { const kk = concNorm(k); return t.includes(' ' + kk + ' ') || (kk.length > 5 && t.includes(kk)); };
    if(e.dir.some(has)) dir.push(e); else if(e.rel.some(has)) rel.push(e);
  });
  return { diretas: dir, relacionadas: rel };
}
function concursoComparar(c){
  const mats = c.padrao ? [] : (c.materias || []);
  const linhas = mats.map(m => ({ materia: m, ...concursoCompararMateria(m) }));
  const usados = new Set(); linhas.forEach(l => l.diretas.concat(l.relacionadas).forEach(e => usados.add(e.slug)));
  return { linhas, usados, cobertas: linhas.filter(l => l.diretas.length).length, parciais: linhas.filter(l => !l.diretas.length && l.relacionadas.length).length, semLista: linhas.filter(l => !l.diretas.length && !l.relacionadas.length) };
}
function concursoAbrirMateriaQuestoes(slug){
  const nm = concNorm(concCatNome(slug));
  const m = (typeof materiasDisponiveis === 'function' ? materiasDisponiveis() : []).find(x => concNorm(x) === nm) || (typeof materiasDisponiveis === 'function' ? materiasDisponiveis() : []).find(x => nm.includes(concNorm(x)) || concNorm(x).includes(nm));
  if(!m) return false;
  STATE.materia = m; STATE.tema = 'todos'; STATE.viewImportar = false; STATE.viewAuditoria = false;
  const el = document.getElementById('concurso-plano'); if(el) el.hidden = true;
  if(typeof render === 'function') render(); return true;
}
function concursoCompat(c){
  const cmp = concursoComparar(c || CONCURSO), n = cmp.linhas.length;
  return { cmp, n, pct: n ? Math.round((cmp.cobertas + 0.5 * cmp.parciais) / n * 100) : 0 };
}
/* marca nas matérias da base: ★ cobrada no cargo, ◐ relacionada */
function concursoMarca(nomeMateria){
  if(CONCURSO.padrao) return '';
  const cmp = concursoComparar(CONCURSO); const nm = concNorm(nomeMateria);
  const e = CONC_CATALOGO.find(x => { const cn = concNorm(concCatNome(x.slug)); return cn === nm || cn.includes(nm) || nm.includes(cn); });
  if(!e) return '';
  const dir = cmp.linhas.some(l => l.diretas.includes(e)), rel = cmp.linhas.some(l => l.relacionadas.includes(e));
  return dir ? ' <span class="conc-star" title="Cobrada no seu cargo">★</span>' : (rel ? ' <span class="conc-star rel" title="Relacionada a uma matéria do seu cargo">◐</span>' : ' <span class="conc-star off" title="Não cobrada no seu cargo">·</span>');
}
function concursoPlanoHtml(){
  const c = CONCURSO, cmp = concursoComparar(c);
  const btn = e => `<span class="conc-lst"><b>${esc(concCatNome(e.slug))}</b> <small>${concCatQtd(e)} questões</small> <button type="button" class="prova-det-btn" data-conc-resumo="${esc(concCatNome(e.slug))}">📖 Resumo</button> <button type="button" class="prova-det-btn" data-conc-quest="${esc(e.slug)}">📝 Questões</button></span>`;
  let h = `<div class="conc-cab"><div><b>${esc(c.nome)}</b><br><small>${esc(c.orgao || '')}${c.banca ? ' · ' + esc(c.banca) : ''}</small></div><button type="button" class="side-action-btn compact" data-conc-escolher="1">🎯 Trocar concurso/cargo</button></div>`;
  if(c.padrao){
    h += `<p>Concurso padrão: <b>TCDF</b>. Todas as listas abaixo já são dele (${CONC_CATALOGO.length} matérias).</p><div class="conc-lista">${CONC_CATALOGO.map(btn).map(x => `<div class="conc-linha">${x}</div>`).join('')}</div>`;
    return h;
  }
  h += `<div class="conc-cargo-sel">Cargo: <b>${esc(c.cargo || '(não informado)')}</b></div>`;
  if(!cmp.linhas.length) return h + `<p>Este cargo ainda não tem matérias cadastradas. Abra <b>Carregar edital</b> e preencha "Cargos e matérias".</p><button type="button" class="side-action-btn compact" data-conc-abrir="1">📄 Carregar/editar edital</button>`;
  const cp = concursoCompat(c);
  h += `<div class="conc-compat"><div class="conc-compat-t">Compatibilidade da base com o cargo: <b>${cp.pct}%</b></div><div class="conc-barra"><i style="width:${cp.pct}%"></i></div></div>`;
  h += `<p class="conc-resumo">✅ <b>${cmp.cobertas}</b> de ${cmp.linhas.length} matérias com lista pronta · 🟡 <b>${cmp.parciais}</b> parcial · ❌ <b>${cmp.semLista.length}</b> sem lista</p>`;
  h += `<table class="conc-tab"><thead><tr><th>Matéria do edital</th><th>Situação</th><th>Listas que você já tem</th></tr></thead><tbody>`;
  cmp.linhas.forEach(l => {
    const st = l.diretas.length ? '✅ coberta' : (l.relacionadas.length ? '🟡 parcial' : '❌ sem lista');
    const lst = l.diretas.concat(l.relacionadas).map(btn).join('<br>') || '<small>Importar um .md desta matéria (aba Importar)</small>';
    h += `<tr class="${l.diretas.length ? 'conc-ok' : (l.relacionadas.length ? 'conc-par' : 'conc-sem')}"><td>${esc(l.materia)}</td><td>${st}</td><td>${lst}</td></tr>`;
  });
  h += `</tbody></table>`;
  const fora = CONC_CATALOGO.filter(e => !cmp.usados.has(e.slug));
  if(fora.length) h += `<details class="conc-fora"><summary>Listas existentes que o cargo não cobra (${fora.length})</summary>${fora.map(e => `<div class="conc-linha">${btn(e)}</div>`).join('')}</details>`;
  return h;
}
function concursoPlanoAbrir(){
  let el = document.getElementById('concurso-plano');
  if(!el){
    el = document.createElement('div'); el.id = 'concurso-plano'; el.className = 'lei-modal'; el.hidden = true;
    el.innerHTML = `<div class="lei-caixa prova-caixa conc-caixa" role="dialog" aria-label="Plano de estudo do cargo"><div class="lei-barra"><strong>Plano de estudo do cargo</strong><button type="button" class="btn-ui" data-conc-fechar="1" title="Fechar">✕</button></div><div class="lei-corpo" id="concurso-plano-corpo"></div></div>`;
    el.addEventListener('mousedown', e => { if(e.target === el) el.hidden = true; });
    el.addEventListener('click', e => {
      const r = e.target.closest && e.target.closest('[data-conc-resumo]'); const q = e.target.closest && e.target.closest('[data-conc-quest]');
      if(r && typeof reta7AbrirResumo === 'function'){ el.hidden = true; reta7AbrirResumo(r.dataset.concResumo); }
      if(q && !concursoAbrirMateriaQuestoes(q.dataset.concQuest)){ alert('Esta lista ainda não foi importada neste aparelho. Importe o .md da matéria na aba Importar.'); }
    });
    document.addEventListener('keydown', e => { if(e.key === 'Escape' && !el.hidden) el.hidden = true; });
    document.body.appendChild(el);
  }
  document.getElementById('concurso-plano-corpo').innerHTML = concursoPlanoHtml();
  el.hidden = false;
}

/* ---------- escolher concurso e cargo (aparece após o login e pelo botão do cartão da prova) ---------- */
function concursoEscolherAbrir(){
  const m = concursoModal(); const corpo = document.getElementById('concurso-corpo');
  m.dataset.obrig = CONC_DB.escolhido ? '' : '1';
  m.querySelector('.lei-barra strong').textContent = CONC_DB.escolhido ? 'Escolha o concurso e o cargo' : 'Escolha a instituição e o cargo para começar';
  const todos = [CONCURSO_PADRAO].concat(CONC_DB.lista);
  const ativo = CONC_DB.ativo || 'padrao';
  const cargosDe = id => { const c = todos.find(x => x.id === id); return c && c.id !== 'padrao' ? (c.cargos || []) : []; };
  const html = () => {
    const sel = corpo.dataset.sel || ativo;
    const cs = cargosDe(sel);
    return `<div class="conc-esc">${todos.map(c => `<label class="conc-op"><input type="radio" name="conc-esc" value="${esc(c.id)}" ${c.id === sel ? 'checked' : ''}> <span><b>${esc(c.nome)}</b><br><small>${esc(c.orgao || '')}${c.banca ? ' · ' + esc(c.banca) : ''}${c.rotulo ? ' · prova ' + esc(c.rotulo) : ''}</small></span>${c.id !== 'padrao' ? `<button type="button" class="prova-det-btn" data-conc-excluir="${esc(c.id)}" title="Remove este concurso da lista">🗑</button>` : ''}</label>`).join('')}</div>
      ${cs.length ? `<label class="conc-l"><span>Cargo</span><select id="conc-esc-cargo" class="conc-sel">${cs.map(x => `<option ${x.nome === CONC_DB.cargo && sel === ativo ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></label>` : (sel !== 'padrao' ? '<small>Este concurso não tem cargos cadastrados: use Carregar edital para completar.</small>' : '')}
      <div class="conc-acoes"><button type="button" class="side-action-btn compact" data-conc-ir="1">✔ Estudar este</button><button type="button" class="side-action-btn compact" data-conc-abrir="1">＋ Novo concurso (carregar edital)</button></div>`;
  };
  corpo.dataset.sel = ativo; corpo.innerHTML = html(); m.hidden = false;
  corpo.onchange = e => { if(e.target.name === 'conc-esc'){ corpo.dataset.sel = e.target.value; corpo.innerHTML = html(); } };
  corpo.onclick = e => {
    const ex = e.target.closest && e.target.closest('[data-conc-excluir]');
    if(ex){ e.preventDefault(); if(confirm('Remover este concurso da lista?')){ concursoExcluir(ex.dataset.concExcluir); corpo.dataset.sel = 'padrao'; corpo.innerHTML = html(); if(typeof render === 'function') render(); } return; }
    if(e.target.closest && e.target.closest('[data-conc-ir]')){
      const id = corpo.dataset.sel || 'padrao'; const cg = (document.getElementById('conc-esc-cargo') || {}).value || '';
      if(id !== 'padrao' && !cg && cargosDe(id).length){ alert('Escolha o cargo.'); return; }
      concursoEscolher(id, cg); m.dataset.obrig = ''; m.hidden = true; if(typeof render === 'function') render();
      if(id !== 'padrao') concursoPlanoAbrir();
    }
  };
}
/* após o login a escolha da instituição e do cargo é obrigatória (vale para a conta; sincroniza pela nuvem) */
function concursoPerguntaInicial(){
  if(CONC_DB.escolhido) return;
  const m = document.getElementById('concurso-modal'); if(m && !m.hidden) return;
  setTimeout(() => { if(!CONC_DB.escolhido){ const mm = document.getElementById('concurso-modal'); if(!mm || mm.hidden) concursoEscolherAbrir(); } }, 300);
}

concursoCarregar();
