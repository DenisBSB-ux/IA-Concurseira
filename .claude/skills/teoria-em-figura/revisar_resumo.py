#!/usr/bin/env python3
"""revisar_resumo.py: roteiro de revisão de resumos (uma matéria por vez).
  extrair <slug> <saida.md>     grava o resumo da matéria com ids de linha (para o revisor ler)
  aplicar <slug> <edicoes.json> aplica as edições do revisor (valida cada uma) e refaz a tabela errado x correto da matéria
Edição: {"a": nº do assunto (1..n), "old": trecho EXATO que identifica uma única linha, "new": linha nova completa (com o prefixo "- ", "  - ", "> [!pega] ", "> [!dica] "...) ou null para apagar, "why": motivo}
Inclusão: {"a": n, "after": trecho que identifica a linha anterior, "new": linha nova completa, "why": motivo}"""
import json, subprocess, sys, re, os
P = 'js/resumos-dados.js'
def carregar():
    js = subprocess.run(['node', '-e', "eval(require('fs').readFileSync('%s','utf8')+';global.R=RESUMOS_TCDF');console.log(JSON.stringify(R))" % P], capture_output=True, text=True).stdout
    return json.loads(js)
def gravar(R):
    cab = open(P, encoding='utf-8').read().split('\n', 1)[0]
    open(P, 'w', encoding='utf-8').write(cab + '\nconst RESUMOS_TCDF = ' + json.dumps(R, ensure_ascii=False, separators=(',', ':')) + ';\n')
def extrair(slug, saida):
    r = carregar()[slug]; out = ['# %s — resumo para revisão' % r['nome'], '']
    for i, a in enumerate(r['assuntos'], 1):
        out.append('## ASSUNTO %d — %s' % (i, a['nome']))
        sec = ''
        for l in a['md'].split('\n')[2:]:
            if l.startswith('## '): sec = l; out.append(l); continue
            if 'banca troca' in sec or 'Números' in sec: continue      # tabelas são regeneradas por script
            out.append(l)
        out.append('')
    open(saida, 'w', encoding='utf-8').write('\n'.join(out)); print('ok', slug, len(out), 'linhas')
def marcas_ok(t): return t.count('==') % 2 == 0 and t.count('!!') % 2 == 0 and t.count('##') % 2 == 0 and '\n' not in t
def aplicar(slug, arq):
    R = carregar(); r = R[slug]; ed = json.load(open(arq, encoding='utf-8')); ok = []; falhas = []
    for e in ed:
        a = e.get('a'); 
        if not isinstance(a, int) or not 1 <= a <= len(r['assuntos']): falhas.append((e, 'assunto inválido')); continue
        L = r['assuntos'][a - 1]['md'].split('\n'); chave = e.get('old') or e.get('after') or ''
        ach = [k for k, l in enumerate(L) if chave and chave in l and not l.startswith('|') and not l.startswith('#')]
        if len(ach) != 1: falhas.append((e, 'linha encontrada %d vez(es)' % len(ach))); continue
        k = ach[0]; novo = e.get('new')
        if novo is not None and (not marcas_ok(novo) or not re.match(r'^(\s*- |> \[!(pega|dica|resumo)\])', novo)): falhas.append((e, 'texto novo inválido (marcas ou prefixo)')); continue
        if 'after' in e: L.insert(k + 1, novo)
        else:
            velho = L[k][2:] if L[k].startswith('- ') else None
            if novo is None: del L[k]
            else: L[k] = novo
            if velho and novo:
                for j, l in enumerate(L):
                    if l.startswith('> [!resumo]') and (' — ' + velho) in l: L[j] = l.replace(' — ' + velho, ' — ' + novo[2:])
        r['assuntos'][a - 1]['md'] = '\n'.join(L); ok.append(e)
    for a in r['assuntos']:      # cabeçalhos de lei que ficaram sem nenhuma regra
        L = a['md'].split('\n'); out = []
        for k, l in enumerate(L):
            if l.startswith('### ') and not (k + 1 < len(L) and re.match(r'^\s*- ', L[k + 1])): continue
            out.append(l)
        a['md'] = '\n'.join(out)
    gravar(R)
    subprocess.run([sys.executable, '.claude/skills/teoria-em-figura/contexto_trocas.py', '--so', slug], check=False)
    orf = []
    for i, a in enumerate(carregar()[slug]['assuntos'], 1):
        L = a['md'].split('\n'); regras = set(re.sub(r'^\s*- ', '', l) for l in L if re.match(r'^\s*- ', l))
        orf += ['%d: %s' % (i, l[:110]) for l in L if l.startswith('> [!resumo]') and ' — '.join(l.split(' — ')[1:]) not in regras]
    print('aplicadas', len(ok), 'falhas', len(falhas), '| callouts sem regra correspondente:', len(orf))
    for o in orf: print('  ', o)
    for e, m in falhas: print(' FALHA', m, '|', (e.get('old') or e.get('after') or '')[:90])
if __name__ == '__main__':
    c = sys.argv[1]
    if c == 'extrair': extrair(sys.argv[2], sys.argv[3])
    elif c == 'aplicar': aplicar(sys.argv[2], sys.argv[3])
