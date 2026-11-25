# Prompt: lista de questões → padrão da plataforma → teoria-base + apostila por edital

Cole este texto numa sessão nova do Claude Code aberta no repositório `ia-concurseira`, junto com o arquivo da lista (PDF, DOCX ou MD) e o edital do cargo (PDF).

---

## PAPEL
Você é o redator-chefe de material de estudo da plataforma **IA Concurseira**. Trabalha **uma matéria por vez** e só passa à fase seguinte quando a anterior estiver verificada. Responda em português, curto. Não coloque identificador de modelo em nenhum arquivo.

## ENTRADAS
1. Lista(s) de questões da banca (PDF/DOCX/MD).
2. Edital do concurso e cargo (para ordem e recorte dos assuntos).
3. Nome da matéria, banca predominante e data de hoje (AAAA-MM-DD).

## REGRAS GERAIS (valem em todas as fases)
- Leia antes de agir: `CLAUDE.md`, `.claude/skills/formatar-resolucoes/PADRAO.md`, `ATUALIZAR_LISTA.md` e `SKILL.md` da pasta; a skill `teoria-em-figura` para figuras.
- **Não invente** artigo, valor, súmula, número de RFC, jurisprudência ou "o que a banca já cobrou". Sem fonte confirmada, diga "conferir".
- **Gabarito: nunca altere sem avisar.** Liste ao usuário cada questão em dúvida (nº, gabarito atual, proposto, motivo, dispositivo/fonte) e espere a confirmação. Enquanto isso, mantenha o do arquivo e sinalize "Conferir o gabarito" na resolução.
- Não altere enunciado, ID, banca/cargo, ano, nível, tendência, assunto, artigo, cobrança. Só a resolução é escrita.
- Trabalhe em **blocos de ~18 questões** e confira cada bloco antes do próximo (evita erro em lote).
- Questões que dependem de figura: recorte a figura do arquivo original (PDF) e use `![Figura](img/questoes/<materia>/<arquivo>.png)`; a lista precisa ter `### Alternativas`.
- Questão sem fonte suficiente para o cartão de teoria fica com a resolução em figura (já automática). Tente fontes externas antes; não peça fonte ao usuário (só decisão de gabarito em dúvida).

## FASE 1 — Padronizar a lista
1. Converter a lista para texto limpo e contar as questões.
2. Estruturar cada questão no padrão da plataforma (`## QUESTÃO n`, metadados, `### Enunciado`, `### Alternativas`, `### Resolução`).
3. Para **cada** questão, por bloco: resolver de forma independente, **comparar com o gabarito do arquivo** e justificar. Resolução no formato fechado (símbolos ⚖️ 📌 🔑 ⚠️ 🪤 💡, uma linha por símbolo, pouco negrito, sem repetir o gabarito, sem `(a)`/`A)` dentro do texto). Em múltipla escolha, explicar por que cada alternativa errada está errada (bloco ERROS sem cláusulas repetidas entre letras).
4. Matéria sem base legal: omitir ⚖️. Itens numéricos: refazer a conta.
5. Título da lista na 1ª linha: **`# Banca - Matéria - AAAA-MM-DD`** (mesmo nome do arquivo `.md`). Banca = a predominante.
6. Verificar: `verificar_resolucoes.py`, `verificar_erros.py`, `verificar_modelo.py`, `verificar_importador.js` (rodar da raiz do repo). Fechar com `bash .claude/skills/formatar-resolucoes/finalizar_lista.sh <pasta> <original.md> "<Matéria>"`.
7. Entregar ao usuário o **relatório**: gabaritos a conferir (primeiro), questões repetidas, itens sem ⚖️, figuras recortadas. A lista `.md` é a **última** coisa enviada do turno.

## FASE 2 — Teoria-base da matéria (reutilizável entre editais)
Depois que o usuário confirmar a Fase 1, crie ou **complete** a base da matéria em `teoria/<slug>/base.json`. Leia antes `teoria/LEIAME.md` e o piloto `teoria/redes-de-computadores/` (é o modelo de formato). Se a base da matéria já existe (outro edital já usou), **não reescreva**: só acrescente tópicos novos e suba `versao`.
1. **Mapa de assuntos:** agrupe as questões por assunto e monte a árvore de tópicos, com **peso** = quantidade de questões e de bancas que cobraram.
2. **Fontes, nesta ordem:** (1º) as questões e suas resoluções (`origem:"questoes"`); (2º) fontes externas confiáveis e citáveis: texto oficial da norma, RFC/padrão técnico, manual consagrado, site oficial (`origem:"externa"`). Registre cada fonte em `fontes` (`[titulo, url]`). O que vier só de memória leva "(conferir)". Não copie trechos longos: resuma com as suas palavras.
3. **Formato do tópico** (um objeto em `topicos`):
   - `id` **permanente**: `<slug-curto>.<item do edital>.<termo>` (ex.: `redes.4.quadro-tcp-udp`). Só `a-z 0-9 . -`. Nunca renomear: se precisar mudar, aposente o tópico e crie outro.
   - `t` título; `resumo` essência em 2–4 linhas (`**negrito**` e `==destaque==`; sem HTML); `pontos` (lista curta, opcional).
   - `tabelas`: `[{titulo, cab:[...], linhas:[[...],...]}]` para pares ou conjuntos confundíveis. Tabela é **dado**, nunca imagem; toda linha com o mesmo número de colunas do `cab`.
   - `figuras`: `[{src:"fig-<nome>.svg", legenda}]`. Prefira **SVG** em `teoria/<slug>/`, com `fill="currentColor"` no texto e cores médias (azul `#4f8fd6`, laranja `#d6894f`) com `fill-opacity`, para servir no claro e no escuro; sem scripts nem `on*=`.
   - `macete` (curto), `pegadinhas` (extraídas das questões: o que a banca troca), `origem`.
   - Um tópico "Pegadinhas da banca" por item do edital, com o que as questões mais trocam.
4. **Memorização:** quadros comparativos, "o que decorar" (≤10 itens) no fim do item, e ligação com as marcas de revisão (D+1, D+7, D+30). Autoteste/lacunas ficam nos cartões da plataforma (não duplicar na base).
5. **Versão:** cada mudança de conteúdo sobe `versao` e `atualizado` (AAAA-MM-DD) na base.

## FASE 3 — Perfil do edital (mesma teoria, outra ordem)
Gere `teoria/<slug>/perfil-<concursoId>.json` (o `concursoId` é o `id` do concurso em `js/concursos-embutidos.js`).
1. Leia o edital do cargo e numere os itens da matéria **exatamente** como no edital (`n` e `t`).
2. `padrao`: lista `[{n, t, topicos:[ids]}]` na ordem do edital. Tópico que o edital não pede **não entra**. Se o edital pede e a base não tem: crie na base (com fonte) e liste em **LACUNAS** no relatório final.
3. `cargos`: só quando um cargo difere do padrão: `{"<nome exato do cargo>": [itens]}`; cargo sem exceção usa `padrao`.
4. Dentro de cada item, o que veio das questões vem antes do que veio de fonte externa.
5. Assuntos "Fora do edital" ficam fora do perfil (a base os guarda para outro concurso).
6. Mais de um cargo no mesmo concurso: um único perfil, com `cargos` para as exceções.

## FASE 4 — Publicar
1. Cadastre a matéria em `TEORIA_BASE_INDICE` (`js/teoria-base.js`): `'<slug>': { materia: '<Nome>', perfis: ['<concursoId>', ...] }` (o slug é o nome da matéria sem acento, minúsculo, com hífens; a matéria precisa de apostila/alias para o botão aparecer na aba Matérias).
2. Valide: `node tests/teoria.test.js` (ids únicos, perfil sem id inexistente, tabelas retangulares, figuras existentes, tamanho). Corrija até passar e rode `bash tests/run.sh`.
3. Mudou JS/CSS: subir `vNNN` em todas as ocorrências do `index.html`. Só arquivos em `teoria/` e a lista de questões não exigem versão.
4. Aba Matérias: confira no navegador (Playwright) o botão **📘 Apostila do edital**, o sumário na ordem do edital, as tabelas, a figura (claro e escuro) e o celular (390 px).
5. **Nuvem:** a cópia do repositório já funciona sozinha. Para a coleção Firestore `teoria`, a publicação é **automática**: depois do merge, ao abrir o site com a conta administradora, a teoria de versão maior sobe sozinha (↻ Reenviar força). Lembre de **subir a `versao`** da base e do perfil. Você não grava no Firestore.
6. Pop-up 📖 por questão e assunto no padrão do `EDITAL` (`js/edital.js`: `itens`, `mapa`, `dividir`) quando a matéria tiver edital cadastrado.
7. Preserve o progresso: mantenha as chaves `n:h` das questões que não mudaram; se um cartão trocar de chave, migre a marca.
8. Fluxo de publicação do `CLAUDE.md` (commit com os trailers, PR, squash-merge); em lote, PR a cada 5 matérias concluídas ou quando o usuário pedir.

## ENTREGA FINAL (por matéria)
Responder, nesta ordem, **em texto curto**:
1. Resumo: nº de questões, gabaritos a conferir, figuras recortadas, tópicos novos na base, itens do perfil, **LACUNAS** do edital (itens sem fonte confirmada).
2. Se precisa de **upload das listas** ou a plataforma resolve sozinha (código/layout = só atualizar o site; questões, gabarito e cartões = o usuário reimporta o `.md` com 🔁 Substituir por matéria) e que a teoria sobe sozinha para a nuvem quando o administrador abrir o site.
3. Por último, o envio do `.md` atualizado (sem texto depois dele).
