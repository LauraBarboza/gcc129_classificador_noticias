# GCC129-Sistema Distribuído de Análise e Classificação de Notícias


## 📖 Descrição do Problema

### A "Dor" que o Projeto Resolve

Com o crescimento exponencial das redes sociais e plataformas digitais, a disseminação de notícias falsas (fake news) tornou-se um problema crítico na sociedade moderna. A velocidade com que informações incorretas se espalham pode causar:

- **Desinformação em massa**: Influenciando decisões políticas e sociais
- **Danos à saúde pública**: Especialmente durante crises sanitárias
- **Polarização social**: Aumentando conflitos e divisões na sociedade
- **Perda de confiança**: Nas instituições e na mídia tradicional

### Solução Proposta

Este sistema distribuído oferece uma solução automatizada para:
1. **Classificar** notícias como verdadeiras ou falsas usando IA
2. **Resumir** o conteúdo para facilitar a compreensão
3. **Processar** grandes volumes de texto de forma distribuída
4. **Fornecer** uma interface acessível para análise rápida

## 🏗️ Arquitetura do Sistema

### Componentes Principais

1. **API Gateway** (Porta 4000)
   - Interface principal do sistema
   - Coordena comunicação entre microserviços
   - Frontend web integrado

2. **Fake News Classifier** (Porta 3000)
   - Agente especializado em classificação
   - Modelo local Ollama (llama3.2:1b)
   - Containerizado com Docker

3. **News Summarizer** (Porta 3001)
   - Agente especializado em resumos
   - Modelo local Ollama (llama3.2:1b)
   - Containerizado com Docker

4. **Ollama Services**
   - ollama-fake-news (Porta 11434)
   - ollama-summarizer (Porta 11435)

### Fluxo de Dados

```
[Cliente] → [API Gateway] → [Fake News Classifier] → [News Summarizer] → [Resposta Final]
```

## 🚀 Como Executar

### Pré-requisitos
- Docker
- Docker Compose
- Node.js

### Instruções

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd "gcc129_classificador_noticias"
```

2. Instale as dependências:
```bash
cd api && npm install && cd ../fake-news-classifier && npm install && cd ../news-summarizer && npm install
```

3. Execute o sistema:
```bash
docker-compose up -d
```

4. Acesse a aplicação:
```
http://localhost:4000
```

## 🔧 Tecnologias Utilizadas

- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **Docker**: Containerização
- **Ollama**: Execução local de LLMs
- **Llama 3.2 1B**: Modelo de linguagem
- **Axios**: Cliente HTTP
- **CORS**: Controle de acesso

## 🏛️ Arquitetura de Segurança

### Medidas Implementadas

1. **Isolamento de Containers**: Cada serviço em container separado
2. **Rede Isolada**: Comunicação através de rede Docker privada
3. **Usuários Não-Root**: Containers executam com usuários limitados
4. **Validação de Entrada**: Sanitização de dados de entrada
5. **Rate Limiting**: Proteção contra sobrecarga
6. **Logs Estruturados**: Monitoramento e auditoria

### Modelagem de Ameaças

#### Ameaças Identificadas:
- **Injeção de Prompt**: Manipulação maliciosa de prompts de IA
- **DDoS**: Sobrecarga do sistema
- **Data Poisoning**: Dados maliciosos para corromper modelos
- **Container Escape**: Fuga de containers

#### Mitigações Implementadas:
- Sanitização rigorosa de inputs
- Rate limiting por IP
- Isolamento de rede entre containers
- Usuários não-privilegiados
- Monitoramento de logs

## 👥 Equipe

- [Laura Sarto]
- [Matheus Bueno] 
- [Pedro Otávio]
- 

## 📄 Licença

Este projeto é desenvolvido para fins acadêmicos como parte da disciplina de Sistemas Distribuídos.
