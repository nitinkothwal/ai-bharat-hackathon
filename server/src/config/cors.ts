import cors from 'cors';

export const corsConfig = cors({
  origin: ['http://localhost:4200'], // tighten later
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
