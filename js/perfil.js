/* PERFIL DE ESTUDO = concurso + cargo.
   Cada perfil tem estatísticas e progresso próprios (respostas, simulados em andamento, flashcards, lacunas, resumo, registro por dia).
   - O perfil do TCDF (padrão) continua usando o código de sincronização da conta, sem nenhuma migração: o progresso de antes fica nele.
   - Os demais usam "código da conta + ~ + concurso + ~ + cargo": na nuvem são documentos separados, e um cargo novo começa zerado.
   Ao trocar, o perfil de saída é enviado à nuvem e guardado também neste aparelho; ao voltar a ele, o progresso reaparece. */
let PERFIL_TROCANDO = false, PERFIL_MEU = false;      // PERFIL_MEU: libera os envios feitos pela própria troca
const PERFIL_SNAPS_KEY = 'ia_perfil_snaps_v1';       // lista de códigos com cópia local
function perfilSlug(x){ return String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60); }
function perfilId(){
  if(typeof CONC_DB === 'undefined' || !CONC_DB.ativo || CONC_DB.ativo === 'padrao') return 'padrao';
  return perfilSlug(CONC_DB.ativo) + '~' + (perfilSlug(String(CONC_DB.cargo || '').split(' — ').pop()) || 'unico');
}
function codigoBase(){ return STATE.contaCodigo || String(STATE.syncCode || '').split('~')[0]; }
function codigoDoPerfil(base){ const id = perfilId(); return (id === 'padrao' ? base : base + '~' + id).toLowerCase(); }

/* dados do perfil guardados só no navegador (as marcas de revisão também sobem para a nuvem, por código) */
function perfilChavesLocais(){ return Object.values(REV_CHAVES).concat([TREINO_RESP_KEY]); }
async function perfilSalvarSnapshot(codigo){
  if(!codigo) return;
  const snap = { ts: Date.now(), progress: JSON.stringify(PROGRESS || {}), ls: {}, quizzes: {} };
  perfilChavesLocais().forEach(k => { try{ const v = localStorage.getItem(k); if(v !== null) snap.ls[k] = v; }catch(_){} });
  const chavesQuiz = new Set([...Object.keys(STATE.quizzesEmAndamento || {}), ...materiasDisponiveis(), ...materiasDisponiveis().map(m => m + '::erros')]);
  await Promise.all([...chavesQuiz].map(async k => { try{ const r = await storageGet(quizStorageKey(k)); if(r && r.value) snap.quizzes[k] = r.value; }catch(_){} }));
  try{
    await storageSet('ia_perfil_snap_' + codigo, JSON.stringify(snap));
    const lista = JSON.parse((await storageGet(PERFIL_SNAPS_KEY).catch(() => null) || { value: '[]' }).value || '[]');
    if(!lista.includes(codigo)){ lista.push(codigo); await storageSet(PERFIL_SNAPS_KEY, JSON.stringify(lista)); }
  }catch(e){ console.warn('Não foi possível guardar a cópia local do perfil', e); }
}
async function perfilLerSnapshot(codigo){
  try{ const r = await storageGet('ia_perfil_snap_' + codigo); return r && r.value ? JSON.parse(r.value) : null; }catch(_){ return null; }
}
async function perfilLimparLocal(){
  perfilChavesLocais().forEach(k => { try{ localStorage.removeItem(k); }catch(_){} });
  const chavesQuiz = new Set([...Object.keys(STATE.quizzesEmAndamento || {}), ...materiasDisponiveis(), ...materiasDisponiveis().map(m => m + '::erros')]);
  await Promise.all([...chavesQuiz].map(k => storageSet(quizStorageKey(k), '').catch(() => {})));
  STATE.quizzesEmAndamento = {}; STATE.quizzesVerificados = new Set(); STATE.quiz = null; STATE.flashDeck = null;
}
async function perfilAplicarSnapshot(snap, soSeVazio){
  if(!snap) return;
  try{
    if(!soSeVazio || Object.keys(PROGRESS || {}).length === 0){
      const p = JSON.parse(snap.progress || '{}'); if(p && typeof p === 'object'){ PROGRESS = p; try{ await storageSet(STORAGE_KEY, JSON.stringify(PROGRESS)); }catch(_){} Object.keys(PROGRESS).forEach(m => marcarProgressoSujo(m)); }
    }
    Object.keys(snap.ls || {}).forEach(k => { try{ if(!soSeVazio || localStorage.getItem(k) === null) localStorage.setItem(k, snap.ls[k]); }catch(_){} });
    await Promise.all(Object.keys(snap.quizzes || {}).map(k => storageSet(quizStorageKey(k), snap.quizzes[k]).catch(() => {})));
  }catch(e){ console.warn('Falha ao restaurar a cópia local do perfil', e); }
}
async function perfilLimparSnapshots(){      // ao sair da conta: nada fica para a próxima pessoa do aparelho
  try{
    const lista = JSON.parse(((await storageGet(PERFIL_SNAPS_KEY).catch(() => null)) || { value: '[]' }).value || '[]');
    await Promise.all(lista.map(c => storageSet('ia_perfil_snap_' + c, '').catch(() => {})));
    await storageSet(PERFIL_SNAPS_KEY, '[]');
  }catch(_){}
}
function perfilCarregando(msg){
  let el = document.getElementById('perfil-carregando');
  if(!msg){ if(el) el.remove(); return; }
  if(!el){ el = document.createElement('div'); el.id = 'perfil-carregando'; el.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(10,10,12,.82);color:#e8e6e0;font:14px var(--font-mono,monospace);text-align:center;padding:24px;'; document.body.appendChild(el); }
  el.textContent = msg;
}
async function revisaoEnviarAgora(){
  if(typeof sincronizacaoAtiva !== 'function' || !sincronizacaoAtiva()) return;
  try{ await comLimiteDeTempo(fbDb.collection('progresso').doc(`${STATE.syncCode}__revisao`).set(sanitizarParaFirestore(comDono({ revisao: JSON.stringify(revisaoColetar()), updatedAt: Date.now() }))), 15000, 'tempo esgotado ao salvar o progresso da revisão'); }
  catch(e){ console.warn('Falha ao salvar o progresso da revisão na nuvem', e); }
}

/* troca o progresso mostrado para o do perfil (concurso + cargo) escolhido */
async function ativarPerfilDeEstudo(){
  if(PERFIL_TROCANDO || !STATE.contaCodigo || !FIREBASE_OK || !USUARIO_ATUAL) return;
  const alvo = codigoDoPerfil(STATE.contaCodigo), antes = STATE.syncCode;
  if(!alvo || alvo === antes) return;
  PERFIL_TROCANDO = true; perfilCarregando('Carregando o seu progresso neste cargo…');
  try{
    // 1) envia o que está pendente do perfil que está saindo e guarda uma cópia neste aparelho
    PERFIL_MEU = true;
    try{ await comLimiteDeTempo(Promise.all([flushQuizSyncPendente(), pushToCloud(), revisaoEnviarAgora()]), 25000, 'tempo esgotado ao enviar o progresso'); }catch(e){ console.warn('Envio antes da troca de perfil não terminou', e); }
    PERFIL_MEU = false;      // daqui até o código mudar, nenhum envio automático
    await perfilSalvarSnapshot(antes);
    const snapAlvo = await perfilLerSnapshot(alvo);
    // 2) zera o que é do perfil (progresso, simulados, marcas de revisão) e conecta ao código do novo perfil
    await perfilLimparLocal();
    PERFIL_MEU = true;
    await conectarSincronizacao(alvo);        // zera o progresso, puxa o da nuvem para este código e envia
    if(STATE.syncCode !== alvo){              // sem conexão: volta ao perfil anterior, sem perder nada
      STATE.syncCode = antes; try{ await storageSet(SYNC_CODE_KEY, antes); }catch(_){}
      await perfilAplicarSnapshot(await perfilLerSnapshot(antes), false);
      try{ alert('Não foi possível carregar o progresso deste cargo (sem conexão?). Você continua no perfil anterior; tente de novo.'); }catch(_){}
      return;
    }
    await puxarRevisao();                      // marcas de revisão deste perfil
    // 3) a nuvem não tinha nada deste perfil, mas há cópia neste aparelho: usa a cópia
    if(snapAlvo) await perfilAplicarSnapshot(snapAlvo, true);
    try{ await pushToCloud(); await revisaoEnviarAgora(); }catch(_){}
    STATE.quizzesVerificados = new Set();
    try{ await verificarTodosQuizzesSalvos(); }catch(_){}
  }catch(e){
    console.error('Falha ao trocar de perfil de estudo', e);
  }finally{
    PERFIL_TROCANDO = false; PERFIL_MEU = false; perfilCarregando('');
    try{ render(); }catch(_){}
  }
}

/* o concurso/cargo escolhido vale para a CONTA (não por perfil): documento próprio, pelo código-base */
let _concSyncTimer = null;
function sincronizarConcurso(){
  if(typeof sincronizacaoAtiva !== 'function' || !sincronizacaoAtiva() || !STATE.contaCodigo) return;
  clearTimeout(_concSyncTimer);
  _concSyncTimer = setTimeout(async () => {
    try{ await comLimiteDeTempo(fbDb.collection('progresso').doc(`${STATE.contaCodigo}__conc`).set(sanitizarParaFirestore(comDono({ conc: JSON.stringify(CONC_DB), updatedAt: Date.now() }))), 15000, 'tempo esgotado ao salvar o concurso'); }
    catch(e){ console.warn('Falha ao salvar o concurso escolhido na nuvem', e); }
  }, 1500);
}
async function puxarConcurso(){
  if(!STATE.contaCodigo) return;
  try{
    const doc = await comLimiteDeTempo(fbDb.collection('progresso').doc(`${STATE.contaCodigo}__conc`).get(), 15000, 'tempo esgotado ao ler o concurso');
    if(doc.exists){
      const r = JSON.parse(doc.data().conc || 'null');
      if(r && Array.isArray(r.lista) && Number(r.ts) > (CONC_DB.ts || 0)){
        try{ localStorage.setItem(CONCURSOS_KEY, JSON.stringify(r)); }catch(_){}
        concursoCarregar();
        if(typeof concursoAposSync === 'function') concursoAposSync();
      }
    }
    sincronizarConcurso();
  }catch(e){ console.warn('Falha ao buscar o concurso escolhido na nuvem', e); }
}
