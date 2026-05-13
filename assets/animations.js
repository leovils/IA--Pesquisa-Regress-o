/* =====================================================================
   animations.js — Animações didáticas para os widgets de regressão
   Cada função adiciona classes/atributos a um SVG existente e retorna
   um controlador para reproduzir/reiniciar a animação.
   Sistema de "primeira visita" via localStorage para não cansar.
   ===================================================================== */
(function(global){
  'use strict';

  const STORAGE_PREFIX = 'jornada-anim-seen-';

  function isFirstVisit(key){
    try { return !localStorage.getItem(STORAGE_PREFIX + key); }
    catch(e){ return true; }
  }
  function markSeen(key){
    try { localStorage.setItem(STORAGE_PREFIX + key, '1'); } catch(e){}
  }

  // Injetar CSS uma vez só
  let cssInjected = false;
  function injectCSS(){
    if(cssInjected) return;
    cssInjected = true;
    const css = `
      @keyframes anim-point-in {
        from { opacity: 0; transform: scale(0); }
        to   { opacity: 1; transform: scale(1); }
      }
      .anim-point {
        opacity: 0;
        transform-origin: center;
        transform-box: fill-box;
      }
      .anim-point.run {
        animation: anim-point-in 0.4s ease-out forwards;
      }
      .anim-residuo {
        stroke: #a04444;
        stroke-width: 1;
        stroke-dasharray: 3 3;
        opacity: 0;
        transition: opacity 0.8s ease;
      }
      .anim-residuo.run { opacity: 0.4; }
      .anim-reta {
        opacity: 0;
        transform-box: fill-box;
      }
      .anim-reta.run {
        animation: anim-reta-ajuste 2.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      @keyframes anim-reta-ajuste {
        0%   { opacity: 0; transform: rotate(-35deg) translateY(-20px); }
        18%  { opacity: 1; transform: rotate(-35deg) translateY(-20px); }
        40%  { transform: rotate(22deg) translateY(12px); }
        60%  { transform: rotate(-10deg) translateY(-5px); }
        80%  { transform: rotate(4deg) translateY(2px); }
        100% { opacity: 1; transform: rotate(0deg) translateY(0); }
      }
      .anim-slope {
        transition: transform 2s cubic-bezier(0.34, 1.56, 0.64, 1),
                    opacity 0.4s ease;
        opacity: 0;
      }
      .anim-slope.visible { opacity: 1; }
      .anim-cell { opacity: 0; transition: opacity 0.35s; }
      .anim-cell.run { opacity: 1; }
      .anim-cell-text { opacity: 0; transition: opacity 0.35s; }
      .anim-cell-text.run { opacity: 1; }
      .anim-replay-btn {
        position: absolute; top: 14px; right: 14px;
        padding: 5px 10px; font-size: 11px;
        background: rgba(176, 141, 87, 0.1);
        color: #8a6d3f;
        border: 1px solid rgba(176, 141, 87, 0.3);
        border-radius: 4px;
        cursor: pointer; font-family: inherit;
        letter-spacing: 0.5px;
        transition: all 0.2s;
        z-index: 5;
      }
      .anim-replay-btn:hover {
        background: rgba(176, 141, 87, 0.2);
        border-color: #b08d57;
      }
      .anim-panel-wrap { position: relative; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Anima a matriz de correlações revelando célula a célula.
   * @param {SVGElement} svg - elemento <svg> da matriz já renderizada
   * @param {Object} opts - {key, force, cellDelay}
   */
  function matrixReveal(svg, opts = {}){
    injectCSS();
    const key = opts.key || 'matrix';
    const force = opts.force === true;
    if(!force && !isFirstVisit(key)) return null;

    const cellDelay = opts.cellDelay || 100;
    const cells = svg.querySelectorAll('rect');
    const texts = Array.from(svg.querySelectorAll('text')).filter(t =>
      t.textContent && (t.textContent.includes(',') || t.textContent === '1')
      && !t.getAttribute('class')?.includes('axis-title')
    );

    // Marcar todas as células e textos como animados
    cells.forEach(c => c.classList.add('anim-cell'));
    texts.forEach(t => t.classList.add('anim-cell-text'));

    // Iniciar com pequeno atraso
    let delay = 200;
    setTimeout(() => {
      cells.forEach((c, idx) => {
        c.style.transitionDelay = (idx * cellDelay) + 'ms';
        c.classList.add('run');
      });
      texts.forEach((t, idx) => {
        t.style.transitionDelay = (idx * cellDelay + 150) + 'ms';
        t.classList.add('run');
      });
    }, delay);

    markSeen(key);
    return {
      replay: () => {
        cells.forEach(c => c.classList.remove('run'));
        texts.forEach(t => t.classList.remove('run'));
        void svg.offsetWidth;
        setTimeout(() => {
          cells.forEach(c => c.classList.add('run'));
          texts.forEach(t => t.classList.add('run'));
        }, 50);
      }
    };
  }

  /**
   * Anima a reta de regressão sendo ajustada.
   * @param {SVGElement} svg - SVG do scatter plot (precisa ter elementos com classes específicas)
   * @param {Object} opts - {key, force, retaSelector, pointSelector, residuoSelector}
   */
  function regressionFit(svg, opts = {}){
    injectCSS();
    const key = opts.key || 'regression-fit';
    const force = opts.force === true;
    if(!force && !isFirstVisit(key)) return null;

    const reta = svg.querySelector(opts.retaSelector || '.reg-line');
    const points = svg.querySelectorAll(opts.pointSelector || '.point');

    if(reta){
      reta.classList.add('anim-reta');
      // Calcular centro da reta para transform-origin
      const x1 = parseFloat(reta.getAttribute('x1'));
      const y1 = parseFloat(reta.getAttribute('y1'));
      const x2 = parseFloat(reta.getAttribute('x2'));
      const y2 = parseFloat(reta.getAttribute('y2'));
      const cx = (x1+x2)/2, cy = (y1+y2)/2;
      reta.style.transformOrigin = cx + 'px ' + cy + 'px';
    }

    // Pontos entram em ordem aleatória
    const indices = Array.from(points.keys()).sort(() => Math.random()-0.5);
    indices.forEach((i, ord) => {
      const p = points[i];
      p.classList.add('anim-point');
      p.style.animationDelay = (ord/points.length * 1.5) + 's';
    });

    // Disparar
    setTimeout(() => {
      points.forEach(p => p.classList.add('run'));
      // Reta começa após pontos
      setTimeout(() => {
        if(reta) reta.classList.add('run');
      }, 1800);
    }, 100);

    markSeen(key);
    return {
      replay: () => {
        points.forEach(p => { p.classList.remove('run'); });
        if(reta) reta.classList.remove('run');
        void svg.offsetWidth;
        setTimeout(() => {
          points.forEach(p => p.classList.add('run'));
          setTimeout(() => { if(reta) reta.classList.add('run'); }, 1800);
        }, 50);
      }
    };
  }

  /**
   * Anima as three simple slopes abrindo em leque.
   * @param {Array} slopeElements - array de 3 elementos <line> ou similar
   * @param {Object} opts - {key, force, transforms} — transforms é array de 3 transforms iniciais
   */
  function simpleSlopesFan(slopeElements, opts = {}){
    injectCSS();
    const key = opts.key || 'simple-slopes';
    const force = opts.force === true;
    if(!force && !isFirstVisit(key)) return null;

    const initialTransforms = opts.initialTransforms || [];

    slopeElements.forEach((el, i) => {
      el.classList.add('anim-slope');
      // Estado inicial: rotação inversa que zera a inclinação visual
      if(initialTransforms[i]) el.style.transform = initialTransforms[i];
    });

    setTimeout(() => {
      slopeElements.forEach(el => el.classList.add('visible'));
      setTimeout(() => {
        slopeElements.forEach(el => { el.style.transform = 'none'; });
      }, 200);
    }, 100);

    markSeen(key);
    return {
      replay: () => {
        slopeElements.forEach((el, i) => {
          el.classList.remove('visible');
          el.style.transform = initialTransforms[i] || 'none';
        });
        void slopeElements[0].offsetWidth;
        setTimeout(() => {
          slopeElements.forEach(el => el.classList.add('visible'));
          setTimeout(() => {
            slopeElements.forEach(el => { el.style.transform = 'none'; });
          }, 200);
        }, 50);
      }
    };
  }

  /**
   * Versão automática: encontra as linhas .simple-slope no SVG e calcula
   * os transforms iniciais que as "achatam" (rotação inversa) automaticamente.
   * @param {SVGElement} svg
   * @param {Object} opts - {key, force}
   */
  function simpleSlopesFanAuto(svg, opts = {}){
    const lines = Array.from(svg.querySelectorAll('.simple-slope'));
    if(lines.length < 2) return null;

    const transforms = lines.map(line => {
      const x1 = parseFloat(line.getAttribute('x1'));
      const y1 = parseFloat(line.getAttribute('y1'));
      const x2 = parseFloat(line.getAttribute('x2'));
      const y2 = parseFloat(line.getAttribute('y2'));
      const cx = (x1+x2)/2, cy = (y1+y2)/2;
      line.style.transformOrigin = cx + 'px ' + cy + 'px';
      const angleRad = Math.atan2(y2-y1, x2-x1);
      return 'rotate(' + (-angleRad) + 'rad)';
    });

    return simpleSlopesFan(lines, { ...opts, initialTransforms: transforms });
  }

  /**
   * Adiciona um botão "▶ Rever animação" no canto superior direito de um painel.
   * @param {HTMLElement} container - elemento pai (geralmente .panel)
   * @param {Function} onReplay - callback ao clicar
   */
  function addReplayButton(container, onReplay){
    injectCSS();
    if(!container.classList.contains('anim-panel-wrap')){
      container.classList.add('anim-panel-wrap');
    }
    // Evitar duplicação
    const existing = container.querySelector('.anim-replay-btn');
    if(existing) existing.remove();
    const btn = document.createElement('button');
    btn.className = 'anim-replay-btn';
    btn.textContent = '▶ Rever animação';
    btn.onclick = (e) => { e.preventDefault(); onReplay(); };
    container.appendChild(btn);
  }

  global.Anim = {
    matrixReveal,
    regressionFit,
    simpleSlopesFan,
    simpleSlopesFanAuto,
    addReplayButton,
    isFirstVisit,
    markSeen,
    // Para debug: limpar todas as flags
    resetAll: () => {
      try {
        Object.keys(localStorage).forEach(k => {
          if(k.startsWith(STORAGE_PREFIX)) localStorage.removeItem(k);
        });
      } catch(e){}
    }
  };
})(window);
