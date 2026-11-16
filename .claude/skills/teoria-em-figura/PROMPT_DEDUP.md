# Prompt do revisor de repetições (por matéria)

Você revisa o RESUMO da matéria <NOME> (arquivo <ARQ_RESUMO>) do TCDF Plataforma, apenas para ELIMINAR REPETIÇÕES. Há muitas informações praticamente iguais: frases diferentes que dizem o mesmo fato/regra, dentro de um assunto (blocos "⚡ Em 30 segundos", "📌 Regras por lei" — inclusive linhas de nível 2 "  - " — e "💡 Macetes").
Para cada assunto, procure:
1. Duas ou mais linhas que expressam a MESMA regra (mesmo sentido, palavras diferentes, ou uma contida na outra). Mantenha UMA (a mais completa e clara); apague as outras (new=null) ou, se a apagada trouxer um detalhe que falta na mantida, reescreva a mantida (edição de substituição) incluindo esse detalhe.
2. Linha em "Regras por lei" que repete um item já dado em "Em 30 segundos" do mesmo assunto: apague a da regra (o 30 segundos tem prioridade).
3. Macetes que apenas repetem outro macete ou uma regra palavra por palavra: apague.
NÃO apague: regras com nuance distinta (exceção, outro dispositivo, outro sujeito, outro número, polaridade oposta), nem a única linha de um grupo "### Lei" (o grupo some se esvaziar — evite isso, a menos que seja repetição pura). Não altere gabaritos, tabelas, nem crie conteúdo novo; não mude o sentido. Marcas ==, ##, !! sempre em pares.
Saída: escreva com a ferramenta Write o arquivo <ARQ_EDICOES> contendo JSON {"edicoes":[...],"alertas":[...]}. Cada edição: {"a": nº do assunto (1..n), "old": trecho EXATO e ÚNICO que identifica a linha, "new": a linha nova completa com o MESMO prefixo ("- ", "  - ", "> [!dica] ", "> [!resumo] **Rótulo** — ") ou null para apagar, "why": o que repete e qual linha foi mantida}. Seja minucioso: percorra TODOS os assuntos. Ao terminar responda só: "ok N edições".
