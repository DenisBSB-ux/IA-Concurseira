#!/usr/bin/env python3
"""Converte uma lista BRUTA (".txt"/".md" com '## QUESTÃO n', linha 'Banca/Cargo: ... | Assunto: ...', '### Enunciado', '### Alternativas' e 'Gabarito: X')
para o padrão da plataforma (original.md): campos em negrito, alternativas em lista, 'Gabarito' em negrito e '### Resolução' vazia.
Uso: python3 bruto_para_padrao.py <bruto.txt> <saida.md> [--titulo "Banca - Matéria - AAAA-MM-DD"] [--ini N --fim M]   (ini/fim = intervalo de questões, 1-based, fim inclusivo)
Não altera enunciado, alternativas nem gabarito; só reorganiza a marcação."""
import re, sys, argparse

ap = argparse.ArgumentParser(); ap.add_argument('entrada'); ap.add_argument('saida'); ap.add_argument('--titulo', default='Lista de questões')
ap.add_argument('--ini', type=int, default=1); ap.add_argument('--fim', type=int, default=10 ** 9)
a = ap.parse_args()
txt = open(a.entrada, encoding='utf-8').read()
partes = re.split(r'(?m)^## QUESTÃO (\d+)\s*$', txt)
out = ['# ' + a.titulo, '']; n_out = 0; problemas = []
for k in range(1, len(partes), 2):
    num = int(partes[k]); corpo = partes[k + 1].strip('\n')
    if not (a.ini <= num <= a.fim): continue
    linhas = corpo.split('\n')
    meta = linhas[0]; resto = '\n'.join(linhas[1:])
    campos = {}
    for chave in ('Banca/Cargo', 'Nível', 'Tendência', 'Assunto', 'Cobrança'):
        m = re.search(re.escape(chave) + r':\s*(.*?)(?=\s\|\s(?:Nível|Tendência|Assunto|Cobrança):|$)', meta)
        campos[chave] = m.group(1).strip() if m else ''
    m = re.search(r'(?m)^Gabarito:\s*(\S+)\s*$', resto)
    if not m: problemas.append(f'questão {num}: sem Gabarito'); continue
    gab = m.group(1); resto = (resto[:m.start()] + resto[m.end():]).strip()
    resto = re.sub(r'^### Enunciado\s*', '', resto)
    if '### Alternativas' in resto:
        enun, alts = resto.split('### Alternativas', 1)
        alts_l = []      # linha que começa com "A)" abre uma alternativa; as linhas seguintes (até a próxima letra) continuam o texto dela
        for ln in alts.strip().split('\n'):
            mm = re.match(r'^([A-E])\)\s*(.*)$', ln.strip())
            if mm: alts_l.append([mm.group(1), mm.group(2)])
            elif ln.strip() and alts_l: alts_l[-1][1] += ' ' + ln.strip()
        alts_l = [(L, t.strip()) for L, t in alts_l]
        if not alts_l: problemas.append(f'questão {num}: alternativas não reconhecidas')
        bloco_alt = '\n### Alternativas\n\n' + '\n'.join(f'- **{L})** {re.sub(r"\s*\n\s*", " ", t)}' for L, t in alts_l) + '\n'
        resto = enun.strip() + '\n' + bloco_alt
    out += [f'## QUESTÃO {n_out + 1}', '', f'**Banca/Cargo:** {campos["Banca/Cargo"]}', f'**Assunto:** {campos["Assunto"]}', '', '### Enunciado', '', resto.strip(), '',
            f'**Gabarito:** {gab}', '', '### Resolução', '', '', '---', '']
    n_out += 1
open(a.saida, 'w', encoding='utf-8').write('\n'.join(out))
print(f'{n_out} questões gravadas em {a.saida}' + (f'; PROBLEMAS: {problemas[:10]}' if problemas else ''))
