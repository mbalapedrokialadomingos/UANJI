# Sprint 2 API Académica — Documentação para o frontend

Este documento descreve a camada académica adicionada no backend, mantendo a camada de cursos profissionais/formações comercializadas intacta.

## Entidades

### Curso Académico

Representa um curso pertencente a uma instituição de ensino superior, com relação autónoma à estrutura de formações comercializadas.

Campos principais:
- id
- nome
- descricao
- codigo
- duracao
- created_at

### Disciplina

Representa uma disciplina associada a um curso académico.

Campos principais:
- id
- nome
- codigo
- descricao
- carga_horaria
- curso_academico_id

### Explicador

Representa o recurso humano que pode apoiar disciplinas do curso académico.

Campos principais:

### Relacionamento disciplina_explicadores

Tabela de associação entre disciplinas e explicadores, permitindo o futuro fluxo:

Curso Académico -> Disciplina -> Explicadores

## Endpoints

### GET /cursos-academicos

Método: GET

Objetivo: listar todos os cursos académicos.

Parâmetros: nenhum.

Resposta 200: array JSON com cursos académicos.

### POST /cursos-academicos

Método: POST

Objetivo: criar um curso académico.

Autorização: apenas administrador autenticado.

Body esperado:
{
  "nome": "Engenharia de Telecomunicações",
  "descricao": "Curso académico de telecomunicações",
  "codigo": "ET",
  "duracao": "4 anos"
}

Resposta 201: objeto com mensagem e curso.

### GET /cursos-academicos/:id

Método: GET

Objetivo: consultar um curso académico específico.

Parâmetros:

Resposta 200: objeto curso académico.

### PUT /cursos-academicos/:id

Método: PUT

Objetivo: atualizar um curso académico.

Autorização: apenas administrador autenticado.

Body esperado: JSON com campos de curso.

### DELETE /cursos-academicos/:id

Método: DELETE

Objetivo: remover um curso académico.

Autorização: apenas administrador autenticado.

### GET /cursos-academicos/:id/disciplinas

Método: GET

Objetivo: retornar todas as disciplinas de um curso académico.

Parâmetros:

Resposta 200: array JSON com disciplinas.

### GET /disciplinas

Método: GET

Objetivo: listar todas as disciplinas do sistema, com o nome do curso associado.

### POST /disciplinas

Método: POST

Objetivo: criar uma disciplina apontando para um curso académico existente.

Autorização: apenas administrador autenticado.

Body esperado:
{
  "nome": "Redes",
  "codigo": "RED",
  "descricao": "Disciplina de redes e infraestrutura",
  "carga_horaria": 70,
  "curso_academico_id": 1
}

### GET /disciplinas/:id

Método: GET

Objetivo: consultar uma disciplina específica com o curso associado.

### PUT /disciplinas/:id

Método: PUT

Objetivo: atualizar disciplina e o seu curso académico de origem.

### DELETE /disciplinas/:id

Método: DELETE

Objetivo: remover disciplina.

### GET /disciplinas/:id/explicadores

Método: GET

Objetivo: listar explicadores associados à disciplina.

### POST /disciplinas/:id/explicadores

Método: POST

Objetivo: associar um explicador existente a uma disciplina.

Autorização: apenas administrador autenticado.

Body esperado:
{
  "explicador_id": 1
}

### GET /explicadores

Método: GET

Objetivo: listar explicadores no backend.

### POST /explicadores

Método: POST

Objetivo: criar um explicador.

Autorização: apenas administrador autenticado.

Body esperado:
{
  "nome": "Ana Silva",
  "email": "ana.silva@instic.ao",
  "especialidade": "Redes e Comunicação",
  "bio": "Explicadora com foco em redes e infraestruturas.",
  "utilizador_id": 1
}

### PUT /explicadores/:id

Método: PUT

Objetivo: atualizar os dados de um explicador no painel administrativo.

Autorização: apenas administrador autenticado.

### DELETE /explicadores/:id

Método: DELETE

Objetivo: remover um explicador e as suas associações académicas.

Autorização: apenas administrador autenticado.

### POST /solicitacoes-apoio

Método: POST

Objetivo: permitir que um aluno autenticado solicite apoio a um explicador associado à disciplina.

Body esperado:
{
  "disciplina_id": 2,
  "explicador_id": 1,
  "mensagem": "Preciso de apoio nesta disciplina."
}

Resposta 201: objeto com mensagem e solicitação criada.

### GET /solicitacoes-apoio

Método: GET

Objetivo: listar as solicitações de apoio no painel administrativo.

Autorização: apenas administrador autenticado.

### PATCH /solicitacoes-apoio/:id

Método: PATCH

Objetivo: atualizar o estado de uma solicitação.

Autorização: apenas administrador autenticado.

Estados aceites: `pendente`, `aceite`, `recusada`.

Body esperado:
{
  "estado": "aceite"
}

## Possíveis erros

- 400: body inválido, campos obrigatórios em falta.
- 401: sessão de administrador inexistente ou inválida.
- 404: curso académico, disciplina ou explicador inexistente.
- 409: integridade referencial.
- 500: erro interno do PostgreSQL ou JSON inválido.
