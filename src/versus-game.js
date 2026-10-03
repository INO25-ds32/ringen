import { dare } from "./games.js";

function hearts(n, max = 5) {
  return "♥".repeat(Math.max(0, n)) + "♡".repeat(Math.max(0, max - n));
}

export class VersusGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = null;
  }

  enter(players) {
    this.players = players.length >= 2 ? players : [players[0] || "あなた", "あいて"];
    this.aName = this.players[0];
    this.bName = this.players[1];
    this.alive = true;
    this.ended = null;
    this.touches = new Map();
    this.hudAcc = 0;
    this.world.clearPlay();
    this.root = this.world.group;
    this.world.setHubVisible(false);

    this.near = this.makeFighter(this.world.makeHero(0x66e0ff), this.aName, 0, 1.35, Math.PI);
    this.far = this.makeFighter(this.world.makeHero(0xff5d8f), this.bName, 0, -1.35, 0);
    this.world.group.add(this.near.mesh, this.far.mesh);
    this.world.pickables = [this.near.mesh, this.far.mesh];
    this.savedHome = this.world.homeCam.clone();
    this.world.camera.position.set(0, 7.6, 0.85);
    this.world.homeCam.copy(this.world.camera.position);
    this.world.look.set(0, 0.2, 0);
    return this.hud();
  }

  makeFighter(mesh, name, x, z, facing) {
    mesh.position.set(x, 0, z);
    mesh.rotation.y = facing;
    return {
      name,
      mesh,
      sword: mesh.getObjectByName("heroSword"),
      hp: 5,
      facing,
      drag: null,
      cool: 0,
      stun: 0,
      slashT: 0,
    };
  }

  hud() {
    return {
      who: `${this.aName} 対 ${this.bName}`,
      prompt: "卓を挟んで、自分の側をドラッグ／タップ",
      action: "斬る",
      canvasPlay: true,
      versus: true,
      farName: this.bName,
      farHp: hearts(this.far.hp),
      nearName: this.aName,
      nearHp: hearts(this.near.hp),
    };
  }

  canAct() {
    return false;
  }

  clamp(obj, r = 2.12) {
    const d = Math.hypot(obj.position.x, obj.position.z);
    if (d > r) {
      obj.position.x *= r / d;
      obj.position.z *= r / d;
    }
  }

  fighterFor(p) {
    if (p.id != null && this.touches.has(p.id)) return this.touches.get(p.id);
    return p.y < window.innerHeight * 0.5 ? this.far : this.near;
  }

  slash(atk, def) {
    if (!this.alive || atk.cool > 0 || atk.stun > 0 || atk.hp <= 0) return;
    atk.cool = 0.34;
    atk.slashT = 0.18;
    this.bus.whoosh();
    const fx = Math.sin(atk.facing);
    const fz = Math.cos(atk.facing);
    const dx = def.mesh.position.x - atk.mesh.position.x;
    const dz = def.mesh.position.z - atk.mesh.position.z;
    const dist = Math.hypot(dx, dz);
    const front = dx * fx + dz * fz;
    if (dist < 1.18 && front > -0.2 && def.hp > 0) {
      def.hp -= 1;
      def.stun = 0.42;
      def.drag = null;
      const d = dist || 1;
      def.mesh.position.x += (dx / d) * 0.42;
      def.mesh.position.z += (dz / d) * 0.42;
      this.clamp(def.mesh);
      this.world.shake = 0.16;
      this.bus.chime();
      if (def.hp <= 0) this.ended = atk;
    }
  }

  pointer(p) {
    if (!this.alive) return;
    const f = this.fighterFor(p);
    if (p.type === "down") {
      this.touches.set(p.id ?? 0, f);
      f._tap = { x: p.x, y: p.y, t: performance.now() };
      f.drag = p.gx != null ? { x: p.gx, z: p.gz } : null;
    }
    if (p.type === "move" && (p.id == null || this.touches.get(p.id) === f)) {
      f.drag = p.gx != null ? { x: p.gx, z: p.gz } : f.drag;
    }
    if (p.type === "up") {
      const tap = f._tap;
      f._tap = null;
      f.drag = null;
      this.touches.delete(p.id ?? 0);
      if (tap) {
        const held = performance.now() - tap.t;
        const dist = Math.hypot(p.x - tap.x, p.y - tap.y);
        if (dist < 24 && held < 280) this.slash(f, f === this.near ? this.far : this.near);
      }
    }
  }

  stepFighter(f, dt) {
    f.cool = Math.max(0, f.cool - dt);
    f.stun = Math.max(0, f.stun - dt);
    f.slashT = Math.max(0, f.slashT - dt);
    if (f.sword) {
      const swing = f.slashT > 0 ? -1.35 : 0;
      f.sword.rotation.z += (swing - f.sword.rotation.z) * Math.min(1, dt * 18);
    }
    if (this.alive && f.stun <= 0 && f.hp > 0 && f.drag) {
      const dx = f.drag.x - f.mesh.position.x;
      const dz = f.drag.z - f.mesh.position.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.1) {
        f.facing = Math.atan2(dx, dz);
        f.mesh.position.x += (dx / d) * 3.2 * dt;
        f.mesh.position.z += (dz / d) * 3.2 * dt;
        this.clamp(f.mesh);
      }
    }
    f.mesh.rotation.y = f.facing;
    f.mesh.position.y = f.stun > 0 ? 0.08 : 0;
  }

  update(dt) {
    if (this.ended && this.alive) {
      this.alive = false;
      const win = this.ended.name;
      const lose = this.ended === this.near ? this.bName : this.aName;
      this.bus.boom();
      return {
        end: true,
        winner: win,
        title: `${win} が一本`,
        lead: `${this.aName} ${this.near.hp}　／　${this.bName} ${this.far.hp}`,
        dare: `${lose} への指令：${dare()}`,
      };
    }
    if (!this.alive) return null;
    this.stepFighter(this.near, dt);
    this.stepFighter(this.far, dt);
    this.hudAcc += dt;
    if (this.hudAcc > 0.2) {
      this.hudAcc = 0;
      return { hud: this.hud() };
    }
    return null;
  }

  exit() {
    if (this.savedHome) this.world.homeCam.copy(this.savedHome);
    this.world.camera.position.copy(this.world.homeCam);
    this.world.look.set(0, 0.35, 0);
    if (this.near) this.world.group.remove(this.near.mesh);
    if (this.far) this.world.group.remove(this.far.mesh);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}
