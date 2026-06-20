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
console.log('API KEY EXISTS:', !!process.env.ANTHROPIC_API_KEY);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({
  origin: '*',
}));
app.use(express.json());

app.use('/api/review',  reviewRoute);
app.use('/api/fix',    fixRoute);
app.use('/api/extract', extractRoute);

app.get('/', (_req, res) => res.send('PRD Reviewer API is running 🚀'));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Global error handler — catches multer errors and anything else unhandled
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('GLOBAL ERROR:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
