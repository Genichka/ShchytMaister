/* ===== Нові модулі після оновлення: їхні назви в каталозі червоні, доки модуль не відкрили ===== */
// Застосунок пам'ятає список модулів, які вже бачив (localStorage). Після оновлення все, чого в списку не було, — нове.
// Нове лишається червоним, доки його не торкнулися в каталозі (вибрали або потягли на рейку), але не довше 30 днів.
const NEW_SEED = ["to119","g2r","kk"];          // нові модулі останніх версій — для тих, у кого ще немає списку відомих модулів
const NEW_DAYS = 30;
const NEW_DEV = (() => { const now = Date.now(), all = Object.keys(T); let fresh = {};
  try {
    const kn = JSON.parse(localStorage.getItem("pc-known-types") || "null"), cur = JSON.parse(localStorage.getItem("pc-new-types") || "{}");
    const known = new Set(kn || all.filter(k => !NEW_SEED.includes(k)));
    for (const [k, t] of Object.entries(cur && typeof cur === "object" ? cur : {})) if (T[k] && now - t < NEW_DAYS * 864e5) fresh[k] = t;
    for (const k of all) if (!known.has(k) && !fresh[k]) fresh[k] = now;
    localStorage.setItem("pc-known-types", JSON.stringify(all)); localStorage.setItem("pc-new-types", JSON.stringify(fresh));
  } catch (e) { fresh = Object.fromEntries(NEW_SEED.filter(k => T[k]).map(k => [k, now])); }
  return new Set(Object.keys(fresh)); })();
const isNewDev = k => NEW_DEV.has(k);
function seenDev(k) { if (!NEW_DEV.delete(k)) return;
  try { const cur = JSON.parse(localStorage.getItem("pc-new-types") || "{}"); delete cur[k]; localStorage.setItem("pc-new-types", JSON.stringify(cur)); } catch (e) {} }
// червона крапка на категорії / підкатегорії, де є нові модулі
const subHasNew = s => Array.isArray(s[1]) && s[1].some(isNewDev);
const catHasNew = c => Array.isArray(c[1]) && c[1].some(subHasNew);
const NEW_DOT = `<i class="ndot" title="Є нові модулі"></i>`;
