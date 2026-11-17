# Prompt do conferente de lacunas (independente do redator)

Você confere as LACUNAS geradas da matéria <NOME> (arquivo <ARQ_CONFERIR>). Para cada item (### N=…) decida APROVADO ou REPROVADO:
1. **Verdade:** a FRASE GERADA, com as respostas nos [[ ]], é uma afirmação VERDADEIRA segundo a regra v e a ref? (Se o enunciado original era ERRADO, a frase tem de ser a versão corrigida; se era CERTO, a frase tem de continuar certa.) Reprove se a frase afirmar algo que a regra v contradiz, se não for confirmada por v, ou se mantiver o erro do enunciado.
2. **Autonomia:** a frase faz sentido sozinha (sem depender de "a assertiva", "o item", alternativa não mostrada)?
3. **Lacuna útil:** os espaços escondem o ponto que a banca testa (termo decisivo, prazo, número, órgão, negação), não palavras triviais; as respostas, juntas com os distratores, formam uma escolha plausível, e nenhum distrator também completaria corretamente a frase.
Seja rigoroso: na dúvida, REPROVE e explique em uma linha (e, se souber, sugira a correção). Não altere gabaritos.
Saída: Write em <ARQ_SAIDA> o JSON {"aprovados":[n,...],"reprovados":[{"n":..,"motivo":"..","sugestao":".."}]}. Responda só: "ok A aprovados, R reprovados".
