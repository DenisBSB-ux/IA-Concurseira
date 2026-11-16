#!/usr/bin/env python3
"""Otimiza os resumos: junta cabeçalhos do mesmo dispositivo ('Art. 1º ▸ I' = 'Art. 1 ▸ I') e, dentro deles,
mantém só UMA frase por conceito (a mais completa) quando duas dizem quase o mesmo (proximidade de significado).
Também deduplica Pegadinhas/Macetes e remove frases truncadas. Uso: python3 otimizar_resumo.py [--seco]"""
import re, json, os, sys, subprocess, unicodedata
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')); P = RAIZ + '/js/resumos-dados.js'
SECO = '--seco' in sys.argv
STOP = set('para como pela pelo pelas pelos mais pode podem sobre entre quando mesmo desde ainda assim deve devem sendo cada todo toda todos todas essa esse esta este isso seus suas seu sua uma umas uns dos das nos nas aos'.split())
NEGS = {'nao', 'sem', 'exceto', 'salvo', 'vedad', 'proib', 'nunca', 'jamai'}
def norm(t):
    t = unicodedata.normalize('NFD', t.lower()); t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9 ]', ' ', t)
def plano(t): return re.sub(r'==|!!|##|\*\*', '', t)
def toks(t):
    s = set(); neg = set()
    for w in norm(plano(t)).split():
        w = re.sub(r'(am|em|m|s)$', '', w) if len(w) > 5 else w
        k = w[:5]
        if k in NEGS or w in NEGS: neg.add(k if k in NEGS else w); s.add(k); continue
        if len(w) > 3 and w not in STOP: s.add(k)
    return s, neg
def peso(t): return (len(plano(t)), t.count('=='))
def prox(a, b):
    (ta, na), (tb, nb) = toks(a), toks(b)
    if not ta or not tb or na != nb: return False
    i = len(ta & tb); return i / min(len(ta), len(tb)) >= 0.7 and i / len(ta | tb) >= 0.4
TRUNC = re.compile(r'(?i)\b(que|de|da|do|e|com|para|ou|a|o|em)\.?$')
def melhores(linhas):
    """linhas: textos; devolve (mantidas na ordem, mapa removido->mantido)."""
    vivos = [l for l in linhas if not (TRUNC.search(plano(l).strip()) and len(linhas) > 1)] or linhas
    manter = []; mapa = {}
    for l in linhas:
        if l not in vivos: mapa[l] = None
    for l in vivos:
        for j, m in enumerate(manter):
            if prox(l, m):
                if peso(l) > peso(m): mapa[m] = l; manter[j] = l
                else: mapa[l] = m
                break
        else: manter.append(l)
    return manter, mapa
def chave(h):
    m = re.match(r'### (.*?) · (\d+) provas?(.*)$', h)
    if not m: return None
    r = norm(m.group(1).replace('º', '').replace('°', '')); return re.sub(r'\s+', ' ', r).strip(), m.group(1), int(m.group(2)), m.group(3)
st = {'cab': 0, 'lin': 0, 'peg': 0, 'mac': 0, 'trunc': 0}
def proc(md):
    L = md.split('\n'); out = []; i = 0; sec = ''; remap = {}
    while i < len(L):
        l = L[i]
        if l.startswith('## '): sec = l; out.append(l); i += 1; continue
        if 'Regras' in sec and l.startswith('### '):
            blocos = []; 
            while i < len(L) and L[i].startswith('### '):
                h = L[i]; i += 1; b = []
                while i < len(L) and not L[i].startswith('#') and L[i].strip() != '': b.append(L[i]); i += 1
                blocos.append((h, b))
            # agrupa por LEI/norma (cabeçalho "Art. X · Norma · N provas" -> "### Norma"); conceitos sem norma ficam como estão
            leis = {}; conc = []
            for h, b in blocos:
                mm = re.match(r'### (.*?)(?: · (\d+) provas?)?(\s*)$', h)
                partes = mm.group(1).split(' · ') if mm else [h[4:]]
                if mm and mm.group(2) is None and len(partes) == 1:      # já é cabeçalho de lei (reexecução)
                    k = norm(partes[0]).strip(); d = leis.setdefault(k, [partes[0], 0, []]); d[2] += b; d[1] += 0; continue
                if len(partes) >= 2:
                    k = norm(partes[-1]).strip(); d = leis.setdefault(k, [partes[-1], 0, []])
                    d[1] += int(mm.group(2) or 0); d[2] += b; st['cab'] += 1
                else: conc.append((h, b))
            for k, (nome, pv, b) in sorted(leis.items(), key=lambda kv: -kv[1][1]):
                pref = {}; txt = []
                for x in b:
                    t_ = x.strip()[2:].strip(); txt.append(t_); pref.setdefault(t_, x[:len(x) - len(x.lstrip())] + '- ')
                keep, mapa = melhores(txt); st['lin'] += len(txt) - len(keep)
                for a_, z in mapa.items(): remap[a_] = z
                novos = []
                for t_ in keep:
                    orig = [a_ for a_ in txt if a_ == t_ or mapa.get(a_) == t_]
                    novos.append(min((pref[a_] for a_ in orig), key=len) if orig else '- ')
                out.append('### ' + nome); out += [pf + t_ for pf, t_ in zip(novos, keep)]
            for h, b in conc: out.append(h); out += b
            continue
        if l.startswith('> [!pega]') or l.startswith('> [!dica]'):
            j = i; bl = []
            while j < len(L) and L[j].startswith(l[:9]): bl.append(L[j][L[j].index(']') + 2:]); j += 1
            keep, _ = melhores(bl); st['peg' if 'pega' in l else 'mac'] += len(bl) - len(keep)
            out += [l[:l.index(']') + 2] + t for t in keep]; i = j; continue
        out.append(l); i += 1
    # callouts do 'Em 30 segundos' que apontavam para frase removida
    res = []
    for l in out:
        m = re.match(r'(> \[!resumo\] \*\*[^*]+\*\* — )(.*)$', l)
        if m and m.group(2) in remap and remap[m.group(2)]: l = m.group(1) + remap[m.group(2)]
        res.append(l)
    return '\n'.join(res)
js = subprocess.run(['node', '-e', "eval(require('fs').readFileSync('%s','utf8')+';global.R=RESUMOS_TCDF');console.log(JSON.stringify(R))" % P], capture_output=True, text=True).stdout
R = json.loads(js); antes = sum(len(a['md']) for v in R.values() for a in v['assuntos'])
for v in R.values():
    for a in v['assuntos']: a['md'] = proc(a['md'])
depois = sum(len(a['md']) for v in R.values() for a in v['assuntos'])
print(st, antes, '->', depois)
if not SECO:
    cab = open(P, encoding='utf-8').read().split('\n', 1)[0]
    open(P, 'w', encoding='utf-8').write(cab + '\nconst RESUMOS_TCDF = ' + json.dumps(R, ensure_ascii=False, separators=(',', ':')) + ';\n')
