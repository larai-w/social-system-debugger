#!/usr/bin/env node

// Read-only App Store / Google Play readiness check.
// It deliberately leaves account enrollment, identifier registration, signing,
// console declarations, uploads, and review submission as human gates.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { loadImage } from '@napi-rs/canvas';

const results = [];

function result(status, name, detail) {
  results.push({ status, name, detail });
}

function command(name, args) {
  return spawnSync(name, args, { encoding: 'utf8', timeout: 20_000 });
}

async function check(name, fn) {
  try {
    result('PASS', name, await fn());
  } catch (error) {
    result('BLOCKED', name, error.message);
  }
}

async function checkPng(path, width, height) {
  if (!existsSync(path)) throw new Error(`${path} is missing`);
  const image = await loadImage(path);
  if (image.width !== width || image.height !== height) {
    throw new Error(`${path} is ${image.width}x${image.height}; expected ${width}x${height}`);
  }
  if (statSync(path).size < 20 * 1024) throw new Error(`${path} appears unexpectedly small`);
  return `${width}x${height}`;
}

export function exitCode(items) {
  return items.some((item) => item.status === 'BLOCKED') ? 1 : 0;
}

async function main() {
  const json = process.argv.includes('--json');
  const config = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

  await check('Permanent app identifier', () => {
    if (!/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z0-9-]+){2,}$/.test(config.appId || '')) {
      throw new Error('appId is not a valid reverse-domain identifier');
    }
    if (config.appId === 'dev.socialdebugger.app') {
      throw new Error('placeholder appId must be replaced before native projects are generated');
    }
    return config.appId;
  });

  await check('Store name and release version', () => {
    if (config.appName !== '社会デバッガー')
      throw new Error(`unexpected appName: ${config.appName}`);
    if (!/^\d+\.\d+\.\d+$/.test(pkg.version || ''))
      throw new Error('package version is not semver');
    return `${config.appName} ${pkg.version}`;
  });

  await check('Apple build toolchain', () => {
    const run = command('xcodebuild', ['-version']);
    if (run.status !== 0) throw new Error('Xcode is unavailable');
    const match = run.stdout.match(/Xcode (\d+)/);
    if (!match || Number(match[1]) < 26)
      throw new Error(`Xcode 26+ required; found ${run.stdout.trim()}`);
    return run.stdout.trim().replace(/\n/g, '; ');
  });

  await check('Android Java toolchain', () => {
    const run = command('java', ['-version']);
    const text = `${run.stdout || ''}${run.stderr || ''}`;
    const match = text.match(/version "(\d+)/);
    if (run.status !== 0 || !match || Number(match[1]) < 17 || Number(match[1]) > 24)
      throw new Error('Gradle-compatible JDK 17–24 is unavailable');
    return `JDK ${match[1]}`;
  });

  await check('Android SDK', () => {
    const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
    if (!sdk || !existsSync(sdk))
      throw new Error('ANDROID_HOME/ANDROID_SDK_ROOT is not configured');
    return sdk;
  });

  await check('Android 16 target readiness', () => {
    const gradle = readFileSync('node_modules/@capacitor/android/capacitor/build.gradle', 'utf8');
    if (!/targetSdkVersion[^\n]+36/.test(gradle))
      throw new Error('Capacitor Android target SDK 36 not found');
    return 'Capacitor default targetSdkVersion 36';
  });

  await check('Native weekly-content endpoint', () => {
    const webConfig = readFileSync('web/config.js', 'utf8');
    if (!/nativeContentBaseUrl:\s*["']https:\/\//.test(webConfig)) {
      throw new Error(
        'nativeContentBaseUrl is not configured; installed apps cannot fetch weekly updates'
      );
    }
    return 'absolute HTTPS endpoint configured';
  });

  await check('iOS privacy manifest template', () => {
    const manifest = readFileSync('native/ios/PrivacyInfo.xcprivacy', 'utf8');
    for (const token of [
      'NSPrivacyAccessedAPICategoryUserDefaults',
      'CA92.1',
      'NSPrivacyAccessedAPICategoryFileTimestamp',
      'C617.1',
    ]) {
      if (!manifest.includes(token)) throw new Error(`privacy manifest is missing ${token}`);
    }
    return 'Preferences and Filesystem required-reason APIs declared';
  });

  await check('App icon', () => checkPng('resources/icon.png', 1024, 1024));
  await check('Light splash source', () => checkPng('resources/splash.png', 2732, 2732));
  await check('Dark splash source', () => checkPng('resources/splash-dark.png', 2732, 2732));

  await check('Store screenshots', async () => {
    for (let index = 1; index <= 6; index += 1) {
      await checkPng(`dist/store-shots/${String(index).padStart(2, '0')}.png`, 1290, 2796);
    }
    return '6 screenshots at 1290x2796';
  });

  await check('Privacy copy matches bundled Chart.js', () => {
    for (const path of ['web/privacy.html', 'web/privacy.en.html']) {
      const text = readFileSync(path, 'utf8');
      if (
        text.includes('CDN（外部の配信ネットワーク）から読み込み') ||
        text.includes('from a CDN (an external content delivery network)')
      ) {
        throw new Error(`${path} still says Chart.js is loaded from a CDN`);
      }
      if (!/Formspree/i.test(text))
        throw new Error(`${path} does not disclose Formspree feedback processing`);
    }
    return 'local library and optional feedback flow disclosed';
  });

  await check('Native projects generated', () => {
    const missing = ['ios/App/App.xcodeproj', 'android/app/build.gradle'].filter(
      (path) => !existsSync(path)
    );
    if (missing.length) throw new Error(`generate after appId approval: ${missing.join(', ')}`);
    return 'iOS and Android projects exist';
  });

  await check('Generated iOS release declarations', () => {
    const project = readFileSync('ios/App/App.xcodeproj/project.pbxproj', 'utf8');
    const plist = readFileSync('ios/App/App/Info.plist', 'utf8');
    const manifest = readFileSync('ios/App/App/PrivacyInfo.xcprivacy', 'utf8');
    if (!project.includes('PrivacyInfo.xcprivacy in Resources'))
      throw new Error('PrivacyInfo.xcprivacy is not in the iOS target resources');
    if (!plist.includes('<key>ITSAppUsesNonExemptEncryption</key>'))
      throw new Error('iOS encryption declaration is missing');
    if (!manifest.includes('NSPrivacyAccessedAPICategoryUserDefaults'))
      throw new Error('generated privacy manifest is incomplete');
    return 'privacy manifest embedded; non-exempt encryption declared false';
  });

  const humanChecks = [
    'Enroll in or confirm Apple Developer Program and Google Play Console accounts',
    'Approve and register the permanent bundle/application ID',
    'Accept current developer agreements and complete identity/device verification',
    'Complete App Privacy / Data safety / content-rating declarations in each console',
    'Run the signed build on physical iPhone and Android devices',
    'Upload to TestFlight and Play internal testing; do not submit for public review yet',
    'If the Play account is a new personal account, complete 12 opted-in testers for 14 continuous days',
    'Explicitly approve the final App Review and Production submissions',
  ];

  if (json) {
    console.log(JSON.stringify({ results, humanChecks }, null, 2));
  } else {
    console.log('\nSocial Debugger store preflight');
    results.forEach((item) => console.log(`[${item.status}] ${item.name}: ${item.detail}`));
    console.log('\n[HUMAN] Required before public submission');
    humanChecks.forEach((item) => console.log(`- ${item}`));
    const blocked = results.filter((item) => item.status === 'BLOCKED').length;
    console.log(`\nResult: ${results.length - blocked} passed, ${blocked} blocked`);
  }
  process.exitCode = exitCode(results);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
