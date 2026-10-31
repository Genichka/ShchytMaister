/* ===== PV DC-бокс: запобіжники в тримачах, УЗІП DC, DC-автомат ===== */
defType("fudc",{name:"Запобіжник DC 10×38 у тримачі", short:"Запобіжник DC", cat:"СЕС", w:1, pre:"FU", prot:"fuse",
  terms:[{k:"t",s:"top",r:"DC",l:"1"},{k:"b",s:"bot",r:"DC",l:"2"}], poles:[{a:"b",b:"t",r:"L"}],
  ratings:["10 А","15 А","20 А","25 А","32 А"], def:"25 А", cap:"PV",
  tap(d){ if(d.trip){ d.trip=null; d.on=false; S.heat[d.id]=0; logp("ok",`${desig(d)}: вставлено нову плавку вставку`); return true; }
    if(d.on){ const I=(S.sim&&S.sim.I[d.id])||0;
      if(I>0.5){ logp("e",`${desig(d)}: тримач розімкнено під струмом ${fmt(I)} А — дуга! Тримач не призначений для комутації: спочатку вимкніть DC-автомат.`); toast("Дуга при розмиканні тримача під навантаженням!","e"); }
      d.on=false; } else d.on=true; return true; },
  face(d,g){ const open=!d.on, blown=!!d.trip;
    return tx(g.cx,g.y+64,d.model||"10×38",{fs:6.3,fw:700})+tx(g.cx,g.y+74,"DC 1100 В",{fs:6})
      +`<g data-lever="${d.id}" style="cursor:pointer"><g transform="rotate(${open?-14:0} ${g.cx} ${g.y+156})"><rect x="${g.x+6}" y="${g.y+80}" width="${g.w-12}" height="76" rx="4" fill="#c9ccd2" stroke="#8a8f98"/>`
      +`<rect x="${g.cx-11}" y="${g.y+92}" width="22" height="34" rx="3" fill="${blown?"#3a2a2a":"#f2efe6"}" stroke="#8a8f98"/>`+(blown?`<path d="M${g.cx-8} ${g.y+96} l16 26 M${g.cx+8} ${g.y+96} l-16 26" stroke="#e23b3b" stroke-width="3"/>`:"")
      +`<rect x="${g.cx-12}" y="${g.y+136}" width="24" height="10" rx="3" fill="#8a8f98"/></g></g>`+tx(g.cx,g.y+163,blown?"згоріла":"gPV "+d.rating,{fs:6.5,fw:700,fill:blown?"#c0261c":undefined}); }});
defField("invpv",{name:"Інвертор (вхід PV)", fw:210, fh:150, terms:["p","m"],
  load(d,X){ const P=X.P(K(d,"p")), M=X.P(K(d,"m")), sh=P.has("pv+")&&P.has("pv-"); d.short=sh;
    const ok=P.has("pv+")&&M.has("pv-")&&!sh&&!d.dead; d.on=ok; d.kw=ok?5.5*(S.env.sun||0)/100*0.98:0; return [{a:"p",b:"m",I:ok?d.kw*1000/417:0,U:417,dc:true}]; },
  draw(d,x,y){ const I=d.on?d.kw*1000/417:0, col=d.dead||d.short?"var(--red)":d.on?"var(--green)":"var(--muted)";
    return fbox(x,y,210,150,"Інвертор · вхід PV (MPPT)")+`<rect x="${x+12}" y="${y+24}" width="80" height="96" rx="6" fill="#2b2f36"/><rect x="${x+20}" y="${y+34}" width="64" height="30" rx="2" fill="#16181c"/>`
      +`<text x="${x+52}" y="${y+54}" font-size="10" text-anchor="middle" font-family="var(--mono)" fill="${d.on?"#a6e3ff":"#3a3f47"}">${d.dead?"ERR":d.short?"ISO!":d.on?fmt(d.kw,2)+"kW":"NO DC"}</text>`
      +led(x+34,y+82,d.on?"#3fbf4a":"#5a5e66")+led(x+70,y+82,d.dead||d.short?"#e23b3b":"#5a5e66")
      +fst(x+102,y+44,d.on?"417 В DC":"—")+fst(x+102,y+62,d.on?fmt(I,1)+" А":"0 А","var(--muted)")+fst(x+102,y+80,d.on?fmt(d.kw,2)+" кВт":"",(d.on?"var(--yellow)":"var(--muted)"))
      +fst(x+10,y+142,d.dead?"Пошкоджено імпульсом перенапруги":d.short?"Коротке замикання на вході":d.on?"Працює від PV":"Немає напруги DC",col); }});
const fv1 = () => byDes("FV1"), invp = () => S.field.find(f=>f.type==="invpv");
function surge(){ const fv=fv1(), inv=invp(), pv=S.field.find(f=>f.type==="pv"), f=build({ideal:true});
  const linked=fv&&f(k(fv,"p"))===f(pv.map.p)&&f(k(fv,"m"))===f(pv.map.m), grounded=fv&&f(k(fv,"pe"))===f("gnd:PE"), fresh=fv&&(fv.wear||0)<2;
  if(linked&&grounded&&fresh){ fv.wear=(fv.wear||0)+1; logp("ok",`Імпульс перенапруги: ${desig(fv)} відвів його на PE, інвертор цілий${fv.wear>=2?". Картридж відпрацював — індикатор червоний, замініть його":""}`); toast("УЗІП відвів імпульс","ok"); }
  else { inv.dead=true; logp("e","Імпульс перенапруги пройшов в інвертор — пошкоджено вхід MPPT! "+(!fv?"УЗІП немає.":!fresh?"Картридж УЗІП був відпрацьований.":!grounded?"УЗІП не з’єднаний із заземленням.":"УЗІП не підключений до ліній PV.")); toast("Інвертор пошкоджено імпульсом","e"); } }
TPL.pvdc = { name:"PV DC-бокс: запобіжники, УЗІП, DC-автомат (TOMZN)", cat:"Сонячна станція",
  info:"Захист стрінга панелей перед інвертором. + і − стрінга йдуть через запобіжники gPV 10×38 у тримачах (тип TOPV-32). Після них стоїть УЗІП DC (тип TZG40-PV) між + / − і PE, далі двополюсний DC-автомат (тип TOB1Z-63) до інвертора. Стрінг: 10 панелей по 550 Вт, Voc ≈ 496 В, Isc ≈ 14 А.",
  extra:()=>S.env.dcShort?[["xt:ip+","xt:ip-"]]:[],
  build(){ tplStart({rails:1, inputs:[{id:"gnd",label:"Контур заземлення",terms:["PE"]}], xn:0, xpe:3,
      xt:[{k:"pa+",l:"PV+",r:"DC+"},{k:"pa-",l:"PV−",r:"DC-"},{k:"ip+",l:"Інв +",r:"DC+"},{k:"ip-",l:"Інв −",r:"DC-"}]});
    S.env={sun:70};
    const fu1=D("fudc",0,0,"25 А",{model:"TOPV-32",cap:"PV +"}), fv=D("spdc",0,1,"",{model:"TZG40-PV"}), fu2=D("fudc",0,3,"25 А",{model:"TOPV-32",cap:"PV −"}), qf=D("qfdc",0,4,"C32",{model:"TOB1Z-63",cap:"На інвертор"});
    F("pv",{p:"xt:pa+",m:"xt:pa-"}); F("invpv",{p:"xt:ip+",m:"xt:ip-"});
    W("xt:pa+",k(fu1,"b"),"DC+",4); W("xt:pa-",k(fu2,"b"),"DC-",4);
    W(k(fu1,"t"),k(fv,"p"),"DC+",4); W(k(fu1,"t"),k(qf,"p1"),"DC+",4); W(k(fu2,"t"),k(fv,"m"),"DC-",4); W(k(fu2,"t"),k(qf,"m1"),"DC-",4);
    W(k(fv,"pe"),"xpe:0","PE",6); W("gnd:PE","xpe:2","PE",6); W(k(qf,"p2"),"xt:ip+","DC+",4); W(k(qf,"m2"),"xt:ip-","DC-",4); },
  demo:{ controls:[{type:"range",label:"Сонце, %",min:0,max:100,step:5,get:()=>S.env.sun,set:v=>{ S.env.sun=v; }},
      {type:"toggle",label:"КЗ у кабелі до інвертора (+ на −)",get:()=>!!S.env.dcShort,set:v=>{ S.env.dcShort=v; }},
      {type:"btn",label:"Удар блискавки поруч",act:surge},
      {type:"btn",label:"Замінити картридж УЗІП",act:()=>{ const f=fv1(); if(f){ f.wear=0; logp("ok","Картридж УЗІП замінено"); } }},
      {type:"btn",label:"Відремонтувати інвертор",act:()=>{ invp().dead=false; }}],
    status:()=>{ const inv=invp(), fv=fv1(), sun=S.env.sun||0, I=inv&&inv.on?inv.kw*1000/417:0;
      return [["Стрінг PV",sun>0?(inv&&inv.on?"417 В · "+fmt(I,1)+" А":"≈ 496 В (холостий хід)"):"0 В (ніч)",sun>0?"ok":""],
        ["Інвертор",inv.dead?"пошкоджено":inv.short?"КЗ на вході":inv.on?"працює, "+fmt(inv.kw,2)+" кВт":"без DC",inv.dead||inv.short?"e":inv.on?"ok":"w"],
        ["УЗІП FV1",!fv?"немає":(fv.wear||0)>=2?"картридж відпрацював":"справний",!fv||(fv.wear||0)>=2?"e":"ok"],["Дуга DC",S.env.arc?"ГОРИТЬ":"немає",S.env.arc?"e":"ok"]]; },
    script:[
      {say:"Сонце 80 %: струм іде від панелей через запобіжники FU1, FU2 і DC-автомат QF1 на інвертор.", do(){ S.env.sun=80; }, wait:4},
      {say:"Вимикаємо QF1 для обслуговування. Інвертор знеструмлено, але до QF1 напруга лишається: панелі під сонцем завжди під напругою.", do(){ byDes("QF1").on=false; }, wait:5},
      {say:"Тримачі запобіжників не розраховані на розмикання під струмом. Струму вже немає, тож відкриваємо їх безпечно.", do(){ byDes("FU1").on=false; byDes("FU2").on=false; }, wait:4},
      {say:"Закриваємо тримачі й вмикаємо QF1.", do(){ byDes("FU1").on=true; byDes("FU2").on=true; byDes("QF1").on=true; }, wait:3},
      {say:"Удар блискавки поруч: УЗІП FV1 відводить імпульс на PE, інвертор цілий.", do(){ surge(); }, wait:4},
      {say:"Пошкодили кабель до інвертора: КЗ між + і −. Струм КЗ стрінга ≈ Isc 14 А, це менше за номінал запобіжників і автомата. Нічого не спрацьовує, горить дуга!", do(){ S.env.dcShort=true; }, wait:6},
      {say:"Вимикаємо QF1 вручну: DC-автомат розриває дугу. Тому на DC потрібен саме DC-автомат.", do(){ byDes("QF1").on=false; }, wait:4},
      {say:"Кабель відремонтовано, QF1 увімкнено. Кінець демонстрації.", do(){ S.env.dcShort=false; byDes("QF1").on=true; }, wait:2}]},
  checks(add){ const fus=S.devices.filter(d=>d.type==="fudc"), f=build({ideal:true}), pv=S.field.find(x=>x.type==="pv");
    const onP=fus.some(d=>f(k(d,"b"))===f(pv.map.p)||f(k(d,"t"))===f(pv.map.p)), onM=fus.some(d=>f(k(d,"b"))===f(pv.map.m)||f(k(d,"t"))===f(pv.map.m));
    if(onP&&onM) add("ok","Запобіжники стоять на обох полюсах стрінга","Ізольована PV-система: захищено і +, і −."); else add("w","Запобіжник лише на одному полюсі","Для незаземленого PV-стрінга ставлять запобіжники на + і −.");
    for(const d of fus){ const In=inA(d.rating); if(In<21) add("w",`${desig(d)} gPV ${d.rating} замалий`,"Номінал вставки — не менше 1,5 × Isc ≈ 21 А, інакше вона може згоріти в сонячний день.");
      else if(In>25) add("w",`${desig(d)} gPV ${d.rating} завеликий`,"Не більше за максимальний струм запобіжника панелі (зазвичай 25 А)."); }
    const fv=fv1(); if(fv){ const ok=f(k(fv,"pe"))===f("gnd:PE")&&f(k(fv,"p"))===f(pv.map.p)&&f(k(fv,"m"))===f(pv.map.m);
      add(ok?"ok":"e",ok?"УЗІП підключено між + / − і PE":"УЗІП підключено неправильно",ok?"Імпульс перенапруги піде в землю, а не в інвертор.":"Його клеми мають іти на лінії + і − стрінга, а вивід PE — на заземлення."); }
    else add("e","Немає УЗІП DC","Інвертор не захищений від імпульсних перенапруг.");
    add("ok","Напруга стрінга 496 В у межах 1000 В апаратів","Voc для 10 панелей; узимку вона зростає приблизно на 10 %.");
    add("ok","Одиночний стрінг: запобіжники — додатковий захист","Обов’язкові вони зазвичай від 3 паралельних стрінгів, коли зворотний струм інших стрінгів може перевищити допустимий для панелі."); }};
