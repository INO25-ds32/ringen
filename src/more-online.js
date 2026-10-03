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

export class MashGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 10);
    this.winWord = "連打一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.drum = this.world.makeDrum();
    this.drum.scale.setScalar(1.8);
    this.drum.position.y = 0.4;
    this.root.add(this.drum);
    this.world.pickables = [this.drum];
    this.world.camera.position.set(0, 4.4, 5.2);
    return this.hud();
  }

  shareState() {
    return { duration: 10 };
  }

  hud() {
    return this.hudLine("画面を連打しろ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.score += 1;
    this.drum.scale.setScalar(2);
    this.bus.tick();
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    this.drum.scale.lerp(new THREE.Vector3(1.8, 1.8, 1.8), Math.min(1, dt * 8));
    return this.time(dt, this.hud());
  }

  exit() {
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class CoinGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "宝一番";
    this.coins = [];
    this.spawnIn = 0.1;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.hero = this.world.makeHero();
    this.hero.position.set(0, 0, 0.8);
    this.root.add(this.hero);
    this.target = { x: 0, z: 0.8 };
    this.world.pickables = [this.hero];
    this.world.camera.position.set(0, 6.8, 0.4);
    this.world.look.set(0, 0.2, 0);
    return this.hud();
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("ドラッグで走って小判を拾え");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.gx != null) this.target = { x: p.gx, z: p.gz };
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    const dx = this.target.x - this.hero.position.x;
    const dz = this.target.z - this.hero.position.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.08) {
      this.hero.position.x += (dx / d) * 3.6 * dt;
      this.hero.position.z += (dz / d) * 3.6 * dt;
      this.hero.rotation.y = Math.atan2(dx, dz);
    }
    const r = Math.hypot(this.hero.position.x, this.hero.position.z);
    if (r > 2.15) {
      this.hero.position.x *= 2.15 / r;
      this.hero.position.z *= 2.15 / r;
    }
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.alive) {
      const c = this.world.makeCoin();
      const a = Math.random() * Math.PI * 2;
      c.position.set(Math.cos(a) * 1.6, 0.35, Math.sin(a) * 1.6);
      c.userData.alive = true;
      this.root.add(c);
      this.coins.push(c);
      this.spawnIn = 0.7;
    }
    for (const c of this.coins) {
      if (!c.userData.alive) continue;
      c.rotation.y += dt * 4;
      if (c.position.distanceTo(this.hero.position) < 0.55) {
        c.userData.alive = false;
        c.visible = false;
        this.score += 1;
        this.bus.chime();
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

export class MazeGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 20);
    this.winWord = "迷路一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mat(0x66e0ff, { emissive: 0x113344 }));
    this.ball.position.set(-1.5, 0.48, 1.4);
    this.goal = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16), mat(0xffc857, { emissive: 0x553300 }));
    this.goal.position.set(1.5, 0.34, -1.4);
    this.walls = [];
    const boxes = [
      [0, 1.6, 0.2, 3.4],
      [0, -1.6, 0.2, 3.4],
      [-1.7, 0, 3.4, 0.2],
      [1.7, 0, 3.4, 0.2],
      [-0.4, 0.5, 0.2, 1.6],
      [0.5, -0.3, 1.8, 0.2],
      [0.2, 1.0, 1.2, 0.2],
    ];
    for (const [x, z, w, d] of boxes) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), mat(0x4a2a58));
      wall.position.set(x, 0.45, z);
      this.root.add(wall);
      this.walls.push({ x, z, hw: w / 2, hd: d / 2 });
    }
    this.root.add(this.ball, this.goal);
    this.world.pickables = [this.ball];
    this.world.camera.position.set(0, 7.6, 0.2);
    this.world.look.set(0, 0.2, 0);
    this.drag = null;
    return this.hud();
  }

  shareState() {
    return { duration: 20 };
  }

  hud() {
    return this.hudLine("金の台まで玉をドラッグ");
  }

  canAct() {
    return false;
  }

  blocked(x, z) {
    for (const w of this.walls) {
      if (Math.abs(x - w.x) < w.hw + 0.2 && Math.abs(z - w.z) < w.hd + 0.2) return true;
    }
    return false;
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.gx != null) this.drag = { x: p.gx, z: p.gz };
    if (p.type === "up") this.drag = null;
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.drag) {
      const dx = this.drag.x - this.ball.position.x;
      const dz = this.drag.z - this.ball.position.z;
      const nx = this.ball.position.x + dx * Math.min(1, dt * 6);
      const nz = this.ball.position.z + dz * Math.min(1, dt * 6);
      if (!this.blocked(nx, this.ball.position.z)) this.ball.position.x = nx;
      if (!this.blocked(this.ball.position.x, nz)) this.ball.position.z = nz;
    }
    if (this.ball.position.distanceTo(this.goal.position) < 0.42) {
      this.score += 1;
      this.bus.chime();
      this.ball.position.set(-1.5, 0.48, 1.4);
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

export class TargetGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "的中一番";
    this.marks = [];
    this.spawnIn = 0.15;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.world.pickables = [];
    this.world.camera.position.set(0, 4.8, 6);
    this.world.look.set(0, 1, 0);
    return this.hud();
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("動く的をタップ");
  }

  canAct() {
    return false;
  }

  spawn() {
    const m = this.world.makeTarget();
    m.position.set((Math.random() - 0.5) * 3, 0.8 + Math.random() * 1.6, -0.4);
    m.userData.alive = true;
    m.userData.vx = (Math.random() - 0.5) * 2.4;
    m.userData.life = 1.8;
    this.root.add(m);
    this.marks.push(m);
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    for (const m of this.marks) {
      if (!m.userData.alive) continue;
      const s = this.world.toScreen(m.position);
      if (Math.hypot(s.x - p.x, s.y - p.y) < 52) {
        m.userData.alive = false;
        m.visible = false;
        this.score += 1;
        this.bus.chime();
        return;
      }
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.alive) {
      this.spawn();
      this.spawnIn = 0.65;
    }
    for (const m of this.marks) {
      if (!m.userData.alive) continue;
      m.position.x += m.userData.vx * dt;
      m.rotation.z += dt * 3;
      m.userData.life -= dt;
      if (m.userData.life <= 0 || Math.abs(m.position.x) > 2.4) {
        m.userData.alive = false;
        m.visible = false;
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
