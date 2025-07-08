const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rota principal para resumo
app.post('/summarize', async (req, res) => {
  try {
    const { text, isFakeNews } = req.body;

    // Montar prompt para o modelo
    const prompt = `Apenas resuma o texto abaixo em no máximo 50 palavras de forma que eu consiga entender do que se trata a notícia, sem comentários adicionais sobre. Considere que o texto possui um classificador isFakeNews:${isFakeNews} para te ajudar a formar o resumo:\nTexto: ${text}\n:`;

    // Chamada à API local do Ollama
    const ollamaResponse = await axios.post('http://ollama-summarizer:11434/api/chat', {
      model: 'llama3.2:1b',
      stream: false,
      messages: [
        { role: 'user', content: prompt }
      ]
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Verifica se resposta existe e tem conteúdo
    const modelOutput = ollamaResponse.data && ollamaResponse.data.message && ollamaResponse.data.message.content
      ? ollamaResponse.data.message.content
      : '[Erro: resposta inválida do modelo]';

    // Processar resultado
    const summary = {
      text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      summary: modelOutput,
      isFakeNews,
      metadata: {
        model: 'llama3.2:1b',
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - req.startTime
      }
    };

    return res.json(summary);
  } catch (error) {
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível processar o resumo'
    });
  }
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
const server = app.listen(PORT);

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;
