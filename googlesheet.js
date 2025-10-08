/**************************************************************
 * Bear's Groups List Pipeline (FULL)
 * - Sync usernames by phone from 业绩2 → Groups List
 * - Flip 首充
 * - Build client net sales summary from 业绩2!Q onto Groups List
 * - Tag Merged1/Merged2 in column I from the summary totals
 * - Automation (debounced onEdit + hourly refresh)
 **************************************************************/

/* ====== CONFIG ====== */
const CFG = {
  // Tab names
  srcSheet: '业绩2',
  tgtSheet: 'Groups List',

  // Rows/labels
  headerRow: 1,
  labelNotTopup: '未首充',
  labelTopup: '首充',

  // 业绩2 columns (1-based)
  srcNameCol: 1,     // A: Client name
  srcPhoneCol: 2,    // B: Customer HP
  srcNetSalesCol: 17,// Q: Net sales

  // Groups List columns (1-based)
  tgtUserCol: 2,     // B: Username
  tgtPhoneCol: 3,    // C: 顾客号码
  tgtStatusCol: 6,   // F: 状态/情况
  tgtTagCol: 9,      // I: merge tag destination

  // Summary table destination on Groups List
  sumHeaderRow: 1,
  sumStartCol: 14,   // N: start column for [客户 | 净销售额]
  sumClearRows: 1000,
  sumClearCols: 3,

  // Merged thresholds/tags
  thMerged1: 1000,
  thMerged2: 5000,
  tagMerged1: 'Merged1',
  tagMerged2: 'Merged2',
};

/* ====== AUTOMATION CONFIG ====== */
const AUTO = {
  DEBOUNCE_MS: 15000,        // 15s after last edit
  SCHEDULE_AFTER_MS: 20000,  // schedule run 20s after edit
  WATCH: [
    { sheet: CFG.tgtSheet, minCol: 1, maxCol: 11 },  // Groups List A–K
    { sheet: CFG.srcSheet, minCol: 1, maxCol: 20 },  // 业绩2 A–T (covers Q)
  ],
  PROP_LAST_EDIT: 'last_edit_ts',
  PROP_SCHEDULED: 'scheduled_trigger_id',
};

/* ====== MENU ====== */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Utilities')
    .addItem('Sync Names + Flip 首充 (now)', 'syncNamesAndFlip')
    .addItem('Build Client Net Sales Table (now)', 'buildClientNetSalesTable')
    .addItem('Apply Merged Tags (overwrite)', 'applyMergedTagsOverwrite')
    .addItem('Normalize Phone Numbers to Malaysian Format', 'normalizePhoneNumbers')
    .addItem('Set 杀 for Merged1/Merged2 Status', 'setKillForMergedStatus')
    .addSeparator()
    .addItem('Enable Automation', 'enableAutomation')
    .addItem('Disable Automation', 'disableAutomation')
    .addSeparator()
    .addItem('Rebuild Now (full pipeline)', 'rebuildNow')
    .addToUi();
}

/* ====== HELPERS ====== */
function normalizeName_(s) {
  if (!s) return '';
  const map = {'！':'!'};
  s = String(s).replace(/[！]/g, m => map[m] || m);
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (sh) return sh;

  const variants = [name + '！', name + ' !', name + '!'];
  for (const v of variants) {
    sh = ss.getSheetByName(v);
    if (sh) return sh;
  }

  const want = normalizeName_(name);
  for (const s of ss.getSheets()) {
    if (normalizeName_(s.getName()).includes(want)) return s;
  }
  throw new Error(`Sheet not found: ${name}`);
}

function phoneKeys_(raw) {
  const digits = String(raw || '').replace(/\D+/g, '');
  if (!digits) return [];
  let canon = digits;
  if (digits.startsWith('60')) {
    const rest = digits.slice(2);
    canon = rest.startsWith('0') ? rest : '0' + rest;
  } else if (digits.startsWith('0')) {
    canon = digits;
  }
  const last10 = canon.slice(-10);
  const last9  = canon.slice(-9);
  const set = new Set([canon, last10, last9].filter(Boolean));
  return Array.from(set);
}

function toNumber_(x) {
  if (x == null) return NaN;
  if (typeof x === 'number') return x;
  const s = String(x).replace(/[^\d.\-]/g, '');
  return s ? Number(s) : NaN;
}

function normalizePhoneNumber_(phone) {
  if (!phone) return '';
  
  // Extract only digits from the phone number
  const digits = String(phone).replace(/\D+/g, '');
  if (!digits) return '';
  
  // Handle different phone number formats to get full Malaysian phone number
  let normalized = digits;
  
  // If starts with 60 (Malaysia country code) - already in correct format
  if (digits.startsWith('60')) {
    const rest = digits.slice(2);
    // Remove leading 0 if present and ensure proper format
    if (rest.startsWith('0')) {
      normalized = '60' + rest.slice(1);
    } else {
      normalized = '60' + rest;
    }
  }
  // If starts with 0 (local format) - add country code
  else if (digits.startsWith('0')) {
    normalized = '60' + digits.slice(1);
  }
  // If starts with 11 (local mobile without country code) - add country code
  else if (digits.startsWith('11')) {
    normalized = '60' + digits;
  }
  // If starts with 01 (local mobile with leading 0) - add country code
  else if (digits.startsWith('01')) {
    normalized = '60' + digits.slice(1);
  }
  // If starts with 62 (Indonesia country code) - convert to Malaysia format
  else if (digits.startsWith('62')) {
    const rest = digits.slice(2);
    // Convert Indonesia number to Malaysia format by changing country code
    normalized = '60' + rest;
  }
  // For any other format, try to create a valid Malaysian number
  else {
    // If it's a 10-digit number without country code, add 60
    if (digits.length === 10) {
      normalized = '60' + digits;
    }
    // If it's an 8-digit number, add 60 and ensure it's a valid mobile format
    else if (digits.length === 8) {
      normalized = '60' + digits;
    }
    // For other lengths, try to create a valid format
    else if (digits.length > 10) {
      // Take the last 10 digits and add country code
      const last10 = digits.slice(-10);
      normalized = '60' + last10;
    } else {
      // Pad with zeros to make it 8 digits, then add country code
      const padded = digits.padStart(8, '0');
      normalized = '60' + padded;
    }
  }
  
  // Ensure the result is a valid Malaysian phone number (60 + 8-10 digits)
  if (normalized.startsWith('60') && normalized.length >= 10 && normalized.length <= 12) {
    return normalized;
  } else {
    // Fallback: create a valid Malaysian number
    const cleanDigits = normalized.replace(/^60/, '');
    if (cleanDigits.length >= 8) {
      return '60' + cleanDigits.slice(-8);
    } else {
      const padded = cleanDigits.padStart(8, '0');
      return '60' + padded;
    }
  }
}

/* ====== PHONE NUMBER NORMALIZATION ====== */
function normalizePhoneNumbers() {
  const tgt = sheet_(CFG.tgtSheet);
  const last = tgt.getLastRow();
  if (last <= CFG.headerRow) {
    SpreadsheetApp.getActiveSpreadsheet().toast('No data to normalize.', 'Phone Normalization', 3);
    return;
  }

  let normalizedCount = 0;
  let skippedCount = 0;

  // Process each row in Column C (Customer Phone Numbers)
  for (let r = CFG.headerRow + 1; r <= last; r++) {
    const phoneCell = tgt.getRange(r, CFG.tgtPhoneCol);
    const currentPhone = (phoneCell.getDisplayValue() || '').toString().trim();
    
    if (!currentPhone) {
      skippedCount++;
      continue;
    }

    const normalizedPhone = normalizePhoneNumber_(currentPhone);
    
    // Only update if the normalized phone is different from current
    if (normalizedPhone && normalizedPhone !== currentPhone) {
      phoneCell.setValue(normalizedPhone);
      normalizedCount++;
    } else {
      skippedCount++;
    }
  }

  const message = `Phone normalization complete!\nNormalized: ${normalizedCount} numbers\nSkipped: ${skippedCount} numbers`;
  SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Phone Normalization', 5);
}

/* ====== MERGED STATUS UPDATE ====== */
function setKillForMergedStatus() {
  const tgt = sheet_(CFG.tgtSheet);
  const last = tgt.getLastRow();
  if (last <= CFG.headerRow) {
    SpreadsheetApp.getActiveSpreadsheet().toast('No data to process.', 'Merged Status Update', 3);
    return;
  }

  let updatedCount = 0;
  let skippedCount = 0;

  // Process each row to check Column I and update Column F
  for (let r = CFG.headerRow + 1; r <= last; r++) {
    const statusCell = tgt.getRange(r, CFG.tgtStatusCol); // Column F
    const mergedCell = tgt.getRange(r, CFG.tgtTagCol);     // Column I
    
    const currentStatus = (statusCell.getDisplayValue() || '').toString().trim();
    const mergedValue = (mergedCell.getDisplayValue() || '').toString().trim();
    
    // Check if Column I contains "Merged1" or "Merged2"
    if (mergedValue === 'Merged1' || mergedValue === 'Merged2') {
      // Update Column F to "杀" if it's not already set
      if (currentStatus !== '杀') {
        statusCell.setValue('杀');
        updatedCount++;
      } else {
        skippedCount++;
      }
    } else {
      skippedCount++;
    }
  }

  const message = `Merged status update complete!\nUpdated to 杀: ${updatedCount} rows\nSkipped: ${skippedCount} rows`;
  SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Merged Status Update', 5);
}

/* ====== PART 1: SYNC USERNAMES + FLIP 首充 ====== */

// Build phone->name map from 业绩2
function buildPhoneNameMap_() {
  const src = sheet_(CFG.srcSheet);
  const last = src.getLastRow();
  const map = new Map();
  if (last <= CFG.headerRow) return map;

  const readCols = Math.max(CFG.srcNameCol, CFG.srcPhoneCol);
  const vals = src.getRange(CFG.headerRow + 1, 1, last - CFG.headerRow, readCols).getValues();

  for (let i = 0; i < vals.length; i++) {
    const name = (vals[i][CFG.srcNameCol - 1] || '').toString().trim();
    const phone = (vals[i][CFG.srcPhoneCol - 1] || '').toString();
    if (!name || !phone) continue;
    for (const k of phoneKeys_(phone)) {
      if (k && !map.has(k)) map.set(k, name);
    }
  }
  return map;
}

// Fill B (Username) by phone (Groups List C), then flip F 未首充→首充
function syncNamesAndFlip() {
  const tgt = sheet_(CFG.tgtSheet);
  const last = tgt.getLastRow();
  if (last <= CFG.headerRow) return;

  const phoneToName = buildPhoneNameMap_();
  const phoneVals = tgt.getRange(CFG.headerRow + 1, CFG.tgtPhoneCol, last - CFG.headerRow, 1).getValues();

  // cell-by-cell to avoid weirdness with merges/validation
  for (let r = 0; r < phoneVals.length; r++) {
    const rowIndex = CFG.headerRow + 1 + r;

    // Username fill
    const userCell = tgt.getRange(rowIndex, CFG.tgtUserCol);
    const currUser = (userCell.getDisplayValue() || '').toString().trim();
    if (!currUser) {
      const rawPhone = (phoneVals[r][0] || '').toString();
      const keys = phoneKeys_(rawPhone);
      let name = '';
      for (const k of keys) { if (phoneToName.has(k)) { name = phoneToName.get(k); break; } }
      if (name) userCell.setValue(name);
    }

    // Flip 首充 if username present & status is 未首充
    const username = (tgt.getRange(rowIndex, CFG.tgtUserCol).getDisplayValue() || '').toString().trim();
    if (username) {
      const statCell = tgt.getRange(rowIndex, CFG.tgtStatusCol);
      const status = (statCell.getDisplayValue() || '').toString().trim();
      if (status === CFG.labelNotTopup) {
        statCell.setValue(CFG.labelTopup);
      }
    }
  }
}

/* ====== PART 2: BUILD CLIENT NET SALES TABLE ====== */
function buildClientNetSalesTable() {
  const src = sheet_(CFG.srcSheet);
  const tgt = sheet_(CFG.tgtSheet);

  const last = src.getLastRow();
  if (last <= CFG.headerRow) return;

  const readCols = Math.max(CFG.srcNameCol, CFG.srcNetSalesCol);
  const vals = src.getRange(CFG.headerRow + 1, 1, last - CFG.headerRow, readCols).getValues();

  // Aggregate client -> total net sales (from Q)
  const totals = new Map();
  for (let i = 0; i < vals.length; i++) {
    const client = (vals[i][CFG.srcNameCol - 1] || '').toString().trim();
    if (!client) continue;
    const sale = toNumber_(vals[i][CFG.srcNetSalesCol - 1]);
    if (!isFinite(sale)) continue;
    totals.set(client, (totals.get(client) || 0) + sale);
  }

  const rows = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, sum]) => [name, sum]);

  // Clear old area & write header+rows
  tgt.getRange(CFG.sumHeaderRow, CFG.sumStartCol, CFG.sumClearRows, CFG.sumClearCols)
     .clearContent().clearFormat();

  tgt.getRange(CFG.sumHeaderRow, CFG.sumStartCol, 1, 2)
     .setValues([['客户', '净销售额 (RM)']])
     .setFontWeight('bold');

  if (rows.length > 0) {
    tgt.getRange(CFG.sumHeaderRow + 1, CFG.sumStartCol, rows.length, 2).setValues(rows);
  }

  // Format currency & cosmetics
  tgt.getRange(CFG.sumHeaderRow + 1, CFG.sumStartCol + 1, Math.max(rows.length, 1), 1)
     .setNumberFormat('[$RM-421]* #,##0.00;[RED]-[$RM-421]* #,##0.00;[$RM-421]* "-"??;@');

  tgt.setColumnWidths(CFG.sumStartCol, 2, 140);
  tgt.getRange(CFG.sumHeaderRow, CFG.sumStartCol, Math.max(rows.length + 1, 2), 2)
     .setBorder(true, true, true, true, true, true);
}

/* ====== PART 3: APPLY MERGED TAGS (I) FROM SUMMARY ====== */
function readSummaryMap_() {
  const tgt = sheet_(CFG.tgtSheet);
  const startRow = CFG.sumHeaderRow + 1;
  const startCol = CFG.sumStartCol; // N
  const maxRows = tgt.getMaxRows() - startRow + 1;
  if (maxRows <= 0) return new Map();

  const vals = tgt.getRange(startRow, startCol, maxRows, 2).getValues(); // [客户, 净销售额]
  const map = new Map();
  for (let i = 0; i < vals.length; i++) {
    const client = (vals[i][0] || '').toString().trim();
    if (!client) continue;
    const total = toNumber_(vals[i][1]);
    if (!isFinite(total)) continue;
    map.set(client, (map.get(client) || 0) + total);
  }
  return map;
}

function tagForTotal_(total) {
  if (!isFinite(total)) return '';
  if (total >= CFG.thMerged2) return CFG.tagMerged2;   // ≥ 5000
  if (total >= CFG.thMerged1) return CFG.tagMerged1;   // ≥ 1000
  return '';
}

function applyMergedTagsOverwrite() {
  const tgt = sheet_(CFG.tgtSheet);
  const totals = readSummaryMap_();

  const last = tgt.getLastRow();
  if (last <= CFG.headerRow) return;

  for (let r = CFG.headerRow + 1; r <= last; r++) {
    const user = (tgt.getRange(r, CFG.tgtUserCol).getDisplayValue() || '').toString().trim();
    if (!user) {
      tgt.getRange(r, CFG.tgtTagCol).setValue('');
      continue;
    }
    const total = totals.get(user);
    const tag = tagForTotal_(total);
    tgt.getRange(r, CFG.tgtTagCol).setValue(tag);
  }
}

/* ====== PIPELINE RUNNER ====== */
function rebuildNow() {
  syncNamesAndFlip();
  buildClientNetSalesTable();
  applyMergedTagsOverwrite();
}

/* ====== AUTOMATION (installable onEdit + hourly) ====== */
function enableAutomation() {
  // Clear old triggers
  disableAutomation();

  const ss = SpreadsheetApp.getActive();
  ScriptApp.newTrigger('onEditInstallable').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('rebuildNow').timeBased().everyHours(1).create();

  SpreadsheetApp.getActiveSpreadsheet().toast('Automation enabled.', 'Auto', 4);
}

function disableAutomation() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const t of triggers) {
    const f = t.getHandlerFunction();
    if (f === 'onEditInstallable' || f === 'rebuildNow' || f === 'runScheduledRebuild_') {
      ScriptApp.deleteTrigger(t);
    }
  }
  PropertiesService.getScriptProperties().deleteProperty(AUTO.PROP_SCHEDULED);
  SpreadsheetApp.getActiveSpreadsheet().toast('Automation disabled.', 'Auto', 4);
}

function onEditInstallable(e) {
  try {
    if (!e || !e.range) return;
    const sh = e.range.getSheet().getName();
    const col = e.range.getColumn();

    const hit = AUTO.WATCH.some(w =>
      sh.indexOf(w.sheet) > -1 && col >= w.minCol && col <= w.maxCol
    );
    if (!hit) return;

    const props = PropertiesService.getScriptProperties();
    props.setProperty(AUTO.PROP_LAST_EDIT, String(Date.now()));
    scheduleRebuildOnce_();
  } catch (err) {
    Logger.log('onEditInstallable error: ' + err);
  }
}

function scheduleRebuildOnce_() {
  const props = PropertiesService.getScriptProperties();
  const existing = props.getProperty(AUTO.PROP_SCHEDULED);
  if (existing) return; // already scheduled

  const trig = ScriptApp.newTrigger('runScheduledRebuild_')
    .timeBased()
    .after(AUTO.SCHEDULE_AFTER_MS)
    .create();
  props.setProperty(AUTO.PROP_SCHEDULED, trig.getUniqueId());
}

function runScheduledRebuild_() {
  const props = PropertiesService.getScriptProperties();
  const lastEdit = Number(props.getProperty(AUTO.PROP_LAST_EDIT) || 0);
  const now = Date.now();

  // debounce: if an edit happened recently, reschedule
  if (now - lastEdit < AUTO.DEBOUNCE_MS) {
    PropertiesService.getScriptProperties().deleteProperty(AUTO.PROP_SCHEDULED);
    scheduleRebuildOnce_();
    return;
  }

  PropertiesService.getScriptProperties().deleteProperty(AUTO.PROP_SCHEDULED);
  rebuildNow();
}
