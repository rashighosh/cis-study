// scripts/generateJordanIntro.js
import fs from 'fs';

const BASE_URL = 'http://127.0.0.1:8000';

const companionText1 = "Hi, I'm Jordan! Clinical trials can feel like… a lot, honestly. And knowing what to even ask isn’t always obvious. That’s where I come in — I’ll help you turn whatever’s on your mind about clinical trials into questions. In a second, you’ll see a box below. Just type one thing you’ve ever wondered about clinical trials -- it doesn't have to be perfect!"
const doctorText1 = "Hi. I'm Doctor Alex! There's a lot of information out there about clinical trials — and it can be hard to know what's reliable or where to look. That's where I come in. When you ask me a question about clinical trials, I'll search through trusted sources like the National Cancer Institute to find the clearest and most relevant answer for you. Now, whenever you're ready, a button will appear below that you can click to start the actual information search!"
const companionText2 = "Hey, it's me again, Jordan! You can ask questions about clinical trials below, and Doctor Alex will take it from there. As you type, if you pause for a few seconds, I’ll quietly pop up with a few thoughts or question ideas you might find helpful. You can hover over me to peek at them and click one if it fits. I’ve already lined up the questions from earlier — you can hover over me to see them, or you can ignore those and start typing whenever you’re ready."

const res = await fetch(`${BASE_URL}/tts`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: doctorText1,
    character: 'doctor'
  })
});

const { audio, timestamps } = await res.json();

fs.writeFileSync('public/intro-voices/doctor-intro1.mp3', Buffer.from(audio, 'base64'));
fs.writeFileSync('public/intro-voices/doctor-intro-timestamps1.json', JSON.stringify(timestamps, null, 2));

console.log('Done! Files saved to public/');