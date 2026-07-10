# X / HN Announce Posts (EN) — PWA install cards

> The images are generated with `make announce-cards` (`?lang=en` → `dist/announce/announce-card1..4.en.png`, each 1200×675).
> Same fixed rules as the ja version (`docs/announce-post.md` / `docs/x-post-templates.md`): one hashtag `#SocialDebugger` /
> a single Pages URL / no real people, places, or current politics / one disclaimer line / not salesy (carry the experiment, the result, the structure).
> These are static diagrams, not "demo footage," so the reel-only "simplified demo" note is not needed.
> Tone follows `docs/launch-en.md` (personal, technical, non-commercial — plain lowercase sentences read well on HN).

---

## card1 (main announce) — announce-card1.en.png

```
A society simulator you drive with sliders — how societies break — now lives on your home screen.

- Install it and it launches full-screen, and works offline
- No sign-up, free, and you can try it in your browser in 60 seconds

https://larai-w.github.io/social-system-debugger/

#SocialDebugger
*Not about anyone specific — structures any society can fall into
```

---

## card2 (how to install on iPhone / iPad) — announce-card2.en.png

```
On iPhone / iPad, you can put it on your home screen in 3 taps.

1) Open in Safari
2) Share button (box with ↑)
3) "Add to Home Screen"

No sign-up, no cost.

https://larai-w.github.io/social-system-debugger/

#SocialDebugger
*Not about anyone specific — structures any society can fall into
```

---

## card3 (how to install on Android / PC) — announce-card3.en.png

```
On your phone or your PC, you can install it like an app.

- Android: Chrome Menu (⋮) → "Install app"
- PC: the install icon at the right end of the Chrome / Edge address bar

You don't have to install it — it runs in the browser as-is.

https://larai-w.github.io/social-system-debugger/

#SocialDebugger
*Not about anyone specific — structures any society can fall into
```

---

## card4 (weekly scenario) — announce-card4.en.png

> ⛔ **Usage gate (read first)**: the weekly scenario is currently guarded by `WEEKLY_ENABLED` (native-only),
> so **it does not yet appear on the web**. Do not post this image or text **until "weekly enabled on web" is complete**
> (announcing an invisible feature = a lie. See CLAUDE.md "保留中"). To enable, ask Claude Code to "enable weekly on web"
> → after verify passes, remove this gate. card1–3 are usable right now.

```
This simulator delivers a new collapse scenario every Monday.
Clear it, and your discovery log records "This Week's Guardian."

The same weekly scenario plays on the web and in the app.

https://larai-w.github.io/social-system-debugger/

#SocialDebugger
*Not about anyone specific — structures any society can fall into
```

---

## Posting order notes

- Post card1 (main announce) on its own first. After watching the response, you can thread card2 / card3 below it as a "how to install" reply.
- card4 is separate from the Monday 19:00 weekly rotation post (`docs/x-post-templates.md`). Use it as a standing announce of the *existence* of the weekly scenario.
- The card2 / card3 step text matches `web/index.html`'s pwaInstallModal (`pwa_body`, en). If you change the app wording, update this too.
- Card wording is transcribed from the app: card4's scenario title is the real en title from `content/weekly/2026-W51.json`.
