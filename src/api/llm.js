const BASE_URL = 'http://127.0.0.1:8000';

export async function submitQuestion(message) {
    var body = {
        'thread_id': "kuromi123",
        'message': message
    }
    console.log("BODY IS", body)
  const response = await fetch(`${BASE_URL}/simple-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error('Request failed');
  return response.json();
}

export async function precheckQuestion(message) {
    var body = {
        'thread_id': "kuromi123",
        'message': message
    }
  const response = await fetch(`${BASE_URL}/precheck`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error('Precheck failed');
  return response.json(); // { label, tip, color }
}