# 算命学サイト：GitHub→Netlify 自動公開セットアップ手順

これを一度やると、**家のPCがなくても・外出先のスマホからでも**サイトを更新できます。
GitHubもNetlifyも「Webサイト（アプリ）」なので、スマホのブラウザだけで設定できます。

このフォルダの中身（公開するファイル）：
- `index.html` … サイト本体（解説「読み解きガイド」入り・先生用全表示版）
- `netlify.toml` … Netlify用の設定（静的サイト・ビルドなし）

---

## PART 1：最初の1回だけの設定（スマホでOK・10〜15分）

### ① GitHubにリポジトリ（保管場所）を作る
1. github.com にログイン（アカウントが無ければ無料登録）。
2. 右上「＋」→「New repository」。
3. Repository name：`sanmeigaku-site`（何でもOK）。
4. 「Private」を選ぶ（人に見せない置き場にする）。
5. 「Create repository」。

### ② ファイルを2つアップロードする
1. 作ったリポジトリの画面で「uploading an existing file」（または Add file → Upload files）。
2. クラウディがTelegramで送る **`index.html`** と **`netlify.toml`** をアップロード。
3. 下の「Commit changes」を押す。
   → これで保管場所にサイトが入りました。

### ③ Netlifyとつなぐ（自動公開の心臓部）
1. app.netlify.com にログイン（GitHubアカウントでログインすると早い）。
2. 「Add new site」→「Import an existing project」→「GitHub」。
3. さっきの `sanmeigaku-site` を選ぶ。
4. 設定はそのままでOK（Build command：空 / Publish directory：`.`）。
5. 「Deploy」。数十秒で公開URLが出ます（例：`https://○○○.netlify.app`）。
   → このURLを義母さんに渡せば、スマホで普通に動きます。

### ④（任意）見れる人を限定する
Netlifyのサイト設定 → 「Access control」やパスワード保護で、知っている人だけにできます。
（前にリーダーが希望した「許可した人だけ」に相当）

---

## PART 2：これから更新するとき（外出先・スマホでOK）

もう家のPCは要りません。流れはこれだけ：

1. リーダーがクラウディに「サイト直して／○○足して」と頼む。
2. クラウディが家のPC側で `index.html` を作り直し、**Telegramで送る**。
3. リーダーがスマホで GitHubのリポジトリ → `index.html` を開く → 鉛筆／Upload で**新しいファイルに差し替え**て Commit。
4. Netlifyが**自動で**気づいて、数十秒後に公開URLが新しくなる。
   → 何もインストール不要・どこからでも更新完了。

---

## 補足（クラウディの制約）
- クラウディのこのセッションは安全のため**ネット送信が遮断**されており、GitHubへのアップロードやNetlify接続を代行できません。
  だから「ファイルを作って渡す」までがクラウディ、「アップロード・接続」はリーダーの操作になります。
- 将来、家のPCに自動アップロードの仕組み（トークンを1回設定）を入れれば、PART2の手順3も自動化できます（ご希望があれば用意します）。

---
作成：2026-06-08 クラウディ ／ サイト本体の正本は `sanmeigaku_prototype/`（最新は別途vNで管理）
