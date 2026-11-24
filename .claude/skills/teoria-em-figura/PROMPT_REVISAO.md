# Prompt do revisor de resumo (uma matéria por vez)

Você revisa o RESUMO de estudo da matéria <NOME> do IA Concurseira (concurso TCDF). Leia o arquivo <ARQ_RESUMO> (resumo por assunto: "Em 30 segundos", "Regras por lei", "Pegadinhas", "Macetes"). Fontes de verdade, só dentro do projeto a raiz do repositório: textos de lei em js/*-texto.js (CF, CTN, leis, decretos…), js/doutrina-*.js, e os flashcards/lacunas da matéria em js/treino-<SLUG>.js (campos f=enunciado, g=gabarito, v=resumo curto, x=erro→certo, ref=dispositivo). NÃO use a internet.

Objetivo: o resumo deve servir à revisão rápida e estar CORRETO. Procure e proponha correções para:
1. Erros de conteúdo (conceito, prazo, número, competência, dispositivo) — confira SEMPRE no texto da lei do projeto antes de afirmar; se não conseguir confirmar, não mude.
2. Frases cortadas, sem sujeito/contexto, ou presas a um caso da questão (nome de pessoa/estado, "aqui o…", "o enunciado…") — reescreva como regra geral completa.
3. Repetições e frases de mesmo sentido em linhas diferentes (mantenha a mais completa); macetes/pegadinhas duplicados ou vagos.
4. Conteúdo no assunto errado ou irrelevante; regra importante faltando (inclua no máximo 3 por assunto, só se estiver no texto da lei do projeto).
5. Destaques: ==termo-chave== (amarelo), ##número/prazo## (azul), !!negação/limite!! (vermelho). Cada regra deve ter o trecho decisivo em ==…==; não marque a frase inteira (2–10 palavras); marcas sempre em pares.
Regras de ouro: NUNCA altere gabarito de questão; não invente artigo, número ou jurisprudência; não mude o sentido sem evidência; não mexa nas tabelas "Números e prazos" e "O que a banca troca" (são regeneradas por script — se um flashcard estiver errado, descreva em "alertas").

Saída: escreva com a ferramenta Write o arquivo <ARQ_EDICOES> contendo um JSON com {"edicoes":[...],"alertas":[...]}.
Cada edição: {"a": nº do assunto (1..n), "old": trecho EXATO e ÚNICO que identifica uma linha do arquivo (de qualquer um dos tipos "- …", "  - …", "> [!pega] …", "> [!dica] …"), "new": a linha nova COMPLETA, com o mesmo prefixo (ex.: "- A ==regra==…"), ou null para apagar a linha, "why": motivo curto + dispositivo conferido}.
Inclusão: {"a": n, "after": trecho exato e único da linha após a qual inserir, "new": linha completa com prefixo "- ", "why": …}.
Alertas: lista de strings (ex.: "flashcard n=123 parece ter gabarito divergente do art. X" — sem alterar).
Seja criterioso e conciso; priorize erros reais sobre estilo. Ao terminar, responda só: "ok N edições, M alertas".
