"use strict";

const fs = require("fs");
const path = require("path");

const ELEMENTS = ["木", "火", "土", "金", "水"];
const REQUIRED_COLUMNS = [
  "五行",
  "無料(○)",
  "アイテム",
  "似合う色",
  "メモ",
  "時間帯",
  "九星タグ",
  "表示文",
  "カテゴリ",
  "使う場面",
  "季節タグ",
  "重複回避タグ",
];

const DEFAULT_CSV_PATH = path.resolve(__dirname, "..", "data", "lucky_items_v2.csv");
const DEFAULT_JSON_PATH = path.resolve(__dirname, "..", "data", "lucky_items_v2.json");

const LUCKY_ITEM_CAUTION =
  "このアイテムは、持てば必ず運が上がるという意味ではありません。命式や九星から見た、今日の心を整えるための小さなヒントとしてお使いください。";

const PROHIBITED_PHRASES = [
  "必ず開運します",
  "運気が上がります",
  "金運が上がります",
  "願いが叶います",
  "心が治ります",
  "癒やします",
  "効果があります",
  "これを持てば大丈夫です",
  "不運を消します",
  "邪気を払います",
  "ブロック解除します",
];

const STALE_REPLACED_VALUES = ["こまめな水分", "ぬか色", "ホットワイン"];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;
  const body = String(text || "").replace(/^\uFEFF/, "");

  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    const next = body[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        value += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(value);
      value = "";
    } else if (ch === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (ch !== "\r") {
      value += ch;
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => String(cell || "").trim() !== ""));
}

function rowsToCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell == null ? "" : String(cell);
          return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(",")
    )
    .join("\n");
}

function splitKyuseiTags(value) {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  return String(value || "")
    .split("・")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeFreeFlag(value) {
  return ["○", "◯", "〇", "true", "TRUE", "1", "yes", "YES"].includes(String(value || "").trim());
}

function normalizeRows(headers, rows) {
  const index = new Map(headers.map((header, i) => [header, i]));
  return rows.map((row, rowIndex) => {
    const read = (header) => String(row[index.get(header)] ?? "").trim();
    return {
      rowNumber: rowIndex + 2,
      element: read("五行"),
      isFree: normalizeFreeFlag(read("無料(○)")),
      item: read("アイテム"),
      color: read("似合う色"),
      memo: read("メモ"),
      timeSlot: read("時間帯"),
      kyuseiTags: splitKyuseiTags(read("九星タグ")),
      message: read("表示文"),
      category: read("カテゴリ"),
      scene: read("使う場面"),
      seasonTag: read("季節タグ"),
      dedupeTag: read("重複回避タグ"),
    };
  });
}

function parseLuckyItemsCsv(text) {
  const rows = parseCsv(text);
  if (!rows.length) {
    throw new Error("Lucky item CSV is empty.");
  }
  const headers = rows[0].map((header) => String(header || "").trim());
  return {
    headers,
    items: normalizeRows(headers, rows.slice(1)),
  };
}

function loadLuckyItemsFromCsv(filePath = DEFAULT_CSV_PATH) {
  const text = fs.readFileSync(filePath, "utf8");
  const parsed = parseLuckyItemsCsv(text);
  return {
    source: { type: "csv", path: filePath },
    ...parsed,
  };
}

function loadLuckyItemsFromJson(filePath = DEFAULT_JSON_PATH) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const items = Array.isArray(data) ? data : data.items;
  if (!Array.isArray(items)) {
    throw new Error("Lucky item JSON must be an array or an object with items[].");
  }
  return {
    source: { type: "json", path: filePath },
    headers: REQUIRED_COLUMNS.slice(),
    items: items.map((item, index) => ({
      rowNumber: item.rowNumber || index + 2,
      element: String(item.element || "").trim(),
      isFree: Boolean(item.isFree),
      item: String(item.item || "").trim(),
      color: String(item.color || "").trim(),
      memo: String(item.memo || "").trim(),
      timeSlot: String(item.timeSlot || "").trim(),
      kyuseiTags: splitKyuseiTags(item.kyuseiTags),
      message: String(item.message || "").trim(),
      category: String(item.category || "").trim(),
      scene: String(item.scene || "").trim(),
      seasonTag: String(item.seasonTag || "").trim(),
      dedupeTag: String(item.dedupeTag || "").trim(),
    })),
  };
}

async function loadLuckyItemsFromGoogleSheets(options = {}) {
  const spreadsheetId = options.spreadsheetId || process.env.GOOGLE_SHEETS_ID;
  const tab = options.tab || process.env.GOOGLE_SHEETS_TAB || "v2_拡張辞書_500";
  const gid = options.gid || process.env.GOOGLE_SHEETS_GID || "2123772426";
  const apiKey = options.apiKey || process.env.GOOGLE_SHEETS_API_KEY;

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_ID is not set.");
  }
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available in this Node runtime.");
  }

  if (apiKey) {
    const range = encodeURIComponent(`${tab}!A:L`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets API failed: ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    const parsed = parseLuckyItemsCsv(rowsToCsv(payload.values || []));
    return {
      source: { type: "google-sheets-api", spreadsheetId, tab },
      ...parsed,
    };
  }

  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/gviz/tq?tqx=out:csv&gid=${encodeURIComponent(gid)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Public Google Sheets CSV export failed: ${response.status} ${response.statusText}`);
  }
  const parsed = parseLuckyItemsCsv(await response.text());
  return {
    source: { type: "google-sheets-public-csv", spreadsheetId, tab, gid },
    ...parsed,
  };
}

async function loadLuckyItemDictionary(options = {}) {
  const preferGoogle = Boolean(options.preferGoogle);
  const csvPath = options.csvPath || DEFAULT_CSV_PATH;
  const jsonPath = options.jsonPath || DEFAULT_JSON_PATH;
  const allowGoogle = Boolean(
    options.allowGoogle ||
      process.env.GOOGLE_SHEETS_ID ||
      process.env.GOOGLE_SHEETS_API_KEY
  );

  const loaders = [];
  if (preferGoogle && allowGoogle) loaders.push(() => loadLuckyItemsFromGoogleSheets(options));
  if (fs.existsSync(csvPath)) loaders.push(() => loadLuckyItemsFromCsv(csvPath));
  if (fs.existsSync(jsonPath)) loaders.push(() => loadLuckyItemsFromJson(jsonPath));
  if (!preferGoogle && allowGoogle) loaders.push(() => loadLuckyItemsFromGoogleSheets(options));

  let lastError = null;
  for (const load of loaders) {
    try {
      const dictionary = await load();
      const validation = validateLuckyItems(dictionary.items, { headers: dictionary.headers });
      if (options.throwOnError && validation.errors.length) {
        throw new Error(`Lucky item validation failed: ${validation.errors.length} error(s).`);
      }
      return { ...dictionary, validation };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No lucky item source is available.");
}

function validateLuckyItems(items, options = {}) {
  const headers = options.headers || REQUIRED_COLUMNS;
  const errors = [];
  const warnings = [];
  const byElement = Object.fromEntries(ELEMENTS.map((element) => [element, 0]));
  const freeByElement = Object.fromEntries(ELEMENTS.map((element) => [element, 0]));
  const itemNames = new Map();
  const dedupeTags = new Map();
  const prohibitedHits = [];
  const staleHits = [];

  for (const column of REQUIRED_COLUMNS) {
    if (!headers.includes(column)) {
      errors.push({ type: "missing_column", column });
    }
  }

  items.forEach((item, index) => {
    const row = item.rowNumber || index + 2;
    if (!ELEMENTS.includes(item.element)) {
      errors.push({ row, type: "invalid_element", value: item.element });
    } else {
      byElement[item.element] += 1;
      if (item.isFree) freeByElement[item.element] += 1;
    }

    for (const [field, label] of [
      ["item", "アイテム"],
      ["color", "似合う色"],
      ["message", "表示文"],
      ["dedupeTag", "重複回避タグ"],
    ]) {
      if (!String(item[field] || "").trim()) {
        errors.push({ row, type: "blank_required_value", field, label });
      }
    }

    if (!item.kyuseiTags.length) {
      errors.push({ row, type: "blank_required_value", field: "kyuseiTags", label: "九星タグ" });
    }

    if (item.item) {
      const key = item.item;
      itemNames.set(key, [...(itemNames.get(key) || []), row]);
    }
    if (item.dedupeTag) {
      dedupeTags.set(item.dedupeTag, [...(dedupeTags.get(item.dedupeTag) || []), row]);
    }

    const searchable = [item.item, item.color, item.memo, item.message, item.category, item.scene, item.seasonTag, item.dedupeTag].join(" ");
    for (const phrase of PROHIBITED_PHRASES) {
      if (searchable.includes(phrase)) {
        prohibitedHits.push({ row, phrase });
      }
    }
    for (const value of STALE_REPLACED_VALUES) {
      if (searchable.includes(value)) {
        staleHits.push({ row, value });
      }
    }
  });

  for (const [item, rows] of itemNames.entries()) {
    if (rows.length > 1) warnings.push({ type: "duplicate_item_suspect", item, rows });
  }
  for (const [dedupeTag, rows] of dedupeTags.entries()) {
    if (rows.length > 1) warnings.push({ type: "duplicate_dedupe_tag_suspect", dedupeTag, rows });
  }
  for (const hit of prohibitedHits) errors.push({ type: "prohibited_phrase", ...hit });
  for (const hit of staleHits) errors.push({ type: "stale_replaced_value", ...hit });

  const freeTotal = items.filter((item) => item.isFree).length;
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      total: items.length,
      byElement,
      freeTotal,
      freeByElement,
      prohibitedHits,
      staleHits,
    },
  };
}

function normalizeJstDate(value = new Date()) {
  if (typeof value === "string") {
    const simple = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (simple) return simple[0];
  }
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function inferSeason(dateValue = new Date()) {
  const jst = normalizeJstDate(dateValue);
  const month = Number(jst.slice(5, 7));
  if ([3, 4, 5].includes(month)) return "春";
  if ([6, 7, 8].includes(month)) return "夏";
  if ([9, 10, 11].includes(month)) return "秋";
  return "冬";
}

function hashString(value) {
  let hash = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stableScore(seed, item, salt = "") {
  return hashString(`${seed}|${salt}|${item.element}|${item.item}|${item.color}|${item.dedupeTag}`);
}

function stableSort(candidates, seed, salt) {
  return candidates
    .slice()
    .sort((a, b) => stableScore(seed, a, salt) - stableScore(seed, b, salt));
}

function makeSeed(parts) {
  return parts.filter((part) => part !== undefined && part !== null && part !== "").join("|");
}

function buildSelectionState(initialItems = []) {
  const state = {
    selected: [],
    itemNames: new Set(),
    dedupeTags: new Set(),
    categoryCounts: new Map(),
  };
  for (const entry of initialItems) {
    addSelected(state, entry.item, entry.reason);
  }
  return state;
}

function addSelected(state, item, reason) {
  state.selected.push({ item, reason });
  state.itemNames.add(item.item);
  state.dedupeTags.add(item.dedupeTag);
  state.categoryCounts.set(item.category, (state.categoryCounts.get(item.category) || 0) + 1);
}

function pickDiverse(candidates, target, state, seed, reason, options = {}) {
  const maxSameCategory = options.maxSameCategory || 2;
  const sorted = stableSort(candidates, seed, reason);

  for (const strictMode of ["strict", "allow_category", "allow_dedupe"]) {
    for (const item of sorted) {
      if (state.selected.length >= target) break;
      if (state.itemNames.has(item.item)) continue;
      if (strictMode !== "allow_dedupe" && state.dedupeTags.has(item.dedupeTag)) continue;
      if (
        strictMode === "strict" &&
        item.category &&
        (state.categoryCounts.get(item.category) || 0) >= maxSameCategory
      ) {
        continue;
      }
      addSelected(state, item, reason);
    }
    if (state.selected.length >= target) break;
  }
}

function getItems(inputItems) {
  if (Array.isArray(inputItems)) return inputItems;
  return loadLuckyItemsFromCsv(DEFAULT_CSV_PATH).items;
}

function assertElement(element) {
  if (!ELEMENTS.includes(element)) {
    throw new Error(`guardianElement must be one of ${ELEMENTS.join(", ")}.`);
  }
}

function formatSelectedItem(item, sourceReason, options = {}) {
  const base = {
    element: item.element,
    item: item.item,
    color: item.color,
    message: item.message,
    category: item.category,
    scene: item.scene,
    timeSlot: item.timeSlot,
    seasonTag: item.seasonTag,
    kyuseiTags: item.kyuseiTags.slice(),
    dedupeTag: item.dedupeTag,
    sourceReason,
  };
  if (options.includeMemo) base.memo = item.memo;
  return base;
}

function selectFreeLuckyItems(options) {
  const {
    guardianElement,
    dailyKyusei,
    date,
    userSeed = "",
    count = 5,
  } = options || {};
  assertElement(guardianElement);
  const items = getItems(options.items).filter((item) => item.isFree);
  const jstDate = normalizeJstDate(date);
  const seed = makeSeed([jstDate, userSeed, guardianElement, dailyKyusei]);
  const state = buildSelectionState();
  const guardianTarget = Math.min(count, count >= 5 ? 3 : Math.ceil(count * 0.6));
  const kyuseiTarget = Math.min(count, guardianTarget + (count >= 5 ? 2 : count - guardianTarget));

  pickDiverse(
    items.filter((item) => item.element === guardianElement),
    guardianTarget,
    state,
    seed,
    "guardian"
  );
  pickDiverse(
    items.filter((item) => item.kyuseiTags.includes(dailyKyusei)),
    kyuseiTarget,
    state,
    seed,
    "dailyKyusei"
  );
  pickDiverse(
    items.filter((item) => item.element === guardianElement || item.kyuseiTags.includes(dailyKyusei)),
    count,
    state,
    seed,
    "fill-primary"
  );
  pickDiverse(items, count, state, seed, "fill-free");

  return state.selected.slice(0, count).map(({ item, reason }) => formatSelectedItem(item, reason));
}

function selectPaidLuckyItems(options) {
  const {
    guardianElement,
    dailyKyusei,
    season,
    count = 8,
  } = options || {};
  assertElement(guardianElement);
  const items = getItems(options.items);
  const selectedSeason = season || inferSeason(new Date());
  const seed = makeSeed([guardianElement, dailyKyusei, selectedSeason, count]);
  const state = buildSelectionState();
  const guardianTarget = Math.min(count, count >= 8 ? 5 : Math.ceil(count * 0.625));
  const kyuseiTarget = Math.min(count, guardianTarget + (count >= 8 ? 2 : Math.max(0, count - guardianTarget - 1)));

  pickDiverse(
    items.filter((item) => item.element === guardianElement),
    guardianTarget,
    state,
    seed,
    "guardian-paid"
  );
  pickDiverse(
    items.filter((item) => item.kyuseiTags.includes(dailyKyusei)),
    kyuseiTarget,
    state,
    seed,
    "dailyKyusei-paid"
  );
  pickDiverse(
    items.filter((item) => seasonMatches(item.seasonTag, selectedSeason)),
    count,
    state,
    seed,
    "season-paid"
  );
  pickDiverse(
    items.filter((item) => item.element === guardianElement || item.kyuseiTags.includes(dailyKyusei)),
    count,
    state,
    seed,
    "fill-paid-primary"
  );
  pickDiverse(items, count, state, seed, "fill-paid");

  return state.selected
    .slice(0, count)
    .map(({ item, reason }) => formatSelectedItem(item, reason, { includeMemo: true }));
}

function selectDailyDeliveryItems(options) {
  const {
    guardianElement,
    dailyKyusei,
    date,
    userSeed = "",
    count = 3,
    recentDedupeTags = [],
  } = options || {};
  assertElement(guardianElement);
  const items = getItems(options.items);
  const jstDate = normalizeJstDate(date);
  const selectedSeason = inferSeason(date || new Date());
  const seed = makeSeed([jstDate, userSeed, guardianElement, dailyKyusei, selectedSeason]);
  const recent = new Set(recentDedupeTags);
  const preferred = items.filter((item) => item.isFree && !recent.has(item.dedupeTag));
  const fallback = items.filter((item) => !recent.has(item.dedupeTag));
  const state = buildSelectionState();

  pickDiverse(
    preferred.filter((item) => item.element === guardianElement),
    Math.min(count, 1),
    state,
    seed,
    "guardian-delivery"
  );
  pickDiverse(
    preferred.filter((item) => item.kyuseiTags.includes(dailyKyusei)),
    Math.min(count, 2),
    state,
    seed,
    "dailyKyusei-delivery"
  );
  pickDiverse(
    preferred.filter(
      (item) =>
        (item.element === guardianElement || item.kyuseiTags.includes(dailyKyusei)) &&
        (seasonMatches(item.seasonTag, selectedSeason) || Boolean(item.timeSlot))
    ),
    count,
    state,
    seed,
    "season-time-delivery"
  );
  pickDiverse(preferred, count, state, seed, "fill-free-delivery");
  pickDiverse(fallback, count, state, seed, "fill-all-delivery");
  pickDiverse(items, count, state, seed, "fill-recent-relaxed");

  return state.selected.slice(0, count).map(({ item, reason }) => formatSelectedItem(item, reason));
}

function seasonMatches(seasonTag, season) {
  if (!season) return true;
  const tag = String(seasonTag || "").trim();
  return tag === "通年" || tag.split("・").includes(season) || tag.includes(season);
}

module.exports = {
  DEFAULT_CSV_PATH,
  DEFAULT_JSON_PATH,
  ELEMENTS,
  REQUIRED_COLUMNS,
  LUCKY_ITEM_CAUTION,
  PROHIBITED_PHRASES,
  STALE_REPLACED_VALUES,
  parseCsv,
  parseLuckyItemsCsv,
  rowsToCsv,
  splitKyuseiTags,
  loadLuckyItemsFromCsv,
  loadLuckyItemsFromJson,
  loadLuckyItemsFromGoogleSheets,
  loadLuckyItemDictionary,
  validateLuckyItems,
  normalizeJstDate,
  inferSeason,
  selectFreeLuckyItems,
  selectPaidLuckyItems,
  selectDailyDeliveryItems,
};
