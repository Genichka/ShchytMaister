/* ===== Нові апарати: автомат 1P+N, AFDD, вимикач навантаження, запобіжник AC, перемикач фаз, вольтметр, УЗІП 3P+N, сходовий таймер ===== */
defType("qfn",{...brk, name:"Автомат 1P+N (1 модуль)", short:"Автомат 1P+N", cat:"Захист", w:1, pre:"QF", group:true,
  terms:T1N, poles:PLN, ratings:["B6","B10","B16","B20","B25","B32","C6","C10","C16","C20","C25","C32","C40"], def:"B16", face:breakerFace});
defType("afdd",{...brk, name:"AFDD — захист від іскріння + автомат 1P+N", short:"AFDD (іскріння)", cat:"Захист", w:2, pre:"QFA", group:true, afdd:true,
  terms:T1N, poles:PLN, ratings:["B6","B10","B16","B20","B25","B32","C6","C10","C16","C20","C25","C32"], def:"B16",
  face(d,g){ return breakerFace(d,g)+tx(g.x+g.w-14,g.y+98,"AFDD",{fs:6,fw:700})+led(g.x+g.w-14,g.y+110,d.trip&&/іскр/.test(d.trip)?"#ffb21f":"#5a5e66")+tx(g.x+14,g.y+98,"ARC",{fs:6,fw:700}); }});
defType("sw2",{name:"Вимикач навантаження 2P 40 А", short:"Вимикач 2P", cat:"Комутація", w:2, pre:"QS", sheetRatings:false,
  terms:T2P, poles:PLN, closed:d=>d.on!==false, cap:"Головний вимикач",
  tap(d){ d.on=d.on===false; logp(d.on?"ok":"w",`${desig(d)}: ${d.on?"увімкнено":"вимкнено"} вручну`); return true; },
  face(d,g){ const on=d.on!==false; return tx(g.cx,g.y+68,mdl(d,"ВИМИКАЧ 2P · 40 А"),{fs:6.4,fw:700})+lever(d,g.cx,g.y+80,44,on,"#e0352b")+tx(g.cx,g.y+142,on?"I — ON":"O — OFF",{fs:7.5,fw:700,ff:"var(--mono)"}); }});
defType("fuac",{name:"Запобіжник 10×38 gG у тримачі", short:"Запобіжник AC", cat:"Захист", w:1, pre:"FU", prot:"fuse",
  terms:T1P, poles:P1P,
  ratings:["2 А","4 А","6 А","10 А","16 А","20 А","25 А","32 А"], def:"10 А", cap:"Запобіжник",
  tap(d){ if(d.trip){ d.trip=null; d.on=false; S.heat[d.id]=0; logp("ok",`${desig(d)}: вставлено нову плавку вставку ${d.rating}`); return true; }
    if(d.on){ const I=(S.sim&&S.sim.I[d.id])||0; if(I>0.5) logp("w",`${desig(d)}: тримач відкрито під струмом ${fmt(I)} А. Тримач — не вимикач, спершу зніміть навантаження.`); d.on=false; } else d.on=true; return true; },
  face(d,g){ const open=!d.on, blown=!!d.trip;
    return tx(g.cx,g.y+64,modelOf(d)||"10×38 gG",{fs:5.4,fw:700})+`<g data-lever="${d.id}" style="cursor:pointer"><rect x="${g.cx-15}" y="${g.y+72}" width="30" height="64" rx="4" fill="#2a2d33"/>`
      +`<rect x="${g.cx-9}" y="${g.y+(open?96:80)}" width="18" height="44" rx="3" fill="${open?"#565b63":"#3a3f47"}"/><rect x="${g.cx-5}" y="${g.y+(open?104:88)}" width="10" height="26" rx="2" fill="${blown?"#e23b3b":"#e8dcc0"}"/></g>`
      +tx(g.cx,g.y+148,blown?"згоріла":open?"відкрито":d.rating,{fs:6.5,fw:700}); }});
defType("pef",{name:"Перемикач фаз автоматичний (3ф → 1ф)", short:"Перемикач фаз", cat:"Контроль", w:3, pre:"KV",
  terms:[{k:"L1",s:"top",r:"P",l:"L1"},{k:"L2",s:"top",r:"P",l:"L2"},{k:"L3",s:"top",r:"P",l:"L3"},{k:"N",s:"top",r:"N",l:"N"},{k:"Lo",s:"bot",r:"L",l:"L вих",m:1}],
  poles:[{a:"L1",b:"Lo",r:"L"},{a:"L2",b:"Lo",r:"L"},{a:"L3",b:"Lo",r:"L"}], closed:(d,pi)=>d.ok&&d.sel===pi, init:d=>{ d.sel=d.sel||0; }, cap:"Вибір фази",
  logic(d,X){ const U=["L1","L2","L3"].map(t=>X.ph(K(d,t))&&X.hasN(K(d,"N"))?srcU(X.ph(K(d,t))):0), good=U.map(u=>u>=U_MIN&&u<=U_MAX); d.U=U;
    const was=d.ok?d.sel:-1, nsel=good[d.sel]?d.sel:good.indexOf(true); d.ok=nsel>=0; if(d.ok) d.sel=nsel;
    const now=d.ok?d.sel:-1; if(now!==was){ logp(now<0?"e":"w",now<0?`${desig(d)}: жодна фаза не в нормі — навантаження вимкнено`:`${desig(d)}: навантаження переведено на L${now+1} (${Math.round(U[now])} В)`); return true; } return false; },
  face(d,g){ const U=d.U||[0,0,0]; return tx(g.cx,g.y+64,mdl(d,"ПЕРЕМИКАЧ ФАЗ"),{fs:7,fw:700})+lcd(g.x+12,g.y+70,g.w-24,26,d.ok?Math.round(U[d.sel])+" В · L"+(d.sel+1):"---",d.ok)
      +["L1","L2","L3"].map((l,i)=>led(g.x+30+i*(g.w-60)/2,g.y+112,U[i]>=U_MIN&&U[i]<=U_MAX?(d.ok&&d.sel===i?"#ffd23f":"#3fbf4a"):U[i]>0?"#e23b3b":"#5a5e66")+tx(g.x+30+i*(g.w-60)/2,g.y+128,l,{fs:7})).join("")
      +tx(g.cx,g.y+146,"пріоритет L1 · 170–250 В",{fs:6}); }});
defType("vm",{name:"Вольтметр модульний", short:"Вольтметр", cat:"Контроль", w:1, pre:"PV",
  terms:TLN, cap:"Напруга",
  logic(d,X){ d.U=X.volt(K(d,"L"),K(d,"N")); return false; }, load:(d,X)=>[{a:"L",b:"N",I:d.U>100?0.004:0}],
  face(d,g){ const on=(d.U||0)>60; return tx(g.cx,g.y+66,"V",{fs:9,fw:700})+lcd(g.x+5,g.y+76,g.w-10,26,on?String(Math.round(d.U)):"---",on,(d.U>U_MAX||d.U<U_MIN)&&on?"#ff5a5a":"#5fe36b")+tx(g.cx,g.y+120,"80–500 В",{fs:5.6}); }});
defType("spd3",{name:"УЗІП Т2 3P+N (AC)", short:"УЗІП 3P+N", cat:"Захист", w:4, pre:"FV",
  terms:[{k:"L1",s:"top",r:"P",l:"L1"},{k:"L2",s:"top",r:"P",l:"L2"},{k:"L3",s:"top",r:"P",l:"L3"},{k:"N",s:"top",r:"N",l:"N"},{k:"pe",s:"bot",r:"PE",l:"PE",m:3}], cap:"Захист від імпульсів",
  face(d,g){ const worn=(d.wear||0)>=2, c=worn?"#e23b3b":"#3fbf4a";
    return tx(g.cx,g.y+68,mdl(d,"УЗІП Т2 · 3P+N"),{fs:7,fw:700})+tx(g.cx,g.y+80,"Uc 275 В · In 20 кА",{fs:6.3})
      +cartridges(g,4,c)
      +tx(g.cx,g.y+146,worn?"картриджі замінити":"індикатор: справний",{fs:6.5,fw:worn?700:400}); }});
defType("stair",{name:"Сходовий таймер (світло на час)", short:"Сходовий таймер", cat:"Керування", w:1, pre:"KT",
  terms:TCOIL,
  poles:[{a:"1",b:"2",r:"L"}], closed:d=>(d.t||0)>0, init:d=>{ d.delay=d.delay||30; d.t=0; }, cap:"Світло під’їзду",
  logic(d,X){ const c=coilOn(d,X,"A1","A2"); if(c&&!d.prev){ d.prev=true; const was=d.t>0; d.t=d.delay; if(!was){ logp("ok",`${desig(d)}: кнопка — світло на ${d.delay} с`); return true; } } if(!c) d.prev=false; return false; },
  tick(d,X,dt){ if(d.t>0){ d.t=Math.max(0,d.t-dt); if(!d.t) logp("w",`${desig(d)}: час минув — світло вимкнено`); } },
  face(d,g){ return tx(g.cx,g.y+66,mdl(d,"СХОДОВИЙ"),{fs:5.8,fw:700})+lcd(g.x+5,g.y+76,g.w-10,24,d.t>0?Math.ceil(d.t)+" с":"OFF",d.t>0,"#ffd23f")+tx(g.cx,g.y+118,"T = "+d.delay+" с",{fs:6})+led(g.cx,g.y+134,d.t>0?"#ffd23f":"#5a5e66"); }});

defType("kvf2",{...T.kvf, name:"Реле контролю фаз, 2 контакти (25–28, 15–16)", short:"Реле контролю фаз 2К", w:3,
  terms:[{k:"L1",s:"top",r:"P",l:"L1"},{k:"L2",s:"top",r:"P",l:"L2"},{k:"L3",s:"top",r:"P",l:"L3"},{k:"N",s:"top",r:"N",l:"N"},C("15","bot","15"),C("16","bot","16"),C("25","bot","25"),C("28","bot","28")],
  aux:d=>d.ks&&d.ks.ok?[["25","28"]]:[["15","16"]], cap:"Контроль основного вводу",
  logic(d,X){ const r=T.kvf.logic(d,X); return r; },
  tick(d,X,dt){ const s=d.ks; if(!s||!s.good||s.ok) return; s.delay-=dt; if(s.delay<=0){ s.ok=true; logp("ok",`${desig(d)}: фази в нормі — 25–28 замкнено, 15–16 розімкнено`); } } });
