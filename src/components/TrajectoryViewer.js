import { useState, useRef, useEffect, useMemo } from "react";

// ── Minimum Curvature ────────────────────────────────────────
function minCurv(rows) {
  const toR = d => d * Math.PI / 180;
  const pts = [{ md:0, tvd:0, north:0, east:0 }];
  let tvd=0, north=0, east=0;
  for (let i=1; i<rows.length; i++) {
    const [md1,i1,a1] = rows[i-1].map(Number);
    const [md2,i2,a2] = rows[i].map(Number);
    const dmd = md2 - md1;
    if (dmd <= 0) { pts.push({md:md2,tvd,north,east}); continue; }
    const ri1=toR(i1), ri2=toR(i2), ra1=toR(a1), ra2=toR(a2);
    const dl = Math.acos(Math.max(-1,Math.min(1,
      Math.cos(ri2-ri1) - Math.sin(ri1)*Math.sin(ri2)*(1-Math.cos(ra2-ra1)))));
    const rf = dl<1e-6 ? 1 : (2/dl)*Math.tan(dl/2);
    tvd   += (dmd/2)*(Math.cos(ri1)+Math.cos(ri2))*rf;
    north += (dmd/2)*(Math.sin(ri1)*Math.cos(ra1)+Math.sin(ri2)*Math.cos(ra2))*rf;
    east  += (dmd/2)*(Math.sin(ri1)*Math.sin(ra1)+Math.sin(ri2)*Math.sin(ra2))*rf;
    pts.push({md:md2,tvd,north,east});
  }
  return pts;
}

// Project a point onto a vertical plane defined by azimuth (degrees from North)
function projectVS(pt, azRad) {
  // horizontal distance along the azimuth direction
  return { vs: pt.north * Math.cos(azRad) + pt.east * Math.sin(azRad), tvd: pt.tvd };
}

const COLORS = ["#60a5fa","#34d399","#f87171","#fbbf24","#a78bfa","#f472b6","#38bdf8","#4ade80","#fb923c","#e879f9","#94a3b8","#facc15","#2dd4bf","#818cf8","#f43f5e"];

const WELLS = {
  A01:[[0,0,0],[20,0,0],[30,0.8,326.6],[40,1.6,3.6],[50,2.8,2.7],[60,4.2,2.78],[70,5.7,2.8],[80,7.7,2.9],[90,8.3,2.6],[100,10,2.6],[110,10.9,2.5],[120,12.7,2.6],[200,19.5,7.7],[214,20.81,9.7],[243,21.7,7.2],[290,29.8,3.29],[328,34.5,0.8],[356,37.1,4.3],[384,40.6,6.3],[413,42.4,5.9],[447,44.3,3.2],[470,44.1,3.4],[499,43.6,3.7],[528,47.8,5.2],[556,48.9,4.5],[584,48.7,3.9],[613,47.4,4.5],[641,45.8,4],[670,44.8,2.5],[698,44.2,1.2],[727,44.4,1.5],[756,44.4,1.8],[784,44.7,1.9],[813,45.3,2.6],[841,45.7,2.8],[869,46.1,3.3],[898,46.8,3.9],[927,47.3,4.5],[955,47.9,4.8],[980,48,6.3],[1000,48,6.3]],
  A02:[[0,0,0],[20,0,0],[30,0.1,340],[40,0.2,340],[50,0.1,350],[60,0.1,20],[70,0.1,50],[80,0.1,40],[90,0.1,70],[100,0.1,50],[110,0.1,20],[120,0.1,60],[192,0.3,133.9],[220.5,3.1,134.2],[267.4,5.08,64.11],[309.03,8.11,74.81],[350.06,11.5,75.11],[390.47,13.27,77],[431.47,16.37,73.87],[472.27,21.45,76.12],[512.94,24.81,74.63],[553.03,23.72,72.04],[594.3,22.89,78],[635.47,21.27,80.17],[676.23,19.66,76.42],[717.23,21.13,76.4],[757.71,22.15,76.99],[798.92,22.52,76.11],[837.51,24.34,75.11],[853.22,24.34,75.72],[877.59,23.09,74.04],[919.03,23.77,73.81],[960.18,23.06,75.97],[1000.67,23.23,77.22],[1041.77,23.07,75.83],[1082.29,25.5,76.92],[1123.47,28.22,79.33],[1163,32.08,84.84],[1205.18,36.43,85.43],[1244.52,40.8,87.63],[1285.66,44.69,90.57],[1327.42,49.27,91.63],[1368.02,54.49,93.68],[1408.76,58.82,95.8],[1455.81,63.69,95.09],[1489.45,67.05,95.41],[1528.26,71.56,95.67],[1570.6,76.26,96.15],[1612.41,78.08,96.6],[1653.26,79.43,96.83],[1672.56,79.74,96.65],[1725.83,78.71,97.06],[1766.81,78.78,96.13],[1806.64,78.82,96.18],[1847.24,78.68,97.17],[1888.21,78.73,96.64],[1929.62,78.2,96.94],[1970.22,78.38,96.38],[2010.58,78.78,96.46],[2051.91,78.73,97.03],[2065.47,78.75,96.5],[2091.47,78.75,96.5],[2132.47,78.75,96.5],[2173.63,78.81,95.16],[2215.12,78.77,95.08],[2254.67,78.55,95.71],[2296.72,78.8,95.44],[2338.02,78.69,95.66],[2378.17,78.88,96.42],[2419.8,78.75,96.41],[2460.39,78.6,96.24],[2500.88,78.69,96.5],[2541.3,79.48,96.6],[2581.57,79.45,96.74],[2622.22,79.38,96.6],[2663.63,79.66,96.89],[2704.52,79.03,96.94],[2744.7,78.58,95.36],[2785.53,78.49,96.53],[2825.66,78.67,96.4],[2865.61,78.42,96.83],[2907.88,78.87,96.69],[2948.59,79.11,96.39],[2989.36,79.01,96.72],[3029.18,80.49,98.39],[3071.06,81.42,98.55],[3077.24,82.01,98.64],[3125.29,87.01,100.29]],
  A03:[[0,0,0],[20,0,0],[30,0.3,151.2],[40,0.3,140.7],[50,1,130.1],[60,3.2,127.6],[70,4.8,127.1],[80,6.7,127.1],[90,8.3,127.1],[100,9.6,127.6],[110,10.8,128],[120,12.2,128.1],[123,12.57,128.1],[191,20.5,130.3],[219,21.4,121.8],[220,25.1,130.3],[247.5,27.8,116.8],[277.5,38.3,128.4],[304,42.2,121.7],[365,53.8,129.1],[417,59,135.7],[475,59.2,140],[522,60.9,144],[563,60,145],[592,59.5,155.8],[649,60.4,148.2],[706,60.1,154.3],[762,58.8,157.5],[847,56.1,154],[932.5,59.3,151.6],[1018,59.7,151.6],[1105,60.6,152.4],[1205,60.5,153]],
  A04:[[0,0,0],[121.92,1,250],[195.07,3.93,269],[256.03,7.33,235],[335.28,12.75,206],[426.72,20,194],[518.16,27,191],[609.6,35,197],[701.04,43.75,196],[792.48,48.75,194],[883.92,53,192],[975.36,52.25,192],[1066.8,47.25,190],[1158.24,51,192],[1249.68,55.25,193],[1341.12,54,193],[1432.56,53,193],[1524,53.75,192],[1615.44,52.25,192],[1706.88,50,197],[1798.32,49.5,197],[1889.76,48.75,197],[1981.2,47.5,197],[2072.64,51,199],[2164.08,49.5,194],[2255.52,50,195],[2316.48,48.5,196]],
  A05:[[0,0,0],[20,0,0],[30,0.3,151.2],[40,0.3,140.7],[50,1,130.1],[60,3.2,127.6],[70,4.8,127.1],[80,6.7,127.1],[90,8.3,127.1],[100,9.6,127.6],[110,10.8,128],[120,12.2,128.1],[191,20.5,130.3],[247.5,27.8,116.8],[304,42.2,121.7],[417,59,135.7],[522,60.9,144],[649,60.4,148.2],[819,56.3,155],[989,59.3,151.7],[1128.5,60.8,152.6],[1205,60.5,153]],
  A06:[[0,0,0],[20,0,0],[30,0.2,201.8],[40,1.1,300.8],[120,12,306.4],[163,12.75,303],[243,23.5,310.5],[328,34.3,311.3],[413,47.3,310.9],[471,58.2,310.9],[527,61.6,310],[611,65,310.3],[697,64.3,310.6],[782,61.8,310.6],[869,62.4,309.9],[955,64.2,310.7],[1046,65.4,310.8],[1210,65.1,311.4]],
  A07:[[0,0,0],[20,0,0],[120,0.2,105.4],[184,0.3,75],[231,4.1,4],[288,12.2,3.5],[345,16.5,15.8],[409,22.4,20.42],[489,26,20.7],[574,32.6,13],[659,33.2,13.4],[733,33.2,16.7],[774,33.2,16.7]],
  A08:[[0,0,0],[9.2,52.9,159.2],[507,56.15,161.04],[560,59.7,153.6],[617,57.1,156.5],[702,56.9,157.6],[789,55.2,159.2],[874,52.8,158.7],[940,52.5,159.3]],
  A09:[[0,0,0],[20,0,0],[120,15.8,194.1],[205,24.9,195.6],[310,39.5,186.8],[452,54.9,182.6],[565,66.8,187.3],[679,68,184.2],[794,67.6,186.4],[936,69.3,184.1],[1050,68.9,186.1],[1191,68.7,184.2],[1361,68.1,185.8],[1484,68,185]],
  A10:[[0,0,0],[28,0.58,207.15],[98,16.71,197.32],[182,36.54,189],[284.56,46.62,189.15],[379.41,60.4,181.81],[473.93,71.29,173.87],[550.09,79.36,169.9],[634.65,79.44,166.05],[729.67,80.52,166.86],[821.62,79.26,165.84],[908.13,80.05,164.78],[1001.97,78.15,167.76],[1097.22,80.49,166.58],[1191.51,79.91,167.37],[1287.3,80.09,167.04],[1381.99,79.47,166.15],[1475.97,80.08,165.1],[1571.15,80.09,163.55],[1665.84,77.89,161.83],[1760.73,75.78,161.59],[1822,75,160.8]],
  A11:[[0,0,0],[10,0,40],[123,12.8,40],[219,16,48.6],[304,24.7,68.8],[405,25.8,75.1],[504,27.8,67.7],[619,27,66.8],[704,26.3,68.3]],
  A12:[[0,0,0],[20,0,0],[30,0.2,201.8],[120,12,306.4],[124.4,19.14,345.4],[276,42.2,338.6],[390.5,50.5,338.2],[505,54.6,335],[590,58.7,337.6],[703,58.5,336.2],[818,56.3,336],[933,56.8,335],[1076,56.5,335.8],[1182,55.1,336.8]],
  AA13:[[0,0,0],[119.98,1.98,55.9],[148,2.1,65.4],[175,2.34,58.85],[202,2.16,57.05],[230,1.82,55.98]],
  AA14:[[0,0,0],[119.98,1.98,55.9],[139.29,2.45,55.86],[158.53,2.92,84.13],[177.85,3.16,81.29],[197.21,4.33,87.66],[216.5,5.67,92.35],[223.23,6.05,92.83]],
  AA16:[[0,0,0],[83.77,0,0],[112.77,1.57,54.12],[155.9,0.25,25.16],[311.63,0.12,319.49],[776.32,0.49,327.82],[927.47,4.5,285.65],[1223.42,11.99,297.92],[1529,29.97,293.8],[1906.1,30.8,293.54],[2238.3,31.12,294.81],[2626.51,30.86,302.49],[3014.44,30.81,293.39],[3395.6,29.86,278.12],[3793.4,30.25,273.2],[4168.36,29.26,270.81],[4306.39,28.86,273.68],[4878.05,30.68,270.25],[5123.57,23.56,261.83],[5372.28,19.64,267.64]],
  AA18:[[0,0,0],[83.77,0,0],[112.78,2.03,53.15],[230.24,0.45,33.1],[297.2,4.75,90.78],[483.66,11.76,117.25],[726.1,23.7,117.34],[973.67,34.75,116.48],[1195.06,47.6,121.21],[1524.52,63.6,118.53],[1766.82,73.32,120.49],[2035.23,74.19,121.63],[2326.01,74.04,121.7],[2689.5,76.28,118.73],[2820.82,84.99,108.68],[3018.5,88.16,108.22],[3124.49,86.99,107.19],[3300.62,91,107.53],[3750,90,104.5]],
  Deep:[[0,0,0],[83.77,0,0],[112.77,1.68,45.76],[175.73,2.29,12.43],[204.66,3.64,58.1],[224.04,3.55,60.69],[237.12,2.26,58.6],[287.86,6.79,61.12],[316.67,8.01,60.45],[345.58,8.29,78.29],[375,8.5,95],[382.5,9,98]],
};

const WELL_NAMES = Object.keys(WELLS);

// ── Plan view (North vs East, top-down) ──────────────────────
function ViewPlan({ trajectories }) {
  const all = trajectories.flatMap(t => t.pts);
  if (!all.length) return null;
  const xs = all.map(p=>p.east), ys = all.map(p=>p.north);
  const [x0,x1]=[Math.min(...xs),Math.max(...xs)];
  const [y0,y1]=[Math.min(...ys),Math.max(...ys)];
  const pad=44, W=580, H=400;
  const dx=x1-x0||1, dy=y1-y0||1;
  const scale=Math.min((W-pad*2)/dx,(H-pad*2)/dy);
  const cx=p=>pad+(p.east-x0)*scale;
  const cy=p=>H-pad-(p.north-y0)*scale; // N up
  const ticks=(lo,hi,n=5)=>Array.from({length:n+1},(_,i)=>lo+(hi-lo)*i/n);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{background:"#111827",borderRadius:8}}>
      {ticks(x0,x1).map((v,i)=><line key={i} x1={cx({east:v})} y1={pad} x2={cx({east:v})} y2={H-pad} stroke="#1f2937" strokeWidth="1"/>)}
      {ticks(y0,y1).map((v,i)=><line key={i} x1={pad} y1={cy({north:v})} x2={W-pad} y2={cy({north:v})} stroke="#1f2937" strokeWidth="1"/>)}
      <line x1={pad} y1={H-pad} x2={W-pad} y2={H-pad} stroke="#374151" strokeWidth="1.5"/>
      <line x1={pad} y1={pad} x2={pad} y2={H-pad} stroke="#374151" strokeWidth="1.5"/>
      {ticks(x0,x1).map((v,i)=><text key={i} x={cx({east:v})} y={H-pad+14} textAnchor="middle" fill="#6b7280" fontSize="9">{Math.round(v)}</text>)}
      {ticks(y0,y1).map((v,i)=><text key={i} x={pad-4} y={cy({north:v})+3} textAnchor="end" fill="#6b7280" fontSize="9">{Math.round(v)}</text>)}
      <text x={W/2} y={H-4} textAnchor="middle" fill="#9ca3af" fontSize="10">East (m)</text>
      <text x={12} y={H/2} textAnchor="middle" fill="#9ca3af" fontSize="10" transform={`rotate(-90,12,${H/2})`}>North (m)</text>
      {/* N arrow */}
      <text x={W-pad+4} y={pad+2} fill="#facc15" fontSize="11" fontWeight="bold">N↑</text>
      {trajectories.map(t=>{
        const d=t.pts.map((p,j)=>`${j===0?"M":"L"}${cx(p)},${cy(p)}`).join(" ");
        const last=t.pts[t.pts.length-1];
        return (
          <g key={t.name}>
            <path d={d} fill="none" stroke={t.color} strokeWidth="1.5" opacity="0.9"/>
            <circle cx={cx(t.pts[0])} cy={cy(t.pts[0])} r="3" fill={t.color}/>
            <circle cx={cx(last)} cy={cy(last)} r="3" fill={t.color}/>
            <text x={cx(last)+4} y={cy(last)-3} fill={t.color} fontSize="8" fontWeight="bold">{t.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Vertical Section view ────────────────────────────────────
function ViewSection({ trajectories, azimuthDeg }) {
  const azRad = azimuthDeg * Math.PI / 180;
  const projected = trajectories.map(t => ({
    ...t,
    vsPts: t.pts.map(p => projectVS(p, azRad)),
  }));
  const all = projected.flatMap(t => t.vsPts);
  if (!all.length) return null;
  const xs=all.map(p=>p.vs), ys=all.map(p=>p.tvd);
  const [x0,x1]=[Math.min(...xs),Math.max(...xs)];
  const [y0,y1]=[0, Math.max(...ys)]; // TVD starts at 0
  const pad=44, W=580, H=420;
  const dx=x1-x0||1, dy=y1-y0||1;
  const scale=Math.min((W-pad*2)/dx,(H-pad*2)/dy);
  const cx=p=>pad+(p.vs-x0)*scale;
  const cy=p=>pad+(p.tvd-y0)*scale; // TVD increases downward
  const ticks=(lo,hi,n=5)=>Array.from({length:n+1},(_,i)=>lo+(hi-lo)*i/n);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{background:"#111827",borderRadius:8}}>
      {ticks(x0,x1).map((v,i)=><line key={i} x1={cx({vs:v})} y1={pad} x2={cx({vs:v})} y2={H-pad} stroke="#1f2937" strokeWidth="1"/>)}
      {ticks(y0,y1).map((v,i)=><line key={i} x1={pad} y1={cy({tvd:v})} x2={W-pad} y2={cy({tvd:v})} stroke="#1f2937" strokeWidth="1"/>)}
      <line x1={pad} y1={pad} x2={W-pad} y2={pad} stroke="#374151" strokeWidth="1.5"/>
      <line x1={pad} y1={pad} x2={pad} y2={H-pad} stroke="#374151" strokeWidth="1.5"/>
      {ticks(x0,x1).map((v,i)=><text key={i} x={cx({vs:v})} y={pad-6} textAnchor="middle" fill="#6b7280" fontSize="9">{Math.round(v)}</text>)}
      {ticks(y0,y1).map((v,i)=><text key={i} x={pad-4} y={cy({tvd:v})+3} textAnchor="end" fill="#6b7280" fontSize="9">{Math.round(v)}</text>)}
      <text x={W/2} y={H-4} textAnchor="middle" fill="#9ca3af" fontSize="10">VS along {Math.round(azimuthDeg)}° (m)</text>
      <text x={12} y={H/2} textAnchor="middle" fill="#9ca3af" fontSize="10" transform={`rotate(-90,12,${H/2})`}>TVD (m) ↓</text>
      {projected.map(t=>{
        const d=t.vsPts.map((p,j)=>`${j===0?"M":"L"}${cx(p)},${cy(p)}`).join(" ");
        const last=t.vsPts[t.vsPts.length-1];
        return (
          <g key={t.name}>
            <path d={d} fill="none" stroke={t.color} strokeWidth="1.5" opacity="0.9"/>
            <circle cx={cx(t.vsPts[0])} cy={cy(t.vsPts[0])} r="3" fill={t.color}/>
            <circle cx={cx(last)} cy={cy(last)} r="3" fill={t.color}/>
            <text x={cx(last)+4} y={cy(last)-3} fill={t.color} fontSize="8" fontWeight="bold">{t.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── 3D canvas viewer ─────────────────────────────────────────
function View3D({ trajectories }) {
  const cvs = useRef(null);
  const st  = useRef({ rx:-30, ry:20, dragging:false, lx:0, ly:0, zoom:1.0 });

  const draw = () => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext("2d");
    const W=c.width, H=c.height;
    const {rx,ry,zoom} = st.current;
    ctx.fillStyle="#0f172a"; ctx.fillRect(0,0,W,H);

    const all = trajectories.flatMap(t=>t.pts);
    if (!all.length) return;

    // centre of mass
    const avgN=all.reduce((s,p)=>s+p.north,0)/all.length;
    const avgE=all.reduce((s,p)=>s+p.east,0)/all.length;
    const avgT=all.reduce((s,p)=>s+p.tvd,0)/all.length;

    // spread
    const maxR = Math.max(1,...all.map(p=>Math.sqrt(
      (p.east-avgE)**2+(p.north-avgN)**2+(p.tvd-avgT)**2)));
    const scale = Math.min(W,H)*0.38/maxR*zoom;

    const rxR=rx*Math.PI/180, ryR=ry*Math.PI/180;
    const project = (e,n,t) => {
      // centre
      const x=e-avgE, y=-(t-avgT), z=n-avgN;
      // rotate Y then X
      const x1= x*Math.cos(ryR)+z*Math.sin(ryR);
      const z1=-x*Math.sin(ryR)+z*Math.cos(ryR);
      const y2= y*Math.cos(rxR)-z1*Math.sin(rxR);
      const z2= y*Math.sin(rxR)+z1*Math.cos(rxR);
      // simple orthographic (no fisheye distortion at high zoom)
      return [W/2+x1*scale, H/2+y2*scale, z2];
    };

    // depth-sort trajectories by average Z so far ones are drawn first
    const sorted = [...trajectories].map(t=>{
      const zs=t.pts.map(p=>project(p.east,p.north,p.tvd)[2]);
      return {...t, avgZ: zs.reduce((a,b)=>a+b,0)/(zs.length||1)};
    }).sort((a,b)=>b.avgZ-a.avgZ);

    // grid on the "ground" plane (TVD = max)
    const maxTVD = Math.max(...all.map(p=>p.tvd));
    const gridSteps = 5;
    const eMin=Math.min(...all.map(p=>p.east)), eMax=Math.max(...all.map(p=>p.east));
    const nMin=Math.min(...all.map(p=>p.north)), nMax=Math.max(...all.map(p=>p.north));
    ctx.strokeStyle="#1e293b"; ctx.lineWidth=1;
    for (let i=0;i<=gridSteps;i++) {
      const e=eMin+(eMax-eMin)*i/gridSteps;
      const [ax,ay]=project(e,nMin,maxTVD), [bx,by]=project(e,nMax,maxTVD);
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
      const n=nMin+(nMax-nMin)*i/gridSteps;
      const [cx2,cy2]=project(eMin,n,maxTVD), [dx2,dy2]=project(eMax,n,maxTVD);
      ctx.beginPath(); ctx.moveTo(cx2,cy2); ctx.lineTo(dx2,dy2); ctx.stroke();
    }

    // axes from centroid surface
    const axLen=maxR*0.3;
    [
      [avgE+axLen, avgN, 0, "#ef4444","E"],
      [avgE, avgN+axLen, 0, "#22c55e","N"],
      [avgE, avgN, axLen, "#60a5fa","TVD↓"],
    ].forEach(([e,n,t,col,lbl])=>{
      const [ox,oy]=project(avgE,avgN,0);
      const [ex,ey]=project(e,n,t);
      ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ex,ey);
      ctx.strokeStyle=col; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle=col; ctx.font="bold 11px sans-serif"; ctx.fillText(lbl,ex+4,ey);
    });

    // trajectories
    sorted.forEach(t=>{
      if (t.pts.length<2) return;
      ctx.beginPath();
      t.pts.forEach((p,i)=>{
        const [sx,sy]=project(p.east,p.north,p.tvd);
        i===0 ? ctx.moveTo(sx,sy) : ctx.lineTo(sx,sy);
      });
      ctx.strokeStyle=t.color; ctx.lineWidth=2; ctx.globalAlpha=0.95; ctx.stroke();
      ctx.globalAlpha=1;
      // TD label
      const last=t.pts[t.pts.length-1];
      const [lx,ly]=project(last.east,last.north,last.tvd);
      ctx.fillStyle=t.color; ctx.font="bold 9px sans-serif";
      ctx.fillText(t.name,lx+3,ly-3);
      // surface dot
      const [sx,sy]=project(t.pts[0].east,t.pts[0].north,t.pts[0].tvd);
      ctx.beginPath(); ctx.arc(sx,sy,3,0,Math.PI*2);
      ctx.fillStyle=t.color; ctx.fill();
    });
  };

  useEffect(()=>{draw();},[trajectories]);

  const pos = e => e.touches ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY];
  const onDown = e => { st.current.dragging=true; [st.current.lx,st.current.ly]=pos(e); };
  const onMove = e => {
    if (!st.current.dragging) return;
    const [x,y]=pos(e);
    st.current.ry+=(x-st.current.lx)*0.4;
    st.current.rx+=(y-st.current.ly)*0.4;
    st.current.lx=x; st.current.ly=y;
    draw();
  };
  const onUp   = ()=>{ st.current.dragging=false; };
  const onWheel= e=>{ e.preventDefault(); st.current.zoom=Math.max(0.15,Math.min(20,st.current.zoom*(e.deltaY<0?1.12:0.9))); draw(); };
  const reset  = ()=>{ st.current.rx=-30; st.current.ry=20; st.current.zoom=1; draw(); };

  return (
    <div className="relative">
      <canvas ref={cvs} width={680} height={460}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        onWheel={onWheel}
        style={{cursor:"grab",borderRadius:8,width:"100%",background:"#0f172a"}}/>
      <div style={{position:"absolute",top:8,right:8,display:"flex",gap:6,alignItems:"center"}}>
        <span style={{fontSize:10,color:"#475569"}}>Drag · Scroll to zoom</span>
        <button onClick={reset} style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:"#334155",color:"#94a3b8",border:"none",cursor:"pointer"}}>Reset view</button>
      </div>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────
function Legend({ trajs }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {trajs.map(t=>(
        <div key={t.name} className="flex items-center gap-1.5 px-2 py-0.5 rounded" style={{background:"#1f2937",fontSize:11}}>
          <div style={{width:12,height:3,borderRadius:2,background:t.color}}/>
          <span style={{color:t.color}}>{t.name}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function TrajectoryViewer({ onClose }) {
  const [view, setView]       = useState("plan");
  const [selected, setSelected] = useState(new Set(WELL_NAMES));
  const [azimuth, setAzimuth] = useState(96); // default ~mean azimuth of field
  const [azInput, setAzInput] = useState("96");

  const trajectories = useMemo(()=>WELL_NAMES
    .filter(n=>selected.has(n))
    .map((name,i)=>({ name, color:COLORS[i%COLORS.length], pts:minCurv(WELLS[name]) })),
  [selected]);

  const toggle = n=>setSelected(p=>{const s=new Set(p);s.has(n)?s.delete(n):s.add(n);return s;});

  const applyAz = () => {
    const v = parseFloat(azInput);
    if (!isNaN(v)) setAzimuth(((v%360)+360)%360);
  };

  const btn = (active) => ({
    padding:"4px 12px", borderRadius:6, fontWeight:600, fontSize:12,
    border:"none", cursor:"pointer",
    background: active?"#3b82f6":"#334155",
    color: active?"#fff":"#94a3b8",
  });

  return (
    <div style={{background:"#0f172a",color:"#f1f5f9",minHeight:"100vh",fontFamily:"system-ui,sans-serif",fontSize:13}}>

      {/* Header */}
      <div style={{background:"#1e293b",borderBottom:"1px solid #334155",padding:"10px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <span style={{fontWeight:900,fontSize:16,color:"#facc15"}}>BOTF</span>
        <span style={{fontWeight:700,color:"#e2e8f0"}}>Trajectory Viewer</span>
        <div style={{display:"flex",gap:8,marginLeft:"auto",flexWrap:"wrap",alignItems:"center"}}>
          {["plan","section","3d"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={btn(view===v)}>
              {v==="plan"?"🗺 Plan":v==="section"?"📐 Vertical Section":"🧊 3D View"}
            </button>
          ))}
          {onClose && <button onClick={onClose} style={{...btn(false),marginLeft:8}}>✕ Close</button>}
        </div>
      </div>

      <div style={{display:"flex",minHeight:"calc(100vh - 49px)"}}>

        {/* Sidebar */}
        <div style={{width:148,background:"#1e293b",borderRight:"1px solid #334155",padding:"10px 8px",flexShrink:0,overflowY:"auto"}}>
          <div style={{fontSize:10,color:"#64748b",marginBottom:6,fontWeight:700,textTransform:"uppercase"}}>Wells</div>
          <div style={{display:"flex",gap:4,marginBottom:8}}>
            <button onClick={()=>setSelected(new Set(WELL_NAMES))} style={{flex:1,fontSize:10,padding:"2px 0",borderRadius:4,background:"#334155",color:"#94a3b8",border:"none",cursor:"pointer"}}>All</button>
            <button onClick={()=>setSelected(new Set())} style={{flex:1,fontSize:10,padding:"2px 0",borderRadius:4,background:"#334155",color:"#94a3b8",border:"none",cursor:"pointer"}}>None</button>
          </div>
          {WELL_NAMES.map((n,i)=>(
            <div key={n} onClick={()=>toggle(n)}
              style={{display:"flex",alignItems:"center",gap:6,padding:"3px 4px",borderRadius:4,cursor:"pointer",marginBottom:2,
                background:selected.has(n)?"#1f2937":"transparent",opacity:selected.has(n)?1:0.4}}>
              <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,background:COLORS[i%COLORS.length]}}/>
              <span style={{fontSize:11,color:selected.has(n)?COLORS[i%COLORS.length]:"#64748b",fontWeight:600}}>{n}</span>
            </div>
          ))}

          {/* Azimuth control — only for section view */}
          {view==="section" && (
            <div style={{marginTop:16,borderTop:"1px solid #334155",paddingTop:12}}>
              <div style={{fontSize:10,color:"#64748b",marginBottom:6,fontWeight:700,textTransform:"uppercase"}}>Section Azimuth</div>
              <input
                type="number" min="0" max="360" step="1"
                value={azInput}
                onChange={e=>setAzInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&applyAz()}
                style={{width:"100%",background:"#0f172a",border:"1px solid #334155",color:"#f1f5f9",
                  borderRadius:4,padding:"4px 6px",fontSize:12,marginBottom:6}}/>
              <button onClick={applyAz}
                style={{width:"100%",background:"#3b82f6",color:"#fff",border:"none",borderRadius:4,
                  padding:"4px 0",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                Apply
              </button>
              <div style={{fontSize:10,color:"#475569",marginTop:4}}>Current: {Math.round(azimuth)}°</div>
              {/* Quick presets */}
              <div style={{fontSize:10,color:"#64748b",marginTop:8,marginBottom:4}}>Presets</div>
              {[["N–S",0],["E–W",90],["NE",45],["SE",135]].map(([lbl,az])=>(
                <button key={lbl} onClick={()=>{setAzimuth(az);setAzInput(String(az));}}
                  style={{marginRight:4,marginBottom:4,fontSize:10,padding:"2px 6px",borderRadius:4,
                    background:Math.round(azimuth)===az?"#3b82f6":"#334155",
                    color:Math.round(azimuth)===az?"#fff":"#94a3b8",border:"none",cursor:"pointer"}}>
                  {lbl}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main */}
        <div style={{flex:1,padding:16,overflowY:"auto"}}>
          <div style={{marginBottom:8,fontSize:11,color:"#64748b"}}>
            {trajectories.length} well{trajectories.length!==1?"s":""} · 
            {view==="plan"    && " Plan view — North up"}
            {view==="section" && ` Vertical section along ${Math.round(azimuth)}° azimuth — TVD increases downward`}
            {view==="3d"      && " 3D view — drag to rotate, scroll to zoom"}
          </div>

          {view==="plan"    && <ViewPlan    trajectories={trajectories}/>}
          {view==="section" && <ViewSection trajectories={trajectories} azimuthDeg={azimuth}/>}
          {view==="3d"      && <View3D      trajectories={trajectories}/>}

          <Legend trajs={trajectories}/>

          <div style={{marginTop:16,display:"flex",flexWrap:"wrap",gap:8}}>
            {trajectories.map(t=>{
              const last=t.pts[t.pts.length-1];
              return (
                <div key={t.name} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:6,padding:"6px 10px",minWidth:130}}>
                  <div style={{fontWeight:700,fontSize:11,color:t.color,marginBottom:3}}>{t.name}</div>
                  <div style={{fontSize:10,color:"#94a3b8"}}>MD: {Math.round(last.md)} m</div>
                  <div style={{fontSize:10,color:"#94a3b8"}}>TVD: {Math.round(last.tvd)} m</div>
                  <div style={{fontSize:10,color:"#94a3b8"}}>N: {Math.round(last.north)} m</div>
                  <div style={{fontSize:10,color:"#94a3b8"}}>E: {Math.round(last.east)} m</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}