const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const winston = require('winston');
const Joi = require('joi');
const axios = require('axios');

// Carregar variáveis de ambiente
dotenv.config();

// Configurar logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela de tempo
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Schema de validação
const classifySchema = Joi.object({
  text: Joi.string().min(10).max(10000).required().messages({
    'string.min': 'O texto deve ter pelo menos 10 caracteres',
    'string.max': 'O texto deve ter no máximo 10.000 caracteres',
    'any.required': 'O campo texto é obrigatório'
  }),
});

// Middleware para logging de requisições
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'fake-news-classifier',
    version: '1.0.0'
  });
});

// Rota principal para classificação
app.post('/classify', async (req, res) => {
  try {
    // Validar entrada
    const { error, value } = classifySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details[0].message
      });
    }

    const { text } = value;

    logger.info('Classificando texto', {
      textLength: text.length,
    });

    const candidateLabels = ['notícia verdadeira', 'notícia falsa'];


    // Montar prompt para o modelo
    const prompt = `Classifique o texto abaixo em uma das categorias, escreva a classificação exatamente com uma das palavras a seguir: ${candidateLabels.join(', ')}.\nTexto: ${text}\nCategoria:`;

    // Chamada à API local do Ollama
    const ollamaResponse = await axios.post('http://ollama-fake-news:11434/api/chat', {
      model: 'llama3.2:1b',
      stream: false,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    // Verifica se resposta existe e tem conteúdo
    logger.info('Resposta do modelo recebida', {
      response: ollamaResponse.data
    });
    const modelOutput = ollamaResponse.data && ollamaResponse.data.message && ollamaResponse.data.message.content
      ? ollamaResponse.data.message.content
      : '[Erro: resposta inválida do modelo]';

    // Encontrar a categoria retornada
    const matchedLabel = candidateLabels.find(label => modelOutput.toLowerCase().includes(label.toLowerCase())) || modelOutput;

    logger.info('Classificação concluída', {
      prediction: matchedLabel,
    });

    const isFakeNews = matchedLabel.toLowerCase().includes('falsa');

    const summarizerResponse = await axios.post('http://news-summarizer:3001/summarize', {
      text,
      isFakeNews,
    });

    // Processar resultado
    const classification = {
      text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        isFakeNews,
        summary: summarizerResponse.data.summary,
      metadata: {
        model: 'llama3.2:1b',
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - req.startTime
      }
    };
    return res.json(classification);
  } catch (error) {
    logger.error('Erro na classificação', {
      error: error.message,
      stack: error.stack
    });

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'Limite de requisições excedido',
        message: 'Tente novamente em alguns segundos'
      });
    }

    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível processar a classificação'
    });
  }
});

// Rota para estatísticas (exemplo básico)
app.get('/stats', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Middleware para tracking de tempo
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  logger.error('Erro não tratado', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    error: 'Erro interno do servidor',
    message: 'Algo deu errado'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  logger.info(`🚀 Microsserviço iniciado na porta ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔍 Classificação: POST http://localhost:${PORT}/classify`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Recebido SIGTERM, encerrando servidor...');
  server.close(() => {
    logger.info('Servidor encerrado');
    process.exit(0);
  });
});

module.exports = app;
