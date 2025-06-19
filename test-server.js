const express = require('express');

console.log('Starting basic server test...');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on port ${port}`);
});