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

export class PoleGame {
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
    this.world.camera.position.set(0, 3.8, 6.2);
    this.world.look.set(0, 1.1, 0);
    return this.hud();
  }

  reset() {
    wipe(this.root);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.16, 12), mat(0x3a2048));
    base.position.y = 0.28;
    this.pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.8, 10), mat(0xffc857));
    this.pole.position.y = 1.2;
    this.root.add(base, this.pole);
    this.world.pickables = [this.pole];
    this.ang = (Math.random() - 0.5) * 0.12;
    this.vel = 0;
    this.held = 0;
  }

  hud() {
    return playHud(this.players[this.index], "倒れる側と逆をタップ。3秒保て");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.vel += (p.gx ?? 0) < 0 ? 1.6 : -1.6;
    this.bus.tick();
  }

  update(dt) {
    if (!this.alive) return null;
    this.vel += this.ang * 4.2 * dt;
    this.ang += this.vel * dt;
    this.pole.rotation.z = this.ang;
    this.held += dt;
    if (Math.abs(this.ang) > 0.72) {
      this.alive = false;
      this.bus.boom();
      this.world.shake = 0.25;
      return lose(this.players[this.index], `${this.players[this.index]} が棒を倒した`, "支えが遅れた。");
    }
    if (this.held >= 3.2) {
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

export class HoldGame {
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

  hud() {
    return playHud(this.players[this.index], "押したまま金の帯で離せ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.type === "down") this.press = true;
    if (p.type === "up") this.press = false, (this.released = true);
  }

  update(dt) {
    if (!this.alive) return null;
    if (this.press) this.h = Math.min(2.1, this.h + dt * 1.35);
    this.bar.position.y = 0.28 + this.h;
    if (this.h >= 2.05) {
      this.alive = false;
      this.bus.boom();
      return lose(this.players[this.index], `${this.players[this.index]} が行き過ぎた`, "金を超えてしまった。");
    }
    if (!this.released) return null;
    this.released = false;
    if (this.h > 1.12 && this.h < 1.55) {
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.reset();
      return { hud: this.hud() };
    }
    this.alive = false;
    this.bus.boom();
    return lose(this.players[this.index], `${this.players[this.index]} が帯を外した`, "金の高さで離す。");
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class BiggerGame {
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
    this.world.camera.position.set(0, 5.4, 5.2);
    this.world.look.set(0, 0.5, 0);
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.orbs = [];
    const leftBig = Math.random() < 0.5;
    const sizes = leftBig ? [0.55, 0.32] : [0.32, 0.55];
    for (let i = 0; i < 2; i++) {
      const o = new THREE.Mesh(new THREE.SphereGeometry(sizes[i], 14, 12), mat(i ? 0x66e0ff : 0xff5d8f));
      o.position.set(i ? 0.95 : -0.95, 0.7, 0);
      o.userData.pick = "big-live";
      o.userData.big = sizes[i] > 0.4;
      this.root.add(o);
      this.orbs.push(o);
    }
    this.world.pickables = this.orbs;
    this.choice = null;
  }

  hud() {
    return playHud(this.players[this.index], "大きい方を選べ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit && hit.userData.big != null) this.choice = hit.userData.big;
  }

  update() {
    if (!this.alive || this.choice == null) return null;
    const ok = this.choice;
    this.choice = null;
    if (ok) {
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.deal();
      return { hud: this.hud() };
    }
    this.alive = false;
    this.bus.boom();
    return lose(this.players[this.index], `${this.players[this.index]} が小さい方を選んだ`, "大きい玉だった。");
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class WindGame {
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
    this.got = null;
  }

  hud() {
    return playHud(this.players[this.index], "矢印の向きにスワイプ");
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
      this.got = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down";
    }
  }

  update() {
    if (!this.alive || !this.got) return null;
    const g = this.got;
    this.got = null;
    if (g === this.want) {
      this.bus.whoosh();
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.deal();
      return { hud: this.hud() };
    }
    this.alive = false;
    this.bus.boom();
    return lose(this.players[this.index], `${this.players[this.index]} が風を外した`, "矢印の向きに払う。");
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class EchoGame {
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
    this.wait = 0.35;
    this.taps = 0;
    this.window = 0;
  }

  hud() {
    const t = this.phase === "show" ? "鳴る回数を聞け" : "同じ回数だけ叩け";
    return playHud(this.players[this.index], t);
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || this.phase !== "tap" || p.type !== "down") return;
    this.taps += 1;
    this.bus.tick();
    this.drum.material.emissive.setHex(0x551100);
    this.flash = 0.08;
  }

  update(dt) {
    if (!this.alive) return null;
    if (this.flash > 0) {
      this.flash -= dt;
      if (this.flash <= 0) this.drum.material.emissive.setHex(0x000000);
    }
    if (this.phase === "show") {
      this.wait -= dt;
      if (this.wait <= 0) {
        if (this.shown < this.want) {
          this.bus.tick();
          this.drum.material.emissive.setHex(0xffc857);
          this.flash = 0.12;
          this.shown += 1;
          this.wait = 0.32;
        } else {
          this.phase = "tap";
          this.window = 1.9;
          return { hud: this.hud() };
        }
      }
      return null;
    }
    this.window -= dt;
    if (this.taps > this.want) {
      this.alive = false;
      this.bus.boom();
      return lose(this.players[this.index], `${this.players[this.index]} が叩き過ぎた`, `${this.want} 回だった。`);
    }
    if (this.window > 0) return null;
    if (this.taps === this.want) {
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.deal();
      return { hud: this.hud() };
    }
    this.alive = false;
    this.bus.boom();
    return lose(this.players[this.index], `${this.players[this.index]} が回数を外した`, `${this.want} 回だった。`);
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class HoleGame {
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
    this.hole.position.set((Math.random() - 0.5) * 1.2, 0.32, -0.6);
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mat(0xfff4e4));
    this.ball.position.set(0, 0.5, 1.15);
    this.root.add(floor, this.hole, this.ball);
    this.world.pickables = [this.ball];
    this.drag = false;
    this.left = 6;
  }

  hud() {
    return playHud(this.players[this.index], "玉をドラッグして穴へ");
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

  update(dt) {
    if (!this.alive) return null;
    this.left -= dt;
    const dx = this.ball.position.x - this.hole.position.x;
    const dz = this.ball.position.z - this.hole.position.z;
    if (dx * dx + dz * dz < 0.11) {
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.reset();
      return { hud: this.hud() };
    }
    if (this.left <= 0) {
      this.alive = false;
      this.bus.boom();
      return lose(this.players[this.index], `${this.players[this.index]} が穴を外した`, "時間切れ。");
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

export class RopeGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
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
    this.need = 3;
    this.got = 0;
    this.cool = 0;
    return this.hud();
  }

  hud() {
    return playHud(this.players[this.index], "縄が足下に来たら跳べ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down" || this.cool > 0) return;
    this.jump = true;
  }

  update(dt) {
    if (!this.alive) return null;
    this.t += dt;
    this.cool = Math.max(0, this.cool - dt);
    const ang = Math.sin(this.t * 3.2);
    this.rope.rotation.x = ang;
    this.rope.position.z = Math.sin(ang) * 0.9;
    if (this.jump) {
      this.jump = false;
      this.cool = 0.28;
      const low = Math.abs(ang) < 0.28;
      if (low) {
        this.got += 1;
        this.bus.whoosh();
        this.hero.position.y = 1.05;
        if (this.got >= this.need) {
          this.bus.chime();
          this.index = (this.index + 1) % this.players.length;
          this.got = 0;
          this.need = Math.min(5, this.need + 1);
          return { hud: this.hud() };
        }
      } else {
        this.alive = false;
        this.bus.boom();
        this.world.shake = 0.22;
        return lose(this.players[this.index], `${this.players[this.index]} が縄に掛かった`, "足下で跳ぶ。");
      }
    }
    this.hero.position.y += ((this.cool > 0.1 ? 1.05 : 0.7) - this.hero.position.y) * 8 * dt;
    return null;
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class GlowGame {
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
    this.world.camera.position.set(0, 6.8, 4.2);
    this.world.look.set(0, 0.4, 0);
    this.reset();
    return this.hud();
  }

  reset() {
    wipe(this.root);
    this.bugs = [];
    this.got = 0;
    this.spawnIn = 0.15;
    this.world.pickables = this.bugs;
  }

  hud() {
    return playHud(this.players[this.index], "蛍を3匹、消える前にタップ");
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
    this.got += 1;
    this.bus.tick();
  }

  update(dt) {
    if (!this.alive) return null;
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.got < 3) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat(0xffc857, { emissive: 0x886600 }));
      b.position.set((Math.random() - 0.5) * 2.4, 0.5 + Math.random() * 1.2, (Math.random() - 0.5) * 1.6);
      b.userData.pick = "glow-live";
      b.userData.kind = "bug";
      b.userData.life = 1.15;
      this.root.add(b);
      this.bugs.push(b);
      this.world.pickables = this.bugs;
      this.spawnIn = 0.7;
    }
    for (const b of this.bugs) {
      b.userData.life -= dt;
      b.position.y += Math.sin(b.userData.life * 8) * 0.01;
      if (b.userData.life <= 0) {
        this.alive = false;
        this.bus.boom();
        return lose(this.players[this.index], `${this.players[this.index]} が蛍を逃した`, "光が消えた。");
      }
    }
    if (this.got >= 3) {
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
