/* ===== Шаблони: пуск двигунів 1~ і 3~ ===== */
const motor = () => S.field.find(f=>/^motor/.test(f.type));
function ctrlChain(qf2,qm,sb1,sb2,km,hl,nIdx,hlFrom){
  W(k(qf2,"b1"),k(qm,"13"),"C",1.5); W(k(qm,"14"),k(sb1,"11"),"C",1.5); W(k(sb1,"12"),k(sb2,"13"),"C",1.5); W(k(sb2,"14"),k(km,"A1"),"C",1.5);
  W(k(sb1,"12"),k(km,"13"),"C",1.5); W(k(km,"14"),k(km,"A1"),"C",1.5); W(k(km,"A2"),"xn:"+nIdx,"N",1.5);
  W(hlFrom[0],k(hl,"X1"),hlFrom[1],1.5); W(k(hl,"X2"),"xn:"+(nIdx+1),"N",1.5); }
const motorCtrls = extra => [{type:"src",id:"in",label:"Мережа"},{type:"btn",label:"Пуск",cls:"go",act:()=>livePress("SB2")},{type:"btn",label:"Стоп",cls:"stop",act:()=>livePress("SB1")},...extra];
const mStatus = () => { const m=motor()||{}, qm=byDes("QM1"), km=byDes("KM1"), per=(S.sim&&S.sim.per[qm.id])||[];
  return [["Двигун", m.run?(m.type==="motor3"?(m.dir>0?"обертається вправо":"обертається вліво"):"обертається"):m.hum?"гуде, не обертається":"стоїть", m.run&&!m.hum?"ok":m.hum?"e":""],
    ["Контактор KM1", km.pulled?"увімкнено (самоутримання)":"вимкнено", km.pulled?"ok":""],
    ["QM1, струм полюсів", (qm.trip?"вимкнено захистом · ":"")+per.map(x=>fmt(x,1)).join(" / ")+" А", qm.trip?"e":""]]; };
const resetQM = () => { const q=byDes("QM1"); q.on=true; q.trip=null; S.heat[q.id]=0; };

TPL.motor1 = { name:"Пуск однофазного двигуна (кнопки, самоутримання)", cat:"Двигуни",
  info:"Двигун 1,1 кВт з робочим конденсатором. Автомат захисту двигуна QM1: фаза проходить послідовно через усі три полюси, щоб тепловий розчіплювач працював коректно. Коло керування: QF2 → допоміжний контакт QM1 (13–14) → «Стоп» (НЗ) → «Пуск» (НВ) → котушка KM1. Контакт KM1 13–14 підхоплює кнопку «Пуск».",
  build(){ tplStart({inputs:[{id:"in",label:"Ввід 230 В",terms:["L","N","PE"]}], xn:4, xpe:4, xt:[{k:"L",l:"L",r:"L"},{k:"N",l:"N",r:"N"},{k:"PE",l:"PE",r:"PE"}]});
    const qm=D("qm",0,0,"6–10 А",{Ir:8}), qf2=D("qf1p",0,3,"B6",{noGroup:true,cap:"Керування"}), sb1=D("sbs",0,4), sb2=D("sbp",0,5), km=D("km2a",0,6,"",{cap:"Пускач M1"}), hl=D("hl",0,9);
    F("motor1",{L:"xt:L",N:"xt:N",PE:"xt:PE"});
    W("in:L",k(qm,"1"),"L",2.5); W(k(qm,"2"),k(qm,"3"),"L",2.5); W(k(qm,"4"),k(qm,"5"),"L",2.5); W(k(qm,"6"),k(km,"1"),"L",2.5); W(k(km,"2"),"xt:L","L",2.5);
    W("in:N","xn:0","N",2.5); W("xn:1",k(km,"3"),"N",2.5); W(k(km,"4"),"xt:N","N",2.5); W("in:PE","xpe:0","PE",2.5); W("xpe:1","xt:PE","PE",2.5);
    W("in:L",k(qf2,"t1"),"L",1.5); ctrlChain(qf2,qm,sb1,sb2,km,hl,2,[k(km,"2"),"L"]); },
  demo:{ controls:motorCtrls([{type:"toggle",label:"Конденсатор справний",get:()=>motor().cap,set:v=>{ motor().cap=v; }},
      {type:"toggle",label:"Вал заклинило",get:()=>motor().jam,set:v=>{ motor().jam=v; }},{type:"btn",label:"Увімкнути QM1",act:resetQM}]), status:mStatus,
    script:[
      {say:"Подаємо живлення. Двигун стоїть: контактор KM1 вимкнений.", do(){ say("in",true,230); }, wait:2},
      {say:"Натискаємо «Пуск»: котушка KM1 отримує живлення, і контакт 13–14 підхоплює кнопку.", do(){ livePress("SB2"); }, wait:3},
      {say:"Кнопку відпустили, а двигун працює далі. Це самоутримання.", do(){}, wait:2},
      {say:"Натискаємо «Стоп»: коло котушки розривається, двигун зупиняється.", do(){ livePress("SB1"); }, wait:3},
      {say:"Пробито конденсатор. Пуск: двигун гуде, струм утричі більший, тож QM1 вимикає. Через його контакт 13–14 відпадає і KM1.", do(){ motor().cap=false; livePress("SB2"); }, wait:6},
      {say:"Конденсатор замінено, QM1 увімкнено. Двигун сам не стартує, бо після аварії потрібен новий пуск.", do(){ motor().cap=true; resetQM(); }, wait:3},
      {say:"Пуск. Двигун працює. Кінець демонстрації.", do(){ livePress("SB2"); }, wait:2}]},
  checks(add){ sandbox(()=>{ powerUp(); runFor(2); const m=motor(); const r0=m.run; pressBtn(byDes("SB2")); const r1=m.run; pressBtn(byDes("SB1")); const r2=m.run;
    if(!r0&&r1&&!r2) add("ok","Пуск, самоутримання і стоп працюють","Перевірено натисканням кнопок «Пуск» і «Стоп».");
    else add("e","Коло керування працює неправильно",`Після «Пуск» двигун ${r1?"обертається":"стоїть"}, після «Стоп» — ${r2?"обертається":"стоїть"}.`); }); }};

TPL.motor3 = { name:"Пуск трифазного двигуна (прямий пуск)", cat:"Двигуни",
  info:"Двигун 4 кВт, 400 В. QM1 захищає від КЗ, перевантаження і обриву фази. Коло керування 230 В від L1 через QF2. Поміняйте дві фази місцями — двигун обертатиметься у зворотний бік.",
  build(){ tplStart({inputs:[{id:"in",label:"Ввід 3~ 400 В",terms:["L1","L2","L3","N","PE"]}], xn:4, xpe:4, xt:[{k:"U",l:"U",r:"P"},{k:"V",l:"V",r:"P"},{k:"W",l:"W",r:"P"},{k:"PE",l:"PE",r:"PE"}]});
    const qm=D("qm",0,0,"6–10 А",{Ir:8.5}), qf2=D("qf1p",0,3,"C6",{noGroup:true,cap:"Керування"}), sb1=D("sbs",0,4), sb2=D("sbp",0,5), km=D("km3a",0,6,"",{cap:"Пускач M1"}), hl=D("hl",0,10);
    F("motor3",{U:"xt:U",V:"xt:V",W:"xt:W",PE:"xt:PE"});
    ["1","3","5"].forEach((t,i)=>{ const L="L"+(i+1); W("in:"+L,k(qm,t),L,2.5); W(k(qm,String(+t+1)),k(km,t),L,2.5); W(k(km,String(+t+1)),"xt:"+"UVW"[i],L,2.5); });
    W("in:N","xn:0","N",1.5); W("in:PE","xpe:0","PE",2.5); W("xpe:1","xt:PE","PE",2.5);
    W("in:L1",k(qf2,"t1"),"L1",1.5); ctrlChain(qf2,qm,sb1,sb2,km,hl,1,[k(km,"14"),"C"]); },
  demo:{ controls:motorCtrls([{type:"toggle",label:"Обрив фази L3",get:()=>!!S.src.in.lost.L3,set:v=>{ S.src.in.lost.L3=v; }},
      {type:"toggle",label:"Вал заклинило",get:()=>motor().jam,set:v=>{ motor().jam=v; }},
      {type:"btn",label:"Поміняти фази V↔W",act:swapVW},{type:"btn",label:"Увімкнути QM1",act:resetQM}]), status:mStatus,
    script:[
      {say:"Подаємо три фази 400 В.", do(){ say("in",true,230); }, wait:2},
      {say:"Пуск: KM1 вмикається і самоутримується, двигун обертається вправо.", do(){ livePress("SB2"); }, wait:3},
      {say:"Стоп.", do(){ livePress("SB1"); }, wait:2},
      {say:"Міняємо місцями дві фази на двигуні (V↔W) і запускаємо: напрям обертання змінився.", do(){ swapVW(); livePress("SB2"); }, wait:4},
      {say:"Обрив фази L3 під час роботи. Двигун у двофазному режимі, струм зростає, тож QM1 вимикає за кілька секунд, і KM1 відпадає.", do(){ S.src.in.lost.L3=true; }, wait:7},
      {say:"Фазу відновлено, фази повернуто як було, QM1 увімкнено.", do(){ S.src.in.lost.L3=false; swapVW(); resetQM(); }, wait:2},
      {say:"Знову пуск.", do(){ livePress("SB2"); }, wait:2},
      {say:"Вал заклинило: струм до 6 × Iн, QM1 вимикає.", do(){ motor().jam=true; }, wait:4},
      {say:"Кінець демонстрації.", do(){ motor().jam=false; resetQM(); }, wait:1}]},
  checks(add){ sandbox(()=>{ powerUp(); runFor(2); const m=motor(); pressBtn(byDes("SB2")); const r1=m.run, dir=m.dir; pressBtn(byDes("SB1"));
    if(r1&&!m.run) add("ok",`Пуск і стоп працюють, обертання ${dir>0?"вправо (L1-L2-L3)":"вліво"}`); else add("e","Двигун не запускається або не зупиняється","Перевірте коло керування і силові перемички.");
    S.src.in.lost.L3=true; pressBtn(byDes("SB2")); runFor(4); if(byDes("QM1").trip) add("ok","Обрив фази: QM1 вимикає двигун"); }); }};
function swapVW(){ const a=S.wires.find(w=>w.b==="xt:V"||w.a==="xt:V"), b=S.wires.find(w=>w.b==="xt:W"||w.a==="xt:W"); if(!a||!b) return;
  const ea=a.b==="xt:V"?"b":"a", eb=b.b==="xt:W"?"b":"a"; a[ea]="xt:W"; b[eb]="xt:V"; logp("w","Фази на двигуні V і W поміняно місцями"); save(); }
