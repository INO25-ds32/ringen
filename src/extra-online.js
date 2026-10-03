import * as THREE from "three";
import { Race } from "./online-games.js";

function mat(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.2,
    ...extras,
  });
}

export class CatchGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "拾い一番";
    this.gifts = [];
    this.spawnIn = 0.2;
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.world.pickables = [];
    this.world.camera.position.set(0, 5.2, 6);
    this.world.look.set(0, 1.2, 0);
    return this.hud();
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("落ちてくる贈り物をタップ");
  }

  canAct() {
    return false;
  }

  spawn() {
    const g = this.world.makeGift();
    g.scale.setScalar(0.7);
    g.position.set((Math.random() - 0.5) * 3.2, 4.4, (Math.random() - 0.5) * 1.4);
    g.userData.alive = true;
    this.root.add(g);
    this.gifts.push(g);
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    for (const g of this.gifts) {
      if (!g.userData.alive) continue;
      const s = this.world.toScreen(g.position);
      if (Math.hypot(s.x - p.x, s.y - p.y) < 56) {
        g.userData.alive = false;
        g.visible = false;
        this.score += 1;
        this.bus.chime();
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
      this.spawnIn = 0.55;
    }
    for (const g of this.gifts) {
      if (!g.userData.alive) continue;
      g.position.y -= 2.4 * dt;
      g.rotation.y += dt * 2;
      if (g.position.y < 0.2) {
        g.userData.alive = false;
        g.visible = false;
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

export class JumpGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 18);
    this.winWord = "跳躍一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.hero = this.world.makeHero();
    this.hero.position.set(0, 0.4, 1.2);
    this.vy = 0;
    this.on = true;
    this.z = 0;
    this.gaps = [];
    for (let i = 0; i < 18; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.16, 1.8), mat(i % 2 ? 0x4a2a58 : 0x2a1238));
      plank.position.set(0, 0.22, -i * 2.6);
      plank.userData.gap = i > 0 && i % 3 === 0;
      if (plank.userData.gap) plank.position.y = -0.8;
      this.root.add(plank);
      this.gaps.push(plank);
    }
    this.root.add(this.hero);
    this.world.pickables = [this.hero];
    return this.hud();
  }

  shareState() {
    return { duration: 18 };
  }

  hud() {
    return this.hudLine("タップで跳べ。穴に落ちるな");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    if (this.on) {
      this.vy = 5.2;
      this.on = false;
      this.bus.whoosh();
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.alive) {
      this.z -= 5.4 * dt;
      this.hero.position.z = 1.2;
      this.gaps.forEach((p, i) => {
        p.position.z = -i * 2.6 - this.z;
      });
      this.vy -= 16 * dt;
      this.hero.position.y += this.vy * dt;
      if (this.hero.position.y <= 0.4) {
        this.hero.position.y = 0.4;
        this.vy = 0;
        this.on = true;
        const idx = Math.round((-this.z + 1.2) / 2.6);
        const plank = this.gaps[idx];
        if (plank?.userData.gap) {
          this.alive = false;
          this.submitted = true;
          this.bus.boom();
          this.world.shake = 0.24;
          return { submitScore: this.score };
        }
        if (plank && !plank.userData.counted) {
          plank.userData.counted = true;
          this.score += 1;
        }
      }
      this.world.camera.position.set(0, 3.8, this.hero.position.z + 5.2);
      this.world.look.set(0, 0.6, this.hero.position.z - 2);
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

export class PairsGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 18);
    this.winWord = "記憶一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    const colors = [0xff5d8f, 0x66e0ff, 0xffc857, 0x3ecf8e];
    const bag = [...colors, ...colors];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.tiles = [];
    this.open = [];
    this.lock = 0;
    bag.forEach((col, i) => {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.7), mat(0x2a1238));
      t.position.set((i % 4) * 0.95 - 1.42, 0.42, Math.floor(i / 4) * 1.05 - 0.5);
      t.userData.pick = "pair-live";
      t.userData.color = col;
      t.userData.open = false;
      t.userData.done = false;
      this.root.add(t);
      this.tiles.push(t);
    });
    this.world.pickables = this.tiles;
    this.world.camera.position.set(0, 7.2, 0.6);
    this.world.look.set(0, 0.2, 0);
    return this.hud();
  }

  shareState() {
    return { duration: 18 };
  }

  hud() {
    return this.hudLine("同じ色の二つを開け");
  }

  canAct() {
    return false;
  }

  flip(tile, on) {
    tile.userData.open = on;
    tile.material.color.setHex(on || tile.userData.done ? tile.userData.color : 0x2a1238);
  }

  pointer(p) {
    if (!this.alive || this.lock > 0 || p.type !== "down") return;
    const hit = this.world.pickObject(p.x, p.y);
    if (!hit || hit.userData.done || hit.userData.open) return;
    if (this.open.includes(hit)) return;
    this.flip(hit, true);
    this.open.push(hit);
    this.bus.tick();
    if (this.open.length === 2) {
      const [a, b] = this.open;
      if (a.userData.color === b.userData.color) {
        a.userData.done = b.userData.done = true;
        this.score += 1;
        this.bus.chime();
        this.open = [];
      } else {
        this.lock = 0.55;
      }
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    if (this.lock > 0) {
      this.lock -= dt;
      if (this.lock <= 0) {
        this.open.forEach((t) => this.flip(t, false));
        this.open = [];
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

export class BounceGame extends Race {
  constructor(world, bus) {
    super();
    this.world = world;
    this.bus = bus;
    this.root = new THREE.Group();
  }

  enter(players, opts = {}) {
    this.setup(players, opts, opts.myName, 16);
    this.winWord = "継ぎ一番";
    this.world.clearPlay();
    this.world.group.add(this.root);
    this.world.setHubVisible(false);
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), mat(0xffc857, { emissive: 0x553300 }));
    this.ball.position.set(0, 2.2, 0.4);
    this.vy = 0;
    this.root.add(this.ball);
    this.world.pickables = [this.ball];
    this.world.camera.position.set(0, 4.6, 5.8);
    this.world.look.set(0, 1, 0);
    return this.hud();
  }

  shareState() {
    return { duration: 16 };
  }

  hud() {
    return this.hudLine("落ちてきた玉をタップして返せ");
  }

  canAct() {
    return false;
  }

  pointer(p) {
    if (!this.alive || p.type !== "down") return;
    const s = this.world.toScreen(this.ball.position);
    if (Math.hypot(s.x - p.x, s.y - p.y) < 70 && this.ball.position.y < 1.6) {
      this.vy = 5.6;
      this.score += 1;
      this.bus.chime();
      this.world.shake = 0.08;
    }
  }

  act(extra) {
    return this.takeScore(extra);
  }

  update(dt) {
    this.vy -= 9 * dt;
    this.ball.position.y += this.vy * dt;
    this.ball.rotation.x += dt * 4;
    if (this.ball.position.y < 0.28 && this.alive) {
      this.alive = false;
      this.submitted = true;
      this.bus.boom();
      return { submitScore: this.score };
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
