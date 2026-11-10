/* ===== PV DC-бокси: запобіжники в тримачах, УЗІП DC, DC-автомати ===== */
defType("fudc",{name:"Запобіжник DC 10×38 у тримачі", short:"Запобіжник DC", cat:"СЕС", w:1, pre:"FU", prot:"fuse",
  terms:[{k:"t",s:"top",r:"DC",l:"1"},{k:"b",s:"bot",r:"DC",l:"2"}], poles:[{a:"b",b:"t",r:"L"}],
  ratings:["10 А","15 А","20 А","25 А","32 А"], def:"25 А", cap:"PV",
  tap(d){ if(d.trip){ d.trip=null; d.on=false; S.heat[d.id]=0; logp("ok",`${desig(d)}: вставлено нову плавку вставку`); return true; }
    if(d.on){ const I=(S.sim&&S.sim.I[d.id])||0;
      if(I>0.5){ logp("e",`${desig(d)}: тримач розімкнено під струмом ${fmt(I)} А — дуга! Тримач не призначений для комутації: спочатку вимкніть DC-автомат.`); toast("Дуга при розмиканні тримача під навантаженням!","e"); }
      d.on=false; } else d.on=true; return true; },
  face(d,g){ const open=!d.on, blown=!!d.trip;
    return tx(g.cx,g.y+64,d.model||"10×38",{fs:6.3,fw:700})+tx(g.cx,g.y+74,"DC "+(d.uc||1100)+" В",{fs:6})
      +`<g data-lever="${d.id}" style="cursor:pointer"><g transform="rotate(${open?-14:0} ${g.cx} ${g.y+156})"><rect x="${g.x+6}" y="${g.y+80}" width="${g.w-12}" height="76" rx="4" fill="#c9ccd2" stroke="#8a8f98"/>`
      +`<rect x="${g.cx-11}" y="${g.y+92}" width="22" height="34" rx="3" fill="${blown?"#3a2a2a":"#f2efe6"}" stroke="#8a8f98"/>`+(blown?`<path d="M${g.cx-8} ${g.y+96} l16 26 M${g.cx+8} ${g.y+96} l-16 26" stroke="#e23b3b" stroke-width="3"/>`:"")
      +`<rect x="${g.cx-12}" y="${g.y+136}" width="24" height="10" rx="3" fill="#8a8f98"/></g></g>`+tx(g.cx,g.y+163,blown?"згоріла":"gPV "+d.rating,{fs:6.5,fw:700,fill:blown?"#c0261c":undefined}); }});
const PV_PAIRS = [["p","m"],["p2","m2"]];
const pvStrings = () => S.field.filter(f=>f.type==="pv");
const pvName = s => (s.sid||"pv")==="pv"?"PV":(s.sid||"").toUpperCase();
defField("invpv",{name:"Інвертор (входи PV)", fw:210, fh:150, terms:["p","m","p2","m2"],
  load(d,X){ const L=[]; d.ch=[];
    for(const [a,b] of PV_PAIRS){ if(!d.map[a]) continue; const P=X.P(K(d,a)), M=X.P(K(d,b));
      const ss=[...P].map(p=>/^(pv\d*)\+$/.exec(p)).filter(Boolean).map(m=>m[1]), short=ss.some(s=>P.has(s+"-")), ok=ss.filter(s=>M.has(s+"-"));
      const kw=(short||d.dead)?0:ok.reduce((t,s)=>t+pvKW(s)*0.98,0), V=ok.length?pvVmp(ok[0]):0, I=V?kw*1000/V:0;
      d.ch.push({kw,I,V,short,ok:ok.length>0&&!short,crossed:ss.length>0&&!ok.length&&[...M].some(p=>/^pv\d*-$/.test(p))}); L.push({a,b,I,U:V,dc:true}); }
    d.on=!d.dead&&d.ch.some(c=>c.ok); d.short=d.ch.some(c=>c.short); d.kw=d.ch.reduce((t,c)=>t+c.kw,0); return L; },
  draw(d,x,y){ const ch=d.ch||[], col=d.dead||d.short?"var(--red)":d.on?"var(--green)":"var(--muted)";
    let s=fbox(x,y,210,150,ch.length>1?"Інвертор · 2 MPPT":"Інвертор · вхід PV (MPPT)")+`<rect x="${x+12}" y="${y+24}" width="72" height="96" rx="6" fill="#2b2f36"/><rect x="${x+18}" y="${y+34}" width="60" height="30" rx="2" fill="#16181c"/>`
      +`<text x="${x+48}" y="${y+54}" font-size="10" text-anchor="middle" font-family="var(--mono)" fill="${d.on?"#a6e3ff":"#3a3f47"}">${d.dead?"ERR":d.short?"ISO!":d.on?fmt(d.kw,2)+"kW":"NO DC"}</text>`
      +led(x+30,y+82,d.on?"#3fbf4a":"#5a5e66")+led(x+66,y+82,d.dead||d.short?"#e23b3b":"#5a5e66");
    ch.forEach((c,i)=>{ s+=fst(x+92,y+40+i*36,`MPPT${ch.length>1?i+1:""}: ${c.short?"КЗ!":c.crossed?"переплутано!":c.ok?Math.round(c.V)+" В":"—"}`,c.short||c.crossed?"var(--red)":undefined)+fst(x+92,y+56+i*36,c.ok?`${fmt(c.I,1)} А · ${fmt(c.kw,2)} кВт`:"0 А","var(--muted)"); });
    return s+fst(x+10,y+142,d.dead?"Пошкоджено імпульсом перенапруги":d.short?"Коротке замикання на вході":d.on?"Працює від PV":"Немає напруги DC",col); }});
const invp = () => S.field.find(f=>f.type==="invpv");
const spds = () => S.devices.filter(d=>d.type==="spdc");
function spdFor(pv,f){ return spds().filter(fv=>f(k(fv,"p"))===f(pv.map.p)&&f(k(fv,"m"))===f(pv.map.m)&&f(k(fv,"pe"))===f("gnd:PE")); }
function surge(){ const f=build({ideal:true}), inv=invp(), bad=[];
  for(const pv of pvStrings()){ const ok=spdFor(pv,f).filter(fv=>(fv.wear||0)<2);
    if(ok.length){ ok.forEach(fv=>{ fv.wear=(fv.wear||0)+1; logp("ok",`Імпульс на ${pvName(pv)}: ${desig(fv)} відвів його на PE${fv.wear>=2?". Картридж відпрацював — індикатор червоний, замініть його":""}`); }); }
    else bad.push(pvName(pv)); }
  if(bad.length){ inv.dead=true; logp("e",`Імпульс перенапруги з ${bad.join(", ")} пройшов в інвертор — пошкоджено вхід MPPT! Немає справного УЗІП, з’єднаного з цим стрінгом і з PE.`); toast("Інвертор пошкоджено імпульсом","e"); }
  else toast("УЗІП відвели імпульс","ok"); }
function pvStatus(){ const inv=invp(), sun=S.env.sun||0, rows=[];
  pvStrings().forEach(pv=>{ const sid=pv.sid||"pv", c=(inv.ch||[]).find((c,i)=>{ const P=S.sim&&S.sim.X.P(K(inv,PV_PAIRS[i][0])); return P&&P.has(sid+"+"); });
    rows.push([`Стрінг ${pvName(pv)}`, sun>0?(c&&c.ok?`${Math.round(c.V)} В · ${fmt(c.I,1)} А`:`≈ ${Math.round((pv.n||10)*49.6)} В (холостий хід)`):"0 В (ніч)", sun>0?"ok":""]); });
  rows.push(["Інвертор",inv.dead?"пошкоджено":inv.short?"КЗ на вході":inv.on?"працює, "+fmt(inv.kw,2)+" кВт":"без DC",inv.dead||inv.short?"e":inv.on?"ok":"w"]);
  spds().forEach(fv=>rows.push([`УЗІП ${desig(fv)}`,(fv.wear||0)>=2?"картридж відпрацював":"справний",(fv.wear||0)>=2?"e":"ok"]));
  rows.push(["Дуга DC",S.env.arc?"ГОРИТЬ":"немає",S.env.arc?"e":"ok"]); return rows; }
function pvChecks(add){ const f=build({ideal:true}), fus=S.devices.filter(d=>d.type==="fudc"), vmax=Math.min(...spds().map(d=>d.uc||1000),...S.devices.filter(d=>d.type==="qfdc").map(d=>d.uc||1000));
  for(const pv of pvStrings()){ const nm=pvName(pv), on=key=>fus.some(d=>f(k(d,"b"))===f(key)||f(k(d,"t"))===f(key));
    if(on(pv.map.p)&&on(pv.map.m)) add("ok",`${nm}: запобіжники на обох полюсах`); else add("w",`${nm}: запобіжник лише на одному полюсі або немає`,"Для незаземленого стрінга ставлять запобіжники на + і −.");
    add(spdFor(pv,f).length?"ok":"e",spdFor(pv,f).length?`${nm}: УЗІП між + / − і PE`:`${nm}: немає УЗІП або він не з’єднаний з PE`,spdFor(pv,f).length?"Імпульс перенапруги піде в землю, а не в інвертор.":"Клеми УЗІП мають іти на + і − цього стрінга, вивід PE — на заземлення.");
    const voc=(pv.n||10)*49.6; add(voc*1.1<=vmax?"ok":"e",`${nm}: Voc ${Math.round(voc)} В, узимку ≈ ${Math.round(voc*1.1)} В`,voc*1.1<=vmax?`У межах ${vmax} В апаратів щитка.`:`Перевищує ${vmax} В апаратів щитка — зменшіть кількість панелей у стрінгу.`); }
  for(const d of fus){ const In=inA(d.rating); if(In<21) add("w",`${desig(d)} gPV ${d.rating} замалий для панелей 550 Вт`,"Номінал вставки — не менше 1,5 × Isc ≈ 21 А, інакше вона може згоріти в сонячний день.");
    else if(In>25) add("w",`${desig(d)} gPV ${d.rating} завеликий`,"Не більше за максимальний струм запобіжника панелі (зазвичай 25 А)."); }
  add("ok","Один стрінг на канал: запобіжники — додатковий захист","Обов’язкові вони зазвичай від 3 паралельних стрінгів, коли зворотний струм інших стрінгів може перевищити допустимий для панелі."); }
function pvChannel(slot,n,xp,xm,ip,im,pe,o){ const fu1=D("fudc",0,slot,o.fuse,{model:o.fmodel,uc:o.uc,cap:`PV${n} +`}), fu2=D("fudc",0,slot+o.gap1,o.fuse,{model:o.fmodel,uc:o.uc,cap:`PV${n} −`}),
    fv=D("spdc",0,o.spdSlot(slot),"",{model:o.smodel,uc:o.uc}), qf=D("qfdc",0,slot+4,o.brk,{model:o.bmodel,uc:o.uc,cap:`На MPPT${n}`});
  W(xp,k(fu1,"b"),"DC+",4); W(xm,k(fu2,"b"),"DC-",4); W(k(fu1,"t"),k(fv,"p"),"DC+",4); W(k(fu1,"t"),k(qf,"p1"),"DC+",4);
  W(k(fu2,"t"),k(fv,"m"),"DC-",4); W(k(fu2,"t"),k(qf,"m1"),"DC-",4); W(k(fv,"pe"),pe,"PE",6); W(k(qf,"p2"),ip,"DC+",4); W(k(qf,"m2"),im,"DC-",4); }
const pvCtl = extra => [{type:"range",label:"Сонце, %",min:0,max:100,step:5,get:()=>S.env.sun,set:v=>{ S.env.sun=v; }}, ...extra,
  {type:"btn",label:"Удар блискавки поруч",act:surge},{type:"btn",label:"Замінити картриджі УЗІП",act:()=>{ spds().forEach(f=>f.wear=0); logp("ok","Картриджі УЗІП замінено"); }},
  {type:"btn",label:"Відремонтувати інвертор",act:()=>{ invp().dead=false; }}];
const GND = {id:"gnd",label:"Контур заземлення",terms:["PE"]};

TPL.pvdc = { name:"PV DC-бокс: запобіжники, УЗІП, DC-автомат (TOMZN)", cat:"Сонячна станція",
  info:"Захист стрінга панелей перед інвертором. + і − стрінга йдуть через запобіжники gPV 10×38 у тримачах (тип TOPV-32). Після них стоїть УЗІП DC (тип TZG40-PV) між + / − і PE, далі двополюсний DC-автомат (тип TOB1Z-63) до інвертора. Стрінг: 10 панелей по 550 Вт, Voc ≈ 496 В, Isc ≈ 14 А.",
  extra:()=>S.env.dcShort?[["xt:ip+","xt:ip-"]]:[],
  build(){ tplStart({rails:1, inputs:[GND], xn:0, xpe:3, xt:[{k:"pa+",l:"PV+",r:"DC+"},{k:"pa-",l:"PV−",r:"DC-"},{k:"ip+",l:"Інв +",r:"DC+"},{k:"ip-",l:"Інв −",r:"DC-"}]}); S.env={sun:70};
    pvChannel(0,"","xt:pa+","xt:pa-","xt:ip+","xt:ip-","xpe:0",{fuse:"25 А",fmodel:"TOPV-32",smodel:"TZG40-PV",bmodel:"TOB1Z-63",brk:"C32",gap1:3,spdSlot:s=>s+1});
    W("gnd:PE","xpe:2","PE",6); F("pv",{p:"xt:pa+",m:"xt:pa-"},{sid:"pv",n:10}); F("invpv",{p:"xt:ip+",m:"xt:ip-"}); },
  demo:{ controls:pvCtl([{type:"toggle",label:"КЗ у кабелі до інвертора (+ на −)",get:()=>!!S.env.dcShort,set:v=>{ S.env.dcShort=v; }}]), status:pvStatus,
    script:[
      {say:"Сонце 80 %: струм іде від панелей через запобіжники FU1, FU2 і DC-автомат QF1 на інвертор.", do(){ S.env.sun=80; }, wait:4},
      {say:"Вимикаємо QF1 для обслуговування. Інвертор знеструмлено, але до QF1 напруга лишається: панелі під сонцем завжди під напругою.", do(){ byDes("QF1").on=false; }, wait:5},
      {say:"Тримачі запобіжників не розраховані на розмикання під струмом. Струму вже немає, тож відкриваємо їх безпечно.", do(){ byDes("FU1").on=false; byDes("FU2").on=false; }, wait:4},
      {say:"Закриваємо тримачі й вмикаємо QF1.", do(){ byDes("FU1").on=true; byDes("FU2").on=true; byDes("QF1").on=true; }, wait:3},
      {say:"Удар блискавки поруч: УЗІП FV1 відводить імпульс на PE, інвертор цілий.", do(){ surge(); }, wait:4},
      {say:"Пошкодили кабель до інвертора: КЗ між + і −. Струм КЗ стрінга ≈ Isc 14 А, це менше за номінал запобіжників і автомата. Нічого не спрацьовує, горить дуга!", do(){ S.env.dcShort=true; }, wait:6},
      {say:"Вимикаємо QF1 вручну: DC-автомат розриває дугу. Тому на DC потрібен саме DC-автомат.", do(){ byDes("QF1").on=false; }, wait:4},
      {say:"Кабель відремонтовано, QF1 увімкнено. Кінець демонстрації.", do(){ S.env.dcShort=false; byDes("QF1").on=true; }, wait:2}]},
  checks:pvChecks };

TPL.pvbox2 = { name:"PV комбайнер-бокс 2 входи / 2 виходи (600 В)", cat:"Сонячна станція",
  info:"Два незалежні канали, як у боксі XIONGI SOLAR 600 V 2in2out. Кожен стрінг іде через свої запобіжники + і −, свій УЗІП DC і DC-автомат на окремий MPPT-вхід інвертора. Стрінги можуть мати різну довжину й орієнтацію. Штатні вставки 15 А підходять для панелей з Isc до 10 А, тому для панелей 550 Вт (Isc ≈ 14 А) у шаблоні стоять 25 А. Автомат 63 А тут працює як роз’єднувач: струм стрінга не перевищує Isc.",
  extra:()=>S.env.dcShort1?[["xt:i1+","xt:i1-"]]:[],
  build(){ tplStart({rails:1, inputs:[GND], xn:0, xpe:4, xt:[["p1+","PV1+","DC+"],["p1-","PV1−","DC-"],["p2+","PV2+","DC+"],["p2-","PV2−","DC-"],["i1+","M1+","DC+"],["i1-","M1−","DC-"],["i2+","M2+","DC+"],["i2-","M2−","DC-"]].map(([k,l,r])=>({k,l,r}))});
    S.env={sun:70};
    const o={fuse:"25 А",fmodel:"10×38",uc:600,smodel:"SPD DC 600 В",bmodel:"DC 600 В",brk:"C63",gap1:1,spdSlot:s=>s+2};
    pvChannel(0,1,"xt:p1+","xt:p1-","xt:i1+","xt:i1-","xpe:0",o); pvChannel(6,2,"xt:p2+","xt:p2-","xt:i2+","xt:i2-","xpe:1",o); W("gnd:PE","xpe:3","PE",6);
    F("pv",{p:"xt:p1+",m:"xt:p1-"},{sid:"pv1",n:10}); F("pv",{p:"xt:p2+",m:"xt:p2-"},{sid:"pv2",n:8}); F("invpv",{p:"xt:i1+",m:"xt:i1-",p2:"xt:i2+",m2:"xt:i2-"}); },
  demo:{ controls:pvCtl([{type:"range",label:"Тінь на PV2, %",min:0,max:100,step:10,get:()=>S.env.shade_pv2||0,set:v=>{ S.env.shade_pv2=v; }},
      {type:"toggle",label:"КЗ у кабелі PV1 до інвертора",get:()=>!!S.env.dcShort1,set:v=>{ S.env.dcShort1=v; }}]), status:pvStatus,
    script:[
      {say:"Сонце 80 %. Кожен стрінг іде своїм каналом (запобіжники, УЗІП, DC-автомат) на свій MPPT-вхід інвертора.", do(){ S.env.sun=80; }, wait:4},
      {say:"Тінь на стрінгу PV2: його потужність падає, а PV1 працює на повну. Саме тому стрінги підключають на різні MPPT.", do(){ S.env.shade_pv2=70; }, wait:5},
      {say:"Обслуговуємо канал 2: вимикаємо QF2. Канал 1 працює далі.", do(){ S.env.shade_pv2=0; byDes("QF2").on=false; }, wait:4},
      {say:"Вмикаємо QF2. Удар блискавки поруч: обидва УЗІП відводять імпульс на PE.", do(){ byDes("QF2").on=true; surge(); }, wait:4},
      {say:"Пошкодили кабель PV1 до інвертора: КЗ + на −. Струм ≈ Isc 14 А, автомат 63 А не спрацює, горить дуга!", do(){ S.env.dcShort1=true; }, wait:5},
      {say:"Вимикаємо QF1 вручну: дуга гасне, канал 2 працює далі.", do(){ byDes("QF1").on=false; }, wait:4},
      {say:"Кабель відремонтовано, QF1 увімкнено. Кінець демонстрації.", do(){ S.env.dcShort1=false; byDes("QF1").on=true; }, wait:2}]},
  checks:pvChecks };
