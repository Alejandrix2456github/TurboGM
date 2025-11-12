// This file will be automatically deployed as a Vercel Serverless Function.

// Handler function for the Vercel Function
export default async function handler(request, response) {
  // 1. Enforce CORS and Method
  // This is crucial to allow your Turbowarp project to talk to Vercel
  response.setHeader('Access-Control-Allow-Origin', '*'); 
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).send();
  }
  if (request.method !== 'POST') {
    return response.status(405).send("Method Not Allowed. Use POST.");
  }

  // 2. Get the JSON body from the Turbowarp extension
  let body;
  try {
    // Vercel handles the request object, we get the JSON data
    body = await request.json(); 
  } catch (e) {
    return response.status(400).send("Invalid JSON body.");
  }

  const { query, model } = body; 
  
  if (!query) {
    return response.status(400).send("No query provided.");
  }

  // Use the model provided by the extension, or a safe default
  const targetModel = model || 'gemini-2.5-flash'; 

  // 3. Prepare the call to the official Gemini API
  // Vercel automatically makes your secret key available via process.env
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
  if (!GEMINI_API_KEY) {
      return response.status(500).send("Server configuration error: API Key missing.");
  }
  
  // The official Gemini API URL, dynamically including the model and the secure key
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: query }] }]
      }),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
        // Return detailed error from the Gemini API back to the Turbowarp extension
        const errorMessage = data.error?.message || "Unknown AI API Error";
        return response.status(geminiResponse.status).send(`AI API Error: ${errorMessage}`);
    }

    // 4. Extract the clean text answer
    const aiAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // 5. Send the simple text answer back to Turbowarp
    response.status(200).send(aiAnswer || "Error: AI response was empty.");

  } catch (error) {
    console.error("Proxy error:", error);
    response.status(500).send("Internal Proxy Error.");
  }
}