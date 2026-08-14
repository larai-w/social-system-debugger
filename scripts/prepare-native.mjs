#!/usr/bin/env node

// Applies release settings that Capacitor cannot express in capacitor.config.json.
// Run after `npx cap add ios/android` and `npx cap sync`. The generated native
// projects are gitignored, so this script is intentionally idempotent.

import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const iosManifestTemplate = 'native/ios/PrivacyInfo.xcprivacy';
const iosManifest = 'ios/App/App/PrivacyInfo.xcprivacy';
const iosInfoPlist = 'ios/App/App/Info.plist';
const iosProject = 'ios/App/App.xcodeproj/project.pbxproj';
const androidGradle = 'android/app/build.gradle';

for (const path of [iosManifestTemplate, iosInfoPlist, iosProject, androidGradle]) {
  if (!existsSync(path)) throw new Error(`${path} is missing; generate native projects first`);
}

copyFileSync(iosManifestTemplate, iosManifest);

// The Capacitor template's three placeholder splash files are left behind by
// @capacitor/assets and show up as unassigned asset-catalog children in Xcode.
for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  rmSync(`ios/App/App/Assets.xcassets/Splash.imageset/${name}`, { force: true });
}

let plist = readFileSync(iosInfoPlist, 'utf8');
if (!plist.includes('<key>ITSAppUsesNonExemptEncryption</key>')) {
  plist = plist.replace('<dict>', '<dict>\n\t<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>');
  writeFileSync(iosInfoPlist, plist);
}

let project = readFileSync(iosProject, 'utf8');
if (!project.includes('PrivacyInfo.xcprivacy in Resources')) {
  const replacements = [
    [
      '\t\t50B271D11FEDC1A000F3C39B /* public in Resources */ = {isa = PBXBuildFile; fileRef = 50B271D01FEDC1A000F3C39B /* public */; };',
      '\t\t50B271D11FEDC1A000F3C39B /* public in Resources */ = {isa = PBXBuildFile; fileRef = 50B271D01FEDC1A000F3C39B /* public */; };\n\t\tA1B2C3D42DB0000000000001 /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = A1B2C3D42DB0000000000002 /* PrivacyInfo.xcprivacy */; };',
    ],
    [
      '\t\t958DCC722DB07C7200EA8C5F /* debug.xcconfig */ = {isa = PBXFileReference; lastKnownFileType = text.xcconfig; name = debug.xcconfig; path = ../debug.xcconfig; sourceTree = SOURCE_ROOT; };',
      '\t\t958DCC722DB07C7200EA8C5F /* debug.xcconfig */ = {isa = PBXFileReference; lastKnownFileType = text.xcconfig; name = debug.xcconfig; path = ../debug.xcconfig; sourceTree = SOURCE_ROOT; };\n\t\tA1B2C3D42DB0000000000002 /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; };',
    ],
    [
      '\t\t\t\t504EC3131FED79650016851F /* Info.plist */,',
      '\t\t\t\t504EC3131FED79650016851F /* Info.plist */,\n\t\t\t\tA1B2C3D42DB0000000000002 /* PrivacyInfo.xcprivacy */,',
    ],
    [
      '\t\t\t\t2FAD9763203C412B000D30F8 /* config.xml in Resources */,',
      '\t\t\t\t2FAD9763203C412B000D30F8 /* config.xml in Resources */,\n\t\t\t\tA1B2C3D42DB0000000000001 /* PrivacyInfo.xcprivacy in Resources */,',
    ],
  ];

  for (const [anchor, replacement] of replacements) {
    if (!project.includes(anchor)) {
      throw new Error('Capacitor iOS project template changed; cannot safely add privacy manifest');
    }
    project = project.replace(anchor, replacement);
  }
  writeFileSync(iosProject, project);
}

const android = readFileSync(androidGradle, 'utf8');
if (!android.includes('applicationId "jp.veai.socialdebugger"')) {
  throw new Error('Android applicationId does not match jp.veai.socialdebugger');
}

console.log('Native release settings prepared (iOS privacy/encryption, Android application ID).');
