# CodyVerse Educational Platform

Uma plataforma educacional avançada com IA, gamificação e arquitetura modular.

## 🏗️ Arquitetura Monorepo

Este projeto utiliza uma arquitetura monorepo para organizar o código em pacotes modulares:

```
codyverse/
├── packages/
│   ├── shared/           # Tipos, schemas e utilitários compartilhados
│   ├── frontend/         # Aplicação Next.js React
│   ├── backend/          # API Node.js + Express
│   ├── ui-components/    # Biblioteca de componentes UI
│   ├── api/              # Cliente API
│   └── database/         # Esquemas e migrações DB
├── tools/                # Ferramentas de desenvolvimento
└── docs/                 # Documentação
```

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 20+
- npm 10+
- PostgreSQL 15+

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/codyverse/platform.git
cd platform

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar migrações do banco
npm run migrate:dev

# Iniciar em modo desenvolvimento
npm run dev
```

## 📦 Pacotes

### @codyverse/shared

Biblioteca compartilhada com tipos TypeScript, schemas Zod e utilitários.

```bash
# Construir pacote shared
npm run build --workspace=@codyverse/shared

# Executar testes
npm run test --workspace=@codyverse/shared
```

### @codyverse/backend

API Node.js com Express, autenticação JWT, validação e segurança.

```bash
# Desenvolvimento
npm run dev --workspace=@codyverse/backend

# Produção
npm run build --workspace=@codyverse/backend
npm run start --workspace=@codyverse/backend
```

### @codyverse/frontend

Aplicação React com Next.js, TailwindCSS e componentes modulares.

```bash
# Desenvolvimento
npm run dev --workspace=@codyverse/frontend

# Build de produção
npm run build --workspace=@codyverse/frontend
npm run start --workspace=@codyverse/frontend
```

## 🛠️ Scripts Disponíveis

### Desenvolvimento

```bash
npm run dev              # Todos os pacotes em paralelo
npm run dev:frontend     # Apenas frontend
npm run dev:backend      # Apenas backend
```

### Build e Deploy

```bash
npm run build           # Build todos os pacotes
npm run build:all       # Build com Turbo
npm run start:prod      # Iniciar produção
```

### Testes

```bash
npm run test            # Todos os testes
npm run test:unit       # Testes unitários
npm run test:integration # Testes de integração
npm run test:e2e        # Testes end-to-end
```

### Banco de Dados

```bash
npm run migrate:dev     # Migrações desenvolvimento
npm run migrate:prod    # Migrações produção
npm run seed            # Popular banco com dados
```

### Qualidade de Código

```bash
npm run lint            # Linter ESLint
npm run type-check      # Verificação TypeScript
npm run format          # Formatação Prettier
npm run format:check    # Verificar formatação
```

## 🏛️ Tecnologias

### Backend
- **Node.js 20** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados
- **Drizzle ORM** - ORM type-safe
- **Zod** - Validação de schemas
- **JWT** - Autenticação
- **Winston** - Logging

### Frontend
- **Next.js 14** - Framework React
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **TailwindCSS** - Estilização
- **Framer Motion** - Animações
- **React Query** - Estado do servidor
- **Zustand** - Estado global
- **React Hook Form** - Formulários

### Ferramentas
- **Turbo** - Build system monorepo
- **ESLint** - Linting
- **Prettier** - Formatação
- **Jest** - Testes unitários
- **Playwright** - Testes E2E

## 📁 Estrutura de Pastas

### Backend (`packages/backend/`)

```
src/
├── controllers/        # Controladores da API
├── middleware/         # Middleware Express
├── routes/            # Definições de rotas
├── services/          # Lógica de negócio
├── database/          # Configuração DB
├── utils/             # Utilitários
└── types/             # Tipos específicos
```

### Frontend (`packages/frontend/`)

```
src/
├── app/               # Páginas Next.js (App Router)
├── components/        # Componentes React
├── hooks/             # Custom hooks
├── lib/               # Configurações e utilitários
├── stores/            # Estado global
└── types/             # Tipos específicos
```

### Shared (`packages/shared/`)

```
src/
├── types/             # Tipos TypeScript
├── schemas/           # Schemas Zod
└── utils/             # Utilitários compartilhados
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/codyverse

# Authentication
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# OpenAI (opcional)
OPENAI_API_KEY=your-openai-key

# Environment
NODE_ENV=development
PORT=5000
```

### Configuração do Banco

1. Criar banco PostgreSQL
2. Configurar `DATABASE_URL`
3. Executar migrações: `npm run migrate:dev`
4. Popular dados (opcional): `npm run seed`

## 🧪 Testes

### Testes Unitários

```bash
# Executar testes específicos
npm run test --workspace=@codyverse/shared
npm run test --workspace=@codyverse/backend
npm run test --workspace=@codyverse/frontend
```

### Testes de Integração

```bash
# Testes da API
npm run test:integration --workspace=@codyverse/backend
```

### Testes E2E

```bash
# Testes completos
npm run test:e2e --workspace=@codyverse/frontend
```

## 📚 Documentação

- [Guia de Desenvolvimento](./docs/DEVELOPMENT.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit as mudanças: `git commit -m 'Adiciona nova feature'`
4. Push para a branch: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

- **Desenvolvimento**: CodyVerse Team
- **Arquitetura**: Monorepo com TypeScript
- **Status**: Em desenvolvimento ativo

---

**CodyVerse** - Educação do futuro com IA e gamificação 🚀