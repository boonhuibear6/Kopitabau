/***** ========== GLOBAL CONFIG ========== *****/
const SHEET_CURRENT = '粉来源';     // Gmail new leads go here
const GMAIL_LABEL = 'KerjaVista';
const QUERY = 'label:"KerjaVista"';
const QUERY_UNREAD = 'label:"KerjaVista" is:unread';

// Gmail-imported source value
const NEW_LEAD_SOURCE_VALUE = 'KerjaVista';
const PROCESSED_GMAIL_LABEL = 'KerjaVista/Processed';

const CHECK_DUP_BY_EMAIL = true;
const CHECK_DUP_BY_PHONE = true;
const CHECK_DUP_BY_NAME  = true;

const TARGET_HEADER = ['Name','Phone','Email','Gender','Timestamp','Agent','Take DATE','Source','CV','CV_Status','CV_Preview'];

const MARK_AS_READ_AFTER_IMPORT = true;

/***** ========== REPORT CONFIG ========== *****/
const REPORT_INPUT_SHEET  = SHEET_CURRENT;
const REPORT_OUTPUT_SHEET = '报告';
const REPORT_AGENTS = ['百万','元宵','杰晟','东昊','小熊'];         // whitelist shown in report
const REPORT_ALIASES = {}; // e.g. { 'bai wan': '百万' }

const REPORT_PALETTES = { header1:"#C9DAF8", header2:"#FDE9D9", sectionA:"#E8F8F5", sectionB:"#FEF9E7", totalBg:"#AED581" };
const REPORT_AGENT_COLORS = { "百万":"#F8BBD0","元宵":"#B2EBF2","杰晟":"#D1C4E9","东昊":"#FFF59D","小熊":"#FFCC80" };
const REPORT_THIS_MONTH_START_COL = 9; // I
const REPORT_SKIP_COLOR = "#ffcccc";   // only used by report
const SKIP_COLOR = "#ffcccc";          // used by import/sync

/***** ========== PERSISTENCE KEYS ========== *****/
const PROP_KEY_SSID = 'SPREADSHEET_ID';   // bound sheet id (auto-set)
const PROP_CACHE_PREFIX = 'msg_';         // processed Gmail ids (ScriptProperties)

/***** ========== SIMPLE LOGGER ========== *****/
function log_(level, message, data){
  console.log(`[${level}] ${message}`, data || '');
  try{
    const s = ss_();
    const sh = s.getSheetByName('Logs') || s.insertSheet('Logs');
    sh.appendRow([new Date(), level, message, data ? JSON.stringify(data) : '' ]);
  }catch(e){ 
    console.log('Log failed:', e.message);
}
}

function notify_(msg){
  console.log('NOTIFY:', msg);
  try { SpreadsheetApp.getActive().toast(msg, 'KerjaVista Leads', 6); } catch(_) { console.log('Toast failed:', msg); }
}

/***** ========== AUTO-BIND ========== *****/
function ss_(){
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty(PROP_KEY_SSID);
  if (!id){
    try{
      const active = SpreadsheetApp.getActive() || SpreadsheetApp.getActiveSpreadsheet();
      if (active) {
        id = active.getId();
        props.setProperty(PROP_KEY_SSID, id);
        console.log('Bound to spreadsheet:', id);
      }
    }catch(e){
      console.log('Error binding spreadsheet:', e.message);
  }
  }
  if (!id) throw new Error('无法自动识别当前工作表。请在绑定的表格中运行 installAutomation 一次以授权。');
  return SpreadsheetApp.openById(id);
}

/***** ========== MENU ========== *****/
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('KerjaVista Leads')
      .addItem('安装：每15分钟自动同步','installAutomation')
      .addSeparator()
      .addItem('同步 KerjaVista 邮件 (仅未读)', 'syncKerjaVistaLeads')
      .addItem('同步 KerjaVista 邮件 (强制，忽略缓存)', 'syncKerjaVistaLeadsForce')
      .addItem('🔍 简单诊断', 'simpleDiagnose')
      .addSeparator()
      .addItem('更新现有行CV信息', 'updateExistingRowsWithCV')
      .addItem('🔧 修复CV预览链接', 'fixCVPreviewLinks')
      .addSeparator()
      .addItem('生成报告 (Carimakan + KerjaVista + SEC)', 'generateKerjaVistaSecReport')
      .addSeparator()
      .addItem('清理手机号为纯数字', 'cleanupPhones')
      .addItem('重置 Gmail 已处理缓存', 'resetProcessedCache')
      .addToUi();
  } catch (e) {
    console.log('onOpen: UI not available in this context:', e.message);
    // UI not available - this is normal when running from editor or as trigger
  }
}

/***** ========== DIAGNOSTIC FUNCTIONS ========== *****/
function simpleDiagnose(){
  console.log('=== 开始简单诊断 ===');
  
  try {
    const ss = ss_();
    console.log('✅ 表格访问成功');
    
    const threads = GmailApp.search('label:"KerjaVista"', 0, 5);
    console.log(`✅ 找到 ${threads.length} 个 KerjaVista 线程`);
    
    const unreadThreads = GmailApp.search('label:"KerjaVista" is:unread', 0, 5);
    console.log(`✅ 找到 ${unreadThreads.length} 个未读线程`);
    
    if (unreadThreads.length > 0) {
      const messages = unreadThreads[0].getMessages();
      if (messages.length > 0) {
        const msg = messages[0];
        console.log('邮件主题:', msg.getSubject());
        const parsed = parseWixSubmission_(msg.getBody());
        console.log('解析结果:', parsed);
      }
    }
    
    notify_('诊断完成，请查看执行日志');
    
  } catch (e) {
    console.log('❌ 诊断失败:', e.message);
    notify_('诊断失败: ' + e.message);
  }
}

function updateExistingRowsWithCV(){
  console.log('=== 更新现有行CV信息 ===');
  
  try {
    const ss = ss_();
    const sh = ss.getSheetByName(SHEET_CURRENT);
    if (!sh || sh.getLastRow() < 2) {
      notify_('没有数据需要更新');
      return;
    }
    
    // Get all KerjaVista emails
    const threads = GmailApp.search('label:"KerjaVista"', 0, 500);
    console.log(`找到 ${threads.length} 个KerjaVista线程`);
    
    const msgs2D = GmailApp.getMessagesForThreads(threads);
    const allMessages = msgs2D.flat();
    console.log(`总共找到 ${allMessages.length} 条消息`);
    
    // Create a map of email content to CV info
    const cvMap = new Map();
    
    for (let t = 0; t < msgs2D.length; t++) {
      const msgs = msgs2D[t];
      for (let i = 0; i < msgs.length; i++) {
        const m = msgs[i];
        const parsed = parseWixSubmission_(safeBody_(m)) || parseWixSubmission_(m.getPlainBody());
        if (parsed && parsed.name) {
          const key = `${parsed.name}_${parsed.phone}_${parsed.email}`.toLowerCase();
          cvMap.set(key, {
            cv: parsed.cv || '',
            cvStatus: parsed.cvStatus || '',
            cvPreview: parsed.cvPreview || ''
          });
        }
      }
    }
    
    console.log(`创建了 ${cvMap.size} 个CV映射`);
    
    // Update existing rows
    const lastRow = sh.getLastRow();
    const data = sh.getRange(2, 1, lastRow - 1, TARGET_HEADER.length).getValues();
    let updated = 0;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const name = row[0] || '';
      const phone = row[1] || '';
      const email = row[2] || '';
      const source = row[7] || '';
      
      // Only update KerjaVista rows that don't have CV info yet
      if (source === 'KerjaVista' && (!row[8] || row[8] === '')) {
        const key = `${name}_${phone}_${email}`.toLowerCase();
        const cvInfo = cvMap.get(key);
        
        if (cvInfo) {
          // Update the row with CV information
          const cvPreview = createCVPreview_(cvInfo.cv, cvInfo.cvStatus);
          
          // Set values and formulas separately
          sh.getRange(i + 2, 9, 1, 2).setValues([[
            cvInfo.cv,
            cvInfo.cvStatus
          ]]);
          
          // Set the hyperlink formula in the CV_Preview column
          sh.getRange(i + 2, 11).setFormula(cvPreview);
          
          updated++;
          console.log(`更新行 ${i + 2}: ${name} - CV: ${cvInfo.cv}, 预览: ${cvPreview}`);
        }
      }
    }
    
    notify_(`更新完成：${updated} 行已添加CV信息`);
    console.log(`=== 更新完成：${updated} 行 ===`);
    
  } catch (e) {
    console.log('❌ 更新现有行失败:', e.message);
    notify_('更新失败: ' + e.message);
  }
}


function fixCVPreviewLinks(){
  console.log('=== 修复CV预览链接 ===');
  
  try {
    const ss = ss_();
    const sh = ss.getSheetByName(SHEET_CURRENT);
    if (!sh || sh.getLastRow() < 2) {
      notify_('没有数据需要修复');
      return;
    }
    
    const lastRow = sh.getLastRow();
    const data = sh.getRange(2, 1, lastRow - 1, TARGET_HEADER.length).getValues();
    let fixed = 0;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const cv = row[8] || ''; // CV column
      const cvPreview = row[10] || ''; // CV_Preview column
      
      // Check if CV exists but CV_Preview is not a hyperlink formula
      if (cv && cv.startsWith('http') && (!cvPreview.startsWith('=HYPERLINK'))) {
        const validation = validateCV_(cv);
        const newPreview = createCVPreview_(cv, validation.status);
        
        // Set the hyperlink formula
        sh.getRange(i + 2, 11).setFormula(newPreview);
        fixed++;
        console.log(`修复行 ${i + 2}: ${cv} -> ${newPreview}`);
      }
    }
    
    notify_(`修复完成：${fixed} 个CV预览链接已更新`);
    console.log(`=== 修复完成：${fixed} 个链接 ===`);
    
  } catch (e) {
    console.log('❌ 修复CV预览失败:', e.message);
    notify_('修复失败: ' + e.message);
  }
}

/***** ========== 15-MIN PIPELINE + TRIGGER ========== *****/
function autoSyncKerjaVistaLeads(){
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(10000)){ log_('INFO','Skip run (locked)'); return; }

  const summary = {added:0, steps:[]};
  try{
    summary.added = syncKerjaVistaLeads() || 0;         summary.steps.push('sync');
    cleanupPhones();                                   summary.steps.push('phones');
    log_('SUCCESS','Auto run finished',summary);
  }catch(e){
    log_('ERROR','Auto run failed',{message:e.message, stack:String(e.stack||'')});
  }finally{
    try{ lock.releaseLock(); }catch(_){}
  }
}

function installAutomation(){
  console.log('安装自动化...');
  // auto-bind the spreadsheet id immediately
  (function(){ try{ const id = (SpreadsheetApp.getActive()||SpreadsheetApp.getActiveSpreadsheet()).getId();
    PropertiesService.getScriptProperties().setProperty(PROP_KEY_SSID, id);
    console.log('绑定到表格:', id);
  }catch(e){ console.log('绑定失败:', e.message); }})();

  const name = 'autoSyncKerjaVistaLeads';
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === name)
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger(name).timeBased().everyMinutes(15).create();

  notify_('✅ 已安装：每15分钟自动同步 KerjaVista 未读邮件。');
  log_('INFO','Trigger installed',{handler:name, every:'15m'});
}

/***** =================== GMAIL SYNC (UNREAD ONLY) =================== *****/
function syncKerjaVistaLeads(){ return _syncUnread(false, QUERY_UNREAD); }
function syncKerjaVistaLeadsForce(){ return _syncUnread(true, QUERY); }  // process ALL KerjaVista emails

function _syncUnread(ignoreCache, query = QUERY){
  console.log('=== 开始同步 KerjaVista 邮件 ===');
  console.log('忽略缓存:', ignoreCache);
  console.log('搜索查询:', query);
  
  const ss = ss_();
  const sh = ss.getSheetByName(SHEET_CURRENT) || ss.insertSheet(SHEET_CURRENT);
  ensureHeader_(sh);
  ensureConditionalFormatting_(sh);

  const indexes = buildCrossIndexes_();

  let threads = [];
  try{
    threads = GmailApp.search(query, 0, 500);
    console.log(`Gmail 搜索完成，找到 ${threads.length} 个线程`);
  }catch(e){
    console.log('❌ Gmail 搜索失败:', e.message);
    log_('ERROR','Gmail search failed', {msg:e.message, stack: e.stack});
    notify_('Gmail 搜索失败：' + e.message);
    return 0;
  }
  
  const msgs2D  = GmailApp.getMessagesForThreads(threads);
  const allMessages = msgs2D.flat();
  console.log(`总共找到 ${allMessages.length} 条消息`);

  let threadCount = threads.length;
  let messageCount = 0;
  let skippedByRead = 0;
  let skippedByCache = 0;
  let parsedOK = 0;
  let parseFail = 0;

  const rows = [];
  const bgColors = [];
  const processedMsgs = [];

  for (let t = 0; t < msgs2D.length; t++) {
    const msgs = msgs2D[t];
    messageCount += msgs.length;

    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i];

      // For force sync, process all messages; for normal sync, only unread
      if (query === QUERY_UNREAD && !m.isUnread()) { 
        skippedByRead++; 
        console.log(`跳过已读消息: ${m.getSubject()}`);
        continue; 
      }

      const id = m.getId();
      if (!ignoreCache && isProcessed_(id)) { 
        skippedByCache++; 
        console.log(`跳过已处理消息: ${m.getSubject()}`);
        continue; 
      }

      console.log(`处理消息: ${m.getSubject()}`);
      console.log(`发件人: ${m.getFrom()}`);

      const parsed = parseWixSubmission_(safeBody_(m)) || parseWixSubmission_(m.getPlainBody());
      if (!parsed) { 
        parseFail++; 
        console.log(`❌ 解析失败: ${m.getSubject()}`);
        continue; 
      }
      parsedOK++;
      console.log(`✅ 解析成功:`, parsed);

      const name   = parsed.name || '';
      const phone  = normalizePhone_(parsed.phone);
      const email  = normalizeEmail_(parsed.email);
      const gender = parsed.gender || '';
      const cv     = parsed.cv || '';
      const cvStatus = parsed.cvStatus || '';
      const cvPreview = parsed.cvPreview || '';
      const ts     = Utilities.formatDate(m.getDate(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
      const agent  = '';
      const take   = '';

      // de-dupe across current sheet
      const n = normalizeName_(name), p = phone, e = email;
      let dup = false;
      if (CHECK_DUP_BY_EMAIL && e && indexes.current.emails.has(e)) dup = true;
      if (CHECK_DUP_BY_PHONE && p && indexes.current.phones.has(p)) dup = true;
      if (CHECK_DUP_BY_NAME  && n && indexes.current.names.has(n))  dup = true;

      const source = dup ? '' : NEW_LEAD_SOURCE_VALUE;

      console.log(`添加行: ${name}, ${phone}, ${email}, ${gender}, ${ts}, ${source}, CV: ${cv}, Status: ${cvStatus}`);
      console.log(`是否重复: ${dup}`);

      rows.push([name, phone, email, gender, ts, agent, take, source, cv, cvStatus, cvPreview]);
      bgColors.push(dup ? '#FFE5E5' : null);

      if (e) indexes.current.emails.add(e);
      if (p) indexes.current.phones.add(p);
      if (n) indexes.current.names.add(n);

      processedMsgs.push(m);
    }
  }

  console.log(`处理统计: 线程${threadCount}, 消息${messageCount}, 跳过已读${skippedByRead}, 跳过缓存${skippedByCache}, 解析成功${parsedOK}, 解析失败${parseFail}`);

  if (!rows.length) {
    const msg = `未读线程:${threadCount}｜邮件:${messageCount}｜跳过-已读:${skippedByRead}｜跳过-缓存:${skippedByCache}｜可解析:${parsedOK}｜解析失败:${parseFail}`;
    notify_(msg);
    log_('INFO', 'No rows added', {threadCount,messageCount,skippedByRead,skippedByCache,parsedOK,parseFail});
    return 0;
  }

  console.log(`准备写入 ${rows.length} 行到表格`);
  const start = sh.getLastRow() + 1;
  
  // Set all values except CV_Preview column
  const rowsWithoutCVPreview = rows.map(row => {
    const newRow = [...row];
    newRow[10] = ''; // Clear CV_Preview column
    return newRow;
  });
  
  sh.getRange(start, 1, rows.length, TARGET_HEADER.length).setValues(rowsWithoutCVPreview);
  
  // Set CV_Preview formulas separately
  for (let i = 0; i < rows.length; i++) {
    const cvPreview = rows[i][10]; // CV_Preview is column 11 (index 10)
    if (cvPreview && cvPreview.startsWith('=HYPERLINK')) {
      sh.getRange(start + i, 11).setFormula(cvPreview);
      console.log(`设置CV预览公式 行 ${start + i}: ${cvPreview}`);
    }
  }
  
  bgColors.forEach((c,i)=>{ if (c) sh.getRange(start+i, 1, 1, TARGET_HEADER.length).setBackground(c); });

  if (MARK_AS_READ_AFTER_IMPORT && processedMsgs.length) {
    const label = ensureGmailLabel_(PROCESSED_GMAIL_LABEL);
    processedMsgs.forEach(m => { try { m.markRead(); if (label) m.addLabel(label); } catch(e){} });
    console.log(`标记 ${processedMsgs.length} 条消息为已读`);
  }
  markProcessedBatch_(processedMsgs.map(m => m.getId()));

  notify_(`新增 ${rows.length} 条（已设为已读）｜未读线程:${threadCount}｜邮件:${messageCount}｜跳过-缓存:${skippedByCache}｜解析OK:${parsedOK}｜失败:${parseFail}`);
  log_('SUCCESS', 'Sync complete', {added: rows.length, threadCount, messageCount, skippedByCache, parsedOK, parseFail});
  console.log('=== 同步完成 ===');
  return rows.length;
}

function safeBody_(m){
  try{ return m.getBody(); }catch(_){ return ''; }
}

/***** =================== UTILITIES =================== *****/
function ensureHeader_(sh) {
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, TARGET_HEADER.length).setValues([TARGET_HEADER]);
    sh.setFrozenRows(1);
  } else {
    const cur = sh.getRange(1,1,1,TARGET_HEADER.length).getValues()[0];
    if (cur.join('|') !== TARGET_HEADER.join('|')) {
      sh.insertRowBefore(1);
      sh.getRange(1, 1, 1, TARGET_HEADER.length).setValues([TARGET_HEADER]);
      sh.setFrozenRows(1);
    }
  }
}

function ensureConditionalFormatting_(sh) {
  // Apply to all data rows
  const dataRange = sh.getRange(2, 1, Math.max(1, sh.getMaxRows() - 1), sh.getMaxColumns());

  // Normalized arrays across the whole column
  const EMAIL_ARR = 'ARRAYFORMULA(LOWER(TRIM($C$2:$C)))';
  const PHONE_ARR = 'ARRAYFORMULA(REGEXREPLACE($B$2:$B,"\\D",""))';
  const NAME_ARR  = 'ARRAYFORMULA(LOWER(TRIM($A$2:$A)))';

  const NAME_EMAIL_ARR = `${NAME_ARR}&"|"&${EMAIL_ARR}`;
  const NAME_PHONE_ARR = `${NAME_ARR}&"|"&${PHONE_ARR}`;

  // Current-row normalized tokens
  const curEmail = 'LOWER(TRIM($C2))';
  const curPhone = 'REGEXREPLACE($B2,"\\D","")';
  const curName  = 'LOWER(TRIM($A2))';

  const curNameEmail = `${curName}&"|"&${curEmail}`;
  const curNamePhone = `${curName}&"|"&${curPhone}`;

  // Helper: "highlight only later duplicates" pattern:
  //  - appears >1 in full column AND current row number is AFTER the first match
  const LATER_EMAIL_DUP =
    `AND($C2<>"",` +
    `COUNTIF(${EMAIL_ARR}, ${curEmail}) > 1,` +
    `ROW() > (1 + IFERROR(MATCH(${curEmail}, ${EMAIL_ARR}, 0), 1e9))` +
    `)`;

  const LATER_PHONE_DUP =
    `AND($B2<>"",` +
    `COUNTIF(${PHONE_ARR}, ${curPhone}) > 1,` +
    `ROW() > (1 + IFERROR(MATCH(${curPhone}, ${PHONE_ARR}, 0), 1e9))` +
    `)`;

  const LATER_NAME_EMAIL_DUP =
    `AND($A2<>"",$C2<>"",` +
    `COUNTIF(${NAME_EMAIL_ARR}, ${curNameEmail}) > 1,` +
    `ROW() > (1 + IFERROR(MATCH(${curNameEmail}, ${NAME_EMAIL_ARR}, 0), 1e9))` +
    `)`;

  const LATER_NAME_PHONE_DUP =
    `AND($A2<>"",$B2<>"",` +
    `COUNTIF(${NAME_PHONE_ARR}, ${curNamePhone}) > 1,` +
    `ROW() > (1 + IFERROR(MATCH(${curNamePhone}, ${NAME_PHONE_ARR}, 0), 1e9))` +
    `)`;

  const STRICT_LATER_ONLY =
    `=OR(${LATER_EMAIL_DUP},${LATER_PHONE_DUP},${LATER_NAME_EMAIL_DUP},${LATER_NAME_PHONE_DUP})`;

  // Keep non-custom rules; replace the custom one with our strict version
  const old = sh.getConditionalFormatRules() || [];
  const kept = old.filter(r => {
    const bc = r.getBooleanCondition();
    return !(bc && bc.getCriteriaType() === SpreadsheetApp.BooleanCriteria.CUSTOM_FORMULA);
  });

  kept.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(STRICT_LATER_ONLY)
      .setBackground('#FFE5E5') // same pink
      .setRanges([dataRange])
      .build()
  );

  sh.setConditionalFormatRules(kept);
}

function cleanupPhones() {
  const ss = ss_();
  const sh = ss.getSheetByName(SHEET_CURRENT);
    if (!sh || sh.getLastRow() < 2) return;
    const rng = sh.getRange(2, 2, sh.getLastRow() - 1, 1); // column B
    const vals = rng.getValues();
    for (let i = 0; i < vals.length; i++) vals[i][0] = normalizePhone_(vals[i][0]);
    rng.setValues(vals);
  notify_('已清理手机号为纯数字');
}

/***** processed cache — ScriptProperties so triggers are safe *****/
function isProcessed_(id) {
  return PropertiesService.getScriptProperties().getProperty(PROP_CACHE_PREFIX + id) === '1';
}
function markProcessedBatch_(ids) {
  if (!ids || !ids.length) return;
  const obj = {};
  ids.forEach(id => obj[PROP_CACHE_PREFIX + id] = '1');
  PropertiesService.getScriptProperties().setProperties(obj, true);
}
function resetProcessedCache() {
  PropertiesService.getScriptProperties().deleteAllProperties();
  notify_('已清空 Gmail 已处理缓存（可全量重跑或强制同步）');
}

/***** Gmail helpers *****/
function ensureGmailLabel_(name){
  try { return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name); }
  catch(e){ return null; }
}

/***** Robust Wix parser (HTML-safe) *****/
function parseWixSubmission_(content) {
  if (!content) return null;
  const text = content
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\r/g, '');

  function pick(label){
    // Try multiple patterns for each field
    const patterns = [
      new RegExp('^\\s*' + label + '\\s*:\\s*(.+)$', 'im'),
      new RegExp('\\*\\*' + label + '\\*\\*:\\s*(.+)$', 'im'),
      new RegExp(label + '\\s*:\\s*(.+)$', 'im')
    ];
    
    for (const re of patterns) {
    const m = text.match(re);
      if (m) return m[1].trim();
    }
    return '';
  }
  
  // Try different field name variations
  const name   = pick('Full Name') || pick('Name') || pick('FullName');
  const phone  = pick('WhatsApp / Phone Number') || pick('Phone Number') || pick('Phone') || pick('WhatsApp');
  const email  = pick('Email Address') || pick('Email') || pick('EmailAddress');
  const gender = pick('Gender') || pick('Gender \\(optional\\)');
  
  // Extract CV information
  const cv = extractCV_(text);
  const cvValidation = validateCV_(cv);
  const cvPreview = createCVPreview_(cv, cvValidation.status);

  console.log('解析结果:', { name, phone, email, gender, cv, cvValidation, cvPreview });

  if (!(name || phone || email)) return null;
  return { name, phone, email, gender, cv, cvStatus: cvValidation.status, cvPreview: cvPreview };
}

/***** CV Extraction and Validation Functions *****/
function extractCV_(text) {
  if (!text) return '';
  
  console.log('CV提取 - 原始文本:', text.substring(0, 500));
  
  // First, look for direct PDF links anywhere in the text
  const pdfLinkPattern = /https?:\/\/[^\s]+\.pdf/gi;
  const pdfMatch = text.match(pdfLinkPattern);
  if (pdfMatch && pdfMatch[0]) {
    console.log('找到PDF链接:', pdfMatch[0]);
    return pdfMatch[0];
  }
  
  // Look for CV/Upload CV patterns with more flexible matching
  const cvPatterns = [
    /Upload CV[^:]*:\s*([^\n\r]+)/i,
    /CV[^:]*:\s*([^\n\r]+)/i,
    /Resume[^:]*:\s*([^\n\r]+)/i,
    /Curriculum Vitae[^:]*:\s*([^\n\r]+)/i,
    /Upload CV[^:]*\s*([^\n\r]+)/i,
    /CV[^:]*\s*([^\n\r]+)/i
  ];
  
  for (const pattern of cvPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cvText = match[1].trim();
      console.log('CV模式匹配:', cvText);
      
      // Check if it's a URL
      if (cvText.includes('http') || cvText.includes('www.')) {
        console.log('找到CV链接:', cvText);
        return cvText;
      }
      // Check if it's a file attachment indicator
      if (cvText.toLowerCase().includes('pdf') || cvText.toLowerCase().includes('doc') || cvText.toLowerCase().includes('file')) {
        console.log('找到CV文件:', cvText);
        return cvText;
      }
    }
  }
  
  // Look for any file upload indicators
  const filePattern = /https?:\/\/[^\s]*(?:pdf|doc|docx|txt)/gi;
  const fileMatch = text.match(filePattern);
  if (fileMatch && fileMatch[0]) {
    console.log('找到文件链接:', fileMatch[0]);
    return fileMatch[0];
  }
  
  // Look for any URL that might be a CV (last resort)
  const anyUrlPattern = /https?:\/\/[^\s]+/gi;
  const urlMatch = text.match(anyUrlPattern);
  if (urlMatch && urlMatch[0]) {
    console.log('找到通用链接:', urlMatch[0]);
    return urlMatch[0];
  }
  
  console.log('未找到CV信息');
  return '';
}

function validateCV_(cvUrl) {
  if (!cvUrl) return { status: 'No CV', preview: '', safe: false };
  
  try {
    console.log('验证CV文件:', cvUrl);
    
    // Check if it's a valid URL
    if (!cvUrl.startsWith('http')) {
      return { status: 'Invalid URL', preview: '', safe: false };
    }
    
    // Check file extension
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const hasValidExtension = allowedExtensions.some(ext => cvUrl.toLowerCase().includes(ext));
    
    if (!hasValidExtension) {
      return { status: 'Invalid File Type', preview: '', safe: false };
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.com$/i,
      /\.pif$/i,
      /javascript:/i,
      /data:/i
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(cvUrl));
    if (isSuspicious) {
      return { status: '⚠️ Suspicious File', preview: '', safe: false };
    }
    
    // Generate preview text
    const fileName = cvUrl.split('/').pop() || 'CV File';
    const preview = `📄 ${fileName}`;
    
    // Check if it's from a trusted domain (Wix files)
    const isTrustedDomain = cvUrl.includes('usrfiles.com') || cvUrl.includes('wix.com');
    
    return {
      status: isTrustedDomain ? '✅ Valid CV' : '⚠️ External Link',
      preview: preview,
      safe: true
    };
    
  } catch (e) {
    console.log('CV验证错误:', e.message);
    return { status: '❌ Validation Error', preview: '', safe: false };
  }
}

function createCVPreview_(cvUrl, status) {
  if (!cvUrl) return '';
  
  try {
    // Create a clickable link with status indicator
    const statusIcon = status && status.includes('✅') ? '✅' : status && status.includes('⚠️') ? '⚠️' : '❌';
    const fileName = cvUrl.split('/').pop() || 'CV';
    
    // For PDF files, try to open in browser preview instead of direct download
    let previewUrl = cvUrl;
    
    // Handle different file types for preview
    if (cvUrl.includes('.pdf')) {
      // For ALL PDFs, use Google Docs viewer to force browser preview
      if (cvUrl.includes('drive.google.com')) {
        // Google Drive files - convert to preview mode
        const fileId = cvUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (fileId) {
          previewUrl = `https://drive.google.com/file/d/${fileId[1]}/preview`;
        } else {
          // Fallback to Google Docs viewer
          previewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(cvUrl)}&embedded=true`;
        }
      } else {
        // For all other PDFs (including usrfiles.com, wix.com, etc.), use Google Docs viewer
        previewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(cvUrl)}&embedded=true`;
      }
    } else if (cvUrl.includes('.doc') || cvUrl.includes('.docx')) {
      // For Word docs, use Google Docs viewer
      previewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(cvUrl)}&embedded=true`;
    }
    
    // Create a hyperlink formula for Google Sheets
    const preview = `=HYPERLINK("${previewUrl}","${statusIcon} ${fileName}")`;
    
    console.log(`CV预览生成: ${preview}`);
    console.log(`原始URL: ${cvUrl}`);
    console.log(`预览URL: ${previewUrl}`);
    return preview;
    
  } catch (e) {
    console.log('CV预览生成错误:', e.message);
    return `❌ ${cvUrl}`;
  }
}

/***** Normalizers & misc utils *****/
function normalizeEmail_(s){ return (s||'').toString().trim().toLowerCase(); }
function normalizePhone_(s){ return (s||'').toString().replace(/\D/g, ''); } // digits only
function normalizeName_(s){ return (s||'').toString().trim().toLowerCase().replace(/\s+/g,' '); }

/***** ========== INDEXES ACROSS SHEETS (trigger-safe) ========== *****/
function buildCrossIndexes_(){
  const ss = ss_();

  const curSh = ss.getSheetByName(SHEET_CURRENT);
  const curVals = curSh && curSh.getLastRow()>1 ? curSh.getRange(2,1,curSh.getLastRow()-1, TARGET_HEADER.length).getValues() : [];
  const current = { emails:new Set(), phones:new Set(), names:new Set() };
  curVals.forEach(r=>{
    if (r[2]) current.emails.add(normalizeEmail_(r[2]));
    if (r[1]) current.phones.add(normalizePhone_(r[1]));
    if (r[0]) current.names.add(normalizeName_(r[0]));
  });

  const clean = s=>{ s.delete(''); s.delete(null); s.delete(undefined); return s; };
  ['emails','phones','names'].forEach(k=>{ clean(current[k]); });

  return { current };
}

/***** ========== REPORT GENERATION (Carimakan + KerjaVista + SEC) ========== *****/
function M(){ return { Carimakan:0, KerjaVista:0, SEC:0, NSG:0 }; }

function parseSourcesForReport(srcRaw){
  const s = String(srcRaw||'').toUpperCase();
  const out = [];
  if (/\bSEC\b/.test(s))        out.push('SEC');
  if (/\bCARIMAKAN\b/.test(s) || /\bGD\b/.test(s)) out.push('Carimakan');
  if (/\bKERJAVISTA\b/.test(s)) out.push('KerjaVista');
  if (/\bNSG\b/.test(s))        out.push('NSG');            // NEW
  return out;
}

function normAgentReport(raw){
  let disp = String(raw||"").trim();
  if (!disp) return {key:'', disp:''};
  const key = disp.toLowerCase();
  if (REPORT_ALIASES[key]) disp = REPORT_ALIASES[key];
  return { key: disp.toLowerCase(), disp };
}

/***** === REPORT GENERATION WITH NSG + OCTOBER AS "THIS MONTH" === *****/
function generateKerjaVistaSecReport(){
  console.log('=== 开始生成报告 (含 NSG) ===');

  const ss   = ss_();
  const inSh = ss.getSheetByName(REPORT_INPUT_SHEET);
  if (!inSh) throw new Error('未找到输入表：「'+REPORT_INPUT_SHEET+'」');
  const outSh= ss.getSheetByName(REPORT_OUTPUT_SHEET) || ss.insertSheet(REPORT_OUTPUT_SHEET);

  const rng  = inSh.getDataRange();
  const vals = rng.getValues();
  const disp = rng.getDisplayValues();
  const bgs  = rng.getBackgrounds();

  const hdrs = vals.shift(); disp.shift(); bgs.shift();
  function col(name){ return hdrs.indexOf(name); }
  const tsCol  = col('Timestamp');
  const tdCol  = col('Take DATE');
  const agCol  = col('Agent');
  const srcCol = col('Source');
  if ([tsCol,tdCol,agCol,srcCol].some(i=>i<0)){
    throw new Error('缺少列：Timestamp / Take DATE / Agent / Source');
  }

  const arrivals = {};                 // by Timestamp -> {Carimakan, KerjaVista, SEC, NSG}
  const takings  = {};                 // by Take DATE -> agent -> same structure
  const dupByArrivalDate = {};
  let latestTakeDate = null;
  let minSECTakeDate = null;

  const white = {}; REPORT_AGENTS.forEach(n=>white[n.toLowerCase()]=n);

  for (let i=0;i<vals.length;i++){
    if (String(bgs[i][0]).toLowerCase() === REPORT_SKIP_COLOR.toLowerCase()) continue;

    const arrDate = parseDateSmart(vals[i][tsCol], disp[i][tsCol]);
    const sources = parseSourcesForReport(vals[i][srcCol]);

    // Duplicate counter (blank Source)
    const isDupRow = String(vals[i][srcCol]||'').trim()==='';
    if (isDupRow && arrDate){
      const key = ymd(arrDate);
      dupByArrivalDate[key] = (dupByArrivalDate[key]||0) + 1;
    }

    if (sources.length && arrDate){
      const aKey = ymd(arrDate);
      if (!arrivals[aKey]) arrivals[aKey] = M();
      sources.forEach(s=>arrivals[aKey][s]++);
    }

    // TAKINGS (whitelist only)
    const ag = normAgentReport(vals[i][agCol]);
    if (!ag.key || !white[ag.key]) continue;

    const takeDate = parseDateSmart(vals[i][tdCol], disp[i][tdCol]);
    if (!takeDate) continue;

    const tKey = ymd(takeDate);
    if (!takings[tKey]) takings[tKey] = {};
    if (!takings[tKey][ag.key]) takings[tKey][ag.key] = M();
    sources.forEach(s=>takings[tKey][ag.key][s]++);

    if (!latestTakeDate || takeDate > latestTakeDate) latestTakeDate = takeDate;
    if (sources.indexOf('SEC')>=0){
      if (!minSECTakeDate || takeDate < minSECTakeDate) minSECTakeDate = takeDate;
    }
  }

  const takDates   = Object.keys(takings).sort();
  const arrDates   = Object.keys(arrivals).sort();
  const agentKeys  = REPORT_AGENTS.map(n=>n.toLowerCase());
  const agentDisp  = {}; REPORT_AGENTS.forEach(n=>agentDisp[n.toLowerCase()] = n);

  // ===== Month forcing: make "This Month" = October (current year) =====
  const now  = new Date();
  const monY = now.getFullYear();
  const monM = 9; // October (0-based)

  // summaries (takings only)
  const summaryAll = {}, summaryMon = {};
  takDates.forEach(dKey=>{
    const [yy,mm,dd]=dKey.split('-').map(Number);
    const dt = new Date(yy, mm-1, dd);
    const inMonth = (dt.getFullYear()===monY && dt.getMonth()===monM);
    const perA = takings[dKey] || {};

    agentKeys.forEach(ak=>{
      const rec = perA[ak] || M();
      const secAdj = (minSECTakeDate && dt < minSECTakeDate) ? 0 : rec.SEC;

      if (!summaryAll[ak]) summaryAll[ak] = M();
      summaryAll[ak].Carimakan  += rec.Carimakan;
      summaryAll[ak].KerjaVista += rec.KerjaVista;
      summaryAll[ak].SEC        += secAdj;
      summaryAll[ak].NSG        += rec.NSG;

      if (inMonth){
        if (!summaryMon[ak]) summaryMon[ak] = M();
        summaryMon[ak].Carimakan  += rec.Carimakan;
        summaryMon[ak].KerjaVista += rec.KerjaVista;
        summaryMon[ak].SEC        += secAdj;
        summaryMon[ak].NSG        += rec.NSG;
      }
    });
  });
  agentKeys.forEach(ak=>{ if(!summaryMon[ak]) summaryMon[ak]=M(); });

  // duplicate counts
  const dupAll = Object.values(dupByArrivalDate).reduce((a,b)=>a+b,0);
  let dupThisMonth = 0;
  Object.keys(dupByArrivalDate).forEach(k=>{
    const [yy,mm,dd] = k.split('-').map(Number);
    const d = new Date(yy,mm-1,dd);
    if (d.getFullYear()===monY && d.getMonth()===monM) dupThisMonth += dupByArrivalDate[k];
  });

  // ===== write report =====
  const out = outSh;
  out.clear();
  out.setFrozenRows(1);
  out.setFrozenColumns(7);

  // 1) All Time (takings) — A:F (now 6 cols: label + 4 sources + Total)
  out.getRange(1,1,1,6)
     .setValues([["All Time","Carimakan Leads","KerjaVista Leads","SEC Leads","NSG Leads","Total"]])
     .setFontWeight("bold").setBackground(REPORT_PALETTES.header1);

  const allRows = agentKeys.map(ak=>{
    const nm = agentDisp[ak], s = summaryAll[ak]||M();
    return [nm, s.Carimakan, s.KerjaVista, s.SEC, s.NSG, s.Carimakan+s.KerjaVista+s.SEC+s.NSG];
  });
  if (allRows.length){
    out.getRange(2,1,allRows.length,6).setValues(allRows)
      .setBackgrounds(allRows.map(r=>{
        const c=REPORT_AGENT_COLORS[r[0]]||"#FFFFFF";
        return [c,c,c,c,c,c];
      }));
    out.getRange(2,2,allRows.length,4).setNumberFormat("#,##0");
    out.getRange(2,6,allRows.length,1).setNumberFormat("#,##0");
  }
  const atRow = 2+allRows.length;
  const AT = allRows.reduce((acc,r)=>[acc[0]+r[1], acc[1]+r[2], acc[2]+r[3], acc[3]+r[4]], [0,0,0,0]);
  out.getRange(atRow,1,1,6)
     .setValues([["Grand Total", AT[0], AT[1], AT[2], AT[3], AT[0]+AT[1]+AT[2]+AT[3]]])
     .setFontWeight("bold").setBackground(REPORT_PALETTES.totalBg);
  out.getRange(atRow,2,1,5).setNumberFormat("#,##0");

  // All Time Duplicates row
  out.getRange(atRow+1,1,1,6)
     .setValues([["Duplicates (重复)", "", "", "", "", dupAll]])
     .setFontStyle("italic");
  out.getRange(atRow+1,6).setNumberFormat("#,##0");

  // 2) This Month (takings) — I:N (6 cols)
  out.getRange(1,REPORT_THIS_MONTH_START_COL,1,6)
     .setValues([["This Month (October)","Carimakan Leads","KerjaVista Leads","SEC Leads","NSG Leads","Total"]])
     .setFontWeight("bold").setBackground(REPORT_PALETTES.header2);

  const monRows = agentKeys.map(ak=>{
    const nm = agentDisp[ak], s = summaryMon[ak]||M();
    return [nm, s.Carimakan, s.KerjaVista, s.SEC, s.NSG, s.Carimakan+s.KerjaVista+s.SEC+s.NSG];
  });
  if (monRows.length){
    out.getRange(2,REPORT_THIS_MONTH_START_COL,monRows.length,6).setValues(monRows)
      .setBackgrounds(monRows.map(r=>{
        const c=REPORT_AGENT_COLORS[r[0]]||"#FFFFFF";
        return [c,c,c,c,c,c];
      }));
    out.getRange(2,REPORT_THIS_MONTH_START_COL+1,monRows.length,4).setNumberFormat("#,##0");
    out.getRange(2,REPORT_THIS_MONTH_START_COL+5,monRows.length,1).setNumberFormat("#,##0");
  }
  const mtRow = 2+monRows.length;
  const MT = monRows.reduce((acc,r)=>[acc[0]+r[1], acc[1]+r[2], acc[2]+r[3], acc[3]+r[4]], [0,0,0,0]);
  out.getRange(mtRow,REPORT_THIS_MONTH_START_COL,1,6)
     .setValues([["Grand Total", MT[0], MT[1], MT[2], MT[3], MT[0]+MT[1]+MT[2]+MT[3]]])
     .setFontWeight("bold").setBackground(REPORT_PALETTES.totalBg);
  out.getRange(mtRow,REPORT_THIS_MONTH_START_COL+1,1,5).setNumberFormat("#,##0");

  // This Month Duplicates row
  out.getRange(mtRow+1,REPORT_THIS_MONTH_START_COL,1,6)
     .setValues([["Duplicates (重复)", "", "", "", "", dupThisMonth]])
     .setFontStyle("italic");
  out.getRange(mtRow+1,REPORT_THIS_MONTH_START_COL+5).setNumberFormat("#,##0");

  // 3) Daily ARRIVALS — bottom-left (Date + 4 sources + Total = 6 cols)
  const sectionA = 2 + Math.max(allRows.length, monRows.length) + 3; // +3 leaves space for dup row
  out.getRange(sectionA,1,1,6)
     .setValues([["Date (Timestamp)","Carimakan Leads","KerjaVista Leads","SEC Leads","NSG Leads","Total"]])
     .setFontWeight("bold").setBackground(REPORT_PALETTES.sectionA);

  const dailyArr = arrDates.map(dKey=>{
    const rec = arrivals[dKey]||M();
    return [new Date(dKey), rec.Carimakan, rec.KerjaVista, rec.SEC, rec.NSG, rec.Carimakan+rec.KerjaVista+rec.SEC+rec.NSG];
  });
  if (dailyArr.length){
    out.getRange(sectionA+1,1,dailyArr.length,6).setValues(dailyArr);
    out.getRange(sectionA+1,1,dailyArr.length,1).setNumberFormat("dd/MM/yyyy");
    out.getRange(sectionA+1,2,dailyArr.length,4).setNumberFormat("#,##0");
    out.getRange(sectionA+1,6,dailyArr.length,1).setNumberFormat("#,##0");
  }
  const daRow = sectionA+1+dailyArr.length;
  const AR = dailyArr.reduce((acc,r)=>[acc[0]+r[1], acc[1]+r[2], acc[2]+r[3], acc[3]+r[4]], [0,0,0,0]);
  out.getRange(daRow,1,1,6)
     .setValues([["Grand Total", AR[0], AR[1], AR[2], AR[3], AR[0]+AR[1]+AR[2]+AR[3]]])
     .setFontWeight("bold").setBackground(REPORT_PALETTES.totalBg);
  out.getRange(daRow,2,1,5).setNumberFormat("#,##0");

  // 4) Daily TAKINGS — bottom-right
  // (Date, Agent, Carimakan Taken, KerjaVista Taken, SEC Taken, NSG Taken, Cumulative)
  out.getRange(sectionA,8,1,7)
    .setValues([["Date (Take DATE)","Agent","Carimakan Taken","KerjaVista Taken","SEC Taken","NSG Taken","Cumulative"]])
    .setFontWeight("bold").setBackground(REPORT_PALETTES.sectionB);

  let rows = [], cum = {};
  takDates.forEach(function(dKey){
    const [yy, mm, dd] = dKey.split('-').map(Number);
    const dt = new Date(yy, mm - 1, dd);
    const perA = takings[dKey] || {};
    agentKeys.forEach(function(ak){
      const rec = perA[ak] || M();
      const secAdj = (minSECTakeDate && dt < minSECTakeDate) ? 0 : rec.SEC;
      const carimakan = rec.Carimakan;
      const kerjavista = rec.KerjaVista;
      const nsg = rec.NSG;
      const tot = carimakan + kerjavista + secAdj + nsg;
      if (tot > 0){
        cum[ak] = (cum[ak]||0) + tot;
        rows.push([dt, agentDisp[ak], carimakan, kerjavista, secAdj, nsg, cum[ak]]);
      }
    });
  });

  if (rows.length){
    const rr = out.getRange(sectionA + 1, 8, rows.length, 7).setValues(rows);
    rr.setBackgrounds(rows.map(function(r){
      const c = REPORT_AGENT_COLORS[r[1]] || "#FFFFFF";
      return [c,c,c,c,c,c,c];
    }));
    out.getRange(sectionA + 1, 8, rows.length, 1).setNumberFormat("dd/MM/yyyy");
    out.getRange(sectionA + 1, 10, rows.length, 5).setNumberFormat("#,##0");
  }

  SpreadsheetApp.flush();
  notify_("『报告』已生成（Carimakan + KerjaVista + SEC + NSG；附重复计数｜本月=10月）");
  console.log('=== 报告生成完成 (NSG + 十月) ===');
}


// Helper functions for report
function ymd(d){
  return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
}

function parseDateSmart(rawVal, displayVal){
  if (rawVal instanceof Date && !isNaN(rawVal)) {
    return new Date(rawVal.getFullYear(), rawVal.getMonth(), rawVal.getDate());
  }
  var s = String(displayVal || rawVal || "").trim();
  if (!s) return null;
  var m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/); // dd/MM/yyyy
  if (m){ var d=new Date(+m[3], +m[2]-1, +m[1]); return isNaN(d)?null:d; }
  var m2= s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/); // yyyy/MM/dd
  if (m2){ var d2=new Date(+m2[1], +m2[2]-1, +m2[3]); return isNaN(d2)?null:d2; }
  return null;
}