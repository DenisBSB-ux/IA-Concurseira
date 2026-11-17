# Prompt do revisor "resumo objetivo e prático" (por matéria)

Você reescreve o RESUMO da matéria <NOME> (arquivo <ARQ_RESUMO>, só assuntos <FAIXA>) do TCDF Plataforma para ficar OBJETIVO e PRÁTICO. Problema atual: o mesmo fato aparece várias vezes (⚡ Em 30 segundos, tabela "O que a banca troca", 📌 Regras por lei com microtítulos "### X · 1 prova", 💡 Macetes). O aluno quer ler pouco e lembrar muito.

Para CADA assunto, devolva o markdown novo COMPLETO no formato:
```
# <nome do assunto>            (linha 1, igual à original)
> <linha de estatística original, sem alteração>
## ⚡ Em 30 segundos           (mantenha só o que é essencial: no máximo 5 callouts "> [!resumo] **Rótulo** — frase")
## 🔢 Números e prazos          (só se existir no original; mantenha a tabela como está)
## ⚖️ O que a banca troca (errado × correto)   (só se existir; mantenha NO MÁXIMO 4 linhas da tabela, as que mostram uma troca que NÃO está dita no ⚡ nem nas regras; apague as demais; mantenha o cabeçalho da tabela)
## 📌 Regras por tema
### <tema curto, 2–5 palavras>   (3 a 6 temas; agrupe os microtítulos "### X · N prova" por afinidade)
- regra em UMA linha objetiva (sem repetir o que o ⚡ já diz)
## 💡 Macetes                   (no máximo 3, só os que não repetem regra; omita a seção se não sobrar nenhum)
```
Regras de ouro:
1. CADA FATO UMA SÓ VEZ no assunto inteiro: prioridade ⚡ > números > regras > tabela > macete. Se a frase do ⚡ já diz, apague das regras/macete; se a linha da tabela repete uma regra, apague uma das duas (mantenha a que for mais útil para a prova).
2. NÃO invente conteúdo: use só fatos que já estão no assunto; pode juntar duas regras vizinhas numa linha e encurtar. Nunca mude o sentido, números, artigos ou polaridade (pode/deve/não). Não toque no gabarito (não há).
3. Preserve as marcas em pares: ==amarelo== (a frase central), !!vermelho!! (negação/exceção), ##azul##. Cada regra com 1 destaque ==…== no trecho que decide a prova.
4. Mantenha as referências de dispositivo quando existirem (ex.: "(art. 37, XX)") e os cabeçalhos "### Lei/norma" apenas se o assunto for organizado por norma e houver mais de uma norma — nesse caso use o nome da norma como tema.
5. Linhas curtas (≤ 220 caracteres), sem frases soltas sem sujeito. Alvo: reduzir o assunto a cerca de 40–60% do tamanho atual sem perder nenhuma regra distinta.
6. Se um assunto já está enxuto, mantenha-o quase igual.
7. Não mexa em outras linhas de cabeçalho/estatística; não crie imagens/figuras (linhas `![...](img/...)` devem ser copiadas como estão, no lugar em que estão).
Saída: escreva com Write o arquivo <ARQ_SAIDA> com JSON {"assuntos":[{"a": nº, "md": "markdown completo do assunto"}], "alertas":["..."]} (alertas só para inconsistências que você viu; não altere por conta própria). Responda só: "ok N assuntos".
