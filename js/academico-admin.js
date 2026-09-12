// Gestão administrativa dos recursos académicos e das solicitações de apoio.
const academiaAdmin = {
    cursos: [],
    disciplinas: [],
    explicadores: []
};

const $ = (id) => document.getElementById(id);
const mensagemAcademica = $("mensagemAcademica");

function mostrarMensagemAcademica(mensagem, tipo = "") {
    mensagemAcademica.textContent = mensagem;
    mensagemAcademica.className = `mensagem ${tipo}`.trim();
}

async function apiAcademica(url, opcoes = {}) {
    const resposta = await fetch(url, {
        ...opcoes,
        headers: {
            "Content-Type": "application/json",
            ...(opcoes.headers || {})
        }
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
        throw new Error(dados.mensagem || "Não foi possível concluir a operação.");
    }
    return dados;
}

function escaparTexto(valor) {
    return String(valor || "Não informado")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function preencherSelect(select, itens, textoPadrao, campoNome = "nome") {
    select.innerHTML = `<option value="">${textoPadrao}</option>`;
    itens.forEach((item) => {
        select.insertAdjacentHTML("beforeend", `<option value="${item.id}">${escaparTexto(item[campoNome])}</option>`);
    });
}

function limparCurso() {
    $("formCursoAcademico").reset();
    $("cursoAcademicoId").value = "";
    $("tituloCursoAcademico").textContent = "Adicionar curso académico";
    $("btnCancelarCurso").hidden = true;
}

function limparDisciplina() {
    $("formDisciplinaAcademica").reset();
    $("disciplinaAcademicaId").value = "";
    $("cargaDisciplinaAcademica").value = "0";
    $("tituloDisciplinaAcademica").textContent = "Adicionar disciplina";
    $("btnCancelarDisciplina").hidden = true;
}

function limparExplicador() {
    $("formExplicadorAcademico").reset();
    $("explicadorAcademicoId").value = "";
    $("tituloExplicadorAcademico").textContent = "Adicionar explicador";
    $("btnCancelarExplicador").hidden = true;
}

function renderizarCursos() {
    $("listaCursosAcademicosAdmin").innerHTML = academiaAdmin.cursos.length
        ? academiaAdmin.cursos.map((curso) => `
            <article class="admin-resource-item">
                <div><strong>${escaparTexto(curso.nome)}</strong><span>${escaparTexto(curso.codigo)} · ${escaparTexto(curso.duracao)}</span></div>
                <div class="admin-resource-actions"><button class="btn btn-ghost btn-small" data-editar-curso="${curso.id}">Editar</button><button class="btn btn-danger btn-small" data-remover-curso="${curso.id}">Remover</button></div>
            </article>`).join("")
        : "<p class='empty-state'>Nenhum curso académico.</p>";

    $("listaCursosAcademicosAdmin").querySelectorAll("[data-editar-curso]").forEach((botao) => botao.addEventListener("click", () => {
        const curso = academiaAdmin.cursos.find((item) => item.id === Number(botao.dataset.editarCurso));
        $("cursoAcademicoId").value = curso.id;
        $("nomeCursoAcademico").value = curso.nome;
        $("descricaoCursoAcademico").value = curso.descricao || "";
        $("codigoCursoAcademico").value = curso.codigo || "";
        $("duracaoCursoAcademico").value = curso.duracao || "";
        $("tituloCursoAcademico").textContent = "Editar curso académico";
        $("btnCancelarCurso").hidden = false;
        $("formCursoAcademico").scrollIntoView({ behavior: "smooth", block: "center" });
    }));
    $("listaCursosAcademicosAdmin").querySelectorAll("[data-remover-curso]").forEach((botao) => botao.addEventListener("click", () => removerRecurso("curso", Number(botao.dataset.removerCurso))));
}

function renderizarDisciplinas() {
    $("listaDisciplinasAcademicasAdmin").innerHTML = academiaAdmin.disciplinas.length
        ? academiaAdmin.disciplinas.map((disciplina) => `
            <article class="admin-resource-item">
                <div><strong>${escaparTexto(disciplina.nome)}</strong><span>${escaparTexto(disciplina.curso_nome)} · ${escaparTexto(disciplina.codigo)}</span></div>
                <div class="admin-resource-actions"><button class="btn btn-ghost btn-small" data-editar-disciplina="${disciplina.id}">Editar</button><button class="btn btn-danger btn-small" data-remover-disciplina="${disciplina.id}">Remover</button></div>
            </article>`).join("")
        : "<p class='empty-state'>Nenhuma disciplina.</p>";

    $("listaDisciplinasAcademicasAdmin").querySelectorAll("[data-editar-disciplina]").forEach((botao) => botao.addEventListener("click", () => {
        const disciplina = academiaAdmin.disciplinas.find((item) => item.id === Number(botao.dataset.editarDisciplina));
        $("disciplinaAcademicaId").value = disciplina.id;
        $("nomeDisciplinaAcademica").value = disciplina.nome;
        $("descricaoDisciplinaAcademica").value = disciplina.descricao || "";
        $("codigoDisciplinaAcademica").value = disciplina.codigo || "";
        $("cargaDisciplinaAcademica").value = disciplina.carga_horaria || 0;
        $("cursoDisciplinaAcademica").value = disciplina.curso_academico_id;
        $("tituloDisciplinaAcademica").textContent = "Editar disciplina";
        $("btnCancelarDisciplina").hidden = false;
        $("formDisciplinaAcademica").scrollIntoView({ behavior: "smooth", block: "center" });
    }));
    $("listaDisciplinasAcademicasAdmin").querySelectorAll("[data-remover-disciplina]").forEach((botao) => botao.addEventListener("click", () => removerRecurso("disciplina", Number(botao.dataset.removerDisciplina))));
}

function renderizarExplicadores() {
    $("listaExplicadoresAcademicosAdmin").innerHTML = academiaAdmin.explicadores.length
        ? academiaAdmin.explicadores.map((explicador) => `
            <article class="admin-resource-item">
                <div><strong>${escaparTexto(explicador.nome)}</strong><span>${escaparTexto(explicador.especialidade)} · ${escaparTexto(explicador.estado)}</span></div>
                <div class="admin-resource-actions"><button class="btn btn-ghost btn-small" data-editar-explicador="${explicador.id}">Editar</button><button class="btn btn-danger btn-small" data-remover-explicador="${explicador.id}">Remover</button></div>
            </article>`).join("")
        : "<p class='empty-state'>Nenhum explicador.</p>";

    $("listaExplicadoresAcademicosAdmin").querySelectorAll("[data-editar-explicador]").forEach((botao) => botao.addEventListener("click", () => {
        const explicador = academiaAdmin.explicadores.find((item) => item.id === Number(botao.dataset.editarExplicador));
        $("explicadorAcademicoId").value = explicador.id;
        $("nomeExplicadorAcademico").value = explicador.nome;
        $("emailExplicadorAcademico").value = explicador.email;
        $("especialidadeExplicadorAcademico").value = explicador.especialidade || "";
        $("bioExplicadorAcademico").value = explicador.bio || "";
        $("tituloExplicadorAcademico").textContent = "Editar explicador";
        $("btnCancelarExplicador").hidden = false;
        $("formExplicadorAcademico").scrollIntoView({ behavior: "smooth", block: "center" });
    }));
    $("listaExplicadoresAcademicosAdmin").querySelectorAll("[data-remover-explicador]").forEach((botao) => botao.addEventListener("click", () => removerRecurso("explicador", Number(botao.dataset.removerExplicador))));
}

async function carregarRecursosAcademicos() {
    try {
        const [cursos, disciplinas, explicadores] = await Promise.all([
            apiAcademica("/cursos-academicos"),
            apiAcademica("/disciplinas"),
            apiAcademica("/explicadores")
        ]);
        academiaAdmin.cursos = cursos;
        academiaAdmin.disciplinas = disciplinas;
        academiaAdmin.explicadores = explicadores;
        preencherSelect($("cursoDisciplinaAcademica"), cursos, "Selecione o curso");
        preencherSelect($("disciplinaAssociacao"), disciplinas, "Selecione a disciplina");
        preencherSelect($("explicadorAssociacao"), explicadores, "Selecione o explicador");
        renderizarCursos();
        renderizarDisciplinas();
        renderizarExplicadores();
    } catch (erro) {
        mostrarMensagemAcademica(erro.message, "mensagem-erro");
    }
}

async function removerRecurso(tipo, id) {
    const nomes = { curso: "curso académico", disciplina: "disciplina", explicador: "explicador" };
    if (!window.confirm(`Remover este ${nomes[tipo]}?`)) return;

    const rotas = { curso: "cursos-academicos", disciplina: "disciplinas", explicador: "explicadores" };
    try {
        const dados = await apiAcademica(`/${rotas[tipo]}/${id}`, { method: "DELETE" });
        mostrarMensagemAcademica(dados.mensagem, "mensagem-sucesso");
        await carregarRecursosAcademicos();
    } catch (erro) {
        mostrarMensagemAcademica(erro.message, "mensagem-erro");
    }
}

$("formCursoAcademico").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const id = $("cursoAcademicoId").value;
    const body = {
        nome: $("nomeCursoAcademico").value.trim(),
        descricao: $("descricaoCursoAcademico").value.trim(),
        codigo: $("codigoCursoAcademico").value.trim(),
        duracao: $("duracaoCursoAcademico").value.trim()
    };
    try {
        const dados = await apiAcademica(id ? `/cursos-academicos/${id}` : "/cursos-academicos", { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
        mostrarMensagemAcademica(dados.mensagem, "mensagem-sucesso");
        limparCurso();
        await carregarRecursosAcademicos();
    } catch (erro) { mostrarMensagemAcademica(erro.message, "mensagem-erro"); }
});

$("formDisciplinaAcademica").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const id = $("disciplinaAcademicaId").value;
    const body = {
        nome: $("nomeDisciplinaAcademica").value.trim(),
        descricao: $("descricaoDisciplinaAcademica").value.trim(),
        codigo: $("codigoDisciplinaAcademica").value.trim(),
        carga_horaria: Number($("cargaDisciplinaAcademica").value || 0),
        curso_academico_id: Number($("cursoDisciplinaAcademica").value)
    };
    try {
        const dados = await apiAcademica(id ? `/disciplinas/${id}` : "/disciplinas", { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
        mostrarMensagemAcademica(dados.mensagem, "mensagem-sucesso");
        limparDisciplina();
        await carregarRecursosAcademicos();
    } catch (erro) { mostrarMensagemAcademica(erro.message, "mensagem-erro"); }
});

$("formExplicadorAcademico").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const id = $("explicadorAcademicoId").value;
    const passwordInicial = $("passwordInicialExplicador").value;
    const passwordForte = passwordInicial.length === 0 || (passwordInicial.length >= 8
        && /[a-z]/.test(passwordInicial)
        && /[A-Z]/.test(passwordInicial)
        && /\d/.test(passwordInicial)
        && /[^A-Za-z\d]/.test(passwordInicial));
    if (!passwordForte) {
        mostrarMensagemAcademica("A password deve ter pelo menos 8 caracteres, uma maiúscula, uma minúscula, um número e um símbolo.", "mensagem-erro");
        return;
    }
    const body = {
        nome: $("nomeExplicadorAcademico").value.trim(),
        email: $("emailExplicadorAcademico").value.trim(),
        passwordInicial,
        especialidade: $("especialidadeExplicadorAcademico").value.trim(),
        bio: $("bioExplicadorAcademico").value.trim()
    };
    try {
        const dados = await apiAcademica(id ? `/explicadores/${id}` : "/explicadores", { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
        mostrarMensagemAcademica(dados.mensagem, "mensagem-sucesso");
        limparExplicador();
        await carregarRecursosAcademicos();
    } catch (erro) { mostrarMensagemAcademica(erro.message, "mensagem-erro"); }
});

$("formAssociacaoAcademica").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    try {
        const dados = await apiAcademica(`/disciplinas/${$("disciplinaAssociacao").value}/explicadores`, {
            method: "POST",
            body: JSON.stringify({ explicador_id: Number($("explicadorAssociacao").value) })
        });
        mostrarMensagemAcademica(dados.mensagem, "mensagem-sucesso");
        evento.currentTarget.reset();
    } catch (erro) { mostrarMensagemAcademica(erro.message, "mensagem-erro"); }
});

async function carregarSolicitacoesApoio() {
    try {
        const solicitacoes = await apiAcademica("/solicitacoes-apoio");
        $("contadorSolicitacoesApoio").textContent = `${solicitacoes.length} ${solicitacoes.length === 1 ? "pedido" : "pedidos"}`;
        $("listaSolicitacoesApoio").innerHTML = solicitacoes.length
            ? solicitacoes.map((solicitacao) => `
                <article class="admin-resource-item admin-request-item">
                    <div><strong>${escaparTexto(solicitacao.aluno_nome)} · ${escaparTexto(solicitacao.disciplina_nome)}</strong><span>Explicador: ${escaparTexto(solicitacao.explicador_nome)} · ${escaparTexto(solicitacao.aluno_email)}</span><p>${escaparTexto(solicitacao.mensagem)}</p></div>
                    <select class="seletor-apoio" data-id="${solicitacao.id}" aria-label="Estado da solicitação ${solicitacao.id}">
                        <option value="pendente" ${solicitacao.estado === "pendente" ? "selected" : ""}>Pendente</option>
                        <option value="aceite" ${solicitacao.estado === "aceite" ? "selected" : ""}>Aceite</option>
                        <option value="recusada" ${solicitacao.estado === "recusada" ? "selected" : ""}>Recusada</option>
                    </select>
                </article>`).join("")
            : "<p class='empty-state'>Ainda não existem solicitações de apoio.</p>";

        $("listaSolicitacoesApoio").querySelectorAll(".seletor-apoio").forEach((seletor) => seletor.addEventListener("change", async () => {
            try {
                const dados = await apiAcademica(`/solicitacoes-apoio/${seletor.dataset.id}`, { method: "PATCH", body: JSON.stringify({ estado: seletor.value }) });
                mostrarMensagemAcademica(dados.mensagem, "mensagem-sucesso");
            } catch (erro) {
                mostrarMensagemAcademica(erro.message, "mensagem-erro");
                await carregarSolicitacoesApoio();
            }
        }));
    } catch (erro) {
        $("listaSolicitacoesApoio").innerHTML = `<p class="mensagem-erro">${escaparTexto(erro.message)}</p>`;
    }

    carregarPedidosEliminacaoApoio();
}

async function carregarPedidosEliminacaoApoio() {
    try {
        const pedidos = await apiAcademica("/pedidos-eliminacao-apoio");
        $("listaPedidosEliminacaoApoio").innerHTML = pedidos.length
            ? pedidos.map((pedido) => `
                <article class="admin-resource-item admin-request-item">
                    <div><strong>${escaparTexto(pedido.aluno_nome)} · ${escaparTexto(pedido.disciplina_nome)}</strong><span>Curso: ${escaparTexto(pedido.curso_nome)} · Explicador: ${escaparTexto(pedido.explicador_nome)}</span></div>
                    <div class="admin-request-actions">
                        <button class="btn btn-primary btn-small" data-decisao-eliminacao="aceite" data-id="${pedido.id}" type="button">Aceitar</button>
                        <button class="btn btn-ghost btn-small" data-decisao-eliminacao="recusada" data-id="${pedido.id}" type="button">Recusar</button>
                    </div>
                </article>`).join("")
            : "<p class='empty-state'>Não existem pedidos de eliminação pendentes.</p>";

        $("listaPedidosEliminacaoApoio").querySelectorAll("[data-decisao-eliminacao]").forEach((botao) => botao.addEventListener("click", async () => {
            botao.disabled = true;
            try {
                const dados = await apiAcademica(`/pedidos-eliminacao-apoio/${botao.dataset.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ estado: botao.dataset.decisaoEliminacao })
                });
                mostrarMensagemAcademica(dados.mensagem, "mensagem-sucesso");
                await carregarPedidosEliminacaoApoio();
                await carregarSolicitacoesApoio();
            } catch (erro) {
                botao.disabled = false;
                mostrarMensagemAcademica(erro.message, "mensagem-erro");
            }
        }));
    } catch (erro) {
        $("listaPedidosEliminacaoApoio").innerHTML = `<p class="mensagem-erro">${escaparTexto(erro.message)}</p>`;
    }
}

$("btnCancelarCurso").addEventListener("click", limparCurso);
$("btnCancelarDisciplina").addEventListener("click", limparDisciplina);
$("btnCancelarExplicador").addEventListener("click", limparExplicador);

document.querySelectorAll(".painel-menu a[href^='#']").forEach((link) => {
    link.addEventListener("click", (evento) => {
        const alvo = document.querySelector(link.getAttribute("href"));
        if (!alvo || alvo.tagName !== "DETAILS") return;
        evento.preventDefault();
        alvo.open = true;
        alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

carregarRecursosAcademicos();
carregarSolicitacoesApoio();
