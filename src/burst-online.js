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

export class PoleRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 14);
    this.winWord = "棒一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    wipe(this.root);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.16, 12), mat(0x3a2048));
    base.position.y = 0.28;
    this.pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.8, 10), mat(0xffc857));
    this.pole.position.y = 1.2;
    this.root.add(base, this.pole);
    this.world.pickables = [this.pole];
    this.ang = 0.04;
    this.vel = 0;
    this.acc = 0;
    this.world.camera.position.set(0, 3.8, 6.2);
    this.world.look.set(0, 1.1, 0);
    return this.hud();
  }

  shareState() {
    return { duration: 14 };
  }

  hud() {
    return this.hudLine("倒れる逆側をタップ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.vel += (p.gx ?? 0) < 0 ? 1.7 : -1.7;
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.alive) {
      this.vel += this.ang * 4.4 * dt;
      this.ang += this.vel * dt;
      this.pole.rotation.z = this.ang;
      this.acc += dt;
      if (this.acc > 0.45) {
        this.acc = 0;
        this.score += 1;
      }
      if (Math.abs(this.ang) > 0.72) {
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

export class HoldRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "長押し一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.reset();
    this.world.camera.position.set(0, 5.8, 4.8);
    this.world.look.set(0, 0.5, 0);
    return this.hud();
  }

  reset() {
    wipe(this.root);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.2, 0.28), mat(0x3a2048));
    rail.position.y = 1.2;
    const gold = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.34), mat(0xffc857, { emissive: 0x553300 }));
    gold.position.y = 1.55;
    this.bar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.22), mat(0xfff4e4));
    this.bar.position.y = 0.28;
    this.root.add(rail, gold, this.bar);
    this.world.pickables = [rail];
    this.press = false;
    this.h = 0;
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("金の帯で離せ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.type === "down") this.press = true;
    if (p.type === "up") {
      this.press = false;
      if (this.h > 1.12 && this.h < 1.55) {
        this.score += 1;
        this.bus.chime();
      } else this.bus.boom();
      this.h = 0;
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.alive && this.press) this.h = Math.min(2.1, this.h + dt * 1.4);
    if (this.bar) this.bar.position.y = 0.28 + this.h;
    if (this.h >= 2.05) {
      this.h = 0;
      this.press = false;
      this.bus.boom();
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

export class BigRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 14);
    this.winWord = "大きさ一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.world.camera.position.set(0, 5.4, 5.2);
    this.world.look.set(0, 0.5, 0);
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    const leftBig = Math.random() < 0.5;
    const sizes = leftBig ? [0.55, 0.32] : [0.32, 0.55];
    this.orbs = [];
    for (let i = 0; i < 2; i++) {
      const o = new THREE.Mesh(new THREE.SphereGeometry(sizes[i], 14, 12), mat(i ? 0x66e0ff : 0xff5d8f));
      o.position.set(i ? 0.95 : -0.95, 0.7, 0);
      o.userData.pick = "big-live";
      o.userData.big = sizes[i] > 0.4;
      this.root.add(o);
      this.orbs.push(o);
    }
    this.world.pickables = this.orbs;
  }

  shareState() {
    return { duration: 14 };
  }

  hud() {
    return this.hudLine("大きい方を選べ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (!hit || hit.userData.big == null) return;
    if (hit.userData.big) {
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

export class WindRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "風一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.deal();
    this.world.camera.position.set(0, 4.6, 5.4);
    this.world.look.set(0, 0.8, 0);
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.dirs = ["left", "right", "up", "down"];
    this.want = this.dirs[Math.floor(Math.random() * 4)];
    const ang = { left: Math.PI / 2, right: -Math.PI / 2, up: 0, down: Math.PI }[this.want];
    this.arrow = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.1, 10), mat(0xffc857, { emissive: 0x553300 }));
    this.arrow.position.y = 0.95;
    this.arrow.rotation.z = ang;
    this.root.add(this.arrow);
    this.world.pickables = [this.arrow];
    this.start = null;
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("矢印の向きにスワイプ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.type === "down") this.start = { x: p.x, y: p.y };
    if (p.type === "up" && this.start) {
      const dx = p.x - this.start.x;
      const dy = p.y - this.start.y;
      this.start = null;
      if (Math.abs(dx) < 28 && Math.abs(dy) < 28) return;
      const got = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down";
      if (got === this.want) {
        this.score += 1;
        this.bus.chime();
      } else this.bus.boom();
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

export class EchoRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 18);
    this.winWord = "こだま一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.deal();
    this.world.camera.position.set(0, 4.8, 5.4);
    this.world.look.set(0, 0.7, 0);
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.want = 2 + Math.floor(Math.random() * 4);
    this.drum = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.22, 20), mat(0xb42318));
    this.drum.position.y = 0.45;
    this.root.add(this.drum);
    this.world.pickables = [this.drum];
    this.phase = "show";
    this.shown = 0;
    this.wait = 0.28;
    this.taps = 0;
    this.window = 0;
  }

  shareState() {
    return { duration: 18 };
  }

  hud() {
    return this.hudLine(this.phase === "show" ? "回数を聞け" : "同じ回数");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || this.phase !== "tap" || p.type !== "down") return;
    this.taps += 1;
    this.bus.tick();
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.alive && this.phase === "show") {
      this.wait -= dt;
      if (this.wait <= 0) {
        if (this.shown < this.want) {
          this.bus.tick();
          this.shown += 1;
          this.wait = 0.28;
        } else {
          this.phase = "tap";
          this.window = 1.6;
        }
      }
    } else if (this.alive && this.phase === "tap") {
      this.window -= dt;
      if (this.window <= 0) {
        if (this.taps === this.want) {
          this.score += 1;
          this.bus.chime();
        } else this.bus.boom();
        this.deal();
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

export class HoleRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "穴一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.reset();
    this.world.camera.position.set(0, 6.4, 5.2);
    this.world.look.set(0, 0.2, 0);
    return this.hud();
  }

  reset() {
    wipe(this.root);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1.8, 24), mat(0x2a1238));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.3;
    this.hole = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16), mat(0x110818));
    this.hole.rotation.x = -Math.PI / 2;
    this.hole.position.set((Math.random() - 0.5) * 1.2, 0.32, -0.55);
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mat(0xfff4e4));
    this.ball.position.set(0, 0.5, 1.15);
    this.root.add(floor, this.hole, this.ball);
    this.world.pickables = [this.ball];
    this.drag = false;
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("玉を穴へドラッグ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.type === "down") this.drag = true;
    if (p.type === "up") this.drag = false;
    if (this.drag && p.gx != null) {
      this.ball.position.x = THREE.MathUtils.clamp(p.gx, -1.5, 1.5);
      this.ball.position.z = THREE.MathUtils.clamp(p.gz ?? 0, -1.4, 1.4);
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.alive && this.ball && this.hole) {
      const dx = this.ball.position.x - this.hole.position.x;
      const dz = this.ball.position.z - this.hole.position.z;
      if (dx * dx + dz * dz < 0.11) {
        this.score += 1;
        this.bus.chime();
        this.reset();
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

export class RopeRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "縄一番";
    this.t = 0;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    wipe(this.root);
    this.hero = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.5, 4, 8), mat(0xfff4e4));
    this.hero.position.set(0, 0.7, 0.4);
    this.rope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8), mat(0xffc857));
    this.rope.position.set(0, 1.4, 0);
    this.root.add(this.hero, this.rope);
    this.world.pickables = [this.hero];
    this.world.camera.position.set(0, 3.2, 6.2);
    this.world.look.set(0, 0.9, 0);
    this.cool = 0;
    return this.hud();
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("縄が足下で跳べ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down" || this.cool > 0) return;
    const ang = Math.sin(this.t * 3.2);
    this.cool = 0.25;
    if (Math.abs(ang) < 0.28) {
      this.score += 1;
      this.bus.whoosh();
    } else this.bus.boom();
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    this.t += dt;
    this.cool = Math.max(0, this.cool - dt);
    const ang = Math.sin(this.t * 3.2);
    this.rope.rotation.x = ang;
    this.rope.position.z = Math.sin(ang) * 0.9;
    this.hero.position.y += ((this.cool > 0.08 ? 1.05 : 0.7) - this.hero.position.y) * 8 * dt;
    return this.time(dt, this.hud());
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class GlowRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "蛍一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    wipe(this.root);
    this.bugs = [];
    this.spawnIn = 0.1;
    this.world.pickables = this.bugs;
    this.world.camera.position.set(0, 6.8, 4.2);
    this.world.look.set(0, 0.4, 0);
    return this.hud();
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("蛍を消える前にタップ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (!hit || hit.userData.kind !== "bug") return;
    this.root.remove(hit);
    this.bugs = this.bugs.filter((b) => b !== hit);
    this.world.pickables = this.bugs;
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
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat(0xffc857, { emissive: 0x886600 }));
        b.position.set((Math.random() - 0.5) * 2.4, 0.5 + Math.random() * 1.2, (Math.random() - 0.5) * 1.6);
        b.userData.pick = "glow-live";
        b.userData.kind = "bug";
        b.userData.life = 1.05;
        this.root.add(b);
        this.bugs.push(b);
        this.world.pickables = this.bugs;
        this.spawnIn = 0.55;
      }
      const keep = [];
      for (const b of this.bugs) {
        b.userData.life -= dt;
        if (b.userData.life <= 0) this.root.remove(b);
        else keep.push(b);
      }
      this.bugs = keep;
      this.world.pickables = this.bugs;
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
