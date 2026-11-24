/* Aba Discursiva: temas de treino (questão de 20 linhas e peça Informação de 50 linhas) com enunciado, padrão de resposta e quesitos,
   escrita com contador de linhas, calculadora de nota, folhas de treino e o Guia. A geração de temas novos e a correção da folha
   manuscrita por IA ficam no "Treino Discursiva" do claude.ai (botão na sub-aba "Treino com IA").
   Dados em js/discursiva-dados.js (carregado ao abrir a aba). Estado só neste aparelho (localStorage, chaves dsc.*). */
const DSC_CFG = {
  questao: { linhas: 20, total: 15, apres: 0.75, fator: 3, nome: 'Questão discursiva', sig: 'NQ' },
  peca:    { linhas: 50, total: 35, apres: 1.75, fator: 7, nome: 'Peça técnica — Informação', sig: 'NPNT' }
};
const DSC_SUBS = [['questao', 'Questões'], ['peca', 'Peças'], ['escrever', 'Escrever'], ['nota', 'Nota'], ['folhas', 'Folhas'], ['guia', 'Guia'], ['ia', 'Treino com IA']];
const DSC_ARTEFATO = 'https://claude.ai/artifact/BRWLJsyhEuhP9cR6HArEec';
const DSC_CHARS_LINHA = 75;
let DSC_PROMESSA = null;
function dscGet(k, d){ try{ const v = localStorage.getItem('dsc.' + k); return v === null ? d : v; }catch(_){ return d; } }
function dscSet(k, v){ try{ localStorage.setItem('dsc.' + k, v); }catch(_){} }
function dscCarregar(){
  if(typeof DISCURSIVA_TEMAS !== 'undefined') return Promise.resolve();
  if(DSC_PROMESSA) return DSC_PROMESSA;
  DSC_PROMESSA = new Promise((ok, falha) => {
    const sc = document.createElement('script'); sc.src = 'js/discursiva-dados.js?v=' + ((window.__TCDF_BUILD__ || {}).versao || '');
    sc.onload = ok; sc.onerror = () => { DSC_PROMESSA = null; falha(new Error('Não foi possível carregar os temas da discursiva.')); };
    if(typeof anexarScriptComTimeout === 'function') anexarScriptComTimeout(sc); else document.head.appendChild(sc);
  });
  return DSC_PROMESSA;
}
const dscEsc = v => esc(String(v === null || v === undefined ? "" : v));
const dscFmt = n => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
function dscTemas(tipo){ return (typeof DISCURSIVA_TEMAS !== 'undefined' ? DISCURSIVA_TEMAS : []).filter(t => !tipo || t.tipo === tipo); }
function dscTema(tipo){
  const lista = dscTemas(tipo), id = dscGet('tema.' + tipo, '');
  return lista.find(t => t.id === id) || lista[0] || null;
}
function dscSeletor(tipo, atual, nome){
  const grupos = {};
  dscTemas(tipo).forEach(t => { (grupos[t.fonte || 'Outros'] = grupos[t.fonte || 'Outros'] || []).push(t); });
  return `<select data-dsc-tema="${dscEsc(nome || tipo)}" aria-label="Tema">${Object.keys(grupos).map(g => `<optgroup label="${dscEsc(g)}">${grupos[g].map(t => `<option value="${dscEsc(t.id)}" ${atual && atual.id === t.id ? 'selected' : ''}>${dscEsc(t.titulo)}</option>`).join('')}</optgroup>`).join('')}</select>`;
}
const dscCls = tag => ({ 'TF': 'tf', 'Causa': 'ca', 'Consequência': 'co' })[tag] || 'cx';
const dscSegs = m => (m || []).map(([tag, txt]) => `<span class="dsc-s dsc-${dscCls(tag)}"><i class="dsc-tag">${dscEsc(tag)}</i>${dscEsc(txt)}</span>`).join(' ');
function dscPadraoQuestao(t){
  const paras = (t.marcas && t.marcas.length) ? t.marcas.map(dscSegs) : (t.padrao || []).map(esc);
  return `<div class="dsc-padrao">${paras.map(p => `<p>${p}</p>`).join('')}</div>`;
}
function dscPadraoPeca(t){
  const p = t.padrao_peca || {};
  const linha = (rot, v) => v ? `<p class="dsc-lin"><b>${dscEsc(rot)}</b> ${dscEsc(v)}</p>` : '';
  const corpo = (p.marcas && p.marcas.length ? p.marcas.map(dscSegs) : (p.paragrafos || []).map(esc));
  return `<div class="dsc-inf">
    <p class="dsc-lin"><b>Informação n.º</b> ${dscEsc(String(p.informacao || '').replace(/^Informação n\.º\s*/i, ''))}</p>
    ${linha('', p.local_data)}${linha('Processo n.º:', String(p.processo || '').replace(/^Processo n\.º:?\s*/i, ''))}${linha('Jurisdicionado:', p.jurisdicionado)}${linha('Assunto:', p.assunto)}${linha('Ementa:', p.ementa)}
    ${p.vocativo ? `<p class="dsc-lin dsc-voc">${dscEsc(p.vocativo)}</p>` : ''}
    ${p.relatorio ? `<p class="dsc-lin dsc-mut">${dscEsc(p.relatorio)}</p>` : ''}
    ${corpo.map((c, i) => `<p class="dsc-par">${i ? `<span class="dsc-n">${i + 1}.</span> ` : ''}${c}</p>`).join('')}
    ${p.conclusao ? `<p class="dsc-par"><span class="dsc-n">${corpo.length + 1}.</span> ${dscEsc(p.conclusao)}</p>` : ''}
    ${(p.sugestoes || []).length ? `<ol class="dsc-sug">${p.sugestoes.map(s => `<li>${dscEsc(s)}</li>`).join('')}</ol>` : ''}
    ${p.fecho ? `<p class="dsc-lin dsc-voc">${dscEsc(p.fecho)}</p>` : ''}
  </div>`;
}
function dscFolhaTema(t){
  if(!t) return '<p class="dsc-vazio">Nenhum tema disponível.</p>';
  const c = DSC_CFG[t.tipo] || DSC_CFG.questao, soma = (t.itens || []).reduce((s, i) => s + (+i.valor || 0), 0);
  const legenda = '<div class="dsc-leg"><span class="dsc-s dsc-tf"><i class="dsc-tag">TF</i>tópico frasal</span><span class="dsc-s dsc-ca"><i class="dsc-tag">Causa</i>fundamento</span><span class="dsc-s dsc-co"><i class="dsc-tag">Consequência</i>efeito ou encaminhamento</span></div>';
  return `<article class="dsc-folha">
    <div class="dsc-eyebrow">${dscEsc(c.nome)} · até ${c.linhas} linhas · ${c.total},00 pontos</div>
    <h3>${dscEsc(t.titulo)}</h3>
    <div class="dsc-chips">${t.processo ? `<span class="dsc-chip acc">${dscEsc(t.processo)}</span>` : ''}<span class="dsc-chip ${t.processo ? '' : 'acc'}">${dscEsc(t.disciplina || '')}</span><span class="dsc-chip">${dscEsc(t.assunto || '')}</span>${t.fonte ? `<span class="dsc-chip">${dscEsc(t.fonte)}</span>` : ''}</div>
    ${t.texto_base ? `<p class="dsc-motiv">${dscEsc(t.texto_base)}</p>` : ''}
    <p class="dsc-cmd">${dscEsc(t.comando || '')}</p>
    <ol class="dsc-itens">${(t.itens || []).map(i => `<li><span class="dsc-in">${dscEsc(i.n)}</span><span>${dscEsc(i.texto)}</span><span class="dsc-val">${i.valor ? '[' + dscFmt(+i.valor) + ' pts]' : ''}</span></li>`).join('')}</ol>
    <p class="dsc-hint">Apresentação e estrutura textual: até ${dscFmt(c.apres)} ponto${t.tipo === 'peca' ? 's' : ''}.${soma ? ' Conteúdo: ' + dscFmt(soma) + ' pontos.' : ''}</p>
    <details class="dsc-det"><summary>Ver padrão de resposta e quesitos</summary>
      ${t.nota ? `<p class="dsc-aviso">${dscEsc(t.nota)}</p>` : ''}
      ${legenda}
      ${t.tipo === 'peca' ? dscPadraoPeca(t) : dscPadraoQuestao(t)}
      ${(t.quesitos || []).length ? `<div class="dsc-ques">${t.quesitos.map(q => `<div class="dsc-q"><h4><span>${dscEsc(q.id)} · ${dscEsc(q.nome)}</span><b>${dscFmt(+q.valor || 0)} pts</b></h4><ul>${(q.conceitos || []).map(x => `<li>${dscEsc(x)}</li>`).join('')}</ul></div>`).join('')}</div>` : ''}
    </details>
    <div class="dsc-acoes"><button type="button" class="dsc-btn" data-dsc-escrever="${dscEsc(t.id)}">✍ Escrever este tema</button><button type="button" class="dsc-btn ghost" data-dsc-nota="${dscEsc(t.id)}">🧮 Calcular a nota</button></div>
  </article>`;
}
function dscAbaTemas(tipo){
  const t = dscTema(tipo), n = dscTemas(tipo).length;
  return `<div class="dsc-grade"><aside class="dsc-lado"><h4>${tipo === 'peca' ? 'Peça técnica' : 'Questão'} <small>${n} temas</small></h4>${dscSeletor(tipo, t)}
    <p class="dsc-hint">Provas reais do TCDF e simulados. O padrão dos simulados é elaborado para treino; confira com o gabarito do curso.</p></aside>${dscFolhaTema(t)}</div>`;
}
function dscContaLinhas(s){ let n = 0; String(s).split('\n').forEach(l => { n += Math.max(1, Math.ceil(l.length / DSC_CHARS_LINHA)); }); return String(s).trim() ? n : 0; }
function dscAbaEscrever(){
  const t = dscTemas().find(x => x.id === dscGet('esc.tema', '')) || dscTema('questao');
  if(!t) return '<p class="dsc-vazio">Nenhum tema disponível.</p>';
  const c = DSC_CFG[t.tipo], txt = dscGet('rasc.' + t.id, '');
  return `<div class="dsc-grade"><aside class="dsc-lado"><h4>Tema para escrever</h4>${dscSeletor('', t, 'escrever')}
    <details class="dsc-det" open><summary>Enunciado</summary>${t.texto_base ? `<p class="dsc-motiv">${dscEsc(t.texto_base)}</p>` : ''}<p class="dsc-cmd">${dscEsc(t.comando || '')}</p>
    <ol class="dsc-itens">${(t.itens || []).map(i => `<li><span class="dsc-in">${dscEsc(i.n)}</span><span>${dscEsc(i.texto)}</span><span class="dsc-val">${i.valor ? '[' + dscFmt(+i.valor) + ']' : ''}</span></li>`).join('')}</ol></details></aside>
    <article class="dsc-folha"><div class="dsc-eyebrow">${dscEsc(c.nome)} · limite de ${c.linhas} linhas</div>
      <textarea id="dsc-txt" class="dsc-area" spellcheck="true" placeholder="Escreva aqui o texto definitivo. Sem nome, assinatura ou qualquer marca que identifique você.">${dscEsc(txt)}</textarea>
      <div class="dsc-medidor"><div><small>Caracteres</small><b id="dsc-c">0</b></div><div><small>Linhas estimadas</small><b id="dsc-l">0</b></div><div><small>Limite</small><b>${c.linhas}</b></div></div>
      <div class="dsc-barra"><i id="dsc-b"></i></div><p class="dsc-hint" id="dsc-m"></p>
      <div class="dsc-acoes"><button type="button" class="dsc-btn" data-dsc-copiar="1">Copiar texto</button><button type="button" class="dsc-btn ghost" data-dsc-limpar="1">Limpar</button><button type="button" class="dsc-btn ghost" data-dsc-nota="${dscEsc(t.id)}">🧮 Calcular a nota</button></div>
      <p class="dsc-hint">Estimativa de ${DSC_CHARS_LINHA} caracteres por linha; ajuste à sua letra. O texto é salvo automaticamente neste aparelho.</p>
    </article></div>`;
}
function dscAtualizaEscrever(){
  const ta = document.getElementById('dsc-txt'); if(!ta) return;
  const t = dscTemas().find(x => x.id === dscGet('esc.tema', '')) || dscTema('questao'), c = DSC_CFG[t.tipo], n = dscContaLinhas(ta.value);
  document.getElementById('dsc-c').textContent = ta.value.length.toLocaleString('pt-BR'); document.getElementById('dsc-l').textContent = n;
  const b = document.getElementById('dsc-b'); b.style.width = Math.min(100, Math.round(100 * n / c.linhas)) + '%'; b.className = n > c.linhas ? 'over' : '';
  document.getElementById('dsc-m').textContent = !n ? '' : (n > c.linhas ? `Acima do limite (${c.linhas} linhas): o que passar é desconsiderado. Corte repetições e adjetivos.` : (n < c.linhas * 0.6 ? 'Abaixo de 60% do limite: aprofunde fundamentos e encaminhamentos.' : 'Dentro do limite.'));
  dscSet('rasc.' + t.id, ta.value);
}
function dscMaxConceito(q){ const nums = (q.conceitos || []).map(x => parseInt(x, 10)).filter(n => !isNaN(n)); return nums.length ? Math.max.apply(null, nums) : 4; }
function dscAbaNota(){
  const t = dscTemas().find(x => x.id === dscGet('nota.tema', '')) || dscTema('questao');
  if(!t) return '<p class="dsc-vazio">Nenhum tema disponível.</p>';
  const c = DSC_CFG[t.tipo];
  return `<div class="dsc-grade"><aside class="dsc-lado"><h4>Tema corrigido</h4>${dscSeletor('', t, 'nota')}
    <div class="dsc-crit"><p><b>${dscEsc(c.nome)}</b>: até ${c.linhas} linhas, ${c.total},00 pontos.</p>
    <p>Cada quesito vale <code>valor × conceito ÷ conceito máximo</code>. A apresentação soma até ${dscFmt(c.apres)}.</p>
    <p>Nota: <code>${c.sig} = NC − ${c.fator} × NE ÷ TL</code>, em que NE são os erros de língua (grafia, vocabulário e morfossintaxe) e TL, as linhas escritas.</p>
    <p>Eliminação: soma de questão e peça abaixo de 30,00.</p></div></aside>
    <article class="dsc-folha"><div class="dsc-eyebrow">Autocorreção pelo padrão</div><h3>${dscEsc(t.titulo)}</h3>
      ${(t.quesitos || []).map((q, i) => `<div class="dsc-q"><h4><span>${dscEsc(q.id)} · ${dscEsc(q.nome)}</span><b>${dscFmt(+q.valor || 0)} pts</b></h4>
        <select data-dsc-conc="${i}" aria-label="Conceito do quesito ${dscEsc(q.id)}"><option value="">Conceito…</option>${(q.conceitos || []).map(x => { const k = parseInt(x, 10); return `<option value="${isNaN(k) ? '' : k}">${dscEsc(x)}</option>`; }).join('')}</select></div>`).join('') || '<p class="dsc-hint">Este tema não tem quesitos: informe o NC direto abaixo.</p>'}
      <div class="dsc-campos"><label>Apresentação (0 a ${dscFmt(c.apres)})<input type="number" id="dsc-ap" min="0" max="${c.apres}" step="0.05" value="${c.apres}"></label>
        <label>NE (erros de língua)<input type="number" id="dsc-ne" min="0" step="1" value="0"></label>
        <label>TL (linhas escritas)<input type="number" id="dsc-tl" min="1" max="${c.linhas}" step="1" value="${c.linhas}"></label>
        ${(t.quesitos || []).length ? '' : '<label>NC (nota de conteúdo)<input type="number" id="dsc-ncm" min="0" step="0.25" value="0"></label>'}</div>
      <div class="dsc-kpis"><div><small>NC</small><b id="dsc-nc">—</b></div><div><small>Desconto</small><b id="dsc-desc">—</b></div><div class="main"><small>${c.sig}</small><b id="dsc-nq">—</b></div><div><small>Máximo</small><b>${c.total},00</b></div></div>
      <p class="dsc-hint">Autoavaliação: seja rigoroso; o conceito é dado pelo que está escrito, e não pelo que você quis dizer.</p>
    </article></div>`;
}
function dscCalculaNota(){
  const t = dscTemas().find(x => x.id === dscGet('nota.tema', '')) || dscTema('questao'); if(!t || !document.getElementById('dsc-nq')) return;
  const c = DSC_CFG[t.tipo]; let nc = 0, ok = true;
  const sels = Array.from(document.querySelectorAll('[data-dsc-conc]'));
  if(sels.length){ sels.forEach(s => { const q = t.quesitos[+s.dataset.dscConc]; if(s.value === '') ok = false; else nc += (+q.valor || 0) * (+s.value) / dscMaxConceito(q); }); }
  else nc = parseFloat((document.getElementById('dsc-ncm') || {}).value) || 0;
  nc += Math.min(c.apres, Math.max(0, parseFloat(document.getElementById('dsc-ap').value) || 0));
  const ne = Math.max(0, parseFloat(document.getElementById('dsc-ne').value) || 0), tl = Math.max(1, parseFloat(document.getElementById('dsc-tl').value) || c.linhas);
  const desc = c.fator * ne / tl, nq = Math.max(0, nc - desc);
  document.getElementById('dsc-nc').textContent = dscFmt(nc) + (ok ? '' : '*'); document.getElementById('dsc-desc').textContent = '− ' + dscFmt(desc); document.getElementById('dsc-nq').textContent = dscFmt(nq);
}
function dscAbaFolhas(){
  return `<div class="dsc-duas">
    <article class="dsc-folha"><div class="dsc-eyebrow">Questão discursiva · 1 folha · 20 linhas</div><h3>Folha da questão</h3><p class="dsc-hint">Grade em branco no modelo Cebraspe, com 20 linhas numeradas.</p>
      <div class="dsc-acoes"><a class="dsc-btn" href="discursiva/folha_questao.pdf" download>Baixar PDF</a></div><div class="dsc-prev"><img src="discursiva/prev_q-1.png" alt="Prévia da folha da questão, 20 linhas" loading="lazy"></div></article>
    <article class="dsc-folha"><div class="dsc-eyebrow">Peça técnica · Informação · 2 folhas · 50 linhas</div><h3>Folhas da peça técnica</h3><p class="dsc-hint">Linhas 1 a 30 e 31 a 50, com o cabeçalho da Informação, o vocativo e “Trata-se de” na linha 13.</p>
      <div class="dsc-acoes"><a class="dsc-btn" href="discursiva/folha_peca.pdf" download>Baixar PDF</a></div><div class="dsc-prev"><img src="discursiva/prev_p-1.png" alt="Prévia da folha 1 da peça" loading="lazy"><img src="discursiva/prev_p-2.png" alt="Prévia da folha 2 da peça" loading="lazy"></div></article>
  </div>
  <article class="dsc-folha dsc-kit"><div><b>Kit completo</b><p class="dsc-hint">Questão e peça no mesmo PDF (3 páginas A4), para imprimir de uma vez.</p></div><a class="dsc-btn ghost" href="discursiva/folhas_completas.pdf" download>Baixar kit (PDF)</a></article>`;
}
function dscAbaGuia(){
  try{ localStorage.setItem('gd.theme', document.body.classList.contains('theme-light') ? 'light' : 'dark'); }catch(_){}
  const v = ((window.__TCDF_BUILD__ || {}).versao || '');
  return `<div class="dsc-guia"><p class="dsc-hint">Resumos, modelos, checklists e quiz do projeto Guia Discursiva. <a href="guia-discursiva/index.html?v=${dscEsc(v)}" target="_blank" rel="noopener">Abrir em tela cheia ↗</a></p>
    <iframe class="guia-frame" title="Guia Discursiva" src="guia-discursiva/index.html?v=${dscEsc(v)}" sandbox="allow-scripts allow-same-origin allow-modals allow-popups" loading="lazy"></iframe></div>`;
}
function dscAbaIa(){
  return `<article class="dsc-folha dsc-ia"><div class="dsc-eyebrow">claude.ai</div><h3>Treino Discursiva com IA</h3>
    <p>Para <b>gerar temas novos</b>, <b>corrigir a foto da sua folha manuscrita</b> e <b>montar recursos</b>, use o Treino Discursiva no claude.ai. Essas funções precisam do Claude da sua conta e não rodam dentro desta plataforma.</p>
    <ul><li>Gera questão (20 linhas) e peça Informação (50 linhas) por disciplina, assunto e nível.</li><li>Lê a letra da folha, corrige pelos critérios da banca (NC − k × NE ÷ TL) e marca os erros por linha.</li><li>Monta o recurso a partir da folha, do espelho e do padrão de resposta.</li></ul>
    <div class="dsc-acoes"><a class="dsc-btn" href="${DSC_ARTEFATO}" target="_blank" rel="noopener">Abrir o Treino Discursiva ↗</a></div>
    <p class="dsc-hint">Abre em outra aba e pede login no claude.ai. Os temas e padrões que estão aqui na plataforma funcionam sem internet e sem login nele.</p></article>`;
}
function dscDesenha(raiz){
  const sub = dscGet('sub', 'questao');
  const corpo = { questao: () => dscAbaTemas('questao'), peca: () => dscAbaTemas('peca'), escrever: dscAbaEscrever, nota: dscAbaNota, folhas: dscAbaFolhas, guia: dscAbaGuia, ia: dscAbaIa }[sub] || (() => dscAbaTemas('questao'));
  raiz.innerHTML = `<div class="dsc-tabs" role="tablist">${DSC_SUBS.map(([id, nome]) => `<button type="button" role="tab" class="dsc-tab" aria-selected="${sub === id}" data-dsc-sub="${id}">${dscEsc(nome)}</button>`).join('')}</div>${corpo()}`;
  if(sub === 'escrever') dscAtualizaEscrever();
  if(sub === 'nota') dscCalculaNota();
}
async function discursivaMontar(){
  const raiz = document.getElementById('dsc-raiz'); if(!raiz) return;
  try{ await dscCarregar(); }catch(e){ raiz.innerHTML = `<p class="dsc-vazio">${dscEsc(e.message)}</p>`; return; }
  if(!document.body.contains(raiz)) return;
  dscDesenha(raiz);
  raiz.addEventListener('click', e => {
    const a = e.target.closest('[data-dsc-sub],[data-dsc-escrever],[data-dsc-nota],[data-dsc-copiar],[data-dsc-limpar]'); if(!a) return;
    if(a.dataset.dscSub){ dscSet('sub', a.dataset.dscSub); window.scrollTo(0, 0); return dscDesenha(raiz); }
    if(a.dataset.dscEscrever){ dscSet('esc.tema', a.dataset.dscEscrever); dscSet('sub', 'escrever'); return dscDesenha(raiz); }
    if(a.dataset.dscNota){ dscSet('nota.tema', a.dataset.dscNota); dscSet('sub', 'nota'); return dscDesenha(raiz); }
    if(a.dataset.dscCopiar){ const ta = document.getElementById('dsc-txt'); try{ navigator.clipboard.writeText(ta.value); a.textContent = 'Copiado ✓'; setTimeout(() => { a.textContent = 'Copiar texto'; }, 1500); }catch(_){ ta.select(); } return; }
    if(a.dataset.dscLimpar){ if(confirm('Apagar o texto deste tema?')){ const ta = document.getElementById('dsc-txt'); ta.value = ''; dscAtualizaEscrever(); } }
  });
  raiz.addEventListener('change', e => {
    const s = e.target.closest('[data-dsc-tema]'); if(s){ const k = s.dataset.dscTema; dscSet(k === 'escrever' ? 'esc.tema' : (k === 'nota' ? 'nota.tema' : 'tema.' + k), s.value); return dscDesenha(raiz); }
    if(e.target.closest('[data-dsc-conc]')) dscCalculaNota();
  });
  raiz.addEventListener('input', e => {
    if(e.target.id === 'dsc-txt') dscAtualizaEscrever();
    else if(e.target.closest('#dsc-ap,#dsc-ne,#dsc-tl,#dsc-ncm')) dscCalculaNota();
  });
}
