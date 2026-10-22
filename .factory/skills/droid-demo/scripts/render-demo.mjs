#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './common.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEMOS_ROOT = '/home/factory-user/droid-demo-videos';
const args = process.argv.slice(2);
const slugOrPath = args.find((a) => !a.startsWith('--'));
if (!slugOrPath) {
  console.error(
    'Usage: node scripts/render-demo.mjs <demo-slug-or-dir> [--format chibi|single-landscape|single-vertical|single-both|landscape|vertical|both] [--frames-only]'
  );
  process.exit(1);
}

const framesOnly = args.includes('--frames-only');
const fmtIdx = args.indexOf('--format');
const fmtArg = fmtIdx !== -1 ? args[fmtIdx + 1] : null;

const demoDir = existsSync(resolve(slugOrPath, 'spec.json'))
  ? resolve(slugOrPath)
  : existsSync(resolve(DEMOS_ROOT, slugOrPath, 'spec.json'))
    ? resolve(DEMOS_ROOT, slugOrPath)
    : resolve(ROOT, slugOrPath);
const specPath = resolve(demoDir, 'spec.json');
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const format = (fmtArg || spec.format || (spec.mode === 'chibi' ? 'chibi' : 'both')).toLowerCase();

mkdirSync(demoDir, { recursive: true });

const totalFrames = String(spec.frames || 300);
const fps = String(spec.fps || 30);
const fadeOutStart = Math.max(0, Number(totalFrames) / Number(fps) - 0.5).toFixed(2);
const posterTime = String(spec.posterTimeSec ?? Math.min(4, Math.floor(Number(totalFrames) / Number(fps) / 2)));
const outputs = {};

// 1. Special Chibi-Oktaku mode: 1:1 square, pure #ffffff background, NO text, NO tokens, sharp edges
if (format === 'chibi' || format === 'square') {
  if (framesOnly) {
    console.log('Chibi 1:1 mode uses no text/token overlay frame.');
    process.exit(0);
  }
  const size = Number(spec.size || 1080);
  const inputFrames = resolve(demoDir, spec.framesPattern || spec.framesDir || 'frames/%05d.jpg');
  const chibiMp4 = resolve(demoDir, `${spec.slug}-1x1.mp4`);
  const chibiPoster = resolve(demoDir, `${spec.slug}-1x1.png`);

  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-framerate', fps, '-i', inputFrames,
    '-filter_complex',
    `color=c=0xffffff:s=${size}x${size}:r=${fps}[bg];` +
    `[0:v]scale=${size}:${size}:force_original_aspect_ratio=decrease:flags=lanczos,setsar=1[fg];` +
    `[bg][fg]overlay=(W-w)/2:(H-h)/2:shortest=1,` +
    `fade=t=in:st=0:d=0.4:color=0xffffff,fade=t=out:st=${fadeOutStart}:d=0.5:color=0xffffff,format=yuv420p[v]`,
    '-map', '[v]', '-frames:v', totalFrames,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-r', fps, '-movflags', '+faststart',
    chibiMp4,
  ], { stdio: 'inherit' });

  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-ss', posterTime, '-i', chibiMp4, '-frames:v', '1', chibiPoster,
  ], { stdio: 'inherit' });

  outputs.chibiMp4 = chibiMp4;
  outputs.chibiPoster = chibiPoster;
  console.log('Completed chibi 1:1 pure-white render:', outputs);
  process.exit(0);
}

// 2. Single-project sharp-edge framed mode (single-landscape, single-vertical, single-both)
const doSingleLandscape = format === 'single-landscape' || format === 'single-both';
const doSingleVertical = format === 'single-vertical' || format === 'single-both';

// 3. Two-up comparison sharp-edge framed mode (landscape, vertical, both)
const doLandscape = format === 'landscape' || format === 'both';
const doVertical = format === 'vertical' || format === 'both';

const singleLandscapePng = resolve(demoDir, 'frame-single-landscape.png');
const singleVerticalPng = resolve(demoDir, 'frame-single-vertical.png');
const landscapePng = resolve(demoDir, 'frame-landscape.png');
const verticalPng = resolve(demoDir, 'frame-vertical.png');

const browser = await launch();
if (doSingleLandscape) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  await page.goto(`file://${resolve(ROOT, 'templates/single-landscape.html')}`);
  await page.evaluate((s) => window.applySpec(s), spec);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: singleLandscapePng, omitBackground: true });
  await page.close();
}
if (doSingleVertical) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto(`file://${resolve(ROOT, 'templates/single-vertical.html')}`);
  await page.evaluate((s) => window.applySpec(s), spec);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: singleVerticalPng, omitBackground: true });
  await page.close();
}
if (doLandscape) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`file://${resolve(ROOT, 'templates/landscape.html')}`);
  await page.evaluate((s) => window.applySpec(s), spec);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: landscapePng, omitBackground: true });
  await page.close();
}
if (doVertical) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto(`file://${resolve(ROOT, 'templates/vertical.html')}`);
  await page.evaluate((s) => window.applySpec(s), spec);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: verticalPng, omitBackground: true });
  await page.close();
}
await browser.close();

if (framesOnly) {
  console.log('Rendered sharp-edge overlay frames.');
  process.exit(0);
}

if (doSingleLandscape) {
  const is1610 = spec.aspect === '16:10';
  const cw = 1280;
  const ch = is1610 ? 800 : 720;
  const cx = 80;
  const cy = is1610 ? 112 : 140;
  const inputSrc = resolve(demoDir, spec.inputVideo || spec.framesPattern || 'frames/%05d.jpg');
  const isVideo = /\.(mp4|webm|mov)$/i.test(inputSrc);
  const outMp4 = resolve(demoDir, `${spec.slug}-landscape.mp4`);
  const outPoster = resolve(demoDir, `${spec.slug}-landscape.png`);
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    ...(isVideo ? ['-i', inputSrc] : ['-framerate', fps, '-i', inputSrc]),
    '-loop', '1', '-framerate', fps, '-i', singleLandscapePng,
    '-filter_complex',
    `color=c=0xfafaf8:s=1440x1080:r=${fps}[bg];` +
    `[0:v]fps=${fps},scale=${cw}:${ch}:flags=lanczos,setsar=1[a];` +
    `[bg][a]overlay=${cx}:${cy}:shortest=1[t1];` +
    `[t1][1:v]overlay=0:0:shortest=1,fade=t=in:st=0:d=0.4:color=0xfafaf8,fade=t=out:st=${fadeOutStart}:d=0.5:color=0xfafaf8,format=yuv420p[v]`,
    '-map', '[v]', '-frames:v', totalFrames,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-r', fps, '-movflags', '+faststart',
    outMp4,
  ], { stdio: 'inherit' });
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-ss', posterTime, '-i', outMp4, '-frames:v', '1', outPoster,
  ], { stdio: 'inherit' });
  outputs.singleLandscapeMp4 = outMp4;
  outputs.singleLandscapePoster = outPoster;
}

if (doSingleVertical) {
  const inputFrames = resolve(demoDir, spec.framesPattern || 'frames/%05d.jpg');
  const outMp4 = resolve(demoDir, `${spec.slug}-vertical.mp4`);
  const outPoster = resolve(demoDir, `${spec.slug}-vertical.png`);
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-framerate', fps, '-i', inputFrames,
    '-loop', '1', '-framerate', fps, '-i', singleVerticalPng,
    '-filter_complex',
    `color=c=0xfafaf8:s=1080x1350:r=${fps}[bg];` +
    `[0:v]scale=976:610:flags=lanczos,setsar=1[a];` +
    `[bg][a]overlay=52:240:shortest=1[t1];` +
    `[t1][1:v]overlay=0:0:shortest=1,fade=t=in:st=0:d=0.4:color=0xfafaf8,fade=t=out:st=${fadeOutStart}:d=0.5:color=0xfafaf8,format=yuv420p[v]`,
    '-map', '[v]', '-frames:v', totalFrames,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-r', fps, '-movflags', '+faststart',
    outMp4,
  ], { stdio: 'inherit' });
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-ss', posterTime, '-i', outMp4, '-frames:v', '1', outPoster,
  ], { stdio: 'inherit' });
  outputs.singleVerticalMp4 = outMp4;
  outputs.singleVerticalPoster = outPoster;
}

const leftFrames = resolve(demoDir, spec.leftFrames || 'frames/left/%05d.jpg');
const rightFrames = resolve(demoDir, spec.rightFrames || 'frames/right/%05d.jpg');

if (doLandscape) {
  const landscapeMp4 = resolve(demoDir, `${spec.slug}-landscape.mp4`);
  const landscapePoster = resolve(demoDir, `${spec.slug}-landscape.png`);
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-framerate', fps, '-i', leftFrames,
    '-framerate', fps, '-i', rightFrames,
    '-loop', '1', '-framerate', fps, '-i', landscapePng,
    '-filter_complex',
    `color=c=0xfafaf8:s=1920x1080:r=${fps}[bg];` +
    `[0:v]scale=928:522:flags=lanczos,setsar=1[a];` +
    `[1:v]scale=928:522:flags=lanczos,setsar=1[b];` +
    `[bg][a]overlay=24:238:shortest=1[t1];` +
    `[t1][b]overlay=968:238:shortest=1[t2];` +
    `[t2][2:v]overlay=0:0:shortest=1,fade=t=in:st=0:d=0.4:color=0xfafaf8,fade=t=out:st=${fadeOutStart}:d=0.5:color=0xfafaf8,format=yuv420p[v]`,
    '-map', '[v]', '-frames:v', totalFrames,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-r', fps, '-movflags', '+faststart',
    landscapeMp4,
  ], { stdio: 'inherit' });
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-ss', posterTime, '-i', landscapeMp4, '-frames:v', '1', landscapePoster,
  ], { stdio: 'inherit' });
  outputs.landscapeMp4 = landscapeMp4;
  outputs.landscapePoster = landscapePoster;
}

if (doVertical) {
  const verticalMp4 = resolve(demoDir, `${spec.slug}-vertical.mp4`);
  const verticalPoster = resolve(demoDir, `${spec.slug}-vertical.png`);
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-framerate', fps, '-i', leftFrames,
    '-framerate', fps, '-i', rightFrames,
    '-loop', '1', '-framerate', fps, '-i', verticalPng,
    '-filter_complex',
    `color=c=0xfafaf8:s=1080x1350:r=${fps}[bg];` +
    `[0:v]scale=976:549:flags=lanczos,setsar=1[a];` +
    `[1:v]scale=976:549:flags=lanczos,setsar=1[b];` +
    `[bg][a]overlay=52:116:shortest=1[t1];` +
    `[t1][b]overlay=52:761:shortest=1[t2];` +
    `[t2][2:v]overlay=0:0:shortest=1,fade=t=in:st=0:d=0.4:color=0xfafaf8,fade=t=out:st=${fadeOutStart}:d=0.5:color=0xfafaf8,format=yuv420p[v]`,
    '-map', '[v]', '-frames:v', totalFrames,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-r', fps, '-movflags', '+faststart',
    verticalMp4,
  ], { stdio: 'inherit' });
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-ss', posterTime, '-i', verticalMp4, '-frames:v', '1', verticalPoster,
  ], { stdio: 'inherit' });
  outputs.verticalMp4 = verticalMp4;
  outputs.verticalPoster = verticalPoster;
}

console.log('Completed renders:', outputs);
