#!/bin/bash

if [ -z "$1" ]; then
  echo "⚠️  Por favor, forneça uma mensagem de commit:"
  echo "   Exemplo: bash commit.sh \"Corrigido bug no formulário\""
  exit 1
fi

echo "📂 Adicionando arquivos..."
git add .

echo "📝 Criando commit..."
git commit -m "$1"

echo "🚀 Enviando para o GitHub..."
git push

echo "✅ Commit enviado com sucesso!"
