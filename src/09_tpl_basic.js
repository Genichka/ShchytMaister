/* ===== Шаблони: каркас + квартира + порожній щит ===== */
const TPL = {};
function tplStart(board){ S.noDoc=false; S.board=Object.assign(DEFAULT_BOARD(), board||{}); S.devices=[]; S.field=[]; S.wires=[]; S.comb=null; S.env={}; S.src={}; S.plan=null; S.planLen={}; S.psel=null;
  for(const i of S.board.inputs) S.src[i.id]={on:false,U:230,lost:{}}; GEO=null; }
const D = (type,rail,slot,rating,extra) => { const d=mkDev(type,rail,slot,rating,extra); S.devices.push(d); return d; };
const F = (type,map,extra) => { const f=mkField(type,map,extra); S.field.push(f); return f; };
const W = (a,b,kind,sec) => { S.wires.push({id:uid("w"),a,b,kind,sec}); };
const k = (d,t) => d.id+":"+t;
const G1 = (rail,slot,rating,i,name,sec,loads) => D("qf1p",rail,slot,rating,{group:mkGroup(i,name,sec,loads)});
const byDes = s => S.devices.find(d=>desig(d)===s);
const say = (src,on,U) => { const s=S.src[src]; if(on!==undefined) s.on=on; if(U!==undefined) s.U=U; };

TPL.flat = { name:"Квартира: ввід, реле напруги, ПЗВ, 5 груп", cat:"Квартира і будинок",
  info:"Типовий щит квартири: вступний автомат, реле напруги, ПЗВ 30 мА і групові автомати на гребінці.",
  build(){ tplStart();
    const qf1=D("qf2p",0,0,"C32"), kv=D("kv",0,2,"40"), qd=D("rcd",0,4,"40");
    const g1=G1(0,6,"C32",0,"Плита, духовка",6,[["Плита",4.0,1],["Духова шафа",3.5,0]]);
    G1(0,7,"B16",1,"Кухня, розетки",2.5,[["Чайник",2.0,1],["Блендер",0.6,0],["Тостер",0.9,0],["Холодильник",0.15,1]]);
    G1(0,8,"B16",2,"Зал, розетки",2.5,[["Пилосос",1.6,0],["Праска",2.2,0],["Комп’ютер",0.35,1],["Зарядки",0.02,1]]);
    G1(0,9,"B16",3,"Ванна кімната",2.5,[["Фен",1.8,0],["Зарядки",0.02,1],["Сушильна машина",2.5,0]]);
    G1(0,10,"B10",4,"Освітлення, домофон",1.5,[["Освітлення",0.1,1],["Роутер",0.01,1],["Домофон",0.02,1]]);
    S.comb={rail:0,from:6,to:10};
    W("in:L",k(qf1,"t1"),"L",6); W("in:N",k(qf1,"t2"),"N",6); W("in:PE","xpe:7","PE",6);
    W(k(qf1,"b1"),k(kv,"t2"),"L",6); W(k(qf1,"b2"),k(qd,"t2"),"N",6); W(k(qd,"t2"),k(kv,"t1"),"N",1.5);
    W(k(kv,"b2"),k(qd,"t1"),"L",6); W(k(qd,"b1"),k(g1,"t1"),"L",6); W(k(qd,"b2"),"xn:0","N",6); },
  demo:{ controls:[{type:"src",id:"in"}],
    script:[
      {say:"Подаємо мережу 230 В. Реле напруги KV1 відлічує 3 с і вмикає щит.", do(){ say("in",true,230); }, wait:5},
      {say:"У мережі стрибок до 275 В — KV1 миттєво відключає всю квартиру.", do(){ say("in",true,275); }, wait:3},
      {say:"Напруга повернулась у норму. Через 3 с KV1 вмикає щит знову.", do(){ say("in",true,230); }, wait:5},
      {say:"Витік на корпус у ванній: ПЗВ QD1 вимикає всі групи за ним.", do(){ S.leak.add(byDes("QF5").id); }, wait:3},
      {say:"Прибираємо аварію і знову вмикаємо QD1.", do(){ S.leak.clear(); S.leakWarned.clear(); const q=byDes("QD1"); q.on=true; q.trip=null; }, wait:3},
      {say:"Коротке замикання на кухні: спрацьовує лише QF3, решта квартири працює.", do(){ S.short.add(byDes("QF3").id); }, wait:3},
      {say:"Готово. Прибираємо КЗ і вмикаємо QF3.", do(){ S.short.clear(); const q=byDes("QF3"); q.on=true; q.trip=null; }, wait:1}]}};
TPL.empty = { name:"Порожній щит · 1 фаза · 2 рейки", cat:"Конструктор", info:"Збирайте власну схему: оберіть апарат у списку «Додати апарат», торкніться вільного місця на рейці й прокладіть дроти в режимі «Проводка».",
  build(){ tplStart({rails:2}); }, demo:{controls:[{type:"src",id:"in"}], script:[]}};
TPL.empty3 = { name:"Порожній щит · 3 фази + двигун", cat:"Конструктор", info:"Трифазний ввід і двигун 4 кВт, уже підключений до клемника XT1 (U, V, W, PE). Зберіть схему пуску: автомат захисту двигуна, контактор, кнопки «Пуск» і «Стоп».",
  build(){ tplStart({rails:2, inputs:[{id:"in",label:"Ввід 3~ 400 В",terms:["L1","L2","L3","N","PE"]}], xt:[{k:"U",l:"U",r:"P"},{k:"V",l:"V",r:"P"},{k:"W",l:"W",r:"P"},{k:"PE",l:"PE",r:"PE"}]});
    F("motor3",{U:"xt:U",V:"xt:V",W:"xt:W",PE:"xt:PE"}); },
  demo:{controls:[{type:"src",id:"in",label:"Мережа 3~"},{type:"toggle",label:"Обрив фази L3",get:()=>!!S.src.in.lost.L3,set:v=>{ S.src.in.lost.L3=v; }}], script:[]}};
TPL.empty2 = { name:"Порожній щит · 2 вводи (мережа + генератор)", cat:"Конструктор", info:"Два вводи: мережа і генератор. Зберіть власний АВР на модулі, контакторах або LOGO! і перевірте, чи немає зустрічного ввімкнення.",
  build(){ tplStart({rails:2, inputs:[{id:"in",label:"Ввід 1 · мережа",terms:["L","N","PE"]},{id:"in2",label:"Ввід 2 · генератор",terms:["L","N"]}], xn:8, xpe:8}); },
  demo:{controls:[{type:"src",id:"in",label:"Мережа"},{type:"src",id:"in2",label:"Генератор",noU:true}], script:[]}};
