# Setup - FoodiHub Frontend

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app (iOS/Android) ou simulador local

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env

# Iniciar Expo dev server
npm start
```

Com o servidor rodando, escolha a plataforma:
- Pressione `w` → abre no navegador (web)
- Pressione `i` → abre no iOS Simulator
- Pressione `a` → abre no Android Emulator
- Escaneie o QR Code com o app Expo Go no celular

## Docker (Web)

```bash
# Copiar variáveis de ambiente
cp .env.example .env

# Build e start
docker compose up -d

# Frontend disponível em http://localhost:3000
```

## Variáveis de Ambiente

| Variável                | Descrição               | Padrão                  |
|-------------------------|-------------------------|-------------------------|
| `EXPO_PUBLIC_API_URL`   | URL da API backend      | `http://localhost:3333` |

## Conexão com o Backend

O frontend consome a API do backend. Certifique-se de que o backend está rodando antes de iniciar o frontend.

```bash
# Verificar backend
curl http://localhost:3333/health

# Se usando emulador Android, trocar localhost por:
EXPO_PUBLIC_API_URL=http://10.0.2.2:3333
```

## Build de Produção

```bash
# Web
npm run build

# iOS / Android via EAS
eas build --platform ios
eas build --platform android
```
