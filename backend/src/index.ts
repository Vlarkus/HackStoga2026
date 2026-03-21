import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));

app.use('/api', healthRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
