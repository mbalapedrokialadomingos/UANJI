// Script da área do aluno.
// Carrega o perfil autenticado e mostra as inscrições do utilizador atual.
const nomeAluno = document.getElementById("nomeAluno");
const perfilNomeAluno = document.getElementById("perfilNomeAluno");
const perfilEmailAluno = document.getElementById("perfilEmailAluno");
const listaMinhasInscricoes = document.getElementById("listaMinhasInscricoes");
const btnLogoutAluno = document.getElementById("btnLogoutAluno");
const listaSolicitacoesAluno = document.getElementById("listaSolicitacoesAluno");

// Busca o perfil do aluno autenticado e valida se a sessão ainda está ativa.
async function carregarPerfilAluno() {
    try {
        const resposta = await fetch("/perfil");

        if (!resposta.ok) {
            window.location.href = "/";
            return;
        }

        const dados = await resposta.json();

        if (!dados.autenticado) {
            window.location.href = "/";
            return;
        }

        nomeAluno.textContent = dados.utilizador.nome;
        perfilNomeAluno.textContent = dados.utilizador.nome;
        perfilEmailAluno.textContent = dados.utilizador.email;
        carregarInscricoesAluno();
        carregarSolicitacoesAluno();
    } catch (erro) {
        console.error("Erro ao carregar perfil do aluno:", erro);
        window.location.href = "/";
    }
}

async function carregarSolicitacoesAluno() {
    try {
        const resposta = await fetch("/minhas-solicitacoes-apoio");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar as solicitações.");
        }

        const dados = await resposta.json();
        const solicitacoes = Array.isArray(dados.solicitacoes) ? dados.solicitacoes : [];
        if (solicitacoes.length === 0) {
            listaSolicitacoesAluno.innerHTML = "<p class='empty-state'>Ainda não enviaste solicitações de apoio.</p>";
            return;
        }

        listaSolicitacoesAluno.innerHTML = "";
        solicitacoes.forEach((solicitacao) => {
            const item = document.createElement("article");
            item.className = "solicitacao-aluno-item";

            const conteudo = document.createElement("div");
            const titulo = document.createElement("h3");
            titulo.textContent = solicitacao.disciplina_nome || "Disciplina sem nome";
            const curso = document.createElement("p");
            curso.textContent = solicitacao.curso_nome || "Curso não informado";
            const explicador = document.createElement("p");
            explicador.textContent = `Explicador: ${solicitacao.explicador_nome || "Não informado"}`;
            const solicitante = document.createElement("p");
            solicitante.textContent = `Solicitante: ${solicitacao.aluno_nome || "Não informado"}`;
            const data = document.createElement("p");
            data.textContent = `Enviada em: ${formatarDataInscricao(solicitacao.created_at)}`;
            conteudo.append(titulo, curso, explicador, solicitante, data);

            const estado = String(solicitacao.estado || "pendente").toLowerCase();
            const estadoBadge = document.createElement("span");
            estadoBadge.className = `solicitacao-status solicitacao-status-${estado}`;
            estadoBadge.textContent = solicitacao.estado || "Pendente";

            const remover = document.createElement("button");
            remover.type = "button";
            remover.className = "btn btn-ghost btn-small solicitacao-remover";
            remover.textContent = solicitacao.estado_eliminacao === "pendente" ? "Pedido enviado" : "Pedir eliminação";
            remover.disabled = solicitacao.estado_eliminacao === "pendente";
            remover.addEventListener("click", () => eliminarSolicitacaoAluno(solicitacao.id, remover));

            const acoes = document.createElement("div");
            acoes.className = "solicitacao-aluno-acoes";
            acoes.append(estadoBadge, remover);
            item.append(conteudo, acoes);
            listaSolicitacoesAluno.appendChild(item);
        });
    } catch (erro) {
        console.error("Erro ao carregar solicitações do aluno:", erro);
        listaSolicitacoesAluno.innerHTML = "<p class='empty-state'>Não foi possível carregar as solicitações.</p>";
    }
}

async function eliminarSolicitacaoAluno(id, botao) {
    if (!window.confirm("Tem a certeza de que pretende eliminar esta solicitação?")) {
        return;
    }

    botao.disabled = true;

    try {
        const resposta = await fetch(`/minhas-solicitacoes-apoio/${id}/eliminacao`, { method: "POST" });
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Não foi possível eliminar a solicitação.");
        }

        await carregarSolicitacoesAluno();
    } catch (erro) {
        console.error("Erro ao eliminar solicitação:", erro);
        botao.disabled = false;
        window.alert(erro.message || "Não foi possível eliminar a solicitação.");
    }
}

// Lista as inscrições do aluno com o respetivo estado e pagamento.
async function carregarInscricoesAluno() {
    try {
        const resposta = await fetch("/minhas-inscricoes");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar as inscrições.");
        }

        const dados = await resposta.json();
        const inscricoes = Array.isArray(dados.inscricoes) ? dados.inscricoes : [];


        if (inscricoes.length === 0) {
            listaMinhasInscricoes.innerHTML = "<p class='empty-state'>Ainda não tens formações inscritas.</p>";
            return;
        }

        listaMinhasInscricoes.innerHTML = "";

        inscricoes.forEach((inscricao) => {
            const item = document.createElement("article");
            item.className = "aluno-item formacao-aluno-card";

            const conteudo = document.createElement("div");
            conteudo.className = "formacao-aluno-content";

            const topo = document.createElement("div");
            topo.className = "formacao-aluno-topo";

            const titulo = document.createElement("h3");
            titulo.textContent = inscricao.formacao || "Formação sem nome";
            topo.appendChild(titulo);

            const estado = String(inscricao.estado || "PENDENTE");
            const estadoBadge = document.createElement("span");
            estadoBadge.className = `formacao-status formacao-status-${estado.toLowerCase()}`;
            estadoBadge.textContent = estado;
            conteudo.appendChild(topo);

            const metadados = document.createElement("div");
            metadados.className = "formacao-aluno-meta";
            metadados.appendChild(criarMetaFormacao("Pagamento", inscricao.estado_pagamento || "Não informado", "pagamento"));
            metadados.appendChild(criarMetaFormacao("Inscrição", formatarDataInscricao(inscricao.data_inscricao), "data"));
            conteudo.appendChild(metadados);
            const acoes = document.createElement("div");
            acoes.className = "formacao-aluno-acoes";
            acoes.appendChild(estadoBadge);

            if (estado === "REPROVADO") {
                const remover = document.createElement("button");
                remover.type = "button";
                remover.className = "btn btn-ghost btn-small formacao-remover";
                remover.textContent = "Eliminar formação";
                remover.addEventListener("click", () => eliminarFormacaoReprovada(inscricao.id, remover));
                acoes.appendChild(remover);
            }

            item.append(conteudo, acoes);

            listaMinhasInscricoes.appendChild(item);
        });
    } catch (erro) {
        console.error("Erro ao carregar inscrições do aluno:", erro);
        listaMinhasInscricoes.innerHTML = "<p class='empty-state'>Não foi possível carregar as suas inscrições.</p>";
    }
}

async function eliminarFormacaoReprovada(id, botao) {
    if (!window.confirm("Tem a certeza de que pretende eliminar esta formação reprovada do seu perfil?")) {
        return;
    }

    botao.disabled = true;

    try {
        const resposta = await fetch(`/minhas-inscricoes/${id}`, { method: "DELETE" });
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Não foi possível eliminar a formação.");
        }

        await carregarInscricoesAluno();
    } catch (erro) {
        console.error("Erro ao eliminar formação:", erro);
        botao.disabled = false;
        window.alert(erro.message || "Não foi possível eliminar a formação.");
    }
}

function criarMetaFormacao(rotulo, valor, tipo) {
    const meta = document.createElement("div");
    meta.className = `formacao-meta-item formacao-meta-${tipo}`;
    const label = document.createElement("span");
    label.textContent = rotulo;
    const texto = document.createElement("strong");
    texto.textContent = valor;
    meta.append(label, texto);
    return meta;
}

function formatarDataInscricao(data) {
    if (!data) return "Data não informada";
    const dataFormatada = new Date(data);
    return Number.isNaN(dataFormatada.getTime())
        ? "Data não informada"
        : dataFormatada.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

// Termina a sessão do aluno e volta para a página inicial.
btnLogoutAluno.addEventListener("click", async () => {
    try {
        await fetch("/logout", { method: "POST" });
        window.location.href = "/";
    } catch (erro) {
        console.error("Erro ao sair:", erro);
    }
});

carregarPerfilAluno();
