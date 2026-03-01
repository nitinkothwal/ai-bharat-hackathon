import cors from 'cors';

export const corsConfig = cors({
  origin: [
    'http://localhost:4200', // PHC Web App
    'http://localhost:8081', // Expo/Metro (Web)
    /^http:\/\/192\.168\.\d+\.\d+:8081$/, // Local IP for Mobile testing
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
});

