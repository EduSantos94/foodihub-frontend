# Contributing - FoodiHub Frontend

## Fluxo de Trabalho

```bash
# 1. Criar branch
git checkout -b feature/nome-da-feature

# 2. Desenvolver
npm start

# 3. Commit
git commit -m "feat: descrição da feature"

# 4. Push e abrir PR
git push origin feature/nome-da-feature
```

## Convenções de Branch

| Prefixo      | Uso                        |
|--------------|----------------------------|
| `feature/`   | Nova funcionalidade        |
| `fix/`       | Correção de bug            |
| `refactor/`  | Refatoração de código      |
| `docs/`      | Documentação               |
| `style/`     | Ajustes visuais/estilos    |

## Padrões de Código

- Componentes funcionais com hooks (sem class components)
- TypeScript em todos os arquivos `.tsx`/`.ts`
- Estilos via `StyleSheet.create()` ou biblioteca de UI do projeto
- Tratar todos os estados: loading, error, empty, success

```tsx
// ✅ Bom
const StoreList: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ...
};

// ❌ Evitar
const StoreList = () => {
  const [data, setData] = useState(null); // sem tipo
  // ...
};
```

## Estrutura de Arquivos

```
app/
├── screens/        Uma pasta por tela principal
├── components/     Componentes reutilizáveis
├── services/       Chamadas de API
├── context/        Estado global
├── types/          Interfaces TypeScript
└── utils/          Funções auxiliares
```

## Checklist antes do PR

- [ ] Sem `console.log` esquecido
- [ ] Sem valores hardcoded (URLs, tokens, etc)
- [ ] Todos os estados tratados (loading/error/empty)
- [ ] Tipos TypeScript definidos
- [ ] Testado no iOS e Android (simulador ou device)
- [ ] Testado na versão web
