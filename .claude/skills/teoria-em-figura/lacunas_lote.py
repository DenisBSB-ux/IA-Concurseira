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
    ns = [s['n'] for s in S]; assert len(ns) == len(set(ns)), 'n repetido'
    json.dump(S, open('.claude/skills/teoria-em-figura/lacunas/%s.json' % slug, 'w', encoding='utf-8'), ensure_ascii=False, indent=0); print(len(S), 'itens em lacunas/%s.json' % slug)
elif cmd == 'conferir':
    tam = int(sys.argv[4]) if len(sys.argv) > 4 else 60
    subprocess.run(G.split() + [slug, '--tolerante', '--conferir', pasta + '/conf-%s.md' % slug], check=True, capture_output=True)
    B = blocos(open(pasta + '/conf-%s.md' % slug, encoding='utf-8').read())
    for k in range(0, len(B), tam):
        open(pasta + '/conf-%s-%d.md' % (slug, k // tam + 1), 'w', encoding='utf-8').write('\n'.join(B[k:k + tam]))
    print(slug, len(B), 'itens em', (len(B) + tam - 1) // tam, 'blocos de conferência')
