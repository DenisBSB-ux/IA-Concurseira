#!/usr/bin/env python3
"""gerar_lacunas_faltantes.py <slug> [--extrair arq.md | --gravar] [--tolerante]
Cria as lacunas das questões que ainda não têm (js/treino-<slug>.js). Rodar da raiz do repositório.
  --extrair arq.md  grava as questões SEM lacuna (enunciado, regra v, erro→certo x) para o redator
  (sem flag)        valida lacunas/<slug>.json e mostra as frases; --gravar grava no js/treino-<slug>.js
  --tolerante       item inválido é pulado e relatado (sem ele, o primeiro erro para tudo)
Especificação lacunas/<slug>.json: [{n, m:'A'|'B'|'C', r:[[achar, trocar]] (só A), b:[trechos em branco], d:[distratores]}]
 A = frase do enunciado com as trocas r (item errado já corrigido); C = frase do item certo, como está;
 B = regra curta (campo v) da questão (src 'R', rótulo "regra da questão").
Critérios: cada trecho em branco aparece UMA vez na frase; 1 a 3 lacunas sem sobreposição; distratores diferentes das
respostas e que NÃO aparecem na frase; nada do que já existe muda."""
import json, re, sys, hashlib
slug = sys.argv[1]; arq = 'js/treino-%s.js' % slug
src = open(arq, encoding='utf-8').read()
m = re.match(r'(.*?TREINO_TCDF\["%s"\] = )(\{.*\});?\s*$' % re.escape(slug), src, re.S)
cab, corpo = m.group(1), json.loads(m.group(2))
tem = {x['h'] for x in corpo['lacunas']}; flash = {f['n']: f for f in corpo['flash']}
if '--extrair' in sys.argv:
    out = []
    for f in corpo['flash']:
        if f['h'] in tem: continue
        out.append('### N=%s | gabarito=%s | ref=%s\nENUNCIADO: %s\nREGRA(v): %s\nERRO→CERTO(x): %s\n' % (f['n'], f['g'], f.get('ref', ''), f['f'], f.get('v', ''), f.get('x', '')))
    open(sys.argv[sys.argv.index('--extrair') + 1], 'w', encoding='utf-8').write('\n'.join(out)); print(len(out), 'questões sem lacuna'); sys.exit(0)
spec = json.load(open('.claude/skills/teoria-em-figura/lacunas/%s.json' % slug, encoding='utf-8'))
novas = []; erros = []

def montar(s):
    f = flash[s['n']]
    assert f['h'] not in tem, 'já tem lacuna'
    txt = f['v'] if s['m'] == 'B' else f['f']
    for a, t in s.get('r', []):
        assert txt.count(a) == 1, 'trecho a trocar não achado/único: %s' % a[:40]; txt = txt.replace(a, t)
    assert 1 <= len(s['b']) <= 3, 'precisa de 1 a 3 lacunas'
    pos = []
    for w in s['b']:
        assert txt.count(w) == 1, 'em branco não achado/único: %s' % w; pos.append((txt.index(w), w))
    pos.sort(); ant = 0; p = []
    for i, w in pos:
        assert i >= ant, 'brancos sobrepostos'
        if i > ant: p.append({'t': txt[ant:i]})
        p.append({'l': w}); ant = i + len(w)
    if ant < len(txt): p.append({'t': txt[ant:]})
    assert not set(s['d']) & set(s['b']) and len(set(s['d'])) == len(s['d']) and len(s['d']) >= 1, 'distratores repetidos ou vazios'
    assert not any(w in txt for w in s['d']), 'distrator aparece na frase'
    banco = sorted(s['b'] + s['d'], key=lambda w: hashlib.md5((f['h'] + w).encode()).hexdigest())
    novas.append({'n': f['n'], 'h': f['h'], 'ref': f.get('ref', ''), 'exp': f.get('v', ''), 'p': p, 'src': {'A': 'E' if f['g'].upper().startswith('ERRADO') else 'C', 'C': 'C', 'B': 'R'}[s['m']], 'd': s['d'], 'b': banco, 'bq': f.get('bq', '')})
    print('#%s [%s] %s' % (f['n'], s['m'], ''.join(('[' + x['l'] + ']') if 'l' in x else x['t'] for x in p)[-330:]))

for s in spec:
    try: montar(s)
    except (AssertionError, KeyError) as e:
        if '--tolerante' not in sys.argv: raise
        erros.append('#%s: %s' % (s.get('n'), e))
for e in erros: print('ERRO', e)
print(len(novas), 'novas; total', len(corpo['lacunas']) + len(novas), 'de', len(flash))
if '--gravar' in sys.argv:
    corpo['lacunas'] = sorted(corpo['lacunas'] + novas, key=lambda x: x['n'])
    open(arq, 'w', encoding='utf-8').write(cab + json.dumps(corpo, ensure_ascii=False, separators=(',', ':')) + ';\n'); print('gravado', arq)
