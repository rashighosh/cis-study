// scripts/generateJordanIntro.js
import fs from 'fs';

const BASE_URL = 'http://127.0.0.1:8000';

const companionText1 = "Hi there! I'm Jordan. Clinical trials can be a lot to take in, and it's not always obvious what to ask, or what kind of information is even out there. That's where I come in. I'll be working alongside you in realtime as you type your questions. My goal is to provide tips and suggestions for what to ask so you can get the information you need!"

const companionText2 = "Let me show you what I mean. In a moment, you'll see a text box below. I'd like you to share: What's one thing you've wondered about clinical trials? Type anything that comes to mind. It doesn't have to be perfect. If you pause for a moment, I’ll give you some quick feedback or a suggestion to help you shape your question."

const res = await fetch(`${BASE_URL}/tts`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: companionText1,
    character: 'companion'
  })
});

const { audio, timestamps } = await res.json();

fs.writeFileSync('public/intro-voices/jordan-intro1.mp3', Buffer.from(audio, 'base64'));
fs.writeFileSync('public/intro-voices/jordan-intro-timestamps1.json', JSON.stringify(timestamps, null, 2));

console.log('Done! Files saved to public/');