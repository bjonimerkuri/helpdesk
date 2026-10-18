// Vercel serverless entry point. vercel.json rewrites every /api/* request to this function,
// and Express routes on the original URL (the app mounts its router at /api).
import { createApp } from '../apps/api/src/app';

export default createApp();
