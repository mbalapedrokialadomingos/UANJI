const formAlterarPassword = document.getElementById("formAlterarPassword");
const mensagemAlterarPassword = document.getElementById("mensagemAlterarPassword");

formAlterarPassword.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const password = document.getElementById("novaPassword").value;
    const confirmacao = document.getElementById("confirmarPassword").value;
    const passwordForte = password.length >= 8
        && /[a-z]/.test(password)
        && /[A-Z]/.test(password)
        && /\d/.test(password)
        && /[^A-Za-z\d]/.test(password);

    if (!passwordForte) {
        mensagemAlterarPassword.textContent = "A password deve ter pelo menos 8 caracteres, uma maiúscula, uma minúscula, um número e um símbolo.";
        return;
    }

    if (password !== confirmacao) {
        mensagemAlterarPassword.textContent = "As passwords não coincidem.";
        return;
    }

    try {
        const resposta = await fetch("/alterar-password-primeiro-acesso", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password, confirmacao })
        });
        const dados = await resposta.json();
        mensagemAlterarPassword.textContent = dados.mensagem;

        if (!resposta.ok) return;
        window.location.href = "/explicador.html";
    } catch (erro) {
        console.error("Erro ao alterar password:", erro);
        mensagemAlterarPassword.textContent = "Não foi possível alterar a password.";
    }
});
