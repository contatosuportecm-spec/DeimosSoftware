#!/bin/bash
# Copia variáveis de ambiente do local seguro para o projeto.
# Rode após clonar: bash scripts/setup-env.sh

ENV_SOURCE="$HOME/.config/deimos/.env.scale"
ENV_TARGET=".env.local"

if [ -f "$ENV_SOURCE" ]; then
  cp "$ENV_SOURCE" "$ENV_TARGET"
  echo "✓ .env.local configurado a partir de ~/.config/deimos/.env.scale"
else
  echo "✗ Arquivo $ENV_SOURCE não encontrado."
  echo "  Crie manualmente o .env.local usando .env.example como base."
  exit 1
fi
