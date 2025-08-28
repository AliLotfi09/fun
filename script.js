


// ===== Tabs =====
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
tabs.forEach(t => t.addEventListener('click', () => {
  tabs.forEach(x => x.setAttribute('aria-selected', 'false'));
  t.setAttribute('aria-selected', 'true');
  panels.forEach(p => p.classList.remove('active'));
  document.querySelector(t.dataset.target).classList.add('active');
}));

// ===== Nap Scheduler Logic =====
const napStart = document.getElementById('napStart');
const napLength = document.getElementById('napLength');
const napMode = document.getElementById('napMode');
const alertBefore = document.getElementById('alertBefore');
const napResult = document.getElementById('napResult');
const napConfusion = document.getElementById('napConfusion');

// Initialize time input with now
function pad(n) { return n.toString().padStart(2, '0') }
const now = new Date();
napStart.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

function parseTimeToDate(t) {
  const [h, m] = t.split(":").map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0); return d;
}
function addMinutes(date, mins) { return new Date(date.getTime() + mins * 60000) }
function fmt(date) { return `${pad(date.getHours())}:${pad(date.getMinutes())}` }

function getConfusionLevel(minutes) {
  if (minutes <= 20) return { level: 1, text: "خواب سبک - تقریباً سرحال بیدار میشی!" };
  if (minutes <= 30) return { level: 2, text: "خواب متوسط - یه کم گیجی ولی قابل تحمل" };
  if (minutes <= 45) return { level: 3, text: "خواب نسبتاً سنگین - احتمال گیجی متوسط" };
  if (minutes <= 60) return { level: 4, text: "خواب سنگین - قطعاً با گیجی بیدار میشی" };
  return { level: 5, text: "خواب کامل - کمترین گیجی، چون یه سیکل خواب کامل رو طی کردی" };
}

document.getElementById('calcNap').addEventListener('click', () => {
  let base;
  if (napMode.value === 'fromNow') base = new Date();
  else base = parseTimeToDate(napStart.value || '13:00');

  const len = parseInt(napLength.value, 10);
  const end = addMinutes(base, len);
  const alertMins = Math.max(0, parseInt(alertBefore.value || 0, 10));
  const alertAt = alertMins > 0 ? addMinutes(end, -alertMins) : null;

  let tips = [];
  if (len <= 30) tips.push('چرت کوتاه معمولاً گیجی کمتری دارد.');
  if (len === 90) tips.push('۹۰ دقیقه ≈ یک سیکل خواب کامل.');

  const confusion = getConfusionLevel(len);

  const txt = `شروع: <b>${fmt(base)}</b><br>مدت: <b>${len} دقیقه</b><br>بیدارباش: <b>${fmt(end)}</b>` +
    (alertAt ? `<br>هشدار قبل از پایان: <b>${fmt(alertAt)}</b>` : '') +
    (tips.length ? `<br><span class="muted">${tips.join(' ')}</span>` : '');
  napResult.innerHTML = txt;
  napConfusion.textContent = `سطح گیجی: ${confusion.text}`;

  // Optional: Notification
  if ('Notification' in window) {
    if (Notification.permission === 'granted' && alertAt) {
      const ms = alertAt.getTime() - Date.now();
      if (ms > 0 && ms < 6 * 60 * 60 * 1000) {
        setTimeout(() => {
          new Notification('وقت بیدارباش نزدیکه', { body: `${alertMins} دقیقه تا پایان چرت` });
        }, ms);
      }
    }
  }
});

document.getElementById('copyNap').addEventListener('click', () => {
  const div = napResult.cloneNode(true); div.querySelectorAll('b').forEach(b => b.outerHTML = b.innerText);
  const text = div.textContent.trim() + " - " + napConfusion.textContent;
  navigator.clipboard.writeText(text).then(() => {
    toast('نتیجه چرت کپی شد.');
  });
});

// ===== Kalleh Pacheh Calories =====
const defaults = [
  { name: 'پاچه', kcal100: 250, gram: 150 },
  { name: 'سیرابی/شیردان', kcal100: 95, gram: 200 },
  { name: 'زبان', kcal100: 260, gram: 120 },
  { name: 'مغز', kcal100: 320, gram: 100 },
  { name: 'آب کله‌پاچه', kcal100: 30, gram: 300 }
];

const itemsTbody = document.querySelector('#itemsTable tbody');
const unitGram = document.getElementById('unitGram');
const rounding = document.getElementById('rounding');
const eatingMode = document.getElementById('eatingMode');
const friendsCount = document.getElementById('friendsCount');
const friendsCountContainer = document.getElementById('friendsCountContainer');
const kcalResult = document.getElementById('kcalResult');
const bellyStatus = document.getElementById('bellyStatus');

eatingMode.addEventListener('change', function () {
  friendsCountContainer.style.display = this.value === 'friends' ? 'block' : 'none';
  updateKcal();
});

friendsCount.addEventListener('input', updateKcal);

function getBellyStatus(totalKcal) {
  if (totalKcal < 500) return { status: 1, text: "شکمت صافه، انگار نه انگار چیزی خوردی!" };
  if (totalKcal < 1000) return { status: 2, text: "شکمت یه کم برآمده، مثل توپ پینگ پونگ کوچیک" };
  if (totalKcal < 1500) return { status: 3, text: "شکمت گرد شده، در حد یه توپ والیبال" };
  if (totalKcal < 2000) return { status: 4, text: "شکمت حجیم شده، در حد یه توپ بسکتبال" };
  return { status: 5, text: "هشدار! شکمت در حد دیگ نذری شده!" };
}

function renderRow(item) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input value="${item.name}" aria-label="نام مورد"/></td>
    <td><input type="number" value="${item.kcal100}" min="0" aria-label="کالری در ۱۰۰ گرم"/></td>
    <td><input type="number" value="${item.gram}" min="0" aria-label="مقدار بر حسب گرم"/></td>
    <td class="right"><button class="btn danger small">حذف</button></td>
  `;
  tr.querySelector('button').addEventListener('click', () => { tr.remove(); updateKcal(); });
  Array.from(tr.querySelectorAll('input')).forEach(inp => inp.addEventListener('input', updateKcal));
  itemsTbody.appendChild(tr);
}

function loadDefaults() {
  itemsTbody.innerHTML = '';
  defaults.forEach(renderRow);
  updateKcal();
}

function sum(items) { return items.reduce((a, b) => a + b, 0) }

function roundTo(v, step) { if (step <= 1) return v; return Math.round(v / step) * step }

function collectItems() {
  return Array.from(itemsTbody.querySelectorAll('tr')).map(tr => {
    const tds = tr.querySelectorAll('td input');
    return {
      name: tds[0].value.trim() || 'مورد',
      kcal100: parseFloat(tds[1].value) || 0,
      gram: parseFloat(tds[2].value) || 0
    };
  });
}

function updateKcal() {
  const step = parseInt(rounding.value, 10);
  const items = collectItems();
  const details = items.map(it => {
    const kcal = (it.kcal100 * it.gram) / 100;
    return { ...it, kcal };
  });

  let totalGram = sum(details.map(d => d.gram));
  let totalKcal = sum(details.map(d => d.kcal));

  // Apply sharing mode
  let sharingText = "";
  if (eatingMode.value === 'friends' && parseInt(friendsCount.value) > 0) {
    const peopleCount = parseInt(friendsCount.value) + 1; // Including user
    const sharedKcal = totalKcal / peopleCount;
    sharingText = `<tr><td colspan="3">کالری برای هر نفر (بین ${peopleCount} نفر)</td><td class="right kcal"><b>${roundTo(sharedKcal, step).toFixed(0)} kcal</b></td></tr>`;
    totalKcal = sharedKcal; // Show per person calories
  }

  const perUnit = unitGram.value > 0 ? (totalKcal * unitGram.value / Math.max(1, totalGram)) : 0;

  const rows = details.map(d => `<tr><td>${d.name}</td><td class="kcal">${d.kcal100}</td><td class="kcal">${d.gram}</td><td class="kcal right">${roundTo(d.kcal, step).toFixed(0)}</td></tr>`).join('');

  const belly = getBellyStatus(totalKcal);
  bellyStatus.textContent = `وضعیت شکم: ${belly.text}`;

  kcalResult.innerHTML = `
    <table>
      <thead><tr><th>مورد</th><th>کالری/۱۰۰g</th><th>گرم</th><th class="right">کالری</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="3">جمع کل</td><td class="right kcal"><b>${roundTo(totalKcal, step).toFixed(0)} kcal</b></td></tr>
        ${sharingText}
        <tr><td colspan="3">هر ${unitGram.value} گرم</td><td class="right kcal"><b>${roundTo(perUnit, step).toFixed(0)} kcal</b></td></tr>
      </tfoot>
    </table>`;
}

document.getElementById('addItem').addEventListener('click', () => {
  renderRow({ name: 'مورد جدید', kcal100: 100, gram: 100 });
  updateKcal();
});
document.getElementById('resetItems').addEventListener('click', loadDefaults);
document.getElementById('copyKcal').addEventListener('click', () => {
  const text = itemsToText();
  navigator.clipboard.writeText(text).then(() => toast('نتیجه کالری کپی شد.'));
});
document.getElementById('exportJSON').addEventListener('click', () => {
  const data = { unitGram: parseInt(unitGram.value, 10) || 100, items: collectItems() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'kallepache_calories.json'; a.click();
  URL.revokeObjectURL(url);
});

function itemsToText() {
  const items = collectItems();
  const step = parseInt(rounding.value, 10);
  const lines = items.map(it => {
    const kcal = (it.kcal100 * it.gram) / 100;
    return `${it.name}: ${roundTo(kcal, step).toFixed(0)} kcal (${it.gram}g)`;
  });
  return lines.join('\n');
}

unitGram.addEventListener('input', updateKcal);
rounding.addEventListener('change', updateKcal);

loadDefaults();

// ===== Tea Meter =====
document.getElementById('calcTea').addEventListener('click', function () {
  const cups = parseInt(document.getElementById('teaCups').value) || 0;
  const teaType = parseFloat(document.getElementById('teaType').value);
  const sugar = parseInt(document.getElementById('sugarCubes').value) || 0;
  const snack = parseInt(document.getElementById('snackType').value) || 0;

  // Calculate caffeine (approx 40mg per cup for black tea)
  const caffeine = cups * 40 * teaType;
  const sugarCalories = sugar * 20; // approx 20 calories per sugar cube
  const totalCalories = sugarCalories + snack * cups;

  let status = "";
  if (cups === 0) {
    status = "چای نخوری؟ مطمئنی ایرانی هستی؟";
  } else if (cups <= 2) {
    status = "تازه‌کار هستی! هنوز راه زیادی در پیش داری.";
  } else if (cups <= 5) {
    status = "چای‌خور معمولی، سطح قابل قبول!";
  } else if (cups <= 8) {
    status = "چای‌خور حرفه‌ای! الان در حد استارتاپی پرانرژی هستی!";
  } else {
    status = "هشدار! قندت از چای بیشتر شد! احتمالاً نیاز به تعویض کلیه داری!";
  }

  if (sugar > 10) {
    status += " قندت خیلی بالاست، مراقب باش!";
  }

  document.getElementById('teaResult').innerHTML = `
    تعداد لیوان: <b>${cups}</b><br>
    کافئین مصرفی: <b>${caffeine}mg</b><br>
    کالری از قند: <b>${sugarCalories}kcal</b><br>
    کالری از شیرینی: <b>${snack * cups}kcal</b><br>
    کل کالری: <b>${totalCalories}kcal</b>
  `;

  document.getElementById('teaStatus').textContent = status;
});

// ===== Dizi Calculator =====
document.getElementById('calcDizi').addEventListener('click', function () {
  const count = parseInt(document.getElementById('diziCount').value) || 1;
  const type = parseInt(document.getElementById('diziType').value);
  const bread = parseInt(document.getElementById('breadSlices').value) || 0;
  const extra = parseInt(document.getElementById('extraType').value) || 0;

  const diziCalories = count * type;
  const breadCalories = bread * 80; // approx 80 calories per bread slice
  const extraCalories = extra * count;
  const totalCalories = diziCalories + breadCalories + extraCalories;

  let status = "";
  if (totalCalories < 1000) {
    status = "یه دیزی سبک، برای ناهار اداری مناسب!";
  } else if (totalCalories < 1500) {
    status = "دیزی معمولی، شکم رو سیر میکنه ولی سنگین نیست";
  } else if (totalCalories < 2000) {
    status = "دیزی مخصوص، بعدش یه چرت لازم داری!";
  } else {
    status = "دیزی سلطنتی! بعدش فقط میتونی بخوابی!";
  }

  document.getElementById('diziResult').innerHTML = `
    تعداد دیزی: <b>${count}</b><br>
    کالری دیزی: <b>${diziCalories}kcal</b><br>
    کالری نان: <b>${breadCalories}kcal</b><br>
    کالری اضافی: <b>${extraCalories}kcal</b><br>
    کل کالری: <b>${totalCalories}kcal</b>
  `;

  document.getElementById('diziStatus').textContent = status;
});


// ===== Food Name Generator =====
const foods = [
  "کله پاچه", "دیزی", "چلوکباب", "قورمه سبزی", "قیمه", "فسنجان",
  "زرشک پلو با مرغ", "آلبالو پلو", "عدس پلو", "لوبیا پلو", "ماهی شکم پر",
  "دلمه", "کوفته", "آش رشته", "حلیم", "عدسی", "نخود آب"
];

const extras = [
  "با پاچه اضافه", "با دوغ", "با ترشی", "با سبزی خوردن",
  "با پیاز", "با ماست و خیار", "با سالاد شیرازی", "با نون تافتون"
];

document.getElementById('generateFood').addEventListener('click', function () {
  const name = document.getElementById('userName').value || "تو";
  const mood = document.getElementById('foodMood').value;

  let selectedFoods = foods;
  if (mood === "healthy") {
    selectedFoods = ["سالاد", "سینه مرغ", "ماهی", "عدسی", "سوپ", "خوراک سبزیجات"];
  } else if (mood === "cheat") {
    selectedFoods = ["پیتزا", "سیب زمینی سرخ کرده", "همبرگر", "سیخ کباب", "جگر", "قلوه"];
  }

  const food = selectedFoods[Math.floor(Math.random() * selectedFoods.length)];
  const extra = Math.random() > 0.5 ? " " + extras[Math.floor(Math.random() * extras.length)] : "";

  document.getElementById('foodResult').innerHTML = `
    <b>${name}</b> امروز باید <b>${food}${extra}</b> بخوری!
  `;
});

// ===== Lazy Test =====
document.getElementById('calcLazy').addEventListener('click', function () {
  const q1 = parseInt(document.getElementById('q1').value);
  const q2 = parseInt(document.getElementById('q2').value);
  const q3 = parseInt(document.getElementById('q3').value);
  const q4 = parseInt(document.getElementById('q4').value);
  const q5 = parseInt(document.getElementById('q5').value);

  const total = q1 + q2 + q3 + q4 + q5;

  let status = "";
  if (total <= 8) {
    status = "تو که اصلاً تنبل نیستی! شاید حتی زیادی فعالی!";
  } else if (total <= 12) {
    status = "سطح تنبلی: نیمه فعال - یه کم تنبلی ولی هنوز قابل کنترله";
  } else if (total <= 16) {
    status = "سطح تنبلی: حرفه‌ای - توی تنبلی استادی!";
  } else {
    status = "سطح تنبلی: افسانه‌ای - تو یه مگس روی مبل هستی که منتظریدی کسی بیاد و تغذیه‌ات کنه!";
  }

  document.getElementById('lazyResult').innerHTML = `
    امتیاز تو از ۱۵: <b>${total}</b><br>
    (هرچه امتیاز بیشتر، تنبلی بیشتر!)
  `;

  document.getElementById('lazyStatus').textContent = status;
});

// ===== Shortcuts & Toast =====
document.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('calcNap').click(); }
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); document.getElementById('addItem').click(); }
});

function toast(msg) {
  const t = document.createElement('div');
  t.textContent = msg; t.style.cssText = `
    position: fixed; inset-inline:0; bottom:20px; margin:auto; width:max-content; max-width:90%;
    background:#0b1220; border:1px solid #243142; color:#e5e7eb; padding:10px 14px; border-radius:12px;
    box-shadow:0 10px 30px rgba(0,0,0,.35); opacity:0; transform:translateY(10px); transition:.25s;
    z-index:1000;`;
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(() => t.remove(), 250); }, 1800);
}

// Ask permission for notifications (for nap alerts)
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}