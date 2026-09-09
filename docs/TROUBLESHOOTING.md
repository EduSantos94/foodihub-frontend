# Troubleshooting - FoodiHub Frontend

## "Cannot connect to API"

**Sintoma**: Tela em branco, erros 404 ou timeout nas chamadas.

```bash
# Verificar se backend está rodando
curl http://localhost:3333/health

# Checar .env
cat .env | grep API_URL
```

Se estiver usando **emulador Android**, `localhost` não resolve para o host. Use:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3333
```

Se estiver em **dispositivo físico**, use o IP da sua máquina:
```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:3333
```

---

## "Metro bundler not starting"

```bash
# Limpar cache do Expo
npx expo start --clear

# Ou limpar manualmente
rm -rf node_modules
npm install
npm start
```

---

## "Port 3000 already in use" (Docker)

```bash
lsof -i :3000
kill -9 <PID>
docker compose up -d
```

---

## "Docker build failing"

```bash
# Rebuild sem cache
docker compose build --no-cache

# Ver logs
docker compose logs frontend
```

---

## "Expo QR Code não abre no celular"

- Celular e computador devem estar na **mesma rede Wi-Fi**
- Desativar firewall temporariamente para testar
- Usar `--tunnel` se em redes restritas: `npx expo start --tunnel`

---

## "iOS Simulator não abre"

```bash
# Verificar Xcode instalado
xcode-select --install

# Listar simuladores disponíveis
xcrun simctl list devices

# Resetar simulador
xcrun simctl erase all
```

---

## "Android Emulator não encontrado"

```bash
# Listar AVDs
emulator -list-avds

# Iniciar AVD específico
emulator -avd <nome_avd>
```
