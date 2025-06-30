const axios = require('axios');

exports.handler = async (event) => {
  const { prompt, imageData } = JSON.parse(event.body);

  const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
  if (imageData) {
    chatHistory[0].parts.push({
      inlineData: { mimeType: "image/png", data: imageData }
    });
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { contents: chatHistory },
      { headers: { 'Content-Type': 'application/json' } }
    );

    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (err) {
  console.error('Gemini API error:', err.response?.data || err.message);
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Gemini API call failed',
      details: err.response?.data || err.message
    })
  };
}
};
