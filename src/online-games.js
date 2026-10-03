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

function rankFinish(players, tallies, titleVerb) {
  const ranked = players
    .map((name) => ({ name, n: tallies[name] ?? 0 }))
    .sort((a, b) => b.n - a.n);
  const win = ranked[0];
  const lose = ranked[ranked.length - 1];
  return {
    end: true,
    winner: win.name,
    title: `${win.name} が${titleVerb}`,
    lead: ranked.map((r) => `${r.name} ${r.n}点`).join("  /  "),
    dare: ranked.length > 1 ? `${lose.name} への指令：${dare()}` : "",
  };
}

export class Race {
  setup(players, opts, myName, duration = 16) {
    this.players = players;
    this.myName = myName || players[0];
    this.authority = opts.authority !== false;
    this.left = opts.duration ?? duration;
    this.score = 0;
    this.submitted = false;
    this.tallies = {};
    this.alive = true;
    this.hudAcc = 0;
  }

  hudLine(lead) {
    const wait = this.submitted ? "集計待ち" : `残り ${Math.max(0, Math.ceil(this.left))} 秒`;
    return {
      who: this.myName,
      prompt: `${lead}　${this.score}点　${wait}`,
      action: "画面で操作",
      canvasPlay: true,
    };
  }

  time(dt, hud) {
    if (this.submitted) return null;
    this.left -= dt;
    this.hudAcc += dt;
    if (this.left <= 0) {
      this.submitted = true;
      this.alive = false;
      return { submitScore: this.score };
    }
    if (this.hudAcc > 0.25) {
      this.hudAcc = 0;
      return { hud };
    }
    return null;
  }

  takeScore(extra) {
    if (extra?.kind !== "score") return null;
    this.tallies[extra.name] = extra.score;
    const n = Object.keys(this.tallies).length;
    if (n < this.players.length) {
      return { hud: { ...this.hudLine("記録待ち"), prompt: `記録 ${n}/${this.players.length}` } };
    }
    if (!this.authority) return null;
    return rankFinish(this.players, this.tallies, this.winWord || "一位");
  }
}

export class FlickGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 18);
    this.winWord = "的中一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mat(0xfff4e4));
    this.resetBall();
    this.hoop = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 10, 24), mat(0xffc857, { emissive: 0x553300 }));
    this.hoop.position.set(0, 1.7, -2.2);
    this.vel = new THREE.Vector3();
    this.flying = false;
    this.drag = null;
    this.root.add(this.ball, this.hoop);
    this.world.pickables = [this.ball];
    this.world.camera.position.set(0, 4.8, 6.2);
    this.world.look.set(0, 0.8, -0.4);
    return this.hud();
  }

  shareState() {
    return { duration: 18 };
  }

  hud() {
    return this.hudLine("引っ張って離す。輪に通せ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || this.flying) return;
    if (p.type === "down") this.drag = { x: p.gx ?? 0, z: p.gz ?? 1.2 };
    if (p.type === "up" && this.drag) {
      const x = p.gx ?? this.drag.x;
      const z = p.gz ?? this.drag.z;
      this.vel.set((this.drag.x - x) * 3.2, 3.4 + Math.max(0, this.drag.z - z) * 1.4, (this.drag.z - z) * 4.2);
      this.flying = true;
      this.drag = null;
      this.bus.whoosh();
    }
  }

  resetBall() {
    this.ball.position.set(0, 0.52, 1.6);
    this.flying = false;
    this.vel.set(0, 0, 0);
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    this.hoop.position.x = Math.sin(this.world.clock.elapsedTime * 1.1) * 1.35;
    if (this.flying) {
      this.ball.position.addScaledVector(this.vel, dt);
      this.vel.y -= 9 * dt;
      const d = this.ball.position.distanceTo(this.hoop.position);
      if (d < 0.62 && this.vel.z < 0) {
        this.score += 1;
        this.bus.chime();
        this.world.shake = 0.12;
        this.resetBall();
      } else if (this.ball.position.y < 0.2 || this.ball.position.z < -4.5) {
        this.resetBall();
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

export class SlashGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "一閃一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.fruits = [];
    this.spawnIn = 0.1;
    this.last = null;
    this.world.pickables = [];
    this.world.camera.position.set(0, 4.2, 6);
    this.world.look.set(0, 1.2, 0);
    return this.hud();
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("画面をなぞって切れ");
  }

  canAct() {
    return false;
  }

  spawn() {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.32, 0),
      mat(Math.random() > 0.5 ? 0xff5d8f : 0xffc857)
    );
    mesh.position.set((Math.random() - 0.5) * 3.2, -0.2, (Math.random() - 0.4) * 1.4);
    mesh.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 0.6, 4.2 + Math.random(), 0);
    mesh.userData.alive = true;
    this.root.add(mesh);
    this.fruits.push(mesh);
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.type === "down") {
      this.last = { x: p.x, y: p.y };
      return;
    }
    if (p.type !== "move" || !this.last) return;
    const speed = Math.hypot(p.x - this.last.x, p.y - this.last.y);
    this.last = { x: p.x, y: p.y };
    if (speed < 10) return;
    for (const f of this.fruits) {
      if (!f.userData.alive) continue;
      const s = this.world.toScreen(f.position);
      if (Math.hypot(s.x - p.x, s.y - p.y) < 54) {
        f.userData.alive = false;
        f.visible = false;
        this.score += 1;
        this.bus.tick();
      }
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.alive) {
      this.spawn();
      this.spawnIn = 0.55;
    }
    for (const f of this.fruits) {
      f.position.addScaledVector(f.userData.vel, dt);
      f.userData.vel.y -= 6.5 * dt;
      f.rotation.x += dt * 4;
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

export class SteerGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 20);
    this.winWord = "最長走行";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), mat(0x66e0ff, { emissive: 0x113344 }));
    this.ball.position.set(0, 0.48, 0);
    this.targetX = 0;
    this.passed = 0;
    this.gates = [];
    for (let i = 1; i <= 24; i++) {
      const g = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 8, 20), mat(0xffc857));
      g.position.set(Math.sin(i * 0.9) * 1.4, 0.7, -i * 3.2);
      g.rotation.y = Math.PI / 2;
      this.root.add(g);
      this.gates.push(g);
    }
    this.root.add(this.ball);
    this.world.pickables = [this.ball];
    this.fallen = false;
    return this.hud();
  }

  shareState() {
    return { duration: 20 };
  }

  hud() {
    return this.hudLine("左右にドラッグして輪をくぐれ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || this.fallen) return;
    if (p.type === "down" || p.type === "move") {
      const nx = (p.x / window.innerWidth) * 2 - 1;
      this.targetX = nx * 2.1;
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (!this.fallen && this.alive) {
      this.ball.position.x += (this.targetX - this.ball.position.x) * Math.min(1, dt * 8);
      this.ball.position.z -= 4.8 * dt;
      this.ball.rotation.x -= dt * 6;
      const gate = this.gates[this.passed];
      if (gate && this.ball.position.z < gate.position.z + 0.2) {
        if (Math.abs(this.ball.position.x - gate.position.x) < 0.72) {
          this.score += 1;
          this.passed += 1;
          this.bus.tick();
        } else {
          this.fallen = true;
          this.bus.boom();
          this.world.shake = 0.2;
        }
      }
      this.world.camera.position.set(this.ball.position.x * 0.4, 3.6, this.ball.position.z + 5.4);
      this.world.look.set(this.ball.position.x, 0.4, this.ball.position.z - 2);
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

export class InkGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
    this.useInk = true;
    this.canvas = document.querySelector("#ink");
    this.ctx = this.canvas?.getContext("2d");
    this.points = [];
    this.drawn = [];
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 12);
    this.winWord = "最も近い線";
    this.drawn = [];
    this.drawing = false;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    const paper = this.world.makeOfuda();
    paper.position.y = 0.9;
    this.root.add(paper);
    this.prop = paper;
    this.world.pickables = [];
    this.world.camera.position.set(0, 5, 5.4);
    this.makePath();
    this.showInk(true);
    this.paint();
    return this.hud();
  }

  shareState() {
    return { duration: 12 };
  }

  hud() {
    return this.hudLine("金色の線の上を指でなぞれ");
  }

  canAct() {
    return false;
  }

  makePath() {
    this.points = [];
    for (let i = 0; i <= 80; i++) {
      const t = (i / 80) * Math.PI * 2;
      this.points.push({
        x: 0.5 + Math.sin(t) * 0.28,
        y: 0.48 + Math.sin(t * 2) * 0.18,
      });
    }
  }

  showInk(on) {
    if (!this.canvas) return;
    this.canvas.hidden = !on;
    if (on) {
      this.canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
      this.canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
      this.canvas.style.width = "100%";
      this.canvas.style.height = "100%";
    }
  }

  paint() {
    const c = this.ctx;
    if (!c || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    c.clearRect(0, 0, w, h);
    c.lineJoin = "round";
    c.lineCap = "round";
    c.strokeStyle = "rgba(255,200,87,0.85)";
    c.lineWidth = 10 * (window.devicePixelRatio || 1);
    c.beginPath();
    this.points.forEach((p, i) => {
      const x = p.x * w;
      const y = p.y * h;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    });
    c.stroke();
    if (this.drawn.length > 1) {
      c.strokeStyle = "rgba(102,224,255,0.95)";
      c.lineWidth = 8 * (window.devicePixelRatio || 1);
      c.beginPath();
      this.drawn.forEach((p, i) => {
        if (i === 0) c.moveTo(p.x * w, p.y * h);
        else c.lineTo(p.x * w, p.y * h);
      });
      c.stroke();
    }
  }

  pointer(p) {
    if (!this.alive || !this.canvas) return;
    const x = p.x / window.innerWidth;
    const y = p.y / window.innerHeight;
    if (p.type === "down") {
      this.drawing = true;
      this.drawn.push({ x, y });
    } else if (p.type === "move" && this.drawing) {
      this.drawn.push({ x, y });
      this.score = this.accuracy();
    } else if (p.type === "up") {
      this.drawing = false;
      this.score = this.accuracy();
    }
    this.paint();
  }

  accuracy() {
    if (this.drawn.length < 4) return 0;
    let hit = 0;
    for (const t of this.points) {
      let best = 99;
      for (const d of this.drawn) {
        const dist = Math.hypot(t.x - d.x, t.y - d.y);
        if (dist < best) best = dist;
      }
      if (best < 0.07) hit += 1;
    }
    return Math.round((hit / this.points.length) * 100);
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.prop) this.prop.rotation.y += dt * 0.15;
    return this.time(dt, this.hud());
  }

  exit() {
    this.showInk(false);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class RaidGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "最多ダメージ";
    this.combo = 0;
    this.comboLeft = 0;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.oni = this.world.makeOni();
    this.oni.position.y = 0.2;
    this.oni.scale.setScalar(1.8);
    this.baseY = 0.2;
    this.root.add(this.oni);
    this.world.pickables = [this.oni];
    this.savedHome = this.world.homeCam.clone();
    this.world.camera.position.set(0, 4.4, 5.8);
    this.world.homeCam.copy(this.world.camera.position);
    this.world.look.set(0, 1.1, 0);
    this.flash = 0;
    return this.hud();
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine(this.combo > 1 ? `連撃×${this.combo}　鬼を叩け` : "鬼を連打・スワイプで削れ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.type !== "down" && p.type !== "move") return;
    if (p.type === "move" && (!this.last || Math.hypot(p.x - this.last.x, p.y - this.last.y) < 14)) {
      this.last = { x: p.x, y: p.y };
      return;
    }
    const s = this.world.toScreen(this.oni.position.clone().setY(1.1));
    if (Math.hypot(s.x - p.x, s.y - p.y) > 110 && p.type === "down") {
      this.last = { x: p.x, y: p.y };
      return;
    }
    const swipe = p.type === "move";
    this.comboLeft = 0.45;
    this.combo = Math.min(9, this.combo + 1);
    const dmg = (swipe ? 2 : 1) * this.combo;
    this.score += dmg;
    this.flash = 0.12;
    this.oni.rotation.z = (Math.random() - 0.5) * 0.4;
    this.world.shake = swipe ? 0.16 : 0.08;
    this.bus.tick();
    this.last = { x: p.x, y: p.y };
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    this.comboLeft -= dt;
    if (this.comboLeft <= 0) this.combo = 0;
    this.flash = Math.max(0, this.flash - dt);
    this.oni.position.y = this.baseY + Math.sin(this.world.clock.elapsedTime * 3) * 0.05;
    this.oni.rotation.y += dt * (this.flash > 0 ? 8 : 0.5);
    this.oni.rotation.z *= 0.85;
    const body = this.oni.children[0];
    if (body?.material) body.material.emissive.setHex(this.flash > 0 ? 0xffc857 : 0x000000);
    return this.time(dt, this.hud());
  }

  exit() {
    if (this.savedHome) this.world.homeCam.copy(this.savedHome);
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class ShotGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "最多撃破";
    this.foes = [];
    this.spawnIn = 0.2;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.world.pickables = [];
    this.savedHome = this.world.homeCam.clone();
    this.world.camera.position.set(0, 3.6, 6.2);
    this.world.homeCam.copy(this.world.camera.position);
    this.world.look.set(0, 0.8, -2);
    return this.hud();
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("近づく敵をタップして撃て");
  }

  canAct() {
    return false;
  }

  spawn() {
    const foe = this.world.makeOni();
    foe.scale.setScalar(0.55);
    foe.position.set((Math.random() - 0.5) * 3.4, 0.3, -8 - Math.random() * 2);
    foe.userData.alive = true;
    this.root.add(foe);
    this.foes.push(foe);
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    for (const f of this.foes) {
      if (!f.userData.alive) continue;
      const s = this.world.toScreen(f.position.clone().setY(0.7));
      if (Math.hypot(s.x - p.x, s.y - p.y) < 58) {
        f.userData.alive = false;
        f.visible = false;
        this.score += 1;
        this.bus.chime();
        this.world.shake = 0.08;
        return;
      }
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.alive) {
      this.spawn();
      this.spawnIn = 0.7;
    }
    for (const f of this.foes) {
      if (!f.userData.alive) continue;
      f.position.z += 4.2 * dt;
      f.rotation.y += dt * 2;
      if (f.position.z > 2.4) {
        f.userData.alive = false;
        f.visible = false;
      }
    }
    return this.time(dt, this.hud());
  }

  exit() {
    if (this.savedHome) this.world.homeCam.copy(this.savedHome);
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class DuelGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 18);
    this.winWord = "剣戟一番";
    this.warn = 0;
    this.strikeIn = 2.2;
    this.stun = 0;
    this.parried = false;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.oni = this.world.makeOni();
    this.oni.position.set(0, 0.25, -0.4);
    this.oni.scale.setScalar(1.7);
    this.blade = this.world.makeBlade();
    this.blade.position.set(0.8, 0.6, 1.4);
    this.blade.rotation.z = 0.5;
    this.root.add(this.oni, this.blade);
    this.world.pickables = [this.oni, this.blade];
    this.savedHome = this.world.homeCam.clone();
    this.world.camera.position.set(0, 4.2, 5.6);
    this.world.homeCam.copy(this.world.camera.position);
    this.world.look.set(0, 1, 0);
    return this.hud();
  }

  shareState() {
    return { duration: 18 };
  }

  hud() {
    const lead = this.warn > 0 ? "今だ、受け！　画面をタップ" : "スワイプで斬る。赤く光ったら受け";
    return this.hudLine(lead);
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || this.stun > 0) return;
    if (this.warn > 0) {
      if (p.type === "down") {
        this.parried = true;
        this.warn = 0;
        this.score += 5;
        this.stun = 0;
        this.bus.chime();
        this.world.shake = 0.14;
      }
      return;
    }
    if (p.type === "move" && this.last) {
      const spd = Math.hypot(p.x - this.last.x, p.y - this.last.y);
      this.last = { x: p.x, y: p.y };
      if (spd < 16) return;
      this.score += 1;
      this.blade.rotation.z = -0.9;
      this.oni.rotation.y += 0.4;
      this.bus.tick();
      return;
    }
    if (p.type === "down") this.last = { x: p.x, y: p.y };
    if (p.type === "up") this.last = null;
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    this.stun = Math.max(0, this.stun - dt);
    this.blade.rotation.z += (0.5 - this.blade.rotation.z) * Math.min(1, dt * 6);
    const body = this.oni.children[0];
    if (this.warn > 0) {
      this.warn -= dt;
      this.oni.scale.setScalar(1.7 + Math.sin(this.world.clock.elapsedTime * 20) * 0.08);
      if (body?.material) body.material.emissive.setHex(0xff2200);
      if (this.warn <= 0) {
        if (body?.material) body.material.emissive.setHex(0x000000);
        this.oni.scale.setScalar(1.7);
        if (!this.parried) {
          this.stun = 1.1;
          this.world.shake = 0.28;
          this.bus.boom();
        }
        this.parried = false;
      }
    } else {
      this.strikeIn -= dt;
      if (this.strikeIn <= 0 && this.alive) {
        this.warn = 0.7;
        this.parried = false;
        this.strikeIn = 1.8 + Math.random() * 1.6;
      }
    }
    this.oni.position.y = 0.25 + Math.sin(this.world.clock.elapsedTime * 2) * 0.04;
    return this.time(dt, this.hud());
  }

  exit() {
    if (this.savedHome) this.world.homeCam.copy(this.savedHome);
    this.world.look.set(0, 0.35, 0);
    this.world.group.remove(this.root);
    this.world.clearPlay();
    this.world.setHubVisible(true);
  }
}

export class BrawlGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 20);
    this.winWord = "乱闘一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.hero = this.world.makeHero();
    this.hero.position.set(0, 0, 0.6);
    this.hero.rotation.y = Math.PI;
    this.sword = this.hero.getObjectByName("heroSword");
    this.root.add(this.hero);
    this.foes = [];
    this.spawnIn = 0.7;
    this.drag = null;
    this.tap = null;
    this.cool = 0;
    this.stun = 0;
    this.slashT = 0;
    this.facing = Math.PI;
    this.world.pickables = [this.hero];
    this.followCam();
    return this.hud();
  }

  shareState() {
    return { duration: 20 };
  }

  hud() {
    const lead = this.stun > 0 ? "のけぞり！" : "ドラッグで走る。タップで斬る";
    return this.hudLine(lead);
  }

  canAct() {
    return false;
  }

  followCam() {
    const y = this.facing;
    const px = this.hero.position.x;
    const pz = this.hero.position.z;
    this.world.camera.position.set(px - Math.sin(y) * 3.15, 2.25, pz - Math.cos(y) * 3.15);
    this.world.look.set(px + Math.sin(y) * 0.7, 0.55, pz + Math.cos(y) * 0.7);
  }

  clampRing(obj, r = 2.15) {
    const d = Math.hypot(obj.position.x, obj.position.z);
    if (d > r) {
      obj.position.x *= r / d;
      obj.position.z *= r / d;
    }
  }

  spawn() {
    if (this.foes.filter((f) => f.userData.alive).length >= 4) return;
    const foe = this.world.makeOni();
    foe.scale.setScalar(0.72);
    const a = Math.random() * Math.PI * 2;
    foe.position.set(Math.cos(a) * 2.05, 0, Math.sin(a) * 2.05);
    foe.userData.alive = true;
    this.root.add(foe);
    this.foes.push(foe);
  }

  slash() {
    if (this.cool > 0 || this.stun > 0) return;
    this.cool = 0.32;
    this.slashT = 0.18;
    this.bus.whoosh();
    const fx = Math.sin(this.facing);
    const fz = Math.cos(this.facing);
    for (const f of this.foes) {
      if (!f.userData.alive) continue;
      const dx = f.position.x - this.hero.position.x;
      const dz = f.position.z - this.hero.position.z;
      const dist = Math.hypot(dx, dz);
      const front = dx * fx + dz * fz;
      if (dist < 1.15 && front > 0.05) {
        f.userData.alive = false;
        f.visible = false;
        this.score += 1;
        this.bus.chime();
        this.world.shake = 0.12;
      }
    }
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.type === "down") {
      this.tap = { x: p.x, y: p.y, t: performance.now() };
      this.drag = p.gx != null ? { x: p.gx, z: p.gz } : null;
    }
    if (p.type === "move" && this.tap) {
      this.drag = p.gx != null ? { x: p.gx, z: p.gz } : this.drag;
    }
    if (p.type === "up" && this.tap) {
      const held = performance.now() - this.tap.t;
      const dist = Math.hypot(p.x - this.tap.x, p.y - this.tap.y);
      this.tap = null;
      this.drag = null;
      if (dist < 22 && held < 280) this.slash();
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    this.cool = Math.max(0, this.cool - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.slashT = Math.max(0, this.slashT - dt);
    if (this.sword) {
      const swing = this.slashT > 0 ? -1.4 : 0;
      this.sword.rotation.z += (swing - this.sword.rotation.z) * Math.min(1, dt * 18);
    }

    if (this.alive && this.stun <= 0 && this.drag) {
      const dx = this.drag.x - this.hero.position.x;
      const dz = this.drag.z - this.hero.position.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.12) {
        this.facing = Math.atan2(dx, dz);
        this.hero.position.x += (dx / d) * 3.4 * dt;
        this.hero.position.z += (dz / d) * 3.4 * dt;
        this.clampRing(this.hero);
      }
    }
    this.hero.rotation.y = this.facing;
    this.hero.position.y = Math.sin(this.world.clock.elapsedTime * 10) * (this.drag && this.stun <= 0 ? 0.04 : 0);

    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.alive) {
      this.spawn();
      this.spawnIn = 1.05;
    }

    for (const f of this.foes) {
      if (!f.userData.alive) continue;
      const dx = this.hero.position.x - f.position.x;
      const dz = this.hero.position.z - f.position.z;
      const d = Math.hypot(dx, dz) || 1;
      f.position.x += (dx / d) * 1.35 * dt;
      f.position.z += (dz / d) * 1.35 * dt;
      f.rotation.y = Math.atan2(dx, dz);
      f.position.y = Math.sin(this.world.clock.elapsedTime * 6 + f.id) * 0.03;
      this.clampRing(f);
      if (d < 0.58 && this.stun <= 0 && this.slashT <= 0) {
        this.stun = 0.45;
        this.drag = null;
        this.world.shake = 0.22;
        this.bus.boom();
        this.hero.position.x -= (dx / d) * 0.35;
        this.hero.position.z -= (dz / d) * 0.35;
        this.clampRing(this.hero);
      }
    }

    this.followCam();
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

export class DodgeGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 18);
    this.winWord = "回避一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.hero = this.world.makeUmbrella();
    this.hero.position.set(0, 0, 1.1);
    this.root.add(this.hero);
    this.hazards = [];
    this.spawnIn = 0.4;
    this.targetX = 0;
    this.world.pickables = [this.hero];
    this.world.camera.position.set(0, 4.4, 6.4);
    this.world.look.set(0, 0.7, 0);
    return this.hud();
  }

  shareState() {
    return { duration: 18 };
  }

  hud() {
    return this.hudLine("左右にドラッグして金棒を避けろ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive) return;
    if (p.type === "down" || p.type === "move") {
      const nx = (p.x / window.innerWidth) * 2 - 1;
      this.targetX = nx * 2.15;
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  spawn() {
    const club = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.7, 8), mat(0x4a2a18));
    club.position.set((Math.random() - 0.5) * 3.6, 4.6, 0.4 + Math.random() * 0.8);
    club.userData.alive = true;
    this.root.add(club);
    this.hazards.push(club);
  }

  update(dt) {
    this.hero.position.x += (this.targetX - this.hero.position.x) * Math.min(1, dt * 10);
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.alive) {
      this.spawn();
      this.spawnIn = Math.max(0.28, 0.7 - (18 - this.left) * 0.02);
    }
    for (const h of this.hazards) {
      if (!h.userData.alive) continue;
      h.position.y -= 3.6 * dt;
      h.rotation.z += dt * 4;
      const dx = h.position.x - this.hero.position.x;
      const dy = h.position.y - 0.7;
      if (Math.hypot(dx, dy) < 0.48 && h.position.y < 1.3) {
        h.userData.alive = false;
        h.visible = false;
        this.world.shake = 0.2;
        this.bus.boom();
        this.alive = false;
        this.submitted = true;
        return { submitScore: this.score };
      }
      if (h.position.y < 0.2) {
        h.userData.alive = false;
        h.visible = false;
        if (this.alive) {
          this.score += 1;
          this.bus.tick();
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
