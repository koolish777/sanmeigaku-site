#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  DEFAULT_CSV_PATH,
  ELEMENTS,
  LUCKY_ITEM_CAUTION,
  STALE_REPLACED_VALUES,
  splitKyuseiTags,
  loadLuckyItemsFromCsv,
  loadLuckyItemsFromJson,
  loadLuckyItemsFromGoogleSheets,
  validateLuckyItems,
  selectFreeLuckyItems,
  selectPaidLuckyItems,
  selectDailyDeliveryItems,
} = require("../src/lucky-items");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    }
  }
  return args;
}

function check(results, name, condition, detail = "") {
  results.push({ name, ok: Boolean(condition), detail });
}

function uniqueCount(values) {
  return new Set(values).size;
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function summarizeSelection(items) {
  return items.map((item) => `${item.element}:${item.item}:${item.dedupeTag}`).join(" / ");
}

async function loadSource(args) {
  if (args.google) {
    return loadLuckyItemsFromGoogleSheets({});
  }
  if (args.json) {
    return loadLuckyItemsFromJson(path.resolve(args.json));
  }
  return loadLuckyItemsFromCsv(path.resolve(args.csv || DEFAULT_CSV_PATH));
}

async function main() {
  const args = parseArgs(process.argv);
  const dictionary = await loadSource(args);
  const validation = validateLuckyItems(dictionary.items, { headers: dictionary.headers });
  const results = [];
  const stats = validation.stats;
  const freeItems = dictionary.items.filter((item) => item.isFree);

  const freeWoodFireA = selectFreeLuckyItems({
    items: dictionary.items,
    guardianElement: "木",
    dailyKyusei: "九紫火星",
    date: "2026-06-10",
    userSeed: "verify-user",
  });
  const freeWoodFireB = selectFreeLuckyItems({
    items: dictionary.items,
    guardianElement: "木",
    dailyKyusei: "九紫火星",
    date: "2026-06-10",
    userSeed: "verify-user",
  });
  const freeWoodFireNext = selectFreeLuckyItems({
    items: dictionary.items,
    guardianElement: "木",
    dailyKyusei: "九紫火星",
    date: "2026-06-11",
    userSeed: "verify-user",
  });
  const freeWoodFireNext2 = selectFreeLuckyItems({
    items: dictionary.items,
    guardianElement: "木",
    dailyKyusei: "九紫火星",
    date: "2026-06-12",
    userSeed: "verify-user",
  });
  const freeWater = selectFreeLuckyItems({
    items: dictionary.items,
    guardianElement: "水",
    dailyKyusei: "一白水星",
    date: "2026-06-10",
    userSeed: "verify-user",
  });
  const paid = selectPaidLuckyItems({
    items: dictionary.items,
    guardianElement: "金",
    dailyKyusei: "七赤金星",
    season: "冬",
  });
  const delivery = selectDailyDeliveryItems({
    items: dictionary.items,
    guardianElement: "土",
    dailyKyusei: "二黒土星",
    date: "2026-06-10",
    userSeed: "verify-user",
    recentDedupeTags: [dictionary.items.find((item) => item.element === "土")?.dedupeTag].filter(Boolean),
  });

  check(results, "required columns exist", validation.errors.every((error) => error.type !== "missing_column"), dictionary.headers.join(","));
  check(results, "total is around 500", stats.total >= 490 && stats.total <= 510, String(stats.total));
  for (const element of ELEMENTS) {
    check(results, `${element} count is around 100`, stats.byElement[element] >= 90 && stats.byElement[element] <= 110, String(stats.byElement[element]));
    check(results, `${element} free count is around 30`, stats.freeByElement[element] >= 25 && stats.freeByElement[element] <= 35, String(stats.freeByElement[element]));
  }
  check(results, "free items can be extracted", freeItems.length === stats.freeTotal && freeItems.length >= 125, String(freeItems.length));
  check(results, "kyusei tags split by middle dot", sameJson(splitKyuseiTags("三碧木星・四緑木星"), ["三碧木星", "四緑木星"]));
  check(results, "free 木 + 九紫火星 returns 5", freeWoodFireA.length === 5, summarizeSelection(freeWoodFireA));
  check(results, "free 水 + 一白水星 returns 5", freeWater.length === 5, summarizeSelection(freeWater));
  check(results, "same date/userSeed is stable", sameJson(freeWoodFireA, freeWoodFireB));
  check(results, "date change can change selection", !sameJson(freeWoodFireA, freeWoodFireNext) || !sameJson(freeWoodFireA, freeWoodFireNext2));
  check(results, "free selection has no duplicate item", uniqueCount(freeWoodFireA.map((item) => item.item)) === freeWoodFireA.length);
  check(results, "free selection avoids duplicate dedupeTag", uniqueCount(freeWoodFireA.map((item) => item.dedupeTag)) === freeWoodFireA.length);
  check(results, "paid selection returns 8", paid.length === 8, summarizeSelection(paid));
  check(results, "daily delivery returns 3", delivery.length === 3, summarizeSelection(delivery));
  check(results, "caution text is available", LUCKY_ITEM_CAUTION.includes("心を整えるための小さなヒント"));
  check(results, "no validation errors", validation.errors.length === 0, JSON.stringify(validation.errors.slice(0, 5)));
  check(results, "stale replaced values are absent", stats.staleHits.length === 0, STALE_REPLACED_VALUES.join(","));
  check(results, "prohibited phrases are absent", stats.prohibitedHits.length === 0, JSON.stringify(stats.prohibitedHits.slice(0, 5)));

  const failed = results.filter((result) => !result.ok);
  const report = {
    source: dictionary.source,
    stats,
    warningCount: validation.warnings.length,
    warnings: validation.warnings.slice(0, 20),
    checks: results,
    samples: {
      freeWoodFire: freeWoodFireA,
      freeWater,
      paid,
      delivery,
      caution: LUCKY_ITEM_CAUTION,
    },
  };

  if (args["write-json"]) {
    const jsonPath = path.resolve(args["write-json"]);
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, `${JSON.stringify(dictionary.items, null, 2)}\n`, "utf8");
  }
  if (args["summary-log"]) {
    const logPath = path.resolve(args["summary-log"]);
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  console.log("Lucky item dictionary verification");
  console.log(`source: ${JSON.stringify(dictionary.source)}`);
  console.log(`total: ${stats.total}`);
  console.log(`byElement: ${JSON.stringify(stats.byElement)}`);
  console.log(`freeTotal: ${stats.freeTotal}`);
  console.log(`freeByElement: ${JSON.stringify(stats.freeByElement)}`);
  console.log(`warnings: ${validation.warnings.length}`);
  for (const result of results) {
    console.log(`${result.ok ? "PASS" : "FAIL"} ${result.name}${result.detail ? ` :: ${result.detail}` : ""}`);
  }

  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
