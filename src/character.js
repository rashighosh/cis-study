import { TalkingHead } from './talkinghead-files/talkinghead.mjs';

let head = null;
let head1 = null;
const google_tts_api_key = import.meta.env.VITE_GOOGLE_TTS_API_KEY;

export async function initDoctorCharacter(containerNode) {
  head = new TalkingHead(containerNode, {
    ttsApikey: google_tts_api_key,  // ← paste your key here
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
    ttsApikey: google_tts_api_key,  // ← paste your key here
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