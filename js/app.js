import { parseBRV, colorToHex, formatCm, vehicleLabel } from './brv.js';
import { readZip } from './zip.js';
import { VehicleViewer } from './viewer.js';
import {
  initLang,
  setLang,
  getLang,
  t,
  applyTranslations,
  onLangChange,
} from './i18n.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const MAX_BRV_SIZE = 32 * 1024 * 1024;
const MAX_ZIP_SIZE = 220 * 1024 * 1024;
const MAX_VEHICLES = 120;

const state = {
  vehicles: [],
  activeId: null,
  viewer: null,
  theme: 'dark',
  driving: false,
  host: '',
  unique: 0,
  loading: false,
  gameDetected: false,
  gameBrvCount: 0,
};

const els = {};
let toastTimer = 0;
let qrTimer = 0;
let qrPlaceholder = '';
let dragDepth = 0;

/* --------------------------------------------------------------------------
   Small helpers
   -------------------------------------------------------------------------- */

function assetUrl(path) {
  return new URL(path, import.meta.url).href;
}

function baseName(path) {
  return String(path || '').replace(/\\/g, '/').split('/').filter(Boolean).pop() || '';
}

function stripExtension(name) {
  return name.replace(/\.[^.]+$/, '');
}

function pathOf(file) {
  return file.relativePath || file.webkitRelativePath || file.name || '';
}

function isGamePath(path) {
  const value = String(path || '').replace(/\\/g, '/').toLowerCase();
  if (!value) return false;
  if (/(^|\/)brickrigs(-win64-shipping)?\.exe$/.test(value)) return true;
  if (value.includes('/brickrigs/binaries/win64/')) return true;
  if (value.includes('/brickrigs/content/paks/')) return true;
  if (/(^|\/)brickrigs-win64-shipping\.pak$/.test(value)) return true;
  return false;
}

function displayName(record) {
  if (!record) return '';
  return record.nameKey ? t(record.nameKey) : record.name;
}

function activeRecord() {
  return state.vehicles.find((record) => record.id === state.activeId) || null;
}

function maxDimension(vehicle) {
  return Math.max(vehicle.stats.sizeCm.x, vehicle.stats.sizeCm.y, vehicle.stats.sizeCm.z);
}

function nextId(prefix) {
  state.unique += 1;
  return `${prefix}:${state.unique}`;
}

function showToast(message, isError = false) {
  if (!els.toast) return;
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.toggle('is-error', Boolean(isError));
  els.toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => {
    els.toast.classList.remove('is-visible');
  }, 3400);
}

function setLoading(loading) {
  state.loading = loading;
  if (els.viewerLoading) els.viewerLoading.hidden = !loading;
}

function showViewerNote(text) {
  if (!els.viewerNote) return;
  els.viewerNote.hidden = !text;
  if (text) els.viewerNote.querySelector('span').textContent = text;
}

/* --------------------------------------------------------------------------
   Theme & language
   -------------------------------------------------------------------------- */

function applyTheme(theme, { persist = true } = {}) {
  state.theme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = state.theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', state.theme === 'light' ? '#f2ece1' : '#0b0d12');
  if (persist) {
    try {
      localStorage.setItem('brick-rigs-theme', state.theme);
    } catch {
      // Private mode: ignore.
    }
  }
  if (state.viewer) {
    try {
      state.viewer.setTheme(state.theme);
    } catch {
      // The viewer may not be initialised yet.
    }
  }
}

function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem('brick-rigs-theme');
  } catch {
    saved = null;
  }
  applyTheme(saved === 'light' ? 'light' : 'dark', { persist: false });
}

function updateLangLabel() {
  if (els.langLabel) els.langLabel.textContent = getLang() === 'uk' ? 'EN' : 'UA';
  if (els.langToggle) {
    els.langToggle.setAttribute(
      'aria-label',
      getLang() === 'uk' ? 'Switch to English' : 'Перемкнути українську'
    );
  }
}

function refreshDynamicText() {
  updateLangLabel();
  renderVehicleList();
  updateGameNotice();
  updateDriveEmpty();

  const record = activeRecord();
  if (record) {
    els.viewerFileName.textContent = displayName(record);
  } else {
    els.viewerFileName.textContent = t('garage.emptyTitle');
  }

  if (!state.viewer && els.viewerEmpty) {
    const strong = els.viewerEmpty.querySelector('strong');
    const paragraph = els.viewerEmpty.querySelector('p');
    if (strong) strong.textContent = t('garage.noWebgl');
    if (paragraph) paragraph.textContent = '';
    showViewerNote(t('garage.noWebgl'));
  }
}

/* --------------------------------------------------------------------------
   Viewer initialisation
   -------------------------------------------------------------------------- */

function initViewer() {
  try {
    state.viewer = new VehicleViewer(els.viewerCanvas, {
      theme: state.theme,
      onStats: handleViewerStats,
      onMode: handleViewerMode,
    });
    state.viewer.onDriveHud(updateHud);
  } catch (error) {
    state.viewer = null;
    console.warn('WebGL viewer could not start:', error);
    if (els.viewerCanvas) els.viewerCanvas.hidden = true;
    if (els.viewerEmpty) {
      const strong = els.viewerEmpty.querySelector('strong');
      const paragraph = els.viewerEmpty.querySelector('p');
      if (strong) strong.textContent = t('garage.noWebgl');
      if (paragraph) paragraph.textContent = '';
    }
    showViewerNote(t('garage.noWebgl'));
  }
}

function handleViewerStats(vehicle) {
  if (!vehicle) return;
  if (vehicle.bricks.length > 260) showViewerNote(t('garage.tooMany'));
  else if (state.viewer) showViewerNote('');
}

function handleViewerMode(mode) {
  if (mode === 'drive') {
    document.body.classList.add('is-driving');
    return;
  }
  if (mode === 'studio' && state.driving) teardownDriveUi();
}

function updateHud(speed, distance) {
  if (!els.speedValue || !els.distanceValue) return;
  els.speedValue.textContent = String(Math.max(0, Math.round(speed || 0)));
  els.distanceValue.textContent = String(Math.max(0, Math.round(distance || 0)));
}

/* --------------------------------------------------------------------------
   Vehicle statistics and list
   -------------------------------------------------------------------------- */

function updateStats(record) {
  const vehicle = record ? record.vehicle : null;
  if (!vehicle) {
    els.statBricks.textContent = '—';
    els.statSize.textContent = '—';
    els.statTypes.textContent = '—';
    els.statWheels.textContent = '—';
    els.statSize.removeAttribute('title');
    return;
  }
  els.statBricks.textContent = String(vehicle.stats.bricks);
  els.statTypes.textContent = String(vehicle.stats.types);
  els.statWheels.textContent = String(vehicle.stats.wheels);
  els.statSize.textContent = formatCm(maxDimension(vehicle));
  els.statSize.title = vehicleLabel(vehicle);
}

function renderVehicleList() {
  if (!els.vehicleList) return;
  els.vehicleList.textContent = '';
  if (els.vehicleCount) els.vehicleCount.textContent = String(state.vehicles.length);

  if (!state.vehicles.length) {
    const paragraph = document.createElement('p');
    paragraph.className = 'muted';
    paragraph.textContent = t('garage.emptyText');
    els.vehicleList.append(paragraph);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const record of state.vehicles) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'vehicle-row';
    if (record.id === state.activeId) button.classList.add('is-active');
    button.dataset.vehicleId = record.id;
    button.title = record.path || displayName(record);

    const thumb = document.createElement('span');
    thumb.className = 'vehicle-thumb';
    thumb.style.setProperty('--thumb', record.color || '#465063');

    const info = document.createElement('span');
    info.className = 'vehicle-info';
    const name = document.createElement('strong');
    name.className = 'vehicle-name';
    name.textContent = displayName(record);
    const meta = document.createElement('small');
    meta.className = 'vehicle-meta';
    meta.textContent = `${record.vehicle.stats.bricks} · ${formatCm(maxDimension(record.vehicle))}`;
    info.append(name, meta);

    const format = document.createElement('span');
    format.className = 'vehicle-format';
    format.textContent = record.demo ? t('common.demo') : '.brv';

    button.append(thumb, info, format);
    button.addEventListener('click', () => setActiveVehicle(record.id));
    fragment.append(button);
  }
  els.vehicleList.append(fragment);
}

function addVehicle(record) {
  if (state.vehicles.length >= MAX_VEHICLES) state.vehicles.shift();
  const existing = state.vehicles.findIndex((item) => item.id === record.id);
  if (existing >= 0) state.vehicles.splice(existing, 1);
  state.vehicles.unshift(record);
  renderVehicleList();
  return record;
}

function setActiveVehicle(id) {
  const record = state.vehicles.find((item) => item.id === id);
  if (!record) return;

  state.activeId = id;
  els.viewerCard.classList.add('has-vehicle');
  els.viewerFileName.textContent = displayName(record);
  updateStats(record);
  renderVehicleList();

  if (state.viewer) {
    state.viewer.setVehicle(record.vehicle);
    els.viewerEmpty.hidden = true;
  } else {
    els.viewerEmpty.hidden = false;
  }

  updateDriveEmpty();
}

/* --------------------------------------------------------------------------
   File loading
   -------------------------------------------------------------------------- */

function vehicleFromBuffer(buffer, meta) {
  const vehicle = parseBRV(buffer);
  if (!vehicle.bricks.length) throw new Error('У файлі немає цеглинок');
  return {
    id: meta.id,
    name: meta.name,
    nameKey: meta.nameKey || null,
    path: meta.path || meta.name,
    demo: Boolean(meta.demo),
    vehicle,
    color: colorToHex(vehicle.bricks[0].color),
  };
}

async function parseVehicleFile(file, path) {
  if (file.size > MAX_BRV_SIZE) throw new Error(t('toast.tooBig'));
  const buffer = await file.arrayBuffer();
  return vehicleFromBuffer(buffer, {
    id: nextId('file'),
    name: stripExtension(baseName(path)) || 'Vehicle',
    path,
  });
}

async function loadZipFile(file) {
  if (file.size > MAX_ZIP_SIZE) throw new Error(t('toast.tooBig'));
  const buffer = await file.arrayBuffer();
  const entries = await readZip(buffer);
  const vehicleEntries = entries.filter((entry) => /\.brv$/i.test(entry.name));
  const gameInside = entries.some((entry) => isGamePath(entry.name));
  const loaded = [];

  for (const entry of vehicleEntries.slice(0, 80)) {
    try {
      loaded.push(
        vehicleFromBuffer(entry.data, {
          id: nextId('zip'),
          name: stripExtension(baseName(entry.name)) || 'Vehicle',
          path: `${file.name} → ${entry.name}`,
        })
      );
    } catch (error) {
      console.warn(`Could not read ${entry.name}:`, error);
    }
  }
  return { loaded, gameInside, vehicleCount: vehicleEntries.length };
}

async function handlePlainFiles(files, extra = {}) {
  const all = Array.from(files || []);
  if (!all.length) return;
  if (state.driving) exitDrive();

  let gameDetected = Boolean(extra.gameDetected) || all.some((file) => isGamePath(pathOf(file)));
  const brvFiles = all.filter((file) => /\.brv$/i.test(pathOf(file) || file.name));
  const zipFiles = all.filter((file) => /\.zip$/i.test(pathOf(file) || file.name));
  const loaded = [];
  let skipped = 0;
  let firstError = null;

  setLoading(true);
  try {
    for (const file of brvFiles.slice(0, 80)) {
      try {
        const path = pathOf(file);
        loaded.push(await parseVehicleFile(file, path));
      } catch (error) {
        skipped += 1;
        firstError = firstError || error;
      }
    }

    for (const file of zipFiles.slice(0, 20)) {
      try {
        const result = await loadZipFile(file);
        loaded.push(...result.loaded);
        gameDetected = gameDetected || result.gameInside;
        if (!result.loaded.length) skipped += 1;
        if (result.vehicleCount > result.loaded.length) {
          skipped += result.vehicleCount - result.loaded.length;
        }
      } catch (error) {
        skipped += 1;
        firstError = firstError || error;
        showToast(`${t('toast.zipError')}: ${file.name}`, true);
      }
    }
  } finally {
    setLoading(false);
  }

  if (loaded.length) {
    for (const record of loaded) addVehicle(record);
    setActiveVehicle(loaded[0].id);
    showToast(
      loaded.length === 1 ? t('toast.fileLoaded') : t('toast.filesLoaded', { count: loaded.length })
    );
  } else if (!gameDetected) {
    showToast(firstError?.message || t('toast.noBrv'), true);
  }

  if (gameDetected) {
    showGameNotice(loaded.length);
  } else if (skipped && firstError && loaded.length) {
    showToast(firstError.message || t('toast.invalid'), true);
  }

  els.fileInput.value = '';
  els.folderInput.value = '';
}

async function handleDrop(event) {
  event.preventDefault();
  dragDepth = 0;
  els.dropzone.classList.remove('is-dragover');

  const transfer = event.dataTransfer;
  if (!transfer) return;

  const items = Array.from(transfer.items || []).filter((item) => item.kind === 'file');
  const collected = [];
  let gameDetected = false;
  let traversed = false;

  if (items.length) {
    const walkEntry = async (entry, currentPath, depth) => {
      if (!entry || collected.length >= 120 || depth > 9) return;
      if (entry.isFile) {
        const path = `${currentPath}${entry.name}`;
        if (isGamePath(path)) gameDetected = true;
        if (/\.(brv|zip)$/i.test(entry.name)) {
          try {
            const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
            file.relativePath = path;
            collected.push(file);
          } catch (error) {
            console.warn(`Could not read ${path}:`, error);
          }
        }
        return;
      }
      if (entry.isDirectory) {
        traversed = true;
        const reader = entry.createReader();
        for (;;) {
          const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
          if (!batch.length) break;
          for (const child of batch) {
            await walkEntry(child, `${currentPath}${entry.name}/`, depth + 1);
          }
        }
      }
    };

    for (const item of items) {
      if (typeof item.webkitGetAsEntry !== 'function') continue;
      const entry = item.webkitGetAsEntry();
      if (entry) await walkEntry(entry, '', 0);
    }
  }

  if (!traversed && !collected.length) {
    for (const file of Array.from(transfer.files || [])) collected.push(file);
  }

  if (!collected.length) {
    if (gameDetected) {
      showGameNotice(0);
      showToast(t('toast.gameDetected'));
    } else {
      showToast(t('toast.noBrv'), true);
    }
    return;
  }

  await handlePlainFiles(collected, { gameDetected });
}

/* --------------------------------------------------------------------------
   Demos
   -------------------------------------------------------------------------- */

async function loadDemo(kind) {
  const isTruck = kind === 'truck';
  const id = `demo:${isTruck ? 'truck' : 'car'}`;
  const existing = state.vehicles.find((record) => record.id === id);
  if (existing) {
    setActiveVehicle(id);
    document.getElementById('garage').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  if (state.driving) exitDrive();
  setLoading(true);
  try {
    const response = await fetch(assetUrl(`../assets/demo-${isTruck ? 'truck' : 'car'}.brv`));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    const record = vehicleFromBuffer(buffer, {
      id,
      name: isTruck ? 'demo-truck' : 'demo-car',
      nameKey: isTruck ? 'garage.demoTruck' : 'garage.demoCar',
      path: `assets/demo-${isTruck ? 'truck' : 'car'}.brv`,
      demo: true,
    });
    addVehicle(record);
    setActiveVehicle(id);
    document.getElementById('garage').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    console.warn('Demo could not load:', error);
    showToast(t('toast.invalid'), true);
  } finally {
    setLoading(false);
  }
}

/* --------------------------------------------------------------------------
   Game notice
   -------------------------------------------------------------------------- */

function showGameNotice(count) {
  state.gameDetected = true;
  state.gameBrvCount = Math.max(state.gameBrvCount, count || 0);
  updateGameNotice();
  els.gameNotice.hidden = false;
}

function updateGameNotice() {
  if (!els.gameNotice || !state.gameDetected) return;
  const detail = els.gameNoticeDetail;
  if (!detail) return;
  detail.textContent = state.gameBrvCount
    ? t('game.foundBrv', { count: state.gameBrvCount })
    : t('game.noBrv');
}

/* --------------------------------------------------------------------------
   Drive mode
   -------------------------------------------------------------------------- */

function updateDriveEmpty() {
  if (!els.driveEmpty) return;
  const record = activeRecord();
  const strong = els.driveEmpty.querySelector('strong');
  const link = els.driveEmpty.querySelector('a');
  if (strong) strong.textContent = t(record ? 'drive.ready' : 'drive.noVehicle');
  if (link) link.hidden = Boolean(record);
}

function enterDrive() {
  const record = activeRecord();
  if (!record) {
    showToast(t('drive.noVehicle'), true);
    document.getElementById('garage').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (!state.viewer) {
    showToast(t('garage.noWebgl'), true);
    return;
  }
  if (state.driving) return;

  state.driving = true;
  els.viewerCanvas.classList.add('is-in-drive');
  els.viewerCanvas.hidden = false;
  els.driveEmpty.hidden = true;
  els.driveHud.hidden = false;
  els.driveTopActions.hidden = false;
  updateHud(0, 0);

  state.viewer.attachTo(els.driveWrap);
  const started = state.viewer.startDrive();
  if (!started) {
    state.driving = false;
    teardownDriveUi();
    return;
  }

  document.getElementById('drive').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function teardownDriveUi() {
  if (!state.driving) return;
  state.driving = false;
  document.body.classList.remove('is-driving');
  if (els.driveHud) els.driveHud.hidden = true;
  if (els.driveTopActions) els.driveTopActions.hidden = true;
  if (els.viewerCanvas) els.viewerCanvas.classList.remove('is-in-drive');
  if (state.viewer) state.viewer.attachTo(els.canvasWrap);
  if (els.driveEmpty) els.driveEmpty.hidden = false;
  updateDriveEmpty();
}

function exitDrive() {
  if (!state.driving) return;
  if (state.viewer && state.viewer.mode === 'drive') {
    state.viewer.stopDrive();
  } else {
    teardownDriveUi();
  }
}

function bindTouchControls() {
  for (const button of $$('#touchControls [data-touch]')) {
    const action = button.dataset.touch;
    const press = (event) => {
      event.preventDefault();
      if (!state.driving) return;
      button.setPointerCapture?.(event.pointerId);
      state.viewer?.setInput(action, true);
    };
    const release = (event) => {
      event.preventDefault();
      state.viewer?.setInput(action, false);
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    button.addEventListener('contextmenu', (event) => event.preventDefault());
  }
}

/* --------------------------------------------------------------------------
   MoonlightWeb panel
   -------------------------------------------------------------------------- */

function normalizeHost(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

function hostUrl() {
  return state.host ? `https://${state.host}/` : '';
}

function renderQr() {
  if (!els.qrCode) return;
  const url = hostUrl();
  if (!url) {
    els.qrCode.innerHTML = qrPlaceholder;
    return;
  }
  if (typeof window.qrcode !== 'function') {
    els.qrCode.innerHTML = qrPlaceholder;
    return;
  }
  try {
    const qr = window.qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    els.qrCode.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2 });
  } catch (error) {
    console.warn('QR could not be drawn:', error);
  }
}

function scheduleQr() {
  window.clearTimeout(qrTimer);
  qrTimer = window.setTimeout(renderQr, 160);
}

function initMoonlight() {
  qrPlaceholder = els.qrCode ? els.qrCode.innerHTML : '';
  let saved = '';
  try {
    saved = localStorage.getItem('brick-rigs-host') || '';
  } catch {
    saved = '';
  }
  state.host = normalizeHost(saved);
  if (els.hostInput) els.hostInput.value = state.host;
  renderQr();

  els.hostInput?.addEventListener('input', () => {
    state.host = normalizeHost(els.hostInput.value);
    try {
      localStorage.setItem('brick-rigs-host', state.host);
    } catch {
      // Ignore private mode.
    }
    scheduleQr();
  });

  els.hostInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      els.openHost?.click();
    }
  });

  els.openHost?.addEventListener('click', () => {
    if (!state.host) {
      showToast(t('toast.hostRequired'), true);
      els.hostInput?.focus();
      return;
    }
    window.open(hostUrl(), '_blank', 'noopener');
  });

  els.copyCommand?.addEventListener('click', () => {
    copyText(els.appCommand?.textContent || '');
  });

  els.copyImage?.addEventListener('click', () => {
    copyText(els.appImage?.textContent || '');
  });

  for (const button of $$('[data-copy-text]')) {
    button.addEventListener('click', () => copyText(button.dataset.copyText || ''));
  }
}

async function copyText(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast(t('toast.copied'));
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      showToast(t('toast.copied'));
    } catch {
      showToast(t('common.error'), true);
    }
  }
}

/* --------------------------------------------------------------------------
   Wiring
   -------------------------------------------------------------------------- */

function cacheElements() {
  Object.assign(els, {
    toast: $('#toast'),
    viewerCard: $('.viewer-card'),
    viewerCanvas: $('#viewerCanvas'),
    viewerEmpty: $('#viewerEmpty'),
    viewerLoading: $('#viewerLoading'),
    viewerNote: $('#viewerNote'),
    viewerFileName: $('#viewerFileName'),
    statsChips: $('#statsChips'),
    statBricks: $('#statBricks'),
    statSize: $('#statSize'),
    statTypes: $('#statTypes'),
    statWheels: $('#statWheels'),
    vehicleList: $('#vehicleList'),
    vehicleCount: $('#vehicleCount'),
    dropzone: $('#dropzone'),
    fileInput: $('#fileInput'),
    folderInput: $('#folderInput'),
    fileButton: $('#fileButton'),
    folderButton: $('#folderButton'),
    heroDrop: $('#heroDrop'),
    heroDemo: $('#heroDemo'),
    gameNotice: $('#gameNotice'),
    gameNoticeDetail: $('#gameNoticeDetail'),
    canvasWrap: $('#canvasWrap'),
    driveWrap: $('#driveWrap'),
    driveEmpty: $('#driveEmpty'),
    driveHud: $('#driveHud'),
    driveTopActions: $('#driveTopActions'),
    driveHint: $('#driveHint'),
    touchControls: $('#touchControls'),
    speedValue: $('#speedValue'),
    distanceValue: $('#distanceValue'),
    startDrive: $('#startDrive'),
    exitDrive: $('#exitDrive'),
    resetDrive: $('#resetDrive'),
    driveFromGarage: $('#driveFromGarage'),
    resetCamera: $('#resetCamera'),
    langToggle: $('#langToggle'),
    langLabel: $('#langLabel'),
    themeToggle: $('#themeToggle'),
    menuToggle: $('#menuToggle'),
    mainNav: $('#mainNav'),
    hostInput: $('#hostInput'),
    openHost: $('#openHost'),
    qrCode: $('#qrCode'),
    copyCommand: $('#copyCommand'),
    copyImage: $('#copyImage'),
    appCommand: $('#appCommand'),
    appImage: $('#appImage'),
  });
}

function bindFileControls() {
  const openFiles = (event) => {
    event?.stopPropagation();
    els.fileInput.click();
  };
  const openFolder = (event) => {
    event?.stopPropagation();
    els.folderInput.click();
  };

  els.heroDrop?.addEventListener('click', openFiles);
  els.fileButton?.addEventListener('click', openFiles);
  els.folderButton?.addEventListener('click', openFolder);

  els.dropzone?.addEventListener('click', openFiles);
  els.dropzone?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      els.fileInput.click();
    }
  });

  els.fileInput?.addEventListener('change', () => handlePlainFiles(els.fileInput.files));
  els.folderInput?.addEventListener('change', () => handlePlainFiles(els.folderInput.files));

  els.dropzone?.addEventListener('dragenter', (event) => {
    event.preventDefault();
    dragDepth += 1;
    els.dropzone.classList.add('is-dragover');
  });
  els.dropzone?.addEventListener('dragover', (event) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    els.dropzone.classList.add('is-dragover');
  });
  els.dropzone?.addEventListener('dragleave', (event) => {
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) els.dropzone.classList.remove('is-dragover');
  });
  els.dropzone?.addEventListener('drop', handleDrop);

  window.addEventListener('dragover', (event) => {
    if (event.dataTransfer?.types?.includes('Files')) event.preventDefault();
  });
  window.addEventListener('drop', (event) => {
    if (event.target.closest?.('#dropzone')) return;
    if (event.dataTransfer?.types?.includes('Files')) handleDrop(event);
  });

  for (const button of $$('[data-demo]')) {
    button.addEventListener('click', () => loadDemo(button.dataset.demo));
  }
  els.heroDemo?.addEventListener('click', () => loadDemo('car'));
}

function bindUiControls() {
  els.langToggle?.addEventListener('click', () => {
    setLang(getLang() === 'uk' ? 'en' : 'uk');
  });

  els.themeToggle?.addEventListener('click', () => {
    applyTheme(state.theme === 'light' ? 'dark' : 'light');
  });

  els.menuToggle?.addEventListener('click', () => {
    const open = !els.mainNav.classList.contains('is-open');
    els.mainNav.classList.toggle('is-open', open);
    els.menuToggle.setAttribute('aria-expanded', String(open));
  });

  for (const link of $$('#mainNav a')) {
    link.addEventListener('click', () => {
      els.mainNav.classList.remove('is-open');
      els.menuToggle?.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', (event) => {
    if (!els.mainNav?.classList.contains('is-open')) return;
    if (els.mainNav.contains(event.target) || els.menuToggle?.contains(event.target)) return;
    els.mainNav.classList.remove('is-open');
    els.menuToggle?.setAttribute('aria-expanded', 'false');
  });

  els.resetCamera?.addEventListener('click', () => state.viewer?.resetCamera());
  els.driveFromGarage?.addEventListener('click', enterDrive);
  els.startDrive?.addEventListener('click', enterDrive);
  els.exitDrive?.addEventListener('click', exitDrive);
  els.resetDrive?.addEventListener('click', () => state.viewer?.resetDrive());

  onLangChange(() => {
    refreshDynamicText();
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (location.protocol !== 'https:' && !local) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}

function init() {
  cacheElements();
  initLang();
  applyTranslations();
  initTheme();
  updateLangLabel();
  initMoonlight();
  bindFileControls();
  bindUiControls();
  bindTouchControls();
  initViewer();
  refreshDynamicText();
  renderVehicleList();
  updateDriveEmpty();
  registerServiceWorker();
}

init();
