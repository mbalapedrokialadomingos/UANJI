--
-- PostgreSQL database dump
--

\restrict c0ZvZV3RHFcgBx80NCA6iUcZjwl20pVbId1ex8TTLpmV3As9BVj0FbbslayvADV

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: administradores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.administradores (
    id integer NOT NULL,
    usuario character varying(50) NOT NULL,
    senha character varying(255) NOT NULL
);


ALTER TABLE public.administradores OWNER TO postgres;

--
-- Name: administradores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.administradores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.administradores_id_seq OWNER TO postgres;

--
-- Name: administradores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.administradores_id_seq OWNED BY public.administradores.id;


--
-- Name: formacoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.formacoes (
    id integer NOT NULL,
    nome character varying(150) NOT NULL,
    descricao text,
    modalidade character varying(100),
    preco numeric(10,2),
    imagem character varying(255)
);


ALTER TABLE public.formacoes OWNER TO postgres;

--
-- Name: formacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.formacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.formacoes_id_seq OWNER TO postgres;

--
-- Name: formacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.formacoes_id_seq OWNED BY public.formacoes.id;


--
-- Name: inscricoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inscricoes (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    formacao character varying(150) NOT NULL,
    data_inscricao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    utilizador_id integer,
    estado character varying(30) DEFAULT 'PENDENTE'::character varying,
    estado_pagamento character varying(30) DEFAULT 'PENDENTE'::character varying
);


ALTER TABLE public.inscricoes OWNER TO postgres;

--
-- Name: inscricoes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inscricoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inscricoes_id_seq OWNER TO postgres;

--
-- Name: inscricoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inscricoes_id_seq OWNED BY public.inscricoes.id;


--
-- Name: servicos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.servicos (
    id integer NOT NULL,
    nome character varying(150) NOT NULL,
    descricao text NOT NULL,
    preco numeric(10,2)
);


ALTER TABLE public.servicos OWNER TO postgres;

--
-- Name: servicos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.servicos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.servicos_id_seq OWNER TO postgres;

--
-- Name: servicos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.servicos_id_seq OWNED BY public.servicos.id;


--
-- Name: utilizadores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utilizadores (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.utilizadores OWNER TO postgres;

--
-- Name: utilizadores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utilizadores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utilizadores_id_seq OWNER TO postgres;

--
-- Name: utilizadores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utilizadores_id_seq OWNED BY public.utilizadores.id;


--
-- Name: administradores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administradores ALTER COLUMN id SET DEFAULT nextval('public.administradores_id_seq'::regclass);


--
-- Name: formacoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formacoes ALTER COLUMN id SET DEFAULT nextval('public.formacoes_id_seq'::regclass);


--
-- Name: inscricoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscricoes ALTER COLUMN id SET DEFAULT nextval('public.inscricoes_id_seq'::regclass);


--
-- Name: servicos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicos ALTER COLUMN id SET DEFAULT nextval('public.servicos_id_seq'::regclass);


--
-- Name: utilizadores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilizadores ALTER COLUMN id SET DEFAULT nextval('public.utilizadores_id_seq'::regclass);


--
-- Data for Name: administradores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.administradores (id, usuario, senha) FROM stdin;
1	admin	$2b$10$EDJccIZ4UjS9mzxNpUt0VO5GYgjp94/gEDEK.S2H7wWrSkt/Lv3wS
\.


--
-- Data for Name: formacoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.formacoes (id, nome, descricao, modalidade, preco, imagem) FROM stdin;
1	Fundamentos de Rede	Aprenda Redes Com os melhores formadores da nossa plataforma	Online	25000.00	\N
3	Fundamentos de Linux	Ainda não dominas Linux?? Estás a espera do quê?	Online	10000.00	\N
4	CCNA 3 - Routing & Switching	Vem aprender Redes com melhor Formador	Online	60000.00	\N
2	HCIA DATACOM	Se queres mergulhar nesse mundo, venha conosco !	Presencial	30000.00	\N
\.


--
-- Data for Name: inscricoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inscricoes (id, nome, email, formacao, data_inscricao, utilizador_id, estado, estado_pagamento) FROM stdin;
1	Pedro	pedro@gmail.com	Fundamentos de Rede	2026-08-27 18:33:08.709447	\N	PENDENTE	PENDENTE
2	Domingos	domingos@gmail.co.ao	HCIA DATACOM	2026-08-27 18:52:35.035911	\N	PENDENTE	PENDENTE
3	Manuel Garcia	manuel@gmail.com	Fundamentos de Rede	2026-08-27 19:08:30.377871	\N	PENDENTE	PENDENTE
4	ana	anadias@gmail.com	Fundamentos de Rede	2026-08-27 20:04:21.011881	\N	PENDENTE	PENDENTE
5	Garcia Manuel	garcia@gmail.com	HCIA DATACOM	2026-08-27 23:54:45.582453	\N	PENDENTE	PENDENTE
7	Veronica Francisco	veronica@gmail.com	Fundamentos de Linux	2026-08-29 00:35:42.346382	1	APROVADO	PENDENTE
8	Veronica Francisco	veronica@gmail.com	CCNA 3 - Routing & Switching	2026-08-29 00:58:55.311106	1	REPROVADO	PENDENTE
6	Oliveira	oliveira@gmail.com	HCIA DATACOM	2026-08-28 00:10:30.161098	\N	APROVADO	PENDENTE
\.


--
-- Data for Name: servicos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.servicos (id, nome, descricao, preco) FROM stdin;
1	Configuração de Redes	Configuração e organização de redes de computadores.	50000.00
2	Consultoria em Redes	Consultoria para planeamento, implementação e melhoria de redes.	30000.00
3	Manutenção de Redes	Diagnóstico e manutenção de equipamentos e infraestrutura de rede.	25000.00
\.


--
-- Data for Name: utilizadores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.utilizadores (id, nome, email, password_hash, data_criacao) FROM stdin;
1	Veronica Francisco	veronica@gmail.com	$2b$10$UZ1/dgrM7URO/6zcIdCq7OcqUeJ/6HkI0OHS40m5Qd32gLIU2Qs0e	2026-08-29 00:35:33.896211
\.


--
-- Name: administradores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.administradores_id_seq', 1, true);


--
-- Name: formacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.formacoes_id_seq', 4, true);


--
-- Name: inscricoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inscricoes_id_seq', 8, true);


--
-- Name: servicos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.servicos_id_seq', 3, true);


--
-- Name: utilizadores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utilizadores_id_seq', 1, true);


--
-- Name: administradores administradores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_pkey PRIMARY KEY (id);


--
-- Name: administradores administradores_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_usuario_key UNIQUE (usuario);


--
-- Name: formacoes formacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formacoes
    ADD CONSTRAINT formacoes_pkey PRIMARY KEY (id);


--
-- Name: inscricoes inscricoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscricoes
    ADD CONSTRAINT inscricoes_pkey PRIMARY KEY (id);


--
-- Name: servicos servicos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicos
    ADD CONSTRAINT servicos_pkey PRIMARY KEY (id);


--
-- Name: utilizadores utilizadores_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilizadores
    ADD CONSTRAINT utilizadores_email_key UNIQUE (email);


--
-- Name: utilizadores utilizadores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilizadores
    ADD CONSTRAINT utilizadores_pkey PRIMARY KEY (id);


--
-- Name: inscricoes inscricoes_utilizador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscricoes
    ADD CONSTRAINT inscricoes_utilizador_id_fkey FOREIGN KEY (utilizador_id) REFERENCES public.utilizadores(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict c0ZvZV3RHFcgBx80NCA6iUcZjwl20pVbId1ex8TTLpmV3As9BVj0FbbslayvADV

