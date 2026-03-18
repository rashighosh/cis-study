// scripts/generateJordanIntro.js
import fs from 'fs';

const BASE_URL = 'http://127.0.0.1:8000';

const companionText1 = "Hi there! I'm Jordan. Clinical trials can be a lot to take in, and it's not always obvious what to ask, or what kind of information is even out there. That's where I come in. I'll be working alongside you in realtime as you type your questions. My goal is to provide tips and suggestions for what to ask so you can get the information you need!"
const companionText2 = "Let me show you what I mean. In a moment, you'll see a text box below. I'd like you to share: What's one thing you've wondered about clinical trials? Type anything that comes to mind. It doesn't have to be perfect."
const doctorText1 = "Hi. I'm Doctor Alex! There's a lot of information out there about clinical trials — and it can be hard to know what's reliable or where to look. That's where I come in. When you ask me a question about clinical trials, I'll search through trusted sources like the National Cancer Institute to find the clearest and most relevant answer for you. Now, whenever you're ready, a button will appear below that you can click to start the actual information search!"
const companionText3 = "Hey, it's me, Jordan. You can type your questions about clinical trials below for Doctor Alex to answer. If you pause for a moment after you start typing, I will silently provide feedback and suggestions to ask. You can hover over me to see those suggestions, and click on one to use it. I already have some suggested questions based on what you shared in the introduction. Try hovering over me to see those, or go ahead and start typing a question below!"

const res = await fetch(`${BASE_URL}/tts`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: companionText3,
    character: 'companion'
  })
});

const { audio, timestamps } = await res.json();

fs.writeFileSync('public/intro-voices/companion-intro3.mp3', Buffer.from(audio, 'base64'));
fs.writeFileSync('public/intro-voices/companion-intro-timestamps3.json', JSON.stringify(timestamps, null, 2));

console.log('Done! Files saved to public/');