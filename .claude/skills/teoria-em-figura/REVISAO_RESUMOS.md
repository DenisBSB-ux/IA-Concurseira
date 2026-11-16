# Revisão dos resumos — uma matéria por vez (pedido do usuário em 16/11/2026)

Regra: revisar uma matéria, passar sozinho para a próxima; **publicar (PR + merge) a cada 5 matérias concluídas** (commit por matéria na branch). Relatório curto ao usuário a cada publicação.
Roteiro por matéria: `revisar_resumo.py extrair <slug> <md>` → revisor (agente sonnet, `PROMPT_REVISAO.md`) devolve `edicoes.json` → `revisar_resumo.py aplicar <slug> <json>` (valida, aplica e refaz a tabela errado × correto) → `bash tests/run.sh` → commit.
Gabarito nunca muda sem confirmação do usuário (alertas vão para o relatório).

Ordem e situação:
- [x] d-tributario (publicado v580; revisão manual — `revisao_d_tributario.py`)
- [x] afo (28 edições; limite de pessoal da União corrigido para 50% da RCL)
- [x] constitucional (45 edições; decreto autônomo do art. 84, VI, a corrigido)
- [x] rju-lc840 (127 edições; readaptação art. 277 e horário especial 50% corrigidos)
- [ ] direito-civil
- [ ] previdenciario        ← publicar após esta (lote 1: 5 matérias)
- [ ] lei-14133
- [ ] lei-organica-tcdf
- [ ] lodf
- [ ] reg-interno
- [ ] adm-lgpd-lai          ← publicar (lote 2)
- [ ] adm-8429
- [ ] analise-dados-ia
- [ ] conhec-df
- [ ] contratos
- [ ] pdpm                  ← publicar (lote 3)
- [ ] in5
- [ ] primeiros-socorros
- [ ] decreto-44330
- [ ] administrativo-geral  ← publicar (lote 4, final)

Alertas para o usuário (acumulados):
- AFO: (a) 'ação nova pode entrar na LOA durante o exercício' (CF 165 §2º) sem apoio direto no texto da CF do projeto; (b) 'A execução da LOA começa com a sua sanção' / macete 'Sancionou, executa' imprecisos; (c) regra sobre pedágio e taxas sem dispositivo conferível na Lei 4.320; (d) macete 'Pessoal só compensa no fim do ano, e com lei' vago; (e) resumo do art. 17 da LRF mistura classificação de obra com despesa continuada.
- Constitucional: (a) assuntos 17 e 18 parecem ter regras trocadas (Defensor Público-Geral no 17, AGU no 18); (b) não conferidos no texto do projeto: MS 40.799, ADIs 6.524, prazo de 24 meses no MI do art. 7º, XI, regra dos 'mais de 170 desembargadores'; (c) regra do Tribunal de Contas julgar contas de gestão de prefeito ordenador depende de entendimento recente do STF — conferir gabarito dos flashcards; (d) Tema 1127 mistura locação residencial e comercial; (e) art. 5º, LXVII como eficácia contida é discutível; (f) edição cita Lei 9.504/1997 art. 11 §2º (idade mínima na posse), que não está nos textos do projeto.
- RJU LC 840: flashcard sobre assistência à servidora (art. 41-A) parece exigir/excluir 'sindicância prévia' e a lei é silente — conferir o gabarito.
