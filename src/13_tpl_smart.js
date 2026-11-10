/* ===== Шаблон: розумний будинок ===== */
const XT_SM = [["lL","Св L","L"],["lN","Св N","N"],["bL","Бойл L","L"],["bN","Бойл N","N"],["fL","Підл L","L"],["fN","Підл N","N"],["vO","Кран ↑","L"],["vC","Кран ↓","L"],["vN","Кран N","N"],["pe","PE","PE"]].map(([k,l,r])=>({k,l,r}));
const scene = name => { const sr1=byDes("SR1"), sr2=byDes("SR2"), tr=byDes("TR1");
  if(name==="away"){ sr1.cmd=false; sr2.cmd=false; tr.set=18; } else { sr1.cmd=true; sr2.cmd=true; tr.set=25; tr.en=true; }
  logp("ok",`Сценарій «${name==="away"?"Нікого вдома":"Я вдома"}»: ${name==="away"?"світло і бойлер вимкнено, підлога 18 °C":"світло, бойлер, підлога 25 °C"}`); };
TPL.smart = { name:"Розумний будинок: Wi-Fi реле, хаб, лічильник, кран", cat:"Квартира і будинок",
  info:"Розумні реле керують світлом і котушкою контактора бойлера (саме реле 16 А бойлер напряму не тягне). Терморегулятор веде теплу підлогу. Хаб Zigbee отримує сигнал датчика протікання і через реле KR1 закриває кран. Лічильник PM1 рахує споживання.",
  build(){ tplStart({rails:2, inputs:[{id:"in",label:"Ввід",terms:["L","N","PE"]}], xn:6, xpe:2, xt:XT_SM}); S.env={leak:false};
    const qf1=D("qf2p",0,0,"C40"), kv=D("kv",0,2,"63"), pm=D("pm",0,4), qd=D("rcd",0,6,"63"),
      q2=D("qf1p",0,8,"B6",{noGroup:true,cap:"Автоматика"}), q3=D("qf1p",0,9,"B10",{noGroup:true,cap:"Освітлення"}), q4=D("qf1p",0,10,"B16",{noGroup:true,cap:"Бойлер"}), q5=D("qf1p",0,11,"B16",{noGroup:true,cap:"Тепла підлога"});
    S.comb={rail:0,from:8,to:11};
    const hub=D("hub",1,0), sr1=D("ssw",1,2,"",{cap:"Світло",cmd:true}), sr2=D("ssw",1,3,"",{cap:"Котушка KM1",cmd:false}), km=D("km2a",1,4,"",{cap:"Бойлер 2 кВт"}), tr=D("tr",1,7), kr=D("kr2",1,9);
    F("lamp",{L:"xt:lL",N:"xt:lN"}); F("boiler",{L:"xt:bL",N:"xt:bN"}); F("floor",{L:"xt:fL",N:"xt:fN"}); F("valve",{N:"xt:vN",O:"xt:vO",Cl:"xt:vC"});
    wireIn(qf1);
    W(k(qf1,"b1"),k(kv,"t2"),"L",10); W(k(qf1,"b2"),k(kv,"t1"),"N",10); W(k(kv,"b2"),k(pm,"L"),"L",10); W(k(kv,"t1"),k(pm,"N"),"N",10);
    W(k(pm,"Lo"),k(qd,"t1"),"L",10); W(k(pm,"No"),k(qd,"t2"),"N",10); W(k(qd,"b1"),k(q2,"t1"),"L",10); W(k(qd,"b2"),"xn:0","N",10);
    W(k(q2,"b1"),k(hub,"L"),"L",1.5); W(k(hub,"L"),k(kr,"L"),"L",1.5); W(k(kr,"L"),k(sr2,"L"),"L",1.5);
    W("xn:1",k(hub,"N"),"N",1.5); W(k(hub,"N"),k(kr,"N"),"N",1.5); W(k(kr,"N"),k(sr2,"N"),"N",1.5);
    W(k(q3,"b1"),k(sr1,"L"),"L",1.5); W("xn:2",k(sr1,"N"),"N",1.5); W(k(sr1,"Lo"),"xt:lL","L",1.5); W(k(sr1,"No"),"xt:lN","N",1.5);
    W(k(q4,"b1"),k(km,"1"),"L",2.5); W("xn:3",k(km,"3"),"N",2.5); W(k(km,"2"),"xt:bL","L",2.5); W(k(km,"4"),"xt:bN","N",2.5);
    W(k(sr2,"Lo"),k(km,"A1"),"L",1.5); W(k(sr2,"No"),k(km,"A2"),"N",1.5);
    W(k(q5,"b1"),k(tr,"L"),"L",2.5); W("xn:4",k(tr,"N"),"N",2.5); W(k(tr,"Lo"),"xt:fL","L",2.5); W(k(tr,"No"),"xt:fN","N",2.5);
    W(k(kr,"O1"),"xt:vO","L",1.5); W(k(kr,"O2"),"xt:vC","L",1.5); W("xn:5","xt:vN","N",1.5); W("xpe:1","xt:pe","PE",2.5); },
  tick(X,dt){ const hub=byDes("A1"), kr=byDes("KR1"); if(!hub) return;
    if(S.env.leak){ if(hub.online&&kr.cmd!=="close"){ kr.cmd="close"; logp("e","Хаб: протікання у ванній! Закриваю кран, надсилаю сповіщення на телефон"); if(typeof toast==="function") toast("Протікання! Кран закривається","e"); S.env.leakMiss=false; }
      else if(!hub.online&&!S.env.leakMiss){ S.env.leakMiss=true; logp("e","Протікання, але хаб без живлення — кран не закрито!"); } } },
  demo:{ controls:[{type:"src",id:"in",label:"Мережа"},
      {type:"toggle",label:"Світло (SR1)",get:()=>byDes("SR1").cmd,set:v=>{ byDes("SR1").cmd=v; }},
      {type:"toggle",label:"Бойлер (SR2 → KM1)",get:()=>byDes("SR2").cmd,set:v=>{ byDes("SR2").cmd=v; }},
      {type:"toggle",label:"Тепла підлога",get:()=>byDes("TR1").en,set:v=>{ byDes("TR1").en=v; }},
      {type:"range",label:"Підлога, °C",min:15,max:30,step:1,get:()=>byDes("TR1").set,set:v=>{ byDes("TR1").set=v; }},
      {type:"choice",label:"Кран води",opts:[["open","Відкрити"],["close","Закрити"]],get:()=>byDes("KR1").cmd,set:v=>{ byDes("KR1").cmd=v; }},
      {type:"toggle",label:"Датчик протікання",get:()=>!!S.env.leak,set:v=>{ S.env.leak=v; if(!v) S.env.leakMiss=false; }},
      {type:"btn",label:"Сценарій «Я вдома»",act:()=>scene("home")},{type:"btn",label:"Сценарій «Нікого вдома»",act:()=>scene("away")}],
    status:()=>{ const pm=byDes("PM1"), hub=byDes("A1"), v=S.field.find(f=>f.type==="valve"), tr=byDes("TR1");
      return [["Споживання зараз",fmt(pm.p||0,2)+" кВт",""],["Лічильник",fmt(pm.kwh||0,2)+" кВт·год",""],["Хаб",hub.online?"онлайн":"офлайн",hub.online?"ok":"e"],
        ["Кран",v.pos>=100?"відкрито":v.pos<=0?"закрито":"рух",v.pos<=0?"w":"ok"],["Підлога",fmt(tr.temp,1)+" °C → "+fmt(tr.set,0)+" °C",""]]; },
    script:[
      {say:"Подаємо мережу. Через 3 с KV1 вмикає щиток, хаб і розумні реле виходять онлайн.", do(){ say("in",true,230); }, wait:5},
      {say:"Вмикаємо в застосунку світло і бойлер. Бойлер 2 кВт комутує контактор KM1, а розумне реле керує лише його котушкою.", do(){ byDes("SR1").cmd=true; byDes("SR2").cmd=true; }, wait:4},
      {say:"Тепла підлога: задаємо 26 °C. Терморегулятор гріє, лічильник показує споживання.", do(){ const t=byDes("TR1"); t.set=26; t.en=true; }, wait:5},
      {say:"Протікання у ванній! Хаб закриває кран і надсилає сповіщення.", do(){ S.env.leak=true; }, wait:5},
      {say:"Сценарій «Нікого вдома»: світло й бойлер вимкнено, підлога на 18 °C.", do(){ scene("away"); }, wait:4},
      {say:"Скидаємо тривогу і відкриваємо кран.", do(){ S.env.leak=false; S.env.leakMiss=false; byDes("KR1").cmd="open"; }, wait:4},
      {say:"Перенапруга 275 В: KV1 знеструмлює все разом із хабом. Нове протікання тепер ніхто не обробить. Висновок: хаб і кран варто живити через ДБЖ.", do(){ say("in",true,275); S.env.leak=true; }, wait:5},
      {say:"Напруга в нормі: щиток увімкнувся, хаб онлайн і одразу закриває кран.", do(){ say("in",true,230); }, wait:7},
      {say:"Кінець демонстрації.", do(){ S.env.leak=false; S.env.leakMiss=false; byDes("KR1").cmd="open"; }, wait:1}]},
  checks(add){ sandbox(()=>{ powerUp(); runFor(5); const hub=byDes("A1"); S.env.leak=true; runFor(4); const v=S.field.find(f=>f.type==="valve");
    if(hub.online&&v.pos<100) add("ok","Автоматизація протікання працює","Хаб закриває кран через реле KR1.");
    else add("e","Кран не закривається при протіканні","Перевірте живлення хаба і реле крана KR1.");
    add("w","Хаб і кран живляться після реле напруги","При спрацюванні KV1 автоматика вимикається. Для надійності живіть їх через ДБЖ."); }); }};
