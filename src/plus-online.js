import * as THREE from "three";
import { Race } from "./online-games.js";

function mat(color, extras = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.18, ...extras });
}

function wipe(root) {
  while (root.children.length) root.remove(root.children[0]);
}

class Arena extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  boot(players, opts, dur, cam, look) {
    this.setup(players, opts, opts.myName, dur);
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.world.camera.position.set(cam[0], cam[1], cam[2]);
    this.world.look.set(look[0], look[1], look[2]);
  }

  shareState() {
    return { duration: this.left };
  }

  canAct() {
    return false;
  }

  act(extra) {
    return this.takeScore(extra);
  }

  leave() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }

  exit() {
    this.leave();
  }
}

export class FlashRace extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 16, [0, 5.8, 4.6], [0, 0.4, 0]);
    this.winWord = "瞬間一番";
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.orb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat(0xffc857, { emissive: 0x553300 }));
    this.orb.position.set((Math.random() - 0.5) * 2, 0.6, (Math.random() - 0.5) * 1.2);
    this.orb.visible = false;
    this.orb.userData.pick = "flash-live";
    this.root.add(this.orb);
    this.world.pickables = [this.orb];
    this.wait = 0.35 + Math.random() * 0.6;
    this.show = false;
    this.leftPop = 0.65;
  }

  hud() {
    return this.hudLine("光ったらタップ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down" || !this.show) return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit === this.orb) {
      this.score += 1;
      this.bus.chime();
    } else this.bus.boom();
    this.deal();
  }

  update(dt) {
    if (this.alive) {
      if (!this.show) {
        this.wait -= dt;
        if (this.wait <= 0) {
          this.show = true;
          this.orb.visible = true;
        }
      } else {
        this.leftPop -= dt;
        if (this.leftPop <= 0) this.deal();
      }
    }
    return this.time(dt, this.hud());
  }
}

export class PourRace extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 16, [0, 4.8, 5], [0, 0.8, 0]);
    this.winWord = "注ぎ一番";
    this.reset();
    return this.hud();
  }

  reset() {
    wipe(this.root);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 1.2, 14, 1, true), mat(0xfff4e4));
    cup.position.y = 0.8;
    const gold = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.04, 8, 16), mat(0xffc857, { emissive: 0x553300 }));
    gold.position.y = 1.15;
    gold.rotation.x = Math.PI / 2;
    this.liq = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.2, 12), mat(0x66e0ff));
    this.root.add(cup, gold, this.liq);
    this.world.pickables = [cup];
    this.h = 0.2;
  }

  hud() {
    return this.hudLine("金の高さでタップ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    if (this.h > 0.78 && this.h < 1.05) {
      this.score += 1;
      this.bus.chime();
    } else this.bus.boom();
    this.reset();
  }

  update(dt) {
    if (this.alive) {
      this.h += dt * 0.9;
      this.liq.scale.y = this.h / 0.2;
      this.liq.position.y = 0.18 + this.h * 0.5;
      if (this.h > 1.35) this.reset();
    }
    return this.time(dt, this.hud());
  }
}

export class SpinRace extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 14, [0, 5.2, 4.8], [0, 0.4, 0]);
    this.winWord = "独楽一番";
    wipe(this.root);
    this.top = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.9, 12), mat(0xff5d8f));
    this.top.position.y = 0.55;
    this.root.add(this.top);
    this.world.pickables = [this.top];
    this.spd = 7;
    this.acc = 0;
    return this.hud();
  }

  hud() {
    return this.hudLine("独楽を回し続けろ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.spd = Math.min(14, this.spd + 3);
    this.bus.tick();
  }

  update(dt) {
    if (this.alive) {
      this.spd = Math.max(0, this.spd - dt * 2.5);
      this.top.rotation.y += this.spd * dt;
      this.acc += dt;
      if (this.acc > 0.45) {
        this.acc = 0;
        if (this.spd > 2) this.score += 1;
      }
      if (this.spd < 0.35) {
        this.alive = false;
        this.submitted = true;
        this.bus.boom();
        return { submitScore: this.score };
      }
    }
    return this.time(dt, this.hud());
  }
}

export class HighRace extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 14, [0, 5.6, 5.2], [0, 0.6, 0]);
    this.winWord = "高さ一番";
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    const hs = [0.5, 0.85, 1.2].sort(() => Math.random() - 0.5);
    this.towers = hs.map((h, i) => {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.55, h, 0.55), mat(0x66e0ff));
      t.position.set((i - 1) * 0.95, h / 2 + 0.22, 0);
      t.userData.pick = "high-live";
      t.userData.high = h === Math.max(...hs);
      this.root.add(t);
      return t;
    });
    this.world.pickables = this.towers;
  }

  hud() {
    return this.hudLine("高い塔を選べ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.high == null) return;
    if (hit.userData.high) {
      this.score += 1;
      this.bus.chime();
    } else this.bus.boom();
    this.deal();
  }

  update(dt) {
    return this.time(dt, this.hud());
  }
}

export class LastRace extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 16, [0, 6.2, 4], [0, 0.3, 0]);
    this.winWord = "後出し一番";
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.pads = [0, 1, 2].map((i) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.16, 14), mat(0x3a2048));
      p.position.set((i - 1) * 1.05, 0.4, 0);
      p.userData.pick = "last-live";
      p.userData.i = i;
      this.root.add(p);
      return p;
    });
    this.world.pickables = this.pads;
    this.seq = [0, 1, 2].sort(() => Math.random() - 0.5);
    this.want = this.seq[2];
    this.phase = "show";
    this.showI = 0;
    this.wait = 0.32;
  }

  hud() {
    return this.hudLine("最後に光った石");
  }

  pointer(p) {
    if (!this.alive || this.phase !== "pick" || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i == null) return;
    if (hit.userData.i === this.want) {
      this.score += 1;
      this.bus.chime();
    } else this.bus.boom();
    this.deal();
  }

  update(dt) {
    if (this.alive && this.phase === "show") {
      this.wait -= dt;
      this.pads.forEach((p, i) => p.material.emissive.setHex(i === this.seq[this.showI] && this.wait > 0.1 ? 0xffc857 : 0));
      if (this.wait <= 0) {
        this.showI += 1;
        if (this.showI >= 3) {
          this.phase = "pick";
          this.pads.forEach((p) => p.material.emissive.setHex(0));
        } else this.wait = 0.3;
      }
    }
    return this.time(dt, this.hud());
  }
}

export class LuckyRace extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 14, [0, 5.2, 5], [0, 0.4, 0]);
    this.winWord = "福一番";
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.bad = Math.floor(Math.random() * 3);
    this.boxes = [0, 1, 2].map((i) => {
      const g = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), mat(i === 1 ? 0xffc857 : 0xff5d8f));
      g.position.set((i - 1) * 1.05, 0.45, 0);
      g.userData.pick = "luck-live";
      g.userData.i = i;
      this.root.add(g);
      return g;
    });
    this.world.pickables = this.boxes;
  }

  hud() {
    return this.hudLine("鬼のいない箱");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i == null) return;
    if (hit.userData.i !== this.bad) {
      this.score += 1;
      this.bus.chime();
    } else this.bus.boom();
    this.deal();
  }

  update(dt) {
    return this.time(dt, this.hud());
  }
}

export class WaitRace extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 16, [0, 5.4, 4.6], [0, 0.5, 0]);
    this.winWord = "間一番";
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.want = 0.8 + Math.random() * 0.9;
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), mat(0xffc857, { emissive: 0x553300 }));
    this.ball.position.y = 0.7;
    this.root.add(this.ball);
    this.world.pickables = [this.ball];
    this.phase = "show";
    this.t = 0;
  }

  hud() {
    return this.hudLine(this.phase === "show" ? `${this.want.toFixed(1)}秒を覚えろ` : "その秒でタップ");
  }

  pointer(p) {
    if (!this.alive || this.phase !== "tap" || p.type !== "down") return;
    if (Math.abs(this.t - this.want) < 0.35) {
      this.score += 1;
      this.bus.chime();
    } else this.bus.boom();
    this.deal();
  }

  update(dt) {
    if (this.alive) {
      this.t += dt;
      if (this.phase === "show" && this.t > 0.9) {
        this.phase = "tap";
        this.t = 0;
        this.ball.material.color.setHex(0x3a2048);
      } else if (this.phase === "tap" && this.t > this.want + 0.5) this.deal();
    }
    return this.time(dt, this.hud());
  }
}

export class KickRace extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 16, [0, 3.4, 6.2], [0, 0.5, -1]);
    this.winWord = "蹴一番";
    this.reset();
    return this.hud();
  }

  reset() {
    wipe(this.root);
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat(0xfff4e4));
    this.ball.position.set(0, 0.42, 2.2);
    this.hoop = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.05, 8, 18), mat(0xffc857, { emissive: 0x553300 }));
    this.hoop.position.set(0, 0.9, -1.6);
    this.root.add(this.ball, this.hoop);
    this.world.pickables = [this.ball];
    this.kicked = false;
    this.vz = -1.2;
  }

  hud() {
    return this.hudLine("近づいたら蹴れ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down" || this.kicked) return;
    this.kicked = true;
    this.vz = this.ball.position.z < 1.15 && this.ball.position.z > 0.15 ? -5.2 : -1.5;
    this.bus.whoosh();
  }

  update(dt) {
    if (this.alive) {
      this.ball.position.z += this.vz * dt;
      if (this.kicked && Math.abs(this.ball.position.z + 1.6) < 0.28) {
        this.score += 1;
        this.bus.chime();
        this.reset();
      } else if (this.ball.position.z < -2.4) this.reset();
    }
    return this.time(dt, this.hud());
  }
}

export class FillRace extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 16, [0, 4.6, 5], [0, 0.7, 0]);
    this.winWord = "満杯一番";
    this.need = 5;
    this.reset();
    return this.hud();
  }

  reset() {
    wipe(this.root);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.4, 0.5, 14), mat(0x6b3a1f));
    bowl.position.y = 0.4;
    this.rice = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat(0xfff4e4));
    this.rice.position.y = 0.35;
    this.root.add(bowl, this.rice);
    this.world.pickables = [bowl];
    this.n = 0;
    this.need = 4 + Math.floor(Math.random() * 2);
  }

  hud() {
    return this.hudLine("満杯直前で止めろ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.n += 1;
    this.rice.scale.setScalar(1 + this.n * 0.18);
    this.bus.tick();
    if (this.n === this.need) {
      this.score += 1;
      this.bus.chime();
      this.reset();
    } else if (this.n > this.need) {
      this.bus.boom();
      this.reset();
    }
  }

  update(dt) {
    return this.time(dt, this.hud());
  }
}

export class OrbitRace extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 16, [0, 7.2, 3.2], [0, 0.3, 0]);
    this.winWord = "周回一番";
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.orbs = [0, 1, 2, 3].map((i) => {
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat(0x66e0ff));
      o.userData.a = (i / 4) * Math.PI * 2;
      o.userData.pick = "orbit-live";
      o.userData.i = i;
      this.root.add(o);
      return o;
    });
    this.world.pickables = this.orbs;
  }

  hud() {
    return this.hudLine("手前の玉をタップ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i == null) return;
    const front = this.orbs.reduce((a, b) => (a.position.z > b.position.z ? a : b));
    if (hit.userData.i === front.userData.i) {
      this.score += 1;
      this.bus.chime();
    } else this.bus.boom();
  }

  update(dt) {
    if (this.alive) {
      for (const o of this.orbs) {
        o.userData.a += dt * 1.55;
        o.position.set(Math.sin(o.userData.a) * 1.25, 0.5, Math.cos(o.userData.a) * 1.25);
      }
    }
    return this.time(dt, this.hud());
  }
}

export class AimRace extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 14, [0, 6.4, 0.2], [0, 0.2, 0]);
    this.winWord = "狙い一番";
    wipe(this.root);
    const dial = new THREE.Mesh(new THREE.CircleGeometry(1.15, 28), mat(0x2a1238));
    dial.rotation.x = -Math.PI / 2;
    dial.position.y = 0.32;
    const gold = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), mat(0xffc857, { emissive: 0x553300 }));
    gold.rotation.x = -Math.PI / 2;
    gold.position.y = 0.34;
    this.dot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat(0xfff4e4));
    this.dot.position.y = 0.48;
    this.root.add(dial, gold, this.dot);
    this.world.pickables = [this.dot];
    this.ang = 0;
    return this.hud();
  }

  hud() {
    return this.hudLine("金の中心でタップ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const d = Math.hypot(this.dot.position.x, this.dot.position.z);
    if (d < 0.34) {
      this.score += 1;
      this.bus.chime();
    } else this.bus.boom();
  }

  update(dt) {
    this.ang += 3.5 * dt;
    this.dot.position.x = Math.cos(this.ang) * 0.85;
    this.dot.position.z = Math.sin(this.ang) * 0.85;
    return this.time(dt, this.hud());
  }
}

export class SlideRace extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 16, [0, 6.6, 5], [0, 0.2, 0]);
    this.winWord = "隙間一番";
    this.reset();
    return this.hud();
  }

  reset() {
    wipe(this.root);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1.7, 22), mat(0x2a1238));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.3;
    this.slot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.7), mat(0xffc857, { emissive: 0x553300 }));
    this.slot.position.set((Math.random() - 0.5) * 1.2, 0.34, -0.55);
    this.box = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.28, 0.48), mat(0xfff4e4));
    this.box.position.set(0, 0.48, 1.1);
    this.root.add(floor, this.slot, this.box);
    this.world.pickables = [this.box];
    this.drag = false;
  }

  hud() {
    return this.hudLine("白を金へドラッグ");
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.type === "down") this.drag = true;
    if (p.type === "up") this.drag = false;
    if (this.drag && p.gx != null) {
      this.box.position.x = THREE.MathUtils.clamp(p.gx, -1.4, 1.4);
      this.box.position.z = THREE.MathUtils.clamp(p.gz ?? 0, -1.3, 1.3);
    }
  }

  update(dt) {
    if (this.alive) {
      const dx = this.box.position.x - this.slot.position.x;
      const dz = this.box.position.z - this.slot.position.z;
      if (dx * dx + dz * dz < 0.12) {
        this.score += 1;
        this.bus.chime();
        this.reset();
      }
    }
    return this.time(dt, this.hud());
  }
}

export class ZipRace extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 14, [0, 6.6, 4], [0, 0.3, 0]);
    this.winWord = "早押し一番";
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.pads = [];
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.7), mat(0x3a2048));
      p.position.set((i % 2) * 1.05 - 0.52, 0.4, Math.floor(i / 2) * 1.05 - 0.52);
      p.userData.pick = "zip-live";
      p.userData.i = i;
      this.root.add(p);
      this.pads.push(p);
    }
    this.world.pickables = this.pads;
    this.lit = Math.floor(Math.random() * 4);
    this.pads[this.lit].material.emissive.setHex(0xffc857);
  }

  hud() {
    return this.hudLine("光ったマスを押せ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i == null) return;
    if (hit.userData.i === this.lit) {
      this.score += 1;
      this.bus.chime();
    } else this.bus.boom();
    this.deal();
  }

  update(dt) {
    return this.time(dt, this.hud());
  }
}

export class TwinRace extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 16, [0, 6.6, 4], [0, 0.3, 0]);
    this.winWord = "両手一番";
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    const cols = [0xff5d8f, 0x66e0ff, 0xffc857, 0x3ecf8e, 0xfff4e4];
    this.want = cols[Math.floor(Math.random() * cols.length)];
    this.hits = [];
    this.orbs = [];
    for (let i = 0; i < 6; i++) {
      const c = i < 2 ? this.want : cols[(cols.indexOf(this.want) + 1 + (i % 3)) % cols.length];
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), mat(c));
      const a = (i / 6) * Math.PI * 2;
      o.position.set(Math.cos(a) * 1.35, 0.5, Math.sin(a) * 1.35);
      o.userData.pick = "twin-live";
      o.userData.col = c;
      o.userData.i = i;
      this.root.add(o);
      this.orbs.push(o);
    }
    this.world.pickables = this.orbs;
  }

  hud() {
    return this.hudLine("同じ色を二つ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i == null || this.hits.includes(hit.userData.i)) return;
    this.hits.push(hit.userData.i);
    if (this.hits.length >= 2) {
      const a = this.orbs[this.hits[0]];
      const b = this.orbs[this.hits[1]];
      if (a.userData.col === this.want && b.userData.col === this.want) {
        this.score += 1;
        this.bus.chime();
      } else this.bus.boom();
      this.deal();
    }
  }

  update(dt) {
    return this.time(dt, this.hud());
  }
}

export class DashGame extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 16, [0, 4.2, 6], [0, 0.4, -1]);
    this.winWord = "走一番";
    wipe(this.root);
    this.hero = this.world.makeHero();
    this.hero.position.set(0, 0, 1.4);
    this.gates = [];
    for (let i = 0; i < 10; i++) {
      const g = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 8, 16), mat(0xffc857, { emissive: 0x553300 }));
      g.position.set((Math.random() - 0.5) * 1.4, 0.7, -0.4 - i * 1.6);
      this.root.add(g);
      this.gates.push({ mesh: g, scored: false });
    }
    this.root.add(this.hero);
    this.world.pickables = [this.hero];
    this.drag = null;
    return this.hud();
  }

  hud() {
    return this.hudLine("ドラッグで輪をくぐれ");
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.type === "down" || p.type === "move") this.drag = p.gx != null ? { x: p.gx, z: p.gz } : this.drag;
    if (p.type === "up") this.drag = null;
  }

  update(dt) {
    if (this.alive) {
      this.hero.position.z -= 2.4 * dt;
      if (this.drag) {
        this.hero.position.x += (this.drag.x - this.hero.position.x) * 6 * dt;
      }
      for (const g of this.gates) {
        if (!g.scored && Math.abs(this.hero.position.z - g.mesh.position.z) < 0.18) {
          g.scored = true;
          if (Math.abs(this.hero.position.x - g.mesh.position.x) < 0.5) {
            this.score += 1;
            this.bus.tick();
          }
        }
      }
      this.world.camera.position.set(this.hero.position.x, 4.2, this.hero.position.z + 4.6);
      this.world.look.set(this.hero.position.x, 0.4, this.hero.position.z - 1);
    }
    return this.time(dt, this.hud());
  }

  exit() {
    this.world.camera.position.copy(this.world.homeCam);
    this.leave();
  }
}

export class FallGame extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 16, [0, 6, 5.2], [0, 0.8, 0]);
    this.winWord = "落物一番";
    wipe(this.root);
    this.falls = [];
    this.spawnIn = 0.1;
    this.world.pickables = this.falls;
    return this.hud();
  }

  hud() {
    return this.hudLine("落ちる鬼をタップ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (!hit || hit.userData.kind !== "fall") return;
    this.root.remove(hit);
    this.falls = this.falls.filter((f) => f !== hit);
    this.world.pickables = this.falls;
    this.score += 1;
    this.bus.tick();
  }

  update(dt) {
    if (this.alive) {
      this.spawnIn -= dt;
      if (this.spawnIn <= 0) {
        const o = this.world.makeOni();
        o.scale.setScalar(0.55);
        o.position.set((Math.random() - 0.5) * 2.4, 2.8, 0);
        o.userData.pick = "fall-live";
        o.userData.kind = "fall";
        this.root.add(o);
        this.falls.push(o);
        this.world.pickables = this.falls;
        this.spawnIn = 0.5;
      }
      const keep = [];
      for (const f of this.falls) {
        f.position.y -= 1.9 * dt;
        if (f.position.y < 0.25) this.root.remove(f);
        else keep.push(f);
      }
      this.falls = keep;
      this.world.pickables = this.falls;
    }
    return this.time(dt, this.hud());
  }
}

export class ToggleGame extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 16, [0, 6.8, 4], [0, 0.3, 0]);
    this.winWord = "スイッチ一番";
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.pads = [];
    for (let i = 0; i < 4; i++) {
      const on = Math.random() < 0.5;
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.7), mat(on ? 0xffc857 : 0x3a2048));
      p.position.set((i % 2) * 1.05 - 0.52, 0.4, Math.floor(i / 2) * 1.05 - 0.52);
      p.userData.pick = "tog-live";
      p.userData.on = on;
      this.root.add(p);
      this.pads.push(p);
    }
    this.world.pickables = this.pads;
  }

  hud() {
    return this.hudLine("全部金にしろ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (!hit || hit.userData.on == null) return;
    hit.userData.on = !hit.userData.on;
    hit.material.color.setHex(hit.userData.on ? 0xffc857 : 0x3a2048);
    this.bus.tick();
    if (this.pads.every((x) => x.userData.on)) {
      this.score += 1;
      this.bus.chime();
      this.deal();
    }
  }

  update(dt) {
    return this.time(dt, this.hud());
  }
}

export class SnipeGame extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 16, [0, 3.2, 7.2], [0, 0.8, -2]);
    this.winWord = "狙撃一番";
    wipe(this.root);
    this.foes = [];
    this.spawnIn = 0.15;
    this.world.pickables = this.foes;
    return this.hud();
  }

  hud() {
    return this.hudLine("遠くの鬼をタップ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (!hit || hit.userData.kind !== "snipe") return;
    this.root.remove(hit);
    this.foes = this.foes.filter((f) => f !== hit);
    this.world.pickables = this.foes;
    this.score += 1;
    this.bus.chime();
  }

  update(dt) {
    if (this.alive) {
      this.spawnIn -= dt;
      if (this.spawnIn <= 0) {
        const o = this.world.makeOni();
        o.scale.setScalar(0.45);
        o.position.set((Math.random() - 0.5) * 2.6, 0, -1.4 - Math.random() * 3.2);
        o.userData.pick = "snipe-live";
        o.userData.kind = "snipe";
        this.root.add(o);
        this.foes.push(o);
        this.world.pickables = this.foes;
        this.spawnIn = 0.7;
      }
      const keep = [];
      for (const f of this.foes) {
        f.position.z += 1.4 * dt;
        if (f.position.z > 1.2) this.root.remove(f);
        else keep.push(f);
      }
      this.foes = keep;
      this.world.pickables = this.foes;
    }
    return this.time(dt, this.hud());
  }
}

export class SwarmGame extends Arena {
  enter(players, opts = {}) {
    this.boot(players, opts, 16, [0, 7, 4], [0, 0.3, 0]);
    this.winWord = "掃討一番";
    wipe(this.root);
    this.bugs = [];
    for (let i = 0; i < 8; i++) this.spawn();
    this.world.pickables = this.bugs;
    return this.hud();
  }

  spawn() {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), mat(0xb42318, { emissive: 0x440000 }));
    b.position.set((Math.random() - 0.5) * 2.4, 0.45, (Math.random() - 0.5) * 2.2);
    b.userData.pick = "swarm-live";
    b.userData.kind = "swarm";
    b.userData.a = Math.random() * 6;
    this.root.add(b);
    this.bugs.push(b);
  }

  hud() {
    return this.hudLine("小さな鬼を掃討");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (!hit || hit.userData.kind !== "swarm") return;
    this.root.remove(hit);
    this.bugs = this.bugs.filter((b) => b !== hit);
    this.score += 1;
    this.bus.tick();
    this.spawn();
    this.world.pickables = this.bugs;
  }

  update(dt) {
    if (this.alive) {
      for (const b of this.bugs) {
        b.userData.a += dt * 2;
        b.position.x += Math.sin(b.userData.a) * 0.6 * dt;
        b.position.z += Math.cos(b.userData.a * 1.3) * 0.6 * dt;
      }
      this.world.pickables = this.bugs;
    }
    return this.time(dt, this.hud());
  }
}
