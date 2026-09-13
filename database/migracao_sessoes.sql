-- Cria a tabela de sessões para persistir autenticação em produção.
-- Necessária porque a Vercel não mantém memória do processo entre reinícios.
CREATE TABLE IF NOT EXISTS public.sessoes (
    id TEXT PRIMARY KEY,
    dados JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1440 minutes'
);

CREATE INDEX IF NOT EXISTS idx_sessoes_expires_at
    ON public.sessoes (expires_at);
