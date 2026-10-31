/* ===== Шаблони АВР на 2 вводи (1 фаза) ===== */
const ATS_BOARD = () => ({rails:2, inputs:[{id:"in",label:"Ввід 1 · мережа",terms:["L","N","PE"]},{id:"in2",label:"Ввід 2 · генератор",terms:["L","N"]}], xn:6, xpe:6});
function atsGroups(r,s0){ const a=G1(r,s0,"B16",0,"Розетки",2.5,[["Холодильник",0.15,1],["Чайник",2.0,0],["Телевізор",0.15,1]]);
  G1(r,s0+1,"B10",1,"Освітлення",1.5,[["Освітлення",0.1,1],["Роутер",0.01,1]]);
  G1(r,s0+2,"C16",2,"Котел, насос",2.5,[["Газовий котел",0.15,1],["Насос",0.75,1]]);
  S.comb={rail:r,from:s0,to:s0+2}; return a; }
function atsInputs(qf1,qf2){ W("in:L",k(qf1,"t1"),"L",10); W("in:N",k(qf1,"t2"),"N",10); W("in:PE","xpe:0","PE",10);
  W("in2:L",k(qf2,"t1"),"L",10); W("in2:N",k(qf2,"t2"),"N",10); }
function feedFrom(){ const qd=byDes("QD1"); if(!qd||!S.sim) return "—"; const p=S.sim.X.ph(k(qd,"t1"));
  return !p?"немає живлення":p.startsWith("in2")?"генератор (ввід 2)":"мережа (ввід 1)"; }
const atsStatus = extra => () => [["Навантаження живиться від", feedFrom(), /генер/.test(feedFrom())?"w":/немає/.test(feedFrom())?"e":"ok"], ...(extra?extra():[])];
const ATS_CTRL = [{type:"src",id:"in",label:"Мережа"},{type:"src",id:"in2",label:"Генератор",noU:true}];
const stepsBase = (wait2) => [
  {say:"Мережа є, генератор зупинено. Навантаження живиться від вводу 1.", do(){ say("in",true,230); say("in2",false); }, wait:5},
  {say:"Мережу відключили. Щит знеструмлено, поки генератор не запущено.", do(){ say("in",false); }, wait:2},
  {say:"Запускаємо генератор. АВР переводить навантаження на ввід 2.", do(){ say("in2",true,230); }, wait:wait2},
  {say:"Мережа повернулась. АВР повертає навантаження на ввід 1 (пріоритет).", do(){ say("in",true,230); }, wait:wait2+2},
  {say:"Генератор можна глушити — навантаження вже на мережі.", do(){ say("in2",false); }, wait:2}];
const atsModeCtrl = {type:"toggle", label:"Ручний режим АВР-модуля", get:()=>!!(byDes("QA1")||{}).manual, set(v){ const a=byDes("QA1"); a.manual=v; logp("w",`QA1: ${v?"ручний":"автоматичний"} режим`); }};

TPL.ats_tomzn = { name:"АВР на модулі TOMZN (тип TOQ5) + реле напруги", cat:"АВР на 2 вводи",
  info:"Модульний АВР з пріоритетом вводу I. Сам модуль реагує лише на зникнення напруги, тому перед ним на вводі 1 стоїть реле напруги KV1: при перенапрузі воно відкидає мережу, і АВР іде на генератор.",
  build(){ tplStart(ATS_BOARD());
    const qf1=D("qf2p",0,0,"C40",{cap:"Ввід 1 мережа"}), qf2=D("qf2p",0,2,"C40",{cap:"Ввід 2 генератор"}), kv=D("kv",0,4,"63"),
      qa=D("ats",0,6,"",{variant:"tomzn"}), qd=D("rcd",0,10,"63"); const g=atsGroups(1,0); atsInputs(qf1,qf2);
    W(k(qf1,"b1"),k(kv,"t2"),"L",10); W(k(qf1,"b2"),k(kv,"t1"),"N",10); W(k(kv,"b2"),k(qa,"IL"),"L",10); W(k(kv,"t1"),k(qa,"IN"),"N",10);
    W(k(qf2,"b1"),k(qa,"IIL"),"L",10); W(k(qf2,"b2"),k(qa,"IIN"),"N",10); W(k(qa,"L"),k(qd,"t1"),"L",10); W(k(qa,"N"),k(qd,"t2"),"N",10);
    W(k(qd,"b1"),k(g,"t1"),"L",10); W(k(qd,"b2"),"xn:0","N",10); },
  demo:{ controls:[...ATS_CTRL, atsModeCtrl], status:atsStatus(()=>[["Реле KV1", (byDes("KV1").ks||{}).closed?"пропускає мережу":"мережу відкинуто", (byDes("KV1").ks||{}).closed?"ok":"w"]]),
    script:[...stepsBase(3),
      {say:"Тепер перенапруга: генератор працює, у мережі стрибок до 270 В.", do(){ say("in2",true,230); say("in",true,270); }, wait:3},
      {say:"KV1 відкинув мережу, АВР-модуль бачить «немає вводу I» і переходить на генератор. Техніка захищена.", do(){}, wait:3},
      {say:"Напруга в нормі: через 3 с KV1 пропускає мережу, АВР повертається на ввід I.", do(){ say("in",true,230); }, wait:6},
      {say:"Кінець демонстрації.", do(){ say("in2",false); }, wait:1}]},
  checks(add){ add("ok","АВР-модуль не бачить перенапругу","Тому KV1 стоїть перед вводом I: при 270 В навантаження переходить на генератор."); }};

TPL.ats_geya = { name:"АВР на модулі GEYA (тип G2R) + реле після АВР", cat:"АВР на 2 вводи",
  info:"Модуль G2R перемикається за < 50 мс, пріоритет — ввід I. Реле напруги тут стоїть після АВР і захищає техніку від будь-якого джерела, але на генератор при перенапрузі не переводить. Є ручний режим.",
  build(){ tplStart(ATS_BOARD());
    const qf1=D("qf2p",0,0,"C40",{cap:"Ввід 1 мережа"}), qf2=D("qf2p",0,2,"C40",{cap:"Ввід 2 генератор"}), qa=D("ats",0,4,"",{variant:"geya"}),
      kv=D("kv",0,8,"63"), qd=D("rcd",0,10,"63"); const g=atsGroups(1,0); atsInputs(qf1,qf2);
    W(k(qf1,"b1"),k(qa,"IL"),"L",10); W(k(qf1,"b2"),k(qa,"IN"),"N",10); W(k(qf2,"b1"),k(qa,"IIL"),"L",10); W(k(qf2,"b2"),k(qa,"IIN"),"N",10);
    W(k(qa,"L"),k(kv,"t2"),"L",10); W(k(qa,"N"),k(kv,"t1"),"N",10); W(k(kv,"b2"),k(qd,"t1"),"L",10); W(k(kv,"t1"),k(qd,"t2"),"N",10);
    W(k(qd,"b1"),k(g,"t1"),"L",10); W(k(qd,"b2"),"xn:0","N",10); },
  demo:{ controls:[...ATS_CTRL, atsModeCtrl], status:atsStatus(()=>[["АВР-модуль", (byDes("QA1").manual?"ручний, ":"авто, ")+"ввід "+byDes("QA1").pos, "ok"]]),
    script:[...stepsBase(3),
      {say:"Генератор працює, у мережі 270 В. Модуль G2R не реагує на перенапругу і лишається на вводі I…", do(){ say("in2",true,230); say("in",true,270); }, wait:3},
      {say:"…але KV1 після АВР вимкнув навантаження. Техніка ціла, хоча генератор простоює.", do(){}, wait:3},
      {say:"Ручний режим: перемикаємо модуль на ввід II ручкою. Генератор живить будинок навіть при поганій мережі.", do(){ const a=byDes("QA1"); a.manual=true; a.pos="II"; }, wait:6},
      {say:"Мережа в нормі. Повертаємо модуль в автоматичний режим — він сам іде на ввід I.", do(){ say("in",true,230); byDes("QA1").manual=false; }, wait:5},
      {say:"Кінець демонстрації.", do(){ say("in2",false); }, wait:1}]},
  checks(add){ add("ok","Реле напруги після АВР","Захищає навантаження від обох джерел, але не переводить на генератор при перенапрузі."); }};

function atsKmPower(){ const qf1=D("qf2p",0,0,"C40",{cap:"Ввід 1 мережа"}), qf2=D("qf2p",0,2,"C40",{cap:"Ввід 2 генератор"}),
  km1=D("km2a",0,4,"",{cap:"Ввід 1"}), km2=D("km2a",0,7,"",{cap:"Ввід 2"}), qf3=D("qf1p",0,10,"B6",{noGroup:true,cap:"Керування 1"}), qf4=D("qf1p",0,11,"B6",{noGroup:true,cap:"Керування 2"});
  atsInputs(qf1,qf2);
  W(k(qf1,"b1"),k(km1,"1"),"L",10); W(k(qf1,"b2"),k(km1,"3"),"N",10); W(k(qf2,"b1"),k(km2,"1"),"L",10); W(k(qf2,"b2"),k(km2,"3"),"N",10);
  W(k(qf1,"b1"),k(qf3,"t1"),"L",1.5); W(k(qf2,"b1"),k(qf4,"t1"),"L",1.5);
  return {qf1,qf2,km1,km2,qf3,qf4}; }
function atsKmOut(km1,km2,qd,g){ W(k(km1,"2"),k(qd,"t1"),"L",10); W(k(km2,"2"),k(qd,"t1"),"L",10); W(k(km1,"4"),k(qd,"t2"),"N",10); W(k(km2,"4"),k(qd,"t2"),"N",10);
  W(k(qd,"b1"),k(g,"t1"),"L",10); W(k(qd,"b2"),"xn:0","N",10); }
const kmStatus = () => [["KM1 (мережа)", byDes("KM1").pulled?"увімкнено":"вимкнено", byDes("KM1").pulled?"ok":""],["KM2 (генератор)", byDes("KM2").pulled?"увімкнено":"вимкнено", byDes("KM2").pulled?"w":""]];

TPL.ats_logo = { name:"АВР на Siemens LOGO! + 2 контактори", cat:"АВР на 2 вводи",
  info:`Програма LOGO!: Q1 (мережа) вмикається через ${LOGO_T.T1} с стабільної мережі; після її зникнення через ${LOGO_T.T2} с і ${LOGO_T.T3} с роботи генератора — Q2. Між перемиканнями пауза ${LOGO_T.DEAD} с. Контактори мають електричне блокування через НЗ-контакти 21–22. Живлення LOGO! перемикає реле K1.`,
  build(){ tplStart(ATS_BOARD()); const {qf1,qf2,km1,km2,qf3,qf4}=atsKmPower();
    const k1=D("rel",1,0,"",{cap:"Живлення LOGO"}), a1=D("logo",1,2), qd=D("rcd",1,6,"63"); const g=atsGroups(1,8); atsKmOut(km1,km2,qd,g);
    W(k(qf3,"b1"),k(k1,"A1"),"C",1.5); W(k(qf3,"b1"),k(k1,"14"),"C",1.5); W(k(qf4,"b1"),k(k1,"12"),"C",1.5); W(k(qf4,"b1"),k(a1,"I2"),"C",1.5);
    W(k(k1,"11"),k(a1,"L1"),"C",1.5); W(k(k1,"A1"),k(a1,"I1"),"C",1.5);
    W(k(qf1,"b2"),k(k1,"A2"),"N",1.5); W(k(k1,"A2"),k(a1,"N"),"N",1.5); W(k(a1,"N"),k(km1,"A2"),"N",1.5); W(k(km1,"A2"),k(km2,"A2"),"N",1.5);
    W(k(a1,"L1"),k(a1,"Q1a"),"C",1.5); W(k(a1,"Q1a"),k(a1,"Q2a"),"C",1.5);
    W(k(a1,"Q1b"),k(km2,"21"),"C",1.5); W(k(km2,"22"),k(km1,"A1"),"C",1.5); W(k(a1,"Q2b"),k(km1,"21"),"C",1.5); W(k(km1,"22"),k(km2,"A1"),"C",1.5); },
  demo:{ controls:ATS_CTRL, status:atsStatus(()=>[...kmStatus(),["LOGO! живиться від", (byDes("K1").pulled?"мережі":"генератора")+(byDes("A1").pw?"":" — немає"), byDes("A1").pw?"ok":"e"]]),
    script:[...stepsBase(5),
      {say:"Перевіримо блокування: вмикаємо обидва джерела — LOGO! ніколи не тримає Q1 і Q2 разом.", do(){ say("in",true,230); say("in2",true,230); }, wait:4},
      {say:"Кінець демонстрації.", do(){ say("in2",false); }, wait:1}]}};

TPL.ats_km = { name:"АВР на контакторах і реле напруги", cat:"АВР на 2 вводи",
  info:"Класична схема без контролера. KV1 контролює мережу і через 3 с вмикає KM1. Реле K1 знімає живлення з котушки KM2, коли мережа в нормі. НЗ-контакти 21–22 кожного контактора блокують інший.",
  build(){ tplStart(ATS_BOARD()); const {qf1,qf2,km1,km2,qf3,qf4}=atsKmPower();
    const kv=D("kv",1,0,"40",{cap:"Контроль мережі"}), k1=D("rel",1,2,"",{cap:"Блокування KM2"}), qd=D("rcd",1,4,"63"); const g=atsGroups(1,6); atsKmOut(km1,km2,qd,g);
    W(k(qf3,"b1"),k(kv,"t2"),"L",1.5); W(k(qf1,"b2"),k(kv,"t1"),"N",1.5);
    W(k(kv,"b2"),k(km2,"21"),"C",1.5); W(k(kv,"b2"),k(k1,"A1"),"C",1.5); W(k(km2,"22"),k(km1,"A1"),"C",1.5);
    W(k(kv,"t1"),k(k1,"A2"),"N",1.5); W(k(k1,"A2"),k(km1,"A2"),"N",1.5);
    W(k(qf4,"b1"),k(k1,"11"),"C",1.5); W(k(k1,"12"),k(km1,"21"),"C",1.5); W(k(km1,"22"),k(km2,"A1"),"C",1.5); W(k(qf2,"b2"),k(km2,"A2"),"N",1.5); },
  demo:{ controls:ATS_CTRL, status:atsStatus(kmStatus),
    script:[...stepsBase(4),
      {say:"Перенапруга 270 В при працюючому генераторі: KV1 знімає KM1, K1 відпускає — вмикається KM2.", do(){ say("in2",true,230); say("in",true,270); }, wait:3},
      {say:"Напруга в нормі: KV1 через 3 с повертає мережу.", do(){ say("in",true,230); }, wait:5},
      {say:"Кінець демонстрації.", do(){ say("in2",false); }, wait:1}]}};
