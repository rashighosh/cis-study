// const BASE_URL = 'https://fastapi-rashi.onrender.com';
// const BASE_URL = 'http://127.0.0.1:8000';
const BASE_URL = 'https://brcco3c42yqwcnqmvj4h2k2igu0fysxd.lambda-url.us-east-1.on.aws'

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

export async function logEvent(participantId, eventType, eventData = {}) {
  await fetch(`${BASE_URL}/log-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participant_id: participantId,
      event_type: eventType,
      event_data: JSON.stringify(eventData),
      timestamp: new Date().toISOString()
    })
  });
}

export async function logMessage(participantId, role, message) {
  await fetch(`${BASE_URL}/log-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participant_id: participantId,
      role,
      message,
      timestamp: new Date().toISOString()
    })
  });
}