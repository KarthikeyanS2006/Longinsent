import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  deepDiveHandler,
  currentAffairsHandler,
  discoverHandler,
  healthHandler,
} from './groq.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.post('/api/deep-dive', deepDiveHandler);
app.post('/api/current-affairs', currentAffairsHandler);
app.post('/api/discover', discoverHandler);
app.get('/api/health', healthHandler);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`[longinset] dev Groq proxy on http://localhost:${port}`);
});
