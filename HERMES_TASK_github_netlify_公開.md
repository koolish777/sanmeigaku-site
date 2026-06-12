# Hermesへの作業依頼：算命学サイトをGitHubに上げてNetlifyで自動公開する

依頼者：リーダー（指揮官claude＝受信claude経由）
目的：`/mnt/e/Aquane/sanmeigaku_site_deploy/` の中身（静的サイト）をGitHubへ push し、Netlifyと連携して自動公開する。
背景：受信claudeのセッションはネット送信が遮断されており git/gh/netlify を実行できない。ネットに出られるHermesに実行を委ねる。

公開する中身（このフォルダ）：
- `index.html` … サイト本体（解説「読み解きガイド」入り）
- `netlify.toml` … 静的サイト設定（publish="." / build なし）

GitHubリポジトリ名（リーダーが作成済みの可能性あり）：`sanmeigaku-site`（Private 想定）

---

## 手順0：前提チェック
```bash
cd /mnt/e/Aquane/sanmeigaku_site_deploy
ls -la            # index.html と netlify.toml があること
git --version
gh auth status    # GitHubに認証済みか確認（未認証なら gh auth login が必要＝対話/ブラウザ。要リーダー）
```
- `gh auth status` が認証済みでない場合は、そこで止めてリーダーに「GitHubログインが必要」と報告。

## 手順1：Gitリポジトリ初期化（このフォルダを公開対象にする）
```bash
cd /mnt/e/Aquane/sanmeigaku_site_deploy
git init -b main
git add index.html netlify.toml
git -c user.email="hermes@local" -c user.name="Hermes" commit -m "算命学サイト 初回公開（解説入り・先生用全表示版）"
```

## 手順2：GitHubへ push（2パターン。どちらか）

### パターンA：リポジトリがまだ無い／空で作っただけ → gh にまとめてやらせる
```bash
gh repo create sanmeigaku-site --private --source=. --remote=origin --push
```
（これでリポジトリ作成＋origin設定＋pushまで一括）

### パターンB：リーダーが既に sanmeigaku-site を作ってある（中身は空）→ remote追加して push
```bash
# <USER> は gh が知っている自分のアカウント名（ghなら git@github.com 認証で自動）
gh repo view sanmeigaku-site >/dev/null 2>&1 && echo "repo exists"
git remote add origin "$(gh repo view sanmeigaku-site --json url -q .url 2>/dev/null).git" 2>/dev/null \
  || git remote add origin "https://github.com/$(gh api user -q .login)/sanmeigaku-site.git"
git push -u origin main
```
- もし「リモートに既にcommitがある」等で拒否されたら、空リポジトリのはずなので `git push -u origin main --force` で上書きしてよい（中身は空のため安全）。

## 手順3：Netlifyと連携（自動公開）
Hermesが netlify CLI を使える/認証済みなら：
```bash
which netlify && netlify status   # 認証確認
# 認証済みなら：
netlify init        # 既存サイトに紐付け or 新規作成。GitHub連携を選ぶ
# もしくは手動デプロイで即URLを得るなら：
netlify deploy --dir=. --prod
```
- netlify CLI が無い／未認証なら、**手順3はリーダーがWebでやる**：
  app.netlify.com →「Add new site → Import an existing project → GitHub」→ `sanmeigaku-site` を選ぶ → Build command 空 / Publish directory `.` → Deploy。

## 手順4：報告（必ず）
- できたこと（push成功？ Netlify連携した？）
- **公開URL（◯◯.netlify.app）** をリーダーに返す。
- 詰まった所（特に gh/netlify の認証）があれば、その一文を返す。

---

## 今後の更新（Hermes向けメモ）
更新時は、受信claudeが `/mnt/e/Aquane/sanmeigaku_site_deploy/index.html` を新しくする。Hermesは：
```bash
cd /mnt/e/Aquane/sanmeigaku_site_deploy
git add index.html
git -c user.email="hermes@local" -c user.name="Hermes" commit -m "サイト更新 $(date +%F)"
git push
```
→ GitHub連携済みなら Netlify が自動で再公開する。これで家のPC不要・外出先からでも更新できる。

作成：2026-06-08 受信claude（指揮官）
