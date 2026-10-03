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

function wipe(root) {
  while (root.children.length) root.remove(root.children[0]);
}

export class TrayGame {
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
    this.reset();
    this.world.camera.position.set(0, 5.4, 5.2);
    this.world.look.set(0, 0.3, 0);
    return this.hud();
  }

  reset() {
    wipe(this.root);
    this.board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.4), mat(0x6b3a1f));
    this.board.position.y = 0.42;
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mat(0xffc857, { emissive: 0x553300 }));
    this.ball.position.set(0, 0.62, 0);
    this.root.add(this.board, this.ball);
    this.world.pickables = [this.board];
    this.vx = 0;
    this.held = 0;
  }

  hud() {
    return playHud(this.players[this.index], "左右タップで盆を保て。落としたら負け");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.vx += (p.gx ?? 0) < 0 ? -1.8 : 1.8;
    this.bus.tick();
  }

  update(dt) {
    if (!this.alive) return null;
    this.vx += (Math.random() - 0.5) * 3.2 * dt;
    this.vx *= 0.985;
    this.ball.position.x += this.vx * dt;
    this.board.rotation.z = -this.vx * 0.08;
    this.held += dt;
    if (Math.abs(this.ball.position.x) > 1.15) {
      this.alive = false;
      this.bus.boom();
      this.world.shake = 0.28;
      return lose(this.players[this.index], `${this.players[this.index]} が盆を落とした`, "金の玉が卓へ落ちた。");
    }
    if (this.held >= 3.4) {
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.reset();
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

export class CountGame {
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
    this.world.camera.position.set(0, 6.4, 4.2);
    this.world.look.set(0, 0.3, 0);
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.want = 1 + Math.floor(Math.random() * 5);
    this.pads = [];
    for (let i = 0; i < this.want; i++) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat(0xffc857, { emissive: 0x553300 }));
      lamp.position.set((i - (this.want - 1) / 2) * 0.55, 1.15, 0);
      this.root.add(lamp);
    }
    for (let n = 1; n <= 5; n++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.46), mat(0x3a2048));
      p.position.set((n - 3) * 0.58, 0.42, 1.15);
      p.userData.pick = "count-live";
      p.userData.n = n;
      this.root.add(p);
      this.pads.push(p);
    }
    this.world.pickables = this.pads;
    this.phase = "show";
    this.wait = 1.15;
    this.choice = null;
  }

  hud() {
    const t = this.phase === "show" ? "提灯の数を覚えろ" : "数をタップ";
    return playHud(this.players[this.index], t);
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || this.phase !== "pick" || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.n) this.choice = hit.userData.n;
  }

  update(dt) {
    if (!this.alive) return null;
    if (this.phase === "show") {
      this.wait -= dt;
      if (this.wait <= 0) {
        this.phase = "pick";
        this.root.children.forEach((c) => {
          if (!c.userData.n) c.visible = false;
        });
        return { hud: this.hud() };
      }
      return null;
    }
    if (this.choice == null) return null;
    const n = this.choice;
    this.choice = null;
    if (n === this.want) {
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.deal();
      return { hud: this.hud() };
    }
    this.alive = false;
    this.bus.boom();
    this.world.shake = 0.22;
    return lose(this.players[this.index], `${this.players[this.index]} が数を外した`, `${this.want} 個だった。`);
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class OddGame {
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
    this.world.camera.position.set(0, 6.6, 3.8);
    this.world.look.set(0, 0.3, 0);
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    const cols = [0xff5d8f, 0x66e0ff, 0xffc857, 0x3ecf8e];
    const base = cols[Math.floor(Math.random() * cols.length)];
    let odd = cols[Math.floor(Math.random() * cols.length)];
    if (odd === base) odd = cols[(cols.indexOf(base) + 1) % cols.length];
    this.odd = Math.floor(Math.random() * 6);
    this.orbs = [];
    for (let i = 0; i < 6; i++) {
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), mat(i === this.odd ? odd : base));
      const a = (i / 6) * Math.PI * 2;
      o.position.set(Math.cos(a) * 1.35, 0.5, Math.sin(a) * 1.35);
      o.userData.pick = "odd-live";
      o.userData.i = i;
      this.root.add(o);
      this.orbs.push(o);
    }
    this.world.pickables = this.orbs;
    this.choice = null;
  }

  hud() {
    return playHud(this.players[this.index], "色の違う一つを選べ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i != null) this.choice = hit.userData.i;
  }

  update() {
    if (!this.alive || this.choice == null) return null;
    const i = this.choice;
    this.choice = null;
    if (i === this.odd) {
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.deal();
      return { hud: this.hud() };
    }
    this.alive = false;
    this.bus.boom();
    this.world.shake = 0.22;
    return lose(this.players[this.index], `${this.players[this.index]} が仲間を外した`, "同じ色を選んでしまった。");
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class MelonGame {
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
    this.spd = 2.4;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    wipe(this.root);
    this.melon = new THREE.Mesh(new THREE.SphereGeometry(0.7, 18, 14), mat(0x3ecf8e));
    this.melon.position.y = 0.85;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), mat(0xffc857, { emissive: 0x553300 }));
    stripe.position.y = 0.85;
    this.stripe = stripe;
    this.root.add(this.melon, stripe);
    this.world.pickables = [this.melon];
    this.world.camera.position.set(0, 3.6, 5.4);
    this.world.look.set(0, 0.7, 0);
    return this.hud();
  }

  hud() {
    return playHud(this.players[this.index], "金の筋が正面を向いたら切れ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.cut = true;
  }

  update(dt) {
    if (!this.alive) return null;
    this.ang += this.spd * dt;
    this.melon.rotation.y = this.ang;
    this.stripe.position.set(Math.sin(this.ang) * 0.7, 0.85, Math.cos(this.ang) * 0.7);
    if (!this.cut) return null;
    this.cut = false;
    const front = Math.cos(this.ang) > 0.72;
    if (front) {
      this.bus.whoosh();
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.spd += 0.35;
      return { hud: this.hud() };
    }
    this.alive = false;
    this.bus.boom();
    this.world.shake = 0.3;
    return lose(this.players[this.index], `${this.players[this.index]} が筋を外した`, "西瓜はまだ回っていた。");
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class DangoGame {
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
    this.world.camera.position.set(0, 5.8, 5.6);
    this.world.look.set(0, 0.8, 0);
    this.reset();
    return this.hud();
  }

  reset() {
    wipe(this.root);
    this.falls = [];
    this.got = 0;
    this.spawnIn = 0.2;
    this.need = 3;
    this.world.pickables = this.falls;
  }

  hud() {
    return playHud(this.players[this.index], "落ちる団子をタップ。地面に着いたら負け");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (!hit || hit.userData.kind !== "dango") return;
    this.root.remove(hit);
    this.falls = this.falls.filter((f) => f !== hit);
    this.world.pickables = this.falls;
    this.got += 1;
    this.bus.tick();
  }

  update(dt) {
    if (!this.alive) return null;
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.got + this.falls.length < this.need) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat(0xff9ab8));
      d.position.set((Math.random() - 0.5) * 2.2, 2.8, 0);
      d.userData.pick = "dango-live";
      d.userData.kind = "dango";
      this.root.add(d);
      this.falls.push(d);
      this.world.pickables = this.falls;
      this.spawnIn = 0.55;
    }
    for (const d of this.falls) {
      d.position.y -= 1.7 * dt;
      if (d.position.y < 0.28) {
        this.alive = false;
        this.bus.boom();
        this.world.shake = 0.22;
        return lose(this.players[this.index], `${this.players[this.index]} が団子を落とした`, "卓に着いてしまった。");
      }
    }
    if (this.got >= this.need) {
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.reset();
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

export class PathGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.len = 3;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.world.camera.position.set(0, 6.8, 4);
    this.world.look.set(0, 0.3, 0);
    this.build();
    return this.hud();
  }

  build() {
    wipe(this.root);
    this.stones = [];
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.16, 12), mat(0x3a2048));
      s.position.set((i - 1.5) * 0.95, 0.4, 0);
      s.userData.pick = "path-live";
      s.userData.i = i;
      this.root.add(s);
      this.stones.push(s);
    }
    this.world.pickables = this.stones;
    this.seq = Array.from({ length: this.len }, () => Math.floor(Math.random() * 4));
    this.phase = "show";
    this.showI = 0;
    this.wait = 0.45;
    this.step = 0;
    this.choice = null;
  }

  hud() {
    const t = this.phase === "show" ? "光る石の順を覚えろ" : "同じ順に踏め";
    return playHud(this.players[this.index], t);
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || this.phase !== "pick" || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i != null) this.choice = hit.userData.i;
  }

  update(dt) {
    if (!this.alive) return null;
    if (this.phase === "show") {
      this.wait -= dt;
      this.stones.forEach((s, i) => s.material.emissive.setHex(i === this.seq[this.showI] && this.wait > 0.12 ? 0xffc857 : 0x000000));
      if (this.wait <= 0) {
        this.showI += 1;
        if (this.showI >= this.seq.length) {
          this.phase = "pick";
          this.stones.forEach((s) => s.material.emissive.setHex(0x000000));
          return { hud: this.hud() };
        }
        this.wait = 0.42;
      }
      return null;
    }
    if (this.choice == null) return null;
    const n = this.choice;
    this.choice = null;
    if (n !== this.seq[this.step]) {
      this.alive = false;
      this.bus.boom();
      this.world.shake = 0.22;
      return lose(this.players[this.index], `${this.players[this.index]} が渡りを外した`, "石の順が違った。");
    }
    this.bus.tick();
    this.step += 1;
    if (this.step >= this.seq.length) {
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.len = Math.min(6, this.len + 1);
      this.build();
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

export class FreezeGame {
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
    this.world.camera.position.set(0, 7, 3.4);
    this.world.look.set(0, 0.3, 0);
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.fish = [];
    this.still = Math.floor(Math.random() * 6);
    for (let i = 0; i < 6; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), mat(0x66e0ff, { emissive: 0x113344 }));
      const a = (i / 6) * Math.PI * 2;
      f.userData.a = a;
      f.userData.i = i;
      f.userData.pick = "freeze-live";
      f.position.set(Math.cos(a) * 1.4, 0.5, Math.sin(a) * 1.4);
      this.root.add(f);
      this.fish.push(f);
    }
    this.world.pickables = this.fish;
    this.choice = null;
    this.left = 2.4;
  }

  hud() {
    return playHud(this.players[this.index], "止まっている一つを選べ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i != null) this.choice = hit.userData.i;
  }

  update(dt) {
    if (!this.alive) return null;
    for (const f of this.fish) {
      if (f.userData.i === this.still) continue;
      f.userData.a += 1.6 * dt;
      f.position.set(Math.cos(f.userData.a) * 1.4, 0.5, Math.sin(f.userData.a) * 1.4);
    }
    this.left -= dt;
    if (this.choice != null) {
      const i = this.choice;
      this.choice = null;
      if (i === this.still) {
        this.bus.chime();
        this.index = (this.index + 1) % this.players.length;
        this.deal();
        return { hud: this.hud() };
      }
      this.alive = false;
      this.bus.boom();
      return lose(this.players[this.index], `${this.players[this.index]} が動く方を選んだ`, "止まっていたのは別の金魚。");
    }
    if (this.left <= 0) {
      this.alive = false;
      this.bus.boom();
      return lose(this.players[this.index], `${this.players[this.index]} が迷いすぎた`, "止まっている金魚を見逃した。");
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

export class OrderGame {
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
    this.world.camera.position.set(0, 6.6, 4.2);
    this.world.look.set(0, 0.3, 0);
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    const cols = [0xff5d8f, 0x66e0ff, 0xffc857, 0x3ecf8e];
    const slots = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    this.tiles = [];
    for (let n = 1; n <= 4; n++) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.7), mat(cols[n - 1]));
      const i = slots[n - 1];
      t.position.set((i % 2) * 1.1 - 0.55, 0.42, Math.floor(i / 2) * 1.1 - 0.55);
      t.userData.pick = "order-live";
      t.userData.n = n;
      const mark = new THREE.Mesh(new THREE.SphereGeometry(0.08 + n * 0.03, 8, 8), mat(0xfff4e4));
      mark.position.y = 0.2;
      t.add(mark);
      this.root.add(t);
      this.tiles.push(t);
    }
    this.world.pickables = this.tiles;
    this.expect = 1;
    this.choice = null;
  }

  hud() {
    return playHud(this.players[this.index], `小さい印から順に ${this.expect}`);
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.n) this.choice = hit.userData.n;
  }

  update() {
    if (!this.alive || this.choice == null) return null;
    const n = this.choice;
    this.choice = null;
    if (n !== this.expect) {
      this.alive = false;
      this.bus.boom();
      return lose(this.players[this.index], `${this.players[this.index]} が順を外した`, "小さい印から押す。");
    }
    this.bus.tick();
    this.expect += 1;
    if (this.expect > 4) {
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.deal();
      return { hud: this.hud() };
    }
    return { hud: this.hud() };
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}
