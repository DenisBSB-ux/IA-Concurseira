# Revisão dos resumos — uma matéria por vez (pedido do usuário em 16/11/2026)

Regra: revisar uma matéria, passar sozinho para a próxima; **publicar (PR + merge) a cada 5 matérias concluídas** (commit por matéria na branch). Relatório curto ao usuário a cada publicação.
Roteiro por matéria: `revisar_resumo.py extrair <slug> <md>` → revisor (agente sonnet, `PROMPT_REVISAO.md`) devolve `edicoes.json` → `revisar_resumo.py aplicar <slug> <json>` (valida, aplica e refaz a tabela errado × correto) → `bash tests/run.sh` → commit.
Gabarito nunca muda sem confirmação do usuário (alertas vão para o relatório).

Ordem e situação:
- [x] d-tributario (publicado v580; revisão manual — `revisao_d_tributario.py`)
- [x] afo (28 edições; limite de pessoal da União corrigido para 50% da RCL)
- [ ] constitucional
- [ ] rju-lc840
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
