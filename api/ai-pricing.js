// pages/api/ai-pricing.js or app/api/ai-pricing/route.js
export default async function handler(req, res) {
  const { prompt } = req.body;
  
  // Call OpenAI/Claude/Gemini here
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    })
  });
  
  const data = await response.json();
  res.json({ suggestions: JSON.parse(data.choices[0].message.content) });
}
