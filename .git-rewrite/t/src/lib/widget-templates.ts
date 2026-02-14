/**
 * Interactive Widget Templates Library
 * 
 * Based on analysis of world best practices for link-in-bio platforms:
 * - Countdown timers (product launches, events)
 * - Calculators (pricing, tips, conversions)
 * - Games (engagement, gamification)
 * - Social proof widgets
 * - Lead generation tools
 * - Interactive polls/quizzes
 */

export interface WidgetTemplate {
  id: string;
  name: string;
  nameRu: string;
  category: 'games' | 'calculators' | 'timers' | 'engagement' | 'business' | 'social';
  description: string;
  descriptionRu: string;
  icon: string;
  html: string;
  css: string;
  javascript: string;
  thumbnail?: string;
  isPremium?: boolean;
}

export const WIDGET_CATEGORIES = {
  games: { name: 'Games', nameRu: 'Игры', icon: 'Gamepad2' },
  calculators: { name: 'Calculators', nameRu: 'Калькуляторы', icon: 'Calculator' },
  timers: { name: 'Timers', nameRu: 'Таймеры', icon: 'Timer' },
  engagement: { name: 'Engagement', nameRu: 'Вовлечение', icon: 'Heart' },
  business: { name: 'Business', nameRu: 'Бизнес', icon: 'Briefcase' },
  social: { name: 'Social', nameRu: 'Социальные', icon: 'Users' },
} as const;

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  // ==================== GAMES ====================
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    nameRu: 'Сапёр',
    category: 'games',
    description: 'Classic minesweeper game',
    descriptionRu: 'Классическая игра сапёр',
    icon: 'Bomb',
    html: `<div class="game-app">
  <div class="game-glass">
    <div class="game-header">
      <h1>💣 Mines</h1>
      <div class="game-sub">Tap — open · Hold — flag</div>
    </div>
    <div id="grid" class="game-grid"></div>
    <div class="game-footer">
      <button onclick="startGame()">New Game</button>
      <div id="status" class="game-status"></div>
    </div>
  </div>
</div>`,
    css: `:root {
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.18);
  --accent: #7b8cff;
}
.game-app { width: 100%; max-width: 380px; margin: 0 auto; padding: 12px; }
.game-glass { background: var(--glass-bg); backdrop-filter: blur(16px); border: 1px solid var(--glass-border); border-radius: 20px; padding: 14px; }
.game-header { text-align: center; margin-bottom: 10px; }
.game-header h1 { font-size: 18px; font-weight: 600; margin: 0; color: #fff; }
.game-sub { font-size: 12px; opacity: 0.7; color: #ccc; }
.game-grid { display: grid; gap: 5px; margin-top: 12px; touch-action: manipulation; }
.game-cell { aspect-ratio: 1; border-radius: 10px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15); display: flex; justify-content: center; align-items: center; font-weight: 600; font-size: 14px; user-select: none; cursor: pointer; transition: all 0.15s; color: #fff; }
.game-cell:hover { background: rgba(255,255,255,0.2); }
.game-cell.open { background: rgba(255,255,255,0.25); transform: scale(0.96); }
.game-cell.flag { background: rgba(123,140,255,0.4); }
.game-cell.mine { background: rgba(255,92,92,0.5); }
.game-footer { margin-top: 12px; text-align: center; }
.game-footer button { width: 100%; padding: 12px; border-radius: 12px; border: none; background: linear-gradient(135deg, #7b8cff, #9aa7ff); color: #fff; font-weight: 600; cursor: pointer; }
.game-status { font-size: 12px; opacity: 0.8; margin-top: 8px; color: #fff; }`,
    javascript: `let rows, cols, mines, grid = [], gameOver = false, longPress;
const gridEl = document.getElementById("grid"), statusEl = document.getElementById("status");
function calcGrid() { const size = Math.min(window.innerWidth - 60, 340); cols = 8; rows = 8; mines = 10; gridEl.style.gridTemplateColumns = \`repeat(\${cols}, 1fr)\`; }
function startGame() { calcGrid(); grid = []; gridEl.innerHTML = ""; gameOver = false; statusEl.textContent = "";
  for (let r = 0; r < rows; r++) { grid[r] = []; for (let c = 0; c < cols; c++) grid[r][c] = { mine:false, open:false, flag:false, count:0 }; }
  let placed = 0; while (placed < mines) { const r = Math.random() * rows | 0, c = Math.random() * cols | 0; if (!grid[r][c].mine) { grid[r][c].mine = true; placed++; } }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (grid[r][c].mine) continue; let n = 0; for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) { if (grid[r+dr]?.[c+dc]?.mine) n++; } grid[r][c].count = n; }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const el = document.createElement("div"); el.className = "game-cell"; el.oncontextmenu = e => { e.preventDefault(); flag(r,c); }; el.addEventListener("touchstart", () => { longPress = setTimeout(() => flag(r,c), 400); }); el.addEventListener("touchend", () => { clearTimeout(longPress); open(r,c); }); el.onclick = () => open(r,c); gridEl.appendChild(el); }
}
function open(r,c) { if (gameOver) return; const cell = grid[r][c], el = gridEl.children[r*cols+c]; if (cell.open || cell.flag) return; cell.open = true; el.classList.add("open"); if (cell.mine) { el.textContent = "💣"; el.classList.add("mine"); end(false); return; } if (cell.count) el.textContent = cell.count; else for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) grid[r+dr]?.[c+dc] && open(r+dr,c+dc); check(); }
function flag(r,c) { if (gameOver) return; const cell = grid[r][c]; if (cell.open) return; cell.flag = !cell.flag; const el = gridEl.children[r*cols+c]; el.classList.toggle("flag"); el.textContent = cell.flag ? "🚩" : ""; }
function end(win) { gameOver = true; statusEl.textContent = win ? "🏆 Victory!" : "💥 Game Over"; grid.flat().forEach((c,i)=>{ if(c.mine){ gridEl.children[i].textContent = "💣"; gridEl.children[i].classList.add("mine"); }}); }
function check() { let opened = 0; grid.flat().forEach(c => c.open && opened++); if (opened === rows*cols - mines) end(true); }
startGame();`
  },
  {
    id: 'slot-machine',
    name: 'Slot Machine',
    nameRu: 'Слот-машина',
    category: 'games',
    description: 'Lucky slot machine game',
    descriptionRu: 'Игровой автомат на удачу',
    icon: 'Cherry',
    html: `<div class="slot-container">
  <h2>🎰 Lucky Spin</h2>
  <div class="slot-machine">
    <div class="slot-window">
      <div class="slot-reel" id="reel1">🍒</div>
      <div class="slot-reel" id="reel2">🍋</div>
      <div class="slot-reel" id="reel3">🍊</div>
    </div>
  </div>
  <button class="slot-button" id="spinBtn" onclick="spin()">SPIN!</button>
  <div class="slot-result" id="result"></div>
</div>`,
    css: `.slot-container { text-align: center; padding: 20px; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 20px; color: #fff; }
.slot-container h2 { margin: 0 0 20px; font-size: 22px; }
.slot-machine { background: linear-gradient(145deg, #2a2a4a, #1a1a3a); padding: 15px; border-radius: 16px; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
.slot-window { display: flex; gap: 8px; background: #000; padding: 15px; border-radius: 12px; }
.slot-reel { width: 60px; height: 70px; background: linear-gradient(180deg, #2a2a4a, #1a1a3a); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 36px; border: 2px solid #444; transition: transform 0.1s; }
.slot-reel.spinning { animation: slotSpin 0.1s infinite; }
@keyframes slotSpin { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
.slot-button { margin-top: 20px; padding: 14px 40px; font-size: 18px; font-weight: bold; background: linear-gradient(135deg, #ff6b6b, #ffa502); color: #fff; border: none; border-radius: 30px; cursor: pointer; box-shadow: 0 5px 20px rgba(255,107,107,0.4); transition: all 0.2s; }
.slot-button:hover { transform: scale(1.05); }
.slot-button:disabled { opacity: 0.6; cursor: not-allowed; }
.slot-result { margin-top: 15px; font-size: 18px; min-height: 30px; }`,
    javascript: `const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
const btn = document.getElementById('spinBtn');
const result = document.getElementById('result');
function spin() {
  btn.disabled = true; result.textContent = ''; reels.forEach(r => r.classList.add('spinning'));
  let spins = [0, 0, 0], final = [];
  reels.forEach((reel, i) => {
    const interval = setInterval(() => { reel.textContent = symbols[Math.floor(Math.random() * symbols.length)]; }, 80);
    setTimeout(() => { clearInterval(interval); reel.classList.remove('spinning'); final[i] = symbols[Math.floor(Math.random() * symbols.length)]; reel.textContent = final[i]; if (i === 2) checkWin(final); }, 500 + i * 400);
  });
}
function checkWin(final) {
  btn.disabled = false;
  if (final[0] === final[1] && final[1] === final[2]) { result.innerHTML = '🎉 JACKPOT! 🎉'; result.style.color = '#ffd700'; }
  else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) { result.innerHTML = '✨ Nice! ✨'; result.style.color = '#7bed9f'; }
  else { result.innerHTML = 'Try again!'; result.style.color = '#fff'; }
}`
  },
  {
    id: 'memory-game',
    name: 'Memory Game',
    nameRu: 'Игра на память',
    category: 'games',
    description: 'Match pairs memory game',
    descriptionRu: 'Найди пары карточек',
    icon: 'Brain',
    html: `<div class="memory-container">
  <div class="memory-header">
    <h2>🧠 Memory</h2>
    <div class="memory-stats">Moves: <span id="moves">0</span></div>
  </div>
  <div class="memory-grid" id="memoryGrid"></div>
  <button class="memory-btn" onclick="initMemory()">New Game</button>
</div>`,
    css: `.memory-container { padding: 16px; background: linear-gradient(135deg, #2d3436, #636e72); border-radius: 20px; }
.memory-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; color: #fff; }
.memory-header h2 { margin: 0; font-size: 20px; }
.memory-stats { font-size: 14px; opacity: 0.9; }
.memory-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.memory-card { aspect-ratio: 1; background: linear-gradient(135deg, #6c5ce7, #a29bfe); border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 28px; transition: all 0.3s; transform-style: preserve-3d; }
.memory-card.hidden { background: linear-gradient(135deg, #636e72, #2d3436); }
.memory-card.hidden::after { content: '?'; color: rgba(255,255,255,0.5); font-size: 24px; }
.memory-card.matched { background: linear-gradient(135deg, #00b894, #55efc4); transform: scale(0.95); }
.memory-btn { width: 100%; margin-top: 16px; padding: 12px; background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; }`,
    javascript: `const emojis = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎬', '🎤', '🎧'];
let cards = [], flipped = [], matched = [], moves = 0, canFlip = true;
function initMemory() {
  const grid = document.getElementById('memoryGrid');
  const deck = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
  cards = []; flipped = []; matched = []; moves = 0; canFlip = true;
  document.getElementById('moves').textContent = '0';
  grid.innerHTML = '';
  deck.forEach((emoji, i) => {
    const card = document.createElement('div');
    card.className = 'memory-card hidden';
    card.dataset.emoji = emoji;
    card.dataset.index = i;
    card.onclick = () => flipCard(i);
    cards.push(card);
    grid.appendChild(card);
  });
}
function flipCard(i) {
  if (!canFlip || flipped.includes(i) || matched.includes(i)) return;
  const card = cards[i];
  card.classList.remove('hidden');
  card.textContent = card.dataset.emoji;
  flipped.push(i);
  if (flipped.length === 2) {
    moves++; document.getElementById('moves').textContent = moves;
    canFlip = false;
    const [a, b] = flipped;
    if (cards[a].dataset.emoji === cards[b].dataset.emoji) {
      matched.push(a, b);
      cards[a].classList.add('matched');
      cards[b].classList.add('matched');
      flipped = []; canFlip = true;
      if (matched.length === cards.length) setTimeout(() => alert('🎉 You won in ' + moves + ' moves!'), 300);
    } else {
      setTimeout(() => {
        cards[a].classList.add('hidden'); cards[a].textContent = '';
        cards[b].classList.add('hidden'); cards[b].textContent = '';
        flipped = []; canFlip = true;
      }, 800);
    }
  }
}
initMemory();`
  },
  {
    id: 'wheel-fortune',
    name: 'Wheel of Fortune',
    nameRu: 'Колесо фортуны',
    category: 'games',
    description: 'Spin the wheel prize game',
    descriptionRu: 'Покрути колесо и выиграй приз',
    icon: 'RotateCw',
    html: `<div class="wheel-container">
  <h2>🎡 Wheel of Fortune</h2>
  <div class="wheel-wrapper">
    <div class="wheel-pointer">▼</div>
    <canvas id="wheel" width="280" height="280"></canvas>
  </div>
  <button class="wheel-spin-btn" id="spinWheel" onclick="spinWheel()">SPIN!</button>
  <div class="wheel-result" id="wheelResult"></div>
</div>`,
    css: `.wheel-container { text-align: center; padding: 20px; background: linear-gradient(135deg, #1e3c72, #2a5298); border-radius: 20px; color: #fff; }
.wheel-container h2 { margin: 0 0 16px; font-size: 20px; }
.wheel-wrapper { position: relative; display: inline-block; }
.wheel-pointer { position: absolute; top: -5px; left: 50%; transform: translateX(-50%); font-size: 28px; z-index: 10; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
#wheel { border-radius: 50%; box-shadow: 0 0 30px rgba(0,0,0,0.3); }
.wheel-spin-btn { margin-top: 20px; padding: 14px 50px; font-size: 18px; font-weight: bold; background: linear-gradient(135deg, #f39c12, #e74c3c); color: #fff; border: none; border-radius: 30px; cursor: pointer; transition: all 0.2s; }
.wheel-spin-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.wheel-result { margin-top: 16px; font-size: 20px; font-weight: bold; min-height: 30px; }`,
    javascript: `const prizes = ['🎁 Gift', '💰 Cash', '⭐ Star', '🎮 Game', '🍕 Food', '❤️ Love', '🚀 Trip', '📱 Phone'];
const colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#e91e63', '#00bcd4'];
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
let rotation = 0, spinning = false;
function drawWheel() {
  const cx = 140, cy = 140, r = 130, arc = (2 * Math.PI) / prizes.length;
  ctx.clearRect(0, 0, 280, 280);
  prizes.forEach((prize, i) => {
    const angle = rotation + i * arc;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, angle, angle + arc); ctx.fillStyle = colors[i]; ctx.fill();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle + arc / 2); ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(prize, r - 12, 5); ctx.restore();
  });
  ctx.beginPath(); ctx.arc(cx, cy, 20, 0, 2 * Math.PI); ctx.fillStyle = '#fff'; ctx.fill();
}
function spinWheel() {
  if (spinning) return; spinning = true;
  document.getElementById('spinWheel').disabled = true;
  document.getElementById('wheelResult').textContent = '';
  const spins = 5 + Math.random() * 5;
  const target = rotation + spins * 2 * Math.PI;
  const duration = 4000;
  const start = performance.now();
  function animate(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    rotation = rotation + (target - rotation) * eased / 10;
    if (progress < 1) { rotation = rotation + (target - rotation) * 0.02; }
    drawWheel();
    if (progress < 1) requestAnimationFrame(animate);
    else {
      spinning = false; document.getElementById('spinWheel').disabled = false;
      const normalizedRotation = rotation % (2 * Math.PI);
      const index = Math.floor((2 * Math.PI - normalizedRotation + Math.PI / 2) / (2 * Math.PI / prizes.length)) % prizes.length;
      document.getElementById('wheelResult').innerHTML = '🎉 ' + prizes[index] + '!';
    }
  }
  requestAnimationFrame(animate);
}
drawWheel();`
  },

  // ==================== CALCULATORS ====================
  {
    id: 'tip-calculator',
    name: 'Tip Calculator',
    nameRu: 'Калькулятор чаевых',
    category: 'calculators',
    description: 'Calculate tips and split bills',
    descriptionRu: 'Рассчитай чаевые и раздели счёт',
    icon: 'Receipt',
    html: `<div class="tip-calc">
  <h3>💵 Tip Calculator</h3>
  <div class="tip-field">
    <label>Bill Amount</label>
    <input type="number" id="billAmount" placeholder="0.00" oninput="calculateTip()">
  </div>
  <div class="tip-field">
    <label>Tip %</label>
    <div class="tip-buttons">
      <button onclick="setTip(10)">10%</button>
      <button onclick="setTip(15)" class="active">15%</button>
      <button onclick="setTip(20)">20%</button>
      <button onclick="setTip(25)">25%</button>
    </div>
  </div>
  <div class="tip-field">
    <label>Split</label>
    <div class="tip-split">
      <button onclick="changeSplit(-1)">−</button>
      <span id="splitCount">1</span>
      <button onclick="changeSplit(1)">+</button>
    </div>
  </div>
  <div class="tip-results">
    <div class="tip-result"><span>Tip</span><strong id="tipAmount">$0.00</strong></div>
    <div class="tip-result"><span>Total</span><strong id="totalAmount">$0.00</strong></div>
    <div class="tip-result"><span>Per Person</span><strong id="perPerson">$0.00</strong></div>
  </div>
</div>`,
    css: `.tip-calc { padding: 20px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 20px; color: #fff; }
.tip-calc h3 { margin: 0 0 20px; font-size: 20px; text-align: center; }
.tip-field { margin-bottom: 16px; }
.tip-field label { display: block; font-size: 12px; opacity: 0.9; margin-bottom: 8px; }
.tip-field input { width: 100%; padding: 14px; font-size: 24px; font-weight: bold; text-align: center; border: none; border-radius: 12px; background: rgba(255,255,255,0.2); color: #fff; }
.tip-field input::placeholder { color: rgba(255,255,255,0.5); }
.tip-buttons { display: flex; gap: 8px; }
.tip-buttons button { flex: 1; padding: 12px; border: 2px solid rgba(255,255,255,0.3); background: transparent; color: #fff; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.tip-buttons button.active { background: #fff; color: #667eea; border-color: #fff; }
.tip-split { display: flex; align-items: center; justify-content: center; gap: 20px; }
.tip-split button { width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); background: transparent; color: #fff; font-size: 24px; cursor: pointer; }
.tip-split span { font-size: 28px; font-weight: bold; min-width: 40px; text-align: center; }
.tip-results { background: rgba(255,255,255,0.15); border-radius: 16px; padding: 16px; margin-top: 20px; }
.tip-result { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
.tip-result:last-child { border: none; }
.tip-result strong { font-size: 18px; }`,
    javascript: `let tipPercent = 15, splitCount = 1;
function setTip(percent) {
  tipPercent = percent;
  document.querySelectorAll('.tip-buttons button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  calculateTip();
}
function changeSplit(delta) {
  splitCount = Math.max(1, splitCount + delta);
  document.getElementById('splitCount').textContent = splitCount;
  calculateTip();
}
function calculateTip() {
  const bill = parseFloat(document.getElementById('billAmount').value) || 0;
  const tip = bill * (tipPercent / 100);
  const total = bill + tip;
  const perPerson = total / splitCount;
  document.getElementById('tipAmount').textContent = '$' + tip.toFixed(2);
  document.getElementById('totalAmount').textContent = '$' + total.toFixed(2);
  document.getElementById('perPerson').textContent = '$' + perPerson.toFixed(2);
}`
  },
  {
    id: 'bmi-calculator',
    name: 'BMI Calculator',
    nameRu: 'Калькулятор ИМТ',
    category: 'calculators',
    description: 'Calculate Body Mass Index',
    descriptionRu: 'Рассчитай индекс массы тела',
    icon: 'Scale',
    html: `<div class="bmi-calc">
  <h3>⚖️ BMI Calculator</h3>
  <div class="bmi-inputs">
    <div class="bmi-field">
      <label>Height (cm)</label>
      <input type="number" id="height" placeholder="170" oninput="calcBMI()">
    </div>
    <div class="bmi-field">
      <label>Weight (kg)</label>
      <input type="number" id="weight" placeholder="70" oninput="calcBMI()">
    </div>
  </div>
  <div class="bmi-result" id="bmiResult">
    <div class="bmi-value" id="bmiValue">--</div>
    <div class="bmi-label" id="bmiLabel">Enter your data</div>
  </div>
  <div class="bmi-scale">
    <div class="bmi-bar"><div class="bmi-indicator" id="bmiIndicator"></div></div>
    <div class="bmi-labels"><span>Under</span><span>Normal</span><span>Over</span><span>Obese</span></div>
  </div>
</div>`,
    css: `.bmi-calc { padding: 20px; background: linear-gradient(135deg, #00b894, #00cec9); border-radius: 20px; color: #fff; }
.bmi-calc h3 { margin: 0 0 20px; text-align: center; font-size: 20px; }
.bmi-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.bmi-field label { display: block; font-size: 12px; opacity: 0.9; margin-bottom: 6px; }
.bmi-field input { width: 100%; padding: 12px; font-size: 18px; font-weight: bold; text-align: center; border: none; border-radius: 10px; background: rgba(255,255,255,0.2); color: #fff; }
.bmi-result { text-align: center; margin: 24px 0; }
.bmi-value { font-size: 48px; font-weight: bold; }
.bmi-label { font-size: 16px; opacity: 0.9; margin-top: 4px; }
.bmi-scale { margin-top: 16px; }
.bmi-bar { height: 12px; background: linear-gradient(90deg, #3498db 0%, #2ecc71 25%, #f1c40f 50%, #e74c3c 75%, #8e44ad 100%); border-radius: 6px; position: relative; }
.bmi-indicator { width: 16px; height: 16px; background: #fff; border-radius: 50%; position: absolute; top: -2px; transform: translateX(-50%); box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: left 0.3s; left: 0%; }
.bmi-labels { display: flex; justify-content: space-between; font-size: 10px; opacity: 0.8; margin-top: 6px; }`,
    javascript: `function calcBMI() {
  const h = parseFloat(document.getElementById('height').value) / 100;
  const w = parseFloat(document.getElementById('weight').value);
  const valueEl = document.getElementById('bmiValue');
  const labelEl = document.getElementById('bmiLabel');
  const indicator = document.getElementById('bmiIndicator');
  if (!h || !w) { valueEl.textContent = '--'; labelEl.textContent = 'Enter your data'; indicator.style.left = '0%'; return; }
  const bmi = w / (h * h);
  valueEl.textContent = bmi.toFixed(1);
  let label, pos;
  if (bmi < 18.5) { label = 'Underweight 💨'; pos = (bmi / 18.5) * 25; }
  else if (bmi < 25) { label = 'Normal ✅'; pos = 25 + ((bmi - 18.5) / 6.5) * 25; }
  else if (bmi < 30) { label = 'Overweight ⚠️'; pos = 50 + ((bmi - 25) / 5) * 25; }
  else { label = 'Obese ❌'; pos = Math.min(75 + ((bmi - 30) / 10) * 25, 100); }
  labelEl.textContent = label;
  indicator.style.left = pos + '%';
}`
  },
  {
    id: 'discount-calculator',
    name: 'Discount Calculator',
    nameRu: 'Калькулятор скидок',
    category: 'calculators',
    description: 'Calculate discounts and savings',
    descriptionRu: 'Рассчитай скидку и экономию',
    icon: 'Percent',
    html: `<div class="discount-calc">
  <h3>🏷️ Discount Calculator</h3>
  <div class="disc-field">
    <label>Original Price</label>
    <input type="number" id="origPrice" placeholder="100" oninput="calcDiscount()">
  </div>
  <div class="disc-field">
    <label>Discount %</label>
    <input type="range" id="discPercent" min="0" max="100" value="20" oninput="calcDiscount()">
    <div class="disc-percent-value" id="discValue">20%</div>
  </div>
  <div class="disc-results">
    <div class="disc-result you-save">
      <div class="disc-label">You Save</div>
      <div class="disc-amount" id="savings">$0.00</div>
    </div>
    <div class="disc-result final-price">
      <div class="disc-label">Final Price</div>
      <div class="disc-amount" id="finalPrice">$0.00</div>
    </div>
  </div>
</div>`,
    css: `.discount-calc { padding: 20px; background: linear-gradient(135deg, #e74c3c, #c0392b); border-radius: 20px; color: #fff; }
.discount-calc h3 { margin: 0 0 20px; text-align: center; font-size: 20px; }
.disc-field { margin-bottom: 20px; }
.disc-field label { display: block; font-size: 12px; opacity: 0.9; margin-bottom: 8px; }
.disc-field input[type="number"] { width: 100%; padding: 14px; font-size: 22px; font-weight: bold; text-align: center; border: none; border-radius: 12px; background: rgba(255,255,255,0.2); color: #fff; }
.disc-field input[type="range"] { width: 100%; height: 8px; border-radius: 4px; appearance: none; background: rgba(255,255,255,0.3); }
.disc-field input[type="range"]::-webkit-slider-thumb { appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #fff; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
.disc-percent-value { text-align: center; font-size: 32px; font-weight: bold; margin-top: 10px; }
.disc-results { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.disc-result { background: rgba(255,255,255,0.15); border-radius: 16px; padding: 16px; text-align: center; }
.disc-label { font-size: 12px; opacity: 0.9; margin-bottom: 6px; }
.disc-amount { font-size: 24px; font-weight: bold; }
.you-save { background: rgba(46, 204, 113, 0.3); }
.final-price { background: rgba(255,255,255,0.2); }`,
    javascript: `function calcDiscount() {
  const price = parseFloat(document.getElementById('origPrice').value) || 0;
  const percent = parseInt(document.getElementById('discPercent').value);
  document.getElementById('discValue').textContent = percent + '%';
  const savings = price * (percent / 100);
  const final = price - savings;
  document.getElementById('savings').textContent = '$' + savings.toFixed(2);
  document.getElementById('finalPrice').textContent = '$' + final.toFixed(2);
}
calcDiscount();`
  },
  {
    id: 'age-calculator',
    name: 'Age Calculator',
    nameRu: 'Калькулятор возраста',
    category: 'calculators',
    description: 'Calculate exact age and milestones',
    descriptionRu: 'Узнай точный возраст и вехи',
    icon: 'Calendar',
    html: `<div class="age-calc">
  <h3>🎂 Age Calculator</h3>
  <div class="age-field">
    <label>Date of Birth</label>
    <input type="date" id="birthDate" onchange="calcAge()">
  </div>
  <div class="age-result" id="ageResult">
    <div class="age-main">
      <span class="age-number" id="ageYears">--</span>
      <span class="age-label">years old</span>
    </div>
    <div class="age-details">
      <div class="age-detail"><span id="ageMonths">--</span> months</div>
      <div class="age-detail"><span id="ageDays">--</span> days</div>
      <div class="age-detail"><span id="ageHours">--</span> hours</div>
    </div>
  </div>
  <div class="age-next" id="nextBirthday"></div>
</div>`,
    css: `.age-calc { padding: 20px; background: linear-gradient(135deg, #9b59b6, #8e44ad); border-radius: 20px; color: #fff; }
.age-calc h3 { margin: 0 0 20px; text-align: center; font-size: 20px; }
.age-field { margin-bottom: 20px; }
.age-field label { display: block; font-size: 12px; opacity: 0.9; margin-bottom: 8px; }
.age-field input { width: 100%; padding: 14px; font-size: 16px; border: none; border-radius: 12px; background: rgba(255,255,255,0.2); color: #fff; text-align: center; }
.age-field input::-webkit-calendar-picker-indicator { filter: invert(1); }
.age-result { text-align: center; margin: 24px 0; }
.age-main { margin-bottom: 16px; }
.age-number { font-size: 56px; font-weight: bold; }
.age-label { display: block; font-size: 16px; opacity: 0.9; }
.age-details { display: flex; justify-content: center; gap: 20px; }
.age-detail { background: rgba(255,255,255,0.15); padding: 10px 16px; border-radius: 10px; font-size: 14px; }
.age-detail span { font-weight: bold; }
.age-next { text-align: center; font-size: 14px; opacity: 0.9; margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 12px; }`,
    javascript: `function calcAge() {
  const birth = new Date(document.getElementById('birthDate').value);
  if (isNaN(birth)) return;
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  const totalDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24));
  const totalHours = Math.floor((now - birth) / (1000 * 60 * 60));
  document.getElementById('ageYears').textContent = years;
  document.getElementById('ageMonths').textContent = years * 12 + months;
  document.getElementById('ageDays').textContent = totalDays.toLocaleString();
  document.getElementById('ageHours').textContent = totalHours.toLocaleString();
  const nextBday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBday < now) nextBday.setFullYear(nextBday.getFullYear() + 1);
  const daysToNext = Math.ceil((nextBday - now) / (1000 * 60 * 60 * 24));
  document.getElementById('nextBirthday').textContent = '🎈 ' + daysToNext + ' days until your next birthday!';
}`
  },

  // ==================== TIMERS ====================
  {
    id: 'countdown-event',
    name: 'Event Countdown',
    nameRu: 'Обратный отсчёт',
    category: 'timers',
    description: 'Countdown to any event',
    descriptionRu: 'Отсчёт до любого события',
    icon: 'Clock',
    html: `<div class="event-countdown">
  <div class="event-title" id="eventTitle">🎉 Event Starts In</div>
  <div class="countdown-display">
    <div class="countdown-item"><span id="days">00</span><label>Days</label></div>
    <div class="countdown-sep">:</div>
    <div class="countdown-item"><span id="hours">00</span><label>Hours</label></div>
    <div class="countdown-sep">:</div>
    <div class="countdown-item"><span id="mins">00</span><label>Mins</label></div>
    <div class="countdown-sep">:</div>
    <div class="countdown-item"><span id="secs">00</span><label>Secs</label></div>
  </div>
  <div class="countdown-progress"><div class="countdown-bar" id="progressBar"></div></div>
</div>`,
    css: `.event-countdown { padding: 24px; background: linear-gradient(135deg, #2c3e50, #3498db); border-radius: 20px; color: #fff; text-align: center; }
.event-title { font-size: 18px; font-weight: 600; margin-bottom: 20px; }
.countdown-display { display: flex; justify-content: center; align-items: center; gap: 8px; }
.countdown-item { background: rgba(255,255,255,0.15); border-radius: 12px; padding: 16px 12px; min-width: 60px; }
.countdown-item span { display: block; font-size: 32px; font-weight: bold; line-height: 1; }
.countdown-item label { display: block; font-size: 10px; opacity: 0.8; margin-top: 6px; text-transform: uppercase; }
.countdown-sep { font-size: 28px; font-weight: bold; opacity: 0.5; }
.countdown-progress { margin-top: 20px; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden; }
.countdown-bar { height: 100%; background: linear-gradient(90deg, #2ecc71, #27ae60); border-radius: 3px; transition: width 0.5s; width: 0%; }`,
    javascript: `// Set your target date here
const targetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
const startDate = new Date();
function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;
  if (diff <= 0) { document.getElementById('eventTitle').textContent = '🎉 Event Started!'; return; }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  document.getElementById('days').textContent = String(days).padStart(2, '0');
  document.getElementById('hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('mins').textContent = String(mins).padStart(2, '0');
  document.getElementById('secs').textContent = String(secs).padStart(2, '0');
  const total = targetDate - startDate;
  const progress = ((total - diff) / total) * 100;
  document.getElementById('progressBar').style.width = progress + '%';
}
setInterval(updateCountdown, 1000);
updateCountdown();`
  },
  {
    id: 'pomodoro-timer',
    name: 'Pomodoro Timer',
    nameRu: 'Помодоро таймер',
    category: 'timers',
    description: 'Focus timer with breaks',
    descriptionRu: 'Таймер для фокусировки',
    icon: 'Timer',
    html: `<div class="pomodoro">
  <h3 id="pomodoroTitle">🍅 Focus Time</h3>
  <div class="pomo-display" id="pomoDisplay">25:00</div>
  <div class="pomo-controls">
    <button onclick="startPomo()">▶ Start</button>
    <button onclick="pausePomo()">⏸ Pause</button>
    <button onclick="resetPomo()">↻ Reset</button>
  </div>
  <div class="pomo-modes">
    <button class="pomo-mode active" onclick="setMode(25, 'Focus')">Focus</button>
    <button class="pomo-mode" onclick="setMode(5, 'Short Break')">Short</button>
    <button class="pomo-mode" onclick="setMode(15, 'Long Break')">Long</button>
  </div>
</div>`,
    css: `.pomodoro { padding: 24px; background: linear-gradient(135deg, #e74c3c, #c0392b); border-radius: 20px; color: #fff; text-align: center; }
.pomodoro h3 { margin: 0 0 16px; font-size: 18px; }
.pomo-display { font-size: 64px; font-weight: bold; font-family: monospace; margin: 20px 0; }
.pomo-controls { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
.pomo-controls button { padding: 12px 20px; background: rgba(255,255,255,0.2); border: none; border-radius: 10px; color: #fff; font-size: 14px; cursor: pointer; transition: all 0.2s; }
.pomo-controls button:hover { background: rgba(255,255,255,0.3); }
.pomo-modes { display: flex; gap: 8px; }
.pomo-mode { flex: 1; padding: 10px; background: transparent; border: 2px solid rgba(255,255,255,0.3); border-radius: 10px; color: #fff; cursor: pointer; transition: all 0.2s; }
.pomo-mode.active { background: rgba(255,255,255,0.2); border-color: #fff; }`,
    javascript: `let pomoTime = 25 * 60, pomoInterval = null, pomoRunning = false;
function updatePomoDisplay() { const m = Math.floor(pomoTime / 60); const s = pomoTime % 60; document.getElementById('pomoDisplay').textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); }
function startPomo() { if (pomoRunning) return; pomoRunning = true; pomoInterval = setInterval(() => { if (pomoTime > 0) { pomoTime--; updatePomoDisplay(); } else { pausePomo(); alert('⏰ Time is up!'); } }, 1000); }
function pausePomo() { pomoRunning = false; clearInterval(pomoInterval); }
function resetPomo() { pausePomo(); pomoTime = 25 * 60; updatePomoDisplay(); }
function setMode(mins, title) { pausePomo(); pomoTime = mins * 60; document.getElementById('pomodoroTitle').textContent = title === 'Focus' ? '🍅 Focus Time' : title === 'Short Break' ? '☕ Short Break' : '🌴 Long Break'; document.querySelectorAll('.pomo-mode').forEach(b => b.classList.remove('active')); event.target.classList.add('active'); updatePomoDisplay(); }
updatePomoDisplay();`
  },
  {
    id: 'stopwatch',
    name: 'Stopwatch',
    nameRu: 'Секундомер',
    category: 'timers',
    description: 'Precise stopwatch with laps',
    descriptionRu: 'Точный секундомер с кругами',
    icon: 'Watch',
    html: `<div class="stopwatch">
  <div class="sw-display" id="swDisplay">00:00.00</div>
  <div class="sw-controls">
    <button class="sw-btn start" id="swStartBtn" onclick="toggleSW()">Start</button>
    <button class="sw-btn lap" onclick="lapSW()">Lap</button>
    <button class="sw-btn reset" onclick="resetSW()">Reset</button>
  </div>
  <div class="sw-laps" id="swLaps"></div>
</div>`,
    css: `.stopwatch { padding: 24px; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 20px; color: #fff; text-align: center; }
.sw-display { font-size: 52px; font-weight: bold; font-family: monospace; margin-bottom: 24px; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 16px; }
.sw-controls { display: flex; justify-content: center; gap: 12px; margin-bottom: 20px; }
.sw-btn { padding: 14px 24px; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.sw-btn.start { background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff; min-width: 100px; }
.sw-btn.start.running { background: linear-gradient(135deg, #e74c3c, #c0392b); }
.sw-btn.lap { background: rgba(255,255,255,0.2); color: #fff; }
.sw-btn.reset { background: rgba(255,255,255,0.1); color: #fff; }
.sw-laps { max-height: 150px; overflow-y: auto; }
.sw-lap { display: flex; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 6px; font-size: 14px; font-family: monospace; }`,
    javascript: `let swTime = 0, swInterval = null, swRunning = false, laps = [];
function formatSW(ms) { const m = Math.floor(ms / 60000); const s = Math.floor((ms % 60000) / 1000); const cs = Math.floor((ms % 1000) / 10); return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0') + '.' + String(cs).padStart(2,'0'); }
function updateSWDisplay() { document.getElementById('swDisplay').textContent = formatSW(swTime); }
function toggleSW() { const btn = document.getElementById('swStartBtn'); if (swRunning) { clearInterval(swInterval); swRunning = false; btn.textContent = 'Start'; btn.classList.remove('running'); } else { const start = Date.now() - swTime; swInterval = setInterval(() => { swTime = Date.now() - start; updateSWDisplay(); }, 10); swRunning = true; btn.textContent = 'Stop'; btn.classList.add('running'); } }
function lapSW() { if (!swRunning) return; laps.push(swTime); const lapsEl = document.getElementById('swLaps'); const lapEl = document.createElement('div'); lapEl.className = 'sw-lap'; lapEl.innerHTML = '<span>Lap ' + laps.length + '</span><span>' + formatSW(swTime) + '</span>'; lapsEl.insertBefore(lapEl, lapsEl.firstChild); }
function resetSW() { clearInterval(swInterval); swTime = 0; swRunning = false; laps = []; document.getElementById('swDisplay').textContent = '00:00.00'; document.getElementById('swStartBtn').textContent = 'Start'; document.getElementById('swStartBtn').classList.remove('running'); document.getElementById('swLaps').innerHTML = ''; }`
  },

  // ==================== ENGAGEMENT ====================
  {
    id: 'poll-widget',
    name: 'Quick Poll',
    nameRu: 'Быстрый опрос',
    category: 'engagement',
    description: 'Simple voting poll',
    descriptionRu: 'Простой опрос с голосованием',
    icon: 'Vote',
    html: `<div class="poll-widget">
  <h3 class="poll-question">What's your favorite color? 🎨</h3>
  <div class="poll-options" id="pollOptions">
    <button class="poll-option" onclick="vote(0)"><span class="poll-emoji">🔴</span> Red<span class="poll-bar"></span><span class="poll-percent">0%</span></button>
    <button class="poll-option" onclick="vote(1)"><span class="poll-emoji">🔵</span> Blue<span class="poll-bar"></span><span class="poll-percent">0%</span></button>
    <button class="poll-option" onclick="vote(2)"><span class="poll-emoji">🟢</span> Green<span class="poll-bar"></span><span class="poll-percent">0%</span></button>
    <button class="poll-option" onclick="vote(3)"><span class="poll-emoji">🟡</span> Yellow<span class="poll-bar"></span><span class="poll-percent">0%</span></button>
  </div>
  <div class="poll-total" id="pollTotal">0 votes</div>
</div>`,
    css: `.poll-widget { padding: 20px; background: linear-gradient(135deg, #6c5ce7, #a29bfe); border-radius: 20px; color: #fff; }
.poll-question { margin: 0 0 20px; font-size: 18px; text-align: center; }
.poll-options { display: flex; flex-direction: column; gap: 10px; }
.poll-option { position: relative; display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: rgba(255,255,255,0.15); border: 2px solid transparent; border-radius: 12px; color: #fff; font-size: 16px; cursor: pointer; transition: all 0.2s; overflow: hidden; text-align: left; }
.poll-option:hover { background: rgba(255,255,255,0.25); }
.poll-option.voted { border-color: rgba(255,255,255,0.5); cursor: default; }
.poll-bar { position: absolute; left: 0; top: 0; bottom: 0; background: rgba(255,255,255,0.2); transition: width 0.5s; width: 0%; z-index: 0; }
.poll-emoji { position: relative; z-index: 1; }
.poll-percent { margin-left: auto; font-weight: bold; position: relative; z-index: 1; opacity: 0; transition: opacity 0.3s; }
.poll-option.voted .poll-percent { opacity: 1; }
.poll-total { text-align: center; margin-top: 16px; font-size: 14px; opacity: 0.9; }`,
    javascript: `let votes = [5, 8, 3, 4], hasVoted = false;
function updatePoll() { const total = votes.reduce((a, b) => a + b, 0); const options = document.querySelectorAll('.poll-option'); options.forEach((opt, i) => { const percent = total > 0 ? Math.round((votes[i] / total) * 100) : 0; opt.querySelector('.poll-bar').style.width = percent + '%'; opt.querySelector('.poll-percent').textContent = percent + '%'; }); document.getElementById('pollTotal').textContent = total + ' votes'; }
function vote(index) { if (hasVoted) return; hasVoted = true; votes[index]++; const options = document.querySelectorAll('.poll-option'); options.forEach(opt => opt.classList.add('voted')); updatePoll(); }
updatePoll();`
  },
  {
    id: 'reaction-widget',
    name: 'Reaction Widget',
    nameRu: 'Виджет реакций',
    category: 'engagement',
    description: 'Emoji reaction buttons',
    descriptionRu: 'Кнопки реакций с эмодзи',
    icon: 'Smile',
    html: `<div class="reaction-widget">
  <div class="reaction-question">How do you feel today?</div>
  <div class="reaction-buttons">
    <button class="reaction-btn" onclick="react(this, '😍')"><span>😍</span><span class="reaction-count">12</span></button>
    <button class="reaction-btn" onclick="react(this, '😊')"><span>😊</span><span class="reaction-count">28</span></button>
    <button class="reaction-btn" onclick="react(this, '😐')"><span>😐</span><span class="reaction-count">5</span></button>
    <button class="reaction-btn" onclick="react(this, '😢')"><span>😢</span><span class="reaction-count">3</span></button>
    <button class="reaction-btn" onclick="react(this, '🔥')"><span>🔥</span><span class="reaction-count">17</span></button>
  </div>
</div>`,
    css: `.reaction-widget { padding: 24px; background: linear-gradient(135deg, #ff6b6b, #feca57); border-radius: 20px; text-align: center; }
.reaction-question { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 20px; }
.reaction-buttons { display: flex; justify-content: center; gap: 12px; }
.reaction-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 16px; background: rgba(255,255,255,0.25); border: 2px solid transparent; border-radius: 16px; cursor: pointer; transition: all 0.2s; }
.reaction-btn span:first-child { font-size: 32px; transition: transform 0.2s; }
.reaction-btn:hover span:first-child { transform: scale(1.2); }
.reaction-btn.selected { background: rgba(255,255,255,0.4); border-color: #fff; transform: scale(1.1); }
.reaction-count { font-size: 14px; font-weight: bold; color: #fff; }`,
    javascript: `let reacted = false;
function react(btn, emoji) {
  if (reacted) { document.querySelectorAll('.reaction-btn').forEach(b => b.classList.remove('selected')); }
  btn.classList.add('selected');
  if (!reacted) { const countEl = btn.querySelector('.reaction-count'); countEl.textContent = parseInt(countEl.textContent) + 1; }
  reacted = true;
  btn.querySelector('span:first-child').style.transform = 'scale(1.3)';
  setTimeout(() => { btn.querySelector('span:first-child').style.transform = ''; }, 200);
}`
  },
  {
    id: 'quiz-widget',
    name: 'Quick Quiz',
    nameRu: 'Мини-викторина',
    category: 'engagement',
    description: 'Simple trivia quiz',
    descriptionRu: 'Простая викторина',
    icon: 'HelpCircle',
    html: `<div class="quiz-widget">
  <div class="quiz-progress"><div class="quiz-progress-bar" id="quizProgress"></div></div>
  <div class="quiz-question" id="quizQuestion">Loading...</div>
  <div class="quiz-answers" id="quizAnswers"></div>
  <div class="quiz-result" id="quizResult"></div>
</div>`,
    css: `.quiz-widget { padding: 20px; background: linear-gradient(135deg, #0984e3, #6c5ce7); border-radius: 20px; color: #fff; }
.quiz-progress { height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; margin-bottom: 20px; overflow: hidden; }
.quiz-progress-bar { height: 100%; background: #2ecc71; border-radius: 3px; transition: width 0.3s; width: 0%; }
.quiz-question { font-size: 18px; font-weight: 600; margin-bottom: 20px; min-height: 50px; }
.quiz-answers { display: flex; flex-direction: column; gap: 10px; }
.quiz-answer { padding: 14px 18px; background: rgba(255,255,255,0.15); border: 2px solid transparent; border-radius: 12px; color: #fff; font-size: 15px; cursor: pointer; transition: all 0.2s; text-align: left; }
.quiz-answer:hover { background: rgba(255,255,255,0.25); }
.quiz-answer.correct { background: rgba(46, 204, 113, 0.4); border-color: #2ecc71; }
.quiz-answer.wrong { background: rgba(231, 76, 60, 0.4); border-color: #e74c3c; }
.quiz-answer.disabled { pointer-events: none; opacity: 0.7; }
.quiz-result { text-align: center; font-size: 24px; font-weight: bold; margin-top: 20px; min-height: 40px; }`,
    javascript: `const questions = [
  { q: "What is the capital of France?", a: ["London", "Paris", "Berlin", "Madrid"], correct: 1 },
  { q: "Which planet is closest to the Sun?", a: ["Venus", "Mars", "Mercury", "Earth"], correct: 2 },
  { q: "What year did WW2 end?", a: ["1943", "1944", "1945", "1946"], correct: 2 },
  { q: "Who painted the Mona Lisa?", a: ["Van Gogh", "Da Vinci", "Picasso", "Monet"], correct: 1 },
  { q: "What is the largest ocean?", a: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3 }
];
let currentQ = 0, score = 0;
function showQuestion() {
  const q = questions[currentQ];
  document.getElementById('quizQuestion').textContent = q.q;
  document.getElementById('quizProgress').style.width = ((currentQ) / questions.length * 100) + '%';
  const answersEl = document.getElementById('quizAnswers');
  answersEl.innerHTML = '';
  q.a.forEach((ans, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-answer';
    btn.textContent = ans;
    btn.onclick = () => checkAnswer(i);
    answersEl.appendChild(btn);
  });
  document.getElementById('quizResult').textContent = '';
}
function checkAnswer(i) {
  const q = questions[currentQ];
  const answers = document.querySelectorAll('.quiz-answer');
  answers.forEach((a, idx) => { a.classList.add('disabled'); if (idx === q.correct) a.classList.add('correct'); else if (idx === i) a.classList.add('wrong'); });
  if (i === q.correct) score++;
  setTimeout(() => { currentQ++; if (currentQ < questions.length) showQuestion(); else showResult(); }, 1000);
}
function showResult() {
  document.getElementById('quizProgress').style.width = '100%';
  document.getElementById('quizQuestion').textContent = 'Quiz Complete!';
  document.getElementById('quizAnswers').innerHTML = '';
  document.getElementById('quizResult').textContent = '🏆 Score: ' + score + '/' + questions.length;
}
showQuestion();`
  },

  // ==================== BUSINESS ====================
  {
    id: 'booking-widget',
    name: 'Quick Booking',
    nameRu: 'Быстрая запись',
    category: 'business',
    description: 'Simple appointment booking',
    descriptionRu: 'Простая запись на приём',
    icon: 'CalendarCheck',
    html: `<div class="booking-widget">
  <h3>📅 Book an Appointment</h3>
  <div class="booking-field">
    <label>Select Date</label>
    <input type="date" id="bookDate">
  </div>
  <div class="booking-times" id="bookTimes">
    <button onclick="selectTime(this)">09:00</button>
    <button onclick="selectTime(this)">10:00</button>
    <button onclick="selectTime(this)">11:00</button>
    <button onclick="selectTime(this)">14:00</button>
    <button onclick="selectTime(this)">15:00</button>
    <button onclick="selectTime(this)">16:00</button>
  </div>
  <button class="booking-submit" onclick="submitBooking()">Book Now</button>
  <div class="booking-confirm" id="bookConfirm"></div>
</div>`,
    css: `.booking-widget { padding: 20px; background: linear-gradient(135deg, #00b894, #00cec9); border-radius: 20px; color: #fff; }
.booking-widget h3 { margin: 0 0 20px; text-align: center; font-size: 18px; }
.booking-field { margin-bottom: 16px; }
.booking-field label { display: block; font-size: 12px; opacity: 0.9; margin-bottom: 8px; }
.booking-field input { width: 100%; padding: 12px; border: none; border-radius: 10px; background: rgba(255,255,255,0.2); color: #fff; font-size: 16px; }
.booking-field input::-webkit-calendar-picker-indicator { filter: invert(1); }
.booking-times { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
.booking-times button { padding: 12px; background: rgba(255,255,255,0.2); border: 2px solid transparent; border-radius: 10px; color: #fff; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.booking-times button:hover { background: rgba(255,255,255,0.3); }
.booking-times button.selected { background: #fff; color: #00b894; border-color: #fff; }
.booking-submit { width: 100%; padding: 14px; background: #fff; color: #00b894; border: none; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; }
.booking-confirm { text-align: center; margin-top: 16px; font-size: 14px; min-height: 20px; }`,
    javascript: `let selectedTime = null;
document.getElementById('bookDate').valueAsDate = new Date();
function selectTime(btn) { document.querySelectorAll('.booking-times button').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); selectedTime = btn.textContent; }
function submitBooking() { const date = document.getElementById('bookDate').value; if (!date || !selectedTime) { document.getElementById('bookConfirm').textContent = '⚠️ Please select date and time'; return; } document.getElementById('bookConfirm').innerHTML = '✅ Booked for ' + date + ' at ' + selectedTime + '<br><small>Confirmation sent!</small>'; }`
  },
  {
    id: 'price-quote',
    name: 'Price Quote',
    nameRu: 'Калькулятор цены',
    category: 'business',
    description: 'Dynamic price calculator',
    descriptionRu: 'Динамический калькулятор цен',
    icon: 'DollarSign',
    html: `<div class="price-quote">
  <h3>💰 Get Your Quote</h3>
  <div class="pq-option">
    <label>Service Type</label>
    <select id="serviceType" onchange="calcQuote()">
      <option value="basic">Basic - $50/hr</option>
      <option value="standard">Standard - $100/hr</option>
      <option value="premium">Premium - $200/hr</option>
    </select>
  </div>
  <div class="pq-option">
    <label>Hours Needed: <span id="hoursVal">1</span></label>
    <input type="range" id="hours" min="1" max="10" value="1" oninput="calcQuote()">
  </div>
  <div class="pq-addons">
    <label class="pq-addon"><input type="checkbox" onchange="calcQuote()"> Rush delivery (+30%)</label>
    <label class="pq-addon"><input type="checkbox" onchange="calcQuote()"> Priority support (+$50)</label>
  </div>
  <div class="pq-total">
    <span>Estimated Total</span>
    <strong id="totalQuote">$50</strong>
  </div>
</div>`,
    css: `.price-quote { padding: 20px; background: linear-gradient(135deg, #2c3e50, #34495e); border-radius: 20px; color: #fff; }
.price-quote h3 { margin: 0 0 20px; text-align: center; font-size: 18px; }
.pq-option { margin-bottom: 16px; }
.pq-option label { display: block; font-size: 13px; margin-bottom: 8px; }
.pq-option select { width: 100%; padding: 12px; border: none; border-radius: 10px; background: rgba(255,255,255,0.15); color: #fff; font-size: 15px; }
.pq-option select option { color: #333; }
.pq-option input[type="range"] { width: 100%; height: 8px; border-radius: 4px; appearance: none; background: rgba(255,255,255,0.2); }
.pq-option input[type="range"]::-webkit-slider-thumb { appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #fff; cursor: pointer; }
.pq-addons { margin-bottom: 20px; }
.pq-addon { display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 8px; font-size: 14px; cursor: pointer; }
.pq-addon input { width: 18px; height: 18px; }
.pq-total { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: rgba(255,255,255,0.15); border-radius: 12px; }
.pq-total span { font-size: 14px; }
.pq-total strong { font-size: 28px; color: #2ecc71; }`,
    javascript: `const rates = { basic: 50, standard: 100, premium: 200 };
function calcQuote() {
  const type = document.getElementById('serviceType').value;
  const hours = parseInt(document.getElementById('hours').value);
  document.getElementById('hoursVal').textContent = hours;
  let total = rates[type] * hours;
  const addons = document.querySelectorAll('.pq-addon input');
  if (addons[0].checked) total *= 1.3;
  if (addons[1].checked) total += 50;
  document.getElementById('totalQuote').textContent = '$' + Math.round(total);
}
calcQuote();`
  },

  // ==================== SOCIAL ====================
  {
    id: 'followers-counter',
    name: 'Social Stats',
    nameRu: 'Статистика соцсетей',
    category: 'social',
    description: 'Animated follower counters',
    descriptionRu: 'Анимированные счётчики подписчиков',
    icon: 'Users',
    html: `<div class="social-stats">
  <div class="stat-card instagram"><div class="stat-icon">📸</div><div class="stat-count" data-target="12500">0</div><div class="stat-label">Followers</div></div>
  <div class="stat-card youtube"><div class="stat-icon">▶️</div><div class="stat-count" data-target="8700">0</div><div class="stat-label">Subscribers</div></div>
  <div class="stat-card tiktok"><div class="stat-icon">🎵</div><div class="stat-count" data-target="45200">0</div><div class="stat-label">Followers</div></div>
  <div class="stat-card twitter"><div class="stat-icon">🐦</div><div class="stat-count" data-target="3400">0</div><div class="stat-label">Followers</div></div>
</div>`,
    css: `.social-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 16px; background: linear-gradient(135deg, #2d3436, #636e72); border-radius: 20px; }
.stat-card { text-align: center; padding: 16px; border-radius: 16px; color: #fff; }
.stat-card.instagram { background: linear-gradient(135deg, #833AB4, #E1306C); }
.stat-card.youtube { background: linear-gradient(135deg, #FF0000, #CC0000); }
.stat-card.tiktok { background: linear-gradient(135deg, #00f2ea, #ff0050); }
.stat-card.twitter { background: linear-gradient(135deg, #1DA1F2, #0d8ed9); }
.stat-icon { font-size: 28px; margin-bottom: 8px; }
.stat-count { font-size: 26px; font-weight: bold; }
.stat-label { font-size: 11px; opacity: 0.9; margin-top: 4px; }`,
    javascript: `function animateCounters() {
  document.querySelectorAll('.stat-count').forEach(counter => {
    const target = parseInt(counter.dataset.target);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      if (target >= 1000) counter.textContent = (current / 1000).toFixed(1) + 'K';
      else counter.textContent = Math.floor(current);
    }, 16);
  });
}
animateCounters();`
  },
  {
    id: 'testimonial-slider',
    name: 'Testimonial Slider',
    nameRu: 'Слайдер отзывов',
    category: 'social',
    description: 'Customer reviews carousel',
    descriptionRu: 'Карусель отзывов клиентов',
    icon: 'MessageCircle',
    html: `<div class="testimonial-slider">
  <div class="ts-content" id="tsContent">
    <div class="ts-quote">"Amazing service! Highly recommend to everyone."</div>
    <div class="ts-author"><div class="ts-avatar">👤</div><div class="ts-info"><strong>John D.</strong><span>Customer</span></div></div>
  </div>
  <div class="ts-dots" id="tsDots"></div>
</div>`,
    css: `.testimonial-slider { padding: 24px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 20px; text-align: center; }
.ts-content { min-height: 140px; }
.ts-quote { font-size: 18px; font-style: italic; color: #2d3436; line-height: 1.6; margin-bottom: 20px; }
.ts-author { display: flex; align-items: center; justify-content: center; gap: 12px; }
.ts-avatar { width: 48px; height: 48px; background: linear-gradient(135deg, #6c5ce7, #a29bfe); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.ts-info { text-align: left; }
.ts-info strong { display: block; color: #2d3436; font-size: 15px; }
.ts-info span { font-size: 12px; color: #636e72; }
.ts-dots { display: flex; justify-content: center; gap: 8px; margin-top: 20px; }
.ts-dot { width: 10px; height: 10px; border-radius: 50%; background: #ddd; cursor: pointer; transition: all 0.2s; }
.ts-dot.active { background: #6c5ce7; transform: scale(1.2); }`,
    javascript: `const testimonials = [
  { quote: "Amazing service! Highly recommend to everyone.", name: "John D.", role: "Customer", avatar: "👤" },
  { quote: "Best experience I've ever had. Will definitely come back!", name: "Sarah M.", role: "Client", avatar: "👩" },
  { quote: "Professional, fast, and reliable. 5 stars!", name: "Mike R.", role: "Partner", avatar: "👨" },
  { quote: "Exceeded all expectations. Thank you so much!", name: "Lisa K.", role: "Customer", avatar: "👱‍♀️" }
];
let currentTs = 0;
function initDots() { const dots = document.getElementById('tsDots'); testimonials.forEach((_, i) => { const dot = document.createElement('div'); dot.className = 'ts-dot' + (i === 0 ? ' active' : ''); dot.onclick = () => showTestimonial(i); dots.appendChild(dot); }); }
function showTestimonial(i) { currentTs = i; const t = testimonials[i]; document.querySelector('.ts-quote').textContent = '"' + t.quote + '"'; document.querySelector('.ts-avatar').textContent = t.avatar; document.querySelector('.ts-info strong').textContent = t.name; document.querySelector('.ts-info span').textContent = t.role; document.querySelectorAll('.ts-dot').forEach((d, idx) => d.classList.toggle('active', idx === i)); }
initDots();
setInterval(() => { showTestimonial((currentTs + 1) % testimonials.length); }, 5000);`
  },
];

export function getWidgetsByCategory(category: keyof typeof WIDGET_CATEGORIES): WidgetTemplate[] {
  return WIDGET_TEMPLATES.filter(w => w.category === category);
}

export function getWidgetById(id: string): WidgetTemplate | undefined {
  return WIDGET_TEMPLATES.find(w => w.id === id);
}
