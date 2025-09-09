// pages/api/ai-pricing.js or app/api/ai-pricing/route.js
export default async function handler(req, res) {
  const { prompt } = req.body;
  
// Call Google Gemini API
const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GOOGLE_AI_API_KEY, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.3
    }
  })
});

const data = await response.json();
res.json({ suggestions: JSON.parse(data.candidates[0].content.parts[0].text) });
}
