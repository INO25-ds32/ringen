import * as THREE from "three";
import { dare } from "./games.js";

function lose(name, title, lead) {
  return { end: true, loser: name, title, lead, dare: dare() };
}

function playHud(who, prompt) {
  return { who, prompt, action: "操作", canvasPlay: true };
}

function wipe(root) {
  while (root.children.length) root.remove(root.children[0]);
}

function mat(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.45,
    metalness: 0.18,
    ...extras,
  });
}

export class SumoGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
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
    this.world.setHubVisible(false);
    this.ring = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.1, 28), mat(0x6b3a1f));
    this.ring.position.y = 0.22;
    const mark = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.05, 8, 28), mat(0xffc857, { emissive: 0x553300 }));
    mark.rotation.x = Math.PI / 2;
    mark.position.y = 0.28;
    this.world.group.add(this.ring, mark);
    this.near = this.makeRikishi(this.world.makeHero(0x66e0ff), this.aName, 0, 0.85, Math.PI);
    this.far = this.makeRikishi(this.world.makeHero(0xff5d8f), this.bName, 0, -0.85, 0);
    this.world.group.add(this.near.mesh, this.far.mesh);
    this.world.pickables = [this.near.mesh, this.far.mesh, this.ring];
    this.savedHome = this.world.homeCam.clone();
    this.world.camera.position.set(0, 7.4, 0.9);
    this.world.homeCam.copy(this.world.camera.position);
    this.world.look.set(0, 0.2, 0);
    return this.hud();
  }

  makeRikishi(mesh, name, x, z, facing) {
    mesh.position.set(x, 0, z);
    mesh.rotation.y = facing;
    mesh.scale.setScalar(1.08);
    return { name, mesh, facing, drag: null, cool: 0, vx: 0, vz: 0 };
  }

  hud() {
    return {
      who: `${this.aName} 対 ${this.bName}`,
      prompt: "自分の側を連打して押せ。土俵を出たら負け",
      action: "押す",
      canvasPlay: true,
      versus: true,
      farName: this.bName,
      farHp: "土俵",
      nearName: this.aName,
      nearHp: "土俵",
    };
  }

  canAct() {
    return false;
  }

  fighterFor(p) {
    if (p.id != null && this.touches.has(p.id)) return this.touches.get(p.id);
    return p.y < window.innerHeight * 0.5 ? this.far : this.near;
  }

  shove(atk, def) {
    if (!this.alive || atk.cool > 0) return;
    atk.cool = 0.16;
    const dx = def.mesh.position.x - atk.mesh.position.x;
    const dz = def.mesh.position.z - atk.mesh.position.z;
    const d = Math.hypot(dx, dz) || 1;
    if (d > 1.35) return;
    def.vx += (dx / d) * 2.4;
    def.vz += (dz / d) * 2.4;
    this.bus.tick();
    this.world.shake = 0.08;
  }

  pointer(p) {
    if (!this.alive) return;
    const f = this.fighterFor(p);
    if (p.type === "down") {
      this.touches.set(p.id ?? 0, f);
      this.shove(f, f === this.near ? this.far : this.near);
      f.drag = p.gx != null ? { x: p.gx, z: p.gz } : null;
    }
    if (p.type === "move" && (p.id == null || this.touches.get(p.id) === f)) {
      f.drag = p.gx != null ? { x: p.gx, z: p.gz } : f.drag;
    }
    if (p.type === "up") {
      f.drag = null;
      this.touches.delete(p.id ?? 0);
    }
  }

  step(f, dt) {
    f.cool = Math.max(0, f.cool - dt);
    f.vx *= 0.9;
    f.vz *= 0.9;
    f.mesh.position.x += f.vx * dt;
    f.mesh.position.z += f.vz * dt;
    if (f.drag) {
      const dx = f.drag.x - f.mesh.position.x;
      const dz = f.drag.z - f.mesh.position.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.08) {
        f.facing = Math.atan2(dx, dz);
        f.mesh.position.x += (dx / d) * 1.6 * dt;
        f.mesh.position.z += (dz / d) * 1.6 * dt;
      }
    }
    f.mesh.rotation.y = f.facing;
    const out = Math.hypot(f.mesh.position.x, f.mesh.position.z);
    if (out > 1.58) this.ended = f === this.near ? this.far : this.near;
  }

  update(dt) {
    if (this.ended && this.alive) {
      this.alive = false;
      const win = this.ended.name;
      const loseN = this.ended === this.near ? this.bName : this.aName;
      this.bus.boom();
      return {
        end: true,
        winner: win,
        title: `${win} が押し出し`,
        lead: `${loseN} が土俵を割った`,
        dare: `${loseN} への指令：${dare()}`,
      };
    }
    if (!this.alive) return null;
    this.step(this.near, dt);
    this.step(this.far, dt);
    this.hudAcc += dt;
    if (this.hudAcc > 0.25) {
      this.hudAcc = 0;
      return { hud: this.hud() };
    }
    return null;
  }

  exit() {
    if (this.savedHome) this.world.homeCam.copy(this.savedHome);
    this.world.camera.position.copy(this.world.homeCam);
    this.world.look.set(0, 0.35, 0);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class GuardGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.need = 3;
    this.got = 0;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.hero = this.world.makeHero(0x66e0ff);
    this.hero.position.set(0, 0, 1.4);
    this.hero.rotation.y = Math.PI;
    this.root.add(this.hero);
    this.world.camera.position.set(0, 2.4, 4.6);
    this.world.look.set(0, 0.7, 0);
    this.wind = 0.4;
    this.atk = null;
    this.start = null;
    return this.hud();
  }

  hud() {
    return playHud(this.players[this.index], "斬撃を左右にスワイプして受けろ");
  }

  canAct() {
    return false;
  }

  spawn() {
    const side = Math.random() < 0.5 ? -1 : 1;
    const blade = this.world.makeBlade();
    blade.position.set(side * 1.5, 0.8, -0.4);
    blade.userData.side = side;
    this.root.add(blade);
    this.atk = { mesh: blade, side, t: 0 };
    this.bus.whoosh();
  }

  pointer(p) {
    if (!this.alive || !this.atk) return;
    if (p.type === "down") this.start = { x: p.x };
    if (p.type === "up" && this.start) {
      const dx = p.x - this.start.x;
      this.start = null;
      if (Math.abs(dx) < 30) return;
      const left = dx < 0;
      const wantLeft = this.atk.side < 0;
      if (left === wantLeft) {
        this.root.remove(this.atk.mesh);
        this.atk = null;
        this.got += 1;
        this.bus.chime();
        this.wind = 0.35;
        if (this.got >= this.need) {
          this.index = (this.index + 1) % this.players.length;
          this.got = 0;
          this.need = Math.min(5, this.need + 1);
        }
        this.needHud = true;
      } else {
        this.fail = true;
      }
    }
  }

  update(dt) {
    if (!this.alive) return null;
    if (this.fail) {
      this.alive = false;
      this.bus.boom();
      this.world.shake = 0.28;
      return lose(this.players[this.index], `${this.players[this.index]} が受けを外した`, "斬撃が通った。");
    }
    this.wind -= dt;
    if (!this.atk && this.wind <= 0) this.spawn();
    if (this.atk) {
      this.atk.t += dt;
      this.atk.mesh.position.z += 3.4 * dt;
      this.atk.mesh.position.x += -this.atk.side * 1.8 * dt;
      if (this.atk.mesh.position.z > 1.15) {
        this.alive = false;
        this.bus.boom();
        this.world.shake = 0.28;
        return lose(this.players[this.index], `${this.players[this.index]} が間に合わなかった`, "受けが遅れた。");
      }
    }
    if (this.needHud) {
      this.needHud = false;
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

export class WeakGame {
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
    this.world.camera.position.set(0, 3.2, 5.8);
    this.world.look.set(0, 0.7, 0);
    this.reset();
    return this.hud();
  }

  reset() {
    wipe(this.root);
    this.oni = this.world.makeOni();
    this.oni.position.set(0, 0, 0);
    this.spot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat(0xffc857, { emissive: 0xaa7700 }));
    this.spot.userData.pick = "weak-live";
    this.ang = Math.random() * Math.PI * 2;
    this.root.add(this.oni, this.spot);
    this.world.pickables = [this.spot];
    this.left = 1.35;
    this.got = 0;
    this.need = 3;
  }

  hud() {
    return playHud(this.players[this.index], "光る急所をタップして3回");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.pick === "weak-live") this.hit = true;
  }

  update(dt) {
    if (!this.alive) return null;
    this.ang += 2.2 * dt;
    this.oni.rotation.y = this.ang * 0.4;
    this.spot.position.set(Math.sin(this.ang) * 0.55, 0.7, Math.cos(this.ang) * 0.55);
    this.left -= dt;
    if (this.hit) {
      this.hit = false;
      this.got += 1;
      this.bus.chime();
      this.world.shake = 0.1;
      this.left = 1.2;
      this.ang += 0.8;
      if (this.got >= this.need) {
        this.index = (this.index + 1) % this.players.length;
        this.reset();
        return { hud: this.hud() };
      }
    }
    if (this.left <= 0) {
      this.alive = false;
      this.bus.boom();
      return lose(this.players[this.index], `${this.players[this.index]} が急所を外した`, "鬼の角が光っている。");
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

export class ClashGame {
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
    this.hero = this.world.makeHero(0x66e0ff);
    this.oni = this.world.makeOni();
    this.hero.position.set(0.7, 0, 1.1);
    this.oni.position.set(-0.7, 0, -0.6);
    this.hero.rotation.y = Math.PI * 0.85;
    this.root.add(this.hero, this.oni);
    this.world.pickables = [this.hero];
    this.world.camera.position.set(0, 2.6, 5.4);
    this.world.look.set(0, 0.7, 0);
    this.t = 0;
    this.window = false;
    this.done = false;
    return this.hud();
  }

  hud() {
    return playHud(this.players[this.index], "刀が金色に重なった瞬間にタップ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.tap = true;
  }

  update(dt) {
    if (!this.alive) return null;
    this.t += dt;
    const pulse = (Math.sin(this.t * 5.2) + 1) / 2;
    this.window = pulse > 0.78;
    const sword = this.hero.getObjectByName("heroSword");
    if (sword) sword.material.emissive.setHex(this.window ? 0xffc857 : 0x000000);
    this.hero.position.x = 0.7 - pulse * 0.25;
    this.oni.position.x = -0.7 + pulse * 0.25;
    if (!this.tap) return null;
    this.tap = false;
    if (this.window) {
      this.bus.chime();
      this.world.shake = 0.18;
      this.index = (this.index + 1) % this.players.length;
      this.t = Math.random();
      return { hud: this.hud() };
    }
    this.alive = false;
    this.bus.boom();
    this.world.shake = 0.28;
    return lose(this.players[this.index], `${this.players[this.index]} が鍔迫り合いを外した`, "重なった瞬間だけ斬る。");
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class HuntGame {
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
    return this.hud();
  }

  reset() {
    wipe(this.root);
    this.hero = this.world.makeHero();
    this.hero.position.set(0, 0, 0.8);
    this.oni = this.world.makeOni();
    this.oni.position.set(0, 0, -1.6);
    this.oni.userData.hp = 3;
    this.root.add(this.hero, this.oni);
    this.world.pickables = [this.hero, this.oni];
    this.facing = Math.PI;
    this.drag = null;
    this.tap = null;
    this.cool = 0;
    this.slashT = 0;
    this.follow();
  }

  follow() {
    const y = this.facing;
    const px = this.hero.position.x;
    const pz = this.hero.position.z;
    this.world.camera.position.set(px - Math.sin(y) * 3.1, 2.2, pz - Math.cos(y) * 3.1);
    this.world.look.set(px + Math.sin(y) * 0.6, 0.55, pz + Math.cos(y) * 0.6);
  }

  hud() {
    return playHud(this.players[this.index], "ドラッグで走り、タップで鬼を3回斬れ");
  }

  canAct() {
    return false;
  }

  slash() {
    if (this.cool > 0) return;
    this.cool = 0.3;
    this.slashT = 0.16;
    this.bus.whoosh();
    const fx = Math.sin(this.facing);
    const fz = Math.cos(this.facing);
    const dx = this.oni.position.x - this.hero.position.x;
    const dz = this.oni.position.z - this.hero.position.z;
    const dist = Math.hypot(dx, dz);
    const front = dx * fx + dz * fz;
    if (dist < 1.2 && front > 0) {
      this.oni.userData.hp -= 1;
      this.bus.chime();
      this.world.shake = 0.12;
      this.oni.position.x += (dx / (dist || 1)) * 0.35;
      this.oni.position.z += (dz / (dist || 1)) * 0.35;
    }
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
      if (dist < 22 && held < 280) this.slash();
    }
  }

  update(dt) {
    if (!this.alive) return null;
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
        this.hero.position.x += (dx / d) * 3.1 * dt;
        this.hero.position.z += (dz / d) * 3.1 * dt;
      }
    }
    this.hero.rotation.y = this.facing;
    const ox = this.hero.position.x - this.oni.position.x;
    const oz = this.hero.position.z - this.oni.position.z;
    const od = Math.hypot(ox, oz) || 1;
    this.oni.position.x += (ox / od) * 1.15 * dt;
    this.oni.position.z += (oz / od) * 1.15 * dt;
    this.oni.rotation.y = Math.atan2(ox, oz);
    this.follow();
    if (this.oni.userData.hp <= 0) {
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.reset();
      return { hud: this.hud() };
    }
    if (od < 0.55) {
      this.alive = false;
      this.bus.boom();
      this.world.shake = 0.3;
      this.world.look.set(0, 0.35, 0);
      return lose(this.players[this.index], `${this.players[this.index]} が鬼に掴まれた`, "斬って離せ。");
    }
    return null;
  }

  exit() {
    this.world.camera.position.copy(this.world.homeCam);
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}
