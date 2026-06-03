export function dpr(canvas: HTMLCanvasElement) {
  const r = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * r;
  canvas.height = canvas.offsetHeight * r;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.scale(r, r);
  return ctx;
}

export function drawEquity(canvas: HTMLCanvasElement, start: number, end: number) {
  if (!canvas || !canvas.offsetWidth) return;
  const W = canvas.offsetWidth, H = canvas.offsetHeight || 160;
  const ctx = dpr(canvas);
  if (!ctx) return;
  
  const pts = Array.from({length: 60}, (_, i) => {
    const noise = (Math.random() - .4) * 0.03;
    return start + (end - start) * (i / 59) * Math.pow(1 + noise, i * .1) * (0.85 + Math.random() * .3);
  });
  pts.push(end);
  const mn = Math.min(...pts), mx = Math.max(...pts);
  const py = (v: number) => H - 10 - ((v - mn) / (mx - mn)) * (H - 20);
  const px = (i: number, len: number) => i / (len - 1) * W;
  ctx.clearRect(0, 0, W, H);
  
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = 'rgba(26,40,64,.5)';
    ctx.lineWidth = .5;
    ctx.beginPath();
    const y = 10 + i * (H - 20) / 3;
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(201,164,60,.2)');
  g.addColorStop(1, 'rgba(201,164,60,0)');
  ctx.beginPath();
  ctx.moveTo(0, H);
  pts.forEach((v, i) => ctx.lineTo(px(i, pts.length), py(v)));
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  
  ctx.beginPath();
  pts.forEach((v, i) => i ? ctx.lineTo(px(i, pts.length), py(v)) : ctx.moveTo(0, py(v)));
  ctx.strokeStyle = '#c9a43c';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawMonthly(canvas: HTMLCanvasElement) {
  if (!canvas || !canvas.offsetWidth) return;
  const W = canvas.offsetWidth, H = canvas.offsetHeight || 200;
  const ctx = dpr(canvas);
  if (!ctx) return;
  
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const vals = [6.2, 9.4, 4.8, 11.1, 7.3, 14.4, 10.2, 8.8, -2.1, 12.4, 9.3, 14.8];
  ctx.clearRect(0, 0, W, H);
  const bw = W / months.length * .55;
  const gap = W / months.length;
  const zero = H * .7;
  
  months.forEach((m, i) => {
    const x = i * gap + (gap - bw) / 2;
    const v = vals[i];
    const absMax = Math.max(...vals.map(Math.abs));
    const h = Math.abs(v / absMax) * zero * .9;
    const y = v > 0 ? zero - h : zero;
    
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    if (v > 0) {
      g.addColorStop(0, 'rgba(201,164,60,.9)');
      g.addColorStop(1, 'rgba(201,164,60,.2)');
    } else {
      g.addColorStop(0, 'rgba(255,77,107,.2)');
      g.addColorStop(1, 'rgba(255,77,107,.7)');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, bw, h, 3);
    else ctx.rect(x, y, bw, h);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(232,240,250,.45)';
    ctx.font = '10px var(--font-outfit), sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(m, x + bw / 2, H - 4);
    
    ctx.fillStyle = v > 0 ? 'rgba(201,164,60,.8)' : 'rgba(255,77,107,.8)';
    ctx.font = '9px var(--font-outfit), sans-serif';
    ctx.fillText((v > 0 ? '+' : '') + v + '%', x + bw / 2, v > 0 ? y - 4 : y + h + 10);
  });
  
  ctx.strokeStyle = 'rgba(26,40,64,.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, zero);
  ctx.lineTo(W, zero);
  ctx.stroke();
}

export function drawEquityDD(canvas: HTMLCanvasElement) {
  if (!canvas || !canvas.offsetWidth) return;
  const W = canvas.offsetWidth, H = canvas.offsetHeight || 180;
  const ctx = dpr(canvas);
  if (!ctx) return;
  
  const n = 80; const eq: number[] = []; let v = 20000;
  for (let i = 0; i < n; i++) { v += v * (Math.random()*.04-.012); eq.push(v); }
  eq[eq.length - 1] = 24830;
  
  const dd: number[] = []; let peak = eq[0];
  for (const e of eq) { if (e > peak) peak = e; dd.push(((e - peak) / peak) * 100); }
  const mn = Math.min(...dd);
  
  const pyeq = (val: number) => (H * .6 - 10) - ((val - Math.min(...eq)) / (Math.max(...eq) - Math.min(...eq))) * (H * .6 - 20);
  const pydd = (val: number) => (H - 10) - ((val - mn) / (0 - mn)) * (H * .4 - 10);
  const px = (i: number, len: number) => i / (len - 1) * W;
  
  ctx.clearRect(0, 0, W, H);
  
  const g = ctx.createLinearGradient(0, 0, 0, H * .6);
  g.addColorStop(0, 'rgba(201,164,60,.25)');
  g.addColorStop(1, 'rgba(201,164,60,0)');
  ctx.beginPath();
  ctx.moveTo(0, H * .6);
  eq.forEach((val, i) => ctx.lineTo(px(i, n), pyeq(val)));
  ctx.lineTo(W, H * .6);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  
  ctx.beginPath();
  eq.forEach((val, i) => i ? ctx.lineTo(px(i, n), pyeq(val)) : ctx.moveTo(0, pyeq(val)));
  ctx.strokeStyle = '#c9a43c';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  const g2 = ctx.createLinearGradient(0, H * .6, 0, H);
  g2.addColorStop(0, 'rgba(255,77,107,0)');
  g2.addColorStop(1, 'rgba(255,77,107,.3)');
  ctx.beginPath();
  ctx.moveTo(0, H * .6 + 10);
  dd.forEach((val, i) => ctx.lineTo(px(i, n), pydd(val)));
  ctx.lineTo(W, H * .6 + 10);
  ctx.closePath();
  ctx.fillStyle = g2;
  ctx.fill();
  
  ctx.beginPath();
  dd.forEach((val, i) => i ? ctx.lineTo(px(i, n), pydd(val)) : ctx.moveTo(0, pydd(val)));
  ctx.strokeStyle = 'rgba(255,77,107,.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.strokeStyle = 'rgba(26,40,64,.8)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, H * .6 + 5);
  ctx.lineTo(W, H * .6 + 5);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawDist(canvas: HTMLCanvasElement) {
  if (!canvas || !canvas.offsetWidth) return;
  const W = canvas.offsetWidth, H = canvas.offsetHeight || 180;
  const ctx = dpr(canvas);
  if (!ctx) return;
  
  const bins = [
    {l:'<-200',n:1,w:true},{l:'-200',n:2,w:true},{l:'-100',n:6,w:true},{l:'-50',n:6,w:true},
    {l:'0',n:0},{l:'+50',n:8,w:false},{l:'+100',n:9,w:false},{l:'+200',n:14,w:false},
    {l:'+300',n:8,w:false},{l:'+400',n:4,w:false},{l:'>500',n:2,w:false}
  ];
  
  const mx = Math.max(...bins.map(b => b.n));
  const bw = W / (bins.length + 1) * .6;
  const gap = W / (bins.length + 1);
  ctx.clearRect(0, 0, W, H);
  const H0 = H - 28;
  
  bins.forEach((b, i) => {
    const x = (i + .5) * gap + (gap - bw) / 2;
    const h = (b.n / mx) * (H0 - 10) || 0;
    const y = H0 - h;
    const g = ctx.createLinearGradient(0, y, 0, H0);
    if (b.w) {
      g.addColorStop(0, 'rgba(255,77,107,.8)');
      g.addColorStop(1, 'rgba(255,77,107,.2)');
    } else {
      g.addColorStop(0, 'rgba(0,212,160,.8)');
      g.addColorStop(1, 'rgba(0,212,160,.2)');
    }
    ctx.fillStyle = g;
    if (b.n > 0) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, bw, h, 3);
      else ctx.rect(x, y, bw, h);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(232,240,250,.4)';
    ctx.font = '9px var(--font-outfit), sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.l, x + bw / 2, H - 4);
    if (b.n > 0) {
      ctx.fillStyle = b.w ? 'rgba(255,77,107,.7)' : 'rgba(0,212,160,.7)';
      ctx.fillText(b.n.toString(), x + bw / 2, y - 3);
    }
  });
}

export function drawDD(canvas: HTMLCanvasElement) {
  if (!canvas || !canvas.offsetWidth) return;
  const W = canvas.offsetWidth, H = canvas.offsetHeight || 130;
  const ctx = dpr(canvas);
  if (!ctx) return;
  
  const n = 60; const dd: number[] = []; let peak = 1, v = 1;
  for (let i = 0; i < n; i++) {
    v += v * (Math.random()*.05-.015);
    if (v > peak) peak = v;
    dd.push(Math.min(0, ((v - peak) / peak) * 100));
  }
  const mn = Math.min(...dd, -0.1);
  const py = (val: number) => (H - 15) - ((val - mn) / (0 - mn)) * (H - 20);
  const px = (i: number, l: number) => i / (l - 1) * W;
  
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, py(0), 0, H);
  g.addColorStop(0, 'rgba(255,77,107,0)');
  g.addColorStop(1, 'rgba(255,77,107,.3)');
  ctx.beginPath();
  ctx.moveTo(0, py(0));
  dd.forEach((val, i) => ctx.lineTo(px(i, n), py(val)));
  ctx.lineTo(W, py(0));
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  
  ctx.beginPath();
  dd.forEach((val, i) => i ? ctx.lineTo(px(i, n), py(val)) : ctx.moveTo(0, py(val)));
  ctx.strokeStyle = 'rgba(255,77,107,.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  ctx.strokeStyle = 'rgba(26,40,64,.5)';
  ctx.lineWidth = .5;
  ctx.beginPath();
  ctx.moveTo(0, py(0));
  ctx.lineTo(W, py(0));
  ctx.stroke();
  
  ctx.fillStyle = 'rgba(232,240,250,.3)';
  ctx.font = '9px var(--font-outfit), sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('0%', W - 2, py(0) - 2);
  ctx.fillText(mn.toFixed(1) + '%', W - 2, H - 4);
}

export function drawSessionBar(canvas: HTMLCanvasElement) {
  if (!canvas || !canvas.offsetWidth) return;
  const W = canvas.offsetWidth, H = canvas.offsetHeight || 170;
  const ctx = dpr(canvas);
  if (!ctx) return;
  
  const sessions = ['00–04','04–08','08–12','12–16','16–20','20–24'];
  const wins = [62, 58, 78, 76, 71, 55];
  
  ctx.clearRect(0, 0, W, H);
  const bw = W / (sessions.length + 1) * .55;
  const gap = W / (sessions.length + 1);
  
  sessions.forEach((s, i) => {
    const x = (i + .5) * gap + (gap - bw) / 2;
    const h = (wins[i] / 100) * (H - 40);
    const y = H - 28 - h;
    const col = wins[i] >= 70 ? 'rgba(0,212,160,.7)' : wins[i] >= 62 ? 'rgba(201,164,60,.7)' : 'rgba(255,77,107,.5)';
    const g = ctx.createLinearGradient(0, y, 0, H - 28);
    g.addColorStop(0, col);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    if (ctx.roundRect) ctx.roundRect(x, y, bw, h, 3);
    else ctx.rect(x, y, bw, h);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(232,240,250,.45)';
    ctx.font = '9px var(--font-outfit), sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s + ' UTC', x + bw / 2, H - 6);
    
    ctx.fillStyle = wins[i] >= 70 ? 'rgba(0,212,160,.8)' : wins[i] >= 62 ? 'rgba(201,164,60,.8)' : 'rgba(255,77,107,.7)';
    ctx.font = '10px var(--font-outfit), sans-serif';
    ctx.fillText(wins[i] + '%', x + bw / 2, y - 4);
  });
}

export function drawAUM(canvas: HTMLCanvasElement) {
  if (!canvas || !canvas.offsetWidth) return;
  const W = canvas.offsetWidth, H = canvas.offsetHeight || 160;
  const ctx = dpr(canvas);
  if (!ctx) return;
  
  const pts = [1200000,1480000,1820000,2100000,2380000,2640000,2950000,3200000,3480000,3760000,4020000,4280000];
  const mn = Math.min(...pts), mx = Math.max(...pts);
  const py = (v: number) => H - 10 - ((v - mn) / (mx - mn)) * (H - 22);
  const px = (i: number, l: number) => i / (l - 1) * W;
  
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(201,164,60,.22)');
  g.addColorStop(1, 'rgba(201,164,60,0)');
  ctx.beginPath();
  ctx.moveTo(0, H);
  pts.forEach((v, i) => ctx.lineTo(px(i, pts.length), py(v)));
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  
  ctx.beginPath();
  pts.forEach((v, i) => i ? ctx.lineTo(px(i, pts.length), py(v)) : ctx.moveTo(0, py(v)));
  ctx.strokeStyle = '#c9a43c';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  ctx.fillStyle = 'rgba(232,240,250,.35)';
  ctx.font = '9px var(--font-outfit), sans-serif';
  ctx.textAlign = 'center';
  pts.forEach((_, i) => ctx.fillText(months[i], px(i, pts.length), H - 2));
}

export function drawBar(canvas: HTMLCanvasElement) {
  drawMonthly(canvas);
}
