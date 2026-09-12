-- Adiciona informações opcionais ao perfil académico dos utilizadores.
ALTER TABLE public.utilizadores
    ADD COLUMN IF NOT EXISTS sexo character varying(30),
    ADD COLUMN IF NOT EXISTS curso character varying(150),
    ADD COLUMN IF NOT EXISTS instituicao character varying(150),
    ADD COLUMN IF NOT EXISTS ano_faculdade integer,
    ADD COLUMN IF NOT EXISTS data_nascimento date;