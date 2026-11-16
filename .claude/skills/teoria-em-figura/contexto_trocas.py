#!/usr/bin/env python3
"""contexto_trocas.py: refaz a tabela "O que a banca troca" com CONTEXTO da questão (trecho da frase original, errado em vermelho x correto em amarelo).
Uso (raiz do repositório): python3 .claude/skills/teoria-em-figura/contexto_trocas.py [--seco]"""
import re, json, sys, unicodedata
RAIZ = '.'
def norm(t):
    t = unicodedata.normalize('NFD', str(t).lower()); t = re.sub(r'[̀-ͯ]', '', t); return re.sub(r'[^a-z0-9]+', ' ', t).strip()
def ler_js(p):
    s = open(p, encoding='utf-8').read(); i = s.index('= {'); return s[:i + 2], json.loads(s[i + 2:].rstrip().rstrip(';'))
pre, R = ler_js(RAIZ + '/js/resumos-dados.js')
def limpa(t): return re.sub(r'\s+', ' ', t.replace('|', '/')).strip()
def janela(f, ini, fim, antes=110, depois=0):
    a, b = f[:ini], f[fim:]
    if len(a) > antes:
        a = a[-antes:]; a = '… ' + a[a.find(' ') + 1:] if ' ' in a else '… ' + a
    if len(b) > depois:
        b = b[:depois]; b = b[:b.rfind(' ')] + ' …' if ' ' in b else b + ' …'
    return a, b
n_lin = n_ass = 0
for slug, r in R.items():
    _, T = ler_js('%s/js/treino-%s.js' % (RAIZ, slug)); d = T if 'flash' in T else list(T.values())[0]
    for a in r['assuntos']:
        nn = norm(a['nome']); pares = []; vv = set(); sem_ctx = []
        for c in d['flash']:
            if norm(c.get('tema', '')) != nn and not (nn.startswith('outros temas') and c.get('tema', '') == ''): continue
            m = re.search(r'Erro: “(.+?)” → certo: “(.+?)”', c.get('x', '') or '') or re.match(r'^O trecho “(.+?)” está errado; o correto é “(.+?)”', c.get('v', '') or '')
            if not m: continue
            k = norm(m.group(1))[:50]
            if k in vv or len(m.group(1)) < 14: continue
            vv.add(k); f = c.get('f', '') or ''; i = f.lower().find(m.group(1).lower())
            onde = limpa(re.sub(r'\s*·\s*Lei.*$', '', c.get('ref', '') or ''))[:40]
            if i < 0: sem_ctx.append((limpa(m.group(1)), limpa(m.group(2)), onde)); continue
            ant, dep = janela(limpa(f) if False else f, i, i + len(m.group(1)))
            pre_ = ant.replace('|', '/').lstrip()
            errado = pre_ + '!!' + limpa(m.group(1)) + '!!'
            certo = pre_ + '==' + limpa(m.group(2)) + '=='
            pares.append((errado.strip(), certo.strip(), onde))
            if len(pares) >= 10: break
        if not pares: pares = sem_ctx[:10]
        md = a['md']
        mm = re.search(r'\n## ⚖️ O que a banca troca[^\n]*\n(?:\|[^\n]*\n?)+', md + '\n')
        if not pares:
            continue
        com_onde = any(x[2] for x in pares)
        if com_onde: tab = ['## ⚖️ O que a banca troca (errado × correto)', '| ❌ Como a banca escreve | ✅ Como está certo | Onde |', '|---|---|---|'] + ['| %s | %s | %s |' % x for x in pares]
        else: tab = ['## ⚖️ O que a banca troca (errado × correto)', '| ❌ Como a banca escreve | ✅ Como está certo |', '|---|---|'] + ['| %s | %s |' % x[:2] for x in pares]
        if mm: md = md[:mm.start()] + '\n' + '\n'.join(tab) + '\n' + md[mm.end():].lstrip('\n') if False else md.replace(mm.group(0).rstrip('\n'), '\n' + '\n'.join(tab), 1)
        n_lin += len(pares); n_ass += 1; a['md'] = md
print('assuntos', n_ass, 'linhas', n_lin)
if '--seco' not in sys.argv:
    open(RAIZ + '/js/resumos-dados.js', 'w', encoding='utf-8').write(pre + json.dumps(R, ensure_ascii=False, separators=(',', ':')) + ';\n')
