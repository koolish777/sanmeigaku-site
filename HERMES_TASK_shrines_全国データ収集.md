# Hermesへの作業依頼：全国の神社・パワースポット実在データを収集して shrines.json を作る

依頼者：リーダー（指揮官claude経由）
目的：吉方位・神社さがしページ（`kichihoui_jinja.html`）が使う **全国の実在神社・パワースポットのデータ** を集め、`shrines.json` に整える。
最重要ルール：**捏造禁止**。実在し、一次情報（公式サイト・自治体・神社本庁・Wikipedia等の出典）で確認できたものだけ。あいまいなものは入れない。

## 出力先
`/mnt/e/Aquane/sanmeigaku_site_deploy/shrines.json`
（いまは代表14件のSEEDが入っている。これを全国版に差し替え／追記する）

## JSONスキーマ（1件ぶん）
```json
{
  "name": "神社・スポット名（正式名称）",
  "pref": "都道府県（例：沖縄県。47都道府県名の正式表記）",
  "city": "市区町村",
  "gogyo": "木|火|土|金|水（祭神や由緒から関連が明確な場合のみ。不明なら空文字）",
  "note": "ご利益・由緒（事実のみ・1行）",
  "lat": 0.0,  "lng": 0.0,   // 分かれば緯度経度（任意・無ければ省略可。pref中心で方角計算するため必須ではない）
  "url": "公式または一次情報のURL"
}
```
ファイル全体は `{ "_meta": {...}, "shrines": [ ... ] }` の形（既存SEEDの形を踏襲）。

## 収集方針
- **全国47都道府県を網羅**。各県あたり、よく知られた神社・パワースポットを最低5〜10件（多い県はもっと）。
- 著名な総鎮守・一宮・世界遺産・有名パワースポットを優先。地域で親しまれている社も可。
- `note` は短く事実だけ（ご利益・祭神・世界遺産など）。誇大表現や効果の断定はしない。
- `url` は可能な限り公式サイト。無ければ自治体観光や神社本庁の該当ページ。
- 重複・別名は正式名称に寄せて1件に。

## 検証
- `python3 -c "import json;d=json.load(open('shrines.json',encoding='utf-8'));print(len(d['shrines']))"` でJSONが壊れていないか確認。
- 県名は PREF と一致する正式表記（「東京都」「大阪府」「北海道」「京都府」など）。表記ゆれは直す。

## 公開（データ更新後）
`/mnt/e/Aquane/sanmeigaku_site_deploy/` は既にgit管理下（GitHub→Netlify連携想定）。更新したら：
```bash
cd /mnt/e/Aquane/sanmeigaku_site_deploy
git add shrines.json kichihoui_jinja.html index.html
git -c user.email="hermes@local" -c user.name="Hermes" commit -m "全国神社データ追加＋吉方位ページ＋ガイド更新"
git push
```
→ Netlify連携済みなら自動で公開反映。連携前なら手順は `HERMES_TASK_github_netlify_公開.md` 参照。

## 報告
- 収集できた件数（県別の目安）、未収集の県、出典の種類。
- 公開URLで `kichihoui_jinja.html` が動くか（郵便番号→方角→神社が出るか）。

作成：2026-06-08 受信claude（指揮官）
