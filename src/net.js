const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const PEER_CLOUD = {
  host: "0.peerjs.com",
  port: 443,
  path: "/",
  secure: true,
  debug: 0,
  pingInterval: 5000,
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.cloudflare.com:3478" },
      { urls: "turn:0.peerjs.com:3478", username: "peerjs", credential: "peerjsp" },
    ],
  },
};

function roomCode() {
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPH[Math.floor(Math.random() * ALPH.length)];
  return s;
}

function peerId(code) {
  return `ringen-${String(code).toUpperCase()}`;
}

function makePeer(id) {
  const Peer = window.Peer;
  if (!Peer) throw new Error("通信ライブラリを読み込めませんでした");
  return id ? new Peer(id, PEER_CLOUD) : new Peer(PEER_CLOUD);
}

function waitOpen(peer) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("接続がタイムアウトしました")), 16000);
    peer.on("open", (id) => {
      clearTimeout(t);
      resolve(id);
    });
    peer.on("error", (err) => {
      clearTimeout(t);
      reject(err);
    });
  });
}

export class Net {
  constructor() {
    this.peer = null;
    this.conns = [];
    this.hostConn = null;
    this.online = false;
    this.isHost = false;
    this.code = "";
    this.myId = "";
    this.myName = "";
    this.seats = [];
    this.onEvent = () => {};
  }

  emit(type, payload) {
    this.onEvent({ type, ...(payload || {}) });
  }

  wire(conn, asHost) {
    conn.on("data", (raw) => {
      const msg = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (asHost) this.hostInbox(conn, msg);
      else this.emit("msg", { msg });
    });
    conn.on("close", () => {
      if (asHost) {
        this.conns = this.conns.filter((c) => c !== conn);
        this.seats = this.seats.filter((s) => s.id !== conn.peer);
        this.broadcast({ t: "roster", seats: this.seats });
        this.emit("roster", { seats: this.seats });
      } else {
        this.emit("drop", {});
      }
    });
  }

  hostInbox(conn, msg) {
    if (msg.t === "hello") {
      const name = String(msg.name || "ゲスト").slice(0, 8);
      if (this.seats.some((s) => s.name === name)) {
        conn.send({ t: "err", text: "その名前は使われています" });
        return;
      }
      if (this.seats.length >= 8) {
        conn.send({ t: "err", text: "部屋が満員です" });
        return;
      }
      this.seats.push({ id: conn.peer, name });
      conn.send({ t: "welcome", seats: this.seats, you: name, code: this.code, phase: this.phase || "lobby" });
      this.broadcast({ t: "roster", seats: this.seats });
      this.emit("roster", { seats: this.seats });
      return;
    }
    if (msg.t === "rename") {
      const next = String(msg.name || "").trim().slice(0, 8);
      if (!next) {
        conn.send({ t: "err", text: "名前を入れて" });
        return;
      }
      if (this.seats.some((s) => s.name === next && s.id !== conn.peer)) {
        conn.send({ t: "err", text: "その名前は使われています" });
        return;
      }
      const seat = this.seats.find((s) => s.id === conn.peer);
      const from = seat?.name;
      if (seat) seat.name = next;
      this.broadcast({ t: "renamed", from, to: next, seats: this.seats });
      this.emit("msg", { msg: { t: "renamed", from, to: next, seats: this.seats } });
      return;
    }
    this.emit("msg", { msg, from: conn.peer });
  }

  broadcast(msg, exceptPeer) {
    for (const c of this.conns) {
      if (exceptPeer && c.peer === exceptPeer) continue;
      if (c.open) c.send(msg);
    }
  }

  sendTo(peerId, msg) {
    const c = this.conns.find((x) => x.peer === peerId);
    if (c?.open) c.send(msg);
  }

  send(msg) {
    if (this.isHost) {
      this.emit("msg", { msg, from: this.myId });
      this.broadcast(msg);
      return;
    }
    if (this.hostConn?.open) this.hostConn.send(msg);
  }

  async create(name) {
    await this.close();
    let lastErr = null;
    for (let i = 0; i < 6; i++) {
      const code = roomCode();
      let peer;
      try {
        peer = makePeer(peerId(code));
      } catch (err) {
        throw err;
      }
      try {
        await waitOpen(peer);
        this.peer = peer;
        this.code = code;
        this.isHost = true;
        this.online = true;
        this.myId = peer.id;
        this.myName = name;
        this.seats = [{ id: peer.id, name }];
        peer.on("connection", (conn) => {
          this.conns.push(conn);
          conn.on("open", () => this.wire(conn, true));
        });
        peer.on("disconnected", () => this.emit("drop", {}));
        this.emit("roster", { seats: this.seats });
        return { code, seats: this.seats };
      } catch (err) {
        lastErr = err;
        peer.destroy();
      }
    }
    throw lastErr || new Error("部屋を作れませんでした");
  }

  async join(code, name) {
    await this.close();
    const peer = makePeer();
    await waitOpen(peer);
    this.peer = peer;
    this.myId = peer.id;
    this.myName = name;
    this.code = String(code).toUpperCase();
    this.isHost = false;
    this.online = true;
    const conn = peer.connect(peerId(this.code), { reliable: true });
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("部屋が見つかりません")), 16000);
      conn.on("open", () => {
        clearTimeout(t);
        resolve();
      });
      conn.on("error", (err) => {
        clearTimeout(t);
        reject(err);
      });
      peer.on("error", (err) => {
        clearTimeout(t);
        reject(err);
      });
    });
    this.hostConn = conn;
    this.wire(conn, false);
    conn.send({ t: "hello", name });
    peer.on("disconnected", () => this.emit("drop", {}));
  }

  async close() {
    for (const c of this.conns) {
      try {
        c.close();
      } catch {
        /* ignore */
      }
    }
    this.conns = [];
    try {
      this.hostConn?.close();
    } catch {
      /* ignore */
    }
    this.hostConn = null;
    try {
      this.peer?.destroy();
    } catch {
      /* ignore */
    }
    this.peer = null;
    this.online = false;
    this.isHost = false;
    this.seats = [];
    this.code = "";
  }

  rename(name) {
    const next = String(name || "").trim().slice(0, 8);
    if (!next) return false;
    if (!this.online) {
      this.myName = next;
      return true;
    }
    if (this.seats.some((s) => s.name === next && s.id !== this.myId)) {
      this.emit("msg", { msg: { t: "err", text: "その名前は使われています" } });
      return false;
    }
    if (this.isHost) {
      const seat = this.seats.find((s) => s.id === this.myId);
      const from = seat?.name;
      if (seat) seat.name = next;
      this.myName = next;
      this.broadcast({ t: "renamed", from, to: next, seats: this.seats });
      this.emit("msg", { msg: { t: "renamed", from, to: next, seats: this.seats } });
      return true;
    }
    this.send({ t: "rename", name: next });
    return true;
  }
}
