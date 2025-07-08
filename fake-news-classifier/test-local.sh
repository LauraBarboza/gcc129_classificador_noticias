#!/bin/bash

# Testa apenas a rota de classificação do fake-news-classifier
set -e

# Exemplo de payload para classificação
PAYLOAD='{"text": "Jair Messias Bolsonaro, do PSL, foi eleito o 38º presidente da República neste domingo (28) ao derrotar em segundo turno o petista Fernando Haddad, interrompendo um ciclo de vitórias do PT que vinha desde 2002. A vitória foi confirmada às 19h18, quando, com 94,44% das seções apuradas, Bolsonaro alcançou 55.205.640 votos (55,54% dos válidos) e não podia mais ser ultrapassado por Haddad, que naquele momento somava 44.193.523 (44,46%). Com 100% das seções apuradas, Bolsonaro recebeu 57.797.847 votos (55,13%) e Haddad, 47.040.906 (44,87%)."}' 
echo "Testando endpoint de classificação..."
curl -s -X POST http://localhost:3000/classify \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" | jq . || curl -s -X POST http://localhost:3000/classify -H "Content-Type: application/json" -d "$PAYLOAD"

echo "[OK] Teste de classificação concluído."
