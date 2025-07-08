const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rota principal para classificação
app.post('/classify', async (req, res) => {
  try {
    const { text } =req.body;

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
    const modelOutput = ollamaResponse.data && ollamaResponse.data.message && ollamaResponse.data.message.content
      ? ollamaResponse.data.message.content
      : '[Erro: resposta inválida do modelo]';

    // Encontrar a categoria retornada
    const matchedLabel = candidateLabels.find(label => modelOutput.toLowerCase().includes(label.toLowerCase())) || modelOutput;

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
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível processar a classificação'
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
