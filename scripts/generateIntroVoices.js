// scripts/generateJordanIntro.js
import fs from 'fs';

const BASE_URL = 'http://127.0.0.1:8000';

const res = await fetch(`${BASE_URL}/tts`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Hi there! I'm Jordan. Clinical trials can be a lot to take in, and it's not always obvious what to ask, or what kind of information is even out there. That's where I come in. To show you what I mean, let's try something. What's one thing you've wondered about clinical trials? Don't worry about getting it perfect. Just type whatever comes to mind!",
    character: 'companion'
  })
});

const { audio, timestamps } = await res.json();

fs.writeFileSync('public/intro-voices/jordan-intro.mp3', Buffer.from(audio, 'base64'));
fs.writeFileSync('public/intro-voices/jordan-intro-timestamps.json', JSON.stringify(timestamps, null, 2));

console.log('Done! Files saved to public/');