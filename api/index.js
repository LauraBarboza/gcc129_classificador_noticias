import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();

// Middleware de segurança
app.use((req, res, next) => {
  // Headers de segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Rate limiting simples
const requests = new Map();
const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutos
  const maxRequests = 100;

  if (!requests.has(ip)) {
    requests.set(ip, []);
  }

  const userRequests = requests.get(ip);
  const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({ erro: 'Muitas requisições. Tente novamente em 15 minutos.' });
  }

  recentRequests.push(now);
  requests.set(ip, recentRequests);
  next();
};

// Função de sanitização
const sanitizeInput = (text) => {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .substring(0, 10000); // Limita tamanho
};

app.use(rateLimit);
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Configure as URLs dos agentes
const VERIFICADOR_URL = 'http://fake-news-classifier:3000/classify';

app.post('/analisar', async (req, res) => {
  const { noticia } = req.body;
  
  if (!noticia) {
    return res.status(400).json({ erro: 'Notícia não informada.' });
  }

  // Sanitizar entrada
  const noticiaSanitizada = sanitizeInput(noticia);
  
  if (noticiaSanitizada.length < 10) {
    return res.status(400).json({ erro: 'Notícia muito curta após sanitização.' });
  }

  try {
    // Chama o agente verificador
    const resposta = await axios.post(VERIFICADOR_URL, { 
      text: noticiaSanitizada 
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FakeNewsAPI/1.0'
      }
    });

    res.json(resposta.data);
  } catch (error) {
    console.error('Erro na comunicação:', error.message);
    res.status(500).json({ 
      erro: 'Erro ao comunicar com os agentes.',
      id: Date.now().toString(36)
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Servir o front-end simples
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(4000, () => {
  console.log('API rodando em http://localhost:4000');
  console.log('Acesse o front-end em http://localhost:4000/');
});
