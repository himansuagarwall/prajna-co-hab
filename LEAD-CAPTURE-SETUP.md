# Lead capture setup

Every form on the site (room enquiry, resident feedback, Pit board post) posts to one Google Apps Script web app, which writes a row to one Google Sheet and emails you the lead. Free, no server, no third party, no monthly bill.

Until this is done the site still works: the forms open a prefilled email instead, and nothing is lost. But nothing is stored either, so do this once.

Total time: about 10 minutes. Everything below happens in your own Google account.

---

## 1. Make the sheet

1. Go to `sheets.new`.
2. Name it `Prajna Data`.
3. Leave it empty. The script creates the tabs.

## 2. Paste the backend

1. In that sheet: **Extensions > Apps Script**.
2. Delete whatever is in `Code.gs`.
3. Paste the whole of `apps-script/Code.gs` from this repo.
4. Save (the disk icon, or Ctrl/Cmd+S).

## 3. Run setup once

1. In the Apps Script editor, pick `setup` from the function dropdown.
2. Press **Run**.
3. Google asks for authorisation. Choose your account, **Advanced > Go to project (unsafe) > Allow**. It says "unsafe" because the script is yours and unpublished, not because it does anything odd. It only touches this spreadsheet and `MailApp`.
4. Check the execution log. It prints `setup ok` and the sheet URL.
5. Look at the sheet: tabs `Inquiries`, `Feedback`, `Board`, `Visits`, `Errors`, `Digest` should exist with bold header rows.

## 4. Deploy as a web app

1. **Deploy > New deployment**.
2. Gear icon > **Web app**.
3. Description: `prajna leads`.
4. **Execute as: Me**.
5. **Who has access: Anyone**. This is required: the visitor's browser is not signed in to your account. The script still only writes to your sheet and only mails you.
6. **Deploy**, then copy the **Web app URL**. It ends in `/exec`.

## 5. Point the site at it

Open `config.js` and set:

```js
endpoint: "https://script.google.com/macros/s/AKfy.../exec",
```

That is the only place the URL lives. Commit it, push, and the forms go live on the next deploy.

The Content-Security-Policy on every page already allows `script.google.com` and `script.googleusercontent.com`, so nothing else needs changing.

## 6. Test it

1. Open the live contact page.
2. Send a real-looking enquiry with your own email in it.
3. You should see "Got it. We reply by email..." on the page.
4. Check the sheet: `Inquiries` has one row with the name, email, interest and message.
5. Check your inbox: one mail, subject starting `[Prajna] Enquiry:`, with `Reply-To` set to the visitor's address. Hit reply, it goes to them, not to yourself.
6. Repeat for `feedback.html` (the sheet should show `5` if you clicked five stars) and `autohub.html` (a row in `Board`, and a mail).

If the page says "Could not send that", the sheet shows nothing and no mail arrives, the endpoint is wrong or the deployment is not set to `Anyone`. Redeploy and paste the new URL.

---

## What lands where

| Tab | Comes from | Columns |
|---|---|---|
| Inquiries | contact page form | Time, Name, Email, Phone, Interest, Move-in, Budget, Message, Source, Referrer, Status, ID |
| Feedback | feedback page form | Time, Name, Role, Stay, Rating, Message, Email, Source, Published, ID |
| Board | Pit board form | Time, Name, Topic, Message, Email, Source, Approved, ID |
| Visits | page views and CTA taps | Time, Event, Page, Referrer, UTM Source, UTM Medium, UTM Campaign, Screen, Language, Detail |
| Errors | anything that failed | Time, Kind, Detail |
| Digest | 9pm daily roll-up | Time, Inquiries, Feedback, Board awaiting approval |

**Publishing board posts:** the feed only shows rows where `Approved` is `Yes`. The form writes `FALSE` on purpose, so nothing goes public without you. Change that cell to `Yes` when you want it live.

**Status column:** `New` on every enquiry. Move it to `Replied`, `Visited`, `Booked` yourself. The site never touches it again.

---

## What the backend refuses to do

- **Honeypot.** The forms carry a hidden `company` field. A bot fills it, the server answers "ok" and stores nothing. A human never sees the field.
- **Double writes.** Each submission carries an id, cached for six hours. A retry after a slow success does not create a second row.
- **Formula injection.** A name or message starting with `=`, `+`, `-` or `@` is stored with a leading apostrophe, so the sheet shows the text instead of running it as a formula.
- **Silent deletion.** At 50,000 rows the oldest 10,000 are copied into a dated archive tab before being removed.
- **Broken column order.** If a column is inserted or renamed, the write is refused and the reason lands in `Errors`, instead of every future row landing in the wrong column.
- **Stack traces.** Failures return a short code (`save_failed`, `sheet_mismatch`, `busy`), never internal detail.
- **Rate abuse.** 8 submissions per minute across all clients. A flood gets `busy`, real leads still land.

Default limits that matter: 100 emails per day on a free Gmail account (the script sends one per lead plus one digest), and 20,000 Apps Script executions per day. A 10-bed PG will never come close.

---

## If something goes wrong

| Symptom | Cause | Fix |
|---|---|---|
| Page says "Could not send that (HTTP 401)" | Deployment is not `Anyone` | Redeploy with access set to Anyone |
| Page says "Could not send that (busy)" | 8+ submissions in a minute | Wait 60 seconds |
| Sheet has rows, no mail | Gmail quota or spam filter | Check the `Errors` tab and your spam folder |
| `Errors` says `header mismatch` | A column was inserted or renamed | Put the header row back exactly as listed above |
| Nothing at all happens on submit | `endpoint` is empty | That is the fallback mode, see step 5 |

## Changing the alert address

By default every alert goes to the Google account that deployed the script. To send it somewhere else, open **Project Settings > Script Properties**, add `DIGEST_TO` with the address you want. No code change, no redeploy needed for that property.

## If you ever rotate the deployment

Deploying a new version gives a new `/exec` URL only if you create a *new deployment*. Editing an existing one keeps the URL. If you do create a new one, paste the new URL into `config.js` and commit, or every form silently goes back to mailto mode.
