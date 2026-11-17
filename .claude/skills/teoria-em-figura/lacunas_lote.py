#!/usr/bin/env python3
"""lacunas_lote.py preparar <slug> <pasta> [tam=50] | juntar <slug> <pasta> | conferir <slug> <pasta> [tam=60]
 preparar: extrai as questões sem lacuna e divide em blocos <pasta>/falt-<slug>-<k>.md (para os redatores)
 juntar:   junta <pasta>/spec-<slug>-<k>.json em lacunas/<slug>.json (e valida: uma entrada por questão faltante)
 conferir: gera <pasta>/conf-<slug>-<k>.md (frases geradas, para os conferentes)
Rodar da raiz do repositório."""
import json, re, subprocess, sys, glob, os
cmd, slug, pasta = sys.argv[1:4]; os.makedirs(pasta, exist_ok=True)
G = 'python3 .claude/skills/teoria-em-figura/gerar_lacunas_faltantes.py'
def blocos(txt): return [b for b in re.split(r'(?m)^(?=### N=)', txt) if b.strip()]
if cmd == 'preparar':
    tam = int(sys.argv[4]) if len(sys.argv) > 4 else 50
    subprocess.run(G.split() + [slug, '--extrair', pasta + '/falt-%s.md' % slug], check=True)
    B = blocos(open(pasta + '/falt-%s.md' % slug, encoding='utf-8').read())
    for k in range(0, len(B), tam):
        open(pasta + '/falt-%s-%d.md' % (slug, k // tam + 1), 'w', encoding='utf-8').write('\n'.join(B[k:k + tam]))
    print(slug, len(B), 'questões em', (len(B) + tam - 1) // tam, 'blocos')
elif cmd == 'juntar':
    S = []
    for f in sorted(glob.glob(pasta + '/spec-%s-*.json' % slug)): S += json.load(open(f, encoding='utf-8'))
    S = list({s['n']: s for s in S}.values())   # o arquivo mais recente (2ª rodada, '-r') vence
    json.dump(S, open('.claude/skills/teoria-em-figura/lacunas/%s.json' % slug, 'w', encoding='utf-8'), ensure_ascii=False, indent=0); print(len(S), 'itens em lacunas/%s.json' % slug)
elif cmd == 'refazer':   # 2ª rodada: questões reprovadas + motivo do conferente -> falt-<slug>-r.md
    rej = {r['n']: r for r in json.load(open(pasta + '/rej-%s.json' % slug, encoding='utf-8'))}
    B = blocos(open(pasta + '/falt-%s.md' % slug, encoding='utf-8').read()); out = []
    for b in B:
        n = int(re.match(r'### N=(\d+)', b).group(1))
        if n in rej: out.append(b.rstrip() + '\nMOTIVO DA REPROVAÇÃO: %s\nSUGESTÃO DO CONFERENTE: %s\n' % (rej[n]['motivo'], rej[n].get('sugestao', '')))
    open(pasta + '/falt-%s-r.md' % slug, 'w', encoding='utf-8').write('\n'.join(out)); print(len(out), 'questões para a 2ª rodada')
elif cmd == 'conferir':
    tam = int(sys.argv[4]) if len(sys.argv) > 4 else 60
    subprocess.run(G.split() + [slug, '--tolerante', '--conferir', pasta + '/conf-%s.md' % slug], check=True, capture_output=True)
    B = blocos(open(pasta + '/conf-%s.md' % slug, encoding='utf-8').read())
    for k in range(0, len(B), tam):
        open(pasta + '/conf-%s-%d.md' % (slug, k // tam + 1), 'w', encoding='utf-8').write('\n'.join(B[k:k + tam]))
    print(slug, len(B), 'itens em', (len(B) + tam - 1) // tam, 'blocos de conferência')
if cmd == 'aplicar':   # junta ver-<slug>-*.json (conferentes), grava só os aprovados e guarda os reprovados em rej-<slug>.json (2ª rodada)
    ok, rej = set(), []
    for f in sorted(glob.glob(pasta + '/ver-%s-*.json' % slug)):
        d = json.load(open(f, encoding='utf-8')); ok |= set(d['aprovados']); rej += d['reprovados']
    rej = [r for r in rej if r['n'] not in ok]   # reprovado na 1ª rodada e aprovado depois não conta
    json.dump({'aprovados': sorted(ok)}, open(pasta + '/ap-%s.json' % slug, 'w')); json.dump(rej, open(pasta + '/rej-%s.json' % slug, 'w'), ensure_ascii=False, indent=0)
    r = subprocess.run(G.split() + [slug, '--tolerante', '--aprovados', pasta + '/ap-%s.json' % slug, '--gravar'], capture_output=True, text=True); print('\n'.join(l for l in r.stdout.splitlines() if l.startswith(('ERRO', 'reprov', 'gravado')) or 'novas' in l)); print(r.stderr[-300:])
    print(len(ok), 'aprovados;', len(rej), 'reprovados em', pasta + '/rej-%s.json' % slug)
