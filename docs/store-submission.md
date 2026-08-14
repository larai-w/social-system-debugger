# Store submission runbook

Status snapshot: 2026-08-13. This runbook prepares Social Debugger for TestFlight and Google Play
internal testing. Public submission remains an explicit owner action.

## Current release boundary

- Product: Social Debugger / 社会デバッガー, free, no ads, no purchases, no account.
- Native implementation: Capacitor 8 with bundled web assets, offline fallback, native share,
  haptics, local notifications, and device preferences.
- Supported iOS baseline: iOS 15+ (Capacitor 8 plugin baseline).
- Android build target: API 36. Google requires new mobile apps to target Android 16 / API 36 from
  2026-08-31, so the project adopts it now rather than shipping an immediately obsolete build.
- Apple uploads must use Xcode 26 and the iOS 26 SDK since 2026-04-28.

Official references:

- [Apple upcoming requirements](https://developer.apple.com/news/upcoming-requirements/)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple upload builds](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/)
- [Google target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878)
- [Google new-personal-account testing](https://support.google.com/googleplay/android-developer/answer/14151465)

## 1. Automated preflight

```bash
npm ci
npm run check
npm run verify
npm run verify:pages
npm run gen:icons
npm run gen:store-shots
npm run store:preflight
```

`store:preflight` is read-only and is expected to report blockers until the Android toolchain and
generated native projects exist.

## 2. Permanent identifiers

The owner approved `jp.veai.socialdebugger` on 2026-08-13 and it is now fixed in
`capacitor.config.json`. Confirm availability and register that exact identifier in App Store Connect
and Play Console before uploading builds; creating either store record remains a human action.

## 3. Generate native projects

After identifier approval:

```bash
npx cap add ios
npx cap add android
npx cap sync
npx @capacitor/assets generate
npm run native:prepare
```

Use a Gradle-compatible JDK (17–24). The current Android Studio bundle includes JDK 25, which is
newer than Gradle 8.14.3 supports; on this Mac, Temurin 21 is installed for command-line builds.

Before syncing, configure an absolute HTTPS `nativeContentBaseUrl` for the public weekly-content
endpoint in `web/config.js`. This is separate from the relative Web deployment setting: an installed
app has a local `capacitor://` origin and otherwise cannot receive the promised weekly updates.

`native:prepare` copies `native/ios/PrivacyInfo.xcprivacy` into the iOS app target, adds it to the
target resources, and sets `ITSAppUsesNonExemptEncryption` to `false`. This matches the current app,
which uses ordinary OS HTTPS and no custom/non-exempt cryptography. Reassess before running the
script if cryptography is added later.

Do not upload until these generated-project checks pass:

- Android `targetSdkVersion` and `compileSdkVersion` are 36.
- Android notification permission is present for Android 13+.
- iOS deployment target is 15 or later and the privacy manifest is in the app target.
- Version is `1.0.0`; iOS build number and Android version code start at `1`.
- Signing uses the owner's registered team/keystore. Credentials and keystores never enter Git.

## 4. Store declarations

### Apple

- Category: Education.
- No account, purchases, ads, tracking, health functionality, or user-generated public feed.
- Privacy policy URL: the live `privacy.html` page.
- App Privacy must reflect the optional feedback form accurately. The user supplies feedback text
  and may supply an email address; Formspree processes that submission. Do not select “Data Not
  Collected” without confirming Apple's optional-disclosure criteria against the final build.
- Review Notes should list the native/offline functionality so the app is not mistaken for a simple
  website wrapper: bundled offline app, native share, haptics, Preferences, and contextual local
  notifications.
- Complete the current age-rating questionnaire. Do not rely on the old “4+” draft label.

### Google Play

- Complete Data safety even for testing tracks. Disclose the optional feedback text/email flow and
  encryption in transit consistently with the privacy policy.
- Complete the Health apps declaration as “no health features”; every published app must submit the
  declaration even when it has none.
- Complete content rating, ads (“no”), app access (“all functionality available without login”),
  target audience, and privacy-policy sections.
- If the developer account is a personal account created after 2023-11-13, production access needs
  at least 12 opted-in closed-test users for 14 continuous days. New personal accounts also require
  verification through the Play Console mobile app on a non-rooted Android 10+ device.

## 5. Device acceptance

On both a physical iPhone and Android phone:

1. Fresh install and first launch have no blank screen or clipped safe-area content.
2. All four pages, one preset, one slider, and reset work without console/native errors.
3. Airplane-mode relaunch works with bundled content.
4. Native share sends text, URL, and an exported image.
5. Haptics occur only at the intended success/failure moments.
6. Notification permission is requested only after the contextual opt-in; denial does not break use.
7. The weekly notification fires at the documented local time.
8. Japanese and English layouts, larger text, VoiceOver/TalkBack labels, and dark-mode contrast are
   checked.
9. Privacy, FAQ, classroom, export, and feedback paths work.
10. Uninstall removes local records; no account or server-side record remains.

Record pass/fail only. Do not publish device identifiers, developer credentials, or personal
feedback.

## 6. Test distribution and final gate

Upload build 1 to TestFlight internal testing and Google Play internal testing. Uploading and store
configuration require the owner's accounts and are human-controlled actions. After device
acceptance, use the six generated screenshots and the reviewed copy in `docs/store-listing.md`.

Stop at “Ready for Review” / a prepared Production release. Submitting to App Review, applying for
Google production access, accepting agreements, and making either app public require explicit owner
approval.
