--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4 (Debian 17.4-1.pgdg120+2)
-- Dumped by pg_dump version 17.4 (Debian 17.4-1.pgdg120+2)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: klwj
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO klwj;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: klwj
--

COMMENT ON SCHEMA public IS '';


--
-- Name: QueueStatus; Type: TYPE; Schema: public; Owner: klwj
--

CREATE TYPE public."QueueStatus" AS ENUM (
    'PENDING',
    'CALLED',
    'SERVING',
    'SERVED',
    'LAPSED',
    'CANCELLED',
    'RETURNING'
);


ALTER TYPE public."QueueStatus" OWNER TO klwj;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: klwj
--

CREATE TYPE public."Role" AS ENUM (
    'unverified',
    'staff',
    'admin',
    'archived',
    'supervisor'
);


ALTER TYPE public."Role" OWNER TO klwj;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Counter; Type: TABLE; Schema: public; Owner: klwj
--

CREATE TABLE public."Counter" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "serviceId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Counter" OWNER TO klwj;

--
-- Name: QueueTicket; Type: TABLE; Schema: public; Owner: klwj
--

CREATE TABLE public."QueueTicket" (
    id text NOT NULL,
    "ticketNumber" integer NOT NULL,
    prefix text NOT NULL,
    status public."QueueStatus" DEFAULT 'PENDING'::public."QueueStatus" NOT NULL,
    "serviceId" text NOT NULL,
    "counterId" text,
    "serviceTypeId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "servingStart" timestamp(3) without time zone,
    "servingEnd" timestamp(3) without time zone,
    "isPrioritized" boolean DEFAULT false NOT NULL,
    remarks text
);


ALTER TABLE public."QueueTicket" OWNER TO klwj;

--
-- Name: ScreensaverImage; Type: TABLE; Schema: public; Owner: klwj
--

CREATE TABLE public."ScreensaverImage" (
    id text NOT NULL,
    title text NOT NULL,
    "imageUrl" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ScreensaverImage" OWNER TO klwj;

--
-- Name: Service; Type: TABLE; Schema: public; Owner: klwj
--

CREATE TABLE public."Service" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "supervisorId" text
);


ALTER TABLE public."Service" OWNER TO klwj;

--
-- Name: ServiceType; Type: TABLE; Schema: public; Owner: klwj
--

CREATE TABLE public."ServiceType" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "serviceId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ServiceType" OWNER TO klwj;

--
-- Name: User; Type: TABLE; Schema: public; Owner: klwj
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "firstName" text NOT NULL,
    "middleName" text,
    "lastName" text NOT NULL,
    email text NOT NULL,
    image text,
    password text NOT NULL,
    username text NOT NULL,
    role public."Role"[] DEFAULT ARRAY['unverified'::public."Role"],
    "assignedCounterId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastLogin" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO klwj;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: klwj
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO klwj;

--
-- Data for Name: Counter; Type: TABLE DATA; Schema: public; Owner: klwj
--

COPY public."Counter" (id, name, code, "serviceId", "createdAt", "updatedAt") FROM stdin;
cm96fxk7a0005uxmsvjvb2up6	Customer Welfare 1	CW1	cm96fwl7f0001uxms8ra0hvsn	2025-04-07 02:16:48.263	2025-04-07 02:16:48.263
cm96fxnvu0007uxms1lklpw8j	Customer Welfare 2	CW2	cm96fwl7f0001uxms8ra0hvsn	2025-04-07 02:16:53.034	2025-04-07 02:16:53.034
cm96fxrm40009uxms66404ftk	Customer Welfare 3	CW3	cm96fwl7f0001uxms8ra0hvsn	2025-04-07 02:16:57.868	2025-04-07 02:16:57.868
cm96fy2yh000fuxmsecd84ywf	Payment 1	P1	cm96fxc1l0003uxmsosr0p5en	2025-04-07 02:17:12.57	2025-04-07 02:17:12.57
cm96fy6uh000huxms57yd89n1	Payment 2	P2	cm96fxc1l0003uxmsosr0p5en	2025-04-07 02:17:17.609	2025-04-07 02:17:17.609
cm96fybl6000juxmse0xsj3tu	Payment 3	P3	cm96fxc1l0003uxmsosr0p5en	2025-04-07 02:17:23.754	2025-04-07 02:17:23.754
cm96fyf7v000luxmsdfay76e7	Payment 4	P4	cm96fxc1l0003uxmsosr0p5en	2025-04-07 02:17:28.459	2025-04-07 02:17:28.459
cm96fyird000nuxmsynm8480k	Payment 5	P5	cm96fxc1l0003uxmsosr0p5en	2025-04-07 02:17:33.05	2025-04-07 02:17:33.05
cm96fymeo000puxmsye0t3wbf	Payment 6	P6	cm96fxc1l0003uxmsosr0p5en	2025-04-07 02:17:37.776	2025-04-07 02:17:37.776
cm96fypxj000ruxmsm5e1v90c	Payment 7	P7	cm96fxc1l0003uxmsosr0p5en	2025-04-07 02:17:42.344	2025-04-07 02:17:42.344
cm9v0icsj0003ux6k3qd6i739	New Service Application 1	A1	cm96fwzqe0002uxmsus8h73xm	2025-04-24 06:59:18.98	2025-04-24 06:59:18.98
cm9v0ihe50005ux6ksfttm1cf	New Service Application 2	A2	cm96fwzqe0002uxmsus8h73xm	2025-04-24 06:59:24.942	2025-04-24 06:59:24.942
\.


--
-- Data for Name: QueueTicket; Type: TABLE DATA; Schema: public; Owner: klwj
--

COPY public."QueueTicket" (id, "ticketNumber", prefix, status, "serviceId", "counterId", "serviceTypeId", "createdAt", "updatedAt", "servingStart", "servingEnd", "isPrioritized", remarks) FROM stdin;
cm9v0ex6r0001ux6kmc3ip8re	1	A	CALLED	cm96fwzqe0002uxmsus8h73xm	cm9v0icsj0003ux6k3qd6i739	\N	2025-04-24 06:56:38.787	2025-04-24 07:01:15.333	\N	\N	f	\N
cm9w4dez30007ux9og0vnfgic	15	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gcg8y0018uxmsketzz9b2	2025-04-25 01:35:13.167	2025-04-25 01:38:52.875	2025-04-25 01:38:49.828	2025-04-25 01:38:52.848	f	\N
cm9w3o6o10002ux9oln3c7brr	10	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gcg8y0018uxmsketzz9b2	2025-04-25 01:15:36.002	2025-04-25 01:19:57.896	2025-04-25 01:19:54.252	2025-04-25 01:19:57.868	f	\N
cm9w33vsw0005uxhg9tc3cfgl	1	P	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	cm96gao790010uxmswmi8f6m3	2025-04-25 00:59:48.8	2025-04-25 01:11:13.648	2025-04-25 01:11:03.595	2025-04-25 01:11:07.251	f	\N
cm9w3u15g0003ux9oux2iudwp	11	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	cm96gcg8y0018uxmsketzz9b2	2025-04-25 01:20:08.789	2025-04-25 01:38:55.788	2025-04-25 01:38:47.457	2025-04-25 01:38:49.46	f	\N
cm9w32tie0004uxhgnurryrgh	4	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	cm96gcyxi001cuxmsmzz23c5y	2025-04-25 00:58:59.174	2025-04-25 01:07:27.652	2025-04-25 01:07:18.529	2025-04-25 01:07:21.36	f	\N
cm9w40s6l0005ux9oqkl05hmc	13	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	cm96gcyxi001cuxmsmzz23c5y	2025-04-25 01:25:23.757	2025-04-25 01:38:33.735	2025-04-25 01:38:25.161	2025-04-25 01:38:27.433	f	\N
cm9w34iq70006uxhgggzm33wh	2	P	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	cm96gboi00012uxmsp8l4ombk	2025-04-25 01:00:18.511	2025-04-25 01:11:20.155	2025-04-25 01:11:09.863	2025-04-25 01:11:13.867	f	\N
cm9w3e6kj000auxhgyawrzw2k	5	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	cm96gao790010uxmswmi8f6m3	2025-04-25 01:07:49.316	2025-04-25 01:11:37.749	2025-04-25 01:11:29.062	2025-04-25 01:11:31.47	f	\N
cm9w418480006ux9or38uy6p7	14	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	cm96gcyxi001cuxmsmzz23c5y	2025-04-25 01:25:44.408	2025-04-25 01:38:39.158	2025-04-25 01:38:30.742	2025-04-25 01:38:32.856	f	\N
cm9w4je6l000fux9ovfic7l2l	23	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	\N	\N	2025-04-25 01:39:52.078	2025-04-25 02:04:33.457	\N	2025-04-25 02:03:25.605	f	\N
cm9v0abxg0000ux6k9vv2wqvc	1	P	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gboi00012uxmsp8l4ombk	2025-04-24 06:53:04.603	2025-04-25 01:02:54.998	2025-04-25 01:02:51.477	2025-04-25 01:02:54.972	f	\N
cm9w34n340007uxhg5fcfmc93	3	P	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	cm96gcg8y0018uxmsketzz9b2	2025-04-25 01:00:24.16	2025-04-25 01:11:43.338	2025-04-25 01:11:34.423	2025-04-25 01:11:37.055	f	\N
cm9w31ahd0001uxhgxq894tbl	1	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gboi00012uxmsp8l4ombk	2025-04-25 00:57:47.857	2025-04-25 01:03:28.342	2025-04-25 01:03:24.616	2025-04-25 01:03:28.317	f	\N
cm9w3fjer000cuxhgvpb9dtdv	7	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gc4qm0016uxms4vjefcx5	2025-04-25 01:08:52.611	2025-04-25 01:09:03.571	2025-04-25 01:09:00.232	2025-04-25 01:09:03.55	f	\N
cm9w32knr0003uxhggeq9lvkj	3	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gcg8y0018uxmsketzz9b2	2025-04-25 00:58:47.704	2025-04-25 01:03:34.579	2025-04-25 01:03:31.084	2025-04-25 01:03:34.552	f	\N
cm9w7vb600005uxc0lmt1z88u	36	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-25 03:13:06.888	2025-04-25 04:43:06.476	\N	2025-04-25 03:13:18.514	f	\N
cm9w3epbe000buxhgum3jot08	6	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gcyxi001cuxmsmzz23c5y	2025-04-25 01:08:13.61	2025-04-25 01:09:13.324	2025-04-25 01:09:10.529	2025-04-25 01:09:13.299	f	\N
cm9w31xjk0002uxhgy789chno	2	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gcg8y0018uxmsketzz9b2	2025-04-25 00:58:17.745	2025-04-25 01:03:40.609	2025-04-25 01:03:37.417	2025-04-25 01:03:40.587	f	\N
cm9w4igtg000dux9ogt5fsmjd	21	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	\N	\N	2025-04-25 01:39:08.837	2025-04-25 01:52:45.004	\N	2025-04-25 01:39:36.198	f	\N
cm9w3jb3i0001ux9o978y556i	9	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gcyxi001cuxmsmzz23c5y	2025-04-25 01:11:48.462	2025-04-25 01:15:54.044	2025-04-25 01:15:51.088	2025-04-25 01:15:54.012	f	\N
cm9w4f5ot0008ux9opu5cff57	16	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gboi00012uxmsp8l4ombk	2025-04-25 01:36:34.445	2025-04-25 01:36:54.99	2025-04-25 01:36:50.881	2025-04-25 01:36:54.963	f	\N
cm9w3h5lf0000ux9ocfu3bewc	8	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gacvo000yuxmsn9v3023i	2025-04-25 01:10:08.019	2025-04-25 01:10:47.318	2025-04-25 01:10:44.125	2025-04-25 01:10:47.296	f	\N
cm9w4ib2b000bux9o06j2yu7k	19	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	\N	\N	2025-04-25 01:39:01.38	2025-04-25 01:50:50.293	\N	2025-04-25 01:39:08.253	f	\N
cm9w7ry360004uxc0fl2cu2hj	35	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-25 03:10:29.97	2025-04-25 04:42:42.554	\N	2025-04-25 03:11:43.084	f	\N
cm9w5jhhi0000uxa4c92zkwdw	29	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gao790010uxmswmi8f6m3	2025-04-25 02:07:55.975	2025-04-25 02:28:42.612	2025-04-25 02:28:34.32	2025-04-25 02:28:42.587	f	\N
cm9w4fo640009ux9ov9njiivl	17	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	cm96gao790010uxmswmi8f6m3	2025-04-25 01:36:58.396	2025-04-25 01:38:49.277	2025-04-25 01:38:38.822	2025-04-25 01:38:42.971	f	\N
cm9w3unko0004ux9o1pasoku6	12	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	cm96gcyxi001cuxmsmzz23c5y	2025-04-25 01:20:37.848	2025-04-25 01:38:28.836	2025-04-25 01:38:20.325	2025-04-25 01:38:22.511	f	\N
cm9waugu90002uxfsh1f0y4i7	39	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-25 04:36:26.434	2025-04-25 04:44:55.036	\N	2025-04-25 04:36:54.263	f	\N
cm9w4i833000aux9oi6mxvj4q	18	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	\N	\N	2025-04-25 01:38:57.52	2025-04-25 01:50:12.223	\N	2025-04-25 01:39:04.825	f	\N
cm9wak9pi0000uxfscie7qv5m	37	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-25 04:28:30.63	2025-04-25 04:43:24.728	\N	2025-04-25 04:28:45.562	f	\N
cm9w4idxw000cux9o36y9x8u0	20	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	\N	\N	2025-04-25 01:39:05.109	2025-04-25 01:51:22.594	\N	2025-04-25 01:39:46.239	f	\N
cm9w4yiyq000jux9obq151o84	27	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	\N	\N	2025-04-25 01:51:38.114	2025-04-25 02:04:33.457	\N	2025-04-25 01:52:38.677	f	\N
cm9w4ijwj000eux9o64w0tb1q	22	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	\N	\N	2025-04-25 01:39:12.835	2025-04-25 02:01:56.902	\N	2025-04-25 01:39:39.124	f	\N
cm9w4y1kf000iux9oqnd1b8rb	26	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	\N	\N	2025-04-25 01:51:15.567	2025-04-25 02:04:33.457	\N	2025-04-25 01:51:22.555	f	\N
cm9w4wt3w000hux9o51gp0ag2	25	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	\N	\N	2025-04-25 01:50:17.948	2025-04-25 02:04:33.457	\N	2025-04-25 01:50:50.262	f	\N
cm9waub7a0001uxfshybw0ola	38	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-25 04:36:19.126	2025-04-25 04:44:50.896	\N	2025-04-25 04:36:37.153	f	\N
cm9w4opye000gux9opmfkb1gz	24	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	cm96gcyxi001cuxmsmzz23c5y	2025-04-25 01:44:00.614	2025-04-25 03:11:24.909	2025-04-25 03:11:09.98	2025-04-25 03:11:18.44	f	\N
cm9w50iut000kux9oyu88by96	28	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	\N	\N	2025-04-25 01:53:11.285	2025-04-25 03:11:46.009	\N	2025-04-25 02:01:50.56	f	\N
cm9w5o0m30001uxa49ysv65o1	30	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	\N	2025-04-25 02:11:27.387	2025-04-25 03:13:18.543	\N	2025-04-25 02:36:57.053	f	\N
cm9w6z5ve0000uxc0b6lfun7f	31	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-25 02:48:07.035	2025-04-25 04:28:45.595	\N	2025-04-25 02:48:59.06	f	\N
cm9w6zae70001uxc05hbn573g	32	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	\N	2025-04-25 02:48:12.896	2025-04-25 04:36:37.186	\N	2025-04-25 02:48:34.453	t	\N
cm9w70hj50002uxc0anjnjza0	33	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	\N	2025-04-25 02:49:08.802	2025-04-25 04:36:54.298	\N	2025-04-25 02:49:12.374	f	\N
cm9w7rl9v0003uxc057pl6vf3	34	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-25 03:10:13.363	2025-04-25 04:42:18.21	\N	2025-04-25 03:10:47.923	f	\N
cm9w356ba0008uxhgv9qmokgw	4	P	CANCELLED	cm96fxc1l0003uxmsosr0p5en	cm96fy2yh000fuxmsecd84ywf	\N	2025-04-25 01:00:49.078	2025-04-28 00:47:45.298	2025-04-28 00:47:15.173	\N	f	\N
cma1tf67o0005uxh071a85p33	5	P	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-29 01:15:16.404	2025-05-02 06:15:06.22	2025-04-29 01:15:29.117	2025-04-29 02:13:48.219	f	\N
cma1tx3sy0008uxh0vvkubq77	8	P	SERVING	cm96fxc1l0003uxmsosr0p5en	cm96fy2yh000fuxmsecd84ywf	\N	2025-04-29 01:29:13.09	2025-04-29 01:29:18.453	2025-04-29 01:29:18.096	\N	f	\N
cma0djj640004uxhkeb3etsd1	5	P	SERVED	cm96fxc1l0003uxmsosr0p5en	cm96fy2yh000fuxmsecd84ywf	cm96g2oa1000wuxmsixliay7t	2025-04-28 01:02:59.789	2025-04-28 01:03:03.074	2025-04-28 01:03:00.122	2025-04-28 01:03:03.042	f	\N
cma0mi23l0000uxoghu892gfx	1	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-28 05:13:47.553	2025-04-28 05:13:47.553	\N	\N	f	\N
cma1tyf9y0009uxh09t6g2gfx	9	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 01:30:14.615	2025-04-29 01:30:14.615	\N	\N	f	\N
cma0qplul0000uxjkn8dv5ipd	6	P	SERVED	cm96fxc1l0003uxmsosr0p5en	cm96fy2yh000fuxmsecd84ywf	cm96g2oa1000wuxmsixliay7t	2025-04-28 07:11:38.206	2025-04-28 07:12:00.315	2025-04-28 07:11:55.149	2025-04-28 07:12:00.285	f	\N
cma1w985e0000uxqwap7sl7r6	11	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 02:34:37.826	2025-04-29 02:34:37.826	\N	\N	f	\N
cm9wb34v60006uxfsutclmlo7	43	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-25 04:43:10.819	2025-04-29 01:19:26.686	\N	2025-04-28 07:28:59.284	f	\N
cma1ut9pb0000uxl4o71ok0oy	1	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 01:54:13.727	2025-04-29 01:54:13.727	\N	\N	f	\N
cma1w9oqq0001uxqwz00ezwm6	12	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 02:34:59.33	2025-04-29 02:34:59.33	\N	\N	f	\N
cma1uur6o0001uxl4k80n09tl	10	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 01:55:23.041	2025-04-29 01:55:23.041	\N	\N	f	\N
cm9wb1nzx0003uxfs5ft0lqzh	40	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-25 04:42:02.302	2025-04-25 07:01:14.643	\N	2025-04-25 04:44:55.004	f	\N
cma0d7svb0002uxhkomfe9tdh	3	P	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-28 00:53:52.488	2025-04-29 01:20:25.874	2025-04-28 00:53:56.433	2025-04-28 07:12:22.688	f	\N
cma0dj7g80003uxhkzkbgzflk	4	P	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gboi00012uxmsp8l4ombk	2025-04-28 01:02:44.601	2025-04-28 07:19:15.449	2025-04-28 07:18:27.128	2025-04-28 07:19:15.401	f	\N
cma0rcurt0002uxjkfht14eub	8	P	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gcyxi001cuxmsmzz23c5y	2025-04-28 07:29:42.857	2025-04-29 01:12:05.328	2025-04-29 01:11:49.406	2025-04-29 01:12:05.293	t	\N
cm9wb2rb20005uxfs62gqgo1j	42	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gboi00012uxmsp8l4ombk	2025-04-25 04:42:53.246	2025-04-25 07:08:16.122	2025-04-25 07:07:56.977	2025-04-25 07:08:16.029	f	\N
cma1tety00004uxh0re9rybuo	4	P	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-29 01:15:00.505	2025-04-30 03:11:57.051	2025-04-29 01:15:26.108	2025-04-29 01:27:46.516	f	\N
cm9w3e3f10009uxhglm8qjlfo	5	P	SERVED	cm96fxc1l0003uxmsosr0p5en	cm96fy2yh000fuxmsecd84ywf	cm96g2oa1000wuxmsixliay7t	2025-04-25 01:07:45.229	2025-04-28 00:51:30.945	2025-04-28 00:50:53.91	2025-04-28 00:51:30.846	f	\N
cma1uuuwe0002uxl4pet7i9sp	2	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 01:55:27.854	2025-04-29 01:55:27.854	\N	\N	f	\N
cm9wb53yo0007uxfslqe086wh	44	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	cm96gao790010uxmswmi8f6m3	2025-04-25 04:44:42.96	2025-04-28 00:51:56.754	2025-04-28 00:51:50.063	2025-04-28 00:51:53.469	f	\N
cm9wbo1pd0008uxfs9tddvi3c	45	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxnvu0007uxms1lklpw8j	cm96gc4qm0016uxms4vjefcx5	2025-04-25 04:59:26.497	2025-04-28 00:52:03.402	2025-04-28 00:51:57.016	2025-04-28 00:52:00.145	f	\N
cma1wgtpi0002uxqw8g2wc9pq	13	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 02:40:32.358	2025-04-29 02:40:32.358	\N	\N	f	\N
cma0d5y5s0000uxhkuos2bbw9	1	P	SERVED	cm96fxc1l0003uxmsosr0p5en	cm96fy2yh000fuxmsecd84ywf	cm96g2oa1000wuxmsixliay7t	2025-04-28 00:52:26.023	2025-04-28 00:53:24.776	2025-04-28 00:52:29.09	2025-04-28 00:53:24.752	f	\N
cma1t0hl90001uxh0ust4d5ma	1	P	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gcp1d001auxmsj8eizead	2025-04-29 01:03:51.309	2025-04-29 01:12:35.892	2025-04-29 01:12:32.214	2025-04-29 01:12:35.868	f	\N
cma0d73m20001uxhkuxz7506k	2	P	SERVED	cm96fxc1l0003uxmsosr0p5en	cm96fy2yh000fuxmsecd84ywf	cm96g2oa1000wuxmsixliay7t	2025-04-28 00:53:19.754	2025-04-28 00:53:29.049	2025-04-28 00:53:26.21	2025-04-28 00:53:29.022	f	\N
cma1vcqfu0003uxl4smx4hin7	3	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 02:09:21.882	2025-04-29 02:09:21.882	\N	\N	f	\N
cma1t0jb10002uxh00pu5trh8	2	P	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-29 01:03:53.534	2025-04-30 02:42:41.22	2025-04-29 01:04:25.538	2025-04-29 02:13:54.227	f	\N
cma1wgvp60003uxqwoc5m2kwv	14	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 02:40:34.938	2025-04-29 02:40:34.938	\N	\N	f	\N
cma0rczsy0003uxjk10dgxc4t	1	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-28 07:29:49.378	2025-04-29 02:13:53.227	\N	2025-04-29 01:00:13.542	t	\N
cma1wh7pw0005uxqw32zzuq4h	2	CW	LAPSED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-29 02:40:50.516	2025-05-02 06:15:12.83	\N	2025-05-02 06:15:12.786	f	\N
cma0qprth0001uxjkde9n96fk	7	P	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-28 07:11:45.942	2025-04-29 01:27:46.572	2025-04-29 01:04:19.791	2025-04-29 01:14:47.784	f	\N
cma1tm46c0006uxh0iiuyxaob	6	P	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gboi00012uxmsp8l4ombk	2025-04-29 01:20:40.357	2025-05-02 06:15:00.261	2025-05-02 06:14:07.696	2025-05-02 06:15:00.233	f	\N
cm9wb2boc0004uxfsgdijpix7	41	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-25 04:42:32.989	2025-04-29 01:14:47.825	\N	2025-04-29 01:04:17.358	f	\N
cma1wh2as0004uxqwpdo6fmb6	11	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 02:40:43.492	2025-04-29 02:40:43.492	\N	\N	t	\N
cma1tedqk0003uxh0xlj38j52	3	P	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-29 01:14:39.501	2025-04-30 03:11:28.342	2025-04-29 01:14:36.165	2025-04-29 01:20:25.802	f	\N
cma1vkh3e0004uxl4f1k0ssrx	4	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 02:15:23.019	2025-04-29 02:15:23.019	\N	\N	f	\N
cma1wtbhh0006uxqw6klxcr87	15	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 02:50:15.27	2025-04-29 02:50:15.27	\N	\N	f	\N
cma1vky7s0005uxl4jg6bezd3	5	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 02:15:45.208	2025-04-29 02:15:45.208	\N	\N	f	\N
cma1vm4d50006uxl4u7b4p9ec	6	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 02:16:39.833	2025-04-29 02:16:39.833	\N	\N	f	\N
cma1vo0j20007uxl4zxvwt1fy	7	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 02:18:08.175	2025-04-29 02:18:08.175	\N	\N	f	\N
cma1vpcah0008uxl4283fgd84	8	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 02:19:10.074	2025-04-29 02:19:10.074	\N	\N	f	\N
cma1vpqri0009uxl4bvydp5gh	9	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 02:19:28.83	2025-04-29 02:19:28.83	\N	\N	f	\N
cma1vwhlx000auxl4ani8msfb	10	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 02:24:43.558	2025-04-29 02:24:43.558	\N	\N	f	\N
cma1wwrgm0007uxqwiaqdbcl5	16	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 02:52:55.942	2025-04-29 02:52:55.942	\N	\N	f	\N
cma1wx2250008uxqwh9ekt963	17	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 02:53:09.677	2025-04-29 02:53:09.677	\N	\N	f	\N
cma1x8bzj0000ux2w7xap23yj	3	CW	PENDING	cm96fwl7f0001uxms8ra0hvsn	\N	\N	2025-04-29 03:01:55.759	2025-04-29 03:01:55.759	\N	\N	f	\N
cma1xcm3f0001ux2wlru6w8d9	4	CW	PENDING	cm96fwl7f0001uxms8ra0hvsn	\N	\N	2025-04-29 03:05:15.484	2025-04-29 03:05:15.484	\N	\N	f	\N
cma1xmqr00003ux2wa691xnjl	18	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 03:13:08.077	2025-04-29 03:13:08.077	\N	\N	f	\N
cma1xnq2b0004ux2wu1ibdo5t	19	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 03:13:53.844	2025-04-29 03:13:53.844	\N	\N	f	\N
cma1xnxwt0005ux2wvhyvr0rv	20	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 03:14:04.013	2025-04-29 03:14:04.013	\N	\N	f	\N
cma1tvjdg0007uxh0r3wvgim2	7	P	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-29 01:27:59.956	2025-05-02 06:15:12.815	2025-04-29 01:28:02.702	2025-05-02 06:15:06.189	f	\N
cma1xolw90006ux2wwaxu3yua	21	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 03:14:35.097	2025-04-29 03:14:35.097	\N	\N	f	\N
cma1xr12v0007ux2w70r33hab	22	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 03:16:28.088	2025-04-29 03:16:28.088	\N	\N	f	\N
cma1xryvn0008ux2wfl97f6la	12	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 03:17:11.892	2025-04-29 03:17:11.892	\N	\N	t	\N
cma1xw0vg0009ux2wucjr0tb4	23	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 03:20:21.1	2025-04-29 03:20:21.1	\N	\N	f	\N
cma1xwgzp000aux2wiiy9qmmg	24	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 03:20:41.989	2025-04-29 03:20:41.989	\N	\N	t	\N
cma1xx6sg000bux2w1wu1i6sj	25	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 03:21:15.425	2025-04-29 03:21:15.425	\N	\N	t	\N
cma1xza05000cux2wjcl8b8sd	26	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 03:22:52.901	2025-04-29 03:22:52.901	\N	\N	t	\N
cma1y0dbe000dux2w74i2xgnq	27	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 03:23:43.851	2025-04-29 03:23:43.851	\N	\N	f	\N
cma1y2ljk000eux2wvj26ok6v	13	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 03:25:27.825	2025-04-29 03:25:27.825	\N	\N	f	\N
cma1zash6000fux2w14ul1p8g	28	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 03:59:49.675	2025-04-29 03:59:49.675	\N	\N	f	\N
cma1zcmu0000gux2wjl67k302	29	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 04:01:15.672	2025-04-29 04:01:15.672	\N	\N	f	\N
cma1znrok0000ux20cnjdowzy	30	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 04:09:55.172	2025-04-29 04:09:55.172	\N	\N	f	\N
cma1zo8tu0001ux206s62r028	31	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 04:10:17.394	2025-04-29 04:10:17.394	\N	\N	t	\N
cma1zrryi0002ux2068kxoqx7	32	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 04:13:02.154	2025-04-29 04:13:02.154	\N	\N	t	\N
cma2024cd0003ux20u5wu0wwh	33	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 04:21:04.766	2025-04-29 04:21:04.766	\N	\N	f	\N
cma203jr00004ux20vzwnrkqp	34	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 04:22:11.388	2025-04-29 04:22:11.388	\N	\N	t	\N
cma22rjji0001uxs02fp1hld3	35	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 05:36:50.094	2025-04-29 05:36:50.094	\N	\N	t	\N
cma22ryf80002uxs0kzr761do	36	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 05:37:09.38	2025-04-29 05:37:09.38	\N	\N	f	\N
cma22uiod0003uxs0j16w474g	37	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 05:39:08.941	2025-04-29 05:39:08.941	\N	\N	f	\N
cma22v2o20004uxs0rqre18mk	38	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 05:39:34.85	2025-04-29 05:39:34.85	\N	\N	f	\N
cma22w29w0005uxs0rj0v0rr1	39	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 05:40:20.997	2025-04-29 05:40:20.997	\N	\N	t	\N
cma22x8or0006uxs0dupaphrm	40	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 05:41:15.964	2025-04-29 05:41:15.964	\N	\N	f	\N
cma230hry0007uxs0kgwhi5ur	14	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:43:47.711	2025-04-29 05:43:47.711	\N	\N	t	\N
cma230wz40008uxs014h702b4	41	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 05:44:07.409	2025-04-29 05:44:07.409	\N	\N	f	\N
cma231pk00009uxs0p3oei8xu	42	P	PENDING	cm96fxc1l0003uxmsosr0p5en	\N	\N	2025-04-29 05:44:44.448	2025-04-29 05:44:44.448	\N	\N	f	\N
cma232jc7000auxs07tl69u7f	15	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:45:23.048	2025-04-29 05:45:23.048	\N	\N	f	\N
cma232wae000buxs0f76xuwia	16	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:45:39.83	2025-04-29 05:45:39.83	\N	\N	f	\N
cma2339tm000cuxs0k7fmexlw	17	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:45:57.371	2025-04-29 05:45:57.371	\N	\N	f	\N
cma233p1p000duxs0cahk13rx	18	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:46:17.102	2025-04-29 05:46:17.102	\N	\N	f	\N
cma234zd0000euxs0ljkz06yf	19	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:47:17.124	2025-04-29 05:47:17.124	\N	\N	f	\N
cma235dra000fuxs0uketrqgf	20	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:47:35.783	2025-04-29 05:47:35.783	\N	\N	f	\N
cma236vn4000guxs0iz15s880	21	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:48:45.617	2025-04-29 05:48:45.617	\N	\N	t	\N
cma236vnr000huxs0vdkgly2a	22	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:48:45.639	2025-04-29 05:48:45.639	\N	\N	t	\N
cma236wzp000iuxs0etuqdtyn	23	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:48:47.366	2025-04-29 05:48:47.366	\N	\N	t	\N
cma238xiv000luxs049grs4na	24	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:50:21.368	2025-04-29 05:50:21.368	\N	\N	t	\N
cma23bded000nuxs0kxryfp5d	25	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:52:15.253	2025-04-29 05:52:15.253	\N	\N	t	\N
cma23beqo000ouxs0gx9exyvz	26	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:52:16.992	2025-04-29 05:52:16.992	\N	\N	t	\N
cma23bnxo000puxs0ewzv3q50	27	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:52:28.908	2025-04-29 05:52:28.908	\N	\N	t	\N
cma23c25l000quxs0myefc5oc	28	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:52:47.338	2025-04-29 05:52:47.338	\N	\N	t	\N
cma23cg1i000ruxs0o4o6husj	29	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:53:05.335	2025-04-29 05:53:05.335	\N	\N	t	\N
cma23cu1i000suxs0t18rgwsu	30	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 05:53:23.478	2025-04-29 05:53:23.478	\N	\N	t	\N
cma24dwqv000tuxs0b6ex32m0	31	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 06:22:13.256	2025-04-29 06:22:13.256	\N	\N	f	\N
cma1swoyf0000uxh050qrk5ar	1	CW	CANCELLED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-29 01:00:54.232	2025-04-29 06:32:48.2	\N	2025-04-29 01:04:06.883	f	\N
cma1xezjm0002ux2wrlts69ds	5	CW	LAPSED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-29 03:07:06.226	2025-04-29 06:32:48.22	\N	2025-04-29 06:32:42.798	t	\N
cma20kr4a0005ux20tchj9d5e	6	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gcyxi001cuxmsmzz23c5y	2025-04-29 04:35:34.09	2025-04-29 08:02:52.431	2025-04-29 08:02:37.307	2025-04-29 08:02:46.586	t	\N
cma26i2on000uuxs0gwifjfi2	32	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 07:21:26.807	2025-04-29 07:21:26.807	\N	\N	f	\N
cma26i8j6000vuxs018eokn16	33	A	PENDING	cm96fwzqe0002uxmsus8h73xm	\N	\N	2025-04-29 07:21:34.387	2025-04-29 07:21:34.387	\N	\N	f	\N
cma20krpz0006ux20ompgiilm	7	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gao790010uxmswmi8f6m3	2025-04-29 04:35:34.871	2025-04-29 08:03:50.916	2025-04-29 08:03:33.994	2025-04-29 08:03:45.103	t	\N
cma20ldy10007ux20pk8453a4	8	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gbx0b0014uxmsbizk4ga3	2025-04-29 04:36:03.673	2025-04-30 01:38:29.728	2025-04-29 08:06:16.346	2025-04-30 01:38:28.277	t	\N
cma237gom000juxs0s6uj5blg	12	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gboi00012uxmsp8l4ombk	2025-04-29 05:49:12.886	2025-05-02 05:41:56.582	2025-05-02 01:04:46.78	2025-05-02 05:41:54.295	t	\N
cma20mucx0008ux209ilj5gif	9	CW	LAPSED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-29 04:37:11.601	2025-04-30 02:42:41.244	\N	2025-04-30 02:42:40.483	t	\N
cma20q5fb0009ux20ioww6890	10	CW	LAPSED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-29 04:39:45.911	2025-04-30 03:11:28.363	\N	2025-04-30 03:11:27.563	t	\N
cma21wfvx0000uxs0desb9wde	11	CW	LAPSED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	\N	2025-04-29 05:12:39.021	2025-04-30 03:11:57.07	\N	2025-04-30 03:11:57.022	t	\N
cma237qxa000kuxs0m52pti69	13	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gc4qm0016uxms4vjefcx5	2025-04-29 05:49:26.159	2025-05-02 06:05:18.984	2025-05-02 05:42:02.063	2025-05-02 06:05:18.491	t	\N
cma239dbn000muxs03afo5q68	14	CW	SERVED	cm96fwl7f0001uxms8ra0hvsn	cm96fxk7a0005uxmsvjvb2up6	cm96gboi00012uxmsp8l4ombk	2025-04-29 05:50:41.844	2025-05-02 06:13:37.03	2025-05-02 06:13:27.461	2025-05-02 06:13:36.967	t	test
\.


--
-- Data for Name: ScreensaverImage; Type: TABLE DATA; Schema: public; Owner: klwj
--

COPY public."ScreensaverImage" (id, title, "imageUrl", "isActive", "order", "createdAt", "updatedAt") FROM stdin;
cm9b34z8d00087kic5b4e5g3d	mannye.jpeg	/uploads/1744273050165-810033267-mannye.jpeg	f	3	2025-04-10 08:17:30.202	2025-04-29 01:32:53.837
cm9b30le500077kic3w3lg31f	lol.jpg	/uploads/1744272845615-218749161-lol.jpg	f	2	2025-04-10 08:14:05.645	2025-04-29 01:32:53.837
cma1u1gv0000auxh0rg1cftgw	wow	/uploads/1745890356609-519594834-photo2025-04-2713-17-25.jpg	t	7	2025-04-29 01:32:36.635	2025-04-29 01:32:58.802
cm9qnb2o60001uxs0ceahnir1	try	/uploads/1745213919513-936537318-fb4cf8ba-33ec-4cb9-852b-62076d8aac61.jfif	f	7	2025-04-21 05:38:39.558	2025-04-29 01:33:01.118
cm9qhw8y80000uxs0q8kqlc6l	palette.png	/uploads/1745204828978-324353284-palette.png	f	6	2025-04-21 03:07:09.775	2025-04-29 01:33:03.194
cm9b30f3o00067kiccftkvl51	arta.png	/uploads/1744272837252-747136425-arta.png	f	1	2025-04-10 08:13:57.489	2025-04-29 01:33:04.667
cm9c5y7p600087kh4nfgstfkm	anti-smoking.jpg	/uploads/1744338239360-248343198-anti-smoking.jpg	f	4	2025-04-11 02:23:59.523	2025-04-29 01:33:06.003
cm9c5yd9700097kh4pjt2gm6d	artas.png	/uploads/1744338246781-509357541-artas.png	f	5	2025-04-11 02:24:06.811	2025-04-29 01:33:07.201
\.


--
-- Data for Name: Service; Type: TABLE DATA; Schema: public; Owner: klwj
--

COPY public."Service" (id, code, name, "createdAt", "updatedAt", "supervisorId") FROM stdin;
cm96fxc1l0003uxmsosr0p5en	P	Payment	2025-04-07 02:16:37.689	2025-04-07 02:16:37.689	\N
cm96fwzqe0002uxmsus8h73xm	A	New Service Application	2025-04-07 02:16:21.734	2025-04-24 06:56:23.632	\N
cm96fwl7f0001uxms8ra0hvsn	CW	Customer Welfare	2025-04-07 02:16:02.907	2025-04-30 04:50:38.339	cm9w2zdih0000uxhghwwyp690
\.


--
-- Data for Name: ServiceType; Type: TABLE DATA; Schema: public; Owner: klwj
--

COPY public."ServiceType" (id, name, code, "serviceId", "createdAt", "updatedAt") FROM stdin;
cm96g2oa1000wuxmsixliay7t	PAYMENT	P-P	cm96fxc1l0003uxmsosr0p5en	2025-04-07 02:20:46.826	2025-04-07 02:20:46.826
cm96gacvo000yuxmsn9v3023i	PARTIAL PAYMENT	C-PP	cm96fwl7f0001uxms8ra0hvsn	2025-04-07 02:26:45.3	2025-04-07 02:26:45.3
cm96gao790010uxmswmi8f6m3	REQUEST TO RECONNECT	C-RTR	cm96fwl7f0001uxms8ra0hvsn	2025-04-07 02:26:59.973	2025-04-07 02:26:59.973
cm96gboi00012uxmsp8l4ombk	PROMISSORY NOTE	C-PN	cm96fwl7f0001uxms8ra0hvsn	2025-04-07 02:27:47.017	2025-04-07 02:27:47.017
cm96gbx0b0014uxmsbizk4ga3	BILL COMPLAINTS	C-BC	cm96fwl7f0001uxms8ra0hvsn	2025-04-07 02:27:58.043	2025-04-07 02:27:58.043
cm96gc4qm0016uxms4vjefcx5	METER TEST	C-MT	cm96fwl7f0001uxms8ra0hvsn	2025-04-07 02:28:08.063	2025-04-07 02:28:08.063
cm96gcg8y0018uxmsketzz9b2	REQUEST TO DISCONNECT	C-RTD	cm96fwl7f0001uxms8ra0hvsn	2025-04-07 02:28:22.978	2025-04-07 02:28:22.978
cm96gcp1d001auxmsj8eizead	TRANSFER METER	C-TM	cm96fwl7f0001uxms8ra0hvsn	2025-04-07 02:28:34.369	2025-04-07 02:28:34.369
cm96gcyxi001cuxmsmzz23c5y	SENIOR DISCOUNT	C-SD	cm96fwl7f0001uxms8ra0hvsn	2025-04-07 02:28:47.19	2025-04-07 02:28:47.19
cm96gd95l001euxms84nn2cc4	MAINTENANCE	C-M	cm96fwl7f0001uxms8ra0hvsn	2025-04-07 02:29:00.441	2025-04-07 02:29:00.441
cm96gdhnb001guxms3topib2o	APPLY	N-A	cm96fwzqe0002uxmsus8h73xm	2025-04-07 02:29:11.447	2025-04-07 02:29:11.447
cm96gdsyn001iuxms80xikr7j	FOLLOW-UP	N-F	cm96fwzqe0002uxmsus8h73xm	2025-04-07 02:29:26.112	2025-04-07 02:29:26.112
cm96ge3qm001kuxmsx47hm00s	ADDITIONAL CONNECTION	N-AC	cm96fwzqe0002uxmsus8h73xm	2025-04-07 02:29:40.079	2025-04-07 02:29:40.079
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: klwj
--

COPY public."User" (id, "firstName", "middleName", "lastName", email, image, password, username, role, "assignedCounterId", "createdAt", "updatedAt", "lastLogin") FROM stdin;
cm96fur910000uxmsx6tt7xm7	Admin		Admin	admin@email.com	\N	$2b$10$MCoe0sGchYiK.HTwXV8Js.FTP1iIcTXT85WwdoOX3lTfWxvmpdQN2	admin	{admin}	\N	2025-04-07 02:14:37.43	2025-04-07 02:14:37.43	\N
cm96fzmz0000suxms744stiks	Jahn Claudio	Pita	Lim	jahn@gmail.com	\N	$2b$10$/ibAy9wcg7xjNb/rkc7Fq.1AIJLFOzETCUEfi4hpmkU0M5Rne/fDG	jahn	{staff}	cm96fy2yh000fuxmsecd84ywf	2025-04-07 02:18:25.164	2025-04-07 02:19:50.647	\N
cm96g090j000tuxmsyd0qk0xn	James Florence	Pita	Lim	james@email.com	\N	$2b$10$MZu7uRH6RsAJQAj17TrPjeuHNIgFeHX/OA90NaVKBuX43mq.RMmYa	james	{staff}	cm96fxk7a0005uxmsvjvb2up6	2025-04-07 02:18:53.732	2025-04-07 02:19:59.585	\N
cm96g0uuy000uuxmsvsyxuz9g	Ralph		Saransate	ralph@email.com	\N	$2b$10$tosgQfHEt/niKb.eVbMbgOo0zIws6BqK8YqpkYsHN2ewW/i7rO80W	ralph	{staff}	cm9v0icsj0003ux6k3qd6i739	2025-04-07 02:19:22.042	2025-04-24 07:00:54.347	\N
cm9w2zdih0000uxhghwwyp690	Lebron		James	lebron@email.com	\N	$2b$10$w52qRSaTzvyX4JS57lZy.OxvrX8RbQue5aNm5Sc1E4/lIDhmTairO	lebron	{supervisor}	\N	2025-04-25 00:56:18.473	2025-04-30 04:50:38.339	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: klwj
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
36c3c9a0-2ef7-49c4-a32b-bef9ee35de82	091dc74757ed7448210555ca3625b271a9d1ec8780ed066e3c5db4a51f45c73b	2025-04-07 01:58:04.059642+00	20250407015804_add_screensaver_models	\N	\N	2025-04-07 01:58:04.042262+00	1
\.


--
-- Name: Counter Counter_pkey; Type: CONSTRAINT; Schema: public; Owner: klwj
--

ALTER TABLE ONLY public."Counter"
    ADD CONSTRAINT "Counter_pkey" PRIMARY KEY (id);


--
-- Name: QueueTicket QueueTicket_pkey; Type: CONSTRAINT; Schema: public; Owner: klwj
--

ALTER TABLE ONLY public."QueueTicket"
    ADD CONSTRAINT "QueueTicket_pkey" PRIMARY KEY (id);


--
-- Name: ScreensaverImage ScreensaverImage_pkey; Type: CONSTRAINT; Schema: public; Owner: klwj
--

ALTER TABLE ONLY public."ScreensaverImage"
    ADD CONSTRAINT "ScreensaverImage_pkey" PRIMARY KEY (id);


--
-- Name: ServiceType ServiceType_pkey; Type: CONSTRAINT; Schema: public; Owner: klwj
--

ALTER TABLE ONLY public."ServiceType"
    ADD CONSTRAINT "ServiceType_pkey" PRIMARY KEY (id);


--
-- Name: Service Service_pkey; Type: CONSTRAINT; Schema: public; Owner: klwj
--

ALTER TABLE ONLY public."Service"
    ADD CONSTRAINT "Service_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: klwj
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: klwj
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Counter_code_key; Type: INDEX; Schema: public; Owner: klwj
--

CREATE UNIQUE INDEX "Counter_code_key" ON public."Counter" USING btree (code);


--
-- Name: ServiceType_code_key; Type: INDEX; Schema: public; Owner: klwj
--

CREATE UNIQUE INDEX "ServiceType_code_key" ON public."ServiceType" USING btree (code);


--
-- Name: Service_code_key; Type: INDEX; Schema: public; Owner: klwj
--

CREATE UNIQUE INDEX "Service_code_key" ON public."Service" USING btree (code);


--
-- Name: Service_supervisorId_key; Type: INDEX; Schema: public; Owner: klwj
--

CREATE UNIQUE INDEX "Service_supervisorId_key" ON public."Service" USING btree ("supervisorId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: klwj
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: klwj
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: Counter Counter_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: klwj
--

ALTER TABLE ONLY public."Counter"
    ADD CONSTRAINT "Counter_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public."Service"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QueueTicket QueueTicket_counterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: klwj
--

ALTER TABLE ONLY public."QueueTicket"
    ADD CONSTRAINT "QueueTicket_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES public."Counter"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QueueTicket QueueTicket_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: klwj
--

ALTER TABLE ONLY public."QueueTicket"
    ADD CONSTRAINT "QueueTicket_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public."Service"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QueueTicket QueueTicket_serviceTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: klwj
--

ALTER TABLE ONLY public."QueueTicket"
    ADD CONSTRAINT "QueueTicket_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES public."ServiceType"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ServiceType ServiceType_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: klwj
--

ALTER TABLE ONLY public."ServiceType"
    ADD CONSTRAINT "ServiceType_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public."Service"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Service Service_supervisorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: klwj
--

ALTER TABLE ONLY public."Service"
    ADD CONSTRAINT "Service_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_assignedCounterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: klwj
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_assignedCounterId_fkey" FOREIGN KEY ("assignedCounterId") REFERENCES public."Counter"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: klwj
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

