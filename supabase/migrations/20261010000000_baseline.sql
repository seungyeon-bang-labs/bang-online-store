-- 로컬 전용 베이스라인. 운영에는 적용하지 않는다.
-- 운영 스키마 덤프(2026-11-05)에서 migration이 만들지 않는 객체만 옮겼다: 회원·약관 테이블, 그 enum·함수·제약·인덱스·트리거·RLS·정책·권한.
-- 운영에는 이미 있으므로 db push 등으로 운영에 보내지 않는다. 다시 만들 때는 scripts/prod-dump.sh 결과에서 같은 기준으로 뽑는다.

-- 회원 테이블이 이미 있는 DB(운영 등)에 실수로 보내면 아무것도 만들지 않고 멈춘다.
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    RAISE EXCEPTION 'LOCAL_ONLY_BASELINE: 로컬 전용 베이스라인입니다. 회원 테이블이 이미 있는 DB에는 적용하지 않습니다.';
  END IF;
END $$;

--
-- Name: term_kind; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.term_kind AS ENUM (
    'document',
    'confirmation'
);


ALTER TYPE public.term_kind OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'customer',
    'admin'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: TYPE user_role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.user_role IS '유저 권한';

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'suspended',
    'deleted'
);


ALTER TYPE public.user_status OWNER TO postgres;

--
-- Name: TYPE user_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.user_status IS '계정 상태 ';

--
-- Name: complete_signup(uuid, text, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.complete_signup(p_user_id uuid, p_email text, p_name text, p_phone_number text, p_agreements jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $_$
DECLARE
  account auth.users%ROWTYPE;
  member_status public.user_status;
BEGIN
  -- Serializes completion requests without changing Auth account fields.
  SELECT * INTO account FROM auth.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND OR account.email_confirmed_at IS NULL
     OR account.email IS DISTINCT FROM p_email THEN
    RAISE EXCEPTION 'SIGNUP_SESSION_INVALID' USING ERRCODE = '28000';
  END IF;
  SELECT status INTO member_status FROM public.users WHERE id = p_user_id;
  IF FOUND THEN
    IF member_status <> 'active' THEN
      RAISE EXCEPTION 'SIGNUP_MEMBER_BLOCKED' USING ERRCODE = '42501';
    END IF;
    RETURN p_user_id;
  END IF;
  IF p_name IS NULL OR p_name <> btrim(p_name) OR char_length(p_name) NOT BETWEEN 1 AND 50
     OR p_phone_number IS NULL OR p_phone_number !~ '^01[016789][0-9]{7,8}$'
     OR jsonb_typeof(p_agreements) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'SIGNUP_VALIDATION_ERROR' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_agreements) > 100 OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_agreements) AS items(item)
    WHERE jsonb_typeof(item) IS DISTINCT FROM 'object'
      OR jsonb_typeof(item->'termId') IS DISTINCT FROM 'string'
      OR (item->>'termId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      OR jsonb_typeof(item->'agreed') IS DISTINCT FROM 'boolean'
  ) THEN
    RAISE EXCEPTION 'SIGNUP_VALIDATION_ERROR' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_agreements) AS items(item)
    GROUP BY (item->>'termId')::uuid HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'SIGNUP_VALIDATION_ERROR' USING ERRCODE = '22023';
  END IF;
  -- No special term-publication locking for this demo; validate at completion.
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_agreements) AS items(item)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.terms t JOIN public.term_codes c ON c.id = t.term_code_id
      WHERE t.id = (item->>'termId')::uuid AND t.is_active AND c.is_active AND t.effective_at <= now()
    )
  ) OR EXISTS (
    SELECT 1 FROM public.terms t JOIN public.term_codes c ON c.id = t.term_code_id
    WHERE t.is_active AND c.is_active AND t.effective_at <= now() AND t.is_required
      AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(p_agreements) AS items(item)
        WHERE (item->>'termId')::uuid = t.id AND (item->>'agreed')::boolean
      )
  ) THEN
    RAISE EXCEPTION 'SIGNUP_TERMS_CHANGED' USING ERRCODE = '23514';
  END IF;
  INSERT INTO public.users (id, email, name, phone_number, email_verified_at, role, status)
  VALUES (p_user_id, account.email, p_name, p_phone_number, account.email_confirmed_at, 'customer', 'active');
  INSERT INTO public.user_term_consents (user_id, term_id)
  SELECT p_user_id, (item->>'termId')::uuid FROM jsonb_array_elements(p_agreements) AS items(item)
  WHERE (item->>'agreed')::boolean;
  RETURN p_user_id;
END;
$_$;


ALTER FUNCTION public.complete_signup(p_user_id uuid, p_email text, p_name text, p_phone_number text, p_agreements jsonb) OWNER TO postgres;

--
-- Name: prevent_term_code_kind_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_term_code_kind_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.terms WHERE term_code_id = OLD.id) THEN
    RAISE EXCEPTION 'Cannot change kind of a term code with existing versions'
      USING ERRCODE = '23514', CONSTRAINT = 'term_codes_kind_immutable_with_versions';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_term_code_kind_change() OWNER TO postgres;

--
-- Name: touch_signup_member_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.touch_signup_member_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION public.touch_signup_member_updated_at() OWNER TO postgres;

--
-- Name: validate_term_content_kind(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_term_content_kind() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  parent_kind public.term_kind;
BEGIN
  -- Coordinate version writes with concurrent changes to the parent kind.
  SELECT kind INTO parent_kind FROM public.term_codes
  WHERE id = NEW.term_code_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Term code does not exist' USING ERRCODE = '23503';
  END IF;
  IF (parent_kind = 'document' AND COALESCE(NEW.content, '') !~ '[^[:space:]]')
     OR (parent_kind = 'confirmation' AND NEW.content IS NOT NULL) THEN
    RAISE EXCEPTION 'Term content does not match its code kind'
      USING ERRCODE = '23514', CONSTRAINT = 'terms_content_matches_kind';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_term_content_kind() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: term_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.term_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    title text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    kind public.term_kind DEFAULT 'document'::public.term_kind NOT NULL,
    CONSTRAINT term_codes_code_not_blank CHECK ((length(TRIM(BOTH FROM code)) > 0)),
    CONSTRAINT term_codes_title_not_blank CHECK ((length(TRIM(BOTH FROM title)) > 0))
);


ALTER TABLE public.term_codes OWNER TO postgres;

--
-- Name: terms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.terms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    term_code_id uuid NOT NULL,
    version text NOT NULL,
    title text NOT NULL,
    content text,
    is_required boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    effective_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT terms_title_not_blank CHECK ((length(TRIM(BOTH FROM title)) > 0)),
    CONSTRAINT terms_version_not_blank CHECK ((length(TRIM(BOTH FROM version)) > 0))
);


ALTER TABLE public.terms OWNER TO postgres;

--
-- Name: user_term_consents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_term_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    term_id uuid NOT NULL,
    consented_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_term_consents OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    email_verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    role public.user_role DEFAULT 'customer'::public.user_role NOT NULL,
    status public.user_status DEFAULT 'active'::public.user_status NOT NULL,
    name text NOT NULL,
    phone_number text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT users_name_check CHECK (((name = btrim(name)) AND ((char_length(name) >= 1) AND (char_length(name) <= 50)))),
    CONSTRAINT users_phone_number_check CHECK ((phone_number ~ '^01[016789][0-9]{7,8}$'::text))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: term_codes term_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.term_codes
    ADD CONSTRAINT term_codes_code_key UNIQUE (code);

--
-- Name: term_codes term_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.term_codes
    ADD CONSTRAINT term_codes_pkey PRIMARY KEY (id);

--
-- Name: terms terms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms
    ADD CONSTRAINT terms_pkey PRIMARY KEY (id);

--
-- Name: terms terms_term_code_id_version_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms
    ADD CONSTRAINT terms_term_code_id_version_key UNIQUE (term_code_id, version);

--
-- Name: user_term_consents user_term_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_term_consents
    ADD CONSTRAINT user_term_consents_pkey PRIMARY KEY (id);

--
-- Name: user_term_consents user_term_consents_user_id_term_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_term_consents
    ADD CONSTRAINT user_term_consents_user_id_term_id_key UNIQUE (user_id, term_id);

--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

--
-- Name: term_codes_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX term_codes_is_active_idx ON public.term_codes USING btree (is_active);

--
-- Name: terms_effective_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX terms_effective_at_idx ON public.terms USING btree (effective_at);

--
-- Name: terms_one_active_version_per_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX terms_one_active_version_per_code ON public.terms USING btree (term_code_id) WHERE (is_active = true);

--
-- Name: terms_term_code_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX terms_term_code_id_idx ON public.terms USING btree (term_code_id);

--
-- Name: term_codes term_codes_prevent_kind_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER term_codes_prevent_kind_change BEFORE UPDATE OF kind ON public.term_codes FOR EACH ROW WHEN ((old.kind IS DISTINCT FROM new.kind)) EXECUTE FUNCTION public.prevent_term_code_kind_change();

--
-- Name: terms terms_validate_content_kind; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER terms_validate_content_kind BEFORE INSERT OR UPDATE ON public.terms FOR EACH ROW EXECUTE FUNCTION public.validate_term_content_kind();

--
-- Name: users users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.touch_signup_member_updated_at();

--
-- Name: terms terms_term_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms
    ADD CONSTRAINT terms_term_code_id_fkey FOREIGN KEY (term_code_id) REFERENCES public.term_codes(id) ON DELETE RESTRICT;

--
-- Name: user_term_consents user_term_consents_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_term_consents
    ADD CONSTRAINT user_term_consents_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id) ON UPDATE CASCADE ON DELETE RESTRICT;

--
-- Name: user_term_consents user_term_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_term_consents
    ADD CONSTRAINT user_term_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

--
-- Name: users users_auth_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_auth_user_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE RESTRICT;

--
-- Name: term_codes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.term_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: term_codes term_codes_public_active_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY term_codes_public_active_read ON public.term_codes FOR SELECT TO authenticated, anon USING ((is_active = true));

--
-- Name: terms; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;

--
-- Name: terms terms_public_effective_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY terms_public_effective_read ON public.terms FOR SELECT TO authenticated, anon USING (((is_active = true) AND (effective_at <= now()) AND (EXISTS ( SELECT 1
   FROM public.term_codes
  WHERE ((term_codes.id = terms.term_code_id) AND (term_codes.is_active = true))))));

--
-- Name: user_term_consents; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_term_consents ENABLE ROW LEVEL SECURITY;

--
-- Name: user_term_consents user_term_consents_read_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY user_term_consents_read_own ON public.user_term_consents FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: users users_read_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_read_own ON public.users FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = id));

--
-- Name: FUNCTION complete_signup(p_user_id uuid, p_email text, p_name text, p_phone_number text, p_agreements jsonb); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.complete_signup(p_user_id uuid, p_email text, p_name text, p_phone_number text, p_agreements jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.complete_signup(p_user_id uuid, p_email text, p_name text, p_phone_number text, p_agreements jsonb) TO service_role;

--
-- Name: FUNCTION prevent_term_code_kind_change(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.prevent_term_code_kind_change() FROM PUBLIC;
GRANT ALL ON FUNCTION public.prevent_term_code_kind_change() TO service_role;

--
-- Name: FUNCTION touch_signup_member_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.touch_signup_member_updated_at() FROM PUBLIC;
GRANT ALL ON FUNCTION public.touch_signup_member_updated_at() TO service_role;

--
-- Name: FUNCTION validate_term_content_kind(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.validate_term_content_kind() FROM PUBLIC;
GRANT ALL ON FUNCTION public.validate_term_content_kind() TO service_role;

--
-- Name: TABLE term_codes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.term_codes TO anon;
GRANT ALL ON TABLE public.term_codes TO authenticated;
GRANT ALL ON TABLE public.term_codes TO service_role;

--
-- Name: TABLE terms; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.terms TO anon;
GRANT ALL ON TABLE public.terms TO authenticated;
GRANT ALL ON TABLE public.terms TO service_role;

--
-- Name: TABLE user_term_consents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_term_consents TO service_role;
GRANT SELECT ON TABLE public.user_term_consents TO authenticated;

--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO service_role;
GRANT SELECT ON TABLE public.users TO authenticated;

-- 로컬 Supabase는 public의 새 테이블·함수에 anon·authenticated 전체 권한을 기본으로 준다.
-- 운영은 이 권한을 거둬 두었으므로, 운영과 같게 거둔 뒤 운영에 있는 SELECT만 다시 준다.
REVOKE ALL ON FUNCTION public.complete_signup(p_user_id uuid, p_email text, p_name text, p_phone_number text, p_agreements jsonb) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_term_code_kind_change() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_signup_member_updated_at() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_term_content_kind() FROM anon, authenticated;
REVOKE ALL ON TABLE public.users, public.user_term_consents FROM anon, authenticated;
GRANT SELECT ON TABLE public.users, public.user_term_consents TO authenticated;

-- 운영에는 대시보드 설정으로 생긴 rls_auto_enable 함수가 있다(public 새 테이블의 RLS를 자동으로 켬).
-- 함수는 운영 덤프 그대로 옮기고, 실제로 동작하도록 이벤트 트리거를 붙인다. 이벤트 트리거는 덤프에 나오지 않아 이름은 로컬에서 정했다.
-- 로컬에서 RLS가 켜지는 쪽으로 맞추면, migration에서 RLS를 빠뜨렸을 때 로컬에서 먼저 막혀 드러난다.

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;

ALTER FUNCTION public.rls_auto_enable() OWNER TO postgres;

CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();
