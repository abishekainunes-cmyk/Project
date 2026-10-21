const APP = {
  TITLE: 'NUNES DRIVE FILE INDEX',
  VERSION: '3.7',
  SHEETS: {
    NORMAL: '1 - Normal Files',
    MINI: '2 - Mini Catalog',
    VIDEO: '3 - Videos',
    INDEX: '_Index',
    STATE: '_State'
  },
  PROP_SHEET_ID: 'INDEX_SPREADSHEET_ID',
  PROP_SOURCE_ID: 'SOURCE_FOLDER_ID',
  PROP_SOURCE_NAME: 'SOURCE_FOLDER_NAME',
  PROP_SOURCE_URL: 'SOURCE_FOLDER_URL',
  PROP_LIVE_WATCH_WANTED: 'LIVE_WATCH_WANTED',
  PROP_DISPLAY_NAME_CLEANUP: 'DISPLAY_NAME_CLEANUP_VERSION',
  PROP_PDF_ONLY_MIGRATION: 'NORMAL_PDF_ONLY_MIGRATION_VERSION',
  PROP_MAINTENANCE: 'PDF_ONLY_MAINTENANCE_REQUESTED',
  PROP_MEDIA_NAME_CLEANUP: 'MEDIA_PRODUCT_NAME_CLEANUP_VERSION',
  ROOT_SENTINEL: '__MY_DRIVE_ROOT__',
  FULL_SCAN_HANDLER: 'runFullScanWorker',
  LIVE_WATCH_HANDLER: 'runLiveWatch',
  PDF_MIGRATION_HANDLER: 'finishPdfOnlyMigration_',
  STARTER_RUN_MS: 25000,
  WORKER_RUN_MS: 240000,
  WATCH_RUN_MS: 45000,
  MAX_VISITED_PER_BATCH: 12000,
  MAX_WATCH_VISITED: 1200,
  WATCH_OVERLAP_MS: 120000,
  LIVE_DURING_SCAN_RUN_MS: 3500,
  LIVE_DURING_SCAN_MAX_VISITED: 120
};

// Per-execution caches only. Apps Script starts a fresh execution for each request/trigger.
// These avoid repeatedly reopening the same spreadsheet and rereading the small _State table.
let RUNTIME_WORKBOOK_ = null;
const RUNTIME_STATE_CACHE_ = {};

function doGet() {
  ensureWorkbook_();
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('NUNES Drive File Index')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getStatus() {
  const ss = ensureWorkbook_();
  const state = loadState_(ss);
  const p = PropertiesService.getScriptProperties();
  const maintenance = p.getProperty(APP.PROP_MAINTENANCE) === 'YES';

  // Self-healing background jobs. During the one-time PDF-only maintenance we
  // intentionally keep workers paused so the maintenance job can obtain the lock.
  let triggerSet = getTriggerHandlerSet_();
  if (!maintenance && state && !triggerSet.has(APP.FULL_SCAN_HANDLER)) {
    try {
      ensureMinuteTrigger_(APP.FULL_SCAN_HANDLER);
      triggerSet.add(APP.FULL_SCAN_HANDLER);
    } catch (e) {
      recordSystemError_(ss, 'Could not restart the full-scan background worker: ' + (e.message || e));
    }
  }

  const liveWanted = (p.getProperty(APP.PROP_LIVE_WATCH_WANTED) || 'YES') !== 'NO';
  if (!maintenance && liveWanted) ensureLiveWatchBaseline_(ss, state);
  if (!maintenance && liveWanted && !triggerSet.has(APP.LIVE_WATCH_HANDLER)) {
    try {
      ensureMinuteTrigger_(APP.LIVE_WATCH_HANDLER);
      triggerSet.add(APP.LIVE_WATCH_HANDLER);
    } catch (e) {
      recordSystemError_(ss, 'Could not restart automatic new-file checking: ' + (e.message || e));
    }
  }

  const normal = Math.max(0, ss.getSheetByName(APP.SHEETS.NORMAL).getLastRow() - 1);
  const mini = Math.max(0, ss.getSheetByName(APP.SHEETS.MINI).getLastRow() - 1);
  const video = Math.max(0, ss.getSheetByName(APP.SHEETS.VIDEO).getLastRow() - 1);
  const statusMeta = getStateValues_(ss, [
    'lastSystemError', 'lastSystemErrorAt', 'lastFullScan', 'lastScan',
    'lastAutoCheck', 'lastAutoAdded', 'lastWorkerHeartbeat'
  ]);
  const lastError = statusMeta.lastSystemError || '';
  const lastErrorAt = statusMeta.lastSystemErrorAt || '';
  const fullWorkerOk = !state || triggerSet.has(APP.FULL_SCAN_HANDLER);
  const liveWorkerOk = !liveWanted || triggerSet.has(APP.LIVE_WATCH_HANDLER);
  const systemHealthy = fullWorkerOk && liveWorkerOk && !lastError;

  let systemState = 'READY';
  if (maintenance) systemState = 'UPDATING';
  else if (state) systemState = 'SCANNING';
  else if (liveWanted && liveWorkerOk) systemState = 'AUTO ON';
  else if (!systemHealthy) systemState = 'CHECK';
  else if (!liveWanted) systemState = 'MANUAL';

  return {
    ok: true,
    version: APP.VERSION,
    spreadsheetUrl: ss.getUrl(),
    spreadsheetName: ss.getName(),
    sourceName: p.getProperty(APP.PROP_SOURCE_NAME) || 'My Drive',
    sourceUrl: p.getProperty(APP.PROP_SOURCE_URL) || 'https://drive.google.com/drive/my-drive',
    sourceIsRoot: (p.getProperty(APP.PROP_SOURCE_ID) || APP.ROOT_SENTINEL) === APP.ROOT_SENTINEL,
    counts: {
      normal: normal,
      mini: mini,
      video: video,
      total: normal + mini + video
    },
    fullScanRunning: !!state,
    fullScan: state ? {
      visited: Number(state.visitedTotal || 0),
      added: Number(state.addedTotal || 0),
      foldersDone: Number(state.foldersDone || 0),
      queuedFolders: Number((state.queue || []).length + (state.current ? 1 : 0)),
      currentFolder: state.current ? (state.current.path || state.current.id) : 'Preparing...',
      startedAt: state.startedAt || '',
      heartbeatAt: state.lastHeartbeat || statusMeta.lastWorkerHeartbeat || ''
    } : null,
    liveWatchWanted: liveWanted,
    liveWatchEnabled: triggerSet.has(APP.LIVE_WATCH_HANDLER),
    systemHealthy: systemHealthy,
    systemState: systemState,
    lastSystemError: lastError,
    lastSystemErrorAt: lastErrorAt,
    lastFullScan: statusMeta.lastFullScan || statusMeta.lastScan || 'Not completed yet',
    lastAutoCheck: statusMeta.lastAutoCheck || 'Not run yet',
    lastAutoAdded: Number(statusMeta.lastAutoAdded || 0),
    serverTime: formatDisplayDate_(new Date())
  };
}

function saveSource(folderUrl, useMyDrive) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = ensureWorkbook_();
    const p = PropertiesService.getScriptProperties();
    if (useMyDrive) {
      p.setProperty(APP.PROP_SOURCE_ID, APP.ROOT_SENTINEL);
      p.setProperty(APP.PROP_SOURCE_NAME, 'My Drive');
      p.setProperty(APP.PROP_SOURCE_URL, 'https://drive.google.com/drive/my-drive');
    } else {
      const id = extractDriveFolderId_(folderUrl);
      if (!id) throw new Error('Paste a valid Google Drive folder link.');
      const folder = DriveApp.getFolderById(id);
      p.setProperty(APP.PROP_SOURCE_ID, id);
      p.setProperty(APP.PROP_SOURCE_NAME, folder.getName());
      p.setProperty(APP.PROP_SOURCE_URL, folder.getUrl());
    }

    clearState_(ss);
    clearWatchCursor_(ss);
    deleteTriggersByHandler_(APP.FULL_SCAN_HANDLER);
    setStateValue_(ss, 'sourceNeedsFullScan', 'YES');
    clearSystemError_(ss);
    return getStatus();
  } finally {
    lock.releaseLock();
  }
}

/**
 * One click starts the complete Drive scan. The first batch runs immediately and
 * background workers continue automatically until everything is checked.
 */
function startFullScan() {
  if (PropertiesService.getScriptProperties().getProperty(APP.PROP_MAINTENANCE) === 'YES') {
    return { ok: false, message: 'PDF-only maintenance is finishing. The full scan will restart automatically.' };
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    return { ok: false, message: 'The Drive index is busy. Please wait a few seconds and try again.' };
  }

  try {
    const ss = ensureWorkbook_();
    const p = PropertiesService.getScriptProperties();
    let state = loadState_(ss);

    if (!state) {
      state = createInitialState_();
      saveState_(ss, state);
    }

    // Continuous new-file indexing is the normal/recommended mode.
    p.setProperty(APP.PROP_LIVE_WATCH_WANTED, 'YES');
    // Anchor live checking to the full-scan start so a file added to a folder
    // that was already scanned cannot be missed while the long scan continues.
    ensureLiveWatchBaseline_(ss, state);

    let watchWarning = '';
    try {
      ensureMinuteTrigger_(APP.LIVE_WATCH_HANDLER);
    } catch (e) {
      watchWarning = ' Automatic new-file checking could not be enabled: ' + (e.message || e);
      recordSystemError_(ss, watchWarning.trim());
    }

    const result = processFullScanBatch_(APP.STARTER_RUN_MS, APP.MAX_VISITED_PER_BATCH, ss);

    if (!result.done) ensureMinuteTrigger_(APP.FULL_SCAN_HANDLER);
    else deleteTriggersByHandler_(APP.FULL_SCAN_HANDLER);

    result.message = result.done
      ? 'Full Drive scan completed.'
      : 'Full Drive scan started. It will continue automatically in the background.';
    if (watchWarning) result.message += watchWarning;
    result.status = getStatus();
    return result;
  } catch (e) {
    const ss = ensureWorkbook_();
    recordSystemError_(ss, String(e && e.message ? e.message : e));
    return { ok: false, message: String(e && e.message ? e.message : e) };
  } finally {
    lock.releaseLock();
  }
}

/** Background continuation for the one-click full scan. */
function runFullScanWorker() {
  const p = PropertiesService.getScriptProperties();
  if (p.getProperty(APP.PROP_MAINTENANCE) === 'YES') return;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    if (p.getProperty(APP.PROP_MAINTENANCE) === 'YES') return;
    const ss = ensureWorkbook_();
    if (!loadState_(ss)) {
      deleteTriggersByHandler_(APP.FULL_SCAN_HANDLER);
      return;
    }

    // Do a small recent-file pass on every worker cycle as well. This means
    // newly uploaded products can appear even before the full Drive scan finishes.
    try {
      ensureLiveWatchBaseline_(ss, loadState_(ss));
      processLiveWatch_(ss, APP.LIVE_DURING_SCAN_RUN_MS, APP.LIVE_DURING_SCAN_MAX_VISITED);
    } catch (e) {
      recordSystemError_(ss, 'Recent-file check during full scan: ' + (e.message || e));
    }

    const result = processFullScanBatch_(APP.WORKER_RUN_MS, APP.MAX_VISITED_PER_BATCH, ss);
    if (result.done) {
      deleteTriggersByHandler_(APP.FULL_SCAN_HANDLER);
      try { ensureMinuteTrigger_(APP.LIVE_WATCH_HANDLER); } catch (e) { recordSystemError_(ss, e.message || String(e)); }
    }
  } catch (e) {
    try { recordSystemError_(ensureWorkbook_(), 'Full scan worker: ' + (e.message || e)); } catch (ignore) {}
    console.error(e);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Lightweight automatic check. It searches only recently modified Drive files,
 * verifies that the file belongs to the selected source, and appends unknown IDs.
 */
function runLiveWatch() {
  const p = PropertiesService.getScriptProperties();
  if (p.getProperty(APP.PROP_MAINTENANCE) === 'YES') return;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    if (p.getProperty(APP.PROP_MAINTENANCE) === 'YES') return;
    const ss = ensureWorkbook_();
    const state = loadState_(ss);
    ensureLiveWatchBaseline_(ss, state);
    // The same script lock prevents this from colliding with the full-scan worker,
    // so recent files can be indexed safely even while a full scan is still active.
    processLiveWatch_(ss);
    clearSystemError_(ss);
  } catch (e) {
    try { recordSystemError_(ensureWorkbook_(), 'Automatic file check: ' + (e.message || e)); } catch (ignore) {}
    console.error(e);
  } finally {
    lock.releaseLock();
  }
}

function setLiveWatch(enabled) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = ensureWorkbook_();
    const p = PropertiesService.getScriptProperties();
    p.setProperty(APP.PROP_LIVE_WATCH_WANTED, enabled ? 'YES' : 'NO');
    if (enabled) {
      ensureLiveWatchBaseline_(ss, loadState_(ss));
      ensureMinuteTrigger_(APP.LIVE_WATCH_HANDLER);
      clearSystemError_(ss);
    } else {
      deleteTriggersByHandler_(APP.LIVE_WATCH_HANDLER);
      clearWatchCursor_(ss);
    }
    return getStatus();
  } finally {
    lock.releaseLock();
  }
}

/** Manual repair button kept inside Advanced only. */
function repairAutomation() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = ensureWorkbook_();
    const state = loadState_(ss);
    const p = PropertiesService.getScriptProperties();
    if (state) ensureMinuteTrigger_(APP.FULL_SCAN_HANDLER);
    const liveWanted = (p.getProperty(APP.PROP_LIVE_WATCH_WANTED) || 'YES') !== 'NO';
    if (liveWanted) ensureMinuteTrigger_(APP.LIVE_WATCH_HANDLER);
    clearSystemError_(ss);
    return getStatus();
  } finally {
    lock.releaseLock();
  }
}

function resetIndex() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = ensureWorkbook_();
    [APP.SHEETS.NORMAL, APP.SHEETS.MINI, APP.SHEETS.VIDEO].forEach(name => {
      const sh = ss.getSheetByName(name);
      if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 3).clearContent();
    });
    const idx = ss.getSheetByName(APP.SHEETS.INDEX);
    if (idx.getLastRow() > 1) idx.getRange(2, 1, idx.getLastRow() - 1, 2).clearContent();
    clearState_(ss);
    clearWatchCursor_(ss);
    deleteTriggersByHandler_(APP.FULL_SCAN_HANDLER);
    setStateValues_(ss, {
      lastFullScan: 'Not completed yet',
      lastScan: 'Not run yet',
      lastAutoCheck: 'Not run yet',
      lastAutoAdded: '0',
      sourceNeedsFullScan: 'YES'
    });
    clearSystemError_(ss);
    return getStatus();
  } finally {
    lock.releaseLock();
  }
}

function processFullScanBatch_(maxMs, maxVisited, workbook) {
  const started = Date.now();
  const deadline = started + Math.max(5000, Number(maxMs || APP.WORKER_RUN_MS));
  const ss = workbook || ensureWorkbook_();
  let state = loadState_(ss) || createInitialState_();

  // Backward compatibility with V1/V2 continuation state.
  if (!Array.isArray(state.queue)) state.queue = [];
  state.visitedTotal = Number(state.visitedTotal || 0);
  state.addedTotal = Number(state.addedTotal || 0);
  state.foldersDone = Number(state.foldersDone || 0);
  if (!state.startedAt) state.startedAt = new Date().toISOString();
  state.lastHeartbeat = new Date().toISOString();

  const existing = loadExistingIds_(ss);
  const out = { normal: [], mini: [], video: [], index: [] };
  let visited = 0;
  let added = 0;
  let done = false;

  while (Date.now() < deadline && visited < maxVisited) {
    if (PropertiesService.getScriptProperties().getProperty(APP.PROP_MAINTENANCE) === 'YES') break;
    if (!state.current) {
      if (!state.queue.length) {
        done = true;
        break;
      }
      state.current = state.queue.shift();
      state.phase = 'files';
      state.fileToken = '';
      state.folderToken = '';
    }

    let folder;
    try {
      folder = state.current.id === APP.ROOT_SENTINEL
        ? DriveApp.getRootFolder()
        : DriveApp.getFolderById(state.current.id);
    } catch (e) {
      if (state.current.id === APP.ROOT_SENTINEL) throw e;
      console.error('Skipping unavailable folder ' + state.current.id + ': ' + e);
      state.current = null;
      state.phase = 'files';
      state.fileToken = '';
      state.folderToken = '';
      state.foldersDone++;
      continue;
    }

    if (state.phase === 'files') {
      let files;
      if (state.fileToken) {
        try {
          files = DriveApp.continueFileIterator(state.fileToken);
        } catch (e) {
          state.fileToken = '';
          files = folder.getFiles();
        }
      } else {
        files = folder.getFiles();
      }

      while (files.hasNext() && Date.now() < deadline && visited < maxVisited) {
        if (visited % 100 === 0 && PropertiesService.getScriptProperties().getProperty(APP.PROP_MAINTENANCE) === 'YES') break;
        const file = files.next();
        visited++;
        state.visitedTotal++;
        const id = file.getId();
        if (id === ss.getId() || existing.has(id)) continue;

        const category = classifyFile_(file, state.current.path);
        if (category === 'skip') continue;

        // During the one-time V3.7 cleanup/rebuild, do not add or change Mini Catalog/Videos.
        if (state.normalOnlyRebuild && category !== 'normal') continue;

        // Defensive V3.7 rule: even if classification changes later, Normal Files may receive PDFs only.
        if (category === 'normal' && !isPdfFile_(file)) continue;

        const visibleName = visibleNameForCategory_(file.getName(), category, state.current.path);
        const row = [visibleName, file.getUrl(), id];
        if (category === 'video') out.video.push(row);
        else if (category === 'mini') out.mini.push(row);
        else out.normal.push(row);
        out.index.push([id, category]);
        existing.add(id);
        added++;
        state.addedTotal++;
      }

      if (files.hasNext()) {
        state.fileToken = files.getContinuationToken();
        break;
      }

      state.fileToken = '';
      state.phase = 'folders';
    }

    if (state.phase === 'folders') {
      let folders;
      if (state.folderToken) {
        try {
          folders = DriveApp.continueFolderIterator(state.folderToken);
        } catch (e) {
          state.folderToken = '';
          folders = folder.getFolders();
        }
      } else {
        folders = folder.getFolders();
      }

      while (folders.hasNext() && Date.now() < deadline && visited < maxVisited) {
        if (visited % 100 === 0 && PropertiesService.getScriptProperties().getProperty(APP.PROP_MAINTENANCE) === 'YES') break;
        const child = folders.next();
        visited++;
        state.visitedTotal++;
        state.queue.push({
          id: child.getId(),
          path: state.current.path + '/' + child.getName()
        });
      }

      if (folders.hasNext()) {
        state.folderToken = folders.getContinuationToken();
        break;
      }

      state.folderToken = '';
      state.current = null;
      state.phase = 'files';
      state.foldersDone++;
    }
  }

  appendRows_(ss.getSheetByName(APP.SHEETS.NORMAL), out.normal);
  appendRows_(ss.getSheetByName(APP.SHEETS.MINI), out.mini);
  appendRows_(ss.getSheetByName(APP.SHEETS.VIDEO), out.video);
  appendRows_(ss.getSheetByName(APP.SHEETS.INDEX), out.index);

  const heartbeat = new Date().toISOString();

  if (done) {
    const now = new Date();
    const updates = {
      scanState: '',
      lastWorkerHeartbeat: heartbeat,
      lastFullScan: formatDisplayDate_(now),
      lastScan: formatDisplayDate_(now),
      sourceNeedsFullScan: 'NO',
      lastSystemError: '',
      lastSystemErrorAt: ''
    };
    // Keep any live-watch continuation/baseline intact. Resetting it here could
    // skip a file that was uploaded while the full scan was still in progress.
    if (!getStateValue_(ss, 'watchSince')) updates.watchSince = state.startedAt || now.toISOString();
    setStateValues_(ss, updates);
  } else {
    state.lastHeartbeat = heartbeat;
    setStateValues_(ss, {
      scanState: JSON.stringify(state),
      lastWorkerHeartbeat: heartbeat
    });
  }

  return {
    ok: true,
    done: done,
    visitedThisBatch: visited,
    addedThisBatch: added,
    addedNormal: out.normal.length,
    addedMini: out.mini.length,
    addedVideo: out.video.length
  };
}

function processLiveWatch_(ss, maxMs, maxVisited) {
  const now = new Date();
  const watch = getStateValues_(ss, ['watchSince', 'watchToken', 'watchQuerySince', 'watchNextSince']);
  let watchSince = watch.watchSince || '';
  let token = watch.watchToken || '';
  let querySince = watch.watchQuerySince || '';
  let nextSince = watch.watchNextSince || '';

  if (!watchSince) {
    setStateValues_(ss, {
      watchSince: now.toISOString(),
      lastAutoCheck: formatDisplayDate_(now),
      lastAutoAdded: '0'
    });
    return { ok: true, added: 0 };
  }

  let files;
  if (token) {
    try {
      files = DriveApp.continueFileIterator(token);
    } catch (e) {
      token = '';
    }
  }

  if (!files) {
    const base = new Date(watchSince);
    const overlapped = new Date(base.getTime() - APP.WATCH_OVERLAP_MS);
    querySince = overlapped.toISOString();
    nextSince = now.toISOString();
    const qDate = formatDriveQueryDate_(overlapped);
    files = DriveApp.searchFiles("trashed = false and modifiedDate > '" + qDate + "'");
  }

  const existing = loadExistingIds_(ss);
  const sourceId = PropertiesService.getScriptProperties().getProperty(APP.PROP_SOURCE_ID) || APP.ROOT_SENTINEL;
  const out = { normal: [], mini: [], video: [], index: [] };
  const deadline = Date.now() + Math.max(3000, Number(maxMs || APP.WATCH_RUN_MS));
  const visitLimit = Math.max(25, Number(maxVisited || APP.MAX_WATCH_VISITED));
  let visited = 0;

  while (files.hasNext() && Date.now() < deadline && visited < visitLimit) {
    const file = files.next();
    visited++;
    const id = file.getId();
    if (id === ss.getId() || existing.has(id)) continue;

    const folderPath = getFilePathInsideSource_(file, sourceId);
    if (folderPath === null) continue;

    const category = classifyFile_(file, folderPath);
    if (category === 'skip') continue;

    // Defensive V3.7 rule: Normal Files may receive PDFs only.
    if (category === 'normal' && !isPdfFile_(file)) continue;

    const rawName = file.getName();
    const visibleName = visibleNameForCategory_(rawName, category, folderPath);
    const row = [visibleName, file.getUrl(), id];
    if (category === 'video') out.video.push(row);
    else if (category === 'mini') out.mini.push(row);
    else out.normal.push(row);
    out.index.push([id, category]);
    existing.add(id);
  }

  appendRows_(ss.getSheetByName(APP.SHEETS.NORMAL), out.normal);
  appendRows_(ss.getSheetByName(APP.SHEETS.MINI), out.mini);
  appendRows_(ss.getSheetByName(APP.SHEETS.VIDEO), out.video);
  appendRows_(ss.getSheetByName(APP.SHEETS.INDEX), out.index);

  const added = out.index.length;
  const updates = {
    lastAutoCheck: formatDisplayDate_(new Date()),
    lastAutoAdded: String(added)
  };

  if (files.hasNext()) {
    updates.watchToken = files.getContinuationToken();
    updates.watchQuerySince = querySince || '';
    updates.watchNextSince = nextSince || now.toISOString();
  } else {
    updates.watchToken = '';
    updates.watchQuerySince = '';
    updates.watchNextSince = '';
    updates.watchSince = nextSince || now.toISOString();
  }
  setStateValues_(ss, updates);

  return { ok: true, added: added, visited: visited };
}

function displayFileName_(name) {
  let text = String(name || '').trim();
  if (!text) return '';

  // Display-only cleanup. The real Google Drive file is never renamed.
  // Remove common file-type suffixes repeatedly so names like product.pdf.pdf
  // or archive.tar.gz also display cleanly, while model dots such as AX224.2 stay.
  const ext = /\.(?:pdf|doc|docx|docm|dot|dotx|xls|xlsx|xlsm|xlsb|xlt|xltx|csv|tsv|txt|rtf|odt|ods|odp|ppt|pptx|pptm|pps|ppsx|xps|epub|jpg|jpeg|png|gif|webp|bmp|tif|tiff|svg|heic|heif|raw|dng|ico|psd|ai|eps|mp3|mp4|m4a|m4v|mov|avi|mkv|wmv|webm|3gp|mpeg|mpg|wav|aac|flac|ogg|opus|wma|aiff|mid|midi|zip|rar|7z|gz|bz2|xz|tar|tgz|tbz|tbz2|txz|iso|exe|msi|apk|dmg|pkg|deb|rpm|html|htm|xml|json|yaml|yml|sql|log|ini|cfg|conf|eml|msg|vcf|ics|dwg|dxf|step|stp|iges|igs|stl|3mf|obj|fbx|gltf|glb|skp)$/i;
  let previous;
  do {
    previous = text;
    text = text.replace(ext, '').trim();
  } while (text !== previous && text);
  return text;
}

function ensureDisplayNamesClean_(ss) {
  // Keep this startup helper intentionally lightweight. The V3.7 product/model
  // cleanup for Mini Catalog and Videos is performed under the script lock by
  // APPLY_V3_7_SHEET_RULES_ONCE(), so it cannot collide with an active scan.
  const p = PropertiesService.getScriptProperties();
  if (p.getProperty(APP.PROP_DISPLAY_NAME_CLEANUP) === '3.2') return;

  [APP.SHEETS.NORMAL, APP.SHEETS.MINI, APP.SHEETS.VIDEO].forEach(sheetName => {
    const sh = ss.getSheetByName(sheetName);
    if (!sh || sh.getLastRow() <= 1) return;

    const count = sh.getLastRow() - 1;
    const range = sh.getRange(2, 1, count, 1);
    const values = range.getDisplayValues();
    let changed = false;

    values.forEach(row => {
      const cleaned = displayFileName_(row[0]);
      if (cleaned !== row[0]) {
        row[0] = cleaned;
        changed = true;
      }
    });

    if (changed) range.setValues(values);
  });

  p.setProperty(APP.PROP_DISPLAY_NAME_CLEANUP, '3.2');
}

function ensureLiveWatchBaseline_(ss, state) {
  if (getStateValue_(ss, 'watchSince')) return;

  let baseline = '';
  if (state && state.startedAt) {
    const d = new Date(state.startedAt);
    if (!isNaN(d.getTime())) baseline = d.toISOString();
  }
  if (!baseline) baseline = new Date().toISOString();
  setStateValue_(ss, 'watchSince', baseline);
}

function classifyFile_(file, folderPath) {
  // Name/path checks are local and much faster than asking Drive for MIME type on every file.
  // MIME is fetched only as a fallback for extensionless/unusual files.
  const rawName = file.getName() || '';
  const name = rawName.toLowerCase();

  // Keep Videos first, matching the existing category priority.
  if (/\.(mp4|mov|avi|mkv|wmv|webm|m4v|3gp|mpeg|mpg)$/i.test(name)) return 'video';

  const combined = (name + ' ' + (folderPath || '')).toLowerCase();
  const normalized = combined.replace(/[_.-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const miniCandidate = /\bmini\s*catalog(?:ue)?\b/i.test(normalized) || /\bminicatalog(?:ue)?\b/i.test(combined);

  // Normal Files is PDF-only, so the extension resolves the vast majority of PDF rows
  // without a second Drive metadata request.
  if (!miniCandidate && /\.pdf$/i.test(name)) return 'normal'; // STRICT: Normal Files accepts PDF only

  let mime = '';
  try { mime = (file.getMimeType() || '').toLowerCase(); } catch (e) {}

  // Preserve the previous rule that a real video wins even when it sits in a Mini Catalog folder.
  if (mime.indexOf('video/') === 0) return 'video';
  if (miniCandidate) return 'mini';
  if (mime === 'application/pdf') return 'normal';
  return 'skip';
}

function isPdfFile_(file, lowerName, lowerMime) {
  const name = lowerName !== undefined ? String(lowerName) : String(file.getName() || '').toLowerCase();
  const mime = lowerMime !== undefined ? String(lowerMime) : String(file.getMimeType() || '').toLowerCase();
  return mime === 'application/pdf' || /\.pdf$/i.test(name);
}

/**
 * Normal Files shows only the product name available in the PDF filename.
 * It does not read/OCR the PDF body and it never renames the Drive file.
 * Cleanup is intentionally conservative so model numbers and brand names stay intact.
 */
function productNameFromPdfFileName_(name) {
  let text = String(name || '').trim();
  if (!text) return '';

  // PDF extension only; Normal Files no longer accepts other file types.
  text = text.replace(/(?:\.pdf)+$/i, '').trim();

  // Make filename separators readable without altering model punctuation inside words.
  text = text.replace(/[_]+/g, ' ');
  text = text.replace(/\s+-\s+/g, ' - ');
  text = text.replace(/\s+/g, ' ').trim();

  // Remove common document labels only when they appear as a trailing filename label.
  // Example: "OHAUS AX224 Analytical Balance - Datasheet.pdf"
  // becomes "OHAUS AX224 Analytical Balance".
  const trailingDocLabel = /(?:\s*[-–—_|]+\s*|\s+)(?:product\s*)?(?:data\s*sheet|datasheet|technical\s*data(?:\s*sheet)?|specification(?:s)?|spec\s*sheet|brochure|leaflet|catalog(?:ue)?|manual|user\s*manual|instruction\s*manual|instructions|document|pdf)(?:\s*(?:final|latest|new|copy|v(?:ersion)?\s*\d+(?:\.\d+)*))?$/i;
  let previous;
  do {
    previous = text;
    text = text.replace(trailingDocLabel, '').trim();
  } while (text && text !== previous);

  // Remove a few non-product filename decorations at the very end only.
  text = text.replace(/\s*[-–—_|]+\s*(?:final|latest|new|copy)\s*$/i, '').trim();
  text = text.replace(/^[-–—_|\s]+|[-–—_|\s]+$/g, '').trim();

  return text || displayFileName_(name);
}


/**
 * V3.7 visible-name rule.
 * Normal Files: PDF product name from the PDF filename.
 * Mini Catalog / Videos: product name + model number only, with obvious
 * catalog/video/date/copy/resolution filename noise removed.
 *
 * This is display-only. Google Drive files are never renamed.
 */
function visibleNameForCategory_(name, category, folderPath) {
  if (category === 'normal') return productNameFromPdfFileName_(name);
  if (category === 'mini' || category === 'video') {
    return productModelNameFromMediaFileName_(name, category, folderPath);
  }
  return displayFileName_(name);
}

/**
 * Conservative product/model filename filter for Mini Catalog and Videos.
 * It intentionally preserves normal words, brand names, hyphenated models,
 * decimal model numbers and mixed letter/number model codes.
 *
 * Examples:
 *   "OHAUS AX224 - Mini Catalog.pdf" -> "OHAUS AX224"
 *   "Fluke 725 - Product Video.mp4"  -> "Fluke 725"
 *   "UNI-T UTD2102E Plus - Demo Video.mp4" -> "UNI-T UTD2102E Plus"
 *
 * It does NOT use OCR/AI and does not inspect file contents.
 */
function productModelNameFromMediaFileName_(name, category, folderPath) {
  let text = displayFileName_(name);
  text = cleanMediaProductText_(text, category);

  // If the filename is only a camera/WhatsApp identifier, use the nearest
  // useful folder name when the scanner already knows the folder path.
  if (!isUsefulProductLabel_(text) && folderPath) {
    const fromFolder = productModelNameFromFolderPath_(folderPath, category);
    if (isUsefulProductLabel_(fromFolder)) text = fromFolder;
  }

  // User requested product/model only. If no useful product/model text exists,
  // leave the display name blank rather than showing VID/WhatsApp/date noise.
  return isUsefulProductLabel_(text) ? text : '';
}

function cleanMediaProductText_(value, category) {
  let text = String(value || '').trim();
  if (!text) return '';

  // Remove any remaining known file extension(s), but keep model punctuation.
  text = displayFileName_(text);

  // Turn filename separators into readable spaces without breaking hyphenated
  // model numbers such as UT-61E or decimal models such as 725.2.
  text = text.replace(/_+/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();

  // Remove common camera/WhatsApp generated identifiers only when the whole
  // prefix clearly looks generated. This avoids damaging product names such as
  // "Video Borescope".
  text = text.replace(/^(?:whatsapp\s+video)[- _]*(?:\d{4}[-. ]\d{2}[-. ]\d{2}|\d{8})(?:\s+at\s+\d{1,2}[.:]\d{2}(?:[.:]\d{2})?\s*(?:am|pm)?)?[- _]*/i, '');
  text = text.replace(/^(?:whatsapp\s+)?(?:vid|video)[- _]*(?:\d{8}|\d{4}[-. ]\d{2}[-. ]\d{2})(?:[- _]*(?:wa)?\d{3,6})?[- _]*/i, '');

  // Remove standalone leading/trailing date/time stamps often added by phones.
  text = text.replace(/^(?:\d{4}[-. ]\d{2}[-. ]\d{2}|\d{8})(?:[ T_-]+\d{1,2}[.:-]\d{2}(?:[.:-]\d{2})?)?\s*[-–—_| ]*/i, '');
  text = text.replace(/\s*[-–—_| ]*(?:\d{4}[-. ]\d{2}[-. ]\d{2}|\d{8})(?:[ T_-]+\d{1,2}[.:-]\d{2}(?:[.:-]\d{2})?)?\s*$/i, '');

  // Remove copy/export counters without deleting legitimate model numbers.
  text = text.replace(/\s*[\[(]\s*(?:copy\s*)?\d+\s*[\])]\s*$/i, '');
  text = text.replace(/\s*[\[(]\s*(?:copy|final|latest|edited|edit)\s*[\])]\s*$/i, '');

  if (category === 'mini') {
    // Mini Catalog is a sheet category, not part of the product name.
    text = stripBoundaryNoise_(text, [
      'mini\\s*catalog(?:ue)?',
      'minicatalog(?:ue)?',
      'product\\s+mini\\s*catalog(?:ue)?'
    ]);

    // "Catalog/Brochure" by itself is removed only as a separated trailing file label.
    text = text.replace(/\s*[-–—_|]+\s*(?:product\s+)?(?:catalog(?:ue)?|brochure|leaflet)\s*$/i, '');
    text = text.replace(/^(?:product\s+)?(?:catalog(?:ue)?|brochure|leaflet)\s*[-–—_|]+\s*/i, '');
  }

  if (category === 'video') {
    // Remove explicit file-purpose labels, but never strip a bare leading
    // "Video" because "Video Borescope" can be a real product name.
    text = stripBoundaryNoise_(text, [
      'product\\s+video',
      'demo(?:nstration)?\\s+video',
      'working\\s+video',
      'operation\\s+video',
      'overview\\s+video',
      'sample\\s+video',
      'test\\s+video',
      'installation\\s+video'
    ]);

    // Short trailing labels are safe only when separated from the product by
    // punctuation. Example: "Fluke 725 - Demo".
    text = text.replace(/\s*[-–—_|]+\s*(?:video|demo|demonstration|working|operation|overview|sample|test|clip|recording)\s*$/i, '');
  }

  // Remove common export/status decorations at the boundary only.
  text = stripBoundaryNoise_(text, [
    'final',
    'latest',
    'new',
    'copy',
    'edited',
    'edit',
    'version\\s*\\d+(?:\\.\\d+)*',
    'v\\s*\\d+(?:\\.\\d+)*'
  ]);

  // A status word can expose a category label that was immediately before it,
  // e.g. "Atago PAL-1 Mini Catalogue Final".
  if (category === 'mini') {
    text = stripBoundaryNoise_(text, [
      'mini\\s*catalog(?:ue)?',
      'minicatalog(?:ue)?',
      'product\\s+mini\\s*catalog(?:ue)?'
    ]);
    text = text.replace(/\s*[-–—_|]+\s*(?:product\s+)?(?:catalog(?:ue)?|brochure|leaflet)\s*$/i, '');
  }
  if (category === 'video') {
    text = stripBoundaryNoise_(text, [
      'product\\s+video',
      'demo(?:nstration)?\\s+video',
      'working\\s+video',
      'operation\\s+video',
      'overview\\s+video',
      'sample\\s+video',
      'test\\s+video',
      'installation\\s+video'
    ]);
    text = text.replace(/\s*[-–—_|]+\s*(?:video|demo|demonstration|working|operation|overview|sample|test|clip|recording)\s*$/i, '');
  }

  // Remove obvious media quality labels only at the end.
  text = text.replace(/\s*[-–—_| ]+\s*(?:4k|8k|uhd|fhd|hd|sd|1080p|720p|480p|360p|\\d{2,3}\\s*fps)\s*$/i, '');

  // Final spacing/separator cleanup.
  text = text.replace(/\s+/g, ' ').trim();
  text = text.replace(/^[-–—_|,\s]+|[-–—_|,\s]+$/g, '').trim();

  return text;
}

/** Repeatedly removes known non-product labels only from the start/end. */
function stripBoundaryNoise_(value, patterns) {
  let text = String(value || '').trim();
  if (!text) return '';
  const body = '(?:' + patterns.join('|') + ')';
  const leading = new RegExp('^\\s*(?:' + body + ')\\s*(?:[-–—_|:]+\\s*)?', 'i');
  const trailing = new RegExp('(?:\\s*[-–—_|:]+)?\\s*(?:' + body + ')\\s*$', 'i');

  let previous;
  do {
    previous = text;
    text = text.replace(leading, '').replace(trailing, '').trim();
  } while (text && text !== previous);

  return text;
}

function isUsefulProductLabel_(value) {
  const text = String(value || '').trim();
  if (!text) return false;

  // Reject generated media IDs / pure dates / pure counters.
  if (/^(?:vid|video|mov|img|pxl|wa)?[- _]*\d{6,}(?:[- _]*(?:wa)?\d+)?$/i.test(text)) return false;
  if (/^\d{4}[-. ]\d{2}[-. ]\d{2}(?:\s+\d{1,2}[.:-]\d{2}(?:[.:-]\d{2})?)?$/i.test(text)) return false;
  if (/^\d+$/.test(text)) return false;

  // A useful label normally has a letter (product/brand) or a mixed
  // letter-number model code.
  return /[A-Za-z]/.test(text);
}

function productModelNameFromFolderPath_(folderPath, category) {
  const parts = String(folderPath || '').split('/').map(s => s.trim()).filter(Boolean);
  const generic = /^(?:my\s*drive|drive|files?|products?|media|videos?|product\s*videos?|mini\s*catalog(?:ue)?s?|minicatalog(?:ue)?s?|catalog(?:ue)?s?|brochures?)$/i;

  for (let i = parts.length - 1; i >= 0; i--) {
    if (generic.test(parts[i])) continue;
    const cleaned = cleanMediaProductText_(parts[i], category);
    if (isUsefulProductLabel_(cleaned)) return cleaned;
  }
  return '';
}

/**
 * Updates existing Mini Catalog and Videos rows in place.
 * Only column A (File Name) is changed. Drive Link and hidden File ID are kept.
 */
function cleanExistingMediaSheetNames_(ss) {
  [
    { sheet: APP.SHEETS.MINI, category: 'mini' },
    { sheet: APP.SHEETS.VIDEO, category: 'video' }
  ].forEach(item => {
    const sh = ss.getSheetByName(item.sheet);
    if (!sh || sh.getLastRow() <= 1) return;

    const count = sh.getLastRow() - 1;
    const range = sh.getRange(2, 1, count, 1);
    const values = range.getDisplayValues();
    let changed = false;

    for (let i = 0; i < values.length; i++) {
      const before = String(values[i][0] || '');
      const after = productModelNameFromMediaFileName_(before, item.category, '');
      if (after !== before) {
        values[i][0] = after;
        changed = true;
      }
    }

    if (changed) range.setValues(values);
  });

  PropertiesService.getScriptProperties().setProperty(APP.PROP_MEDIA_NAME_CLEANUP, '3.7');
}

/**
 * V3.7 lock-safe sheet maintenance.
 *
 * Why this exists:
 * a long full-scan worker can legitimately hold the script lock for several
 * minutes. The older manual migration waited only 30 seconds and therefore
 * could fail with "Lock timeout". V3.7 never fails for that reason: it first
 * pauses future workers, then either performs the maintenance immediately or
 * queues a one-minute maintenance trigger that retries after the current worker
 * releases the lock.
 */
function upgradeToPdfOnlyNormal() {
  return APPLY_PDF_ONLY_NORMAL_ONCE();
}

// Recommended one-time command for this version.
function APPLY_V3_7_SHEET_RULES_ONCE() {
  return APPLY_PDF_ONLY_NORMAL_ONCE();
}

function APPLY_PDF_ONLY_NORMAL_ONCE() {
  const p = PropertiesService.getScriptProperties();

  if (p.getProperty(APP.PROP_PDF_ONLY_MIGRATION) === '3.7') {
    return {
      ok: true,
      message: 'V3.7 rules are already applied: Normal Files is PDF-only, and Mini Catalog/Videos show filtered product/model names.'
    };
  }

  // Signal all current/new workers to stop as soon as possible. This property is
  // intentionally set BEFORE requesting the lock.
  p.setProperty(APP.PROP_MAINTENANCE, 'YES');

  // Prevent fresh recurring workers from starting while maintenance is waiting.
  // A worker already executing will finish or notice the maintenance flag.
  try { deleteTriggersByHandler_(APP.FULL_SCAN_HANDLER); } catch (e) { console.error(e); }
  try { deleteTriggersByHandler_(APP.LIVE_WATCH_HANDLER); } catch (e) { console.error(e); }

  const lock = LockService.getScriptLock();
  if (lock.tryLock(3000)) {
    try {
      return performPdfOnlyMigrationLocked_();
    } finally {
      lock.releaseLock();
    }
  }

  // Another scan is still finishing. Queue the maintenance instead of throwing
  // a lock-timeout error. The trigger retries every minute and deletes itself
  // immediately after maintenance succeeds.
  ensureMinuteTrigger_(APP.PDF_MIGRATION_HANDLER);
  return {
    ok: true,
    queued: true,
    message: 'A scan was still finishing, so V3.7 sheet cleanup was queued safely. Do not run it again. It will start automatically after the active scan releases the lock.'
  };
}

/** Background retry for the one-time migration. */
function finishPdfOnlyMigration_() {
  const p = PropertiesService.getScriptProperties();
  if (p.getProperty(APP.PROP_PDF_ONLY_MIGRATION) === '3.7') {
    p.deleteProperty(APP.PROP_MAINTENANCE);
    deleteTriggersByHandler_(APP.PDF_MIGRATION_HANDLER);
    return;
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    performPdfOnlyMigrationLocked_();
  } catch (e) {
    try { recordSystemError_(ensureWorkbook_(), 'PDF-only maintenance: ' + (e.message || e)); } catch (ignore) {}
    throw e;
  } finally {
    lock.releaseLock();
  }
}

/** Caller MUST already hold the script lock. */
function performPdfOnlyMigrationLocked_() {
  const p = PropertiesService.getScriptProperties();
  const ss = ensureWorkbook_();

  // Keep workers paused while the sheets and hidden ID index are made consistent.
  // Mini Catalog and Videos rows are preserved; only their visible names are cleaned.
  p.setProperty(APP.PROP_MAINTENANCE, 'YES');
  deleteTriggersByHandler_(APP.FULL_SCAN_HANDLER);
  deleteTriggersByHandler_(APP.LIVE_WATCH_HANDLER);

  // V3.7: keep all Mini Catalog and Videos rows/links/IDs, but rewrite their
  // visible File Name column to product/model-only labels.
  cleanExistingMediaSheetNames_(ss);

  const normal = ss.getSheetByName(APP.SHEETS.NORMAL);
  if (normal && normal.getLastRow() > 1) {
    normal.getRange(2, 1, normal.getLastRow() - 1, 3).clearContent();
  }

  // Preserve Mini Catalog and Videos in the hidden duplicate index, but remove
  // all previous Normal IDs so every PDF can be rebuilt with the cleaned product name.
  const idx = ss.getSheetByName(APP.SHEETS.INDEX);
  if (idx && idx.getLastRow() > 1) {
    const rowCount = idx.getLastRow() - 1;
    const values = idx.getRange(2, 1, rowCount, 2).getDisplayValues();
    const keep = values.filter(r => r[0] && r[1] !== 'normal');
    idx.getRange(2, 1, rowCount, 2).clearContent();
    if (keep.length) idx.getRange(2, 1, keep.length, 2).setValues(keep);
  }

  // Restart only the full traversal needed to rebuild Normal Files. During this
  // rebuild, processFullScanBatch_ ignores Mini Catalog and Videos completely.
  clearState_(ss);
  clearWatchCursor_(ss);
  setStateValues_(ss, {
    lastFullScan: 'Rebuilding PDF-only Normal Files...',
    lastScan: 'Rebuilding PDF-only Normal Files...',
    sourceNeedsFullScan: 'YES',
    lastAutoAdded: '0'
  });

  const state = createInitialState_();
  state.normalOnlyRebuild = true;
  saveState_(ss, state);

  p.setProperty(APP.PROP_PDF_ONLY_MIGRATION, '3.7');
  p.setProperty(APP.PROP_LIVE_WATCH_WANTED, 'YES');
  ensureLiveWatchBaseline_(ss, state);
  clearSystemError_(ss);

  // Maintenance is now complete. Remove its retry trigger and allow the fast
  // workers to resume automatically on their next one-minute cycle.
  p.deleteProperty(APP.PROP_MAINTENANCE);
  deleteTriggersByHandler_(APP.PDF_MIGRATION_HANDLER);
  ensureMinuteTrigger_(APP.FULL_SCAN_HANDLER);
  ensureMinuteTrigger_(APP.LIVE_WATCH_HANDLER);

  return {
    ok: true,
    message: 'V3.7 cleanup completed. Normal Files is rebuilding with PDFs only. Mini Catalog and Videos were kept, and their File Name column was filtered to product/model names.'
  };
}

function createInitialState_() {
  const p = PropertiesService.getScriptProperties();
  const sourceId = p.getProperty(APP.PROP_SOURCE_ID) || APP.ROOT_SENTINEL;
  const sourceName = p.getProperty(APP.PROP_SOURCE_NAME) || 'My Drive';
  return {
    version: 3,
    queue: [{ id: sourceId, path: sourceName }],
    current: null,
    phase: 'files',
    fileToken: '',
    folderToken: '',
    startedAt: new Date().toISOString(),
    lastHeartbeat: new Date().toISOString(),
    visitedTotal: 0,
    addedTotal: 0,
    foldersDone: 0
  };
}

function ensureWorkbook_() {
  if (RUNTIME_WORKBOOK_) return RUNTIME_WORKBOOK_;

  const p = PropertiesService.getScriptProperties();
  let id = p.getProperty(APP.PROP_SHEET_ID);
  if (id) {
    try {
      const existing = SpreadsheetApp.openById(id);
      ensureSheets_(existing);
      ensureDisplayNamesClean_(existing);
      if (!p.getProperty(APP.PROP_LIVE_WATCH_WANTED)) p.setProperty(APP.PROP_LIVE_WATCH_WANTED, 'YES');
      RUNTIME_WORKBOOK_ = existing;
      return existing;
    } catch (e) {
      p.deleteProperty(APP.PROP_SHEET_ID);
      RUNTIME_WORKBOOK_ = null;
    }
  }

  const ss = SpreadsheetApp.create(APP.TITLE);
  p.setProperty(APP.PROP_SHEET_ID, ss.getId());
  if (!p.getProperty(APP.PROP_SOURCE_ID)) {
    p.setProperty(APP.PROP_SOURCE_ID, APP.ROOT_SENTINEL);
    p.setProperty(APP.PROP_SOURCE_NAME, 'My Drive');
    p.setProperty(APP.PROP_SOURCE_URL, 'https://drive.google.com/drive/my-drive');
  }
  if (!p.getProperty(APP.PROP_LIVE_WATCH_WANTED)) p.setProperty(APP.PROP_LIVE_WATCH_WANTED, 'YES');
  ensureSheets_(ss);
  ensureDisplayNamesClean_(ss);
  RUNTIME_WORKBOOK_ = ss;
  return ss;
}

function ensureSheets_(ss) {
  let first = ss.getSheets()[0];
  let normal = ss.getSheetByName(APP.SHEETS.NORMAL);
  if (!normal) {
    if (first.getName() === 'Sheet1' && first.getLastRow() === 0) {
      first.setName(APP.SHEETS.NORMAL);
      normal = first;
    } else {
      normal = ss.insertSheet(APP.SHEETS.NORMAL, 0);
    }
    setupVisibleSheet_(normal);
  } else if (normal.getLastRow() === 0) {
    setupVisibleSheet_(normal);
  }

  [APP.SHEETS.MINI, APP.SHEETS.VIDEO].forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      setupVisibleSheet_(sh);
    } else if (sh.getLastRow() === 0) {
      setupVisibleSheet_(sh);
    }
  });

  let idx = ss.getSheetByName(APP.SHEETS.INDEX);
  if (!idx) idx = ss.insertSheet(APP.SHEETS.INDEX);
  if (idx.getLastRow() === 0) idx.getRange(1, 1, 1, 2).setValues([['File ID', 'Category']]).setFontWeight('bold');

  let state = ss.getSheetByName(APP.SHEETS.STATE);
  if (!state) state = ss.insertSheet(APP.SHEETS.STATE);
  if (state.getLastRow() === 0) state.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]).setFontWeight('bold');

  try { idx.hideSheet(); } catch (e) {}
  try { state.hideSheet(); } catch (e) {}

  moveSheetTo_(ss, ss.getSheetByName(APP.SHEETS.NORMAL), 1);
  moveSheetTo_(ss, ss.getSheetByName(APP.SHEETS.MINI), 2);
  moveSheetTo_(ss, ss.getSheetByName(APP.SHEETS.VIDEO), 3);
}

function moveSheetTo_(ss, sh, position) {
  if (!sh || sh.getIndex() === position) return;
  try {
    ss.setActiveSheet(sh);
    ss.moveActiveSheet(position);
  } catch (e) {
    console.error(e);
  }
}

function setupVisibleSheet_(sh) {
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, 3).setValues([['File Name', 'Drive Link', 'File ID']]);
  }
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, 3)
    .setFontWeight('bold')
    .setFontSize(11)
    .setBackground('#DDE4FF');
  sh.setColumnWidth(1, 360);
  sh.setColumnWidth(2, 520);
  sh.setColumnWidth(3, 160);
  try { sh.hideColumns(3); } catch (e) {}
}

function appendRows_(sh, rows) {
  if (!rows || !rows.length) return;
  const start = sh.getLastRow() + 1;
  sh.getRange(start, 1, rows.length, rows[0].length).setValues(rows);
  if (sh.getName() !== APP.SHEETS.INDEX) {
    sh.getRange(start, 1, rows.length, 2).setFontSize(11).setVerticalAlignment('middle');
  }
}

function loadExistingIds_(ss) {
  const sh = ss.getSheetByName(APP.SHEETS.INDEX);
  const set = new Set();
  const lastRow = sh.getLastRow();
  if (lastRow <= 1) return set;
  const vals = sh.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) {
    if (vals[i][0]) set.add(String(vals[i][0]));
  }
  return set;
}

function getStateCache_(ss) {
  const id = ss.getId();
  if (RUNTIME_STATE_CACHE_[id]) return RUNTIME_STATE_CACHE_[id];

  const sh = ss.getSheetByName(APP.SHEETS.STATE);
  const lastRow = Math.max(1, sh.getLastRow());
  const values = sh.getRange(1, 1, lastRow, 2).getValues();
  const map = {};
  const order = [];
  const rows = {};

  for (let i = 1; i < values.length; i++) {
    const key = String(values[i][0] || '');
    if (!key) continue;
    map[key] = values[i][1] === null || values[i][1] === undefined ? '' : String(values[i][1]);
    order.push(key);
    rows[key] = i + 1;
  }

  const cache = { sh: sh, map: map, order: order, rows: rows, lastRow: lastRow };
  RUNTIME_STATE_CACHE_[id] = cache;
  return cache;
}

function getStateValues_(ss, keys) {
  const cache = getStateCache_(ss);
  const out = {};
  keys.forEach(key => { out[key] = cache.map[key] || ''; });
  return out;
}

function setStateValues_(ss, updates) {
  const cache = getStateCache_(ss);
  const keys = Object.keys(updates || {});
  if (!keys.length) return;

  keys.forEach(key => {
    const value = updates[key] === null || updates[key] === undefined ? '' : String(updates[key]);
    if (!Object.prototype.hasOwnProperty.call(cache.map, key)) cache.order.push(key);
    cache.map[key] = value;
  });

  // One sheet write for a group of state changes is substantially faster than
  // repeatedly reading _State and writing one cell at a time.
  const rows = [['Key', 'Value']];
  cache.order.forEach(key => rows.push([key, cache.map[key]]));
  cache.sh.getRange(1, 1, rows.length, 2).setValues(rows);
  if (cache.lastRow > rows.length) {
    cache.sh.getRange(rows.length + 1, 1, cache.lastRow - rows.length, 2).clearContent();
  }

  cache.rows = {};
  cache.order.forEach((key, i) => { cache.rows[key] = i + 2; });
  cache.lastRow = rows.length;
}

function loadState_(ss) {
  const raw = getStateValue_(ss, 'scanState');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function saveState_(ss, state) {
  setStateValue_(ss, 'scanState', JSON.stringify(state));
}

function clearState_(ss) {
  setStateValue_(ss, 'scanState', '');
}

function clearWatchCursor_(ss) {
  setStateValues_(ss, {
    watchSince: '',
    watchToken: '',
    watchQuerySince: '',
    watchNextSince: ''
  });
}

function getStateValue_(ss, key) {
  return getStateCache_(ss).map[key] || '';
}

function setStateValue_(ss, key, value) {
  const update = {};
  update[key] = value;
  setStateValues_(ss, update);
}

function extractDriveFolderId_(input) {
  const s = String(input || '').trim();
  if (!s) return '';
  const m1 = s.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];
  if (/^[a-zA-Z0-9_-]{15,}$/.test(s)) return s;
  return '';
}

function ensureMinuteTrigger_(handler) {
  if (hasTrigger_(handler)) return;
  ScriptApp.newTrigger(handler).timeBased().everyMinutes(1).create();
}

function getTriggerHandlerSet_() {
  const set = new Set();
  ScriptApp.getProjectTriggers().forEach(t => set.add(t.getHandlerFunction()));
  return set;
}

function hasTrigger_(handler) {
  return ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === handler);
}

function deleteTriggersByHandler_(handler) {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === handler) {
      try { ScriptApp.deleteTrigger(t); } catch (e) { console.error(e); }
    }
  });
}

function recordSystemError_(ss, message) {
  setStateValues_(ss, {
    lastSystemError: String(message || 'Unknown error').substring(0, 800),
    lastSystemErrorAt: formatDisplayDate_(new Date())
  });
}

function clearSystemError_(ss) {
  setStateValues_(ss, { lastSystemError: '', lastSystemErrorAt: '' });
}

function formatDisplayDate_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd MMM yyyy, hh:mm a');
}

function formatDriveQueryDate_(date) {
  return Utilities.formatDate(date, 'GMT', "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

/**
 * Returns the folder path when the file is inside the selected source.
 * Returns null when the changed file is outside that source.
 */
function getFilePathInsideSource_(file, sourceId) {
  const targetId = sourceId === APP.ROOT_SENTINEL ? DriveApp.getRootFolder().getId() : sourceId;
  const queue = [];
  const seen = new Set();
  let parents;
  try { parents = file.getParents(); } catch (e) { return null; }
  while (parents.hasNext()) {
    const p = parents.next();
    queue.push({ folder: p, path: [p.getName()] });
  }

  let checked = 0;
  while (queue.length && checked < 80) {
    const item = queue.shift();
    const folder = item.folder;
    const id = folder.getId();
    checked++;
    if (seen.has(id)) continue;
    seen.add(id);
    if (id === targetId) return item.path.join('/');

    let ups;
    try { ups = folder.getParents(); } catch (e) { continue; }
    while (ups.hasNext()) {
      const up = ups.next();
      queue.push({ folder: up, path: [up.getName()].concat(item.path) });
    }
  }
  return null;
}

// Backward-compatible names from V1/V2, so old triggers/setup notes keep working.
function runScan() { return startFullScan(); }
function runAutoScan() { return runLiveWatch(); }
function setAutoScan(enabled) { return setLiveWatch(enabled); }
function hasAutoTrigger_() { return hasTrigger_(APP.LIVE_WATCH_HANDLER); }
