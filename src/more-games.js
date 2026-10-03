import * as THREE from "three";
import { dare } from "./games.js";

function mat(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.45,
    metalness: 0.2,
    ...extras,
  });
}

function lose(name, title, lead) {
  return { end: true, loser: name, title, lead, dare: dare() };
}

export class CupGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.tilt = 0;
    this.vel = 0.4;
    this.holds = 0;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.cup = this.world.makeCup();
    this.cup.position.y = 0.5;
    this.cup.scale.setScalar(1.6);
    this.root.add(this.cup);
    this.world.pickables = [this.cup];
    this.world.camera.position.set(0, 4.5, 5.2);
    return this.hud();
  }

  hud() {
    return {
      who: this.players[this.index],
      prompt: "傾いたらタップして戻せ。こぼれた番が負け",
      action: "戻す",
      canvasPlay: true,
    };
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.tilt *= 0.35;
    this.vel *= 0.4;
    this.holds += 1;
    this.bus.tick();
    if (this.holds >= 4) {
      this.holds = 0;
      this.index = (this.index + 1) % this.players.length;
      this.readyHud = true;
    }
  }

  update(dt) {
    if (!this.alive) return null;
    this.vel += (Math.random() - 0.5) * 3.2 * dt;
    this.tilt += this.vel * dt;
    this.cup.rotation.z = this.tilt;
    if (Math.abs(this.tilt) > 0.85) {
      this.alive = false;
      this.world.shake = 0.28;
      this.bus.boom();
      return lose(this.players[this.index], `${this.players[this.index]} が盃をこぼした`, "酒が卓に走った。");
    }
    if (this.readyHud) {
      this.readyHud = false;
      return { hud: this.hud() };
    }
    return null;
  }

  exit() {
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class ShuttleGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.y = 1.8;
    this.vy = 0;
    this.hits = 0;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.bird = this.world.makeShuttle();
    this.bird.position.set(0, this.y, 0.2);
    this.root.add(this.bird);
    this.world.pickables = [this.bird];
    this.world.camera.position.set(0, 4.6, 5.6);
    this.world.look.set(0, 1.2, 0);
    return this.hud();
  }

  hud() {
    return {
      who: this.players[this.index],
      prompt: "羽根をタップして継げ。落とした番が負け",
      action: "つく",
      canvasPlay: true,
    };
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const s = this.world.toScreen(this.bird.position);
    if (Math.hypot(s.x - p.x, s.y - p.y) > 90) return;
    if (this.y > 1.7) return;
    this.vy = 4.8;
    this.hits += 1;
    this.bus.whoosh();
    if (this.hits >= 3) {
      this.hits = 0;
      this.index = (this.index + 1) % this.players.length;
      this.readyHud = true;
    }
  }

  update(dt) {
    if (!this.alive) return null;
    this.vy -= 7.5 * dt;
    this.y += this.vy * dt;
    this.bird.position.y = this.y;
    this.bird.rotation.z += dt * 4;
    if (this.y < 0.35) {
      this.alive = false;
      this.world.shake = 0.25;
      this.bus.boom();
      this.world.look.set(0, 0.35, 0);
      return lose(this.players[this.index], `${this.players[this.index]} が羽根を落とした`, "羽根が卓に落ちた。");
    }
    if (this.readyHud) {
      this.readyHud = false;
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

export class DarumaGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.frozen = false;
    this.left = 1.4;
    this.moved = true;
    this.rounds = 0;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.doll = this.world.makeDaruma();
    this.doll.position.y = 0.45;
    this.doll.scale.setScalar(1.5);
    this.root.add(this.doll);
    this.world.pickables = [this.doll];
    this.world.camera.position.set(0, 4.4, 5.2);
    return this.hud();
  }

  hud() {
    return {
      who: this.players[this.index],
      prompt: this.frozen ? "動くな！　触れたら負け" : "動けるうちにスワイプ",
      action: "動く",
      canvasPlay: true,
    };
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.type === "down" || p.type === "move") {
      if (this.frozen) this.caught = true;
      else this.moved = true;
    }
  }

  update(dt) {
    if (!this.alive) return null;
    this.left -= dt;
    this.doll.rotation.y += this.frozen ? 0 : dt * 2;
    const body = this.doll.children[0];
    if (body?.material) body.material.emissive.setHex(this.frozen ? 0xff2200 : 0x114422);
    if (this.caught) {
      this.alive = false;
      this.world.shake = 0.3;
      this.bus.boom();
      return lose(this.players[this.index], `${this.players[this.index]} が動いた`, "だるまさんに見つかった。");
    }
    if (this.left > 0) return this.left < 0.25 ? { hud: this.hud() } : null;
    if (this.frozen) {
      this.frozen = false;
      this.left = 1.1 + Math.random() * 0.7;
      this.moved = false;
      this.rounds += 1;
      if (this.rounds >= 3) {
        this.rounds = 0;
        this.index = (this.index + 1) % this.players.length;
      }
      this.bus.tick();
      return { hud: this.hud() };
    }
    if (!this.moved) {
      this.alive = false;
      this.world.shake = 0.22;
      this.bus.boom();
      return lose(this.players[this.index], `${this.players[this.index]} が動けなかった`, "進まなかった。");
    }
    this.frozen = true;
    this.left = 0.8 + Math.random() * 0.7;
    this.bus.chime();
    return { hud: this.hud() };
  }

  exit() {
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class MochiGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.side = 0;
    this.wait = 0.7;
    this.hits = 0;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.pestle = this.world.makeMochi();
    this.pestle.position.y = 0.7;
    this.bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.28, 20), mat(0x4a2a18));
    this.bowl.position.y = 0.2;
    this.root.add(this.bowl, this.pestle);
    this.world.pickables = [this.pestle];
    this.world.camera.position.set(0, 4.6, 5.4);
    return this.hud();
  }

  hud() {
    const dir = this.side === 0 ? "左" : "右";
    return {
      who: this.players[this.index],
      prompt: `${dir} をタップしてつけ。違う側は負け`,
      action: "つく",
      canvasPlay: true,
    };
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down" || this.wait > 0) return;
    const left = p.x < window.innerWidth * 0.5;
    const wantLeft = this.side === 0;
    if (left !== wantLeft) this.fail = true;
    else this.hit = true;
  }

  update(dt) {
    if (!this.alive) return null;
    this.wait = Math.max(0, this.wait - dt);
    this.pestle.position.x = (this.side === 0 ? -0.55 : 0.55) * (this.wait > 0 ? 0.3 : 1);
    this.pestle.position.y = 0.7 + (this.wait > 0 ? 0.2 : 0);
    if (this.fail) {
      this.alive = false;
      this.world.shake = 0.28;
      this.bus.boom();
      return lose(this.players[this.index], `${this.players[this.index]} の杵が外れた`, "つき方が乱れた。");
    }
    if (this.hit) {
      this.hit = false;
      this.hits += 1;
      this.side = 1 - this.side;
      this.wait = 0.28;
      this.bus.tick();
      if (this.hits >= 6) {
        this.hits = 0;
        this.index = (this.index + 1) % this.players.length;
      }
      return { hud: this.hud() };
    }
    return null;
  }

  exit() {
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}
