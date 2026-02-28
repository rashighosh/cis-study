import { TalkingHead } from './talkinghead-files/talkinghead.mjs';
let head = null;

export async function initCompanionCharacter(containerNode) {
  head = new TalkingHead(containerNode, {
    ttsApikey: 'AIzaSyBtTb7tVeZ6lNc2rIQKeL0_yqaWv1Y-kCU',  // ← paste your key here
    lipsyncModules: ['en'],
    cameraView: 'head' // full, mid, upper, head,
  });

  await head.showAvatar({
    url: '/character-models/male.glb',
    body: 'F',
    avatarMood: 'neutral',
    ttsLang: 'en-GB',
    ttsVoice: 'en-GB-Standard-A',
    lipsyncLang: 'en',
  });

  return head;
}

export async function initDoctorCharacter(containerNode) {
  head = new TalkingHead(containerNode, {
    ttsApikey: 'AIzaSyBtTb7tVeZ6lNc2rIQKeL0_yqaWv1Y-kCU',  // ← paste your key here
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

export function stopCharacter() {
  head?.stop();
}

export function speakText(text) {
  head?.speakText(text);
}