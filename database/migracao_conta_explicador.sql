-- Adiciona a marca de troca obrigatória da password no primeiro acesso.
ALTER TABLE public.utilizadores
    ADD COLUMN IF NOT EXISTS exigir_alteracao_password boolean NOT NULL DEFAULT false;
