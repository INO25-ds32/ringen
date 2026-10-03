import * as THREE from "three";
import { Race } from "./online-games.js";

function mat(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.2,
    ...extras,
  });
}

function wipe(root) {
  while (root.children.length) root.remove(root.children[0]);
}

export class TrayRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 14);
    this.winWord = "盆一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    wipe(this.root);
    this.board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.4), mat(0x6b3a1f));
    this.board.position.y = 0.42;
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mat(0xffc857, { emissive: 0x553300 }));
    this.ball.position.set(0, 0.62, 0);
    this.root.add(this.board, this.ball);
    this.world.pickables = [this.board];
    this.vx = 0;
    this.acc = 0;
    this.world.camera.position.set(0, 5.4, 5.2);
    this.world.look.set(0, 0.3, 0);
    return this.hud();
  }

  shareState() {
    return { duration: 14 };
  }

  hud() {
    return this.hudLine("左右タップで盆を保て");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.vx += (p.gx ?? 0) < 0 ? -1.8 : 1.8;
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.alive) {
      this.vx += (Math.random() - 0.5) * 3.4 * dt;
      this.vx *= 0.985;
      this.ball.position.x += this.vx * dt;
      this.board.rotation.z = -this.vx * 0.08;
      this.acc += dt;
      if (this.acc > 0.5) {
        this.acc = 0;
        this.score += 1;
      }
      if (Math.abs(this.ball.position.x) > 1.15) {
        this.alive = false;
        this.submitted = true;
        this.bus.boom();
        return { submitScore: this.score };
      }
    }
    return this.time(dt, this.hud());
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class CountRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "数一番";
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
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(0xffc857, { emissive: 0x553300 }));
      lamp.position.set((i - (this.want - 1) / 2) * 0.5, 1.1, 0);
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
    this.show = 0.55;
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("提灯の数をタップ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || this.show > 0 || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (!hit?.userData.n) return;
    if (hit.userData.n === this.want) {
      this.score += 1;
      this.bus.chime();
    } else this.bus.boom();
    this.deal();
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.show > 0) {
      this.show -= dt;
      if (this.show <= 0) {
        this.root.children.forEach((c) => {
          if (!c.userData.n) c.visible = false;
        });
      }
    }
    return this.time(dt, this.hud());
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class OddRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "仲間一番";
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
    let odd = cols[(cols.indexOf(base) + 1) % cols.length];
    this.odd = Math.floor(Math.random() * 6);
    this.orbs = [];
    for (let i = 0; i < 6; i++) {
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat(i === this.odd ? odd : base));
      const a = (i / 6) * Math.PI * 2;
      o.position.set(Math.cos(a) * 1.35, 0.5, Math.sin(a) * 1.35);
      o.userData.pick = "odd-live";
      o.userData.i = i;
      this.root.add(o);
      this.orbs.push(o);
    }
    this.world.pickables = this.orbs;
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("違う色を選べ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i == null) return;
    if (hit.userData.i === this.odd) {
      this.score += 1;
      this.bus.chime();
    } else this.bus.boom();
    this.deal();
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    return this.time(dt, this.hud());
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class DangoRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "団子一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    wipe(this.root);
    this.falls = [];
    this.spawnIn = 0.15;
    this.world.pickables = this.falls;
    this.world.camera.position.set(0, 5.8, 5.6);
    this.world.look.set(0, 0.8, 0);
    return this.hud();
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("落ちる団子をタップ");
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
    this.score += 1;
    this.bus.tick();
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.alive) {
      this.spawnIn -= dt;
      if (this.spawnIn <= 0) {
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(0xff9ab8));
        d.position.set((Math.random() - 0.5) * 2.2, 2.8, 0);
        d.userData.pick = "dango-live";
        d.userData.kind = "dango";
        this.root.add(d);
        this.falls.push(d);
        this.world.pickables = this.falls;
        this.spawnIn = 0.48;
      }
      const keep = [];
      for (const d of this.falls) {
        d.position.y -= 1.85 * dt;
        if (d.position.y < 0.28) this.root.remove(d);
        else keep.push(d);
      }
      this.falls = keep;
      this.world.pickables = this.falls;
    }
    return this.time(dt, this.hud());
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class PathRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 18);
    this.winWord = "渡り一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.world.camera.position.set(0, 6.8, 4);
    this.world.look.set(0, 0.3, 0);
    this.len = 3;
    this.build();
    return this.hud();
  }

  build() {
    wipe(this.root);
    this.stones = [];
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.16, 12), mat(0x3a2048));
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
    this.wait = 0.38;
    this.step = 0;
  }

  shareState() {
    return { duration: 18 };
  }

  hud() {
    return this.hudLine(this.phase === "show" ? "順を覚えろ" : "同じ順に踏め");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || this.phase !== "pick" || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i == null) return;
    if (hit.userData.i === this.seq[this.step]) {
      this.step += 1;
      this.bus.tick();
      if (this.step >= this.seq.length) {
        this.score += this.len;
        this.bus.chime();
        this.len = Math.min(6, this.len + 1);
        this.build();
      }
    } else {
      this.bus.boom();
      this.build();
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.alive && this.phase === "show") {
      this.wait -= dt;
      this.stones.forEach((s, i) => s.material.emissive.setHex(i === this.seq[this.showI] && this.wait > 0.1 ? 0xffc857 : 0x000000));
      if (this.wait <= 0) {
        this.showI += 1;
        if (this.showI >= this.seq.length) {
          this.phase = "pick";
          this.stones.forEach((s) => s.material.emissive.setHex(0x000000));
        } else this.wait = 0.36;
      }
    }
    return this.time(dt, this.hud());
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class FreezeRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "静止一番";
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
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat(0x66e0ff, { emissive: 0x113344 }));
      f.userData.a = (i / 6) * Math.PI * 2;
      f.userData.i = i;
      f.userData.pick = "freeze-live";
      f.position.set(Math.cos(f.userData.a) * 1.4, 0.5, Math.sin(f.userData.a) * 1.4);
      this.root.add(f);
      this.fish.push(f);
    }
    this.world.pickables = this.fish;
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("止まっている金魚を選べ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i == null) return;
    if (hit.userData.i === this.still) {
      this.score += 1;
      this.bus.chime();
    } else this.bus.boom();
    this.deal();
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.alive) {
      for (const f of this.fish) {
        if (f.userData.i === this.still) continue;
        f.userData.a += 1.7 * dt;
        f.position.set(Math.cos(f.userData.a) * 1.4, 0.5, Math.sin(f.userData.a) * 1.4);
      }
    }
    return this.time(dt, this.hud());
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class OrderRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "順一番";
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
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("小さい印から順に");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (!hit?.userData.n) return;
    if (hit.userData.n === this.expect) {
      this.expect += 1;
      this.bus.tick();
      if (this.expect > 4) {
        this.score += 1;
        this.bus.chime();
        this.deal();
      }
    } else {
      this.bus.boom();
      this.deal();
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    return this.time(dt, this.hud());
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}
