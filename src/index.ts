import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Anime } from '#interfaces/anime.js';
import { findStream } from '#services/stream';
import { purgeDefaultStorages } from 'crawlee';

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

app.use((err: any, req: Request, res: Response, next: Function) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next();
});

let isPurging = false;

function waitForPurgeCompletion(): Promise<void> {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (!isPurging) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}

async function runPurgeIfNoPending() {
  const hasPending = Object.values(tasks).some(task => task.status === 'pending');
  if (hasPending || isPurging) {
    return;
  }
  isPurging = true;
  try {
    await purgeDefaultStorages();
  } finally {
    isPurging = false;
  }
}

setInterval(runPurgeIfNoPending, 10000);

app.post('/find', async (req: Request, res: Response) => {
  if (isPurging) {
    await waitForPurgeCompletion();
  }

  const requestData: Anime = req.body;
  const taskId = uuidv4();

  tasks[taskId] = { status: 'pending' };

  (async () => {
    try {
      const response: ApiResponse = await findStream(requestData);
      console.log(response);
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
    return;
  }

  if (task.status === 'pending') {
    res.status(202).json({ status: 'pending' });
    return;
  }

  const { result } = task;
  res.status(result?.status || 200).json(result?.data || { error: result?.error });
});

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
