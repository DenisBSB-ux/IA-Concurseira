// Perfil de estudo (concurso + cargo): códigos de sincronização isolados; o TCDF mantém o código da conta
const fs = require('fs'); let falhas = 0, ok = 0;
global.REV_CHAVES = {}; global.TREINO_RESP_KEY = 'x'; global.STATE = {};
global.CONC_DB = { ativo: 'padrao', cargo: '' };
eval(fs.readFileSync('js/perfil.js', 'utf8').replace(/\bconst /g, 'var ').replace(/\blet /g, 'var ') + ';global.codigoDoPerfil=codigoDoPerfil;global.perfilId=perfilId;');
const t = (nome, a, b) => { if(a === b) ok++; else { falhas++; console.log('FALHOU:', nome, '\n  obtido:', a, '\n  esperado:', b); } };
t('padrão usa o código da conta', codigoDoPerfil('g-abc'), 'g-abc');
CONC_DB = { ativo: 'dpdf-2026-analista', cargo: 'Analista de Apoio à Assistência Judiciária — Informática - Redes' };
t('cargo com código próprio', codigoDoPerfil('g-abc'), 'g-abc~dpdf-2026-analista~informatica-redes');
CONC_DB.cargo = 'Analista de Apoio à Assistência Judiciária — Contabilidade';
t('outro cargo, outro código', codigoDoPerfil('g-abc'), 'g-abc~dpdf-2026-analista~contabilidade');
CONC_DB.cargo = 'Analista de Apoio à Assistência Judiciária — Informática - Banco de Dados';
t('cargos de Informática distintos', codigoDoPerfil('g-abc') !== 'g-abc~dpdf-2026-analista~informatica-redes', true);
console.log('perfil:', ok, 'ok,', falhas, 'falhas'); process.exit(falhas ? 1 : 0);
