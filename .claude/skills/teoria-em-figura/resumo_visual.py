#!/usr/bin/env python3
"""resumo_visual.py: reescreve js/resumos-dados.js em formato visual para revisão rápida (13/11/2026).
Entrada: o próprio resumos-dados.js (assuntos com regras por dispositivo, pegadinhas e macetes) + js/treino-<slug>.js (flashcards e lacunas).
Saída (mesma estrutura, md enriquecido):
  - "Em 30 segundos": a regra-chave dos dispositivos mais cobrados
  - tabelas comparativas: "Números e prazos" e "O que a banca troca" (Trecho errado x correto, dos flashcards)
  - regras por dispositivo: regra-chave + variações (nível 2, escondido no modo Rápido)
  - callouts: pegadinhas (!pega), macetes (!dica)
  - marcas: ==termo-chave== (amarelo; termos das lacunas da própria questão), ##número/prazo## (azul), !!negação/limite!! (vermelho)
Uso (raiz do repositório): python3 .claude/skills/teoria-em-figura/resumo_visual.py [--so slug]"""
import re, json, sys, unicodedata, collections
RAIZ = '.'
def norm(t):
    t = unicodedata.normalize('NFD', str(t).lower()); t = re.sub(r'[̀-ͯ]', '', t); return re.sub(r'[^a-z0-9]+', ' ', t).strip()
def ler_js(p, var):
    s = open(p, encoding='utf-8').read(); i = s.index('= {') if var is None else s.index('= {')
    return s[:i + 2], json.loads(s[i + 2:].rstrip().rstrip(';'))
pre, R = ler_js(RAIZ + '/js/resumos-dados.js', None)
so = sys.argv[sys.argv.index('--so') + 1] if '--so' in sys.argv else None

# ---------- marcas ----------
NUM = re.compile(r'(?i)\b(?:\d+(?:[.,]\d+)?\s?(?:%|por cento|dias?(?: úteis)?|meses|mês|anos?|horas?|vezes|salários[- ]mínimos|UFIR|km|metros?|graus?|minutos?|segundos?|semanas?)|(?:um|uma|dois|duas|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|quinze|vinte|trinta|quarenta|sessenta|noventa|cento e vinte|cento e oitenta|cem|mil)\s+(?:dias?(?: úteis)?|meses|mês|anos?|horas?|vezes|salários[- ]mínimos|minutos?|segundos?|semanas?)|(?:maioria (?:absoluta|simples|qualificada)|dois terços|três quintos|um terço|um quinto|metade|unanimidade|quórum[^.;,]{0,25}))\b')
NEG = re.compile(r'(?i)\b(não|nunca|jamais|vedad[oa]s?|proibid[oa]s?|exceto|salvo|somente|apenas|exclusivamente)\b')
def marcar(t, termos):
    """aplica ==termo==, ##número## e !!negação!! sem sobrepor (ordem: termos-chave, números, negações)."""
    marc = []  # (ini, fim, tipo)
    def livre(a, b): return all(b <= x or a >= y for x, y, _ in marc)
    for termo in sorted(termos, key=len, reverse=True):
        if len(termo) < 4: continue
        m = re.search(re.escape(termo), t, re.I)
        if m and livre(m.start(), m.end()): marc.append((m.start(), m.end(), 'k'))
        if sum(1 for x in marc if x[2] == 'k') >= 4: break
    for m in NUM.finditer(t):
        if livre(m.start(), m.end()) and sum(1 for x in marc if x[2] == 'n') < 3: marc.append((m.start(), m.end(), 'n'))
    for m in NEG.finditer(t):
        if livre(m.start(), m.end()) and sum(1 for x in marc if x[2] == 'g') < 2: marc.append((m.start(), m.end(), 'g'))
    sim = {'k': '==', 'n': '##', 'g': '!!'}; out = ''; pos = 0
    for a, b, k in sorted(marc):
        out += t[pos:a] + sim[k] + t[a:b] + sim[k]; pos = b
    return out + t[pos:]
def toks(t): return set(w for w in norm(t).split() if len(w) > 3)
def jacc(a, b): return len(a & b) / max(1, len(a | b))
def curto(t, n=120):
    t = re.sub(r'\s+', ' ', t).strip()
    return t if len(t) <= n else t[:n].rsplit(' ', 1)[0] + '…'
def cel(t, n=130): return curto(t.replace('|', '/'), n)

# ---------- parse de um assunto ----------
def parse(md):
    meta = ''; arts = []; peg = []; mac = []; sec = None; atual = None
    for l in md.split('\n'):
        if l.startswith('> ') and not meta: meta = l[2:].strip(); continue
        if l.startswith('## '): sec = l[3:].strip(); atual = None; continue
        if l.startswith('### ') and sec == 'Regras que caem':
            h = l[4:].strip(); m = re.match(r'^(.*?)\s*·\s*(\d+) provas?\s*·\s*(\d+) quest(?:ão|ões)$', h)
            atual = {'t': (m.group(1) if m else h), 'p': int(m.group(2)) if m else 0, 'q': int(m.group(3)) if m else 0, 'b': []}; arts.append(atual); continue
        if l.startswith('- '):
            if sec == 'Regras que caem' and atual is not None: atual['b'].append(l[2:].strip())
            elif sec == 'Pegadinhas da banca': peg.append(l[2:].strip())
            elif sec == 'Macetes': mac.append(l[2:].strip())
    return meta, arts, peg, mac

def termos_de(slug_lac, ref):
    out = []
    for lac in slug_lac.get(norm(ref), []):
        out += [p['l'] for p in lac['p'] if 'l' in p]
    return out

def barra(p, n=10, mx=100):
    k = max(1, round(p / max(1, mx) * n)) if p else 0
    return '▰' * k + '▱' * (n - k)

def construir(slug, nome, a, flash, lacunas, pct, mx=100):
    meta, arts, peg, mac = parse(a['md'])
    L = collections.defaultdict(list)
    for lac in lacunas: L[norm(re.sub(r'\s*·.*$', '', lac.get('ref', '')) + ' ' + (lac.get('ref', '').split('·')[-1] if '·' in lac.get('ref', '') else ''))].append(lac)
    out = ['# ' + a['nome']]
    out.append('> **%s%% das provas** %s · %s' % (pct, barra(pct, 10, mx), re.sub(r'^Cai em [^·]*·\s*', '', meta)) if pct is not None else '> ' + meta)
    # artigos: regra-chave + variações, com marcas
    cards = []; nums = []
    for art in arts:
        refn = norm(art['t'])
        termos = []
        for k, v in L.items():
            if k and (k == refn or refn.startswith(k) or k.startswith(refn)): termos += [p['l'] for lac in v for p in lac['p'] if 'l' in p]
        grupos = []
        for b in art['b']:
            tb = toks(b); alvo = next((g for g in grupos if jacc(tb, g['t']) >= 0.5), None)
            if alvo: alvo['v'].append(b)
            else: grupos.append({'b': b, 't': tb, 'v': []})
        ls = []
        for g in grupos:
            ls.append('- ' + marcar(g['b'], termos))
            for v in g['v'][:2]: ls.append('  - ' + marcar(v, termos))
            for m in NUM.finditer(g['b']):
                nums.append((m.group(0), g['b'], art['t'], art['p']))
        cards.append((art, ls))
    # 1. Em 30 segundos
    topo = [c for c in cards if c[1]][:5]
    if topo:
        out += ['', '## ⚡ Em 30 segundos']
        for art, ls in topo: out.append('> [!resumo] **' + re.sub(r'\s*·\s*Lei[^·]*$', '', art['t']) + '** — ' + re.sub(r'^- ', '', ls[0]))
    # 2. Tabelas
    grupos_n = collections.OrderedDict()
    for val, regra, onde, provas in sorted(nums, key=lambda x: -x[3]):
        k = norm(regra)[:60]; g = grupos_n.setdefault(k, {'regra': regra, 'onde': onde, 'vals': []})
        if val.strip().lower() not in [v.lower() for v in g['vals']]: g['vals'].append(val.strip())
    linhas = ['| %s | %s | %s |' % (' · '.join('##%s##' % v for v in g['vals'][:3]), cel(re.sub(r'\s+', ' ', g['regra'])), cel(re.sub(r'\s*·\s*Lei.*$', '', g['onde']), 40)) for g in list(grupos_n.values())[:10]]
    if linhas: out += ['', '## 🔢 Números e prazos para decorar', '| Valor | Regra | Onde |', '|---|---|---|'] + linhas
    pares = []; vv = set()
    nn = norm(a['nome'])
    for c in flash:
        if norm(c.get('tema', '')) != nn and not (nn.startswith('outros temas') and c.get('tema', '') == ''): continue
        m = re.search(r'Erro: “(.+?)” → certo: “(.+?)”', c.get('x', '') or '') or re.match(r'^O trecho “(.+?)” está errado; o correto é “(.+?)”', c.get('v', '') or '')
        if not m: continue
        k = norm(m.group(1))[:50]
        if k in vv or len(m.group(1)) < 14: continue
        vv.add(k); pares.append((cel(m.group(1)), cel(m.group(2)), cel(re.sub(r'\s*·\s*Lei.*$', '', c.get('ref', '') or ''), 40)))
        if len(pares) >= 10: break
    if pares:
        com_onde = any(x[2] for x in pares)
        if com_onde: out += ['', '## ⚖️ O que a banca troca (errado × correto)', '| ❌ A banca diz | ✅ O correto | Onde |', '|---|---|---|'] + ['| %s | %s | %s |' % x for x in pares]
        else: out += ['', '## ⚖️ O que a banca troca (errado × correto)', '| ❌ A banca diz | ✅ O correto |', '|---|---|'] + ['| %s | %s |' % x[:2] for x in pares]
    # 3. regras por dispositivo
    out += ['', '## 📌 Regras por lei']
    for art, ls in cards:
        if not ls: continue
        out.append('### %s · %d prova%s' % (art['t'], art['p'], '' if art['p'] == 1 else 's'))
        out += ls
    # 4. pegadinhas e macetes
    if peg: out += ['', '## ⚠️ Pegadinhas da banca'] + ['> [!pega] ' + marcar(p, []) for p in peg]
    if mac: out += ['', '## 💡 Macetes'] + ['> [!dica] ' + marcar(m, []) for m in mac]
    return '\n'.join(out)

tot = 0
for slug, r in R.items():
    if so and slug != so: continue
    _, T = ler_js('%s/js/treino-%s.js' % (RAIZ, slug), None)
    d = list(T.values())[0] if 'flash' not in T else T
    flash, lac = d['flash'], d['lacunas']
    mx = max([int((re.search(r'Cai em (\d+)%', x['md']) or [0, 0])[1]) for x in r['assuntos']] + [1])
    for a in r['assuntos']:
        m = re.search(r'Cai em (\d+)%', a['md']); pct = int(m.group(1)) if m else a.get('pct')
        a['md'] = construir(slug, r['nome'], a, flash, lac, pct, mx); tot += 1
    # visão geral: barras na tabela de relevância
    def barras(l):
        m = re.match(r'^\|\s*(.+?)\s*\|\s*(\d+)%\s*\|\s*(\d+)\s*\|$', l)
        return '| %s | %s%% %s | %s |' % (m.group(1), m.group(2), barra(int(m.group(2)), 10, mx), m.group(3)) if m else l
    g = r['geral'].split('\n')
    g = [barras(l) for l in g]; g = [l.replace('| % das provas |', '| Peso nas provas |') for l in g]
    r['geral'] = '\n'.join(g)
open(RAIZ + '/js/resumos-dados.js', 'w', encoding='utf-8').write(pre + json.dumps(R, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('assuntos reescritos:', tot)
