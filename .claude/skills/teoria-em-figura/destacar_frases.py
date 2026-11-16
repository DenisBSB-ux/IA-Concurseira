#!/usr/bin/env python3
"""Aplica destaques amarelos (==trecho==) escolhidos por revisores (leitura -> interpretação -> destaque)
às regras dos resumos. Entrada: <dir>/<slug>.in.json ({id,assunto,t}) e <slug>.out*.json ({id: trecho exato}).
Valida: trecho exato na frase, 2-10 palavras, não é a frase toda, sem sobrepor marcas. Idempotente (só frases sem '==').
Uso: python3 destacar_frases.py <dir>"""
import re, json, os, sys, glob, subprocess
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
P = RAIZ + '/js/resumos-dados.js'; D = sys.argv[1]
js = subprocess.run(['node', '-e', "eval(require('fs').readFileSync('%s','utf8')+';global.R=RESUMOS_TCDF');console.log(JSON.stringify(R))" % P], capture_output=True, text=True).stdout
R = json.loads(js); stat = {'ok': 0, 'vazio': 0, 'nao_acha': 0, 'tam': 0}
def plano(t): return re.sub(r'!!|##', '', t)
def aplicar(t, trecho):
    """marca o trecho (texto sem !!/##) dentro de t, que pode ter !!/##; ignora se cortaria uma marca."""
    pl = plano(t); i = pl.find(trecho)
    if i < 0: return None
    # mapeia posições do plano para t
    mp = []; j = 0
    while j < len(t):
        if t[j:j+2] in ('!!', '##'): j += 2; continue
        mp.append(j); j += 1
    a = mp[i]; b = mp[i + len(trecho) - 1] + 1
    # inclui marcadores de borda se o trecho começa/termina dentro de uma marca: então recusa se há marcador no meio
    meio = t[a:b]
    if meio.count('!!') % 2 or meio.count('##') % 2: return None
    return t[:a] + '==' + meio + '==' + t[b:]
for slug, v in R.items():
    fin = D + '/%s.in.json' % slug
    if not os.path.exists(fin): continue
    ins = {x['id']: x for x in json.load(open(fin))}
    out = {}
    for f in glob.glob(D + '/%s.out*.json' % slug):
        out.update({int(k): s for k, s in json.load(open(f)).items()})
    mapa = {}
    for i, x in ins.items():
        tr = (out.get(i) or '').strip().rstrip('.;,:')
        if not tr: stat['vazio'] += 1; continue
        n = len(tr.split())
        if n < 2 or n > 10 or len(tr) >= len(x['t']) - 3: stat['tam'] += 1; continue
        if tr not in x['t']: stat['nao_acha'] += 1; continue
        mapa[x['t']] = tr
    def proc(md):
        o = []; sec = ''
        for l in md.split('\n'):
            if l.startswith('## '): sec = l
            m = re.match(r'(- |> \[!resumo\] \*\*[^*]+\*\* — )(.*)$', l)
            if m and ('Regras' in sec or 'Em 30' in sec):
                txt = m.group(2); base = plano(txt)
                if '==' not in txt and base in mapa:
                    n = aplicar(txt, mapa[base])
                    if n: l = m.group(1) + n; stat['ok'] += 1
            o.append(l)
        return '\n'.join(o)
    v['md'] = proc(v['md'])
    for a in v['assuntos']: a['md'] = proc(a['md'])
cab = open(P, encoding='utf-8').read().split('\n', 1)[0]
open(P, 'w', encoding='utf-8').write(cab + '\nconst RESUMOS_TCDF = ' + json.dumps(R, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(stat)
