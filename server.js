const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data.json");
if (!ADMIN_PASSWORD) {
  console.error("Missing ADMIN_PASSWORD environment variable. Set a strong password before starting.");
  process.exit(1);
}

const people = [
  { id: "papa", name: "Papa Traub", partner: "mama" },
  { id: "mama", name: "Mama Traub", partner: "papa" },
  { id: "ingrid", name: "Ingrid Eberhard", partner: null },
  { id: "bruno", name: "Bruno Traub", partner: "rebecca" },
  { id: "rebecca", name: "Rebecca Traub", partner: "bruno" },
  { id: "christin", name: "Christin Traub", partner: "daniel" },
  { id: "daniel", name: "Daniel Traub", partner: "christin" }
];

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return { drawn: false, assignments: {}, tokens: {} }; }
}
function writeData(data) {
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, DATA_FILE);
}
function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ""));
  const bb = Buffer.from(String(b || ""));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function html(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
function adminPage(message = "") {
  const d = readData();
  const status = d.drawn
    ? `<p class="success">Die Ziehung ist abgeschlossen. Die persönlichen Geheimlinks sind unten verfügbar.</p>`
    : `<p>Noch keine Ziehung vorhanden.</p>`;
  const links = d.drawn ? `<h2>Persönliche Geheimlinks</h2>
    <p>Schicke jeder Person nur den eigenen Link. Wer einen Link besitzt, kann die zugehörige Ziehung sehen.</p>
    <ul>${people.map(p => `<li><b>${html(p.name)}</b><br><input readonly value="${html((process.env.PUBLIC_URL || "").replace(/\/$/, "") + "/ziehen/" + d.tokens[p.id])}" onclick="this.select()"> <button onclick="navigator.clipboard.writeText(this.previousElementSibling.value)">Link kopieren</button></li>`).join("")}</ul>
    <form method="post" action="/admin/reset" onsubmit="return confirm('Ziehung wirklich löschen und neu starten? Alle bisherigen Links funktionieren dann nicht mehr.')"><button class="danger">Ziehung zurücksetzen</button></form>` : `
    <form method="post" action="/admin/draw">
      <label>Admin-Passwort <input type="password" name="password" required autocomplete="current-password"></label>
      <button>Geheime Ziehung durchführen</button>
    </form>`;
  return `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Admin – Familienwichteln Traub</title><link rel="stylesheet" href="/style.css">
  <main><a href="/">← Zur Startseite</a><h1>🎄 Verwaltung</h1>${message ? `<p class="error">${html(message)}</p>` : ""}${status}${links}
  <h2>Teilnehmende</h2><ul>${people.map(p=>`<li>${html(p.name)}</li>`).join("")}</ul>
  <p class="small">Die Admin-Seite ist passwortgeschützt. Teile dieses Passwort nicht mit den Teilnehmenden.</p></main></html>`;
}
app.get("/admin", (_req, res) => res.type("html").send(adminPage()));

app.post("/admin/draw", (req, res) => {
  if (!safeEqual(req.body.password, ADMIN_PASSWORD)) return res.status(401).type("html").send(adminPage("Falsches Passwort."));
  const d = readData();
  if (d.drawn) return res.type("html").send(adminPage("Es gibt bereits eine Ziehung. Setze sie zuerst zurück, falls du neu auslosen möchtest."));
  const ids = people.map(p => p.id);
  const partners = Object.fromEntries(people.map(p => [p.id, p.partner]));
  let result = null;
  for (let attempt = 0; attempt < 200000; attempt++) {
    const recipients = [...ids];
    for (let i = recipients.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1);
      [recipients[i], recipients[j]] = [recipients[j], recipients[i]];
    }
    const valid = ids.every((giver, i) => giver !== recipients[i] && partners[giver] !== recipients[i]);
    if (valid) { result = Object.fromEntries(ids.map((giver, i) => [giver, recipients[i]])); break; }
  }
  if (!result) return res.status(500).type("html").send(adminPage("Die Ziehung konnte nicht erstellt werden. Bitte erneut versuchen."));
  const tokens = Object.fromEntries(ids.map(id => [id, crypto.randomBytes(24).toString("base64url")]));
  writeData({ drawn: true, assignments: result, tokens });
  res.type("html").send(adminPage("Ziehung erfolgreich erstellt."));
});
app.post("/admin/reset", (req, res) => {
  if (!safeEqual(req.body.password, ADMIN_PASSWORD)) return res.status(401).type("html").send(adminPage("Falsches Passwort."));
  writeData({ drawn: false, assignments: {}, tokens: {} });
  res.type("html").send(adminPage("Die Ziehung wurde zurückgesetzt."));
});
app.get("/ziehen/:token", (req, res) => {
  const d = readData();
  const id = Object.keys(d.tokens || {}).find(k => safeEqual(d.tokens[k], req.params.token));
  if (!d.drawn || !id) return res.status(404).type("html").send(`<!doctype html><html lang="de"><meta charset="utf-8"><link rel="stylesheet" href="/style.css"><main><h1>Link nicht gültig</h1><p>Dieser Geheimlink ist ungültig oder die Ziehung wurde zurückgesetzt.</p></main></html>`);
  const recipient = people.find(p => p.id === d.assignments[id]);
  const giver = people.find(p => p.id === id);
  res.set("Cache-Control", "no-store");
  res.type("html").send(`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Deine Ziehung</title><link rel="stylesheet" href="/style.css"><main class="center"><div class="gift">🎁</div><p class="eyebrow">FAMILIENWICHTELN TRAUB · 2026</p><h1>Hallo ${html(giver.name)}!</h1><p>Du beschenkst dieses Jahr:</p><div class="recipient">${html(recipient.name)}</div><p class="small">Pssst … bitte verrate niemandem, wen du gezogen hast. 🎄</p><a class="button" href="/">Zur Startseite</a></main></html>`);
});
app.get("/health", (_req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log(`Familienwichteln läuft auf Port ${PORT}`));