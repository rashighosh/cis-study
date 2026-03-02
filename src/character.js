import { TalkingHead } from './talkinghead-files/talkinghead.mjs';

const BASE_URL = 'https://fastapi-rashi.onrender.com';
// const BASE_URL = 'http://127.0.0.1:8000';
let head = null;
let head1 = null;

document.addEventListener('click', () => {
  console.log("Making sure audio will work ...")
  if (head.audioCtx?.state === 'suspended') {
    head.audioCtx.resume();
  }
  if (head1.audioCtx?.state === 'suspended') {
    head1.audioCtx.resume();
  }
}, { once: true });  // only needs to happen once

export async function initDoctorCharacter(containerNode) {
  head = new TalkingHead(containerNode, {
    lipsyncModules: ['en'],
    cameraView: 'mid', // full, mid, upper, head,
    cameraRotateEnable: false,
    cameraPanEnable: false,
    cameraZoomEnable: false,
    cameraDistance: -1
  });

  await head.showAvatar({
    url: '/character-models/doctor.glb',
    body: 'F',
    avatarMood: 'neutral',
    ttsLang: 'en-GB',
    ttsVoice: 'en-GB-Standard-A',
    lipsyncLang: 'en',
  });

  return head;
}

export async function initCompanionCharacter(containerNode) {
  head1 = new TalkingHead(containerNode, {
    lipsyncModules: ['en'],
    cameraView: 'upper', // full, mid, upper, head,
    cameraRotateEnable: false,
    cameraPanEnable: false,
    cameraZoomEnable: false,
    cameraDistance: -1
  });

  await head1.showAvatar({
    url: '/character-models/male.glb',
    body: 'M',
    avatarMood: 'neutral',
    ttsLang: 'en-GB',
    ttsVoice: 'en-GB-Standard-A',
    lipsyncLang: 'en',
  });

  return head1;
}

export function stopCharacter() {
  head?.stop();
}

export function speakText(text) {
  head?.speakText(text);
}

export async function shrug() {
  head1.stopGesture(3000);
  head1.playGesture('shrug');
}

export async function thinking() {
  head1.stopGesture(1500);
  head1.playGesture('think', Infinity, false, 1500);
}

export async function thumbsup() {
  head1.stopGesture(3000);
  head1.playGesture('thumbup');
}

export async function ready() {
  head1.stopGesture(3000);
  head1.playGesture('ok');
}

export async function lookup() {
  head1.stopGesture(3000);
  head1.playGesture('lookup');
}

export async function stopCompanionGesture() {
  head1.stopGesture(3000);
}

export async function speakWithLipsync(text) {
  const ttsRes = await fetch(`${BASE_URL}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  const { audio, timestamps } = await ttsRes.json();

  const audioBytes = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
  const audioBuffer = await head.audioCtx.decodeAudioData(audioBytes.buffer);

  head.speakAudio({
    audio: audioBuffer,
    words: timestamps.map(t => t.word),
    wtimes: timestamps.map(t => t.start * 1000),
    wdurations: timestamps.map(t => (t.end - t.start) * 1000)
  });
}

// map gesture names to functions
export const gestures = {
  shrug,
  thumbsup,
  thinking,
  ready,
  lookup
  // add more here
};

export function playGesture(name) {
  gestures[name]?.();
}