# injury-detector

Interface web (SPA em **React 19 + TypeScript + Vite**) do InjuryDetector:
monitoramento de risco de lesão em corredores, visualização de métricas de carga e
prontidão fisiológica, explicabilidade preditiva (SHAP), além de registro de treinos,
diário de bem-estar e gestão do perfil do atleta.

Faz parte de um conjunto de 4 repositórios:

| Repo | Responsabilidade |
|---|---|
| **`injury-detector`** | **Front-end (React + TS) (este repo)** |
| `injury-detector-api` | APIs Node |
| `injury-detector-ml` | Serviço de ML (V4) em container |
| `injury-detector-platform` | Infraestrutura (Terraform) + banco |

## Estrutura

```
src/
├── components/          # componentes visuais e modais
│   ├── ConfirmationModal.tsx  # modal de confirmação de exclusão
│   ├── ExplainPanel.tsx       # painel de explicabilidade das predições (SHAP)
│   ├── Header.tsx             # cabeçalho de navegação e menu do atleta
│   ├── ProfileModal.tsx       # modal de edição de perfil e dados fisiológicos
│   ├── ProtectedRoute.tsx     # guarda de rotas autenticadas
│   └── Toast.tsx              # componente visual de notificações
├── contexts/            # gerenciamento de estado global (Context API)
│   ├── AuthContext.tsx        # sessão do usuário, login/logout e token JWT
│   └── ToastContext.tsx       # disparo de toasts de sucesso e erro
├── screens/             # telas principais da aplicação
│   ├── SignInScreen.tsx       # tela de login (/login)
│   ├── RegistrationScreen.tsx # cadastro de novos atletas (/register)
│   ├── HomeScreen.tsx         # dashboard principal com status de risco (/home)
│   ├── ChartsScreen.tsx       # séries temporais de risco, carga e SHAP (/charts)
│   ├── DailyInfoScreen.tsx    # registro e histórico do diário de bem-estar (/daily)
│   └── TrainingInfoScreen.tsx # registro e histórico de treinos de corrida (/training)
├── services/            # integração com o backend
│   ├── apiClient.ts           # cliente HTTP centralizado (fetch + injeção de JWT)
│   └── dataService.ts         # chamadas às rotas de atletas, diário, treinos e predições
├── types/               # definições de tipos e interfaces TypeScript
└── utils/               # utilitários de formatação e conversão de escalas
deploy.ps1               # script automatizado de build e deploy (S3 + CloudFront)
```

## Variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto a partir do modelo `.env.example`:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `VITE_API_BASE_URL` | URL base do API Gateway HTTP (ex.: `https://<api-id>.execute-api.sa-east-1.amazonaws.com`) |

## Execução local

Pré-requisitos: **Node.js >= 20** e **npm**.

```bash
# 1. instalar dependências
npm install

# 2. iniciar servidor de desenvolvimento com HMR
npm run dev

# 3. executar testes unitários (Vitest)
npx vitest run

# 4. checagem de tipos e lint
npm run lint
```

## Build & Deploy

O front-end é uma aplicação estática (SPA) hospedada em um bucket privado **AWS S3** e servida globalmente via **CloudFront** (CDN com HTTPS e Origin Access Control - OAC). Toda a infraestrutura necessária é provisionada pelo repositório `injury-detector-platform`.


O script automatiza as seguintes etapas:
1. `npm run build`: compilação e bundle do Vite (`tsc -b && vite build`) gerando os artefatos em `dist/`.
2. `aws s3 sync`: upload e sincronização dos arquivos gerados para o bucket S3 de hospedagem.
3. `aws cloudfront create-invalidation`: invalidação do cache da distribuição CloudFront (`/*`) para que a atualização entre no ar imediatamente.

## Telas e Funcionalidades

- **Autenticação e Perfil (`/login`, `/register`):** Login com persistência de token JWT em `localStorage`, cadastro de novos atletas e modal de visualização/edição do perfil (peso, altura, estilo de vida, baselines fisiológicos).
- **Dashboard Principal (`/home`):** Visão geral consolidada do atleta, exibindo o status atual de risco de lesão (baixo/alto risco, probabilidade e threshold), resumo do último registro diário e do último treino.
- **Gráficos e Análise Preditiva (`/charts`):** Série temporal da probabilidade de risco de lesão ao longo dos dias, evolução de carga acumulada de treino (TSS) e painel interativo de **explicabilidade SHAP** (destacando quais fatores biométricos e de carga aumentaram ou diminuíram o risco em uma data selecionada).
- **Diário de Bem-Estar (`/daily`):** Registro de métricas diárias (frequência cardíaca de repouso, HRV, horas e qualidade de sono, prontidão pela manhã/noite e percepção de estresse). Apresenta as variáveis em escalas intuitivas e amigáveis ao usuário antes da conversão para as faixas técnicas do modelo. Inclui histórico paginado e ordenável.
- **Treinos de Corrida (`/training`):** Apontamento detalhado de sessões de treino (tipo de treino, duração, distância, elevação, FC média/máxima, cálculo de TSS e efeito de treino aeróbico/anaeróbico) com tabela paginada e ordenável.

