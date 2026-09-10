// Script da área do aluno.
// Carrega o perfil autenticado e mostra as inscrições do utilizador atual.
const nomeAluno = document.getElementById("nomeAluno");
const listaMinhasInscricoes = document.getElementById("listaMinhasInscricoes");
const btnLogoutAluno = document.getElementById("btnLogoutAluno");
const totalInscricoes = document.getElementById("totalInscricoes");
const contadorFormacoesAluno = document.getElementById("contadorFormacoesAluno");

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
        carregarInscricoesAluno();
    } catch (erro) {
        console.error("Erro ao carregar perfil do aluno:", erro);
        window.location.href = "/";
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

        totalInscricoes.textContent = inscricoes.length;
        contadorFormacoesAluno.textContent = `${inscricoes.length} ${inscricoes.length === 1 ? "formação" : "formações"}`;

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
            topo.appendChild(estadoBadge);
            conteudo.appendChild(topo);

            const metadados = document.createElement("div");
            metadados.className = "formacao-aluno-meta";
            metadados.appendChild(criarMetaFormacao("Pagamento", inscricao.estado_pagamento || "Não informado", "pagamento"));
            metadados.appendChild(criarMetaFormacao("Inscrição", formatarDataInscricao(inscricao.data_inscricao), "data"));
            conteudo.appendChild(metadados);

            const marcador = document.createElement("span");
            marcador.className = "formacao-aluno-arrow";
            marcador.setAttribute("aria-hidden", "true");
            marcador.textContent = "→";
            item.append(conteudo, marcador);

            listaMinhasInscricoes.appendChild(item);
        });
    } catch (erro) {
        console.error("Erro ao carregar inscrições do aluno:", erro);
        listaMinhasInscricoes.innerHTML = "<p class='empty-state'>Não foi possível carregar as suas inscrições.</p>";
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
