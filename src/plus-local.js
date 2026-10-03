import * as THREE from "three";
import { dare } from "./games.js";

function mat(color, extras = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.16, ...extras });
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

class Pass {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  boot(players, cam, look) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.world.camera.position.set(cam[0], cam[1], cam[2]);
    this.world.look.set(look[0], look[1], look[2]);
  }

  who() {
    return this.players[this.index];
  }

  next() {
    this.bus.chime();
    this.index = (this.index + 1) % this.players.length;
    this.deal();
    return { hud: this.hud() };
  }

  fail(lead) {
    this.alive = false;
    this.bus.boom();
    this.world.shake = 0.22;
    return lose(this.who(), `${this.who()} が外した`, lead);
  }

  canAct() {
    return false;
  }

  exit() {
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class FlashGame extends Pass {
  enter(players) {
    this.boot(players, [0, 5.8, 4.6], [0, 0.4, 0]);
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
    this.wait = 0.45 + Math.random() * 0.9;
    this.left = 0.7;
    this.show = false;
    this.hit = false;
  }

  hud() {
    return playHud(this.who(), "光ったらすぐタップ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (this.show && hit === this.orb) this.hit = true;
    else if (this.show) this.miss = true;
  }

  update(dt) {
    if (!this.alive) return null;
    if (!this.show) {
      this.wait -= dt;
      if (this.wait <= 0) {
        this.show = true;
        this.orb.visible = true;
        this.bus.tick();
      }
      return null;
    }
    this.left -= dt;
    if (this.hit) return this.next();
    if (this.miss || this.left <= 0) return this.fail("光った瞬間だけ。");
    return null;
  }
}

export class PourGame extends Pass {
  enter(players) {
    this.boot(players, [0, 4.8, 5], [0, 0.8, 0]);
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 1.2, 14, 1, true), mat(0xfff4e4));
    cup.position.y = 0.8;
    const gold = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.04, 8, 16), mat(0xffc857, { emissive: 0x553300 }));
    gold.position.y = 1.15;
    gold.rotation.x = Math.PI / 2;
    this.liq = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.2, 12), mat(0x66e0ff));
    this.liq.position.y = 0.28;
    this.root.add(cup, gold, this.liq);
    this.world.pickables = [cup];
    this.h = 0.2;
    this.stop = false;
  }

  hud() {
    return playHud(this.who(), "金の高さで止めろ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.stop = true;
  }

  update(dt) {
    if (!this.alive) return null;
    if (!this.stop) this.h += dt * 0.85;
    this.liq.scale.y = this.h / 0.2;
    this.liq.position.y = 0.18 + this.h * 0.5;
    if (this.h > 1.35) return this.fail("溢れさせた。");
    if (!this.stop) return null;
    if (this.h > 0.78 && this.h < 1.05) return this.next();
    return this.fail("金の帯で止める。");
  }
}

export class SpinGame extends Pass {
  enter(players) {
    this.boot(players, [0, 5.2, 4.8], [0, 0.4, 0]);
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.top = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.9, 12), mat(0xff5d8f));
    this.top.position.y = 0.55;
    this.root.add(this.top);
    this.world.pickables = [this.top];
    this.spd = 8;
    this.held = 0;
  }

  hud() {
    return playHud(this.who(), "タップで独楽を回せ。止まったら負け");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.spd = Math.min(14, this.spd + 3.2);
    this.bus.tick();
  }

  update(dt) {
    if (!this.alive) return null;
    this.spd = Math.max(0, this.spd - dt * 2.4);
    this.top.rotation.y += this.spd * dt;
    this.top.rotation.z = (8 - this.spd) * 0.04;
    this.held += dt;
    if (this.spd < 0.4) return this.fail("独楽が倒れた。");
    if (this.held >= 3.2) return this.next();
    return null;
  }
}

export class HighGame extends Pass {
  enter(players) {
    this.boot(players, [0, 5.6, 5.2], [0, 0.6, 0]);
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    const hs = [0.5, 0.85, 1.2].sort(() => Math.random() - 0.5);
    this.towers = hs.map((h, i) => {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.55, h, 0.55), mat(i === 1 ? 0x66e0ff : 0xff5d8f));
      t.position.set((i - 1) * 0.95, h / 2 + 0.22, 0);
      t.userData.pick = "high-live";
      t.userData.high = h === Math.max(...hs);
      this.root.add(t);
      return t;
    });
    this.world.pickables = this.towers;
    this.choice = null;
  }

  hud() {
    return playHud(this.who(), "いちばん高い塔を選べ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.high != null) this.choice = hit.userData.high;
  }

  update() {
    if (!this.alive || this.choice == null) return null;
    return this.choice ? this.next() : this.fail("高い方だった。");
  }
}

export class LastGame extends Pass {
  enter(players) {
    this.boot(players, [0, 6.2, 4], [0, 0.3, 0]);
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
    this.phase = "show";
    this.showI = 0;
    this.wait = 0.4;
    this.want = this.seq[2];
    this.choice = null;
  }

  hud() {
    return playHud(this.who(), this.phase === "show" ? "最後に光った石" : "最後の石をタップ");
  }

  pointer(p) {
    if (!this.alive || this.phase !== "pick" || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i != null) this.choice = hit.userData.i;
  }

  update(dt) {
    if (!this.alive) return null;
    if (this.phase === "show") {
      this.wait -= dt;
      this.pads.forEach((p, i) => p.material.emissive.setHex(i === this.seq[this.showI] && this.wait > 0.12 ? 0xffc857 : 0));
      if (this.wait > 0) return null;
      this.showI += 1;
      if (this.showI >= 3) {
        this.phase = "pick";
        this.pads.forEach((p) => p.material.emissive.setHex(0));
        return { hud: this.hud() };
      }
      this.wait = 0.38;
      return null;
    }
    if (this.choice == null) return null;
    return this.choice === this.want ? this.next() : this.fail("最後に光った石。");
  }
}

export class LuckyGame extends Pass {
  enter(players) {
    this.boot(players, [0, 5.2, 5], [0, 0.4, 0]);
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.bad = Math.floor(Math.random() * 3);
    this.boxes = [0, 1, 2].map((i) => {
      const g = this.world.makeGift ? this.world.makeGift() : new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), mat(0xff5d8f));
      g.position.set((i - 1) * 1.05, 0.45, 0);
      g.userData.pick = "luck-live";
      g.userData.i = i;
      this.root.add(g);
      return g;
    });
    this.world.pickables = this.boxes;
    this.choice = null;
  }

  hud() {
    return playHud(this.who(), "鬼の入っていない箱を選べ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i != null) this.choice = hit.userData.i;
  }

  update() {
    if (!this.alive || this.choice == null) return null;
    return this.choice === this.bad ? this.fail("鬼が出た。") : this.next();
  }
}

export class WaitGame extends Pass {
  enter(players) {
    this.boot(players, [0, 5.4, 4.6], [0, 0.5, 0]);
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.want = 0.9 + Math.random() * 1.1;
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), mat(0xffc857, { emissive: 0x553300 }));
    this.ball.position.y = 0.7;
    this.root.add(this.ball);
    this.world.pickables = [this.ball];
    this.phase = "show";
    this.t = 0;
    this.tapped = false;
  }

  hud() {
    const n = this.want.toFixed(1);
    return playHud(this.who(), this.phase === "show" ? `${n} 秒を覚えろ` : `${n} 秒後にタップ`);
  }

  pointer(p) {
    if (!this.alive || this.phase !== "tap" || p.type !== "down") return;
    this.tapped = true;
  }

  update(dt) {
    if (!this.alive) return null;
    this.t += dt;
    if (this.phase === "show" && this.t > 1.1) {
      this.phase = "tap";
      this.t = 0;
      this.ball.material.color.setHex(0x3a2048);
      return { hud: this.hud() };
    }
    if (this.phase !== "tap") return null;
    if (this.tapped) {
      const d = Math.abs(this.t - this.want);
      return d < 0.38 ? this.next() : this.fail(`${this.want.toFixed(1)} 秒だった。`);
    }
    if (this.t > this.want + 0.55) return this.fail("遅すぎた。");
    return null;
  }
}

export class KickGame extends Pass {
  enter(players) {
    this.boot(players, [0, 3.4, 6.2], [0, 0.5, -1]);
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat(0xfff4e4));
    this.ball.position.set(0, 0.42, 2.2);
    this.hoop = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.05, 8, 18), mat(0xffc857, { emissive: 0x553300 }));
    this.hoop.position.set(0, 0.9, -1.6);
    this.root.add(this.ball, this.hoop);
    this.world.pickables = [this.ball];
    this.kicked = false;
    this.vz = -1.15;
  }

  hud() {
    return playHud(this.who(), "近づいたらタップして蹴れ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down" || this.kicked) return;
    this.kicked = true;
    this.vz = this.ball.position.z < 1.15 && this.ball.position.z > 0.15 ? -5.2 : -1.4;
    this.bus.whoosh();
  }

  update(dt) {
    if (!this.alive) return null;
    this.ball.position.z += this.vz * dt;
    if (this.kicked && Math.abs(this.ball.position.z + 1.6) < 0.28 && Math.abs(this.ball.position.x) < 0.45) return this.next();
    if (this.ball.position.z < -2.4) return this.fail("枠を外した。");
    return null;
  }
}

export class FillGame extends Pass {
  enter(players) {
    this.boot(players, [0, 4.6, 5], [0, 0.7, 0]);
    this.deal();
    return this.hud();
  }

  deal() {
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
    return playHud(this.who(), "満杯の直前までタップ。溢れさせるな");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.n += 1;
    this.rice.scale.setScalar(1 + this.n * 0.18);
    this.rice.position.y = 0.35 + this.n * 0.08;
    this.bus.tick();
  }

  update() {
    if (!this.alive) return null;
    if (this.n === this.need) return this.next();
    if (this.n > this.need) return this.fail("溢れさせた。");
    return null;
  }
}

export class OrbitGame extends Pass {
  enter(players) {
    this.boot(players, [0, 7.2, 3.2], [0, 0.3, 0]);
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
    this.choice = null;
  }

  hud() {
    return playHud(this.who(), "いちばん手前の玉をタップ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i != null) this.choice = hit.userData.i;
  }

  update(dt) {
    if (!this.alive) return null;
    for (const o of this.orbs) {
      o.userData.a += dt * 1.5;
      o.position.set(Math.sin(o.userData.a) * 1.25, 0.5, Math.cos(o.userData.a) * 1.25);
    }
    if (this.choice == null) return null;
    const front = this.orbs.reduce((a, b) => (a.position.z > b.position.z ? a : b));
    return this.choice === front.userData.i ? this.next() : this.fail("手前の玉。");
  }
}

export class AimGame extends Pass {
  enter(players) {
    this.boot(players, [0, 6.4, 0.2], [0, 0.2, 0]);
    this.deal();
    return this.hud();
  }

  deal() {
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
    this.fire = false;
  }

  hud() {
    return playHud(this.who(), "金の中心に乗ったらタップ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    this.fire = true;
  }

  update(dt) {
    if (!this.alive) return null;
    this.ang += 3.4 * dt;
    this.dot.position.x = Math.cos(this.ang) * 0.85;
    this.dot.position.z = Math.sin(this.ang) * 0.85;
    if (!this.fire) return null;
    const d = Math.hypot(this.dot.position.x, this.dot.position.z);
    return d < 0.34 ? this.next() : this.fail("中心で止める。");
  }
}

export class SlideGame extends Pass {
  enter(players) {
    this.boot(players, [0, 6.6, 5], [0, 0.2, 0]);
    this.deal();
    return this.hud();
  }

  deal() {
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
    this.left = 5.5;
  }

  hud() {
    return playHud(this.who(), "白を金の枠へドラッグ");
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
    if (!this.alive) return null;
    this.left -= dt;
    const dx = this.box.position.x - this.slot.position.x;
    const dz = this.box.position.z - this.slot.position.z;
    if (dx * dx + dz * dz < 0.12) return this.next();
    if (this.left <= 0) return this.fail("時間切れ。");
    return null;
  }
}

export class ZipGame extends Pass {
  enter(players) {
    this.boot(players, [0, 6.6, 4], [0, 0.3, 0]);
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
    this.left = 0.95;
    this.choice = null;
  }

  hud() {
    return playHud(this.who(), "光ったマスをすぐ押せ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i != null) this.choice = hit.userData.i;
  }

  update(dt) {
    if (!this.alive) return null;
    this.left -= dt;
    if (this.choice != null) return this.choice === this.lit ? this.next() : this.fail("違うマス。");
    if (this.left <= 0) return this.fail("遅すぎた。");
    return null;
  }
}

export class TwinGame extends Pass {
  enter(players) {
    this.boot(players, [0, 6.6, 4], [0, 0.3, 0]);
    this.deal();
    return this.hud();
  }

  deal() {
    wipe(this.root);
    const cols = [0xff5d8f, 0x66e0ff, 0xffc857, 0x3ecf8e, 0xfff4e4];
    const pair = cols[Math.floor(Math.random() * cols.length)];
    this.want = pair;
    this.hits = [];
    this.orbs = [];
    for (let i = 0; i < 6; i++) {
      const c = i < 2 ? pair : cols[(cols.indexOf(pair) + 1 + (i % 3)) % cols.length];
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
    return playHud(this.who(), "同じ色の二つを続けてタップ");
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (hit?.userData.i == null || this.hits.includes(hit.userData.i)) return;
    this.hits.push(hit.userData.i);
  }

  update() {
    if (!this.alive || this.hits.length < 2) return null;
    const a = this.orbs[this.hits[0]];
    const b = this.orbs[this.hits[1]];
    return a.userData.col === this.want && b.userData.col === this.want ? this.next() : this.fail("同じ色の二つ。");
  }
}
