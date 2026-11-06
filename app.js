// TK_APP · la app (C · Paso a paso con la barra de A, validada en app/simulador_TK_APP.html el 05/11/2026).
// Datos: los pide al equipo cada vez (equipo.js); no guarda datos de usuarios. Solo recuerda el pase de confianza de cada equipo.
'use strict';

const VERSION_APP = '1.0 · 05/11/2026';
const URL_DOCUMENTOS = 'https://drive.google.com/drive/folders/1FRbFGo9VDIqJsnvl2BH4vQDcxtFaq83v';
const S = {p: 'conectar', con: false, eq: null, prueba: false, buscando: false, hora: null, fw: '', clave: '', claveMal: false, quedan: 3, finEspera: 0,
  pend: false, nuevo: null, firmaPaso: 0, checks: [false, false], lienzoTotal: false, trazosTmp: [], trazos: [], aj: null, firmado: null, enviando: false,
  usuarios: null, buscar: '', ficha: null, pdf: null, cons: {nombre: '', prestador: '', nit: '', tel: '', correo: ''}, consLeido: false, logo: '', rec: null, toast: null, ultimo: null, prev: null};
const CAMPOS_CONS = ['nombre', 'prestador', 'nit', 'tel', 'correo'];

// ---- utilidades ---------------------------------------------------------------------------------------------------------------
function ahora() { const [f, h] = fechaEquipo(new Date()).split(' · '); return {f, h}; }
const isoLocal = () => { const d = new Date(); return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`; };
const iniciales = n => String(n || '').split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('');
const guardar = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (_) { /* navegador sin memoria */ } };
const leer = k => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const P = {
  bt: '<path d="M7 7l10 10-5 4V3l5 4L7 17"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.2 2.4 3.5 5.2"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  pen: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', chev: '<path d="M9 5l7 7-7 7"/>', back: '<path d="M15 5l-7 7 7 7"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>', share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4"/>',
  down: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>', face: '<circle cx="12" cy="12" r="8.5"/><path d="M9 10h.01M15 10h.01M9 15c1.7 1.4 4.3 1.4 6 0"/>',
  body: '<circle cx="12" cy="4.5" r="2"/><path d="M8 9h8l-1.2 6H13l-1 6-1-6H9.2z"/>', list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  alerta: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
};
const ic = (n, s = 20, w = 2) => `<svg class="i" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;

function tostada(txt, ms = 4200, error = false) { S.toast = txt; S.toastError = error; pintar(); clearTimeout(S._t); S._t = setTimeout(() => { S.toast = null; pintar(); }, ms); }
const paseKey = () => 'tkapp-pase-' + (S.eq ? S.eq.serie : '');

// ---- conexión, clave y hora ---------------------------------------------------------------------------------------------------
async function buscarEquipo(prueba) {
  if (S.buscando) return;
  S.prueba = !!prueba;
  const eq = prueba ? new EquipoPrueba() : new EquipoBle();
  S.buscando = true; pintar();
  try {
    await eq.conectar();
  } catch (e) {
    S.buscando = false;
    if (e.ocupado) tostada('Ese equipo ya está conectado a otro celular. Desconéctelo allá o espere medio minuto y vuelva a intentar.', 6500, true);
    else if (e.name !== 'NotFoundError') tostada('No se pudo conectar. Espere unos segundos y vuelva a intentar; revise que el equipo esté prendido y cerca.', 6500, true);
    else pintar();
    return;
  }
  S.eq = eq;
  eq.alEvento = alAviso;
  eq.alCortar = () => { if (S.eq === eq) reconectar(eq); };
  try {
    const r = await eq.pedir({t: 'hola', fecha: isoLocal(), pase: leer(paseKey()) || '', app: VERSION_APP});
    S.fw = r.fw || ''; S.buscando = false;
    if (r.acceso === 'ok') return entrar(false);
    S.clave = ''; S.claveMal = false; S.finEspera = r.espera ? Date.now() + r.espera * 1000 : 0; S.p = 'clave'; pintar(); relojEspera();
  } catch (e) { S.buscando = false; eq.desconectar(); tostada('El equipo no respondió. Vuelva a intentar.'); }
}
async function entrar(conClave) {
  S.con = true; S.buscando = false; S.hora = ahora(); S.p = 'inicio'; S.clave = '';
  pintar();
  tostada(`${conClave ? 'Contraseña correcta: este celular queda de confianza. ' : ''}Conectado a ${S.eq.serie}. Fecha y hora enviadas al equipo: <b>${S.hora.f} · ${S.hora.h}</b>`);
  await leerConsultorio();
  pintar();
}
// El consultorio y el logo viven en el equipo. Si no se pudieron leer (por ejemplo, porque estaba ejecutando), se vuelven a
// pedir antes de armar un PDF o de abrir Ajustes; sin leerlos no se guarda nada encima.
async function leerConsultorio() {
  if (S.consLeido) return true;
  try {
    const c = await S.eq.pedir({t: 'consultorio'});
    if (c.error) return false;
    for (const k of CAMPOS_CONS) S.cons[k] = typeof c[k] === 'string' ? c[k] : '';
    const l = await S.eq.pedir({t: 'logo'}, 30000);
    S.logo = l.img ? logoValido('data:image/jpeg;base64,' + l.img) : '';
    S.consLeido = true;
  } catch (_) { /* se vuelve a pedir al usarlo */ }
  return S.consLeido;
}
// Si la conexión se cae (pantalla apagada, Chrome en segundo plano, el celular se alejó), la app vuelve a entrar sola al
// mismo equipo, sin la lista ni la contraseña, y deja al usuario en la misma pantalla. El equipo reemplaza la conexión
// muerta a los 25 s de silencio (bluetooth.ino), así que se intenta durante un minuto.
async function reconectar(eq) {
  if (S.reconectando) return;
  S.reconectando = true; S.con = false; S.lienzoTotal = false;
  tostada('Se perdió la conexión con el equipo. Reconectando…', 65000);
  for (let i = 0; i < 12 && S.eq === eq && S.reconectando; i++) {
    await new Promise(r => setTimeout(r, i ? 5000 : 1500));
    if (S.eq !== eq || !S.reconectando) return;
    try {
      await eq.reconectar();
      const r = await eq.pedir({t: 'hola', fecha: isoLocal(), pase: leer(paseKey()) || '', app: VERSION_APP}, 8000);
      if (r.acceso !== 'ok') break;           // el pase ya no vale: hay que entrar con la contraseña
      S.reconectando = false; S.con = true; S.hora = ahora();
      if (S.p === 'conectar' || S.p === 'clave') S.p = 'inicio';
      tostada('Reconectado al equipo.');
      return;
    } catch (_) { /* el equipo aún no la suelta: se vuelve a intentar */ }
  }
  S.reconectando = false;
  if (S.eq === eq) perderConexion('No se pudo volver a conectar. Toque «Buscar equipo».');
}
function perderConexion(motivo) {
  Object.assign(S, {con: false, p: 'conectar', buscando: false, pend: false, lienzoTotal: false, hora: null, usuarios: null, ficha: null, pdf: null, consLeido: false, reconectando: false});
  if (S.eq) { S.eq.alCortar = () => {}; S.eq.desconectar(); }
  S.eq = null;
  if (motivo) tostada(motivo, 5500); else pintar();
}
function relojEspera() {
  clearInterval(S._espera);
  if (S.finEspera <= Date.now()) return;
  S._espera = setInterval(() => { if (S.p === 'clave') pintar(); if (Date.now() >= S.finEspera) { clearInterval(S._espera); pintar(); } }, 1000);
}
async function teclear(k) {
  if (Date.now() < S.finEspera || S.enviando) return;
  if (k === '⌫') { S.clave = S.clave.slice(0, -1); S.claveMal = false; pintar(); return; }
  if (S.clave.length >= 5) return;
  S.clave += k; S.claveMal = false; pintar();
  if (S.clave.length < 5) return;
  S.enviando = true;
  try {
    const r = await S.eq.pedir({t: 'clave', clave: S.clave});
    S.enviando = false;
    if (r.ok) { guardar(paseKey(), r.pase); return entrar(true); }
    S.clave = '';
    if (r.espera) { S.finEspera = Date.now() + r.espera * 1000; S.claveMal = false; relojEspera(); }
    else { S.claveMal = true; S.quedan = r.quedan; }
    pintar();
  } catch (e) { S.enviando = false; S.clave = ''; tostada('El equipo no respondió. Vuelva a intentar.'); }
}
function alAviso(m) {
  if (m.t === 'pide_hora') {
    S.eq.pedir({t: 'hora', fecha: isoLocal()}).then(() => { S.hora = ahora(); tostada(`El equipo pidió la hora (entró a Asistido). Enviada sola: <b>${S.hora.f} · ${S.hora.h}</b>`); }).catch(() => {});
  } else if (m.t === 'firma_pedida') {
    Object.assign(S, {pend: true, nuevo: {nombre: m.nombre, cc: m.cc}, firmado: null, firmaPaso: 0, checks: [false, false], lienzoTotal: false, trazosTmp: [], trazos: [], aj: null, p: 'firma'});
    pintar();
  } else if (m.t === 'firma_cancelada') {
    Object.assign(S, {pend: false, lienzoTotal: false, aj: null});
    if (S.p === 'firma') S.p = 'inicio';
    tostada('En el equipo se canceló la firma.');
  }
}

// ---- firma: pantalla completa y ajuste (como el logo) ---------------------------------------------------------------------
const F_W = 300, F_H = 80;
// cajaTrazos() y trazosAPath() están en formatos.js (las comparte con los PDF)
function encajarFirma() {
  const b = cajaTrazos(S.trazos), z = Math.min(F_W * .9 / b.w, F_H * .8 / b.h);
  S.aj = {z, z0: z, x: F_W / 2 - (b.x0 + b.w / 2) * z, y: F_H / 2 - (b.y0 + b.h / 2) * z, d: trazosAPath(S.trazos)};
}
const pathFirma = (d, g = 2.4) => `<path d="${d}" fill="none" stroke="#2E2B7A" stroke-width="${g}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
const firmaAjustadaSvg = (A, w = F_W, h = F_H) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${F_W} ${F_H}"><g transform="translate(${A.x.toFixed(2)} ${A.y.toFixed(2)}) scale(${A.z.toFixed(4)})">${pathFirma(A.d)}</g></svg>`;
// Lo que se manda al equipo: los trazos ya ajustados, en el espacio 300 × 80 (firma.sig)
function firmaComoTexto() {
  const A = S.aj;
  return 'firma app 300x80\n' + S.trazos.map(t => t.map(([x, y]) => `${Math.round(x * A.z + A.x)},${Math.round(y * A.z + A.y)}`).join(' ')).join('\n') + '\n';
}
const firmaSuficiente = () => S.trazosTmp.reduce((n, t) => n + t.length, 0) >= 10;      // como en la pantalla: al menos 10 puntos
function capaFirma() {
  const mouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
  return `<div class="firma-total">
    <div class="ft-cab"><div><b>${esc(S.nuevo.nombre)}</b><span>Firme ${mouse ? 'con el mouse' : 'con el dedo o el lápiz'} en cualquier parte de la pantalla</span></div>
      <button data-act="ftborrar">Borrar</button><button data-act="ftcancelar">Cancelar</button></div>
    <div class="ft-lienzo"><canvas data-ft></canvas><div class="ft-guia"><i></i><span>FIRMA DEL TITULAR · C.C. ${esc(conPuntos(S.nuevo.cc))}</span></div></div>
    <div class="ft-pie"><span class="sub">Después puede acercarla y moverla para que quede bien en el PDF.</span><button class="btn ver" data-act="ftlisto" ${firmaSuficiente() ? '' : 'disabled'}>${ic('check', 18, 2.6)}Listo</button></div></div>`;
}
function prepararFirmaTotal(cel) {
  const c = cel.querySelector('[data-ft]'), caja = c.parentElement;
  const w = caja.offsetWidth, h = caja.offsetHeight, k = Math.max(2, devicePixelRatio || 1);
  c.width = w * k; c.height = h * k;
  const g = c.getContext('2d'); g.scale(k, k); g.lineWidth = 3; g.lineCap = g.lineJoin = 'round'; g.strokeStyle = '#2E2B7A';
  const dibujar = t => { g.beginPath(); t.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); if (t.length === 1) g.lineTo(t[0][0] + .1, t[0][1] + .1); g.stroke(); };
  S.trazosTmp.forEach(dibujar);
  const punto = e => { const b = c.getBoundingClientRect(); return [(e.clientX - b.left) * w / b.width, (e.clientY - b.top) * h / b.height]; };
  let actual = null;
  c.addEventListener('pointerdown', e => { e.preventDefault(); try { c.setPointerCapture(e.pointerId); } catch (_) { /* igual dibuja */ } actual = [punto(e)]; S.trazosTmp.push(actual); dibujar(actual); });
  c.addEventListener('pointermove', e => {
    if (!actual) return;
    const juntos = e.getCoalescedEvents ? e.getCoalescedEvents() : [];          // los puntos intermedios, si el navegador los da
    for (const ev of (juntos.length ? juntos : [e])) actual.push(punto(ev));
    g.clearRect(0, 0, w, h); S.trazosTmp.forEach(dibujar);
  });
  const soltar = () => { if (!actual) return; actual = null; const b = cel.querySelector('[data-act="ftlisto"]'); if (b) b.disabled = !firmaSuficiente(); };
  c.addEventListener('pointerup', soltar); c.addEventListener('pointercancel', soltar);
}
function pasoAjuste() {
  return `<div class="tarj"><span class="eti2">Paso 3 de 3 · Ajuste su firma</span><div class="sub" style="margin:2px 0 10px">Arrástrela y acérquela o aléjela hasta que llene el recuadro. Lo que queda dentro es lo que sale en el PDF.</div>
      <div class="ajuste" data-ajuste><svg width="100%" height="100%"><g data-g>${pathFirma(S.aj.d, 2.8)}</g></svg><div class="marco-firma"><i></i></div></div>
      <div class="zoom-f"><button data-act="zmenos" aria-label="Alejar">−</button><input data-zoomf type="range" min="40" max="300" value="${Math.round(S.aj.z / S.aj.z0 * 100)}" aria-label="Tamaño de la firma"><button data-act="zmas" aria-label="Acercar">+</button><button class="anotar" data-act="centrar">Centrar</button></div></div>
    <div class="tarj"><span class="eti2">Así sale en el PDF</span><div class="vista-firma"><div class="vf-trazo" data-vistaf>${firmaAjustadaSvg(S.aj, 240, 64)}</div><div class="vf-linea">Firma del Titular · ${esc(S.nuevo.nombre)}</div></div></div>
    <div style="display:flex;gap:10px;margin:0 14px 16px"><button class="btn sec" data-act="abrirfirma">Firmar de nuevo</button><button class="btn ver" data-act="enviar" ${S.enviando ? 'disabled' : ''}>${ic('check', 18, 2.6)}${S.enviando ? 'Enviando…' : 'Aceptar y enviar'}</button></div>`;
}
function prepararAjuste(cel) {
  const A = S.aj, area = cel.querySelector('[data-ajuste]'), g = area.querySelector('[data-g]'), mf = area.querySelector('.marco-firma');
  const zoom = cel.querySelector('[data-zoomf]'), vista = cel.querySelector('[data-vistaf]');
  const aw = area.offsetWidth, fw = Math.min(aw - 36, 560), k = fw / F_W, fh = F_H * k, ox = (aw - fw) / 2, oy = 28;
  area.style.height = fh + 2 * oy + 'px';
  Object.assign(mf.style, {left: ox + 'px', top: oy + 'px', width: fw + 'px', height: fh + 'px'});
  const pintarA = () => {
    A.z = Math.min(A.z0 * 3, Math.max(A.z0 * .4, A.z));
    g.setAttribute('transform', `translate(${ox + A.x * k} ${oy + A.y * k}) scale(${A.z * k})`);
    zoom.value = Math.round(A.z / A.z0 * 100); vista.innerHTML = firmaAjustadaSvg(A, 240, 64);
  };
  const zoomEn = (f, px, py) => {
    const z1 = Math.min(A.z0 * 3, Math.max(A.z0 * .4, A.z * f)), fx = (px - ox) / k, fy = (py - oy) / k;
    A.x = fx - (fx - A.x) * z1 / A.z; A.y = fy - (fy - A.y) * z1 / A.z; A.z = z1; pintarA();
  };
  S._zoomEn = f => zoomEn(f, ox + fw / 2, oy + fh / 2);
  const dedos = new Map(); let dist0 = 0;
  const pos = e => { const b = area.getBoundingClientRect(); return [(e.clientX - b.left) * aw / b.width, (e.clientY - b.top) * area.offsetHeight / b.height]; };
  area.addEventListener('pointerdown', e => { e.preventDefault(); try { area.setPointerCapture(e.pointerId); } catch (_) { /* nada */ } dedos.set(e.pointerId, pos(e)); if (dedos.size === 2) { const [a, b] = [...dedos.values()]; dist0 = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  area.addEventListener('pointermove', e => {
    if (!dedos.has(e.pointerId)) return;
    const ant = dedos.get(e.pointerId), p = pos(e); dedos.set(e.pointerId, p);
    if (dedos.size === 1) { A.x += (p[0] - ant[0]) / k; A.y += (p[1] - ant[1]) / k; pintarA(); }
    else if (dedos.size === 2) { const [a, b] = [...dedos.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (dist0) zoomEn(d / dist0, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); dist0 = d; }
  });
  const fuera = e => { dedos.delete(e.pointerId); dist0 = 0; };
  area.addEventListener('pointerup', fuera); area.addEventListener('pointercancel', fuera);
  area.addEventListener('wheel', e => { e.preventDefault(); const p = pos(e); zoomEn(Math.exp(-e.deltaY * .0015), p[0], p[1]); }, {passive: false});
  zoom.addEventListener('input', () => zoomEn(zoom.value / 100 * A.z0 / A.z, ox + fw / 2, oy + fh / 2));
  pintarA();
}
async function enviarFirma() {
  if (S.enviando) return;
  S.enviando = true; pintar();
  try {
    const r = await S.eq.pedir({t: 'firma', trazos: firmaComoTexto(), acepta: 'si'}, 30000);
    S.enviando = false;
    if (!r.ok) { tostada(r.error === 'sd' ? 'El equipo no pudo guardar en la micro SD. Revísela y vuelva a enviar.' : r.error === 'no_pedida' ? 'El equipo ya no está esperando la firma.' : 'El equipo no aceptó la firma.', 6000); return; }
    S.firmado = {id: r.id, ...ahora()}; S.pend = false; S.p = 'firma';
    tostada(`El equipo confirmó: firma guardada con el registro de ${S.nuevo.nombre}.`);
  } catch (e) { S.enviando = false; tostada('No llegó la confirmación del equipo. Revise en el equipo si la firma quedó guardada.', 6500); }
}

// ---- logo: cualquier foto, se recorta la región (como en WhatsApp) --------------------------------------------------------
const LOGO_W = 500, LOGO_H = 200;          // 45 × 18 mm (5:2): el recuadro fijo de los formatos
function elegirFoto() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => { S.rec = {img, src: r.result, w: img.naturalWidth, h: img.naturalHeight}; S.rec.z = S.rec.z0 = Math.max(250 / S.rec.w, 100 / S.rec.h); S.rec.x = (250 - S.rec.w * S.rec.z) / 2; S.rec.y = (100 - S.rec.h * S.rec.z) / 2; S.p = 'logo'; pintar(); }; img.src = r.result; };
    r.readAsDataURL(f);
  };
  inp.click();
}
function pantallaLogo() {
  if (!S.rec) return `<div class="tarj" style="text-align:center"><p class="sub">Elija una foto del celular.</p><button class="btn pri" data-act="otrafoto">Elegir foto</button></div>`;
  return `<div class="tarj"><span class="eti2">Arrastre la foto y acerque</span><div class="sub" style="margin:2px 0 10px">Lo que queda dentro del recuadro es el logo de todos los PDF (45 × 18 mm).</div>
      <div data-recorte style="position:relative;height:200px;margin:0 -14px;overflow:hidden;background:#16152C;touch-action:none;cursor:grab">
        <img data-foto src="${S.rec.src}" draggable="false" style="position:absolute;max-width:none;user-select:none" alt="">
        <div data-marco style="position:absolute;top:50px;width:250px;height:100px;border:2px solid #fff;border-radius:4px;box-shadow:0 0 0 600px rgba(22,21,44,.55);pointer-events:none"></div></div>
      <div style="display:flex;align-items:center;gap:10px;margin:12px 0 4px"><span class="sub">−</span><input data-zoom type="range" min="100" max="400" value="100" style="flex:1;accent-color:var(--azul)"><span class="sub">+</span></div></div>
    <div class="tarj"><span class="eti2">Así sale en el PDF</span>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:10px;border-radius:12px;background:#fff;box-shadow:inset 0 0 0 1px var(--borde)">
        <canvas data-vista width="${LOGO_W}" height="${LOGO_H}" style="width:120px;height:48px"></canvas><div style="text-align:right;font-size:9px;color:var(--tinta2);line-height:1.4"><b style="font-size:11px;color:var(--tinta)">${esc(S.cons.nombre)}</b><br>${esc(S.cons.prestador)}</div></div></div>
    <div style="display:flex;gap:10px;margin:0 14px 16px"><button class="btn sec" data-act="otrafoto">Otra foto</button><button class="btn pri" data-act="usarlogo" ${S.enviando ? 'disabled' : ''}>${S.enviando ? 'Enviando…' : 'Usar este recorte'}</button></div>`;
}
function prepararRecorte(cel) {
  const R = S.rec, area = cel.querySelector('[data-recorte]'), img = cel.querySelector('[data-foto]'), zoom = cel.querySelector('[data-zoom]'), vista = cel.querySelector('[data-vista]');
  const mx = (area.offsetWidth - 250) / 2;
  cel.querySelector('[data-marco]').style.left = mx + 'px';
  const g = vista.getContext('2d');
  const aplicar = () => {
    R.x = Math.min(0, Math.max(250 - R.w * R.z, R.x)); R.y = Math.min(0, Math.max(100 - R.h * R.z, R.y));
    Object.assign(img.style, {left: mx + R.x + 'px', top: 50 + R.y + 'px', width: R.w * R.z + 'px', height: R.h * R.z + 'px'});
    g.fillStyle = '#fff'; g.fillRect(0, 0, LOGO_W, LOGO_H);
    g.drawImage(R.img, R.x * 2, R.y * 2, R.w * R.z * 2, R.h * R.z * 2);
    zoom.value = Math.round(R.z / R.z0 * 100);
  };
  let ant = null;
  area.addEventListener('pointerdown', e => { ant = [e.clientX, e.clientY]; try { area.setPointerCapture(e.pointerId); } catch (_) { /* nada */ } });
  area.addEventListener('pointermove', e => { if (!ant) return; R.x += e.clientX - ant[0]; R.y += e.clientY - ant[1]; ant = [e.clientX, e.clientY]; aplicar(); });
  area.addEventListener('pointerup', () => { ant = null; });
  zoom.addEventListener('input', () => { const z = zoom.value / 100 * R.z0, cx = (125 - R.x) / R.z, cy = (50 - R.y) / R.z; R.z = z; R.x = 125 - cx * z; R.y = 50 - cy * z; aplicar(); });
  aplicar();
  S._logoCanvas = vista;
}
async function usarLogo() {
  if (S.enviando || !S._logoCanvas) return;
  let datos, q = .85;                       // el equipo acepta hasta 30 000 letras en base64: se comprime hasta que quepa
  do { datos = S._logoCanvas.toDataURL('image/jpeg', q); q -= .1; } while (datos.length > 28000 && q > .2);
  if (datos.length > 28000) { tostada('La foto es muy pesada para el logo. Pruebe con otra.'); return; }
  S.enviando = true; pintar();
  try {
    const r = await S.eq.pedir({t: 'logo', img: datos.split(',')[1]}, 60000);
    S.enviando = false;
    if (!r.ok) { tostada('El equipo no pudo guardar el logo. Revise la micro SD.'); return; }
    S.logo = datos; S.rec = null; S.p = 'ajustes';
    tostada('Logo guardado en el equipo. Ya sale así en todos los PDF.');
  } catch (e) { S.enviando = false; tostada('No se pudo enviar el logo. Vuelva a intentar.'); }
}

// ---- usuarios, ficha y PDF ------------------------------------------------------------------------------------------------
let buscarReloj = null;
async function cargarUsuarios() {
  const q = S.buscar.trim();
  if (q && q.length < 3) return;
  try {
    const r = await S.eq.pedir({t: 'usuarios', q}, 20000);
    if (r.error) { S.usuarios = {error: r.error === 'ejecutando' ? 'El equipo está ejecutando un protocolo: la lista llega al terminar.' : 'La micro SD del equipo no responde.'}; }
    else S.usuarios = r;
  } catch (e) { S.usuarios = {error: 'El equipo no respondió.'}; }
  if (S.p === 'usuarios') pintar();
}
async function abrirFicha(id) {
  S.ficha = {id, cargando: true}; S.p = 'ficha'; pintar();
  try {
    const r = await S.eq.pedir({t: 'ficha', id}, 20000);
    if (r.error) { S.ficha = {id, error: r.error === 'ejecutando' ? 'El equipo está ejecutando un protocolo.' : 'No se pudo leer este usuario.'}; pintar(); return; }
    const filas = String(r.resumen || '').split('\n').filter(Boolean).map(l => l.split('\t')).filter(x => x.length >= 5);
    const de = (tipo, n) => filas.find(x => x[0] === tipo && +x[1] === n);
    const items = t => Array.from({length: t === 'v' ? r.val : r.ses}, (_, i) => { const f = de(t, i + 1); return {n: i + 1, fecha: f ? f[3] : '', titulo: f ? f[4] : ''}; }).reverse();
    S.ficha = {id, u: {id, nombre: (r.usuario && r.usuario.nombre) || '', cc: (r.usuario && r.usuario.cc) || '', alta: r.usuario && r.usuario.alta}, ci: r.ci, vals: items('v'), sess: items('s')};
  } catch (e) { S.ficha = {id, error: 'El equipo no respondió.'}; }
  if (S.p === 'ficha') pintar();
}
async function archivo(id, f) {
  const r = await S.eq.pedir({t: 'archivo', id, f}, 30000);
  if (r.error) throw new Error(r.error === 'ejecutando' ? 'El equipo está ejecutando un protocolo' : 'No se encontró ' + f);
  return r.datos;
}
const nombreArchivo = n => String(n).padStart(4, '0');
// Arma el documento pedido: {k: 'ci' | 'val' | 'ses' | 'hist', n}
async function abrirPdf(k, n, id = S.ficha && S.ficha.id) {
  S.prev = S.p; S.p = 'pdf'; S.pdf = {cargando: 'Trayendo los datos del equipo…'}; pintar();
  try {
    if (!await leerConsultorio()) throw new Error('No se pudieron leer los datos del consultorio del equipo (¿está ejecutando?). Vuelva a intentar en un momento.');
    if (!S.ficha || S.ficha.id !== id || !S.ficha.u) { await abrirFicha(id); S.p = 'pdf'; }
    const F = S.ficha, base = {u: F.u, cons: S.cons, logo: S.logo};
    let html, titulo, nombre;
    if (k === 'ci') {
      const firma = await archivo(id, 'firma.sig');
      html = docCI({...base, ci: F.ci || {}, firma}); titulo = 'Autorización'; nombre = `Autorizacion_${F.u.nombre}`;
    } else if (k === 'val') {
      const v = await archivo(id, `val_${nombreArchivo(n)}.json`);
      let anterior = null;
      if (v.tipo === 'seguimiento') for (let i = n - 1; i >= 1 && !anterior; i--) {
        const a = await archivo(id, `val_${nombreArchivo(i)}.json`).catch(() => null);
        if (a && a.clase === v.clase && (a.zona || '') === (v.zona || '')) anterior = a;
      }
      html = docValoracion({...base, v, n, anterior}); titulo = `Valoración n.º ${n}`; nombre = `Valoracion_${n}_${F.u.nombre}`;
    } else if (k === 'ses') {
      const s = await archivo(id, `ses_${nombreArchivo(n)}.json`);
      html = docSesion({...base, s, n}); titulo = `Sesión n.º ${n}`; nombre = `Sesion_${n}_${F.u.nombre}`;
    } else {
      const sesiones = [], vals = [], total = F.sess.length + F.vals.length;
      for (const x of F.sess) { S.pdf = {cargando: `Trayendo ${sesiones.length + vals.length + 1} de ${total}…`}; pintar(); sesiones.push({n: x.n, s: await archivo(id, `ses_${nombreArchivo(x.n)}.json`)}); }
      for (const x of F.vals) { S.pdf = {cargando: `Trayendo ${sesiones.length + vals.length + 1} de ${total}…`}; pintar(); vals.push({n: x.n, v: await archivo(id, `val_${nombreArchivo(x.n)}.json`)}); }
      html = docHistorial({...base, sesiones, vals}); titulo = 'Historial'; nombre = `Historial_${F.u.nombre}`;
    }
    await document.fonts.ready;
    S.pdf = {hojas: paginar(html, base), titulo, nombre: sinTildes(nombre).replace(/[^\w]+/g, '_') + '.pdf', quien: F.u.nombre};
  } catch (e) { S.pdf = {error: e.message || 'No se pudo armar el documento.'}; }
  if (S.p === 'pdf') pintar();
}
function cargarScript(src) {
  return new Promise((ok, mal) => { if (document.querySelector(`script[src="${src}"]`)) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => mal(new Error('Sin internet para armar el PDF')); document.head.appendChild(s); });
}
// El PDF de verdad: cada hoja carta se dibuja (html2canvas) y se pone en una página tamaño carta (jsPDF)
async function hacerPdf(hojas, avance) {
  await cargarScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  await cargarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  const zona = document.getElementById('imprimir');
  zona.style.cssText = 'display:block;position:fixed;left:-10000px;top:0;width:816px';
  zona.innerHTML = hojas.join('');
  await document.fonts.ready;
  const pdf = new jspdf.jsPDF({unit: 'pt', format: 'letter', compress: true});
  const els = [...zona.querySelectorAll('.hoja')];
  for (let i = 0; i < els.length; i++) {
    avance(i + 1, els.length);
    const c = await html2canvas(els[i], {scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true});
    if (i) pdf.addPage('letter');
    pdf.addImage(c.toDataURL('image/jpeg', .9), 'JPEG', 0, 0, 612, 612 * c.height / c.width);
  }
  zona.innerHTML = ''; zona.style.cssText = '';
  return pdf.output('blob');
}
async function entregarPdf(compartir) {
  const D = S.pdf;
  if (!D || !D.hojas || D.haciendo) return;
  try {
    if (!D.blob) { D.haciendo = 'Armando el PDF…'; pintar(); D.blob = await hacerPdf(D.hojas, (i, n) => { D.haciendo = `Armando la hoja ${i} de ${n}…`; pintar(); }); }
    D.haciendo = null; pintar();
    const file = new File([D.blob], D.nombre, {type: 'application/pdf'});
    if (compartir && navigator.canShare && navigator.canShare({files: [file]})) { await navigator.share({files: [file], title: D.nombre}); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(D.blob); a.download = D.nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    tostada(compartir ? 'Este navegador no deja compartir: el PDF se guardó en Descargas.' : 'PDF guardado en Descargas.');
  } catch (e) { D.haciendo = null; if (e.name !== 'AbortError') tostada('No se pudo armar el PDF: ' + (e.message || e)); else pintar(); }
}
function miniatura(cont, hojas, ancho) {
  const esc = ancho / 816, sep = 22;
  cont.innerHTML = `<div class="hojas-vista" style="width:${ancho}px;height:${Math.ceil((hojas.length * HOJA_H + (hojas.length - 1) * sep) * esc)}px"><div class="hojas-esc" style="transform:scale(${esc})">${hojas.join(`<div style="height:${sep}px"></div>`)}</div></div>`;
}

// ---- pantallas --------------------------------------------------------------------------------------------------------------
function horaTarj() {
  return `<div class="tarj"><div style="display:flex;align-items:center;justify-content:space-between"><span class="eti2">Fecha y hora del equipo</span>${S.hora ? `<span class="pill-ok">${ic('check', 13, 3)}Puesta</span>` : `<span class="pill-esp">Sin poner</span>`}</div>
    <div class="hora-grande" style="margin-top:4px">${S.hora ? S.hora.h : '--:--'}</div>
    <div class="sub">${S.hora ? `${S.hora.f} · la puso este celular al conectarse. El equipo la lleva hasta que se apague.` : 'Se pone sola al conectar: la app le pasa la hora del celular.'}</div></div>`;
}
// iPhone sin Bluefy (Safari, Chrome de iPhone…): ahí no hay Bluetooth para páginas web. Se explica cómo abrirla en Bluefy.
const APP_STORE_BLUEFY = 'https://apps.apple.com/app/id1492822055';
const DIR_APP = location.origin + location.pathname;          // la dirección de esta app (la misma del QR y del NFC)
const esIphone = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function guiaIphone() {
  return `<div style="padding:4px 0 10px;text-align:center">
    <div class="candado" style="background:linear-gradient(135deg,#25785A,var(--verde))">${ic('bt', 26)}</div>
    <h3 style="margin:10px 0 4px;font-size:18px">En iPhone, TK_APP se abre en Bluefy</h3>
    <p class="sub" style="margin:0 24px 14px">El iPhone no deja usar el Bluetooth del equipo desde Safari ni desde Chrome. Bluefy es un navegador gratuito que sí lo permite.</p></div>
    <div class="tarj"><span class="eti2">Paso 1</span><div style="margin:4px 0 10px;font-weight:600">Instale Bluefy (una sola vez)</div>
      <a class="btn pri" style="text-decoration:none" href="${APP_STORE_BLUEFY}" target="_blank" rel="noopener">Abrir Bluefy en la App Store</a></div>
    <div class="tarj"><span class="eti2">Paso 2</span><div style="margin:4px 0 6px;font-weight:600">Abra Bluefy y pegue esta dirección</div>
      <div class="sub" style="word-break:break-all;margin-bottom:10px">${esc(DIR_APP)}</div>
      <button class="btn ver" data-act="copiar">Copiar la dirección</button>
      <div class="sub" style="margin-top:8px">En Bluefy, guárdela en favoritos para la próxima vez.</div></div>
    <div style="padding:0 14px 16px"><button class="btn sec" data-act="prueba">${ic('play', 16)}Ver la app sin equipo</button></div>`;
}
function pantallaConectar() {
  const ble = EquipoBle.disponible();
  if (!ble && esIphone()) return guiaIphone();
  return `<div style="padding:4px 0 10px;text-align:center">
    <div class="ble">${S.buscando ? '<i></i><i></i><i></i>' : ''}<b>${ic('bt', 30, 2.2)}</b></div>
    <h3 style="margin:8px 0 4px;font-size:18px">${S.buscando ? 'Conectando…' : 'Conecte el equipo'}</h3>
    <p class="sub" style="margin:0 28px 14px">${S.buscando ? 'Elija su equipo SKIN en la lista del celular.' : ble ? 'Prenda el SKIN TRANSDERM PLUS+ y active el Bluetooth del celular.' : 'Este navegador no tiene Bluetooth. En Android use Chrome.'}</p>
    ${S.buscando ? '' : `<div style="padding:0 18px">${ble ? `<button class="btn ver" data-act="buscar">${ic('bt', 18)}Buscar equipo</button><div style="height:10px"></div>` : ''}<button class="btn sec" data-act="prueba">${ic('play', 16)}Probar sin equipo</button></div>`}
    </div>
    <div class="sub" style="text-align:center;margin:10px 24px 0">El equipo atiende un solo celular a la vez. Si en la lista sale «ocupado», otro celular lo tiene conectado.</div>`;
}
function pantallaClave() {
  const espera = Math.max(0, Math.ceil((S.finEspera - Date.now()) / 1000)), mmss = s => s >= 60 ? `${Math.floor(s / 60)}:${dos(s % 60)} min` : `${s} s`;
  const cajas = [0, 1, 2, 3, 4].map(i => `<i class="${i < S.clave.length ? 'llena' : ''} ${i === S.clave.length && !espera ? 'cursor' : ''}">${i < S.clave.length ? '●' : ''}</i>`).join('');
  const msg = espera ? `<span class="mal">Demasiados intentos. Puede volver a intentar en ${mmss(espera)}.</span>`
    : S.claveMal ? `<span class="mal">Contraseña incorrecta. ${S.quedan === 1 ? 'Le queda 1 intento' : `Le quedan ${S.quedan} intentos`}.</span>`
    : 'La contraseña es la de este equipo. Solo la conoce el personal autorizado.';
  const tecla = k => k === '' ? '<span></span>' : `<button data-tecla="${k}" ${espera ? 'disabled' : ''}>${k === '⌫' ? ic('back', 20) : k}</button>`;
  return `<div style="text-align:center;padding:0 22px">
      <div class="candado">${ic('lock', 26)}</div>
      <h3 style="margin:10px 0 2px;font-size:18px">Contraseña del equipo</h3><div class="sub"><b style="color:var(--tinta)">${esc(S.eq ? S.eq.serie : '')}</b> · SKIN TRANSDERM PLUS+</div>
      <div class="clave-cajas ${S.claveMal ? 'sacude' : ''}">${cajas}</div>
      <div class="sub clave-msg">${msg}</div></div>
    <div class="teclado">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(tecla).join('')}</div>
    <div class="sub" style="text-align:center;margin:12px 26px 0">Con la contraseña correcta este celular queda <b>de confianza</b>: no se la pide otra vez mientras se conecte al menos cada 5 días.</div>`;
}
function pantallaInicio() {
  return `${horaTarj()}
    <div class="baldosas">
      ${S.pend ? `<div class="bal grande verde" data-go="firma"><div class="ic">${ic('pen', 22)}</div><div><b>Firmar la autorización</b><span>${esc(S.nuevo.nombre)} espera en el equipo</span></div></div>` : ''}
      <div class="bal grande" data-go="usuarios"><div class="ic">${ic('users', 22)}</div><div><b>Usuarios y PDF</b><span>Buscar, ver la ficha y sacar documentos</span></div></div>
      <div class="bal" data-go="ajustes"><div class="ic">${ic('gear', 20)}</div><div><b>Consultorio</b><span>Logo y datos de los PDF</span></div></div>
      <div class="bal" data-act="documentos"><div class="ic">${ic('doc', 20)}</div><div><b>Documentos</b><span>Ficha técnica, registro y manual</span></div></div>
    </div>
    ${S.prueba ? `<div class="tarj"><span class="eti2">Equipo de prueba · hacer lo que haría el equipo</span><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">
      <button class="btn sec" style="width:auto;height:38px;font-size:12px" data-act="simfirma">Pedir una firma</button>
      <button class="btn sec" style="width:auto;height:38px;font-size:12px" data-act="simcancelar">Cancelar la firma</button>
      <button class="btn sec" style="width:auto;height:38px;font-size:12px" data-act="simhora">Pedir la hora</button></div></div>` : ''}`;
}
function pantallaFirma() {
  if (S.firmado) return `<div style="text-align:center;padding:30px 22px">
      <div style="width:76px;height:76px;border-radius:50%;margin:0 auto 14px;background:var(--verde);display:grid;place-items:center;color:#fff;box-shadow:0 12px 26px rgba(46,143,102,.35)">${ic('check', 38, 3)}</div>
      <h3 style="margin:0 0 6px;font-size:18px">Firma guardada en el equipo</h3><p class="sub" style="margin:0 0 18px">${esc(S.nuevo.nombre)} · ${S.firmado.f} · ${S.firmado.h}<br>El equipo ya siguió a la valoración inicial.</p>
      <button class="btn pri" data-act="pdfci">${ic('doc', 18)}Ver la autorización en PDF</button><div style="height:10px"></div><button class="btn sec" data-go="inicio">Listo</button></div>`;
  if (!S.pend) return `<div style="text-align:center;padding:40px 26px"><div class="ico" style="width:64px;height:64px;border-radius:20px;margin:0 auto 12px;background:#fff;display:grid;place-items:center;color:var(--tinta3)">${ic('pen', 30)}</div>
      <h3 style="margin:0 0 6px;font-size:16px">Nada que firmar</h3><p class="sub">La firma se pide desde el equipo: Usuario nuevo → Firmar en la app.</p></div>`;
  const pasos = `<div class="pasos">${[0, 1, 2].map(i => `<i class="${i <= Math.min(2, S.firmaPaso) ? 'on' : ''}"></i>`).join('')}</div>`;
  if (S.firmaPaso === 0) return `${pasos}<div class="tarj" style="text-align:center;padding:22px 16px"><span class="eti2">Paso 1 de 3 · ¿Es usted?</span><div style="height:14px"></div>
      <div class="av" style="width:64px;height:64px;font-size:21px;margin:0 auto 10px">${esc(iniciales(S.nuevo.nombre))}</div><h3 style="margin:0;font-size:18px">${esc(S.nuevo.nombre)}</h3><div class="sub">C.C. ${esc(conPuntos(S.nuevo.cc))}</div>
      <p class="sub" style="margin:14px 0 0">Si el nombre o la cédula están mal, corríjalos en el equipo antes de firmar.</p></div>
      <div style="padding:0 14px"><button class="btn pri" data-act="paso">Sí, continuar</button></div>`;
  if (S.firmaPaso === 1) return `${pasos}<div class="tarj"><span class="eti2">Paso 2 de 3 · Lea y acepte</span><p class="legal-corto" style="margin:8px 0">${textoCi()}</p><button class="anotar" data-act="pdfleer">Leer el documento completo</button>
      <div style="height:6px"></div>
      ${['Leí y entiendo la autorización.', 'Autorizo el tratamiento de mis datos sensibles de salud.'].map((t, i) => `<div class="check ${S.checks[i] ? 'on' : ''}" data-check="${i}"><i>${S.checks[i] ? ic('check', 14, 3) : ''}</i><span>${t}</span></div>`).join('')}</div>
      <div style="padding:0 14px 16px"><button class="btn pri" data-act="paso" ${S.checks[0] && S.checks[1] ? '' : 'disabled'}>Continuar a la firma</button></div>`;
  if (S.firmaPaso === 3 && S.aj) return pasos + pasoAjuste();
  return `${pasos}<div class="tarj"><span class="eti2">Paso 3 de 3 · Firme</span><div class="sub" style="margin:4px 0 12px">Se abre toda la pantalla para firmar cómodo, con el dedo, el lápiz o el mouse.</div>
      <button class="zona-firmar" data-act="abrirfirma">${ic('pen', 30)}<b>Toque aquí para firmar</b><span>${esc(S.nuevo.nombre)} · C.C. ${esc(conPuntos(S.nuevo.cc))}</span></button></div>`;
}
const textoCi = () => `<b>Autorización para el tratamiento de datos personales y aceptación de las condiciones de uso del equipo.</b> Autorizo a ${esc(S.cons.prestador) || 'el profesional'} (${esc(S.cons.nombre) || 'el consultorio'}) a tratar mis datos (nombre, cédula, esta autorización con mi firma, mis valoraciones y mi historial de sesiones) según la Ley 1581 de 2012. Algunos son datos sensibles de salud y no estoy obligado(a) a autorizarlos. Los datos quedan solo en el equipo; el fabricante no los recibe. Conozco las condiciones de uso del equipo (8.1 a 8.7) y que esto no reemplaza el consentimiento del procedimiento.`;
function pantallaUsuarios() {
  const U = S.usuarios;
  const lista = !U ? '<div class="sub" style="padding:10px 0">Trayendo los usuarios del equipo…</div>' : U.error ? `<div class="sub" style="padding:10px 0">${U.error}</div>`
    : U.lista.map(u => `<div class="fila-u" data-ficha="${+u.id}"><div class="av">${esc(iniciales(u.n))}</div><div><b>${esc(u.n)}</b><span class="sub">C.C. ${esc(conPuntos(u.cc))} · ${+u.val} val. · ${+u.ses} ses.${u.ult && u.ult !== '-' ? ' · ' + esc(u.ult) : ''}</span></div><span class="chev">${ic('chev', 18)}</span></div>`).join('')
      || '<div class="sub" style="padding:10px 0">Ningún usuario con ese nombre o cédula.</div>';
  return `<div class="busca">${ic('search', 18)}<input data-buscar placeholder="Nombre o cédula (3 letras basta)" value="${S.buscar.replace(/"/g, '&quot;')}"></div>
    <div class="tarj">${U && !U.error ? `<span class="eti2">${S.buscar.trim().length >= 3 ? `${U.lista.length} resultado${U.lista.length === 1 ? '' : 's'}` : `Los más recientes · ${U.total} registrados`}</span>` : ''}${lista}</div>
    <div class="sub" style="margin:0 20px 16px;text-align:center">Los datos se leen de la micro SD del equipo; la app no guarda copia.</div>`;
}
function pantallaFicha() {
  const F = S.ficha;
  if (!F || F.cargando) return '<div class="tarj"><div class="sub">Leyendo la ficha en el equipo…</div></div>';
  if (F.error) return `<div class="tarj"><div class="sub">${F.error}</div></div>`;
  const fila = (icono, t, sub, act) => `<div class="doc-fila"><div class="ico">${ic(icono, 18)}</div><div><b>${esc(t)}</b><span class="sub">${esc(sub)}</span></div><button class="pdfb" data-pdf="${act}">${ic('doc', 14)}PDF</button></div>`;
  const ci = F.ci || {};
  return `<div class="tarj" style="display:flex;gap:12px;align-items:center"><div class="av" style="width:48px;height:48px;font-size:16px">${esc(iniciales(F.u.nombre))}</div><div><h4>${esc(F.u.nombre)}</h4><span class="sub">C.C. ${esc(conPuntos(F.u.cc))}${F.u.alta ? ' · desde ' + esc(String(F.u.alta).split(' · ')[0]) : ''}</span></div></div>
    <div class="tarj"><span class="eti2">Autorización</span>${fila('shield', 'Autorización firmada', `${ci.fecha || '—'} · ${ci.medio === 'app' ? 'firmada en TK_APP' : 'firmada en el equipo'}`, 'ci:0')}</div>
    <div class="tarj"><span class="eti2">Valoraciones · ${F.vals.length}</span>${F.vals.map(v => fila(/corporal/i.test(v.titulo) ? 'body' : 'face', v.titulo || `Valoración n.º ${v.n}`, `${v.fecha || ''} · n.º ${v.n}`, 'val:' + v.n)).join('') || '<div class="sub" style="padding:8px 0">Sin valoraciones.</div>'}</div>
    <div class="tarj"><div style="display:flex;align-items:center;justify-content:space-between"><span class="eti2">Historial · ${F.sess.length} sesiones</span>${F.sess.length || F.vals.length ? `<button class="pdfb" data-pdf="hist:0">${ic('doc', 14)}Todo en PDF</button>` : ''}</div>
      ${F.sess.map(x => fila('list', x.titulo || `Sesión n.º ${x.n}`, `${x.fecha || ''} · n.º ${x.n}`, 'ses:' + x.n)).join('') || '<div class="sub" style="padding:8px 0">Sin sesiones.</div>'}</div>
    <div style="height:6px"></div>`;
}
function pantallaPdf() {
  const D = S.pdf || {};
  if (D.cargando) return `<div class="tarj" style="text-align:center;padding:30px 16px"><span class="girando" style="width:28px;height:28px"></span><div class="sub" style="margin-top:10px">${D.cargando}</div></div>`;
  if (D.error) return `<div class="tarj"><b>No se pudo armar el documento</b><div class="sub" style="margin-top:4px">${esc(D.error)}</div></div>`;
  return `<div class="tarj" style="padding:12px 14px"><span class="eti2">${esc(D.titulo)} · ${esc(D.quien)}</span><div class="sub">${D.hojas.length} ${D.hojas.length === 1 ? 'hoja' : 'hojas'} tamaño carta · armado ahora con los datos del equipo</div></div>
    <div class="mini-pdf" data-mini style="height:360px"></div>
    <div style="display:flex;gap:10px;margin:14px 14px 18px"><button class="btn pri" data-act="compartir" ${D.haciendo ? 'disabled' : ''}>${ic('share', 18)}${D.haciendo || 'Compartir'}</button><button class="btn sec" data-act="guardar" ${D.haciendo ? 'disabled' : ''}>${ic('down', 18)}Guardar PDF</button></div>`;
}
function pantallaAjustes() {
  const c = (e, k, tipo = 'text') => `<div class="campo"><span>${e}</span><input data-cons="${k}" type="${tipo}" value="${esc(S.cons[k])}" maxlength="80"></div>`;
  const pase = leer(paseKey());
  return `<div class="tarj"><span class="eti2">Consultorio · sale en los PDF</span><div style="height:8px"></div>
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">${logoValido(S.logo) ? `<img src="${logoValido(S.logo)}" style="width:100px;height:40px;border-radius:6px;box-shadow:0 0 0 1px var(--borde);object-fit:cover" alt="Logo">` : '<div style="width:100px;height:40px;border-radius:6px;box-shadow:inset 0 0 0 1.5px var(--borde);display:grid;place-items:center;font-size:10px;color:var(--tinta3)">Sin logo</div>'}<button class="btn sec" style="height:40px;font-size:12.5px" data-act="otrafoto">Cambiar logo</button></div>
      ${c('Nombre', 'nombre')}${c('Prestador', 'prestador')}${c('NIT', 'nit')}${c('Teléfono', 'tel', 'tel')}${c('Correo para los PDF', 'correo', 'email')}
      <button class="btn pri" style="height:42px;font-size:13px" data-act="guardarcons" ${S.enviando || !S.consLeido ? 'disabled' : ''}>${S.enviando ? 'Guardando…' : S.consLeido ? 'Guardar en el equipo' : 'Leyendo los datos del equipo…'}</button>
      <div class="sub" style="margin-top:8px">Se guardan en el equipo: también los ve la pantalla (Ajustes · Consultorio).</div></div>
    <div class="tarj"><span class="eti2">Equipo</span><div class="doc-fila"><div class="ico">${ic('bt', 18)}</div><div><b>${esc(S.eq ? S.eq.serie : '')}</b><span class="sub">Programa ${esc(S.fw) || '—'} · TK_APP ${VERSION_APP}</span></div></div>
      <div class="doc-fila"><div class="ico" style="color:var(--verde)">${ic('shield', 18)}</div><div><b>Celular de confianza</b><span class="sub">${pase ? 'Entra sin contraseña mientras se conecte al menos cada 5 días.' : 'Pedirá la contraseña al conectar.'}</span></div></div>
      <div style="display:flex;gap:8px;margin-top:6px"><button class="btn sec" style="font-size:12.5px" data-act="olvidar">Olvidar equipo</button><button class="btn sec" style="font-size:12.5px" data-act="desconectar">Desconectar</button></div></div><div style="height:4px"></div>`;
}
const TITULOS = {conectar: 'Conectar', clave: 'Contraseña', inicio: 'Inicio', firma: 'Firma de la autorización', usuarios: 'Usuarios y PDF', ficha: 'Ficha', pdf: 'PDF', ajustes: 'Consultorio y equipo', logo: 'Logo'};
function cuerpo() {
  switch (S.p) {
    case 'conectar': return pantallaConectar();
    case 'clave': return pantallaClave();
    case 'inicio': return pantallaInicio();
    case 'firma': return pantallaFirma();
    case 'usuarios': return pantallaUsuarios();
    case 'ficha': return pantallaFicha();
    case 'pdf': return pantallaPdf();
    case 'logo': return pantallaLogo();
    default: return pantallaAjustes();
  }
}
function marco() {      // arriba la barra de A (marca y conexión); debajo el paso a paso de C
  const tst = S.toast ? `<div class="tostada">${ic(S.toastError ? 'alerta' : 'check', 18, 2.6)}<div>${S.toast}</div></div>` : '';
  const barra = `<div class="barra"><div class="marca-app"><div class="lg">${LOGO_TK}</div><div><b>TK_APP</b><small>INGENIERÍA PARA LA ESTÉTICA${S.prueba ? ' · EQUIPO DE PRUEBA' : ''}</small></div></div>
      <div class="conx ${S.con ? 'si' : ''}" ${S.con ? '' : 'data-go="conectar"'}><span class="pt"></span>${S.con ? `${esc(S.eq.serie)} conectado` : S.reconectando ? 'Reconectando…' : 'Sin equipo conectado'}<span class="der">${S.con ? (S.hora ? 'Hora ' + S.hora.h : 'Bluetooth') : S.reconectando ? '' : 'Toque para conectar'}</span></div></div>`;
  const volver = !['inicio', 'conectar'].includes(S.p) ? `<button class="volver" data-act="atras">${ic('back', 16)}${['pdf', 'logo', 'ficha'].includes(S.p) ? 'Volver' : S.p === 'clave' ? 'Cancelar' : 'Inicio'}</button>` : '';
  const titulo = S.p === 'inicio' ? `<div class="hola-t"><b>${esc(S.cons.nombre) || 'TK_APP'}</b><small>¿Qué quiere hacer?</small></div>` : S.p === 'conectar' || S.p === 'clave' ? '' : `<h2>${TITULOS[S.p]}</h2>`;
  return `<div class="app vA vF">${barra}<div class="top">${volver}${titulo}</div><div class="cuerpo">${cuerpo()}</div>${S.lienzoTotal ? capaFirma() : ''}${tst}</div>`;
}
function pintar() {
  const cel = document.getElementById('cel-C');
  const c0 = cel.querySelector('.cuerpo'), scroll = c0 ? c0.scrollTop : 0;
  const foco = document.activeElement && document.activeElement.dataset ? (document.activeElement.dataset.buscar !== undefined ? 'buscar' : document.activeElement.dataset.cons) : null;
  const pos = foco ? document.activeElement.selectionStart : 0;
  cel.innerHTML = marco();
  if (S.p === S.ultimo && cel.querySelector('.cuerpo')) cel.querySelector('.cuerpo').scrollTop = scroll;
  S.ultimo = S.p;
  if (cel.querySelector('[data-ft]')) prepararFirmaTotal(cel);
  if (cel.querySelector('[data-ajuste]')) prepararAjuste(cel);
  if (cel.querySelector('[data-recorte]')) prepararRecorte(cel);
  const mini = cel.querySelector('[data-mini]');
  if (mini && S.pdf && S.pdf.hojas) miniatura(mini, S.pdf.hojas, mini.clientWidth);
  if (foco) { const n = foco === 'buscar' ? cel.querySelector('[data-buscar]') : cel.querySelector(`[data-cons="${foco}"]`); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (_) { /* tipo sin cursor */ } } }
}

// ---- toques -----------------------------------------------------------------------------------------------------------------
function ir(p) {
  if (!S.con && !['conectar', 'clave'].includes(p)) p = 'conectar';
  if (p === 'conectar' && S.con) return;
  if (p === 'firma' && S.firmado && !S.pend) S.firmado = null;
  S.prev = S.p; S.p = p;
  if (p === 'usuarios') { S.usuarios = null; cargarUsuarios(); }
  if (p === 'ajustes' && !S.consLeido) leerConsultorio().then(() => { if (S.p === 'ajustes') pintar(); });
  pintar();
}
function accion(a) {
  if (a === 'buscar') buscarEquipo(false);
  else if (a === 'prueba') buscarEquipo(true);
  else if (a === 'atras') {
    if (S.p === 'clave') { perderConexion(); return; }
    S.p = S.p === 'pdf' ? (S.prev === 'firma' ? 'firma' : 'ficha') : S.p === 'ficha' ? 'usuarios' : S.p === 'logo' ? 'ajustes' : 'inicio';
    if (S.p === 'ficha' && !S.ficha) S.p = 'usuarios';
    pintar();
  }
  else if (a === 'copiar') {
    (navigator.clipboard ? navigator.clipboard.writeText(DIR_APP) : Promise.reject()).then(() => tostada('Dirección copiada. Ábrala en Bluefy y péguela arriba.'))
      .catch(() => tostada('Copie a mano esta dirección: ' + esc(DIR_APP), 8000, true));
  }
  else if (a === 'documentos') { window.open(URL_DOCUMENTOS, '_blank', 'noopener'); }
  else if (a === 'paso') { S.firmaPaso++; pintar(); }
  else if (a === 'abrirfirma') { S.trazosTmp = []; S.lienzoTotal = true; pintar(); }
  else if (a === 'ftborrar') { S.trazosTmp = []; pintar(); }
  else if (a === 'ftcancelar') { S.lienzoTotal = false; pintar(); }
  else if (a === 'ftlisto') { if (!firmaSuficiente()) return; S.trazos = S.trazosTmp; S.trazosTmp = []; S.lienzoTotal = false; encajarFirma(); S.firmaPaso = 3; pintar(); }
  else if (a === 'zmas' || a === 'zmenos') { if (S._zoomEn) S._zoomEn(a === 'zmas' ? 1.2 : 1 / 1.2); }
  else if (a === 'centrar') { encajarFirma(); pintar(); }
  else if (a === 'enviar') enviarFirma();
  else if (a === 'pdfci') abrirPdf('ci', 0, S.firmado.id);
  else if (a === 'pdfleer') abrirLectura();
  else if (a === 'compartir') entregarPdf(true);
  else if (a === 'guardar') entregarPdf(false);
  else if (a === 'otrafoto') elegirFoto();
  else if (a === 'usarlogo') usarLogo();
  else if (a === 'guardarcons') guardarConsultorio();
  else if (a === 'olvidar') olvidarEquipo();
  else if (a === 'desconectar') perderConexion('Desconectado. El equipo queda libre para otro celular.');
  else if (a === 'simfirma') S.eq.simularFirma();
  else if (a === 'simcancelar') S.eq.simularCancelar();
  else if (a === 'simhora') S.eq.simularHora();
}
// «Leer el documento completo» antes de firmar: el CI con los datos del que va a firmar, sin firma todavía
function abrirLectura() {
  S.prev = 'firma'; S.p = 'pdf';
  const base = {u: {id: 0, nombre: S.nuevo.nombre, cc: S.nuevo.cc}, cons: S.cons, logo: S.logo};
  const a = ahora();
  S.pdf = {hojas: paginar(docCI({...base, ci: {fecha: `${a.f} · ${a.h}`, consultorio: S.cons.nombre}, firma: ''}), base), titulo: 'Autorización (para leer)', nombre: 'Autorizacion.pdf', quien: S.nuevo.nombre};
  pintar();
}
async function olvidarEquipo() {
  const pase = leer(paseKey());
  if (pase) { try { await S.eq.pedir({t: 'olvidar', pase}, 8000); } catch (_) { /* el pase igual se borra aquí */ } }
  guardar(paseKey(), null);
  perderConexion('Equipo olvidado: la próxima vez pedirá la contraseña.');
}
async function guardarConsultorio() {
  if (S.enviando || !S.consLeido) return;
  document.querySelectorAll('[data-cons]').forEach(i => { S.cons[i.dataset.cons] = i.value.trim(); });
  S.enviando = true; pintar();
  try {
    const r = await S.eq.pedir({t: 'consultorio', ...Object.fromEntries(CAMPOS_CONS.map(k => [k, S.cons[k] || '']))});
    S.enviando = false;
    if (r.error) { tostada('El equipo no pudo guardar: revise la micro SD.'); return; }
    for (const k of CAMPOS_CONS) if (typeof r[k] === 'string') S.cons[k] = r[k];
    tostada('Datos del consultorio guardados en el equipo.');
  } catch (e) { S.enviando = false; tostada('No se pudo guardar. Vuelva a intentar.'); }
}

function montar() {
  const cel = document.getElementById('cel-C');
  cel.addEventListener('click', e => {
    const t = e.target.closest('[data-go],[data-act],[data-pdf],[data-check],[data-tecla],[data-ficha]'); if (!t || !cel.contains(t)) return;
    if (t.dataset.tecla) teclear(t.dataset.tecla);
    else if (t.dataset.go) ir(t.dataset.go);
    else if (t.dataset.ficha) abrirFicha(+t.dataset.ficha);
    else if (t.dataset.pdf) { const [k, n] = t.dataset.pdf.split(':'); abrirPdf(k, +n); }
    else if (t.dataset.check) { S.checks[+t.dataset.check] = !S.checks[+t.dataset.check]; pintar(); }
    else accion(t.dataset.act);
  });
  cel.addEventListener('input', e => {
    if (e.target.dataset.buscar === undefined) return;
    S.buscar = e.target.value;
    clearTimeout(buscarReloj);
    buscarReloj = setTimeout(cargarUsuarios, 450);
  });
  const ancho = () => cel.classList.toggle('ancha', innerWidth > 640);
  addEventListener('resize', () => { ancho(); if (S.p === 'pdf' || S.aj) pintar(); });
  ancho();
  setInterval(() => { if (S.con && S.eq) S.eq.pedir({t: 'ping'}, 8000).catch(() => {}); }, 10000);   // señal de vida: el equipo suelta a los 25 s de silencio
  pintar();
  if (document.fonts) document.fonts.ready.then(pintar);
}

// La ola de partículas TK de la cabecera de los formatos: ya desvanecida hacia la izquierda (sin máscara, para el PDF)
(function () {
  let s = '';
  for (let f = 0; f < 15; f++) for (let i = 0; i <= 64; i++) {
    const u = i / 64, x = u * 420, y = 70 + Math.sin(u * Math.PI * 2.1 + f * .21) * 140 * (.12 + f * .016) + (f - 7) * 140 * .028;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.7 + 1.2 * Math.sin(u * Math.PI)).toFixed(2)}" fill="#3466AE" opacity="${(0.65 * Math.pow(u, 1.6)).toFixed(3)}"/>`;
  }
  document.documentElement.style.setProperty('--ola', `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="420" height="140" viewBox="0 0 420 140">${s}</svg>`)}")`);
})();

montar();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
