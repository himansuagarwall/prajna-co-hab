#!/usr/bin/env node
/**
 * Backend harness for apps-script/Code.gs.
 *
 * Apps Script cannot be run outside Google, so this stubs the six globals the
 * script actually touches (Spreadsheet, Mail, Cache, Properties, Utilities,
 * Lock, Content) and drives doPost/doGet with real payloads. It catches the
 * bugs that would otherwise only show up after a deploy: a rating stored as
 * the wrong number, a honeypot that leaks, a formula reaching a cell, a
 * duplicate row, a header mismatch being ignored.
 *
 * Run: node tests/backend/code-gs.test.js
 * Exit code 0 = all assertions passed.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let failures = 0;
let checks = 0;

function ok(name, condition, detail) {
  checks++;
  if (!condition) {
    failures++;
    console.log('FAIL ' + name + (detail ? ' :: ' + detail : ''));
  }
}

/* ---------------------------------------------------------------- stubs */

function makeSheet(name) {
  return {
    name,
    rows: [],
    getLastRow() { return this.rows.length; },
    getLastColumn() { return this.rows.length ? Math.max(...this.rows.map((r) => r.length)) : 0; },
    appendRow(row) { this.rows.push(row.slice()); },
    setFrozenRows() {},
    setColumnWidth() {},
    getRange(row, col, numRows, numCols) {
      const sheet = this;
      return {
        getValues() {
          const out = [];
          for (let r = 0; r < numRows; r++) {
            const src = sheet.rows[row - 1 + r] || [];
            const line = [];
            for (let c = 0; c < numCols; c++) line.push(src[col - 1 + c] === undefined ? '' : src[col - 1 + c]);
            out.push(line);
          }
          return out;
        },
        setValues(values) {
          values.forEach((line, r) => {
            const target = row - 1 + r;
            sheet.rows[target] = sheet.rows[target] || [];
            line.forEach((v, c) => { sheet.rows[target][col - 1 + c] = v; });
          });
        },
        setFontWeight() { return this; },
        setBackground() { return this; },
      };
    },
    getDataRange() { return this.getRange(1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); },
    clearContents() { this.rows = []; },
    deleteRows(start, howMany) { this.rows.splice(start - 1, howMany); },
  };
}

function makeSpreadsheet() {
  const tabs = new Map();
  return {
    tabs,
    getId: () => 'sheet-id',
    getUrl: () => 'https://docs.google.com/spreadsheets/d/sheet-id',
    getSheetByName(name) { return tabs.get(name) || null; },
    insertSheet(name) {
      const sh = makeSheet(name);
      tabs.set(name, sh);
      return sh;
    },
  };
}

function buildSandbox(sheet) {
  const cache = new Map();
  const mails = [];
  const props = new Map();
  const sandbox = {
    console,
    Logger: { log: () => {} },
    SpreadsheetApp: {
      getActive: () => sheet,
      openById: () => sheet,
      create: () => sheet,
    },
    MailApp: {
      sendEmail: (o) => { mails.push(o); },
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (cache.has(k) ? cache.get(k) : null),
        put: (k, v) => { cache.set(k, v); },
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (props.has(k) ? props.get(k) : null),
        setProperty: (k, v) => { props.set(k, v); },
      }),
    },
    Utilities: {
      formatDate: () => '05 Nov 2026, 10:00',
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (text) => ({
        text,
        setMimeType() { return this; },
        getContent() { return text; },
      }),
    },
    LockService: {
      getScriptLock: () => ({ waitLock: () => true, releaseLock: () => {} }),
    },
    Session: {
      getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' }),
    },
    ScriptApp: {
      getProjectTriggers: () => [],
      deleteTrigger: () => {},
      newTrigger: () => ({ timeBased: () => ({ everyDays: () => ({ atHour: () => ({ create: () => {} }) }) }) }),
    },
    __cache: cache,
    __mails: mails,
    __props: props,
  };
  vm.createContext(sandbox);
  return sandbox;
}

function load(sandbox) {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'apps-script', 'Code.gs'), 'utf8');
  vm.runInContext(src, sandbox, { filename: 'Code.gs' });
}

function post(sandbox, payload) {
  const res = sandbox.doPost({ postData: { contents: JSON.stringify(payload) }, parameter: {} });
  return JSON.parse(res.text);
}

/* ---------------------------------------------------------------- tests */

function fresh() {
  const sheet = makeSpreadsheet();
  const sandbox = buildSandbox(sheet);
  load(sandbox);
  return { sheet, sandbox };
}

/* 1. a normal enquiry lands, with the email in the right column */
{
  const { sheet, sandbox } = fresh();
  const res = post(sandbox, {
    type: 'inquiry', name: 'Asha Rane', email: 'asha@example.com', phone: '9822000000',
    interest: 'Twin-sharing bed', movein: 'December 2026', budget: '8000',
    message: 'Night shift, need quiet.', page: 'contact.html', id: 'abc-1',
  });
  ok('inquiry accepted', res.ok === true, JSON.stringify(res));
  const rows = sheet.getSheetByName('Inquiries').rows;
  ok('inquiry wrote one row', rows.length === 2, 'rows=' + rows.length);
  ok('header written', rows[0][0] === 'Time');
  ok('email stored', rows[1][2] === 'asha@example.com', rows[1][2]);
  ok('status defaults to New', rows[1][10] === 'New');
  ok('owner was mailed', sandbox.__mails.length === 1, 'mails=' + sandbox.__mails.length);
  ok('reply-to is the visitor', sandbox.__mails[0].replyTo === 'asha@example.com', sandbox.__mails[0].replyTo);
}

/* 2. enquiry without an email is refused: email is the only reply channel */
{
  const { sandbox } = fresh();
  const res = post(sandbox, { type: 'inquiry', name: 'No Mail', message: 'call me' });
  ok('missing email refused', res.ok === false && res.error === 'email_required', JSON.stringify(res));
}

/* 3. feedback stores the rating that was sent, not the last one in the list */
{
  const { sheet, sandbox } = fresh();
  const res = post(sandbox, { type: 'feedback', name: 'Ravi', role: 'Resident', stay: '6 months', rating: '5', message: 'Good stay.', email: '', id: 'f-1' });
  ok('feedback accepted', res.ok === true, JSON.stringify(res));
  const row = sheet.getSheetByName('Feedback').rows[1];
  ok('rating 5 stored as 5', row[4] === 5, String(row[4]));
  ok('anonymous name default kept', row[1] === 'Ravi');
}

/* 4. feedback with no rating is refused */
{
  const { sandbox } = fresh();
  const res = post(sandbox, { type: 'feedback', message: 'no stars chosen' });
  ok('rating required', res.ok === false && res.error === 'rating_required', JSON.stringify(res));
}

/* 5. a filled honeypot is answered politely and stored nowhere */
{
  const { sheet, sandbox } = fresh();
  const res = post(sandbox, { type: 'inquiry', name: 'Bot', email: 'bot@example.com', company: 'spam co' });
  ok('honeypot answered ok', res.ok === true && res.dropped === true, JSON.stringify(res));
  ok('honeypot stored nothing', !sheet.getSheetByName('Inquiries'), 'sheet created');
  ok('honeypot sent no mail', sandbox.__mails.length === 0);
}

/* 6. a retried submission does not double-write */
{
  const { sheet, sandbox } = fresh();
  const payload = { type: 'inquiry', name: 'Twice', email: 'twice@example.com', id: 'dup-1' };
  const a = post(sandbox, payload);
  const b = post(sandbox, payload);
  ok('first write ok', a.ok === true);
  ok('second write skipped', b.ok === true && b.duplicate === true, JSON.stringify(b));
  ok('one row only', sheet.getSheetByName('Inquiries').rows.length === 2);
}

/* 7. formula injection is neutralised in every user field */
{
  const { sheet, sandbox } = fresh();
  post(sandbox, {
    type: 'inquiry', name: '=IMPORTXML("http://evil","//x")', email: 'evil@example.com',
    message: '+HYPERLINK("http://evil")', id: 'inj-1',
  });
  const row = sheet.getSheetByName('Inquiries').rows[1];
  ok('name is prefixed', String(row[1]).startsWith("'="), String(row[1]));
  ok('message is prefixed', String(row[7]).startsWith("'+"), String(row[7]));
}

/* 8. a header change blocks the write instead of scattering rows */
{
  const { sheet, sandbox } = fresh();
  post(sandbox, { type: 'inquiry', name: 'First', email: 'a@example.com', id: 'h-1' });
  const sh = sheet.getSheetByName('Inquiries');
  sh.rows[0][2] = 'Renamed column';
  const res = post(sandbox, { type: 'inquiry', name: 'Second', email: 'b@example.com', id: 'h-2' });
  ok('mismatch refused', res.ok === false && res.error === 'sheet_mismatch', JSON.stringify(res));
  ok('no row appended after mismatch', sh.rows.length === 2, 'rows=' + sh.rows.length);
  ok('mismatch logged to Errors', sheet.getSheetByName('Errors').rows.length === 2);
}

/* 9. board posts stay hidden until approved */
{
  const { sheet, sandbox } = fresh();
  post(sandbox, { type: 'board', name: 'Suresh', topic: 'Mechanic', message: 'Try the shop near the gate.', id: 'b-1' });
  const feed = JSON.parse(sandbox.doGet({ parameter: { type: 'board' } }).text);
  ok('unapproved post hidden', feed.ok === true && feed.posts.length === 0, JSON.stringify(feed));
  const sh = sheet.getSheetByName('Board');
  sh.rows[1][6] = 'Yes';
  const feed2 = JSON.parse(sandbox.doGet({ parameter: { type: 'board' } }).text);
  ok('approved post published', feed2.posts.length === 1 && feed2.posts[0].name === 'Suresh', JSON.stringify(feed2));
}

/* 10. unknown type and bad body are refused without detail */
{
  const { sandbox } = fresh();
  ok('unknown type refused', post(sandbox, { type: 'nope' }).error === 'unknown_type');
  const bad = sandbox.doPost({ postData: { contents: '{not json' } });
  ok('bad json refused', JSON.parse(bad.text).ok === false);
  ok('no stack trace leaked', !/Error|at /.test(JSON.parse(bad.text).error || ''));
}

/* 11. the counts endpoint is gone */
{
  const { sandbox } = fresh();
  const res = sandbox.doGet({ parameter: { type: 'counts' } });
  ok('counts no longer exposed', !JSON.parse(res.text).open);
}

/* 12. rate limit trips after the configured burst */
{
  const { sandbox } = fresh();
  let refused = 0;
  for (let i = 0; i < 12; i++) {
    const r = post(sandbox, { type: 'board', name: 'Flood ' + i, message: 'x', id: 'f' + i });
    if (r.error === 'busy') refused++;
  }
  ok('rate limit engages', refused > 0, 'refused=' + refused);
}

/* ---------------------------------------------------------------- report */

console.log(checks + ' checks, ' + failures + ' failed');
process.exit(failures ? 1 : 0);
