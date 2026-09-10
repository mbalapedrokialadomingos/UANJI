// Funcionalidade académica pública: os dados podem ser consultados sem sessão.
const listaCursosAcademicos = document.getElementById("listaCursosAcademicos");
const listaDisciplinas = document.getElementById("listaDisciplinas");
const filtroCurso = document.getElementById("filtroCurso");
const pesquisaDisciplina = document.getElementById("pesquisaDisciplina");
const btnLimparPesquisa = document.getElementById("btnLimparPesquisa");
const estadoAcademia = document.getElementById("estadoAcademia");
const contadorCursos = document.getElementById("contadorCursos");
const contadorDisciplinas = document.getElementById("contadorDisciplinas");
const totalCursosAcademicos = document.getElementById("totalCursosAcademicos");
const totalDisciplinasAcademicas = document.getElementById("totalDisciplinasAcademicas");
const modalAcademia = document.getElementById("modalAcademia");
const fecharModalAcademia = document.getElementById("fecharModalAcademia");
const conteudoModalAcademia = document.getElementById("conteudoModalAcademia");
const paginaAluno = document.body.classList.contains("aluno-page");
const secaoAcademiaAluno = paginaAluno ? document.getElementById("academiaAluno") : null;
const secaoCursosAluno = paginaAluno ? document.querySelector(".aluno-subsection-heading:not(.aluno-disciplines-heading)") : null;
const listaCursosAluno = paginaAluno ? document.getElementById("listaCursosAcademicos") : null;
const secaoDisciplinasAluno = paginaAluno ? document.querySelector(".aluno-disciplines-heading") : null;
const listaDisciplinasAluno = paginaAluno ? document.getElementById("listaDisciplinas") : null;
const painelPesquisaAluno = paginaAluno ? document.querySelector(".aluno-search-panel") : null;
const secaoDisciplinasPublica = !paginaAluno ? document.getElementById("subsecaoDisciplinas") : null;
const filtrosDisciplinaPublicos = !paginaAluno ? document.querySelector(".academia-filtros") : null;

if (paginaAluno) {
    if (secaoAcademiaAluno) {
        secaoAcademiaAluno.hidden = true;
    }
    if (secaoCursosAluno) {
        secaoCursosAluno.hidden = true;
    }
    if (listaCursosAluno) {
        listaCursosAluno.hidden = true;
        listaCursosAluno.replaceChildren();
    }
    secaoDisciplinasAluno.hidden = true;
    listaDisciplinasAluno.hidden = true;
    painelPesquisaAluno.hidden = true;
}

if (secaoDisciplinasPublica) {
    secaoDisciplinasPublica.hidden = true;
    filtrosDisciplinaPublicos.hidden = true;
}

let cursosAcademicos = [];
let disciplinasAcademicas = [];
let cursoSelecionado = "";

function atualizarVisibilidadeCursos() {
    listaCursosAcademicos.querySelectorAll(".academia-curso-card").forEach((cartao) => {
        cartao.hidden = Boolean(cursoSelecionado) && cartao.dataset.cursoId !== cursoSelecionado;
    });
}

function mostrarEstadoAcademia(mensagem = "", tipo = "") {
    estadoAcademia.textContent = mensagem;
    estadoAcademia.className = `status-message ${tipo}`.trim();
}

function criarElementoTexto(tag, classe, texto) {
    const elemento = document.createElement(tag);
    elemento.className = classe;
    elemento.textContent = texto || "Não informado";
    return elemento;
}

// Consulta os cursos académicos reais e preenche o seletor e os cartões públicos.
async function carregarCursosAcademicos() {
    mostrarEstadoAcademia("A carregar cursos académicos...", "loading");

    try {
        const resposta = await fetch("/cursos-academicos");
        const dados = await resposta.json();

        if (!resposta.ok || !Array.isArray(dados)) {
            throw new Error(dados.mensagem || "Não foi possível carregar os cursos académicos.");
        }

        cursosAcademicos = dados;
        filtroCurso.innerHTML = '<option value="">Todos os cursos académicos</option>';
        listaCursosAcademicos.innerHTML = "";

        cursosAcademicos.forEach((curso) => {
            const option = document.createElement("option");
            option.value = curso.id;
            option.textContent = curso.nome;
            filtroCurso.appendChild(option);

            const cartao = document.createElement("article");
            cartao.className = "academia-curso-card";
            cartao.dataset.cursoId = curso.id;
            cartao.append(
                criarElementoTexto("span", "academia-codigo", curso.codigo),
                criarElementoTexto("h4", "", curso.nome),
                criarElementoTexto("p", "", curso.descricao)
            );

            const detalhes = document.createElement("div");
            detalhes.className = "academia-curso-meta";
            detalhes.appendChild(criarElementoTexto("span", "", curso.duracao ? `Duração: ${curso.duracao}` : "Duração não informada"));

            if (!paginaAluno) {
                const botao = document.createElement("button");
                botao.type = "button";
                botao.className = "btn btn-primary";
                botao.textContent = "Ver disciplinas";
                botao.addEventListener("click", () => selecionarCurso(curso.id));
                detalhes.appendChild(botao);
            }
            cartao.appendChild(detalhes);
            listaCursosAcademicos.appendChild(cartao);
        });

        contadorCursos.textContent = `${cursosAcademicos.length} curso${cursosAcademicos.length === 1 ? "" : "s"}`;
        if (totalCursosAcademicos) {
            totalCursosAcademicos.textContent = paginaAluno ? "0" : cursosAcademicos.length;
        }

        if (paginaAluno) {
            if (secaoCursosAluno) secaoCursosAluno.hidden = true;
            if (listaCursosAluno) listaCursosAluno.hidden = true;
            if (totalDisciplinasAcademicas) {
                totalDisciplinasAcademicas.textContent = "0";
            }
            mostrarEstadoAcademia("");
            return;
        }

        mostrarEstadoAcademia("");
    } catch (erro) {
        console.error("Erro ao carregar cursos académicos:", erro);
        listaCursosAcademicos.innerHTML = "";
        mostrarEstadoAcademia(erro.message || "Não foi possível ligar ao serviço académico.", "error");
    }
}

// Carrega todas as disciplinas ou apenas as do curso selecionado pela API.
async function carregarDisciplinas() {
    const endpoint = cursoSelecionado
        ? `/cursos-academicos/${cursoSelecionado}/disciplinas`
        : "/disciplinas";

    listaDisciplinas.innerHTML = "";
    mostrarEstadoAcademia("A carregar disciplinas...", "loading");

    try {
        const resposta = await fetch(endpoint);
        const dados = await resposta.json();

        if (!resposta.ok || !Array.isArray(dados)) {
            throw new Error(dados.mensagem || "Não foi possível carregar as disciplinas.");
        }

        disciplinasAcademicas = dados;
        if (totalDisciplinasAcademicas) {
            totalDisciplinasAcademicas.textContent = disciplinasAcademicas.length;
        }
        renderizarDisciplinas();
        mostrarEstadoAcademia("");
    } catch (erro) {
        console.error("Erro ao carregar disciplinas:", erro);
        mostrarEstadoAcademia(erro.message || "Não foi possível carregar as disciplinas.", "error");
        contadorDisciplinas.textContent = "";
    }
}

function renderizarDisciplinas() {
    const termo = pesquisaDisciplina.value.trim().toLowerCase();
    const resultados = disciplinasAcademicas.filter((disciplina) => {
        const nome = String(disciplina.nome || "").toLowerCase();
        const codigo = String(disciplina.codigo || "").toLowerCase();
        return !termo || nome.includes(termo) || codigo.includes(termo);
    });

    listaDisciplinas.innerHTML = "";
    contadorDisciplinas.textContent = `${resultados.length} resultado${resultados.length === 1 ? "" : "s"}`;

    if (resultados.length === 0) {
        listaDisciplinas.appendChild(criarElementoTexto("p", "empty-state", termo ? "Nenhuma disciplina corresponde à pesquisa." : "Este curso ainda não tem disciplinas disponíveis."));
        return;
    }

    resultados.forEach((disciplina) => {
        const cartao = document.createElement("article");
        cartao.className = "academia-disciplina-card";
        cartao.append(
            criarElementoTexto("span", "academia-codigo", disciplina.codigo),
            criarElementoTexto("h4", "", disciplina.nome),
            criarElementoTexto("p", "", disciplina.descricao)
        );

        const meta = document.createElement("div");
        meta.className = "academia-disciplina-meta";
        meta.appendChild(criarElementoTexto("span", "", disciplina.carga_horaria ? `${disciplina.carga_horaria} horas` : "Carga horária não informada"));
        if (!cursoSelecionado) {
            meta.appendChild(criarElementoTexto("span", "", disciplina.curso_nome));
        }

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "btn btn-primary";
        botao.textContent = "Ver explicadores";
        botao.addEventListener("click", () => abrirPerfilDisciplina(disciplina));
        meta.appendChild(botao);
        cartao.appendChild(meta);
        listaDisciplinas.appendChild(cartao);
    });
}

function selecionarCurso(id) {
    cursoSelecionado = String(id);
    filtroCurso.value = cursoSelecionado;
    atualizarVisibilidadeCursos();
    if (secaoDisciplinasPublica) {
        secaoDisciplinasPublica.hidden = false;
        filtrosDisciplinaPublicos.hidden = false;
        secaoDisciplinasPublica.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    carregarDisciplinas();
}

// Consulta os explicadores associados à disciplina e mostra o perfil no modal.
async function abrirPerfilDisciplina(disciplina) {
    conteudoModalAcademia.innerHTML = "<p>A carregar explicadores...</p>";
    modalAcademia.classList.add("ativo");

    try {
        const resposta = await fetch(`/disciplinas/${disciplina.id}/explicadores`);
        const dados = await resposta.json();

        if (!resposta.ok || !Array.isArray(dados)) {
            throw new Error(dados.mensagem || "Não foi possível carregar os explicadores.");
        }

        conteudoModalAcademia.innerHTML = "";
        const titulo = criarElementoTexto("h2", "", disciplina.nome);
        titulo.id = "tituloModalAcademia";
        conteudoModalAcademia.appendChild(titulo);

        if (dados.length === 0) {
            conteudoModalAcademia.appendChild(criarElementoTexto("p", "empty-state", "Ainda não existem explicadores associados a esta disciplina."));
            return;
        }

        dados.forEach((explicador) => {
            const perfil = document.createElement("article");
            perfil.className = "explicador-card";
            perfil.append(
                criarElementoTexto("h3", "", explicador.nome),
                criarElementoTexto("p", "explicador-especialidade", explicador.especialidade),
                criarElementoTexto("p", "", explicador.bio)
            );

            const acoes = document.createElement("div");
            acoes.className = "explicador-acoes";
            acoes.appendChild(criarElementoTexto("span", "explicador-estado", explicador.estado || "Estado não informado"));
            const botao = document.createElement("button");
            botao.type = "button";
            botao.className = "btn btn-primary";
            botao.textContent = "Solicitar apoio";
            botao.disabled = explicador.estado !== "ativo";
            botao.addEventListener("click", () => solicitarAutenticacaoParaApoio(disciplina, explicador));
            acoes.appendChild(botao);
            perfil.appendChild(acoes);
            conteudoModalAcademia.appendChild(perfil);
        });
    } catch (erro) {
        console.error("Erro ao carregar explicadores:", erro);
        conteudoModalAcademia.innerHTML = "";
        conteudoModalAcademia.appendChild(criarElementoTexto("p", "status-message error", erro.message || "Não foi possível carregar os explicadores."));
    }
}

async function solicitarAutenticacaoParaApoio(disciplina, explicador) {
    // A página do aluno já foi validada pelo servidor; na página pública,
    // a autenticação continua a ser tratada pelo modal principal da aplicação.
    if (typeof mostrarModalAutenticacao !== "function") {
        mostrarFormularioApoio(disciplina, explicador);
        return;
    }

    const perfil = await verificarAutenticacao();

    if (perfil) {
        mostrarFormularioApoio(disciplina, explicador);
        return;
    }

    modalAcademia.classList.remove("ativo");
    mostrarModalAutenticacao(null, () => mostrarFormularioApoio(disciplina, explicador));
}

function mostrarFormularioApoio(disciplina, explicador) {
    conteudoModalAcademia.innerHTML = `
        <h2 id="tituloModalAcademia">Solicitar apoio</h2>
        <p class="modal-contexto">${disciplina.nome} · ${explicador.nome}</p>
        <form id="formSolicitacaoApoio" class="form-modal">
            <label for="mensagemApoio">Mensagem</label>
            <textarea id="mensagemApoio" rows="5" maxlength="1000" placeholder="Explica brevemente em que precisas de apoio." required></textarea>
            <button class="btn btn-primary" type="submit">Enviar solicitação</button>
            <div id="mensagemApoioStatus" class="status-message" role="status" aria-live="polite"></div>
        </form>
    `;

    modalAcademia.classList.add("ativo");
    document.getElementById("formSolicitacaoApoio").addEventListener("submit", async (evento) => {
        evento.preventDefault();
        const status = document.getElementById("mensagemApoioStatus");
        const botao = evento.currentTarget.querySelector("button");
        botao.disabled = true;
        status.textContent = "A enviar solicitação...";
        status.className = "status-message loading";

        try {
            const resposta = await fetch("/solicitacoes-apoio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    disciplina_id: disciplina.id,
                    explicador_id: explicador.id,
                    mensagem: document.getElementById("mensagemApoio").value.trim()
                })
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.mensagem || "Não foi possível enviar a solicitação.");
            }

            status.textContent = dados.mensagem;
            status.className = "status-message success";
            evento.currentTarget.reset();
        } catch (erro) {
            status.textContent = erro.message || "Não foi possível enviar a solicitação.";
            status.className = "status-message error";
        } finally {
            botao.disabled = false;
        }
    });
}

filtroCurso.addEventListener("change", () => {
    cursoSelecionado = filtroCurso.value;
    atualizarVisibilidadeCursos();
    carregarDisciplinas();
});

pesquisaDisciplina.addEventListener("input", renderizarDisciplinas);

btnLimparPesquisa.addEventListener("click", () => {
    pesquisaDisciplina.value = "";
    cursoSelecionado = "";
    filtroCurso.value = "";
    atualizarVisibilidadeCursos();
    carregarDisciplinas();
});

fecharModalAcademia.addEventListener("click", () => modalAcademia.classList.remove("ativo"));
modalAcademia.addEventListener("click", (evento) => {
    if (evento.target === modalAcademia) {
        modalAcademia.classList.remove("ativo");
    }
});

carregarCursosAcademicos();
