
ALTER TABLE public.app_config ADD COLUMN IF NOT EXISTS owner_uid uuid;

-- entries: write policies tied to owner
CREATE POLICY "entries_owner_insert" ON public.entries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = (SELECT owner_uid FROM public.app_config WHERE id = 1));

CREATE POLICY "entries_owner_update" ON public.entries
  FOR UPDATE TO authenticated
  USING (auth.uid() = (SELECT owner_uid FROM public.app_config WHERE id = 1))
  WITH CHECK (auth.uid() = (SELECT owner_uid FROM public.app_config WHERE id = 1));

CREATE POLICY "entries_owner_delete" ON public.entries
  FOR DELETE TO authenticated
  USING (auth.uid() = (SELECT owner_uid FROM public.app_config WHERE id = 1));

-- app_config: public read so client can check initialized status
CREATE POLICY "app_config_public_read" ON public.app_config
  FOR SELECT USING (true);

-- Allow first authed user to claim ownership; afterwards only owner can update
CREATE POLICY "app_config_claim_or_owner_update" ON public.app_config
  FOR UPDATE TO authenticated
  USING (owner_uid IS NULL OR owner_uid = auth.uid())
  WITH CHECK (owner_uid = auth.uid());

-- Ensure the singleton config row exists
INSERT INTO public.app_config (id, session_secret)
VALUES (1, encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (id) DO NOTHING;
