// Servidor HTTP principal da aplicação.
// Responsável por servir a interface web, autenticar utilizadores e gerir
// as operações de inscrições, formações e administração.
const http = require("http");
const fs = require("fs");
const path = require("path");

const db = require("./db/database");
const bcrypt = require("bcrypt");

// Guarda todas as sessões ativas do navegador em memória.
const sessoes = new Map();

// Lê o cookie de sessão enviado pelo navegador e devolve o identificador.
function obterSessao(req) {

    const cookies = req.headers.cookie;

    if (!cookies) {
        return null;
    }

    const partes = cookies.split(";");

    for (const parte of partes) {

        const [nome, valor] = parte.trim().split("=");

        if (nome === "sessionId") {
            return valor;
        }
    }

    return null;
}

// Verifica se a sessão atual pertence a um administrador.
function sessaoEAdmin(req) {
    const sessionId = obterSessao(req);
    const sessao = sessionId ? sessoes.get(sessionId) : null;

    return Boolean(sessao && sessao.tipo === "admin");
}

// Configuração principal do servidor: todas as rotas da aplicação passam por aqui.
const server = http.createServer((req, res) => {
    // =========================
// INSCRIÇÃO DOS UTILIZADORES
// =========================
if (req.method === "POST" && req.url === "/inscricao") {

    let dados = "";

    req.on("data", (parte) => {
        dados += parte;
    });

    req.on("end", async () => {

        try {
            const inscricao = JSON.parse(dados || "{}");

            if (!inscricao.nome || !inscricao.email || !inscricao.formacao) {
                res.writeHead(400, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    mensagem: "Preencha todos os campos."
                }));

                return;
            }

            const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailValido.test(inscricao.email)) {
                res.writeHead(400, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    mensagem: "Digite um email válido."
                }));

                return;
            }

            const sessionId = obterSessao(req);
            const sessao = sessionId ? sessoes.get(sessionId) : null;
            const utilizadorEmail = sessao && typeof sessao === "object" && sessao.email ? sessao.email : null;

            let utilizadorId = null;

            if (utilizadorEmail) {
                const userResult = await db.query(
                    "SELECT id FROM utilizadores WHERE email = $1",
                    [utilizadorEmail]
                );

                if (userResult.rows.length > 0) {
                    utilizadorId = userResult.rows[0].id;
                }
            }

            const resultado = await db.query(
                `INSERT INTO inscricoes (nome, email, formacao, utilizador_id, estado, estado_pagamento)
                 VALUES ($1, $2, $3, $4, 'PENDENTE', 'PENDENTE')
                 RETURNING id`,
                [
                    inscricao.nome,
                    inscricao.email,
                    inscricao.formacao,
                    utilizadorId
                ]
            );

            console.log("Inscrição guardada. ID:", resultado.rows[0].id);

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                mensagem: "Inscrição guardada com sucesso!"
            }));

        } catch (erro) {

            console.error("Erro ao guardar inscrição:", erro.message);

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                mensagem: "Erro ao guardar inscrição."
            }));
        }
    });

    return;

}
// =========================
// GESTÃO DE INSCRIÇÕES
// =========================
if (req.method === "PATCH" && req.url.startsWith("/inscricoes/")) {

    if (!sessaoEAdmin(req)) {
        res.writeHead(401, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            mensagem: "Acesso reservado ao administrador."
        }));

        return;
    }

    const id = Number(req.url.split("/").pop());
    const estadosPermitidos = ["PENDENTE", "APROVADO", "REPROVADO"];
    let dados = "";

    req.on("data", (parte) => {
        dados += parte;
    });

    req.on("end", async () => {
        try {
            const atualizacao = JSON.parse(dados || "{}");

            if (!Number.isInteger(id) || id <= 0 || !estadosPermitidos.includes(atualizacao.estado)) {
                res.writeHead(400, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    mensagem: "Estado ou inscrição inválida."
                }));

                return;
            }

            const resultado = await db.query(
                "UPDATE inscricoes SET estado = $1 WHERE id = $2 RETURNING id, estado",
                [atualizacao.estado, id]
            );

            if (resultado.rows.length === 0) {
                res.writeHead(404, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    mensagem: "Inscrição não encontrada."
                }));

                return;
            }

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                mensagem: "Estado da inscrição atualizado.",
                inscricao: resultado.rows[0]
            }));
        } catch (erro) {
            console.error("Erro ao atualizar estado da inscrição:", erro.message);

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                mensagem: "Erro ao atualizar estado da inscrição."
            }));
        }
    });

    return;
}

// Lista todas as inscrições para o painel administrativo.
if (req.method === "GET" && req.url === "/inscricoes") {

    if (!sessaoEAdmin(req)) {
        res.writeHead(401, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            mensagem: "Acesso reservado ao administrador."
        }));

        return;
    }

    db.query("SELECT * FROM inscricoes ORDER BY id DESC")
        .then((resultado) => {

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify(resultado.rows));
        })
        .catch((erro) => {

            console.error("Erro ao buscar inscrições:", erro.message);

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                mensagem: "Erro ao buscar inscrições."
            }));
        });

    return;
}
// =========================
// AUTENTICAÇÃO
// =========================
// Login de administrador e de utilizador comum.
if (req.method === "POST" && req.url === "/login") {

    let dados = "";

    req.on("data", (parte) => {
        dados += parte;
    });

    req.on("end", async () => {

        try {

            const login = JSON.parse(dados || "{}");

            if (login.usuario && login.senha) {
                const resultado = await db.query(
                    "SELECT * FROM administradores WHERE usuario = $1",
                    [login.usuario]
                );

                if (resultado.rows.length === 0) {
                    res.writeHead(401, {
                        "Content-Type": "application/json"
                    });

                    res.end(JSON.stringify({
                        sucesso: false,
                        mensagem: "Usuário ou senha incorretos."
                    }));

                    return;
                }

                const administrador = resultado.rows[0];
                const senhaCorreta = await bcrypt.compare(login.senha, administrador.senha);

                if (!senhaCorreta) {
                    res.writeHead(401, {
                        "Content-Type": "application/json"
                    });

                    res.end(JSON.stringify({
                        sucesso: false,
                        mensagem: "Usuário ou senha incorretos."
                    }));

                    return;
                }

                const sessionId = Math.random().toString(36).substring(2);
                sessoes.set(sessionId, { tipo: "admin", usuario: administrador.usuario });

                res.writeHead(200, {
                    "Content-Type": "application/json",
                    "Set-Cookie": `sessionId=${sessionId}; HttpOnly; SameSite=Strict; Path=/`
                });

                res.end(JSON.stringify({
                    sucesso: true,
                    mensagem: "Login do administrador realizado com sucesso."
                }));

                return;
            }

            const email = typeof login.email === "string"
                ? login.email.trim().toLowerCase()
                : "";
            const password = typeof login.password === "string"
                ? login.password
                : "";

            if (!email || !password) {
                res.writeHead(400, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    sucesso: false,
                    mensagem: "Email e password são obrigatórios."
                }));

                return;
            }

            const resultado = await db.query(
                "SELECT * FROM utilizadores WHERE email = $1",
                [email]
            );

            if (resultado.rows.length === 0) {
                res.writeHead(401, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    sucesso: false,
                    mensagem: "Credenciais inválidas."
                }));

                return;
            }

            const utilizador = resultado.rows[0];
            const senhaCorreta = await bcrypt.compare(password, utilizador.password_hash);

            if (!senhaCorreta) {
                res.writeHead(401, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    sucesso: false,
                    mensagem: "Credenciais inválidas."
                }));

                return;
            }

            const sessionId = Math.random().toString(36).substring(2);
            sessoes.set(sessionId, { tipo: "utilizador", email: utilizador.email });

            res.writeHead(200, {
                "Content-Type": "application/json",
                "Set-Cookie": `sessionId=${sessionId}; HttpOnly; SameSite=Strict; Path=/`
            });

            res.end(JSON.stringify({
                sucesso: true,
                mensagem: "Login realizado com sucesso.",
                utilizador: {
                    id: utilizador.id,
                    nome: utilizador.nome,
                    email: utilizador.email
                }
            }));

        } catch (erro) {
            console.error("Erro no login:", erro.message);

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                sucesso: false,
                mensagem: "Erro ao realizar login."
            }));
        }
    });

    return;
}

// Redireciona apenas para o painel administrativo quando o utilizador é admin.
if (req.method === "GET" && req.url === "/painel.html") {

    const sessionId = obterSessao(req);
    const sessao = sessionId ? sessoes.get(sessionId) : null;

    if (!sessionId || !sessao || sessao.tipo !== "admin") {

        res.writeHead(302, {
            "Location": "/admin.html"
        });

        res.end();

        return;
    }

    const caminhoPainel = path.join(__dirname, "painel.html");

    fs.readFile(caminhoPainel, (err, data) => {

        if (err) {

            res.writeHead(404);

            res.end("Painel não encontrado.");

            return;
        }

        res.writeHead(200, {
            "Content-Type": "text/html"
        });

        res.end(data);
    });

    return;
}

// Fecha a sessão ativa e remove o cookie do navegador.
if (req.method === "POST" && req.url === "/logout") {

    const sessionId = obterSessao(req);

    if (sessionId) {
        sessoes.delete(sessionId);
    }

    res.writeHead(200, {
        "Content-Type": "application/json",
        "Set-Cookie": "sessionId=; HttpOnly; Max-Age=0; SameSite=Strict"
    });

    res.end(JSON.stringify({
        mensagem: "Sessão encerrada."
    }));

    return;
}

// Devolve o perfil do utilizador autenticado para o frontend.
if (req.method === "GET" && req.url === "/perfil") {

    const sessionId = obterSessao(req);

    if (!sessionId || !sessoes.has(sessionId)) {
        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            autenticado: false
        }));

        return;
    }

    const sessao = sessoes.get(sessionId);
    const emailUtilizador = sessao && typeof sessao === "object" && sessao.email
        ? sessao.email
        : typeof sessao === "string"
            ? sessao
            : null;

    if (!emailUtilizador) {
        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            autenticado: false
        }));

        return;
    }

    db.query(
        "SELECT id, nome, email FROM utilizadores WHERE email = $1",
        [emailUtilizador]
    )
        .then((resultado) => {
            if (resultado.rows.length === 0) {
                res.writeHead(200, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    autenticado: false
                }));

                return;
            }

            const utilizador = resultado.rows[0];

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                autenticado: true,
                utilizador: {
                    id: utilizador.id,
                    nome: utilizador.nome,
                    email: utilizador.email
                }
            }));
        })
        .catch((erro) => {
            console.error("Erro ao obter perfil:", erro.message);

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                autenticado: false,
                mensagem: "Erro ao obter perfil."
            }));
        });

    return;
}

// Obtém as inscrições do aluno autenticado.
if (req.method === "GET" && req.url === "/minhas-inscricoes") {

    const sessionId = obterSessao(req);

    if (!sessionId || !sessoes.has(sessionId)) {
        res.writeHead(401, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            autenticado: false,
            mensagem: "Precisa de iniciar sessão."
        }));

        return;
    }

    const sessao = sessoes.get(sessionId);
    const emailUtilizador = sessao && typeof sessao === "object" && sessao.email
        ? sessao.email
        : typeof sessao === "string"
            ? sessao
            : null;

    if (!emailUtilizador) {
        res.writeHead(401, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            autenticado: false,
            mensagem: "Precisa de iniciar sessão."
        }));

        return;
    }

    db.query(
        `SELECT i.id, i.formacao, i.data_inscricao, i.estado, i.estado_pagamento
         FROM inscricoes i
         INNER JOIN utilizadores u ON u.id = i.utilizador_id
         WHERE u.email = $1
         ORDER BY i.id DESC`,
        [emailUtilizador]
    )
        .then((resultado) => {
            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                autenticado: true,
                inscricoes: resultado.rows
            }));
        })
        .catch((erro) => {
            console.error("Erro ao buscar inscrições do utilizador:", erro.message);

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                autenticado: false,
                mensagem: "Erro ao carregar as suas inscrições."
            }));
        });

    return;
}

// Permite o acesso à página do aluno apenas com sessão válida.
if (req.method === "GET" && req.url === "/aluno.html") {

    const sessionId = obterSessao(req);
    const sessao = sessionId ? sessoes.get(sessionId) : null;

    if (!sessionId || !sessao || sessao.tipo !== "utilizador") {
        res.writeHead(302, {
            "Location": "/"
        });

        res.end();
        return;
    }

    const caminhoAluno = path.join(__dirname, "aluno.html");

    fs.readFile(caminhoAluno, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("Página do aluno não encontrada.");
            return;
        }

        res.writeHead(200, {
            "Content-Type": "text/html"
        });

        res.end(data);
    });

    return;
}

// Regista um novo utilizador com password cifrada.
if (req.method === "POST" && req.url === "/registar") {

    let dados = "";

    req.on("data", (parte) => {
        dados += parte;
    });

    req.on("end", async () => {

        try {

            const utilizador = JSON.parse(dados || "{}");
            const nome = typeof utilizador.nome === "string"
                ? utilizador.nome.trim()
                : "";
            const email = typeof utilizador.email === "string"
                ? utilizador.email.trim().toLowerCase()
                : "";
            const password = typeof utilizador.password === "string"
                ? utilizador.password
                : "";

            if (!nome || !email || !password) {
                res.writeHead(400, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    sucesso: false,
                    mensagem: "Nome, email e password são obrigatórios."
                }));

                return;
            }

            if (password.length < 6) {
                res.writeHead(400, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    sucesso: false,
                    mensagem: "A password deve ter pelo menos 6 caracteres."
                }));

                return;
            }

            const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailValido.test(email)) {
                res.writeHead(400, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    sucesso: false,
                    mensagem: "Digite um email válido."
                }));

                return;
            }

            const existente = await db.query(
                "SELECT id FROM utilizadores WHERE email = $1",
                [email]
            );

            if (existente.rows.length > 0) {
                res.writeHead(409, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    sucesso: false,
                    mensagem: "Este email já está registado."
                }));

                return;
            }

            const passwordHash = await bcrypt.hash(password, 10);

            await db.query(
                `INSERT INTO utilizadores (nome, email, password_hash)
                 VALUES ($1, $2, $3)`,
                [nome, email, passwordHash]
            );

            res.writeHead(201, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                sucesso: true,
                mensagem: "Conta criada com sucesso."
            }));

        } catch (erro) {

            console.error("Erro ao criar utilizador:", erro.message);

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                sucesso: false,
                mensagem: "Erro ao criar a conta."
            }));
        }
    });

    return;
}

// =========================
// GESTÃO DE FORMAÇÕES
// =========================
if (req.method === "POST" && req.url === "/formacoes") {

    if (!sessaoEAdmin(req)) {
        res.writeHead(401, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            mensagem: "Acesso reservado ao administrador."
        }));

        return;
    }

    let dados = "";

    req.on("data", (parte) => {
        dados += parte;
    });

    req.on("end", async () => {

        try {

            const formacao = JSON.parse(dados);

            if (
                !formacao.nome ||
                !formacao.descricao ||
                !formacao.modalidade ||
                !formacao.preco
            ) {

                res.writeHead(400, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    mensagem: "Preencha todos os campos."
                }));

                return;
            }

            const resultado = await db.query(
                `INSERT INTO formacoes
                (nome, descricao, modalidade, preco)
                VALUES ($1, $2, $3, $4)
                RETURNING id`,
                [
                    formacao.nome,
                    formacao.descricao,
                    formacao.modalidade,
                    formacao.preco
                ]
            );

            console.log(
                "Formação criada. ID:",
                resultado.rows[0].id
            );

            res.writeHead(201, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                mensagem: "Formação adicionada com sucesso!"
            }));

        } catch (erro) {

            console.error(
                "Erro ao adicionar formação:",
                erro.message
            );

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                mensagem: "Erro ao adicionar formação."
            }));
        }
    });

    return;
}

// Atualiza ou remove uma formação específica pelo id.
if ((req.method === "PUT" || req.method === "DELETE") && req.url.startsWith("/formacoes/")) {

    if (!sessaoEAdmin(req)) {
        res.writeHead(401, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            mensagem: "Acesso reservado ao administrador."
        }));

        return;
    }

    const id = Number(req.url.split("/").pop());

    if (!Number.isInteger(id) || id <= 0) {
        res.writeHead(400, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            mensagem: "Identificador de formação inválido."
        }));

        return;
    }

    if (req.method === "DELETE") {
        db.query("SELECT COUNT(*)::int AS total FROM inscricoes WHERE formacao = (SELECT nome FROM formacoes WHERE id = $1)", [id])
            .then((inscricoes) => {
                if (inscricoes.rows[0].total > 0) {
                    res.writeHead(409, {
                        "Content-Type": "application/json"
                    });

                    res.end(JSON.stringify({
                        mensagem: "Esta formação tem inscrições associadas e não pode ser removida."
                    }));

                    return;
                }

                return db.query("DELETE FROM formacoes WHERE id = $1 RETURNING id", [id]);
            })
            .then((resultado) => {
                if (!resultado) {
                    return;
                }

                if (resultado.rows.length === 0) {
                    res.writeHead(404, {
                        "Content-Type": "application/json"
                    });

                    res.end(JSON.stringify({
                        mensagem: "Formação não encontrada."
                    }));

                    return;
                }

                res.writeHead(200, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    mensagem: "Formação removida com sucesso."
                }));
            })
            .catch((erro) => {
                console.error("Erro ao remover formação:", erro.message);

                res.writeHead(500, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    mensagem: "Erro ao remover formação."
                }));
            });

        return;
    }

    let dados = "";

    req.on("data", (parte) => {
        dados += parte;
    });

    req.on("end", async () => {
        try {
            const formacao = JSON.parse(dados || "{}");

            if (!formacao.nome || !formacao.descricao || !formacao.modalidade || formacao.preco === undefined || formacao.preco === "") {
                res.writeHead(400, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    mensagem: "Preencha todos os campos."
                }));

                return;
            }

            const resultado = await db.query(
                `UPDATE formacoes
                 SET nome = $1, descricao = $2, modalidade = $3, preco = $4
                 WHERE id = $5
                 RETURNING id`,
                [formacao.nome, formacao.descricao, formacao.modalidade, formacao.preco, id]
            );

            if (resultado.rows.length === 0) {
                res.writeHead(404, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    mensagem: "Formação não encontrada."
                }));

                return;
            }

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                mensagem: "Formação atualizada com sucesso."
            }));
        } catch (erro) {
            console.error("Erro ao atualizar formação:", erro.message);

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                mensagem: "Erro ao atualizar formação."
            }));
        }
    });

    return;
}

// Lista as formações disponíveis para a página inicial e para o painel.
if (req.method === "GET" && req.url === "/formacoes") {

    db.query("SELECT * FROM formacoes ORDER BY id ASC")

        .then((resultado) => {

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify(resultado.rows));

        })

        .catch((erro) => {

            console.error("Erro ao buscar formações:", erro.message);

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                mensagem: "Erro ao buscar formações."
            }));

        });

    return;
}

// =========================
// GESTÃO ACADÉMICA (SPRINT 2)
// =========================
// Os endpoints abaixo deixam a estrutura académica independente da
// estrutura de cursos profissionais/formações comercializadas.
// A relação principal é: Curso Académico -> Disciplinas -> Explicadores.

// Retorna todos os cursos académicos disponíveis.
// O frontend poderá consumir este endpoint para mostrar a lista
// inicial de cursos académicos no painel de inscrição ou no portal.
if (req.method === "GET" && req.url === "/cursos-academicos") {
    db.query(
        `SELECT id, nome, descricao, codigo, duracao, created_at
         FROM cursos_academicos
         ORDER BY id ASC`
    )
        .then((resultado) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(resultado.rows));
        })
        .catch((erro) => {
            console.error("Erro ao buscar cursos académicos:", erro.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ mensagem: "Erro ao buscar cursos académicos." }));
        });

    return;
}

// Cria um curso académico novo.
// Requer sessão de administrador e um payload com nome (obrigatório) e
// descrição/código/duração opcionais. O corpo esperado é o mesmo padrão
// já usado nas rotas de formações do projeto: JSON em request body.
if (req.method === "POST" && req.url === "/cursos-academicos") {
    if (!sessaoEAdmin(req)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ mensagem: "Acesso reservado ao administrador." }));
        return;
    }

    let dados = "";

    req.on("data", (parte) => {
        dados += parte;
    });

    req.on("end", async () => {
        try {
            const curso = JSON.parse(dados || "{}");
            const nome = typeof curso.nome === "string" ? curso.nome.trim() : "";
            const descricao = typeof curso.descricao === "string" ? curso.descricao.trim() : "";
            const codigo = typeof curso.codigo === "string" ? curso.codigo.trim().toUpperCase() : "";
            const duracao = typeof curso.duracao === "string" ? curso.duracao.trim() : "";

            if (!nome) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Nome do curso académico é obrigatório." }));
                return;
            }

            const resultado = await db.query(
                `INSERT INTO cursos_academicos (nome, descricao, codigo, duracao)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, nome, descricao, codigo, duracao, created_at`,
                [nome, descricao, codigo || null, duracao || null]
            );

            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                mensagem: "Curso académico criado com sucesso.",
                curso: resultado.rows[0]
            }));
        } catch (erro) {
            console.error("Erro ao criar curso académico:", erro.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ mensagem: "Erro ao criar curso académico." }));
        }
    });

    return;
}

// Consulta, atualiza e remove um curso académico específico.
if ((req.method === "GET" || req.method === "PUT" || req.method === "DELETE") && req.url.startsWith("/cursos-academicos/")) {
    const partes = req.url.split("/");
    const id = Number(partes[2]);

    if (!Number.isInteger(id) || id <= 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ mensagem: "Identificador de curso académico inválido." }));
        return;
    }

    // Retorna as disciplinas associadas ao curso académico informado.
    if (req.method === "GET" && partes.length >= 4 && partes[3] === "disciplinas") {
        db.query(
            `SELECT d.id, d.nome, d.codigo, d.descricao, d.carga_horaria,
                    d.curso_academico_id, c.nome AS curso_nome
             FROM disciplinas d
             INNER JOIN cursos_academicos c ON c.id = d.curso_academico_id
             WHERE d.curso_academico_id = $1
             ORDER BY d.id ASC`,
            [id]
        )
            .then((resultado) => {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(resultado.rows));
            })
            .catch((erro) => {
                console.error("Erro ao buscar disciplinas do curso académico:", erro.message);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Erro ao buscar disciplinas do curso académico." }));
            });

        return;
    }

    // Retorna um curso académico específico pelo id.
    if (req.method === "GET") {
        db.query(
            `SELECT id, nome, descricao, codigo, duracao, created_at
             FROM cursos_academicos
             WHERE id = $1`,
            [id]
        )
            .then((resultado) => {
                if (resultado.rows.length === 0) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ mensagem: "Curso académico não encontrado." }));
                    return;
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(resultado.rows[0]));
            })
            .catch((erro) => {
                console.error("Erro ao consultar curso académico:", erro.message);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Erro ao consultar curso académico." }));
            });

        return;
    }

    // Atualiza um curso académico usando sessão de administrador.
    if (req.method === "PUT") {
        if (!sessaoEAdmin(req)) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ mensagem: "Acesso reservado ao administrador." }));
            return;
        }

        let dados = "";

        req.on("data", (parte) => {
            dados += parte;
        });

        req.on("end", async () => {
            try {
                const curso = JSON.parse(dados || "{}");
                const nome = typeof curso.nome === "string" ? curso.nome.trim() : "";
                const descricao = typeof curso.descricao === "string" ? curso.descricao.trim() : "";
                const codigo = typeof curso.codigo === "string" ? curso.codigo.trim().toUpperCase() : null;
                const duracao = typeof curso.duracao === "string" ? curso.duracao.trim() : null;

                if (!nome) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ mensagem: "Nome do curso académico é obrigatório." }));
                    return;
                }

                const resultado = await db.query(
                    `UPDATE cursos_academicos
                     SET nome = $1, descricao = $2, codigo = $3, duracao = $4
                     WHERE id = $5
                     RETURNING id, nome, descricao, codigo, duracao`,
                    [nome, descricao, codigo, duracao, id]
                );

                if (resultado.rows.length === 0) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ mensagem: "Curso académico não encontrado." }));
                    return;
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Curso académico atualizado com sucesso.", curso: resultado.rows[0] }));
            } catch (erro) {
                console.error("Erro ao atualizar curso académico:", erro.message);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Erro ao atualizar curso académico." }));
            }
        });

        return;
    }

    // Remove um curso académico usando sessão de administrador.
    if (req.method === "DELETE") {
        if (!sessaoEAdmin(req)) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ mensagem: "Acesso reservado ao administrador." }));
            return;
        }

        db.query(
            `DELETE FROM cursos_academicos
             WHERE id = $1
             RETURNING id`,
            [id]
        )
            .then((resultado) => {
                if (resultado.rows.length === 0) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ mensagem: "Curso académico não encontrado." }));
                    return;
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Curso académico removido com sucesso." }));
            })
            .catch((erro) => {
                console.error("Erro ao remover curso académico:", erro.message);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Erro ao remover curso académico." }));
            });

        return;
    }
}

// Retorna todas as disciplinas académicas.
// Permite ao frontend mostrar a lista global de disciplinas ou
// decidir qual curso académico está associado ao estudante.
if (req.method === "GET" && req.url === "/disciplinas") {
    db.query(
        `SELECT d.id, d.nome, d.codigo, d.descricao, d.carga_horaria,
                d.curso_academico_id, c.nome AS curso_nome
         FROM disciplinas d
         INNER JOIN cursos_academicos c ON c.id = d.curso_academico_id
         ORDER BY d.id ASC`
    )
        .then((resultado) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(resultado.rows));
        })
        .catch((erro) => {
            console.error("Erro ao buscar disciplinas:", erro.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ mensagem: "Erro ao buscar disciplinas." }));
        });

    return;
}

// Cria uma disciplina associada a um curso académico.
if (req.method === "POST" && req.url === "/disciplinas") {
    if (!sessaoEAdmin(req)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ mensagem: "Acesso reservado ao administrador." }));
        return;
    }

    let dados = "";

    req.on("data", (parte) => {
        dados += parte;
    });

    req.on("end", async () => {
        try {
            const disciplina = JSON.parse(dados || "{}");
            const nome = typeof disciplina.nome === "string" ? disciplina.nome.trim() : "";
            const codigo = typeof disciplina.codigo === "string" ? disciplina.codigo.trim().toUpperCase() : "";
            const descricao = typeof disciplina.descricao === "string" ? disciplina.descricao.trim() : "";
            const carga_horaria = Number(disciplina.carga_horaria || 0);
            const curso_id = Number(disciplina.curso_academico_id);

            if (!nome || !Number.isInteger(curso_id) || curso_id <= 0) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Nome e curso académico são obrigatórios." }));
                return;
            }

            const cursoExiste = await db.query("SELECT id FROM cursos_academicos WHERE id = $1", [curso_id]);
            if (cursoExiste.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Curso académico não encontrado." }));
                return;
            }

            const resultado = await db.query(
                `INSERT INTO disciplinas (nome, codigo, descricao, carga_horaria, curso_academico_id)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, nome, codigo, descricao, carga_horaria, curso_academico_id`,
                [nome, codigo || null, descricao, carga_horaria, curso_id]
            );

            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                mensagem: "Disciplina criada com sucesso.",
                disciplina: resultado.rows[0]
            }));
        } catch (erro) {
            console.error("Erro ao criar disciplina:", erro.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ mensagem: "Erro ao criar disciplina." }));
        }
    });

    return;
}

// Consulta ou altera uma disciplina específica pelo id.
if ((req.method === "GET" || req.method === "PUT" || req.method === "DELETE") && req.url.startsWith("/disciplinas/")) {
    const partes = req.url.split("/");
    const id = Number(partes[2]);

    if (!Number.isInteger(id) || id <= 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ mensagem: "Identificador de disciplina inválido." }));
        return;
    }

    // Retorna uma disciplina específica e o curso académico a que ela pertence.
    if (req.method === "GET") {
        db.query(
            `SELECT d.id, d.nome, d.codigo, d.descricao, d.carga_horaria,
                    d.curso_academico_id, c.nome AS curso_nome
             FROM disciplinas d
             INNER JOIN cursos_academicos c ON c.id = d.curso_academico_id
             WHERE d.id = $1`,
            [id]
        )
            .then((resultado) => {
                if (resultado.rows.length === 0) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ mensagem: "Disciplina não encontrada." }));
                    return;
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(resultado.rows[0]));
            })
            .catch((erro) => {
                console.error("Erro ao consultar disciplina:", erro.message);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Erro ao consultar disciplina." }));
            });

        return;
    }

    if (req.method === "PUT") {
        if (!sessaoEAdmin(req)) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ mensagem: "Acesso reservado ao administrador." }));
            return;
        }

        let dados = "";

        req.on("data", (parte) => {
            dados += parte;
        });

        req.on("end", async () => {
            try {
                const disciplina = JSON.parse(dados || "{}");
                const nome = typeof disciplina.nome === "string" ? disciplina.nome.trim() : "";
                const codigo = typeof disciplina.codigo === "string" ? disciplina.codigo.trim().toUpperCase() : null;
                const descricao = typeof disciplina.descricao === "string" ? disciplina.descricao.trim() : "";
                const carga_horaria = Number(disciplina.carga_horaria || 0);
                const curso_id = Number(disciplina.curso_academico_id);

                if (!nome || !Number.isInteger(curso_id) || curso_id <= 0) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ mensagem: "Nome e curso académico são obrigatórios." }));
                    return;
                }

                const cursoExiste = await db.query("SELECT id FROM cursos_academicos WHERE id = $1", [curso_id]);
                if (cursoExiste.rows.length === 0) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ mensagem: "Curso académico não encontrado." }));
                    return;
                }

                const resultado = await db.query(
                    `UPDATE disciplinas
                     SET nome = $1, codigo = $2, descricao = $3, carga_horaria = $4, curso_academico_id = $5
                     WHERE id = $6
                     RETURNING id, nome, codigo, descricao, carga_horaria, curso_academico_id`,
                    [nome, codigo, descricao, carga_horaria, curso_id, id]
                );

                if (resultado.rows.length === 0) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ mensagem: "Disciplina não encontrada." }));
                    return;
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Disciplina atualizada com sucesso.", disciplina: resultado.rows[0] }));
            } catch (erro) {
                console.error("Erro ao atualizar disciplina:", erro.message);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Erro ao atualizar disciplina." }));
            }
        });

        return;
    }

    if (req.method === "DELETE") {
        if (!sessaoEAdmin(req)) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ mensagem: "Acesso reservado ao administrador." }));
            return;
        }

        db.query(
            `DELETE FROM disciplinas
             WHERE id = $1
             RETURNING id`,
            [id]
        )
            .then((resultado) => {
                if (resultado.rows.length === 0) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ mensagem: "Disciplina não encontrada." }));
                    return;
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Disciplina removida com sucesso." }));
            })
            .catch((erro) => {
                console.error("Erro ao remover disciplina:", erro.message);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Erro ao remover disciplina." }));
            });

        return;
    }
}

// Lista os explicadores registados na plataforma e prepara o relacionamento
// futuro com disciplinas: Um explicador pode vir a estar associado a várias disciplinas.
if (req.method === "GET" && req.url === "/explicadores") {
    db.query(
        `SELECT id, nome, email, especialidade, bio, utilizador_id, estado
         FROM explicadores
         ORDER BY id ASC`
    )
        .then((resultado) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(resultado.rows));
        })
        .catch((erro) => {
            console.error("Erro ao buscar explicadores:", erro.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ mensagem: "Erro ao buscar explicadores." }));
        });

    return;
}

// Cria um explicador e deixa-o preparado para associar a disciplina.
if (req.method === "POST" && req.url === "/explicadores") {
    if (!sessaoEAdmin(req)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ mensagem: "Acesso reservado ao administrador." }));
        return;
    }

    let dados = "";

    req.on("data", (parte) => {
        dados += parte;
    });

    req.on("end", async () => {
        try {
            const explicador = JSON.parse(dados || "{}");
            const nome = typeof explicador.nome === "string" ? explicador.nome.trim() : "";
            const email = typeof explicador.email === "string" ? explicador.email.trim().toLowerCase() : "";
            const especialidade = typeof explicador.especialidade === "string" ? explicador.especialidade.trim() : "";
            const bio = typeof explicador.bio === "string" ? explicador.bio.trim() : "";
            const utilizador_id = Number(explicador.utilizador_id || 0);

            if (!nome || !email) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Nome e email são obrigatórios." }));
                return;
            }

            if (utilizador_id > 0) {
                const user = await db.query("SELECT id FROM utilizadores WHERE id = $1", [utilizador_id]);
                if (user.rows.length === 0) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ mensagem: "Utilizador de explicador não encontrado." }));
                    return;
                }
            }

            const resultado = await db.query(
                `INSERT INTO explicadores (nome, email, especialidade, bio, utilizador_id, estado)
                 VALUES ($1, $2, $3, $4, $5, 'ativo')
                 RETURNING id, nome, email, especialidade, bio, utilizador_id, estado`,
                [nome, email, especialidade || null, bio || null, utilizador_id || null]
            );

            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ mensagem: "Explicador criado com sucesso.", explicador: resultado.rows[0] }));
        } catch (erro) {
            console.error("Erro ao criar explicador:", erro.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ mensagem: "Erro ao criar explicador." }));
        }
    });

    return;
}

// Monta a relação de explicadores disponíveis para uma disciplina específica.
// O frontend poderá usar este endpoint quando precisar mostrar o mapa:
// curso académico -> disciplina -> explicadores.
if (req.method === "GET" && req.url.startsWith("/disciplinas/") && req.url.endsWith("/explicadores")) {
    const partes = req.url.split("/");
    const disciplinaId = Number(partes[2]);

    if (!Number.isInteger(disciplinaId) || disciplinaId <= 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ mensagem: "Identificador de disciplina inválido." }));
        return;
    }

    db.query(
        `SELECT e.id, e.nome, e.email, e.especialidade, e.bio, e.estado
         FROM disciplina_explicadores de
         INNER JOIN explicadores e ON e.id = de.explicador_id
         WHERE de.disciplina_id = $1
         ORDER BY e.nome ASC`,
        [disciplinaId]
    )
        .then((resultado) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(resultado.rows));
        })
        .catch((erro) => {
            console.error("Erro ao buscar explicadores da disciplina:", erro.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ mensagem: "Erro ao buscar explicadores da disciplina." }));
        });

    return;
}

// Associa um explicador a uma disciplina já existente.
if (req.method === "POST" && req.url.startsWith("/disciplinas/") && req.url.includes("/explicadores")) {
    const partes = req.url.split("/");
    const disciplinaId = Number(partes[2]);

    if (!Number.isInteger(disciplinaId) || disciplinaId <= 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ mensagem: "Identificador de disciplina inválido." }));
        return;
    }

    if (!sessaoEAdmin(req)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ mensagem: "Acesso reservado ao administrador." }));
        return;
    }

    let dados = "";

    req.on("data", (parte) => {
        dados += parte;
    });

    req.on("end", async () => {
        try {
            const payload = JSON.parse(dados || "{}");
            const explicador_id = Number(payload.explicador_id);

            if (!Number.isInteger(explicador_id) || explicador_id <= 0) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "explicador_id é obrigatório." }));
                return;
            }

            const disciplinaExiste = await db.query("SELECT id FROM disciplinas WHERE id = $1", [disciplinaId]);
            const explicadorExiste = await db.query("SELECT id FROM explicadores WHERE id = $1", [explicador_id]);

            if (disciplinaExiste.rows.length === 0 || explicadorExiste.rows.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ mensagem: "Disciplina ou explicador não encontrado." }));
                return;
            }

            await db.query(
                `INSERT INTO disciplina_explicadores (disciplina_id, explicador_id)
                 VALUES ($1, $2)
                 ON CONFLICT (disciplina_id, explicador_id) DO NOTHING`,
                [disciplinaId, explicador_id]
            );

            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ mensagem: "Explicador associado com sucesso à disciplina." }));
        } catch (erro) {
            console.error("Erro ao associar explicador à disciplina:", erro.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ mensagem: "Erro ao associar explicador à disciplina." }));
        }
    });

    return;
}

// =========================
// SERVIÇO DE FICHEIROS ESTÁTICOS
// =========================
// Serve os ficheiros HTML, CSS, JavaScript e imagens da aplicação.
let arquivo;

    const urlSolicitada = decodeURIComponent(req.url || "/");

    if (urlSolicitada === "/") {
        arquivo = "index.html";
    } else {
        arquivo = urlSolicitada.substring(1);
    }

    const caminho = path.join(__dirname, arquivo);

    fs.readFile(caminho, (err, data) => {

        if (err) {
            res.writeHead(404);
            res.end("Arquivo não encontrado.");
            return;
        }

        let tipo = "text/plain";

        if (arquivo.endsWith(".html")) {
            tipo = "text/html";
        } else if (arquivo.endsWith(".css")) {
            tipo = "text/css";
        } else if (arquivo.endsWith(".js")) {
            tipo = "text/javascript";
        } else if (arquivo.endsWith(".png")) {
            tipo = "image/png";
        } else if (arquivo.endsWith(".jpg") || arquivo.endsWith(".jpeg")) {
            tipo = "image/jpeg";
        } else if (arquivo.endsWith(".svg")) {
            tipo = "image/svg+xml";
        } else if (arquivo.endsWith(".webp")) {
            tipo = "image/webp";
        }

        res.writeHead(200, {
            "Content-Type": tipo
        });

        res.end(data);
    });

});

server.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});