# FoodiHub Frontend

Interface móvel React Native com Expo, autenticação JWT e integração com backend FoodiHub.

## Arquitetura

```
app/
├── screens/         Telas principais (Login, Dashboard, Stores, etc)
├── components/      Componentes reutilizáveis
├── services/        Serviços de API e autenticação
├── context/         React Context para estado global
├── utils/           Funções utilitárias
└── types/           Tipos TypeScript
```

## Documentação

- [Setup](./docs/SETUP.md) - Instalação e configuração
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Problemas comuns
- [Contributing](./docs/CONTRIBUTING.md) - Guia de contribuição

## Desenvolvimento Local

### Pré-requisitos
- Node.js 18+ ou 20+
- Expo CLI: `npm install -g expo-cli`
- Simulador iOS/Android ou Expo Go app

### Setup

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.dev .env

# Verificar que backend está rodando em http://localhost:3333
```

### Dev Server

```bash
# Iniciar Expo dev server
npm start

# Opções:
# - Pressionar 'i' para abrir iOS Simulator
# - Pressionar 'a' para abrir Android Emulator
# - Escanear QR Code com Expo Go app
```

## Build

### Web (Expo Web)

```bash
npm run web
```

### EAS Build (Cloud)

```bash
eas login
eas build --platform ios
eas build --platform android
```

### Local Build

```bash
# Android
eas build --platform android --local

# iOS
eas build --platform ios --local
```

## Docker (Development Web)

```bash
docker build -t foodihub-frontend .
docker run -p 3000:3000 foodihub-frontend
```

Ou via `docker-compose` (ver em `../config/docker-compose.yml`)

## Variáveis de Ambiente

```env
# API
VITE_API_URL=http://localhost:3333
EXPO_PUBLIC_API_URL=http://localhost:3333

# App
VITE_APP_NAME=FoodiHub
```

## Telas Principais

- **Login** - Autenticação com JWT
- **Register** - Criação de conta
- **Dashboard** - Home com lojas e estatísticas
- **Stores** - Listagem de lojas
- **Store Detail** - Detalhes e gerenciamento de loja
- **Users** - Gerenciamento de usuários (admin/manager)
- **Profile** - Perfil do usuário

## Autenticação

JWT token armazenado em AsyncStorage. Interceptor de requisições HTTP:

```typescript
// Requisição
GET /api/stores
Authorization: Bearer <token>

// Refresh automático em 401
```

## Scripts

- `npm start` - Expo dev server
- `npm run web` - Expo web
- `npm run build` - EAS build iOS/Android
- `npm run build:android` - Build Android local
- `npm run build:ios` - Build iOS local
- `npm run lint` - ESLint (se configurado)
- `npm run test` - Jest tests (se configurado)

## Troubleshooting

### "Cannot connect to API"
- Verificar que backend está rodando em `http://localhost:3333`
- Verificar `.env` com `EXPO_PUBLIC_API_URL` correto
- Se no emulador Android, usar `http://10.0.2.2:3333` em vez de `localhost`

### "Simulador não abre"
```bash
# iOS
xcrun simctl erase all

# Android
emulator -list-avds
emulator -avd <nome_avd>
```

### "Porta 3000 já em uso"
```bash
# Matar processo
lsof -ti:3000 | xargs kill -9

# Ou usar porta diferente
PORT=3001 npm run web
```

## Performance

- React Native com Expo Go para dev rápido
- EAS Build para compilações otimizadas
- Lazy loading de módulos
- Redux/Context para estado global

## Support

Para issues ou dúvidas, abrir issue na repo ou contactar time frontend.

---

**Stack**: React Native 0.73+ | Expo 50+ | TypeScript | JWT | AsyncStorage
