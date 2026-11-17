#!/usr/bin/env python3
"""aplicar_objetivo.py <slug> <saida_do_revisor.json> [--forcar]: troca o md dos assuntos pelo texto objetivo, validando
(marcas em pares; linha 1 e 2 iguais; cada linha nova tem >=70% das palavras no md antigo; não cresce; imagens preservadas)."""
import json, re, sys, unicodedata
sys.path.insert(0, '.claude/skills/teoria-em-figura')
from revisar_resumo import carregar, gravar
def pal(t):
    t = unicodedata.normalize('NFD', t.lower()); t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return set(w for w in re.findall(r'[a-z0-9]{4,}', re.sub(r'[=!#*]{2}', ' ', t)))
def main():
    slug, arq = sys.argv[1], sys.argv[2]; R = carregar(); r = R[slug]; d = json.load(open(arq, encoding='utf-8')); ok = 0
    for e in d['assuntos']:
        a = r['assuntos'][e['a'] - 1]; old = a['md']; new = e['md'].strip('\n'); erros = []
        if new.split('\n')[:2] != old.split('\n')[:2]: erros.append('linhas 1-2 mudaram')
        if len(new) > len(old): erros.append('cresceu')
        P = pal(old)
        for l in new.split('\n'):
            if l.startswith('#') or l.startswith('|---') or l.startswith('> **') or not l.strip(): continue
            if any(l.count(m) % 2 for m in ('==', '!!')): erros.append('marca ímpar: ' + l[:60])
            w = pal(l)
            if w and len(w & P) / len(w) < 0.7: erros.append('texto novo: ' + l[:70])
        for im in re.findall(r'!\[[^\]]*\]\([^)]*\)', old):
            if im not in new: erros.append('imagem perdida')
        if erros and '--forcar' not in sys.argv: print('REJEITADO assunto', e['a'], erros[:4]); continue
        print('assunto', e['a'], len(old), '->', len(new)); a['md'] = new; ok += 1
    gravar(R); print('aplicados', ok, 'de', len(d['assuntos'])); [print('ALERTA', x) for x in d.get('alertas', [])]
main()
