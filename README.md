# UANJI

## Como executar o projeto

### Pré-requisitos

- Node.js 18 ou superior
- PostgreSQL 16 ou superior
- `psql` disponível no terminal, ou pgAdmin instalado

### 1. Obter o projeto

Clone ou copie o projeto e entre na pasta:

```bash
cd UANJI
```

### 2. Criar e preencher a base de dados

O ficheiro `database/projecto2.sql` contém as tabelas, relações, dados de exemplo e sequências necessárias. Ele não cria a base de dados, por isso é necessário criar a base antes de importar o ficheiro.

#### Opção A: através do terminal

1. Inicie o serviço do PostgreSQL.
2. Crie uma base de dados chamada `projecto2`:

   ```bash
   createdb -U postgres projecto2
   ```

   Se o comando `createdb` não estiver disponível, execute:

   ```bash
   psql -U postgres -c "CREATE DATABASE projecto2;"
   ```

3. Importe o esquema e os dados do projeto:

   ```bash
   psql -U postgres -d projecto2 -f database/projecto2.sql
   ```

   Quando for solicitada, introduza a palavra-passe do utilizador `postgres`.

4. Confirme se as tabelas foram criadas:

   ```bash
   psql -U postgres -d projecto2 -c "\dt"
   ```

   Devem aparecer, entre outras, as tabelas `administradores`, `formacoes`, `inscricoes`, `servicos` e `utilizadores`.

#### Opção B: através do pgAdmin

1. Abra o pgAdmin e ligue-se ao servidor PostgreSQL.
2. Clique com o botão direito em **Databases** e escolha **Create > Database**.
3. Crie a base com o nome `projecto2` e o proprietário `postgres`.
4. Selecione a base `projecto2`, abra **Query Tool** e escolha **File > Open**.
5. Abra `database/projecto2.sql` e execute o script.

#### Recriar também a camada académica do Sprint 2

Se a máquina ainda não tiver os objetos académicos criados, importa-se também o script dedicado:

```bash
psql -U postgres -d projecto2 -f database/sprint2_academico.sql
```

Esse script cria e liga as tabelas:

- `cursos_academicos`
- `disciplinas`
- `explicadores`
- `disciplina_explicadores`
- `solicitacoes_apoio`
- `pedidos_eliminacao_apoio`

e carrega os dados iniciais de exemplo com cursos, disciplinas, explicadores e a associação entre disciplina e explicador.

A tabela `pedidos_eliminacao_apoio` é usada quando um aluno pede para remover uma solicitação de apoio. O pedido fica pendente até o administrador aceitar ou recusar. A tabela original `solicitacoes_apoio` não é alterada.

Se estiver a usar a mesma máquina com a base já criada, o passo mais simples é o seguinte:

```bash
psql -U postgres -d projecto2 -f database/sprint2_academico.sql
```

#### Atualizar uma base de dados já existente

Se a base `projecto2` já foi criada e o ficheiro `database/sprint2_academico.sql` já foi executado anteriormente, execute a migração nova para criar apenas a estrutura dos pedidos de eliminação:

```bash
psql -U postgres -d projecto2 -f database/migracao_pedidos_eliminacao_apoio.sql
```

Esta migração é segura para executar mais do que uma vez. Não cria outro banco, não apaga dados e não altera as tabelas existentes.

No final, confirme que a camada académica está lá:

```bash
psql -U postgres -d projecto2 -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('cursos_academicos','disciplinas','explicadores','disciplina_explicadores','solicitacoes_apoio','pedidos_eliminacao_apoio') ORDER BY table_name;"
```

Devem aparecer também `solicitacoes_apoio` e `pedidos_eliminacao_apoio`.

Se o PostgreSQL da sua máquina tiver outra palavra-passe, altere o campo `password` em `db/database.js` para o valor correcto.

### 3. Executar o arquivo atualizar_cursos no pgAdmin

1. Abra o pgAdmin e ligue-se ao servidor PostgreSQL.
2. Clique em **Databases** e escolha `projecto2`
3. Clica com botão direito, escolha **Query Tool** e escolha **File > Open**.
4. Abra `database/atualizar_cursos.sql` e execute o script.

### 4. Confirmar a ligação da aplicação

As credenciais usadas atualmente pela aplicação estão em `db/database.js`:

- Utilizador: `postgres`
- Palavra-passe: `12345678`
- Host: `localhost`
- Porta: `5432`
- Base de dados: `projecto2`

Se o PostgreSQL da sua máquina tiver outra palavra-passe, altere o campo `password` nesse ficheiro antes de iniciar o servidor. Se utilizar outro utilizador, host, porta ou nome de base, atualize também os campos correspondentes.

### 5. Instalar as dependências

Na pasta do projeto, execute:

```bash
npm install
```

As versões instaladas estão registadas em `package-lock.json`.

### 6. Iniciar o servidor

Execute:

```bash
npm start
```

Depois, abra no navegador:

```text
http://localhost:3000
```
