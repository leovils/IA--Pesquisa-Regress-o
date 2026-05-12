# Jornada Didática de Regressão Linear — v2

Material pedagógico interativo para pós-graduação em administração e áreas afins. Cinco widgets HTML standalone, hospedáveis em GitHub Pages, cobrindo a regressão linear da correlação aos diagnósticos.

## O que tem nesta versão (v2)

Em relação à versão inicial, foram adicionados:

- **Réguas visuais de tamanho de efeito** em todos os widgets, com bandas coloridas e marcador para o valor observado
- **Frase no formato APA copiável** em cada widget — pronta para colar no manuscrito
- **Mini-quiz entre estágios** (2 a 3 perguntas com feedback) para fixar conceitos críticos
- **Histórico de modelos clicável** no widget 3 — restaure modelos anteriores com um clique
- **Comparação lado-a-lado** de dois modelos fixados (widget 3)
- **Calculadora de N mínimo** com critérios de Cohen (1988) e Green (1991)
- **Página de referências bibliográficas** em formato APA com todas as obras citadas
- **Citações in-line** com tooltip da referência completa (Cohen, 1988; Hair et al., 2019; etc.)

## Estrutura

```
regressao-didatica/
├── index.html              ← Landing/mapa da jornada
├── 01-correlacoes.html     ← Matriz Pearson + régua de r (Cohen)
├── 02-regressao-simples.html  ← OLS simples + régua R²/f² + APA
├── 03-regressao-multipla.html ← Múltipla + histórico + side-by-side + calc N
├── 04-moderacao.html       ← Interação + simple slopes + régua Aguinis
├── 05-pressupostos.html    ← Diagnósticos completos + réguas + APA
├── referencias.html        ← Bibliografia em APA
├── README.md
└── assets/
    ├── dados.js            ← Banco pré-carregado N=180 embutido
    ├── stats.js            ← Biblioteca estatística JS pura (validada vs statsmodels)
    ├── widgets-common.js   ← Componentes UI compartilhados (régua, APA, quiz, calc N)
    └── style.css           ← Estilo Cinzel/Inter, paleta pergaminho
```

## Tamanhos de efeito implementados

| Indicador | Cutoffs | Onde aparece | Referência |
|-----------|---------|--------------|-----------|
| r de Pearson | 0,10 / 0,30 / 0,50 | Widget 1 | Cohen (1988) |
| R² do modelo | 0,02 / 0,13 / 0,26 | Widgets 2, 3 | Cohen (1988) |
| Cohen's f² (modelo) | 0,02 / 0,15 / 0,35 | Widgets 2, 3 | Cohen (1988) |
| f² incremento (por VI) | 0,02 / 0,15 / 0,35 | Widget 3 | Cohen et al. (2003) |
| f² interação (moderação) | 0,005 / 0,01 / 0,025 | Widget 4 | Aguinis et al. (2005) |
| VIF | < 5 / 5–10 / ≥ 10 | Widgets 3, 5 | Hair et al. (2019) |
| Assimetria \|skew\| | < 1 / 1–2 / ≥ 2 | Widget 5 | Hair et al. (2019) |
| Curtose \|kurt\| | < 3 / 3–7 / ≥ 7 | Widget 5 | Hair et al. (2019); Curran et al. (1996) |
| Durbin-Watson | 1,5–2,5 OK | Widget 5 | Field (2018) |
| Cook's D | 4/N e D > 1 | Widget 5 | Bollen & Jackman (1990); Cook & Weisberg (1982) |
| Leverage | h > 2(k+1)/N | Widget 5 | Belsley et al. (1980) |
| N mínimo | 50+8k (Cohen); 104+k (Green β) | Widget 3 | Cohen (1988); Green (1991) |

## Como hospedar no GitHub Pages

1. Crie um repositório público chamado `regressao-didatica` no GitHub
2. Faça upload de todos os arquivos preservando a estrutura de pastas (a pasta `assets/` precisa ir junto)
3. Em **Settings → Pages**, escolha **Source: Deploy from a branch**, **Branch: main**, **Folder: / (root)**, e clique em **Save**
4. Após ~1 minuto, o site estará em `https://[seu-usuario].github.io/regressao-didatica/`

Os widgets funcionam offline também — basta abrir `index.html` direto no navegador.

## Banco pré-carregado

N = 180 casos sintéticos. Variáveis: VI1, VI2, VI3 (preditores), W1 (moderadora), VD1, VD2 (respostas). Todos os pressupostos da regressão respeitados por construção. W1 amplifica os efeitos de VI1→VD1 e VI2→VD2 — útil para demonstrar moderação. Os widgets também aceitam CSV próprio (botão de upload em cada um).

## Créditos

Material desenvolvido para a disciplina **Métodos e Técnicas de Pesquisa Quantitativa I (MTPQI)** do PPGA/PPGP UNINOVE. Estética inspirada no Grimório de Odin Dinho.
