import express, { Request, Response } from 'express';
import { Anime } from '#interfaces/anime.js';
import { findStream } from '#services/stream';

interface ApiResponse<T = any> {
  status: number;
  data?: T;
  error?: string;
}

const app = express();
app.use(express.json());

app.post('/find', async (req: Request, res: Response) => {
  try {
    const requestData: Anime = req.body;
    const response: ApiResponse = await findStream(requestData);
    res.status(response.status).json(response.data || { error: response.error });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
