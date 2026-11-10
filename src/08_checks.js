/* ===== Перевірка схеми: статичні правила + прогін у «пісочниці» ===== */
function sandbox(fn){
  const snap=JSON.stringify({devices:S.devices, field:S.field, src:S.src, env:S.env, heat:S.heat});
  const keep={leak:S.leak, short:S.short, arc:S.arc, aw:S.arcWarned, log:S.log, lw:S.leakWarned, uw:S.uWarned, sim:S.sim};
  S.quiet=true; S.leak=new Set(); S.short=new Set(); S.arc=new Set(); S.arcWarned=new Set(); S.leakWarned=new Set(); S.log=[];
  try{ return fn(); } finally {
    const j=JSON.parse(snap); Object.assign(S,{devices:j.devices, field:j.field, src:j.src, env:j.env, heat:j.heat});
    Object.assign(S,{leak:keep.leak, short:keep.short, arc:keep.arc, arcWarned:keep.aw, log:keep.log, leakWarned:keep.lw, uWarned:keep.uw, sim:keep.sim}); S.quiet=false; }
}
const runFor = sec => { for(let t=0;t<sec;t+=0.5) solve(0.5); };
const sbErrors = () => S.log.filter(l=>l.cls==="e").map(l=>l.msg.replace(/^\S+ /,""));
function powerUp(which){ for(const inp of S.board.inputs){ const s=S.src[inp.id]||(S.src[inp.id]={U:230,lost:{}}); s.on=!which||which.includes(inp.id); s.U=230; s.lost={}; if(inp.inv) Object.assign(s,{soc:80,fault:0,low:false,ovl:0}); }
  for(const d of S.devices){ if(T[d.type].prot||T[d.type].rcd){ d.on=true; d.trip=null; } } S.heat={}; }
function pressBtn(d){ d.pressed=true; runFor(1); d.pressed=false; runFor(1); }
// ПЗВ, у яких верхня і нижня клеми N з’єднані перемичками напряму (нуль в обхід)
function rcdNBypass(f0){ f0=f0||build({allOpen:true});
  return S.devices.filter(R=>T[R.type].rcd&&nPole(R)>=0).filter(R=>{ const p=T[R.type].poles[nPole(R)]; return f0(R.id+":"+p.a)===f0(R.id+":"+p.b); }); }
const isPhRole = r => r==="L"||r==="P"||PHK.includes(r);

function runChecks(){
  const Cl=[], add=(sev,t,d="",ref=null)=>Cl.push({sev,t,d,ref}), b=S.board, f0=build({allOpen:true}), G=groupsOf();
  // 1. Кольори перемичок і клеми
  let roleErr=0; const cnt={}, bad=[];
  for(const w of S.wires){ for(const k of [w.a,w.b]){ cnt[k]=(cnt[k]||0)+1; const r=termRole(k);
      if(r&&!kindFits(w.kind,r)){ roleErr++; bad.push({k,r,w,o:k.split(":")[0]}); } } }
  const swapped=new Set(bad.filter(x=>PHK.includes(x.w.kind)&&x.r==="N"&&bad.some(y=>y.o===x.o&&y.w.kind==="N"&&isPhRole(y.r))).map(x=>x.o));
  for(const o of swapped){ const d=S.devices.find(x=>x.id===o);
    add("e",`${d?desig(d):termName(o+":L")}: переплутано фазу і нуль`,"Фаза (червоний) має бути на клемі L, нуль (синій) — на клемі N. Торкніться перемички → «Перенести» і поміняйте кінці місцями.",d?{dev:d.id}:null); }
  for(const x of bad) if(!swapped.has(x.o)) add("e",`Провід ${WK[x.w.kind][0]} на клемі ${x.r==="C"?"керування":x.r}`,`${termName(x.k)}: вид перемички не відповідає призначенню клеми.`,{wire:x.w.id});
  for(const w of S.wires){ if(!w.col) continue; const c=w.col, nm=WCOL[c][0].toLowerCase(), where=`${termName(w.a)} → ${termName(w.b)}`;
    if((PHK.includes(w.kind)||w.kind==="C")&&(c==="blue"||c==="pe")){ roleErr++; add("e",`Фаза в ${nm} ізоляції`,where+": синій колір — лише для N, жовто-зелений — лише для PE.",{wire:w.id}); }
    else if(w.kind==="N"&&c!=="blue") add("w",`Нуль N у ${nm} ізоляції`,where+": нульовий робочий провідник позначають синім.",{wire:w.id});
    else if(w.kind==="PE"&&c!=="pe"){ roleErr++; add("e",`PE у ${nm} ізоляції`,where+": захисний провідник — лише жовто-зелений.",{wire:w.id}); }
    else if(w.kind!=="PE"&&c==="pe"){ roleErr++; add("e","Жовто-зелений провід не на PE",where+": цей колір дозволений лише для захисного провідника.",{wire:w.id}); } }
  if(!roleErr&&S.wires.length) add("ok","Кольори перемичок відповідають клемам","Фаза, нуль (синій), PE (жовто-зелений), керування, DC + і −.");
  for(const [k,n] of Object.entries(cnt)) if(n>2&&!/^x(n|pe):/.test(k)) add("w",`${termName(k)}: ${n} перемички під одним гвинтом`,"Більше двох перемичок під клемою — ненадійний контакт. Використайте шину або клемник.");
  for(const inp of b.inputs) for(const t of inp.terms){ if(!S.wires.some(w=>w.a===inp.id+":"+t||w.b===inp.id+":"+t)) add(t==="PE"?"e":"w",`Не підключено: ${inp.label} ${t}`,"Підведіть провід від вводу до модуля або шини."); }
  // TOQ5: блок керування бачить джерела лише через клеми AR/AN і BR/BN
  for(const d of S.devices) if(d.type==="toq5"||d.type==="toq7"){ const TQ=d.type==="toq7"?"TOQ7":"TOQ5"; const free=t=>!S.wires.some(w=>w.a===K(d,t)||w.b===K(d,t));
    if(free("AR")||free("AN")) add("w",`${desig(d)}: не підключено клеми керування AR/AN`,`Блок керування ${TQ} бачить мережу лише через AR і AN. З’єднайте їх комплектними перемичками з клемами R і N Source A — інакше модуль не перейде назад на мережу.`,{dev:d.id});
    if(free("BR")||free("BN")) add("w",`${desig(d)}: не підключено клеми керування BR/BN`,"Без перемичок від R і N Source B модуль не бачить генератор і не перемкнеться на нього.",{dev:d.id}); }
  const pe=b.inputs.find(i=>i.terms.includes("PE"));
  if(pe&&b.xpe){ if(f0(pe.id+":PE")!==f0("xpe:0")) add("e","Шина PE не з’єднана з вводом PE","Захисний провідник має йти на XPE1 напряму, без модулів."); else add("ok","Шина PE підключена до вводу напряму"); }
  for(const iv of b.inputs.filter(i=>i.inv)){ const gi=b.inputs.find(i=>!i.inv&&i.terms.includes("N"));
    const fp=build({ideal:true,open:new Set(S.devices.filter(d=>!T[d.type].prot).map(d=>d.id))});   // автомати замкнені, комутація (АВР, контактори) розімкнена
    if(gi&&iv.terms.includes("N")&&fp(gi.id+":N")===fp(iv.id+":N")) add("w","Нуль інвертора з’єднано з нулем мережі напряму","АВР має перемикати і фазу, і нуль (2P). Багато інверторів у резервному режимі з’єднують N з PE всередині — спільний нуль з мережею дає хибні спрацювання ПЗВ.");
  }
  // 2. Прогін під напругою
  const multi=b.inputs.length>1, man=v=>{ for(const d of S.devices) if(d.type==="to219") d.pos=v; }, res=sandbox(()=>{
    const out={}; man(1); powerUp(); runFor(8); out.err=sbErrors(); out.chatter=S.sim.chatter;
    out.g=G.map(g=>({id:g.id, ok:!!(S.sim.g[g.id]&&S.sim.g[g.id].phase&&S.sim.g[g.id].neutral)}));
    out.trips=S.devices.filter(d=>d.trip).map(d=>desig(d)+": "+d.trip);
    if(multi){ out.alt=b.inputs.slice(1).map(inp=>{ S.log=[]; man(2); powerUp([inp.id]); runFor(1);
        const fed=G.filter(g=>S.sim.g[g.id]&&S.sim.g[g.id].phase&&S.sim.g[g.id].neutral).map(g=>g.id); runFor(9);
        return {inp, fed, err:sbErrors(), trips:S.devices.filter(d=>d.trip).map(d=>desig(d)+": "+d.trip), g:G.filter(g=>!g.group.nobk&&!(S.sim.g[g.id]&&S.sim.g[g.id].phase&&S.sim.g[g.id].neutral)).map(desig)}; });
      S.log=[]; man(1); powerUp(); runFor(8); S.src[b.inputs[0].id].on=false; man(0); runFor(1); man(2); runFor(9); S.src[b.inputs[0].id].on=true; man(0); runFor(1); man(1); runFor(11);
      out.back={err:sbErrors(), trips:S.devices.filter(d=>d.trip).map(d=>desig(d)+": "+d.trip)}; }
    if(S.tplObj&&S.tplObj.checks){ out.tpl=[]; S.tplObj.checks((s,t,d)=>out.tpl.push({sev:s,t,d})); }
    return out; });
  const hasFault=res.err.length||res.trips.length;
  for(const e of res.err) add("e","Аварія при подачі напруги",e);
  for(const t of res.trips) add("e","Спрацював захист при ввімкненні",t);
  if(res.chatter) add("e","Схема «дзвенить»","Котушки вмикаються і вимикаються по колу. Перевірте блокувальні контакти.");
  if(!hasFault&&!res.chatter) add("ok",multi?"Подача напруги на обидва вводи — без аварій":"Подача напруги — без коротких замикань і дисбалансу");
  res.g.forEach((r,i)=>{ if(!r.ok) add("e",`${desig(G[i])} «${G[i].group.name}»: немає живлення`,tbOn()?`Колодка XT2: фаза — з нижньої клеми ${desig(G[i])} на XT2 «${g3(G[i])?"L1":"L"}», нуль — ${["rcbo","qfn","afdd"].includes(G[i].type)?"з нижньої N автомата":"із шини XN1"} на XT2 «N».`:G[i].type==="rcbo"?"Нуль групи береться з нижньої клеми N диф-автомата.":"Фаза — з верхньої клеми або гребінки, нуль — із шини XN1.",{dev:G[i].id}); });
  if(tbOn()) for(const g of G) if(f0(tbK(g,"PE"))!==f0("xpe:0")) add("e",`${desig(g)} «${g.group.name}»: PE лінії не підключено`,"З’єднайте шину PE (XPE1) з клемою XT2 «PE» цієї групи — інакше корпуси приладів без заземлення.",{dev:g.id});
  if(multi){ for(const a of res.alt){ const bad=a.err.length||a.trips.length||a.g.length;
      if(bad){ for(const e of a.err) add("e",`Лише «${a.inp.label}»: аварія`,e); for(const t of a.trips) add("e",`Лише «${a.inp.label}»: спрацював захист`,t);
        if(a.g.length) add("e",`Лише «${a.inp.label}»: групи без живлення`,a.g.join(", ")+". АВР не перевів навантаження на резерв."); }
      else add("ok",`Від «${a.inp.label}» живляться ${G.some(g=>g.group.nobk)?"всі резервні":"всі"} групи`,"Перевірено з вимкненим основним вводом.");
      if(a.inp.inv){ const fg=G.filter(g=>a.fed.includes(g.id)), kw=a.inp.inv.kw, on=fg.reduce((x,g)=>x+kwOf(g),0), all=fg.reduce((x,g)=>x+kwOf(g,true),0);
        if(on>kw) add("e",`Від інвертора: увімкнено ${fmt(on,1)} кВт при номіналі ${fmt(kw,1)} кВт`,"Без мережі інвертор вимкнеться від перевантаження. На резерв залиште лише потрібне: холодильник, котел, світло, роутер — а бойлер чи плиту живіть лише від мережі (до АВР).");
        else if(all>kw) add("w",`Усі прилади на резерві разом ${fmt(all,1)} кВт — більше за інвертор ${fmt(kw,1)} кВт`,"Від інвертора не вмикайте одночасно чайник, бойлер, праску.");
        else if(fg.length) add("ok",`Інвертора ${fmt(kw,1)} кВт вистачає на всі групи резерву`); } }
    const bk=res.back; if(bk.err.length||bk.trips.length) for(const e of [...bk.err,...bk.trips]) add("e","Повернення на основний ввід: аварія",e);
    else add("ok","Перемикання туди й назад без зустрічного ввімкнення","Основний ввід вимкнули, потім повернули."); }
  // 3. Групи, кабелі, номінали
  const main=S.devices.filter(d=>["qf2p","qf3p","qf4p"].includes(d.type)&&!d.group&&b.inputs.some(i=>f0(d.id+":t1")===f0(i.id+":"+i.terms[0])));
  const mainIn=main.length?Math.min(...main.map(protIn)):0;
  if(!main.length&&G.length) add("e","Немає ввідного автомата одразу після вводу","Ввід має заходити на верхні клеми ввідного автомата.");
  else if(main.length) add("ok",`Ввідн${main.length>1?"і автомати":"ий автомат"} ${main.map(d=>desig(d)+" "+d.rating).join(", ")}`);
  for(const R of S.devices.filter(d=>d.type==="rcd"||d.type==="rcd4")) if(mainIn&&inA(R.rating)<mainIn) add("e",`${desig(R)} ${R.rating} А слабший за ввідний ${mainIn} А`,"ПЗВ не має теплового захисту. Його номінал має бути не меншим за ввідний автомат.",{dev:R.id});
  for(const K of S.devices.filter(d=>d.type==="kv"||d.type==="tovpd1")) if(mainIn&&inA(K.rating)<mainIn) add("e",`${desig(K)} ${K.rating} А слабше за ввідний ${mainIn} А`,"Через контакт реле напруги йде струм усього щитка. Номінал реле — не менший за ввідний автомат: до C40 — реле 40 А, C50–C63 — реле 63 А.",{dev:K.id});
  const byp=rcdNBypass(f0);
  for(const R of byp) add("e",`${desig(R)}: нуль іде в обхід ПЗВ`,`Верхня і нижня клеми N ${desig(R)} з’єднані напряму (через шину N або перемичку). ПЗВ вимикатиметься від будь-якого приладу. Нуль від ввідного — лише на верхню N ПЗВ, а на шину XN1 — лише з нижньої N.`,{dev:R.id});
  for(const g of G){ const In=inA(g.rating), max=CAB[g.group.sec], I=kwOf(g,true)*1000/(g3(g)?690:230);
    if(In>max) add("e",`${desig(g)} ${g.rating} на кабель ${fmt(g.group.sec)} мм²`,`Для ${fmt(g.group.sec)} мм² автомат не більше ${max} А, або кабель від ${fmt(secFor(In))} мм².`,{dev:g.id});
    const du=groupDU(g); if(du!==null){ if(du>4) add("w",`${desig(g)} «${g.group.name}»: втрата напруги ${fmt(du,1)} %`,`Лінія ${fmt(groupLen(g),1)} м, ${fmt(g.group.sec,g.group.sec%1?1:0)} мм². Понад 4 % — візьміть кабель від ${fmt(SECS.find(s2=>s2>g.group.sec&&du*g.group.sec/s2<=4)||50,1)} мм² або розділіть групу.`,{dev:g.id}); }
    if(I>1.45*In) add("e",`${desig(g)}: усі прилади разом — ${fmt(I)} А`,`Понад 1,45 × ${In} А, автомат вибиватиме. Розділіть групу.`,{dev:g.id});
    else if(I>In) add("w",`${desig(g)}: усі прилади разом — ${fmt(I)} А`,`Більше за номінал ${In} А. При одночасній роботі можливе вимкнення.`,{dev:g.id});
    if(mainIn&&In>=mainIn) add("w",`${desig(g)} ${g.rating} не менший за ввідний`,"Немає селективності: при перевантаженні може вимкнутись увесь щиток.",{dev:g.id});
    const rr=sandbox(()=>{ powerUp(); runFor(4); const X=makeX(build()), o={rc:0,byp:null};
      for(const R of S.devices.filter(R=>T[R.type].rcd)){ const pt=!makeX(build({openPole:new Set(lPoles(R))})).ph(gL(g)); if(pt) o.rc++;
        const np=nPole(R); if(o.byp||np<0||byp.some(x=>x.id===R.id)||!X.ph(gL(g))||!X.hasN(gN(g))) continue;
        const nt=!makeX(build({openPole:new Set([R.id+":"+np])})).hasN(gN(g)); if(pt!==nt) o.byp={id:R.id,pt}; }
      return o; }), rc=rr.rc;
    if(rr.byp){ const R=devById(rr.byp.id); add("e",`${desig(g)} «${g.group.name}»: ${rr.byp.pt?"нуль":"фаза"} в обхід ${desig(R)}`,
      rr.byp.pt?"Фаза групи йде через ПЗВ, а нуль — ні. ПЗВ вимкнеться, щойно запрацює прилад. Нуль групи — із шини N, яку живить нижня клема N цього ПЗВ."
               :"Нуль групи йде через ПЗВ, а фаза взята до нього. ПЗВ вимкнеться, щойно запрацює прилад. Фазу групи беріть із нижньої клеми ПЗВ.",{dev:g.id}); }
    if(!rc) add(/освітл|світл/i.test(g.group.name)||S.board.noRcd?"w":"e",`${desig(g)} «${g.group.name}» без ПЗВ`,S.board.noRcd?"Щиток зібрано без ПЗВ: проводку захищено, а людей від ураження — ні. Для розеток і вологих приміщень рекомендовано ПЗВ або диф-автомат 30 мА.":"Розеткові групи й вологі приміщення потребують ПЗВ або диф-автомата 30 мА.",{dev:g.id}); }
  if(mainIn&&b.inputs.length===1){ let low=0;
    for(const w of S.wires){ if(!["L","N"].includes(w.kind)) continue; const g2=build({ideal:true,skip:w.id}), g1=build({ideal:true});
      const aff=G.filter(g=>(g1(gL(g))===g1("in:L")&&g2(gL(g))!==g2("in:L"))||(g1(gN(g))===g1("in:N")&&g2(gN(g))!==g2("in:N")));
      if(!aff.length) continue; const own=g=>[w.a,w.b].some(k=>k.startsWith(g.id+":")||k.startsWith("tb:"+g.id+":")), req=aff.length>1||!aff.some(own)?mainIn:inA(aff[0].rating);
      if(CAB[w.sec]<req){ low++; add("e",`Замалий переріз ${fmt(w.sec)} мм²`,`${termName(w.a)} → ${termName(w.b)}: потрібно від ${fmt(secFor(req))} мм² (струм до ${req} А).`,{wire:w.id}); } }
    if(!low&&S.wires.length) add("ok","Перерізи силових перемичок відповідають ввідному автомату"); }
  if(G.length&&b.inputs.length===1&&!S.devices.some(d=>["kv","tovpd1","kvf","kvf2","pef"].includes(d.type))&&!S.field.some(f=>f.type==="inv")) add("w","Немає реле напруги","Без нього техніка не захищена від перенапруги.");
  for(const x of (res.tpl||[])) add(x.sev,x.t,x.d);
  for(const d of S.devices){ const used=S.wires.some(w=>w.a.startsWith(d.id+":")||w.b.startsWith(d.id+":"))||(S.comb&&d.type==="qf1p"&&d.slot>=S.comb.from&&d.slot<=S.comb.to);
    if(!used) add("w",`${desig(d)} не підключений`,"Модуль стоїть на рейці без жодної перемички.",{dev:d.id}); }
  if(!S.devices.length) add("w","Щиток порожній","Додайте модулі в режимі «Модулі».");
  const ord={e:0,w:1,ok:2}; Cl.sort((a,c)=>ord[a.sev]-ord[c.sev]); return Cl;
}
