--
-- PostgreSQL database dump
--

\restrict lbYsqER1o73eZc1adCtHZwfArREIGT7xuDtFZuHpYApgzECeUNyaxeOXYYNoVNF

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: estado_aprendiz_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_aprendiz_enum AS ENUM (
    'retiro voluntario',
    'en formacion',
    'traslado'
);


ALTER TYPE public.estado_aprendiz_enum OWNER TO postgres;

--
-- Name: estado_formacion_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.estado_formacion_enum AS ENUM (
    'en ejecucion',
    'finalizada',
    'cancelada'
);


ALTER TYPE public.estado_formacion_enum OWNER TO postgres;

--
-- Name: fase_nombre_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.fase_nombre_enum AS ENUM (
    'ANALISIS',
    'PLANEACION',
    'EJECUCION',
    'EVALUACION'
);


ALTER TYPE public.fase_nombre_enum OWNER TO postgres;

--
-- Name: juicio_estado_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.juicio_estado_enum AS ENUM (
    'aprobado',
    'desaprobado',
    'por evaluar'
);


ALTER TYPE public.juicio_estado_enum OWNER TO postgres;

--
-- Name: modalidad_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.modalidad_enum AS ENUM (
    'presencial',
    'virtual',
    'a distancia'
);


ALTER TYPE public.modalidad_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aprendiz; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aprendiz (
    id_aprendiz integer NOT NULL,
    documento character varying(20) NOT NULL,
    tipo_documento character varying(20) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    estado public.estado_aprendiz_enum NOT NULL,
    id_formacion integer NOT NULL
);


ALTER TABLE public.aprendiz OWNER TO postgres;

--
-- Name: aprendiz_id_aprendiz_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.aprendiz_id_aprendiz_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.aprendiz_id_aprendiz_seq OWNER TO postgres;

--
-- Name: aprendiz_id_aprendiz_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.aprendiz_id_aprendiz_seq OWNED BY public.aprendiz.id_aprendiz;


--
-- Name: competencia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.competencia (
    id_competencia integer NOT NULL,
    codigo character varying(50) NOT NULL,
    nombre text NOT NULL,
    id_programa integer NOT NULL,
    codigo_juicio character varying(50),
    codigo_proyecto character varying(50)
);


ALTER TABLE public.competencia OWNER TO postgres;

--
-- Name: competencia_id_competencia_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.competencia_id_competencia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.competencia_id_competencia_seq OWNER TO postgres;

--
-- Name: competencia_id_competencia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.competencia_id_competencia_seq OWNED BY public.competencia.id_competencia;


--
-- Name: fase_actividad; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fase_actividad (
    id_actividad integer NOT NULL,
    id_fase integer NOT NULL,
    numero integer,
    descripcion text NOT NULL
);


ALTER TABLE public.fase_actividad OWNER TO postgres;

--
-- Name: fase_actividad_id_actividad_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fase_actividad_id_actividad_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fase_actividad_id_actividad_seq OWNER TO postgres;

--
-- Name: fase_actividad_id_actividad_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fase_actividad_id_actividad_seq OWNED BY public.fase_actividad.id_actividad;


--
-- Name: fase_competencia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fase_competencia (
    id_fase integer NOT NULL,
    id_competencia integer NOT NULL
);


ALTER TABLE public.fase_competencia OWNER TO postgres;

--
-- Name: fase_resultado; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fase_resultado (
    id_fase integer NOT NULL,
    id_resultado integer NOT NULL,
    id_actividad integer
);


ALTER TABLE public.fase_resultado OWNER TO postgres;

--
-- Name: fases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fases (
    id_fase integer NOT NULL,
    nombre public.fase_nombre_enum NOT NULL,
    actividad text NOT NULL,
    id_programa integer NOT NULL
);


ALTER TABLE public.fases OWNER TO postgres;

--
-- Name: fases_id_fase_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.fases ALTER COLUMN id_fase ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fases_id_fase_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: formacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.formacion (
    id_formacion integer NOT NULL,
    ficha_caracterizacion character varying(100) NOT NULL,
    estado public.estado_formacion_enum NOT NULL,
    modalidad public.modalidad_enum NOT NULL,
    id_programa integer NOT NULL
);


ALTER TABLE public.formacion OWNER TO postgres;

--
-- Name: formacion_id_formacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.formacion_id_formacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.formacion_id_formacion_seq OWNER TO postgres;

--
-- Name: formacion_id_formacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.formacion_id_formacion_seq OWNED BY public.formacion.id_formacion;


--
-- Name: funcionario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.funcionario (
    id_funcionario integer NOT NULL,
    documento character varying(20) NOT NULL,
    tipo_documento character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL
);


ALTER TABLE public.funcionario OWNER TO postgres;

--
-- Name: funcionario_id_funcionario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.funcionario_id_funcionario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funcionario_id_funcionario_seq OWNER TO postgres;

--
-- Name: funcionario_id_funcionario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.funcionario_id_funcionario_seq OWNED BY public.funcionario.id_funcionario;


--
-- Name: juicios_evaluativos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.juicios_evaluativos (
    id_juicio integer NOT NULL,
    id_resultado integer NOT NULL,
    id_aprendiz integer NOT NULL,
    estado public.juicio_estado_enum DEFAULT 'por evaluar'::public.juicio_estado_enum NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_funcionario integer
);


ALTER TABLE public.juicios_evaluativos OWNER TO postgres;

--
-- Name: juicios_evaluativos_id_juicio_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.juicios_evaluativos_id_juicio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.juicios_evaluativos_id_juicio_seq OWNER TO postgres;

--
-- Name: juicios_evaluativos_id_juicio_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.juicios_evaluativos_id_juicio_seq OWNED BY public.juicios_evaluativos.id_juicio;


--
-- Name: programa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.programa (
    id_programa integer NOT NULL,
    nombre text NOT NULL,
    codigo character varying(50) NOT NULL,
    version character varying(20) NOT NULL
);


ALTER TABLE public.programa OWNER TO postgres;

--
-- Name: programa_id_programa_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.programa_id_programa_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.programa_id_programa_seq OWNER TO postgres;

--
-- Name: programa_id_programa_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.programa_id_programa_seq OWNED BY public.programa.id_programa;


--
-- Name: proyecto_formativo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proyecto_formativo (
    id_proyecto integer NOT NULL,
    codigo_proyecto character varying(50) NOT NULL,
    nombre text NOT NULL,
    tiempo_ejecucion character varying(100),
    regional character varying(100),
    centro_formacion character varying(200),
    id_programa integer NOT NULL
);


ALTER TABLE public.proyecto_formativo OWNER TO postgres;

--
-- Name: proyecto_formativo_id_proyecto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proyecto_formativo_id_proyecto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proyecto_formativo_id_proyecto_seq OWNER TO postgres;

--
-- Name: proyecto_formativo_id_proyecto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proyecto_formativo_id_proyecto_seq OWNED BY public.proyecto_formativo.id_proyecto;


--
-- Name: resultados_aprendizaje; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resultados_aprendizaje (
    id_resultado integer NOT NULL,
    codigo character varying(50) NOT NULL,
    detalle text NOT NULL,
    id_competencia integer NOT NULL,
    codigo_juicio character varying(50),
    codigo_proyecto character varying(50)
);


ALTER TABLE public.resultados_aprendizaje OWNER TO postgres;

--
-- Name: resultados_aprendizaje_id_resultado_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resultados_aprendizaje_id_resultado_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resultados_aprendizaje_id_resultado_seq OWNER TO postgres;

--
-- Name: resultados_aprendizaje_id_resultado_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resultados_aprendizaje_id_resultado_seq OWNED BY public.resultados_aprendizaje.id_resultado;


--
-- Name: aprendiz id_aprendiz; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aprendiz ALTER COLUMN id_aprendiz SET DEFAULT nextval('public.aprendiz_id_aprendiz_seq'::regclass);


--
-- Name: competencia id_competencia; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competencia ALTER COLUMN id_competencia SET DEFAULT nextval('public.competencia_id_competencia_seq'::regclass);


--
-- Name: fase_actividad id_actividad; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fase_actividad ALTER COLUMN id_actividad SET DEFAULT nextval('public.fase_actividad_id_actividad_seq'::regclass);


--
-- Name: formacion id_formacion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formacion ALTER COLUMN id_formacion SET DEFAULT nextval('public.formacion_id_formacion_seq'::regclass);


--
-- Name: funcionario id_funcionario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionario ALTER COLUMN id_funcionario SET DEFAULT nextval('public.funcionario_id_funcionario_seq'::regclass);


--
-- Name: juicios_evaluativos id_juicio; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.juicios_evaluativos ALTER COLUMN id_juicio SET DEFAULT nextval('public.juicios_evaluativos_id_juicio_seq'::regclass);


--
-- Name: programa id_programa; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programa ALTER COLUMN id_programa SET DEFAULT nextval('public.programa_id_programa_seq'::regclass);


--
-- Name: proyecto_formativo id_proyecto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyecto_formativo ALTER COLUMN id_proyecto SET DEFAULT nextval('public.proyecto_formativo_id_proyecto_seq'::regclass);


--
-- Name: resultados_aprendizaje id_resultado; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados_aprendizaje ALTER COLUMN id_resultado SET DEFAULT nextval('public.resultados_aprendizaje_id_resultado_seq'::regclass);


--
-- Data for Name: aprendiz; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.aprendiz (id_aprendiz, documento, tipo_documento, nombres, apellidos, estado, id_formacion) FROM stdin;
271	1006419673	CC	BRAYAN STIVEN	HOYOS CESPEDES	retiro voluntario	11
272	1006508766	CC	IBSEN ALEXIS	SOTO ARTUNDUAGA	en formacion	11
273	1006508852	CC	CRISTIAN	CANTILLO MEJIA	en formacion	11
274	1006510328	CC	DANIEL FELIPE	VERA PERDOMO	en formacion	11
275	1051065897	CC	LUIS ESTEBAN	MORALES GASCA	en formacion	11
276	1080361991	CC	JUAN SEBASTIAN	CARVAJAL HOME	en formacion	11
277	1084331945	CC	ANDRES JULIAN	CRUZ HERNANDEZ	en formacion	11
278	1088255893	CC	BRAYAN STEVEN	VELASQUEZ ROA	en formacion	11
279	1099742508	TI	JORGE ALEJANDRO	PEÑA MOTTA	en formacion	11
280	1115942896	CC	YEFRY	SERNA PUENTES	retiro voluntario	11
281	1116204178	CC	PAULA DANIELA	CUELLAR RONDON	retiro voluntario	11
282	1116205722	CC	INGRI JULIETH	GASCA TENORIO	en formacion	11
283	1117496648	CC	MANUEL ANDRES	CARDENAS SUAREZ	en formacion	11
284	1117497987	CC	ESTEFANY	CUELLAR ANTURI	retiro voluntario	11
285	1117506583	TI	JUAN CARLOS	BALTAZAR GUEVARA	retiro voluntario	11
286	1117511568	CC	JHOAN STEVEN	ZAMBRANO VERA	en formacion	11
287	1117512328	CC	YULEINY	LUGO QUIMBAYO	en formacion	11
288	1117513057	TI	YESSICA YULIETH	JARAMILLO HERRAN	en formacion	11
289	1117784339	CC	JHONATAN	CASTRO CALDERON	en formacion	11
290	1117811948	CC	EMERSON	CORREDOR MURCIA	en formacion	11
291	1117931191	CC	SAHIRA MIRLETH	VARGAS SANCHEZ	en formacion	11
292	1118364706	CC	PATRICK DAMIAN	ORTIZ HERNANDEZ	en formacion	11
293	1118367954	CC	GUSTAVO ADOLFO	CABRERA VANEGAS	en formacion	11
294	1118367962	TI	SANTIAGO	LIZCANO SUAREZ	en formacion	11
295	1118368430	TI	ISABELLA	LOPERA AYALA	en formacion	11
296	1118368446	TI	JUAN DAVID	TRUJILLO NARANJO	en formacion	11
297	1118471378	TI	LEIDER FABIAN	RAMOS CANO	en formacion	11
298	1118471476	TI	JAIBER JULIAN	GUTIERREZ RIVERA	en formacion	11
299	1120498200	CC	ANGGIE MARCELA	OLMOS BERNAL	retiro voluntario	11
300	1122726863	TI	WILLIAM SANTIAGO	BARRERO ROMERO	en formacion	11
301	1130268455	CC	MARY JANES	ROMERO RIVAS	traslado	11
\.


--
-- Data for Name: competencia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.competencia (id_competencia, codigo, nombre, id_programa, codigo_juicio, codigo_proyecto) FROM stdin;
177	2	RESULTADOS DE APRENDIZAJE ETAPA PRACTICA	11	\N	\N
179	36182	Resultado de Aprendizaje de la Inducción.	11	\N	240201530
181	37714	INTERACTUAR EN LENGUA INGLESA DE FORMA ORAL Y ESCRITA DENTRO DE CONTEXTOS SOCIALES Y LABORALES SEGÚN LOS CRITERIOS ESTABLECIDOS POR EL MARCO COMÚN EUROPEO DE REFERENCIA PARA LAS LENGUAS.	11	\N	240202501
180	37371	Utilizar herramientas informáticas de acuerdo con las necesidades de manejo de información	11	\N	220501046
182	37799	APLICAR PRÁCTICAS  DE PROTECCIÓN AMBIENTAL, SEGURIDAD Y SALUD EN EL TRABAJO DE ACUERDO CON LAS POLÍTICAS ORGANIZACIONALES  Y LA NORMATIVIDAD VIGENTE.	11	\N	220601501
184	37801	APLICACIÓN DE CONOCIMIENTOS DE LAS CIENCIAS NATURALES DE ACUERDO CON SITUACIONES DEL CONTEXTO PRODUCTIVO Y SOCIAL.	11	\N	220201501
185	37802	DESARROLLAR PROCESOS DE COMUNICACIÓN EFICACES Y EFECTIVOS, TENIENDO EN CUENTA SITUACIONES  DE ORDEN SOCIAL, PERSONAL Y PRODUCTIVO.	11	\N	240201524
186	38199	Orientar investigación formativa según referentes técnicos	11	\N	240201064
195	38560	Razonar cuantitativamente frente a situaciones susceptibles de ser abordadas de manera matemática en contextos laborales, sociales y personales.	11	\N	240201528
193	38392	Establecer requisitos de la solución de software de acuerdo con estándares y procedimiento técnico	11	\N	220501092
192	38376	Evaluar requisitos de la solución de software de acuerdo con metodologías de análisis y estándares	11	\N	220501093
189	38367	Estructurar propuesta técnica de servicio de tecnología de la información según requisitos técnicos y normativa	11	\N	220501094
188	38362	Diseñar la solución de software de acuerdo con procedimientos y requisitos técnicos	11	\N	220501095
190	38368	DESARROLLAR LA SOLUCIÓN DE SOFTWARE DE ACUERDO CON EL DISEÑO Y METODOLOGÍAS DE DESARROLLO	11	\N	220501096
187	38356	Implementar la solución de software de acuerdo con los requisitos de operación y modelos de referencia	11	\N	220501097
183	37800	GENERAR HÁBITOS SALUDABLES DE VIDA MEDIANTE LA APLICACIÓN DE PROGRAMAS DE ACTIVIDAD FÍSICA EN LOS CONTEXTOS PRODUCTIVOS Y SOCIALES.	11	\N	230101507
178	36180	Enrique Low Murtra-Interactuar en el contexto productivo y social de acuerdo con principios  éticos para la construcción de una cultura de paz.	11	\N	240201526
194	38558	Ejercer derechos fundamentales del trabajo en el marco de la constitución política y los convenios internacionales.	11	\N	210201501
196	38561	Gestionar procesos propios de la cultura emprendedora y empresarial de acuerdo con el perfil personal y los requerimientos de los contextos productivo y social.	11	\N	240201529
191	38369	Controlar la calidad del servicio de software de acuerdo con los estándares técnicos	11	\N	220501098
\.


--
-- Data for Name: fase_actividad; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fase_actividad (id_actividad, id_fase, numero, descripcion) FROM stdin;
31	323	1	1. DESARROLLAR EL PROCESO DE INDUCCION DE LA FORMACION PROFESIONAL INTEGRAL
32	323	2	2. ANALIZAR Y CONOCER HERRAMIENTAS TECNOLÓGICAS NECESARIAS PARA EL MANEJO DE LOS REQUERIMIENTOS DE SOFTWARE EN LA EMPRESA
33	324	3	3. DISEÑAR LA ARQUITECTURA DEL SOFTWARE SEGÚN LAS NECESIDADES DE LA EMPRESA
34	325	4	4. CODIFICAR LOS MÓDULOS DEL SOFTWARE A DESARROLLAR
35	326	5	5. CONSTRUIR Y REALIZAR SEGUMIENTO DE PRUEBAS AL SOFTWARE DESARROLLADO ACORDE A REQUISITOS DE LA EMPRESA
\.


--
-- Data for Name: fase_competencia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fase_competencia (id_fase, id_competencia) FROM stdin;
323	179
323	181
323	180
323	182
323	184
323	185
323	186
323	195
323	193
324	192
324	189
324	188
324	190
324	187
324	181
324	183
324	178
324	180
324	185
324	186
324	194
324	195
324	196
324	193
325	192
325	189
325	190
325	187
325	181
325	183
325	191
325	178
325	180
325	182
325	184
325	185
325	186
325	194
325	195
325	196
326	192
326	189
326	188
326	190
326	187
326	191
326	180
326	182
326	184
326	185
326	186
326	194
326	195
326	196
326	193
\.


--
-- Data for Name: fase_resultado; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fase_resultado (id_fase, id_resultado, id_actividad) FROM stdin;
324	816	33
324	803	33
324	799	33
324	800	33
324	802	33
324	808	33
324	797	33
324	774	33
324	780	33
324	761	33
324	762	33
324	766	33
324	787	33
324	794	33
324	822	33
324	829	33
324	830	33
324	833	33
324	818	33
324	821	33
325	814	34
325	817	34
325	805	34
325	806	34
323	764	31
323	771	\N
323	773	\N
323	768	\N
323	776	\N
323	786	\N
323	788	\N
323	792	\N
323	827	\N
323	820	\N
325	809	34
325	810	34
325	796	34
325	798	34
325	769	34
325	772	34
325	779	34
325	781	34
325	782	34
325	813	34
325	760	34
325	763	34
325	765	34
325	777	34
325	778	34
325	783	34
325	790	34
325	793	34
325	823	34
325	825	34
325	826	34
325	831	34
326	815	35
326	804	35
326	801	35
326	807	35
326	795	35
326	811	35
326	812	35
326	767	35
326	775	35
326	784	35
326	785	35
326	789	35
326	791	35
326	824	35
326	828	35
326	832	35
326	819	35
\.


--
-- Data for Name: fases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fases (id_fase, nombre, actividad, id_programa) FROM stdin;
323	ANALISIS	1. DESARROLLAR EL PROCESO DE INDUCCION DE LA FORMACION PROFESIONAL INTEGRAL\n2. ANALIZAR Y CONOCER HERRAMIENTAS TECNOLÓGICAS NECESARIAS PARA EL MANEJO DE LOS REQUERIMIENTOS DE SOFTWARE EN LA EMPRESA	11
324	PLANEACION	3. DISEÑAR LA ARQUITECTURA DEL SOFTWARE SEGÚN LAS NECESIDADES DE LA EMPRESA	11
325	EJECUCION	4. CODIFICAR LOS MÓDULOS DEL SOFTWARE A DESARROLLAR	11
326	EVALUACION	5. CONSTRUIR Y REALIZAR SEGUMIENTO DE PRUEBAS AL SOFTWARE DESARROLLADO ACORDE A REQUISITOS DE LA EMPRESA	11
\.


--
-- Data for Name: formacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.formacion (id_formacion, ficha_caracterizacion, estado, modalidad, id_programa) FROM stdin;
11	3142784	en ejecucion	presencial	11
\.


--
-- Data for Name: funcionario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.funcionario (id_funcionario, documento, tipo_documento, nombre, apellido) FROM stdin;
15	17644079	CC	CESAR FERNANDO	MARLES RODRIGUEZ
18	80852330	CC	LUIS MIGUEL	SILVA CABRERA
19	1075284254	CC	ANGY ALEJANDRA	PALMA GONZALEZ
21	28555809	CC	LEIDI MILENA	SANTAMARIA PEREZ
23	6805131	CC	JORGE ALBERTO	ARIZA CABALLERO
25	1026552707	CC	JUAN PAULO	HERMOSA CRUZ
27	1077865671	CC	JOSSYE ESTEBAN	CALDERON LOSADA
28	1117503960	CC	CRISTIAN JAVIER	CUBILLOS MARTINEZ
31	40732136	CC	MARY LUZ	IDROBO GUTIERREZ
32	78759532	CC	GUSTAVO ADOLFO	JURIS TORREGROSA
33	40757195	CC	JUDITH MORENO	CASTRO
34	1117521420	CC	YISNESA HERRERA	ECHEVERRY
35	1117510891	CC	CINDY TATIANA	ARTUNDUAGA NAVETTY
36	1117530035	CC	LINA MARCELA	NOVAS TRUJILLO
38	1117507159	CC	TATIANA MARCELA	RAMIREZ SALAZAR
39	17656565	CC	MARIO DANIEL	CARDOSO CORDOBA
40	1098809645	CC	NICOLÁS ALBERTO	HERNÁNDEZ DURÁN
1	1117523028	CC	OSCAR CAMILO	CASTRO MOPAN
26	96328076	CC	JOSE JAIBER	DIAZ CASTRO
44	17652688	CC	WILLIAM DIAZ	MONTAÑEZ
2	6801798	CC	EDWIN ALEXANDER	OSPINA PENNA
46	17656065	CC	EDWIN GUSTAVO	DUSSAN MALAGON
3	1117546314	CC	DIEGO ALEJANDRO	PEÑA ROJAS
4	17654594	CC	JORGE ANDRES	GIRALDO POSADA
49	40758842	CC	AYDA INES	GOMEZ REYES
50	1117532250	CC	ANGEL IVAN	DIAZ GONZALEZ
5	17648908	CC	JUAN CARLOS	YUSTRES CHAUX
6	96353963	CC	PABLO ANDRES	MENESES MAYORAL
7	40781077	CC	YOLDI CLARITZA	VASQUEZ CLAROS
8	26632272	CC	DOLLY ROCIO	PARRA ESCOBAR
9	1117499177	CC	YOINER GARCIA	FIGUEROA
10	40776309	CC	ANA CECILIA	UMAÑA ESPAÑA
11	1117515166	CC	DIOSELINA CHAVARRO	VALLEJO
12	6801355	CC	OSCAR EDUARDO	YANGUAS ARGUELLO
13	40778471	CC	NORMA PIEDAD	RIVERA PEÑA
14	17653145	CC	JAVIER LEONARDO	MOTTA GIRALDO
\.


--
-- Data for Name: juicios_evaluativos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.juicios_evaluativos (id_juicio, id_resultado, id_aprendiz, estado, fecha, id_funcionario) FROM stdin;
20363	759	271	por evaluar	\N	\N
20364	760	271	por evaluar	\N	\N
20365	761	271	por evaluar	\N	\N
20366	762	271	por evaluar	\N	\N
20367	763	271	por evaluar	\N	\N
20368	764	271	aprobado	2025-02-16 16:46:00	1
20369	765	271	aprobado	2025-03-24 11:07:00	2
20370	766	271	por evaluar	\N	\N
20371	767	271	por evaluar	\N	\N
20372	768	271	aprobado	2025-03-24 11:07:00	2
20373	769	271	por evaluar	\N	\N
20374	770	271	por evaluar	\N	\N
20375	771	271	por evaluar	\N	\N
20376	772	271	por evaluar	\N	\N
20377	773	271	aprobado	2025-06-21 10:35:00	3
20378	774	271	por evaluar	\N	\N
20379	775	271	por evaluar	\N	\N
20380	776	271	por evaluar	\N	\N
20381	777	271	por evaluar	\N	\N
20382	778	271	aprobado	2025-06-02 19:01:00	4
20383	779	271	por evaluar	\N	\N
20384	780	271	aprobado	2025-04-24 00:12:00	5
20385	781	271	por evaluar	\N	\N
20386	782	271	por evaluar	\N	\N
20387	783	271	por evaluar	\N	\N
20388	784	271	por evaluar	\N	\N
20389	785	271	por evaluar	\N	\N
20390	786	271	por evaluar	\N	\N
20391	787	271	por evaluar	\N	\N
20392	788	271	por evaluar	\N	\N
20393	789	271	por evaluar	\N	\N
20394	790	271	por evaluar	\N	\N
20395	791	271	por evaluar	\N	\N
20396	792	271	por evaluar	\N	\N
20397	793	271	por evaluar	\N	\N
20398	794	271	por evaluar	\N	\N
20399	795	271	por evaluar	\N	\N
20400	796	271	por evaluar	\N	\N
20401	797	271	por evaluar	\N	\N
20402	798	271	por evaluar	\N	\N
20403	799	271	por evaluar	\N	\N
20404	800	271	por evaluar	\N	\N
20405	801	271	por evaluar	\N	\N
20406	802	271	por evaluar	\N	\N
20407	803	271	por evaluar	\N	\N
20408	804	271	por evaluar	\N	\N
20409	805	271	por evaluar	\N	\N
20410	806	271	por evaluar	\N	\N
20411	807	271	por evaluar	\N	\N
20412	808	271	por evaluar	\N	\N
20413	809	271	por evaluar	\N	\N
20414	810	271	por evaluar	\N	\N
20415	811	271	por evaluar	\N	\N
20416	812	271	por evaluar	\N	\N
20417	813	271	por evaluar	\N	\N
20418	814	271	por evaluar	\N	\N
20419	815	271	por evaluar	\N	\N
20420	816	271	aprobado	2025-05-25 15:25:00	6
20421	817	271	por evaluar	\N	\N
20422	818	271	por evaluar	\N	\N
20423	819	271	por evaluar	\N	\N
20424	820	271	por evaluar	\N	\N
20425	821	271	por evaluar	\N	\N
20426	822	271	por evaluar	\N	\N
20427	823	271	por evaluar	\N	\N
20428	824	271	por evaluar	\N	\N
20429	825	271	por evaluar	\N	\N
20430	826	271	por evaluar	\N	\N
20431	827	271	aprobado	2025-04-30 18:28:00	7
20432	828	271	por evaluar	\N	\N
20433	829	271	por evaluar	\N	\N
20434	830	271	por evaluar	\N	\N
20435	831	271	por evaluar	\N	\N
20436	832	271	por evaluar	\N	\N
20437	833	271	por evaluar	\N	\N
20438	759	272	por evaluar	\N	\N
20439	760	272	aprobado	2025-11-25 09:44:00	8
20440	761	272	aprobado	2025-11-25 09:44:00	8
20441	762	272	aprobado	2025-11-25 09:44:00	8
20442	763	272	aprobado	2025-11-25 09:44:00	8
20443	764	272	aprobado	2025-02-16 16:46:00	1
20444	765	272	aprobado	2025-03-24 11:07:00	2
20445	766	272	por evaluar	\N	\N
20446	767	272	por evaluar	\N	\N
20447	768	272	aprobado	2025-03-24 11:07:00	2
20448	769	272	por evaluar	\N	\N
20449	770	272	por evaluar	\N	\N
20450	771	272	aprobado	2026-03-24 08:35:00	9
20451	772	272	por evaluar	\N	\N
20452	773	272	aprobado	2025-06-21 10:35:00	3
20453	774	272	aprobado	2026-03-24 08:35:00	9
20454	775	272	por evaluar	\N	\N
20455	776	272	aprobado	2025-11-25 19:26:00	10
20456	777	272	por evaluar	\N	\N
20457	778	272	aprobado	2025-06-02 19:01:00	4
20458	779	272	aprobado	2025-12-16 20:44:00	5
20459	780	272	aprobado	2025-04-24 00:12:00	5
20460	781	272	aprobado	2025-12-16 20:43:00	5
20461	782	272	aprobado	2025-12-16 20:43:00	5
20462	783	272	por evaluar	\N	\N
20463	784	272	por evaluar	\N	\N
20464	785	272	por evaluar	\N	\N
20465	786	272	por evaluar	\N	\N
20466	787	272	aprobado	2026-03-16 18:32:00	11
20467	788	272	aprobado	2025-11-26 17:52:00	11
20468	789	272	aprobado	2026-03-16 18:32:00	11
20469	790	272	aprobado	2025-11-26 17:52:00	11
20470	791	272	por evaluar	\N	\N
20471	792	272	por evaluar	\N	\N
20472	793	272	por evaluar	\N	\N
20473	794	272	por evaluar	\N	\N
20474	795	272	por evaluar	\N	\N
20475	796	272	por evaluar	\N	\N
20476	797	272	aprobado	2025-11-28 11:42:00	6
20477	798	272	por evaluar	\N	\N
20478	799	272	aprobado	2025-11-28 09:20:00	1
20479	800	272	aprobado	2025-11-28 09:20:00	1
20480	801	272	por evaluar	\N	\N
20481	802	272	aprobado	2025-11-28 09:20:00	1
20482	803	272	por evaluar	\N	\N
20483	804	272	aprobado	2025-07-23 11:29:00	12
20484	805	272	por evaluar	\N	\N
20485	806	272	aprobado	2025-06-19 07:34:00	1
20486	807	272	por evaluar	\N	\N
20487	808	272	aprobado	2025-11-28 09:18:00	1
20488	809	272	por evaluar	\N	\N
20489	810	272	aprobado	2025-11-28 09:18:00	1
20490	811	272	por evaluar	\N	\N
20491	812	272	por evaluar	\N	\N
20492	813	272	por evaluar	\N	\N
20493	814	272	por evaluar	\N	\N
20494	815	272	por evaluar	\N	\N
20495	816	272	aprobado	2025-05-25 15:25:00	6
20496	817	272	aprobado	2025-11-28 09:24:00	1
20497	818	272	aprobado	2025-07-23 11:27:00	1
20498	819	272	por evaluar	\N	\N
20499	820	272	aprobado	2025-07-23 11:25:00	1
20500	821	272	por evaluar	\N	\N
20501	822	272	aprobado	2025-12-15 09:40:00	1
20502	823	272	por evaluar	\N	\N
20503	824	272	por evaluar	\N	\N
20504	825	272	por evaluar	\N	\N
20505	826	272	aprobado	2025-12-15 17:46:00	7
20506	827	272	aprobado	2025-04-30 18:28:00	7
20507	828	272	aprobado	2025-12-15 17:31:00	7
20508	829	272	aprobado	2025-12-05 09:44:00	7
20509	830	272	aprobado	2025-12-01 09:45:00	13
20510	831	272	aprobado	2025-12-01 09:45:00	13
20511	832	272	aprobado	2025-12-01 09:45:00	13
20512	833	272	aprobado	2025-12-01 09:44:00	13
20513	759	273	por evaluar	\N	\N
20514	760	273	aprobado	2025-11-25 09:40:00	8
20515	761	273	aprobado	2025-11-25 09:40:00	8
20516	762	273	aprobado	2025-11-25 09:40:00	8
20517	763	273	aprobado	2025-11-25 09:40:00	8
20518	764	273	aprobado	2025-02-16 16:46:00	1
20519	765	273	aprobado	2025-03-24 11:07:00	2
20520	766	273	por evaluar	\N	\N
20521	767	273	por evaluar	\N	\N
20522	768	273	aprobado	2025-03-24 11:07:00	2
20523	769	273	por evaluar	\N	\N
20524	770	273	por evaluar	\N	\N
20525	771	273	aprobado	2026-03-24 08:35:00	9
20526	772	273	por evaluar	\N	\N
20527	773	273	aprobado	2025-06-21 10:35:00	3
20528	774	273	aprobado	2026-03-24 08:35:00	9
20529	775	273	por evaluar	\N	\N
20530	776	273	aprobado	2025-11-25 19:26:00	10
20531	777	273	por evaluar	\N	\N
20532	778	273	aprobado	2025-06-02 19:01:00	4
20533	779	273	aprobado	2025-12-16 20:44:00	5
20534	780	273	aprobado	2025-04-24 00:12:00	5
20535	781	273	aprobado	2025-12-16 20:43:00	5
20536	782	273	aprobado	2025-12-16 20:43:00	5
20537	783	273	por evaluar	\N	\N
20538	784	273	por evaluar	\N	\N
20539	785	273	por evaluar	\N	\N
20540	786	273	por evaluar	\N	\N
20541	787	273	aprobado	2026-03-16 18:32:00	11
20542	788	273	aprobado	2025-11-26 17:53:00	11
20543	789	273	aprobado	2026-03-16 18:32:00	11
20544	790	273	aprobado	2025-11-26 17:53:00	11
20545	791	273	por evaluar	\N	\N
20546	792	273	por evaluar	\N	\N
20547	793	273	por evaluar	\N	\N
20548	794	273	por evaluar	\N	\N
20549	795	273	por evaluar	\N	\N
20550	796	273	por evaluar	\N	\N
20551	797	273	aprobado	2025-11-28 11:42:00	6
20552	798	273	por evaluar	\N	\N
20553	799	273	aprobado	2025-11-28 09:20:00	1
20554	800	273	aprobado	2025-11-28 09:20:00	1
20555	801	273	por evaluar	\N	\N
20556	802	273	aprobado	2025-11-28 09:20:00	1
20557	803	273	por evaluar	\N	\N
20558	804	273	aprobado	2025-07-23 11:29:00	12
20559	805	273	por evaluar	\N	\N
20560	806	273	aprobado	2025-06-19 07:34:00	1
20561	807	273	por evaluar	\N	\N
20562	808	273	aprobado	2025-11-28 09:18:00	1
20563	809	273	por evaluar	\N	\N
20564	810	273	aprobado	2025-11-28 09:18:00	1
20565	811	273	por evaluar	\N	\N
20566	812	273	por evaluar	\N	\N
20567	813	273	por evaluar	\N	\N
20568	814	273	por evaluar	\N	\N
20569	815	273	por evaluar	\N	\N
20570	816	273	aprobado	2025-05-25 15:25:00	6
20571	817	273	aprobado	2025-11-28 09:24:00	1
20572	818	273	aprobado	2025-07-23 11:27:00	1
20573	819	273	por evaluar	\N	\N
20574	820	273	aprobado	2025-07-23 11:25:00	1
20575	821	273	por evaluar	\N	\N
20576	822	273	aprobado	2025-12-15 09:40:00	1
20577	823	273	por evaluar	\N	\N
20578	824	273	por evaluar	\N	\N
20579	825	273	por evaluar	\N	\N
20580	826	273	aprobado	2025-12-15 17:46:00	7
20581	827	273	aprobado	2025-04-30 18:28:00	7
20582	828	273	aprobado	2025-12-15 17:31:00	7
20583	829	273	aprobado	2025-12-05 09:44:00	7
20584	830	273	aprobado	2025-12-01 11:05:00	13
20585	831	273	aprobado	2025-12-01 11:06:00	13
20586	832	273	aprobado	2025-12-01 11:06:00	13
20587	833	273	aprobado	2025-12-01 11:05:00	13
20588	759	274	por evaluar	\N	\N
20589	760	274	aprobado	2025-11-25 09:41:00	8
20590	761	274	aprobado	2025-11-25 09:41:00	8
20591	762	274	aprobado	2025-11-25 09:41:00	8
20592	763	274	aprobado	2025-11-25 09:41:00	8
20593	764	274	aprobado	2025-02-16 16:46:00	1
20594	765	274	aprobado	2025-03-24 11:07:00	2
20595	766	274	por evaluar	\N	\N
20596	767	274	por evaluar	\N	\N
20597	768	274	aprobado	2025-03-24 11:07:00	2
20598	769	274	por evaluar	\N	\N
20599	770	274	por evaluar	\N	\N
20600	771	274	aprobado	2026-03-24 08:35:00	9
20601	772	274	por evaluar	\N	\N
20602	773	274	aprobado	2025-06-21 10:35:00	3
20603	774	274	aprobado	2026-03-24 08:35:00	9
20604	775	274	por evaluar	\N	\N
20605	776	274	aprobado	2025-11-25 19:26:00	10
20606	777	274	por evaluar	\N	\N
20607	778	274	aprobado	2025-06-02 19:01:00	4
20608	779	274	aprobado	2025-12-16 20:44:00	5
20609	780	274	aprobado	2025-04-24 00:12:00	5
20610	781	274	aprobado	2025-12-16 20:43:00	5
20611	782	274	aprobado	2025-12-16 20:43:00	5
20612	783	274	por evaluar	\N	\N
20613	784	274	por evaluar	\N	\N
20614	785	274	por evaluar	\N	\N
20615	786	274	por evaluar	\N	\N
20616	787	274	aprobado	2026-03-16 18:32:00	11
20617	788	274	aprobado	2025-11-26 17:46:00	11
20618	789	274	aprobado	2026-03-16 18:32:00	11
20619	790	274	aprobado	2025-11-26 17:45:00	11
20620	791	274	por evaluar	\N	\N
20621	792	274	por evaluar	\N	\N
20622	793	274	por evaluar	\N	\N
20623	794	274	por evaluar	\N	\N
20624	795	274	por evaluar	\N	\N
20625	796	274	por evaluar	\N	\N
20626	797	274	aprobado	2025-11-28 11:42:00	6
20627	798	274	por evaluar	\N	\N
20628	799	274	aprobado	2025-11-28 09:20:00	1
20629	800	274	aprobado	2025-11-28 09:20:00	1
20630	801	274	por evaluar	\N	\N
20631	802	274	aprobado	2025-11-28 09:20:00	1
20632	803	274	por evaluar	\N	\N
20633	804	274	aprobado	2025-07-23 11:29:00	12
20634	805	274	por evaluar	\N	\N
20635	806	274	aprobado	2025-06-19 07:34:00	1
20636	807	274	por evaluar	\N	\N
20637	808	274	aprobado	2025-11-28 09:18:00	1
20638	809	274	por evaluar	\N	\N
20639	810	274	aprobado	2025-11-28 09:18:00	1
20640	811	274	por evaluar	\N	\N
20641	812	274	por evaluar	\N	\N
20642	813	274	por evaluar	\N	\N
20643	814	274	por evaluar	\N	\N
20644	815	274	por evaluar	\N	\N
20645	816	274	aprobado	2025-05-25 15:25:00	6
20646	817	274	aprobado	2025-11-28 09:24:00	1
20647	818	274	aprobado	2025-07-23 11:27:00	1
20648	819	274	por evaluar	\N	\N
20649	820	274	aprobado	2025-07-23 11:25:00	1
20650	821	274	por evaluar	\N	\N
20651	822	274	aprobado	2025-12-15 09:40:00	1
20652	823	274	por evaluar	\N	\N
20653	824	274	por evaluar	\N	\N
20654	825	274	por evaluar	\N	\N
20655	826	274	aprobado	2025-12-15 17:46:00	7
20656	827	274	aprobado	2025-04-30 18:28:00	7
20657	828	274	aprobado	2025-12-15 17:31:00	7
20658	829	274	aprobado	2025-12-05 09:44:00	7
20659	830	274	aprobado	2025-12-01 09:45:00	13
20660	831	274	aprobado	2025-12-01 09:45:00	13
20661	832	274	aprobado	2025-12-01 09:45:00	13
20662	833	274	aprobado	2025-12-01 09:44:00	13
20663	759	275	por evaluar	\N	\N
20664	760	275	aprobado	2025-11-25 09:55:00	8
20665	761	275	aprobado	2025-11-25 09:55:00	8
20666	762	275	aprobado	2025-11-25 09:55:00	8
20667	763	275	aprobado	2025-11-25 09:55:00	8
20668	764	275	aprobado	2025-02-16 16:46:00	1
20669	765	275	aprobado	2025-03-24 11:07:00	2
20670	766	275	por evaluar	\N	\N
20671	767	275	por evaluar	\N	\N
20672	768	275	aprobado	2025-03-24 11:07:00	2
20673	769	275	por evaluar	\N	\N
20674	770	275	por evaluar	\N	\N
20675	771	275	aprobado	2026-03-24 08:35:00	9
20676	772	275	por evaluar	\N	\N
20677	773	275	aprobado	2025-06-21 10:35:00	3
20678	774	275	aprobado	2026-03-24 08:35:00	9
20679	775	275	por evaluar	\N	\N
20680	776	275	aprobado	2025-11-25 19:26:00	10
20681	777	275	por evaluar	\N	\N
20682	778	275	aprobado	2025-06-02 19:01:00	4
20683	779	275	aprobado	2025-12-16 20:44:00	5
20684	780	275	aprobado	2025-04-24 00:12:00	5
20685	781	275	aprobado	2025-12-16 20:43:00	5
20686	782	275	aprobado	2025-12-16 20:43:00	5
20687	783	275	por evaluar	\N	\N
20688	784	275	por evaluar	\N	\N
20689	785	275	por evaluar	\N	\N
20690	786	275	por evaluar	\N	\N
20691	787	275	aprobado	2026-03-16 18:32:00	11
20692	788	275	aprobado	2025-11-26 17:09:00	11
20693	789	275	aprobado	2026-03-16 18:32:00	11
20694	790	275	aprobado	2025-11-26 17:09:00	11
20695	791	275	por evaluar	\N	\N
20696	792	275	por evaluar	\N	\N
20697	793	275	por evaluar	\N	\N
20698	794	275	por evaluar	\N	\N
20699	795	275	por evaluar	\N	\N
20700	796	275	por evaluar	\N	\N
20701	797	275	aprobado	2025-11-28 11:42:00	6
20702	798	275	por evaluar	\N	\N
20703	799	275	aprobado	2025-11-28 09:20:00	1
20704	800	275	aprobado	2025-11-28 09:20:00	1
20705	801	275	por evaluar	\N	\N
20706	802	275	aprobado	2025-11-28 09:20:00	1
20707	803	275	por evaluar	\N	\N
20708	804	275	aprobado	2025-07-23 11:29:00	12
20709	805	275	por evaluar	\N	\N
20710	806	275	aprobado	2025-06-19 07:34:00	1
20711	807	275	por evaluar	\N	\N
20712	808	275	aprobado	2025-11-28 09:18:00	1
20713	809	275	por evaluar	\N	\N
20714	810	275	aprobado	2025-11-28 09:18:00	1
20715	811	275	por evaluar	\N	\N
20716	812	275	por evaluar	\N	\N
20717	813	275	por evaluar	\N	\N
20718	814	275	por evaluar	\N	\N
20719	815	275	por evaluar	\N	\N
20720	816	275	aprobado	2025-05-25 15:25:00	6
20721	817	275	aprobado	2025-11-28 09:24:00	1
20722	818	275	aprobado	2025-07-23 11:27:00	1
20723	819	275	por evaluar	\N	\N
20724	820	275	aprobado	2025-07-23 11:25:00	1
20725	821	275	por evaluar	\N	\N
20726	822	275	aprobado	2025-12-15 09:40:00	1
20727	823	275	por evaluar	\N	\N
20728	824	275	por evaluar	\N	\N
20729	825	275	por evaluar	\N	\N
20730	826	275	aprobado	2025-12-15 17:46:00	7
20731	827	275	aprobado	2025-04-30 18:28:00	7
20732	828	275	aprobado	2025-12-15 17:31:00	7
20733	829	275	aprobado	2025-12-05 09:44:00	7
20734	830	275	aprobado	2025-12-01 11:00:00	13
20735	831	275	aprobado	2025-12-01 11:00:00	13
20736	832	275	aprobado	2025-12-01 11:01:00	13
20737	833	275	aprobado	2025-12-01 11:00:00	13
20738	759	276	por evaluar	\N	\N
20739	760	276	aprobado	2025-11-25 09:53:00	8
20740	761	276	aprobado	2025-11-25 09:53:00	8
20741	762	276	aprobado	2025-11-25 09:53:00	8
20742	763	276	aprobado	2025-11-25 09:53:00	8
20743	764	276	aprobado	2025-02-16 16:46:00	1
20744	765	276	aprobado	2025-03-24 11:07:00	2
20745	766	276	por evaluar	\N	\N
20746	767	276	por evaluar	\N	\N
20747	768	276	aprobado	2025-03-24 11:07:00	2
20748	769	276	por evaluar	\N	\N
20749	770	276	por evaluar	\N	\N
20750	771	276	aprobado	2026-03-24 08:35:00	9
20751	772	276	por evaluar	\N	\N
20752	773	276	aprobado	2025-06-21 10:35:00	3
20753	774	276	aprobado	2026-03-24 08:35:00	9
20754	775	276	por evaluar	\N	\N
20755	776	276	aprobado	2025-11-25 19:26:00	10
20756	777	276	por evaluar	\N	\N
20757	778	276	aprobado	2025-06-02 19:01:00	4
20758	779	276	aprobado	2025-12-16 20:44:00	5
20759	780	276	aprobado	2025-04-24 00:12:00	5
20760	781	276	aprobado	2025-12-16 20:43:00	5
20761	782	276	aprobado	2025-12-16 20:43:00	5
20762	783	276	por evaluar	\N	\N
20763	784	276	por evaluar	\N	\N
20764	785	276	por evaluar	\N	\N
20765	786	276	por evaluar	\N	\N
20766	787	276	aprobado	2026-03-16 18:32:00	11
20767	788	276	aprobado	2025-11-26 17:12:00	11
20768	789	276	aprobado	2026-03-16 18:32:00	11
20769	790	276	aprobado	2025-11-26 17:12:00	11
20770	791	276	por evaluar	\N	\N
20771	792	276	por evaluar	\N	\N
20772	793	276	por evaluar	\N	\N
20773	794	276	por evaluar	\N	\N
20774	795	276	por evaluar	\N	\N
20775	796	276	por evaluar	\N	\N
20776	797	276	aprobado	2025-11-28 11:42:00	6
20777	798	276	por evaluar	\N	\N
20778	799	276	aprobado	2025-11-28 09:20:00	1
20779	800	276	aprobado	2025-11-28 09:20:00	1
20780	801	276	por evaluar	\N	\N
20781	802	276	aprobado	2025-11-28 09:20:00	1
20782	803	276	por evaluar	\N	\N
20783	804	276	aprobado	2025-07-23 11:29:00	12
20784	805	276	por evaluar	\N	\N
20785	806	276	aprobado	2025-06-19 07:34:00	1
20786	807	276	por evaluar	\N	\N
20787	808	276	aprobado	2025-11-28 09:18:00	1
20788	809	276	por evaluar	\N	\N
20789	810	276	aprobado	2025-11-28 09:18:00	1
20790	811	276	por evaluar	\N	\N
20791	812	276	por evaluar	\N	\N
20792	813	276	por evaluar	\N	\N
20793	814	276	por evaluar	\N	\N
20794	815	276	por evaluar	\N	\N
20795	816	276	aprobado	2025-05-25 15:25:00	6
20796	817	276	aprobado	2025-11-28 09:24:00	1
20797	818	276	aprobado	2025-07-23 11:27:00	1
20798	819	276	por evaluar	\N	\N
20799	820	276	aprobado	2025-07-23 11:25:00	1
20800	821	276	por evaluar	\N	\N
20801	822	276	aprobado	2025-12-15 09:40:00	1
20802	823	276	por evaluar	\N	\N
20803	824	276	por evaluar	\N	\N
20804	825	276	por evaluar	\N	\N
20805	826	276	aprobado	2025-12-15 17:46:00	7
20806	827	276	aprobado	2025-04-30 18:28:00	7
20807	828	276	aprobado	2025-12-15 17:31:00	7
20808	829	276	aprobado	2025-12-05 09:44:00	7
20809	830	276	aprobado	2025-12-01 11:05:00	13
20810	831	276	aprobado	2025-12-01 11:06:00	13
20811	832	276	aprobado	2025-12-01 11:06:00	13
20812	833	276	aprobado	2025-12-01 11:05:00	13
20813	759	277	por evaluar	\N	\N
20814	760	277	aprobado	2025-11-25 09:33:00	8
20815	761	277	aprobado	2025-11-25 09:33:00	8
20816	762	277	aprobado	2025-11-25 09:33:00	8
20817	763	277	aprobado	2025-11-25 09:33:00	8
20818	764	277	aprobado	2025-02-16 16:46:00	1
20819	765	277	aprobado	2025-03-24 11:07:00	2
20820	766	277	por evaluar	\N	\N
20821	767	277	por evaluar	\N	\N
20822	768	277	aprobado	2025-03-24 11:07:00	2
20823	769	277	por evaluar	\N	\N
20824	770	277	por evaluar	\N	\N
20825	771	277	aprobado	2026-03-24 08:35:00	9
20826	772	277	por evaluar	\N	\N
20827	773	277	aprobado	2025-06-21 10:35:00	3
20828	774	277	aprobado	2026-03-24 08:35:00	9
20829	775	277	por evaluar	\N	\N
20830	776	277	aprobado	2025-11-25 19:26:00	10
20831	777	277	por evaluar	\N	\N
20832	778	277	aprobado	2025-06-02 19:01:00	4
20833	779	277	aprobado	2025-12-16 20:44:00	5
20834	780	277	aprobado	2025-04-24 00:12:00	5
20835	781	277	aprobado	2025-12-16 20:43:00	5
20836	782	277	aprobado	2025-12-16 20:43:00	5
20837	783	277	por evaluar	\N	\N
20838	784	277	por evaluar	\N	\N
20839	785	277	por evaluar	\N	\N
20840	786	277	por evaluar	\N	\N
20841	787	277	aprobado	2026-03-16 18:32:00	11
20842	788	277	aprobado	2025-11-26 17:17:00	11
20843	789	277	aprobado	2026-03-16 18:32:00	11
20844	790	277	aprobado	2025-11-26 17:17:00	11
20845	791	277	por evaluar	\N	\N
20846	792	277	por evaluar	\N	\N
20847	793	277	por evaluar	\N	\N
20848	794	277	por evaluar	\N	\N
20849	795	277	por evaluar	\N	\N
20850	796	277	por evaluar	\N	\N
20851	797	277	aprobado	2025-11-28 11:42:00	6
20852	798	277	por evaluar	\N	\N
20853	799	277	aprobado	2025-11-28 09:20:00	1
20854	800	277	aprobado	2025-11-28 09:20:00	1
20855	801	277	por evaluar	\N	\N
20856	802	277	aprobado	2025-11-28 09:20:00	1
20857	803	277	por evaluar	\N	\N
20858	804	277	aprobado	2025-07-23 11:29:00	12
20859	805	277	por evaluar	\N	\N
20860	806	277	aprobado	2025-06-19 07:34:00	1
20861	807	277	por evaluar	\N	\N
20862	808	277	aprobado	2025-11-28 09:18:00	1
20863	809	277	por evaluar	\N	\N
20864	810	277	aprobado	2025-11-28 09:18:00	1
20865	811	277	por evaluar	\N	\N
20866	812	277	por evaluar	\N	\N
20867	813	277	por evaluar	\N	\N
20868	814	277	por evaluar	\N	\N
20869	815	277	por evaluar	\N	\N
20870	816	277	aprobado	2025-05-25 15:25:00	6
20871	817	277	aprobado	2025-11-28 09:24:00	1
20872	818	277	aprobado	2025-07-23 11:27:00	1
20873	819	277	por evaluar	\N	\N
20874	820	277	aprobado	2025-07-23 11:25:00	1
20875	821	277	por evaluar	\N	\N
20876	822	277	aprobado	2025-12-15 09:40:00	1
20877	823	277	por evaluar	\N	\N
20878	824	277	por evaluar	\N	\N
20879	825	277	por evaluar	\N	\N
20880	826	277	aprobado	2025-12-15 17:46:00	7
20881	827	277	aprobado	2025-04-30 18:28:00	7
20882	828	277	aprobado	2025-12-15 17:31:00	7
20883	829	277	aprobado	2025-12-05 09:44:00	7
20884	830	277	aprobado	2025-12-01 11:02:00	13
20885	831	277	aprobado	2025-12-01 11:03:00	13
20886	832	277	aprobado	2025-12-01 11:03:00	13
20887	833	277	aprobado	2025-12-01 11:02:00	13
20888	759	278	por evaluar	\N	\N
20889	760	278	aprobado	2025-11-25 09:34:00	8
20890	761	278	aprobado	2025-11-25 09:34:00	8
20891	762	278	aprobado	2025-11-25 09:34:00	8
20892	763	278	aprobado	2025-11-25 09:34:00	8
20893	764	278	aprobado	2025-02-16 16:46:00	1
20894	765	278	aprobado	2025-03-24 11:07:00	2
20895	766	278	por evaluar	\N	\N
20896	767	278	por evaluar	\N	\N
20897	768	278	aprobado	2025-03-24 11:07:00	2
20898	769	278	por evaluar	\N	\N
20899	770	278	por evaluar	\N	\N
20900	771	278	aprobado	2026-03-24 08:35:00	9
20901	772	278	por evaluar	\N	\N
20902	773	278	aprobado	2025-06-21 10:35:00	3
20903	774	278	aprobado	2026-03-24 08:35:00	9
20904	775	278	por evaluar	\N	\N
20905	776	278	aprobado	2025-11-25 19:26:00	10
20906	777	278	por evaluar	\N	\N
20907	778	278	aprobado	2025-06-02 19:01:00	4
20908	779	278	aprobado	2025-12-16 20:44:00	5
20909	780	278	aprobado	2025-04-24 00:12:00	5
20910	781	278	aprobado	2025-12-16 20:43:00	5
20911	782	278	aprobado	2025-12-16 20:43:00	5
20912	783	278	por evaluar	\N	\N
20913	784	278	por evaluar	\N	\N
20914	785	278	por evaluar	\N	\N
20915	786	278	por evaluar	\N	\N
20916	787	278	aprobado	2026-03-16 18:32:00	11
20917	788	278	aprobado	2025-11-26 17:48:00	11
20918	789	278	aprobado	2026-03-16 18:32:00	11
20919	790	278	aprobado	2025-11-26 17:48:00	11
20920	791	278	por evaluar	\N	\N
20921	792	278	por evaluar	\N	\N
20922	793	278	por evaluar	\N	\N
20923	794	278	por evaluar	\N	\N
20924	795	278	por evaluar	\N	\N
20925	796	278	por evaluar	\N	\N
20926	797	278	aprobado	2025-11-28 11:42:00	6
20927	798	278	por evaluar	\N	\N
20928	799	278	aprobado	2025-11-28 09:20:00	1
20929	800	278	aprobado	2025-11-28 09:20:00	1
20930	801	278	por evaluar	\N	\N
20931	802	278	aprobado	2025-11-28 09:20:00	1
20932	803	278	por evaluar	\N	\N
20933	804	278	aprobado	2025-07-23 11:29:00	12
20934	805	278	por evaluar	\N	\N
20935	806	278	aprobado	2025-06-19 07:34:00	1
20936	807	278	por evaluar	\N	\N
20937	808	278	aprobado	2025-11-28 09:18:00	1
20938	809	278	por evaluar	\N	\N
20939	810	278	aprobado	2025-11-28 09:18:00	1
20940	811	278	por evaluar	\N	\N
20941	812	278	por evaluar	\N	\N
20942	813	278	por evaluar	\N	\N
20943	814	278	por evaluar	\N	\N
20944	815	278	por evaluar	\N	\N
20945	816	278	aprobado	2025-05-25 15:25:00	6
20946	817	278	aprobado	2025-11-28 09:24:00	1
20947	818	278	aprobado	2025-07-23 11:27:00	1
20948	819	278	por evaluar	\N	\N
20949	820	278	aprobado	2025-07-23 11:25:00	1
20950	821	278	por evaluar	\N	\N
20951	822	278	aprobado	2025-12-15 09:40:00	1
20952	823	278	por evaluar	\N	\N
20953	824	278	por evaluar	\N	\N
20954	825	278	por evaluar	\N	\N
20955	826	278	aprobado	2025-12-15 17:46:00	7
20956	827	278	aprobado	2025-04-30 18:28:00	7
20957	828	278	aprobado	2025-12-15 17:31:00	7
20958	829	278	aprobado	2025-12-05 09:44:00	7
20959	830	278	aprobado	2025-12-01 10:58:00	13
20960	831	278	aprobado	2025-12-01 10:58:00	13
20961	832	278	aprobado	2025-12-01 10:58:00	13
20962	833	278	aprobado	2025-12-01 10:57:00	13
20963	759	279	por evaluar	\N	\N
20964	760	279	aprobado	2025-11-25 09:51:00	8
20965	761	279	aprobado	2025-11-25 09:51:00	8
20966	762	279	aprobado	2025-11-25 09:51:00	8
20967	763	279	aprobado	2025-11-25 09:51:00	8
20968	764	279	aprobado	2025-02-16 16:46:00	1
20969	765	279	aprobado	2025-03-24 11:07:00	2
20970	766	279	por evaluar	\N	\N
20971	767	279	por evaluar	\N	\N
20972	768	279	aprobado	2025-03-24 11:07:00	2
20973	769	279	por evaluar	\N	\N
20974	770	279	por evaluar	\N	\N
20975	771	279	aprobado	2026-03-24 08:35:00	9
20976	772	279	por evaluar	\N	\N
20977	773	279	aprobado	2025-06-21 10:35:00	3
20978	774	279	aprobado	2026-03-24 08:35:00	9
20979	775	279	por evaluar	\N	\N
20980	776	279	aprobado	2025-11-25 19:26:00	10
20981	777	279	por evaluar	\N	\N
20982	778	279	aprobado	2025-06-02 19:01:00	4
20983	779	279	aprobado	2025-12-16 20:44:00	5
20984	780	279	aprobado	2025-04-24 00:12:00	5
20985	781	279	aprobado	2025-12-16 20:43:00	5
20986	782	279	aprobado	2025-12-16 20:43:00	5
20987	783	279	por evaluar	\N	\N
20988	784	279	por evaluar	\N	\N
20989	785	279	por evaluar	\N	\N
20990	786	279	por evaluar	\N	\N
20991	787	279	aprobado	2026-03-16 18:32:00	11
20992	788	279	aprobado	2025-11-26 17:48:00	11
20993	789	279	aprobado	2026-03-16 18:32:00	11
20994	790	279	aprobado	2025-11-26 17:48:00	11
20995	791	279	por evaluar	\N	\N
20996	792	279	por evaluar	\N	\N
20997	793	279	por evaluar	\N	\N
20998	794	279	por evaluar	\N	\N
20999	795	279	por evaluar	\N	\N
21000	796	279	por evaluar	\N	\N
21001	797	279	aprobado	2025-11-28 11:42:00	6
21002	798	279	por evaluar	\N	\N
21003	799	279	aprobado	2025-11-28 09:20:00	1
21004	800	279	aprobado	2025-11-28 09:20:00	1
21005	801	279	por evaluar	\N	\N
21006	802	279	aprobado	2025-11-28 09:20:00	1
21007	803	279	por evaluar	\N	\N
21008	804	279	aprobado	2025-07-23 11:29:00	12
21009	805	279	por evaluar	\N	\N
21010	806	279	aprobado	2025-06-19 07:34:00	1
21011	807	279	por evaluar	\N	\N
21012	808	279	aprobado	2025-11-28 09:18:00	1
21013	809	279	por evaluar	\N	\N
21014	810	279	aprobado	2025-11-28 09:18:00	1
21015	811	279	por evaluar	\N	\N
21016	812	279	por evaluar	\N	\N
21017	813	279	por evaluar	\N	\N
21018	814	279	por evaluar	\N	\N
21019	815	279	por evaluar	\N	\N
21020	816	279	aprobado	2025-05-25 15:25:00	6
21021	817	279	aprobado	2025-11-28 09:24:00	1
21022	818	279	aprobado	2025-07-23 11:27:00	1
21023	819	279	por evaluar	\N	\N
21024	820	279	aprobado	2025-07-23 11:25:00	1
21025	821	279	por evaluar	\N	\N
21026	822	279	aprobado	2025-12-15 09:43:00	1
21027	823	279	por evaluar	\N	\N
21028	824	279	por evaluar	\N	\N
21029	825	279	por evaluar	\N	\N
21030	826	279	aprobado	2025-12-15 17:46:00	7
21031	827	279	aprobado	2025-04-30 18:28:00	7
21032	828	279	aprobado	2025-12-15 17:31:00	7
21033	829	279	aprobado	2025-12-05 09:44:00	7
21034	830	279	aprobado	2025-12-01 11:02:00	13
21035	831	279	aprobado	2025-12-01 11:03:00	13
21036	832	279	aprobado	2025-12-01 11:03:00	13
21037	833	279	aprobado	2025-12-01 11:02:00	13
21038	759	280	por evaluar	\N	\N
21039	760	280	por evaluar	\N	\N
21040	761	280	por evaluar	\N	\N
21041	762	280	por evaluar	\N	\N
21042	763	280	por evaluar	\N	\N
21043	764	280	aprobado	2025-02-16 16:46:00	1
21044	765	280	aprobado	2025-03-24 11:07:00	2
21045	766	280	por evaluar	\N	\N
21046	767	280	por evaluar	\N	\N
21047	768	280	aprobado	2025-03-24 11:07:00	2
21048	769	280	por evaluar	\N	\N
21049	770	280	por evaluar	\N	\N
21050	771	280	por evaluar	\N	\N
21051	772	280	por evaluar	\N	\N
21052	773	280	aprobado	2025-06-21 10:35:00	3
21053	774	280	por evaluar	\N	\N
21054	775	280	por evaluar	\N	\N
21055	776	280	por evaluar	\N	\N
21056	777	280	por evaluar	\N	\N
21057	778	280	aprobado	2025-06-02 19:01:00	4
21058	779	280	por evaluar	\N	\N
21059	780	280	aprobado	2025-04-24 00:12:00	5
21060	781	280	por evaluar	\N	\N
21061	782	280	por evaluar	\N	\N
21062	783	280	por evaluar	\N	\N
21063	784	280	por evaluar	\N	\N
21064	785	280	por evaluar	\N	\N
21065	786	280	por evaluar	\N	\N
21066	787	280	por evaluar	\N	\N
21067	788	280	por evaluar	\N	\N
21068	789	280	por evaluar	\N	\N
21069	790	280	por evaluar	\N	\N
21070	791	280	por evaluar	\N	\N
21071	792	280	por evaluar	\N	\N
21072	793	280	por evaluar	\N	\N
21073	794	280	por evaluar	\N	\N
21074	795	280	por evaluar	\N	\N
21075	796	280	por evaluar	\N	\N
21076	797	280	por evaluar	\N	\N
21077	798	280	por evaluar	\N	\N
21078	799	280	por evaluar	\N	\N
21079	800	280	por evaluar	\N	\N
21080	801	280	por evaluar	\N	\N
21081	802	280	por evaluar	\N	\N
21082	803	280	por evaluar	\N	\N
21083	804	280	aprobado	2025-07-23 11:29:00	12
21084	805	280	por evaluar	\N	\N
21085	806	280	aprobado	2025-06-19 07:34:00	1
21086	807	280	por evaluar	\N	\N
21087	808	280	por evaluar	\N	\N
21088	809	280	por evaluar	\N	\N
21089	810	280	por evaluar	\N	\N
21090	811	280	por evaluar	\N	\N
21091	812	280	por evaluar	\N	\N
21092	813	280	por evaluar	\N	\N
21093	814	280	por evaluar	\N	\N
21094	815	280	por evaluar	\N	\N
21095	816	280	aprobado	2025-05-25 15:25:00	6
21096	817	280	por evaluar	\N	\N
21097	818	280	aprobado	2025-07-23 11:27:00	1
21098	819	280	por evaluar	\N	\N
21099	820	280	aprobado	2025-07-23 11:25:00	1
21100	821	280	por evaluar	\N	\N
21101	822	280	por evaluar	\N	\N
21102	823	280	por evaluar	\N	\N
21103	824	280	por evaluar	\N	\N
21104	825	280	por evaluar	\N	\N
21105	826	280	por evaluar	\N	\N
21106	827	280	aprobado	2025-04-30 18:28:00	7
21107	828	280	por evaluar	\N	\N
21108	829	280	por evaluar	\N	\N
21109	830	280	por evaluar	\N	\N
21110	831	280	por evaluar	\N	\N
21111	832	280	por evaluar	\N	\N
21112	833	280	por evaluar	\N	\N
21113	759	281	por evaluar	\N	\N
21114	760	281	por evaluar	\N	\N
21115	761	281	por evaluar	\N	\N
21116	762	281	por evaluar	\N	\N
21117	763	281	por evaluar	\N	\N
21118	764	281	aprobado	2025-02-16 16:46:00	1
21119	765	281	aprobado	2025-03-24 11:07:00	2
21120	766	281	por evaluar	\N	\N
21121	767	281	por evaluar	\N	\N
21122	768	281	aprobado	2025-03-24 11:07:00	2
21123	769	281	por evaluar	\N	\N
21124	770	281	por evaluar	\N	\N
21125	771	281	por evaluar	\N	\N
21126	772	281	por evaluar	\N	\N
21127	773	281	aprobado	2025-06-21 10:35:00	3
21128	774	281	por evaluar	\N	\N
21129	775	281	por evaluar	\N	\N
21130	776	281	por evaluar	\N	\N
21131	777	281	por evaluar	\N	\N
21132	778	281	aprobado	2025-06-02 19:01:00	4
21133	779	281	por evaluar	\N	\N
21134	780	281	aprobado	2025-04-24 00:12:00	5
21135	781	281	por evaluar	\N	\N
21136	782	281	por evaluar	\N	\N
21137	783	281	por evaluar	\N	\N
21138	784	281	por evaluar	\N	\N
21139	785	281	por evaluar	\N	\N
21140	786	281	por evaluar	\N	\N
21141	787	281	por evaluar	\N	\N
21142	788	281	por evaluar	\N	\N
21143	789	281	por evaluar	\N	\N
21144	790	281	por evaluar	\N	\N
21145	791	281	por evaluar	\N	\N
21146	792	281	por evaluar	\N	\N
21147	793	281	por evaluar	\N	\N
21148	794	281	por evaluar	\N	\N
21149	795	281	por evaluar	\N	\N
21150	796	281	por evaluar	\N	\N
21151	797	281	por evaluar	\N	\N
21152	798	281	por evaluar	\N	\N
21153	799	281	por evaluar	\N	\N
21154	800	281	por evaluar	\N	\N
21155	801	281	por evaluar	\N	\N
21156	802	281	por evaluar	\N	\N
21157	803	281	por evaluar	\N	\N
21158	804	281	aprobado	2025-07-23 11:29:00	12
21159	805	281	por evaluar	\N	\N
21160	806	281	aprobado	2025-06-19 07:34:00	1
21161	807	281	por evaluar	\N	\N
21162	808	281	por evaluar	\N	\N
21163	809	281	por evaluar	\N	\N
21164	810	281	por evaluar	\N	\N
21165	811	281	por evaluar	\N	\N
21166	812	281	por evaluar	\N	\N
21167	813	281	por evaluar	\N	\N
21168	814	281	por evaluar	\N	\N
21169	815	281	por evaluar	\N	\N
21170	816	281	aprobado	2025-05-25 15:25:00	6
21171	817	281	por evaluar	\N	\N
21172	818	281	aprobado	2025-07-23 11:27:00	1
21173	819	281	por evaluar	\N	\N
21174	820	281	aprobado	2025-07-23 11:25:00	1
21175	821	281	por evaluar	\N	\N
21176	822	281	por evaluar	\N	\N
21177	823	281	por evaluar	\N	\N
21178	824	281	por evaluar	\N	\N
21179	825	281	por evaluar	\N	\N
21180	826	281	por evaluar	\N	\N
21181	827	281	aprobado	2025-04-30 18:28:00	7
21182	828	281	por evaluar	\N	\N
21183	829	281	por evaluar	\N	\N
21184	830	281	por evaluar	\N	\N
21185	831	281	por evaluar	\N	\N
21186	832	281	por evaluar	\N	\N
21187	833	281	por evaluar	\N	\N
21188	759	282	por evaluar	\N	\N
21189	760	282	aprobado	2025-11-25 09:46:00	8
21190	761	282	aprobado	2025-11-25 09:46:00	8
21191	762	282	aprobado	2025-11-25 09:46:00	8
21192	763	282	aprobado	2025-11-25 09:46:00	8
21193	764	282	aprobado	2025-02-16 16:46:00	1
21194	765	282	aprobado	2025-03-24 11:07:00	2
21195	766	282	por evaluar	\N	\N
21196	767	282	por evaluar	\N	\N
21197	768	282	aprobado	2025-03-24 11:07:00	2
21198	769	282	por evaluar	\N	\N
21199	770	282	por evaluar	\N	\N
21200	771	282	aprobado	2026-03-24 08:35:00	9
21201	772	282	por evaluar	\N	\N
21202	773	282	aprobado	2025-06-21 10:35:00	3
21203	774	282	aprobado	2026-03-24 08:35:00	9
21204	775	282	por evaluar	\N	\N
21205	776	282	aprobado	2025-11-25 19:26:00	10
21206	777	282	por evaluar	\N	\N
21207	778	282	aprobado	2025-06-02 19:01:00	4
21208	779	282	aprobado	2025-12-16 20:44:00	5
21209	780	282	aprobado	2025-04-24 00:12:00	5
21210	781	282	aprobado	2025-12-16 20:43:00	5
21211	782	282	aprobado	2025-12-16 20:43:00	5
21212	783	282	por evaluar	\N	\N
21213	784	282	por evaluar	\N	\N
21214	785	282	por evaluar	\N	\N
21215	786	282	por evaluar	\N	\N
21216	787	282	aprobado	2026-03-16 18:32:00	11
21217	788	282	aprobado	2025-11-26 17:17:00	11
21218	789	282	aprobado	2026-03-16 18:32:00	11
21219	790	282	aprobado	2025-11-26 17:17:00	11
21220	791	282	por evaluar	\N	\N
21221	792	282	por evaluar	\N	\N
21222	793	282	por evaluar	\N	\N
21223	794	282	por evaluar	\N	\N
21224	795	282	por evaluar	\N	\N
21225	796	282	por evaluar	\N	\N
21226	797	282	aprobado	2025-11-28 11:42:00	6
21227	798	282	por evaluar	\N	\N
21228	799	282	aprobado	2025-11-28 09:20:00	1
21229	800	282	aprobado	2025-11-28 09:20:00	1
21230	801	282	por evaluar	\N	\N
21231	802	282	aprobado	2025-11-28 09:20:00	1
21232	803	282	por evaluar	\N	\N
21233	804	282	aprobado	2025-07-23 11:29:00	12
21234	805	282	por evaluar	\N	\N
21235	806	282	aprobado	2025-06-19 07:34:00	1
21236	807	282	por evaluar	\N	\N
21237	808	282	aprobado	2025-11-28 09:18:00	1
21238	809	282	por evaluar	\N	\N
21239	810	282	aprobado	2025-11-28 09:18:00	1
21240	811	282	por evaluar	\N	\N
21241	812	282	por evaluar	\N	\N
21242	813	282	por evaluar	\N	\N
21243	814	282	por evaluar	\N	\N
21244	815	282	por evaluar	\N	\N
21245	816	282	aprobado	2025-05-25 15:25:00	6
21246	817	282	aprobado	2025-11-28 09:24:00	1
21247	818	282	aprobado	2025-07-23 11:27:00	1
21248	819	282	por evaluar	\N	\N
21249	820	282	aprobado	2025-07-23 11:25:00	1
21250	821	282	por evaluar	\N	\N
21251	822	282	aprobado	2025-12-15 09:40:00	1
21252	823	282	por evaluar	\N	\N
21253	824	282	por evaluar	\N	\N
21254	825	282	por evaluar	\N	\N
21255	826	282	aprobado	2025-12-15 17:46:00	7
21256	827	282	aprobado	2025-04-30 18:28:00	7
21257	828	282	aprobado	2025-12-15 17:31:00	7
21258	829	282	aprobado	2025-12-05 09:44:00	7
21259	830	282	aprobado	2025-12-01 10:58:00	13
21260	831	282	aprobado	2025-12-01 10:58:00	13
21261	832	282	aprobado	2025-12-01 10:58:00	13
21262	833	282	aprobado	2025-12-01 10:57:00	13
21263	759	283	por evaluar	\N	\N
21264	760	283	aprobado	2025-11-25 09:56:00	8
21265	761	283	aprobado	2025-11-25 09:56:00	8
21266	762	283	aprobado	2025-11-25 09:56:00	8
21267	763	283	aprobado	2025-11-25 09:56:00	8
21268	764	283	aprobado	2025-02-16 16:46:00	1
21269	765	283	aprobado	2025-03-24 11:07:00	2
21270	766	283	por evaluar	\N	\N
21271	767	283	por evaluar	\N	\N
21272	768	283	aprobado	2025-03-24 11:07:00	2
21273	769	283	por evaluar	\N	\N
21274	770	283	por evaluar	\N	\N
21275	771	283	aprobado	2026-03-24 08:35:00	9
21276	772	283	por evaluar	\N	\N
21277	773	283	aprobado	2025-06-21 10:35:00	3
21278	774	283	aprobado	2026-03-24 08:35:00	9
21279	775	283	por evaluar	\N	\N
21280	776	283	aprobado	2025-11-25 19:26:00	10
21281	777	283	por evaluar	\N	\N
21282	778	283	aprobado	2025-06-02 19:01:00	4
21283	779	283	aprobado	2025-12-16 20:44:00	5
21284	780	283	aprobado	2025-04-24 00:12:00	5
21285	781	283	aprobado	2025-12-16 20:43:00	5
21286	782	283	aprobado	2025-12-16 20:43:00	5
21287	783	283	por evaluar	\N	\N
21288	784	283	por evaluar	\N	\N
21289	785	283	por evaluar	\N	\N
21290	786	283	por evaluar	\N	\N
21291	787	283	aprobado	2026-03-16 18:32:00	11
21292	788	283	aprobado	2025-11-26 17:10:00	11
21293	789	283	aprobado	2026-03-16 18:32:00	11
21294	790	283	aprobado	2025-11-26 17:10:00	11
21295	791	283	por evaluar	\N	\N
21296	792	283	por evaluar	\N	\N
21297	793	283	por evaluar	\N	\N
21298	794	283	por evaluar	\N	\N
21299	795	283	por evaluar	\N	\N
21300	796	283	por evaluar	\N	\N
21301	797	283	aprobado	2025-11-28 11:42:00	6
21302	798	283	por evaluar	\N	\N
21303	799	283	aprobado	2025-11-28 09:20:00	1
21304	800	283	aprobado	2025-11-28 09:20:00	1
21305	801	283	por evaluar	\N	\N
21306	802	283	aprobado	2025-11-28 09:20:00	1
21307	803	283	por evaluar	\N	\N
21308	804	283	aprobado	2025-07-23 11:29:00	12
21309	805	283	por evaluar	\N	\N
21310	806	283	aprobado	2025-06-19 07:34:00	1
21311	807	283	por evaluar	\N	\N
21312	808	283	aprobado	2025-11-28 09:18:00	1
21313	809	283	por evaluar	\N	\N
21314	810	283	aprobado	2025-11-28 09:18:00	1
21315	811	283	por evaluar	\N	\N
21316	812	283	por evaluar	\N	\N
21317	813	283	por evaluar	\N	\N
21318	814	283	por evaluar	\N	\N
21319	815	283	por evaluar	\N	\N
21320	816	283	aprobado	2025-05-25 15:25:00	6
21321	817	283	aprobado	2025-11-28 09:24:00	1
21322	818	283	aprobado	2025-07-23 11:27:00	1
21323	819	283	por evaluar	\N	\N
21324	820	283	aprobado	2025-07-23 11:25:00	1
21325	821	283	por evaluar	\N	\N
21326	822	283	aprobado	2025-12-15 09:43:00	1
21327	823	283	por evaluar	\N	\N
21328	824	283	por evaluar	\N	\N
21329	825	283	por evaluar	\N	\N
21330	826	283	aprobado	2025-12-15 17:46:00	7
21331	827	283	aprobado	2025-04-30 18:28:00	7
21332	828	283	aprobado	2025-12-15 17:31:00	7
21333	829	283	aprobado	2025-12-05 09:44:00	7
21334	830	283	aprobado	2025-12-01 11:05:00	13
21335	831	283	aprobado	2025-12-01 11:06:00	13
21336	832	283	aprobado	2025-12-01 11:06:00	13
21337	833	283	aprobado	2025-12-01 11:05:00	13
21338	759	284	por evaluar	\N	\N
21339	760	284	por evaluar	\N	\N
21340	761	284	por evaluar	\N	\N
21341	762	284	por evaluar	\N	\N
21342	763	284	por evaluar	\N	\N
21343	764	284	aprobado	2025-02-16 16:46:00	1
21344	765	284	aprobado	2025-03-24 11:07:00	2
21345	766	284	por evaluar	\N	\N
21346	767	284	por evaluar	\N	\N
21347	768	284	aprobado	2025-03-24 11:07:00	2
21348	769	284	por evaluar	\N	\N
21349	770	284	por evaluar	\N	\N
21350	771	284	por evaluar	\N	\N
21351	772	284	por evaluar	\N	\N
21352	773	284	aprobado	2025-06-21 10:35:00	3
21353	774	284	por evaluar	\N	\N
21354	775	284	por evaluar	\N	\N
21355	776	284	por evaluar	\N	\N
21356	777	284	por evaluar	\N	\N
21357	778	284	aprobado	2025-06-02 19:01:00	4
21358	779	284	por evaluar	\N	\N
21359	780	284	aprobado	2025-04-24 00:12:00	5
21360	781	284	por evaluar	\N	\N
21361	782	284	por evaluar	\N	\N
21362	783	284	por evaluar	\N	\N
21363	784	284	por evaluar	\N	\N
21364	785	284	por evaluar	\N	\N
21365	786	284	por evaluar	\N	\N
21366	787	284	por evaluar	\N	\N
21367	788	284	por evaluar	\N	\N
21368	789	284	por evaluar	\N	\N
21369	790	284	por evaluar	\N	\N
21370	791	284	por evaluar	\N	\N
21371	792	284	por evaluar	\N	\N
21372	793	284	por evaluar	\N	\N
21373	794	284	por evaluar	\N	\N
21374	795	284	por evaluar	\N	\N
21375	796	284	por evaluar	\N	\N
21376	797	284	por evaluar	\N	\N
21377	798	284	por evaluar	\N	\N
21378	799	284	por evaluar	\N	\N
21379	800	284	por evaluar	\N	\N
21380	801	284	por evaluar	\N	\N
21381	802	284	por evaluar	\N	\N
21382	803	284	por evaluar	\N	\N
21383	804	284	por evaluar	\N	\N
21384	805	284	por evaluar	\N	\N
21385	806	284	por evaluar	\N	\N
21386	807	284	por evaluar	\N	\N
21387	808	284	por evaluar	\N	\N
21388	809	284	por evaluar	\N	\N
21389	810	284	por evaluar	\N	\N
21390	811	284	por evaluar	\N	\N
21391	812	284	por evaluar	\N	\N
21392	813	284	por evaluar	\N	\N
21393	814	284	por evaluar	\N	\N
21394	815	284	por evaluar	\N	\N
21395	816	284	aprobado	2025-05-25 15:25:00	6
21396	817	284	por evaluar	\N	\N
21397	818	284	por evaluar	\N	\N
21398	819	284	por evaluar	\N	\N
21399	820	284	por evaluar	\N	\N
21400	821	284	por evaluar	\N	\N
21401	822	284	por evaluar	\N	\N
21402	823	284	por evaluar	\N	\N
21403	824	284	por evaluar	\N	\N
21404	825	284	por evaluar	\N	\N
21405	826	284	por evaluar	\N	\N
21406	827	284	aprobado	2025-04-30 18:28:00	7
21407	828	284	por evaluar	\N	\N
21408	829	284	por evaluar	\N	\N
21409	830	284	por evaluar	\N	\N
21410	831	284	por evaluar	\N	\N
21411	832	284	por evaluar	\N	\N
21412	833	284	por evaluar	\N	\N
21413	759	285	por evaluar	\N	\N
21414	760	285	por evaluar	\N	\N
21415	761	285	por evaluar	\N	\N
21416	762	285	por evaluar	\N	\N
21417	763	285	por evaluar	\N	\N
21418	764	285	aprobado	2025-02-16 16:46:00	1
21419	765	285	aprobado	2025-03-24 11:07:00	2
21420	766	285	por evaluar	\N	\N
21421	767	285	por evaluar	\N	\N
21422	768	285	aprobado	2025-03-24 11:07:00	2
21423	769	285	por evaluar	\N	\N
21424	770	285	por evaluar	\N	\N
21425	771	285	por evaluar	\N	\N
21426	772	285	por evaluar	\N	\N
21427	773	285	por evaluar	\N	\N
21428	774	285	por evaluar	\N	\N
21429	775	285	por evaluar	\N	\N
21430	776	285	por evaluar	\N	\N
21431	777	285	por evaluar	\N	\N
21432	778	285	por evaluar	\N	\N
21433	779	285	por evaluar	\N	\N
21434	780	285	por evaluar	\N	\N
21435	781	285	por evaluar	\N	\N
21436	782	285	por evaluar	\N	\N
21437	783	285	por evaluar	\N	\N
21438	784	285	por evaluar	\N	\N
21439	785	285	por evaluar	\N	\N
21440	786	285	por evaluar	\N	\N
21441	787	285	por evaluar	\N	\N
21442	788	285	por evaluar	\N	\N
21443	789	285	por evaluar	\N	\N
21444	790	285	por evaluar	\N	\N
21445	791	285	por evaluar	\N	\N
21446	792	285	por evaluar	\N	\N
21447	793	285	por evaluar	\N	\N
21448	794	285	por evaluar	\N	\N
21449	795	285	por evaluar	\N	\N
21450	796	285	por evaluar	\N	\N
21451	797	285	por evaluar	\N	\N
21452	798	285	por evaluar	\N	\N
21453	799	285	por evaluar	\N	\N
21454	800	285	por evaluar	\N	\N
21455	801	285	por evaluar	\N	\N
21456	802	285	por evaluar	\N	\N
21457	803	285	por evaluar	\N	\N
21458	804	285	por evaluar	\N	\N
21459	805	285	por evaluar	\N	\N
21460	806	285	por evaluar	\N	\N
21461	807	285	por evaluar	\N	\N
21462	808	285	por evaluar	\N	\N
21463	809	285	por evaluar	\N	\N
21464	810	285	por evaluar	\N	\N
21465	811	285	por evaluar	\N	\N
21466	812	285	por evaluar	\N	\N
21467	813	285	por evaluar	\N	\N
21468	814	285	por evaluar	\N	\N
21469	815	285	por evaluar	\N	\N
21470	816	285	por evaluar	\N	\N
21471	817	285	por evaluar	\N	\N
21472	818	285	por evaluar	\N	\N
21473	819	285	por evaluar	\N	\N
21474	820	285	por evaluar	\N	\N
21475	821	285	por evaluar	\N	\N
21476	822	285	por evaluar	\N	\N
21477	823	285	por evaluar	\N	\N
21478	824	285	por evaluar	\N	\N
21479	825	285	por evaluar	\N	\N
21480	826	285	por evaluar	\N	\N
21481	827	285	por evaluar	\N	\N
21482	828	285	por evaluar	\N	\N
21483	829	285	por evaluar	\N	\N
21484	830	285	por evaluar	\N	\N
21485	831	285	por evaluar	\N	\N
21486	832	285	por evaluar	\N	\N
21487	833	285	por evaluar	\N	\N
21488	759	286	por evaluar	\N	\N
21489	760	286	aprobado	2025-11-25 09:50:00	8
21490	761	286	aprobado	2025-11-25 09:50:00	8
21491	762	286	aprobado	2025-11-25 09:50:00	8
21492	763	286	aprobado	2025-11-25 09:50:00	8
21493	764	286	aprobado	2025-02-16 16:46:00	1
21494	765	286	aprobado	2025-03-24 11:07:00	2
21495	766	286	por evaluar	\N	\N
21496	767	286	por evaluar	\N	\N
21497	768	286	aprobado	2025-03-24 11:07:00	2
21498	769	286	por evaluar	\N	\N
21499	770	286	por evaluar	\N	\N
21500	771	286	aprobado	2026-03-24 08:35:00	9
21501	772	286	por evaluar	\N	\N
21502	773	286	aprobado	2025-06-21 10:35:00	3
21503	774	286	aprobado	2026-03-24 08:35:00	9
21504	775	286	por evaluar	\N	\N
21505	776	286	aprobado	2025-11-25 19:26:00	10
21506	777	286	por evaluar	\N	\N
21507	778	286	aprobado	2025-06-02 19:01:00	4
21508	779	286	aprobado	2025-12-16 20:44:00	5
21509	780	286	aprobado	2025-04-24 00:12:00	5
21510	781	286	aprobado	2025-12-16 20:43:00	5
21511	782	286	aprobado	2025-12-16 20:43:00	5
21512	783	286	por evaluar	\N	\N
21513	784	286	por evaluar	\N	\N
21514	785	286	por evaluar	\N	\N
21515	786	286	por evaluar	\N	\N
21516	787	286	aprobado	2026-03-16 18:32:00	11
21517	788	286	aprobado	2025-11-26 17:13:00	11
21518	789	286	aprobado	2026-03-16 18:32:00	11
21519	790	286	aprobado	2025-11-26 17:13:00	11
21520	791	286	por evaluar	\N	\N
21521	792	286	por evaluar	\N	\N
21522	793	286	por evaluar	\N	\N
21523	794	286	por evaluar	\N	\N
21524	795	286	por evaluar	\N	\N
21525	796	286	por evaluar	\N	\N
21526	797	286	aprobado	2025-11-28 11:42:00	6
21527	798	286	por evaluar	\N	\N
21528	799	286	aprobado	2025-11-28 09:20:00	1
21529	800	286	aprobado	2025-11-28 09:20:00	1
21530	801	286	por evaluar	\N	\N
21531	802	286	aprobado	2025-11-28 09:20:00	1
21532	803	286	por evaluar	\N	\N
21533	804	286	aprobado	2025-07-23 11:29:00	12
21534	805	286	por evaluar	\N	\N
21535	806	286	aprobado	2025-06-19 07:34:00	1
21536	807	286	por evaluar	\N	\N
21537	808	286	aprobado	2025-11-28 09:18:00	1
21538	809	286	por evaluar	\N	\N
21539	810	286	aprobado	2025-11-28 09:18:00	1
21540	811	286	por evaluar	\N	\N
21541	812	286	por evaluar	\N	\N
21542	813	286	por evaluar	\N	\N
21543	814	286	por evaluar	\N	\N
21544	815	286	por evaluar	\N	\N
21545	816	286	aprobado	2025-05-25 15:25:00	6
21546	817	286	aprobado	2025-11-28 09:24:00	1
21547	818	286	aprobado	2025-07-23 11:27:00	1
21548	819	286	por evaluar	\N	\N
21549	820	286	aprobado	2025-07-23 11:25:00	1
21550	821	286	por evaluar	\N	\N
21551	822	286	aprobado	2025-12-15 09:43:00	1
21552	823	286	por evaluar	\N	\N
21553	824	286	por evaluar	\N	\N
21554	825	286	por evaluar	\N	\N
21555	826	286	aprobado	2025-12-15 17:46:00	7
21556	827	286	aprobado	2025-04-30 18:28:00	7
21557	828	286	aprobado	2025-12-15 17:31:00	7
21558	829	286	aprobado	2025-12-05 09:44:00	7
21559	830	286	aprobado	2025-12-01 11:05:00	13
21560	831	286	aprobado	2025-12-01 11:06:00	13
21561	832	286	aprobado	2025-12-01 11:06:00	13
21562	833	286	aprobado	2025-12-01 11:05:00	13
21563	759	287	por evaluar	\N	\N
21564	760	287	aprobado	2025-11-25 10:06:00	8
21565	761	287	aprobado	2025-11-25 10:06:00	8
21566	762	287	aprobado	2025-11-25 10:06:00	8
21567	763	287	aprobado	2025-11-25 10:06:00	8
21568	764	287	aprobado	2025-02-16 16:46:00	1
21569	765	287	aprobado	2025-03-24 11:07:00	2
21570	766	287	por evaluar	\N	\N
21571	767	287	por evaluar	\N	\N
21572	768	287	aprobado	2025-03-24 11:07:00	2
21573	769	287	por evaluar	\N	\N
21574	770	287	por evaluar	\N	\N
21575	771	287	aprobado	2026-03-24 08:35:00	9
21576	772	287	por evaluar	\N	\N
21577	773	287	aprobado	2025-06-21 10:35:00	3
21578	774	287	aprobado	2026-03-24 08:35:00	9
21579	775	287	por evaluar	\N	\N
21580	776	287	aprobado	2025-11-25 19:26:00	10
21581	777	287	por evaluar	\N	\N
21582	778	287	aprobado	2025-06-02 19:01:00	4
21583	779	287	aprobado	2025-12-16 20:44:00	5
21584	780	287	aprobado	2025-04-24 00:12:00	5
21585	781	287	aprobado	2025-12-16 20:43:00	5
21586	782	287	aprobado	2025-12-16 20:43:00	5
21587	783	287	por evaluar	\N	\N
21588	784	287	por evaluar	\N	\N
21589	785	287	por evaluar	\N	\N
21590	786	287	por evaluar	\N	\N
21591	787	287	aprobado	2026-03-16 18:32:00	11
21592	788	287	aprobado	2025-11-26 17:49:00	11
21593	789	287	aprobado	2026-03-16 18:32:00	11
21594	790	287	aprobado	2025-11-26 17:50:00	11
21595	791	287	por evaluar	\N	\N
21596	792	287	por evaluar	\N	\N
21597	793	287	por evaluar	\N	\N
21598	794	287	por evaluar	\N	\N
21599	795	287	por evaluar	\N	\N
21600	796	287	por evaluar	\N	\N
21601	797	287	aprobado	2025-11-28 11:42:00	6
21602	798	287	por evaluar	\N	\N
21603	799	287	aprobado	2025-11-28 09:20:00	1
21604	800	287	aprobado	2025-11-28 09:20:00	1
21605	801	287	por evaluar	\N	\N
21606	802	287	aprobado	2025-11-28 09:20:00	1
21607	803	287	por evaluar	\N	\N
21608	804	287	aprobado	2025-07-23 11:29:00	12
21609	805	287	por evaluar	\N	\N
21610	806	287	aprobado	2025-06-19 07:34:00	1
21611	807	287	por evaluar	\N	\N
21612	808	287	aprobado	2025-11-28 09:18:00	1
21613	809	287	por evaluar	\N	\N
21614	810	287	aprobado	2025-11-28 09:18:00	1
21615	811	287	por evaluar	\N	\N
21616	812	287	por evaluar	\N	\N
21617	813	287	por evaluar	\N	\N
21618	814	287	por evaluar	\N	\N
21619	815	287	por evaluar	\N	\N
21620	816	287	aprobado	2025-05-25 15:25:00	6
21621	817	287	aprobado	2025-11-28 09:24:00	1
21622	818	287	aprobado	2025-07-23 11:27:00	1
21623	819	287	por evaluar	\N	\N
21624	820	287	aprobado	2025-07-23 11:25:00	1
21625	821	287	por evaluar	\N	\N
21626	822	287	aprobado	2025-12-15 09:40:00	1
21627	823	287	por evaluar	\N	\N
21628	824	287	por evaluar	\N	\N
21629	825	287	por evaluar	\N	\N
21630	826	287	aprobado	2025-12-15 17:46:00	7
21631	827	287	aprobado	2025-04-30 18:28:00	7
21632	828	287	aprobado	2025-12-15 17:31:00	7
21633	829	287	aprobado	2025-12-05 09:44:00	7
21634	830	287	aprobado	2025-12-01 10:58:00	13
21635	831	287	aprobado	2025-12-01 10:58:00	13
21636	832	287	aprobado	2025-12-01 10:58:00	13
21637	833	287	aprobado	2025-12-01 10:57:00	13
21638	759	288	por evaluar	\N	\N
21639	760	288	aprobado	2025-11-25 10:05:00	8
21640	761	288	aprobado	2025-11-25 10:05:00	8
21641	762	288	aprobado	2025-11-25 10:05:00	8
21642	763	288	aprobado	2025-11-25 10:05:00	8
21643	764	288	aprobado	2025-02-16 16:46:00	1
21644	765	288	aprobado	2025-03-24 11:07:00	2
21645	766	288	por evaluar	\N	\N
21646	767	288	por evaluar	\N	\N
21647	768	288	aprobado	2025-03-24 11:07:00	2
21648	769	288	por evaluar	\N	\N
21649	770	288	por evaluar	\N	\N
21650	771	288	aprobado	2026-03-24 08:35:00	9
21651	772	288	por evaluar	\N	\N
21652	773	288	aprobado	2025-06-21 10:35:00	3
21653	774	288	aprobado	2026-03-24 08:35:00	9
21654	775	288	por evaluar	\N	\N
21655	776	288	aprobado	2025-11-25 19:26:00	10
21656	777	288	por evaluar	\N	\N
21657	778	288	aprobado	2025-06-02 19:01:00	4
21658	779	288	aprobado	2025-12-16 20:44:00	5
21659	780	288	aprobado	2025-04-24 00:12:00	5
21660	781	288	aprobado	2025-12-16 20:43:00	5
21661	782	288	aprobado	2025-12-16 20:43:00	5
21662	783	288	por evaluar	\N	\N
21663	784	288	por evaluar	\N	\N
21664	785	288	por evaluar	\N	\N
21665	786	288	por evaluar	\N	\N
21666	787	288	aprobado	2026-03-16 18:32:00	11
21667	788	288	aprobado	2025-11-26 17:17:00	11
21668	789	288	aprobado	2026-03-16 18:32:00	11
21669	790	288	aprobado	2025-11-26 17:17:00	11
21670	791	288	por evaluar	\N	\N
21671	792	288	por evaluar	\N	\N
21672	793	288	por evaluar	\N	\N
21673	794	288	por evaluar	\N	\N
21674	795	288	por evaluar	\N	\N
21675	796	288	por evaluar	\N	\N
21676	797	288	aprobado	2025-11-28 11:42:00	6
21677	798	288	por evaluar	\N	\N
21678	799	288	aprobado	2025-11-28 09:20:00	1
21679	800	288	aprobado	2025-11-28 09:20:00	1
21680	801	288	por evaluar	\N	\N
21681	802	288	aprobado	2025-11-28 09:20:00	1
21682	803	288	por evaluar	\N	\N
21683	804	288	aprobado	2025-07-23 11:29:00	12
21684	805	288	por evaluar	\N	\N
21685	806	288	aprobado	2025-06-19 07:34:00	1
21686	807	288	por evaluar	\N	\N
21687	808	288	aprobado	2025-11-28 09:18:00	1
21688	809	288	por evaluar	\N	\N
21689	810	288	aprobado	2025-11-28 09:18:00	1
21690	811	288	por evaluar	\N	\N
21691	812	288	por evaluar	\N	\N
21692	813	288	por evaluar	\N	\N
21693	814	288	por evaluar	\N	\N
21694	815	288	por evaluar	\N	\N
21695	816	288	aprobado	2025-05-25 15:25:00	6
21696	817	288	aprobado	2025-11-28 09:24:00	1
21697	818	288	aprobado	2025-07-23 11:27:00	1
21698	819	288	por evaluar	\N	\N
21699	820	288	aprobado	2025-07-23 11:25:00	1
21700	821	288	por evaluar	\N	\N
21701	822	288	aprobado	2025-12-15 09:38:00	1
21702	823	288	por evaluar	\N	\N
21703	824	288	por evaluar	\N	\N
21704	825	288	por evaluar	\N	\N
21705	826	288	aprobado	2025-12-15 17:46:00	7
21706	827	288	aprobado	2025-04-30 18:28:00	7
21707	828	288	aprobado	2025-12-15 17:31:00	7
21708	829	288	aprobado	2025-12-05 09:44:00	7
21709	830	288	aprobado	2025-12-01 11:00:00	13
21710	831	288	aprobado	2025-12-01 11:00:00	13
21711	832	288	aprobado	2025-12-01 11:01:00	13
21712	833	288	aprobado	2025-12-01 11:00:00	13
21713	759	289	por evaluar	\N	\N
21714	760	289	aprobado	2025-11-25 09:50:00	8
21715	761	289	aprobado	2025-11-25 09:50:00	8
21716	762	289	aprobado	2025-11-25 09:50:00	8
21717	763	289	aprobado	2025-11-25 09:50:00	8
21718	764	289	aprobado	2025-02-16 16:46:00	1
21719	765	289	aprobado	2025-03-24 11:07:00	2
21720	766	289	por evaluar	\N	\N
21721	767	289	por evaluar	\N	\N
21722	768	289	aprobado	2025-03-24 11:07:00	2
21723	769	289	por evaluar	\N	\N
21724	770	289	por evaluar	\N	\N
21725	771	289	aprobado	2026-03-24 08:35:00	9
21726	772	289	por evaluar	\N	\N
21727	773	289	aprobado	2025-06-21 10:35:00	3
21728	774	289	aprobado	2026-03-24 08:35:00	9
21729	775	289	por evaluar	\N	\N
21730	776	289	aprobado	2025-11-25 19:26:00	10
21731	777	289	por evaluar	\N	\N
21732	778	289	aprobado	2025-06-02 19:01:00	4
21733	779	289	aprobado	2025-12-16 20:44:00	5
21734	780	289	aprobado	2025-04-24 00:12:00	5
21735	781	289	aprobado	2025-12-16 20:43:00	5
21736	782	289	aprobado	2025-12-16 20:43:00	5
21737	783	289	por evaluar	\N	\N
21738	784	289	por evaluar	\N	\N
21739	785	289	por evaluar	\N	\N
21740	786	289	por evaluar	\N	\N
21741	787	289	aprobado	2026-03-16 18:32:00	11
21742	788	289	aprobado	2025-11-26 17:50:00	11
21743	789	289	aprobado	2026-03-16 18:32:00	11
21744	790	289	aprobado	2025-11-26 17:51:00	11
21745	791	289	por evaluar	\N	\N
21746	792	289	por evaluar	\N	\N
21747	793	289	por evaluar	\N	\N
21748	794	289	por evaluar	\N	\N
21749	795	289	por evaluar	\N	\N
21750	796	289	por evaluar	\N	\N
21751	797	289	aprobado	2025-11-28 11:42:00	6
21752	798	289	por evaluar	\N	\N
21753	799	289	aprobado	2025-11-28 09:20:00	1
21754	800	289	aprobado	2025-11-28 09:20:00	1
21755	801	289	por evaluar	\N	\N
21756	802	289	aprobado	2025-11-28 09:20:00	1
21757	803	289	por evaluar	\N	\N
21758	804	289	aprobado	2025-07-23 11:29:00	12
21759	805	289	por evaluar	\N	\N
21760	806	289	aprobado	2025-06-19 07:34:00	1
21761	807	289	por evaluar	\N	\N
21762	808	289	aprobado	2025-11-28 09:18:00	1
21763	809	289	por evaluar	\N	\N
21764	810	289	aprobado	2025-11-28 09:18:00	1
21765	811	289	por evaluar	\N	\N
21766	812	289	por evaluar	\N	\N
21767	813	289	por evaluar	\N	\N
21768	814	289	por evaluar	\N	\N
21769	815	289	por evaluar	\N	\N
21770	816	289	aprobado	2025-05-25 15:25:00	6
21771	817	289	aprobado	2025-11-28 09:24:00	1
21772	818	289	aprobado	2025-07-23 11:27:00	1
21773	819	289	por evaluar	\N	\N
21774	820	289	aprobado	2025-07-23 11:25:00	1
21775	821	289	por evaluar	\N	\N
21776	822	289	aprobado	2025-12-15 09:43:00	1
21777	823	289	por evaluar	\N	\N
21778	824	289	por evaluar	\N	\N
21779	825	289	por evaluar	\N	\N
21780	826	289	aprobado	2025-12-15 17:46:00	7
21781	827	289	aprobado	2025-04-30 18:28:00	7
21782	828	289	aprobado	2025-12-15 17:31:00	7
21783	829	289	aprobado	2025-12-05 09:44:00	7
21784	830	289	aprobado	2025-12-01 10:58:00	13
21785	831	289	aprobado	2025-12-01 10:58:00	13
21786	832	289	aprobado	2025-12-01 10:58:00	13
21787	833	289	aprobado	2025-12-01 10:57:00	13
21788	759	290	por evaluar	\N	\N
21789	760	290	aprobado	2025-11-25 09:42:00	8
21790	761	290	aprobado	2025-11-25 09:42:00	8
21791	762	290	aprobado	2025-11-25 09:42:00	8
21792	763	290	aprobado	2025-11-25 09:42:00	8
21793	764	290	aprobado	2025-02-16 16:46:00	1
21794	765	290	aprobado	2025-03-24 11:07:00	2
21795	766	290	por evaluar	\N	\N
21796	767	290	por evaluar	\N	\N
21797	768	290	aprobado	2025-03-24 11:07:00	2
21798	769	290	por evaluar	\N	\N
21799	770	290	por evaluar	\N	\N
21800	771	290	aprobado	2026-03-24 08:35:00	9
21801	772	290	por evaluar	\N	\N
21802	773	290	aprobado	2025-06-21 10:35:00	3
21803	774	290	aprobado	2026-03-24 08:35:00	9
21804	775	290	por evaluar	\N	\N
21805	776	290	aprobado	2025-11-25 19:26:00	10
21806	777	290	por evaluar	\N	\N
21807	778	290	aprobado	2025-06-02 19:01:00	4
21808	779	290	aprobado	2025-12-16 20:44:00	5
21809	780	290	aprobado	2025-04-24 00:12:00	5
21810	781	290	aprobado	2025-12-16 20:43:00	5
21811	782	290	aprobado	2025-12-16 20:43:00	5
21812	783	290	por evaluar	\N	\N
21813	784	290	por evaluar	\N	\N
21814	785	290	por evaluar	\N	\N
21815	786	290	por evaluar	\N	\N
21816	787	290	aprobado	2026-03-16 18:32:00	11
21817	788	290	aprobado	2025-11-26 17:17:00	11
21818	789	290	aprobado	2026-03-16 18:32:00	11
21819	790	290	aprobado	2025-11-26 17:17:00	11
21820	791	290	por evaluar	\N	\N
21821	792	290	por evaluar	\N	\N
21822	793	290	por evaluar	\N	\N
21823	794	290	por evaluar	\N	\N
21824	795	290	por evaluar	\N	\N
21825	796	290	por evaluar	\N	\N
21826	797	290	aprobado	2025-11-28 11:42:00	6
21827	798	290	por evaluar	\N	\N
21828	799	290	aprobado	2025-11-28 09:20:00	1
21829	800	290	aprobado	2025-11-28 09:20:00	1
21830	801	290	por evaluar	\N	\N
21831	802	290	aprobado	2025-11-28 09:20:00	1
21832	803	290	por evaluar	\N	\N
21833	804	290	aprobado	2025-07-23 11:29:00	12
21834	805	290	por evaluar	\N	\N
21835	806	290	aprobado	2025-06-19 07:34:00	1
21836	807	290	por evaluar	\N	\N
21837	808	290	aprobado	2025-11-28 09:18:00	1
21838	809	290	por evaluar	\N	\N
21839	810	290	aprobado	2025-11-28 09:18:00	1
21840	811	290	por evaluar	\N	\N
21841	812	290	por evaluar	\N	\N
21842	813	290	por evaluar	\N	\N
21843	814	290	por evaluar	\N	\N
21844	815	290	por evaluar	\N	\N
21845	816	290	aprobado	2025-05-25 15:25:00	6
21846	817	290	aprobado	2025-11-28 09:24:00	1
21847	818	290	aprobado	2025-07-23 11:27:00	1
21848	819	290	por evaluar	\N	\N
21849	820	290	aprobado	2025-07-23 11:25:00	1
21850	821	290	por evaluar	\N	\N
21851	822	290	aprobado	2025-12-15 09:40:00	1
21852	823	290	por evaluar	\N	\N
21853	824	290	por evaluar	\N	\N
21854	825	290	por evaluar	\N	\N
21855	826	290	aprobado	2025-12-15 17:46:00	7
21856	827	290	aprobado	2025-04-30 18:28:00	7
21857	828	290	aprobado	2025-12-15 17:31:00	7
21858	829	290	aprobado	2025-12-05 09:44:00	7
21859	830	290	aprobado	2025-12-01 11:02:00	13
21860	831	290	aprobado	2025-12-01 11:03:00	13
21861	832	290	aprobado	2025-12-01 11:03:00	13
21862	833	290	aprobado	2025-12-01 11:02:00	13
21863	759	291	por evaluar	\N	\N
21864	760	291	aprobado	2025-11-25 10:01:00	8
21865	761	291	aprobado	2025-11-25 10:01:00	8
21866	762	291	aprobado	2025-11-25 10:01:00	8
21867	763	291	aprobado	2025-11-25 10:01:00	8
21868	764	291	aprobado	2025-02-16 16:46:00	1
21869	765	291	aprobado	2025-03-24 11:07:00	2
21870	766	291	por evaluar	\N	\N
21871	767	291	por evaluar	\N	\N
21872	768	291	aprobado	2025-03-24 11:07:00	2
21873	769	291	por evaluar	\N	\N
21874	770	291	por evaluar	\N	\N
21875	771	291	aprobado	2026-03-24 08:35:00	9
21876	772	291	por evaluar	\N	\N
21877	773	291	aprobado	2025-06-21 10:35:00	3
21878	774	291	aprobado	2026-03-24 08:35:00	9
21879	775	291	por evaluar	\N	\N
21880	776	291	aprobado	2025-11-25 19:26:00	10
21881	777	291	por evaluar	\N	\N
21882	778	291	aprobado	2025-06-02 19:01:00	4
21883	779	291	aprobado	2025-12-16 20:44:00	5
21884	780	291	aprobado	2025-04-24 00:12:00	5
21885	781	291	aprobado	2025-12-16 20:43:00	5
21886	782	291	aprobado	2025-12-16 20:43:00	5
21887	783	291	por evaluar	\N	\N
21888	784	291	por evaluar	\N	\N
21889	785	291	por evaluar	\N	\N
21890	786	291	por evaluar	\N	\N
21891	787	291	aprobado	2026-03-16 18:32:00	11
21892	788	291	aprobado	2025-11-26 17:46:00	11
21893	789	291	aprobado	2026-03-16 18:32:00	11
21894	790	291	aprobado	2025-11-26 17:45:00	11
21895	791	291	por evaluar	\N	\N
21896	792	291	por evaluar	\N	\N
21897	793	291	por evaluar	\N	\N
21898	794	291	por evaluar	\N	\N
21899	795	291	por evaluar	\N	\N
21900	796	291	por evaluar	\N	\N
21901	797	291	aprobado	2025-11-28 11:42:00	6
21902	798	291	por evaluar	\N	\N
21903	799	291	aprobado	2025-11-28 09:20:00	1
21904	800	291	aprobado	2025-11-28 09:20:00	1
21905	801	291	por evaluar	\N	\N
21906	802	291	aprobado	2025-11-28 09:20:00	1
21907	803	291	por evaluar	\N	\N
21908	804	291	aprobado	2025-07-23 11:29:00	12
21909	805	291	por evaluar	\N	\N
21910	806	291	aprobado	2025-06-19 07:34:00	1
21911	807	291	por evaluar	\N	\N
21912	808	291	aprobado	2025-11-28 09:18:00	1
21913	809	291	por evaluar	\N	\N
21914	810	291	aprobado	2025-11-28 09:18:00	1
21915	811	291	por evaluar	\N	\N
21916	812	291	por evaluar	\N	\N
21917	813	291	por evaluar	\N	\N
21918	814	291	por evaluar	\N	\N
21919	815	291	por evaluar	\N	\N
21920	816	291	aprobado	2025-05-25 15:25:00	6
21921	817	291	aprobado	2025-11-28 09:24:00	1
21922	818	291	aprobado	2025-07-23 11:27:00	1
21923	819	291	por evaluar	\N	\N
21924	820	291	aprobado	2025-07-23 11:25:00	1
21925	821	291	por evaluar	\N	\N
21926	822	291	aprobado	2025-12-15 09:40:00	1
21927	823	291	por evaluar	\N	\N
21928	824	291	por evaluar	\N	\N
21929	825	291	por evaluar	\N	\N
21930	826	291	aprobado	2025-12-15 17:46:00	7
21931	827	291	aprobado	2025-04-30 18:28:00	7
21932	828	291	aprobado	2025-12-15 17:31:00	7
21933	829	291	aprobado	2025-12-05 09:44:00	7
21934	830	291	aprobado	2025-12-01 11:00:00	13
21935	831	291	aprobado	2025-12-01 11:00:00	13
21936	832	291	aprobado	2025-12-01 11:01:00	13
21937	833	291	aprobado	2025-12-01 11:00:00	13
21938	759	292	por evaluar	\N	\N
21939	760	292	aprobado	2025-12-09 08:31:00	8
21940	761	292	aprobado	2025-12-09 08:31:00	8
21941	762	292	aprobado	2025-12-09 08:31:00	8
21942	763	292	aprobado	2025-12-09 08:31:00	8
21943	764	292	aprobado	2025-02-16 16:46:00	1
21944	765	292	aprobado	2025-03-24 11:07:00	2
21945	766	292	por evaluar	\N	\N
21946	767	292	por evaluar	\N	\N
21947	768	292	aprobado	2025-03-24 11:07:00	2
21948	769	292	por evaluar	\N	\N
21949	770	292	por evaluar	\N	\N
21950	771	292	aprobado	2026-03-24 08:35:00	9
21951	772	292	por evaluar	\N	\N
21952	773	292	aprobado	2025-06-21 10:35:00	3
21953	774	292	aprobado	2026-03-24 08:35:00	9
21954	775	292	por evaluar	\N	\N
21955	776	292	aprobado	2025-12-04 09:03:00	10
21956	777	292	por evaluar	\N	\N
21957	778	292	aprobado	2025-06-02 19:01:00	4
21958	779	292	aprobado	2025-12-16 20:44:00	5
21959	780	292	aprobado	2025-04-24 00:12:00	5
21960	781	292	aprobado	2025-12-16 20:43:00	5
21961	782	292	aprobado	2025-12-16 20:43:00	5
21962	783	292	por evaluar	\N	\N
21963	784	292	por evaluar	\N	\N
21964	785	292	por evaluar	\N	\N
21965	786	292	por evaluar	\N	\N
21966	787	292	aprobado	2026-03-16 18:32:00	11
21967	788	292	aprobado	2025-12-11 13:18:00	11
21968	789	292	aprobado	2026-03-16 18:32:00	11
21969	790	292	aprobado	2025-12-11 13:18:00	11
21970	791	292	por evaluar	\N	\N
21971	792	292	por evaluar	\N	\N
21972	793	292	por evaluar	\N	\N
21973	794	292	por evaluar	\N	\N
21974	795	292	por evaluar	\N	\N
21975	796	292	por evaluar	\N	\N
21976	797	292	aprobado	2025-12-04 13:36:00	6
21977	798	292	por evaluar	\N	\N
21978	799	292	aprobado	2025-12-04 17:03:00	1
21979	800	292	aprobado	2025-12-04 17:03:00	1
21980	801	292	por evaluar	\N	\N
21981	802	292	aprobado	2025-12-04 17:03:00	1
21982	803	292	por evaluar	\N	\N
21983	804	292	aprobado	2025-07-23 11:29:00	12
21984	805	292	por evaluar	\N	\N
21985	806	292	aprobado	2025-06-19 07:34:00	1
21986	807	292	por evaluar	\N	\N
21987	808	292	aprobado	2025-12-18 11:21:00	1
21988	809	292	por evaluar	\N	\N
21989	810	292	aprobado	2025-12-18 11:21:00	1
21990	811	292	por evaluar	\N	\N
21991	812	292	por evaluar	\N	\N
21992	813	292	por evaluar	\N	\N
21993	814	292	por evaluar	\N	\N
21994	815	292	por evaluar	\N	\N
21995	816	292	aprobado	2025-05-25 15:25:00	6
21996	817	292	aprobado	2025-12-18 11:22:00	1
21997	818	292	aprobado	2025-07-23 11:27:00	1
21998	819	292	por evaluar	\N	\N
21999	820	292	aprobado	2025-07-23 11:25:00	1
22000	821	292	por evaluar	\N	\N
22001	822	292	aprobado	2025-12-15 09:40:00	1
22002	823	292	por evaluar	\N	\N
22003	824	292	por evaluar	\N	\N
22004	825	292	por evaluar	\N	\N
22005	826	292	aprobado	2025-12-15 17:46:00	7
22006	827	292	aprobado	2025-04-30 18:28:00	7
22007	828	292	aprobado	2025-12-15 17:31:00	7
22008	829	292	aprobado	2025-12-05 09:44:00	7
22009	830	292	aprobado	2025-12-08 18:16:00	13
22010	831	292	aprobado	2025-12-08 18:16:00	13
22011	832	292	aprobado	2025-12-08 18:17:00	13
22012	833	292	aprobado	2025-12-08 18:16:00	13
22013	759	293	por evaluar	\N	\N
22014	760	293	aprobado	2025-11-25 09:43:00	8
22015	761	293	aprobado	2025-11-25 09:43:00	8
22016	762	293	aprobado	2025-11-25 09:43:00	8
22017	763	293	aprobado	2025-11-25 09:43:00	8
22018	764	293	aprobado	2025-02-16 16:46:00	1
22019	765	293	aprobado	2025-03-24 11:07:00	2
22020	766	293	por evaluar	\N	\N
22021	767	293	por evaluar	\N	\N
22022	768	293	aprobado	2025-03-24 11:07:00	2
22023	769	293	por evaluar	\N	\N
22024	770	293	por evaluar	\N	\N
22025	771	293	aprobado	2026-03-24 08:35:00	9
22026	772	293	por evaluar	\N	\N
22027	773	293	aprobado	2025-06-21 10:35:00	3
22028	774	293	aprobado	2026-03-24 08:35:00	9
22029	775	293	por evaluar	\N	\N
22030	776	293	aprobado	2025-11-25 19:26:00	10
22031	777	293	por evaluar	\N	\N
22032	778	293	aprobado	2025-06-02 19:01:00	4
22033	779	293	aprobado	2025-12-16 20:44:00	5
22034	780	293	aprobado	2025-04-24 00:12:00	5
22035	781	293	aprobado	2025-12-16 20:43:00	5
22036	782	293	aprobado	2025-12-16 20:43:00	5
22037	783	293	por evaluar	\N	\N
22038	784	293	por evaluar	\N	\N
22039	785	293	por evaluar	\N	\N
22040	786	293	por evaluar	\N	\N
22041	787	293	aprobado	2026-03-16 18:32:00	11
22042	788	293	aprobado	2025-11-26 17:17:00	11
22043	789	293	aprobado	2026-03-16 18:32:00	11
22044	790	293	aprobado	2025-11-26 17:17:00	11
22045	791	293	por evaluar	\N	\N
22046	792	293	por evaluar	\N	\N
22047	793	293	por evaluar	\N	\N
22048	794	293	por evaluar	\N	\N
22049	795	293	por evaluar	\N	\N
22050	796	293	por evaluar	\N	\N
22051	797	293	aprobado	2025-11-28 11:42:00	6
22052	798	293	por evaluar	\N	\N
22053	799	293	aprobado	2025-11-28 09:20:00	1
22054	800	293	aprobado	2025-11-28 09:20:00	1
22055	801	293	por evaluar	\N	\N
22056	802	293	aprobado	2025-11-28 09:20:00	1
22057	803	293	por evaluar	\N	\N
22058	804	293	aprobado	2025-07-23 11:29:00	12
22059	805	293	por evaluar	\N	\N
22060	806	293	aprobado	2025-06-19 07:34:00	1
22061	807	293	por evaluar	\N	\N
22062	808	293	aprobado	2025-11-28 09:18:00	1
22063	809	293	por evaluar	\N	\N
22064	810	293	aprobado	2025-11-28 09:18:00	1
22065	811	293	por evaluar	\N	\N
22066	812	293	por evaluar	\N	\N
22067	813	293	por evaluar	\N	\N
22068	814	293	por evaluar	\N	\N
22069	815	293	por evaluar	\N	\N
22070	816	293	aprobado	2025-05-25 15:25:00	6
22071	817	293	aprobado	2025-11-28 09:24:00	1
22072	818	293	aprobado	2025-07-23 11:27:00	1
22073	819	293	por evaluar	\N	\N
22074	820	293	aprobado	2025-07-23 11:25:00	1
22075	821	293	por evaluar	\N	\N
22076	822	293	aprobado	2025-12-15 09:42:00	1
22077	823	293	por evaluar	\N	\N
22078	824	293	por evaluar	\N	\N
22079	825	293	por evaluar	\N	\N
22080	826	293	aprobado	2025-12-15 17:46:00	7
22081	827	293	aprobado	2025-04-30 18:28:00	7
22082	828	293	aprobado	2025-12-15 17:31:00	7
22083	829	293	aprobado	2025-12-05 09:44:00	7
22084	830	293	aprobado	2025-12-01 11:02:00	13
22085	831	293	aprobado	2025-12-01 11:03:00	13
22086	832	293	aprobado	2025-12-01 11:03:00	13
22087	833	293	aprobado	2025-12-01 11:02:00	13
22088	759	294	por evaluar	\N	\N
22089	760	294	aprobado	2025-11-25 10:03:00	8
22090	761	294	aprobado	2025-11-25 10:03:00	8
22091	762	294	aprobado	2025-11-25 10:03:00	8
22092	763	294	aprobado	2025-11-25 10:03:00	8
22093	764	294	aprobado	2025-02-16 16:46:00	1
22094	765	294	aprobado	2025-03-24 11:07:00	2
22095	766	294	por evaluar	\N	\N
22096	767	294	por evaluar	\N	\N
22097	768	294	aprobado	2025-03-24 11:07:00	2
22098	769	294	por evaluar	\N	\N
22099	770	294	por evaluar	\N	\N
22100	771	294	aprobado	2026-03-24 08:35:00	9
22101	772	294	por evaluar	\N	\N
22102	773	294	aprobado	2025-06-21 10:35:00	3
22103	774	294	aprobado	2026-03-24 08:35:00	9
22104	775	294	por evaluar	\N	\N
22105	776	294	aprobado	2025-11-25 19:26:00	10
22106	777	294	por evaluar	\N	\N
22107	778	294	aprobado	2025-06-02 19:01:00	4
22108	779	294	aprobado	2025-12-16 20:44:00	5
22109	780	294	aprobado	2025-04-24 00:12:00	5
22110	781	294	aprobado	2025-12-16 20:43:00	5
22111	782	294	aprobado	2025-12-16 20:43:00	5
22112	783	294	por evaluar	\N	\N
22113	784	294	por evaluar	\N	\N
22114	785	294	por evaluar	\N	\N
22115	786	294	por evaluar	\N	\N
22116	787	294	aprobado	2026-03-16 18:32:00	11
22117	788	294	aprobado	2025-11-26 17:11:00	11
22118	789	294	aprobado	2026-03-16 18:32:00	11
22119	790	294	aprobado	2025-11-26 17:11:00	11
22120	791	294	por evaluar	\N	\N
22121	792	294	por evaluar	\N	\N
22122	793	294	por evaluar	\N	\N
22123	794	294	por evaluar	\N	\N
22124	795	294	por evaluar	\N	\N
22125	796	294	por evaluar	\N	\N
22126	797	294	aprobado	2025-11-28 11:42:00	6
22127	798	294	por evaluar	\N	\N
22128	799	294	aprobado	2025-11-28 09:20:00	1
22129	800	294	aprobado	2025-11-28 09:20:00	1
22130	801	294	por evaluar	\N	\N
22131	802	294	aprobado	2025-11-28 09:20:00	1
22132	803	294	por evaluar	\N	\N
22133	804	294	aprobado	2025-07-23 11:29:00	12
22134	805	294	por evaluar	\N	\N
22135	806	294	aprobado	2025-06-19 07:34:00	1
22136	807	294	por evaluar	\N	\N
22137	808	294	aprobado	2025-11-28 09:18:00	1
22138	809	294	por evaluar	\N	\N
22139	810	294	aprobado	2025-11-28 09:18:00	1
22140	811	294	por evaluar	\N	\N
22141	812	294	por evaluar	\N	\N
22142	813	294	por evaluar	\N	\N
22143	814	294	por evaluar	\N	\N
22144	815	294	por evaluar	\N	\N
22145	816	294	aprobado	2025-05-25 15:25:00	6
22146	817	294	aprobado	2025-11-28 09:24:00	1
22147	818	294	aprobado	2025-07-23 11:27:00	1
22148	819	294	por evaluar	\N	\N
22149	820	294	aprobado	2025-07-23 11:25:00	1
22150	821	294	por evaluar	\N	\N
22151	822	294	aprobado	2025-12-15 09:40:00	1
22152	823	294	por evaluar	\N	\N
22153	824	294	por evaluar	\N	\N
22154	825	294	por evaluar	\N	\N
22155	826	294	aprobado	2025-12-15 17:46:00	7
22156	827	294	aprobado	2025-04-30 18:28:00	7
22157	828	294	aprobado	2025-12-15 17:31:00	7
22158	829	294	aprobado	2025-12-05 09:44:00	7
22159	830	294	aprobado	2025-12-01 11:05:00	13
22160	831	294	aprobado	2025-12-01 11:06:00	13
22161	832	294	aprobado	2025-12-01 11:06:00	13
22162	833	294	aprobado	2025-12-01 11:05:00	13
22163	759	295	por evaluar	\N	\N
22164	760	295	aprobado	2025-11-25 09:47:00	8
22165	761	295	aprobado	2025-11-25 09:47:00	8
22166	762	295	aprobado	2025-11-25 09:47:00	8
22167	763	295	aprobado	2025-11-25 09:47:00	8
22168	764	295	aprobado	2025-02-16 16:46:00	1
22169	765	295	aprobado	2025-03-24 11:07:00	2
22170	766	295	por evaluar	\N	\N
22171	767	295	por evaluar	\N	\N
22172	768	295	aprobado	2025-03-24 11:07:00	2
22173	769	295	por evaluar	\N	\N
22174	770	295	por evaluar	\N	\N
22175	771	295	aprobado	2026-03-24 08:35:00	9
22176	772	295	por evaluar	\N	\N
22177	773	295	aprobado	2025-06-21 10:35:00	3
22178	774	295	aprobado	2026-03-24 08:35:00	9
22179	775	295	por evaluar	\N	\N
22180	776	295	aprobado	2025-11-25 19:26:00	10
22181	777	295	por evaluar	\N	\N
22182	778	295	aprobado	2025-06-02 19:01:00	4
22183	779	295	aprobado	2025-12-16 20:44:00	5
22184	780	295	aprobado	2025-04-24 00:12:00	5
22185	781	295	aprobado	2025-12-16 20:43:00	5
22186	782	295	aprobado	2025-12-16 20:43:00	5
22187	783	295	por evaluar	\N	\N
22188	784	295	por evaluar	\N	\N
22189	785	295	por evaluar	\N	\N
22190	786	295	por evaluar	\N	\N
22191	787	295	aprobado	2026-03-16 18:32:00	11
22192	788	295	aprobado	2025-11-26 17:17:00	11
22193	789	295	aprobado	2026-03-16 18:32:00	11
22194	790	295	aprobado	2025-11-26 17:17:00	11
22195	791	295	por evaluar	\N	\N
22196	792	295	por evaluar	\N	\N
22197	793	295	por evaluar	\N	\N
22198	794	295	por evaluar	\N	\N
22199	795	295	por evaluar	\N	\N
22200	796	295	por evaluar	\N	\N
22201	797	295	aprobado	2025-11-28 11:42:00	6
22202	798	295	por evaluar	\N	\N
22203	799	295	aprobado	2025-11-28 09:20:00	1
22204	800	295	aprobado	2025-11-28 09:20:00	1
22205	801	295	por evaluar	\N	\N
22206	802	295	aprobado	2025-11-28 09:20:00	1
22207	803	295	por evaluar	\N	\N
22208	804	295	aprobado	2025-07-23 11:29:00	12
22209	805	295	por evaluar	\N	\N
22210	806	295	aprobado	2025-06-19 07:34:00	1
22211	807	295	por evaluar	\N	\N
22212	808	295	aprobado	2025-11-28 09:18:00	1
22213	809	295	por evaluar	\N	\N
22214	810	295	aprobado	2025-11-28 09:18:00	1
22215	811	295	por evaluar	\N	\N
22216	812	295	por evaluar	\N	\N
22217	813	295	por evaluar	\N	\N
22218	814	295	por evaluar	\N	\N
22219	815	295	por evaluar	\N	\N
22220	816	295	aprobado	2025-05-25 15:25:00	6
22221	817	295	aprobado	2025-11-28 09:24:00	1
22222	818	295	aprobado	2025-07-23 11:27:00	1
22223	819	295	por evaluar	\N	\N
22224	820	295	aprobado	2025-07-23 11:25:00	1
22225	821	295	por evaluar	\N	\N
22226	822	295	aprobado	2025-12-15 09:40:00	1
22227	823	295	por evaluar	\N	\N
22228	824	295	por evaluar	\N	\N
22229	825	295	por evaluar	\N	\N
22230	826	295	aprobado	2025-12-15 17:46:00	7
22231	827	295	aprobado	2025-04-30 18:28:00	7
22232	828	295	aprobado	2025-12-15 17:31:00	7
22233	829	295	aprobado	2025-12-05 09:44:00	7
22234	830	295	aprobado	2025-12-01 10:58:00	13
22235	831	295	aprobado	2025-12-01 10:58:00	13
22236	832	295	aprobado	2025-12-01 10:58:00	13
22237	833	295	aprobado	2025-12-01 10:57:00	13
22238	759	296	por evaluar	\N	\N
22239	760	296	aprobado	2025-11-25 09:52:00	8
22240	761	296	aprobado	2025-11-25 09:52:00	8
22241	762	296	aprobado	2025-11-25 09:52:00	8
22242	763	296	aprobado	2025-11-25 09:52:00	8
22243	764	296	aprobado	2025-02-16 16:46:00	1
22244	765	296	aprobado	2025-03-24 11:07:00	2
22245	766	296	por evaluar	\N	\N
22246	767	296	por evaluar	\N	\N
22247	768	296	aprobado	2025-03-24 11:07:00	2
22248	769	296	por evaluar	\N	\N
22249	770	296	por evaluar	\N	\N
22250	771	296	aprobado	2026-03-24 08:35:00	9
22251	772	296	por evaluar	\N	\N
22252	773	296	aprobado	2025-06-21 10:35:00	3
22253	774	296	aprobado	2026-03-24 08:35:00	9
22254	775	296	por evaluar	\N	\N
22255	776	296	aprobado	2025-11-25 19:26:00	10
22256	777	296	por evaluar	\N	\N
22257	778	296	aprobado	2025-06-02 19:01:00	4
22258	779	296	aprobado	2025-12-16 20:44:00	5
22259	780	296	aprobado	2025-04-24 00:12:00	5
22260	781	296	aprobado	2025-12-16 20:43:00	5
22261	782	296	aprobado	2025-12-16 20:43:00	5
22262	783	296	por evaluar	\N	\N
22263	784	296	por evaluar	\N	\N
22264	785	296	por evaluar	\N	\N
22265	786	296	por evaluar	\N	\N
22266	787	296	aprobado	2026-03-16 18:32:00	11
22267	788	296	aprobado	2025-11-26 17:17:00	11
22268	789	296	aprobado	2026-03-16 18:32:00	11
22269	790	296	aprobado	2025-11-26 17:17:00	11
22270	791	296	por evaluar	\N	\N
22271	792	296	por evaluar	\N	\N
22272	793	296	por evaluar	\N	\N
22273	794	296	por evaluar	\N	\N
22274	795	296	por evaluar	\N	\N
22275	796	296	por evaluar	\N	\N
22276	797	296	aprobado	2025-11-28 11:42:00	6
22277	798	296	por evaluar	\N	\N
22278	799	296	aprobado	2025-11-28 09:20:00	1
22279	800	296	aprobado	2025-11-28 09:20:00	1
22280	801	296	por evaluar	\N	\N
22281	802	296	aprobado	2025-11-28 09:20:00	1
22282	803	296	por evaluar	\N	\N
22283	804	296	aprobado	2025-07-23 11:29:00	12
22284	805	296	por evaluar	\N	\N
22285	806	296	aprobado	2025-06-19 07:34:00	1
22286	807	296	por evaluar	\N	\N
22287	808	296	aprobado	2025-11-28 09:18:00	1
22288	809	296	por evaluar	\N	\N
22289	810	296	aprobado	2025-11-28 09:18:00	1
22290	811	296	por evaluar	\N	\N
22291	812	296	por evaluar	\N	\N
22292	813	296	por evaluar	\N	\N
22293	814	296	por evaluar	\N	\N
22294	815	296	por evaluar	\N	\N
22295	816	296	aprobado	2025-05-25 15:25:00	6
22296	817	296	aprobado	2025-11-28 09:24:00	1
22297	818	296	aprobado	2025-07-23 11:27:00	1
22298	819	296	por evaluar	\N	\N
22299	820	296	aprobado	2025-07-23 11:25:00	1
22300	821	296	por evaluar	\N	\N
22301	822	296	aprobado	2025-12-15 09:40:00	1
22302	823	296	por evaluar	\N	\N
22303	824	296	por evaluar	\N	\N
22304	825	296	por evaluar	\N	\N
22305	826	296	aprobado	2025-12-15 17:46:00	7
22306	827	296	aprobado	2025-04-30 18:28:00	7
22307	828	296	aprobado	2025-12-15 17:31:00	7
22308	829	296	aprobado	2025-12-05 09:44:00	7
22309	830	296	aprobado	2025-12-01 09:45:00	13
22310	831	296	aprobado	2025-12-01 09:45:00	13
22311	832	296	aprobado	2025-12-01 09:45:00	13
22312	833	296	aprobado	2025-12-01 09:44:00	13
22313	759	297	por evaluar	\N	\N
22314	760	297	aprobado	2025-11-25 09:54:00	8
22315	761	297	aprobado	2025-11-25 09:54:00	8
22316	762	297	aprobado	2025-11-25 09:54:00	8
22317	763	297	aprobado	2025-11-25 09:54:00	8
22318	764	297	aprobado	2025-02-16 16:46:00	1
22319	765	297	aprobado	2025-03-24 11:07:00	2
22320	766	297	por evaluar	\N	\N
22321	767	297	por evaluar	\N	\N
22322	768	297	aprobado	2025-03-24 11:07:00	2
22323	769	297	por evaluar	\N	\N
22324	770	297	por evaluar	\N	\N
22325	771	297	aprobado	2026-03-24 08:35:00	9
22326	772	297	por evaluar	\N	\N
22327	773	297	aprobado	2025-06-21 10:35:00	3
22328	774	297	aprobado	2026-03-24 08:35:00	9
22329	775	297	por evaluar	\N	\N
22330	776	297	aprobado	2025-11-25 19:26:00	10
22331	777	297	por evaluar	\N	\N
22332	778	297	aprobado	2025-06-02 19:01:00	4
22333	779	297	aprobado	2025-12-16 20:44:00	5
22334	780	297	aprobado	2025-04-24 00:12:00	5
22335	781	297	aprobado	2025-12-16 20:43:00	5
22336	782	297	aprobado	2025-12-16 20:43:00	5
22337	783	297	por evaluar	\N	\N
22338	784	297	por evaluar	\N	\N
22339	785	297	por evaluar	\N	\N
22340	786	297	por evaluar	\N	\N
22341	787	297	aprobado	2026-03-16 18:32:00	11
22342	788	297	aprobado	2025-11-26 17:49:00	11
22343	789	297	aprobado	2026-03-16 18:32:00	11
22344	790	297	aprobado	2025-11-26 17:50:00	11
22345	791	297	por evaluar	\N	\N
22346	792	297	por evaluar	\N	\N
22347	793	297	por evaluar	\N	\N
22348	794	297	por evaluar	\N	\N
22349	795	297	por evaluar	\N	\N
22350	796	297	por evaluar	\N	\N
22351	797	297	aprobado	2025-11-28 11:42:00	6
22352	798	297	por evaluar	\N	\N
22353	799	297	aprobado	2025-11-28 09:20:00	1
22354	800	297	aprobado	2025-11-28 09:20:00	1
22355	801	297	por evaluar	\N	\N
22356	802	297	aprobado	2025-11-28 09:20:00	1
22357	803	297	por evaluar	\N	\N
22358	804	297	aprobado	2025-07-23 11:29:00	12
22359	805	297	por evaluar	\N	\N
22360	806	297	aprobado	2025-06-19 07:34:00	1
22361	807	297	por evaluar	\N	\N
22362	808	297	aprobado	2025-11-28 09:18:00	1
22363	809	297	por evaluar	\N	\N
22364	810	297	aprobado	2025-11-28 09:18:00	1
22365	811	297	por evaluar	\N	\N
22366	812	297	por evaluar	\N	\N
22367	813	297	por evaluar	\N	\N
22368	814	297	por evaluar	\N	\N
22369	815	297	por evaluar	\N	\N
22370	816	297	aprobado	2025-05-25 15:25:00	6
22371	817	297	aprobado	2025-11-28 09:24:00	1
22372	818	297	aprobado	2025-07-23 11:27:00	1
22373	819	297	por evaluar	\N	\N
22374	820	297	aprobado	2025-07-23 11:25:00	1
22375	821	297	por evaluar	\N	\N
22376	822	297	aprobado	2025-12-15 09:40:00	1
22377	823	297	por evaluar	\N	\N
22378	824	297	por evaluar	\N	\N
22379	825	297	por evaluar	\N	\N
22380	826	297	aprobado	2025-12-15 17:46:00	7
22381	827	297	aprobado	2025-04-30 18:28:00	7
22382	828	297	aprobado	2025-12-15 17:31:00	7
22383	829	297	aprobado	2025-12-05 09:44:00	7
22384	830	297	aprobado	2025-12-01 09:45:00	13
22385	831	297	aprobado	2025-12-01 09:45:00	13
22386	832	297	aprobado	2025-12-01 09:45:00	13
22387	833	297	aprobado	2025-12-01 09:44:00	13
22388	759	298	por evaluar	\N	\N
22389	760	298	aprobado	2025-11-25 09:49:00	8
22390	761	298	aprobado	2025-11-25 09:49:00	8
22391	762	298	aprobado	2025-11-25 09:49:00	8
22392	763	298	aprobado	2025-11-25 09:49:00	8
22393	764	298	aprobado	2025-02-16 16:46:00	1
22394	765	298	aprobado	2025-03-24 11:07:00	2
22395	766	298	por evaluar	\N	\N
22396	767	298	por evaluar	\N	\N
22397	768	298	aprobado	2025-03-24 11:07:00	2
22398	769	298	por evaluar	\N	\N
22399	770	298	por evaluar	\N	\N
22400	771	298	aprobado	2026-03-24 08:35:00	9
22401	772	298	por evaluar	\N	\N
22402	773	298	aprobado	2025-06-21 10:35:00	3
22403	774	298	aprobado	2026-03-24 08:35:00	9
22404	775	298	por evaluar	\N	\N
22405	776	298	aprobado	2025-11-25 19:26:00	10
22406	777	298	por evaluar	\N	\N
22407	778	298	aprobado	2025-06-02 19:01:00	4
22408	779	298	aprobado	2025-12-16 20:44:00	5
22409	780	298	aprobado	2025-04-24 00:12:00	5
22410	781	298	aprobado	2025-12-16 20:43:00	5
22411	782	298	aprobado	2025-12-16 20:43:00	5
22412	783	298	por evaluar	\N	\N
22413	784	298	por evaluar	\N	\N
22414	785	298	por evaluar	\N	\N
22415	786	298	por evaluar	\N	\N
22416	787	298	aprobado	2026-03-16 18:32:00	11
22417	788	298	aprobado	2025-11-26 17:48:00	11
22418	789	298	aprobado	2026-03-16 18:32:00	11
22419	790	298	aprobado	2025-11-26 17:48:00	11
22420	791	298	por evaluar	\N	\N
22421	792	298	por evaluar	\N	\N
22422	793	298	por evaluar	\N	\N
22423	794	298	por evaluar	\N	\N
22424	795	298	por evaluar	\N	\N
22425	796	298	por evaluar	\N	\N
22426	797	298	aprobado	2025-11-28 11:42:00	6
22427	798	298	por evaluar	\N	\N
22428	799	298	aprobado	2025-11-28 09:20:00	1
22429	800	298	aprobado	2025-11-28 09:20:00	1
22430	801	298	por evaluar	\N	\N
22431	802	298	aprobado	2025-11-28 09:20:00	1
22432	803	298	por evaluar	\N	\N
22433	804	298	aprobado	2025-07-23 11:29:00	12
22434	805	298	por evaluar	\N	\N
22435	806	298	aprobado	2025-06-19 07:34:00	1
22436	807	298	por evaluar	\N	\N
22437	808	298	aprobado	2025-11-28 09:18:00	1
22438	809	298	por evaluar	\N	\N
22439	810	298	aprobado	2025-11-28 09:18:00	1
22440	811	298	por evaluar	\N	\N
22441	812	298	por evaluar	\N	\N
22442	813	298	por evaluar	\N	\N
22443	814	298	por evaluar	\N	\N
22444	815	298	por evaluar	\N	\N
22445	816	298	aprobado	2025-05-25 15:25:00	6
22446	817	298	aprobado	2025-11-28 09:24:00	1
22447	818	298	aprobado	2025-07-23 11:27:00	1
22448	819	298	por evaluar	\N	\N
22449	820	298	aprobado	2025-07-23 11:25:00	1
22450	821	298	por evaluar	\N	\N
22451	822	298	aprobado	2025-12-15 09:43:00	1
22452	823	298	por evaluar	\N	\N
22453	824	298	por evaluar	\N	\N
22454	825	298	por evaluar	\N	\N
22455	826	298	aprobado	2025-12-15 17:46:00	7
22456	827	298	aprobado	2025-04-30 18:28:00	7
22457	828	298	aprobado	2025-12-15 17:31:00	7
22458	829	298	aprobado	2025-12-05 09:44:00	7
22459	830	298	aprobado	2025-12-01 09:45:00	13
22460	831	298	aprobado	2025-12-01 09:45:00	13
22461	832	298	aprobado	2025-12-01 09:45:00	13
22462	833	298	aprobado	2025-12-01 09:44:00	13
22463	759	299	por evaluar	\N	\N
22464	760	299	por evaluar	\N	\N
22465	761	299	por evaluar	\N	\N
22466	762	299	por evaluar	\N	\N
22467	763	299	por evaluar	\N	\N
22468	764	299	aprobado	2025-02-16 16:46:00	1
22469	765	299	aprobado	2025-03-24 11:07:00	2
22470	766	299	por evaluar	\N	\N
22471	767	299	por evaluar	\N	\N
22472	768	299	aprobado	2025-03-24 11:07:00	2
22473	769	299	por evaluar	\N	\N
22474	770	299	por evaluar	\N	\N
22475	771	299	por evaluar	\N	\N
22476	772	299	por evaluar	\N	\N
22477	773	299	aprobado	2025-06-21 10:35:00	3
22478	774	299	por evaluar	\N	\N
22479	775	299	por evaluar	\N	\N
22480	776	299	por evaluar	\N	\N
22481	777	299	por evaluar	\N	\N
22482	778	299	aprobado	2025-06-02 19:01:00	4
22483	779	299	por evaluar	\N	\N
22484	780	299	aprobado	2025-04-24 00:12:00	5
22485	781	299	por evaluar	\N	\N
22486	782	299	por evaluar	\N	\N
22487	783	299	por evaluar	\N	\N
22488	784	299	por evaluar	\N	\N
22489	785	299	por evaluar	\N	\N
22490	786	299	por evaluar	\N	\N
22491	787	299	por evaluar	\N	\N
22492	788	299	por evaluar	\N	\N
22493	789	299	por evaluar	\N	\N
22494	790	299	por evaluar	\N	\N
22495	791	299	por evaluar	\N	\N
22496	792	299	por evaluar	\N	\N
22497	793	299	por evaluar	\N	\N
22498	794	299	por evaluar	\N	\N
22499	795	299	por evaluar	\N	\N
22500	796	299	por evaluar	\N	\N
22501	797	299	por evaluar	\N	\N
22502	798	299	por evaluar	\N	\N
22503	799	299	por evaluar	\N	\N
22504	800	299	por evaluar	\N	\N
22505	801	299	por evaluar	\N	\N
22506	802	299	por evaluar	\N	\N
22507	803	299	por evaluar	\N	\N
22508	804	299	aprobado	2025-07-23 11:29:00	12
22509	805	299	por evaluar	\N	\N
22510	806	299	aprobado	2025-06-19 07:34:00	1
22511	807	299	por evaluar	\N	\N
22512	808	299	por evaluar	\N	\N
22513	809	299	por evaluar	\N	\N
22514	810	299	por evaluar	\N	\N
22515	811	299	por evaluar	\N	\N
22516	812	299	por evaluar	\N	\N
22517	813	299	por evaluar	\N	\N
22518	814	299	por evaluar	\N	\N
22519	815	299	por evaluar	\N	\N
22520	816	299	aprobado	2025-05-25 15:25:00	6
22521	817	299	por evaluar	\N	\N
22522	818	299	aprobado	2025-07-23 11:27:00	1
22523	819	299	por evaluar	\N	\N
22524	820	299	aprobado	2025-07-23 11:25:00	1
22525	821	299	por evaluar	\N	\N
22526	822	299	por evaluar	\N	\N
22527	823	299	por evaluar	\N	\N
22528	824	299	por evaluar	\N	\N
22529	825	299	por evaluar	\N	\N
22530	826	299	por evaluar	\N	\N
22531	827	299	aprobado	2025-04-30 18:28:00	7
22532	828	299	por evaluar	\N	\N
22533	829	299	por evaluar	\N	\N
22534	830	299	por evaluar	\N	\N
22535	831	299	por evaluar	\N	\N
22536	832	299	por evaluar	\N	\N
22537	833	299	por evaluar	\N	\N
22538	759	300	por evaluar	\N	\N
22539	760	300	aprobado	2025-11-25 10:04:00	8
22540	761	300	aprobado	2025-11-25 10:04:00	8
22541	762	300	aprobado	2025-11-25 10:04:00	8
22542	763	300	aprobado	2025-11-25 10:04:00	8
22543	764	300	aprobado	2025-02-16 16:46:00	1
22544	765	300	aprobado	2025-03-24 11:07:00	2
22545	766	300	por evaluar	\N	\N
22546	767	300	por evaluar	\N	\N
22547	768	300	aprobado	2025-03-24 11:07:00	2
22548	769	300	por evaluar	\N	\N
22549	770	300	por evaluar	\N	\N
22550	771	300	aprobado	2026-03-24 08:35:00	9
22551	772	300	por evaluar	\N	\N
22552	773	300	aprobado	2025-06-21 10:35:00	3
22553	774	300	aprobado	2026-03-24 08:35:00	9
22554	775	300	por evaluar	\N	\N
22555	776	300	aprobado	2025-11-25 19:26:00	10
22556	777	300	por evaluar	\N	\N
22557	778	300	aprobado	2025-06-02 19:01:00	4
22558	779	300	aprobado	2025-12-16 20:44:00	5
22559	780	300	aprobado	2025-04-24 00:12:00	5
22560	781	300	aprobado	2025-12-16 20:43:00	5
22561	782	300	aprobado	2025-12-16 20:43:00	5
22562	783	300	por evaluar	\N	\N
22563	784	300	por evaluar	\N	\N
22564	785	300	por evaluar	\N	\N
22565	786	300	por evaluar	\N	\N
22566	787	300	aprobado	2026-03-16 18:32:00	11
22567	788	300	aprobado	2025-11-26 17:08:00	11
22568	789	300	aprobado	2026-03-16 18:32:00	11
22569	790	300	aprobado	2025-11-26 17:08:00	11
22570	791	300	por evaluar	\N	\N
22571	792	300	por evaluar	\N	\N
22572	793	300	por evaluar	\N	\N
22573	794	300	por evaluar	\N	\N
22574	795	300	por evaluar	\N	\N
22575	796	300	por evaluar	\N	\N
22576	797	300	aprobado	2025-11-28 11:42:00	6
22577	798	300	por evaluar	\N	\N
22578	799	300	aprobado	2025-11-28 09:20:00	1
22579	800	300	aprobado	2025-11-28 09:20:00	1
22580	801	300	por evaluar	\N	\N
22581	802	300	aprobado	2025-11-28 09:20:00	1
22582	803	300	por evaluar	\N	\N
22583	804	300	aprobado	2025-07-23 11:29:00	12
22584	805	300	por evaluar	\N	\N
22585	806	300	aprobado	2025-06-19 07:34:00	1
22586	807	300	por evaluar	\N	\N
22587	808	300	aprobado	2025-11-28 09:18:00	1
22588	809	300	por evaluar	\N	\N
22589	810	300	aprobado	2025-11-28 09:18:00	1
22590	811	300	por evaluar	\N	\N
22591	812	300	por evaluar	\N	\N
22592	813	300	por evaluar	\N	\N
22593	814	300	por evaluar	\N	\N
22594	815	300	por evaluar	\N	\N
22595	816	300	aprobado	2025-05-25 15:25:00	6
22596	817	300	aprobado	2025-11-28 09:24:00	1
22597	818	300	aprobado	2025-07-23 11:27:00	1
22598	819	300	por evaluar	\N	\N
22599	820	300	aprobado	2025-07-23 11:25:00	1
22600	821	300	por evaluar	\N	\N
22601	822	300	aprobado	2025-12-15 09:40:00	1
22602	823	300	por evaluar	\N	\N
22603	824	300	por evaluar	\N	\N
22604	825	300	por evaluar	\N	\N
22605	826	300	aprobado	2025-12-15 17:46:00	7
22606	827	300	aprobado	2025-04-30 18:28:00	7
22607	828	300	aprobado	2025-12-15 17:31:00	7
22608	829	300	aprobado	2025-12-05 09:44:00	7
22609	830	300	aprobado	2025-12-01 11:00:00	13
22610	831	300	aprobado	2025-12-01 11:00:00	13
22611	832	300	aprobado	2025-12-01 11:01:00	13
22612	833	300	aprobado	2025-12-01 11:00:00	13
22613	759	301	por evaluar	\N	\N
22614	760	301	aprobado	2025-11-25 09:57:00	8
22615	761	301	aprobado	2025-11-25 09:57:00	8
22616	762	301	aprobado	2025-11-25 09:57:00	8
22617	763	301	aprobado	2025-11-25 09:57:00	8
22618	764	301	aprobado	2025-02-16 16:46:00	1
22619	765	301	aprobado	2025-03-24 11:07:00	2
22620	766	301	por evaluar	\N	\N
22621	767	301	por evaluar	\N	\N
22622	768	301	aprobado	2025-03-24 11:07:00	2
22623	769	301	por evaluar	\N	\N
22624	770	301	por evaluar	\N	\N
22625	771	301	por evaluar	\N	\N
22626	772	301	por evaluar	\N	\N
22627	773	301	aprobado	2025-06-21 10:35:00	3
22628	774	301	por evaluar	\N	\N
22629	775	301	por evaluar	\N	\N
22630	776	301	aprobado	2025-11-25 19:26:00	10
22631	777	301	por evaluar	\N	\N
22632	778	301	aprobado	2025-06-02 19:01:00	4
22633	779	301	aprobado	2025-12-05 13:57:00	5
22634	780	301	aprobado	2025-04-24 00:12:00	5
22635	781	301	aprobado	2025-12-05 13:57:00	5
22636	782	301	aprobado	2025-12-05 13:57:00	5
22637	783	301	por evaluar	\N	\N
22638	784	301	por evaluar	\N	\N
22639	785	301	por evaluar	\N	\N
22640	786	301	por evaluar	\N	\N
22641	787	301	por evaluar	\N	\N
22642	788	301	aprobado	2025-11-26 17:51:00	11
22643	789	301	por evaluar	\N	\N
22644	790	301	aprobado	2025-11-26 17:51:00	11
22645	791	301	por evaluar	\N	\N
22646	792	301	aprobado	2025-11-25 13:22:00	14
22647	793	301	por evaluar	\N	\N
22648	794	301	por evaluar	\N	\N
22649	795	301	por evaluar	\N	\N
22650	796	301	por evaluar	\N	\N
22651	797	301	aprobado	2025-11-28 11:42:00	6
22652	798	301	por evaluar	\N	\N
22653	799	301	aprobado	2025-11-28 09:20:00	1
22654	800	301	aprobado	2025-11-28 09:20:00	1
22655	801	301	por evaluar	\N	\N
22656	802	301	aprobado	2025-11-28 09:20:00	1
22657	803	301	por evaluar	\N	\N
22658	804	301	aprobado	2025-07-23 11:29:00	12
22659	805	301	por evaluar	\N	\N
22660	806	301	aprobado	2025-06-19 07:34:00	1
22661	807	301	por evaluar	\N	\N
22662	808	301	aprobado	2025-11-28 09:18:00	1
22663	809	301	por evaluar	\N	\N
22664	810	301	aprobado	2025-11-28 09:18:00	1
22665	811	301	por evaluar	\N	\N
22666	812	301	por evaluar	\N	\N
22667	813	301	por evaluar	\N	\N
22668	814	301	por evaluar	\N	\N
22669	815	301	por evaluar	\N	\N
22670	816	301	aprobado	2025-05-25 15:25:00	6
22671	817	301	aprobado	2025-11-28 09:24:00	1
22672	818	301	aprobado	2025-07-23 11:27:00	1
22673	819	301	por evaluar	\N	\N
22674	820	301	aprobado	2025-07-23 11:25:00	1
22675	821	301	por evaluar	\N	\N
22676	822	301	aprobado	2025-12-15 09:40:00	1
22677	823	301	por evaluar	\N	\N
22678	824	301	por evaluar	\N	\N
22679	825	301	por evaluar	\N	\N
22680	826	301	aprobado	2025-12-15 17:46:00	7
22681	827	301	aprobado	2025-04-30 18:28:00	7
22682	828	301	aprobado	2025-12-15 17:31:00	7
22683	829	301	aprobado	2025-12-05 09:44:00	7
22684	830	301	aprobado	2025-12-08 18:16:00	13
22685	831	301	aprobado	2025-12-08 18:16:00	13
22686	832	301	aprobado	2025-12-08 18:17:00	13
22687	833	301	aprobado	2025-12-08 18:16:00	13
\.


--
-- Data for Name: programa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.programa (id_programa, nombre, codigo, version) FROM stdin;
11	ANALISIS Y DESARROLLO DE SOFTWARE.	228118	1
\.


--
-- Data for Name: proyecto_formativo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proyecto_formativo (id_proyecto, codigo_proyecto, nombre, tiempo_ejecucion, regional, centro_formacion, id_programa) FROM stdin;
28	2480542	ANÁLISIS Y DESARROLLO DE SOFTWARE A LA MEDIDA PARA EL SECTOR SERVICIOS EN EL MUNICIPIO DE FLORENCIA	27	REGIONAL CAQUETÁ	CENTRO TECNOLOGICO DE LA AMAZONIA	11
\.


--
-- Data for Name: resultados_aprendizaje; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resultados_aprendizaje (id_resultado, codigo, detalle, id_competencia, codigo_juicio, codigo_proyecto) FROM stdin;
759	590803	APLICAR EN LA RESOLUCIÓN DE PROBLEMAS REALES DEL SECTOR PRODUCTIVO, LOS CONOCIMIENTOS, HABILIDADES Y DESTREZAS PERTINENTES A LAS COMPETENCIAS DEL PROGRAMA DE FORMACIÓN ASUMIENDO ESTRATEGIAS Y METODOLOGÍAS DE AUTOGESTIÓN	177	\N	\N
770	593114	04  IMPLEMENTAR ACCIONES DE MEJORA RELACIONADAS CON EL USO DE EXPRESIONES, ESTRUCTURAS Y DESEMPEÑO SEGÚN LOS RESULTADOS DE APRENDIZAJE FORMULADOS PARA EL PROGRAMA.	181	\N	\N
764	593343	01  IDENTIFICAR LA DINÁMICA ORGANIZACIONAL DEL SENA Y EL ROL DE LA FORMACIÓN PROFESIONAL INTEGRAL DE ACUERDO CON SU PROYECTO DE VIDA Y EL DESARROLLO PROFESIONAL.	179	\N	593343
771	593115	02  INTERCAMBIAR OPINIONES SOBRE SITUACIONES COTIDIANAS Y LABORALES ACTUALES, PASADAS Y FUTURAS EN CONTEXTOS SOCIALES ORALES Y ESCRITOS.	181	\N	593115
773	593117	01  COMPRENDER INFORMACIÓN SOBRE SITUACIONES COTIDIANAS Y LABORALES ACTUALES Y FUTURAS A TRAVÉS DE INTERACCIONES SOCIALES DE FORMA ORAL Y ESCRITA.	181	\N	593117
768	593154	01  ALISTAR HERRAMIENTAS DE TECNOLOGÍAS DE LA INFORMACIÓN Y LA COMUNICACIÓN (TIC), DE ACUERDO CON LAS NECESIDADES DE PROCESAMIENTO DE INFORMACIÓN Y COMUNICACIÓN.	180	\N	593154
776	593156	01  ANALIZAR LAS ESTRATEGIAS PARA LA PREVENCIÓN Y CONTROL DE LOS IMPACTOS AMBIENTALES Y DE LOS ACCIDENTES Y ENFERMEDADES LABORALES (ATEL) DE ACUERDO CON LAS POLÍTICAS ORGANIZACIONALES Y EL ENTORNO SOCIAL.	182	\N	593156
786	593162	01  IDENTIFICAR LOS PRINCIPIOS Y LEYES DE LA FÍSICA EN LA SOLUCIÓN DE PROBLEMAS DE ACUERDO AL CONTEXTO PRODUCTIVO.	184	\N	593162
788	593225	01  ANALIZAR LOS COMPONENTES DE LA COMUNICACIÓN SEGÚN SUS CARACTERÍSTICAS, INTENCIONALIDAD Y CONTEXTO.	185	\N	593225
792	593236	01  ANALIZAR EL CONTEXTO PRODUCTIVO SEGÚN SUS CARACTERÍSTICAS Y NECESIDADES.	186	\N	593236
827	593256	01  IDENTIFICAR MODELOS MATEMÁTICOS DE ACUERDO CON LOS REQUERIMIENTOS DEL PROBLEMA PLANTEADO  EN CONTEXTOS SOCIALES Y PRODUCTIVO.	195	\N	593256
820	593346	01  CARACTERIZAR LOS PROCESOS DE LA ORGANIZACIÓN DE ACUERDO CON EL SOFTWARE A CONSTRUIR.	193	\N	593346
816	592375	01 PLANEAR ACTIVIDADES DE ANÁLISIS DE ACUERDO CON LA METODOLOGÍA SELECCIONADA.	192	\N	592375
803	593060	01  DEFINIR ESPECIFICACIONES TÉCNICAS DEL SOFTWARE DE ACUERDO CON LAS CARACTERÍSTICAS DEL SOFTWARE A CONSTRUIR.	189	\N	593060
799	593100	03  DETERMINAR LAS CARACTERÍSTICAS TÉCNICAS DE LA INTERFAZ GRÁFICA DEL SOFTWARE ADOPTANDO ESTÁNDARES.	188	\N	593100
800	593101	02  ESTRUCTURAR EL MODELO DE DATOS DEL SOFTWARE DE ACUERDO CON LAS ESPECIFICACIONES DEL ANÁLISIS.	188	\N	593101
802	593103	01  ELABORAR LOS ARTEFACTOS DE DISEÑO DEL SOFTWARE SIGUIENDO LAS PRÁCTICAS DE LA METODOLOGÍA SELECCIONADA.	188	\N	593103
808	593106	01  PLANEAR ACTIVIDADES DE CONSTRUCCIÓN DEL SOFTWARE DE ACUERDO CON EL DISEÑO ESTABLECIDO.	190	\N	593106
797	593111	01  PLANEAR ACTIVIDADES DE IMPLANTACIÓN DEL SOFTWARE DE ACUERDO CON LAS CONDICIONES DEL SISTEMA.	187	\N	593111
774	593118	03  DISCUTIR SOBRE POSIBLES SOLUCIONES A PROBLEMAS DENTRO DE UN RANGO VARIADO DE CONTEXTOS SOCIALES Y LABORALES.	181	\N	593118
780	593120	01  DESARROLLAR HABILIDADES PSICOMOTRICES EN EL CONTEXTO PRODUCTIVO Y SOCIAL.	183	\N	593120
761	593148	03  PROMOVER EL USO RACIONAL DE LOS RECURSOS NATURALES A PARTIR DE CRITERIOS DE SOSTENIBILIDAD Y SUSTENTABILIDAD ÉTICA Y NORMATIVA VIGENTE.	178	\N	593148
762	593149	01  PROMOVER MI DIGNIDAD Y LA DEL OTRO A PARTIR DE LOS PRINCIPIOS Y VALORES ÉTICOS COMO APORTE EN LA INSTAURACIÓN DE UNA CULTURA DE PAZ.	178	\N	593149
766	593152	04  OPTIMIZAR LOS RESULTADOS, DE ACUERDO CON LA VERIFICACIÓN.	180	\N	593152
806	593104	03  CREAR COMPONENTES FRONT-END DEL SOFTWARE DE ACUERDO CON EL DISEÑO.	190	\N	593104
787	593224	03  RELACIONAR LOS PROCESOS COMUNICATIVOS TENIENDO EN CUENTA CRITERIOS DE LÓGICA Y RACIONALIDAD.	185	\N	593224
794	593238	02  ESTRUCTURAR EL PROYECTO DE ACUERDO A CRITERIOS DE LA INVESTIGACIÓN.	186	\N	593238
822	593243	01- Reconocer el trabajo como factor de movilidad social y transformación vital con referencia a la fenomenología y a los derechos fundamentales en el trabajo.	194	\N	593243
829	593258	02  PLANTEAR PROBLEMAS MATEMÁTICOS A PARTIR DE SITUACIONES GENERADAS EN EL CONTEXTO SOCIAL Y PRODUCTIVO.	195	\N	593258
830	593259	02  CARACTERIZAR LA IDEA DE NEGOCIO TENIENDO EN CUENTA LAS OPORTUNIDADES Y NECESIDADES DEL SECTOR PRODUCTIVO Y SOCIAL.	196	\N	593259
833	593342	01  INTEGRAR ELEMENTOS DE LA CULTURA EMPRENDEDORA TENIENDO EN CUENTA EL PERFIL PERSONAL Y EL CONTEXTO DE DESARROLLO SOCIAL.	196	\N	593342
818	593344	02  RECOLECTAR INFORMACIÓN DEL SOFTWARE A CONSTRUIR DE ACUERDO CON LAS NECESIDADES DEL CLIENTE.	193	\N	593344
821	593347	03  ESTABLECER LOS REQUISITOS DEL SOFTWARE DE ACUERDO CON LA INFORMACIÓN RECOLECTADA.	193	\N	593347
814	592373	02  MODELAR LAS FUNCIONES DEL SOFTWARE DE ACUERDO CON EL INFORME DE REQUISITOS.	192	\N	592373
817	592376	03  DESARROLLAR PROCESOS LÓGICOS A TRAVÉS DE LA IMPLEMENTACIÓN DE ALGORITMOS.	192	\N	592376
805	593062	02  ELABORAR PROPUESTA TÉCNICA DEL SOFTWARE DE ACUERDO CON LAS ESPECIFICACIONES TÉCNICAS DEFINIDAS.	189	\N	593062
809	593107	02  CONSTRUIR LA BASE DE DATOS PARA EL SOFTWARE A PARTIR DEL MODELO DE DATOS.	190	\N	593107
810	593108	04  CODIFICAR EL SOFTWARE DE ACUERDO CON EL DISEÑO ESTABLECIDO.	190	\N	593108
796	593110	02  DESPLEGAR EL SOFTWARE DE ACUERDO CON LA ARQUITECTURA Y LAS POLÍTICAS ESTABLECIDAS.	187	\N	593110
798	593112	04  IMPLANTAR EL SOFTWARE DE ACUERDO CON LOS NIVELES DE SERVICIO ESTABLECIDOS CON EL CLIENTE.	187	\N	593112
769	593113	06  EXPLICAR LAS FUNCIONES DE SU OCUPACIÓN LABORAL USANDO EXPRESIONES DE ACUERDO AL NIVEL REQUERIDO POR EL PROGRAMA DE FORMACIÓN.	181	\N	593113
772	593116	05  PRESENTAR UN PROCESO PARA LA REALIZACIÓN DE UNA ACTIVIDAD EN SU QUEHACER LABORAL DE ACUERDO CON LOS PROCEDIMIENTOS ESTABLECIDOS DESDE SU PROGRAMA DE FORMACIÓN.	181	\N	593116
779	593119	02  PRACTICAR HÁBITOS SALUDABLES MEDIANTE LA APLICACIÓN DE  FUNDAMENTOS DE NUTRICIÓN E HIGIENE.	183	\N	593119
781	593121	03  EJECUTAR ACTIVIDADES DE ACONDICIONAMIENTO FÍSICO ORIENTADAS HACIA EL MEJORAMIENTO DE LA CONDICIÓN FÍSICA EN LOS CONTEXTOS PRODUCTIVO Y SOCIAL.	183	\N	593121
782	593122	04  IMPLEMENTAR UN PLAN DE ERGONOMÍA Y PAUSAS ACTIVAS SEGÚN LAS CARACTERÍSTICAS DE LA FUNCIÓN PRODUCTIVA.	183	\N	593122
813	593146	01  INCORPORAR ACTIVIDADES DE ASEGURAMIENTO DE LA CALIDAD DEL SOFTWARE DE ACUERDO CON ESTÁNDARES DE LA INDUSTRIA.	191	\N	593146
760	593147	02  ESTABLECER RELACIONES DE CRECIMIENTO PERSONAL Y COMUNITARIO A PARTIR DEL BIEN COMÚN COMO APORTE PARA EL DESARROLLO SOCIAL.	178	\N	593147
763	593150	04  CONTRIBUIR CON EL FORTALECIMIENTO DE LA CULTURA DE PAZ A PARTIR DE LA DIGNIDAD HUMANA Y LAS ESTRATEGIAS PARA LA TRANSFORMACIÓN DE CONFLICTOS.	178	\N	593150
765	593151	02  APLICAR FUNCIONALIDADES DE HERRAMIENTAS Y SERVICIOS TIC, DE ACUERDO CON MANUALES DE USO, PROCEDIMIENTOS ESTABLECIDOS Y BUENAS PRÁCTICAS.	180	\N	593151
777	593157	03  REALIZAR SEGUIMIENTO Y ACOMPAÑAMIENTO AL DESARROLLO DE LOS PLANES Y PROGRAMAS AMBIENTALES Y SST, SEGÚN EL  ÁREA DE DESEMPEÑO.	182	\N	593157
778	593158	02  IMPLEMENTAR ESTRATEGIAS PARA EL CONTROL DE LOS IMPACTOS AMBIENTALES Y DE LOS ACCIDENTES Y ENFERMEDADES   DE ACUERDO  CON LOS PLANES Y PROGRAMAS  ESTABLECIDOS POR LA ORGANIZACIÓN.	182	\N	593158
783	593159	02  SOLUCIONAR PROBLEMAS ASOCIADOS CON EL SECTOR PRODUCTIVO CON BASE EN LOS PRINCIPIOS Y LEYES DE LA FÍSICA.	184	\N	593159
790	593227	02  ARGUMENTAR EN FORMA ORAL Y ESCRITA ATENDIENDO LAS EXIGENCIAS Y PARTICULARIDADES DE LAS DIVERSAS SITUACIONES COMUNICATIVAS MEDIANTE LOS DISTINTOS SISTEMAS DE REPRESENTACIÓN.	185	\N	593227
793	593237	03  ARGUMENTAR ASPECTOS TEÓRICOS DEL PROYECTO SEGÚN REFERENTES NACIONALES E INTERNACIONALES.	186	\N	593237
823	593244	03- Practicar los derechos fundamentales en el trabajo de acuerdo con la Constitución Política y los Convenios Internacionales.	194	\N	593244
825	593246	04- Participar en acciones solidarias teniendo en cuenta el ejercicio de los derechos humanos, de los pueblos y de la naturaleza.	194	\N	593246
826	593255	03  RESOLVER PROBLEMAS MATEMÁTICOS A PARTIR DE SITUACIONES GENERADAS EN EL CONTEXTO SOCIAL Y PRODUCTIVO.	195	\N	593255
831	593340	03  ESTRUCTURAR EL PLAN DE NEGOCIO DE ACUERDO CON LAS CARACTERÍSTICAS EMPRESARIALES Y TENDENCIAS DE MERCADO.	196	\N	593340
815	592374	04  VERIFICAR LOS MODELOS REALIZADOS EN LA FASE DE ANÁLISIS DE ACUERDO CON LO ESTABLECIDO EN EL INFORME DE REQUISITOS.	192	\N	592374
804	593061	03  VALIDAR LAS CONDICIONES DE LA PROPUESTA TÉCNICA DEL SOFTWARE DE ACUERDO CON LOS INTERESES DE LAS PARTES.	189	\N	593061
801	593102	04  VERIFICAR LOS ENTREGABLES DE LA FASE DE DISEÑO DEL SOFTWARE DE ACUERDO CON LO ESTABLECIDO EN EL INFORME DE ANÁLISIS.	188	\N	593102
807	593105	05  REALIZAR PRUEBAS AL SOFTWARE PARA VERIFICAR SU FUNCIONALIDAD.	190	\N	593105
795	593109	03  DOCUMENTAR EL PROCESO DE IMPLANTACIÓN DE SOFTWARE SIGUIENDO ESTÁNDARES DE CALIDAD.	187	\N	593109
811	593144	02  VERIFICAR LA CALIDAD DEL SOFTWARE DE ACUERDO CON LAS PRÁCTICAS ASOCIADAS EN LOS PROCESOS DE DESARROLLO.	191	\N	593144
812	593145	03  REALIZAR ACTIVIDADES DE MEJORA DE LA CALIDAD DEL SOFTWARE A PARTIR DE LOS RESULTADOS DE LA VERIFICACIÓN.	191	\N	593145
767	593153	03  EVALUAR LOS RESULTADOS, DE ACUERDO CON LOS REQUERIMIENTOS.	180	\N	593153
775	593155	04  PROPONER ACCIONES DE MEJORA PARA EL MANEJO AMBIENTAL Y EL CONTROL DE LA SST, DE ACUERDO CON ESTRATEGIAS DE TRABAJO, COLABORATIVO, COOPERATIVO Y COORDINADO EN EL CONTEXTO PRODUCTIVO Y SOCIAL.	182	\N	593155
784	593160	04  PROPONER ACCIONES DE MEJORA EN LOS PROCESOS PRODUCTIVOS DE ACUERDO CON LOS PRINCIPIOS Y LEYES DE LA FÍSICA.	184	\N	593160
785	593161	03  VERIFICAR LAS TRANSFORMACIONES FÍSICAS DE LA MATERIA UTILIZANDO HERRAMIENTAS TECNOLÓGICAS.	184	\N	593161
789	593226	04  ESTABLECER PROCESOS DE ENRIQUECIMIENTO LEXICAL Y ACCIONES DE MEJORAMIENTO EN EL DESARROLLO DE PROCESOS COMUNICATIVOS SEGÚN REQUERIMIENTOS DEL CONTEXTO.	185	\N	593226
791	593235	04  PROPONER SOLUCIONES A LAS NECESIDADES DEL CONTEXTO SEGÚN RESULTADOS DE LA INVESTIGACIÓN.	186	\N	593235
824	593245	02- Valorar la importancia de la ciudadanía laboral con base en el estudio de los derechos humanos y fundamentales en el trabajo.	194	\N	593245
828	593257	04  PROPONER ACCIONES DE MEJORA FRENTE A LOS RESULTADOS DE LOS PROCEDIMIENTOS MATEMÁTICOS DE ACUERDO CON EL PROBLEMA PLANTEADO.	195	\N	593257
832	593341	04  VALORAR LA PROPUESTA DE NEGOCIO CONFORME CON SU ESTRUCTURA Y NECESIDADES DEL SECTOR PRODUCTIVO Y SOCIAL.	196	\N	593341
819	593345	04  VALIDAR EL INFORME DE REQUISITOS DE ACUERDO CON LAS NECESIDADES DEL CLIENTE.	193	\N	593345
\.


--
-- Name: aprendiz_id_aprendiz_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.aprendiz_id_aprendiz_seq', 301, true);


--
-- Name: competencia_id_competencia_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.competencia_id_competencia_seq', 196, true);


--
-- Name: fase_actividad_id_actividad_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fase_actividad_id_actividad_seq', 35, true);


--
-- Name: fases_id_fase_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fases_id_fase_seq', 330, true);


--
-- Name: formacion_id_formacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.formacion_id_formacion_seq', 11, true);


--
-- Name: funcionario_id_funcionario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.funcionario_id_funcionario_seq', 120, true);


--
-- Name: juicios_evaluativos_id_juicio_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.juicios_evaluativos_id_juicio_seq', 22687, true);


--
-- Name: programa_id_programa_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.programa_id_programa_seq', 11, true);


--
-- Name: proyecto_formativo_id_proyecto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proyecto_formativo_id_proyecto_seq', 28, true);


--
-- Name: resultados_aprendizaje_id_resultado_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resultados_aprendizaje_id_resultado_seq', 833, true);


--
-- Name: aprendiz aprendiz_documento_formacion_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aprendiz
    ADD CONSTRAINT aprendiz_documento_formacion_key UNIQUE (documento, id_formacion);


--
-- Name: aprendiz aprendiz_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aprendiz
    ADD CONSTRAINT aprendiz_pkey PRIMARY KEY (id_aprendiz);


--
-- Name: competencia competencia_codigo_programa_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competencia
    ADD CONSTRAINT competencia_codigo_programa_key UNIQUE (codigo, id_programa);


--
-- Name: competencia competencia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competencia
    ADD CONSTRAINT competencia_pkey PRIMARY KEY (id_competencia);


--
-- Name: fase_actividad fase_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fase_actividad
    ADD CONSTRAINT fase_actividad_pkey PRIMARY KEY (id_actividad);


--
-- Name: fase_competencia fase_competencia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fase_competencia
    ADD CONSTRAINT fase_competencia_pkey PRIMARY KEY (id_fase, id_competencia);


--
-- Name: fase_resultado fase_resultado_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fase_resultado
    ADD CONSTRAINT fase_resultado_pkey PRIMARY KEY (id_fase, id_resultado);


--
-- Name: fases fases_nombre_programa_actividad_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fases
    ADD CONSTRAINT fases_nombre_programa_actividad_key UNIQUE (nombre, id_programa, actividad);


--
-- Name: fases fases_nombre_programa_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fases
    ADD CONSTRAINT fases_nombre_programa_key UNIQUE (nombre, id_programa);


--
-- Name: fases fases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fases
    ADD CONSTRAINT fases_pkey PRIMARY KEY (id_fase);


--
-- Name: formacion formacion_ficha_caracterizacion_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formacion
    ADD CONSTRAINT formacion_ficha_caracterizacion_key UNIQUE (ficha_caracterizacion);


--
-- Name: formacion formacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formacion
    ADD CONSTRAINT formacion_pkey PRIMARY KEY (id_formacion);


--
-- Name: funcionario funcionario_documento_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionario
    ADD CONSTRAINT funcionario_documento_key UNIQUE (documento);


--
-- Name: funcionario funcionario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionario
    ADD CONSTRAINT funcionario_pkey PRIMARY KEY (id_funcionario);


--
-- Name: juicios_evaluativos juicios_evaluativos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.juicios_evaluativos
    ADD CONSTRAINT juicios_evaluativos_pkey PRIMARY KEY (id_juicio);


--
-- Name: programa programa_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programa
    ADD CONSTRAINT programa_codigo_key UNIQUE (codigo);


--
-- Name: programa programa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programa
    ADD CONSTRAINT programa_pkey PRIMARY KEY (id_programa);


--
-- Name: proyecto_formativo proyecto_formativo_codigo_proyecto_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyecto_formativo
    ADD CONSTRAINT proyecto_formativo_codigo_proyecto_key UNIQUE (codigo_proyecto);


--
-- Name: proyecto_formativo proyecto_formativo_id_programa_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyecto_formativo
    ADD CONSTRAINT proyecto_formativo_id_programa_key UNIQUE (id_programa);


--
-- Name: proyecto_formativo proyecto_formativo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyecto_formativo
    ADD CONSTRAINT proyecto_formativo_pkey PRIMARY KEY (id_proyecto);


--
-- Name: resultados_aprendizaje resultado_codigo_competencia_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados_aprendizaje
    ADD CONSTRAINT resultado_codigo_competencia_key UNIQUE (codigo, id_competencia);


--
-- Name: resultados_aprendizaje resultados_aprendizaje_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados_aprendizaje
    ADD CONSTRAINT resultados_aprendizaje_pkey PRIMARY KEY (id_resultado);


--
-- Name: juicios_evaluativos unique_juicio; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.juicios_evaluativos
    ADD CONSTRAINT unique_juicio UNIQUE (id_resultado, id_aprendiz);


--
-- Name: proyecto_formativo unique_proyecto_programa; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyecto_formativo
    ADD CONSTRAINT unique_proyecto_programa UNIQUE (id_programa);


--
-- Name: fase_actividad uq_fase_actividad; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fase_actividad
    ADD CONSTRAINT uq_fase_actividad UNIQUE (id_fase, descripcion);


--
-- Name: competencia competencia_id_programa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competencia
    ADD CONSTRAINT competencia_id_programa_fkey FOREIGN KEY (id_programa) REFERENCES public.programa(id_programa) ON DELETE CASCADE;


--
-- Name: fase_actividad fase_actividad_id_fase_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fase_actividad
    ADD CONSTRAINT fase_actividad_id_fase_fkey FOREIGN KEY (id_fase) REFERENCES public.fases(id_fase) ON DELETE CASCADE;


--
-- Name: fase_competencia fase_competencia_id_competencia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fase_competencia
    ADD CONSTRAINT fase_competencia_id_competencia_fkey FOREIGN KEY (id_competencia) REFERENCES public.competencia(id_competencia) ON DELETE CASCADE;


--
-- Name: fase_competencia fase_competencia_id_fase_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fase_competencia
    ADD CONSTRAINT fase_competencia_id_fase_fkey FOREIGN KEY (id_fase) REFERENCES public.fases(id_fase) ON DELETE CASCADE;


--
-- Name: fase_resultado fase_resultado_id_actividad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fase_resultado
    ADD CONSTRAINT fase_resultado_id_actividad_fkey FOREIGN KEY (id_actividad) REFERENCES public.fase_actividad(id_actividad) ON DELETE SET NULL;


--
-- Name: fase_resultado fase_resultado_id_fase_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fase_resultado
    ADD CONSTRAINT fase_resultado_id_fase_fkey FOREIGN KEY (id_fase) REFERENCES public.fases(id_fase) ON DELETE CASCADE;


--
-- Name: fase_resultado fase_resultado_id_resultado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fase_resultado
    ADD CONSTRAINT fase_resultado_id_resultado_fkey FOREIGN KEY (id_resultado) REFERENCES public.resultados_aprendizaje(id_resultado) ON DELETE CASCADE;


--
-- Name: aprendiz fk_aprendiz_formacion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aprendiz
    ADD CONSTRAINT fk_aprendiz_formacion FOREIGN KEY (id_formacion) REFERENCES public.formacion(id_formacion) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fases fk_fases_programa; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fases
    ADD CONSTRAINT fk_fases_programa FOREIGN KEY (id_programa) REFERENCES public.programa(id_programa) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: formacion fk_formacion_programa; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formacion
    ADD CONSTRAINT fk_formacion_programa FOREIGN KEY (id_programa) REFERENCES public.programa(id_programa) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: juicios_evaluativos fk_juicio_aprendiz; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.juicios_evaluativos
    ADD CONSTRAINT fk_juicio_aprendiz FOREIGN KEY (id_aprendiz) REFERENCES public.aprendiz(id_aprendiz) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: juicios_evaluativos fk_juicio_funcionario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.juicios_evaluativos
    ADD CONSTRAINT fk_juicio_funcionario FOREIGN KEY (id_funcionario) REFERENCES public.funcionario(id_funcionario) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: juicios_evaluativos fk_juicio_resultado; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.juicios_evaluativos
    ADD CONSTRAINT fk_juicio_resultado FOREIGN KEY (id_resultado) REFERENCES public.resultados_aprendizaje(id_resultado) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: resultados_aprendizaje fk_resultado_competencia; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados_aprendizaje
    ADD CONSTRAINT fk_resultado_competencia FOREIGN KEY (id_competencia) REFERENCES public.competencia(id_competencia) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proyecto_formativo proyecto_formativo_id_programa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyecto_formativo
    ADD CONSTRAINT proyecto_formativo_id_programa_fkey FOREIGN KEY (id_programa) REFERENCES public.programa(id_programa) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict lbYsqER1o73eZc1adCtHZwfArREIGT7xuDtFZuHpYApgzECeUNyaxeOXYYNoVNF

