# sanmeigaku-site（総合運勢診断・算命学プロトタイプ）

算命学を中心に九星気学・占星術を重ねた総合運勢診断サイトのプロトタイプです。

## 現行バージョン

- **現行作業ファイル：v51**（ローカル作業状態 / 2026-06-13）
- 公開用作業ファイル：このフォルダの `index.html`（title / badge / footer はv51）。2026-06-13に自然法人体星図B差戻しを修正し、v51表示配置もadmin基準へ同期。seed 2026061302で朱学院5件/自然法5件とも公式照合PASS。sha256 `1DF08B09B6CBC4F1E6074AF694C2004C601547AF54052E28CFEAECC1494DA084`。
- プロトタイプ保存版の最新番号：`E:\Aquane\sanmeigaku_prototype\uranai_v50.html`
- 注意：`uranai_v51.html` は確認時点で未作成です。v51を正式正本にする場合は、保存版を作るか `index.html` を正本扱いにするか先に決めてください。
- 注意：`index.html` にはv2辞書用の処理が入っていますが、旧 `LUCKY_POOL` / `LUCKY_FREE` と旧語句も残っています。公開前に必ず整合確認してください。
- 公開先：GitHub `koolish777/sanmeigaku-site`（public）→ Netlify `rainbow-croissant-77ebf9.netlify.app`
- 現行最新版の引継ぎ正本：`E:\Aquane\13_占いサイトプロジェクト_現行最新版管理\00_CURRENT_現行最新版\README_現行最新版と引継ぎ.md`

## 守護神ラッキーアイテム辞書 v2

- 最新Google Sheetsタブ `v2_拡張辞書_500` 由来の辞書エンジンは実装済みです。
- 実装：`src/lucky-items.js`
- 検証：`scripts/verify_lucky_items.js`
- ローカル正本：`data/lucky_items_v2.csv` / `data/lucky_items_v2.json`
- `index.html` にはv2辞書用の処理が入っていますが、旧 `LUCKY_POOL` / `LUCKY_FREE` も残っているため、完全接続済みとは断定しません。
- `lucky_items_gsheet.csv` は旧タブ/旧形式なので、今後の正本扱いはしません。

## 設計の考え方（三段階）

- **無料＝入口型**：命式の図（陰占・陽占）＋星のかんたんな読み解き＋今日の運勢（ラッキーアイテム/カラー）＋詩の断片。「見てよかった」で完結する軽い入口。
- **②先生の鑑定**：算命学・気学による具体的な読み解き→総合アドバイスで結論。
- **③個別・最高級**：占星術まで重ねた総合判断（占星術は最後）。

深い組合せ読み・判定表・型などクラフトの核は無料に出さない方針（他占い師への配慮＋鑑定の価値保護）。

## 更新の進め方（v51以降）

- 現行最新版の判断は、必ず `E:\Aquane\13_占いサイトプロジェクト_現行最新版管理\` から確認する。
  - 入口：`E:\Aquane\13_占いサイトプロジェクト_現行最新版管理\README.md`
  - 現行正本：`E:\Aquane\13_占いサイトプロジェクト_現行最新版管理\00_CURRENT_現行最新版\README_現行最新版と引継ぎ.md`
  - **変更後追記先**：`E:\Aquane\13_占いサイトプロジェクト_現行最新版管理\01_CHANGELOG_変更後追記.md`
- 旧更新ログ `E:\Aquane\13_占いサイトプロジェクト_更新ログ_20260609_v32.md` は v32〜v39＋保守記録の証拠。v51以降の追記先は上記 `01_CHANGELOG_変更後追記.md` に統一する。
- バージョンを上げるときは、原則 `sanmeigaku_prototype\uranai_vXX.html` を正本として作成し、このフォルダの `index.html` に反映してから公開する。v51は現時点で `index.html` 側が先行しています。
- 作業後は `現行正本README` / `01_CHANGELOG_変更後追記` / `01_現在地スナップショット_SHARED_MEMORY` / このREADME の4点を同期する。
- 公開・反映（git push 等の外部/不可逆操作）はリーダー承認のうえで行う。

## 保守記録（2026-06-09）

- ローカルの破損した `.git/index` を `git read-tree HEAD` で復旧（コミット履歴・HEAD・公開サイトは無傷）。
- deployフォルダの `index.html` が旧版（6/8）のまま残っていたため、コミット済みHEAD=v39へ同期（`git show HEAD:index.html > index.html`）。`git status` クリーンを確認。
- ※Windowsマウントの権限制約により `.git/` 内に空の残骸ファイル（`index.lock.bak` 等）が残置。gitは無視するため無害、Windows側で削除可。

## セットアップ・公開手順

スマホからの公開手順は `README_セットアップと公開手順.md` を参照。
