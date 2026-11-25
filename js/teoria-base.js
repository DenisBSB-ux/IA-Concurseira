/* TEORIA-BASE ÚNICA + PERFIL POR EDITAL/CARGO.
   A teoria de cada matéria existe UMA vez (base: tópicos com id permanente). Cada edital tem um perfil que escolhe e ordena
   esses tópicos pelos itens do edital (lista padrão + exceções por cargo). A apostila do edital é montada na hora.
   Nuvem: coleção Firestore "teoria" (leitura pública, escrita só do administrador; ver firestore.rules), com cópia estática
   em teoria/<slug>/ (offline e reserva). Vale a de maior "versao". Esquema e regras: teoria/LEIAME.md. */
const tbEsc = s => esc(String(s == null ? "" : s));
const TEORIA_BASE_INDICE = {
  'redes-de-computadores': { materia: 'Redes de Computadores', perfis: ['dpdf-2026-analista'] }
};
const TEORIA_ADMIN_UIDS = ['LjkZLfBRfNRuDxHqbA3ivlywlq23'];   // os mesmos de firestore.rules (a regra é quem de fato protege a escrita)
const TEORIA_BASE_CACHE = {};        // slug -> { base, perfis:{concursoId: perfil}, origem }
const TEORIA_CHUNK = 350000;    // bytes de JSON por documento (limite do Firestore: 1 MB)

/* O Firestore não aceita lista dentro de lista: na nuvem, linhas de tabela e fontes viram objetos; na leitura voltam ao formato do arquivo */
function teoriaParaNuvem(topicos){
  return topicos.map(t => Object.assign({}, t, t.tabelas ? { tabelas: t.tabelas.map(tb => Object.assign({}, tb, { linhas: (tb.linhas || []).map(l => ({ c: l })) })) } : {}));
}
function teoriaDaNuvem(topicos){
  return topicos.map(t => Object.assign({}, t, t.tabelas ? { tabelas: t.tabelas.map(tb => Object.assign({}, tb, { linhas: (tb.linhas || []).map(l => Array.isArray(l) ? l : (l && l.c) || []) })) } : {}));
}
function teoriaFontesParaNuvem(f){ return (f || []).map(x => Array.isArray(x) ? { t: x[0], u: x[1] || '' } : x); }
function teoriaFontesDaNuvem(f){ return (f || []).map(x => (x && typeof x === 'object' && !Array.isArray(x)) ? [x.t || '', x.u || ''] : x); }
function teoriaSlugDe(materia){
  const m = (typeof apostilaMateria === 'function') ? apostilaMateria(materia) : String(materia || '');
  const k = String(m).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return TEORIA_BASE_INDICE[k] ? k : null;
}
function teoriaVersao(){ try{ return (window.__TCDF_BUILD__ || {}).versao || ''; }catch(_){ return ''; } }
async function teoriaFetchJson(url){
  const r = await fetch(url + (teoriaVersao() ? '?v=' + teoriaVersao() : ''), { cache: 'no-cache' });
  if(!r.ok) throw new Error('HTTP ' + r.status + ' em ' + url);
  return r.json();
}
/* lê a base e os perfis na nuvem (se houver) e na cópia estática; fica com a de maior versão */
async function teoriaLerNuvem(slug){
  if(typeof FIREBASE_OK === 'undefined' || !FIREBASE_OK || !fbDb) return null;
  const col = fbDb.collection('teoria');
  const lim = (p, ms) => (typeof comLimiteDeTempo === 'function') ? comLimiteDeTempo(p, ms, 'tempo esgotado ao ler a teoria na nuvem') : p;
  const d0 = await lim(col.doc('base__' + slug).get(), 9000);
  if(!d0.exists) return null;
  const base = d0.data(); let topicos = (base.topicos || []).slice();
  for(let i = 1; i < (base.partes || 1); i++){
    const dp = await lim(col.doc('base__' + slug + '__p' + i).get(), 9000);
    if(dp.exists) topicos = topicos.concat(dp.data().topicos || []);
  }
  base.topicos = teoriaDaNuvem(topicos); base.fontes = teoriaFontesDaNuvem(base.fontes);
  const perfis = {};
  for(const cid of (TEORIA_BASE_INDICE[slug].perfis || [])){
    try{ const dp = await lim(col.doc('perfil__' + slug + '__' + cid).get(), 9000); if(dp.exists) perfis[cid] = dp.data(); }catch(_){}
  }
  return { base, perfis };
}
async function teoriaLerEstatica(slug){
  const base = await teoriaFetchJson('teoria/' + slug + '/base.json');
  const perfis = {};
  for(const cid of (TEORIA_BASE_INDICE[slug].perfis || [])){ try{ perfis[cid] = await teoriaFetchJson('teoria/' + slug + '/perfil-' + cid + '.json'); }catch(_){} }
  return { base, perfis };
}
async function teoriaCarregar(slug){
  if(TEORIA_BASE_CACHE[slug]) return TEORIA_BASE_CACHE[slug];
  const [est, nuv] = await Promise.all([teoriaLerEstatica(slug).catch(() => null), teoriaLerNuvem(slug).catch(() => null)]);
  if(!est && !nuv) throw new Error('Não foi possível carregar a teoria agora. Tente de novo com internet.');
  let base = est && est.base, origem = 'site';
  if(nuv && (!base || (nuv.base.versao || 0) >= (base.versao || 0))){ base = nuv.base; origem = 'nuvem'; }
  const perfis = {};
  [est, nuv].forEach(f => { if(!f) return; Object.keys(f.perfis).forEach(cid => { const p = f.perfis[cid]; if(!perfis[cid] || (p.versao || 0) >= (perfis[cid].versao || 0)) perfis[cid] = p; }); });
  return (TEORIA_BASE_CACHE[slug] = { base, perfis, origem });
}
/* capítulos da apostila para o concurso/cargo ativo: [{n,t,topicos:[objetos]}] + avisos */
function teoriaMontar(dados){
  const porId = {}; dados.base.topicos.forEach(t => { porId[t.id] = t; });
  const perfil = dados.perfis[(typeof CONCURSO !== 'undefined' && CONCURSO.id) || ''] || null;
  const avisos = []; let caps;
  if(perfil){
    const cargo = (typeof CONCURSO !== 'undefined' && CONCURSO.cargo) || '';
    const itens = (perfil.cargos && perfil.cargos[cargo]) || perfil.padrao || [];
    caps = itens.map(it => ({ n: it.n, t: it.t, topicos: (it.topicos || []).map(id => porId[id] || (avisos.push('Tópico "' + id + '" do perfil não existe na base.'), null)).filter(Boolean) }));
  }else{
    avisos.push('Esta matéria ainda não tem perfil para o edital ativo; mostrando a teoria completa na ordem da base.');
    caps = [{ n: '', t: 'Teoria completa', topicos: dados.base.topicos.slice() }];
  }
  return { perfil, caps, avisos };
}
function teoriaInline(s){
  return tbEsc(String(s == null ? '' : s)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/==(.+?)==/g, '<mark>$1</mark>');
}
function teoriaTabela(tb){
  const cab = tb.cab || [];
  return '<div class="tb-tabela-w">' + (tb.titulo ? '<div class="tb-tabela-t">' + tbEsc(tb.titulo) + '</div>' : '') + '<table class="tb-tabela"><thead><tr>' + cab.map(c => '<th>' + teoriaInline(c) + '</th>').join('') + '</tr></thead><tbody>'
    + (tb.linhas || []).map(l => '<tr>' + l.map((c, i) => (i === 0 ? '<th scope="row">' : '<td>') + teoriaInline(c) + (i === 0 ? '</th>' : '</td>')).join('') + '</tr>').join('') + '</tbody></table></div>';
}
function teoriaTopicoHtml(t, slug){
  const org = { questoes: 'das questões', apostila: 'da apostila', externa: 'fonte externa' }[t.origem] || '';
  return '<article class="tb-top" id="tb-' + tbEsc(t.id) + '"><h4>' + tbEsc(t.t || '') + (org ? ' <small class="tb-org">' + org + '</small>' : '') + '</h4>'
    + (t.resumo ? '<p>' + teoriaInline(t.resumo) + '</p>' : '')
    + ((t.pontos || []).length ? '<ul>' + t.pontos.map(p => '<li>' + teoriaInline(p) + '</li>').join('') + '</ul>' : '')
    + (t.tabelas || []).map(teoriaTabela).join('')
    + (t.figuras || []).map(f => '<figure class="tb-fig" data-tb-fig="' + tbEsc('teoria/' + slug + '/' + f.src) + '"><div class="tb-fig-i">Carregando figura…</div>' + (f.legenda ? '<figcaption>' + tbEsc(f.legenda) + '</figcaption>' : '') + '</figure>').join('')
    + (t.macete ? '<p class="tb-macete">💡 <i>' + teoriaInline(t.macete) + '</i></p>' : '')
    + (t.pegadinhas ? '<p class="tb-peg">⚠️ ' + teoriaInline(t.pegadinhas) + '</p>' : '')
    + '</article>';
}
function teoriaApostilaHtml(slug, dados){
  const m = teoriaMontar(dados), nome = TEORIA_BASE_INDICE[slug].materia;
  const cargo = (typeof CONCURSO !== 'undefined' && CONCURSO.cargo) ? String(CONCURSO.cargo).split(' — ').pop() : '';
  const fontes = (dados.base.fontes || []).map(f => Array.isArray(f) ? '<li>' + (/^https?:|^apostilas\//.test(f[1] || '') ? '<a href="' + tbEsc(f[1]) + '" target="_blank" rel="noopener noreferrer">' + tbEsc(f[0]) + '</a>' : tbEsc(f[0])) + '</li>' : '<li>' + tbEsc(f) + '</li>').join('');
  return '<div class="tb-cab"><div><h3>' + tbEsc(nome) + ' — apostila do edital</h3><p class="tb-sub">' + (m.perfil ? tbEsc(m.perfil.concurso || '') + (cargo ? ' · ' + tbEsc(cargo) : '') : 'sem perfil de edital') + ' · versão ' + tbEsc(dados.base.versao) + ' (' + tbEsc(dados.origem) + ')</p></div>'
    + '<button type="button" class="tb-x" data-tb-fechar="1" aria-label="Fechar">✕</button></div>'
    + (m.avisos.length ? '<div class="tb-aviso">' + m.avisos.map(esc).join('<br>') + '</div>' : '')
    + '<nav class="tb-sum" aria-label="Sumário">' + m.caps.map((c, i) => '<a href="#tb-cap-' + i + '" data-tb-ir="tb-cap-' + i + '">' + (c.n !== '' ? '<b>' + tbEsc(c.n) + '</b> ' : '') + tbEsc(c.t) + '</a>').join('') + '</nav>'
    + m.caps.map((c, i) => '<section class="tb-cap" id="tb-cap-' + i + '"><h3>' + (c.n !== '' ? '<span class="tb-n">Item ' + tbEsc(c.n) + ' do edital</span> ' : '') + tbEsc(c.t) + '</h3>' + c.topicos.map(t => teoriaTopicoHtml(t, slug)).join('') + '</section>').join('')
    + (fontes ? '<section class="tb-fontes"><h4>Fontes</h4><ul>' + fontes + '</ul></section>' : '');
}
async function teoriaAbrir(slug){
  if(!TEORIA_BASE_INDICE[slug]) return;
  let box = document.getElementById('tb-modal'); if(box) box.remove();
  box = document.createElement('div'); box.id = 'tb-modal'; box.className = 'tb-modal'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  box.innerHTML = '<div class="tb-caixa"><p class="tb-carregando">Carregando a apostila…</p></div>';
  document.body.appendChild(box);
  const caixa = box.firstChild;
  try{
    const dados = await teoriaCarregar(slug);
    caixa.innerHTML = teoriaApostilaHtml(slug, dados);
    caixa.querySelectorAll('[data-tb-fig]').forEach(async f => {
      const alvo = f.querySelector('.tb-fig-i'), url = f.dataset.tbFig;
      try{
        if(/\.svg$/i.test(url)){ const r = await fetch(url + (teoriaVersao() ? '?v=' + teoriaVersao() : '')); if(!r.ok) throw 0; const txt = await r.text(); alvo.innerHTML = txt.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, ''); }
        else alvo.innerHTML = '<img src="' + tbEsc(url) + '" alt="">';
      }catch(_){ alvo.textContent = 'Figura indisponível.'; }
    });
  }catch(e){ caixa.innerHTML = '<div class="tb-cab"><h3>Apostila indisponível</h3><button type="button" class="tb-x" data-tb-fechar="1" aria-label="Fechar">✕</button></div><div class="tb-aviso">' + tbEsc(e.message || e) + '</div>'; }
}
function teoriaFechar(){ const b = document.getElementById('tb-modal'); if(b) b.remove(); }
function teoriaEhAdmin(){ return typeof USUARIO_ATUAL !== 'undefined' && USUARIO_ATUAL && TEORIA_ADMIN_UIDS.includes(USUARIO_ATUAL.uid); }
/* Publicação (só administrador): envia base e perfis da cópia estática do repositório para a coleção "teoria" */
async function teoriaPublicarNuvem(slug){
  if(!teoriaEhAdmin()) throw new Error('Só o administrador publica a teoria na nuvem.');
  if(typeof FIREBASE_OK === 'undefined' || !FIREBASE_OK || !fbDb) throw new Error('Sem conexão com o Firebase.');
  const est = await teoriaLerEstatica(slug), col = fbDb.collection('teoria'), b = est.base;
  const partes = []; let atual = [], tam = 0;
  b.topicos.forEach(t => { const n = JSON.stringify(t).length; if(atual.length && tam + n > TEORIA_CHUNK){ partes.push(atual); atual = []; tam = 0; } atual.push(t); tam += n; });
  if(atual.length) partes.push(atual);
  const lim = (p) => (typeof comLimiteDeTempo === 'function') ? comLimiteDeTempo(p, 20000, 'tempo esgotado ao publicar a teoria') : p;
  const san = (o) => (typeof sanitizarParaFirestore === 'function') ? sanitizarParaFirestore(o) : JSON.parse(JSON.stringify(o));
  for(let i = 1; i < partes.length; i++) await lim(col.doc('base__' + slug + '__p' + i).set(san({ slug, parte: i, topicos: teoriaParaNuvem(partes[i]) })));
  await lim(col.doc('base__' + slug).set(san({ tipo: 'base', slug, materia: b.materia, versao: b.versao, atualizado: b.atualizado, fontes: teoriaFontesParaNuvem(b.fontes), partes: partes.length || 1, topicos: teoriaParaNuvem(partes[0] || []) })));
  for(const cid of Object.keys(est.perfis)) await lim(col.doc('perfil__' + slug + '__' + cid).set(san(Object.assign({ tipo: 'perfil' }, est.perfis[cid]))));
  delete TEORIA_BASE_CACHE[slug];
  return { topicos: b.topicos.length, partes: partes.length, perfis: Object.keys(est.perfis).length };
}
/* Publicação automática: com a conta administradora logada, envia para a nuvem o que estiver mais novo no site (base ou perfil de versão maior).
   Roda uma vez por abertura da página, em segundo plano; erro só vai ao console. Para os demais usuários não faz nada. */
let TEORIA_AUTO_RODOU = false, TEORIA_AUTO_STATUS = '';
async function teoriaAutoPublicar(){
  if(TEORIA_AUTO_RODOU || !teoriaEhAdmin() || typeof FIREBASE_OK === 'undefined' || !FIREBASE_OK || !fbDb) return;
  TEORIA_AUTO_RODOU = true; const col = fbDb.collection('teoria'); let enviados = 0;
  try{
    for(const slug of Object.keys(TEORIA_BASE_INDICE)){
      const est = await teoriaLerEstatica(slug); let precisa = false;
      const db = await col.doc('base__' + slug).get();
      if(!db.exists || (db.data().versao || 0) < (est.base.versao || 0)) precisa = true;
      for(const cid of Object.keys(est.perfis)){
        const dp = await col.doc('perfil__' + slug + '__' + cid).get();
        if(!dp.exists || (dp.data().versao || 0) < (est.perfis[cid].versao || 0)) precisa = true;
      }
      if(precisa){ await teoriaPublicarNuvem(slug); enviados++; }
    }
    TEORIA_AUTO_STATUS = enviados ? 'ok:' + enviados : 'em-dia';
  }catch(e){ TEORIA_AUTO_STATUS = 'erro'; console.warn('Publicação automática da teoria falhou', e); TEORIA_AUTO_RODOU = false; }
  try{ if(typeof render === 'function' && STATE.localTab === 'materias') render(); }catch(_){}
}

/* ---- filtro de questões pelo perfil do edital/cargo ----
   Cada questão da lista geral já traz o item do edital de referência no assunto ("4 Protocolos…"). O perfil de referência
   (referencia:true) liga esse item aos ids de tópico; o perfil do edital ativo diz quais tópicos o cargo cobra.
   Questão cujos tópicos não estão no perfil ativo fica "fora do edital": oculta, a menos que o usuário peça para mostrar. */
const TEORIA_PERFIS_PRE = {};      // slug -> { concursoId: perfil }
function teoriaIdsDoPerfil(p, cargo){
  const itens = (p && ((p.cargos && p.cargos[cargo]) || p.padrao)) || [], ids = new Set();
  itens.forEach(it => (it.topicos || []).forEach(id => ids.add(id)));
  return ids;
}
function teoriaNoEdital(q){
  try{
    const slug = teoriaSlugDe(q.materia); if(!slug) return true;
    const perfis = TEORIA_PERFIS_PRE[slug]; if(!perfis) return true;
    const ativo = perfis[(typeof CONCURSO !== 'undefined' && CONCURSO.id) || '']; if(!ativo) return true;      // edital sem perfil: não filtra
    const tema = String(q.tema || '');
    if(/^Fora do edital/i.test(tema)) return false;
    const m = tema.match(/^(\d+) /); if(!m) return true;
    const ref = Object.values(perfis).find(p => p.referencia); if(!ref) return true;
    const item = (ref.padrao || []).find(i => String(i.n) === m[1]); if(!item) return true;
    const permitidos = teoriaIdsDoPerfil(ativo, (typeof CONCURSO !== 'undefined' && CONCURSO.cargo) || '');
    return (item.topicos || []).some(id => permitidos.has(id));
  }catch(_){ return true; }
}
async function teoriaPrecarregarPerfis(){
  let mudou = false;
  for(const slug of Object.keys(TEORIA_BASE_INDICE)){
    for(const cid of (TEORIA_BASE_INDICE[slug].perfis || [])){
      try{ const p = await teoriaFetchJson('teoria/' + slug + '/perfil-' + cid + '.json'); (TEORIA_PERFIS_PRE[slug] = TEORIA_PERFIS_PRE[slug] || {})[cid] = p; mudou = true; }catch(_){}
    }
  }
  if(mudou){ try{ if(typeof marcarDuplicatas === 'function' && typeof ALL_QUESTIONS !== 'undefined' && ALL_QUESTIONS.length) marcarDuplicatas(); if(typeof APP_INICIADO !== 'undefined' && APP_INICIADO && typeof render === 'function') render(); }catch(_){} }
}
setTimeout(teoriaPrecarregarPerfis, 600);
document.addEventListener('click', e => {
  const t = e.target; if(!t || !t.closest) return;
  const ab = t.closest('[data-teoria-abrir]'); if(ab){ e.preventDefault(); teoriaAbrir(ab.dataset.teoriaAbrir); return; }
  if(t.closest('[data-tb-fechar]') || t === document.getElementById('tb-modal')){ teoriaFechar(); return; }
  const ir = t.closest('[data-tb-ir]'); if(ir){ e.preventDefault(); const el = document.getElementById(ir.dataset.tbIr); if(el && el.scrollIntoView) el.scrollIntoView({ block: 'start' }); return; }
  const pub = t.closest('[data-teoria-publicar]'); if(pub){
    e.preventDefault(); const slug = pub.dataset.teoriaPublicar; pub.disabled = true; const txt = pub.textContent; pub.textContent = 'Publicando…';
    teoriaPublicarNuvem(slug).then(r => alert('Teoria reenviada à nuvem: ' + r.topicos + ' tópicos em ' + r.partes + ' documento(s) e ' + r.perfis + ' perfil(is).'))
      .catch(err => alert('Não publicou: ' + (err && err.message || err))).finally(() => { pub.disabled = false; pub.textContent = txt; });
  }
});
document.addEventListener('keydown', e => { if(e.key === 'Escape') teoriaFechar(); });
