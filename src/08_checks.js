/* ===== Перевірка схеми: статичні правила + прогін у «пісочниці» ===== */
function sandbox(fn){
  const snap=JSON.stringify({devices:S.devices, field:S.field, src:S.src, env:S.env, heat:S.heat});
  const keep={leak:S.leak, short:S.short, log:S.log, lw:S.leakWarned, uw:S.uWarned, sim:S.sim};
  S.quiet=true; S.leak=new Set(); S.short=new Set(); S.leakWarned=new Set(); S.log=[];
  try{ return fn(); } finally {
    const j=JSON.parse(snap); Object.assign(S,{devices:j.devices, field:j.field, src:j.src, env:j.env, heat:j.heat});
    Object.assign(S,{leak:keep.leak, short:keep.short, log:keep.log, leakWarned:keep.lw, uWarned:keep.uw, sim:keep.sim}); S.quiet=false; }
}
const runFor = sec => { for(let t=0;t<sec;t+=0.5) solve(0.5); };
const sbErrors = () => S.log.filter(l=>l.cls==="e").map(l=>l.msg.replace(/^\S+ /,""));
function powerUp(which){ for(const inp of S.board.inputs){ const s=S.src[inp.id]||(S.src[inp.id]={U:230,lost:{}}); s.on=!which||which.includes(inp.id); s.U=230; s.lost={}; if(inp.inv) Object.assign(s,{soc:80,fault:0,low:false,ovl:0}); }
  for(const d of S.devices){ if(T[d.type].prot||T[d.type].rcd){ d.on=true; d.trip=null; } } S.heat={}; }
function pressBtn(d){ d.pressed=true; runFor(1); d.pressed=false; runFor(1); }
// ПЗВ, у яких верхня і нижня клеми N з’єднані дротами напряму (нуль в обхід)
function rcdNBypass(f0){ f0=f0||build({allOpen:true});
  return S.devices.filter(R=>T[R.type].rcd&&nPole(R)>=0).filter(R=>{ const p=T[R.type].poles[nPole(R)]; return f0(R.id+":"+p.a)===f0(R.id+":"+p.b); }); }
const isPhRole = r => r==="L"||r==="P"||PHK.includes(r);

function runChecks(){
  const Cl=[], add=(sev,t,d="")=>Cl.push({sev,t,d}), b=S.board, f0=build({allOpen:true}), G=groupsOf();
  // 1. Кольори дротів і клеми
  let roleErr=0; const cnt={}, bad=[];
  for(const w of S.wires){ for(const k of [w.a,w.b]){ cnt[k]=(cnt[k]||0)+1; const r=termRole(k);
      if(r&&!kindFits(w.kind,r)){ roleErr++; bad.push({k,r,w,o:k.split(":")[0]}); } } }
  const swapped=new Set(bad.filter(x=>PHK.includes(x.w.kind)&&x.r==="N"&&bad.some(y=>y.o===x.o&&y.w.kind==="N"&&isPhRole(y.r))).map(x=>x.o));
  for(const o of swapped){ const d=S.devices.find(x=>x.id===o);
    add("e",`${d?desig(d):termName(o+":L")}: переплутано фазу і нуль`,"Фаза (червоний) має бути на клемі L, нуль (синій) — на клемі N. Торкніться дроту → «Перенести» і поміняйте кінці місцями."); }
  for(const x of bad) if(!swapped.has(x.o)) add("e",`Провід ${WK[x.w.kind][0]} на клемі ${x.r==="C"?"керування":x.r}`,`${termName(x.k)}: вид дроту не відповідає призначенню клеми.`);
  for(const w of S.wires){ if(!w.col) continue; const c=w.col, nm=WCOL[c][0].toLowerCase(), where=`${termName(w.a)} → ${termName(w.b)}`;
    if((PHK.includes(w.kind)||w.kind==="C")&&(c==="blue"||c==="pe")){ roleErr++; add("e",`Фаза в ${nm} ізоляції`,where+": синій колір — лише для N, жовто-зелений — лише для PE."); }
    else if(w.kind==="N"&&c!=="blue") add("w",`Нуль N у ${nm} ізоляції`,where+": нульовий робочий провідник позначають синім.");
    else if(w.kind==="PE"&&c!=="pe"){ roleErr++; add("e",`PE у ${nm} ізоляції`,where+": захисний провідник — лише жовто-зелений."); }
    else if(w.kind!=="PE"&&c==="pe"){ roleErr++; add("e","Жовто-зелений провід не на PE",where+": цей колір дозволений лише для захисного провідника."); } }
  if(!roleErr&&S.wires.length) add("ok","Кольори дротів відповідають клемам","Фаза, нуль (синій), PE (жовто-зелений), керування, DC + і −.");
  for(const [k,n] of Object.entries(cnt)) if(n>2&&!/^x(n|pe):/.test(k)) add("w",`${termName(k)}: ${n} дроти під одним гвинтом`,"Більше двох дротів під клемою — ненадійний контакт. Використайте шину або клемник.");
  for(const inp of b.inputs) for(const t of inp.terms){ if(!S.wires.some(w=>w.a===inp.id+":"+t||w.b===inp.id+":"+t)) add(t==="PE"?"e":"w",`Не підключено: ${inp.label} ${t}`,"Підведіть провід від вводу до апарата або шини."); }
  const pe=b.inputs.find(i=>i.terms.includes("PE"));
  if(pe&&b.xpe){ if(f0(pe.id+":PE")!==f0("xpe:0")) add("e","Шина PE не з’єднана з вводом PE","Захисний провідник має йти на XPE1 напряму, без апаратів."); else add("ok","Шина PE підключена до вводу напряму"); }
  for(const iv of b.inputs.filter(i=>i.inv)){ const gi=b.inputs.find(i=>!i.inv&&i.terms.includes("N"));
    const fp=build({ideal:true,open:new Set(S.devices.filter(d=>!T[d.type].prot).map(d=>d.id))});   // автомати замкнені, комутація (АВР, контактори) розімкнена
    if(gi&&iv.terms.includes("N")&&fp(gi.id+":N")===fp(iv.id+":N")) add("w","Нуль інвертора з’єднано з нулем мережі напряму","АВР має перемикати і фазу, і нуль (2P). Багато інверторів у резервному режимі з’єднують N з PE всередині — спільний нуль з мережею дає хибні спрацювання ПЗВ.");
  }
  // 2. Прогін під напругою
  const multi=b.inputs.length>1, res=sandbox(()=>{
    const out={}; powerUp(); runFor(8); out.err=sbErrors(); out.chatter=S.sim.chatter;
    out.g=G.map(g=>({id:g.id, ok:!!(S.sim.g[g.id]&&S.sim.g[g.id].phase&&S.sim.g[g.id].neutral)}));
    out.trips=S.devices.filter(d=>d.trip).map(d=>desig(d)+": "+d.trip);
    if(multi){ out.alt=b.inputs.slice(1).map(inp=>{ S.log=[]; powerUp([inp.id]); runFor(1);
        const fed=G.filter(g=>S.sim.g[g.id]&&S.sim.g[g.id].phase&&S.sim.g[g.id].neutral).map(g=>g.id); runFor(9);
        return {inp, fed, err:sbErrors(), trips:S.devices.filter(d=>d.trip).map(d=>desig(d)+": "+d.trip), g:G.filter(g=>!(S.sim.g[g.id]&&S.sim.g[g.id].phase&&S.sim.g[g.id].neutral)).map(desig)}; });
      S.log=[]; powerUp(); runFor(8); S.src[b.inputs[0].id].on=false; runFor(10); S.src[b.inputs[0].id].on=true; runFor(12);
      out.back={err:sbErrors(), trips:S.devices.filter(d=>d.trip).map(d=>desig(d)+": "+d.trip)}; }
    if(S.tplObj&&S.tplObj.checks){ out.tpl=[]; S.tplObj.checks((s,t,d)=>out.tpl.push({sev:s,t,d})); }
    return out; });
  const hasFault=res.err.length||res.trips.length;
  for(const e of res.err) add("e","Аварія при подачі напруги",e);
  for(const t of res.trips) add("e","Спрацював захист при ввімкненні",t);
  if(res.chatter) add("e","Схема «дзвенить»","Котушки вмикаються і вимикаються по колу. Перевірте блокувальні контакти.");
  if(!hasFault&&!res.chatter) add("ok",multi?"Подача напруги на обидва вводи — без аварій":"Подача напруги — без коротких замикань і дисбалансу");
  res.g.forEach((r,i)=>{ if(!r.ok) add("e",`${desig(G[i])} «${G[i].group.name}»: немає живлення`,G[i].type==="rcbo"?"Нуль групи береться з нижньої клеми N диф-автомата.":"Фаза — з верхньої клеми або гребінки, нуль — із шини XN1."); });
  if(multi){ for(const a of res.alt){ const bad=a.err.length||a.trips.length||a.g.length;
      if(bad){ for(const e of a.err) add("e",`Лише «${a.inp.label}»: аварія`,e); for(const t of a.trips) add("e",`Лише «${a.inp.label}»: спрацював захист`,t);
        if(a.g.length) add("e",`Лише «${a.inp.label}»: групи без живлення`,a.g.join(", ")+". АВР не перевів навантаження на резерв."); }
      else add("ok",`Від «${a.inp.label}» живляться всі групи`,"Перевірено з вимкненим основним вводом.");
      if(a.inp.inv){ const fg=G.filter(g=>a.fed.includes(g.id)), kw=a.inp.inv.kw, on=fg.reduce((x,g)=>x+kwOf(g),0), all=fg.reduce((x,g)=>x+kwOf(g,true),0);
        if(on>kw) add("e",`Від інвертора: увімкнено ${fmt(on,1)} кВт при номіналі ${fmt(kw,1)} кВт`,"Без мережі інвертор вимкнеться від перевантаження. На резерв залиште лише потрібне: холодильник, котел, світло, роутер — а бойлер чи плиту живіть лише від мережі (до АВР).");
        else if(all>kw) add("w",`Усі прилади на резерві разом ${fmt(all,1)} кВт — більше за інвертор ${fmt(kw,1)} кВт`,"Від інвертора не вмикайте одночасно чайник, бойлер, праску.");
        else if(fg.length) add("ok",`Інвертора ${fmt(kw,1)} кВт вистачає на всі групи резерву`); } }
    const bk=res.back; if(bk.err.length||bk.trips.length) for(const e of [...bk.err,...bk.trips]) add("e","Повернення на основний ввід: аварія",e);
    else add("ok","Перемикання туди й назад без зустрічного ввімкнення","Основний ввід вимкнули, потім повернули."); }
  // 3. Групи, кабелі, номінали
  const main=S.devices.filter(d=>(d.type==="qf2p"||d.type==="qf3p")&&b.inputs.some(i=>f0(d.id+":t1")===f0(i.id+":"+i.terms[0])));
  const mainIn=main.length?Math.min(...main.map(protIn)):0;
  if(!main.length&&G.length) add("e","Немає вступного автомата одразу після вводу","Ввід має заходити на верхні клеми вступного автомата.");
  else if(main.length) add("ok",`Вступн${main.length>1?"і автомати":"ий автомат"} ${main.map(d=>desig(d)+" "+d.rating).join(", ")}`);
  for(const R of S.devices.filter(d=>d.type==="rcd")) if(mainIn&&inA(R.rating)<mainIn) add("e",`${desig(R)} ${R.rating} А слабший за вступний ${mainIn} А`,"ПЗВ не має теплового захисту. Його номінал має бути не меншим за вступний автомат.");
  for(const K of S.devices.filter(d=>d.type==="kv")) if(mainIn&&inA(K.rating)<mainIn) add("e",`${desig(K)} ${K.rating} А слабше за вступний ${mainIn} А`,"Через контакт реле напруги йде струм усього щита. Номінал реле — не менший за вступний автомат: до C40 — реле 40 А, C50–C63 — реле 63 А.");
  const byp=rcdNBypass(f0);
  for(const R of byp) add("e",`${desig(R)}: нуль іде в обхід ПЗВ`,`Верхня і нижня клеми N ${desig(R)} з’єднані напряму (через шину N або перемичку). ПЗВ вимикатиметься від будь-якого приладу. Нуль від вступного — лише на верхню N ПЗВ, а на шину XN1 — лише з нижньої N.`);
  for(const g of G){ const In=inA(g.rating), max=CAB[g.group.sec], I=kwOf(g,true)*1000/(g3(g)?690:230);
    if(In>max) add("e",`${desig(g)} ${g.rating} на кабель ${fmt(g.group.sec)} мм²`,`Для ${fmt(g.group.sec)} мм² автомат не більше ${max} А, або кабель від ${fmt(secFor(In))} мм².`);
    if(I>1.45*In) add("e",`${desig(g)}: усі прилади разом — ${fmt(I)} А`,`Понад 1,45 × ${In} А, автомат вибиватиме. Розділіть групу.`);
    else if(I>In) add("w",`${desig(g)}: усі прилади разом — ${fmt(I)} А`,`Більше за номінал ${In} А. При одночасній роботі можливе вимкнення.`);
    if(mainIn&&In>=mainIn) add("w",`${desig(g)} ${g.rating} не менший за вступний`,"Немає селективності: при перевантаженні може вимкнутись увесь щит.");
    const rr=sandbox(()=>{ powerUp(); runFor(4); const X=makeX(build()), o={rc:0,byp:null};
      for(const R of S.devices.filter(R=>T[R.type].rcd)){ const pt=!makeX(build({openPole:new Set(lPoles(R))})).ph(gL(g)); if(pt) o.rc++;
        const np=nPole(R); if(o.byp||np<0||byp.some(x=>x.id===R.id)||!X.ph(gL(g))||!X.hasN(gN(g))) continue;
        const nt=!makeX(build({openPole:new Set([R.id+":"+np])})).hasN(gN(g)); if(pt!==nt) o.byp={id:R.id,pt}; }
      return o; }), rc=rr.rc;
    if(rr.byp){ const R=devById(rr.byp.id); add("e",`${desig(g)} «${g.group.name}»: ${rr.byp.pt?"нуль":"фаза"} в обхід ${desig(R)}`,
      rr.byp.pt?"Фаза групи йде через ПЗВ, а нуль — ні. ПЗВ вимкнеться, щойно запрацює прилад. Нуль групи — із шини N, яку живить нижня клема N цього ПЗВ."
               :"Нуль групи йде через ПЗВ, а фаза взята до нього. ПЗВ вимкнеться, щойно запрацює прилад. Фазу групи беріть із нижньої клеми ПЗВ."); }
    if(!rc) add(/освітл|світл/i.test(g.group.name)?"w":"e",`${desig(g)} «${g.group.name}» без ПЗВ`,"Розеткові групи й вологі приміщення потребують ПЗВ або диф-автомата 30 мА."); }
  if(mainIn&&b.inputs.length===1){ let low=0;
    for(const w of S.wires){ if(!["L","N"].includes(w.kind)) continue; const g2=build({ideal:true,skip:w.id}), g1=build({ideal:true});
      const aff=G.filter(g=>(g1(gL(g))===g1("in:L")&&g2(gL(g))!==g2("in:L"))||(g1(gN(g))===g1("in:N")&&g2(gN(g))!==g2("in:N")));
      if(!aff.length) continue; const req=aff.length>1||!aff.some(g=>w.a===gL(g)||w.b===gL(g))?mainIn:inA(aff[0].rating);
      if(CAB[w.sec]<req){ low++; add("e",`Замалий переріз ${fmt(w.sec)} мм²`,`${termName(w.a)} → ${termName(w.b)}: потрібно від ${fmt(secFor(req))} мм² (струм до ${req} А).`); } }
    if(!low&&S.wires.length) add("ok","Перерізи силових перемичок відповідають вступному автомату"); }
  if(G.length&&b.inputs.length===1&&!S.devices.some(d=>d.type==="kv")&&!S.field.some(f=>f.type==="inv")) add("w","Немає реле напруги","Без нього техніка не захищена від перенапруги.");
  for(const x of (res.tpl||[])) add(x.sev,x.t,x.d);
  for(const d of S.devices){ const used=S.wires.some(w=>w.a.startsWith(d.id+":")||w.b.startsWith(d.id+":"))||(S.comb&&d.type==="qf1p"&&d.slot>=S.comb.from&&d.slot<=S.comb.to);
    if(!used) add("w",`${desig(d)} не підключений`,"Апарат стоїть на рейці без жодного дроту."); }
  if(!S.devices.length) add("w","Щит порожній","Додайте апарати в режимі «Апарати».");
  const ord={e:0,w:1,ok:2}; Cl.sort((a,c)=>ord[a.sev]-ord[c.sev]); return Cl;
}
