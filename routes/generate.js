/**
  generate.js
  11/18/2025
  Ayra Babar
  Kyle Revelo
  Khalil Velasco
*/

const express = require('express');
const OpenAI = require('openai');

const router = express.Router();

// Uses OPENAI_API_KEY from .env (dotenv.config() is called in server.js)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', async (req, res) => {
  try {
    console.log('Hit /api/generate with body:', req.body);
    console.log('OPENAI_API_KEY present?', !!process.env.OPENAI_API_KEY);

    const idea = (req.body?.idea || '').toString().slice(0, 500);
    const note = (req.body?.note || '').toString().slice(0, 200);

    if (!idea) {
      return res.status(400).json({ error: 'missing idea' });
    }

    const prompt =
      `Create a beautiful, aesthetic image inspired by this idea: "${idea}". ` +
      (note ? `Additional context: ${note}. ` : '') +
      `Style: soft, minimalist, warm natural lighting, no text, no logos.`;

    const response = await openai.images.generate({
      model: 'dall-e-2',
      prompt,
      size: '512x512',  // valid for dall-e-2
      n: 4
    });

    // 🔥 DALL·E 2 returns URLs, not base64
    const images = (response.data || [])
      .map(item => item.url)
      .filter(Boolean);

    if (!images.length) {
      console.error('No images returned from OpenAI:', response);
      return res.status(500).json({ error: 'no images returned' });
    }

    return res.json({ images });
  } catch (err) {
    console.error('Error in /api/generate:');
    console.error('  status:', err.status);
    console.error('  message:', err.message);
    console.error('  response data:', err.response?.data);
    console.error(err);
    res.status(500).json({ error: 'image generation failed' });
  }
});

module.exports = router;
