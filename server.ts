import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Cloudinary signature endpoint (for secure uploads from client)
  app.get('/api/cloudinary-signature', (req, res) => {
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();
    const uploadPreset = (process.env.CLOUDINARY_UPLOAD_PRESET || '').trim();

    const isPlaceholder = (val: string) => !val || val.includes('your_') || val.includes('MY_') || val.length < 3;

    if (isPlaceholder(cloudName) || isPlaceholder(apiKey) || isPlaceholder(apiSecret) || isPlaceholder(uploadPreset)) {
      return res.status(400).json({ 
        error: 'Cloudinary is not configured. Please set the environment variables (Cloud Name, API Key, API Secret, Upload Preset) in the Secrets panel.' 
      });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Cloudinary signed upload parameters must be sorted alphabetically
    // We only sign timestamp and upload_preset
    const paramsToSign = `timestamp=${timestamp}&upload_preset=${uploadPreset}`;
    
    // Signature = SHA1(params + api_secret)
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    res.json({ signature, timestamp, apiKey, cloudName, uploadPreset });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
