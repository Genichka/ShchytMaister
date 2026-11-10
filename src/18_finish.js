// ---- Логічне завершення: перевірка без зауважень → «Щиток готовий» з підсумком і збереженням у PDF або Visio
// назва файлу латиницею (деякі браузери інакше зберігають як «download»)
const TRL={а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ie",ж:"zh",з:"z",и:"y",і:"i",ї:"i",й:"i",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ь:"",ю:"iu",я:"ia","’":"","'":""};
const fileBase = () => [...((S.proj&&S.proj.name)||"shchyt").toLowerCase()].map(c=>TRL[c]??c).join("").replace(/[^a-z0-9-]+/g,"_").replace(/^_+|_+$/g,"")||"shchyt";
function boardSummary(){ const b=S.board, G0=groupsOf(), mods=S.devices.reduce((a,d)=>a+T[d.type].w,0), mm=px=>Math.round(px/G.MW*17.5);
  const kind={"1ph":"1 фаза","3ph":"3 фази","2in":"мережа + генератор","2inv":"мережа + інвертор","3inv":"3 фази + інвертор"}[boardKind(b)]||boardKind(b);
  const rows=[["Ввід",kind],["Корпус",`≈ ${mm(812)} × ${mm(enclB()-70)} мм · ${b.rails} рейк${b.rails===1?"а":b.rails<5?"и":""} · зайнято ${mods} з ${SLOTS*b.rails} мод.`],
    ["Модулів",String(S.devices.length)],["Груп (ліній)",G0.length?G0.length+": "+G0.map(g=>`${desig(g)} ${g.rating} «${g.group.name}»`).join(", "):"—"],
    ["Перемичок у щитку",String(S.wires.length)]];
  return {rows,kinds:kind,mods,groups:G0.length}; }
// Вигляд щитка окремим SVG з вбудованими стилями — відкривається у Visio (Файл → Відкрити), Inkscape, браузері
function boardSVG(){ const keep={mode:S.mode,pick:S.pick,selDev:S.selDev,selWire:S.selWire,pend:S.pend,moveDev:S.moveDev,repl:S.repl,moveEnd:S.moveEnd};
  S.mode="doc"; S.pick=S.selDev=S.selWire=S.pend=S.moveDev=S.repl=S.moveEnd=null; render();
  const src=$("svg"), cl=src.cloneNode(true), a=src.querySelectorAll("*"), b=cl.querySelectorAll("*"), drop=[];
  const P=["fill","stroke","stroke-width","stroke-dasharray","stroke-linecap","stroke-linejoin","opacity","fill-opacity","stroke-opacity","font-family","font-size","font-weight","font-style","text-anchor","dominant-baseline","letter-spacing","paint-order"];
  for(let i=0;i<a.length;i++){ const o=a[i], cs=getComputedStyle(o);
    if(cs.display==="none"||o.classList.contains("wire-hit")||o.hasAttribute("data-slot")||o.closest("[data-closeboard]")){ drop.push(b[i]); continue; }
    let st=""; for(const p of P){ const v=cs.getPropertyValue(p); if(v&&v!=="normal"&&v!=="auto") st+=`${p}:${v};`; }
    const n=b[i]; n.setAttribute("style",st); n.removeAttribute("class"); for(const at of [...n.attributes]) if(at.name.startsWith("data-")) n.removeAttribute(at.name); }
  for(const n of drop) n.remove();
  Object.assign(S,keep); render();
  const vb=(cl.getAttribute("viewBox")||"0 0 952 800").split(/\s+/).map(Number), bg=getComputedStyle(document.body).backgroundColor||"#111217";
  cl.setAttribute("xmlns","http://www.w3.org/2000/svg"); cl.setAttribute("width",vb[2]); cl.setAttribute("height",vb[3]); cl.removeAttribute("id"); cl.removeAttribute("style");
  let s=solidSVG(new XMLSerializer().serializeToString(cl));
  return s.replace(/(<svg[^>]*>)/,`$1<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="${bg}"/>`); }
// sldSVG — може містити змінні CSS: підставляємо значення, щоб файл був самодостатній
const solidSVG = s => s.replace(/var\(--([\w-]+)\)/g,(m,v)=>(getComputedStyle(document.documentElement).getPropertyValue("--"+v).trim()||"#888").replace(/"/g,"'"));
function printAll(){ closeDlg(); S.docTab="all"; openDocs("all"); setTimeout(()=>window.print(),350); }
function saveVisio(which){ const nm=fileBase();
  if(which==="board") download(nm+"_shchyt.svg",'<?xml version="1.0" encoding="UTF-8"?>\n'+boardSVG(),"image/svg+xml");
  else download(nm+"_odnolinijna.svg",'<?xml version="1.0" encoding="UTF-8"?>\n'+solidSVG(sldSVG()),"image/svg+xml"); }
function showFinish(nChecks){ const sm=boardSummary(), nm=esc((S.proj&&S.proj.name)||"Щиток");
  $("dlgCard").innerHTML=`<div class="fin"><div class="fin-ok">✓</div><h2 id="dlgTitle">Щиток готовий</h2>
    <p class="fin-s">«${nm}» — перевірок пройдено: ${nChecks}, зауважень немає. Проєкт збережено.</p>
    <div class="fin-sum">${sm.rows.slice(0,4).map(([k,v])=>`<div><small>${esc(k)}</small><b>${esc(k==="Груп (ліній)"?String(sm.groups):v)}</b></div>`).join("")}</div>
    <p class="lbl2">Зберегти документацію</p>
    <div class="pgrid fin-g"><button class="pbtn" data-fin="pdf"><span class="fi">📄</span><b>PDF — повний комплект</b><small>щиток, схема, кабельний журнал, специфікація, наклейки</small></button>
      <button class="pbtn" data-fin="vboard"><span class="fi">📐</span><b>Visio — вигляд щитка</b><small>SVG: у Visio «Файл → Відкрити»</small></button>
      <button class="pbtn" data-fin="vsld"><span class="fi">📐</span><b>Visio — однолінійна схема</b><small>SVG, редагується у Visio</small></button>
      <button class="pbtn" data-fin="test"><span class="fi">⚡</span><b>Тест під напругою</b><small>подати живлення й перевірити захист</small></button></div>
    <div class="row dlg-f"><button class="btn" data-fin="close">Закрити</button></div></div>`;
  DLG=[]; $("dlg").hidden=false; const f=$("dlgCard").querySelector('[data-fin="pdf"]'); if(f) f.focus(); }
document.addEventListener("click",e=>{ const el=e.target.closest("[data-fin]"); if(!el) return; const a=el.dataset.fin;
  if(a==="pdf"){ printAll(); return; } if(a==="vboard"){ saveVisio("board"); return; } if(a==="vsld"){ saveVisio("sld"); return; }
  closeDlg(); if(a==="test"){ S.mode="test"; S.pend=null; S.pick=null; S.selWire=null; S.selDev=null; renderAll(); } });
