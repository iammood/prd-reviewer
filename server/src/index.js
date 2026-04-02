require('dotenv').config();
const express = require('express');
const cors = require('cors');
const reviewRoute = require('./routes/review');

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
}));

app.use('/api/review', reviewRoute);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`PRD Reviewer server running on http://localhost:${PORT}`);
});
