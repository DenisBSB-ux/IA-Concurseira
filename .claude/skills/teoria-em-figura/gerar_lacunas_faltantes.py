#!/usr/bin/env python3
"""gerar_lacunas_faltantes.py <slug> [--gravar]: cria as lacunas das questões que ainda não têm (js/treino-<slug>.js).
Especificação em lacunas/<slug>.json: [{n, m:'A'|'B'|'C', r:[[achar, trocar]] (só A), b:[trechos em branco], d:[distratores]}].
 A = frase da questão (item errado já corrigido pelas trocas r); C = frase do item certo, como está; B = regra curta (campo v) da questão (src 'R').
Critérios: cada trecho em branco aparece UMA vez na frase; 1 a 3 lacunas; distratores diferentes das respostas; nada do que já existe muda.
Sem --gravar só valida e mostra as frases."""
import json, re, subprocess, sys, hashlib
slug = sys.argv[1]; arq = 'js/treino-%s.js' % slug
src = open(arq, encoding='utf-8').read()
m = re.match(r'(.*?TREINO_TCDF\["%s"\] = )(\{.*\});?\s*$' % re.escape(slug), src, re.S)
cab, corpo = m.group(1), json.loads(m.group(2))
spec = json.load(open('.claude/skills/teoria-em-figura/lacunas/%s.json' % slug, encoding='utf-8'))
tem = {x['h'] for x in corpo['lacunas']}; flash = {f['n']: f for f in corpo['flash']}
novas = []
for s in spec:
    f = flash[s['n']]
    assert f['h'] not in tem, 'já tem lacuna: %s' % s['n']
    txt = f['v'] if s['m'] == 'B' else f['f']
    for a, t in s.get('r', []):
        assert txt.count(a) == 1, 'trecho não achado/único (%s): %s' % (s['n'], a[:40]); txt = txt.replace(a, t)
    assert 1 <= len(s['b']) <= 3, s['n']
    pos = []
    for w in s['b']:
        assert txt.count(w) == 1, 'em branco não achado/único (%s): %s' % (s['n'], w); pos.append((txt.index(w), w))
    pos.sort(); ant = 0; p = []
    for i, w in pos:
        assert i >= ant, 'brancos sobrepostos (%s)' % s['n']
        if i > ant: p.append({'t': txt[ant:i]})
        p.append({'l': w}); ant = i + len(w)
    if ant < len(txt): p.append({'t': txt[ant:]})
    assert not set(s['d']) & set(s['b']) and len(set(s['d'])) == len(s['d']), s['n']
    assert not any(w in txt for w in s['d']), 'distrator aparece na frase (%s)' % s['n']
    banco = sorted(s['b'] + s['d'], key=lambda w: hashlib.md5((f['h'] + w).encode()).hexdigest())
    novas.append({'n': f['n'], 'h': f['h'], 'ref': f.get('ref', ''), 'exp': f.get('v', ''), 'p': p, 'src': {'A': 'E' if f['g'].upper().startswith('ERRADO') else 'C', 'C': 'C', 'B': 'R'}[s['m']], 'd': s['d'], 'b': banco, 'bq': f.get('bq', '')})
    print('#%s [%s] %s' % (f['n'], s['m'], ''.join(('[' + x['l'] + ']') if 'l' in x else x['t'] for x in p)[-330:]))
print(len(novas), 'novas; total', len(corpo['lacunas']) + len(novas), 'de', len(flash))
if '--gravar' in sys.argv:
    corpo['lacunas'] = sorted(corpo['lacunas'] + novas, key=lambda x: x['n'])
    open(arq, 'w', encoding='utf-8').write(cab + json.dumps(corpo, ensure_ascii=False, separators=(',', ':')) + ';\n'); print('gravado', arq)
