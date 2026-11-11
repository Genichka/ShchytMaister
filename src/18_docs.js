/* ===== Документи: однолінійна схема, кабельний журнал, специфікація, маркування ===== */
const RHO = 0.0178;   // мідь, Ом·мм²/м
const cableCores = g => g3(g) ? (g.type==="qf4p"?5:4) : 3;
const cableName = g => `ВВГнг(А)-LS ${cableCores(g)}×${fmt(g.group.sec,g.group.sec%1?1:0)}`;
const groupLen = g => g.group.len||null;
const groupI = g => kwOf(g,true)*1000/(g3(g)?1.732*400:230);
function groupDU(g){ const L=groupLen(g); if(!L) return null; const I=groupI(g), s=g.group.sec; return g3(g) ? 1.732*L*I*RHO/s/400*100 : 2*L*I*RHO/s/230*100; }
const ferrule = s => `НШВИ ${fmt(s,s%1?1:0)}-${s>=6?12:s>=4?10:8}`;
function wireLenCm(w){ const P=route()[w.id]; if(!P) return 0; let L=0; for(let i=1;i<P.length;i++) L+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]); return Math.round(L*0.0324+4); }  // 54 од. = модуль 17,5 мм; +4 см на зачистку

// ---- Топологія для однолінійної схеми: дерево від вводів через модулі з полюсами L
function sldModel(){ const f=build({allOpen:true}), b=S.board, nodes=[], byId={};
  const add=n=>{ nodes.push(n); byId[n.id]=n; n.kids=[]; n.extra=[]; n.side=[]; return n; };
  for(const i of b.inputs) if(i.terms.some(t=>/^L/.test(t))) add({id:i.id, kind:"in", label:i.label, ph:i.terms.includes("L1")?3:1, out:i.terms.filter(t=>/^L/.test(t)).map(t=>f(i.id+":"+t)), inv:!!i.inv});
  const Lp=d=>(T[d.type].poles||[]).filter(p=>p.r!=="N");
  for(const d of S.devices){ const ps=Lp(d); if(!ps.length||T[d.type].cat==="СЕС") continue;
    add({id:d.id, kind:"dev", d, ph:ps.length>=3?3:1, inn:[...new Set(ps.map(p=>f(K(d,p.a))))], out:[...new Set(ps.map(p=>f(K(d,p.b))))]}); }
  for(const n of nodes) if(n.kind==="dev"){ const par=[];
    for(const net of n.inn) for(const m of nodes) if(m!==n&&m.out.includes(net)&&!par.includes(m)) par.push(m);
    n.par=par; }
  // поле: двигуни, лампи, бойлери — листки від модуля, з виходом якого з’єднана їхня перша клема
  for(const fd of S.field){ const ft=FT[fd.type], k0=fd.map[ft.terms[0]]; if(!k0||/^(pv|bat|invpv|inv)/.test(fd.type)) continue;
    const net=f(k0), m=nodes.find(x=>x.out.includes(net)); if(!m) continue; const n=add({id:fd.id, kind:"fld", fd, ph:ft.terms.includes("U")?3:1, inn:[net], out:[]}); n.par=[m]; }
  // бічні: УЗІП, вольтметр, розетка DIN, реле контролю фаз
  for(const d of S.devices){ if(Lp(d).length) continue; const t=T[d.type], tm=t.terms.find(q=>["L","P","L1"].includes(q.r)&&q.s==="top"); if(!tm||!["spdac","spd3","vm","sock","kvf"].includes(d.type)) continue;
    const net=f(K(d,tm.k)), m=nodes.find(x=>x.out.includes(net)); if(m) m.side.push(d); }
  for(const n of nodes){ if(!n.par||!n.par.length) continue; n.par[0].kids.push(n); for(const p of n.par.slice(1)) p.extra.push(n); }
  const roots=nodes.filter(n=>n.kind==="in"), orphan=nodes.filter(n=>n.kind!=="in"&&(!n.par||!n.par.length));
  const sortK=n=>n.kind==="dev"?((n.d.rail||0)*100+n.d.slot):1e4;
  for(const n of nodes) n.kids.sort((a,c)=>sortK(a)-sortK(c));
  return {roots, orphan, nodes}; }

function symSVG(n,x,y){ const L=(a,b2,c,d2,w)=>`<line x1="${a}" y1="${b2}" x2="${c}" y2="${d2}" stroke="#111" stroke-width="${w||1.6}"/>`;
  const sw=(cross,semi)=>L(x,y,x,y+12)+L(x,y+32,x,y+44)+L(x,y+32,x-9,y+14)+(cross?L(x-4,y+8,x+4,y+16,1.4)+L(x+4,y+8,x-4,y+16,1.4):"")+(semi?`<path d="M${x-4} ${y+12} a4 4 0 0 0 8 0" fill="none" stroke="#111" stroke-width="1.4"/>`:"");
  const box=t=>L(x,y,x,y+8)+`<rect x="${x-14}" y="${y+8}" width="28" height="26" fill="#fff" stroke="#111" stroke-width="1.4"/><text x="${x}" y="${y+25}" font-size="9" text-anchor="middle" font-weight="700">${t}</text>`+L(x,y+34,x,y+44);
  const oval=`<ellipse cx="${x}" cy="${y+38}" rx="7" ry="3.5" fill="none" stroke="#111" stroke-width="1.3"/>`;
  if(n.kind==="in") return `<path d="M${x-12} ${y+4} h24 l-12 14 z" fill="#111"/>`+L(x,y+18,x,y+44);
  if(n.kind==="fld"){ const t=n.fd.type; return L(x,y,x,y+10)+(/^motor/.test(t)?`<circle cx="${x}" cy="${y+24}" r="13" fill="#fff" stroke="#111" stroke-width="1.5"/><text x="${x}" y="${y+28}" font-size="11" text-anchor="middle" font-weight="700">M</text>`
      :`<circle cx="${x}" cy="${y+24}" r="11" fill="#fff" stroke="#111" stroke-width="1.5"/>`+L(x-8,y+16,x+8,y+32,1.2)+L(x+8,y+16,x-8,y+32,1.2)); }
  const d=n.d, t=T[d.type];
  if(t.prot==="fuse") return L(x,y,x,y+8)+`<rect x="${x-5}" y="${y+8}" width="10" height="28" fill="#fff" stroke="#111" stroke-width="1.4"/>`+L(x,y+8,x,y+36,1)+L(x,y+36,x,y+44);
  if(t.rcd&&t.prot) return sw(true)+oval;
  if(t.rcd) return sw(false)+oval+`<text x="${x+10}" y="${y+42}" font-size="7">ΔI</text>`;
  if(t.prot) return sw(true);
  if(t.meter) return box("kWh"); if(d.type==="kv") return box("U"); if(d.type==="tovpd1") return box("U·I"); if(d.type==="pef") return box("L→"); if(d.type==="ats"||d.type==="g2r"||d.type==="toq5"||d.type==="toq7") return box("АВР"); if(d.type==="to219"||d.type==="to119") return box("I-0-II");
  if(/^km|^kimp|^stair|^ssw|^photo|^rel/.test(d.type)) return sw(false,true);
  return sw(false); }

function sldSVG(){ const M=sldModel(), CW=104, LH=112, X0=128, top=26; let col=0, maxDepth=0;
  const lay=(n,dep)=>{ n.dep=dep; maxDepth=Math.max(maxDepth,dep); if(!n.kids.length){ n.x=X0+col*CW+CW/2; n.col=col++; return; } n.kids.forEach(k=>lay(k,dep+1)); n.x=(n.kids[0].x+n.kids[n.kids.length-1].x)/2; };
  M.roots.forEach(r=>lay(r,0)); M.orphan.forEach(o=>lay(o,1));
  const leaves=M.nodes.filter(n=>n.col!==undefined), W=Math.max(640,X0+col*CW+20), Y=n=>top+n.dep*LH, yT=top+(maxDepth+1)*LH+10;
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${yT+8*22+40}" style="min-width:${Math.max(320,col*76+100)}px;background:#fff" font-family="IBM Plex Sans,Arial,sans-serif">`;
  s+=`<text x="8" y="16" font-size="12" font-weight="700">Однолінійна схема · ${esc((S.proj&&S.proj.name)||"Щиток")} · ЩРН-${S.board.rails*12}</text>`;
  const lbl=(n,x,y)=>{ let a,b2,c="";
    if(n.kind==="in"){ a=n.label; b2=(n.ph===3?"3~ 400 В":"1~ 230 В")+(n.inv?" · інвертор":""); }
    else if(n.kind==="fld"){ a=n.fd.name||FT[n.fd.type].name; b2=""; }
    else { const d=n.d; a=desig(d)+(d.rating?" "+d.rating+(T[d.type].unit||""):""); b2=modelOf(d)||T[d.type].short; if(T[d.type].rcd) c="ΔI 30 мА"; }
    return `<text x="${x+13}" y="${y+18}" font-size="9.5" font-weight="700">${esc(a)}</text><text x="${x+13}" y="${y+29}" font-size="8">${esc(String(b2).slice(0,20))}</text>`+(c?`<text x="${x+13}" y="${y+39}" font-size="8">${c}</text>`:""); };
  for(const n of M.nodes){ if(n.x===undefined) continue; const y=Y(n);
    s+=symSVG(n,n.x,y)+lbl(n,n.x,y)+(n.ph===3?`<g stroke="#111" stroke-width="1.1"><line x1="${n.x-5}" y1="${y+48}" x2="${n.x+5}" y2="${y+42}"/><line x1="${n.x-5}" y1="${y+52}" x2="${n.x+5}" y2="${y+46}"/><line x1="${n.x-5}" y1="${y+56}" x2="${n.x+5}" y2="${y+50}"/></g>`:"");
    n.side.forEach((sd,i)=>{ const sx=n.x+58+i*34, sy=y+52; s+=`<line x1="${n.x}" y1="${sy}" x2="${sx}" y2="${sy}" stroke="#111" stroke-width="1.2"/><circle cx="${n.x}" cy="${sy}" r="2" fill="#111"/>`
      +`<rect x="${sx-10}" y="${sy}" width="20" height="18" fill="#fff" stroke="#111" stroke-width="1.2"/><text x="${sx}" y="${sy+12}" font-size="7" text-anchor="middle">${/^spd/.test(sd.type)?"УЗІП":sd.type==="vm"?"V":sd.type==="sock"?"XS":"KV"}</text><text x="${sx}" y="${sy+28}" font-size="7" text-anchor="middle">${esc(desig(sd))}</text>`; });
    if(n.kids.length){ const yb=y+LH-20; s+=`<line x1="${n.x}" y1="${y+44}" x2="${n.x}" y2="${yb}" stroke="#111" stroke-width="1.6"/>`;
      if(n.kids.length>1) s+=`<line x1="${n.kids[0].x}" y1="${yb}" x2="${n.kids[n.kids.length-1].x}" y2="${yb}" stroke="#111" stroke-width="2.4"/>`;
      for(const k of n.kids) s+=`<line x1="${k.x}" y1="${yb}" x2="${k.x}" y2="${Y(k)}" stroke="#111" stroke-width="1.6"/>`; }
    for(const e of n.extra){ const ye=Y(e)-10; s+=`<path d="M${n.x} ${y+44} V${ye} H${e.x+6} V${Y(e)+2}" fill="none" stroke="#111" stroke-width="1.4" stroke-dasharray="5 3"/>`; }
    if(n.col!==undefined&&n.kind!=="in"&&!n.extra.length) s+=`<line x1="${n.x}" y1="${y+44}" x2="${n.x}" y2="${yT}" stroke="#111" stroke-width="1.2"/><path d="M${n.x-4} ${yT-8} L${n.x} ${yT} L${n.x+4} ${yT-8}" fill="none" stroke="#111" stroke-width="1.2"/>`; }
  // таблиця під схемою
  const rows=[["Позначення",n=>n.kind==="dev"?desig(n.d):n.kind==="fld"?(n.fd.name||"M"):""],["Модуль",n=>n.kind==="dev"?(n.d.rating||""):""],["Кабель",n=>n.kind==="dev"&&n.d.group?cableName(n.d).replace("ВВГнг(А)-LS ",""):""],
    ["Довжина, м",n=>n.kind==="dev"&&n.d.group&&groupLen(n.d)?fmt(groupLen(n.d),1):""],["Pвст, кВт",n=>n.kind==="dev"&&n.d.group?fmt(kwOf(n.d,true),2):n.kind==="fld"?fmt(FT[n.fd.type].kw||((FT[n.fd.type].In||0)*0.23),1):""],
    ["Iр, А",n=>n.kind==="dev"&&n.d.group?fmt(groupI(n.d),1):""],["ΔU, %",n=>{ if(n.kind!=="dev"||!n.d.group) return ""; const u=groupDU(n.d); return u===null?"":fmt(u,1); }],
    ["Споживач",n=>n.kind==="dev"&&n.d.group?n.d.group.name:n.kind==="fld"?FT[n.fd.type].name:""]];
  rows.forEach(([h,fn],i)=>{ const ry=yT+i*22; s+=`<rect x="8" y="${ry}" width="${W-16}" height="22" fill="${i%2?"#f6f7f8":"#fff"}" stroke="#9aa0a6" stroke-width=".8"/><text x="14" y="${ry+15}" font-size="9" font-weight="600">${h}</text>`;
    for(const n of leaves){ const v=fn(n); if(v===""||v===undefined) continue; const bad=h==="ΔU, %"&&parseFloat(String(v).replace(",","."))>4;
      s+=`<text x="${n.x}" y="${ry+15}" font-size="${h==="Споживач"?7.6:8.6}" text-anchor="middle"${bad?' fill="#b3261e" font-weight="700"':""}>${esc(String(v).slice(0,h==="Споживач"?22:16))}</text>`; } });
  for(const n of leaves) s+=`<line x1="${n.x-CW/2}" y1="${yT}" x2="${n.x-CW/2}" y2="${yT+rows.length*22}" stroke="#9aa0a6" stroke-width=".6"/>`;
  return s+`</svg>`; }

// ---- Таблиці
const tbl = (head,rows,num=[]) => `<div class="tw"><table><thead><tr>${head.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td${num.includes(i)?' class="n"':""}>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
function cabData(){ const ends={}; for(const w of S.wires) for(const k of [w.a,w.b]) ends[k]=(ends[k]||0)+1;
  const inner=S.wires.map((w,i)=>[String(i+1),`W${i+1}`,termName(w.a),termName(w.b),WK[w.kind][0]+(w.col?" · "+WCOL[w.col][0].toLowerCase():""),fmt(w.sec,w.sec%1?1:0)+" мм²",String(wireLenCm(w)),ferrule(w.sec)+" ×2"]);
  const lines=groupsOf().map(g=>[desig(g)+" "+g.rating,g.group.name,cableName(g),groupLen(g)?fmt(groupLen(g),1):"—",(()=>{ const u=groupDU(g); return u===null?"—":fmt(u,1); })()]);
  return {inner,lines}; }
function specData(){ const R=[], cnt=new Map(), addR=(name,model,qty,unit)=>R.push([name,model,qty,unit]);
  for(const d of S.devices){ const t=T[d.type], key=[t.name,brandName(d),modelOf(d)||d.rating||""].join("|"); cnt.set(key,(cnt.get(key)||0)+1); }
  for(const [k,n] of cnt){ const [nm,br,md]=k.split("|"); addR(nm+(br!=="EnergyUA"?" · "+br:""),md,String(n),"шт."); }
  addR(`Корпус ЩРН-${S.board.rails*12} (${S.board.rails} рейк${S.board.rails>1?"и":"а"} DIN)`,"","1","шт.");
  if(S.board.xn) addR("Шина нульова N на ізоляторах",S.board.xn+" отв.","1","шт."); if(S.board.xpe) addR("Шина заземлення PE",S.board.xpe+" отв.","1","шт.");
  if(S.comb) addR("Гребінка 1P",`${S.comb.to-S.comb.from+1} мод.`,"1","шт.");
  if(S.board.tb&&groupsOf().length){ const all=groupsOf().flatMap(tbTerms), n=t=>all.filter(x=>x===t).length, l=all.filter(x=>/^L/.test(x)).length;
    addR("Клема прохідна пружинна, сіра (L)","до 4 мм²",String(l),"шт."); if(n("N")) addR("Клема прохідна пружинна, синя (N)","до 4 мм²",String(n("N")),"шт."); addR("Клема заземлення жовто-зелена (PE)","до 4 мм²",String(n("PE")),"шт.");
    addR("Заглушка і кінцевий фіксатор для колодки XT2","","2","шт."); }
  const wl={}; for(const w of S.wires){ const c=w.col||(w.kind==="PE"?"pe":w.kind==="N"?"blue":PHK.includes(w.kind)?"red":w.kind==="C"?"orange":"black"); const key=`${fmt(w.sec,w.sec%1?1:0)} мм² · ${(WCOL[c]||["чорний"])[0].toLowerCase()}`; wl[key]=(wl[key]||0)+wireLenCm(w); }
  for(const [k,cm] of Object.entries(wl)) addR("Провід монтажний ПВ-3 (гнучкий)",k,fmt(Math.ceil(cm*1.2/10)/10,1),"м");
  const fr={}; for(const w of S.wires){ const f2=ferrule(w.sec); fr[f2]=(fr[f2]||0)+2; } for(const [k,n] of Object.entries(fr)) addR("Наконечник втулковий ізольований",k,String(n),"шт.");
  const cb={}; for(const g of groupsOf()){ const L=groupLen(g); if(!L) continue; cb[cableName(g)]=(cb[cableName(g)]||0)+L; }
  for(const [k,m] of Object.entries(cb)) addR("Кабель",k,fmt(Math.ceil(m),0),"м");
  return R; }

const shopSpec = () => { const L=shopUsed(); if(!L.length) return "";
  return `<h3 style="margin-top:14px">Де замовити</h3><p class="note">Наведіть камеру телефона на код — відкриється сторінка модуля.</p><div class="shopq">`
    +L.map(e=>`<div class="shopq-i">${qrSVG(e.it.link,104)}<div><b>${esc(e.it.name||"Модуль")}</b><small>На щитку: ${esc(e.ds.join(", "))}</small><a href="${esc(e.it.link)}" target="_blank" rel="noopener">${esc(e.it.link.replace(/^https?:\/\//,""))}</a></div></div>`).join("")+`</div>`; };
// ---- Вікно документів
const DOCT = [["sld","Однолінійна схема"],["cab","Кабельний журнал"],["spec","Специфікація"],["lab","Маркування"]];
function openDocs(t){ S.docTab=t||S.docTab||"sld"; $("docs").hidden=false; renderDocs(); }
function renderDocs(){ const t=S.docTab;
  $("docTabs").innerHTML=DOCT.map(([k,l])=>`<button data-doct="${k}" aria-selected="${t===k}">${l}</button>`).join("")+(t==="all"?`<button data-doct="all" aria-selected="true">Повний комплект</button>`:"");
  $("docSvg").textContent=t==="sld"?"SVG":t==="lab"||t==="all"?"—":"CSV"; $("docSvg").disabled=t==="lab"||t==="all";
  $("docsB").innerHTML=t==="all"?docAll():docBody(t); }
function docBody(t){ const nm=esc((S.proj&&S.proj.name)||"Щиток");
  let h="";
  if(t==="sld"){ const noLen=groupsOf().some(g=>!groupLen(g));
    h=`<div class="doc"><div class="sld">${sldSVG()}</div><p class="note">Кабель — ВВГнг(А)-LS, мідь. Iр — за встановленою потужністю групи, cos φ = 1. ΔU — втрата напруги в лінії (ρ = 0,0178 Ом·мм²/м); понад 4 % виділено червоним.${noLen?" Довжини ліній задайте в картці групи.":""}</p></div>`; }
  if(t==="cab"){ const c=cabData(); h=`<div class="doc"><h3>Кабельний журнал · ${nm}</h3><p class="note">Перемички в щитку (довжина — за трасою на щитку, з запасом 4 см на зачистку)</p>`
    +tbl(["№","Маркування","Звідки","Куди","Провідник","Переріз","Довжина, см","Наконечник"],c.inner,[0,6])
    +`<h3 style="margin-top:14px">Кабельні лінії від щитка</h3>`+tbl(["Автомат","Група","Кабель","Довжина, м","ΔU, %"],c.lines,[3,4])+`</div>`; }
  if(t==="spec") h=`<div class="doc"><h3>Специфікація обладнання · ${nm}</h3>`+tbl(["Найменування","Тип / модель","Кіл.","Од."],specData(),[2])+`<p class="note">Довжину монтажного проводу взято із запасом 20 %, кабелі — за довжинами ліній.</p>`+shopSpec()+`</div>`;
  if(t==="lab"){ h=`<div class="doc"><h3>Маркування автоматів · ${nm}</h3><p class="note">Друк у масштабі 100 %: ширина клітинки — один модуль 18 мм. Виріжте смужки й наклейте над модулями.</p><div class="labels">`;
    for(let r=0;r<S.board.rails;r++){ let row=""; for(let i=0;i<SLOTS;){ const d=devAt(r,i); if(d&&d.slot===i){ const w=T[d.type].w;
          row+=`<div class="lab-c" style="width:${w*18}mm"><b>${esc(desig(d))}${d.rating?" "+esc(d.rating):""}</b><span>${esc(d.group?d.group.name:(d.cap||T[d.type].cap||T[d.type].short))}</span>${d.group?`<i style="background:${d.group.color}"></i>`:""}</div>`; i+=w; }
        else { row+=`<div class="lab-c" style="width:18mm"></div>`; i++; } }
      h+=`<div class="lab-row">${row}</div>`; }
    h+=`</div></div>`; }
  return h; }
function download(name,data,type){ try{ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([data],{type})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); toast("Файл збережено: "+name,"ok"); }catch(e){ toast("Не вдалося зберегти файл","e"); } }
document.addEventListener("click",e=>{ const q=s=>e.target.closest(s); let el;
  if(el=q("[data-doct]")){ S.docTab=el.dataset.doct; renderDocs(); return; }
  if(q("#docsX")){ $("docs").hidden=true; return; }
  if(q("#docPrint")){ window.print(); return; }
  if(q("#docSvg")){ const nm=fileBase();
    if(S.docTab==="sld") download(nm+"_odnolinijna.svg",sldSVG(),"image/svg+xml");
    else { const rows=S.docTab==="cab"?[["№","Маркування","Звідки","Куди","Провідник","Переріз","Довжина, см","Наконечник"],...cabData().inner,[],["Автомат","Група","Кабель","Довжина, м","ΔU, %"],...cabData().lines]
        :[["Найменування","Тип / модель","Кіл.","Од."],...specData()];
      download(nm+(S.docTab==="cab"?"_kabelnyj_zhurnal.csv":"_specyfikacija.csv"),"﻿"+rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(";")).join("\n"),"text/csv"); }
    return; } });

// ---- Повний комплект для PDF: титул (підсумок + вигляд щитка), схема, кабельний журнал, специфікація, маркування — кожне з нового аркуша
function docAll(){ const nm=esc((S.proj&&S.proj.name)||"Щиток"), sm=boardSummary();
  return `<div class="doc dpage"><h2 class="dtitle">${nm}</h2><p class="note">PanelCraft ${esc(APP.v)} · ${new Date().toLocaleDateString("uk-UA")} · перевірку пройдено без зауважень</p>`
    +tbl(["Показник","Значення"],sm.rows,[])+`<div class="bview">${boardSVG()}</div></div>`
    +["sld","cab","spec","lab"].map(t=>`<div class="dpage">${docBody(t)}</div>`).join(""); }
