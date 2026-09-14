import express from 'express';
import path from 'path';

const app = express();
const port = Number(process.env.PORT || 3000);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', processing: 'on-device', aiKeyRequired: false }));

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.listen(port, '0.0.0.0', () => console.log(`GRT Virtual Try-On running at http://localhost:${port}`));
}
startServer();
