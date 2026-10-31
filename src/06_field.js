/* ===== Польове обладнання (поза щитом, через клемник XT1) ===== */
const fbox = (x,y,w,h,title) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="var(--panel2)" stroke="var(--line)"/>`+`<text class="lab" x="${x+8}" y="${y+14}" font-size="9.5">${esc(title)}</text>`;
const fst = (x,y,s,col) => `<text x="${x}" y="${y}" font-size="9.5" font-family="var(--sans)" font-weight="600" fill="${col||"var(--fg)"}">${esc(s)}</text>`;
function motorSVG(x,y,st,lbl){ // st: run, dir(+1/-1), hum
  const cx=x+46, cy=y+62, cls=st.run?("spin"+(st.dir<0?" rev":"")):(st.hum?"hum":"");
  return `<rect x="${x+12}" y="${y+30}" width="68" height="64" rx="10" fill="#5b6470" stroke="#3a4048"/>`+[0,1,2,3,4].map(i=>`<rect x="${x+16+i*13}" y="${y+28}" width="6" height="68" fill="#4a525c"/>`).join("")
    +`<rect x="${x+80}" y="${y+56}" width="22" height="12" fill="#8c949e"/><g class="${cls}"><g transform="translate(${x+108} ${cy})">`
    +[0,120,240].map(a=>`<rect x="-3" y="-26" width="6" height="26" rx="3" fill="${st.run?"#ffb21f":"#9aa0aa"}" transform="rotate(${a})"/>`).join("")+`<circle r="6" fill="#30343a"/></g></g>`
    +`<rect x="${x+30}" y="${y+18}" width="30" height="14" rx="2" fill="#3a4048"/><text x="${x+45}" y="${y+28}" font-size="8" text-anchor="middle" fill="#fff" font-family="var(--mono)">${lbl}</text>`; }
defField("motor1",{name:"Двигун 1~ 1,1 кВт", pre:"M", fw:200, fh:150, terms:["L","N","PE"], In:7.5,
  init:d=>{ d.cap=d.cap??true; d.jam=!!d.jam; },
  tick(d,X,dt){ const U=X.volt(K(d,"L"),K(d,"N")); d.U=U; const was=d.run; d.run=U>=150&&d.cap&&!d.jam; d.hum=U>=150&&!d.run;
    if(d.run!==was) logp(d.run?"ok":"w",`${d.name||"M1"}: ${d.run?"запущено":"зупинено"}`); },
  load(d,X){ const U=X.volt(K(d,"L"),K(d,"N")); if(U<150) return []; const run=d.cap&&!d.jam; return [{a:"L",b:"N",I:run?this.In:this.In*3.6}]; },
  draw(d,x,y){ const I=S.sim?S.sim.loads.filter(l=>l.own===d.id).reduce((a,l)=>a+l.I,0):0;
    return fbox(x,y,200,150,"M1 · двигун 1~ 1,1 кВт · з конденсатором")+motorSVG(x+6,y+12,{run:d.run,dir:1,hum:d.hum},"M1~")
      +fst(x+10,y+132,d.run?`Обертається · ${fmt(I)} А`:d.hum?`Гуде, не запускається · ${fmt(I)} А`:"Зупинено",d.run?"var(--green)":d.hum?"var(--red)":"var(--muted)")
      +fst(x+10,y+145,`Конденсатор: ${d.cap?"справний":"пробитий"}${d.jam?" · вал заклинило":""}`,"var(--muted)"); }});
defField("motor3",{name:"Двигун 3~ 4 кВт", pre:"M", fw:220, fh:150, terms:["U","V","W","PE"], In:8.1,
  init:d=>{ d.jam=!!d.jam; },
  tick(d,X,dt){ const ps=["U","V","W"].map(k=>X.ph(K(d,k))); const set=new Set(ps.filter(Boolean)); const n=set.size, was=d.run;
    if(n===3){ const a=ps.map(p=>PH_ANG[p.split(".")[1]]); d.dir=((a[1]-a[0]+360)%360===120)?1:-1; d.run=!d.jam; d.hum=d.jam; }
    else if(n===2){ d.hum=true; if(!was) d.run=false; } else { d.run=false; d.hum=false; }
    d.n=n; if(d.run!==was) logp(d.run?"ok":"w",`M1: ${d.run?"обертається "+(d.dir>0?"вправо":"вліво"):"зупинено"}`); },
  load(d,X){ const ps=["U","V","W"].map(k=>X.ph(K(d,k))); const n=new Set(ps.filter(Boolean)).size; if(n<2) return [];
    let I = n===3 ? (d.jam?this.In*6:this.In) : (d.run?this.In*1.73:this.In*6); return [{abc:["U","V","W"], Is:ps.map(p=>p?I:0)}]; },
  draw(d,x,y){ const l=S.sim&&S.sim.loads.find(l=>l.own===d.id), I=l?Math.max(...l.Is):0;
    return fbox(x,y,220,150,"M1 · двигун 3~ 4 кВт · Y/Δ 400 В")+motorSVG(x+6,y+12,{run:d.run,dir:d.dir,hum:d.hum},"M3~")
      +fst(x+140,y+60,d.run?(d.dir>0?"⟳ вправо":"⟲ вліво"):"",d.dir>0?"var(--green)":"var(--orange)")
      +fst(x+10,y+132,d.run?(d.n===2?`Двофазний режим! ${fmt(I)} А`:`Обертається · ${fmt(I)} А`):d.hum?`Гуде, не запускається · ${fmt(I)} А`:"Зупинено",d.run&&d.n===3?"var(--green)":d.hum||d.n===2?"var(--red)":"var(--muted)")
      +fst(x+10,y+145,d.jam?"Вал заклинило":"Навантаження номінальне","var(--muted)"); }});
defField("pv",{name:"Сонячні панелі", fw:170, fh:150, terms:["p","m"],
  source:d=>(S.env.sun>0&&!d.fault)?[["p","pv+"],["m","pv-"]]:[],
  onFault(d,c){ if(c.pots.some(p=>/^pv/.test(p))){ d.fault=true; logp("e","DC: коротке замикання стрінга — PV-струм не вимикається сам, потрібен DC-автомат!"); return true; } return false; },
  draw(d,x,y){ const sun=S.env.sun||0; let s=fbox(x,y,170,150,"PV · 10 × 550 Вт");
    for(let i=0;i<10;i++) s+=`<rect x="${x+10+(i%5)*31}" y="${y+24+Math.floor(i/5)*42}" width="28" height="38" fill="#1d3557" stroke="#5b8ff0" stroke-width=".8"/>`;
    return s+fst(x+10,y+126,`Сонце ${sun}% · ${fmt(5.5*sun/100,2)} кВт`,"var(--yellow)")+fst(x+10,y+142,d.fault?"Аварія DC!":`${S.env.sun>0?"~400":"0"} В DC`,d.fault?"var(--red)":"var(--muted)"); }});
defField("bat",{name:"Акумулятор LiFePO4", fw:120, fh:150, terms:["p","m"],
  source:()=>(S.env.soc>0)?[["p","bat+"],["m","bat-"]]:[],
  draw(d,x,y){ const soc=S.env.soc||0, h=Math.round(80*soc/100);
    return fbox(x,y,120,150,"АКБ 51 В · 10 кВт·год")+`<rect x="${x+40}" y="${y+24}" width="40" height="86" rx="4" fill="none" stroke="var(--muted)" stroke-width="2"/><rect x="${x+52}" y="${y+19}" width="16" height="6" fill="var(--muted)"/>`
      +`<rect x="${x+43}" y="${y+107-h}" width="34" height="${h}" fill="${soc>30?"var(--green)":"var(--orange)"}"/>`+fst(x+10,y+132,`${fmt(soc,0)} %`,"var(--fg)")+fst(x+10,y+145,(S.env.flow&&S.env.flow.bat)?(S.env.flow.bat>0?"розряд ":"заряд ")+fmt(Math.abs(S.env.flow.bat),1)+" кВт":"очікування","var(--muted)"); }});
defField("inv",{name:"Гібридний інвертор 6 кВт", fw:230, fh:150, terms:["pp","pm","bp","bm","gL","gN","oL","oN","pe"],
  init:d=>{ d.en=d.en??true; d.mode="off"; d.faultT=0; },
  logic(d,X){ const pv=X.P(K(d,"pp")).has("pv+")&&X.P(K(d,"pm")).has("pv-"), bat=X.P(K(d,"bp")).has("bat+")&&X.P(K(d,"bm")).has("bat-")&&S.env.soc>5;
    const gU=X.volt(K(d,"gL"),K(d,"gN")), grid=gU>=185&&gU<=253; d.pvOK=pv; d.batOK=bat; d.gridU=gU;
    const m=!d.en?"off":d.faultT>0?"fault":grid?"grid":(pv||bat)?"backup":"off";
    if(m!==d.mode){ const prev=d.mode; d.mode=m; if(prev) logp(m==="backup"?"w":m==="grid"?"ok":"w",`Інвертор: ${({grid:"мережевий режим (мережа є, синхронізовано)",backup:"резервний режим — живить навантаження від PV/АКБ",off:"вимкнено",fault:"аварійне вимкнення"})[m]}`); return true; }
    return false; },
  aux:d=>d.mode==="grid"?[["gL","oL"],["gN","oN"]]:[], source:d=>d.mode==="backup"?[["oL","inv.L"],["oN","N"]]:[],
  onFault(d,c){ if(c.pots.includes("inv.L")){ d.faultT=10; d.mode="fault"; logp("e","Інвертор: коротке замикання або зворотне живлення на виході — захист вимкнув інвертор на 10 с"); return true; } return false; },
  tick(d,X,dt){ d.faultT=Math.max(0,d.faultT-dt); const ppv=(d.pvOK?5.5*(S.env.sun||0)/100:0);
    const Y=makeX(build({open:new Set([d.id]),extra:shortsExtra()})); let pl=0;
    for(const l of computeLoads(X)) if(l.a&&l.I>0&&X.ph(l.a)&&X.P(l.a).has(d.mode==="backup"?"inv.L":"__")||(d.mode==="grid"&&l.a&&l.I>0&&X.ph(l.a)&&!Y.ph(l.a))) pl+=l.I*(l.U||230)/1000;
    let bat=0, grid=0, pvUse=0;
    if(d.mode==="grid"){ pvUse=Math.min(ppv,pl); const sur=ppv-pvUse; const ch=S.env.soc<100?Math.min(3,sur):0; bat=-ch; grid=pl-pvUse; const exp=sur-ch; if(exp>0) grid=-exp; }
    else if(d.mode==="backup"){ const sup=ppv+(d.batOK?5:0);
      if(pl>sup+0.05){ d.faultT=10; logp("e",`Інвертор: перевантаження ${fmt(pl,1)} кВт > ${fmt(sup,1)} кВт доступно — вимкнення на 10 с`); }
      pvUse=Math.min(ppv,pl); bat=pl-pvUse; if(bat<0) bat=0; if(ppv>pl&&S.env.soc<100) bat=-Math.min(3,ppv-pl); }
    S.env.soc=Math.max(0,Math.min(100,(S.env.soc||0)-bat*(dt/60)/10*100));
    S.env.flow={pv:pvUse+(bat<0?-bat:0)+(grid<0?-grid:0), bat, grid, load:pl, mode:d.mode}; },
  draw(d,x,y){ const f=S.env.flow||{}, m=d.mode;
    const col={grid:"var(--green)",backup:"var(--orange)",off:"var(--muted)",fault:"var(--red)"}[m];
    return fbox(x,y,230,150,"Гібридний інвертор 6 кВт · 48 В")+`<rect x="${x+12}" y="${y+24}" width="76" height="96" rx="6" fill="#2b2f36"/>`
      +`<rect x="${x+20}" y="${y+34}" width="60" height="30" rx="2" fill="#16181c"/><text x="${x+50}" y="${y+54}" font-size="11" text-anchor="middle" font-family="var(--mono)" fill="${m==="off"?"#3a3f47":"#a6e3ff"}">${m==="grid"?"GRID":m==="backup"?"BACKUP":m==="fault"?"FAULT":"OFF"}</text>`
      +led(x+30,y+80,m!=="off"?"#3fbf4a":"#5a5e66")+led(x+50,y+80,m==="backup"?"#ffb21f":"#5a5e66")+led(x+70,y+80,m==="fault"?"#e23b3b":"#5a5e66")
      +fst(x+98,y+40,`PV → ${fmt(Math.max(0,f.pv||0),2)} кВт`,"var(--yellow)")+fst(x+98,y+58,`Навант. ${fmt(f.load||0,2)} кВт`)
      +fst(x+98,y+76,f.bat>0?`АКБ розряд ${fmt(f.bat,2)}`:f.bat<0?`АКБ заряд ${fmt(-f.bat,2)}`:"АКБ 0","var(--muted)")
      +fst(x+98,y+94,f.grid>0?`Мережа ← ${fmt(f.grid,2)}`:f.grid<0?`Експорт → ${fmt(-f.grid,2)}`:"Мережа 0",f.grid<0?"var(--green)":"var(--muted)")
      +fst(x+10,y+142,({grid:"Мережевий режим",backup:"Резервний режим",off:d.en?"Немає джерела":"Вимкнено кнопкою",fault:"Захист: вимкнено "+Math.ceil(d.faultT)+" с"})[m],col); }});
function simpleLoad(k,name,kw,icon){ defField(k,{name, fw:130, fh:150, terms:["L","N"], kw,
  load(d,X){ const U=X.volt(K(d,"L"),K(d,"N")); d.on=U>=150; return [{a:"L",b:"N",I:U>=150?kw*1000/U:0,U}]; },
  draw(d,x,y){ return fbox(x,y,130,150,name)+icon(x,y,d.on)+fst(x+10,y+132,d.on?`Працює · ${fmt(kw,1)} кВт`:"Без живлення",d.on?"var(--green)":"var(--muted)"); }}); }
simpleLoad("lamp","Освітлення 0,2 кВт",0.2,(x,y,on)=>(on?`<circle cx="${x+65}" cy="${y+64}" r="34" fill="#ffd23f" opacity=".25"/>`:"")+`<circle cx="${x+65}" cy="${y+64}" r="20" fill="${on?"#ffd23f":"#5a5e66"}"/><rect x="${x+57}" y="${y+84}" width="16" height="14" fill="#8c949e"/>`);
simpleLoad("boiler","Бойлер 2,0 кВт",2.0,(x,y,on)=>`<rect x="${x+42}" y="${y+24}" width="46" height="88" rx="20" fill="#e9eaee" stroke="#9aa0aa"/><path d="M${x+55} ${y+96} q5 -10 0 -20 q-5 -10 0 -20" stroke="${on?"#e0352b":"#9aa0aa"}" stroke-width="3" fill="none"/><path d="M${x+75} ${y+96} q5 -10 0 -20 q-5 -10 0 -20" stroke="${on?"#e0352b":"#9aa0aa"}" stroke-width="3" fill="none"/>`);
simpleLoad("floor","Тепла підлога 1,5 кВт",1.5,(x,y,on)=>`<rect x="${x+14}" y="${y+40}" width="102" height="56" fill="#3a3530"/>`+[0,1,2,3].map(i=>`<path d="M${x+20} ${y+48+i*13} h90" stroke="${on?"#ff7a3d":"#6a6560"}" stroke-width="3"/>`).join(""));
defField("valve",{name:"Кран з електроприводом", fw:150, fh:150, terms:["N","O","Cl"], init:d=>{ d.pos=d.pos??100; },
  tick(d,X,dt){ const o=X.volt(K(d,"O"),K(d,"N"))>=150, c=X.volt(K(d,"Cl"),K(d,"N"))>=150, p0=d.pos;
    if(o&&!c) d.pos=Math.min(100,d.pos+dt*34); if(c&&!o) d.pos=Math.max(0,d.pos-dt*34);
    if(p0>0&&d.pos===0) logp("ok","Кран води закрито"); if(p0<100&&d.pos===100) logp("ok","Кран води відкрито"); },
  load(d,X){ const o=X.volt(K(d,"O"),K(d,"N"))>=150, c=X.volt(K(d,"Cl"),K(d,"N"))>=150; return [{a:o?"O":"Cl",b:"N",I:((o&&d.pos<100)||(c&&d.pos>0))?0.03:0}]; },
  draw(d,x,y){ const a=90*(1-d.pos/100);
    return fbox(x,y,150,150,"Кран 3/4″ · 230 В · 3 дроти")+`<rect x="${x+14}" y="${y+70}" width="122" height="20" fill="#8c949e"/><circle cx="${x+75}" cy="${y+80}" r="22" fill="#c8a14a" stroke="#8a6d20"/>`
      +`<rect x="${x+71}" y="${y+60}" width="8" height="40" fill="#2a2d33" transform="rotate(${a} ${x+75} ${y+80})"/><rect x="${x+55}" y="${y+26}" width="40" height="24" rx="4" fill="#2b2f36"/>`
      +fst(x+10,y+132,d.pos>=100?"Відкрито":d.pos<=0?"Закрито":`Рух… ${Math.round(d.pos)} %`,d.pos<=0?"var(--orange)":"var(--green)"); }});
