import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Anime } from '#interfaces/anime.js';
import { findStream } from '#services/stream';
import 'dotenv/config';

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

app.post('/process', (req: Request, res: Response) => {
  const requestData: Anime = req.body;
  const taskId = uuidv4();

  tasks[taskId] = { status: 'pending' };

  (async () => {
    try {
      const streams: ApiResponse = await findStream(requestData);
      tasks[taskId] = { status: 'done', result: streams };
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

app.get('/process/:taskId', (req: Request, res: Response) => {
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

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 9999;
const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

// Cleanup handlers for graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received - shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received - shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', async (err) => {
  console.error('Uncaught exception:', err);
  server.close(() => {
    console.log('Server closed');
    process.exit(1);
  });
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  server.close(() => {
    console.log('Server closed');
    process.exit(1);
  });
});
