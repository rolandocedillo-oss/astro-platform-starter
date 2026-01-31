import { LOTERIA_CARDS, LOTERIA_CARD_COUNT } from './cards.js';

const state = {
  deck: [],
  currentIndex: -1,
  running: false,
  paused: false,
  autoMode: true,
  autoDelay: 5,
  timerId: null,
  isCalling: false,
  currentCardId: null,
  nextCardId: null,
  ttsProvider: 'browser',
  cloudModel: 'gemini-2.5-flash-tts',
  cloudVoiceEs: '',
  cloudVoiceEn: '',
  audio: null
};

const elements = {
  startBtn: document.getElementById('start-btn'),
  pauseBtn: document.getElementById('pause-btn'),
  endBtn: document.getElementById('end-btn'),
  nextBtn: document.getElementById('next-btn'),
  autoToggle: document.getElementById('auto-toggle'),
  speedRange: document.getElementById('speed-range'),
  speedValue: document.getElementById('speed-value'),
  modeLabel: document.getElementById('mode-label'),
  statusText: document.getElementById('status-text'),
  calledCount: document.getElementById('called-count'),
  currentArt: document.getElementById('current-art'),
  currentNumber: document.getElementById('current-number'),
  currentNameEs: document.getElementById('current-name-es'),
  currentNameEn: document.getElementById('current-name-en'),
  nextArt: document.getElementById('next-art'),
  nextNumber: document.getElementById('next-number'),
  nextNameEs: document.getElementById('next-name-es'),
  nextNameEn: document.getElementById('next-name-en'),
  placemat: document.getElementById('placemat-grid'),
  ttsProvider: document.getElementById('tts-provider'),
  cloudModel: document.getElementById('cloud-model'),
  cloudVoiceEs: document.getElementById('cloud-voice-es'),
  cloudVoiceEn: document.getElementById('cloud-voice-en')
};

const tileById = new Map();
const calledIds = new Set();
const CLOUD_TTS_ENABLED = false;
const PRERECORDED_AUDIO_BASE = '/audio/loteria';
const PRERECORDED_EXTENSIONS = ['mp3', 'wav'];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function escapeXml(text) {
  return text.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function formatCardFilename(card) {
  const number = String(card.id).padStart(2, '0');
  const name = card.nameEs
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
  return `${number} ${name}.webp`;
}

function buildFallbackArt(card, size = 140) {
  const hue = (card.id * 37) % 360;
  const main = `hsl(${hue}, 70%, 78%)`;
  const accent = `hsl(${(hue + 40) % 360}, 70%, 60%)`;
  const shortName = card.nameEs.replace(/^(El|La|Las)\s+/i, '');
  const label = shortName.length > 12 ? `${shortName.slice(0, 11)}.` : shortName;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${main}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${size}" height="${size}" rx="18" fill="url(#grad)" />
      <rect x="10" y="10" width="${size - 20}" height="${size - 20}" rx="14" fill="rgba(255,255,255,0.22)" stroke="rgba(30,30,60,0.3)" stroke-width="2" />
      <circle cx="${size * 0.7}" cy="${size * 0.35}" r="${size * 0.18}" fill="rgba(255,255,255,0.45)" />
      <circle cx="${size * 0.7}" cy="${size * 0.35}" r="${size * 0.11}" fill="rgba(0,0,0,0.08)" />
      <text x="${size * 0.18}" y="${size * 0.28}" font-size="${size * 0.22}" font-family="'Signika', sans-serif" font-weight="700" fill="rgba(30,30,60,0.7)">#${card.id}</text>
      <text x="${size * 0.18}" y="${size * 0.75}" font-size="${size * 0.14}" font-family="'Signika', sans-serif" font-weight="600" fill="rgba(30,30,60,0.8)">${escapeXml(label)}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

function buildCardArt(card, size = 140) {
  if (!card) return 'none';
  const filename = formatCardFilename(card);
  const assetPath = `/images/loteria/cards/${filename}`;
  const slug = slugify(card.nameEs);
  const svgFallback = `/images/loteria/cards/${slug}.svg`;
  const fallback = buildFallbackArt(card, size);
  return `url('${assetPath}'), url('${svgFallback}'), url('${fallback}')`;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function buildAudioSources(card) {
  const base = `${PRERECORDED_AUDIO_BASE}/${pad2(card.id)}`;
  return PRERECORDED_EXTENSIONS.map((ext) => `${base}.${ext}`);
}

function renderPlacemat() {
  if (!elements.placemat) return;
  elements.placemat.innerHTML = '';
  tileById.clear();

  LOTERIA_CARDS.forEach((card) => {
    const tile = document.createElement('div');
    tile.className = 'placemat-tile';
    tile.dataset.cardId = String(card.id);
    tile.innerHTML = `
      <div class="tile-art" style="background-image: ${buildCardArt(card, 100)}"></div>
      <div class="tile-meta">
        <span class="tile-number">${card.id}</span>
        <span class="tile-name">${card.nameEs}</span>
      </div>
      <div class="tile-dot"></div>
    `;
    elements.placemat.appendChild(tile);
    tileById.set(card.id, tile);
  });
}

function shuffleDeck(cards) {
  const deck = cards.slice();
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function clearTimer() {
  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }
}

function stopAudio() {
  if (state.audio) {
    state.audio.pause();
    state.audio.src = '';
    state.audio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function resetPlacemat() {
  calledIds.clear();
  tileById.forEach((tile) => {
    tile.classList.remove('is-called', 'is-current', 'is-next');
  });
}

function updateCounts() {
  if (elements.calledCount) {
    elements.calledCount.textContent = String(calledIds.size);
  }
}

function updateStatus(text) {
  if (elements.statusText) {
    elements.statusText.textContent = text;
  }
}

function updateModeLabel() {
  if (elements.modeLabel) {
    elements.modeLabel.textContent = state.autoMode ? 'Auto' : 'Manual';
  }
}

function updateControls() {
  if (!elements.startBtn) return;
  elements.pauseBtn.disabled = !state.running;
  elements.endBtn.disabled = !state.running;
  elements.nextBtn.disabled = !state.running || state.autoMode || state.paused;
  elements.pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
  updateModeLabel();
}

function setPreview(card, target) {
  if (!target) return;
  if (!card) {
    target.art.style.backgroundImage = 'none';
    target.number.textContent = '—';
    target.nameEs.textContent = 'Waiting for game start';
    target.nameEn.textContent = '';
    return;
  }
  target.art.style.backgroundImage = buildCardArt(card, 220);
  target.number.textContent = `#${card.id}`;
  target.nameEs.textContent = card.nameEs;
  target.nameEn.textContent = card.nameEn;
}

function updateHighlights(currentCard, nextCard) {
  if (state.currentCardId && tileById.has(state.currentCardId)) {
    tileById.get(state.currentCardId).classList.remove('is-current');
  }
  if (state.nextCardId && tileById.has(state.nextCardId)) {
    tileById.get(state.nextCardId).classList.remove('is-next');
  }

  state.currentCardId = currentCard ? currentCard.id : null;
  state.nextCardId = nextCard ? nextCard.id : null;

  if (state.currentCardId && tileById.has(state.currentCardId)) {
    tileById.get(state.currentCardId).classList.add('is-current');
  }
  if (state.nextCardId && tileById.has(state.nextCardId)) {
    tileById.get(state.nextCardId).classList.add('is-next');
  }
}

function markCalled(card) {
  calledIds.add(card.id);
  const tile = tileById.get(card.id);
  if (tile) {
    tile.classList.add('is-called');
  }
  updateCounts();
}

async function speakWithBrowser(text, lang) {
  if (!('speechSynthesis' in window)) {
    return;
  }
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.speak(utterance);
  });
}

async function speakWithCloud(text, lang) {
  const response = await fetch('/api/loteria-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      languageCode: lang,
      modelName: state.cloudModel,
      voiceName: lang.startsWith('es') ? state.cloudVoiceEs : state.cloudVoiceEn
    })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || 'Gemini TTS request failed');
  }

  const payload = await response.json();
  if (!payload.audioContent) {
    throw new Error('Gemini TTS did not return audio');
  }

  const mime = payload.audioEncoding === 'LINEAR16' ? 'audio/wav' : 'audio/mpeg';
  const audio = new Audio(`data:${mime};base64,${payload.audioContent}`);
  state.audio = audio;

  await new Promise((resolve) => {
    audio.onended = resolve;
    audio.onerror = resolve;
    audio.play();
  });
}

async function playAudioFile(src) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(src);
    state.audio = audio;
    const cleanUp = () => {
      audio.onended = null;
      audio.onerror = null;
    };
    audio.onended = () => {
      cleanUp();
      resolve();
    };
    audio.onerror = () => {
      cleanUp();
      reject(new Error('Audio failed to load'));
    };
    audio.play().catch((error) => {
      cleanUp();
      reject(error);
    });
  });
}

async function playPrerecorded(card) {
  const sources = buildAudioSources(card);
  let lastError;
  for (const src of sources) {
    try {
      await playAudioFile(src);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('No prerecorded audio found');
}

async function speakCard(card) {
  if (!card) return;
  if (state.ttsProvider === 'prerecorded') {
    try {
      await playPrerecorded(card);
      return;
    } catch (error) {
      updateStatus('Missing prerecorded audio - using browser voice');
    }
  }
  if (state.ttsProvider === 'cloud') {
    await speakWithCloud(card.nameEs, 'es-MX');
    await wait(150);
    await speakWithCloud(card.nameEn, 'en-US');
    return;
  }

  await speakWithBrowser(card.nameEs, 'es-MX');
  await wait(150);
  await speakWithBrowser(card.nameEn, 'en-US');
}

function scheduleNextCall() {
  clearTimer();
  if (!state.autoMode || !state.running || state.paused) return;
  state.timerId = setTimeout(() => {
    callNextCard();
  }, state.autoDelay * 1000);
}

async function callNextCard() {
  if (!state.running || state.paused || state.isCalling) return;
  if (state.currentIndex + 1 >= state.deck.length) {
    endGame('Deck complete');
    return;
  }

  state.isCalling = true;
  const card = state.deck[++state.currentIndex];
  const nextCard = state.deck[state.currentIndex + 1] || null;

  setPreview(card, {
    art: elements.currentArt,
    number: elements.currentNumber,
    nameEs: elements.currentNameEs,
    nameEn: elements.currentNameEn
  });
  setPreview(nextCard, {
    art: elements.nextArt,
    number: elements.nextNumber,
    nameEs: elements.nextNameEs,
    nameEn: elements.nextNameEn
  });
  updateHighlights(card, nextCard);
  markCalled(card);

  updateStatus('Calling cards');

  try {
    await speakCard(card);
  } catch (error) {
    updateStatus(error.message || 'TTS error - switched to silent mode');
  }

  state.isCalling = false;

  if (state.running && !state.paused) {
    updateStatus('Ready');
  }

  scheduleNextCall();
}

function startGame() {
  stopAudio();
  clearTimer();
  resetPlacemat();
  updateCounts();

  state.deck = shuffleDeck(LOTERIA_CARDS);
  state.currentIndex = -1;
  state.running = true;
  state.paused = false;
  state.isCalling = false;

  setPreview(null, {
    art: elements.currentArt,
    number: elements.currentNumber,
    nameEs: elements.currentNameEs,
    nameEn: elements.currentNameEn
  });
  setPreview(null, {
    art: elements.nextArt,
    number: elements.nextNumber,
    nameEs: elements.nextNameEs,
    nameEn: elements.nextNameEn
  });

  updateStatus('Game started');
  updateControls();
  callNextCard();
}

function pauseGame() {
  if (!state.running) return;
  state.paused = true;
  clearTimer();
  stopAudio();
  updateStatus('Paused');
  updateControls();
}

function resumeGame() {
  if (!state.running) return;
  state.paused = false;
  updateStatus('Ready');
  updateControls();
  scheduleNextCall();
}

function togglePause() {
  if (state.paused) {
    resumeGame();
  } else {
    pauseGame();
  }
}

function endGame(reason = 'Game ended') {
  stopAudio();
  clearTimer();
  state.running = false;
  state.paused = false;
  state.isCalling = false;
  state.currentIndex = -1;
  updateStatus(reason);
  updateControls();
  updateHighlights(null, null);
  setPreview(null, {
    art: elements.currentArt,
    number: elements.currentNumber,
    nameEs: elements.currentNameEs,
    nameEn: elements.currentNameEn
  });
  setPreview(null, {
    art: elements.nextArt,
    number: elements.nextNumber,
    nameEs: elements.nextNameEs,
    nameEn: elements.nextNameEn
  });
}

function handleModeToggle() {
  state.autoMode = elements.autoToggle?.checked ?? true;
  updateControls();
  if (!state.running) return;
  if (state.autoMode) {
    scheduleNextCall();
  } else {
    clearTimer();
  }
}

function handleSpeedChange() {
  const value = Number(elements.speedRange?.value || 5);
  state.autoDelay = value;
  if (elements.speedValue) {
    elements.speedValue.textContent = `${value}s`;
  }
}

function handleProviderChange() {
  const selected = elements.ttsProvider?.value || 'browser';
  if (selected === 'cloud' && !CLOUD_TTS_ENABLED) {
    state.ttsProvider = 'browser';
    if (elements.ttsProvider) {
      elements.ttsProvider.value = 'browser';
    }
    updateStatus('Cloud TTS coming soon');
    return;
  }
  state.ttsProvider = selected;
}

function handleCloudSettings() {
  state.cloudModel = elements.cloudModel?.value?.trim() || state.cloudModel;
  state.cloudVoiceEs = elements.cloudVoiceEs?.value?.trim() || '';
  state.cloudVoiceEn = elements.cloudVoiceEn?.value?.trim() || '';
}

function init() {
  renderPlacemat();
  updateCounts();
  updateStatus('Ready');
  updateControls();
  handleSpeedChange();
  handleProviderChange();

  setPreview(null, {
    art: elements.currentArt,
    number: elements.currentNumber,
    nameEs: elements.currentNameEs,
    nameEn: elements.currentNameEn
  });
  setPreview(null, {
    art: elements.nextArt,
    number: elements.nextNumber,
    nameEs: elements.nextNameEs,
    nameEn: elements.nextNameEn
  });

  elements.startBtn?.addEventListener('click', startGame);
  elements.pauseBtn?.addEventListener('click', togglePause);
  elements.endBtn?.addEventListener('click', () => endGame('Game ended'));
  elements.nextBtn?.addEventListener('click', callNextCard);
  elements.autoToggle?.addEventListener('change', handleModeToggle);
  elements.speedRange?.addEventListener('input', handleSpeedChange);
  elements.ttsProvider?.addEventListener('change', handleProviderChange);
  elements.cloudModel?.addEventListener('change', handleCloudSettings);
  elements.cloudVoiceEs?.addEventListener('change', handleCloudSettings);
  elements.cloudVoiceEn?.addEventListener('change', handleCloudSettings);
}

init();
