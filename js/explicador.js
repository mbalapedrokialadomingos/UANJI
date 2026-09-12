const nomeExplicador = document.getElementById("nomeExplicador");
const contadorSolicitacoesExplicador = document.getElementById("contadorSolicitacoesExplicador");
const listaSolicitacoesExplicador = document.getElementById("listaSolicitacoesExplicador");
const estadoSolicitacoesExplicador = document.getElementById("estadoSolicitacoesExplicador");
const btnLogoutExplicador = document.getElementById("btnLogoutExplicador");

function mostrarEstadoSolicitacoes(mensagem, tipo = "") {
    estadoSolicitacoesExplicador.textContent = mensagem;
    estadoSolicitacoesExplicador.className = `status-message ${tipo}`.trim();
}

function formatarDataSolicitacao(data) {
    if (!data) return "Data não informada";
    const dataFormatada = new Date(data);
    return Number.isNaN(dataFormatada.getTime())
        ? "Data não informada"
        : dataFormatada.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

function criarMetaSolicitacao(rotulo, valor) {
    const meta = document.createElement("div");
    const label = document.createElement("span");
    const texto = document.createElement("strong");
    label.textContent = rotulo;
    texto.textContent = valor || "Não informado";
    meta.append(label, texto);
    return meta;
}

async function atualizarEstadoSolicitacao(id, estado, botao) {
    botao.disabled = true;
    try {
        const resposta = await fetch(`/minhas-solicitacoes-explicador/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado })
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível atualizar a solicitação.");
        await carregarSolicitacoesExplicador();
    } catch (erro) {
        mostrarEstadoSolicitacoes(erro.message, "error");
        botao.disabled = false;
    }
}

async function carregarSolicitacoesExplicador() {
    try {
        const resposta = await fetch("/minhas-solicitacoes-explicador");
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível carregar as solicitações.");

        const nome = dados.explicador && typeof dados.explicador.nome === "string"
            ? dados.explicador.nome.trim()
            : "";
        nomeExplicador.textContent = nome || "Área do explicador";
        const solicitacoes = Array.isArray(dados.solicitacoes) ? dados.solicitacoes : [];
        contadorSolicitacoesExplicador.textContent = `${solicitacoes.length} ${solicitacoes.length === 1 ? "pedido" : "pedidos"}`;
        mostrarEstadoSolicitacoes("");

        if (solicitacoes.length === 0) {
            listaSolicitacoesExplicador.innerHTML = "<p class='empty-state'>Ainda não existem solicitações de apoio.</p>";
            return;
        }

        listaSolicitacoesExplicador.innerHTML = "";
        solicitacoes.forEach((solicitacao) => {
            const item = document.createElement("article");
            item.className = "explicador-request-card";

            const conteudo = document.createElement("div");
            conteudo.className = "explicador-request-content";
            const titulo = document.createElement("h3");
            titulo.textContent = solicitacao.disciplina_nome || "Disciplina sem nome";
            const aluno = document.createElement("p");
            aluno.textContent = `Aluno: ${solicitacao.aluno_nome || "Não informado"}`;
            const curso = document.createElement("p");
            curso.textContent = `Curso: ${solicitacao.curso_nome || "Não informado"}`;
            const mensagem = document.createElement("p");
            mensagem.className = "explicador-request-message";
            mensagem.textContent = solicitacao.mensagem || "Sem mensagem";
            const meta = document.createElement("div");
            meta.className = "explicador-request-meta";
            meta.append(
                criarMetaSolicitacao("Enviada em", formatarDataSolicitacao(solicitacao.created_at)),
                criarMetaSolicitacao("Estado", solicitacao.estado)
            );
            conteudo.append(titulo, aluno, curso, mensagem, meta);

            const acoes = document.createElement("div");
            acoes.className = "explicador-request-actions";
            const estado = String(solicitacao.estado || "pendente").toLowerCase();
            const badge = document.createElement("span");
            badge.className = `solicitacao-status solicitacao-status-${estado}`;
            badge.textContent = solicitacao.estado || "pendente";
            acoes.appendChild(badge);

            if (estado === "pendente") {
                const aceitar = document.createElement("button");
                aceitar.type = "button";
                aceitar.className = "btn btn-primary btn-small";
                aceitar.textContent = "Aceitar";
                aceitar.addEventListener("click", () => atualizarEstadoSolicitacao(solicitacao.id, "aceite", aceitar));
                const recusar = document.createElement("button");
                recusar.type = "button";
                recusar.className = "btn btn-ghost btn-small";
                recusar.textContent = "Recusar";
                recusar.addEventListener("click", () => atualizarEstadoSolicitacao(solicitacao.id, "recusada", recusar));
                acoes.append(aceitar, recusar);
            }

            item.append(conteudo, acoes);
            listaSolicitacoesExplicador.appendChild(item);
        });
    } catch (erro) {
        console.error("Erro ao carregar solicitações do explicador:", erro);
        contadorSolicitacoesExplicador.textContent = "";
        mostrarEstadoSolicitacoes(erro.message, "error");
        listaSolicitacoesExplicador.innerHTML = "<p class='empty-state'>Não foi possível carregar as solicitações.</p>";
    }
}

btnLogoutExplicador.addEventListener("click", async () => {
    try {
        await fetch("/logout", { method: "POST" });
        window.location.href = "/";
    } catch (erro) {
        console.error("Erro ao terminar sessão:", erro);
    }
});

carregarSolicitacoesExplicador();
