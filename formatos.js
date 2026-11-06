// TK_APP · los formatos PDF (estilo D · Híbrido B + C, aprobado el 05/11/2026) armados con los datos que manda el equipo.
// Los textos son los de las plantillas de la especificación (notas/formatos) y los del simulador validado.
// Cada doc*() devuelve el HTML de la hoja continua; paginar() la reparte en hojas carta iguales a las del PDF.
'use strict';

const COLOR_NIVEL = ['', '#F2C94C', '#F2994A', '#EB5757'];       // leve, moderado, severo
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Ayudas que usa toda la app (este archivo se carga primero)
const dos = n => String(n).padStart(2, '0');
const fechaEquipo = d => `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()} · ${dos(d.getHours())}:${dos(d.getMinutes())}`;   // como guarda el equipo
const sinTildes = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const logoValido = s => /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(s || '') ? s : '';     // el logo viene del equipo: solo una imagen
const nv = (c, t) => `<span class="d-nv"><i style="background:${c}"></i>${t}</span>`;
const pill = si => `<span class="d-pill ${si ? 'd-si' : 'd-no'}">${si ? 'Sí' : 'No'}</span>`;
const preg = (q, si, cual) => `<div class="d-preg"><div><span class="q">${esc(q)}</span>${cual ? `<span class="cual">¿Cuál? ${esc(cual)}</span>` : ''}</div>${pill(si)}</div>`;
const h2 = (n, t) => `<h2 class="d-h"><span class="d-n">${n}</span>${t}</h2>`;
const registro = id => `Registro n.º ${String(id).padStart(6, '0')}`;
const conPuntos = cc => String(cc || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const mayus1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const partesFecha = f => { const [d, h] = String(f || '').split(' · '); return {f: d || '—', h: h && /^\d\d:\d\d$/.test(h) ? h : '—', todo: f || '—'}; };
const claveFecha = f => { const m = /^(\d\d)\/(\d\d)\/(\d{4})(?: · (\d\d):(\d\d))?/.exec(f || ''); return m ? m[3] + m[2] + m[1] + (m[4] || '00') + (m[5] || '00') : ''; };

function logoHtml(d) {
  return logoValido(d.logo) ? `<img src="${logoValido(d.logo)}" alt="Logo">`
    : `<div style="width:100%;height:100%;display:grid;place-items:center;font-size:13px;font-weight:700;color:#9A98BC;text-align:center;line-height:1.2">${esc(d.cons.nombre || 'Logo del consultorio')}</div>`;
}
function cabDoc(d, eq, titulo, tags, datos) {
  const c = d.cons;
  return `<div class="d-cab"><div class="d-logo con">${logoHtml(d)}</div><div class="d-cons"><b>${esc(c.nombre)}</b>${esc(c.prestador)}${c.nit ? ' · NIT ' + esc(c.nit) : ''}<br>${c.tel ? 'Tel. ' + esc(c.tel) : ''}${c.tel && c.correo ? ' · ' : ''}${esc(c.correo)}</div></div>
  <div class="d-tit"><div style="position:relative;z-index:1"><div class="d-eq">SKIN TRANSDERM PLUS+ · ${eq}</div><h1>${titulo}</h1></div><div class="d-tags">${tags.map(t => `<span class="d-tag">${t}</span>`).join('')}</div></div>
  <div class="d-datos" style="grid-template-columns:repeat(${datos.length + 1},minmax(0,1fr))">${[...datos, ['Responsable', c.prestador || '—']].map(([e, v]) => `<div><span class="d-eti">${e}</span><b>${esc(v)}</b></div>`).join('')}</div>`;
}
const pieDoc = (d, n) => `<div class="d-pie"><span>SKIN TRANSDERM PLUS+ · documento generado por TK_APP · los datos permanecen en el equipo</span><span>${registro(d.u.id)} · ${n}</span></div>`;

// ---- Firma: los trazos de firma.sig (de la pantalla o de la app), ajustados al recuadro de 300 × 80 ----------------------
function firmaSvg(texto, w = 300, h = 80) {
  const trazos = String(texto || '').split('\n').slice(1).map(l => l.trim().split(/\s+/).filter(Boolean).map(p => p.split(',').map(Number))).filter(t => t.length && !t.some(p => p.some(isNaN)));
  if (!trazos.length) return `<svg width="${w}" height="${h}"></svg>`;
  const svg = (vb, d) => `<svg width="${w}" height="${h}" viewBox="${vb}" fill="none" stroke="#2E2B7A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  // Firmada en TK_APP («firma app 300x80»): ya viene encuadrada en el ajuste y va tal cual; firmada en la pantalla: se encuadra
  if (/300x80/.test(String(texto).split('\n')[0])) return svg('0 0 300 80', trazosAPath(trazos));
  const b = cajaTrazos(trazos), m = 4, k = Math.min((w - 2 * m) / b.w, (h - 2 * m) / b.h);
  const ox = m + ((w - 2 * m) - b.w * k) / 2, oy = m + ((h - 2 * m) - b.h * k) / 2;
  return svg(`0 0 ${w} ${h}`, trazosAPath(trazos.map(t => t.map(([x, y]) => [ox + (x - b.x0) * k, oy + (y - b.y0) * k]))));
}
// La caja de unos trazos y su trazo SVG (también los usa la firma de la app)
function cajaTrazos(tr) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const t of tr) for (const [x, y] of t) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return {x0, y0, w: Math.max(4, x1 - x0), h: Math.max(4, y1 - y0)};
}
const trazosAPath = tr => tr.filter(t => t.length).map(t => 'M' + (t.length === 1 ? [t[0], [t[0][0] + .3, t[0][1]]] : t).map(([x, y]) => (+x).toFixed(1) + ' ' + (+y).toFixed(1)).join('L')).join('');

// ---- Autorización (CI) ----------------------------------------------------------------------------------------------------
// d: {u: {id, nombre, cc}, ci: {fecha, medio, consultorio}, firma: texto de firma.sig, cons, logo}
function docCI(d) {
  const c = d.cons, n = esc(d.u.nombre), cc = esc(conPuntos(d.u.cc)), f = partesFecha(d.ci && d.ci.fecha);
  const num = (k, t) => `<p class="num"><span class="n">${k}</span><span>${t}</span></p>`;
  return cabDoc(d, 'AUTORIZACIÓN', 'Autorización para el tratamiento de datos personales y aceptación de las condiciones de uso del equipo', [registro(d.u.id)],
    [['Titular', d.u.nombre], ['C.C.', conPuntos(d.u.cc)], ['Fecha y hora', f.todo], ['Consultorio', (d.ci && d.ci.consultorio) || c.nombre]]) +
  `<div class="d-legal"><p>Yo, ${n}, mayor de edad, identificado(a) con cédula de ciudadanía No. ${cc}, en calidad de titular de los datos personales (en adelante, el «Titular»), declaro que he leído y comprendido el contenido del presente documento y, en consecuencia, otorgo la autorización y efectúo las declaraciones que se indican a continuación.</p>
  ${h2(1, 'Definiciones')}<p>Para efectos del presente documento se entiende por:</p>
  ${num('1.1.', `<b>Responsable:</b> ${esc(c.prestador)}, identificado(a) con NIT ${esc(c.nit)}, titular del establecimiento ${esc(c.nombre)}, quien decide sobre el tratamiento de los datos personales del Titular.`)}
  ${num('1.2.', '<b>Fabricante:</b> RPI Estética S.A.S., fabricante del Equipo, comercializado bajo la marca TK.')}
  ${num('1.3.', '<b>Equipo:</b> el dispositivo de estética facial SKIN TRANSDERM PLUS+, con registro sanitario INVIMA 2023DM-0026617.')}
  ${num('1.4.', '<b>Profesional:</b> la persona capacitada designada por el Responsable para operar el Equipo.')}
  ${h2(2, 'Objeto')}<p>Mediante el presente documento el Titular autoriza al Responsable para realizar el tratamiento de sus datos personales en los términos de la Ley 1581 de 2012 y sus decretos reglamentarios, y declara conocer y aceptar las condiciones de uso del Equipo descritas en el numeral 8.</p>
  ${h2(3, 'Responsable del tratamiento y posición del Fabricante')}<p>El Responsable del tratamiento de los datos personales del Titular es ${esc(c.prestador)}, quien podrá ser contactado a través del correo electrónico ${esc(c.correo)} o del teléfono ${esc(c.tel)}.</p><p>El Fabricante no recibe, no consulta, no almacena ni tiene acceso a los datos personales del Titular, y no ostenta la calidad de Responsable ni de Encargado del tratamiento en los términos de la Ley 1581 de 2012.</p>
  ${h2(4, 'Datos objeto de tratamiento')}<p>Serán objeto de tratamiento los siguientes datos: nombre completo, número de cédula de ciudadanía, el presente documento con su firma, las valoraciones que registre el Profesional y el historial de sesiones realizadas con el Equipo, el cual comprende fecha, protocolo, parámetros de funcionamiento y observaciones.</p><p>Las valoraciones y observaciones pueden contener información relativa a la salud del Titular, la cual tiene la naturaleza de dato sensible conforme al artículo 5 de la Ley 1581 de 2012. El Titular declara haber sido informado de que no está obligado a autorizar el tratamiento de sus datos sensibles ni a responder las preguntas que versen sobre ellos, y de que, en caso de no otorgar la autorización, el Profesional no podrá registrar su información en el Equipo.</p>
  ${h2(5, 'Finalidades del tratamiento')}<p>Los datos personales serán tratados exclusivamente para las siguientes finalidades: (a) identificar al Titular como usuario del Equipo; (b) registrar las valoraciones y las sesiones realizadas, con el fin de que el Profesional efectúe el seguimiento correspondiente; y (c) generar y conservar el presente documento.</p>
  ${h2(6, 'Almacenamiento, circulación y conservación')}<p>Los datos se almacenan únicamente en la memoria interna del Equipo, bajo la custodia del Responsable. Su consulta podrá realizarse desde la aplicación del Equipo mediante conexión Bluetooth, y el presente documento podrá remitirse en formato PDF a la dirección de correo electrónico que el Responsable determine. Los datos no serán transmitidos a servidores del Fabricante ni a terceros.</p><p>Los datos se conservarán hasta que el Titular solicite su supresión o hasta que el Responsable los elimine, salvo que exista un deber legal que obligue al Responsable a conservarlos.</p>
  ${h2(7, 'Derechos del Titular')}<p>De conformidad con el artículo 8 de la Ley 1581 de 2012, el Titular tiene derecho a: (a) conocer, actualizar y rectificar sus datos personales; (b) solicitar prueba de la autorización otorgada; (c) ser informado, previa solicitud, sobre el uso que se ha dado a sus datos; (d) presentar ante la Superintendencia de Industria y Comercio quejas por infracciones a lo dispuesto en la ley; (e) revocar la autorización o solicitar la supresión de los datos cuando proceda; y (f) acceder en forma gratuita a sus datos personales. Para el ejercicio de estos derechos el Titular podrá dirigirse al Responsable a través de los medios de contacto indicados en el numeral 3.</p>
  ${h2(8, 'Condiciones de uso del Equipo')}<p>El Titular declara que:</p>
  ${num('8.1.', 'Conoce que el Equipo es un dispositivo de estética facial que cuenta con las tecnologías de ultrasonido, electroporación y corriente galvánica, y que será operado exclusivamente por personal capacitado del Responsable.')}
  ${num('8.2.', 'Conoce que la valoración, la selección del protocolo, la configuración de los parámetros, los productos aplicados y la decisión de realizar cada sesión corresponden al Profesional. El Fabricante no interviene en la atención del Titular ni en dichas decisiones.')}
  ${num('8.3.', 'Recibió del Profesional información sobre el funcionamiento del Equipo y sobre las sensaciones y efectos que pueden presentarse durante y después de las sesiones, y tuvo la oportunidad de formular preguntas.')}
  ${num('8.4.', 'Se obliga a informar al Profesional, antes de cada sesión, cualquier condición de salud o modificación de esta, en especial: embarazo, uso de marcapasos u otro dispositivo electrónico implantado, presencia de implantes metálicos, y heridas o lesiones en la zona a tratar.')}
  ${num('8.5.', 'Se obliga a informar de inmediato al Profesional cualquier molestia que perciba durante la sesión. El Equipo cuenta con funciones de pausa y parada de emergencia.')}
  ${num('8.6.', 'Conoce que el Equipo genera un registro técnico de su funcionamiento que incluye fecha, protocolo, parámetros y duración de cada sesión. Dicho registro no contiene el nombre ni el número de identificación del Titular, no permite su identificación y se utiliza con fines de calidad, mantenimiento y tecnovigilancia.')}
  ${num('8.7.', 'Conoce que el presente documento no sustituye el consentimiento informado del procedimiento ni la historia clínica que, en su caso, deba diligenciar el Responsable.')}
  ${h2(9, 'Aceptación')}<p>En constancia de lo anterior, el Titular manifiesta que la presente autorización ha sido otorgada de manera libre, previa, expresa e informada, que comprende el tratamiento de sus datos sensibles, y que acepta las condiciones de uso del Equipo. El presente documento se firma en la pantalla del equipo.</p>
  <div class="d-firma"><div><div class="d-trazo">${firmaSvg(d.firma)}</div><div class="d-linea">Firma del Titular</div></div><div><p>Nombre: ${n}</p><p>C.C. No.: ${cc}</p><p>Fecha: ${esc(f.f)} &nbsp; Hora: ${esc(f.h)}</p></div></div></div>` + pieDoc(d, '');
}

// ---- Valoraciones ---------------------------------------------------------------------------------------------------------
function defValoracion(v) {
  const corporal = v.clase === 'corporal', seg = v.tipo === 'seguimiento';
  return CATALOGO.valoraciones.find(x => x.corporal === corporal && x.seguimiento === seg && (!corporal || x.zona === v.zona)) || CATALOGO.valoraciones[corporal ? 1 : 0];
}
function saludHtml(v) {
  const clase = v.clase === 'corporal' ? 'corporal' : 'facial', lista = CATALOGO.salud[clase], abs = CATALOGO.absolutas[clase];
  const s = v.salud || {}, si = q => s[q] === 'si';
  const linea = q => preg(q, si(q), si(q) && /^Alergia/.test(q) ? v.alergia : '');
  const nAbs = lista.filter(q => abs.includes(q) && si(q)).length, nSi = lista.filter(si).length;
  const res = nAbs ? '<b style="color:#D64545">no apto: contraindicación absoluta</b>' : nSi ? '<b style="color:#E0922F">con precaución</b> (sin absolutas)' : '<b style="color:#2E8F66">sin contraindicaciones</b>';
  return `<div class="d-dos"><div class="d-caja"><div class="d-cajatit" style="color:#D64545"><span class="d-punto" style="background:#D64545"></span>Absolutas</div><div class="d-nota">Con un Sí no se ejecuta ningún protocolo.</div>${lista.filter(q => abs.includes(q)).map(linea).join('')}</div>
    <div class="d-caja"><div class="d-cajatit" style="color:#E0922F"><span class="d-punto" style="background:#E0922F"></span>Relativas</div><div class="d-nota">Con un Sí se trabaja con precaución.</div>${lista.filter(q => !abs.includes(q)).map(linea).join('')}</div></div>
    <div class="d-nota" style="margin-top:7px">${lista.length} preguntas respondidas · ${nSi} con Sí · resultado: ${res}.</div>`;
}
function pielHtml(v) {
  const P = CATALOGO.piel, p = v.piel || {}, tonos = ['#F6E0D3', '#EBC8AE', '#D9A883', '#B9845C', '#8A5A3B', '#4E3426'];
  const ops = (l, on) => `<div class="d-ops">${l.map((x, i) => `<span class="d-op ${on(i) ? 'on' : ''}">${mayus1(x)}</span>`).join('')}</div>`;
  const fototipos = ['Muy clara: siempre se quema, nunca se broncea', 'Clara: casi siempre se quema, se broncea poco', 'Intermedia: a veces se quema y se broncea poco a poco',
                     'Morena clara: rara vez se quema, se broncea bien', 'Morena: casi nunca se quema', 'Negra: nunca se quema'];
  const f = +p.fototipo || 0;
  return `<div class="d-dos"><div class="d-caja"><span class="d-eti">Tipo de piel</span>${ops(P.tipo, i => (+p.tipo || 0) >> i & 1)}</div>
    <div class="d-caja"><span class="d-eti">Fototipo (Fitzpatrick)</span><div class="d-fotos">${tonos.map((c, i) => `<div class="d-foto ${i === f ? 'on' : ''}"><i style="background:${c}"></i>${P.fototipo[i]}</div>`).join('')}</div><div class="d-nota" style="margin-top:5px"><b>${P.fototipo[f]}</b> · ${fototipos[f]}</div></div>
    <div class="d-caja"><span class="d-eti">Integridad de la barrera</span>${ops(P.barrera, i => i === (+p.barrera || 0))}</div>
    <div class="d-caja"><span class="d-eti">Sensibilidad</span>${ops(P.sensibilidad, i => i === (+p.sensibilidad || 0))}</div></div>`;
}
// Dónde va el brillo de cada zona sobre la figura del PDF: se ajusta con las zonas que el simulador ya tenía ubicadas
const ANCLAS = {
  'Mapa facial': {img: () => CARA, caja: [300, 400], dentro: [27, 14], puntos: {'Frente': [106.5, 99.5], 'Contorno de ojo derecho': [51.5, 197.5], 'Nariz': [106.5, 269.5], 'Mejilla derecha': [46.5, 223.5], 'Mejilla izquierda': [167.5, 223.5]}},
  'Abdomen / Flancos': {img: () => ABDOMEN, caja: [288, 330], dentro: [0, 0], puntos: {'3 · Infraumbilical derecho': [83, 232], '4 · Infraumbilical izquierdo': [205, 232], '5 · Flanco derecho': [40, 216]}},
};
function ajusteLineal(pares) {        // [[a, b]…] → b ≈ m·a + c
  const n = pares.length, sa = pares.reduce((s, p) => s + p[0], 0), sb = pares.reduce((s, p) => s + p[1], 0);
  const saa = pares.reduce((s, p) => s + p[0] * p[0], 0), sab = pares.reduce((s, p) => s + p[0] * p[1], 0);
  const m = (n * sab - sa * sb) / (n * saa - sa * sa || 1);
  return a => m * a + (sb - m * sa) / n;
}
function mapaHtml(v, anterior) {
  const def = defValoracion(v), M = CATALOGO.mapas[def.mapa], marcas = v.mapa || [];
  const nivelDe = (lista, z, h) => { const x = (lista || []).find(m => m[0] === z && m[1] === h); return x ? x[2] : 0; };
  const zonas = [...new Set(marcas.map(m => m[0]))].sort((a, b) => a - b);
  const filas = zonas.map(z => {
    const hs = marcas.filter(m => m[0] === z).map(([, h, n]) => {
      const antes = anterior ? nivelDe(anterior.mapa, z, h) : 0;
      return nv(COLOR_NIVEL[n], `${M.hallazgos[h]} · ${CATALOGO.niveles[n]}`) + (anterior && antes !== n ? `<span class="d-antes">Antes: ${antes ? CATALOGO.niveles[antes].toLowerCase() : 'sin hallazgo'}</span>` : '');
    }).join('<br>');
    return `<tr><td style="width:40%;font-weight:600">${M.zonas[z]}</td><td>${hs}</td></tr>`;
  }).join('') || `<tr><td colspan="2" class="d-nota">Sin hallazgos marcados.</td></tr>`;
  const leyenda = `<div class="d-leyenda">${nv(COLOR_NIVEL[1], 'Leve')}${nv(COLOR_NIVEL[2], 'Moderado')}${nv(COLOR_NIVEL[3], 'Severo')}</div>`;
  const tabla = `<div><table><tr><th>${M.corporal ? 'Región' : 'Zona'}</th><th>Hallazgos e intensidad</th></tr>${filas}</table>${leyenda}</div>`;
  const A = ANCLAS[M.titulo];
  if (!A) return `<div>${tabla}</div>`;                 // regiones corporales sin figura: solo la tabla
  const pares = Object.entries(A.puntos).map(([nom, p]) => [M.centros[M.zonas.indexOf(nom)], p]).filter(([c]) => c);
  const fx = ajusteLineal(pares.map(([c, p]) => [c[0], p[0]])), fy = ajusteLineal(pares.map(([c, p]) => [c[1], p[1]]));
  const brillos = zonas.map(z => {
    const n = Math.max(...marcas.filter(m => m[0] === z).map(m => m[2])), d = M.corporal ? 48 : 47, c = COLOR_NIVEL[n];
    const x = fx(M.centros[z][0]) - d / 2, y = fy(M.centros[z][1]) - d / 2;
    return `<div class="d-spot" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;width:${d}px;height:${d}px;background:radial-gradient(circle,${c}F0 0%,${c}A0 40%,${c}00 72%)"></div>`;
  }).join('');
  const [w, h] = A.caja;
  const figura = M.corporal
    ? `<img src="${A.img()}" style="position:absolute;left:0;top:0;width:${w}px;height:${h}px" alt=""><span class="d-lado" style="left:8px">DERECHA</span><span class="d-lado" style="right:8px">IZQUIERDA</span>${brillos}`
    : `<span class="d-lado" style="left:12px">DERECHA</span><span class="d-lado" style="right:12px">IZQUIERDA</span><div style="position:absolute;left:${A.dentro[0]}px;top:${A.dentro[1]}px;width:250px;height:398px"><img src="${A.img()}" style="position:absolute;left:-50px;width:350px;height:400px" alt="">${brillos}</div>`;
  return `<div class="d-mapa"><div class="d-lienzo" style="width:${w}px;height:${h}px">${figura}</div>${tabla}</div>`;
}
// d: {u, v: val_NNNN.json, n, cons, logo, anterior: la valoración anterior de la misma clase y zona (seguimiento)}
function docValoracion(d) {
  const v = d.v, def = defValoracion(v), M = CATALOGO.mapas[def.mapa], seg = v.tipo === 'seguimiento', corporal = v.clase === 'corporal';
  const titulo = corporal ? `Valoración corporal · ${M.titulo}` : seg ? 'Valoración facial de seguimiento' : 'Valoración facial inicial';
  return cabDoc(d, corporal ? 'VALORACIÓN CORPORAL' : 'VALORACIÓN FACIAL', titulo, [`Valoración n.º ${d.n}`, registro(d.u.id)],
    [['Usuario', d.u.nombre], ['C.C.', conPuntos(d.u.cc)], ['Fecha y hora', v.fecha || '—'], ['Tipo', seg ? 'Seguimiento' : 'Inicial']]) +
  h2(1, 'Salud · contraindicaciones') + saludHtml(v) + h2(2, 'Examen de la piel') + pielHtml(v) +
  h2(3, corporal ? `Mapa corporal · ${M.titulo}` : 'Mapa facial') + mapaHtml(v, seg ? d.anterior : null) +
  h2(4, 'Observaciones') + `<div class="d-caja"><p style="margin:0">${esc(v.obs) || '—'}</p></div>` + pieDoc(d, '');
}

// ---- Sesiones -------------------------------------------------------------------------------------------------------------
function colorProtocolo(s) {
  const p = (s.protocolo || '').toLowerCase();
  return s.signature === 'si' ? '#0F9D8A' : p.includes('transderm') ? '#2E2B7A' : p.includes('infusion') ? '#8B5CF6' : p.includes('extract') ? '#1D71B8' : '#3466AE';
}
const mmss = s => `${String(Math.floor((+s || 0) / 60)).padStart(2, '0')}:${String((+s || 0) % 60).padStart(2, '0')}`;
const estadoPill = e => e === 'completa' ? `<span class="d-pill" style="background:#2E8F661F;color:#2E8F66">Completa</span>` : `<span class="d-pill" style="background:#E0922F1F;color:#E0922F">Interrumpida</span>`;
function tarjSesion(s, n, grande) {
  const c = colorProtocolo(s), completa = s.estado === 'completa';
  const pct = completa ? 100 : Math.max(4, Math.min(100, Math.round(100 * (+s.real_s || 0) / Math.max(1, +s.programado_s || 1))));
  const par = Object.entries(s.parametros || {}).slice(0, 8);
  const fin = completa ? s['Observaciones'] : s['Motivo de la interrupción'];
  return `<div class="d-ses" style="--c:${c};border-left-color:${c};border-top-color:${c}"><div style="display:flex;justify-content:space-between;align-items:center"><div><b style="font-size:${grande ? 17 : 14.5}px">${esc(s.protocolo)}</b>${s.signature === 'si' ? ' <span class="d-nota">· Skin Signature</span>' : ''}</div>${estadoPill(s.estado)}</div>
    <div class="d-nota">Sesión n.º ${n} · ${esc(s.fecha)}${s.realizado_por ? ` · realizado por <b>${esc(s.realizado_por)}</b>` : ''}</div>
    <div style="display:flex;align-items:center;gap:12px"><div class="d-barra" style="flex:1"><i style="width:${pct}%;background:${completa ? '#2E8F66' : '#E0922F'}"></i></div><span class="d-nota" style="white-space:nowrap">Duración real <b>${mmss(s.real_s)} de ${mmss(s.programado_s)} min</b></span></div>
    <div>${par.map(([a, b]) => `<span class="d-chip"><span>${esc(a)}</span> ${esc(b)}</span>`).join('')}</div>
    <div class="d-cuatro" style="grid-template-columns:repeat(3,1fr)">${[['Productos', s['Productos utilizados']], ['Zonas', s['Zonas trabajadas']], ['Reacciones de la piel', s['Reacciones de la piel']]].map(([a, b]) => `<div><span class="d-eti">${a}</span>${esc(b) || '—'}</div>`).join('')}</div>
    <div class="d-obs"><span class="d-eti">${completa ? 'Observaciones' : 'Motivo de la interrupción'}</span><div>${esc(fin) || '—'}</div></div></div>`;
}
// d: {u, s: ses_NNNN.json, n, cons, logo}
function docSesion(d) {
  const s = d.s;
  return cabDoc(d, 'SESIÓN', `Registro de sesión · ${esc(s.protocolo)}`, [`Sesión n.º ${d.n}`, registro(d.u.id)],
    [['Usuario', d.u.nombre], ['C.C.', conPuntos(d.u.cc)], ['Fecha y hora', s.fecha || '—'], ['Protocolo', s.signature === 'si' ? 'Skin Signature' : s.protocolo]]) +
  h2(1, 'Resultado') + tarjSesion(s, d.n, true) +
  h2(2, 'Parámetros ejecutados') + `<table><tr><th>Parámetro</th><th>Valor</th></tr>${Object.entries(s.parametros || {}).map(([a, b]) => `<tr><td style="width:45%;font-weight:600">${esc(a)}</td><td>${esc(b)}</td></tr>`).join('') || '<tr><td colspan="2" class="d-nota">Sin parámetros guardados.</td></tr>'}</table>
    <div class="d-nota" style="margin-top:8px">Tiempo programado ${mmss(s.programado_s)} min · tiempo real ${mmss(s.real_s)} min${/enc\./.test(s.fecha || '') ? ' · sin hora real: el equipo no estaba conectado a TK_APP' : ''}.</div>` + pieDoc(d, '');
}
// d: {u, sesiones: [{n, s}], vals: [{n, v}], cons, logo}
function docHistorial(d) {
  const filas = [...d.sesiones.map(x => ({k: claveFecha(x.s.fecha), ses: x})), ...d.vals.map(x => ({k: claveFecha(x.v.fecha), val: x}))].sort((a, b) => b.k.localeCompare(a.k));
  const fechas = filas.map(x => x.k).filter(Boolean).sort();
  const deClave = k => k ? `${k.slice(6, 8)}/${k.slice(4, 6)}/${k.slice(0, 4)}` : '—';
  const tituloVal = v => v.clase === 'corporal' ? `Valoración corporal · ${CATALOGO.mapas[defValoracion(v).mapa].titulo}` : `Valoración facial ${v.tipo === 'seguimiento' ? 'de seguimiento' : 'inicial'}`;
  return cabDoc(d, 'HISTORIAL', 'Historial de sesiones', [`${d.sesiones.length} ${d.sesiones.length === 1 ? 'sesión' : 'sesiones'} · ${d.vals.length} ${d.vals.length === 1 ? 'valoración' : 'valoraciones'}`, registro(d.u.id)],
    [['Usuario', d.u.nombre], ['C.C.', conPuntos(d.u.cc)], ['Periodo', fechas.length ? `${deClave(fechas[0])} a ${deClave(fechas[fechas.length - 1])}` : '—'],
     ['Generado el', fechaEquipo(new Date())]]) +
  h2(1, 'Resumen') + `<table><tr><th>N.º</th><th>Fecha y hora</th><th>Protocolo o valoración</th><th>Duración</th><th>Estado</th></tr>
    ${filas.map(x => x.val ? `<tr><td style="color:#9A98BC">—</td><td>${esc(x.val.v.fecha)}</td><td colspan="3"><span class="d-nv"><i style="background:#fff;box-shadow:inset 0 0 0 2px #3466AE"></i>${tituloVal(x.val.v)}</span></td></tr>`
      : `<tr><td style="width:7%;font-weight:700">${x.ses.n}</td><td style="width:22%">${esc(x.ses.s.fecha)}</td><td>${nv(colorProtocolo(x.ses.s), esc(x.ses.s.protocolo))}</td><td style="width:20%">${mmss(x.ses.s.real_s)} de ${mmss(x.ses.s.programado_s)} min</td><td style="width:16%">${estadoPill(x.ses.s.estado)}</td></tr>`).join('') || '<tr><td colspan="5" class="d-nota">Sin sesiones ni valoraciones.</td></tr>'}</table>` +
  (d.sesiones.length ? h2(2, 'Detalle de cada sesión') + [...d.sesiones].sort((a, b) => b.n - a.n).map(x => tarjSesion(x.s, x.n)).join('') : '') + pieDoc(d, '');
}

// ---- Hojas carta: la vista previa y el PDF son las mismas hojas (816 × 1054 px) ---------------------------------------------
// Bloque por bloque; los largos (texto legal, tablas, listas de preguntas) se parten, los pequeños nunca, cada sección
// numerada del CI va entera y un título nunca queda solo al final de una hoja.
const HOJA_H = 1054;
const PARTIBLE = '.d-legal, table, tbody, .d-dos, .d-caja:has(.d-preg)';
const desborda = cu => cu.scrollHeight > cu.clientHeight + 1;
function llenar(cont, el, cu) {
  cont.appendChild(el);
  if (!desborda(cu)) return null;
  const alto = el.offsetHeight;
  cont.removeChild(el);
  const partible = el.matches(PARTIBLE) || (el.matches('.d-sec') && alto > HOJA_H * .8);
  if (!partible || !el.children.length) return el;
  const hijos = [...el.children], cab = hijos[0].tagName === 'TR' && hijos[0].querySelector('th') ? hijos[0] : null;
  const a = el.cloneNode(false); cont.appendChild(a);
  let i = 0, resto = null;
  for (; i < hijos.length; i++) { resto = llenar(a, hijos[i], cu); if (resto) break; }
  const b = el.cloneNode(false), pasan = [];
  while (a.lastElementChild && a.lastElementChild.matches('.d-h')) pasan.unshift(a.removeChild(a.lastElementChild));
  if (![...a.children].some(x => x !== cab)) { cont.removeChild(a); hijos.forEach(h => el.appendChild(h)); return el; }
  if (cab && resto !== cab) b.appendChild(cab.cloneNode(true));
  pasan.forEach(x => b.appendChild(x));
  if (resto) b.appendChild(resto);
  hijos.slice(i + 1).forEach(h => b.appendChild(h));
  return b.children.length ? b : null;
}
function paginar(html, d) {
  const med = document.createElement('div'); med.className = 'medidor'; document.body.appendChild(med);
  med.innerHTML = `<div class="doc est-D">${html}</div>`;
  const fuente = med.firstElementChild, pie = fuente.querySelector(':scope > .d-pie'); if (pie) pie.remove();
  fuente.querySelectorAll('.d-legal').forEach(L => {
    let sec = null;
    [...L.children].forEach(x => { if (x.matches('.d-h')) { sec = document.createElement('div'); sec.className = 'd-sec'; L.insertBefore(sec, x); } if (sec) sec.appendChild(x); });
  });
  const hojas = [];
  const nueva = () => { const h = document.createElement('div'); h.className = 'doc est-D hoja'; h.innerHTML = `<div class="hoja-cuerpo"></div>${pieDoc(d, 'Página 0 de 0')}`; med.appendChild(h); hojas.push(h); return h.firstElementChild; };
  let cu = nueva(); const cola = [...fuente.children];
  while (cola.length) {
    const b = cola.shift();
    let r = llenar(cu, b, cu);
    if (!r && b.matches('.d-h') && cola.length) {
      const r2 = llenar(cu, cola[0], cu);
      if (r2 === cola[0]) { cu.removeChild(b); r = b; } else { cola.shift(); if (r2) cola.unshift(r2); }
    }
    if (r) { if (!cu.children.length) { cu.appendChild(r); cu = nueva(); continue; } cu = nueva(); cola.unshift(r); }
  }
  if (!cu.children.length && hojas.length > 1) hojas.pop().remove();
  const html2 = hojas.map((h, i) => { h.querySelector('.d-pie span:last-child').textContent = `${registro(d.u.id)} · Página ${i + 1} de ${hojas.length}`; return h.outerHTML; });
  med.remove();
  return html2;
}
