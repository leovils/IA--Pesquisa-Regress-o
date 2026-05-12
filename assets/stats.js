/* =====================================================================
   stats.js — Biblioteca didática de estatística para regressão
   Implementa: OLS via decomposição, VIF, Breusch-Pagan, Durbin-Watson,
   Jarque-Bera, distribuições t/F/chi2/normal (aproximações fechadas).
   Sem dependências externas. Numericamente OK para N até alguns milhares.
   ===================================================================== */

(function(global){
  'use strict';

  // ===== Funções básicas =====
  function mean(arr){ let s=0; for(let i=0;i<arr.length;i++) s+=arr[i]; return s/arr.length; }
  function variance(arr, ddof=1){
    const m = mean(arr); let s=0;
    for(let i=0;i<arr.length;i++) s += (arr[i]-m)*(arr[i]-m);
    return s/(arr.length-ddof);
  }
  function std(arr, ddof=1){ return Math.sqrt(variance(arr, ddof)); }
  function sum(arr){ let s=0; for(let i=0;i<arr.length;i++) s+=arr[i]; return s; }

  function correlation(x, y){
    const n = x.length;
    const mx = mean(x), my = mean(y);
    let num=0, dx2=0, dy2=0;
    for(let i=0;i<n;i++){
      const a = x[i]-mx, b = y[i]-my;
      num += a*b; dx2 += a*a; dy2 += b*b;
    }
    const r = num / Math.sqrt(dx2*dy2);
    // p-valor (teste t)
    const t = r * Math.sqrt((n-2)/(1-r*r));
    const p = 2*(1 - tCDF(Math.abs(t), n-2));
    return { r, p, t, n };
  }

  // ===== Álgebra linear (matrizes pequenas, N estável) =====
  function transpose(M){
    const r = M.length, c = M[0].length;
    const T = Array.from({length: c}, () => new Array(r));
    for(let i=0;i<r;i++) for(let j=0;j<c;j++) T[j][i] = M[i][j];
    return T;
  }
  function matMul(A, B){
    const ra=A.length, ca=A[0].length, cb=B[0].length;
    const R = Array.from({length: ra}, () => new Array(cb).fill(0));
    for(let i=0;i<ra;i++)
      for(let k=0;k<ca;k++){
        const aik = A[i][k];
        for(let j=0;j<cb;j++) R[i][j] += aik * B[k][j];
      }
    return R;
  }
  function matVec(A, v){
    const r=A.length, c=A[0].length;
    const out = new Array(r).fill(0);
    for(let i=0;i<r;i++){
      let s=0; for(let j=0;j<c;j++) s += A[i][j]*v[j];
      out[i]=s;
    }
    return out;
  }
  // Inversa via Gauss-Jordan com pivoteamento parcial
  function matInv(M){
    const n = M.length;
    const A = M.map((row,i)=>row.slice().concat(Array.from({length:n}, (_,j)=> i===j?1:0)));
    for(let i=0;i<n;i++){
      // pivot
      let maxRow=i, maxVal=Math.abs(A[i][i]);
      for(let k=i+1;k<n;k++){
        if(Math.abs(A[k][i])>maxVal){ maxRow=k; maxVal=Math.abs(A[k][i]); }
      }
      if(maxVal < 1e-14) throw new Error("Matriz singular (provável multicolinearidade extrema)");
      if(maxRow!==i){ const tmp=A[i]; A[i]=A[maxRow]; A[maxRow]=tmp; }
      const piv = A[i][i];
      for(let j=0;j<2*n;j++) A[i][j] /= piv;
      for(let k=0;k<n;k++){
        if(k===i) continue;
        const f = A[k][i];
        if(f===0) continue;
        for(let j=0;j<2*n;j++) A[k][j] -= f*A[i][j];
      }
    }
    return A.map(row => row.slice(n));
  }

  // ===== Distribuições =====
  // Função erro (Abramowitz & Stegun)
  function erf(x){
    const s = Math.sign(x); x = Math.abs(x);
    const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
    const t = 1.0/(1.0+p*x);
    const y = 1.0 - (((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
    return s*y;
  }
  function normalCDF(z){ return 0.5*(1 + erf(z/Math.SQRT2)); }

  // log-gamma (Stirling)
  function lgamma(x){
    const cof = [76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];
    let y=x, tmp=x+5.5;
    tmp -= (x+0.5)*Math.log(tmp);
    let ser=1.000000000190015;
    for(let j=0;j<6;j++){ y+=1; ser += cof[j]/y; }
    return -tmp + Math.log(2.5066282746310005*ser/x);
  }

  // beta incompleta regularizada (Numerical Recipes)
  function betacf(a,b,x){
    const MAXIT=200, EPS=3.0e-12, FPMIN=1.0e-30;
    const qab=a+b, qap=a+1, qam=a-1;
    let c=1, d=1-qab*x/qap;
    if(Math.abs(d)<FPMIN) d=FPMIN;
    d=1/d; let h=d;
    for(let m=1;m<=MAXIT;m++){
      const m2=2*m;
      let aa = m*(b-m)*x/((qam+m2)*(a+m2));
      d=1+aa*d; if(Math.abs(d)<FPMIN) d=FPMIN;
      c=1+aa/c; if(Math.abs(c)<FPMIN) c=FPMIN;
      d=1/d; h*=d*c;
      aa = -(a+m)*(qab+m)*x/((a+m2)*(qap+m2));
      d=1+aa*d; if(Math.abs(d)<FPMIN) d=FPMIN;
      c=1+aa/c; if(Math.abs(c)<FPMIN) c=FPMIN;
      d=1/d; const del=d*c; h*=del;
      if(Math.abs(del-1) < EPS) break;
    }
    return h;
  }
  function betai(a,b,x){
    if(x<0||x>1) return NaN;
    if(x===0||x===1) return x===0?0:1;
    const bt = Math.exp(lgamma(a+b)-lgamma(a)-lgamma(b)+a*Math.log(x)+b*Math.log(1-x));
    if(x < (a+1)/(a+b+2)) return bt*betacf(a,b,x)/a;
    else return 1 - bt*betacf(b,a,1-x)/b;
  }

  // CDF da t-Student
  function tCDF(t, df){
    if(df<=0) return NaN;
    const x = df/(df + t*t);
    const p = 0.5 * betai(df/2, 0.5, x);
    return t >= 0 ? 1 - p : p;
  }
  // CDF F
  function fCDF(f, df1, df2){
    if(f<=0) return 0;
    const x = (df1*f)/(df1*f + df2);
    return betai(df1/2, df2/2, x);
  }
  // CDF chi-quadrado (via série incomp. gamma de Numerical Recipes)
  function gser(a,x){
    const ITMAX=200, EPS=3e-12;
    if(x<=0) return 0;
    let ap=a, sum=1/a, del=sum;
    for(let n=1;n<=ITMAX;n++){
      ap+=1; del*=x/ap; sum+=del;
      if(Math.abs(del)<Math.abs(sum)*EPS) break;
    }
    return sum*Math.exp(-x + a*Math.log(x) - lgamma(a));
  }
  function gcf(a,x){
    const ITMAX=200, EPS=3e-12, FPMIN=1e-30;
    let b=x+1-a, c=1/FPMIN, d=1/b, h=d;
    for(let i=1;i<=ITMAX;i++){
      const an = -i*(i-a);
      b += 2; d = an*d + b; if(Math.abs(d)<FPMIN) d=FPMIN;
      c = b + an/c; if(Math.abs(c)<FPMIN) c=FPMIN;
      d=1/d; const del=d*c; h*=del;
      if(Math.abs(del-1)<EPS) break;
    }
    return Math.exp(-x + a*Math.log(x) - lgamma(a))*h;
  }
  function gammp(a,x){
    if(x<0||a<=0) return NaN;
    if(x<a+1) return gser(a,x);
    else return 1 - gcf(a,x);
  }
  function chi2CDF(x, df){ return gammp(df/2, x/2); }

  // Inversa da t (para IC) — método de Newton sobre tCDF
  function tInv(p, df){
    // chute inicial via aproximação normal
    let z = normalInv(p);
    let x = z + (z*z*z + z)/(4*df);
    for(let i=0;i<20;i++){
      const cdf = tCDF(x, df) - p;
      const pdf = Math.exp(lgamma((df+1)/2) - lgamma(df/2)) / (Math.sqrt(df*Math.PI)) * Math.pow(1+x*x/df, -(df+1)/2);
      const step = cdf/pdf;
      x -= step;
      if(Math.abs(step)<1e-8) break;
    }
    return x;
  }
  function normalInv(p){
    // Beasley-Springer-Moro
    const a=[-3.969683028665376e+1,2.209460984245205e+2,-2.759285104469687e+2,1.383577518672690e+2,-3.066479806614716e+1,2.506628277459239];
    const b=[-5.447609879822406e+1,1.615858368580409e+2,-1.556989798598866e+2,6.680131188771972e+1,-1.328068155288572e+1];
    const c=[-7.784894002430293e-3,-3.223964580411365e-1,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783];
    const d=[7.784695709041462e-3,3.224671290700398e-1,2.445134137142996,3.754408661907416];
    const plow=0.02425, phigh=1-plow;
    let q,r;
    if(p<plow){ q=Math.sqrt(-2*Math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
    if(p<=phigh){ q=p-0.5; r=q*q; return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1); }
    q=Math.sqrt(-2*Math.log(1-p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }

  // ===== OLS =====
  // X: matriz n×p (sem coluna de constante); intercept: bool
  function ols(X, y, options={}){
    const intercept = options.intercept !== false;
    const n = y.length;
    const p0 = X[0].length;
    // monta X com coluna 1
    const Xa = X.map((row,i) => intercept ? [1].concat(row) : row.slice());
    const k = Xa[0].length; // num parâmetros (inclui intercepto)
    const Xt = transpose(Xa);
    const XtX = matMul(Xt, Xa);
    const Xty = matVec(Xt, y);
    let XtXi;
    try { XtXi = matInv(XtX); }
    catch(e){ return { error: e.message }; }
    const beta = matVec(XtXi, Xty);
    const fitted = matVec(Xa, beta);
    const residuals = y.map((v,i) => v - fitted[i]);
    const rss = sum(residuals.map(r => r*r));
    const my = mean(y);
    const tss = sum(y.map(v => (v-my)*(v-my)));
    const r2 = 1 - rss/tss;
    const df_res = n - k;
    const df_mod = k - (intercept ? 1 : 0);
    const sigma2 = rss / df_res;
    const r2adj = 1 - (1-r2) * (n-1)/df_res;
    // EP e t
    const se = beta.map((b,i) => Math.sqrt(sigma2 * XtXi[i][i]));
    const tvals = beta.map((b,i) => b/se[i]);
    const pvals = tvals.map(t => 2*(1 - tCDF(Math.abs(t), df_res)));
    const tcrit = tInv(0.975, df_res);
    const ciLow  = beta.map((b,i) => b - tcrit*se[i]);
    const ciHigh = beta.map((b,i) => b + tcrit*se[i]);
    // F do modelo
    const f = (r2/df_mod) / ((1-r2)/df_res);
    const fp = 1 - fCDF(f, df_mod, df_res);

    return {
      n, k, df_mod, df_res,
      beta, se, t: tvals, p: pvals, ciLow, ciHigh,
      fitted, residuals,
      r2, r2adj, sigma2, rss, tss,
      f, fp,
      X: Xa, XtXi,
      hasIntercept: intercept
    };
  }

  // ===== VIF =====
  // Para cada coluna j em X (sem intercepto), roda OLS de Xj nas demais
  function vifAll(X){
    const p = X[0].length;
    const out = [];
    for(let j=0;j<p;j++){
      const y = X.map(row => row[j]);
      const Xr = X.map(row => row.filter((_,k) => k!==j));
      if(Xr[0].length === 0){ out.push(1); continue; }
      const res = ols(Xr, y);
      if(res.error){ out.push(NaN); continue; }
      const vif = 1 / (1 - res.r2);
      out.push(vif);
    }
    return out;
  }

  // ===== Diagnósticos =====
  function durbinWatson(resid){
    let num=0, den=0;
    for(let i=1;i<resid.length;i++){
      const d = resid[i]-resid[i-1];
      num += d*d;
    }
    for(let i=0;i<resid.length;i++) den += resid[i]*resid[i];
    return num/den;
  }

  function breuschPagan(model){
    // regredir resid^2 (escalado) em X; estat. = n * R²_aux ~ χ²(p-1)
    const n = model.n;
    const e2 = model.residuals.map(r => r*r);
    const sigma_hat2 = sum(e2)/n;
    const u = e2.map(v => v / sigma_hat2);
    const X_no_int = model.X.map(row => row.slice(model.hasIntercept ? 1 : 0));
    if(X_no_int[0].length === 0) return { lm: NaN, p: NaN, df: 0 };
    const aux = ols(X_no_int, u);
    if(aux.error) return { lm: NaN, p: NaN, df: 0 };
    // versão clássica: LM = (1/2) * SSR_explained com resid² centrado, ou simplificada:
    // Koenker (1981): n * R²_aux
    const lm = n * aux.r2;
    const df = X_no_int[0].length;
    const p = 1 - chi2CDF(lm, df);
    return { lm, p, df };
  }

  function jarqueBera(resid){
    const n = resid.length;
    const m = mean(resid);
    let m2=0, m3=0, m4=0;
    for(let i=0;i<n;i++){
      const d = resid[i]-m;
      m2 += d*d; m3 += d*d*d; m4 += d*d*d*d;
    }
    m2/=n; m3/=n; m4/=n;
    const skew = m3 / Math.pow(m2, 1.5);
    const kurt = m4 / (m2*m2) - 3;
    const jb = (n/6) * (skew*skew + (kurt*kurt)/4);
    const p = 1 - chi2CDF(jb, 2);
    return { jb, p, skew, kurt };
  }

  function cooksDistance(model){
    // D_i = (e_i² / (k*sigma²)) * (h_ii / (1-h_ii)²)
    // h_ii = diag(X (X'X)^-1 X')
    const X = model.X;
    const n = model.n, k = model.k;
    const sigma2 = model.sigma2;
    const XtXi = model.XtXi;
    const D = new Array(n);
    const H = new Array(n);
    for(let i=0;i<n;i++){
      const xi = X[i];
      // h_ii = xi' * XtXi * xi
      let h=0;
      for(let a=0;a<k;a++){
        let row=0;
        for(let b=0;b<k;b++) row += xi[b]*XtXi[b][a];
        h += row*xi[a];
      }
      H[i]=h;
      const ei = model.residuals[i];
      D[i] = (ei*ei / (k*sigma2)) * (h / ((1-h)*(1-h)));
    }
    return { D, H };
  }

  // ===== CSV parser simples =====
  function parseCSV(text){
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(/[,;\t]/).map(s => s.trim());
    const rows = [];
    for(let i=1;i<lines.length;i++){
      const vals = lines[i].split(/[,;\t]/).map(s => s.trim());
      if(vals.length !== headers.length) continue;
      const obj = {};
      headers.forEach((h,j) => {
        const v = vals[j].replace(',', '.');
        const num = parseFloat(v);
        obj[h] = isNaN(num) ? v : num;
      });
      rows.push(obj);
    }
    return { headers, rows };
  }

  // ===== Centralizar e padronizar =====
  function center(arr){ const m=mean(arr); return arr.map(v => v-m); }
  function zscore(arr){ const m=mean(arr), s=std(arr); return arr.map(v => (v-m)/s); }

  // ===== Formatadores =====
  function fmt(x, d=3){
    if(x===null||x===undefined||isNaN(x)) return '—';
    if(Math.abs(x) < 0.001 && x !== 0) return x.toExponential(2);
    return x.toFixed(d);
  }
  function fmtP(p){
    if(p===null||p===undefined||isNaN(p)) return '—';
    if(p < 0.001) return '< 0,001';
    return p.toFixed(3).replace('.', ',');
  }
  function stars(p){
    if(p < 0.001) return '***';
    if(p < 0.01)  return '**';
    if(p < 0.05)  return '*';
    if(p < 0.10)  return '·';
    return '';
  }

  // Expor
  global.Stats = {
    mean, variance, std, sum, correlation,
    transpose, matMul, matVec, matInv,
    erf, normalCDF, normalInv,
    tCDF, fCDF, chi2CDF, tInv,
    ols, vifAll,
    durbinWatson, breuschPagan, jarqueBera, cooksDistance,
    parseCSV, center, zscore,
    fmt, fmtP, stars
  };

})(window);
