# UANJI

Aplicação web de gestão de inscrições, autenticação, área académica e apoio entre alunos e explicadores.

## Visão geral

Este projeto combina:

- frontend em HTML, CSS e JavaScript
- backend em Node.js com servidor HTTP
- autenticação por sessão
- base de dados PostgreSQL
- integração com Supabase para produção
- deploy na Vercel

A aplicação inclui:

- autenticação de alunos e administradores
- gestão de inscrições e formações
- painel académico com cursos, disciplinas e explicadores
- associação de explicadores às disciplinas
- pedidos de apoio entre aluno e explicador
- fluxo de primeiro acesso para explicadores

---

## Requisitos

- Node.js 18+
- PostgreSQL 16+
- acesso ao Supabase ou a uma instância PostgreSQL local
- Vercel para deployment

---

## Instalação local

### 1. Clonar o projeto

```bash
cd "/caminho/para/UANJI"
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar a base de dados

Cria uma base de dados PostgreSQL e importa os scripts necessários.

#### Base principal

```bash
psql -U postgres -d projecto2 -f database/projecto2.sql
```

#### Camada académica

```bash
psql -U postgres -d projecto2 -f database/sprint2_academico.sql
```

#### Migrações adicionais

Se a base já existir, executa as migrações necessárias:

```bash
psql -U postgres -d projecto2 -f database/migracao_pedidos_eliminacao_apoio.sql
psql -U postgres -d projecto2 -f database/migracao_conta_explicador.sql
psql -U postgres -d projecto2 -f database/migracao_perfil_aluno.sql
psql -U postgres -d projecto2 -f database/migracao_sessoes.sql
```

A última migração cria a tabela de sessões para produção, porque o servidor não pode depender da memória local da instância em ambientes como a Vercel.

### 4. Configurar a ligação da base de dados

O ficheiro `db/database.js` define a ligação ao PostgreSQL:

```js
const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

Em ambiente local, normalmente usa-se uma base PostgreSQL local e a variável `DATABASE_URL` deve apontar para essa base.

### 5. Iniciar a aplicação

```bash
npm start
```

A aplicação fica disponível em:

```text
http://localhost:3000
```

---

## Sessões e produção na Vercel

A aplicação guarda a sessão em PostgreSQL em vez de só em memória. Isso é importante porque a Vercel reinicia a aplicação em certas condições e a memória do processo desaparece.

A tabela necessária é:

- `public.sessoes`

A migração correspondente está em:

- `database/migracao_sessoes.sql`

Sem esta tabela, os utilizadores podem voltar a aparecer como não autenticados após refresh ou após reinício do servidor.

---

## Estrutura principal

- `server.js` — servidor principal da aplicação
- `db/database.js` — ligação ao PostgreSQL
- `js/` — scripts do frontend
- `css/` — estilos
- `database/` — SQL e migrações
- `index.html` — página inicial
- `admin.html` — login administrativo
- `aluno.html` — área do aluno
- `explicador.html` — área do explicador
- `painel.html` — painel administrativo

---

## Fluxos principais

### Autenticação

- administrador entra com login e sessão protegida
- aluno entra com email e password
- sessão é persistida em base de dados

### Gestão académica

- adicionar e editar cursos académicos
- criar disciplina e associar a curso
- criar explicador e definir password inicial
- associar explicador a disciplina

### Apoio académico

- aluno envia pedido de apoio a um explicador
- explicador aceita ou recusa a solicitação
- admin acompanha pedidos e estados

---

## Deploy na Vercel

1. Faz push do projeto para o GitHub.
2. Conecta o repositório na Vercel.
3. Define a variável de ambiente `DATABASE_URL` com a ligação do Supabase/PostgreSQL.
4. Faz redeploy do projeto.
5. Garante que a tabela `public.sessoes` existe no banco.

Arquivo de configuração da Vercel:

- `vercel.json`

---

## Dicas importantes

- Não dependas da memória do processo para autenticação em produção.
- Mantém a `DATABASE_URL` correta no ambiente de produção.
- Se o projeto for migrado para outra plataforma, a mesma lógica de sessão persistente deve continuar a funcionar.
- O SQL deve ser executado no banco de produção antes de testar o login em produção.

---

## Scripts úteis

```bash
npm install
npm start
```

Para validação do servidor:

```bash
node --check server.js
```

---

## Estado do projeto

O projeto está funcional em desenvolvimento local e foi ajustado para funcionar corretamente em ambiente de produção com sessão persistente em base de dados.
