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

export class TaikoGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.hits = 0;
    this.beatIn = 0.55;
    this.window = 0;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.drum = this.world.makeDrum();
    this.drum.scale.setScalar(1.6);
    this.drum.position.y = 0.4;
    this.drum.userData.pick = "taiko-live";
    this.root.add(this.drum);
    this.world.pickables = [this.drum];
    this.world.camera.position.set(0, 4.6, 5.4);
    return this.hud();
  }

  hud() {
    return {
      who: this.players[this.index],
      prompt: "赤く膨らんだ瞬間に打て。外すと負け",
      action: "打つ",
      canvasPlay: true,
    };
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.struck = true;
  }

  miss(title) {
    this.alive = false;
    this.world.shake = 0.3;
    this.bus.boom();
    return {
      end: true,
      loser: this.players[this.index],
      title,
      lead: "拍子が乱れた。",
      dare: dare(),
    };
  }

  update(dt) {
    if (!this.alive) return null;
    this.window = Math.max(0, this.window - dt);
    this.beatIn -= dt;
    const skin = this.drum.children[0];
    if (this.beatIn <= 0) {
      this.beatIn = 0.62;
      this.window = 0.22;
      this.bus.tick();
    }
    const hot = this.window > 0;
    this.drum.scale.setScalar(hot ? 1.85 : 1.6);
    if (skin?.material) skin.material.emissive.setHex(hot ? 0xffc857 : 0x000000);
    if (this.struck) {
      this.struck = false;
      if (!hot) return this.miss(`${this.players[this.index]} が空振り`);
      this.hits += 1;
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.window = 0;
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

export class ShadowGame {
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
    this.world.camera.position.set(0, 5.6, 5.2);
    this.world.look.set(0, 0.4, 0);
    return this.hud();
  }

  shape(kind, color) {
    if (kind === "box") return new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), mat(color));
    if (kind === "cone") return new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.7, 10), mat(color));
    return new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), mat(color));
  }

  deal() {
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    const kinds = ["sphere", "box", "cone"];
    const colors = [0xff5d8f, 0x66e0ff, 0xffc857];
    this.answer = kinds[Math.floor(Math.random() * 3)];
    this.pieces = kinds.map((kind, i) => {
      const m = this.shape(kind, colors[i]);
      m.position.set((i - 1) * 1.2, 0.55, 0.6);
      m.userData.pick = "shadow-live";
      m.userData.kind = kind;
      this.root.add(m);
      return m;
    });
    const sh = this.shape(this.answer, 0x111018);
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(0, 0.34, -1.3);
    sh.scale.set(1.2, 1.2, 0.08);
    sh.userData.pick = "shadow-floor";
    this.root.add(sh);
    this.world.pickables = this.pieces;
  }

  hud() {
    return {
      who: this.players[this.index],
      prompt: "床の影と同じ形を選べ",
      action: "選ぶ",
      canvasPlay: true,
    };
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.kind) this.choice = hit.userData.kind;
  }

  update() {
    if (!this.alive || !this.choice) return null;
    const kind = this.choice;
    this.choice = null;
    if (kind === this.answer) {
      this.bus.chime();
      this.index = (this.index + 1) % this.players.length;
      this.deal();
      return { hud: this.hud() };
    }
    this.alive = false;
    this.world.shake = 0.28;
    this.bus.boom();
    return {
      end: true,
      loser: this.players[this.index],
      title: `${this.players[this.index]} が影を外した`,
      lead: "形が違っていた。",
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

export class FanGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.spin = 6.8;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.fan = this.world.makeFan();
    this.fan.scale.setScalar(1.8);
    this.fan.position.y = 0.5;
    this.root.add(this.fan);
    this.world.pickables = [this.fan];
    this.world.camera.position.set(0, 4.4, 5.2);
    this.last = null;
    return this.hud();
  }

  hud() {
    return {
      who: this.players[this.index],
      prompt: "スワイプであおげ。止まった番が負け",
      action: "あおぐ",
      canvasPlay: true,
    };
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.type === "down") this.last = { x: p.x, y: p.y };
    if (p.type === "move" && this.last) {
      const spd = Math.hypot(p.x - this.last.x, p.y - this.last.y);
      this.last = { x: p.x, y: p.y };
      if (spd > 14) {
        this.spin = Math.min(14, this.spin + spd * 0.08);
        this.bus.tick();
      }
    }
    if (p.type === "up") this.last = null;
  }

  update(dt) {
    if (!this.alive) return null;
    this.spin = Math.max(0, this.spin - dt * 1.7);
    this.fan.rotation.y += this.spin * dt;
    if (this.spin <= 0.15) {
      this.alive = false;
      this.world.shake = 0.22;
      this.bus.boom();
      return {
        end: true,
        loser: this.players[this.index],
        title: `${this.players[this.index]} の番で扇が止まった`,
        lead: "風が落ちた。",
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

export class BellGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.need = 2;
    this.count = 0;
    this.phase = "show";
    this.left = 1.6;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.bell = this.world.makeBell();
    this.bell.scale.setScalar(1.8);
    this.bell.position.y = 0.5;
    this.root.add(this.bell);
    this.world.pickables = [this.bell];
    this.world.camera.position.set(0, 4.4, 5.2);
    this.roll();
    return this.hud();
  }

  roll() {
    this.need = 2 + Math.floor(Math.random() * 4);
    this.count = 0;
    this.phase = "show";
    this.left = 1.4;
    this.shown = 0;
  }

  hud() {
    const lead =
      this.phase === "show"
        ? `鈴が ${this.need} 回鳴る。よく聞け`
        : `同じ回数だけタップ　${this.count} / ${this.need}`;
    return {
      who: this.players[this.index],
      prompt: lead,
      action: "鳴らす",
      canvasPlay: true,
    };
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || this.phase !== "play" || p.type !== "down") return;
    this.count += 1;
    this.bell.rotation.z = (Math.random() - 0.5) * 0.4;
    this.bus.tick();
  }

  update(dt) {
    if (!this.alive) return null;
    this.bell.rotation.z *= 0.85;
    this.left -= dt;
    if (this.phase === "show") {
      if (this.left <= 0) {
        this.shown += 1;
        this.bus.chime();
        this.bell.scale.setScalar(2.1);
        this.left = 0.38;
        if (this.shown >= this.need) {
          this.phase = "play";
          this.left = 2.4;
          return { hud: this.hud() };
        }
      }
      this.bell.scale.setScalar(1.8 + Math.max(0, 0.2 - this.left) * 2);
      return null;
    }
    if (this.left <= 0) {
      if (this.count === this.need) {
        this.bus.chime();
        this.index = (this.index + 1) % this.players.length;
        this.roll();
        return { hud: this.hud() };
      }
      this.alive = false;
      this.world.shake = 0.28;
      this.bus.boom();
      return {
        end: true,
        loser: this.players[this.index],
        title: `${this.players[this.index]} の鈴が狂った`,
        lead: `正解は ${this.need} 回、実際は ${this.count} 回`,
        dare: dare(),
      };
    }
    this.hudAcc = (this.hudAcc || 0) + dt;
    if (this.hudAcc > 0.2) {
      this.hudAcc = 0;
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
