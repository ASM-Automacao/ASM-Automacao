-- Complemento seguro: adiciona colunas e amplia checks para integração Meta.
-- Não remove tabelas nem dados existentes.

begin;

alter table public.outbound_messages
  add column if not exists error_message text,
  add column if not exists raw_response jsonb;

alter table public.inbound_messages
  add column if not exists raw_payload jsonb;

-- Recria constraint de status em outbound_messages para incluir meta_sent
alter table public.outbound_messages
  drop constraint if exists outbound_messages_status_check;

alter table public.outbound_messages
  add constraint outbound_messages_status_check
  check (
    status = any (
      array[
        'queued'::text,
        'simulated_sent'::text,
        'meta_sent'::text,
        'sent'::text,
        'delivered'::text,
        'read'::text,
        'failed'::text
      ]
    )
  );

commit;
