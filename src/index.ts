import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Anime } from '#interfaces/anime.js';
import { findStream } from '#services/stream';

interface ApiResponse<T = any> {
  status: number;
  data?: T;
  error?: string;
}

interface Task {
  status: 'pending' | 'done' | 'error';
  result?: ApiResponse;
}

const tasks: Record<string, Task> = {};

const app = express();

app.use(cors());
app.use(express.json());

app.post('/find', (req: Request, res: Response) => {
  const requestData: Anime = req.body;
  const taskId = uuidv4();

  tasks[taskId] = { status: 'pending' };

  (async () => {
    try {
      const response: ApiResponse = await findStream(requestData);
      tasks[taskId] = { status: 'done', result: response };
    } catch (error) {
      console.error(error);
      tasks[taskId] = {
        status: 'error',
        result: { error: 'Internal Server Error', status: 500 }
      };
    }
  })();

  res.json({ taskId });
});

app.get('/find/:taskId', (req: Request, res: Response) => {
    const { taskId } = req.params;
    const task = tasks[taskId];
  
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
    }
  
    if (task.status === 'pending') {
      res.json({ status: 'pending' });
    }

  
    const { result } = task;
    res.status(result?.status || 200).json(result?.data || { error: result?.error });
});

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
