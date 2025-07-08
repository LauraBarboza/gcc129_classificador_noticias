import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// Configure as URLs dos agentes
const VERIFICADOR_URL = 'http://localhost:3000/classify';

app.post('/analisar', async (req, res) => {
  const { noticia } = req.body;
  if (!noticia) {
    return res.status(400).json({ erro: 'Notícia não informada.' });
  }
  try {
    // Chama o agente verificador
    const resposta = await axios.post(VERIFICADOR_URL, { text: noticia });

    return res.json(resposta.data);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao comunicar com os agentes.', detalhes: error });
  }
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
