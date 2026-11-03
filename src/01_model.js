"use strict";
/* ===== Модель v2: реєстр типів, стан, допоміжні функції ===== */
const T = {};   // апарати на DIN-рейці
const FT = {};  // польове обладнання (двигуни, СЕС, клапани…)
const defType = (k, d) => { d.k = k; T[k] = d; };
const defField = (k, d) => { d.k = k; FT[k] = d; };
const SLOTS = 12;
const CAB = {1.5:10,2.5:16,4:25,6:32,10:50,16:63,25:80,35:100,50:125};
const SECS = [1.5,2.5,4,6,10,16,25,35,50];
const U_MIN = 170, U_MAX = 250, KV_DELAY = 3;
const GCOL = ["#ff9830","#5b8ff0","#4fae4f","#b877d9","#e85c8a","#e0b400","#3fb6c9","#e8735a"];
const LOADS = [["Плита",4.0],["Духова шафа",3.5],["Електрокотел",6.0],["Чайник",2.0],["Мікрохвильовка",1.2],["Пральна машина",2.2],
  ["Посудомийна машина",1.8],["Бойлер",2.0],["Холодильник",0.15],["Кондиціонер",1.0],["Обігрівач",2.0],["Тепла підлога",1.5],
  ["Пилосос",1.6],["Праска",2.2],["Комп’ютер",0.35],["Телевізор",0.15],["Фен",1.8],["Сушильна машина",2.5],["Блендер",0.6],
  ["Тостер",0.9],["Зарядки",0.02],["Освітлення",0.1],["Роутер",0.01],["Домофон",0.02],["Газовий котел",0.15],["Насос",0.75],["Зарядка електромобіля",3.7]];
// Види дротів: колір і підпис
const WK = { L:["Фаза L","#e0352b"], L1:["L1","#8b5a2b"], L2:["L2","#26282c"], L3:["L3","#9aa0a6"], N:["Нуль N","#2f6fdf"],
  PE:["PE",null], C:["Керування","#f08c2e"], "DC+":["DC +","#d42a4a"], "DC-":["DC −","#26282c"] };
const PHK = ["L","L1","L2","L3"];
// Сумісність виду дроту з роллю клеми
function kindFits(kind, role){
  if(!role || role==="any") return true;
  if(role==="DC") return kind==="DC+"||kind==="DC-";
  if(role==="P"||role==="L") return PHK.includes(kind)||kind==="C";
  if(role==="C") return kind!=="PE" && kind!=="DC+" && kind!=="DC-";
  if(PHK.includes(role)) return PHK.includes(kind)||kind==="C";
  return kind===role;
}
const inA = r => parseFloat(String(r).replace(",",".").replace(/^[^\d]*/,"")) || 0;
const secFor = I => SECS.find(s => CAB[s] >= I) || 50;
const fmt = (v,d=1) => (Math.round(v*10**d)/10**d).toFixed(d).replace(".",",");
const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let UID = 1; const uid = p => p + (UID++);

function mkGroup(i,name,sec,loads){ return {name, sec, color:GCOL[i%GCOL.length], loads:(loads||[]).map(([n,kw,on])=>({n,kw,on:!!on}))}; }
function mkDev(type, rail, slot, rating, extra){
  const t=T[type]; const d={id:uid("d"), type, rail, slot, rating:rating||t.def||"", on:true, trip:null};
  if(t.init) t.init(d);
  if(t.group && !t.groupOpt && !(extra&&(extra.group||extra.noGroup))) d.group=mkGroup(slot,"Нова група",2.5,[]);
  return Object.assign(d, extra||{});
}
function mkField(type, map, extra){ const d={id:uid("f"), type, map}; if(FT[type].init) FT[type].init(d); return Object.assign(d, extra||{}); }

const DEFAULT_BOARD = () => ({ rails:1, inputs:[{id:"in",label:"Ввід",terms:["L","N","PE"]}], xn:8, xpe:8, xt:[] });
const S = { tpl:"flat", board:DEFAULT_BOARD(), devices:[], field:[], wires:[], comb:null, src:{in:{on:false,U:230,lost:{}}}, env:{},
  mode:"mount", pend:null, pick:null, selWire:null, selDev:null, wireKind:"L", wireSec:2.5, zoom:1, log:[],
  leak:new Set(), short:new Set(), leakWarned:new Set(), arc:new Set(), arcWarned:new Set(), brand:"eua", heat:{}, sim:null, demo:null, uWarned:false };

const KEY = "shchyt-majster-v2";
function save(){
  try{ localStorage.setItem(KEY, JSON.stringify({tpl:S.tpl, board:S.board, devices:S.devices, field:S.field, wires:S.wires, comb:S.comb,
    src:S.src, env:S.env, env0:S.env0, proj:S.proj, guide:S.guide, baseSig:S.baseSig, plan:S.plan||null, UID})); }catch(e){}
  if(typeof storeProject==="function") storeProject();
}
function load(){
  try{ const j=JSON.parse(localStorage.getItem(KEY)||"null");
    if(j && Array.isArray(j.devices) && j.board){ Object.assign(S,{tpl:j.tpl, board:j.board, devices:j.devices, field:j.field||[], wires:j.wires||[],
      comb:j.comb||null, src:j.src||{}, env:j.env||{}, env0:j.env0, proj:j.proj||null, guide:j.guide||null, baseSig:j.baseSig||null, plan:j.plan||null}); UID=Math.max(UID,j.UID||1);
      for(const k of Object.keys(S.src)) S.src[k].on=false;   // після перезавантаження джерела вимкнені
      return true; } }catch(e){}
  return false;
}
const devById = id => S.devices.find(d=>d.id===id) || S.field.find(d=>d.id===id);
const railDevs = r => S.devices.filter(d=>(d.rail||0)===r);
const devAt = (r,slot) => railDevs(r).find(d=>slot>=d.slot && slot<d.slot+T[d.type].w);
function freeAt(r,slot,w,ignore){ if(r<0||r>=S.board.rails||slot<0||slot+w>SLOTS) return false;
  for(let i=slot;i<slot+w;i++){ const d=devAt(r,i); if(d&&d!==ignore) return false; } return true; }
function desig(d){
  if(!T[d.type]) return d.name || FT[d.type].pre;
  const p=T[d.type].pre; const same=S.devices.filter(x=>T[x.type].pre===p).sort((a,b)=>((a.rail||0)-(b.rail||0))||(a.slot-b.slot));
  return p+(same.findIndex(x=>x.id===d.id)+1);
}
// Клеми: "in:L", "in2:N", "xn:3", "xpe:0", "xt:U", "d12:A1"
function termDef(key){
  const [o,k]=key.split(":"); const d=S.devices.find(x=>x.id===o); if(!d) return null;
  return T[d.type].terms.find(t=>t.k===k)||null;
}
function termRole(key){
  const [o,k]=key.split(":");
  if(S.board.inputs.some(i=>i.id===o)) return k==="N"?"N":k==="PE"?"PE":k;
  if(o==="xn") return "N"; if(o==="xpe") return "PE";
  if(o==="tb"){ const t=key.split(":")[2]; return t==="N"?"N":t==="PE"?"PE":t==="L"?"L":t; }
  if(o==="xt"){ const x=S.board.xt.find(x=>x.k===k); return x?x.r:null; }
  const t=termDef(key); return t?t.r:null;
}
function termName(key){
  const [o,k]=key.split(":");
  const inp=S.board.inputs.find(i=>i.id===o); if(inp) return inp.label+" "+k;
  if(o==="xn") return "Шина N (XN1)"; if(o==="xpe") return "Шина PE (XPE1)";
  if(o==="tb"){ const g=S.devices.find(x=>x.id===k); return `XT2 ${g?desig(g):"?"} «${key.split(":")[2]}»`; }
  if(o==="xt"){ const x=S.board.xt.find(x=>x.k===k); return "Клема XT1 «"+(x?x.l:k)+"»"; }
  const d=S.devices.find(x=>x.id===o); if(!d) return key; const t=termDef(key);
  return desig(d)+" клема «"+(t?t.l:k)+"»";
}
function allTermKeys(){
  const keys=[]; for(const inp of S.board.inputs) for(const t of inp.terms) keys.push(inp.id+":"+t);
  for(let i=0;i<S.board.xn;i++) keys.push("xn:"+i); for(let i=0;i<S.board.xpe;i++) keys.push("xpe:"+i);
  for(const x of S.board.xt) keys.push("xt:"+x.k);
  if(S.board.tb) for(const g of groupsOf()) for(const t of tbTerms(g)) keys.push(tbK(g,t));
  for(const d of S.devices) for(const t of T[d.type].terms) keys.push(d.id+":"+t.k);
  return keys;
}
function logp(cls,msg){ const t=new Date(); const p=n=>String(n).padStart(2,"0");
  S.log.unshift({cls,msg:`${p(t.getHours())}:${p(t.getMinutes())}:${p(t.getSeconds())} ${msg}`}); S.log.length=Math.min(S.log.length,60); }
