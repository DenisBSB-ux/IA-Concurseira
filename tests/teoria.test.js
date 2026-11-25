/* Valida a teoria-base e os perfis (ids únicos, perfis sem id inexistente, tabelas retangulares, figuras existentes, tamanho). */
const fs = require('fs'), path = require('path');
let falhas = 0, ok = 0;
const check = (c, msg) => { if(c) ok++; else { falhas++; console.log('FALHA:', msg); } };
const idx = fs.readFileSync('js/teoria-base.js', 'utf8').match(/const TEORIA_BASE_INDICE = (\{[\s\S]*?\n\});/);
check(idx, 'TEORIA_BASE_INDICE não encontrado');
const INDICE = idx ? eval('(' + idx[1] + ')') : {};
const dirs = fs.existsSync('teoria') ? fs.readdirSync('teoria').filter(d => fs.statSync(path.join('teoria', d)).isDirectory()) : [];
check(JSON.stringify(dirs.sort()) === JSON.stringify(Object.keys(INDICE).sort()), 'pastas de teoria/ diferem de TEORIA_BASE_INDICE: ' + dirs + ' × ' + Object.keys(INDICE));
for(const slug of Object.keys(INDICE)){
  const d = path.join('teoria', slug), base = JSON.parse(fs.readFileSync(path.join(d, 'base.json'), 'utf8'));
  check(base.slug === slug && base.esquema === 1 && base.versao >= 1, slug + ': cabeçalho da base');
  check(fs.statSync(path.join(d, 'base.json')).size < 900000, slug + ': base grande demais (use partes na nuvem)');
  const ids = new Set();
  base.topicos.forEach(t => {
    check(/^[a-z0-9.\-]+$/.test(t.id || ''), slug + ': id inválido ' + t.id); check(!ids.has(t.id), slug + ': id repetido ' + t.id); ids.add(t.id);
    check(t.t && (t.resumo || t.pegadinhas || (t.tabelas || []).length || (t.figuras || []).length), slug + ': tópico vazio ' + t.id);
    (t.tabelas || []).forEach(tb => (tb.linhas || []).forEach(l => check(l.length === tb.cab.length, slug + ': tabela com linha de tamanho errado em ' + t.id)));
    (t.figuras || []).forEach(f => check(fs.existsSync(path.join(d, f.src)), slug + ': figura ausente ' + f.src));
  });
  const usados = new Set();
  for(const cid of INDICE[slug].perfis){
    const p = JSON.parse(fs.readFileSync(path.join(d, 'perfil-' + cid + '.json'), 'utf8'));
    check(p.slug === slug && p.concursoId === cid, slug + '/' + cid + ': cabeçalho do perfil');
    [p.padrao].concat(Object.values(p.cargos || {})).forEach(itens => (itens || []).forEach(it => (it.topicos || []).forEach(id => { usados.add(id); check(ids.has(id), slug + '/' + cid + ': id inexistente na base ' + id); })));
  }
  const orfaos = [...ids].filter(i => !usados.has(i)); if(orfaos.length) console.log('aviso: ' + slug + ' tem ' + orfaos.length + ' tópico(s) fora de qualquer perfil');
}
console.log('teoria: ' + ok + ' ok, ' + falhas + ' falhas'); process.exit(falhas ? 1 : 0);
