// TK_APP · cómo se habla con el equipo (protocolo aprobado el 05/11/2026: notas/PROTOCOLO_BLE_TK_APP.md).
//   EquipoBle:    el SKIN de verdad, por Bluetooth (Chrome, Edge o Bluefy).
//   EquipoPrueba: hace lo mismo con datos ficticios, para probar la app sin el equipo (misma clave 00123).
// Los dos tienen la misma forma: conectar(), pedir(mensaje) → respuesta, enviar(mensaje), y avisan con alEvento y alCortar.
'use strict';

const NUS = '6e400001-b5a3-f393-e0a9-e50e24dcca9e', NUS_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e', NUS_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const AVISOS = ['pide_hora', 'firma_pedida', 'firma_cancelada'];

class EquipoBase {
  constructor() { this.alEvento = () => {}; this.alCortar = () => {}; this.esperando = []; this.serie = ''; }
  // Espera la respuesta del mismo tipo (el equipo atiende un mensaje a la vez, en orden)
  pedir(m, ms = 20000) {
    return new Promise((ok, mal) => {
      const p = {t: m.t, id: m.id, f: m.f, ok, mal, reloj: setTimeout(() => { this.esperando = this.esperando.filter(x => x !== p); mal(new Error('El equipo no respondió')); }, ms)};
      this.esperando.push(p);
      this.enviar(m).catch(e => { clearTimeout(p.reloj); this.esperando = this.esperando.filter(x => x !== p); mal(e); });
    });
  }
  recibido(m) {
    if (AVISOS.includes(m.t)) { this.alEvento(m); return; }
    // La respuesta es del pedido del mismo tipo (y del mismo usuario y archivo): una tardía no se cruza con otra
    const i = this.esperando.findIndex(p => m.t === 'error' || (p.t === m.t && (p.id === undefined || m.id === undefined || p.id === m.id) && (p.f === undefined || m.f === undefined || p.f === m.f)));
    if (i < 0) return;
    const p = this.esperando.splice(i, 1)[0];
    clearTimeout(p.reloj);
    p.ok(m);
  }
  cortado() { this.esperando.forEach(p => { clearTimeout(p.reloj); p.mal(new Error('Se cortó la conexión')); }); this.esperando = []; this.alCortar(); }
}

class EquipoBle extends EquipoBase {
  static disponible() { return !!(navigator.bluetooth && navigator.bluetooth.requestDevice); }
  async conectar() {
    // La lista la dibuja el celular (Chrome o Bluefy): ahí aparece SKIN-… o «SKIN-… · ocupado»
    this.disp = await navigator.bluetooth.requestDevice({filters: [{namePrefix: 'SKIN-'}], optionalServices: [NUS]});
    const nombre = this.disp.name || '';
    if (/ocupado/i.test(nombre)) { const e = new Error('ocupado'); e.ocupado = true; throw e; }
    this.serie = nombre.trim();
    this.disp.addEventListener('gattserverdisconnected', () => this.cortado());
    await this.abrir();
  }
  // Volver a conectar al mismo equipo sin la lista del celular (si se cayó la conexión)
  async reconectar() { await this.abrir(); }
  async abrir() {
    const gatt = await this.disp.gatt.connect();
    const serv = await gatt.getPrimaryService(NUS);
    this.rx = await serv.getCharacteristic(NUS_RX);
    const tx = await serv.getCharacteristic(NUS_TX);
    this.resto = '';
    const dec = new TextDecoder();
    tx.addEventListener('characteristicvaluechanged', ev => {
      this.resto += dec.decode(ev.target.value, {stream: true});
      let i;
      while ((i = this.resto.indexOf('\n')) >= 0) {
        const linea = this.resto.slice(0, i); this.resto = this.resto.slice(i + 1);
        try { this.recibido(JSON.parse(linea)); } catch (_) { /* un pedazo dañado: se ignora */ }
      }
    });
    await tx.startNotifications();
    this.cola = Promise.resolve();
  }
  // En pedazos de 180 bytes, uno tras otro (el logo ronda los 20 KB)
  enviar(m) {
    const datos = new TextEncoder().encode(JSON.stringify(m) + '\n');
    this.cola = this.cola.then(async () => {
      for (let i = 0; i < datos.length; i += 180) {
        const trozo = datos.slice(i, i + 180);
        if (this.rx.writeValueWithResponse) await this.rx.writeValueWithResponse(trozo); else await this.rx.writeValue(trozo);
      }
    });
    return this.cola;
  }
  desconectar() { try { this.disp && this.disp.gatt.disconnect(); } catch (_) { /* ya estaba */ } }
}

// ---- Equipo de prueba: datos ficticios con el mismo formato de la micro SD -------------------------------------------------
class EquipoPrueba extends EquipoBase {
  constructor() {
    super();
    this.serie = 'SKIN-000123';
    this.dentro = false; this.fallos = 0; this.bloqueos = 0; this.finEspera = 0;
    this.cons = {nombre: 'Estética Bella Piel', prestador: 'Dra. Laura Méndez', nit: '900.123.456-7', tel: '601 555 0199', correo: 'contacto@bellapiel.com'};
    this.logo = '';
    this.sd = datosDePrueba();
  }
  async conectar() { await new Promise(r => setTimeout(r, 700)); }
  async reconectar() { await new Promise(r => setTimeout(r, 500)); }
  responder(m, ms = 250) { setTimeout(() => this.recibido(m), ms); }
  async enviar(m) {
    const t = m.t, PASES = 'tkapp-prueba-pases';
    const leerPases = () => { try { return JSON.parse(localStorage.getItem(PASES) || '{}'); } catch (_) { return {}; } };
    const guardarPases = p => { try { localStorage.setItem(PASES, JSON.stringify(p)); } catch (_) { /* sin memoria */ } };
    if (t === 'hola') {
      const pases = leerPases(), ahora = Date.now(), vale = m.pase && pases[m.pase] && ahora - pases[m.pase] < 5 * 864e5;
      if (vale) { pases[m.pase] = ahora; guardarPases(pases); this.dentro = true; }
      return this.responder({t, serie: this.serie, fw: '1.0 · prueba', acceso: vale ? 'ok' : 'clave', espera: Math.max(0, Math.ceil((this.finEspera - ahora) / 1000))});
    }
    if (t === 'clave') {
      const ahora = Date.now();
      if (ahora < this.finEspera) return this.responder({t, ok: false, espera: Math.ceil((this.finEspera - ahora) / 1000)});
      if (m.clave === '00123') {
        const pase = Array.from({length: 16}, () => 'abcdefghjkmnpqrstuvwxyz23456789'[Math.random() * 31 | 0]).join('');
        const pases = leerPases(); pases[pase] = ahora; guardarPases(pases);
        this.fallos = this.bloqueos = 0; this.dentro = true;
        return this.responder({t, ok: true, pase});
      }
      if (++this.fallos < 3) return this.responder({t, ok: false, quedan: 3 - this.fallos});
      const espera = [30, 60, 120, 300][Math.min(this.bloqueos++, 3)];
      this.fallos = 0; this.finEspera = ahora + espera * 1000;
      return this.responder({t, ok: false, espera});
    }
    if (t === 'ping') return this.responder({t});
    if (!this.dentro) return this.responder({t: 'error', error: 'sin_clave'});
    if (t === 'hora') return this.responder({t, ok: true});
    if (t === 'olvidar') { const pases = leerPases(); delete pases[m.pase]; guardarPases(pases); return this.responder({t, ok: true}); }
    if (t === 'usuarios') {
      const q = sinTildes(m.q).toUpperCase();
      const lista = this.sd.usuarios.filter(u => q.length < 3 || sinTildes(u.nombre).toUpperCase().includes(q) || u.cc.includes(q.replace(/\D/g, '') || '§'))
        .slice(0, 20).map(u => ({id: u.id, n: u.nombre, cc: u.cc, val: u.vals.length, ses: u.sess.length, ult: u.sess.length ? u.sess[u.sess.length - 1].fecha.split(' · ')[0] : '-'}));
      return this.responder({t, q: m.q || '', total: this.sd.usuarios.length, lista}, 450);
    }
    const u = this.sd.usuarios.find(x => x.id === m.id);
    if (t === 'ficha') {
      if (!u) return this.responder({t, id: m.id, error: 'no_existe'});
      const resumen = [...u.vals.map((v, i) => `v\t${i + 1}\t0\t${v.fecha}\t${v.clase === 'corporal' ? 'Valoración corporal' : 'Valoración facial'}`),
                       ...u.sess.map((s, i) => `s\t${i + 1}\t0\t${s.fecha}\t${s.protocolo}`)].join('\n') + '\n';
      return this.responder({t, id: u.id, val: u.vals.length, ses: u.sess.length, usuario: {nombre: u.nombre, cc: u.cc, alta: u.alta}, ci: u.ci, resumen}, 500);
    }
    if (t === 'archivo') {
      if (!u) return this.responder({t, id: m.id, f: m.f, error: 'no_existe'});
      const k = /^(val|ses)_(\d{4})\.json$/.exec(m.f || '');
      const datos = m.f === 'firma.sig' ? u.firma : k ? (k[1] === 'val' ? u.vals : u.sess)[+k[2] - 1] : undefined;
      return this.responder(datos === undefined ? {t, id: u.id, f: m.f, error: 'no_existe'} : {t, id: u.id, f: m.f, datos}, 200);
    }
    if (t === 'consultorio') {
      for (const c of ['nombre', 'prestador', 'nit', 'tel', 'correo']) if (typeof m[c] === 'string') this.cons[c] = m[c];
      return this.responder({t, ...this.cons});
    }
    if (t === 'logo') { if (typeof m.img === 'string') { this.logo = m.img; return this.responder({t, ok: true}, 600); } return this.responder({t, img: this.logo}); }
    if (t === 'firma') {
      if (!this.firmaPedida) return this.responder({t, ok: false, error: 'no_pedida'});
      const id = Math.max(...this.sd.usuarios.map(x => x.id)) + 1, f = fechaEquipo(new Date());
      this.sd.usuarios.unshift({id, nombre: this.firmaPedida.nombre, cc: this.firmaPedida.cc, alta: f, ci: {fecha: f, medio: 'app', aceptado: 'si', consultorio: this.cons.nombre}, firma: m.trazos, vals: [], sess: []});
      this.firmaPedida = null;
      return this.responder({t, ok: true, id}, 600);
    }
    return this.responder({t: 'error', error: 'desconocido'});
  }
  // Lo que haría el equipo por su cuenta (botones del modo de prueba)
  simularFirma() { this.firmaPedida = {nombre: 'Valentina Gómez Ríos', cc: '1001234567'}; this.recibido({t: 'firma_pedida', ...this.firmaPedida}); }
  simularCancelar() { if (this.firmaPedida) { this.firmaPedida = null; this.recibido({t: 'firma_cancelada'}); } }
  simularHora() { this.recibido({t: 'pide_hora'}); }
  desconectar() { this.dentro = false; setTimeout(() => this.cortado(), 50); }
}

function datosDePrueba() {
  const firma = 'firma\n' + Array.from({length: 3}, (_, t) => Array.from({length: 26}, (_, i) => `${120 + t * 170 + i * 5},${130 + Math.round(38 * Math.sin(i / 3 + t))}`).join(' ')).join('\n');
  const salud = (clase, si) => Object.fromEntries(CATALOGO.salud[clase].map(q => [q, si.includes(q) ? 'si' : 'no']));
  const valF = (fecha, tipo, mapa, obs) => ({fecha, clase: 'facial', tipo, zona: '', salud: salud('facial', ['Alergias a cosméticos, metales o medicamentos']), alergia: 'Ácido salicílico',
    piel: {tipo: 0b10100, fototipo: 2, barrera: 1, sensibilidad: 1}, mapa, obs});
  const ses = (fecha, protocolo, estado, real, prog, par, extra = {}) => ({fecha, protocolo, realizado_por: 'Laura Méndez', estado, programado_s: prog, real_s: real, parametros: par,
    'Productos utilizados': 'Ácido hialurónico', 'Zonas trabajadas': 'Frente y mejillas', 'Reacciones de la piel': 'Ninguna',
    [estado === 'completa' ? 'Observaciones' : 'Motivo de la interrupción']: estado === 'completa' ? 'Buena tolerancia.' : 'Parada de emergencia: la usuaria pidió detener.', ...extra});
  const maria = {id: 128, nombre: 'María Fernanda Rojas', cc: '1020456789', alta: '15/09/2026 · 10:12', ci: {fecha: '15/09/2026 · 10:12', medio: 'equipo', aceptado: 'si', consultorio: 'Estética Bella Piel'}, firma,
    vals: [valF('15/09/2026 · 10:15', 'inicial', [[0, 0, 1], [2, 6, 2], [5, 2, 3], [6, 2, 2], [4, 4, 1]], 'Piel mixta con deshidratación. Se recomienda iniciar con Skin Extract y seguir con Skin Transderm.'),
           valF('20/10/2026 · 11:10', 'seguimiento', [[0, 0, 1], [2, 6, 1], [5, 2, 3], [6, 2, 1], [4, 4, 1]], 'Mejora en la hidratación del contorno de ojo y en las manchas de la mejilla izquierda.'),
           {fecha: '27/10/2026 · 10:40', clase: 'corporal', tipo: 'inicial', zona: 'abdomen', salud: salud('corporal', ['Alergias a cosméticos, metales o medicamentos']), alergia: 'Ácido salicílico',
            piel: {tipo: 0b00100, fototipo: 2, barrera: 0, sensibilidad: 1}, mapa: [[2, 1, 2], [3, 1, 2], [4, 0, 1]], obs: 'Adiposidad localizada en abdomen inferior. Trabajar con Skin Transderm corporal, 4 cuadrantes.'}],
    sess: [ses('15/09/2026 · 10:30', 'Skin Extract facial', 'completa', 480, 480, {Intensidad: '0,4', Polaridad: 'Negativa −'}, {'Observaciones': 'Primera sesión.'}),
           ses('29/09/2026 · 11:05', 'Skin Extract facial', 'interrumpida', 250, 480, {Intensidad: '0,4', Polaridad: 'Negativa −'}),
           ses('06/10/2026 · 15:20', 'Skin Infusion facial', 'completa', 600, 600, {Intensidad: '0,6', Polaridad: 'Positiva +'}),
           ses('20/10/2026 · 10:55', 'Glow hidratante', 'completa', 2160, 2160, {Cuadrantes: '4', 'Ultrasonido Tiempo': '3', 'Ultrasonido Potencia': '0,8', 'Electroporación Modo': 'Interrumpido', 'Electroporación Ciclo útil': '30 %'}, {signature: 'si'}),
           ses('26/10/2026 · 11:40', 'Skin Transderm facial', 'completa', 600, 600, {Cuadrantes: '1', 'Ultrasonido Tiempo': '4', 'Electroporación Tiempo': '3', 'Electroforesis Tiempo': '3'},
               {'Productos utilizados': 'Ácido hialurónico no reticulado', 'Reacciones de la piel': 'Eritema leve que cede en 10 minutos',
                'Observaciones': 'Buena tolerancia durante toda la sesión. La usuaria refiere hormigueo leve en la electroporación a partir del nivel 3 del umbral, que desaparece al bajar al nivel 2; se deja en 2 para las próximas sesiones. Se recomienda protector solar de amplio espectro durante 48 horas.'})]};
  const otro = (id, nombre, cc, fecha) => ({id, nombre, cc, alta: fecha, ci: {fecha, medio: 'equipo', aceptado: 'si', consultorio: 'Estética Bella Piel'}, firma, vals: [], sess: [ses(fecha, 'Skin Infusion facial', 'completa', 600, 600, {Intensidad: '0,5', Polaridad: 'Positiva +'})]});
  return {usuarios: [maria, otro(131, 'Rosa Elena Pardo', '52310884', '04/11/2026 · 09:20'), otro(130, 'Camila Andrea Torres', '1032554201', '03/11/2026 · 16:05'),
                     otro(129, 'Diana Marcela Ruiz', '39784112', '29/10/2026 · 10:00'), otro(127, 'Paula Jimena Castro', '1015889340', '28/10/2026 · 14:30')]};
}
