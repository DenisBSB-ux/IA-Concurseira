# Prompt do redator de lacunas (por matéria)

Você cria as LACUNAS que faltam da matéria <NOME> (TCDF Plataforma). Leia <ARQ_QUESTOES> (questões ainda sem lacuna: enunciado, regra v e erro→certo x) e escreva <ARQ_SPEC> (JSON), no formato do piloto `/home/user/tcdf-plataforma/.claude/skills/teoria-em-figura/lacunas/decreto-44330.json` (leia-o antes).

Para CADA questão (todas, sem pular), escolha o modo:
- **A** (frase da questão): só quando o enunciado, depois das trocas, vira uma frase CERTA e limpa, sem comando, sem trecho que afirme algo não confirmado pela regra v. Item ERRADO: `r` = lista de [trecho do enunciado, trecho corrigido] (o trecho a achar deve aparecer UMA vez, copiado exatamente do enunciado; use o certo do campo x). Item CERTO: sem `r`, frase como está.
- **B** (regra da questão): use a regra v como frase quando o enunciado for longo (>350 caracteres), confuso, múltipla escolha, narrativo, ou quando sobrar afirmação não confirmada. A frase é exatamente o texto de v.
- Nunca mude o sentido nem invente; a frase final tem de ser verdadeira segundo a regra v/ref. Não mexa em gabarito. Se o gabarito parecer contrariar a regra v, use B e registre em "alertas".

Escolha dos espaços (`b`, 1 a 3 trechos, cada um aparece UMA vez na frase final, sem se sobrepor, de 1 a 6 palavras, nunca só palavra vazia):
1. o termo decisivo da regra (a palavra/expressão que o item errado trocou);
2. prazos, números, valores, quóruns, artigos e órgãos;
3. negações e exceções ("não", "salvo", "vedada").
Distratores (`d`, 2 a 3): alternativas plausíveis do mesmo tipo (número com número, órgão com órgão, "poderá" × "deverá"), incluindo o termo errado do enunciado quando houver. NENHUM distrator pode ser igual às respostas nem aparecer (nem como parte de palavra/trecho) dentro da frase final — confira cada um.

Saída: Write em <ARQ_SPEC> um JSON `[{"n":..,"m":"A|B|C","r":[[..,..]],"b":[..],"d":[..]}, ...]` com UMA entrada por questão do arquivo (use m "C" apenas para item CERTO usado como está; item ERRADO só em A com r ou em B). Inclua também, se houver, um segundo arquivo <ARQ_SPEC>.alertas.txt com observações (uma por linha). Responda só: "ok N itens".

**2ª rodada (arquivo com "MOTIVO DA REPROVAÇÃO"):** são questões cuja lacuna foi reprovada pelo conferente. Reescreva cada uma corrigindo o motivo (frase autônoma e verdadeira; lacuna sobre o ponto testado; distratores que NÃO completariam a frase corretamente). Use "t" (frase escrita à mão, modo B) quando precisar de uma frase nova derivada da regra v. Se não houver como fazer uma lacuna boa, escreva a entrada mesmo assim com a melhor opção e registre em .alertas.txt.
