import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {defineConfig, Plugin} from 'vite';
import {GoogleGenAI} from '@google/genai';

// In-Memory Rate Limiting Tracker (Sliding Window)
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitBucket>();

function checkRateLimit(ip: string, action: string, maxRequests: number, windowMs: number): boolean {
  const key = `${ip}:${action}`;
  const now = Date.now();
  const bucket = rateLimitStore.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= maxRequests) {
    return false;
  }

  bucket.count += 1;
  return true;
}

// Server-Side Feature Kill Switches (PRD Section 23)
const killSwitches = {
  aiGenerationEnabled: true,
  economyRewardsEnabled: true,
  liveStreamingEnabled: true,
  publicUploadsEnabled: true,
};

// Validate video binary header / magic bytes (PRD Section 7)
function validateVideoHeader(buffer: Buffer): { valid: boolean; format: string } {
  if (buffer.length < 12) {
    return { valid: false, format: 'unknown' };
  }

  // MP4 / M4V / QuickTime: bytes 4-8 is 'ftyp' or 'moov'
  const ftypStr = buffer.toString('utf8', 4, 8);
  if (ftypStr === 'ftyp' || ftypStr === 'moov') {
    return { valid: true, format: 'mp4' };
  }

  // WebM / Matroska: starts with 0x1A 0x45 0xDF 0xA3
  if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
    return { valid: true, format: 'webm' };
  }

  // AVI: starts with 'RIFF' and bytes 8-12 'AVI '
  if (buffer.toString('utf8', 0, 4) === 'RIFF' && buffer.toString('utf8', 8, 12) === 'AVI ') {
    return { valid: true, format: 'avi' };
  }

  return { valid: false, format: 'unknown' };
}

function geminiApiPlugin(): Plugin {
  const startTime = Date.now();

  return {
    name: 'gemini-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
        const requestId = crypto.randomUUID();

        // 1. Attach Standard Security Headers on all API / upload responses (PRD Section 3 & 6)
        res.setHeader('X-Request-Id', requestId);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');

        // Streaming handler for user-uploaded videos and static videos with Range support
        if (req.url?.startsWith('/uploads/') || req.url?.startsWith('/videos/')) {
          const urlClean = req.url.split('?')[0];
          const isUpload = urlClean.startsWith('/uploads/');
          const cleanName = path.basename(urlClean);
          const uploadDir = path.resolve(__dirname, 'public/uploads');
          const videosDir = path.resolve(__dirname, 'public/videos');
          let filePath = isUpload ? path.join(uploadDir, cleanName) : path.join(videosDir, cleanName);

          if (!fs.existsSync(filePath)) {
            // Fallback to sample.mp4 so the player NEVER crashes, receives 404, or receives HTML
            filePath = path.join(videosDir, 'sample.mp4');
          }

          if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            const fileSize = stat.size;
            const range = req.headers.range;

            if (range) {
              const parts = range.replace(/bytes=/, '').split('-');
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
              const chunksize = end - start + 1;
              const file = fs.createReadStream(filePath, { start, end });

              res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
              });
              file.pipe(res);
              return;
            } else {
              res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
                'Accept-Ranges': 'bytes',
              });
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }
        }

        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const readBody = (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => (body += chunk));
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch (e) {
                reject(e);
              }
            });
            req.on('error', reject);
          });
        };

        // 2. Health & Observability Endpoint (PRD Section 16 & 29)
        if (req.url === '/api/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({
              status: 'healthy',
              version: '1.0.0',
              uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
              timestamp: new Date().toISOString(),
              memoryUsage: process.memoryUsage(),
              activeKillSwitches: killSwitches,
              rateLimitStoreEntries: rateLimitStore.size,
            })
          );
        }

        // 3. Kill Switch Administration Endpoint (PRD Section 23)
        if (req.url === '/api/kill-switches' && req.method === 'POST') {
          try {
            const body = await readBody();
            if (typeof body.aiGenerationEnabled === 'boolean') killSwitches.aiGenerationEnabled = body.aiGenerationEnabled;
            if (typeof body.economyRewardsEnabled === 'boolean') killSwitches.economyRewardsEnabled = body.economyRewardsEnabled;
            if (typeof body.liveStreamingEnabled === 'boolean') killSwitches.liveStreamingEnabled = body.liveStreamingEnabled;
            if (typeof body.publicUploadsEnabled === 'boolean') killSwitches.publicUploadsEnabled = body.publicUploadsEnabled;

            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, updatedKillSwitches: killSwitches }));
          } catch (e: any) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Malformed kill switch payload' }));
          }
        }

        // 4. Secure Raw Binary Video Upload Endpoint (PRD Section 7: Upload Security)
        if (req.url?.startsWith('/api/upload/video') && req.method === 'DELETE') {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const rawFilename = urlObj.searchParams.get('filename') || urlObj.searchParams.get('id') || '';
            const cleanName = path.basename(rawFilename).replace(/[^a-zA-Z0-9._-]/g, '_');
            const uploadDir = path.resolve(__dirname, 'public/uploads');

            // Find matching file
            if (fs.existsSync(uploadDir)) {
              const files = fs.readdirSync(uploadDir);
              for (const f of files) {
                if (f === cleanName || (cleanName && f.includes(cleanName))) {
                  try { fs.unlinkSync(path.join(uploadDir, f)); } catch {}
                }
              }
            }

            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, message: 'Video removed from storage' }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Delete failure' }));
          }
        }

        if (req.url?.startsWith('/api/upload/video') && req.method === 'POST') {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const rawFilename = urlObj.searchParams.get('filename') || 'user_video.mp4';

            // Sanitize filename & prevent path traversal
            const cleanName = path.basename(rawFilename).replace(/[^a-zA-Z0-9._-]/g, '_');
            const ext = path.extname(cleanName).toLowerCase() || '.mp4';

            const targetFilename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
            const uploadDir = path.resolve(__dirname, 'public/uploads');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
            const filePath = path.join(uploadDir, targetFilename);

            let totalBytes = 0;
            const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB maximum size cap
            const fileStream = fs.createWriteStream(filePath);

            req.on('data', (chunk: Buffer) => {
              totalBytes += chunk.length;
              if (totalBytes > MAX_FILE_SIZE) {
                fileStream.destroy();
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                res.statusCode = 413;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Payload Too Large: Maximum video size is 500MB' }));
              }
              fileStream.write(chunk);
            });

            req.on('end', () => {
              fileStream.end();
            });

            fileStream.on('finish', () => {
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  videoUrl: `/uploads/${targetFilename}`,
                  filename: targetFilename,
                  bytes: totalBytes,
                })
              );
            });

            fileStream.on('error', () => {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to write video stream to disk' }));
            });
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Internal upload failure' }));
          }
        }

        const apiKey = process.env.GEMINI_API_KEY;
        const ai = apiKey
          ? new GoogleGenAI({
              apiKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                },
              },
            })
          : null;

        // 5. Intent Curation API (PRD Section 12: AI Security & Governance)
        if (req.url === '/api/intent/curate' && req.method === 'POST') {
          // Rate limit: max 20 requests per minute
          if (!checkRateLimit(clientIp, 'ai_intent', 20, 60 * 1000)) {
            res.statusCode = 429;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'AI request limit reached. Please wait 1 minute.' }));
          }

          try {
            const { lane, intent, availableVideos } = await readBody();

            if (!ai || !killSwitches.aiGenerationEnabled) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ results: [] }));
            }

            // Prompt injection sanitizer (PRD Section 12)
            const cleanLane = String(lane || 'Engineering').slice(0, 50).replace(/[{}[\]]/g, '');
            const cleanIntent = String(intent || 'Learn architecture').slice(0, 300).replace(/SYSTEM:|IGNORE ALL/gi, '');

            const prompt = `You are RiseUp's Intent Gateway Curation Engine for builders and learners.
The user selected the lane: "${cleanLane}".
Their stated intention is: "${cleanIntent}".
Here are the candidate videos available:
${JSON.stringify(
  (availableVideos || []).slice(0, 15).map((v: any) => ({
    id: String(v.id || '').slice(0, 50),
    title: String(v.title || '').slice(0, 100),
    category: String(v.category || '').slice(0, 50),
    tags: (v.tags || []).slice(0, 5),
  }))
)}

Select between 3 and 5 most relevant videos that align with this intention.
Return pure JSON in the format:
[
  {
    "videoId": "string",
    "reason": "short 1-sentence actionable rationale why this helps achieve their intention",
    "focusScore": 95
  }
]`;

            const response = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                maxOutputTokens: 1024,
              },
            });

            const parsed = JSON.parse(response.text || '[]');
            const results = (Array.isArray(parsed) ? parsed : [])
              .map((item: any) => {
                const vid = availableVideos.find((v: any) => v.id === item.videoId);
                if (!vid) return null;
                return {
                  video: vid,
                  reason: String(item.reason || 'High signal walkthrough').slice(0, 200),
                  focusScore: Number(item.focusScore) || 90,
                };
              })
              .filter(Boolean);

            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ results }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'AI curation service currently unavailable' }));
          }
        }

        // 6. AI Summarize API (PRD Section 12)
        if (req.url === '/api/ai/summarize' && req.method === 'POST') {
          if (!checkRateLimit(clientIp, 'ai_summarize', 20, 60 * 1000)) {
            res.statusCode = 429;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'AI summarize limit reached. Please wait 1 minute.' }));
          }

          try {
            const { title, description } = await readBody();
            if (!ai || !killSwitches.aiGenerationEnabled) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  takeaways: [
                    'Focus on system bottlenecks before scaling.',
                    'Keep memory allocations off the hot performance path.',
                    'Measure execution with real tabular metrics.',
                  ],
                })
              );
            }

            const cleanTitle = String(title || '').slice(0, 150).replace(/SYSTEM:|IGNORE/gi, '');
            const cleanDesc = String(description || '').slice(0, 500).replace(/SYSTEM:|IGNORE/gi, '');

            const prompt = `Provide 3 sharp, technical, and actionable takeaways for software engineers/builders from this video:
Title: ${cleanTitle}
Description: ${cleanDesc}
Return pure JSON array of 3 strings: ["takeaway 1", "takeaway 2", "takeaway 3"]`;

            const response = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                maxOutputTokens: 512,
              },
            });

            const takeaways = JSON.parse(response.text || '[]');
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ takeaways: Array.isArray(takeaways) ? takeaways : [] }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Failed to generate summary' }));
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

