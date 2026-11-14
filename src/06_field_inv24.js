/* ===== Поза щитком: гібридний інвертор 24 В з Remote ON/OFF і АКБ LiFePO4 24 В з BMS та кнопкою ===== */
// 1 с симуляції — 1 хв. АКБ 8S 100 А·год ≈ 2,56 кВт·год, заряд від мережі ≈ 1,2 кВт (≈ 45 А)
const BAT24_KWH = 2.56, INV24_CHG = 1.2, INV24_START = 3;
const INV24_TXT = {off:"вимкнено", start:"старт", grid:"мережа на AC IN — заряд АКБ", backup:"видає 230 В від АКБ", fault:"захист"};
defField("inv24",{name:"Гібридний інвертор 24 В 3 кВт", pre:"U", fw:230, fh:150, kw:3, terms:["gL","gN","oL","oN","bp","bm","r1","r2","pe"],
  init:d=>{ d.mode="off"; d.st=0; d.faultT=0; d.ovl=0; d.P=0; },
  logic(d,X){ const a=K(d,"r1"), b=K(d,"r2"); d.rem=!!(a&&b&&X.f(a)===X.f(b)); d.ub=X.volt(K(d,"bp"),K(d,"bm")); d.bat=d.ub>=20;
    d.gU=X.volt(K(d,"gL"),K(d,"gN")); const grid=d.gU>=185&&d.gU<=253;
    const m=!(d.rem&&d.bat)?"off":d.faultT>0?"fault":d.st<INV24_START?"start":grid?"grid":"backup";
    if(m===d.mode) return false; const was=d.mode; d.mode=m;
    const msg={off:was==="backup"?"вихід вимкнено":"вимкнено"+(d.rem&&!d.bat?" — немає напруги АКБ (BMS вимкнена або QF5)":""), start:"Remote ON/OFF замкнено — стартую",
      grid:"мережа на AC IN — заряджаю АКБ, вихід AC OUT з’єднано з AC IN", backup:"видаю 230 В від АКБ", fault:"захист"}[m];
    logp(m==="backup"||m==="fault"?"w":"ok",`${d.name||"U1"}: ${msg}`); return true; },
  aux:d=>d.mode==="grid"?[["gL","oL"],["gN","oN"]]:[], source:d=>d.mode==="backup"?[["oL","inv.L"],["oN","N"]]:[],
  onFault(d,c){ if(c.pots.includes("inv.L")&&d.mode==="backup"){ d.faultT=10; d.mode="fault"; logp("e",`${d.name||"U1"}: коротке замикання або зустрічна напруга на виході — захист вимкнув інвертор на 10 с`); return true; } return false; },
  tick(d,X,dt){ d.st=d.rem&&d.bat?(d.st||0)+dt:0; d.faultT=Math.max(0,(d.faultT||0)-dt); let pl=0;
    if(d.mode==="backup"){ for(const l of computeLoads(X)) if(l.a&&l.I>0&&!l.dc&&X.P(l.a).has("inv.L")) pl+=l.I*(l.U||230)/1000;
      if(pl>FT.inv24.kw+0.05){ d.ovl=(d.ovl||0)+dt; if(d.ovl>=2){ d.ovl=0; d.faultT=10; logp("e",`${d.name||"U1"}: перевантаження ${fmt(pl,1)} кВт при номіналі 3 кВт — вихід вимкнено на 10 с`); } } else d.ovl=0; }
    d.P=pl; const soc=S.env.soc||0, pb=d.mode==="backup"?pl+0.03:d.mode==="grid"&&soc<100?-INV24_CHG:0;
    d.pb=pb; S.env.batI=pb*1000/(d.ub||26); S.env.soc=Math.max(0,Math.min(100,soc-pb*(dt/60)/BAT24_KWH*100)); },
  load(d){ const L=[], ub=d.ub||26;
    if(d.mode==="backup") L.push({a:"bp",b:"bm",I:((d.P||0)+0.03)*1000/ub,U:ub,dc:true});
    if(d.mode==="grid"&&(S.env.soc||0)<100){ L.push({a:"bp",b:"bm",I:INV24_CHG*1000/ub,U:ub,dc:true}); L.push({a:"gL",b:"gN",I:INV24_CHG*1000/0.92/230,U:230}); }
    return L; },
  draw(d,x,y){ const m=d.mode||"off", col={off:"var(--muted)",start:"var(--orange)",grid:"var(--green)",backup:"var(--orange)",fault:"var(--red)"}[m];
    const scr={off:"OFF",start:"START",grid:"CHG",backup:"230V",fault:"ERR"}[m];
    return fbox(x,y,230,150,`${d.name||"U1"} · гібридний інвертор 24 В · 3 кВт`)
      +`<rect x="${x+12}" y="${y+24}" width="72" height="96" rx="6" fill="#2b2f36" stroke="#4a505a"/><rect x="${x+20}" y="${y+34}" width="56" height="28" rx="2" fill="#16181c"/>`
      +`<text x="${x+48}" y="${y+53}" font-size="11" text-anchor="middle" fill="${m==="off"?"#4a4f57":m==="fault"?"#ff6b5a":"#5fe36b"}" font-family="var(--mono)" font-weight="700">${scr}</text>`
      +[["AC",m==="grid"],["INV",m==="backup"],["BAT",!!d.bat],["ERR",m==="fault"]].map(([l,v],i)=>`<circle cx="${x+26+(i%2)*28}" cy="${y+76+Math.floor(i/2)*18}" r="4" fill="${v?(l==="ERR"?"#e23b3b":"#3fbf4a"):"#4a4f57"}"/><text x="${x+33+(i%2)*28}" y="${y+79+Math.floor(i/2)*18}" font-size="7" fill="#c9ced6" font-family="var(--mono)">${l}</text>`).join("")
      +fst(x+94,y+38,INV24_TXT[m].split(" — ")[0],col)
      +fst(x+94,y+56,`Remote: ${d.rem?"ON (DO2)":"OFF"}`,"var(--muted)")
      +fst(x+94,y+72,`АКБ: ${d.bat?fmt(d.ub,1)+" В":"немає"}`,"var(--muted)")
      +fst(x+94,y+88,`AC IN: ${d.gU>150?Math.round(d.gU)+" В":"немає"}`,"var(--muted)")
      +fst(x+94,y+104,`AC OUT: ${m==="backup"?fmt(d.P||0,2)+" кВт":m==="grid"?"= AC IN":"—"}`,"var(--muted)")
      +fst(x+10,y+138,m==="grid"&&(S.env.soc||0)<100?`Заряд ${fmt(INV24_CHG,1)} кВт ≈ ${Math.round(INV24_CHG*1000/(d.ub||26))} А`:m==="backup"?`Розряд ≈ ${Math.round(((d.P||0)+0.03)*1000/(d.ub||26))} А`:m==="fault"?`Захист: ще ${Math.ceil(d.faultT)} с`:"Вхід Remote ON/OFF — сухий контакт",m==="fault"?"var(--red)":"var(--muted)"); }});

defField("bat24",{name:"АКБ LiFePO4 24 В 100 А·год з BMS", pre:"GB", fw:200, fh:150, terms:["Bp","Bm","Pp","Pm","s1","s2"],
  init:d=>{ d.on=!!d.on; d.hold=0; d.lat=false; d.btnT=0; },
  source:d=>{ if(d.fault||(S.env.soc||0)<=0) return []; const r=[["Bp","gb+"],["Bm","gb-"]]; if(d.on) r.push(["Pp","gb+"],["Pm","gb-"]); return r; },
  tick(d,X,dt){ const a=K(d,"s1"), b=K(d,"s2"), pr=(a&&b&&X.f(a)===X.f(b))||d.btnT>0; d.pr=pr; if(d.btnT>0) d.btnT=Math.max(0,d.btnT-dt);
    if(pr){ d.hold=(d.hold||0)+dt; if(d.hold>=3-1e-6&&!d.lat){ d.lat=true; d.on=!d.on; logp("ok",`${d.name||"GB1"}: кнопку BMS утримано 3 с — BMS ${d.on?"увімкнено, на P+ / P− є напруга":"вимкнено"}`); } }
    else { d.hold=0; d.lat=false; }
    if(d.on&&(S.env.soc||0)<=3&&(S.env.batI||0)>0){ d.on=false; logp("e",`${d.name||"GB1"}: АКБ розряджена до 3 % — BMS вимкнула вихід`); } },
  onFault(d,c){ if(!(c.pots.includes("gb+")&&c.pots.includes("gb-"))) return false;
    const still=(()=>{ const was=d.on; d.on=false; const r=conflicts(makeX(build({extra:shortsExtra()}))).some(z=>z.pots.includes("gb+")&&z.pots.includes("gb-")); d.on=was; return r; })();   // чи лишиться КЗ, якщо BMS вимкнеться
    if(d.on&&!still){ d.on=false; logp("e",`${d.name||"GB1"}: коротке замикання на виході P+ / P− — захист BMS вимкнув АКБ`); return true; }
    if(!d.fault){ d.fault=true; logp("e",`${d.name||"GB1"}: коротке замикання до BMS (клеми B+ / B−)! Від цього BMS не захищає — тому запобіжник FU1 стоїть біля самої клеми B+`); return true; }
    return false; },
  draw(d,x,y){ const soc=S.env.soc||0, h=Math.round(84*soc/100), I=S.env.batI||0;
    return fbox(x,y,200,150,`${d.name||"GB1"} · LiFePO4 24 В · 100 А·год`)
      +`<rect x="${x+14}" y="${y+26}" width="44" height="90" rx="4" fill="none" stroke="var(--muted)" stroke-width="2"/><rect x="${x+28}" y="${y+21}" width="16" height="6" fill="var(--muted)"/>`
      +`<rect x="${x+17}" y="${y+113-h}" width="38" height="${h}" fill="${soc>30?"var(--green)":soc>10?"var(--orange)":"var(--red)"}"/>`
      +fst(x+68,y+40,`${fmt(soc,0)} % · ${fmt(gbU(),1)} В`)
      +fst(x+68,y+58,`BMS: ${d.fault?"аварія":d.on?"увімкнена":"вимкнена"}`,d.fault?"var(--red)":d.on?"var(--green)":"var(--muted)")
      +fst(x+68,y+76,d.pr?`Кнопка: ${fmt(Math.min(3,d.hold||0),1)} з 3 с`:"Кнопка відпущена",d.pr?"var(--orange)":"var(--muted)")
      +fst(x+68,y+94,d.on&&Math.abs(I)>0.5?(I>0?"Розряд ":"Заряд ")+Math.round(Math.abs(I))+" А":"Струм 0 А","var(--muted)")
      +fst(x+10,y+132,"B± — до BMS, P± — після BMS","var(--muted)")+fst(x+10,y+146,"Кнопка BMS: утримати 3 с","var(--muted)"); }});
