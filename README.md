# Jornada Didática — Regressão Linear com Moderação

Material interativo em HTML para ensino de **regressão linear múltipla com moderação** em programas de pós-graduação em Administração. Cinco widgets independentes, em ordem pedagógica, que rodam direto no navegador — sem servidor, sem instalação, prontos para hospedar no GitHub Pages.

## A jornada

| Estágio | Widget | O que se aprende |
|--------|--------|------------------|
| I | **Correlações** | Matriz de Pearson interativa; clique numa célula para ver o diagrama de dispersão, r, t, p e interpretação. |
| II | **Regressão Simples** | Uma VI e uma VD: intercepto, inclinação, EP, t, p, R², banda de confiança 95% da reta. |
| III | **Regressão Múltipla** | O coração da jornada. Marque preditores um a um e veja β, EP, t, p, IC 95%, R², R² ajustado, ΔR² e VIF mudando ao vivo. |
| IV | **Moderação** | Centralização automática de X e W, criação do termo X×W, gráfico de *simple slopes* em três níveis de W (–1 DP, média, +1 DP). |
| V | **Pressupostos** | Painel completo: Jarque-Bera + QQ-plot, Breusch-Pagan + resíduos vs ajustados, Durbin-Watson, VIFs e Cook's D. |

## Banco pré-carregado

Cada widget vem com **180 casos** gerados a partir de um modelo populacional conhecido:

- **VI1, VI2, VI3** — variáveis independentes (escala 1–7)
- **W1** — moderadora
- **VD1, VD2** — variáveis dependentes
- **N** = 2 × mínimo de Cohen (1988): `N ≥ 50 + 8k`, com k = 5 → 90 × 2 = 180
- W1 amplifica VI1 → VD1 e VI2 → VD2 (interação significativa por construção)
- Todos os cinco pressupostos da regressão são respeitados

O usuário também pode subir um **CSV próprio** em qualquer widget (vírgula, ponto-e-vírgula ou tab como separador; primeira linha = cabeçalho).

## Como usar

### Localmente

Basta abrir `index.html` num navegador. Não há dependências externas.

```bash
git clone <este-repo>
cd regressao-didatica
# abrir index.html no navegador, ou:
python3 -m http.server 8000
# então: http://localhost:8000
```

### Publicar no GitHub Pages

1. Suba o repositório ao GitHub.
2. Em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`.
3. Em ~1 minuto, o material estará disponível em `https://<seu-usuário>.github.io/<nome-do-repo>/`.

## Arquitetura

```
regressao-didatica/
├── index.html                  ← Mapa da jornada
├── 01-correlacoes.html
├── 02-regressao-simples.html
├── 03-regressao-multipla.html
├── 04-moderacao.html
├── 05-pressupostos.html
└── assets/
    ├── style.css               ← Estilos compartilhados
    ├── dados.js                ← 180 casos pré-carregados
    └── stats.js                ← Biblioteca estatística (OLS, VIF, BP, JB, DW, Cook's D)
```

### A biblioteca `stats.js`

Implementação pura em JavaScript, sem dependências, dos seguintes procedimentos:

- **OLS** via Gauss-Jordan estável: β, EP, t, p, IC 95%, R², R² ajustado, F, resíduos, ajustados
- **VIF** por regressões auxiliares
- **Diagnósticos**: Durbin-Watson, Breusch-Pagan (Koenker), Jarque-Bera
- **Influência**: Cook's D e *leverage* (h_ii)
- **Distribuições**: t-Student, F, χ² e Normal (com inversa via Beasley-Springer-Moro)
- **Utilitários**: parser de CSV, centralização, padronização, formatadores

Os resultados foram validados contra `statsmodels` (Python) — números idênticos até quatro casas decimais.

## Estética

Visual sóbrio acadêmico com toques pontuais inspirados no estilo "Grimório": títulos em **Cinzel**, corpo em **Inter**, números em **JetBrains Mono**, paleta pergaminho discreta (creme #faf7f2, dourado #b08d57). Pensado para ser projetado em sala e legível em diferentes resoluções.

## Licença

Material didático de uso livre para fins educacionais. Citação sugerida:

> Jornada Didática de Regressão Linear com Moderação. Programa de Pós-Graduação em Administração, 2026.

---

*"A regressão não é uma caixa-preta. Os β nascem, o R² sobe, os VIFs reagem — e tudo acontece diante dos olhos do aluno."*
