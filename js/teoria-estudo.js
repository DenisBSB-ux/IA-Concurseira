/* ESTUDO POR TÓPICO DO EDITAL: liga cada questão ao tópico da teoria-base, mostra a cobertura do edital do cargo e
   sugere o que estudar agora. Usa a base (teoria/<slug>/base.json) e os perfis já carregados por js/teoria-base.js.
   O tópico da questão é deduzido do texto (heurística): dentro do item do edital da questão, vence o tópico cujo termo
   mais aparece no enunciado, nas alternativas e na resolução. Sem acerto claro, a questão fica só no item do edital. */
const TEORIA_BASE_PRE = {};      // slug -> base.json (preenchida por teoriaPrecarregarPerfis)
const TB_STOP = new Set('para como pela pelo pelas pelos com dos das uma que nos nas sem por mais entre sobre este esta esse essa seus suas cada todos todas quando onde qual quais ser sao foi nao ele ela eles elas'.split(' '));
function tbNorm(s){ return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function tbStems(s){
  const out = new Set(); (tbNorm(s).match(/[a-z0-9]{3,}/g) || []).forEach(w => { if(!TB_STOP.has(w)) out.add(w.slice(0, 5)); }); return out;
}
function tbPerfilDeReferencia(slug){ const ps = TEORIA_PERFIS_PRE[slug]; return ps ? Object.values(ps).find(p => p.referencia) || null : null; }
function tbPerfilAtivo(slug){ const ps = TEORIA_PERFIS_PRE[slug]; return ps ? (ps[(typeof CONCURSO !== 'undefined' && CONCURSO.id) || ''] || null) : null; }
function tbTopico(slug, id){ const b = TEORIA_BASE_PRE[slug]; return b ? (b.topicos || []).find(t => t.id === id) || null : null; }
const _tbCandCache = {};
function tbCandidatos(slug, tema){
  const ref = tbPerfilDeReferencia(slug), base = TEORIA_BASE_PRE[slug]; if(!ref || !base) return [];
  const item = tbAcharItem(ref.padrao, tema); if(!item) return [];
  const k = slug + '|' + item.n + ' ' + item.t + '|' + (base.versao || 0); if(_tbCandCache[k]) return _tbCandCache[k];
  const lista = (item.topicos || []).map(id => base.topicos.find(t => t.id === id)).filter(t => t && t.resumo && !/\.pegadinhas$|\.quadro-/.test(t.id))
    .map(t => ({ id: t.id, termo: tbStems(t.t + ' ' + (t.palavras || []).join(' ')), corpo: tbStems(t.resumo) }));
  return (_tbCandCache[k] = lista);
}
/* tópico (id) da questão dentro do item do edital em que ela está; null se não houver acerto claro */
function teoriaTopicoDaQuestao(q){
  const slug = teoriaSlugDe(q.materia); if(!slug || !TEORIA_BASE_PRE[slug]) return null;
  const cands = tbCandidatos(slug, q.tema); if(!cands.length) return null;
  if(cands.length === 1) return cands[0].id;      // item com um só tópico: sem ambiguidade
  const enun = (q.q || '') + ' ' + (Array.isArray(q.alt) ? q.alt.map(a => (a && a.texto) || a || '').join(' ') : '');
  const qa = tbStems(enun), qr = tbStems(q.r || ''); let melhor = null, pm = 0;
  cands.forEach(c => {
    let sc = 0; c.termo.forEach(w => { if(qa.has(w)) sc += 3; else if(qr.has(w)) sc += 1; });      // o termo no enunciado/alternativas pesa mais que na resolução
    let ov = 0; c.corpo.forEach(w => { if(qa.has(w)) ov++; }); sc += Math.min(ov, 10) * 0.3;
    if(sc > pm){ pm = sc; melhor = c.id; }
  });
  return pm >= 3 ? melhor : null;
}
function teoriaClassificarQuestoes(){
  if(typeof ALL_QUESTIONS === 'undefined') return;
  ALL_QUESTIONS.forEach(q => { q.topicoId = null; if(Object.keys(TEORIA_BASE_PRE).length){ try{ q.topicoId = teoriaTopicoDaQuestao(q); }catch(_){} } });
}
/* ---------- desempenho por tópico, cobertura e prioridades ---------- */
function teoriaItensAtivos(slug){
  const ativo = tbPerfilAtivo(slug) || tbPerfilDeReferencia(slug); if(!ativo) return null;
  const cargo = (typeof CONCURSO !== 'undefined' && CONCURSO.cargo) || '';
  return { perfil: ativo, itens: (ativo.cargos && ativo.cargos[cargo]) || ativo.padrao || [] };
}
function teoriaStats(materia){
  const slug = teoriaSlugDe(materia), ia = slug && TEORIA_BASE_PRE[slug] ? teoriaItensAtivos(slug) : null; if(!ia) return null;
  const bucket = (typeof getBucket === 'function') ? getBucket(materia) : { perguntas: {} };
  const qs = ALL_QUESTIONS.filter(q => q.materia === materia && !q.duplicataOculta && (q.t === 'CE' || q.t === 'MC'));
  const porTop = {};
  qs.forEach(q => { if(q.topicoId) (porTop[q.topicoId] = porTop[q.topicoId] || []).push(q); });
  const stat = ids => {
    const lista = ids.reduce((a, id) => a.concat(porTop[id] || []), []); let resp = 0, ac = 0, ts = 0;
    lista.forEach(q => { const p = bucket.perguntas[q.uid]; if(!p || p.ultimoResultado == null) return; resp++; if(p.ultimoResultado === true) ac++; const h = p.historico && p.historico[p.historico.length - 1]; if(h && h.ts > ts) ts = h.ts; });
    return { n: lista.length, resp, ac, ts, uids: lista.map(q => q.uid) };
  };
  const nItem = {}; qs.forEach(q => { const k = String(q.tema || ''); nItem[k] = (nItem[k] || 0) + 1; });      // por assunto completo ("3.1 Direitos sociais")
  const itens = ia.itens.map(it => {
    const tops = (it.topicos || []).map(id => tbTopico(slug, id)).filter(t => t && t.resumo && !/\.pegadinhas$|\.quadro-/.test(t.id));
    const linhas = tops.map(t => Object.assign({ id: t.id, t: t.t }, stat([t.id])));
    const ligadas = linhas.reduce((s, l) => s + l.n, 0), total = (it.n + ' ' + it.t) in nItem ? nItem[it.n + ' ' + it.t] : ligadas;      // perfil de outro edital: só se contam as questões ligadas aos tópicos dele
    const agg = stat(tops.map(t => t.id));
    return { n: it.n, t: it.t, topicos: linhas, total, ligadas, resp: agg.resp, ac: agg.ac };
  });
  // prioridade = peso (questões do tópico) × urgência (erro + tempo sem treinar); tópico sem questão não entra
  const agora = Date.now(), prio = [];
  itens.forEach(it => it.topicos.forEach(l => {
    if(!l.n) return;
    const acerto = (l.ac + 1) / (l.resp + 2), dias = l.ts ? (agora - l.ts) / 86400000 : 99;
    const urg = (1 - acerto) + (dias >= 7 ? 0.25 : 0) + (l.resp < l.n ? 0.15 : 0);
    prio.push({ id: l.id, t: l.t, item: it.n, n: l.n, resp: l.resp, ac: l.ac, dias, score: l.n * urg });
  }));
  prio.sort((a, b) => b.score - a.score);
  return { slug, perfil: ia.perfil, itens, prioridades: prio.slice(0, 5), materia };
}
function teoriaPainelHtml(materia){
  const st = teoriaStats(materia);
  if(!st) return '';
  const pc = (a, b) => b ? Math.round(100 * a / b) + '%' : '—';
  const nome = (typeof CONCURSO !== 'undefined' && CONCURSO.nome) || st.perfil.concurso || '';
  const cargo = (typeof CONCURSO !== 'undefined' && CONCURSO.cargo) ? String(CONCURSO.cargo).split(' — ').pop() : '';
  const prio = st.prioridades.length ? `<div class="tc-prio"><b>🎯 Estudar agora</b><ol>${st.prioridades.map(p => `<li><span><b>${tbEsc(p.t)}</b> <small>item ${tbEsc(p.item)} · ${p.n} ${p.n > 1 ? 'questões' : 'questão'}${p.resp ? ' · ' + pc(p.ac, p.resp) + ' de acerto' : ' · ainda não treinado'}${p.dias < 99 ? ' · há ' + Math.floor(p.dias) + ' dia' + (Math.floor(p.dias) === 1 ? '' : 's') : ''}</small></span> <button type="button" class="fe-bt" data-tb-estudar="${tbEsc(p.id)}">Treinar</button> <button type="button" class="fe-bt" data-tb-teoria="${tbEsc(p.id)}">📘</button></li>`).join('')}</ol></div>` : '';
  const sem = st.itens.filter(i => !i.total).length;
  const linhas = st.itens.map(it => `<details class="tc-item"><summary><span class="tc-n">${tbEsc(it.n)}</span><span class="tc-t">${tbEsc(it.t)}</span><span class="tc-q">${it.total} q.</span><span class="tc-a">${pc(it.ac, it.resp)}</span><span class="tc-s ${it.total ? (it.resp ? 'ok' : 'par') : 'sem'}">${it.total ? (it.resp ? 'em estudo' : 'não iniciado') : 'sem questões'}</span></summary>
    <ul>${it.topicos.map(l => `<li><span class="tc-lt">${tbEsc(l.t)}</span> <small>${l.n ? l.n + ' q. · ' + (l.resp ? pc(l.ac, l.resp) + ' acerto' : 'não treinado') : 'sem questões na lista'}</small> ${l.n ? `<button type="button" class="fe-bt" data-tb-estudar="${tbEsc(l.id)}">Treinar</button>` : ''} <button type="button" class="fe-bt" data-tb-teoria="${tbEsc(l.id)}">📘 Teoria</button></li>`).join('')}</ul>${it.total > it.ligadas ? `<p class="tc-obs">${it.total - it.ligadas} questão(ões) deste item não foram ligadas a um tópico específico (entram só no item).</p>` : ''}</details>`).join('');
  return `<section class="tc-painel"><h3>📊 Cobertura do edital</h3><p class="tc-sub">${tbEsc(nome)}${cargo ? ' · ' + tbEsc(cargo) : ''} — lista: ${tbEsc(materia)}</p>${prio}
    <div class="tc-cab"><span>Item do edital</span><span>Questões</span><span>Acerto</span><span>Situação</span></div>${linhas}
    ${sem ? `<p class="tc-obs">⚠️ ${sem} item(ns) do edital sem nenhuma questão nesta lista: faltam questões para cobrir o edital.</p>` : ''}</section>`;
}
/* chip do tópico dentro da questão */
function teoriaChipDaQuestao(q){
  if(!q || !q.topicoId) return '';
  const slug = teoriaSlugDe(q.materia), t = slug ? tbTopico(slug, q.topicoId) : null; if(!t) return '';
  return ` <button type="button" class="q-topico" data-tb-teoria="${tbEsc(t.id)}" title="Abrir a teoria deste tópico na apostila do edital">📘 ${tbEsc(t.t)}</button>`;
}
/* treinar as questões do tópico: as ainda não acertadas primeiro */
function teoriaEstudarTopico(id){
  const materia = STATE.materia, slug = teoriaSlugDe(materia); if(!slug) return;
  const bucket = (typeof getBucket === 'function') ? getBucket(materia) : { perguntas: {} };
  const qs = ALL_QUESTIONS.filter(q => q.materia === materia && !q.duplicataOculta && q.topicoId === id && (q.t === 'CE' || q.t === 'MC')); if(!qs.length) return;
  const pend = [], ok = []; qs.forEach(q => { const p = bucket.perguntas[q.uid]; ((p && p.ultimoResultado === true) ? ok : pend).push(q.uid); });
  const t = tbTopico(slug, id);
  teoriaFechar();
  setLocalTab(materia, 'simulado');
  STATE.quiz = { queue: shuffle(pend).concat(shuffle(ok)), idx: 0, respostas: {}, finished: false, materia, tema: 'todos', origemErros: true, treinoArmadilha: 'Tópico: ' + (t ? t.t : id) };
  salvarQuizEmAndamento(); render();
}
document.addEventListener('click', e => {
  const t = e.target; if(!t || !t.closest) return;
  const es = t.closest('[data-tb-estudar]'); if(es){ e.preventDefault(); e.stopPropagation(); teoriaEstudarTopico(es.dataset.tbEstudar); return; }
  const te = t.closest('[data-tb-teoria]'); if(te){ e.preventDefault(); e.stopPropagation(); const id = te.dataset.tbTeoria, sl = Object.keys(TEORIA_BASE_PRE).find(x => (TEORIA_BASE_PRE[x].topicos || []).some(y => y.id === id)) || null; if(sl) teoriaAbrir(sl, id); }
}, true);
