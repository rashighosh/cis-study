import { TalkingHead } from './talkinghead-files/talkinghead.mjs';

// const BASE_URL = 'https://fastapi-rashi.onrender.com';
// const BASE_URL = 'http://127.0.0.1:8000';
const BASE_URL = 'https://brcco3c42yqwcnqmvj4h2k2igu0fysxd.lambda-url.us-east-1.on.aws'
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
    avatarSpeakingEyeContact: 1,
    avatarIdleEyeContact: 1,
    cameraDistance: -1,
    avatarIdleHeadMove: 1
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

async function playSmoothSequence(head, sequence) {
  for (const item of sequence) {
    head.playGesture(item.name, item.dur, item.mirror, item.ms);
    
    // Overlap by 20ms to keep the engine's "exponential smoothing" active
    const overlap = 20; 
    const waitTime = (item.dur * 1000) - overlap;
    
    await new Promise(resolve => setTimeout(resolve, Math.max(0, waitTime)));
  }
}

let isSwiping = false; // Our "Kill Switch"

export async function startSwiping() {
  if (isSwiping) return; // Prevent multiple loops starting at once
  isSwiping = true;

  // 1. Initial lift (only happens ONCE at the start)
  await playSmoothSequence(head, [{ name: 'swipeReady', dur: 1, ms: 1000 }]);

  // 2. The Repeat Loop
  const loopMoves = [
    { name: 'swipeDone',  dur: 0.9, ms: 2000 },
    { name: 'swipeReady', dur: 0.9, ms: 2000 }
  ];

  while (isSwiping) {
    await playSmoothSequence(head, loopMoves);
  }

  // 3. Final Drop (only happens ONCE when isSwiping becomes false)
  await playSmoothSequence(head, [{ name: null, dur: 0, ms: 200 }]);
}

export function stopSwiping() {
  isSwiping = false;
  console.log("Swipe loop stopping...");
}

export async function lookup() {
  head1.stopGesture(3000);
  head1.playGesture('lookup');
}

export async function headNod() {
  console.log("in head nod!")
  head.playGesture('yes', 5, false, 1500);
  // head.playAnimation('/animations/Looking Around.fbx')
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

export async function focusCharacter(character) {
  console.log("WE ARE IN FOCUS CHARACTER", character)
  if (character === 1) {
      head.setLighting({
        lightDirectIntensity: 45,   // Dim directional light,
        lightSpotIntensity: 45,
      })
      head1.setLighting({
        lightDirectIntensity: 0,   // Dim directional light
      })
      document.querySelector("#virtualcompanion > canvas").classList.add("dim")
      
      document.querySelector("#virtualdoctor > canvas").classList.remove("dim")
  } else if (character===2) {
    head.setLighting({
      lightDirectIntensity: 0,   // Dim directional light
    })
    head1.setLighting({
      lightDirectIntensity: 45,   // Dim directional light
      lightSpotIntensity: 45,
    })
    document.querySelector("#virtualcompanion > canvas").classList.remove("dim")
    document.querySelector("#virtualdoctor > canvas").classList.add("dim")
  }
}

// map gesture names to functions
export const gestures = {
  shrug,
  thumbsup,
  thinking,
  ready,
  lookup,
  headNod,
  startSwiping,
  stopSwiping
  // add more here
};

export function playGesture(name) {
  gestures[name]?.();
}