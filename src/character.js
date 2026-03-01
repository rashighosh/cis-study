import { TalkingHead } from './talkinghead-files/talkinghead.mjs';

const BASE_URL = 'https://fastapi-rashi.onrender.com';
// const BASE_URL = 'http://127.0.0.1:8000';
let head = null;
let head1 = null;

export async function initDoctorCharacter(containerNode) {
  head = new TalkingHead(containerNode, {
    lipsyncModules: ['en'],
    cameraView: 'mid' // full, mid, upper, head,
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
    cameraView: 'upper' // full, mid, upper, head,
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
  console.log("In shrug animation...")
  head.playGesture('shrug');
}

export async function thinking() {
  head1.stopGesture(3000);
  head1.playGesture('think', Infinity, false, 3000);
}

export async function thumbsUp() {
  head1.stopGesture(3000);
  head1.playGesture('thumbup');
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
  thumbsUp,
  thinking
  // add more here
};

export function playGesture(name) {
  gestures[name]?.();
}