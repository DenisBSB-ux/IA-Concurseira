# Teoria-base única + perfil por edital

A teoria de cada matéria existe **uma vez** (`base.json`). Cada edital tem um **perfil** que escolhe e ordena os tópicos pelos itens do edital. A apostila do edital é montada na hora, na aba **Matérias** (📘 Apostila do edital).

```
teoria/<slug>/base.json                 tópicos (id permanente, texto, tabelas, figuras, fontes)
teoria/<slug>/perfil-<concursoId>.json  itens do edital → ids de tópicos (padrao + exceções por cargo)
teoria/<slug>/fig-*.svg                 figuras (SVG, currentColor: servem no claro e no escuro)
```

**Base** — `{esquema, slug, materia, versao, atualizado, fontes:[[titulo,url]], topicos:[{id, t, resumo, pontos?, tabelas?:[{titulo,cab,linhas}], figuras?:[{src,legenda}], macete?, pegadinhas?, origem:'questoes'|'apostila'|'externa'}]}`.
**Perfil** — `{esquema, slug, concursoId, concurso, versao, padrao:[{n,t,topicos:[id]}], cargos:{"<nome do cargo>":[itens]}}`. `cargos` é opcional; cargo sem exceção usa `padrao`.

## Regras
- O `id` do tópico é **permanente** (`redes.4.quadro-tcp-udp`). Nunca renomeie: aposente o tópico e crie outro.
- Texto: `**negrito**` e `==destaque==`. Tabela = dados (cabeçalho + linhas), nunca imagem.
- Toda mudança de conteúdo sobe `versao`. Vale a maior versão entre nuvem e site.
- Cadastre a matéria nova em `TEORIA_BASE_INDICE` (`js/teoria-base.js`) e valide: `node tests/teoria.test.js` (roda no `tests/run.sh`).

## Nuvem
Coleção Firestore `teoria` (leitura pública; escrita só do administrador, ver `firestore.rules`). O administrador publica pelo botão **☁️ Publicar na nuvem** (aba Matérias), que envia a cópia do repositório. Documentos: `base__<slug>` (+ `base__<slug>__pN` se passar de ~350 KB), `perfil__<slug>__<concursoId>`. Na nuvem, linhas de tabela e fontes viram objetos (o Firestore não aceita lista dentro de lista); a leitura converte de volta.
