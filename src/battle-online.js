import * as THREE from "three";
import { Race } from "./online-games.js";

function wipe(root) {
  while (root.children.length) root.remove(root.children[0]);
}

function mat(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.2,
    ...extras,
  });
}

export class PushGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 18);
    this.winWord = "押し一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    wipe(this.root);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.1, 24), mat(0x6b3a1f));
    ring.position.y = 0.22;
    this.hero = this.world.makeHero();
    this.hero.position.set(0, 0, 0.7);
    this.oni = this.world.makeOni();
    this.oni.position.set(0, 0, -0.7);
    this.root.add(ring, this.hero, this.oni);
    this.world.pickables = [this.hero];
    this.drag = null;
    this.tap = null;
    this.cool = 0;
    this.ovx = 0;
    this.ovz = 0;
    this.world.camera.position.set(0, 6.8, 4.4);
    this.world.look.set(0, 0.2, 0);
    return this.hud();
  }

  shareState() {
    return { duration: 18 };
  }

  hud() {
    return this.hudLine("ドラッグで寄り、タップで押せ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.type === "down") {
      this.tap = { x: p.x, y: p.y, t: performance.now() };
      this.drag = p.gx != null ? { x: p.gx, z: p.gz } : null;
    }
    if (p.type === "move" && this.tap) this.drag = p.gx != null ? { x: p.gx, z: p.gz } : this.drag;
    if (p.type === "up" && this.tap) {
      const held = performance.now() - this.tap.t;
      const dist = Math.hypot(p.x - this.tap.x, p.y - this.tap.y);
      this.tap = null;
      this.drag = null;
      if (dist < 22 && held < 280 && this.cool <= 0) {
        this.cool = 0.2;
        const dx = this.oni.position.x - this.hero.position.x;
        const dz = this.oni.position.z - this.hero.position.z;
        const d = Math.hypot(dx, dz) || 1;
        if (d < 1.3) {
          this.ovx += (dx / d) * 3.2;
          this.ovz += (dz / d) * 3.2;
          this.bus.tick();
        }
      }
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  place() {
    this.hero.position.set(0, 0, 0.7);
    this.oni.position.set(0, 0, -0.7);
    this.ovx = 0;
    this.ovz = 0;
  }

  update(dt) {
    if (this.alive) {
      this.cool = Math.max(0, this.cool - dt);
      if (this.drag) {
        const dx = this.drag.x - this.hero.position.x;
        const dz = this.drag.z - this.hero.position.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.1) {
          this.hero.rotation.y = Math.atan2(dx, dz);
          this.hero.position.x += (dx / d) * 2.4 * dt;
          this.hero.position.z += (dz / d) * 2.4 * dt;
        }
      }
      const ox = this.hero.position.x - this.oni.position.x;
      const oz = this.hero.position.z - this.oni.position.z;
      const od = Math.hypot(ox, oz) || 1;
      this.ovx += (ox / od) * 1.1 * dt;
      this.ovz += (oz / od) * 1.1 * dt;
      this.ovx *= 0.92;
      this.ovz *= 0.92;
      this.oni.position.x += this.ovx * dt;
      this.oni.position.z += this.ovz * dt;
      if (Math.hypot(this.oni.position.x, this.oni.position.z) > 1.58) {
        this.score += 1;
        this.bus.chime();
        this.place();
      }
      if (Math.hypot(this.hero.position.x, this.hero.position.z) > 1.58) {
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

export class ParryGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "受け一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    wipe(this.root);
    this.hero = this.world.makeHero();
    this.hero.position.set(0, 0, 1.4);
    this.hero.rotation.y = Math.PI;
    this.root.add(this.hero);
    this.world.pickables = [this.hero];
    this.world.camera.position.set(0, 2.4, 4.6);
    this.world.look.set(0, 0.7, 0);
    this.wind = 0.2;
    this.atk = null;
    this.start = null;
    return this.hud();
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("斬撃を左右スワイプで受けろ");
  }

  canAct() {
    return false;
  }

  spawn() {
    const side = Math.random() < 0.5 ? -1 : 1;
    const blade = this.world.makeBlade();
    blade.position.set(side * 1.5, 0.8, -0.4);
    this.root.add(blade);
    this.atk = { mesh: blade, side };
    this.bus.whoosh();
  }

  pointer(p) {
    if (!this.alive || !this.atk) return;
    if (p.type === "down") this.start = { x: p.x };
    if (p.type === "up" && this.start) {
      const dx = p.x - this.start.x;
      this.start = null;
      if (Math.abs(dx) < 30) return;
      const ok = dx < 0 === this.atk.side < 0;
      this.root.remove(this.atk.mesh);
      this.atk = null;
      this.wind = 0.28;
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
    if (this.alive) {
      this.wind -= dt;
      if (!this.atk && this.wind <= 0) this.spawn();
      if (this.atk) {
        this.atk.mesh.position.z += 3.6 * dt;
        this.atk.mesh.position.x += -this.atk.side * 1.9 * dt;
        if (this.atk.mesh.position.z > 1.2) {
          this.root.remove(this.atk.mesh);
          this.atk = null;
          this.wind = 0.2;
          this.bus.boom();
        }
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

export class BossGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "急所一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    wipe(this.root);
    this.oni = this.world.makeOni();
    this.oni.scale.setScalar(1.25);
    this.spot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat(0xffc857, { emissive: 0xaa7700 }));
    this.spot.userData.pick = "weak-live";
    this.ang = 0;
    this.root.add(this.oni, this.spot);
    this.world.pickables = [this.spot];
    this.world.camera.position.set(0, 3.2, 5.8);
    this.world.look.set(0, 0.8, 0);
    return this.hud();
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("光る急所をタップ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.pick === "weak-live") {
      this.score += 1;
      this.bus.chime();
      this.ang += 0.9;
      this.world.shake = 0.08;
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    this.ang += 2.3 * dt;
    this.oni.rotation.y = this.ang * 0.35;
    this.spot.position.set(Math.sin(this.ang) * 0.7, 0.85, Math.cos(this.ang) * 0.7);
    return this.time(dt, this.hud());
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class HuntRace extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 20);
    this.winWord = "狩り一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    wipe(this.root);
    this.hero = this.world.makeHero();
    this.hero.position.set(0, 0, 0.6);
    this.root.add(this.hero);
    this.foes = [];
    this.spawnIn = 0.4;
    this.facing = Math.PI;
    this.drag = null;
    this.tap = null;
    this.cool = 0;
    this.slashT = 0;
    this.world.pickables = [this.hero];
    this.follow();
    return this.hud();
  }

  shareState() {
    return { duration: 20 };
  }

  hud() {
    return this.hudLine("走って斬れ。小さな鬼を狩れ");
  }

  canAct() {
    return false;
  }

  follow() {
    const y = this.facing;
    const px = this.hero.position.x;
    const pz = this.hero.position.z;
    this.world.camera.position.set(px - Math.sin(y) * 3.05, 2.2, pz - Math.cos(y) * 3.05);
    this.world.look.set(px + Math.sin(y) * 0.65, 0.5, pz + Math.cos(y) * 0.65);
  }

  spawn() {
    if (this.foes.filter((f) => f.visible).length >= 5) return;
    const foe = this.world.makeOni();
    foe.scale.setScalar(0.55);
    const a = Math.random() * Math.PI * 2;
    foe.position.set(Math.cos(a) * 2.1, 0, Math.sin(a) * 2.1);
    foe.visible = true;
    this.root.add(foe);
    this.foes.push(foe);
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.type === "down") {
      this.tap = { x: p.x, y: p.y, t: performance.now() };
      this.drag = p.gx != null ? { x: p.gx, z: p.gz } : null;
    }
    if (p.type === "move" && this.tap) this.drag = p.gx != null ? { x: p.gx, z: p.gz } : this.drag;
    if (p.type === "up" && this.tap) {
      const held = performance.now() - this.tap.t;
      const dist = Math.hypot(p.x - this.tap.x, p.y - this.tap.y);
      this.tap = null;
      this.drag = null;
      if (dist < 22 && held < 280 && this.cool <= 0) {
        this.cool = 0.28;
        this.slashT = 0.16;
        this.bus.whoosh();
        const fx = Math.sin(this.facing);
        const fz = Math.cos(this.facing);
        for (const f of this.foes) {
          if (!f.visible) continue;
          const dx = f.position.x - this.hero.position.x;
          const dz = f.position.z - this.hero.position.z;
          const d = Math.hypot(dx, dz);
          if (d < 1.05 && dx * fx + dz * fz > 0) {
            f.visible = false;
            this.score += 1;
            this.bus.chime();
            this.world.shake = 0.1;
          }
        }
      }
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.alive) {
      this.cool = Math.max(0, this.cool - dt);
      this.slashT = Math.max(0, this.slashT - dt);
      const sword = this.hero.getObjectByName("heroSword");
      if (sword) sword.rotation.z += ((this.slashT > 0 ? -1.3 : 0) - sword.rotation.z) * Math.min(1, dt * 18);
      if (this.drag) {
        const dx = this.drag.x - this.hero.position.x;
        const dz = this.drag.z - this.hero.position.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.1) {
          this.facing = Math.atan2(dx, dz);
          this.hero.position.x += (dx / d) * 3.2 * dt;
          this.hero.position.z += (dz / d) * 3.2 * dt;
        }
      }
      this.hero.rotation.y = this.facing;
      this.spawnIn -= dt;
      if (this.spawnIn <= 0) {
        this.spawn();
        this.spawnIn = 0.85;
      }
      for (const f of this.foes) {
        if (!f.visible) continue;
        const dx = this.hero.position.x - f.position.x;
        const dz = this.hero.position.z - f.position.z;
        const d = Math.hypot(dx, dz) || 1;
        f.position.x += (dx / d) * 1.35 * dt;
        f.position.z += (dz / d) * 1.35 * dt;
      }
      this.follow();
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
