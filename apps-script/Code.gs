/**
 * PRAJNA CO-HAB — lead capture backend (Google Sheets + Apps Script)
 *
 * ONE JOB: every form on the site lands in a sheet and mails the owner.
 * Cost: zero. No server, no database, no third party.
 *
 * SETUP (10 minutes, free)
 *   1. sheets.new, name it "Prajna Data"
 *   2. Extensions > Apps Script, paste this file over the sample code
 *   3. Run setup() once and authorise
 *   4. Deploy > New deployment > Web app
 *        Execute as: Me      Who has access: Anyone
 *   5. Copy the /exec URL into config.js as `endpoint`
 *   Full walkthrough with the test steps: LEAD-CAPTURE-SETUP.md
 *
 * TABS: Inquiries · Feedback · Board · Visits · Digest · Stats · Errors
 *   Board posts stay hidden until Approved = Yes.
 *   Every row is timestamped in IST.
 *
 * WHAT IT REFUSES TO DO
 *   - accept a submission from a filled honeypot
 *   - store the same submission twice
 *   - write a user string that Sheets would run as a formula
 *   - hand a stack trace back to the browser
 *   - delete rows without archiving them first
 */

var TZ = 'Asia/Kolkata';
var MAX_ROWS = 50000;          // then archive the oldest and trim
var TRIM_TO = 40000;
var RATE_PER_MIN = 8;          // hard cap across all clients
var MAX_MSG = 2000;

var TABS = {
  inquiry:  'Inquiries',
  feedback: 'Feedback',
  board:    'Board',
  visit:    'Visits'
};

var HEADERS = {
  Inquiries: ['Time', 'Name', 'Email', 'Phone', 'Interest', 'Move-in', 'Budget', 'Message', 'Source', 'Referrer', 'Status', 'ID'],
  Feedback:  ['Time', 'Name', 'Role', 'Stay', 'Rating', 'Message', 'Email', 'Source', 'Published', 'ID'],
  Board:     ['Time', 'Name', 'Topic', 'Message', 'Email', 'Source', 'Approved', 'ID'],
  Visits:    ['Time', 'Event', 'Page', 'Referrer', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Screen', 'Language', 'Detail'],
  Errors:    ['Time', 'Kind', 'Detail'],
  Digest:    ['Time', 'Inquiries', 'Feedback', 'Board awaiting approval']
};

/* ---------------------------------------------------------------- setup */
function setup() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(HEADERS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS[name]);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, HEADERS[name].length).setFontWeight('bold').setBackground('#f3ecdf');
      sh.setColumnWidth(1, 150);
    }
  });
  ensureTriggers_();                       // 9pm daily digest, re-armed every run
  var url = ss.getUrl();
  Logger.log('setup ok. Sheet: ' + url);
  return 'setup ok';
}

function owner_() {
  return PropertiesService.getScriptProperties().getProperty('DIGEST_TO')
    || Session.getEffectiveUser().getEmail();
}

/* ------------------------------------------------------------------ get */
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.type === 'board') return json({ ok: true, posts: boardFeed() });
    if (p.type === 'ping') return json({ ok: true, t: stamp() });
    return json({ ok: true, service: 'prajna-capture', version: 4 });
  } catch (err) {
    logError_('doGet', err);
    return json({ ok: false, error: 'read_failed' });
  }
}

/* ----------------------------------------------------------------- post */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var d = parseBody_(e);

    /* Honeypot. A human never sees this field. A bot fills it and gets a
       success answer, so it has nothing to learn from retrying. */
    if (d.company) return json({ ok: true, dropped: true });

    var kind = String(d.type || 'inquiry');

    if (kind === 'visit') {
      lock.waitLock(20000);
      logVisit_(d);
      rebuildStats_();
      return json({ ok: true });
    }

    if (!TABS[kind]) return json({ ok: false, error: 'unknown_type' });
    if (!allow_()) return json({ ok: false, error: 'busy' });

    var problem = validate_(kind, d);
    if (problem) return json({ ok: false, error: problem });

    /* idempotency: the browser sends an id; a retry after a slow success
       must not write the lead twice */
    var id = String(d.id || '').slice(0, 60);
    var cache = CacheService.getScriptCache();
    if (id && cache.get('id:' + id)) return json({ ok: true, duplicate: true });

    var row = clean_(kind, d);

    lock.waitLock(20000);
    var wrote = append_(TABS[kind], row);
    if (!wrote) return json({ ok: false, error: 'sheet_mismatch' });
    if (id) cache.put('id:' + id, '1', 21600);

    try { notify_(kind, d, row); } catch (err) { logError_('notify ' + kind, err); }
    return json({ ok: true, id: id, t: stamp() });

  } catch (err) {
    logError_('doPost', err);
    return json({ ok: false, error: 'save_failed' });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

/* ---------------------------------------------------------------- input */
function parseBody_(e) {
  var raw = (e && e.postData && e.postData.contents) || '';
  if (raw) {
    var t = String(raw).trim();
    if (t.charAt(0) === '{') {
      var parsed = JSON.parse(t);
      return parsed && typeof parsed === 'object' ? parsed : {};
    }
    var out = {};
    t.split('&').forEach(function (pair) {
      var bits = pair.split('=');
      if (bits[0]) out[decodeURIComponent(bits[0])] = decodeURIComponent((bits[1] || '').replace(/\+/g, ' '));
    });
    return out;
  }
  return (e && e.parameter) || {};
}

function str_(v, max) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || MAX_MSG);
}

/* Sheets evaluates any cell starting with = + - @ (or tab/CR). A name of
   =IMPORTXML("http://x") would fetch on open, on the owner's sheet. Prefix
   an apostrophe so it stores as the literal text the person typed. */
function cell_(v, max) {
  var s = str_(v, max);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function emailOk_(v) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(str_(v, 160));
}

function validate_(kind, d) {
  if (kind === 'inquiry') {
    if (!str_(d.name)) return 'name_required';
    if (!emailOk_(d.email)) return 'email_required';
    return '';
  }
  if (kind === 'feedback') {
    var r = Number(d.rating);
    if (!(r >= 1 && r <= 5)) return 'rating_required';
    if (!str_(d.message)) return 'message_required';
    if (d.email && !emailOk_(d.email)) return 'email_invalid';
    return '';
  }
  if (kind === 'board') {
    if (!str_(d.name)) return 'name_required';
    if (!str_(d.message)) return 'message_required';
    if (d.email && !emailOk_(d.email)) return 'email_invalid';
    return '';
  }
  return '';
}

function clean_(kind, d) {
  var now = new Date();
  if (kind === 'feedback') {
    return [now, cell_(d.name, 60) || 'Anonymous', cell_(d.role, 40), cell_(d.stay, 40),
      Math.max(1, Math.min(5, Number(d.rating))), cell_(d.message, 1200),
      cell_(d.email, 160), cell_(d.page, 60), false, cell_(d.id, 60)];
  }
  if (kind === 'board') {
    return [now, cell_(d.name, 60), cell_(d.topic, 40) || 'General', cell_(d.message, 800),
      cell_(d.email, 160), cell_(d.page, 60), false, cell_(d.id, 60)];
  }
  return [now, cell_(d.name, 60), cell_(d.email, 160), cell_(d.phone, 20),
    cell_(d.interest, 40), cell_(d.movein, 40), cell_(d.budget, 20),
    cell_(d.message, 1200), cell_(d.page, 80) || 'website', cell_(d.ref, 200),
    'New', cell_(d.id, 60)];
}

/* ---------------------------------------------------------------- sheet */
function tab_(name) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(HEADERS[name]);
    sh.setFrozenRows(1);
  }
  return sh;
}

/* Positional append is only safe while the header row still matches. If the
   owner inserts or renames a column, every later row would silently land in
   the wrong place, so refuse and log instead. */
function headerOk_(sh, name) {
  var want = HEADERS[name];
  var got = sh.getRange(1, 1, 1, Math.max(want.length, sh.getLastColumn())).getValues()[0];
  for (var i = 0; i < want.length; i++) {
    if (String(got[i] || '').trim() !== want[i]) return false;
  }
  return true;
}

function append_(name, row) {
  var sh = tab_(name);
  if (!headerOk_(sh, name)) {
    logError_('header mismatch', name + ' expects: ' + HEADERS[name].join(' | '));
    return false;
  }
  sh.appendRow(row);
  trim_(sh, name);
  return true;
}

function trim_(sh, name) {
  var rows = sh.getLastRow();
  if (rows <= MAX_ROWS) return;
  var drop = rows - TRIM_TO;
  if (drop <= 0) return;
  /* archive first. A bare deleteRows is a silent, permanent loss. */
  var archive = sh.getParent().insertSheet(name + ' archive ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HHmm'));
  archive.appendRow(HEADERS[name] || []);
  var copy = sh.getRange(2, 1, drop, sh.getLastColumn()).getValues();
  archive.getRange(2, 1, copy.length, copy[0].length).setValues(copy);
  sh.deleteRows(2, drop);
}

/* --------------------------------------------------------------- notify */
function notify_(kind, d, row) {
  var to = owner_();
  if (!to || !emailOk_(to)) return;
  var subject, body;
  if (kind === 'feedback') {
    var stars = Number(row[4]);
    subject = 'Feedback ' + stars + '/5 from ' + row[1] + (stars <= 2 ? ' — worth a call' : '');
    body = ['Resident feedback landed.', '',
      'Rating: ' + stars + '/5', 'Name: ' + row[1], 'Role: ' + row[2],
      'Stayed: ' + (row[3] || 'not given'), 'Email: ' + (row[6] || 'not given'), '',
      str_(d.message, 1200), '',
      'Nothing here is published until you ask them.'].join('\n');
  } else if (kind === 'board') {
    subject = 'Pit post waiting: ' + (row[2] || 'general');
    body = ['A board post is waiting for approval.', '',
      'Name: ' + row[1], 'Topic: ' + row[2], 'Email: ' + (row[4] || 'not given'), '',
      str_(d.message, 800), '',
      'Set Approved to Yes in the Board tab to publish it.'].join('\n');
  } else {
    subject = 'Enquiry: ' + (row[1] || 'site') + (row[5] ? ' · ' + row[5] : '');
    body = ['New room enquiry.', '',
      'Name: ' + row[1], 'Email: ' + row[2], 'Phone: ' + (row[3] || 'not given'),
      'Interest: ' + (row[4] || 'not given'), 'Move-in: ' + (row[5] || 'not given'),
      'Budget: ' + (row[6] || 'not given'), '',
      'Message:', (row[7] || '(none)'), '',
      'Page: ' + row[8], '', 'Reply straight to this mail, it goes to the visitor.'].join('\n');
  }
  MailApp.sendEmail({
    to: to,
    subject: '[Prajna] ' + subject,
    body: body,
    replyTo: emailOk_(d.email) ? str_(d.email, 160) : to
  });
}

/* ---------------------------------------------------------- visits */
function logVisit_(d) {
  try {
    var sh = tab_('Visits');
    if (!headerOk_(sh, 'Visits')) { return; }
    sh.appendRow([new Date(), cell_(d.event, 40), cell_(d.page, 80), cell_(d.ref, 200),
      cell_(d.src, 60), cell_(d.med, 60), cell_(d.cmp, 60), cell_(d.screen, 20),
      cell_(d.lang, 20), cell_(d.extra, 200)]);
    trim_(sh, 'Visits');
  } catch (err) { logError_('visit', err); }
}

function rebuildStats_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('Visits');
  var st = ss.getSheetByName('Stats') || ss.insertSheet('Stats');
  if (st.getLastRow() > 0) st.clearContents();
  st.appendRow(['Signal', 'Key', 'Count', 'Meaning']);
  if (!sh || sh.getLastRow() < 2) return;
  var vals = sh.getDataRange().getValues(), pv = {}, ev = {}, src = {};
  for (var i = 1; i < vals.length; i++) {
    var e = String(vals[i][1]), p = String(vals[i][2]) || '/', s = String(vals[i][4]) || '';
    if (e === 'page_view') pv[p] = (pv[p] || 0) + 1;
    else ev[e] = (ev[e] || 0) + 1;
    if (s) src[s] = (src[s] || 0) + 1;
  }
  var MEAN = { page_view: 'Page visits', mail_click: 'Email taps', cta_click: 'Button taps',
    share_tap: 'Shares sent', gallery_open: 'Photos opened', dwell: 'Time on page' };
  Object.keys(pv).sort(function (a, b) { return pv[b] - pv[a]; }).forEach(function (k) {
    st.appendRow(['page_view', k, pv[k], MEAN.page_view]);
  });
  Object.keys(ev).sort(function (a, b) { return ev[b] - ev[a]; }).forEach(function (k) {
    st.appendRow([k, '', ev[k], MEAN[k] || 'Intent']);
  });
  Object.keys(src).sort(function (a, b) { return src[b] - src[a]; }).forEach(function (k) {
    st.appendRow(['source', k, src[k], 'Channel: ' + k]);
  });
}

/* --------------------------------------------------------------- board */
function boardFeed() {
  var sh = SpreadsheetApp.getActive().getSheetByName('Board');
  var out = [];
  if (!sh || sh.getLastRow() < 2) return out;
  var data = sh.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1 && out.length < 12; i--) {
    var approved = data[i][6];
    if (approved === true || String(approved).toLowerCase() === 'yes') {
      out.push({
        name: String(data[i][1]).replace(/^'/, ''),
        topic: String(data[i][2]),
        message: String(data[i][3]),
        date: Utilities.formatDate(new Date(data[i][0]), TZ, 'd MMM')
      });
    }
  }
  return out;
}

/* --------------------------------------------------------------- digest */
function digest() {
  var ss = SpreadsheetApp.getActive();
  var sh = tab_('Digest');
  var d = ss.getSheetByName('Digest');
  if (d.getLastRow() === 0) d.appendRow(HEADERS.Digest);
  d.appendRow([new Date(), sheetCount_('Inquiries'), sheetCount_('Feedback'), pendingPosts_()]);
  var to = owner_();
  if (!to) return;
  MailApp.sendEmail({
    to: to,
    subject: '[Prajna] Daily roll-up',
    body: [
      'Enquiries: ' + sheetCount_('Inquiries'),
      'Feedback: ' + sheetCount_('Feedback'),
      'Board posts waiting: ' + pendingPosts_(),
      'Visits logged: ' + sheetCount_('Visits'),
      'Email taps: ' + countEvent_('mail_click'),
      'Top pages: ' + (topPages_(3).join(', ') || 'none yet'),
      '',
      'Open the sheet: ' + ss.getUrl()
    ].join('\n')
  });
}

function ensureTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'digest') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('digest').timeBased().everyDays(1).atHour(21).create();
}

function sheetCount_(name) {
  var sh = SpreadsheetApp.getActive().getSheetByName(name);
  return sh ? Math.max(0, sh.getLastRow() - 1) : 0;
}

function pendingPosts_() {
  var sh = SpreadsheetApp.getActive().getSheetByName('Board');
  if (!sh || sh.getLastRow() < 2) return 0;
  var vals = sh.getRange(2, 7, sh.getLastRow() - 1, 1).getValues();
  var n = 0;
  for (var i = 0; i < vals.length; i++) {
    var v = vals[i][0];
    if (!(v === true || String(v).toLowerCase() === 'yes')) n++;
  }
  return n;
}

function topPages_(n) {
  var sh = SpreadsheetApp.getActive().getSheetByName('Visits');
  if (!sh || sh.getLastRow() < 2) return [];
  var vals = sh.getDataRange().getValues(), m = {};
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][1]) !== 'page_view') continue;
    var p = String(vals[i][2]) || '/';
    m[p] = (m[p] || 0) + 1;
  }
  return Object.keys(m).sort(function (a, b) { return m[b] - m[a]; }).slice(0, n)
    .map(function (p) { return p + ' (' + m[p] + ')'; });
}

function countEvent_(ev) {
  var sh = SpreadsheetApp.getActive().getSheetByName('Visits');
  if (!sh || sh.getLastRow() < 2) return 0;
  var vals = sh.getDataRange().getValues(), n = 0;
  for (var i = 1; i < vals.length; i++) if (String(vals[i][1]) === ev) n++;
  return n;
}

/* --------------------------------------------------------------- util */
function allow_() {
  var cache = CacheService.getScriptCache();
  var key = 'rl:' + Math.floor(Date.now() / 60000);
  var n = Number(cache.get(key) || 0);
  if (n >= RATE_PER_MIN) return false;
  cache.put(key, String(n + 1), 120);
  return true;
}

function logError_(kind, err) {
  try {
    var sh = tab_('Errors');
    sh.appendRow([new Date(), kind, String(err && err.message ? err.message : err).slice(0, 300)]);
  } catch (ignored) {}
}

function stamp() {
  return Utilities.formatDate(new Date(), TZ, 'dd MMM yyyy, HH:mm');
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
