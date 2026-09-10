// Script principal da página inicial.
// Responsável por controlar o modal de autenticação, as formações e a inscrição do utilizador.
const listaformacoes = document.getElementById("listaformacoes");

const modalFormacao = document.getElementById("modalFormacao");

const conteudoModal = document.getElementById("conteudoModal");

const fecharModal = document.getElementById("fecharModal");

const btnLoginPrincipal = document.getElementById("btnLoginPrincipal");

let utilizadorAtual = null;

// Verifica se existe uma sessão ativa do utilizador no servidor.
async function verificarAutenticacao() {

    try {

        const resposta = await fetch("/perfil");

        if (!resposta.ok) {
            return null;
        }

        const dados = await resposta.json();

        if (!dados.autenticado) {
            utilizadorAtual = null;
            return null;
        }

        utilizadorAtual = dados.utilizador;
        return dados.utilizador;

    } catch (erro) {

        console.error("Erro ao verificar autenticação:", erro);
        return null;

    }
}

// Abre o modal principal da aplicação.
function abrirModal() {
    modalFormacao.classList.add("ativo");
}

// Fecha o modal principal da aplicação.
function fecharModalAtual() {
    modalFormacao.classList.remove("ativo");
}

// Cria o formulário de inscrição para uma formação específica.
function mostrarFormularioInscricao(formacao) {
    const nomePadrao = utilizadorAtual?.nome || "";
    const emailPadrao = utilizadorAtual?.email || "";

    conteudoModal.innerHTML = `
        <div class="modal-formacao">
            <h2>Inscrição: ${formacao.nome}</h2>

            <form id="forminscricao" class="form-modal">
                <label for="nome">Nome completo</label>
                <input type="text" id="nome" value="${nomePadrao}" placeholder="Digite o seu nome" required>

                <label for="email">Email</label>
                <input type="email" id="email" value="${emailPadrao}" placeholder="Digite o seu email" required>

                <button type="submit">Enviar inscrição</button>
                <div id="mensagemModal" class="mensagem-modal"></div>
            </form>
        </div>
    `;

    abrirModal();

    const forminscricao = document.getElementById("forminscricao");

    forminscricao.onsubmit = async function (event) {
        event.preventDefault();

        const nome = document.getElementById("nome").value.trim();
        const email = document.getElementById("email").value.trim();
        const mensagem = document.getElementById("mensagemModal");

        try {
            const resposta = await fetch("/inscricao", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nome: nome,
                    email: email,
                    formacao: formacao.nome
                })
            });

            const data = await resposta.json();
            mensagem.textContent = data.mensagem;

            if (resposta.ok) {
                forminscricao.reset();
            }

        } catch (erro) {
            console.error("Erro ao enviar inscrição:", erro);
            mensagem.textContent = "Não foi possível enviar a inscrição.";
        }
    };
}

// Mostra o modal de autenticação com a opção de login ou criação de conta.
function mostrarModalAutenticacao(formacao = null, aposAutenticacao = null) {
    const tituloAutenticacao = formacao
        ? "Inscrever-me"
        : aposAutenticacao
            ? "Entrar para solicitar apoio"
            : "Entrar na minha conta";
    const textoAutenticacao = formacao
        ? `Para continuar a inscrição em <strong>${formacao.nome}</strong>, entra na tua conta ou cria uma nova.`
        : aposAutenticacao
            ? "Entra na tua conta para enviar uma solicitação ao explicador."
            : "Entra na tua conta para consultar as tuas formações e inscrições.";

    conteudoModal.innerHTML = `
        <div class="modal-formacao auth-modal">
            <h2>${tituloAutenticacao}</h2>
            <p class="auth-texto">${textoAutenticacao}</p>

            <div class="auth-toggle">
                <button type="button" class="auth-tab active" data-tab="login">Entrar</button>
                <button type="button" class="auth-tab" data-tab="registar">Criar conta</button>
            </div>

            <div class="auth-panel active" data-panel="login">
                <form id="loginForm" class="auth-form">
                    <label for="loginEmail">Email</label>
                    <input type="email" id="loginEmail" placeholder="Digite o seu email" required>

                    <label for="loginPassword">Password</label>
                    <input type="password" id="loginPassword" placeholder="Digite a sua password" required>

                    <button type="submit">Entrar</button>
                    <div id="mensagemAuthLogin" class="mensagem-modal"></div>
                </form>
            </div>

            <div class="auth-panel" data-panel="registar">
                <form id="registarForm" class="auth-form">
                    <label for="registarNome">Nome</label>
                    <input type="text" id="registarNome" placeholder="Digite o seu nome" required>

                    <label for="registarEmail">Email</label>
                    <input type="email" id="registarEmail" placeholder="Digite o seu email" required>

                    <label for="registarPassword">Password</label>
                    <input type="password" id="registarPassword" placeholder="Crie uma password" required>

                    <button type="submit">Criar conta</button>
                    <div id="mensagemAuthRegistar" class="mensagem-modal"></div>
                </form>
            </div>
        </div>
    `;

    abrirModal();

    document.querySelectorAll(".auth-tab").forEach((botao) => {
        botao.addEventListener("click", () => {
            const tab = botao.dataset.tab;

            document.querySelectorAll(".auth-tab").forEach((item) => {
                item.classList.toggle("active", item === botao);
            });

            document.querySelectorAll(".auth-panel").forEach((painel) => {
                painel.classList.toggle("active", painel.dataset.panel === tab);
            });
        });
    });

    const loginForm = document.getElementById("loginForm");
    const registarForm = document.getElementById("registarForm");

    loginForm.onsubmit = async function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const mensagem = document.getElementById("mensagemAuthLogin");

        try {
            const resposta = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const dados = await resposta.json();
            mensagem.textContent = dados.mensagem;

            if (resposta.ok) {
                utilizadorAtual = dados.utilizador;

                if (formacao) {
                    mostrarFormularioInscricao(formacao);
                } else if (aposAutenticacao) {
                    fecharModalAtual();
                    aposAutenticacao();
                } else {
                    window.location.href = "/aluno.html";
                }
            }

        } catch (erro) {
            console.error("Erro ao fazer login:", erro);
            mensagem.textContent = "Não foi possível entrar.";
        }
    };

    registarForm.onsubmit = async function (event) {
        event.preventDefault();

        const nome = document.getElementById("registarNome").value.trim();
        const email = document.getElementById("registarEmail").value.trim();
        const password = document.getElementById("registarPassword").value;
        const mensagem = document.getElementById("mensagemAuthRegistar");

        try {
            const resposta = await fetch("/registar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nome, email, password })
            });

            const dados = await resposta.json();
            mensagem.textContent = dados.mensagem;

            if (resposta.ok) {
                const loginResposta = await fetch("/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, password })
                });

                const loginDados = await loginResposta.json();

                if (loginResposta.ok) {
                    utilizadorAtual = loginDados.utilizador;

                    if (formacao) {
                        mostrarFormularioInscricao(formacao);
                    } else if (aposAutenticacao) {
                        fecharModalAtual();
                        aposAutenticacao();
                    } else {
                        window.location.href = "/aluno.html";
                    }
                }
            }

        } catch (erro) {
            console.error("Erro ao criar conta:", erro);
            mensagem.textContent = "Não foi possível criar a conta.";
        }
    };
}

// Botão principal do menu: redireciona para a área do aluno se já estiver autenticado.
btnLoginPrincipal.addEventListener("click", async () => {
    const perfil = await verificarAutenticacao();

    if (perfil) {
        window.location.href = "/aluno.html";
        return;
    }

    mostrarModalAutenticacao();
});

// =========================
// CARREGAR FORMAÇÕES
// =========================
// Busca as formações disponíveis no servidor e desenha os cartões na página principal.

async function carregarFormacoes() {

    try {

        const resposta = await fetch("/formacoes");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar formações.");
        }

        const formacoes = await resposta.json();

        formacoes.forEach((formacao) => {

            const curso = document.createElement("div");

            curso.classList.add("card");

            curso.innerHTML = `
                <h3>${formacao.nome}</h3>

                <p>
                    Modalidade: ${formacao.modalidade}
                </p>

                <p>
                    Preço: ${formacao.preco} Kz
                </p>

                <p>
                    Descrição: ${formacao.descricao}
                </p>

                <button class="btn-ver-formacao">
                    Ver Formação
                </button>
            `;


            // =========================
            // BOTÃO VER FORMAÇÃO
            // =========================

            const botao =
                curso.querySelector(".btn-ver-formacao");


            botao.onclick = function () {

                conteudoModal.innerHTML = `

                    <div class="modal-formacao">

                        <h2>
                            ${formacao.nome}
                        </h2>

                        <p class="modal-descricao">
                            ${formacao.descricao}
                        </p>

                        <div class="modal-info">

                            <div class="modal-info-item">

                                <span>
                                    Modalidade
                                </span>

                                <strong>
                                    ${formacao.modalidade}
                                </strong>

                            </div>


                            <div class="modal-info-item">

                                <span>
                                    Investimento
                                </span>

                                <strong>
                                    ${formacao.preco} Kz
                                </strong>

                            </div>

                        </div>


                        <button
                            id="btninscricao"
                            class="btn-inscricao">

                            Inscrever-me

                        </button>

                    </div>

                `;


                // Abrir modal

                modalFormacao.classList.add("ativo");


                // =========================
                // BOTÃO INSCREVER-ME
                // =========================

                const btninscricao =
                    document.getElementById("btninscricao");


                btninscricao.onclick = async function () {

                    const perfil = await verificarAutenticacao();

                    if (perfil) {
                        mostrarFormularioInscricao(formacao);
                        return;
                    }

                    mostrarModalAutenticacao(formacao);

                };

            };


            listaformacoes.appendChild(curso);

        });


    } catch (erro) {

        console.error("Erro:", erro);

        listaformacoes.innerHTML =
            "<p>Não foi possível carregar as formações.</p>";

    }

}


carregarFormacoes();


// =========================
// FECHAR MODAL
// =========================

fecharModal.onclick = function () {
    fecharModalAtual();
};

// Fechar clicando fora do modal
modalFormacao.onclick = function (event) {
    if (event.target === modalFormacao) {
        fecharModalAtual();
    }
};

// Fechar com ESC
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        fecharModalAtual();
    }
});


verificarAutenticacao();