#!/usr/bin/env python3
"""consolidar_resumo.py: cada fato aparece UMA vez no resumo (pedido do usuário, 16/11/2026).
Ordem de prioridade: Em 30 segundos > Números e prazos > O que a banca troca > Regras por lei > Macetes.
- remove a seção "Pegadinhas da banca";
- remove das "Regras por lei" as linhas já cobertas por seções anteriores (30 s, números, trocas) e as quase iguais entre si;
- apaga grupos de lei e seções que ficaram vazios.
Uso: python3 consolidar_resumo.py [--so slug] [--seco] [--cont 0.6] [--jac 0.35]"""
import re, json, sys, subprocess, unicodedata
P = 'js/resumos-dados.js'
SO = sys.argv[sys.argv.index('--so') + 1] if '--so' in sys.argv else None
SECO = '--seco' in sys.argv
CONT = float(sys.argv[sys.argv.index('--cont') + 1]) if '--cont' in sys.argv else 0.6
JAC = float(sys.argv[sys.argv.index('--jac') + 1]) if '--jac' in sys.argv else 0.35
STOP = set('para como pela pelo pelas pelos mais pode podem sobre entre quando mesmo desde ainda assim deve devem sendo cada todo toda todos todas essa esse esta este isso seus suas seu sua uma umas uns dos das nos nas aos'.split())
POL = {'nao', 'sem', 'exceto', 'salvo', 'vedad', 'proib', 'nunca', 'jamai'}
def norm(t):
    t = unicodedata.normalize('NFD', t.lower()); t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9 ]', ' ', t)
def plano(t): return re.sub(r'==|!!|##|\*\*', '', t)
def toks(t):
    s = set(); pol = set()
    for w in norm(plano(t)).split():
        w = re.sub(r'(am|em|m|s)$', '', w) if len(w) > 5 else w; k = w[:5]
        if k in POL or w in POL: pol.add(k if k in POL else w); s.add(k); continue
        if len(w) > 3 and w not in STOP: s.add(k)
    return s, pol
def prox(a, b, cont=None, jac=None):
    (ta, na), (tb, nb) = toks(a), toks(b)
    if not ta or not tb or na != nb: return False
    i = len(ta & tb); return i / min(len(ta), len(tb)) >= (cont or CONT) and i / len(ta | tb) >= (jac or JAC)
def peso(t): return (len(plano(t)), t.count('=='))
def carregar():
    js = subprocess.run(['node', '-e', "eval(require('fs').readFileSync('%s','utf8')+';global.R=RESUMOS_TCDF');console.log(JSON.stringify(R))" % P], capture_output=True, text=True).stdout
    return json.loads(js)
def secoes(md):
    """[(titulo_da_seção ou '', linhas)]"""
    out = [['', []]]
    for l in md.split('\n'):
        if l.startswith('## '): out.append([l, []])
        else: out[-1][1].append(l)
    return out
st = {'peg': 0, 'cob30': 0, 'cobnum': 0, 'cobtroca': 0, 'dup': 0, 'dup30': 0, 'grupos': 0, 'macete': 0}
def processar(md):
    S = secoes(md); cobertos = []; novas = []
    # 1) 30 segundos (dedupe interno) e números/trocas viram "cobertos"
    for tit, L in S:
        if tit.startswith('## ⚡'):
            keep = []
            for l in L:
                m = re.match(r'> \[!resumo\] \*\*[^*]+\*\* — (.*)$', l)
                if m and any(prox(m.group(1), c) for c in cobertos): st['dup30'] += 1; continue
                if m: cobertos.append(m.group(1))
                keep.append(l)
            L[:] = keep
        elif tit.startswith('## 🔢'):
            for l in L:
                if l.startswith('| ') and not l.startswith('| Valor') and not l.startswith('|---'):
                    cel = [c.strip() for c in l.strip('|').split('|')]
                    if len(cel) >= 2: cobertos.append(cel[1])
        elif tit.startswith('## ⚖️'):
            for l in L:
                if l.startswith('| ') and not l.startswith('| ❌') and not l.startswith('|---'):
                    cel = [c.strip() for c in l.strip('|').split('|')]
                    if len(cel) >= 2: cobertos.append(cel[1])
    # 2) regras: cobertas e duplicadas
    for tit, L in S:
        if tit.startswith('## 📌'):
            grupos = []; atual = None
            for l in L:
                if l.startswith('### '): atual = [l, []]; grupos.append(atual)
                elif re.match(r'^\s*- ', l) and atual is not None: atual[1].append(l)
            vistos = []; res = []
            for h, linhas in grupos:
                keep = []
                for l in linhas:
                    t = re.sub(r'^\s*- ', '', l)
                    if any(prox(t, c, 0.7, 0.4) for c in cobertos): st['cob30'] += 1; continue
                    v = next((v for v in vistos if prox(t, v['t'])), None)
                    if v:
                        st['dup'] += 1
                        if '--pares' in sys.argv: print('  IGUAL:', plano(v['t'])[:110], '\n     ~    ', plano(t)[:110])
                        if peso(t) > peso(v['t']): v['lst'][v['i']] = l; v['t'] = t      # fica a mais completa, no lugar da primeira
                        continue
                    keep.append(l); vistos.append({'t': t, 'lst': keep, 'i': len(keep) - 1})
                if keep: res += [h] + keep
                else: st['grupos'] += 1
            L[:] = res
        elif tit.startswith('## ⚠️'):
            st['peg'] += sum(1 for l in L if l.startswith('> [!pega]')); L[:] = []; tit = None
    # reconstrói
    out = []
    for tit, L in S:
        if tit.startswith('## ⚠️'): continue
        if tit.startswith('## 📌') and not any(re.match(r'^\s*- ', l) for l in L): continue
        if tit: out.append(tit)
        out += L
    return '\n'.join(re.sub(r'\n{3,}', '\n\n', '\n'.join(out)).split('\n'))
if __name__ == '__main__':
    R = carregar(); antes = depois = 0
    for slug, r in R.items():
        if SO and slug != SO: continue
        for a in r['assuntos']:
            antes += a['md'].count('\n- ') + a['md'].count('\n  - '); a['md'] = processar(a['md']); depois += a['md'].count('\n- ') + a['md'].count('\n  - ')
    print(st, 'linhas de regra/lista:', antes, '->', depois)
    if not SECO:
        cab = open(P, encoding='utf-8').read().split('\n', 1)[0]
        open(P, 'w', encoding='utf-8').write(cab + '\nconst RESUMOS_TCDF = ' + json.dumps(R, ensure_ascii=False, separators=(',', ':')) + ';\n')
