import { data } from "react-router";

// const BASE_URL = 'https://fastapi-rashi.onrender.com';
// const BASE_URL = 'http://127.0.0.1:8000';
const BASE_URL = 'https://brcco3c42yqwcnqmvj4h2k2igu0fysxd.lambda-url.us-east-1.on.aws'


export async function submitQuestion(message) {
  console.log("AB TO HIT RAG CHAT")
  var body = {
      'thread_id': "kuromi123",
      'message': message
  }
  console.log("BODY IS", body)
  const response = await fetch(`${BASE_URL}/rag-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  var data
  if (!response.ok) throw new Error('Request failed');

  if (response.ok) {
      // Await the promise to get the actual data object
      data = await response.json(); 
      console.log(data); 
      
      // Now you can access your FastAPI fields
      console.log(data.answer);
      console.log(data.citations);
  }
 
  return data;
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

export async function landingExample(message) {
    var body = {
        'thread_id': "kuromi123",
        'message': message
    }
  const response = await fetch(`${BASE_URL}/landing-example`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error('Landing example failed');
  return response.json(); 
}