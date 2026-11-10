/* ===== Виробники й моделі апаратів (лише назви серій і моделей звичайним текстом, без логотипів) ===== */
const BR = {
  eua:{n:"EnergyUA"},
  abb:{n:"ABB", tint:"#8d98a3"}, se:{n:"Schneider Electric", s:"Schneider", tint:"#ffffff"}, hager:{n:"Hager", tint:"#7f8a96"},
  legrand:{n:"Legrand", tint:"#ffffff"}, eaton:{n:"Eaton", tint:"#a7adb3"}, siemens:{n:"Siemens", tint:"#6f7c88"}, iek:{n:"IEK", tint:"#c9ccd0"},
  zubr:{n:"ZUBR", tint:"#d7dadd"}, digitop:{n:"Digitop", tint:"#e2e4e6"}, novatek:{n:"Новатек-Електро", s:"Новатек", tint:"#d9dde1"},
  nik:{n:"NIK", tint:"#d4d7da"}, eastron:{n:"Eastron", tint:"#c4c9ce"}, finder:{n:"Finder", tint:"#9aa3ab"},
  geya:{n:"GEYA", tint:"#e8eaed"}, tomzn:{n:"TOMZN", tint:"#eef0f3"} };
// модульні контактори NO / NC: GEYA GYHC, TOMZN TOCT1
const kmcM = (p,cfg) => ({ geya:d=>`GYHC-${d.rating} ${p}P ${cfg}`, tomzn:d=>`TOCT1-${d.rating} ${p}P ${cfg}` });
const cv = d => (String(d.rating).match(/^[BCD]/)||["C"])[0], In2 = d => String(Math.round(inA(d.rating))).padStart(2,"0");
const mcb = p => ({ abb:d=>`S20${p} ${d.rating}`, se:d=>`iC60N ${p}P ${d.rating}`, hager:d=>`M${cv(d)}N${p}${In2(d)}`, legrand:d=>`DX³ ${p}P ${d.rating}`,
  eaton:d=>`PL6-${d.rating}/${p}`, siemens:d=>`5SL6${p}${In2(d)}-${cv(d)==="B"?6:7}`, iek:d=>`ВА47-29 ${p}P ${d.rating}`});
const MODELS = {
  qf1p:mcb(1), qf2p:mcb(2), qf3p:mcb(3), qf4p:mcb(4),
  qfn:{ se:d=>`iDPN N ${d.rating}`, abb:d=>`SN201 ${d.rating}`, legrand:d=>`DX³ 1P+N ${d.rating}`, eaton:d=>`PLN6-${d.rating}/1N`, iek:d=>`ВА47-29 1P+N ${d.rating}`},
  rcd:{ abb:d=>`F202 AC-${d.rating}/0,03`, se:d=>`iID 2P ${d.rating}A 30mA`, legrand:d=>`RX³ 2P ${d.rating}A 30mA`, eaton:d=>`PF6-${d.rating}/2/003`,
    siemens:d=>`5SV3 2P ${d.rating}A 30mA`, hager:d=>`ПЗВ 2P ${d.rating}A 30mA`, iek:d=>`ВД1-63 2P ${d.rating}А 30мА`},
  rcd4:{ abb:d=>`F204 AC-${d.rating}/0,03`, se:d=>`iID 4P ${d.rating}A 30mA`, legrand:d=>`RX³ 4P ${d.rating}A 30mA`, eaton:d=>`PF6-${d.rating}/4/003`, siemens:d=>`5SV3 4P ${d.rating}A 30mA`, iek:d=>`ВД1-63 4P ${d.rating}А 30мА`},
  rcbo:{ abb:d=>`DS201 ${d.rating} AC30`, se:d=>`iDPN N Vigi ${d.rating}`, legrand:d=>`DX³ АВДТ ${d.rating}`, eaton:d=>`PKNM-${inA(d.rating)}/1N/${cv(d)}/003`, siemens:d=>`5SU1 1P+N ${d.rating}`, iek:d=>`АВДТ32 ${d.rating} 30мА`},
  afdd:{ se:d=>`iARC ${d.rating}`, abb:d=>`S-ARC1 ${d.rating}`, siemens:d=>`5SM6 AFDD ${d.rating}`, hager:d=>`AFDD 1P+N ${d.rating}`},
  kv:{ zubr:d=>`D${d.rating}`, digitop:d=>`Vp-${d.rating}A`},
  pm1:{ nik:()=>"NIK 2104", eastron:()=>"SDM120"}, pm3:{ nik:()=>"NIK 2303", eastron:()=>"SDM630"},
  spdac:{ abb:()=>"OVR T2 1N 40 275", se:()=>"iPRD40r 1P+N", hager:()=>"УЗІП T2 1P+N 40 кА", iek:()=>"ОПС1-C 1P+N"},
  spd3:{ abb:()=>"OVR T2 3N 40 275", se:()=>"iPRD40r 3P+N", hager:()=>"УЗІП T2 3P+N 40 кА", iek:()=>"ОПС1-C 3P+N"},
  km2a:{ abb:()=>"ESB20-20N", se:()=>"iCT 25A 2NO", hager:()=>"ESC225", eaton:()=>"Z-SCH230/25-20", iek:()=>"КМ20-20"},
  kimp:{ abb:()=>"E290-16", se:()=>"iTL 16A", finder:()=>"26.01", hager:()=>"EPN510"},
  stair:{ abb:()=>"E232", se:()=>"MIN", finder:()=>"14.01"},
  kt:{ finder:()=>"80.01", abb:()=>"CT-ERD", geya:()=>"GRT8-A1", tomzn:()=>"TORT7-A1"},
  ktb:{ geya:()=>"GRT8-D", tomzn:()=>"TORT7-B1"}, ktm:{ geya:()=>"GRT8-M1", finder:()=>"80.01"},
  kmc1no:kmcM(1,"1NO"), kmc1nc:kmcM(1,"1NC"), kmc2no:kmcM(2,"2NO"), kmc11:kmcM(2,"1NO1NC"), kmc2nc:kmcM(2,"2NC"),
  kmc4no:kmcM(4,"4NO"), kmc31:kmcM(4,"3NO1NC"), kmc22:kmcM(4,"2NO2NC"), kmc4nc:kmcM(4,"4NC"),
  sw2:{ abb:()=>"SD202/40", se:()=>"iSW 2P 40A", legrand:()=>"DX³-IS 2P 40A", iek:()=>"ВН-32 2P 40А"},
  pef:{ novatek:()=>"ПЕФ-301"}, kvf:{ novatek:()=>"РНПП-311", finder:()=>"70.31"},
  fuac:{ abb:d=>`E91/32 · ${d.rating}`, se:d=>`DF101 · ${d.rating}`, iek:d=>`ПВ1 · ${d.rating}`} };
const brandsFor = type => ["eua",...Object.keys(MODELS[type]||{})];
const brandOf = d => (d.brand&&MODELS[d.type]&&MODELS[d.type][d.brand]) ? d.brand : "eua";
function modelOf(d){ const b=brandOf(d); return b==="eua"?"":MODELS[d.type][b](d); }
const mdl = (d,def) => modelOf(d)||def;
const brandName = d => { if(T[d.type]&&T[d.type].maker) return T[d.type].maker; const b=BR[brandOf(d)]; return b.s||b.n; };
const devFill = d => { const b=BR[brandOf(d)]; return b.tint?`color-mix(in srgb,var(--dev) 86%,${b.tint})`:""; };
