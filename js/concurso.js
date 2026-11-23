/* CONCURSO ATIVO — nome, órgão, cargo, banca, data da prova e demais detalhes.
   O padrão é o TCDF 2026. Ao carregar o edital (PDF ou texto), os campos são extraídos, o usuário confere e aplica:
   o cabeçalho, a contagem regressiva, os detalhes e as mensagens do dia passam a usar o concurso novo.
   Fica no aparelho (localStorage) e sobe para a nuvem junto com o progresso da revisão (vale o mais recente). */
const CONCURSO_KEY = 'ia_concurso_v1';
const CONCURSO_PADRAO = {
  padrao: true, nome: 'Analista de Controle Externo — TCDF 2026', orgao: 'Tribunal de Contas do Distrito Federal',
  cargo: 'Analista Administrativo de Controle Externo, Área de Gestão', banca: 'Cebraspe',
  data: '2026-11-22', rotulo: '22/11/2026 (manhã)', link: 'https://www.cebraspe.org.br/concursos/TC_DF_26_ANALISTA',
  remuneracao: 'R$ 14.990,41', vagas: '10 imediatas e cadastro de reserva', itens: [], materias: [], ts: 0
};
let CONCURSO = Object.assign({}, CONCURSO_PADRAO);
const PROVA_TCDF = { data: new Date(2026, 10, 22), rotulo: CONCURSO_PADRAO.rotulo, link: CONCURSO_PADRAO.link };

function concursoCarregar(){
  let c = null;
  try{ c = JSON.parse(localStorage.getItem(CONCURSO_KEY) || 'null'); }catch(_){}
  CONCURSO = (c && typeof c === 'object' && !Array.isArray(c) && c.nome && !c.padrao) ? Object.assign({}, CONCURSO_PADRAO, c, { padrao: false }) : Object.assign({}, CONCURSO_PADRAO, { ts: (c && c.ts) || 0 });
  concursoAplicar();
}
function concursoSalvar(c){
  try{
    if(!c || c.padrao) localStorage.setItem(CONCURSO_KEY, JSON.stringify({ padrao: true, ts: Date.now() }));
    else localStorage.setItem(CONCURSO_KEY, JSON.stringify(Object.assign({}, c, { padrao: false, ts: Date.now() })));
  }catch(_){}
  concursoCarregar();
  try{ if(typeof sincronizarRevisao === 'function') sincronizarRevisao(); }catch(_){}
}
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
  try{ document.title = 'IA Concurseira'; }catch(_){}
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
  const r = { nome: '', orgao: '', cargo: '', banca: '', data: '', rotulo: '', link: '', remuneracao: '', vagas: '', itens: [], materias: [] };
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
  // matérias: linhas curtas após "conhecimentos ..." / "disciplinas" / "conteúdo programático"
  const mats = []; let dentro = false;
  linhas.forEach(l => {
    if(/^(conhecimentos\s+(b[áa]sicos|gerais|espec[ií]ficos|especializados)|conte[úu]do program[áa]tico|disciplinas?|l[íi]ngua portuguesa|legisla[cç][aã]o)/i.test(l) && l.length < 80){ dentro = true; }
    const lim = l.replace(/^[\d.\-•*▪►]+\s*/, '').replace(/[:.;]+$/, '').trim();
    if(dentro && lim.length >= 4 && lim.length <= 70 && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(lim) && !/\d{3,}/.test(lim) && !/^(edital|p[áa]gina|anexo|item|art)/i.test(lim)){
      if(/^(direito|l[íi]ngua|racioc[íi]nio|inform[áa]tica|matem[áa]tica|contabilidade|administra[cç][aã]o|auditoria|economia|estat[íi]stica|legisla[cç][aã]o|ci[êe]ncia|conhecimentos|realidade|atualidades|regimento|[ée]tica|geografia|hist[óo]ria|portugu[êe]s|ingl[êe]s|administra|gest[aã]o|finan[cç]as|licita|controle|tecnologia|banco|an[áa]lise|engenharia|pol[íi]ticas|seguran[cç]a|arquivologia|biologia|f[íi]sica|qu[íi]mica)/i.test(lim) && !/^conhecimentos|^conte[úu]do|^disciplinas?$/i.test(lim) && !mats.includes(lim)) mats.push(lim);
    }
  });
  r.materias = mats.slice(0, 40);
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
function concursoItensTexto(c){ return (c.itens || []).map(p => p[0] + ': ' + p[1]).join('\n'); }
function concursoItensDeTexto(s){ return String(s || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const i = l.indexOf(':'); return i > 0 && i < 40 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['Detalhe', l]; }); }
function concursoModal(){
  let el = document.getElementById('concurso-modal');
  if(!el){
    el = document.createElement('div'); el.id = 'concurso-modal'; el.className = 'lei-modal'; el.hidden = true;
    el.innerHTML = `<div class="lei-caixa prova-caixa conc-caixa" role="dialog" aria-label="Carregar edital"><div class="lei-barra"><strong>Carregar edital do concurso</strong><button type="button" class="btn-ui" data-conc-fechar="1" title="Fechar">✕</button></div><div class="lei-corpo" id="concurso-corpo"></div></div>`;
    el.addEventListener('mousedown', e => { if(e.target === el) el.hidden = true; });
    document.addEventListener('keydown', e => { if(e.key === 'Escape' && !el.hidden) el.hidden = true; });
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
    <label class="conc-l"><span>Matérias do edital (uma por linha)</span><textarea id="conc-materias" class="conc-ta" rows="4">${v((c.materias || []).join('\n'))}</textarea></label>
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
    materias: g('materias').split('\n').map(s => s.trim()).filter(Boolean), itens: concursoItensDeTexto(g('itens')) };
}
function concursoPreencher(r){
  Object.keys(r).forEach(k => { const el = document.getElementById('conc-' + k); if(!el) return; el.value = Array.isArray(r[k]) ? (k === 'itens' ? concursoItensTexto({ itens: r[k] }) : r[k].join('\n')) : (r[k] || el.value); });
}
async function concursoProcessarTexto(txt, st){
  const r = editalExtrair(txt);
  concursoPreencher(r);
  const ach = ['nome', 'orgao', 'cargo', 'banca', 'data', 'remuneracao'].filter(k => r[k]).length;
  if(st) st.textContent = `Lido: ${ach} de 6 campos principais encontrados. Confira e ajuste.`;
}
function concursoAbrir(){
  const el = concursoModal();
  document.getElementById('concurso-corpo').innerHTML = concursoForm(CONCURSO);
  el.hidden = false;
}
document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('[data-conc-abrir],[data-conc-fechar],[data-conc-colar],[data-conc-aplicar],[data-conc-padrao]'); if(!t) return;
  if(t.hasAttribute('data-conc-abrir')) return concursoAbrir();
  if(t.hasAttribute('data-conc-fechar')) { concursoModal().hidden = true; return; }
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
    concursoSalvar(c); concursoModal().hidden = true; if(typeof render === 'function') render();
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
concursoCarregar();
