-- Seed widget_templates
INSERT INTO public.widget_templates (id, name, name_ru, category, description, description_ru, icon, html, css, javascript, is_premium)
VALUES 
('minesweeper', 'Minesweeper', 'Сапёр', 'games', 'Classic minesweeper game', 'Классическая игра сапёр', 'Bomb', 
'<div class="game-app">
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
</div>', 
':root {
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
.game-status { font-size: 12px; opacity: 0.8; margin-top: 8px; color: #fff; }',
'let rows, cols, mines, grid = [], gameOver = false, longPress;
const gridEl = document.getElementById("grid"), statusEl = document.getElementById("status");
function calcGrid() { const size = Math.min(window.innerWidth - 60, 340); cols = 8; rows = 8; mines = 10; gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`; }
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
startGame();', false),

('slot-machine', 'Slot Machine', 'Слот-машина', 'games', 'Lucky slot machine game', 'Игровой автомат на удачу', 'Cherry',
'<div class="slot-container">
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
</div>',
'.slot-container { text-align: center; padding: 20px; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 20px; color: #fff; }
.slot-container h2 { margin: 0 0 20px; font-size: 22px; }
.slot-machine { background: linear-gradient(145deg, #2a2a4a, #1a1a3a); padding: 15px; border-radius: 16px; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
.slot-window { display: flex; gap: 8px; background: #000; padding: 15px; border-radius: 12px; }
.slot-reel { width: 60px; height: 70px; background: linear-gradient(180deg, #2a2a4a, #1a1a3a); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 36px; border: 2px solid #444; transition: transform 0.1s; }
.slot-reel.spinning { animation: slotSpin 0.1s infinite; }
@keyframes slotSpin { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
.slot-button { margin-top: 20px; padding: 14px 40px; font-size: 18px; font-weight: bold; background: linear-gradient(135deg, #ff6b6b, #ffa502); color: #fff; border: none; border-radius: 30px; cursor: pointer; box-shadow: 0 5px 20px rgba(255,107,107,0.4); transition: all 0.2s; }
.slot-button:hover { transform: scale(1.05); }
.slot-button:disabled { opacity: 0.6; cursor: not-allowed; }
.slot-result { margin-top: 15px; font-size: 18px; min-height: 30px; }',
'const symbols = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣"];
const reels = [document.getElementById("reel1"), document.getElementById("reel2"), document.getElementById("reel3")];
const btn = document.getElementById("spinBtn");
const result = document.getElementById("result");
function spin() {
  btn.disabled = true; result.textContent = ""; reels.forEach(r => r.classList.add("spinning"));
  let spins = [0, 0, 0], final = [];
  reels.forEach((reel, i) => {
    const interval = setInterval(() => { reel.textContent = symbols[Math.floor(Math.random() * symbols.length)]; }, 80);
    setTimeout(() => { clearInterval(interval); reel.classList.remove("spinning"); final[i] = symbols[Math.floor(Math.random() * symbols.length)]; reel.textContent = final[i]; if (i === 2) checkWin(final); }, 500 + i * 400);
  });
}
function checkWin(final) {
  btn.disabled = false;
  if (final[0] === final[1] && final[1] === final[2]) { result.textContent = "🎉 JACKPOT! 🎉"; result.style.color = "#ffd700"; }
  else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) { result.textContent = "✨ Nice! ✨"; result.style.color = "#7bed9f"; }
  else { result.textContent = "Try again!"; result.style.color = "#fff"; }
}', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ru = EXCLUDED.name_ru,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  description_ru = EXCLUDED.description_ru,
  icon = EXCLUDED.icon,
  html = EXCLUDED.html,
  css = EXCLUDED.css,
  javascript = EXCLUDED.javascript,
  is_premium = EXCLUDED.is_premium;
