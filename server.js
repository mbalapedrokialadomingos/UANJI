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