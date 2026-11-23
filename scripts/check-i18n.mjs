#!/usr/bin/env node
// Content consistency check (becomes a Vitest test in T35):
//   1. en.json and pt.json have exactly the same keys (arrays: same length),
//      and the same ICU arguments / rich-text tags per message;
//   2. every entry of src/data/* has its translations (Work.projects, Case,
//      Skills.groups, Journey.milestones, Sectors, Hud.nav);
//   3. data invariants (unique kebab-case ids, ≤ 6 chips, valid evidence...).
// It also lists the pending `TODO(content)` items (informational, never fails).
//
// Run: `npm run check:i18n`. The data files are plain TS without runtime
// imports, so Node's built-in type stripping can load them (Node ≥ 22.18).

import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (lang) =>
  JSON.parse(readFileSync(path.join(root, "src/i18n/locales", `${lang}.json`), "utf8"));
const loadTs = (rel) => import(pathToFileURL(path.join(root, rel)).href);

const errors = [];
const fail = (msg) => errors.push(msg);

// ── Flatten ──────────────────────────────────────────────────────────────
function flatten(value, prefix = "", out = new Map()) {
  if (Array.isArray(value)) {
    out.set(`${prefix}[]`, value.length);
    value.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out.set(prefix, value);
  }
  return out;
}

const en = readJson("en");
const pt = readJson("pt");
const flatEn = flatten(en);
const flatPt = flatten(pt);

// ── 1. Parity ────────────────────────────────────────────────────────────
for (const k of flatEn.keys()) if (!flatPt.has(k)) fail(`missing in pt: ${k}`);
for (const k of flatPt.keys()) if (!flatEn.has(k)) fail(`missing in en: ${k}`);

const tokens = (s) =>
  [...String(s).matchAll(/<\/?([a-zA-Z]+)>|\{\s*([a-zA-Z_]+)\s*[,}]/g)]
    .map((m) => m[1] ?? m[2])
    .sort()
    .join(",");
for (const [k, v] of flatEn) {
  const other = flatPt.get(k);
  if (typeof v === "string" && typeof other === "string" && tokens(v) !== tokens(other)) {
    fail(`ICU arguments / rich tags differ between en and pt: ${k}`);
  }
  if (typeof v === "string" && v.trim() === "") fail(`empty string in en: ${k}`);
  if (typeof other === "string" && other.trim() === "") fail(`empty string in pt: ${k}`);
}

// ── 2/3. Data ↔ messages ─────────────────────────────────────────────────
const [{ PROJECTS }, { SKILL_GROUPS }, { MILESTONES }, world] = await Promise.all([
  loadTs("src/data/projects.ts"),
  loadTs("src/data/skills.ts"),
  loadTs("src/data/milestones.ts"),
  loadTs("src/data/world.ts"),
]);

const needs = (key, where) => {
  for (const [lang, flat] of [["en", flatEn], ["pt", flatPt]]) {
    if (!flat.has(key)) fail(`${lang}: missing "${key}" (${where})`);
  }
};

const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const seen = new Set();
for (const p of PROJECTS) {
  if (!kebab.test(p.id)) fail(`project id is not kebab-case ascii: ${p.id}`);
  if (seen.has(p.id)) fail(`duplicate project id: ${p.id}`);
  seen.add(p.id);
  if (!["professional", "personal"].includes(p.type)) fail(`${p.id}: invalid type`);
  if (!Array.isArray(p.stack) || p.stack.length === 0 || p.stack.length > 6)
    fail(`${p.id}: stack must have 1–6 chips`);
  if (!p.links || Object.keys(p.links).length === 0) fail(`${p.id}: needs at least one link`);
  needs(`Work.projects.${p.id}.kind`, `project ${p.id}`);
  needs(`Work.projects.${p.id}.lead`, `project ${p.id}`);
  if (p.featured) {
    if (!p.artifact) fail(`${p.id}: featured project needs an artifact`);
    if (!world.ARTIFACT_KINDS.includes(p.artifact)) fail(`${p.id}: unknown artifact ${p.artifact}`);
    if (!Array.isArray(p.mood) || p.mood.length !== 2 || !p.mood.every((c) => /^#[0-9a-f]{6}$/i.test(c)))
      fail(`${p.id}: mood must be two #rrggbb colors`);
    for (const f of ["problem", "role"]) needs(`Case.${p.id}.${f}`, `case file ${p.id}`);
    for (const f of ["features", "challenges", "outcomes"]) needs(`Case.${p.id}.${f}[]`, `case file ${p.id}`);
    if (p.image) needs(`Case.${p.id}.imageAlt`, `case file ${p.id}`);
  }
}

const skillKeys = new Set();
for (const g of SKILL_GROUPS) {
  if (!kebab.test(g.id)) fail(`skill group id is not kebab-case: ${g.id}`);
  needs(`Skills.groups.${g.id}`, `skill group ${g.id}`);
  for (const s of g.skills) {
    const key = `${g.id}:${s.name}`;
    if (skillKeys.has(key)) fail(`duplicate skill ${key}`);
    skillKeys.add(key);
    if (!["shipped", "stated"].includes(s.evidence)) fail(`${key}: invalid evidence "${s.evidence}"`);
  }
}

for (const m of MILESTONES) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(m.date)) fail(`milestone ${m.id}: date must be YYYY-MM`);
  needs(`Journey.milestones.${m.id}.title`, `milestone ${m.id}`);
  needs(`Journey.milestones.${m.id}.text`, `milestone ${m.id}`);
}

for (const key of world.SECTOR_ORDER) {
  needs(`Sectors.${key}`, "sector");
  needs(`Hud.nav.${key}`, "section label");
}

// ── Report ───────────────────────────────────────────────────────────────
const todos = [];
for (const [lang, flat] of [["en", flatEn], ["pt", flatPt]]) {
  for (const [k, v] of flat) if (typeof v === "string" && v.includes("TODO(content)")) todos.push(`${lang}: ${k}`);
}

console.log(`i18n: ${flatEn.size} keys in en, ${flatPt.size} in pt · ${PROJECTS.length} projects, ${SKILL_GROUPS.length} skill groups, ${MILESTONES.length} milestones`);
if (todos.length) {
  console.log(`\nPending TODO(content) — ${todos.length} entries (hidden in production builds):`);
  for (const t of todos) console.log(`  · ${t}`);
}

if (errors.length) {
  console.error(`\n✖ ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  · ${e}`);
  process.exit(1);
}
console.log("\n✔ en/pt in parity and data covered");
