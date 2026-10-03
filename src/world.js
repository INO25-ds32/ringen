import * as THREE from "three";

function mat(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.45,
    metalness: 0.18,
    ...extras,
  });
}

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0614);
    this.scene.fog = new THREE.Fog(0x0a0614, 9, 24);
    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 60);
    this.homeCam = new THREE.Vector3(0, 6.4, 7.8);
    this.camera.position.copy(this.homeCam);
    this.look = new THREE.Vector3(0, 0.35, 0);
    this.camera.lookAt(this.look);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.shake = 0;
    this.pickables = [];
    this.mode = "hub";
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.lights = this.buildLights();
    this.buildRoom();
    this.hub = this.buildLocalHub();
    this.group.add(this.hub.root);
    this.pickables = this.hub.pickables;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  buildLights() {
    const hemi = new THREE.HemisphereLight(0xffe0c8, 0x1a1030, 0.7);
    const key = new THREE.SpotLight(0xffffff, 40, 30, 0.55, 0.4, 1);
    key.position.set(2.4, 9, 4);
    key.castShadow = true;
    const pink = new THREE.PointLight(0xff5d8f, 18, 16);
    pink.position.set(-3, 2.2, 2);
    const gold = new THREE.PointLight(0xffc857, 16, 16);
    gold.position.set(3, 2.4, -1.5);
    const cyan = new THREE.PointLight(0x66e0ff, 10, 14);
    cyan.position.set(0, 1.6, -3);
    this.scene.add(hemi, key, pink, gold, cyan);
    return { pink, gold, cyan };
  }

  buildRoom() {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(9, 64),
      mat(0x140c22, { roughness: 0.9, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(3.15, 3.3, 0.28, 64),
      mat(0x4a2a18, { roughness: 0.35, metalness: 0.25 })
    );
    table.position.y = 0.14;
    table.castShadow = true;
    table.receiveShadow = true;
    this.scene.add(table);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(3.18, 0.08, 12, 64),
      mat(0xffc857, { emissive: 0x5a3a10, roughness: 0.3 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.3;
    this.scene.add(rim);

    const cloth = new THREE.Mesh(
      new THREE.CircleGeometry(2.7, 48),
      mat(0x2a1238, { roughness: 0.8 })
    );
    cloth.rotation.x = -Math.PI / 2;
    cloth.position.y = 0.29;
    this.scene.add(cloth);
  }

  setHubMode(mode) {
    if (this.hub?.root) this.group.remove(this.hub.root);
    this.hub = mode === "online" ? this.buildOnlineHub() : this.buildLocalHub();
    this.group.add(this.hub.root);
    this.pickables = this.hub.pickables;
  }

  placeRing(items, radius, yOf) {
    items.forEach((obj, i) => {
      const a = (i / items.length) * Math.PI * 2 - Math.PI / 2;
      obj.position.set(Math.cos(a) * radius, yOf(obj, i), Math.sin(a) * radius);
      obj.userData.baseY = obj.position.y;
    });
  }

  buildLocalHub() {
    const root = new THREE.Group();
    const bomb = this.makeBomb();
    bomb.userData.pick = "bomb";
    const bottle = this.makeBottle();
    bottle.userData.pick = "bottle";
    const tower = this.makeMiniTower();
    tower.userData.pick = "stack";
    const kusu = this.makeKusudama();
    kusu.userData.pick = "kusudama";
    const rings = this.makeRingSet();
    rings.userData.pick = "rings";
    const lantern = this.makeLantern();
    lantern.userData.pick = "lantern";
    const koi = this.makeKoi(0);
    koi.userData.pick = "koi";
    const duel = this.makeDuelSet();
    duel.userData.pick = "versus";
    const fox = this.makeFoxCluster();
    fox.userData.pick = "foxfire";
    const rocket = this.makeRocket();
    rocket.userData.pick = "hanabi";
    const outer = [bomb, bottle, tower, kusu, rings, lantern, koi, duel, fox, rocket];
    this.placeRing(outer, 1.95, (obj) => (obj.userData.pick === "bomb" ? 0.72 : 0.42));
    const drum = this.makeDrum();
    drum.userData.pick = "taiko";
    const mask = this.makeMask();
    mask.userData.pick = "shadow";
    const fan = this.makeFan();
    fan.userData.pick = "fan";
    const bell = this.makeBell();
    bell.userData.pick = "bell";
    const cup = this.makeCup();
    cup.userData.pick = "cup";
    const shuttle = this.makeShuttle();
    shuttle.userData.pick = "shuttle";
    const daruma = this.makeDaruma();
    daruma.userData.pick = "daruma";
    const mochi = this.makeMochi();
    mochi.userData.pick = "mochi";
    const inner = [drum, mask, fan, bell, cup, shuttle, daruma, mochi];
    this.placeRing(inner, 1.05, () => 0.42);
    const pickables = [...outer, ...inner];
    pickables.forEach((p) => root.add(p));
    return { root, pickables, kind: "local", bomb, bottle };
  }

  buildOnlineHub() {
    const root = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), mat(0xfff4e4));
    ball.userData.pick = "flick";
    const fruit = this.makeKusudama();
    fruit.userData.pick = "slash";
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), mat(0x66e0ff, { emissive: 0x113344 }));
    orb.userData.pick = "steer";
    const ofuda = this.makeOfuda();
    ofuda.userData.pick = "ink";
    const oni = this.makeOni();
    oni.userData.pick = "raid";
    const bow = this.makeBow();
    bow.userData.pick = "shot";
    const blade = this.makeBlade();
    blade.userData.pick = "duel";
    const hero = this.makeHero();
    hero.userData.pick = "brawl";
    const shade = this.makeUmbrella();
    shade.userData.pick = "dodge";
    const outer = [ball, fruit, orb, ofuda, oni, bow, blade, hero, shade];
    this.placeRing(outer, 1.78, () => 0.5);
    const gift = this.makeGift();
    gift.userData.pick = "catch";
    const hop = this.makeBolt();
    hop.userData.pick = "jump";
    const pair = this.makeDice();
    pair.userData.pick = "pairs";
    const bounce = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), mat(0xffc857, { emissive: 0x553300 }));
    bounce.userData.pick = "bounce";
    const mash = this.makeDrum();
    mash.userData.pick = "mash";
    const coin = this.makeCoin();
    coin.userData.pick = "coin";
    const maze = this.makeOfuda();
    maze.userData.pick = "maze";
    const tgt = this.makeTarget();
    tgt.userData.pick = "target";
    const inner = [gift, hop, pair, bounce, mash, coin, maze, tgt];
    this.placeRing(inner, 1.0, () => 0.48);
    const pickables = [...outer, ...inner];
    pickables.forEach((p) => root.add(p));
    return { root, pickables, kind: "online" };
  }

  makeKusudama() {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 1), mat(0xff5d8f, { roughness: 0.5 }));
    core.castShadow = true;
    g.add(core);
    for (let i = 0; i < 8; i++) {
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat(i % 2 ? 0xffc857 : 0xff9ab8));
      const a = (i / 8) * Math.PI * 2;
      petal.position.set(Math.cos(a) * 0.38, 0.12, Math.sin(a) * 0.38);
      g.add(petal);
    }
    return g;
  }

  makeRingSet() {
    const g = new THREE.Group();
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.7, 12), mat(0xffc857));
    peg.position.y = 0.35;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 20), mat(0xff5d8f));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0.35, 0.22, 0);
    g.add(peg, ring);
    return g;
  }

  makeLantern() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.7, 12), mat(0xffc857, { emissive: 0x5a2a00, emissiveIntensity: 0.2 }));
    body.position.y = 0.5;
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), new THREE.MeshBasicMaterial({ color: 0xfff1c1 }));
    flame.position.y = 0.55;
    flame.name = "flame";
    g.add(body, flame);
    return g;
  }

  makeKoi(i = 0) {
    const g = new THREE.Group();
    const col = i % 2 ? 0xfff4e4 : 0xff6b3d;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), mat(col));
    body.scale.set(1.6, 0.7, 0.8);
    g.add(body);
    return g;
  }

  makeMask() {
    const g = new THREE.Group();
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), mat(0xfff4e4));
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 20), mat(0x22202a));
    band.rotation.x = 0.2;
    g.add(face, band);
    return g;
  }

  makeBolt() {
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 5), mat(0xffc857, { emissive: 0xffc857, emissiveIntensity: 0.5 }));
    a.position.y = 0.4;
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 5), mat(0xfff4e4));
    b.position.y = -0.1;
    b.rotation.z = Math.PI;
    g.add(a, b);
    return g;
  }

  makeDrum() {
    const g = new THREE.Group();
    const skin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.35, 24), mat(0xff5d8f));
    skin.position.y = 0.2;
    g.add(skin);
    return g;
  }

  makeOfuda() {
    const g = new THREE.Group();
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.8, 0.04), mat(0xfff4e4));
    paper.position.y = 0.4;
    const seal = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.05), mat(0xc41e3a));
    seal.position.set(0, 0.55, 0.03);
    g.add(paper, seal);
    return g;
  }

  makeOni() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), mat(0xb42318, { roughness: 0.55 }));
    body.position.y = 0.55;
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 6), mat(0xfff4e4));
    const hornR = hornL.clone();
    hornL.position.set(-0.14, 0.92, 0.08);
    hornR.position.set(0.14, 0.92, 0.08);
    hornL.rotation.z = 0.35;
    hornR.rotation.z = -0.35;
    const club = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.7, 8), mat(0x4a2a18));
    club.position.set(0.42, 0.55, 0.1);
    club.rotation.z = -0.7;
    g.add(body, hornL, hornR, club);
    return g;
  }

  makeBow() {
    const g = new THREE.Group();
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 8, 16, Math.PI), mat(0x4a2a18));
    arc.rotation.z = Math.PI / 2;
    arc.position.y = 0.45;
    const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), mat(0xffc857));
    arrow.position.y = 0.45;
    g.add(arc, arrow);
    return g;
  }

  makeBlade() {
    const g = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 0.04), mat(0xc9d4e8, { metalness: 0.7, roughness: 0.2 }));
    blade.position.y = 0.55;
    const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.08), mat(0x8a1a1a));
    hilt.position.y = 0.12;
    g.add(blade, hilt);
    return g;
  }

  makeHero(color = 0x66e0ff) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.42, 4, 10), mat(color, { roughness: 0.4 }));
    body.position.y = 0.52;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat(0xfff4e4));
    head.position.y = 0.92;
    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 16), mat(0xffc857));
    sash.rotation.x = Math.PI / 2;
    sash.position.y = 0.58;
    const sword = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.03), mat(0xc9d4e8, { metalness: 0.7, roughness: 0.2 }));
    sword.position.set(0.28, 0.55, 0.08);
    sword.name = "heroSword";
    g.add(body, head, sash, sword);
    return g;
  }

  makeDuelSet() {
    const g = new THREE.Group();
    const a = this.makeHero(0x66e0ff);
    const b = this.makeHero(0xff5d8f);
    a.scale.setScalar(0.52);
    b.scale.setScalar(0.52);
    a.position.set(-0.28, 0, 0.12);
    b.position.set(0.28, 0, -0.08);
    g.add(a, b);
    return g;
  }

  makeBomb() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), mat(0x22202a, { metalness: 0.55 }));
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.16, 16), mat(0x8a6a2a));
    cap.position.y = 0.42;
    const fuse = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 16, Math.PI), mat(0xc9a27a));
    fuse.position.set(0.12, 0.5, 0);
    fuse.rotation.z = 0.6;
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffc857 })
    );
    spark.position.set(0.28, 0.62, 0);
    spark.name = "spark";
    body.castShadow = true;
    g.add(body, cap, fuse, spark);
    return g;
  }

  makeBottle() {
    const g = new THREE.Group();
    const glass = mat(0x3ecf8e, { transparent: true, opacity: 0.72, roughness: 0.15, metalness: 0.4 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.9, 20), glass);
    body.position.y = 0.55;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.38, 16), glass);
    neck.position.y = 1.15;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 12), mat(0xffc857));
    cap.position.y = 1.38;
    body.castShadow = true;
    g.add(body, neck, cap);
    return g;
  }

  makeDice() {
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), mat(0xfff4e4));
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), mat(0xff5d8f));
    a.position.x = -0.28;
    b.position.x = 0.28;
    a.rotation.set(0.3, 0.5, 0.2);
    b.rotation.set(-0.2, -0.4, 0.3);
    a.castShadow = true;
    b.castShadow = true;
    g.add(a, b);
    return g;
  }

  makeMiniTower() {
    const g = new THREE.Group();
    const colors = [0xffc857, 0xff5d8f, 0x66e0ff, 0xffffff];
    for (let i = 0; i < 6; i++) {
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.9), mat(colors[i % colors.length]));
      block.position.y = 0.09 + i * 0.19;
      block.rotation.y = i % 2 ? 0.12 : -0.08;
      block.castShadow = true;
      g.add(block);
    }
    return g;
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  groundPoint(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (!this.floorPlane) this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.3);
    const hit = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.floorPlane, hit) ? hit : null;
  }

  toScreen(pos) {
    const v = pos.clone().project(this.camera);
    return {
      x: ((v.x + 1) / 2) * window.innerWidth,
      y: ((-v.y + 1) / 2) * window.innerHeight,
    };
  }

  makeFoxCluster() {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 8),
        mat(0xffc857, { emissive: 0xffc857, emissiveIntensity: 0.45 })
      );
      const a = (i / 5) * Math.PI * 2;
      orb.position.set(Math.cos(a) * 0.28, 0.35 + (i % 2) * 0.12, Math.sin(a) * 0.28);
      g.add(orb);
    }
    return g;
  }

  makeRocket() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.7, 8), mat(0xff5d8f));
    body.position.y = 0.5;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), mat(0x4a2a18));
    stick.position.y = 0.08;
    g.add(body, stick);
    return g;
  }

  makeUmbrella() {
    const g = new THREE.Group();
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.22, 10), mat(0xffc857));
    cap.position.y = 0.7;
    cap.rotation.x = Math.PI;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), mat(0xfff4e4));
    pole.position.y = 0.38;
    g.add(cap, pole);
    return g;
  }

  makeFan() {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.04), mat(i % 2 ? 0xff5d8f : 0xffc857));
      blade.position.y = 0.45;
      blade.rotation.y = (i / 5) * Math.PI * 2;
      blade.rotation.z = 0.4;
      g.add(blade);
    }
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat(0xfff4e4));
    hub.position.y = 0.42;
    g.add(hub);
    return g;
  }

  makeBell() {
    const g = new THREE.Group();
    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xffc857, { metalness: 0.6 }));
    cup.position.y = 0.42;
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(0xff5d8f));
    top.position.y = 0.72;
    g.add(cup, top);
    return g;
  }

  makeGift() {
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), mat(0xff5d8f));
    box.position.y = 0.35;
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.44, 0.44), mat(0xffc857));
    ribbon.position.y = 0.35;
    g.add(box, ribbon);
    return g;
  }

  makeCup() {
    const g = new THREE.Group();
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.18, 0.22, 16), mat(0xfff4e4, { roughness: 0.2 }));
    bowl.position.y = 0.35;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.28, 8), mat(0xffc857));
    stem.position.y = 0.18;
    g.add(bowl, stem);
    return g;
  }

  makeShuttle() {
    const g = new THREE.Group();
    const cork = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(0xffc857));
    cork.position.y = 0.2;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 8), mat(0xfff4e4));
    cone.position.y = 0.48;
    g.add(cork, cone);
    return g;
  }

  makeDaruma() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), mat(0xb42318));
    body.position.y = 0.42;
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(0xfff4e4));
    const eyeR = eyeL.clone();
    eyeL.position.set(-0.1, 0.52, 0.3);
    eyeR.position.set(0.1, 0.52, 0.3);
    g.add(body, eyeL, eyeR);
    return g;
  }

  makeMochi() {
    const g = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat(0xfff4e4));
    head.position.y = 0.55;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8), mat(0x4a2a18));
    stick.position.y = 0.2;
    g.add(head, stick);
    return g;
  }

  makeCoin() {
    const g = new THREE.Group();
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16), mat(0xffc857, { metalness: 0.7, emissive: 0x553300 }));
    disk.rotation.x = Math.PI / 2;
    disk.position.y = 0.2;
    g.add(disk);
    return g;
  }

  makeTarget() {
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 16), mat(0xff5d8f));
    const b = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), mat(0xffc857));
    a.position.y = 0.3;
    b.position.y = 0.3;
    g.add(a, b);
    return g;
  }

  makeBalloon() {
    const g = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), mat(0xff5d8f, { roughness: 0.35 }));
    ball.position.y = 0.55;
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(0xffc857));
    knot.position.y = 0.22;
    g.add(ball, knot);
    return g;
  }

  pick(clientX, clientY) {
    return this.pickObject(clientX, clientY)?.userData.pick || null;
  }

  pickObject(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, true);
    if (!hits.length) return null;
    let obj = hits[0].object;
    while (obj && !obj.userData.pick) obj = obj.parent;
    return obj || null;
  }

  setHubVisible(on) {
    this.hub.root.visible = on;
    this.mode = on ? "hub" : "play";
  }

  pulse(dt) {
    const t = this.clock.elapsedTime;
    this.lights.pink.position.x = Math.sin(t * 0.8) * 3.2;
    this.lights.gold.position.z = Math.cos(t * 0.7) * 3;
    this.lights.cyan.intensity = 8 + Math.sin(t * 3) * 3;
    if (this.hub.root.visible) {
      this.hub.pickables.forEach((p, i) => {
        p.rotation.y += dt * (0.35 + i * 0.05);
        const base = p.userData.baseY ?? 0.42;
        p.position.y = base + Math.sin(t * 2 + i) * 0.05;
      });
    }
  }

  render() {
    if (this.shake > 0) {
      this.camera.position.x = this.homeCam.x + (Math.random() - 0.5) * this.shake;
      this.camera.position.y = this.homeCam.y + (Math.random() - 0.5) * this.shake * 0.4;
      this.shake *= 0.86;
    } else if (this.mode === "hub") {
      this.camera.position.lerp(this.homeCam, 0.08);
    }
    this.camera.lookAt(this.look);
    this.renderer.render(this.scene, this.camera);
  }

  clearPlay() {
    const doomed = this.group.children.filter((c) => c !== this.hub.root);
    for (const c of doomed) this.group.remove(c);
    this.pickables = this.hub.pickables;
  }
}
