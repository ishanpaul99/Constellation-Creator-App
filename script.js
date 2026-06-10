const canvas = document.getElementById('skyCanvas');
const ctx = canvas.getContext('2d');
const connectModeBtn = document.getElementById('connectModeBtn');
const removeModeBtn = document.getElementById('removeModeBtn');
const randomBtn = document.getElementById('randomBtn');
const exportBtn = document.getElementById('exportBtn');
const mythBtn = document.getElementById('mythBtn');
const nameGenBtn = document.getElementById('nameGenBtn');
const saveBtn = document.getElementById('saveBtn');
const nameInput = document.getElementById('nameInput');
const typeInput = document.getElementById('typeInput');
const rarityInput = document.getElementById('rarityInput');
const cardName = document.getElementById('cardName');
const cardType = document.getElementById('cardType');
const cardRarity = document.getElementById('cardRarity');
const cardRating = document.getElementById('cardRating');
const cardMyth = document.getElementById('cardMyth');
const cardStars = document.getElementById('cardStars');
const cardLines = document.getElementById('cardLines');
const cardDate = document.getElementById('cardDate');
const galleryCards = document.getElementById('galleryCards');
const statTotal = document.getElementById('statTotal');
const statAverage = document.getElementById('statAverage');
const statType = document.getElementById('statType');
const statRarity = document.getElementById('statRarity');
const footerYear = document.getElementById('footerYear');

let stars = [];
let connections = [];
let selectedStar = null;
let dragStar = null;
let dragOffset = { x: 0, y: 0 };
let activeMode = 'place';
let savedConstellations = [];
let canvasRect = null;
let pointerDown = false;

const mythTemplates = [
  'The Silver Fox guides lost travelers beneath moonlit forests.',
  'The Eternal Serpent guards forgotten stars at the edge of existence.',
  'The Golden Stag appears only during celestial storms.',
  'A sleeping phoenix lights the sky when constellations are reborn.',
  'The Lunar Crown shines over hearts searching for wild dreams.',
  'A celestial wolf whispers hidden paths to those who listen.',
  'The starbound guardian watches over ancient secrets.',
  'The midnight stag appears when cosmic tides align.',
  'A serpent made of aurora threads world and sky together.',
  'The guardian of forgotten suns carries legends on its wings.'
];

const nameParts = {
  first: ['Silver', 'Eternal', 'Lunar', 'Astral', 'Golden', 'Void', 'Sapphire', 'Shadow', 'Moonlit', 'Starlit', 'Crystal', 'Midnight'],
  second: ['Fox', 'Serpent', 'Crown', 'Wolf', 'Stag', 'Phoenix', 'Dragon', 'Warden', 'Muse', 'Guardian', 'Shard', 'Wisp']
};

const typeOptions = ['Celestial Beast', 'Hero', 'Ancient Symbol', 'Mythical Creature', 'Cosmic Guardian', 'Unknown Entity'];
const rarityOptions = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];

const storageKey = 'constellationCreatorSaved';

function init() {
  footerYear.textContent = new Date().getFullYear();
  bindEvents();
  loadSavedConstellations();
  setCanvasSize();
  updateCard();
  updateGallery();
  updateStats();
  window.requestAnimationFrame(animate);
}

function bindEvents() {
  window.addEventListener('resize', setCanvasSize);
  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  connectModeBtn.addEventListener('click', () => setMode('connect'));
  removeModeBtn.addEventListener('click', () => setMode('remove'));
  randomBtn.addEventListener('click', makeRandomConstellation);
  exportBtn.addEventListener('click', exportCanvasImage);
  mythBtn.addEventListener('click', generateMyth);
  nameGenBtn.addEventListener('click', generateName);
  saveBtn.addEventListener('click', saveCurrentConstellation);
  nameInput.addEventListener('input', updateCard);
  typeInput.addEventListener('change', updateCard);
  rarityInput.addEventListener('change', updateCard);
}

function setMode(mode) {
  activeMode = mode;
  selectedStar = null;
  connectModeBtn.classList.toggle('active', mode === 'connect');
  removeModeBtn.classList.toggle('active', mode === 'remove');
  if (!mode) {
    connectModeBtn.classList.remove('active');
    removeModeBtn.classList.remove('active');
  }
}

function setCanvasSize() {
  const rect = canvas.getBoundingClientRect();
  canvasRect = rect;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function onPointerDown(event) {
  const point = getPointerLocation(event);
  const star = getStarNear(point.x, point.y);
  if (star && activeMode === 'place') {
    dragStar = star;
    dragOffset.x = point.x - star.x;
    dragOffset.y = point.y - star.y;
    pointerDown = true;
  }
}

function onPointerMove(event) {
  if (!dragStar) return;
  const point = getPointerLocation(event);
  dragStar.x = clamp(point.x - dragOffset.x, 18, canvasRect.width - 18);
  dragStar.y = clamp(point.y - dragOffset.y, 18, canvasRect.height - 18);
  updateCard();
}

function onPointerUp() {
  dragStar = null;
  pointerDown = false;
}

function onCanvasClick(event) {
  const point = getPointerLocation(event);
  const star = getStarNear(point.x, point.y);

  if (activeMode === 'remove') {
    if (star) {
      removeStar(star);
      updateCard();
    }
    return;
  }

  if (activeMode === 'connect') {
    if (!star) return;
    if (!selectedStar) {
      selectedStar = star;
      return;
    }
    if (selectedStar && selectedStar !== star) {
      addConnection(selectedStar, star);
      selectedStar = null;
      updateCard();
    }
    return;
  }

  if (!star) {
    addStar(point.x, point.y);
    updateCard();
  }
}

function getPointerLocation(event) {
  const rect = canvasRect;
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function addStar(x, y) {
  stars.push({
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    x,
    y,
    radius: 3 + Math.random() * 4,
    glow: 0.5 + Math.random() * 0.5,
    twinkle: Math.random() * Math.PI * 2,
    favorite: false
  });
}

function removeStar(star) {
  stars = stars.filter(item => item !== star);
  connections = connections.filter(conn => conn.a !== star.id && conn.b !== star.id);
}

function getStarNear(x, y) {
  return stars.find(star => {
    const dx = star.x - x;
    const dy = star.y - y;
    return Math.hypot(dx, dy) < star.radius + 12;
  });
}

function addConnection(start, end) {
  if (connections.some(conn => (conn.a === start.id && conn.b === end.id) || (conn.b === start.id && conn.a === end.id))) {
    return;
  }
  connections.push({ a: start.id, b: end.id, created: Date.now() });
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvasRect.width, canvasRect.height);
  gradient.addColorStop(0, '#07111f');
  gradient.addColorStop(0.4, '#091a2d');
  gradient.addColorStop(1, '#06101f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasRect.width, canvasRect.height);

  for (let i = 0; i < 70; i++) {
    const x = (i * 37) % canvasRect.width;
    const y = ((i * 53) % canvasRect.height) + 14;
    const size = ((i % 3) + 1) * 0.8;
    ctx.fillStyle = `rgba(245,245,245,${0.02 + (i % 4) * 0.03})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const glow = ctx.createRadialGradient(canvasRect.width * 0.3, canvasRect.height * 0.18, 20, canvasRect.width * 0.3, canvasRect.height * 0.18, canvasRect.width * 0.65);
  glow.addColorStop(0, 'rgba(123, 97, 255, 0.15)');
  glow.addColorStop(1, 'rgba(7, 17, 31, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvasRect.width, canvasRect.height);
}

function drawConnections(time) {
  connections.forEach(conn => {
    const a = stars.find(s => s.id === conn.a);
    const b = stars.find(s => s.id === conn.b);
    if (!a || !b) return;

    const age = (Date.now() - conn.created) / 500;
    const alpha = Math.min(1, age);
    ctx.save();
    ctx.strokeStyle = `rgba(77, 208, 225, ${0.12 + alpha * 0.8})`;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = 'rgba(77, 208, 225, 0.45)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  });
}

function drawStars(time) {
  stars.forEach(star => {
    const pulse = 0.6 + 0.4 * Math.sin((time * 0.003) + star.twinkle);
    const radius = star.radius + pulse * 1.4;

    ctx.save();
    ctx.fillStyle = `rgba(245,245,245,${0.8 + pulse * 0.15})`;
    ctx.shadowColor = `rgba(77, 208, 225, ${0.4 + star.glow * 0.3})`;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(star.x, star.y, radius + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (selectedStar === star && activeMode === 'connect') {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.78)';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(star.x, star.y, radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  });
}

function animate(time = 0) {
  if (!canvasRect) setCanvasSize();
  drawBackground();
  drawConnections(time);
  drawStars(time);
  requestAnimationFrame(animate);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function generateMyth() {
  const myth = mythTemplates[Math.floor(Math.random() * mythTemplates.length)];
  cardMyth.textContent = myth;
  updateCard();
}

function generateName() {
  const first = nameParts.first[Math.floor(Math.random() * nameParts.first.length)];
  const second = nameParts.second[Math.floor(Math.random() * nameParts.second.length)];
  nameInput.value = `${first} ${second}`;
  updateCard();
}

function computeRating(starCount, lineCount, rarity) {
  const rarityWeight = { Common: 0, Rare: 1.5, Epic: 3, Legendary: 4.5, Mythic: 6 };
  const score = starCount * 1 + lineCount * 1.8 + rarityWeight[rarity];
  const stars = Math.min(5, Math.max(1, Math.ceil(score / 4.5)));
  let message = 'Simple Pattern';
  if (score >= 14) message = 'Emerging Legend';
  if (score >= 22) message = 'Celestial Masterpiece';
  return { stars, message };
}

function updateCard() {
  const name = nameInput.value.trim() || 'Unnamed Sky';
  const type = typeInput.value;
  const rarity = rarityInput.value;
  const myth = cardMyth.textContent.trim() || 'A soft legend will appear here once you generate a myth for your creation.';
  const starsCount = stars.length;
  const linesCount = connections.length;
  const date = cardDate.textContent === '—' ? new Date().toLocaleDateString() : cardDate.textContent;
  const rating = computeRating(starsCount, linesCount, rarity);

  cardName.textContent = name;
  cardType.textContent = `Type: ${type}`;
  cardRarity.textContent = `Rarity: ${rarity}`;
  cardRating.textContent = `⭐ ${rating.message}`;
  cardMyth.textContent = myth;
  cardStars.textContent = starsCount;
  cardLines.textContent = linesCount;
  cardDate.textContent = date;
}

function saveCurrentConstellation() {
  const name = nameInput.value.trim() || generateInlineName();
  const type = typeInput.value;
  const rarity = rarityInput.value;
  const myth = cardMyth.textContent.trim() || generateInlineMyth();
  const starsCount = stars.length;
  const linesCount = connections.length;

  if (starsCount === 0) {
    alert('Place at least one star before saving your constellation.');
    return;
  }

  const rating = computeRating(starsCount, linesCount, rarity);
  const entry = {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    name,
    type,
    rarity,
    myth,
    stars: starsCount,
    connections: linesCount,
    date: new Date().toLocaleDateString(),
    rating: rating.message,
    score: rating.stars,
    favorite: false
  };

  savedConstellations.unshift(entry);
  localStorage.setItem(storageKey, JSON.stringify(savedConstellations));
  updateGallery();
  updateStats();
  cardDate.textContent = entry.date;
  alert('Constellation saved to your gallery.');
}

function loadSavedConstellations() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) savedConstellations = saved;
  } catch (error) {
    savedConstellations = [];
  }
}

function updateGallery() {
  galleryCards.innerHTML = '';
  if (savedConstellations.length === 0) {
    galleryCards.innerHTML = '<p class="empty-message">No constellations saved yet. Create your first legend above.</p>';
    return;
  }

  savedConstellations.forEach(item => {
    const card = document.createElement('article');
    card.className = 'gallery-card';
    card.innerHTML = `
      <button class="favorite-btn ${item.favorite ? 'active' : ''}" data-id="${item.id}" aria-label="Favorite constellation">${item.favorite ? '♥' : '♡'}</button>
      <h4>${item.name}</h4>
      <p>${item.myth}</p>
      <div class="gallery-meta">
        <span>${item.type}</span>
        <span>${item.rarity}</span>
        <span>${item.stars} stars</span>
        <span>${item.connections} lines</span>
        <span>${item.date}</span>
        <span>${item.rating}</span>
      </div>
    `;
    galleryCards.appendChild(card);

    const favButton = card.querySelector('.favorite-btn');
    favButton.addEventListener('click', () => toggleFavorite(item.id));
  });
}

function toggleFavorite(id) {
  const item = savedConstellations.find(entry => entry.id === id);
  if (!item) return;
  item.favorite = !item.favorite;
  localStorage.setItem(storageKey, JSON.stringify(savedConstellations));
  updateGallery();
}

function updateStats() {
  const total = savedConstellations.length;
  const sumStars = savedConstellations.reduce((sum, item) => sum + item.stars, 0);
  const average = total ? (sumStars / total).toFixed(1) : '0';
  const typeCount = {};
  const rarityCount = {};

  savedConstellations.forEach(item => {
    typeCount[item.type] = (typeCount[item.type] || 0) + 1;
    rarityCount[item.rarity] = (rarityCount[item.rarity] || 0) + 1;
  });

  const commonType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  const commonRarity = Object.entries(rarityCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  statTotal.textContent = total;
  statAverage.textContent = average;
  statType.textContent = commonType;
  statRarity.textContent = commonRarity;
}

function exportCanvasImage() {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `${(nameInput.value.trim() || 'constellation').replace(/\s+/g, '_').toLowerCase()}.png`;
  link.click();
}

function makeRandomConstellation() {
  stars = [];
  connections = [];
  const starCount = 8 + Math.floor(Math.random() * 10);
  for (let i = 0; i < starCount; i++) {
    addStar(
      50 + Math.random() * (canvasRect.width - 100),
      50 + Math.random() * (canvasRect.height - 100)
    );
  }

  const connectionCount = Math.min(starCount - 1, 5 + Math.floor(Math.random() * 5));
  const shuffled = [...stars].sort(() => Math.random() - 0.5);
  for (let i = 0; i < connectionCount; i++) {
    const a = shuffled[i];
    const b = shuffled[(i + 1 + Math.floor(Math.random() * (starCount - 1))) % starCount];
    if (a && b && a !== b) addConnection(a, b);
  }

  nameInput.value = generateInlineName();
  typeInput.value = typeOptions[Math.floor(Math.random() * typeOptions.length)];
  rarityInput.value = rarityOptions[Math.floor(Math.random() * rarityOptions.length)];
  cardMyth.textContent = generateInlineMyth();
  cardDate.textContent = new Date().toLocaleDateString();
  updateCard();
}

function generateInlineName() {
  const first = nameParts.first[Math.floor(Math.random() * nameParts.first.length)];
  const second = nameParts.second[Math.floor(Math.random() * nameParts.second.length)];
  return `${first} ${second}`;
}

function generateInlineMyth() {
  return mythTemplates[Math.floor(Math.random() * mythTemplates.length)];
}

init();
