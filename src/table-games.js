import * as THREE from "three";
import { dare } from "./games.js";

function mat(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.2,
    ...extras,
  });
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

export class KusudamaGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
    this.ball = null;
    this.alive = false;
    this.index = 0;
    this.hits = 0;
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.hits = 0;
    this.alive = true;
    this.t = 0;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.ball = this.world.makeKusudama();
    this.ball.position.y = 1.2;
    this.ball.userData.pick = "kusudama-live";
    this.root.add(this.ball);
    this.world.pickables = [this.ball];
    this.world.camera.position.set(0, 4.4, 5.6);
    return this.hud();
  }

  hud() {
    return {
      who: this.players[this.index],
      prompt: "満開の瞬間に割れ。萎んでいるときに触ると負け",
      action: "割る",
    };
  }

  collect() {
    return { kind: "burst" };
  }

  act() {
    if (!this.alive) return null;
    const open = 0.5 + 0.5 * Math.sin(this.t * 2.1);
    if (open < 0.78) {
      this.alive = false;
      this.world.shake = 0.35;
      this.bus.boom();
      return {
        end: true,
        loser: this.players[this.index],
        title: `${this.players[this.index]} が早まった`,
        lead: "蕾のまま割ってしまった。",
        dare: dare(),
      };
    }
    this.hits += 1;
    this.bus.chime();
    this.index = (this.index + 1) % this.players.length;
    if (this.hits >= this.players.length * 2) {
      this.alive = false;
      return {
        end: true,
        winner: this.players[this.index],
        title: "宴の花、満開",
        lead: "全員が満開を二つずつ取った。最後に触った人の勝ち。",
      };
    }
    return { hud: this.hud() };
  }

  update(dt) {
    if (!this.alive || !this.ball) return null;
    this.t += dt;
    const open = 0.5 + 0.5 * Math.sin(this.t * 2.1);
    const s = 0.85 + open * 0.7;
    this.ball.scale.setScalar(s);
    this.ball.rotation.y += dt * (0.4 + open);
    return null;
  }

  exit() {
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class RingsGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
    this.ring = null;
    this.peg = null;
    this.dir = 1;
    this.index = 0;
    this.scores = [];
    this.alive = false;
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.scores = [];
    this.alive = true;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.peg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.4, 16), mat(0xffc857));
    this.peg.position.y = 1.0;
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 12, 28), mat(0xff5d8f, { metalness: 0.4 }));
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.set(-2.4, 1.35, 0);
    this.ring.userData.pick = "rings-live";
    this.root.add(this.peg, this.ring);
    this.world.pickables = [this.ring];
    this.world.camera.position.set(0, 5.2, 5.8);
    this.dir = 1;
    return this.hud();
  }

  hud() {
    return {
      who: this.players[this.index],
      prompt: "輪が柱の真上に来たとき投げよ。外した人が負け",
      action: "投げる",
    };
  }

  collect() {
    return { kind: "throw", x: this.ring?.position.x ?? 0 };
  }

  act(extra) {
    if (!this.alive || !this.ring) return null;
    const x = typeof extra?.x === "number" ? extra.x : this.ring.position.x;
    this.ring.position.x = x;
    const miss = Math.abs(x) > 0.38;
    this.bus.whoosh();
    if (miss) {
      this.alive = false;
      this.world.shake = 0.3;
      this.bus.boom();
      return {
        end: true,
        loser: this.players[this.index],
        title: `${this.players[this.index]} の輪が外れた`,
        lead: "柱を外した。",
        dare: dare(),
      };
    }
    this.scores.push(this.players[this.index]);
    this.bus.chime();
    this.index += 1;
    this.ring.position.x = -2.4;
    this.dir = 1;
    if (this.index >= this.players.length) {
      this.alive = false;
      return {
        end: true,
        winner: this.scores[0],
        title: "輪は柱を抱いた",
        lead: "全員成功。最初に通した人の勝ち。",
      };
    }
    return { hud: this.hud() };
  }

  update(dt) {
    if (!this.alive || !this.ring) return null;
    this.ring.position.x += this.dir * 2.8 * dt;
    if (Math.abs(this.ring.position.x) > 2.5) this.dir *= -1;
    return null;
  }

  exit() {
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class LanternGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
    this.flame = null;
    this.heat = 1;
    this.index = 0;
    this.pumps = 0;
    this.alive = false;
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.pumps = 0;
    this.heat = 0.7;
    this.alive = true;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    const lantern = this.world.makeLantern();
    lantern.position.y = 0.3;
    this.flame = lantern.getObjectByName("flame");
    lantern.userData.pick = "lantern-live";
    this.root.add(lantern);
    this.world.pickables = [lantern];
    this.world.camera.position.set(0, 4.6, 5.4);
    return this.hud();
  }

  hud() {
    return {
      who: this.players[this.index],
      prompt: "火が消える前に三度あおげ。消えた番が負け",
      action: "あおぐ",
    };
  }

  collect() {
    return { kind: "pump" };
  }

  act() {
    if (!this.alive) return null;
    this.heat = Math.min(1, this.heat + 0.28);
    this.pumps += 1;
    this.bus.tick();
    if (this.pumps >= 3) {
      this.pumps = 0;
      this.index = (this.index + 1) % this.players.length;
      return { hud: this.hud() };
    }
    return { hud: this.hud() };
  }

  update(dt) {
    if (!this.alive) return null;
    this.heat -= dt * 0.16;
    if (this.flame) this.flame.scale.setScalar(0.4 + Math.max(0, this.heat) * 1.4);
    if (this.heat <= 0) {
      this.alive = false;
      this.world.shake = 0.25;
      this.bus.boom();
      return {
        end: true,
        loser: this.players[this.index],
        title: `${this.players[this.index]} の番で火が落ちた`,
        lead: "提灯が闇に還った。",
        dare: dare(),
      };
    }
    return null;
  }

  exit() {
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class KoiGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
    this.poi = null;
    this.fish = [];
    this.dir = 1;
    this.index = 0;
    this.left = 8;
    this.catches = [];
    this.got = 0;
    this.alive = false;
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.catches = [];
    this.got = 0;
    this.left = 8;
    this.alive = true;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 40),
      mat(0x1a4a66, { transparent: true, opacity: 0.55, roughness: 0.2 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.32;
    this.poi = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.05, 8, 24), mat(0xffc857));
    this.poi.rotation.x = -Math.PI / 2;
    this.poi.position.set(-2, 0.55, 0);
    this.poi.userData.pick = "koi-live";
    this.fish = [0, 1, 2].map((i) => {
      const f = this.world.makeKoi(i);
      f.userData.phase = i * 2.1;
      this.root.add(f);
      return f;
    });
    this.root.add(water, this.poi);
    this.world.pickables = [this.poi];
    this.world.camera.position.set(0, 7.4, 0.4);
    this.world.look.set(0, 0.3, 0);
    this.dir = 1;
    return this.hud();
  }

  hud() {
    return {
      who: this.players[this.index],
      prompt: `金魚すくい ${this.got} 匹　残り ${Math.ceil(this.left)} 秒`,
      action: "すくう",
    };
  }

  collect() {
    return { kind: "scoop", x: this.poi?.position.x ?? 0 };
  }

  act(extra) {
    if (!this.alive || !this.poi) return null;
    const x = typeof extra?.x === "number" ? extra.x : this.poi.position.x;
    this.poi.position.x = x;
    let hit = 0;
    for (const f of this.fish) {
      if (f.visible && Math.abs(f.position.x - x) < 0.42 && Math.abs(f.position.z) < 0.5) {
        f.visible = false;
        hit += 1;
      }
    }
    if (hit) {
      this.got += hit;
      this.bus.chime();
    } else this.bus.tick();
    return { hud: this.hud() };
  }

  update(dt) {
    if (!this.alive) return null;
    this.left -= dt;
    this.poi.position.x += this.dir * 2.6 * dt;
    if (Math.abs(this.poi.position.x) > 2.1) this.dir *= -1;
    const t = this.world.clock.elapsedTime;
    this.fish.forEach((f) => {
      const p = f.userData.phase + t * 1.4;
      f.position.set(Math.sin(p) * 1.7, 0.42, Math.cos(p * 0.8) * 0.9);
      f.rotation.y = p;
    });
    if (this.left > 0) return null;
    this.catches.push({ name: this.players[this.index], n: this.got });
    this.index += 1;
    if (this.index < this.players.length) {
      this.got = 0;
      this.left = 8;
      this.fish.forEach((f) => {
        f.visible = true;
      });
      return { hud: this.hud() };
    }
    this.alive = false;
    this.catches.sort((a, b) => b.n - a.n);
    const win = this.catches[0];
    const lose = this.catches[this.catches.length - 1];
    this.world.look.set(0, 0.35, 0);
    return {
      end: true,
      winner: win.name,
      title: `${win.name} が ${win.n} 匹`,
      lead: this.catches.map((c) => `${c.name} ${c.n}`).join("  /  "),
      dare: `${lose.name} への指令：${dare()}`,
    };
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class FoxfireGame {
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
    this.layout();
    this.world.camera.position.set(0, 5.2, 5.4);
    this.world.look.set(0, 0.8, 0);
    return this.hud();
  }

  layout() {
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.orbs = [];
    const fox = Math.floor(Math.random() * 6);
    for (let i = 0; i < 6; i++) {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 14, 12),
        mat(0xffc857, { emissive: 0xffc857, emissiveIntensity: 0.35 })
      );
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      orb.position.set(Math.cos(a) * 1.55, 0.85, Math.sin(a) * 1.55);
      orb.userData.pick = "fox-live";
      orb.userData.fox = i === fox;
      this.root.add(orb);
      this.orbs.push(orb);
    }
    this.world.pickables = this.orbs;
  }

  hud() {
    return {
      who: this.players[this.index],
      prompt: "狐火を選べ。偽物に触れた番が負け",
      action: "火を選ぶ",
      canvasPlay: true,
    };
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (!hit || hit.userData.pick !== "fox-live") return;
    this.choice = hit;
  }

  update(dt) {
    if (!this.alive) return null;
    const t = this.world.clock.elapsedTime;
    this.orbs.forEach((o, i) => {
      o.position.y = 0.85 + Math.sin(t * 2.4 + i) * 0.12;
      const glow = o.userData.fox ? 0.55 + Math.sin(t * 9) * 0.2 : 0.32;
      o.material.emissiveIntensity = glow;
    });
    if (!this.choice) return null;
    const hit = this.choice;
    this.choice = null;
    if (hit.userData.fox) {
      this.bus.chime();
      hit.scale.setScalar(1.35);
      this.index = (this.index + 1) % this.players.length;
      this.layout();
      return { hud: this.hud() };
    }
    this.alive = false;
    this.world.shake = 0.32;
    this.bus.boom();
    this.orbs.forEach((o) => {
      o.material.color.setHex(o.userData.fox ? 0xffc857 : 0x442244);
      o.material.emissiveIntensity = o.userData.fox ? 1 : 0.05;
    });
    return {
      end: true,
      loser: this.players[this.index],
      title: `${this.players[this.index]} が迷火に触れた`,
      lead: "本物の狐火ではなかった。",
      dare: dare(),
    };
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class HanabiGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.resetRocket();
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.rocket = this.world.makeRocket();
    this.rocket.position.y = 0.35;
    this.root.add(this.rocket);
    this.world.pickables = [this.rocket];
    this.world.camera.position.set(0, 4.8, 6.2);
    this.world.look.set(0, 1.6, 0);
    return this.hud();
  }

  resetRocket() {
    this.y = 0.35;
    this.rising = false;
    this.wait = 0.7 + Math.random() * 0.7;
    this.tapped = false;
  }

  hud() {
    return {
      who: this.players[this.index],
      prompt: "金に光った瞬間に割れ。早すぎ・遅すぎは負け",
      action: "割る",
      canvasPlay: true,
    };
  }

  canAct() {
    return false;
  }

  windowOpen() {
    return this.rising && this.y > 2.15 && this.y < 2.85;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down" || this.tapped) return;
    this.tapped = true;
    this.choice = true;
  }

  burst(ok) {
    this.alive = false;
    this.world.shake = ok ? 0.18 : 0.35;
    if (ok) this.bus.chime();
    else this.bus.boom();
    if (ok) {
      this.alive = true;
      this.index = (this.index + 1) % this.players.length;
      this.resetRocket();
      if (this.rocket) this.rocket.position.y = this.y;
      return { hud: this.hud() };
    }
    return {
      end: true,
      loser: this.players[this.index],
      title: `${this.players[this.index]} の花火が不発`,
      lead: "金の瞬間を逃した。",
      dare: dare(),
    };
  }

  update(dt) {
    if (!this.alive) return null;
    if (!this.rising) {
      this.wait -= dt;
      if (this.wait <= 0) this.rising = true;
    } else {
      this.y += 2.8 * dt;
    }
    if (this.rocket) {
      this.rocket.position.y = this.y;
      const hot = this.windowOpen();
      this.rocket.children[0].material.emissive.setHex(hot ? 0xffc857 : 0x000000);
      this.rocket.rotation.z = Math.sin(this.world.clock.elapsedTime * 8) * (this.rising ? 0.08 : 0);
    }
    if (this.choice) {
      this.choice = false;
      return this.burst(this.windowOpen());
    }
    if (this.rising && this.y > 3.45) return this.burst(false);
    return null;
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}
