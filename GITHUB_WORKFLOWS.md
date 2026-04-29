# 🚀 GitHub Workflows - Visão Geral

Adicionados 3 workflows de CI/CD profissionais e automáticos para o projeto `dep-trust-score`.

---

## 📋 Workflows Configurados

### 1. **test.yml** - Tests & Quality Checks ✅
**Status**: Executa em cada push/PR para main/develop

```
Trigger: Push ou Pull Request
├── Test Job (Paralelo em 3 versões do Node: 16.x, 18.x, 20.x)
│   ├── ✅ Checkout
│   ├── ✅ Setup Node.js + npm cache
│   ├── ✅ npm install
│   ├── ✅ npm run build (TypeScript)
│   ├── ✅ npm run lint (ESLint)
│   ├── ✅ npm test (Jest)
│   ├── ✅ npm run test:coverage
│   ├── ✅ Upload para Codecov
│   └── ✅ Archive coverage reports
│
├── Quality Job (Depende de test)
│   ├── ✅ npm audit --audit-level=moderate
│   └── ✅ npm run format --check (Prettier)
│
└── Publish-Ready Job (Depende de test + quality)
    ├── ✅ Build verification
    ├── ✅ dist/index.js check
    ├── ✅ dist/index.d.ts check
    ├── ✅ package.json validation
    └── ✅ CLI verification
```

**Arquivo**: `.github/workflows/test.yml` (2,961 bytes)

---

### 2. **dependency-check.yml** - Dependency Trust Score Check 📊
**Status**: Executa em mudanças de package.json e diariamente (00:00 UTC)

```
Trigger: PR com mudanças em package.json OU Schedule (00:00 UTC)
├── ✅ Checkout
├── ✅ Setup Node.js
├── ✅ npm install
├── ✅ Build CLI
├── ✅ Extract top 20 dependencies
├── ✅ Run trust-score batch analysis
├── ✅ Parse results (TOTAL, AVERAGE, CRITICAL, LOW_TRUST)
├── ✅ Comment on PR with scores table
├── ✅ Report critical packages
└── ✅ Upload results as artifact
```

**Arquivo**: `.github/workflows/dependency-check.yml` (5,385 bytes)

**Saída**:
- Comentário automático em PRs com tabela de scores
- Upload de `trust-scores.json` como artifact
- Aviso para pacotes críticos (score < 30)

---

### 3. **publish.yml** - Publish to npm 📦
**Status**: Executa em releases do GitHub ou manualmente

```
Trigger: GitHub Release publicada OU workflow_dispatch (manual)
├── Validate Job
│   ├── ✅ Checkout
│   ├── ✅ Setup Node.js
│   ├── ✅ npm install
│   ├── ✅ npm run build
│   ├── ✅ npm test
│   └── ✅ npm run lint
│
├── Publish Job (Depende de validate)
│   ├── ✅ Setup registry (npmjs.org)
│   ├── ✅ npm install
│   ├── ✅ npm run build
│   ├── ✅ Check version consistency
│   ├── ✅ npm publish
│   ├── ✅ Upload release asset
│   └── ✅ Comment on release
│
├── Notify Success
│   └── ✅ Confirmation message
│
└── Notify Failure
    └── ✅ Error notification
```

**Arquivo**: `.github/workflows/publish.yml` (3,684 bytes)

**Variáveis de Ambiente**:
- Requer secret: `NPM_TOKEN` (Token de publicação npm)

---

## 🎯 Como Usar

### 1. **Testes Automáticos** (A cada push/PR)

```bash
# Simplesmente faça push
git push origin main

# Ou abra um PR para main/develop
# → Os testes rodam automaticamente
# → Veja em: GitHub → Actions → Tests & Quality Checks
```

### 2. **Verificação de Dependências** (A cada mudança em package.json)

```bash
# Modifique package.json
vim package.json

# Commit e push
git add package.json
git commit -m "Update dependencies"
git push origin main

# → Workflow roda automaticamente
# → Tabela de scores comentada no PR
# → Artifacts salvos para análise
```

### 3. **Publicação no npm**

**Opção A: Automática (ao criar release)**

```bash
# Crie uma tag
git tag v1.0.0

# Push da tag (dispara release no GitHub)
git push origin v1.0.0

# → No GitHub: Releases → Draft a new release
# → Publish release
# → Workflow publica automaticamente no npm
```

**Opção B: Manual (workflow_dispatch)**

```
GitHub UI → Actions → Publish to npm → Run workflow
→ Selecione npm_tag (latest/beta/alpha)
→ Run
```

---

## 📊 Visualizar Resultados

### Via GitHub UI

1. **Actions Tab**
   ```
   Seu Repo → Actions → Selecione um workflow
   ```

2. **Ver Logs Detalhados**
   ```
   Actions → Nome do Workflow → Clique em uma Run
   → Expanda cada Job para ver detalhes
   ```

3. **Download de Artifacts**
   ```
   Run específica → Scroll para baixo → Download artifacts
   ```

### Badges para README

Copie e cole no seu README.md:

```markdown
## CI/CD Status

[![Tests](https://github.com/seu-usuario/dep-trust-score/actions/workflows/test.yml/badge.svg)](https://github.com/seu-usuario/dep-trust-score/actions/workflows/test.yml)
[![Dependency Check](https://github.com/seu-usuario/dep-trust-score/actions/workflows/dependency-check.yml/badge.svg)](https://github.com/seu-usuario/dep-trust-score/actions/workflows/dependency-check.yml)
[![Publish](https://github.com/seu-usuario/dep-trust-score/actions/workflows/publish.yml/badge.svg)](https://github.com/seu-usuario/dep-trust-score/actions/workflows/publish.yml)
```

---

## 🔐 Configuração Requerida

### Secret: `NPM_TOKEN`

Para que o workflow de publicação funcione, você precisa adicionar seu npm token ao GitHub:

1. **Gere um token no npm**:
   ```bash
   npm login
   cat ~/.npmrc
   # Copie o token
   ```

2. **Adicione ao GitHub**:
   - Repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Cole seu token npm

---

## ✨ Features dos Workflows

### ✅ Test Workflow
- [x] Testa em 3 versões do Node.js (16, 18, 20)
- [x] Build TypeScript com type checking
- [x] Lint com ESLint
- [x] Testes com Jest
- [x] Coverage reports
- [x] Codecov integration
- [x] Security audit (npm audit)
- [x] Format checking (Prettier)
- [x] Build validation

### ✅ Dependency Check Workflow
- [x] Análise de trust scores
- [x] Comentário automático em PRs
- [x] Tabela de scores formatada
- [x] Detecção de pacotes críticos
- [x] Artifacts com resultados
- [x] Verificação diária (scheduled)
- [x] Continue on error (não falha build)

### ✅ Publish Workflow
- [x] Validação antes de publicar
- [x] Testes antes de publicar
- [x] Lint antes de publicar
- [x] Publicação automática em releases
- [x] Suporte a tags npm (latest/beta/alpha)
- [x] Workflow dispatch (manual trigger)
- [x] Comentário automático em releases
- [x] Upload de assets

---

## 📈 Exemplos de Output

### Test Workflow
```
✅ All tests passed (3 Node versions)
✅ Coverage: 85%
✅ Code quality OK
✅ Build ready for npm
```

### Dependency Check Workflow
```
📊 Dependency Trust Score Analysis

**Summary:**
- Total Packages: 20
- Average Score: 78.5/100
- Critical (<30): 0
- Low Trust (<50): 2

**Package Scores:**

| Package | Score | Status |
|---------|-------|--------|
| express | 85.3 | ✅ |
| lodash | 88.2 | ✅ |
| old-package | 25.1 | ❌ |
```

### Publish Workflow
```
✅ Validation passed
✅ Tests passed  
✅ Published version 1.0.0 to npm
✅ Available at: https://www.npmjs.com/package/dep-trust-score
```

---

## 🔧 Customizações Possíveis

### Adicionar mais versões do Node.js
```yaml
strategy:
  matrix:
    node-version: [14.x, 16.x, 18.x, 20.x]  # Adicione aqui
```

### Mudar branches monitoradas
```yaml
on:
  push:
    branches: [main, develop, staging]  # Adicione branches aqui
```

### Mudar schedule de verificação de dependências
```yaml
schedule:
  - cron: '0 */6 * * *'  # A cada 6 horas
  - cron: '0 0 * * 0'    # Semanalmente (domingo)
```

---

## 📚 Documentação

Detalhes completos em: `.github/workflows/README.md`

---

## 🚀 Próximos Passos

1. ✅ Workflows criados
2. ⏭️ Commit e push para GitHub
3. ⏭️ Configure NPM_TOKEN secret
4. ⏭️ Crie primeira release/tag
5. ⏭️ Veja workflows executando

---

## 🎓 Referências

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Node.js Setup Action](https://github.com/actions/setup-node)
- [Upload Artifact](https://github.com/actions/upload-artifact)
- [GitHub Script](https://github.com/actions/github-script)

---

**Criado em**: 28 de abril de 2026
