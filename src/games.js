import * as THREE from "three";

const DARES = [
  "10秒で自分を盛り直して自己紹介",
  "隣の人の良いところを3つ言う",
  "今の気持ちを色で表す",
  "好きな食べ物を熱く語る",
  "変顔を3秒キープ",
  "今シーズンの推しを発表",
  "モノマネをひとつ",
  "みんなに質問をひとつ投げる",
  "次の人のドリンクを取りに立つ（任意）",
  "拍手しながら一句ひねる",
];

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

export function dare() {
  return DARES[Math.floor(Math.random() * DARES.length)];
}

export class BombGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
    this.bomb = world.makeBomb();
    this.bomb.scale.setScalar(1.7);
    this.bomb.position.y = 0.95;
    this.root.add(this.bomb);
    this.alive = false;
    this.fuse = 0;
    this.index = 0;
  }

  enter(players, opts = {}) {
    this.players = players;
    this.index = 0;
    this.alive = true;
    this.authority = opts.authority !== false;
    this.fuse = opts.fuse ?? rand(7, 16);
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.world.pickables = [this.bomb];
    this.bomb.userData.pick = "bomb-live";
    this.world.camera.position.set(0, 4.2, 5.4);
    return this.hud();
  }

  hud() {
    return {
      who: this.players[this.index],
      prompt: "爆弾をタップして隣へ回せ",
      action: "渡す",
    };
  }

  collect() {
    return { kind: "pass" };
  }

  act() {
    return this.pass();
  }

  pass() {
    if (!this.alive) return null;
    this.bus.tick();
    this.index = (this.index + 1) % this.players.length;
    this.bomb.rotation.y += 0.8;
    return this.hud();
  }

  update(dt) {
    if (!this.alive) return null;
    this.fuse -= dt;
    this.bomb.rotation.y += dt * (this.fuse < 4 ? 4 : 1.4);
    const s = 1.7 + Math.sin(this.world.clock.elapsedTime * (this.fuse < 3 ? 18 : 6)) * 0.06;
    this.bomb.scale.setScalar(s);
    if (this.fuse <= 0) {
      this.alive = false;
      this.world.shake = 0.55;
      this.bus.boom();
      if (!this.authority) return null;
      return {
        end: true,
        loser: this.players[this.index],
        title: `${this.players[this.index]} の番で爆発`,
        lead: "卓が揺れた。負けた人は指令をどうぞ。",
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

export class BottleGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
    this.bottle = world.makeBottle();
    this.bottle.position.y = 0.3;
    this.root.add(this.bottle);
    this.spin = 0;
    this.spinning = false;
    this.labels = [];
  }

  enter(players, opts = {}) {
    this.players = players;
    this.authority = opts.authority !== false;
    this.spin = 0;
    this.spinning = false;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.world.pickables = [this.bottle];
    this.bottle.userData.pick = "bottle-live";
    this.world.camera.position.set(0, 7.2, 0.2);
    this.world.look.set(0, 0.2, 0);
    this.placeSeats();
    return {
      who: "みんな",
      prompt: "瓶を回して、止まった人に指令",
      action: "回す",
    };
  }

  placeSeats() {
    for (const l of this.labels) this.root.remove(l);
    this.labels = [];
    const n = this.players.length;
    this.players.forEach((name, i) => {
      const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      const token = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), mat(i % 2 ? 0xff5d8f : 0xffc857));
      token.position.set(Math.cos(ang) * 2.35, 0.48, Math.sin(ang) * 2.35);
      this.root.add(token);
      this.labels.push(token);
    });
  }

  collect() {
    return { kind: "spin", spin: rand(10, 18) };
  }

  act(extra) {
    this.startSpin(extra?.spin);
    return null;
  }

  startSpin(amount) {
    if (this.spinning) return false;
    this.spinning = true;
    this.spin = amount ?? rand(10, 18);
    this.bus.whoosh();
    return true;
  }

  update(dt) {
    if (!this.spinning) return null;
    this.bottle.rotation.y += this.spin * dt;
    this.spin *= Math.pow(0.22, dt);
    if (this.spin < 0.12) {
      this.spinning = false;
      if (!this.authority) return null;
      const n = this.players.length;
      const ang = ((this.bottle.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const slice = (Math.PI * 2) / n;
      const idx = Math.round(ang / slice) % n;
      const name = this.players[idx];
      this.bus.chime();
      return {
        end: true,
        loser: name,
        title: `瓶は ${name} を指した`,
        lead: "指名された人は、この指令を。",
        dare: dare(),
      };
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

export class DiceGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
    this.dice = [];
    this.vel = [];
    this.rolling = false;
    this.settle = 0;
    this.index = 0;
    this.rolls = [];
  }

  enter(players, opts = {}) {
    this.players = players;
    this.authority = opts.authority !== false;
    this.index = 0;
    this.rolls = [];
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.dice = [this.cube(-0.45), this.cube(0.45)];
    this.dice.forEach((d) => this.root.add(d));
    this.world.pickables = this.dice;
    this.world.camera.position.set(0, 5.6, 5.2);
    return this.hud();
  }

  cube(x) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), mat(0xfff6ea));
    m.position.set(x, 0.7, 0);
    m.castShadow = true;
    m.userData.pick = "dice-live";
    return m;
  }

  hud() {
    return {
      who: this.players[this.index],
      prompt: "サイコロを振れ。高い目の合計が勝ち",
      action: "振る",
    };
  }

  roll(vels) {
    if (this.rolling) return null;
    this.rolling = true;
    this.settle = 1.15;
    this.vel = (vels || this.dice.map(() => [rand(-8, 8), rand(-8, 8), rand(-8, 8)])).map(
      (v) => new THREE.Vector3(v[0], v[1], v[2])
    );
    this.bus.whoosh();
    return this.hud();
  }

  faceValue(mesh) {
    mesh.updateMatrixWorld();
    const dirs = [
      { v: new THREE.Vector3(0, 1, 0), n: 1 },
      { v: new THREE.Vector3(0, -1, 0), n: 6 },
      { v: new THREE.Vector3(1, 0, 0), n: 3 },
      { v: new THREE.Vector3(-1, 0, 0), n: 4 },
      { v: new THREE.Vector3(0, 0, 1), n: 2 },
      { v: new THREE.Vector3(0, 0, -1), n: 5 },
    ];
    let best = dirs[0];
    let maxY = -99;
    const tmp = new THREE.Vector3();
    for (const d of dirs) {
      tmp.copy(d.v).applyQuaternion(mesh.quaternion);
      if (tmp.y > maxY) {
        maxY = tmp.y;
        best = d;
      }
    }
    return best.n;
  }

  update(dt) {
    if (!this.rolling) return null;
    this.dice.forEach((d, i) => {
      d.rotation.x += this.vel[i].x * dt;
      d.rotation.y += this.vel[i].y * dt;
      d.rotation.z += this.vel[i].z * dt;
      this.vel[i].multiplyScalar(Math.pow(0.08, dt));
    });
    this.settle -= dt;
    if (this.settle > 0) return null;
    this.rolling = false;
    if (!this.authority) return null;
    const total = this.dice.reduce((s, d) => s + this.faceValue(d), 0);
    this.rolls.push({ name: this.players[this.index], total });
    this.bus.tick();
    this.index += 1;
    if (this.index < this.players.length) return { hud: this.hud() };
    this.rolls.sort((a, b) => b.total - a.total);
    const win = this.rolls[0];
    const line = this.rolls.map((r) => `${r.name} ${r.total}`).join("  /  ");
    this.bus.chime();
    return {
      end: true,
      winner: win.name,
      title: `${win.name} の勝ち`,
      lead: line,
      dare: `${this.rolls[this.rolls.length - 1].name} への指令：${dare()}`,
    };
  }

  exit() {
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class StackGame {
  constructor(world, bus) {
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
    this.blocks = [];
    this.current = null;
    this.dir = 1;
    this.axis = "x";
    this.speed = 2.4;
    this.size = { x: 2.2, z: 2.2 };
    this.alive = false;
    this.height = 0;
  }

  enter(players, opts = {}) {
    this.players = players;
    this.authority = opts.authority !== false;
    this.index = 0;
    this.alive = true;
    this.size = { x: 2.2, z: 2.2 };
    this.height = 0;
    this.axis = "x";
    this.speed = 2.4;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    this.blocks = [];
    const base = this.makeBlock(2.2, 2.2, 0xffc857);
    base.position.set(0, 0.42, 0);
    this.root.add(base);
    this.blocks.push(base);
    this.spawn();
    this.world.pickables = [this.current];
    this.world.camera.position.set(3.4, 5.2, 5.6);
    return this.hud();
  }

  makeBlock(x, z, color) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x, 0.28, z), mat(color));
    m.castShadow = true;
    m.userData.pick = "stack-live";
    return m;
  }

  hud() {
    return {
      who: this.players[this.index],
      prompt: `塔 ${this.blocks.length} 段。タイミングで置け`,
      action: "置く",
    };
  }

  spawn() {
    const colors = [0xff5d8f, 0x66e0ff, 0xffffff, 0xffc857];
    const y = 0.42 + this.blocks.length * 0.28;
    this.current = this.makeBlock(this.size.x, this.size.z, colors[this.blocks.length % 4]);
    this.current.position.set(this.axis === "x" ? -3.2 : 0, y, this.axis === "z" ? -3.2 : 0);
    this.root.add(this.current);
    this.world.pickables = [this.current];
    this.dir = 1;
  }

  collect() {
    return { kind: "drop", pos: this.current?.position[this.axis] };
  }

  act(extra) {
    return this.drop(extra?.pos);
  }

  drop(pos) {
    if (!this.alive || !this.current) return null;
    const prev = this.blocks[this.blocks.length - 1];
    const axis = this.axis;
    if (typeof pos === "number") this.current.position[axis] = pos;
    const delta = this.current.position[axis] - prev.position[axis];
    const overlap = this.size[axis] - Math.abs(delta);
    if (overlap < 0.08) {
      this.alive = false;
      this.world.shake = 0.4;
      this.bus.boom();
      return {
        end: true,
        loser: this.players[this.index],
        title: `${this.players[this.index]} が崩した`,
        lead: `${this.blocks.length} 段まで積んだ。`,
        dare: dare(),
      };
    }
    this.size[axis] = overlap;
    const center = (this.current.position[axis] + prev.position[axis]) / 2;
    this.root.remove(this.current);
    const placed = this.makeBlock(this.size.x, this.size.z, this.current.material.color.getHex());
    placed.position.copy(this.current.position);
    placed.position[axis] = center;
    this.root.add(placed);
    this.blocks.push(placed);
    this.bus.tick();
    this.index = (this.index + 1) % this.players.length;
    this.axis = axis === "x" ? "z" : "x";
    this.speed = Math.min(5.2, this.speed + 0.12);
    this.spawn();
    this.world.camera.position.y += 0.12;
    return { hud: this.hud() };
  }

  update(dt) {
    if (!this.alive || !this.current) return null;
    const axis = this.axis;
    this.current.position[axis] += this.dir * this.speed * dt;
    if (Math.abs(this.current.position[axis]) > 3.3) this.dir *= -1;
    return null;
  }

  exit() {
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}
