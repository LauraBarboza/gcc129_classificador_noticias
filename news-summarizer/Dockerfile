# Use a imagem oficial do Node.js
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Criar diretório para logs
RUN mkdir -p logs

# Copiar código fonte
COPY src/ ./src/

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Dar permissões ao usuário para o diretório de logs
RUN chown -R nodejs:nodejs /app

# Instalar curl para debug e testes
USER root
RUN apk add --no-cache curl
USER nodejs

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3001

# Comando de health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http'); \
  const options={hostname:'localhost',port:3000,path:'/health',timeout:2000}; \
  const req=http.request(options,(res)=>{process.exit(res.statusCode===200?0:1)}); \
  req.on('error',()=>process.exit(1)); \
  req.end();"

# Comando para iniciar a aplicação
CMD ["npm", "start"]