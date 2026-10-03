import * as THREE from "three";
import { dare } from "./games.js";

function mat(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.45,
    metalness: 0.18,
    ...extras,
  });
}

function lose(name, title, lead) {
  return { end: true, loser: name, title, lead, dare: dare() };
}

function playHud(who, prompt) {
  return { who, prompt, action: "操作", canvasPlay: true };
}

export class MoleGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.hits = 0;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.holes = [];
    for (let i = 0; i < 6; i++) {
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.16, 14), mat(0x3a2048));
      const a = (i / 6) * Math.PI * 2;
      h.position.set(Math.cos(a) * 1.35, 0.38, Math.sin(a) * 1.35);
      h.userData.pick = "mole-live";
      h.userData.i = i;
      this.root.add(h);
      this.holes.push(h);
    }
    this.world.pickables = this.holes;
    this.world.camera.position.set(0, 6.6, 4.2);
    this.world.look.set(0, 0.3, 0);
    this.pop();
    return this.hud();
  }

  pop() {
    this.lit = Math.floor(Math.random() * 6);
    this.left = 1.05;
    this.holes.forEach((h, i) => h.material.emissive.setHex(i === this.lit ? 0xffc857 : 0x000000));
  }

  hud() {
    return playHud(this.players[this.index], "光った穴を叩け");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i == null) return;
    this.choice = hit.userData.i;
  }

  update(dt) {
    if (!this.alive) return null;
    this.left -= dt;
    if (this.choice != null) {
      const ok = this.choice === this.lit;
      this.choice = null;
      if (!ok) {
        this.alive = false;
        this.bus.boom();
        this.world.shake = 0.25;
        this.world.look.set(0, 0.35, 0);
        return lose(this.players[this.index], `${this.players[this.index]} が空振り`, "違う穴だった。");
      }
      this.hits += 1;
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.pop();
      return { hud: this.hud() };
    }
    if (this.left <= 0) {
      this.alive = false;
      this.bus.boom();
      this.world.look.set(0, 0.35, 0);
      return lose(this.players[this.index], `${this.players[this.index]} が遅れた`, "もぐらに逃げられた。");
    }
    return null;
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class BalloonGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.size = 0.7;
    this.limit = 1.35 + Math.random() * 0.55;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.ball = this.world.makeBalloon();
    this.ball.position.y = 0.9;
    this.root.add(this.ball);
    this.world.pickables = [this.ball];
    this.world.camera.position.set(0, 4.4, 5.2);
    return this.hud();
  }

  hud() {
    return playHud(this.players[this.index], "1回タップで膨らませて次へ。割ったら負け");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.size += 0.16;
    this.bus.tick();
    if (this.size >= this.limit) this.burst = true;
    else {
      this.index = (this.index + 1) % this.players.length;
      this.needHud = true;
    }
  }

  update() {
    if (!this.alive) return null;
    this.ball.scale.setScalar(this.size);
    if (this.burst) {
      this.alive = false;
      this.world.shake = 0.4;
      this.bus.boom();
      return lose(this.players[this.index], `${this.players[this.index]} が風船を割った`, "パン、と弾けた。");
    }
    if (this.needHud) {
      this.needHud = false;
      return { hud: this.hud() };
    }
    return null;
  }

  exit() {
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class StopGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.ang = 0;
    this.spd = 7;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    const dial = new THREE.Mesh(new THREE.CircleGeometry(1.1, 32), mat(0x2a1238));
    dial.rotation.x = -Math.PI / 2;
    dial.position.y = 0.32;
    const gold = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.05, 24, 1, -0.28, 0.56), mat(0xffc857, { emissive: 0x553300 }));
    gold.rotation.x = -Math.PI / 2;
    gold.position.y = 0.34;
    this.needle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.05), mat(0xfff4e4));
    this.needle.position.set(0, 0.42, 0.4);
    this.root.add(dial, gold, this.needle);
    this.world.pickables = [this.needle];
    this.world.camera.position.set(0, 7.4, 0.2);
    this.world.look.set(0, 0.2, 0);
    return this.hud();
  }

  hud() {
    return playHud(this.players[this.index], "金の帯で止めろ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.stopped = true;
  }

  update(dt) {
    if (!this.alive) return null;
    this.ang += this.spd * dt;
    this.needle.rotation.y = this.ang;
    if (!this.stopped) return null;
    this.stopped = false;
    const a = ((this.ang + Math.PI * 8) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const ok = a < 0.28 || a > Math.PI * 2 - 0.28;
    if (ok) {
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.spd = 6 + Math.random() * 4;
      return { hud: this.hud() };
    }
    this.alive = false;
    this.bus.boom();
    this.world.shake = 0.22;
    this.world.look.set(0, 0.35, 0);
    return lose(this.players[this.index], `${this.players[this.index]} が外した`, "針が金を外した。");
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class ColorGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.deal();
    this.world.camera.position.set(0, 6.8, 3.6);
    this.world.look.set(0, 0.3, 0);
    return this.hud();
  }

  deal() {
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    const cols = [0xff5d8f, 0x66e0ff, 0xffc857, 0x3ecf8e, 0xfff4e4];
    this.want = cols[Math.floor(Math.random() * cols.length)];
    this.orbs = [];
    const slot = Math.floor(Math.random() * 8);
    for (let i = 0; i < 8; i++) {
      const c = i === slot ? this.want : cols[Math.floor(Math.random() * cols.length)];
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat(c));
      const a = (i / 8) * Math.PI * 2;
      o.position.set(Math.cos(a) * 1.5, 0.5, Math.sin(a) * 1.5);
      o.userData.pick = "color-live";
      o.userData.col = c;
      this.root.add(o);
      this.orbs.push(o);
    }
    const sample = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat(this.want, { emissive: this.want, emissiveIntensity: 0.4 }));
    sample.position.set(0, 0.55, 0);
    this.root.add(sample);
    this.world.pickables = this.orbs;
  }

  hud() {
    return playHud(this.players[this.index], "中央と同じ色を選べ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.col != null) this.choice = hit.userData.col;
  }

  update() {
    if (!this.alive || this.choice == null) return null;
    const c = this.choice;
    this.choice = null;
    if (c === this.want) {
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.deal();
      return { hud: this.hud() };
    }
    this.alive = false;
    this.bus.boom();
    this.world.shake = 0.22;
    this.world.look.set(0, 0.35, 0);
    return lose(this.players[this.index], `${this.players[this.index]} が色を外した`, "違う色だった。");
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class SimonGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.seq = [Math.floor(Math.random() * 4)];
    this.step = 0;
    this.phase = "show";
    this.wait = 0.4;
    this.showI = 0;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    const cols = [0xff5d8f, 0x66e0ff, 0xffc857, 0x3ecf8e];
    this.pads = cols.map((c, i) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.9), mat(c));
      p.position.set((i % 2) * 1.15 - 0.55, 0.4, Math.floor(i / 2) * 1.15 - 0.55);
      p.userData.pick = "simon-live";
      p.userData.i = i;
      p.userData.col = c;
      this.root.add(p);
      return p;
    });
    this.world.pickables = this.pads;
    this.world.camera.position.set(0, 6.8, 4);
    this.world.look.set(0, 0.2, 0);
    return this.hud();
  }

  hud() {
    return playHud(this.players[this.index], this.phase === "show" ? "光を覚えろ" : "同じ順にタップ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || this.phase !== "play" || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i == null) return;
    this.choice = hit.userData.i;
  }

  update(dt) {
    if (!this.alive) return null;
    this.wait -= dt;
    this.pads.forEach((p) => p.material.emissive.setHex(0x000000));
    if (this.phase === "show") {
      if (this.wait > 0.15 && this.showI < this.seq.length) {
        const p = this.pads[this.seq[this.showI]];
        p.material.emissive.setHex(0xffffff);
      }
      if (this.wait <= 0) {
        this.showI += 1;
        this.wait = 0.45;
        this.bus.tick();
        if (this.showI >= this.seq.length) {
          this.phase = "play";
          this.step = 0;
          return { hud: this.hud() };
        }
      }
      return null;
    }
    if (this.choice == null) return null;
    const n = this.choice;
    this.choice = null;
    if (n !== this.seq[this.step]) {
      this.alive = false;
      this.bus.boom();
      this.world.shake = 0.25;
      this.world.look.set(0, 0.35, 0);
      return lose(this.players[this.index], `${this.players[this.index]} が順番を外した`, "真似が崩れた。");
    }
    this.bus.chime();
    this.step += 1;
    if (this.step >= this.seq.length) {
      this.seq.push(Math.floor(Math.random() * 4));
      this.index = (this.index + 1) % this.players.length;
      this.phase = "show";
      this.showI = 0;
      this.wait = 0.5;
      return { hud: this.hud() };
    }
    return null;
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class BowlGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.resetLane();
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.world.camera.position.set(0, 3.8, 6.4);
    this.world.look.set(0, 0.4, -2);
    return this.hud();
  }

  resetLane() {
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat(0xfff4e4));
    this.ball.position.set(0, 0.42, 1.6);
    this.pins = [];
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.5, 8), mat(0xfff4e4));
      const row = Math.floor(i / 3);
      const col = i % 3;
      p.position.set((col - 1) * 0.38, 0.45, -1.6 - row * 0.4);
      p.userData.up = true;
      this.root.add(p);
      this.pins.push(p);
    }
    this.root.add(this.ball);
    this.world.pickables = [this.ball];
    this.flying = false;
    this.drag = null;
    this.vel = new THREE.Vector3();
  }

  hud() {
    return playHud(this.players[this.index], "引っ張って離せ。ピンを倒せ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || this.flying) return;
    if (p.type === "down") this.drag = { z: p.gz ?? 1.4, x: p.gx ?? 0 };
    if (p.type === "up" && this.drag) {
      this.vel.set((this.drag.x - (p.gx ?? 0)) * 2.5, 0, Math.min(-2.8, (this.drag.z - (p.gz ?? 0)) * 4));
      this.flying = true;
      this.drag = null;
      this.bus.whoosh();
    }
  }

  update(dt) {
    if (!this.alive) return null;
    if (!this.flying) return null;
    this.ball.position.addScaledVector(this.vel, dt);
    this.vel.x *= 0.99;
    let down = 0;
    for (const p of this.pins) {
      if (!p.userData.up) continue;
      if (p.position.distanceTo(this.ball.position) < 0.32) {
        p.userData.up = false;
        p.rotation.z = 1.2;
        p.position.y = 0.18;
        down += 1;
      }
    }
    if (this.ball.position.z < -3.2 || this.ball.position.y < 0.2) {
      if (this.pins.every((p) => p.userData.up)) {
        this.alive = false;
        this.bus.boom();
        this.world.look.set(0, 0.35, 0);
        return lose(this.players[this.index], `${this.players[this.index]} がガター`, "一本も倒れなかった。");
      }
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.resetLane();
      return { hud: this.hud() };
    }
    return null;
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class PeekGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.deal();
    this.world.camera.position.set(0, 5.4, 5);
    this.world.look.set(0, 0.4, 0);
    return this.hud();
  }

  deal() {
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.gold = Math.floor(Math.random() * 3);
    this.cups = [0, 1, 2].map((i) => {
      const c = this.world.makeCup();
      c.position.set((i - 1) * 1.1, 0.4, 0);
      c.userData.pick = "peek-live";
      c.userData.i = i;
      this.root.add(c);
      return c;
    });
    this.coin = this.world.makeCoin();
    this.coin.position.set((this.gold - 1) * 1.1, 0.32, 0);
    this.root.add(this.coin);
    this.world.pickables = this.cups;
    this.phase = "show";
    this.wait = 1.1;
    this.swaps = 0;
  }

  hud() {
    const t = this.phase === "show" ? "金の位置を覚えろ" : this.phase === "mix" ? "目で追え" : "金の盃を選べ";
    return playHud(this.players[this.index], t);
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || this.phase !== "pick" || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i == null) return;
    this.choice = hit.userData.i;
  }

  update(dt) {
    if (!this.alive) return null;
    this.wait -= dt;
    if (this.phase === "show" && this.wait <= 0) {
      this.coin.visible = false;
      this.phase = "mix";
      this.swaps = 0;
      this.wait = 0.35;
      return { hud: this.hud() };
    }
    if (this.phase === "mix" && this.wait <= 0) {
      const a = Math.floor(Math.random() * 3);
      let b = Math.floor(Math.random() * 3);
      if (b === a) b = (a + 1) % 3;
      const xa = this.cups[a].position.x;
      this.cups[a].position.x = this.cups[b].position.x;
      this.cups[b].position.x = xa;
      this.swaps += 1;
      this.wait = 0.32;
      this.bus.tick();
      if (this.swaps >= 6) {
        this.phase = "pick";
        return { hud: this.hud() };
      }
    }
    if (this.choice == null) return null;
    const n = this.choice;
    this.choice = null;
    this.coin.visible = true;
    this.coin.position.x = this.cups.find((c) => c.userData.i === this.gold)?.position.x ?? 0;
    if (n === this.gold) {
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.deal();
      return { hud: this.hud() };
    }
    this.alive = false;
    this.bus.boom();
    this.world.shake = 0.25;
    this.world.look.set(0, 0.35, 0);
    return lose(this.players[this.index], `${this.players[this.index]} が見失った`, "金は別の盃にいた。");
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}
