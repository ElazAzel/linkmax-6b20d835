-- Seed widget_templates Batch 3 (Engagement & Social)
INSERT INTO public.widget_templates (id, name, name_ru, category, description, description_ru, icon, html, css, javascript, is_premium)
VALUES 
('poll-widget', 'Quick Poll', 'Быстрый опрос', 'engagement', 'Simple voting poll', 'Простой опрос с голосованием', 'Vote', 
'<div class="poll-widget">
  <h3 class="poll-question">What''s your favorite color? 🎨</h3>
  <div class="poll-options" id="pollOptions">
    <button class="poll-option" onclick="vote(0)"><span class="poll-emoji">🔴</span> Red<span class="poll-bar"></span><span class="poll-percent">0%</span></button>
    <button class="poll-option" onclick="vote(1)"><span class="poll-emoji">🔵</span> Blue<span class="poll-bar"></span><span class="poll-percent">0%</span></button>
    <button class="poll-option" onclick="vote(2)"><span class="poll-emoji">🟢</span> Green<span class="poll-bar"></span><span class="poll-percent">0%</span></button>
    <button class="poll-option" onclick="vote(3)"><span class="poll-emoji">🟡</span> Yellow<span class="poll-bar"></span><span class="poll-percent">0%</span></button>
  </div>
  <div class="poll-total" id="pollTotal">0 votes</div>
</div>', 
'.poll-widget { padding: 20px; background: linear-gradient(135deg, #6c5ce7, #a29bfe); border-radius: 20px; color: #fff; }
.poll-question { margin: 0 0 20px; font-size: 18px; text-align: center; }
.poll-options { display: flex; flex-direction: column; gap: 10px; }
.poll-option { position: relative; display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: rgba(255,255,255,0.15); border: 2px solid transparent; border-radius: 12px; color: #fff; font-size: 16px; cursor: pointer; transition: all 0.2s; overflow: hidden; text-align: left; }
.poll-option:hover { background: rgba(255,255,255,0.25); }
.poll-option.voted { border-color: rgba(255,255,255,0.5); cursor: default; }
.poll-bar { position: absolute; left: 0; top: 0; bottom: 0; background: rgba(255,255,255,0.2); transition: width 0.5s; width: 0%; z-index: 0; }
.poll-emoji { position: relative; z-index: 1; }
.poll-percent { margin-left: auto; font-weight: bold; position: relative; z-index: 1; opacity: 0; transition: opacity 0.3s; }
.poll-option.voted .poll-percent { opacity: 1; }
.poll-total { text-align: center; margin-top: 16px; font-size: 14px; opacity: 0.9; }',
'let votes = [5, 8, 3, 4], hasVoted = false;
function updatePoll() { const total = votes.reduce((a, b) => a + b, 0); const options = document.querySelectorAll(".poll-option"); options.forEach((opt, i) => { const percent = total > 0 ? Math.round((votes[i] / total) * 100) : 0; opt.querySelector(".poll-bar").style.width = percent + "%"; opt.querySelector(".poll-percent").textContent = percent + "%"; }); document.getElementById("pollTotal").textContent = total + " votes"; }
function vote(index) { if (hasVoted) return; hasVoted = true; votes[index]++; const options = document.querySelectorAll(".poll-option"); options.forEach(opt => opt.classList.add("voted")); updatePoll(); }
updatePoll();', false),

('reaction-widget', 'Reaction Widget', 'Виджет реакций', 'engagement', 'Emoji reaction buttons', 'Кнопки реакций с эмодзи', 'Smile',
'<div class="reaction-widget">
  <div class="reaction-question">How do you feel today?</div>
  <div class="reaction-buttons">
    <button class="reaction-btn" onclick="react(this, ''😍'')"><span>😍</span><span class="reaction-count">12</span></button>
    <button class="reaction-btn" onclick="react(this, ''😊'')"><span>😊</span><span class="reaction-count">28</span></button>
    <button class="reaction-btn" onclick="react(this, ''😐'')"><span>😐</span><span class="reaction-count">5</span></button>
    <button class="reaction-btn" onclick="react(this, ''😢'')"><span>😢</span><span class="reaction-count">3</span></button>
    <button class="reaction-btn" onclick="react(this, ''🔥'')"><span>🔥</span><span class="reaction-count">17</span></button>
  </div>
</div>',
'.reaction-widget { padding: 24px; background: linear-gradient(135deg, #ff6b6b, #feca57); border-radius: 20px; text-align: center; }
.reaction-question { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 20px; }
.reaction-buttons { display: flex; justify-content: center; gap: 12px; }
.reaction-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 16px; background: rgba(255,255,255,0.25); border: 2px solid transparent; border-radius: 16px; cursor: pointer; transition: all 0.2s; }
.reaction-btn span:first-child { font-size: 32px; transition: transform 0.2s; }
.reaction-btn:hover span:first-child { transform: scale(1.2); }
.reaction-btn.selected { background: rgba(255,255,255,0.4); border-color: #fff; transform: scale(1.1); }
.reaction-count { font-size: 14px; font-weight: bold; color: #fff; }',
'let reacted = false;
function react(btn, emoji) {
  if (reacted) { document.querySelectorAll(".reaction-btn").forEach(b => b.classList.remove("selected")); }
  btn.classList.add("selected");
  if (!reacted) { const countEl = btn.querySelector(".reaction-count"); countEl.textContent = parseInt(countEl.textContent) + 1; }
  reacted = true;
  btn.querySelector("span:first-child").style.transform = "scale(1.3)";
  setTimeout(() => { btn.querySelector("span:first-child").style.transform = ""; }, 200);
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
