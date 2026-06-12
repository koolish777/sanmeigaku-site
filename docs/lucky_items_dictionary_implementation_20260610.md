# 守護神ラッキーアイテム辞書 実装メモ 2026-06-10

## 目的

占いサイト、毎日配信、有料PDF鑑定で使う「今日の整えアイテム」を、守護神五行を主軸、九星気学を味付けとして安定選定するための実装。

この機能は開運保証ではなく、心を整えるための日用品・色・小さな行動の提案として扱う。

## 正本データ

- Google Sheets: `1khXOmTWNu9kT8dHpFRwguL_v0wvbEHdJG4-f73DenaI`
- 正本タブ: `v2_拡張辞書_500`
- ローカルCSV: `data/lucky_items_v2.csv`
- ローカルJSON: `data/lucky_items_v2.json`

匿名CSV取得はGoogle側で401になったため、Google Drive連携で正本タブを読み取り、ローカルCSV/JSONスナップショットを作成した。コードにAPIキーや認証情報は保存していない。

## 実装ファイル

- `src/lucky-items.js`
  - CSV/JSON読み込み
  - Google Sheets読み込み関数
  - バリデーション
  - 九星タグ分割
  - 無料占い/有料PDF/毎日配信用の選定関数
  - 注意文と禁止表現リスト
- `scripts/verify_lucky_items.js`
  - データ件数、五行別件数、無料件数、選定安定性、禁止語、古い語の残存確認
- `logs/lucky_items_verify_20260610.json`
  - CSV検証ログ
- `logs/lucky_items_verify_json_20260610.json`
  - JSON検証ログ

## 主要関数

- `loadLuckyItemsFromCsv(filePath)`
- `loadLuckyItemsFromJson(filePath)`
- `loadLuckyItemsFromGoogleSheets(options)`
- `loadLuckyItemDictionary(options)`
- `validateLuckyItems(items, options)`
- `splitKyuseiTags(value)`
- `selectFreeLuckyItems({ guardianElement, dailyKyusei, date, userSeed, count, items })`
- `selectPaidLuckyItems({ guardianElement, dailyKyusei, season, count, items })`
- `selectDailyDeliveryItems({ guardianElement, dailyKyusei, date, userSeed, count, recentDedupeTags, items })`

## 選定方針

- 無料占い: 無料候補のみ。守護神五行から3件、今日の九星タグから2件を目安に合計5件。
- 有料PDF: 無料フラグに限定しない。守護神五行から5件、九星タグから2件、季節から1件を目安に合計8件。
- 毎日配信: 無料候補を優先。守護神1件、九星1件、季節または時間帯1件を目安に合計3件。
- 同一日・同一ユーザーでは、`JST日付 + userSeed + guardianElement + dailyKyusei` を含むシードで安定化。
- 同じアイテム、同じ重複回避タグ、同カテゴリ偏りを避ける。

## 注意文

`LUCKY_ITEM_CAUTION`:

> このアイテムは、持てば必ず運が上がるという意味ではありません。命式や九星から見た、今日の心を整えるための小さなヒントとしてお使いください。

## 検証結果

- 合計: 500件
- 五行別: 木100 / 火100 / 土100 / 金100 / 水100
- 無料候補: 150件
- 五行別無料候補: 各30件
- 九星タグ `・` 分割: PASS
- 木 + 九紫火星の無料選定5件: PASS
- 水 + 一白水星の無料選定5件: PASS
- 同じ date/userSeed の安定性: PASS
- date変更で結果が変わる可能性: PASS
- 同じアイテム重複なし: PASS
- 同じ dedupeTag 重複なし: PASS
- `こまめな水分` / `ぬか色` / `ホットワイン` 残存なし: PASS
- 禁止表現残存なし: PASS

## 警告

重複疑いとして以下2件をログに出した。どちらも選定側では同時採用を避けるため、実装上のブロッカーではない。

- `テラコッタの植木鉢`: rows 168, 207
- `黄色いキーホルダー`: rows 204, 301

## 未接続

- `index.html` の既存 `LUCKY_POOL` / `LUCKY_FREE` は未置換。
- 理由: 現在のページはテスト運用・学習用で、今後無料サイトを新規作成する方針のため。今回は新サイト、毎日配信、PDF鑑定から再利用できる独立ユーティリティとして実装した。

## 次にやること

1. 無料サイト新規版で `selectFreeLuckyItems` を今日の運勢カードへ接続する。
2. PDF鑑定生成側で `selectPaidLuckyItems` をテンプレートに接続する。
3. メンバーシップ配信用DBができたら `recentDedupeTags` に直近履歴を渡す。
4. Google Sheetsを運用で直接読む場合は、`GOOGLE_SHEETS_ID` / `GOOGLE_SHEETS_TAB` / 必要なら `GOOGLE_SHEETS_API_KEY` を環境変数で渡す。コードへの直書きは禁止。
