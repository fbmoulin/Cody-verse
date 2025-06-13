#!/bin/bash

echo "🔄 Atualizando repositório local com as alterações do GitHub..."

# Puxa as últimas atualizações da branch main
git pull origin main

if [ $? -eq 0 ]; then
  echo "✅ Atualização concluída com sucesso!"
else
  echo "❌ Ocorreu um erro ao puxar as atualizações."
fi
