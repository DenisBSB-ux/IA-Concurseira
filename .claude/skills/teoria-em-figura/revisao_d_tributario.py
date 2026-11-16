#!/usr/bin/env python3
"""Revisão do resumo de Direito Tributário (16/11/2026): correções pontuais, conferidas com os flashcards, o texto da CF/CTN do projeto e as questões.
Uso (raiz do repositório, depois de contexto_trocas.py --so d-tributario): python3 .claude/skills/teoria-em-figura/revisao_d_tributario.py"""
import json, subprocess, sys
P = 'js/resumos-dados.js'
js = subprocess.run(['node', '-e', "eval(require('fs').readFileSync('%s','utf8')+';global.R=RESUMOS_TCDF');console.log(JSON.stringify(R))" % P], capture_output=True, text=True).stdout
R = json.loads(js); r = R['d-tributario']; A = r['assuntos']
falhas = []
def linha(i, chave, novo, tipo='- '):
    """troca a regra (linha '- ') do assunto i (1-based) que contém 'chave' — e o mesmo texto no bloco Em 30 segundos; novo=None remove."""
    L = A[i - 1]['md'].split('\n'); ach = [k for k, l in enumerate(L) if chave in l and (l.startswith('- ') or chave.startswith('>'))]
    if len(ach) != 1: falhas.append((i, chave, len(ach))); return
    k = ach[0]; velho = L[k][2:] if L[k].startswith('- ') else None
    if novo is None: del L[k]
    else: L[k] = novo
    if velho:
        for j, l in enumerate(L):
            if l.startswith('> [!resumo]') and (' — ' + velho) in l:
                if novo: L[j] = l.replace(' — ' + velho, ' — ' + novo[2:])
    A[i - 1]['md'] = '\n'.join(L)
def tudo(i, velho, novo):
    if velho not in A[i - 1]['md']: falhas.append((i, velho, 0)); return
    A[i - 1]['md'] = A[i - 1]['md'].replace(velho, novo)
# ---- 1. Limitações constitucionais do poder de tributar
linha(1, 'A ==exclusão constitucional de parte da competência é imunidade==', '- A ==exclusão constitucional== de parte da competência é ==imunidade==; a ==dispensa legal== do pagamento é ==isenção==.')
linha(1, 'Radiodifusão de recepção livre e gratuita', '- A ==radiodifusão sonora e de sons e imagens de recepção livre e gratuita== é imune ao ==ICMS== (art. 155, § 2º, X, "d"): o Estado !!não!! pode cobrá-lo.')
linha(1, '- Tributo só se institui ou aumenta ==por lei==.', None)
linha(1, 'Segundo o STF, a imunidade do § 7º', '- Segundo o STF, a imunidade do ==art. 195, § 7º== (entidades beneficentes de assistência social) !!não!! alcança fundações públicas, que !!não!! são entidades beneficentes privadas.')
linha(1, '> [!dica] Imune de imposto; taxa paga.', None)
linha(1, '> [!dica] Imune paga zero, mas presta contas.', None)
# ---- 2. Tributo: conceito, natureza jurídica e espécies
L2 = A[1]['md'].split('\n')
iw = [k for k, l in enumerate(L2) if l.startswith('## ⚡')][0]
fim = iw + 1
while fim < len(L2) and L2[fim].startswith('> [!resumo]'): fim += 1
manter = [l for l in L2[iw + 1:fim] if 'LC 87/1996' in l or 'Art. 155' in l]
novos = ['> [!resumo] **Art. 3º · CTN** — O conceito de ==tributo== exclui a prestação que seja ==sanção de ato ilícito==; ==multa== !!não!! é tributo.',
         '> [!resumo] **Art. 4º · CTN** — A natureza do tributo é definida pelo ==fato gerador==; a ==denominação== e a ==destinação legal== da arrecadação são irrelevantes.',
         '> [!resumo] **Art. 5º · CTN** — O CTN ==adotou a teoria tripartite== (impostos, taxas e contribuição de melhoria); a pentapartite vem da Constituição e do STF.']
A[1]['md'] = '\n'.join(L2[:iw + 1] + novos + manter + L2[fim:])
linha(2, 'A natureza do tributo é definida pelo fato gerador, sendo irrelevante a ==destinação legal==', None)
linha(2, 'A ==destinação legal== do produto da arrecadação !!não!! define', None)
linha(2, 'O enunciado ==cria uma exceção', '- O art. 182, § 4º, III prevê a ==desapropriação com títulos da dívida pública== (depois do ==IPTU progressivo no tempo==); a Constituição !!não!! cria exceção para o caso de a dívida de IPTU superar o valor do imóvel.')
# ---- 3. Princípios
linha(3, 'A limitação à União ==decorre da repartição', '- A ==repartição constitucional de competências==, e !!não!! a isonomia tributária, impede a União de cobrar impostos sobre serviços (competência dos Municípios e, em parte, dos Estados).')
# ---- 4. Imposto
tudo(4, 'o ==ITCMD== é devido ao Estado do domicílio do doador, aqui o ==Rio Grande do Norte==.', 'o ==ITCMD== é devido ao Estado do ==domicílio do doador==, e !!não!! ao do donatário.')
# ---- 5. Contribuições
linha(5, 'Contribuições sociais e corporativas são de competência exclusiva', '- Contribuições sociais e corporativas são de competência exclusiva da ==União==; Estados, DF e Municípios só instituem a contribuição previdenciária de seus servidores (art. 149, § 1º), e DF e Municípios, a ==COSIP== (art. 149-A).')
linha(5, 'O ==empréstimo compulsório== é da União', '- O ==empréstimo compulsório== é da União, por ==lei complementar==: ==calamidade pública==, ==guerra externa== (ou sua iminência) e, respeitada a anterioridade, ==investimento público urgente== e de relevante interesse nacional.')
tudo(5, '| Art. 64 |', '| Art. 64 · Lei 9.430/1996 |')
# ---- 6. Taxa
linha(6, 'A taxa !!não!! pode ter base de cálculo própria de impostos.', '- A taxa !!não!! pode ter base de cálculo própria de impostos, nem fato gerador idêntico ao de imposto, nem ser calculada em função do ==capital das empresas== (CTN, art. 77, parágrafo único).')
# ---- 9. Contribuição de melhoria
linha(9, 'A ==contribuição de melhoria== tem por base a ==valorização==', '- A ==contribuição de melhoria== tem por base a ==valorização== do imóvel decorrente da obra, e !!não!! o valor integral dele; o ==limite total== é a despesa realizada e o ==limite individual== é o acréscimo de valor de cada imóvel (art. 81).')
tudo(9, 'La União, os estados', 'A União, os estados')
tudo(8, 'As receita do DF', 'As receitas do DF')
json.dump(R, open('/tmp/_r.json', 'w'), ensure_ascii=False)
if falhas: print('FALHAS', falhas); sys.exit(1)
cab = open(P, encoding='utf-8').read().split('\n', 1)[0]
open(P, 'w', encoding='utf-8').write(cab + '\nconst RESUMOS_TCDF = ' + json.dumps(R, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('ok')
