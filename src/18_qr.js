/* ===== QR-код без бібліотек: байтовий режим, рівень M (або L, якщо не вміщається), версії 1–10 =====
   За алгоритмом специфікації ISO/IEC 18004 (у викладі Nayuki). Повертає матрицю й SVG-шлях у модулях. */
const qrCode = (()=>{
  const ECC={L:[7,10,15,20,26,18,20,24,30,18],M:[10,16,26,18,24,16,18,22,22,26]}, NB={L:[1,1,1,1,1,2,2,2,2,4],M:[1,1,1,2,2,4,4,4,5,5]}, FMT={L:1,M:0};
  const raw=v=>{ let r=(16*v+128)*v+64; if(v>=2){ const na=Math.floor(v/7)+2; r-=(25*na-10)*na-55; if(v>=7) r-=36; } return r; };
  const dataCW=(v,e)=>Math.floor(raw(v)/8)-ECC[e][v-1]*NB[e][v-1];
  const mul=(x,y)=>{ let z=0; for(let i=7;i>=0;i--){ z=(z<<1)^((z>>>7)*0x11D); z^=((y>>>i)&1)*x; } return z; };
  function rsDiv(n){ const r=new Array(n-1).fill(0).concat([1]); let root=1; for(let i=0;i<n;i++){ for(let j=0;j<r.length;j++){ r[j]=mul(r[j],root); if(j+1<r.length) r[j]^=r[j+1]; } root=mul(root,2); } return r; }
  function rsRem(data,div){ const r=div.map(()=>0); for(const b of data){ const f=b^r.shift(); r.push(0); div.forEach((c,i)=>r[i]^=mul(c,f)); } return r; }
  function alignPos(v){ if(v===1) return []; const n=Math.floor(v/7)+2, step=Math.ceil((v*4+4)/(n*2-2))*2, r=[6]; for(let p=v*4+10;r.length<n;p-=step) r.splice(1,0,p); return r; }
  function encode(text){ const bytes=[...new TextEncoder().encode(String(text))]; let ver=0, ecl="M";
    for(const e of ["M","L"]){ for(let v=1;v<=10;v++){ if(4+(v<10?8:16)+bytes.length*8<=dataCW(v,e)*8){ ver=v; break; } } if(ver){ ecl=e; break; } }
    if(!ver) return null;
    const bits=[], put=(val,n)=>{ for(let i=n-1;i>=0;i--) bits.push((val>>>i)&1); };
    put(4,4); put(bytes.length,ver<10?8:16); for(const b of bytes) put(b,8);
    const cap=dataCW(ver,ecl)*8; put(0,Math.min(4,cap-bits.length)); put(0,(8-bits.length%8)%8);
    for(let pad=0xEC;bits.length<cap;pad^=0xEC^0x11) put(pad,8);
    const data=[]; for(let i=0;i<bits.length;i+=8) data.push(parseInt(bits.slice(i,i+8).join(""),2));
    // блоки й корекція помилок
    const nb=NB[ecl][ver-1], el=ECC[ecl][ver-1], rc=Math.floor(raw(ver)/8), ns=nb-rc%nb, sl=Math.floor(rc/nb), dv=rsDiv(el), blocks=[];
    for(let i=0,k=0;i<nb;i++){ const dat=data.slice(k,k+sl-el+(i<ns?0:1)); k+=dat.length; const ec=rsRem(dat,dv); if(i<ns) dat.push(0); blocks.push(dat.concat(ec)); }
    const cw=[]; for(let i=0;i<blocks[0].length;i++) blocks.forEach((b,j)=>{ if(i!==sl-el||j>=ns) cw.push(b[i]); });
    // матриця: службові візерунки
    const n=ver*4+17, M=[...Array(n)].map(()=>Array(n).fill(false)), F=[...Array(n)].map(()=>Array(n).fill(false));
    const set=(x,y,dk)=>{ M[y][x]=dk; F[y][x]=true; };
    for(let i=0;i<n;i++){ set(6,i,i%2===0); set(i,6,i%2===0); }
    for(const [fx,fy] of [[3,3],[n-4,3],[3,n-4]]) for(let dy=-4;dy<=4;dy++) for(let dx=-4;dx<=4;dx++){ const x=fx+dx, y=fy+dy; if(x>=0&&x<n&&y>=0&&y<n){ const dist=Math.max(Math.abs(dx),Math.abs(dy)); set(x,y,dist!==2&&dist!==4); } }
    const ap=alignPos(ver), na=ap.length;
    for(let i=0;i<na;i++) for(let j=0;j<na;j++){ if((i===0&&j===0)||(i===0&&j===na-1)||(i===na-1&&j===0)) continue; for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) set(ap[i]+dx,ap[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1); }
    const fmt=mask=>{ const d=FMT[ecl]<<3|mask; let r=d; for(let i=0;i<10;i++) r=(r<<1)^((r>>>9)*0x537); const b=(d<<10|r)^0x5412, g=i=>((b>>>i)&1)===1;
      for(let i=0;i<=5;i++) set(8,i,g(i)); set(8,7,g(6)); set(8,8,g(7)); set(7,8,g(8)); for(let i=9;i<15;i++) set(14-i,8,g(i));
      for(let i=0;i<8;i++) set(n-1-i,8,g(i)); for(let i=8;i<15;i++) set(8,n-15+i,g(i)); set(8,n-8,true); };
    fmt(0);
    if(ver>=7){ let r=ver; for(let i=0;i<12;i++) r=(r<<1)^((r>>>11)*0x1F25); const b=ver<<12|r; for(let i=0;i<18;i++){ const bt=((b>>>i)&1)===1, a=n-11+i%3, c=Math.floor(i/3); set(a,c,bt); set(c,a,bt); } }
    // дані зигзагом
    let bi=0; for(let right=n-1;right>=1;right-=2){ if(right===6) right=5;
      for(let vert=0;vert<n;vert++) for(let j=0;j<2;j++){ const x=right-j, up=((right+1)&2)===0, y=up?n-1-vert:vert;
        if(!F[y][x]&&bi<cw.length*8){ M[y][x]=((cw[bi>>>3]>>>(7-(bi&7)))&1)===1; bi++; } } }
    // маска з найменшим штрафом
    const MK=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
    const apply=m=>{ for(let y=0;y<n;y++) for(let x=0;x<n;x++) if(!F[y][x]&&MK[m](x,y)) M[y][x]=!M[y][x]; };
    const pen=()=>{ let p=0, dark=0; const P1=[1,0,1,1,1,0,1,0,0,0,0], P2=[0,0,0,0,1,0,1,1,1,0,1];
      for(let k=0;k<2;k++) for(let a=0;a<n;a++){ const L=[]; for(let b=0;b<n;b++) L.push(k?M[b][a]:M[a][b]);
        let run=1; for(let b=1;b<=n;b++){ if(b<n&&L[b]===L[b-1]) run++; else { if(run>=5) p+=run-2; run=1; } }
        for(let b=0;b+11<=n;b++){ const w=L.slice(b,b+11).map(Number); if(w.every((v,i)=>v===P1[i])||w.every((v,i)=>v===P2[i])) p+=40; } }
      for(let y=0;y<n-1;y++) for(let x=0;x<n-1;x++){ const c=M[y][x]; if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1]) p+=3; }
      for(const r of M) for(const c of r) if(c) dark++; p+=Math.floor(Math.abs(dark*20-n*n*10)/(n*n))*10; return p; };
    let best=0, bp=1e9; for(let m=0;m<8;m++){ apply(m); fmt(m); const p=pen(); if(p<bp){ bp=p; best=m; } apply(m); }
    apply(best); fmt(best);
    let d=""; for(let y=0;y<n;y++) for(let x=0;x<n;){ if(!M[y][x]){ x++; continue; } let e=x; while(e<n&&M[y][e]) e++; d+=`M${x} ${y}h${e-x}v1h${x-e}z`; x=e; }
    return {n,m:M,d,ver,ecl}; }
  const cache=new Map();
  return text=>{ if(!cache.has(text)) cache.set(text,encode(text)); return cache.get(text); };
})();
// QR-наліпка на модулі — маленька, як заводська; дотик відкриває великий код (qrPop)
function qrSticker(it,cx,top,sz){ const q=qrCode(it.link); if(!q) return ""; const m=sz/(q.n+2), x0=cx-sz/2;
  return `<g class="devqr" data-shopq="${esc(it.link)}" style="cursor:pointer"><title>${esc(it.name||"Модуль")} — торкніться, щоб збільшити QR і замовити</title>`
    +`<rect x="${x0}" y="${top}" width="${sz}" height="${sz}" rx="1" fill="#fff"/>`
    +`<path transform="translate(${(x0+m).toFixed(3)} ${(top+m).toFixed(3)}) scale(${m.toFixed(4)})" d="${q.d}" fill="#000" shape-rendering="crispEdges"/></g>`; }
// великий чіткий QR (векторний) для вікна й документів: тиха зона 2 модулі
const qrSVG = (link,px) => { const q=qrCode(link); return q?`<svg class="qrv" viewBox="-2 -2 ${q.n+4} ${q.n+4}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="QR-код"><rect x="-2" y="-2" width="${q.n+4}" height="${q.n+4}" fill="#fff"/><path d="${q.d}" fill="#000"/></svg>`:""; };
