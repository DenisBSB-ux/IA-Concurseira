/* Apostilas em PDF: matéria da base, título, id do arquivo no Drive e tamanho em KB. "url" aponta para a cópia no site (pasta apostilas/); sem "url", abre no Drive. */
const APOSTILAS = [
 {
  "m": "Redes de Computadores",
  "t": "DPDF — Analista de Apoio à Assistência Judiciária · Informática - Redes",
  "id": "",
  "kb": 279,
  "url": "apostilas/redes-de-computadores-apostila-edital.pdf",
  "local": true
 },
 {
  "m": "Direito Civil",
  "t": "LINDB",
  "id": "10sqZzerU1Qyq4xHTAKRPE-OUclfSh8rV",
  "kb": 484,
  "url": "apostilas/direito-civil-lindb.pdf",
  "local": true
 },
 {
  "m": "Direito Civil",
  "t": "Pessoas Naturais",
  "id": "1w1KqEoTTX4f3jK4Rgp_wCxYIs185MSm7",
  "kb": 2657,
  "url": "apostilas/direito-civil-pessoas-naturais.pdf",
  "local": true
 },
 {
  "m": "Direito Civil",
  "t": "Pessoas Jurídicas",
  "id": "1iJpxlqyVZxPU9WvkmOkGs03nAouFXEjI",
  "kb": 520,
  "url": "apostilas/direito-civil-pessoas-juridicas.pdf",
  "local": true
 },
 {
  "m": "Direito Civil",
  "t": "Domicílio",
  "id": "1ua37AamSKYEpGjl4kDr0tBLq7yAtdBbr",
  "kb": 1197,
  "url": "apostilas/direito-civil-domicilio.pdf",
  "local": true
 },
 {
  "m": "Direito Civil",
  "t": "Bens",
  "id": "1KOdtOQSIUtBB_c1q4o0jnRqQSc3XYXjH",
  "kb": 840,
  "url": "apostilas/direito-civil-bens.pdf",
  "local": true
 },
 {
  "m": "Direito Civil",
  "t": "Negócio Jurídico",
  "id": "1dDiFuZcHSyQbVRYIw7UPMSjPh1X9423w",
  "kb": 796,
  "url": "apostilas/direito-civil-negocio-juridico.pdf",
  "local": true
 },
 {
  "m": "Direito Civil",
  "t": "Atos Jurídicos Lícitos e Ilícitos e Responsabilidade Civil",
  "id": "1C0J4YYeLeYwI8bYXdY-RdSKKfzGbikzo",
  "kb": 2439,
  "url": "apostilas/direito-civil-atos-juridicos-licitos-e-ilicitos-e-responsabilidade-civil.pdf",
  "local": true
 },
 {
  "m": "Direito Civil",
  "t": "Prescrição e Decadência",
  "id": "10FKQOx4QBW9_E2CCOm_7r3rNbfg2kpRo",
  "kb": 318,
  "url": "apostilas/direito-civil-prescricao-e-decadencia.pdf",
  "local": true
 },
 {
  "m": "D.Tributário",
  "t": "Direito Tributário (04/09)",
  "id": "1KrMXL6RCTKdSc8yCsNEPq24y3Bt9pRbz",
  "kb": 561,
  "url": "apostilas/d-tributario-direito-tributario-04-09.pdf",
  "local": true
 },
 {
  "m": "Lei 14.133 220",
  "t": "Nova Lei de Licitações e Contratos (Lei 14.133/2021)",
  "id": "1xWibJ_HBoicKwv8pH_B4DkFGeWYNBIr6",
  "kb": 1993,
  "url": "apostilas/lei-14-133-220-nova-lei-de-licitacoes-e-contratos-lei-14-133-2021.pdf",
  "local": true
 },
 {
  "m": "Lei 14.133 220",
  "t": "Licitações e Contratos Administrativos",
  "id": "1VobUxGrNrWLq1M4IQtoz6kq6pJNnq3tg",
  "kb": 644,
  "url": "apostilas/lei-14-133-220-licitacoes-e-contratos-administrativos.pdf",
  "local": true
 },
 {
  "m": "Lei Orgânica do TCDF",
  "t": "Lei Orgânica do TCDF (LC 1/1994)",
  "id": "1GWb5xY5nDvkxs3vOkqP0deDilM97jJUP",
  "kb": 657,
  "url": "apostilas/lei-organica-do-tcdf-lei-organica-do-tcdf-lc-1-1994.pdf",
  "local": true
 },
 {
  "m": "Reg. Interno",
  "t": "Regimento Interno do TCDF (Res. 296/2016)",
  "id": "1uJ_SUxo4xT0ie7cYl2Fe-zGFZFhn3_0U",
  "kb": 991,
  "url": "apostilas/reg-interno-regimento-interno-do-tcdf-res-296-2016.pdf",
  "local": true
 },
 {
  "m": "LODF",
  "t": "LODF — títulos I e II",
  "id": "1d1ynvpN0kaItL6BD_2UUZpbKQkaoS4im",
  "kb": 529,
  "url": "apostilas/lodf-lodf-titulos-i-e-ii.pdf",
  "local": true
 },
 {
  "m": "LODF",
  "t": "LODF — capítulo III",
  "id": "1ceWY81e4tk3L4tyto6W9lGx6V-BDs8S2",
  "kb": 409,
  "url": "apostilas/lodf-lodf-capitulo-iii.pdf",
  "local": true
 },
 {
  "m": "LODF",
  "t": "LODF — capítulos IV e V",
  "id": "1YiFf9OsJBqHssF8m-q5L1mpDSs8joAgE",
  "kb": 547,
  "url": "apostilas/lodf-lodf-capitulos-iv-e-v.pdf",
  "local": true
 },
 {
  "m": "RJU LC840",
  "t": "Comparativa LC 840 × Lei 8.112",
  "id": "17nbZQBRWwA97bSJAwPE1tk-tp1XNpKKL",
  "kb": 410,
  "url": "apostilas/rju-lc840-comparativa-lc-840-lei-8-112.pdf",
  "local": true
 },
 {
  "m": "RJU LC840",
  "t": "RJU LC 840 — capítulos I, II e III",
  "id": "1IxtS-eRbeG59nMgwBwEV6E6bQRrd285e",
  "kb": 589,
  "url": "apostilas/rju-lc840-rju-lc-840-capitulos-i-ii-e-iii.pdf",
  "local": true
 },
 {
  "m": "RJU LC840",
  "t": "RJU LC 840 — capítulo IV",
  "id": "1u_liADu9-sPHqMFszeVfEfv-lZ6FkSUW",
  "kb": 310,
  "url": "apostilas/rju-lc840-rju-lc-840-capitulo-iv.pdf",
  "local": true
 },
 {
  "m": "RJU LC840",
  "t": "RJU LC 840 — capítulos V a IX",
  "id": "10F3CP05Tk94AKIFqfSjWFbyTaEafSCWx",
  "kb": 443,
  "url": "apostilas/rju-lc840-rju-lc-840-capitulos-v-a-ix.pdf",
  "local": true
 },
 {
  "m": "Previdenciário",
  "t": "Seguridade Social, RGPS e RPPS",
  "id": "1ZXmF1RAl7rQLS55mNjoTXywWJQHCqMHf",
  "kb": 362,
  "url": "apostilas/previdenciario-seguridade-social-rgps-e-rpps.pdf",
  "local": true
 },
 {
  "m": "Previdenciário",
  "t": "RPPS/DF — LC 769",
  "id": "1BgULJ7XLbKPlxqQ3Jr6WvC8ILkPL1C5O",
  "kb": 759,
  "url": "apostilas/previdenciario-rpps-df-lc-769.pdf",
  "local": true
 },
 {
  "m": "Previdenciário",
  "t": "Previdência complementar — LC 108/2001",
  "id": "1mZISZIfrgMLl1ztlFeWuEQVsrzHH2ffn",
  "kb": 476,
  "url": "apostilas/previdenciario-previdencia-complementar-lc-108-2001.pdf",
  "local": true
 },
 {
  "m": "Previdenciário",
  "t": "Previdência complementar — LC 109/2001",
  "id": "18e8wySemXHRwfX0kRnnGyFu8fagUE7V8",
  "kb": 1133,
  "url": "apostilas/previdenciario-previdencia-complementar-lc-109-2001.pdf",
  "local": true
 },
 {
  "m": "Previdenciário",
  "t": "Previdência complementar — LC 932",
  "id": "17gD4Dm6k-8NssD7ndTWOtUuJeBwxso1n",
  "kb": 448,
  "url": "apostilas/previdenciario-previdencia-complementar-lc-932.pdf",
  "local": true
 },
 {
  "m": "Conhec. DF",
  "t": "Conhecimentos do DF e RIDE — parte 1",
  "id": "1VzYkFkTKQLnY2GoPM5V4SPgbqGMnMQg1",
  "kb": 611,
  "url": "apostilas/conhec-df-conhecimentos-do-df-e-ride-parte-1.pdf",
  "local": true
 },
 {
  "m": "Conhec. DF",
  "t": "Conhecimentos do DF e RIDE — parte 2",
  "id": "1-Ua5D_cwoQYqWBouwahiyKy5bWcZjFJ9",
  "kb": 414,
  "url": "apostilas/conhec-df-conhecimentos-do-df-e-ride-parte-2.pdf",
  "local": true
 },
 {
  "m": "PDPM Mulheres",
  "t": "Lei Maria da Penha (Lei 11.340/2006)",
  "id": "1yljVtDMrrr2J5nkynDPZ-iSZa2Y8wFmY",
  "kb": 895,
  "url": "apostilas/pdpm-mulheres-lei-maria-da-penha-lei-11-340-2006.pdf",
  "local": true
 },
 {
  "m": "PDPM Mulheres",
  "t": "PDPM II-DF e Decreto Distrital 42.590",
  "id": "1j7-KrOSV_gx-75q-RY7tovG4jHM44rTR",
  "kb": 437,
  "url": "apostilas/pdpm-mulheres-pdpm-ii-df-e-decreto-distrital-42-590.pdf",
  "local": true
 },
 {
  "m": "Primeiros Socorros",
  "t": "Primeiros Socorros",
  "id": "14w3EpZCJlZthh6Xc8DfJTzJfUWQyeaUx",
  "kb": 558,
  "url": "apostilas/primeiros-socorros-primeiros-socorros.pdf",
  "local": true
 },
 {
  "m": "AFO",
  "t": "Lei 4.320/1964",
  "id": "1tfXzHtCPjM3j-Y6WNlLo6RKpO76WaKuu",
  "kb": 1868,
  "url": "apostilas/afo-lei-4-320-1964.pdf",
  "local": true
 },
 {
  "m": "AFO",
  "t": "Lei de Responsabilidade Fiscal (LC 101/2000)",
  "id": "1XF32kIJVshJHco5XgF8sXkCxv5qTvOdt",
  "kb": 422,
  "url": "apostilas/afo-lei-de-responsabilidade-fiscal-lc-101-2000.pdf",
  "local": true
 },
 {
  "m": "AFO",
  "t": "Decreto Distrital 32.598/2010",
  "id": "1akYf8--jVEc5N8jby6yqxThGdGIJ2kxP",
  "kb": 389,
  "url": "apostilas/afo-decreto-distrital-32-598-2010.pdf",
  "local": true
 }
];
/* nomes alternativos da matéria na base (o chip 📄 e a aba Matérias reconhecem os dois) */
const APOSTILA_ALIAS = { 'redes': 'Redes de Computadores', 'direito constitucional': 'Constitucional' };
function apostilaMateria(m){ const t = String(m || '').match(/^.+? - (.+) - \d{4}(?:-\d{2}-\d{2})?$/); if(t) m = t[1];      // título "Banca - Matéria - data" → só a matéria
  const k = String(m || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); return APOSTILA_ALIAS[k] || m; }
function apostilaUrl(a){ return a.url || ("https://drive.google.com/file/d/"+a.id+"/view"); }
