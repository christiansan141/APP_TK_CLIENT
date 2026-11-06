// TK_APP · cómo se habla con el equipo (protocolo aprobado el 05/11/2026: notas/PROTOCOLO_BLE_TK_APP.md).
//   EquipoBle: el SKIN de verdad, por Bluetooth (Chrome, Edge o Bluefy). La app solo funciona con el equipo (sin modo de prueba
//   desde el 06/11/2026). Forma: conectar(), pedir(mensaje) → respuesta, enviar(mensaje), y avisa con alEvento y alCortar.
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
    // .catch antes: si un envío falló, los siguientes igual salen (si no, la cola quedaría rechazada hasta reconectar)
    this.cola = this.cola.catch(() => {}).then(async () => {
      for (let i = 0; i < datos.length; i += 180) {
        const trozo = datos.slice(i, i + 180);
        if (this.rx.writeValueWithResponse) await this.rx.writeValueWithResponse(trozo); else await this.rx.writeValue(trozo);
      }
    });
    return this.cola;
  }
  desconectar() { try { this.disp && this.disp.gatt.disconnect(); } catch (_) { /* ya estaba */ } }
}
