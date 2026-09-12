-- Seed widget_templates Batch 2 (Utilities & Business)
INSERT INTO public.widget_templates (id, name, name_ru, category, description, description_ru, icon, html, css, javascript, is_premium)
VALUES 
('qr-generator', 'QR Code Generator', 'Генератор QR-кодов', 'utility', 'Simple QR code generator for links', 'Простой генератор QR-кодов для ссылок', 'QrCode',
'<div class="qr-widget">
  <div class="qr-card">
    <h3>🔗 QR Generator</h3>
    <input type="text" id="qrInput" placeholder="Enter URL or text..." oninput="updateQR()">
    <div id="qrOutput" class="qr-display"></div>
    <div class="qr-help">Scans instantly</div>
  </div>
</div>',
'.qr-widget { padding: 10px; width: 100%; max-width: 300px; margin: 0 auto; color: #fff; }
.qr-card { background: rgba(255,255,255,0.08); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 20px; text-align: center; }
.qr-card h3 { margin: 0 0 15px; font-size: 16px; font-weight: 600; }
.qr-card input { width: 100%; padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: #fff; font-size: 14px; margin-bottom: 20px; outline: none; transition: 0.2s; }
.qr-card input:focus { border-color: #7b8cff; }
.qr-display { background: #fff; padding: 10px; border-radius: 12px; display: inline-block; min-width: 120px; min-height: 120px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.qr-display img { max-width: 100%; height: auto; }
.qr-help { margin-top: 15px; font-size: 12px; opacity: 0.6; }',
'function updateQR() {
  const val = document.getElementById("qrInput").value || "inkmax.pro";
  const out = document.getElementById("qrOutput");
  out.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(val)}" alt="QR Code">`;
}
updateQR();', false),

('calculator', 'Profit Calculator', 'Калькулятор прибыли', 'utility', 'Calculate your business profit', 'Рассчитайте прибыль вашего бизнеса', 'Calculator',
'<div class="calc-widget">
  <h3>📊 Profit Calc</h3>
  <div class="calc-row">
    <label>Revenue (KZT)</label>
    <input type="number" id="rev" value="100000" oninput="calc()">
  </div>
  <div class="calc-row">
    <label>Costs (%)</label>
    <input type="range" id="cost" min="0" max="100" value="30" oninput="calc()">
    <span id="costVal">30%</span>
  </div>
  <div class="calc-result">
    <div class="res-item">
      <span>Profit:</span>
      <b id="profit">70,000 ₸</b>
    </div>
    <div class="res-item">
      <span>Margin:</span>
      <b id="margin">70%</b>
    </div>
  </div>
</div>',
'.calc-widget { background: #111; border-radius: 24px; padding: 20px; color: #fff; border: 1px solid #222; }
.calc-widget h3 { margin: 0 0 20px; font-size: 18px; text-align: center; }
.calc-row { margin-bottom: 15px; }
.calc-row label { display: block; font-size: 12px; opacity: 0.6; margin-bottom: 5px; }
.calc-row input[type="number"] { width: 100%; background: #222; border: none; padding: 10px; border-radius: 8px; color: #fff; font-size: 16px; }
.calc-row input[type="range"] { width: 80%; }
#costVal { float: right; font-size: 14px; }
.calc-result { background: #1a1a1a; padding: 15px; border-radius: 12px; margin-top: 20px; }
.res-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
.res-item b { color: #7b8cff; }',
'function calc() {
  const r = +document.getElementById("rev").value || 0;
  const c = +document.getElementById("cost").value;
  document.getElementById("costVal").textContent = c + "%";
  const p = r * (1 - c/100);
  document.getElementById("profit").textContent = p.toLocaleString() + " ₸";
  document.getElementById("margin").textContent = (100 - c) + "%";
}
calc();', false)
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
