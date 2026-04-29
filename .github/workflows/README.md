# GitHub Actions Workflows

Este diretório contém os workflows de CI/CD para o projeto `dep-trust-score`.

## 📋 Workflows Disponíveis

### 1. `test.yml` - Tests & Quality Checks

**Trigger**: 
- Push para `main` ou `develop`
- Pull requests para `main` ou `develop`

**Jobs**:

#### Job: `test`
Testa o projeto em múltiplas versões do Node.js (20.x, 22.x, 24.x)

**Steps**:
1. ✅ Checkout do código
2. ✅ Setup Node.js (com cache npm)
3. ✅ Instalação de dependências
4. ✅ Build TypeScript
5. ✅ Lint (ESLint)
6. ✅ Testes (Jest)
7. ✅ Testes com coverage (cobertura de código)
8. ✅ Upload de reports para codecov.io
9. ✅ Arquivamento de coverage reports como artefato

**Saída**:
- Reports de cobertura salvos como artefatos do GitHub
- Integração com Codecov para histórico de cobertura

#### Job: `quality`
Verifica qualidade do código

**Requisitos**: Depende de `test` estar concluído

**Steps**:
1. ✅ Setup Node.js
2. ✅ Auditoria de segurança npm
3. ✅ Verificação de formatação Prettier

#### Job: `publish-ready`
Valida se o projeto está pronto para publicação no npm

**Requisitos**: Depende de `test` e `quality` estarem concluídos

**Steps**:
1. ✅ Build do projeto
2. ✅ Verificação de dist/index.js
3. ✅ Verificação de dist/index.d.ts (tipos TypeScript)
4. ✅ Validação de package.json
5. ✅ Verificação da CLI

---

## 🚀 Como Usar

### Local (Simular o workflow)

```bash
# Testes em uma versão do Node
npm test

# Testes com coverage
npm run test:coverage

# Lint
npm run lint

# Build
npm run build
```

### No GitHub

O workflow **roda automaticamente** quando você:

1. **Push para main/develop**
```bash
git push origin main
```

2. **Cria um Pull Request** para main/develop
```bash
git push origin feature-branch
# Depois abrir PR no GitHub
```

---

## 📊 Visualizar Resultados

### No GitHub UI

1. Ir para: **Actions** > **Tests & Quality Checks**
2. Ver o status de cada job
3. Clicar em um job para ver os logs detalhados
4. Download de artefatos (coverage reports)

### Badges para README

Adicione ao seu README.md:

```markdown
[![Tests](https://github.com/seu-org/dep-trust-score/actions/workflows/test.yml/badge.svg)](https://github.com/seu-org/dep-trust-score/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/seu-org/dep-trust-score/branch/main/graph/badge.svg)](https://codecov.io/gh/seu-org/dep-trust-score)
```

---

## 🔍 Estrutura do Workflow

```
test.yml
├── test (Roda em paralelo para 3 versões do Node)
│   ├── Setup
│   ├── Build
│   ├── Lint
│   ├── Tests
│   ├── Coverage
│   └── Archive Results
│
├── quality (Depende de test)
│   ├── Security Audit
│   └── Format Check
│
└── publish-ready (Depende de test + quality)
    ├── Build Verification
    ├── Types Check
    ├── package.json Validation
    └── CLI Verification
```

---

## 📝 Logs e Debugging

### Ver logs do workflow

1. GitHub UI → Actions → Nome do workflow
2. Clicar em um run específico
3. Clicar no job para expandir
4. Clicar em um step para ver detalhes

### Problemas comuns

#### ❌ "npm: command not found"
Verifique que o Node.js setup está correto

#### ❌ "dist not found"
Execute `npm run build` localmente para verificar

#### ❌ Testes falhando
- Rode `npm test` localmente
- Verifique variáveis de ambiente
- Confirm que dependências estão no package.json

---

## 🎯 Próximos Passos (Opcional)

### Adicionar workflow de release/publicação

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'
      - run: npm install
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.npm_token }}
```

### Adicionar análise de segurança

```yaml
- name: Run Snyk to check for vulnerabilities
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

---

## 📚 Referência

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Node.js Setup Action](https://github.com/actions/setup-node)
- [Codecov Action](https://github.com/codecov/codecov-action)
- [Jest Documentation](https://jestjs.io/)
- [ESLint Documentation](https://eslint.org/)

---

**Configurado em**: 28 de abril de 2026
