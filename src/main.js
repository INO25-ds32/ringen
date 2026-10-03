import { AudioBus } from "./audio.js";
import { BombGame, BottleGame, StackGame } from "./games.js";
import { VersusGame } from "./versus-game.js";
import { BounceGame, CatchGame, JumpGame, PairsGame } from "./extra-online.js";
import { BellGame, FanGame, ShadowGame, TaikoGame } from "./extra-games.js";
import { CupGame, DarumaGame, MochiGame, ShuttleGame } from "./more-games.js";
import { CoinGame, MashGame, MazeGame, TargetGame } from "./more-online.js";
import { BalloonGame, BowlGame, ColorGame, MoleGame, PeekGame, SimonGame, StopGame } from "./pack-local.js";
import { FlapGame, MoleRace, PeekRace, SortGame, StopRace } from "./pack-online.js";
import { CountGame, DangoGame, FreezeGame, MelonGame, OddGame, OrderGame, PathGame, TrayGame } from "./wave-local.js";
import { CountRace, DangoRace, FreezeRace, OddRace, OrderRace, PathRace, TrayRace } from "./wave-online.js";
import { BiggerGame, EchoGame, GlowGame, HoldGame, HoleGame, PoleGame, RopeGame, WindGame } from "./burst-local.js";
import { BigRace, EchoRace, GlowRace, HoldRace, HoleRace, PoleRace, RopeRace, WindRace } from "./burst-online.js";
import { ClashGame, GuardGame, HuntGame, SumoGame, WeakGame } from "./battle-local.js";
import { BossGame, HuntRace, ParryGame, PushGame } from "./battle-online.js";
import {
  AimGame,
  FillGame,
  FlashGame,
  HighGame,
  KickGame,
  LastGame,
  LuckyGame,
  OrbitGame,
  PourGame,
  SlideGame,
  SpinGame,
  TwinGame,
  WaitGame,
  ZipGame,
} from "./plus-local.js";
import {
  AimRace,
  DashGame,
  FallGame,
  FillRace,
  FlashRace,
  HighRace,
  KickRace,
  LastRace,
  LuckyRace,
  OrbitRace,
  PourRace,
  SlideRace,
  SnipeGame,
  SpinRace,
  SwarmGame,
  ToggleGame,
  TwinRace,
  WaitRace,
  ZipRace,
} from "./plus-online.js";
import { BrawlGame, DodgeGame, DuelGame, FlickGame, InkGame, RaidGame, ShotGame, SlashGame, SteerGame } from "./online-games.js";
import { Net } from "./net.js";
import { FoxfireGame, HanabiGame, KoiGame, KusudamaGame, LanternGame, RingsGame } from "./table-games.js";
import { World } from "./world.js";

const canvas = document.querySelector("#stage");
const world = new World(canvas);
const audio = new AudioBus();
const net = new Net();
const games = {
  bomb: new BombGame(world, audio),
  bottle: new BottleGame(world, audio),
  stack: new StackGame(world, audio),
  kusudama: new KusudamaGame(world, audio),
  rings: new RingsGame(world, audio),
  lantern: new LanternGame(world, audio),
  koi: new KoiGame(world, audio),
  versus: new VersusGame(world, audio),
  foxfire: new FoxfireGame(world, audio),
  hanabi: new HanabiGame(world, audio),
  taiko: new TaikoGame(world, audio),
  shadow: new ShadowGame(world, audio),
  fan: new FanGame(world, audio),
  bell: new BellGame(world, audio),
  cup: new CupGame(world, audio),
  shuttle: new ShuttleGame(world, audio),
  daruma: new DarumaGame(world, audio),
  mochi: new MochiGame(world, audio),
  mole: new MoleGame(world, audio),
  balloon: new BalloonGame(world, audio),
  stop: new StopGame(world, audio),
  color: new ColorGame(world, audio),
  simon: new SimonGame(world, audio),
  bowl: new BowlGame(world, audio),
  peek: new PeekGame(world, audio),
  tray: new TrayGame(world, audio),
  count: new CountGame(world, audio),
  odd: new OddGame(world, audio),
  melon: new MelonGame(world, audio),
  dango: new DangoGame(world, audio),
  path: new PathGame(world, audio),
  freeze: new FreezeGame(world, audio),
  order: new OrderGame(world, audio),
  pole: new PoleGame(world, audio),
  hold: new HoldGame(world, audio),
  bigger: new BiggerGame(world, audio),
  wind: new WindGame(world, audio),
  echo: new EchoGame(world, audio),
  hole: new HoleGame(world, audio),
  rope: new RopeGame(world, audio),
  glow: new GlowGame(world, audio),
  sumo: new SumoGame(world, audio),
  guard: new GuardGame(world, audio),
  weak: new WeakGame(world, audio),
  clash: new ClashGame(world, audio),
  hunt: new HuntGame(world, audio),
  flash: new FlashGame(world, audio),
  pour: new PourGame(world, audio),
  spin: new SpinGame(world, audio),
  high: new HighGame(world, audio),
  last: new LastGame(world, audio),
  lucky: new LuckyGame(world, audio),
  wait: new WaitGame(world, audio),
  kick: new KickGame(world, audio),
  fill: new FillGame(world, audio),
  orbit: new OrbitGame(world, audio),
  aim: new AimGame(world, audio),
  slide: new SlideGame(world, audio),
  zip: new ZipGame(world, audio),
  twin: new TwinGame(world, audio),
  flick: new FlickGame(world, audio),
  slash: new SlashGame(world, audio),
  steer: new SteerGame(world, audio),
  ink: new InkGame(world, audio),
  raid: new RaidGame(world, audio),
  shot: new ShotGame(world, audio),
  duel: new DuelGame(world, audio),
  brawl: new BrawlGame(world, audio),
  dodge: new DodgeGame(world, audio),
  catch: new CatchGame(world, audio),
  jump: new JumpGame(world, audio),
  pairs: new PairsGame(world, audio),
  bounce: new BounceGame(world, audio),
  mash: new MashGame(world, audio),
  coin: new CoinGame(world, audio),
  maze: new MazeGame(world, audio),
  target: new TargetGame(world, audio),
  molerace: new MoleRace(world, audio),
  flap: new FlapGame(world, audio),
  sort: new SortGame(world, audio),
  stoprace: new StopRace(world, audio),
  peekrace: new PeekRace(world, audio),
  trayrace: new TrayRace(world, audio),
  countrc: new CountRace(world, audio),
  oddrace: new OddRace(world, audio),
  dangorace: new DangoRace(world, audio),
  pathrace: new PathRace(world, audio),
  freezerace: new FreezeRace(world, audio),
  orderrace: new OrderRace(world, audio),
  polerace: new PoleRace(world, audio),
  holdrace: new HoldRace(world, audio),
  bigrace: new BigRace(world, audio),
  windrace: new WindRace(world, audio),
  echorace: new EchoRace(world, audio),
  holerace: new HoleRace(world, audio),
  roperace: new RopeRace(world, audio),
  glowrace: new GlowRace(world, audio),
  push: new PushGame(world, audio),
  parry: new ParryGame(world, audio),
  boss: new BossGame(world, audio),
  huntrace: new HuntRace(world, audio),
  flashrc: new FlashRace(world, audio),
  pourrc: new PourRace(world, audio),
  spinrc: new SpinRace(world, audio),
  highrc: new HighRace(world, audio),
  lastrc: new LastRace(world, audio),
  luckrc: new LuckyRace(world, audio),
  waitrc: new WaitRace(world, audio),
  kickrc: new KickRace(world, audio),
  fillrc: new FillRace(world, audio),
  orbitrc: new OrbitRace(world, audio),
  aimrc: new AimRace(world, audio),
  slidrc: new SlideRace(world, audio),
  ziprc: new ZipRace(world, audio),
  twinrc: new TwinRace(world, audio),
  dash: new DashGame(world, audio),
  fall: new FallGame(world, audio),
  toggle: new ToggleGame(world, audio),
  snipe: new SnipeGame(world, audio),
  swarm: new SwarmGame(world, audio),
};

const LOCAL_LABELS = {
  bomb: ["爆弾まわし", "切れ目で負け"],
  bottle: ["瓶まわし", "指された人が指令"],
  stack: ["積み塔", "崩した人が負け"],
  kusudama: ["くす玉", "満開で割れ"],
  rings: ["輪投げ", "外した人が負け"],
  lantern: ["提灯", "火を絶やすな"],
  koi: ["金魚すくい", "少ない人が指令"],
  versus: ["一騎", "卓を挟んで斬り合う"],
  foxfire: ["狐火", "本物の火を選べ"],
  hanabi: ["花火", "金に光った瞬間に割れ"],
  taiko: ["太鼓", "赤くなった瞬間に打て"],
  shadow: ["影合わせ", "床の影と同じ形"],
  fan: ["扇", "スワイプであおげ"],
  bell: ["鈴", "鳴った回数だけ叩け"],
  cup: ["盃", "傾けばタップして戻せ"],
  shuttle: ["羽根", "落とした番が負け"],
  daruma: ["だるま", "止まれで動くな"],
  mochi: ["餅つき", "左右交互にタップ"],
  mole: ["もぐら", "光った穴を叩け"],
  balloon: ["風船", "割るな、渡せ"],
  stop: ["針止め", "金の帯で止めろ"],
  color: ["色とり", "中央と同じ色"],
  simon: ["真似", "光った順にタップ"],
  bowl: ["ボウリング", "ピンを倒せ"],
  peek: ["盃探し", "金の入った盃"],
  tray: ["盆", "落とした人が負け"],
  count: ["数", "提灯の数を覚えろ"],
  odd: ["ひとつ", "色の違う一つ"],
  melon: ["西瓜", "金の筋で切れ"],
  dango: ["団子", "落ちる前に取れ"],
  path: ["渡り", "光った石の順"],
  freeze: ["静止", "止まっている金魚"],
  order: ["順", "小さい印から"],
  pole: ["棒", "倒れる逆をタップ"],
  hold: ["長押し", "金の帯で離せ"],
  bigger: ["大きさ", "大きい方を選べ"],
  wind: ["風鈴", "矢印の向きに払え"],
  echo: ["こだま", "同じ回数だけ叩け"],
  hole: ["穴入れ", "玉を穴へドラッグ"],
  rope: ["縄", "足下で跳べ"],
  glow: ["蛍", "消える前にタップ"],
  sumo: ["相撲", "卓を挟んで押し出せ"],
  guard: ["受け", "斬撃をスワイプで防げ"],
  weak: ["急所", "光る角をタップ"],
  clash: ["鍔迫り", "重なった瞬間に斬る"],
  hunt: ["狩り", "走って鬼を3回斬れ"],
  flash: ["瞬間", "光ったらすぐタップ"],
  pour: ["注ぎ", "金の高さで止めろ"],
  spin: ["独楽", "回し続けろ"],
  high: ["高い", "いちばん高い塔"],
  last: ["後出し", "最後に光った石"],
  lucky: ["福", "鬼のいない箱"],
  wait: ["間", "覚えた秒でタップ"],
  kick: ["蹴", "近づいたら蹴れ"],
  fill: ["満杯", "溢れる直前まで"],
  orbit: ["周回", "手前の玉"],
  aim: ["狙い", "金の中心でタップ"],
  slide: ["隙間", "枠へドラッグ"],
  zip: ["早押し", "光ったマス"],
  twin: ["両手", "同じ色を二つ"],
};

const ONLINE_LABELS = {
  flick: ["投球", "引っ張って輪に通せ"],
  slash: ["一閃", "なぞって切れ"],
  steer: ["回廊", "ドラッグで輪をくぐれ"],
  ink: ["墨", "2Dで金色の線をなぞれ"],
  raid: ["討伐", "鬼を連打して削れ"],
  shot: ["射撃", "近づく敵を撃て"],
  duel: ["剣戟", "斬って、光ったら受け"],
  brawl: ["乱闘", "走って鬼を斬れ"],
  dodge: ["回避", "金棒を左右に避けろ"],
  catch: ["拾い", "贈り物をタップ"],
  jump: ["跳ね", "タップで穴を跳べ"],
  pairs: ["揃い", "同じ色を二つ開け"],
  bounce: ["鞠", "玉をタップして返せ"],
  mash: ["連打", "太鼓を連打しろ"],
  coin: ["宝", "走って小判を拾え"],
  maze: ["迷路", "玉を金まで運べ"],
  target: ["的", "動く的をタップ"],
  molerace: ["もぐら競", "光った穴を連打"],
  flap: ["羽ばたき", "タップで柱をくぐれ"],
  sort: ["仕分け", "赤左・青右"],
  stoprace: ["針競", "金に近く止めろ"],
  peekrace: ["眼力", "混ぜた盃を当てろ"],
  trayrace: ["盆競", "落さず保て"],
  countrc: ["数競", "提灯の数を答えろ"],
  oddrace: ["ひとつ競", "違う色を選べ"],
  dangorace: ["団子競", "落ちる団子を取れ"],
  pathrace: ["渡り競", "石の順を踏め"],
  freezerace: ["静止競", "止まっている金魚"],
  orderrace: ["順競", "小さい印から"],
  polerace: ["棒競", "倒さず保て"],
  holdrace: ["長押し競", "金の帯で離せ"],
  bigrace: ["大きさ競", "大きい方を選べ"],
  windrace: ["風競", "矢印の向きに払え"],
  echorace: ["こだま競", "同じ回数"],
  holerace: ["穴競", "玉を穴へ"],
  roperace: ["縄競", "足下で跳べ"],
  glowrace: ["蛍競", "蛍を取れ"],
  push: ["押し", "鬼を土俵から出せ"],
  parry: ["受け競", "斬撃をスワイプで防げ"],
  boss: ["急所競", "光る急所をタップ"],
  huntrace: ["狩り競", "小さな鬼を斬れ"],
  flashrc: ["瞬間競", "光ったらタップ"],
  pourrc: ["注ぎ競", "金の高さで止めろ"],
  spinrc: ["独楽競", "回し続けろ"],
  highrc: ["高い競", "高い塔を選べ"],
  lastrc: ["後出し競", "最後の石"],
  luckrc: ["福競", "鬼のいない箱"],
  waitrc: ["間競", "覚えた秒で"],
  kickrc: ["蹴競", "近づいたら蹴れ"],
  fillrc: ["満杯競", "溢れる直前"],
  orbitrc: ["周回競", "手前の玉"],
  aimrc: ["狙い競", "金の中心"],
  slidrc: ["隙間競", "枠へドラッグ"],
  ziprc: ["早押し競", "光ったマス"],
  twinrc: ["両手競", "同じ色を二つ"],
  dash: ["走", "輪をくぐれ"],
  fall: ["落物", "落ちる鬼をタップ"],
  toggle: ["スイッチ", "全部金にしろ"],
  snipe: ["狙撃", "遠くの鬼を撃て"],
  swarm: ["掃討", "小さな鬼を掃け"],
};

const SHORT = {
  bomb: "爆弾",
  bottle: "瓶",
  stack: "塔",
  kusudama: "くす玉",
  rings: "輪投げ",
  lantern: "提灯",
  koi: "金魚",
  versus: "一騎",
  foxfire: "狐火",
  hanabi: "花火",
  taiko: "太鼓",
  shadow: "影",
  fan: "扇",
  bell: "鈴",
  cup: "盃",
  shuttle: "羽根",
  daruma: "だるま",
  mochi: "餅",
  mole: "もぐら",
  balloon: "風船",
  stop: "針止め",
  color: "色とり",
  simon: "真似",
  bowl: "ボウル",
  peek: "盃探し",
  tray: "盆",
  count: "数",
  odd: "ひとつ",
  melon: "西瓜",
  dango: "団子",
  path: "渡り",
  freeze: "静止",
  order: "順",
  pole: "棒",
  hold: "長押し",
  bigger: "大きさ",
  wind: "風鈴",
  echo: "こだま",
  hole: "穴入れ",
  rope: "縄",
  glow: "蛍",
  sumo: "相撲",
  guard: "受け",
  weak: "急所",
  clash: "鍔迫り",
  hunt: "狩り",
  flash: "瞬間",
  pour: "注ぎ",
  spin: "独楽",
  high: "高い",
  last: "後出し",
  lucky: "福",
  wait: "間",
  kick: "蹴",
  fill: "満杯",
  orbit: "周回",
  aim: "狙い",
  slide: "隙間",
  zip: "早押し",
  twin: "両手",
  flick: "投球",
  slash: "一閃",
  steer: "回廊",
  ink: "墨",
  raid: "討伐",
  shot: "射撃",
  duel: "剣戟",
  brawl: "乱闘",
  dodge: "回避",
  catch: "拾い",
  jump: "跳ね",
  pairs: "揃い",
  bounce: "鞠",
  mash: "連打",
  coin: "宝",
  maze: "迷路",
  target: "的",
  molerace: "もぐら競",
  flap: "羽ばたき",
  sort: "仕分け",
  stoprace: "針競",
  peekrace: "眼力",
  trayrace: "盆競",
  countrc: "数競",
  oddrace: "ひとつ競",
  dangorace: "団子競",
  pathrace: "渡り競",
  freezerace: "静止競",
  orderrace: "順競",
  polerace: "棒競",
  holdrace: "長押し競",
  bigrace: "大きさ競",
  windrace: "風競",
  echorace: "こだま競",
  holerace: "穴競",
  roperace: "縄競",
  glowrace: "蛍競",
  push: "押し",
  parry: "受け競",
  boss: "急所競",
  huntrace: "狩り競",
  flashrc: "瞬間競",
  pourrc: "注ぎ競",
  spinrc: "独楽競",
  highrc: "高い競",
  lastrc: "後出し競",
  luckrc: "福競",
  waitrc: "間競",
  kickrc: "蹴競",
  fillrc: "満杯競",
  orbitrc: "周回競",
  aimrc: "狙い競",
  slidrc: "隙間競",
  ziprc: "早押し競",
  twinrc: "両手競",
  dash: "走",
  fall: "落物",
  toggle: "スイッチ",
  snipe: "狙撃",
  swarm: "掃討",
};

function labels() {
  return net.online ? ONLINE_LABELS : LOCAL_LABELS;
}

const NAME_KEY = "ringen-name";

function loadMyName() {
  try {
    const n = localStorage.getItem(NAME_KEY);
    if (n && n.trim()) return n.trim().slice(0, 8);
  } catch {
    /* ignore */
  }
  return "ゲスト";
}

function saveMyName(name) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* ignore */
  }
}

let myName = loadMyName();
let players = [myName, "アオ", "レン", "ミオ"];
let scores = {};
let current = null;
let currentKey = null;
let replayKey = null;

const ui = {
  title: document.querySelector("#title-screen"),
  how: document.querySelector("#how-screen"),
  online: document.querySelector("#online-screen"),
  lobby: document.querySelector("#lobby-screen"),
  players: document.querySelector("#players-screen"),
  hub: document.querySelector("#hub-hint"),
  play: document.querySelector("#play-dock"),
  result: document.querySelector("#result-screen"),
  hud: document.querySelector("#hud"),
  toast: document.querySelector("#toast"),
  list: document.querySelector("#player-list"),
  who: document.querySelector("#play-who"),
  prompt: document.querySelector("#play-prompt"),
  action: document.querySelector("#btn-action"),
  hudTitle: document.querySelector("#hud-title"),
  hudKicker: document.querySelector("#hud-kicker"),
  hudScore: document.querySelector("#hud-score"),
  hubCopy: document.querySelector("#hub-copy"),
  resultKicker: document.querySelector("#result-kicker"),
  resultTitle: document.querySelector("#result-title"),
  resultLead: document.querySelector("#result-lead"),
  resultDare: document.querySelector("#result-dare"),
  lobbyList: document.querySelector("#lobby-list"),
  lobbyHint: document.querySelector("#lobby-hint"),
  lobbyTable: document.querySelector("#btn-lobby-table"),
  roomCode: document.querySelector("#btn-copy-code"),
  onlineName: document.querySelector("#online-name"),
  onlineCode: document.querySelector("#online-code"),
  myName: document.querySelector("#my-name"),
  nameEdit: document.querySelector("#name-edit"),
  nameScreen: document.querySelector("#name-screen"),
  lobbyName: document.querySelector("#lobby-name"),
  hubName: document.querySelector("#btn-hub-name"),
  secret: document.querySelector("#secret-card"),
  votes: document.querySelector("#vote-row"),
  grid: document.querySelector("#game-grid"),
};

function setOverlay(el, on) {
  el.hidden = !on;
  el.setAttribute("aria-hidden", on ? "false" : "true");
}

function hideAll() {
  setOverlay(ui.title, false);
  setOverlay(ui.how, false);
  setOverlay(ui.online, false);
  setOverlay(ui.lobby, false);
  setOverlay(ui.players, false);
  setOverlay(ui.nameScreen, false);
  ui.hub.hidden = true;
  ui.play.hidden = true;
  setOverlay(ui.result, false);
}

function renderSeats() {
  ui.list.innerHTML = "";
  players.forEach((name, i) => {
    const row = document.createElement("div");
    row.className = "seat";
    const input = document.createElement("input");
    input.value = name;
    input.maxLength = 8;
    if (i === 0) {
      input.setAttribute("aria-label", "あなたの名前");
      row.classList.add("you");
    }
    input.addEventListener("input", () => {
      const next = input.value.trim() || (i === 0 ? myName : `席${i + 1}`);
      if (i === 0) commitMyName(next, { localOnly: true });
      else players[i] = next;
    });
    const del = document.createElement("button");
    del.type = "button";
    del.textContent = i === 0 ? "あなた" : "×";
    del.disabled = i === 0;
    del.addEventListener("click", () => {
      if (i === 0) return;
      if (players.length <= 2) return toast("2人は残して");
      players.splice(i, 1);
      renderSeats();
    });
    row.append(input, del);
    ui.list.append(row);
  });
}

function fillNameFields() {
  if (ui.myName) ui.myName.value = myName;
  if (ui.onlineName) ui.onlineName.value = myName;
  if (ui.lobbyName) ui.lobbyName.value = myName;
  if (ui.nameEdit) ui.nameEdit.value = myName;
  if (ui.hubName) ui.hubName.textContent = `名前：${myName}`;
}

function applyRename(from, to) {
  if (!from || !to || from === to) return;
  scores[to] = scores[from] ?? scores[to] ?? 0;
  delete scores[from];
  players = players.map((p) => (p === from ? to : p));
}

function commitMyName(raw, opts = {}) {
  const next = String(raw || "").trim().slice(0, 8);
  if (!next) return toast("名前を入れて");
  if (current && currentKey && currentKey !== "done") return toast("種目のあとで変えて");
  if (next === myName) {
    fillNameFields();
    return true;
  }
  if (net.online && !opts.localOnly) {
    if (!net.rename(next)) return false;
    if (net.isHost) {
      applyRename(myName, next);
      myName = next;
      net.myName = next;
      saveMyName(next);
      fillNameFields();
      if (!ui.lobby.hidden) showLobby();
      if (!ui.hub.hidden) ui.hudScore.textContent = scoreLine();
    }
    return true;
  }
  applyRename(myName, next);
  myName = next;
  net.myName = next;
  saveMyName(next);
  if (players[0] !== next) players[0] = next;
  fillNameFields();
  if (!ui.hub.hidden) ui.hudScore.textContent = scoreLine();
  return true;
}

function toast(text) {
  ui.toast.hidden = false;
  ui.toast.textContent = text;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => {
    ui.toast.hidden = true;
  }, 1600);
}

function scoreLine() {
  return players.map((p) => `${p} ${scores[p] || 0}`).join(" · ");
}

function namesFromSeats() {
  return net.seats.map((s) => s.name);
}

function showLobby() {
  hideAll();
  setOverlay(ui.lobby, true);
  net.phase = "lobby";
  ui.roomCode.textContent = net.code;
  ui.lobbyList.innerHTML = "";
  const hostId = net.seats[0]?.id;
  net.seats.forEach((s) => {
    const li = document.createElement("li");
    const you = s.id === net.myId ? "（あなた）" : "";
    const host = s.id === hostId ? "・主催" : "";
    li.textContent = `${s.name}${you}${host}`;
    ui.lobbyList.append(li);
  });
  ui.lobbyTable.hidden = !net.isHost;
  ui.lobbyHint.textContent = net.isHost
    ? "コードを共有して、2人以上そろったら卓を出す"
    : "主催者が卓を出すまで待ってください";
  ui.lobbyTable.disabled = net.seats.length < 2;
  fillNameFields();
}

function randomKey() {
  const keys = Object.keys(labels());
  return keys[Math.floor(Math.random() * keys.length)];
}

function renderHubButtons() {
  ui.grid.innerHTML = "";
  const pack = labels();
  const lucky = document.createElement("button");
  lucky.type = "button";
  lucky.className = "btn-game omakase";
  lucky.textContent = "おまかせ";
  lucky.disabled = net.online && !net.isHost;
  lucky.addEventListener("click", () => startGame(randomKey()));
  ui.grid.append(lucky);
  for (const key of Object.keys(pack)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-game";
    btn.dataset.game = key;
    btn.textContent = SHORT[key];
    btn.disabled = net.online && !net.isHost;
    btn.addEventListener("click", () => startGame(key));
    ui.grid.append(btn);
  }
}

function showHub() {
  hideAll();
  ui.hub.hidden = false;
  ui.hud.hidden = false;
  ui.hudKicker.textContent = net.online ? `部屋 ${net.code}` : "卓";
  ui.hudTitle.textContent = "輪宴";
  ui.hudScore.textContent = scoreLine();
  ui.hubCopy.textContent = net.online
    ? net.isHost
      ? "おまかせ、または種目を選ぶ。全員が同時に指で競う"
      : "主催者が種目を選びます。自分の画面を指で操作"
    : "おまかせで次々に。卓の飾りか下の種目から選んでもよい";
  current = null;
  currentKey = null;
  net.phase = "hub";
  ui.action.hidden = false;
  const versusUi = document.querySelector("#versus-ui");
  if (versusUi) versusUi.hidden = true;
  const ink = document.querySelector("#ink");
  if (ink) ink.hidden = true;
  world.setHubVisible(true);
  try {
    world.setHubMode(net.online ? "online" : "local");
  } catch (err) {
    console.error(err);
    toast("卓の飾り付けに失敗");
  }
  renderHubButtons();
  fillNameFields();
}

function applyHud(h, fromNet = false) {
  if (!h) return;
  ui.who.textContent = h.who;
  ui.prompt.textContent = h.prompt;
  ui.action.textContent = h.action;
  if (h.secret) {
    ui.secret.hidden = false;
    ui.secret.textContent = h.secret;
  } else if (h.votes || !fromNet) {
    ui.secret.hidden = true;
  }
  ui.votes.innerHTML = "";
  if (h.votes) {
    ui.secret.hidden = true;
    ui.votes.hidden = false;
    h.votes.forEach((name) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = name;
      b.addEventListener("click", () => sendAct({ kind: "vote", name: net.myName || name, target: name }));
      ui.votes.append(b);
    });
  } else {
    ui.votes.hidden = true;
  }
  ui.action.hidden = !!h.canvasPlay;
  ui.play.classList.toggle("canvas-play", !!h.canvasPlay);
  const versusUi = document.querySelector("#versus-ui");
  if (versusUi) {
    versusUi.hidden = !h.versus;
    if (h.versus) {
      ui.play.hidden = true;
      document.querySelector("#versus-far-name").textContent = h.farName;
      document.querySelector("#versus-far-hp").textContent = h.farHp;
      document.querySelector("#versus-near-name").textContent = h.nearName;
      document.querySelector("#versus-near-hp").textContent = h.nearHp;
    }
  }
  const ctx = { online: net.online, name: net.myName, isHost: net.isHost };
  const mine = current?.canAct ? current.canAct(ctx) : !net.online || h.who === "みんな" || h.who === "全員" || h.who === net.myName;
  ui.action.disabled = !mine;
  if (net.online && net.isHost && !fromNet && current && !h.canvasPlay) {
    net.broadcast({
      t: "hud",
      hud: { ...h, secret: undefined, votes: h.votes },
      index: current.index,
    });
  }
}

function startGame(key, opts = {}, fromNet = false) {
  if (net.online && !net.isHost && !fromNet) return toast("主催者が種目を選びます");
  const game = games[key];
  if (!game) return;
  if (current) current.exit();
  replayKey = key;
  currentKey = key;
  current = game;
  net.phase = "play";
  const authority = !net.online || net.isHost;
  const h = game.enter(players, { ...opts, authority, myName: net.myName });
  hideAll();
  ui.play.hidden = false;
  ui.hud.hidden = false;
  const pack = labels();
  ui.hudKicker.textContent = pack[key]?.[1] || "";
  ui.hudTitle.textContent = pack[key]?.[0] || key;
  ui.hudScore.textContent = scoreLine();
  applyHud(h, fromNet);
  audio.chime();
  if (net.online && net.isHost && !fromNet) {
    net.broadcast({
      t: "start",
      key,
      players,
      scores,
      extra: current.shareState?.() || { fuse: current.fuse },
    });
  }
}

function finish(result, fromNet = false) {
  if (!currentKey || currentKey === "done") return;
  currentKey = "done";
  const versusUi = document.querySelector("#versus-ui");
  if (versusUi) versusUi.hidden = true;
  const ink = document.querySelector("#ink");
  if (ink) ink.hidden = true;
  ui.action.hidden = false;
  if (fromNet && result.scores) scores = result.scores;
  else if (result.winner) scores[result.winner] = (scores[result.winner] || 0) + 1;
  hideAll();
  setOverlay(ui.result, true);
  ui.hud.hidden = false;
  ui.hudScore.textContent = scoreLine();
  ui.resultKicker.textContent = "決着";
  ui.resultTitle.textContent = result.title;
  ui.resultLead.textContent = result.lead;
  if (result.dare) {
    ui.resultDare.hidden = false;
    ui.resultDare.textContent = result.dare;
  } else {
    ui.resultDare.hidden = true;
  }
  if (net.online && net.isHost && !fromNet) {
    net.broadcast({ t: "finish", result: { ...result, scores }, scores });
  }
}

function handleOut(out) {
  if (!out) return;
  if (out.submitScore != null) {
    sendAct({ kind: "score", name: net.myName, score: out.submitScore });
    toast("記録を送った");
    return;
  }
  if (out.hud) applyHud(out.hud);
  else if (!out.end) applyHud(out);
  if (out.end) finish(out);
}

function collectExtra() {
  if (current?.collect) return current.collect(net.myName);
  return { kind: "tap", name: net.myName };
}

function applyAct(extra) {
  if (!current || currentKey === "done") return null;
  if (current.act) return current.act(extra || {});
  return null;
}

function canAct() {
  if (!current || currentKey === "done") return false;
  const ctx = { online: net.online, name: net.myName, isHost: net.isHost };
  if (current.canAct) return current.canAct(ctx);
  if (!net.online) return true;
  return current.players[current.index] === net.myName;
}

function sendAct(extra) {
  extra.name = extra.name || net.myName;
  if (!net.online) {
    handleOut(applyAct(extra));
    return;
  }
  if (net.isHost) {
    handleOut(applyAct(extra));
    net.broadcast({ t: "act", extra });
    return;
  }
  net.send({ t: "act", extra, name: net.myName });
}

function goHomeTable(fromNet = false) {
  if (net.online && !net.isHost && !fromNet) return toast("主催者が卓へ戻します");
  if (current) current.exit();
  showHub();
  if (net.online && net.isHost && !fromNet) net.broadcast({ t: "hub", scores });
}

function syncPlayersFromNet() {
  players = namesFromSeats();
  const next = {};
  for (const p of players) next[p] = scores[p] || 0;
  scores = next;
}

net.onEvent = (ev) => {
  if (ev.type === "roster") {
    net.seats = ev.seats;
    syncPlayersFromNet();
    if (!ui.lobby.hidden) showLobby();
    if (!ui.hub.hidden) {
      ui.hudScore.textContent = scoreLine();
    }
    return;
  }
  if (ev.type === "drop") {
    toast("接続が切れました");
    net.close();
    hideAll();
    setOverlay(ui.title, true);
    ui.hud.hidden = true;
    return;
  }
  if (ev.type !== "msg") return;
  const { msg } = ev;
  if (msg.t === "err") {
    toast(msg.text);
    return;
  }
  if (msg.t === "welcome") {
    net.seats = msg.seats;
    net.myName = msg.you;
    myName = msg.you;
    saveMyName(myName);
    net.code = msg.code;
    syncPlayersFromNet();
    fillNameFields();
    if (msg.phase === "hub" || msg.phase === "play") showHub();
    else showLobby();
    return;
  }
  if (msg.t === "renamed") {
    applyRename(msg.from, msg.to);
    net.seats = msg.seats || net.seats;
    const me = net.seats.find((s) => s.id === net.myId);
    if (me) {
      myName = me.name;
      net.myName = me.name;
      saveMyName(myName);
    }
    syncPlayersFromNet();
    fillNameFields();
    if (!ui.lobby.hidden) showLobby();
    if (!ui.hub.hidden) ui.hudScore.textContent = scoreLine();
    return;
  }
  if (msg.t === "roster") {
    net.seats = msg.seats;
    syncPlayersFromNet();
    if (!ui.lobby.hidden) showLobby();
    return;
  }
  if (net.isHost && msg.t === "act") {
    if (!canActFrom(msg.name)) return;
    const out = applyAct(msg.extra || {});
    net.broadcast({ t: "act", extra: msg.extra });
    handleOut(out);
    return;
  }
  if (!net.isHost && msg.t === "act") {
    handleOut(applyAct(msg.extra || {}));
    return;
  }
  if (!net.isHost && msg.t === "start") {
    players = msg.players;
    scores = msg.scores || scores;
    startGame(msg.key, { ...(msg.extra || {}), fuse: msg.extra?.fuse ?? msg.fuse }, true);
    return;
  }
  if (!net.isHost && msg.t === "hud") {
    if (current && typeof msg.index === "number") {
      current.index = msg.index;
      if (msg.rolls) current.rolls = msg.rolls;
    }
    applyHud(msg.hud, true);
    return;
  }
  if (!net.isHost && msg.t === "finish") {
    finish(msg.result, true);
    return;
  }
  if (!net.isHost && msg.t === "hub") {
    if (msg.scores) scores = msg.scores;
    goHomeTable(true);
  }
};

function canActFrom(name) {
  if (!current || currentKey === "done") return false;
  if (current.tallies) return true;
  if (current.canAct) return current.canAct({ online: true, name, isHost: name === net.myName && net.isHost });
  return current.players[current.index] === name;
}

document.querySelector("#btn-start").addEventListener("click", () => {
  audio.unlock();
  commitMyName(ui.myName?.value || myName, { localOnly: true });
  net.close();
  hideAll();
  setOverlay(ui.players, true);
  if (players[0] !== myName) players[0] = myName;
  renderSeats();
});

document.querySelector("#btn-online").addEventListener("click", () => {
  audio.unlock();
  commitMyName(ui.myName?.value || myName, { localOnly: true });
  hideAll();
  setOverlay(ui.online, true);
  fillNameFields();
});

document.querySelector("#btn-online-back").addEventListener("click", () => {
  hideAll();
  setOverlay(ui.title, true);
});

document.querySelector("#btn-how").addEventListener("click", () => {
  hideAll();
  setOverlay(ui.how, true);
});

document.querySelector("#btn-how-close").addEventListener("click", () => {
  hideAll();
  setOverlay(ui.title, true);
});

document.querySelector("#btn-add").addEventListener("click", () => {
  if (players.length >= 8) return toast("8人まで");
  players.push(`席${players.length + 1}`);
  renderSeats();
});

document.querySelector("#btn-to-table").addEventListener("click", () => {
  audio.unlock();
  commitMyName(players[0] || myName, { localOnly: true });
  players = players.map((p, i) => p.trim() || (i === 0 ? myName : `席${i + 1}`));
  players[0] = myName;
  scores = Object.fromEntries(players.map((p) => [p, scores[p] || 0]));
  showHub();
});

document.querySelector("#btn-host").addEventListener("click", async () => {
  commitMyName(ui.onlineName.value || myName, { localOnly: true });
  const name = myName;
  ui.onlineName.value = name;
  toast("部屋をつくっています…");
  try {
    await net.create(name);
    scores = { [name]: 0 };
    players = [name];
    showLobby();
  } catch (err) {
    toast(err.message || "部屋を作れませんでした");
  }
});

document.querySelector("#btn-join").addEventListener("click", async () => {
  commitMyName(ui.onlineName.value || myName, { localOnly: true });
  const name = myName;
  const code = ui.onlineCode.value.trim();
  if (code.length < 4) return toast("4文字のコードを入れて");
  ui.onlineName.value = name;
  toast("入室しています…");
  try {
    await net.join(code, name);
  } catch (err) {
    toast(err.message || "入れませんでした");
    await net.close();
  }
});

document.querySelector("#btn-copy-code").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(net.code);
    toast("コードをコピーした");
  } catch {
    toast(net.code);
  }
});

document.querySelector("#btn-lobby-table").addEventListener("click", () => {
  if (!net.isHost) return;
  if (net.seats.length < 2) return toast("2人以上で卓を出す");
  syncPlayersFromNet();
  showHub();
  net.broadcast({ t: "hub", scores });
});

document.querySelector("#btn-lobby-leave").addEventListener("click", async () => {
  await net.close();
  hideAll();
  setOverlay(ui.title, true);
  ui.hud.hidden = true;
  fillNameFields();
});

document.querySelector("#btn-lobby-rename").addEventListener("click", () => {
  commitMyName(ui.lobbyName.value || myName);
});

function openNameEdit() {
  if (current && currentKey && currentKey !== "done") return toast("種目のあとで変えて");
  ui.nameEdit.value = myName;
  setOverlay(ui.nameScreen, true);
}

document.querySelector("#btn-hub-name").addEventListener("click", openNameEdit);

document.querySelector("#btn-name-ok").addEventListener("click", () => {
  if (!commitMyName(ui.nameEdit.value || myName)) return;
  setOverlay(ui.nameScreen, false);
});

document.querySelector("#btn-name-back").addEventListener("click", () => {
  setOverlay(ui.nameScreen, false);
});

if (ui.myName) {
  ui.myName.addEventListener("change", () => commitMyName(ui.myName.value || myName, { localOnly: true }));
}

if (ui.onlineName) {
  ui.onlineName.addEventListener("change", () => commitMyName(ui.onlineName.value || myName, { localOnly: true }));
}

fillNameFields();

document.querySelector("#btn-back").addEventListener("click", () => goHomeTable());

document.querySelector("#btn-action").addEventListener("click", () => {
  if (!canAct()) return toast("まだあなたの番じゃない");
  sendAct(collectExtra());
});

document.querySelector("#btn-again").addEventListener("click", () => {
  if (net.online && !net.isHost) return toast("主催者がもういちどします");
  if (current) current.exit();
  startGame(replayKey);
});

document.querySelector("#btn-result-hub").addEventListener("click", () => goHomeTable());

function playPointer(e, type) {
  if (!ui.title.hidden || !ui.how.hidden || !ui.players.hidden || !ui.online.hidden || !ui.lobby.hidden || !ui.nameScreen.hidden) return false;
  if (!ui.result.hidden) return false;
  if (current?.pointer && currentKey && currentKey !== "done") {
    const points = e.changedTouches ? Array.from(e.changedTouches) : [e];
    for (const t of points) {
      const g = world.groundPoint(t.clientX, t.clientY);
      current.pointer({
        type,
        id: t.pointerId ?? t.identifier ?? 0,
        x: t.clientX,
        y: t.clientY,
        gx: g?.x,
        gz: g?.z,
      });
    }
    return true;
  }
  return false;
}

function onPointer(e) {
  if (playPointer(e, "down")) {
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    return;
  }
  const t = e.changedTouches ? e.changedTouches[0] : e;
  if (!ui.title.hidden || !ui.how.hidden || !ui.players.hidden || !ui.online.hidden || !ui.lobby.hidden || !ui.nameScreen.hidden) return;
  if (!ui.result.hidden) return;
  const hit = world.pick(t.clientX, t.clientY);
  if (!hit) return;
  if (!current && labels()[hit]) {
    startGame(hit);
    return;
  }
  if (current && hit.endsWith("-live")) ui.action.click();
}

canvas.addEventListener("pointerdown", onPointer);
canvas.addEventListener("pointermove", (e) => playPointer(e, "move"));
canvas.addEventListener("pointerup", (e) => playPointer(e, "up"));
canvas.addEventListener("pointercancel", (e) => playPointer(e, "up"));

const inkEl = document.querySelector("#ink");
if (inkEl) {
  inkEl.addEventListener("pointerdown", onPointer);
  inkEl.addEventListener("pointermove", (e) => playPointer(e, "move"));
  inkEl.addEventListener("pointerup", (e) => playPointer(e, "up"));
}

function frame() {
  const dt = Math.min(0.05, world.clock.getDelta());
  world.pulse(dt);
  if (current?.update && currentKey && currentKey !== "done") {
    const out = current.update(dt);
    handleOut(out);
  }
  world.render();
  requestAnimationFrame(frame);
}

frame();
