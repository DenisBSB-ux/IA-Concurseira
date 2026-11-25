/* Converte a teoria atual de Redes (js/doutrina-redes.js) na BASE única + PERFIL do edital da DPDF.
   Uso (da raiz do repo): node tools/teoria/converter-redes.js
   Gera teoria/redes-de-computadores/base.json e perfil-dpdf-2026-analista.json.
   Os ids dos tópicos são permanentes: "redes.<item do edital>.<termo>". Não renomeie depois de publicados (só aposente). */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync('js/doutrina-redes.js', 'utf8') + ';module.exports=DOUTRINA_REDES';
fs.writeFileSync('/tmp/_dr.js', src);
const D = require('/tmp/_dr.js').redes;
const slugTxt = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const topicos = [], itens = [], usados = new Set();
const extras = {   // tópicos novos (tabelas e figura), anexados ao fim do item do edital indicado
  1: [
    { id: 'redes.1.quadro-osi-tcpip', t: 'Quadro: OSI × TCP/IP', resumo: 'O OSI tem 7 camadas e o TCP/IP tem 4: a camada de Aplicação do TCP/IP reúne Aplicação, Apresentação e Sessão do OSI, e a de Acesso à rede reúne Enlace e Física.',
      tabelas: [{ titulo: 'Camadas, unidade de dados e exemplos', cab: ['OSI', 'TCP/IP', 'Unidade de dados', 'Exemplos'], linhas: [
        ['7 Aplicação', 'Aplicação', 'Dados', 'HTTP, DNS, SMTP'], ['6 Apresentação', 'Aplicação', 'Dados', 'criptografia, codificação, compressão'], ['5 Sessão', 'Aplicação', 'Dados', 'abertura, manutenção e fim do diálogo'],
        ['4 Transporte', 'Transporte', 'Segmento (TCP) / datagrama (UDP)', 'TCP, UDP, portas'], ['3 Rede', 'Internet', 'Pacote', 'IP, ICMP, roteamento'],
        ['2 Enlace', 'Acesso à rede', 'Quadro', 'Ethernet, MAC, switch'], ['1 Física', 'Acesso à rede', 'Bits', 'cabos, sinais, hub']] }],
      figuras: [{ src: 'fig-osi-tcpip.svg', legenda: 'Camadas OSI e TCP/IP lado a lado, com a unidade de dados de cada uma.' }],
      macete: 'De cima para baixo: Aplicação, Apresentação, Sessão, Transporte, Rede, Enlace, Física (A-A-S-T-R-E-F).', origem: 'externa' }],
  4: [
    { id: 'redes.4.quadro-tcp-udp', t: 'Quadro: TCP × UDP', resumo: 'TCP entrega com garantias; UDP entrega rápido, sem garantias. A escolha depende de a aplicação precisar de confiabilidade ou de baixa latência.',
      tabelas: [{ titulo: 'Comparativo', cab: ['Característica', 'TCP', 'UDP'], linhas: [
        ['Conexão', 'orientado a conexão (handshake de 3 vias)', 'sem conexão'], ['Confiabilidade', 'confirmação (ACK), retransmissão e ordem', 'não garante entrega nem ordem'],
        ['Controle de fluxo e congestionamento', 'sim', 'não'], ['Cabeçalho', 'maior (mínimo 20 bytes)', 'menor (8 bytes)'],
        ['Usos típicos', 'HTTP/HTTPS, SSH, e-mail, transferência de arquivos', 'consultas DNS, DHCP, NTP, SNMP, voz e vídeo em tempo real']] }],
      macete: 'TCP = telefone (liga, confirma, desliga). UDP = carta sem aviso de recebimento.', origem: 'externa' }],
  10: [
    { id: 'redes.10.quadro-hub-switch-roteador', t: 'Quadro: hub × switch × roteador', resumo: 'Cada equipamento atua em uma camada e separa domínios de colisão e de broadcast de modo diferente.',
      tabelas: [{ titulo: 'Comparativo', cab: ['Equipamento', 'Camada', 'Decide por', 'Domínio de colisão', 'Domínio de broadcast'], linhas: [
        ['Hub', '1 Física', 'nada: repete o sinal em todas as portas', 'um só para todas as portas', 'um só'],
        ['Switch', '2 Enlace', 'endereço MAC', 'um por porta', 'um só (um por VLAN)'],
        ['Roteador', '3 Rede', 'endereço IP', 'um por interface', 'um por interface (separa os broadcasts)']] }],
      macete: 'Hub repete, switch encaminha pelo MAC, roteador separa redes pelo IP.', origem: 'externa' }]
};
D.secs.forEach((s, i) => {
  const n = i + 1, ids = [];
  s.lei.forEach(par => {
    const k = par.indexOf(' · '), termo = k > 0 ? par.slice(0, k) : par.slice(0, 40), txt = k > 0 ? par.slice(k + 3) : par;
    let id = 'redes.' + n + '.' + slugTxt(termo), x = 2; while(usados.has(id)) id = 'redes.' + n + '.' + slugTxt(termo) + '-' + (x++);
    usados.add(id); ids.push(id); topicos.push({ id, t: termo, resumo: txt, origem: 'apostila' });
  });
  if(s.peg){ const id = 'redes.' + n + '.pegadinhas'; usados.add(id); ids.push(id); topicos.push({ id, t: 'Pegadinhas da banca', resumo: '', pegadinhas: s.peg, origem: 'questoes' }); }
  (extras[n] || []).forEach(e => { usados.add(e.id); ids.push(e.id); topicos.push(e); });
  itens.push({ n, t: s.titulo.replace(/^\d+\s+/, ''), topicos: ids });
});
const base = { esquema: 1, slug: 'redes-de-computadores', materia: 'Redes de Computadores', versao: 1, atualizado: '2026-11-25',
  fontes: D.fontes || [], topicos };
const perfil = { esquema: 1, slug: 'redes-de-computadores', concursoId: 'dpdf-2026-analista', concurso: 'DPDF 2026 — Analista de Apoio à Assistência Judiciária', versao: 1, atualizado: '2026-11-25', padrao: itens, cargos: {} };
fs.writeFileSync('teoria/redes-de-computadores/base.json', JSON.stringify(base, null, 1));
fs.writeFileSync('teoria/redes-de-computadores/perfil-dpdf-2026-analista.json', JSON.stringify(perfil, null, 1));
console.log('tópicos', topicos.length, 'itens', itens.length);
