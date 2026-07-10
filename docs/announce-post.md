# X 告知ポスト — PWA インストール告知（画像カード4枚に添える文）

> 画像は `make announce-cards`（`dist/announce/announce-card1〜4.png`・各 1200×675）で生成する。
> 固定ルールは `docs/x-post-templates.md` の6項目に準拠: ハッシュタグは `#社会デバッガー` 1つ / URL は Pages の1本 /
> 実在の人名・地名・政局に触れない / 免責1行 / 宣伝調にしない（実験・結果・構造を運ぶ）。
> 画像は「演出用デモ映像」ではなく静止画の図解なので、リール由来の注記は不要。

---

## card1（メイン告知）— announce-card1.png

```
社会が「どう壊れるか」をスライダーで動かすシミュレーターは、ホーム画面に置けます。

・インストールすると全画面で起動、オフラインでも動く
・登録なし・無料・ブラウザでも60秒で試せる

https://larai-w.github.io/social-system-debugger/

#社会デバッガー
※特定の誰かではなく、どの社会にも起こる構造の話です
```

---

## card2（iPhone / iPad の入れ方）— announce-card2.png

```
iPhone / iPad なら、ホーム画面に3タップで置けます。

① Safari で開く
② 共有ボタン（□に↑）
③「ホーム画面に追加」

登録も料金もいりません。

https://larai-w.github.io/social-system-debugger/

#社会デバッガー
※特定の誰かではなく、どの社会にも起こる構造の話です
```

---

## card3（Android / PC の入れ方）— announce-card3.png

```
スマホでもパソコンでも、アプリのように入れられます。

・Android: Chrome のメニュー（⋮）→「アプリをインストール」
・PC: Chrome / Edge のアドレスバー右端のインストールアイコン

入れなくても、ブラウザでそのまま動きます。

https://larai-w.github.io/social-system-debugger/

#社会デバッガー
※特定の誰かではなく、どの社会にも起こる構造の話です
```

---

## card4（週次シナリオ）— announce-card4.png

> ⛔ **使用条件（必読）**: 週次シナリオは現在 `WEEKLY_ENABLED`（ネイティブ限定）でガードされており、
> **Web ではまだ表示されない**。この画像と文面は**「週次の Web 有効化」が完了するまで投稿しない**こと
> （見えない機能の告知＝嘘になる。CLAUDE.md「保留中」参照）。有効化は Claude Code に
> 「週次を Web で有効化して」と依頼 → verify 通過後にこのゲートを外す。card1〜3 は今すぐ使用可。

```
このシミュレーターには、毎週月曜に新しい崩壊のシナリオが届きます。
クリアすると、発見ログに「今週の守り人」が記録されます。

Webでもアプリでも、同じ週次シナリオが遊べます。

https://larai-w.github.io/social-system-debugger/

#社会デバッガー
※特定の誰かではなく、どの社会にも起こる構造の話です
```

---

## 投稿の順番メモ

- 初回は card1（メイン告知）を単体で。反応を見てから card2 / card3 を「入れ方」スレッドとしてぶら下げてもよい。
- card4 は月曜19時の週替わり告知（`docs/x-post-templates.md`「月曜 19:00」）と別枠。週次の"存在"を伝える常設告知として使う。
- card2 / card3 の手順文は `web/index.html` の pwaInstallModal（`pwa_body`）と一致させている。アプリ側の文言を変えたらここも更新する。
