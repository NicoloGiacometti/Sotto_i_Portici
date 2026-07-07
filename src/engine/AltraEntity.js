import * as THREE from 'three';

/**
 * AltraEntity — "l'Altra": la presenza che abita la casa man mano che la
 * profondità cresce. Narrativamente è la parte dissociata di Michela
 * (docs/narrative.md); meccanicamente è la fonte di minaccia del gioco:
 *
 *  - Stadio 0: non esiste.
 *  - Stadio 1: può apparire ferma in un angolo. Guardarla per più di un
 *    istante la fa svanire (con un piccolo costo di lucidità).
 *  - Stadio 2-3: si AVVICINA quando non la guardi. Guardarla la blocca,
 *    ma tenere lo sguardo su di lei consuma lucidità più in fretta.
 *    Se ti tocca: "assenza" (gestita dal chiamante via onCaught).
 *  - Inseguimento finale (chase): al Reno, dopo l'ultimo ricordo, ti dà
 *    la caccia senza fermarsi — guardarla non serve più, si può solo
 *    correre verso l'osteria.
 *
 * Come SceneManager, vive in engine/ ma è dichiaratamente accoppiata al
 * gioco. Non tocca però game/state.js direttamente: riceve stage/chase
 * dal chiamante e comunica tutto via callback (onCaught, onDrain,
 * onHeartbeat, onWhisper, onFlee) — main.js decide cosa significano.
 */

const SPAWN_CHANCE_BY_STAGE = [0, 0.3, 0.55, 0.75];
const APPROACH_SPEED_BY_STAGE = [0, 0, 1.15, 1.7]; // m/s, solo se non guardata
const CHASE_SPEED = 3.8; // camminata = 3.2, corsa = 5.2 → devi correre
const CONTACT_DISTANCE = 0.9;
const WATCH_DOT = 0.8; // quanto al centro dello schermo deve stare per contare come "guardata"

/** Silhouette scura disegnata su canvas: nessun asset PNG richiesto. */
function makeAltraTexture() {
  const w = 220;
  const h = 400;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');

  // Aura sfumata attorno alla figura
  const grad = g.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.5, w * 0.55);
  grad.addColorStop(0, 'rgba(0,0,0,0.9)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);

  // Testa + corpo, quasi neri
  g.fillStyle = 'rgba(5,4,4,0.97)';
  g.beginPath();
  g.arc(w / 2, h * 0.14, w * 0.095, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.roundRect(w * 0.33, h * 0.2, w * 0.34, h * 0.72, 26);
  g.fill();

  // Due occhi appena percettibili
  g.fillStyle = 'rgba(210,190,170,0.30)';
  g.fillRect(w * 0.44, h * 0.13, 4, 3);
  g.fillRect(w * 0.54, h * 0.13, 4, 3);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class AltraEntity {
  constructor({ scene, camera, onCaught, onDrain, onHeartbeat, onWhisper, onFlee }) {
    this.scene = scene;
    this.camera = camera;
    this.onCaught = onCaught ?? (() => {});
    this.onDrain = onDrain ?? (() => {});
    this.onHeartbeat = onHeartbeat ?? (() => {});
    this.onWhisper = onWhisper ?? (() => {});
    this.onFlee = onFlee ?? (() => {});

    this.texture = makeAltraTexture();
    this.mesh = null;
    this.active = false;
    this.room = null; // dati stanza corrente (serve floorSize per spawn/clamp)

    this.watchedTime = 0;
    this.respawnTimer = 0;
    this.heartbeatTimer = 0;
    this.spawnTimeout = null;
  }

  /**
   * Da chiamare a ogni cambio stanza. Decide se (e con che ritardo)
   * l'Altra compare nella nuova stanza, in base allo stadio.
   */
  onRoomChange(room, { stage, chase }) {
    this.despawn();
    this.room = room;
    if (!room) return;

    if (chase && room.id === 'il_reno') {
      this.spawnFar(); // l'inseguimento riprende appena rientri sull'argine
      return;
    }
    if (stage < 1) return;

    this.respawnTimer = 15 + Math.random() * 20;
    const chance = SPAWN_CHANCE_BY_STAGE[stage] ?? 0;
    if (Math.random() < chance) {
      // Non subito: qualche secondo dopo l'ingresso, quando il giocatore
      // ha già iniziato a guardarsi intorno.
      this.spawnTimeout = setTimeout(() => {
        if (!this.active) this.spawnFar();
      }, (2 + Math.random() * 5) * 1000);
    }
  }

  /** Fa comparire l'Altra nel punto della stanza più lontano dal giocatore. */
  spawnFar() {
    if (!this.room) return;
    this.despawn();
    const { width, depth } = this.room.floorSize;
    let best = [0, 0];
    let bestDist = -1;
    for (let i = 0; i < 12; i++) {
      const x = (Math.random() - 0.5) * (width - 1.6);
      const z = (Math.random() - 0.5) * (depth - 1.6);
      const d = Math.hypot(x - this.camera.position.x, z - this.camera.position.z);
      if (d > bestDist) {
        bestDist = d;
        best = [x, z];
      }
    }
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.92,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), material);
    this.mesh.position.set(best[0], 1.1, best[1]);
    this.scene.add(this.mesh);
    this.active = true;
    this.watchedTime = 0;
    this.heartbeatTimer = 0;
    this.onWhisper();
  }

  /** La sfoglina (o altro rituale) la scaccia dalla stanza. */
  banish() {
    if (this.active) this.despawn();
  }

  despawn() {
    clearTimeout(this.spawnTimeout);
    this.spawnTimeout = null;
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.material.dispose();
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    this.active = false;
  }

  /** Una volta per frame (solo mentre si gioca — non con modali aperti). */
  update(dt, { stage, chase }) {
    if (!this.room) return;
    const chaseMode = chase && this.room.id === 'il_reno';

    if (!this.active) {
      // Ricomparsa periodica dentro la stessa stanza, dagli stadi freddi in poi.
      if (stage >= 2 && !chaseMode) {
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) {
          this.respawnTimer = 18 + Math.random() * 20;
          if (Math.random() < 0.5) this.spawnFar();
        }
      }
      return;
    }

    const mesh = this.mesh;
    const cam = this.camera;

    // Sempre rivolta verso il giocatore
    mesh.rotation.y = Math.atan2(cam.position.x - mesh.position.x, cam.position.z - mesh.position.z);

    const toHer = new THREE.Vector3().subVectors(mesh.position, cam.position);
    toHer.y = 0;
    const dist = toHer.length();
    toHer.normalize();
    const forward = new THREE.Vector3();
    cam.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const watched = forward.dot(toHer) > WATCH_DOT;

    if (watched) {
      this.watchedTime += dt;
      this.onDrain(dt * (chaseMode ? 2 : 5)); // guardarla costa lucidità
      if (stage === 1 && this.watchedTime > 1.2) {
        // Allo stadio 1 è solo un'apparizione: guardata, svanisce.
        this.despawn();
        this.onDrain(4);
        this.onFlee('vanished');
        return;
      }
      if (!chaseMode && this.watchedTime > 6) {
        // Non regge lo sguardo a lungo... per ora.
        this.despawn();
        this.onFlee('fled');
        return;
      }
    } else {
      this.watchedTime = 0;
      this.onDrain(dt * 1.5); // la sua sola presenza pesa
    }

    // Movimento: si avvicina solo se non guardata (stadio 2+);
    // nell'inseguimento finale avanza sempre.
    const speed = chaseMode ? CHASE_SPEED : (APPROACH_SPEED_BY_STAGE[stage] ?? 0);
    if (speed > 0 && (chaseMode || !watched)) {
      const dir = new THREE.Vector3().subVectors(cam.position, mesh.position);
      dir.y = 0;
      dir.normalize();
      mesh.position.addScaledVector(dir, speed * dt);
      mesh.position.y = 1.1;
      // Resta dentro la stanza
      const maxX = this.room.floorSize.width / 2 - 0.4;
      const maxZ = this.room.floorSize.depth / 2 - 0.4;
      mesh.position.x = Math.max(-maxX, Math.min(maxX, mesh.position.x));
      mesh.position.z = Math.max(-maxZ, Math.min(maxZ, mesh.position.z));
    }

    // Battito cardiaco: più è vicina, più accelera
    this.heartbeatTimer -= dt;
    if (this.heartbeatTimer <= 0) {
      this.onHeartbeat(dist);
      this.heartbeatTimer = Math.max(0.45, Math.min(1.6, dist / 4));
    }

    // Contatto → assenza (o cattura durante l'inseguimento)
    if (dist < CONTACT_DISTANCE) {
      this.despawn();
      this.onCaught(chaseMode);
    }
  }
}
