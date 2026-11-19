/* ===== Модульні: перемикач Hager SFT232 I–0–II і розетка E.NEXT на DIN-рейку ===== */
// Hager SFT232 — перемикач I–0–II 2P 32 А 230 В~, 2 модулі (35 мм), загальні клеми зверху.
// Зверху 1 (L) і 5 (N) — спільні, на навантаження; знизу 2 і 6 — положення I, 4 і 8 — положення II.
// I: з'єднано 1–2 і 5–6; «0»: усе розімкнено; II: 1–4 і 5–8. Важіль угорі — I, посередині — 0, унизу — II.
defType("sft232",{name:"Перемикач I–0–II Hager SFT232 2P 32 А", short:"Перемикач SFT232", cat:"Комутація", w:2, In:32, pre:"QS", maker:"Hager", noBrand:true,
  body:"#e3e5e8", faceFill:"#d9dce0",
  terms:[{k:"1",s:"top",r:"L",l:"1"},{k:"5",s:"top",r:"N",l:"5"},{k:"2",s:"bot",r:"L",l:"2"},{k:"4",s:"bot",r:"L",l:"4"},{k:"6",s:"bot",r:"N",l:"6"},{k:"8",s:"bot",r:"N",l:"8"}],
  poles:[{a:"2",b:"1",r:"L"},{a:"6",b:"5",r:"N"},{a:"4",b:"1",r:"L"},{a:"8",b:"5",r:"N"}],
  closed:(d,pi)=>pi<2?d.pos===1:d.pos===2, init:d=>{ if(d.pos===undefined) d.pos=1; }, cap:"Мережа / генератор",
  tap(d){ const seq=[1,0,2,0]; d.seqI=((d.seqI??seq.indexOf(d.pos))+1)%4; d.pos=seq[d.seqI]; logp("w",`${desig(d)}: положення ${["0","I","II"][d.pos]}`); return true; },
  // вигляд — за фото виробу: синя смужка й «:hager» угорі, «SFT 232 / 32A / 230 V~» ліворуч, схема контактів праворуч,
  // дві клавіші зі знаком положення «I» / «0» / «II» (рухаються разом), зелене/червоне поле на важелі, внизу — прозора відкидна кришка для маркування
  face(d,g){ const x=g.x, y=g.y, p=d.pos, B="#1f74c2", ink="#2b2f36", i=p===1?0:p===0?1:2, cx=g.cx;
    let s=`<rect x="${x+4}" y="${y+48}" width="${g.w-8}" height="37" rx="2" fill="#e9ebee" stroke="#c6c9ce"/><path d="M${cx} ${y+48}v37" stroke="#c6c9ce"/>`
      +`<rect x="${x+7}" y="${y+50.5}" width="${g.w-52}" height="2.4" fill="${B}"/>`+tx(x+g.w-6,y+57.5,":hager",{fs:8.8,fw:800,a:"end",fill:B})
      +tx(x+7,y+63.5,"SFT 232",{fs:6.8,fw:600,a:"start",fill:ink})+tx(x+7,y+71.5,"32A",{fs:6.2,a:"start",fill:ink})+tx(x+7,y+79,"230 V~",{fs:5.6,a:"start",fill:ink});
    // схема контактів під логотипом: ніж від 1 (5) до 2 (6) у положенні I, до 4 (8) у II, посередині — у «0»
    s+=`<g fill="none" stroke="#3a3f47" stroke-width=".8" stroke-linecap="round">`;
    for(const px of [x+g.w-45,x+g.w-24]){ const tip=[px+3,px+8,px+13][i]; s+=`<path d="M${px+8} ${y+65}v3L${tip} ${y+75}M${px+3} ${y+76.5}v3M${px+13} ${y+76.5}v3"/>`; }
    s+=`</g>`+[[x+g.w-37,"1"],[x+g.w-16,"5"]].map(([lx,l])=>tx(lx,y+63.6,l,{fs:4.6,fill:"#3a3f47"})).join("")
      +[[x+g.w-42,"2"],[x+g.w-32,"4"],[x+g.w-21,"6"],[x+g.w-11,"8"]].map(([lx,l])=>tx(lx,y+84.2,l,{fs:4.6,fill:"#3a3f47"})).join("");
    // ручка: дві клавіші у своїх модулях, хід I (угорі) – 0 – II (унизу)
    const r0=x+13, r1=x+g.w-5, kw=(r1-r0)/2-8, ky=y+89+i*8, ind=p?"#e0352b":"#2ea043";
    s+=`<rect x="${r0}" y="${y+87}" width="${r1-r0}" height="36" rx="2.5" fill="#b9bdc3" stroke="#9da1a8"/><path d="M${cx+4} ${y+87}v36" stroke="#9da1a8"/>`;
    s+=`<g data-lever="${d.id}" style="cursor:pointer">`+[r0+4,cx+8].map(lx=>`<rect x="${lx}" y="${ky}" width="${kw}" height="17" rx="2.5" fill="#f1f2f4" stroke="#9aa0a8"/>`
      +(p===1?`<rect x="${lx+kw/2-1.1}" y="${ky+2.5}" width="2.2" height="9" rx="1" fill="#8d9198"/>`   // знак на клавіші: угорі «I», посередині «0», унизу «II»
        :p===0?`<ellipse cx="${lx+kw/2}" cy="${ky+7}" rx="3" ry="4.3" fill="none" stroke="#8d9198" stroke-width="1.8"/>`
        :`<rect x="${lx+kw/2-4.2}" y="${ky+2.5}" width="2.2" height="9" rx="1" fill="#8d9198"/><rect x="${lx+kw/2+2}" y="${ky+2.5}" width="2.2" height="9" rx="1" fill="#8d9198"/>`)
      +`<rect x="${lx+3}" y="${ky+13}" width="${kw-6}" height="2.6" rx="1" fill="${ind}"/>`).join("")+`</g>`;
    s+=[["I",y+99.3],["0",y+107.3],["II",y+115.3]].map(([l,ly],j)=>tx(x+8,ly,l,{fs:6,fw:j===i?800:500,fill:j===i?B:ink})).join("");
    // прозора відкидна кришка, під нею — наліпка зі станом
    s+=`<rect x="${x+6}" y="${y+126}" width="${g.w-12}" height="36" rx="2" fill="#cfe0ec" fill-opacity=".6" stroke="#9fb6c8"/><path d="M${x+7} ${y+129.5}H${x+g.w-7}" stroke="#9fb6c8" stroke-width=".8"/>`;
    return s+tx(cx,y+142,p===1?"I · 1–2, 5–6":p===2?"II · 1–4, 5–8":"0 · розімкнено",{fs:6.6,fw:700,fill:"#24303b"})+tx(cx,y+152,p===1?"мережа":p===2?"генератор":"",{fs:5.8,fill:"#24303b"}); }});

// Розетка E.NEXT e.socket.stand.din на DIN-рейку, 16 А 250 В~, із заземленням. Зверху клема PE, знизу L і N.
// У тесті дотик до розетки вставляє вилку й міняє прилад; без PE — попередження в перевірці.
const SOCK_LOADS = [null,["Зарядка ноутбука",0.09],["Паяльник",0.06],["Дриль",0.8],["Чайник",2],["Обігрівач",3.5]];
// Корпус 45 × 80 мм — 2,5 модуля (bw), на рейці займає 3 місця; гвинт PE — посередині зверху, L і N — знизу, ±10 мм від осі.
defType("sockex",{name:"Розетка на DIN-рейку E.NEXT e.socket.stand.din 16 А", short:"Розетка E.NEXT", cat:"Розподіл", w:3, bw:2.5, pre:"XS", maker:"E.NEXT", noBrand:true,
  body:"#efe9dc", faceFill:"#e9e2d3",
  terms:[{k:"PE",s:"top",r:"PE",l:"PE",m:0.75,nl:true},{k:"L",s:"bot",r:"L",l:"L",m:0.16},{k:"N",s:"bot",r:"N",l:"N",m:1.34}],
  cap:"Розетка 16 А", init:d=>{ d.plug=d.plug===true?3:(+d.plug||0); },
  tap(d){ d.plug=((d.plug||0)+1)%SOCK_LOADS.length; const l=SOCK_LOADS[d.plug]; logp("ok",`${desig(d)}: ${l?`увімкнено ${l[0]} ${String(l[1]).replace(".",",")} кВт`:"вилку вийнято"}`); return true; },
  load:(d,X)=>{ const l=SOCK_LOADS[d.plug||0], U=X.volt(K(d,"L"),K(d,"N")); return l&&U>=150?[{a:"L",b:"N",I:l[1]*1000/U,U}]:[]; },
  // гніздо Schuko на всю ширину, як на кресленні: подвійний обідок, бічні пази, скоби заземлення вгорі й унизу, два отвори
  face(d,g){ const cx=g.cx, cy=g.y+105, R=56, r=50, l=SOCK_LOADS[d.plug||0], X=S.sim&&S.sim.X, U=X?X.volt(K(d,"L"),K(d,"N")):0;
    let s=`<path d="M${cx} ${g.y+35}v5M${cx-6} ${g.y+40}h12M${cx-4} ${g.y+42.6}h8M${cx-2} ${g.y+45.2}h4" stroke="#3a3f47" stroke-width="1.2" fill="none"/>`;   // знак заземлення під гвинтом PE, як на корпусі
    s+=`<g data-lever="${d.id}" style="cursor:pointer"><circle cx="${cx}" cy="${cy}" r="${R}" fill="#e4dccb" stroke="#c9bda3" stroke-width="1.4"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#efe8da" stroke="#d3c8b1"/>`
      +[cx-r,cx+r-9].map(nx=>`<rect x="${nx}" y="${cy-18}" width="9" height="36" fill="#ddd3bf" stroke="#c9bda3" stroke-width=".8"/>`).join("")
      +[cy-r,cy+r-7].map(ny=>`<rect x="${cx-9}" y="${ny}" width="18" height="7" rx="1" fill="#c3c7cc" stroke="#8e939a"/>`).join("")
      +`<circle cx="${cx-26}" cy="${cy}" r="8" fill="#3a352c"/><circle cx="${cx+26}" cy="${cy}" r="8" fill="#3a352c"/>`
      +tx(cx,cy-30,"16/25",{fs:6,fill:"#9b927f"})+tx(cx,cy-22,"250",{fs:6,fill:"#9b927f"})
      +`<text x="${cx}" y="${cy+29}" font-size="10" text-anchor="middle" font-weight="800" letter-spacing=".6" style="fill:#d4202b">E.NEXT</text>`;
    if(l) s+=`<path d="M${cx+30} ${cy+36} Q${cx+46} ${cy+50} ${cx+g.w/2-9} ${g.y+161}" fill="none" stroke="#2b2e33" stroke-width="8" stroke-linecap="round"/>`
      +`<circle cx="${cx}" cy="${cy}" r="47" fill="#2b2e33" stroke="#17191c" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="38" fill="#383c42"/>`
      +tx(cx,cy-3,l[0],{fs:l[0].length>10?6.4:7.6,fw:700,fill:"#f2f3f5"})+tx(cx,cy+10,(U>=150?"⚡ ":"")+String(l[1]).replace(".",",")+" кВт",{fs:7.6,fw:700,fill:U>=150?"#ffd23f":"#c9ced6"});
    return s+`</g>`; }});
