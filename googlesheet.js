/**
 * Auto-runs when Google Sheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Daily Reports')
    .addItem('Rebuild Daily Summary', 'rebuildDaily3MetricSummary')
    .addToUi();
  
  // Auto-run the summary when sheet opens
  rebuildDaily3MetricSummary();
}

/**
 * Builds a new daily table (日期 | 费率合计 | 总返款(MYR) | 总数) in the SAME sheet,
 * replacing the old daily summary block if present.
 *
 * From raw transactions only (all blocks that start with "日期 ... 总数").
 * Window: 2025/10/01 → today.
 */
function rebuildDaily3MetricSummary() {
    const SHEET = '10月总进款';     // your sheet name
    const START_STR = '2025/10/01';  // start date
    const TZ = Session.getScriptTimeZone() || 'Asia/Kuala_Lumpur';
  
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET);
    if (!sh) throw new Error(`Sheet "${SHEET}" not found.`);
  
    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();
    const grid = sh.getRange(1, 1, lastRow, lastCol).getValues();
  
    // 1) Find the transaction header row (row with the block headers)
    const txHeaderRow = findTxHeaderRow_(grid);
    if (txHeaderRow == null) throw new Error('Could not find the transaction header row.');
  
    // 2) Find where the existing daily summary (old block) starts; we’ll replace it
    const summaryHeaderRow = findDailySummaryHeaderRow_(grid, txHeaderRow + 1);
  
    // All transaction rows end just BEFORE the summary header (if present)
    const txEndRow = summaryHeaderRow != null ? summaryHeaderRow - 1 : lastRow;
  
    // 3) Find all block start columns on the header row (each "日期" starts a block)
    // There should be 4 agents: 杰晟, 元宵, 百万, 东昊
    const blockStarts = [];
    for (let c = 0; c < lastCol; c++) {
      if (String(grid[txHeaderRow][c]).trim() === '日期') {
        blockStarts.push(c + 1); // store 1-based
        console.log(`Found transaction block starting at column ${c + 1}`);
      }
    }
    if (!blockStarts.length) throw new Error('No transaction blocks detected.');
    console.log(`Found ${blockStarts.length} transaction blocks:`, blockStarts);
    
    // Find all "总数" columns - these are the USDT accumulated totals
    // Based on CSV structure: 杰晟(I), 元宵(S), 百万(AC), 东昊(AM)
    const totalColumns = [];
    for (let c = 0; c < lastCol; c++) {
      if (String(grid[txHeaderRow][c]).trim() === '总数') {
        totalColumns.push(c + 1); // store 1-based
      }
    }
    
    console.log('Found total columns:', totalColumns);
  
    // Offsets inside each block (relative to its "日期" column)
    // A:日期(+0), C:进款(+2), E:费率(+4), F:换u(+5), G:出款(MYR)(+6), H:出款(USDT)(+7), I:总数(+8)
    const OFF = { DATE:0, DEPOSIT:2, FEE:4, USDT_IN:5, WMYR:6, USDT_OUT:7, TOTAL:8 };
  
    // 4) Aggregate per day from raw transactions
    const startDate = parseYMD_(START_STR);
    const today = new Date();
    normalize_(startDate); normalize_(today);

    /** key -> { fee, wmyr, deposit, total } */
    const perDay = new Map();
    /** key -> { lastTotal } - track daily USDT totals per date */
    const lastTotals = new Map();
    /** key -> { usdtRefund } - track USDT refunds converted from MYR refunds */
    const usdtRefunds = new Map();
    /** key -> { usdtOutflow } - track daily USDT outflows */
    const usdtOutflows = new Map();
  
    for (let r = txHeaderRow + 1; r <= txEndRow; r++) {
      for (const base of blockStarts) {
        const dVal = get_(grid, r + 1, base + OFF.DATE);
        if (!isDateLike_(dVal)) continue;
        const d = toDate_(dVal); if (!d) continue;
        normalize_(d);
        if (d < startDate || d > today) continue;

        const fee = toNum_(get_(grid, r + 1, base + OFF.FEE));
        const wmyr = toNum_(get_(grid, r + 1, base + OFF.WMYR));
        const deposit = toNum_(get_(grid, r + 1, base + OFF.DEPOSIT));

        const key = Utilities.formatDate(d, TZ, 'yyyy/MM/dd');
        const agg = perDay.get(key) || { fee:0, wmyr:0, deposit:0, total:0 };
        agg.fee += fee;
        agg.wmyr += wmyr;
        agg.deposit += deposit;
        
        perDay.set(key, agg);
      }
    }
    
    // Process USDT daily amounts - sum up daily 换u (USDT inflow) for each date.
    // Handle blank-date continuation rows by carrying forward the last seen date per agent block.
    const dailyUsdtIn = new Map(); // key: yyyy/MM/dd -> sum(换u)
    const dailyUsdtOut = new Map(); // key: yyyy/MM/dd -> sum(出款USDT)
    
    for (let agentIndex = 0; agentIndex < blockStarts.length; agentIndex++) {
      const base = blockStarts[agentIndex];
      let carryDate = null;
      for (let r = txHeaderRow + 1; r <= txEndRow; r++) {
        const rawDate = get_(grid, r + 1, base + OFF.DATE);
        if (isDateLike_(rawDate)) {
          const d = toDate_(rawDate);
          if (d) {
            normalize_(d);
            if (d >= startDate && d <= today) carryDate = d; else carryDate = null;
          }
        }
        if (!carryDate) continue; // skip rows until a valid date is established
        const dateKey = Utilities.formatDate(carryDate, TZ, 'yyyy/MM/dd');
        
        // Sum USDT inflow (换u) - include all values (positive and negative)
        const usdtIn = toNum_(get_(grid, r + 1, base + OFF.USDT_IN));
        if (usdtIn !== 0) { // Include both positive and negative values
          const prev = dailyUsdtIn.get(dateKey) || 0;
          dailyUsdtIn.set(dateKey, prev + usdtIn);
        }
        
        // Sum USDT outflow (出款USDT) - include all values
        const usdtOut = toNum_(get_(grid, r + 1, base + OFF.USDT_OUT));
        if (usdtOut !== 0) {
          const prev = dailyUsdtOut.get(dateKey) || 0;
          dailyUsdtOut.set(dateKey, prev + usdtOut);
        }
      }
    }

    // Assign to lastTotals for downstream rendering
    for (const [date, total] of dailyUsdtIn.entries()) {
      lastTotals.set(date, total);
    }
    
    // Assign USDT outflows
    for (const [date, total] of dailyUsdtOut.entries()) {
      usdtOutflows.set(date, total);
    }
  
    // Calculate USDT refunds by converting MYR refunds to USDT using rate 4.07 (MYR per 1 USDT)
    const MYR_TO_USDT_RATE = 4.07;
    for (const [date, data] of perDay.entries()) {
      const myrRefund = data.wmyr; // Total MYR refund for this date
      const usdtRefund = myrRefund / MYR_TO_USDT_RATE; // Convert MYR -> USDT
      usdtRefunds.set(date, usdtRefund);
      console.log(`Date ${date}: MYR refund ${myrRefund} -> USDT refund ${usdtRefund}`);
    }
    
    // Debug: Log the daily USDT amounts we found
    console.log('Daily USDT amounts found (sum of 换u):', Array.from(lastTotals.entries()));
    console.log('Daily USDT outflows found (sum of 出款USDT):', Array.from(usdtOutflows.entries()));
    console.log('Daily USDT refunds found (MYR refund * 4.07):', Array.from(usdtRefunds.entries()));
    
    // 5) Build a continuous daily list (fills missing days with 0)
    const outRows = [];
    let totalNetUSDT = 0; // Accumulate net USDT to sync with E2 (U)
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const key = Utilities.formatDate(d, TZ, 'yyyy/MM/dd');
      const a = perDay.get(key) || { fee:0, wmyr:0, deposit:0, total:0 };
      // Get the daily USDT amounts
      const rawDailyUSDT = lastTotals.get(key) || 0; // 总进款（USDT）
      const rawUsdtOutflow = usdtOutflows.get(key) || 0; // 出款（USDT）
      const usdtRefund = usdtRefunds.get(key) || 0; // 总返款（USDT）

      // Special override for 2025/10/08 and 2025/10/09 as per user request:
      // E列(总进款USDT): 使用 C列(扣除车队后总进款（费率）) / 4.5 （MYR→USDT）
      // F列(出款USDT): 使用 D列(总返款（MYR）) / 4.07 （MYR→USDT）
      const isOverride = (key === '2025/10/08' || key === '2025/10/09');
      const overrideInUSDT = a.fee / 4.5; // E82= C82/4.5, E83= C83/4.5
      const overrideOutUSDT = a.wmyr / 4.07;
      const dailyUSDT = isOverride ? overrideInUSDT : rawDailyUSDT;
      const usdtOutflow = isOverride ? overrideOutUSDT : rawUsdtOutflow;
      const netUSDT = dailyUSDT - usdtOutflow; // 净USDT（按需求：只扣出款USDT）

      console.log(`Date ${key}: USDT In=${dailyUSDT}, Out=${usdtOutflow}, Refund=${usdtRefund}, Net=${netUSDT}`);

      // Format numbers as strings to avoid typed column issues
      // New order: 总进款（MYR）> 扣除车队后总进款（费率）> 总返款（MYR）> 总进款（USDT）> 出款（USDT）> 净USDT
      outRows.push([
        key, 
        a.deposit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        a.fee.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        a.wmyr.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        dailyUSDT.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        usdtOutflow.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        netUSDT.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
      ]);

      totalNetUSDT += netUSDT;
    }
  
    // 6) Decide where to write: replace old summary header row if found,
    // otherwise write 2 rows below the last transaction row.
    let writeRow;
    if (summaryHeaderRow != null) {
      writeRow = summaryHeaderRow + 1; // we'll write our own header at (summaryHeaderRow+1)
      // Clear old summary area completely - remove all formatting and content
      try {
        const clearRange = sh.getRange(writeRow, 1, 600, 10);
        clearRange.clearContent();
        clearRange.clearFormat();
        clearRange.clearDataValidations();
        clearRange.clearNote();
      } catch (e) {
        console.log('Could not clear old summary area: ' + e.message);
        // Try clearing a smaller area
        try {
          const smallRange = sh.getRange(writeRow, 1, 100, 10);
          smallRange.clearContent();
          smallRange.clearFormat();
          smallRange.clearDataValidations();
          smallRange.clearNote();
        } catch (e2) {
          console.log('Could not clear smaller area either: ' + e2.message);
        }
      }
    } else {
      writeRow = txEndRow + 2;
    }
  
    // Header
    try {
      sh.getRange(writeRow, 1, 1, 7).setValues([
        ['日期', '总进款（MYR）', '扣除车队后总进款（费率）', '总返款（MYR）', '总进款（USDT）', '出款（USDT）', '净USDT']
      ]).setFontWeight('bold').setBackground('#e8f5e9');
    } catch (e) {
      console.log('Could not format header: ' + e.message);
      // Try setting values without formatting
      try {
        sh.getRange(writeRow, 1, 1, 7).setValues([
          ['日期', '总进款（MYR）', '扣除车队后总进款（费率）', '总返款（MYR）', '总进款（USDT）', '出款（USDT）', '净USDT']
        ]);
      } catch (e2) {
        console.log('Could not set header values: ' + e2.message);
      }
    }
  
    // Data - numbers are already formatted as strings, so no need for number formatting
    if (outRows.length) {
      sh.getRange(writeRow + 1, 1, outRows.length, 7).setValues(outRows);
    }

    // Note: We intentionally do not touch E2 (top summary U) per user request.
  
    try {
      sh.autoResizeColumns(1, 7);
      // Auto-resize rows to fit content
      if (outRows.length > 0) {
        const dataRange = sh.getRange(writeRow + 1, 1, outRows.length, 7);
        dataRange.setWrap(true);
        dataRange.setVerticalAlignment('middle');
        // Set minimum row height
        for (let i = 1; i <= outRows.length; i++) {
          sh.setRowHeight(writeRow + i, 25);
        }
      }
    } catch (e) {
      console.log('Could not auto-resize columns/rows: ' + e.message);
    }
  
    /* ------------- helpers ------------- */
    function findTxHeaderRow_(arr) {
      const limit = Math.min(arr.length, 120);
      for (let r = 0; r < limit; r++) {
        for (let c = 0; c < arr[r].length - 8; c++) {
          if (String(arr[r][c]).trim() === '日期' &&
              String(arr[r][c+1]).toString().includes('客户') &&
              String(arr[r][c+2]).toString().includes('进款') &&
              String(arr[r][c+4]).toString().includes('费率') &&
              String(arr[r][c+8]).toString().includes('总数')) {
            return r;
          }
        }
      }
      return null;
    }
    function findDailySummaryHeaderRow_(arr, fromRow) {
      for (let r = fromRow; r < arr.length; r++) {
        const a = String(arr[r][0] ?? '').trim();
        const b = String(arr[r][1] ?? '').trim();
        if (a === '日期' && (/总进款/.test(b) || /Date/i.test(a))) return r; // old block’s header
      }
      return null;
    }
    function get_(arr, r1, c1){ const r=r1-1, c=c1-1; if (r<0||r>=arr.length||c<0||c>=arr[r].length) return null; return arr[r][c]; }
    function isDateLike_(v){ return v instanceof Date || /^\s*\d{4}[-/]\d{1,2}[-/]\d{1,2}\s*$/.test(String(v||'')); }
    function toDate_(v){
      if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
      if (typeof v === 'number') return new Date(1899, 11, 30 + v); // serial fallback
      const m = String(v||'').trim().replace(/-/g,'/').match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
      return m ? new Date(+m[1], +m[2]-1, +m[3]) : null;
    }
    function parseYMD_(s){
      const m = String(s||'').trim().replace(/-/g,'/').match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
      return m ? new Date(+m[1], +m[2]-1, +m[3]) : null;
    }
    function normalize_(d){ d.setHours(0,0,0,0); }
    function toNum_(v){
      if (v == null || v === '' || v === '-') return 0;
      if (typeof v === 'number') return v;
      const n = parseFloat(String(v).replace(/[, ]/g,''));
      return isNaN(n) ? 0 : n;
    }
  }
  