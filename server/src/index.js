require('dotenv').config();
const express = require('express');
const cors = require('cors');
const reviewRoute  = require('./routes/review');
const fixRoute     = require('./routes/fix');
const extractRoute = require('./routes/extract');

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({
  origin: '*',
}));

app.use('/api/review',  reviewRoute);
app.use('/api/fix',    fixRoute);
app.use('/api/extract', extractRoute);

app.get('/', (_req, res) => res.send('PRD Reviewer API is running 🚀'));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
