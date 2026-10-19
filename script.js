// ===== إعدادات عامة =====
const emojis = ['🎮','🕹️','❌','🧠','🐍','🐦','🧩','🏀','🎯','🎪','🃏','🎭','🎨','🎵','🚀','⚔️','🛡️','🏰','👾','🔥','⭐','🎁','🏆','💎'];

let games = JSON.parse(localStorage.getItem('myGames')) || [
  { id:'snake', name:'الثعبان', year:'2024', emoji:'🐍', color:'#00cc66', type:'internal', desc:'لعبة الثعبان الكلاسيكية' },
  { id:'xo', name:'XO', year:'2024', emoji:'❌', color:'#ff3366', type:'internal', desc:'لعبة إكس أو' },
  { id:'memory', name:'الذاكرة', year:'2024', emoji:'🧠', color:'#9d00ff', type:'internal', desc:'لعبة تنمية الذاكرة' },
];

let selected = 0;
let selectedEmoji = '🎮';
let currentFilter = 'all';

// ===== عرض الألعاب =====
function renderGames(filter = 'all') {
  const list = document.getElementById('gamesList');
  let filteredGames = games;

  if (filter === 'favorites') {
    filteredGames = games.filter(g => g.favorite);
  } else if (filter === 'recent') {
    filteredGames = games.filter(g => g.lastPlayed).sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed));
  }

  if (filteredGames.length === 0) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:#aaa;font-size:14px">لا توجد ألعاب</div>';
    return;
  }

  list.innerHTML = filteredGames.map((g, i) => `
    <div class="game-card ${games.indexOf(g)===selected?'selected':''}" 
         style="background:${g.color}"
         onclick="selectGame(${games.indexOf(g)})"
         ondblclick="launchGame(${games.indexOf(g)})">
      <span style="font-size:50px">${g.emoji}</span>
      <div class="delete-btn" onclick="event.stopPropagation();deleteGame(${games.indexOf(g)})">✕</div>
    </div>
  `).join('');
  updateInfo();
}

function selectGame(i) {
  selected = i;
  renderGames(currentFilter);
}

function updateInfo() {
  if (games.length === 0) {
    document.getElementById('gTitle').innerText = 'لا توجد ألعاب';
    document.getElementById('gMeta').innerText = 'أضف لعبة لتبدأ';
    return;
  }

  const g = games[selected];
  document.getElementById('gTitle').innerText = g.name;
  let meta = `${g.year} • `;
  
  if (g.type === 'phone') meta += '📱 تطبيق هاتف';
  else if (g.type === 'web') meta += '🌐 لعبة ويب';
  else meta += '🎮 لعبة داخلية';
  
  if (g.lastPlayed) {
    const date = new Date(g.lastPlayed);
    meta += ` • آخر تشغيل: ${date.toLocaleDateString('ar')}`;
  }
  
  document.getElementById('gMeta').innerText = meta;
}

function launchGame(i) {
  if (!games[i]) return;
  
  const g = games[i];
  g.lastPlayed = new Date().toISOString();
  saveGames();

  document.getElementById('runningGame').innerText = g.name;
  
  if (g.type === 'phone' && g.packageName) {
    window.location.href = `intent://#Intent;scheme=android-app;package=${g.packageName};end`;
    setTimeout(() => {
      if (g.url) window.open(g.url, '_blank');
    }, 1000);
  } else if (g.type === 'web' && g.url) {
    window.open(g.url, '_blank');
  } else if (g.type === 'internal') {
    loadInternalGame(g.id);
  } else {
    alert(`سيتم إضافة لعبة "${g.name}" قريباً!`);
  }
}

function loadInternalGame(gameId) {
  let gameHTML = '';

  if (gameId === 'snake') {
    gameHTML = getSnakeGame();
  } else if (gameId === 'xo') {
    gameHTML = getXOGame();
  } else if (gameId === 'memory') {
    gameHTML = getMemoryGame();
  }

  document.getElementById('gameFrame').srcdoc = gameHTML;
  document.getElementById('gameScreen').classList.add('show');
}

function closeGame() {
  document.getElementById('gameScreen').classList.remove('show');
  document.getElementById('gameFrame').srcdoc = '';
}

function deleteGame(i) {
  if (confirm(`هل تريد حذف ${games[i].name}؟`)) {
    games.splice(i, 1);
    if (selected >= games.length && games.length > 0) selected = games.length - 1;
    saveGames();
    renderGames(currentFilter);
  }
}

// ===== إضافة ألعاب =====
function openAddGame() {
  document.getElementById('addGameModal').classList.add('show');
  renderEmojiPicker();
  showManualAdd();
}

function closeAddGame() {
  document.getElementById('addGameModal').classList.remove('show');
  resetAddGameForm();
}

function resetAddGameForm() {
  document.getElementById('gameName').value = '';
  document.getElementById('gameYear').value = '2024';
  document.getElementById('gameUrl').value = '';
  document.getElementById('gameDesc').value = '';
  selectedEmoji = '🎮';
}

function showPhoneApps() {
  document.getElementById('manualAdd').style.display = 'none';
  document.getElementById('phoneApps').style.display = 'block';
  loadPhoneApps();
}

function showManualAdd() {
  document.getElementById('manualAdd').style.display = 'block';
  document.getElementById('phoneApps').style.display = 'none';
}

function renderEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  picker.innerHTML = emojis.map(e => `
    <div class="emoji-option ${e===selectedEmoji?'selected':''}" onclick="selectEmoji('${e}')">${e}</div>
  `).join('');
}

function selectEmoji(e) {
  selectedEmoji = e;
  renderEmojiPicker();
}

function addManualGame() {
  const name = document.getElementById('gameName').value.trim();
  const year = document.getElementById('gameYear').value.trim();
  const url = document.getElementById('gameUrl').value.trim();
  const desc = document.getElementById('gameDesc').value.trim();
  
  if (!name) {
    alert('أدخل اسم اللعبة');
    return;
  }

  if (!selectedEmoji) {
    alert('اختر أيقونة');
    return;
  }

  const colors = ['#ff6a00','#0066ff','#ff0066','#00cc66','#9d00ff','#ff3300','#003366','#666','#009900','#cc0099'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  games.push({
    id: 'custom_' + Date.now(),
    name: name,
    year: year || '2024',
    emoji: selectedEmoji,
    color: randomColor,
    type: url ? 'web' : 'internal',
    url: url,
    desc: desc,
    favorite: false
  });

  saveGames();
  renderGames(currentFilter);
  closeAddGame();
  alert(`✓ تمت إضافة "${name}"`);
}

// ===== تطبيقات الهاتف =====
function loadPhoneApps() {
  const appList = document.getElementById('appList');
  
  const phoneApps = [
    { name: 'PUBG Mobile', package: 'com.tencent.ig', emoji: '🔫' },
    { name: 'Free Fire', package: 'com.dts.freefireth', emoji: '🔥' },
    { name: 'Call of Duty Mobile', package: 'com.activision.callofduty.shooter', emoji: '⚔️' },
    { name: 'Clash of Clans', package: 'com.supercell.clashofclans', emoji: '🏰' },
    { name: 'Candy Crush', package: 'com.king.candycrushsaga', emoji: '🍬' },
    { name: 'Subway Surfers', package: 'com.kiloo.subwaysurf', emoji: '🏃' },
    { name: 'Roblox', package: 'com.roblox.client', emoji: '🎮' },
    { name: 'Minecraft', package: 'com.mojang.minecraftpe', emoji: '⛏️' },
    { name: 'Among Us', package: 'com.innersloth.spacemafia', emoji: '👽' },
    { name: 'Fortnite', package: 'com.epicgames.fortnite', emoji: '🎯' },
  ];

  appList.innerHTML = phoneApps.map((app, idx) => `
    <div class="app-item" onclick="addPhoneApp('${app.name}', '${app.package}', '${app.emoji}')">
      <div class="app-icon">${app.emoji}</div>
      <div>
        <div class="app-name">${app.name}</div>
        <div class="app-package">${app.package}</div>
      </div>
    </div>
  `).join('');

  document.getElementById('appSearch').oninput = (e) => {
    const search = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.app-item');
    items.forEach(item => {
      const name = item.querySelector('.app-name').textContent.toLowerCase();
      item.style.display = name.includes(search) ? 'flex' : 'none';
    });
  };
}

function addPhoneApp(name, packageName, emoji) {
  const colors = ['#ff6a00','#0066ff','#ff0066','#00cc66','#9d00ff'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  games.push({
    id: 'phone_' + Date.now(),
    name: name,
    year: new Date().getFullYear().toString(),
    emoji: emoji,
    color: randomColor,
    type: 'phone',
    packageName: packageName,
    favorite: false
  });

  saveGames();
  renderGames(currentFilter);
  closeAddGame();
  alert(`✓ تمت إضافة ${name}`);
}

// ===== الساعة =====
setInterval(() => {
  const now = new Date();
  document.getElementById('clock').innerText = now.toLocaleTimeString('ar', {hour:'2-digit', minute:'2-digit'});
}, 1000);

// ===== التبويبات =====
document.querySelectorAll('.tab').forEach(t => {
  t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
  };
});

// ===== الشريط الجانبي =====
function showAllGames() {
  currentFilter = 'all';
  renderGames('all');
}

function showFavorites() {
  currentFilter = 'favorites';
  renderGames('favorites');
}

function showRecent() {
  currentFilter = 'recent';
  renderGames('recent');
}

function showFolders() {
  alert('ميزة المجلدات قريباً!');
}

// ===== الثيمات =====
function openTheme() { 
  document.getElementById('themeModal').classList.add('show'); 
}

function closeTheme() { 
  document.getElementById('themeModal').classList.remove('show'); 
  saveTheme(); 
}

function applyPreset(p, bg, txt, acc) {
  document.documentElement.style.setProperty('--primary', p);
  document.documentElement.style.setProperty('--bg', bg);
  document.documentElement.style.setProperty('--text', txt);
  document.documentElement.style.setProperty('--accent', acc);
  document.getElementById('cPrimary').value = p;
  document.getElementById('cBg').value = bg;
  document.getElementById('cText').value = txt;
  document.getElementById('cAccent').value = acc;
}

document.getElementById('cPrimary').oninput = e => 
  document.documentElement.style.setProperty('--primary', e.target.value);
document.getElementById('cBg').oninput = e => 
  document.documentElement.style.setProperty('--bg', e.target.value);
document.getElementById('cText').oninput = e => 
  document.documentElement.style.setProperty('--text', e.target.value);
document.getElementById('cAccent').oninput = e => 
  document.documentElement.style.setProperty('--accent', e.target.value);

function saveTheme() {
  const theme = {
    p: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
    bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
    txt: getComputedStyle(document.documentElement).getPropertyValue('--text').trim(),
    acc: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
  };
  localStorage.setItem('theme', JSON.stringify(theme));
}

function loadTheme() {
  const t = JSON.parse(localStorage.getItem('theme'));
  if (t) {
    document.documentElement.style.setProperty('--primary', t.p);
    document.documentElement.style.setProperty('--bg', t.bg);
    document.documentElement.style.setProperty('--text', t.txt);
    document.documentElement.style.setProperty('--accent', t.acc);
    document.getElementById('cPrimary').value = t.p;
    document.getElementById('cBg').value = t.bg;
    document.getElementById('cText').value = t.txt;
    document.getElementById('cAccent').value = t.acc;
  }
}
loadTheme();

function saveGames() {
  localStorage.setItem('myGames', JSON.stringify(games));
}

// ===== السحب باللمس =====
let touchX = 0;
document.addEventListener('touchstart', e => touchX = e.touches[0].clientX, false);
document.addEventListener('touchend', e => {
  const diff = e.changedTouches[0].clientX - touchX;
  if (Math.abs(diff) > 50) {
    if (diff < 0 && selected < games.length-1) selectGame(selected+1);
    if (diff > 0 && selected > 0) selectGame(selected-1);
  }
}, false);

// ===== الألعاب الداخلية =====

// لعبة الثعبان
function getSnakeGame() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>الثعبان</title>
<style>
body { margin: 0; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial; color: #fff; }
canvas { border: 2px solid #ff6a00; display: block; margin: 20px; background: #000; }
#score { position: absolute; top: 20px; color: #ff6a00; font-size: 20px; font-weight: bold; }
#gameOverScreen { position: absolute; display: none; background: rgba(0,0,0,0.95); color: white; padding: 40px; text-align: center; border-radius: 10px; border: 2px solid #ff6a00; }
#gameOverScreen h1 { margin: 0; color: #ffcc00; }
#gameOverScreen p { margin: 10px 0; }
#gameOverScreen button { padding: 10px 20px; background: #ff6a00; border: none; color: black; font-weight: bold; cursor: pointer; border-radius: 5px; }
</style>
</head>
<body>
<div id="score">Score: 0</div>
<canvas id="gameCanvas" width="400" height="400"></canvas>
<div id="gameOverScreen">
<h1>انتهت اللعبة!</h1>
<p id="finalScore"></p>
<button onclick="location.reload()">اللعب مجدداً</button>
</div>
<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const gameOverScreen = document.getElementById('gameOverScreen');

const gridSize = 20;
let snake = [{x: 10, y: 10}];
let direction = {x: 1, y: 0};
let nextDirection = {x: 1, y: 0};
let food = {x: Math.floor(Math.random() * (canvas.width / gridSize)), y: Math.floor(Math.random() * (canvas.height / gridSize))};
let score = 0;
let gameRunning = true;

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' && direction.y === 0) nextDirection = {x: 0, y: -1};
  if (e.key === 'ArrowDown' && direction.y === 0) nextDirection = {x: 0, y: 1};
  if (e.key === 'ArrowLeft' && direction.x === 0) nextDirection = {x: -1, y: 0};
  if (e.key === 'ArrowRight' && direction.x === 0) nextDirection = {x: 1, y: 0};
});

function update() {
  if (!gameRunning) return;
  direction = nextDirection;
  const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};
  
  if (head.x < 0 || head.x >= canvas.width / gridSize || head.y < 0 || head.y >= canvas.height / gridSize) {
    endGame();
    return;
  }
  
  for (let part of snake) {
    if (head.x === part.x && head.y === part.y) {
      endGame();
      return;
    }
  }
  
  snake.unshift(head);
  
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreDisplay.innerText = 'Score: ' + score;
    food = {x: Math.floor(Math.random() * (canvas.width / gridSize)), y: Math.floor(Math.random() * (canvas.height / gridSize))};
  } else {
    snake.pop();
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#00cc66';
  for (let part of snake) {
    ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
  }
  
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

function endGame() {
  gameRunning = false;
  document.getElementById('finalScore').innerText = 'نقاطك: ' + score;
  gameOverScreen.style.display = 'block';
}

function gameLoop() {
  update();
  draw();
  setTimeout(gameLoop, 100);
}

gameLoop();
</script>
</body>
</html>`;
}

// لعبة XO
function getXOGame() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>XO</title>
<style>
body { margin: 0; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial; color: white; }
h1 { color: #ffcc00; margin: 10px; }
#gameBoard { display: grid; grid-template-columns: repeat(3, 120px); gap: 5px; margin: 20px; }
.cell { width: 120px; height: 120px; background: #1a1a1a; border: 2px solid #ff6a00; font-size: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
.cell:hover { background: #2a2a2a; transform: scale(1.05); }
#status { font-size: 18px; margin: 10px; min-height: 30px; color: #ffcc00; }
#resetBtn { padding: 10px 20px; background: #ff6a00; border: none; color: black; font-weight: bold; cursor: pointer; border-radius: 5px; }
</style>
</head>
<body>
<h1>لعبة XO</h1>
<div id="status">دور اللاعب X</div>
<div id="gameBoard"></div>
<button id="resetBtn" onclick="resetGame()">لعبة جديدة</button>
<script>
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;

const winConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function renderBoard() {
  const gameBoard = document.getElementById('gameBoard');
  gameBoard.innerHTML = '';
  board.forEach((cell, idx) => {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'cell';
    cellDiv.innerText = cell;
    cellDiv.style.color = cell === 'X' ? '#0099ff' : '#ff6a00';
    cellDiv.onclick = () => playMove(idx);
    gameBoard.appendChild(cellDiv);
  });
}

function playMove(idx) {
  if (!gameActive || board[idx]) return;
  board[idx] = currentPlayer;
  
  if (checkWin()) {
    document.getElementById('status').innerText = '🎉 اللاعب ' + currentPlayer + ' فاز!';
    gameActive = false;
  } else if (board.every(cell => cell)) {
    document.getElementById('status').innerText = '🤝 تعادل!';
    gameActive = false;
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    document.getElementById('status').innerText = 'دور اللاعب ' + currentPlayer;
  }
  
  renderBoard();
}

function checkWin() {
  return winConditions.some(condition => {
    const [a, b, c] = condition;
    return board[a] && board[a] === board[b] && board[a] === board[c];
  });
}

function resetGame() {
  board = ['', '', '', '', '', '', '', '', ''];
  currentPlayer = 'X';
  gameActive = true;
  document.getElementById('status').innerText = 'دور اللاعب X';
  renderBoard();
}

renderBoard();
</script>
</body>
</html>`;
}

// لعبة الذاكرة
function getMemoryGame() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>لعبة الذاكرة</title>
<style>
body { margin: 0; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial; color: white; }
h1 { color: #ffcc00; margin: 10px; }
#gameBoard { display: grid; grid-template-columns: repeat(4, 80px); gap: 8px; margin: 20px; }
.card { width: 80px; height: 80px; background: #1a1a1a; border: 2px solid #ff6a00; display: flex; align-items: center; justify-content: center; font-size: 32px; cursor: pointer; user-select: none; transition: 0.2s; }
.card:hover { background: #2a2a2a; transform: scale(1.1); }
.card.flipped { background: #ff6a00; }
#score { font-size: 18px; margin: 10px; color: #ffcc00; }
#resetBtn { padding: 10px 20px; background: #ff6a00; border: none; color: black; font-weight: bold; cursor: pointer; border-radius: 5px; }
</style>
</head>
<body>
<h1>لعبة الذاكرة</h1>
<div id="score">الأزواج: 0</div>
<div id="gameBoard"></div>
<button id="resetBtn" onclick="initGame()">لعبة جديدة</button>
<script>
const emojis = ['🍎', '🍌', '🍊', '🍇', '🍓', '🍒', '🍑', '🥝'];
let cards = [];
let flipped = [];
let matched = 0;

function initGame() {
  cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
  flipped = [];
  matched = 0;
  document.getElementById('score').innerText = 'الأزواج: 0';
  renderBoard();
}

function renderBoard() {
  const gameBoard = document.getElementById('gameBoard');
  gameBoard.innerHTML = '';
  cards.forEach((emoji, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    if (flipped.includes(idx)) card.classList.add('flipped');
    card.innerText = flipped.includes(idx) ? emoji : '?';
    card.onclick = () => flip(idx);
    gameBoard.appendChild(card);
  });
}

function flip(idx) {
  if (flipped.length >= 2 || flipped.includes(idx)) return;
  flipped.push(idx);
  renderBoard();
  
  if (flipped.length === 2) {
    if (cards[flipped[0]] === cards[flipped[1]]) {
      matched++;
      document.getElementById('score').innerText = 'الأزواج: ' + matched;
      flipped = [];
      if (matched === emojis.length) alert('🎉 تهانينا! انتهيت من اللعبة!');
    } else {
      setTimeout(() => {
        flipped = [];
        renderBoard();
      }, 1000);
    }
  }
}

initGame();
</script>
</body>
</html>`;
}

// تشغيل التطبيق
renderGames();
