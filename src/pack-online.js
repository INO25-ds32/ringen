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

export class MoleRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 14);
    this.winWord = "もぐら一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.holes = [];
    for (let i = 0; i < 6; i++) {
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.14, 12), mat(0x3a2048));
      const a = (i / 6) * Math.PI * 2;
      h.position.set(Math.cos(a) * 1.3, 0.38, Math.sin(a) * 1.3);
      h.userData.pick = "mole-live";
      h.userData.i = i;
      this.root.add(h);
      this.holes.push(h);
    }
    this.world.pickables = this.holes;
    this.world.camera.position.set(0, 6.4, 4);
    this.world.look.set(0, 0.3, 0);
    this.pop();
    return this.hud();
  }

  pop() {
    this.lit = Math.floor(Math.random() * 6);
    this.leftPop = 0.85;
    this.holes.forEach((h, i) => h.material.emissive.setHex(i === this.lit ? 0xffc857 : 0x000000));
  }

  shareState() {
    return { duration: 14 };
  }

  hud() {
    return this.hudLine("光った穴を連打");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i === this.lit) {
      this.score += 1;
      this.bus.tick();
      this.pop();
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    this.leftPop -= dt;
    if (this.leftPop <= 0) this.pop();
    return this.time(dt, this.hud());
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class FlapGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "飛行一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.hero = this.world.makeShuttle();
    this.hero.position.set(-1.2, 1.4, 0);
    this.vy = 0;
    this.z = 0;
    this.gates = [];
    for (let i = 0; i < 16; i++) {
      const gap = 0.7 + Math.random() * 0.8;
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.2, 0.35), mat(0xff5d8f));
      const bot = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.2, 0.35), mat(0x66e0ff));
      top.position.set(1.6 + i * 2.4, gap + 1.4, 0);
      bot.position.set(1.6 + i * 2.4, gap - 1.6, 0);
      top.userData.gap = gap;
      this.root.add(top, bot);
      this.gates.push({ top, bot, scored: false, x: 1.6 + i * 2.4 });
    }
    this.root.add(this.hero);
    this.world.pickables = [this.hero];
    this.world.camera.position.set(0, 2.4, 6);
    this.world.look.set(0, 1.2, 0);
    return this.hud();
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("タップで羽ばたけ。柱をくぐれ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.vy = 3.6;
    this.bus.whoosh();
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.alive) {
      this.vy -= 9 * dt;
      this.hero.position.y += this.vy * dt;
      this.z += 3.8 * dt;
      this.hero.rotation.z = this.vy * 0.08;
      for (const g of this.gates) {
        g.top.position.x = g.x - this.z;
        g.bot.position.x = g.x - this.z;
        const hx = this.hero.position.x;
        const hy = this.hero.position.y;
        if (Math.abs(g.top.position.x - hx) < 0.28) {
          if (hy > g.top.position.y - 1.15 || hy < g.bot.position.y + 1.15) {
            this.alive = false;
            this.submitted = true;
            this.bus.boom();
            return { submitScore: this.score };
          }
          if (!g.scored) {
            g.scored = true;
            this.score += 1;
            this.bus.tick();
          }
        }
      }
      if (this.hero.position.y < 0.25 || this.hero.position.y > 2.8) {
        this.alive = false;
        this.submitted = true;
        this.bus.boom();
        return { submitScore: this.score };
      }
      this.world.camera.position.set(this.hero.position.x + 1.2, 2.4, 6);
      this.world.look.set(this.hero.position.x + 1.4, 1.2, 0);
    }
    return this.time(dt, this.hud());
  }

  exit() {
    this.world.camera.position.copy(this.world.homeCam);
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class SortGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "仕分け一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    const L = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), mat(0xff5d8f));
    const R = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), mat(0x66e0ff));
    L.position.set(-1.4, 0.3, 0);
    R.position.set(1.4, 0.3, 0);
    this.root.add(L, R);
    this.item = null;
    this.spawnIn = 0.1;
    this.world.pickables = [];
    this.world.camera.position.set(0, 5.6, 5.2);
    this.world.look.set(0, 0.4, 0);
    this.last = null;
    return this.hud();
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("赤は左、青は右へスワイプ");
  }

  canAct() {
    return false;
  }

  spawn() {
    const red = Math.random() < 0.5;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat(red ? 0xff5d8f : 0x66e0ff));
    m.position.set(0, 1.2, 0);
    m.userData.red = red;
    this.root.add(m);
    this.item = m;
  }

  pointer(p) {
    if (!this.alive || !this.item) return;
    if (p.type === "down") this.last = { x: p.x };
    if (p.type === "up" && this.last) {
      const dx = p.x - this.last.x;
      this.last = null;
      if (Math.abs(dx) < 24) return;
      const left = dx < 0;
      const ok = left === this.item.userData.red;
      this.root.remove(this.item);
      this.item = null;
      if (ok) {
        this.score += 1;
        this.bus.chime();
      } else this.bus.boom();
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    this.spawnIn -= dt;
    if (!this.item && this.spawnIn <= 0 && this.alive) {
      this.spawn();
      this.spawnIn = 0.2;
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

export class StopRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 12);
    this.winWord = "針止め一番";
    this.ang = 0;
    this.best = 0;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    const dial = new THREE.Mesh(new THREE.CircleGeometry(1.1, 28), mat(0x2a1238));
    dial.rotation.x = -Math.PI / 2;
    dial.position.y = 0.32;
    this.needle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.05), mat(0xfff4e4));
    this.needle.position.set(0, 0.42, 0.4);
    this.root.add(dial, this.needle);
    this.world.pickables = [this.needle];
    this.world.camera.position.set(0, 7.2, 0.3);
    this.world.look.set(0, 0.2, 0);
    this.cool = 0;
    return this.hud();
  }

  shareState() {
    return { duration: 12 };
  }

  hud() {
    return this.hudLine("金に近いところでタップ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down" || this.cool > 0) return;
    const a = ((this.ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const dist = Math.min(a, Math.PI * 2 - a);
    const pts = Math.max(0, Math.round((1 - dist / 1.2) * 20));
    this.score += pts;
    this.cool = 0.35;
    this.bus.chime();
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    this.ang += 8 * dt;
    this.needle.rotation.y = this.ang;
    this.cool = Math.max(0, this.cool - dt);
    return this.time(dt, this.hud());
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class PeekRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "眼力一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.round();
    this.world.camera.position.set(0, 5.2, 5);
    this.world.look.set(0, 0.4, 0);
    return this.hud();
  }

  round() {
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
    this.world.pickables = this.cups;
    this.phase = "mix";
    this.swaps = 0;
    this.wait = 0.2;
    this.busy = false;
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("混ぜたあと、金の盃を選べ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || this.phase !== "pick" || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i == null) return;
    if (hit.userData.i === this.gold) {
      this.score += 1;
      this.bus.chime();
    } else this.bus.boom();
    this.round();
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.phase === "mix") {
      this.wait -= dt;
      if (this.wait <= 0 && this.swaps < 5) {
        const a = Math.floor(Math.random() * 3);
        const b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
        const xa = this.cups[a].position.x;
        this.cups[a].position.x = this.cups[b].position.x;
        this.cups[b].position.x = xa;
        this.swaps += 1;
        this.wait = 0.28;
      } else if (this.swaps >= 5) this.phase = "pick";
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
