#!/bin/sh
set -e
# Inicia o servidor em background
/bin/ollama serve &
# Aguarda o servidor ficar disponível usando o próprio CLI
for i in $(seq 1 30); do
  if ollama list >/dev/null 2>&1; then
    break
  fi
  echo "Aguardando ollama server iniciar... ($i/30)"
  sleep 1
done
# Faz o pull do modelo (só baixa se não existir)
ollama pull llama3.2:1b
# Para garantir, mantém o servidor em foreground
wait