// const BASE_URL = 'https://fastapi-rashi.onrender.com';
const BASE_URL = 'http://127.0.0.1:8000';
// const BASE_URL = 'https://brcco3c42yqwcnqmvj4h2k2igu0fysxd.lambda-url.us-east-1.on.aws'

export async function logSession(participantId, condition) {
  await fetch(`${BASE_URL}/log-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participant_id: participantId,
      condition,
      start_time: new Date().toISOString()
    })
  });
}

export async function logLanding(participantId, landingQuestion) {
  await fetch(`${BASE_URL}/log-landing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participant_id: participantId,
      landing_question: landingQuestion
    })
  });
}

export async function logEvents(participantId, events) {
  await fetch(`${BASE_URL}/log-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participant_id: participantId,
      events: JSON.stringify(events)
    })
  });
}

export async function logTranscript(participantId, transcript) {
  await fetch(`${BASE_URL}/log-transcript`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participant_id: participantId,
      transcript: JSON.stringify(transcript)
    })
  });
}

export async function logCompletion(participantId) {
  await fetch(`${BASE_URL}/log-completion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participant_id: participantId,
      end_time: new Date().toISOString()
    })
  });
}