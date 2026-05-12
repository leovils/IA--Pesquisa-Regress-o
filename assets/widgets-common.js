/* =====================================================================
   widgets-common.js — Componentes UI compartilhados
   - Régua visual de tamanho de efeito (com bandas e marcador)
   - Caixa APA copiável
   - Mini-quiz com feedback
   - Citação inline curta
   - Calculadora de N mínimo
   ===================================================================== */
(function(global){
  'use strict';

  // ===== RÉGUA DE TAMANHO DE EFEITO =====
  // bands: [{upper, label}, ...] do Stats.EFFECT_BANDS
  // value: valor observado (será |value|)
  // domainMax: limite superior do eixo (default: 2x maior banda finita)
  // ref: string de citação curta (ex: "Cohen, 1988")
  function renderEffectRuler(value, kindOrBands, opts = {}){
    const bands = typeof kindOrBands === 'string' ? Stats.EFFECT_BANDS[kindOrBands] : kindOrBands;
    const v = Math.abs(value);
    // Domínio: até o maior limite finito (× 1.3) ou domainMax explícito
    const lastFinite = bands.slice().reverse().find(b => isFinite(b.upper)) || {upper: 1};
    const domainMax = opts.domainMax || Math.max(v*1.05, lastFinite.upper*1.4);
    const label = Stats.classify(v, bands);
    const colors = ['#e8d8c8','#fadfb4','#f0c890','#d4a460'];

    let bandsHtml = '';
    let prev = 0;
    bands.forEach((b, i) => {
      const upper = Math.min(isFinite(b.upper) ? b.upper : domainMax, domainMax);
      const left = (prev / domainMax) * 100;
      const width = ((upper - prev) / domainMax) * 100;
      if(width > 0){
        bandsHtml += `<div class="er-band" style="left:${left}%;width:${width}%;background:${colors[i]};" title="${b.label}: até ${isFinite(b.upper)?b.upper:'∞'}"></div>`;
      }
      prev = upper;
    });

    // Marcador
    const markerPos = Math.min(v / domainMax, 1) * 100;
    // Ticks (limites das bandas)
    let ticksHtml = '';
    bands.forEach((b, i) => {
      if(!isFinite(b.upper) || b.upper > domainMax) return;
      const pos = (b.upper / domainMax) * 100;
      ticksHtml += `<div class="er-tick" style="left:${pos}%;"></div>`;
      ticksHtml += `<div class="er-tick-label" style="left:${pos}%;">${b.upper.toString().replace('.',',')}</div>`;
    });

    const refHtml = opts.ref ? `<span class="er-ref">${opts.ref}</span>` : '';
    const valFmt = Stats.fmt(value, 3).replace('.',',');

    return `
      <div class="effect-ruler">
        <div class="er-header">
          <span class="er-label">${opts.label || 'Tamanho do efeito'}</span>
          <span class="er-value mono">${valFmt} → <strong>${label}</strong></span>
        </div>
        <div class="er-track">
          ${bandsHtml}
          ${ticksHtml}
          <div class="er-marker" style="left:${markerPos}%;"></div>
        </div>
        <div class="er-legend">
          ${bands.map((b,i) => `<span class="er-leg-item"><span class="er-leg-swatch" style="background:${colors[i]};"></span>${b.label}</span>`).join('')}
          ${refHtml}
        </div>
      </div>
    `;
  }

  // ===== CAIXA APA =====
  function renderAPABox(text, opts = {}){
    const id = 'apa-' + Math.random().toString(36).substring(2, 9);
    return `
      <div class="apa-box">
        <div class="apa-head">
          <span class="apa-label">Formato APA — pronto para colar</span>
          <button class="btn apa-btn" onclick="WC.copyAPA('${id}', this)">Copiar</button>
        </div>
        <div class="apa-text" id="${id}">${text}</div>
        ${opts.note ? `<div class="apa-note">${opts.note}</div>` : ''}
      </div>
    `;
  }
  function copyAPA(id, btn){
    const el = document.getElementById(id);
    if(!el) return;
    const text = el.innerText || el.textContent;
    Stats.copyToClipboard(text).then(() => {
      const oldText = btn.textContent;
      btn.textContent = '✓ Copiado';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = oldText; btn.classList.remove('copied'); }, 1800);
    });
  }

  // ===== MINI-QUIZ =====
  // questions: [{ q, options: [{label, correct, explain}], hint }]
  function renderQuiz(questions, opts = {}){
    const title = opts.title || 'Antes de avançar — teste seu entendimento';
    const subtitle = opts.subtitle || '';
    let html = `<div class="quiz-block">
      <div class="quiz-title">${title}</div>
      ${subtitle ? `<div class="quiz-subtitle">${subtitle}</div>` : ''}`;
    questions.forEach((q, qi) => {
      const qId = 'quiz-' + Math.random().toString(36).substring(2, 9);
      html += `<div class="quiz-q" data-quiz="${qId}">
        <div class="quiz-q-text">${qi+1}. ${q.q}</div>
        <div class="quiz-options">`;
      q.options.forEach((opt, oi) => {
        html += `<button class="quiz-opt" onclick="WC.answerQuiz('${qId}', ${oi}, ${opt.correct ? 'true' : 'false'}, '${(opt.explain||'').replace(/'/g, "\\'")}')">${opt.label}</button>`;
      });
      html += `</div>
        <div class="quiz-feedback" id="${qId}-fb"></div>
      </div>`;
    });
    html += '</div>';
    return html;
  }
  function answerQuiz(qId, optIdx, correct, explain){
    const fb = document.getElementById(qId + '-fb');
    const buttons = document.querySelectorAll(`[data-quiz="${qId}"] .quiz-opt`);
    buttons.forEach((b, i) => {
      b.disabled = true;
      if(i === optIdx) b.classList.add(correct ? 'correct' : 'wrong');
    });
    fb.className = 'quiz-feedback ' + (correct ? 'fb-correct' : 'fb-wrong');
    fb.innerHTML = (correct ? '✓ <strong>Correto.</strong> ' : '✗ <strong>Não foi dessa vez.</strong> ') + (explain || '');
  }

  // ===== CITAÇÃO INLINE CURTA =====
  function cite(short, fullRef){
    return `<span class="ref-cite" title="${fullRef || short}">${short}</span>`;
  }

  // ===== CALCULADORA N MÍNIMO =====
  function renderNCalc(currentN, k){
    const v = Stats.powerVerdict(currentN, k);
    const cohenN = Stats.nMinCohen(k);
    const greenModel = v.reqModel;
    const greenPred  = v.reqPred;
    const cohenIcon = currentN >= cohenN ? '✓' : '✗';
    const modelIcon = v.meetsModel ? '✓' : '✗';
    const predIcon  = v.meetsPred ? '✓' : '✗';
    return `
      <div class="n-calc">
        <div class="n-calc-title">Tamanho da amostra · k = ${k} preditor(es)</div>
        <table class="n-calc-table">
          <thead><tr><th>Critério</th><th>N requerido</th><th>Status (N = ${currentN})</th></tr></thead>
          <tbody>
            <tr>
              <td>Cohen (1988) — regra geral<br><span class="muted">N ≥ 50 + 8k</span></td>
              <td class="mono">${cohenN}</td>
              <td><span class="badge ${currentN>=cohenN?'ok':'bad'}">${cohenIcon} ${currentN>=cohenN?'atende':'insuficiente'}</span></td>
            </tr>
            <tr>
              <td>Green (1991) — teste do modelo<br><span class="muted">N ≥ 50 + 8k</span></td>
              <td class="mono">${greenModel}</td>
              <td><span class="badge ${v.meetsModel?'ok':'bad'}">${modelIcon} ${v.meetsModel?'atende':'insuficiente'}</span></td>
            </tr>
            <tr>
              <td>Green (1991) — teste de β individuais<br><span class="muted">N ≥ 104 + k</span></td>
              <td class="mono">${greenPred}</td>
              <td><span class="badge ${v.meetsPred?'ok':'bad'}">${predIcon} ${v.meetsPred?'atende':'insuficiente'}</span></td>
            </tr>
          </tbody>
        </table>
        <div class="n-calc-note muted">Pressupõe efeito médio e poder ≥ 0,80, α = 0,05. Para detecção de efeitos pequenos, use G*Power.</div>
      </div>
    `;
  }

  // ===== HELPERS APA (geram a frase formatada) =====
  function apaRegSimples(yV, xV, m){
    const sig = m.fp < 0.001 ? '< 0,001' : Stats.fmtP(m.fp);
    const sigB = m.p[1] < 0.001 ? '< 0,001' : Stats.fmtP(m.p[1]);
    const r2 = Stats.fmtBr(m.r2, 3);
    const r2a = Stats.fmtBr(m.r2adj, 3);
    const F = Stats.fmtBr(m.f, 2);
    return `Conduziu-se uma regressão linear simples para predizer <em>${yV}</em> a partir de <em>${xV}</em>. ` +
           `O modelo foi estatisticamente significativo, <em>F</em>(${m.df_mod}, ${m.df_res}) = ${F}, <em>p</em> ${sig}, ` +
           `R² = ${r2} (R²ₐⱼ = ${r2a}). ` +
           `${xV} previu significativamente ${yV} (<em>B</em> = ${Stats.fmtBr(m.beta[1],3)}, ` +
           `<em>EP</em> = ${Stats.fmtBr(m.se[1],3)}, <em>t</em> = ${Stats.fmtBr(m.t[1],2)}, <em>p</em> ${sigB}, ` +
           `IC 95% [${Stats.fmtBr(m.ciLow[1],3)}; ${Stats.fmtBr(m.ciHigh[1],3)}]).`;
  }
  function apaRegMultipla(yV, viNames, m){
    const sig = m.fp < 0.001 ? '< 0,001' : Stats.fmtP(m.fp);
    const r2 = Stats.fmtBr(m.r2, 3);
    const r2a = Stats.fmtBr(m.r2adj, 3);
    const F = Stats.fmtBr(m.f, 2);
    const f2 = Stats.fmtBr(Stats.cohenF2(m.r2), 3);
    let preds = '';
    for(let i=1;i<m.beta.length;i++){
      const pStr = m.p[i] < 0.001 ? '< 0,001' : Stats.fmtP(m.p[i]);
      preds += `${viNames[i-1]} (<em>B</em> = ${Stats.fmtBr(m.beta[i],3)}, <em>EP</em> = ${Stats.fmtBr(m.se[i],3)}, <em>t</em> = ${Stats.fmtBr(m.t[i],2)}, <em>p</em> ${pStr})`;
      if(i < m.beta.length-1) preds += '; ';
    }
    return `Uma regressão linear múltipla foi conduzida para predizer <em>${yV}</em> a partir de ${viNames.length} preditor(es): ${viNames.join(', ')}. ` +
           `O modelo foi estatisticamente significativo, <em>F</em>(${m.df_mod}, ${m.df_res}) = ${F}, <em>p</em> ${sig}, ` +
           `R² = ${r2}, R²ₐⱼ = ${r2a}, <em>f</em>² = ${f2}. ` +
           `Coeficientes: ${preds}.`;
  }
  function apaModeracao(yV, xV, wV, m, deltaR2){
    const idxInt = m.beta.length - 1;
    const sig = m.p[idxInt] < 0.001 ? '< 0,001' : Stats.fmtP(m.p[idxInt]);
    const f2 = deltaR2 !== null ? Stats.fmtBr(Stats.f2Increment(m.r2, m.r2 - deltaR2), 4) : '—';
    return `Para testar se <em>${wV}</em> modera o efeito de <em>${xV}</em> sobre <em>${yV}</em>, ` +
           `conduziu-se uma regressão com termo de interação centralizado. ` +
           `A interação ${xV}×${wV} foi ${m.p[idxInt] < 0.05 ? 'significativa' : 'não-significativa'}, ` +
           `<em>B</em> = ${Stats.fmtBr(m.beta[idxInt],3)}, <em>EP</em> = ${Stats.fmtBr(m.se[idxInt],3)}, ` +
           `<em>t</em>(${m.df_res}) = ${Stats.fmtBr(m.t[idxInt],2)}, <em>p</em> ${sig}` +
           `${deltaR2 !== null ? `, ΔR² = ${Stats.fmtBr(deltaR2,3)}, <em>f</em>² = ${f2}` : ''}. ` +
           `${m.p[idxInt] < 0.05 ? `Os dados são consistentes com a hipótese de moderação.` : `Não há suporte estatístico para a hipótese de moderação.`}`;
  }
  function apaPressupostos(jb, bp, dw, maxVif, nInfluential, n){
    const okJB = jb.p >= 0.05;
    const okBP = bp.p >= 0.05;
    const okDW = dw >= 1.5 && dw <= 2.5;
    const okVIF = maxVif < 5;
    const okCook = nInfluential === 0;
    return `Os pressupostos da regressão foram verificados. ` +
           `<strong>Normalidade dos resíduos</strong>: Jarque-Bera = ${Stats.fmtBr(jb.jb,2)}, <em>p</em> = ${Stats.fmtP(jb.p)} ${okJB?'(atendido)':'(violado)'}; ` +
           `assimetria = ${Stats.fmtBr(jb.skew,2)}, curtose = ${Stats.fmtBr(jb.kurt,2)}. ` +
           `<strong>Homocedasticidade</strong>: Breusch-Pagan LM = ${Stats.fmtBr(bp.lm,2)}, <em>p</em> = ${Stats.fmtP(bp.p)} ${okBP?'(atendida)':'(violada)'}. ` +
           `<strong>Independência dos resíduos</strong>: Durbin-Watson = ${Stats.fmtBr(dw,2)} ${okDW?'(atendida)':'(atenção)'}. ` +
           `<strong>Multicolinearidade</strong>: VIF máximo = ${Stats.fmtBr(maxVif,2)} ${okVIF?'(confortável)':'(atenção)'}. ` +
           `<strong>Observações influentes</strong>: ${nInfluential} de ${n} casos com Cook's D > 4/N ${okCook?'(nenhuma preocupação)':'(verificar)'}.`;
  }

  global.WC = { renderEffectRuler, renderAPABox, copyAPA, renderQuiz, answerQuiz, cite, renderNCalc, apaRegSimples, apaRegMultipla, apaModeracao, apaPressupostos };

})(window);
