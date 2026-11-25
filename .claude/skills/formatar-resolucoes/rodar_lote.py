#!/usr/bin/env python3
"""MODO ECONÔMICO: redige as resoluções de uma lista em lotes, chamando `claude -p` SEM ferramentas e SEM o contexto do projeto.

Por que gasta menos: cada lote é uma chamada isolada (sem histórico acumulado, sem ler arquivos, sem o prompt padrão do Claude Code);
o script faz o trabalho mecânico (ler, validar, montar) e o modelo só redige. Por padrão usa o Sonnet; reserve o modelo maior para
os gabaritos que o relatório marcar como duvidosos.

Uso (de qualquer pasta):
  python3 rodar_lote.py <pasta> --materia "Redes de Computadores (RFCs e padrões IEEE)" [--modelo sonnet] [--tam 25]
                        [--ini 0] [--fim N] [--esforco medium] [--retry 1] [--dry-run]
<pasta> contém original.md (padrão da plataforma). Grava <pasta>/lotes/bNN.py, <pasta>/resp/rNN.py, <pasta>/resp/eNN.py
(mesmos formatos do PROMPT_LOTE.md) e <pasta>/uso.json (tokens e custo de referência por lote).
Retoma de onde parou: lote com bNN.py e rNN.py já existentes é pulado (apague os dois para refazer).
Depois: bash fechar_lista_completa.sh <pasta> "<Matéria>"  (ver ATUALIZAR_LISTA.md).

Regras que o script impõe ao resultado (e reenvia 1 vez com a lista de erros): R cobre todo idx; nada de 'art.', '§', 'inciso' ou
'alínea' nas linhas de texto; marcadores ==, ** e ~~ balanceados; E e X cobrem todo item Certo/Errado de gabarito Errado; o trecho de E
é cópia literal do enunciado; EE cobre toda alternativa que não é o gabarito (múltipla escolha). Sem texto de lei, ⚖️ (base) só entra
quando o modelo tem certeza; o portão do pop-up e o conferidor de dispositivo (lei.js) fecham o resto depois."""
import argparse, json, os, re, subprocess, sys, tempfile, time, importlib.util

SK = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('montar', os.path.join(SK, 'montar_resolucoes.py'))
M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)

SISTEMA = """Você redige resoluções de questões de concurso para a plataforma IA Concurseira. Responda SOMENTE com um bloco ```python ... ``` que define R, E, C, X, GAB e EE (dicionários), sem texto fora do bloco.

Entrada: questões "#idx | assunto | GAB=..." com ENUN (enunciado e alternativas), RES_ANTIGA (resolução anterior, pode estar vazia ou ruim) e o gabarito do arquivo. idx começa em 0; n = idx + 1.

R = { idx: (ess, [palavras-chave], base, atencao, armadilha, macete) } para TODO idx do lote:
- ess (📌): essência em UMA linha (máx. 35 palavras), SEM artigo, § , inciso ou alínea. O termo decisivo vai em ==amarelo== (um só); até 1 **negrito**. Item Errado: risque ~~assim~~ 1 a 3 palavras erradas. Múltipla escolha: diga o que a alternativa correta afirma e "e não ~~X~~".
- palavras-chave: 3 a 5 termos que aparecem literalmente no enunciado, nas alternativas ou no ess.
- base (⚖️): '**Art. 75** ▸ **IV** · Lei 14.133/2021' SÓ se você tiver certeza do dispositivo; senão ''. Matéria sem base legal: ''.
- atencao (⚠️): só se houver exceção, atualização ou dúvida real (sem artigo); senão ''.
- armadilha (🪤): só em item CERTO e em múltipla escolha (uma frase); '' em item Errado.
- macete (💡): curto, sem artigo, ou ''.
E = { n: ('trecho literal e único copiado do ENUNCIADO', 'correção') } para TODO item Certo/Errado de gabarito Errado: o trecho é cópia EXATA, caractere por caractere, do pedaço que torna o item errado; a correção é o que o torna certo.
C = {} (use só para trocar palavras-chave).
X = { n: 'explicação técnica curta (1 frase, até 30 palavras), sem artigo, dizendo o erro' } para os mesmos itens de E.
EE = { idx: {'A': 'Errada; motivo específico, sem reescrever a alternativa.', ...} } para TODA questão de múltipla escolha: UMA linha por alternativa que NÃO seja o gabarito, começando por 'Errada;'. Em Certo/Errado não use EE.
GAB = { idx: ('gabarito do arquivo', 'gabarito proposto', 'motivo em 1 linha') } só se tiver certeza de que o gabarito do arquivo está errado; senão {}. NUNCA troque o gabarito em R/E/X; se propuser, escreva em atencao: 'Conferir o gabarito: <motivo curto>.'

Regras: não invente número, prazo, valor, artigo ou jurisprudência; na dúvida, omita. Não repita o gabarito na resolução. Não cite 'art.', '§', 'inciso' ou 'alínea' nas linhas de texto (só em base). Marcadores ==, ** e ~~ sempre fechados. Português do Brasil, frases curtas."""

PROIBIDO = re.compile(r'\b(art\.|artigo|inciso|al[ií]nea)\b|§', re.I)


def blocos(total, tam, ini, fim):
    fim = total if fim is None else min(fim, total)
    return [(a, min(a + tam, fim)) for a in range(ini, fim, tam)]


def dump(orig, a, b):
    return subprocess.run([sys.executable, os.path.join(SK, 'montar_resolucoes.py'), 'dump', orig, str(a), str(b)],
                          capture_output=True, text=True, check=True).stdout


def chamar(prompt, modelo, esforco):
    cmd = ['claude', '-p', '--model', modelo, '--output-format', 'json', '--tools', '', '--system-prompt', SISTEMA,
           '--no-session-persistence', '--disable-slash-commands']
    if esforco: cmd += ['--effort', esforco]
    r = subprocess.run(cmd, input=prompt, capture_output=True, text=True, cwd=tempfile.mkdtemp(prefix='lote_'), timeout=900)
    if r.returncode:
        raise RuntimeError('claude -p falhou: ' + (r.stderr or r.stdout)[:400])
    j = json.loads(r.stdout)
    if j.get('is_error'): raise RuntimeError('erro do modelo: ' + str(j.get('result'))[:300])
    u = j.get('usage', {})
    uso = dict(entrada=u.get('input_tokens', 0), cache_escrita=u.get('cache_creation_input_tokens', 0), cache_leitura=u.get('cache_read_input_tokens', 0),
               saida=u.get('output_tokens', 0), custo_ref_usd=round(j.get('total_cost_usd', 0) or 0, 4))
    uso['total'] = uso['entrada'] + uso['cache_escrita'] + uso['cache_leitura'] + uso['saida']
    return j.get('result', ''), uso


def extrair(texto):
    m = re.search(r'```(?:python)?\n(.*?)```', texto, re.S)
    return m.group(1) if m else texto


def balanceado(s):
    return s.count('==') % 2 == 0 and s.count('**') % 2 == 0 and s.count('~~') % 2 == 0


def validar(ns, Q, a, b):
    """lista de erros (vazia = ok) para o lote a..b (idx 0-based)."""
    erros = []
    R, E, X, EE = ns.get('R', {}), ns.get('E', {}), ns.get('X', {}), ns.get('EE', {})
    for i in range(a, b):
        q = Q[i]; gab = (q['gab'] or '').strip(); ce = gab in ('Certo', 'Errado'); errado = gab == 'Errado'; n = i + 1
        t = R.get(i)
        if not t or len(t) != 6: erros.append(f'R sem a tupla de 6 campos para idx {i}'); continue
        ess, chaves, base, aten, arm, mac = t
        if not ess or not isinstance(chaves, list) or not (2 <= len(chaves) <= 7): erros.append(f'idx {i}: ess vazio ou palavras-chave fora de 3 a 5')
        for nome, v in (('ess', ess), ('atencao', aten), ('armadilha', arm), ('macete', mac)):
            if v and PROIBIDO.search(v): erros.append(f'idx {i}: {nome} cita artigo/§/inciso/alínea (só base pode)')
            if v and not balanceado(v): erros.append(f'idx {i}: {nome} com ==, ** ou ~~ sem fechar')
        if errado and arm: erros.append(f'idx {i}: item Errado não leva armadilha (🪤)')
        if errado:
            if n not in E: erros.append(f'E sem n={n} (item Errado)')
            else:
                tr = E[n][0] if isinstance(E[n], (tuple, list)) and E[n] else ''
                if not tr or tr not in q['enun']: erros.append(f'E n={n}: o trecho não é cópia literal do enunciado')
            if n not in X: erros.append(f'X sem n={n} (item Errado)')
        if not ce:
            letras = [L for L in re.findall(r'(?m)^\s*\(?([A-E])[).]\s', q['enun'])]
            esperadas = [L for L in dict.fromkeys(letras) if L != gab.strip('() ')] if letras else []
            ee = EE.get(i, {})
            faltam = [L for L in esperadas if L not in ee]
            if esperadas and faltam: erros.append(f'EE idx {i}: faltam as letras {faltam}')
            for L, v in ee.items():
                if not str(v).startswith('Errada'): erros.append(f'EE idx {i} letra {L}: deve começar por "Errada;"')
                if PROIBIDO.search(str(v)): erros.append(f'EE idx {i} letra {L}: cita artigo/§/inciso')
    return erros


def gravar(pasta, k, ns, a, b):
    os.makedirs(os.path.join(pasta, 'lotes'), exist_ok=True); os.makedirs(os.path.join(pasta, 'resp'), exist_ok=True)
    NN = '%02d' % k
    R = {i: tuple(v) for i, v in ns['R'].items() if a <= i < b}
    open(os.path.join(pasta, 'lotes', f'b{NN}.py'), 'w', encoding='utf-8').write('R = %r\n' % (R,))
    E = {n: tuple(v) for n, v in ns.get('E', {}).items() if a < n <= b}
    X = {n: v for n, v in ns.get('X', {}).items() if a < n <= b}
    G = {i: tuple(v) for i, v in ns.get('GAB', {}).items() if a <= i < b}
    open(os.path.join(pasta, 'resp', f'r{NN}.py'), 'w', encoding='utf-8').write('E = %r\nC = %r\nX = %r\nGAB = %r\n' % (E, ns.get('C', {}), X, G))
    EE = {i: v for i, v in ns.get('EE', {}).items() if a <= i < b}
    if EE: open(os.path.join(pasta, 'resp', f'e{NN}.py'), 'w', encoding='utf-8').write('EE = %r\n' % (EE,))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('pasta'); ap.add_argument('--materia', required=True); ap.add_argument('--modelo', default='sonnet')
    ap.add_argument('--tam', type=int, default=25); ap.add_argument('--ini', type=int, default=0); ap.add_argument('--fim', type=int)
    ap.add_argument('--esforco', default='medium'); ap.add_argument('--retry', type=int, default=1); ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    orig = os.path.join(a.pasta, 'original.md')
    _, _, Q = M.ler(orig)
    B = blocos(len(Q), a.tam, a.ini, a.fim)
    print(f'{len(Q)} questões; {len(B)} lote(s) de até {a.tam}; modelo {a.modelo}')
    usos = []; arq_uso = os.path.join(a.pasta, 'uso.json')
    if os.path.exists(arq_uso): usos = json.load(open(arq_uso, encoding='utf-8'))
    for k, (i0, i1) in enumerate(B, start=a.ini // a.tam):
        NN = '%02d' % k
        if os.path.exists(os.path.join(a.pasta, 'lotes', f'b{NN}.py')) and os.path.exists(os.path.join(a.pasta, 'resp', f'r{NN}.py')):
            print(f'lote {NN} ({i0}..{i1}) já pronto: pulado'); continue
        ne = [i + 1 for i in range(i0, i1) if (Q[i]['gab'] or '').strip() == 'Errado']
        mc = [i for i in range(i0, i1) if (Q[i]['gab'] or '').strip() not in ('Certo', 'Errado')]
        exigido = f'OBRIGATÓRIO neste lote: R com as chaves idx {i0}..{i1 - 1}; E e X com as chaves n = {ne if ne else "nenhuma"} (n = idx + 1); EE com as chaves idx = {mc if mc else "nenhuma"}.'
        entrada = f'Matéria e normas: {a.materia}\nLote idx {i0} a {i1 - 1}.\n{exigido}\n\n' + dump(orig, i0, i1)
        if a.dry_run:
            print(f'lote {NN} ({i0}..{i1}): ~{(len(SISTEMA) + len(entrada)) // 3} tokens de entrada (sem contar a saída)'); continue
        prompt, ns, erros, uso_tot = entrada, {}, ['não executou'], dict(entrada=0, cache_escrita=0, cache_leitura=0, saida=0, total=0, custo_ref_usd=0)
        for tent in range(a.retry + 1):
            res, uso = chamar(prompt, a.modelo, a.esforco)
            for c in uso_tot: uso_tot[c] = round(uso_tot[c] + uso[c], 4)
            try:
                ns = {}; exec(extrair(res), ns)
                erros = validar(ns, Q, i0, i1)
            except Exception as e:
                erros = [f'o código não executou: {e}']
            if not erros: break
            os.makedirs(os.path.join(a.pasta, '_falhas'), exist_ok=True)
            open(os.path.join(a.pasta, '_falhas', f'b{NN}_t{tent}.txt'), 'w', encoding='utf-8').write(res)      # resposta bruta, para diagnóstico
            prompt = entrada + '\n\nSua resposta anterior teve estes problemas; reenvie o bloco inteiro corrigido:\n- ' + '\n- '.join(erros[:25])
        if erros:
            print(f'lote {NN}: {len(erros)} problema(s) depois de {a.retry + 1} tentativa(s); NÃO gravado:'); [print('  -', e) for e in erros[:10]]
            usos.append(dict(lote=NN, ini=i0, fim=i1, ok=False, **uso_tot)); continue
        gravar(a.pasta, k, ns, i0, i1)
        usos.append(dict(lote=NN, ini=i0, fim=i1, ok=True, **uso_tot))
        print(f'lote {NN} ({i0}..{i1}) ok: {uso_tot["total"]} tokens ({uso_tot["total"] // (i1 - i0)} por questão), custo de referência US$ {uso_tot["custo_ref_usd"]}')
        json.dump(usos, open(arq_uso, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    feitos = [u for u in usos if u.get('ok')]
    if feitos:
        q = sum(u['fim'] - u['ini'] for u in feitos); tk = sum(u['total'] for u in feitos); us = sum(u['custo_ref_usd'] for u in feitos)
        print(f'\nResumo: {q} questões, {tk} tokens ({tk // q} por questão), US$ {us:.2f} de referência (US$ {us / q:.3f} por questão).')
        print('Para 100 questões: ~%d mil tokens. Compare com a sua cota: veja /usage antes e depois de um lote e calcule questões por janela = cota ÷ uso por questão.' % (tk * 100 // q // 1000))
    print('Próximo passo: bash %s <pasta> "<Matéria>"' % os.path.join(SK, 'fechar_lista_completa.sh'))


if __name__ == '__main__':
    main()
