begin;

insert into public.clients (
  contact_name,
  business_name,
  phone,
  type,
  city,
  neighborhood,
  status,
  receives_price_table,
  receives_promotions,
  send_monday,
  send_tuesday,
  send_wednesday,
  send_thursday,
  send_friday,
  send_saturday,
  send_sunday,
  notes
)
values
  ('Carlos Oliveira', 'Açougue Bom Fim', '5522999911111', 'Açougue', 'Cabo Frio', 'Centro', 'active', true, true, true, false, true, false, true, false, false, 'Cliente recorrente.'),
  ('Joana Melo', 'Restaurante Mar Azul', '5522999922222', 'Restaurante', 'Cabo Frio', 'Passagem', 'active', true, true, true, true, false, true, false, false, false, null),
  ('Roberto Silva', 'Churrascaria Central', '5522999933333', 'Restaurante', 'Cabo Frio', 'Braga', 'active', true, true, true, false, false, false, true, false, false, null),
  ('Fernanda Costa', 'Mercado Costa Verde', '5522999944444', 'Mercado', 'Cabo Frio', 'São Cristóvão', 'active', true, false, false, true, false, true, false, false, false, 'Recebe só tabela.'),
  ('Sérgio Alves', 'Hotel Atlântico', '5522999955555', 'Hotel', 'Cabo Frio', 'Praia do Forte', 'active', true, true, false, false, true, false, true, false, false, null),
  ('Paula Matos', 'Empório da Serra', '5522999966666', 'Mercado', 'Arraial do Cabo', 'Prainha', 'active', true, true, true, false, true, false, false, false, false, null),
  ('Marcelo Pinto', 'Bistrô do Porto', '5522999977777', 'Restaurante', 'Búzios', 'Centro', 'active', true, true, false, true, false, true, false, false, false, null),
  ('Ana Luiza', 'Mercadinho Ana', '5522999988888', 'Mercado', 'São Pedro da Aldeia', 'Estação', 'inactive', false, false, false, false, false, false, false, false, false, 'Inativo temporariamente.')
on conflict (phone) do nothing;

insert into public.products (name, category, supplier, default_unit, image_url, status, notes)
values
  ('Picanha', 'Bovino', 'Cruzeiro do Sul', 'kg', null, 'active', null),
  ('Alcatra', 'Bovino', 'Cruzeiro do Sul', 'kg', null, 'active', null),
  ('Contra filé', 'Bovino', 'Cruzeiro do Sul', 'kg', null, 'active', null),
  ('Acém', 'Bovino', 'Cruzeiro do Sul', 'kg', null, 'active', null),
  ('Fraldinha', 'Bovino', 'Cruzeiro do Sul', 'kg', null, 'active', null),
  ('Linguiça Toscana', 'Suíno', 'Cruzeiro do Sul', 'kg', null, 'active', null),
  ('Costela', 'Bovino', 'Cruzeiro do Sul', 'kg', null, 'active', null),
  ('Cupim', 'Bovino', 'Cruzeiro do Sul', 'kg', null, 'active', null);

with inserted_table as (
  insert into public.daily_price_tables (date, supplier, raw_text, status)
  values (
    current_date,
    'Cruzeiro do Sul',
    'Picanha 89,90/kg
Alcatra 42,50/kg
Contra filé 45,00/kg
Acém 29,90/kg
Fraldinha 48,90/kg
Linguiça Toscana 19,90/kg',
    'parsed'
  )
  returning id
)
insert into public.daily_price_table_items (table_id, product_id, product_name, price, unit, notes)
select
  inserted_table.id,
  products.id,
  products.name,
  prices.price,
  'kg',
  null
from inserted_table
join (
  values
    ('Picanha', 89.90::numeric),
    ('Alcatra', 42.50::numeric),
    ('Contra filé', 45.00::numeric),
    ('Acém', 29.90::numeric),
    ('Fraldinha', 48.90::numeric),
    ('Linguiça Toscana', 19.90::numeric)
) as prices(product_name, price) on true
join public.products products on products.name = prices.product_name;

with table_campaign as (
  insert into public.campaigns (type, title, message_preview, status, audience_type, sent_at)
  values (
    'table',
    'Bom dia + tabela do dia',
    'Bom dia! Segue a tabela de hoje da Cruzeiro do Sul...',
    'sent',
    'today',
    now() - interval '2 hours'
  )
  returning id
),
promo_campaign as (
  insert into public.campaigns (type, title, message_preview, status, audience_type, sent_at)
  values (
    'promotion',
    'Oferta Picanha',
    '🔥 Oferta do dia — Picanha...',
    'sent',
    'manual',
    now() - interval '1 hour'
  )
  returning id
),
recipient_rows as (
  insert into public.campaign_recipients (campaign_id, client_id, status, sent_at, delivered_at, read_at)
  select
    c.id,
    cl.id,
    case when cl.business_name = 'Mercado Costa Verde' then 'replied' else 'read' end,
    now() - interval '2 hours',
    now() - interval '1 hour 50 minutes',
    now() - interval '1 hour 45 minutes'
  from table_campaign c
  join public.clients cl on cl.status = 'active' and cl.receives_price_table = true
  limit 4
  returning campaign_id, client_id
)
insert into public.outbound_messages (client_id, campaign_id, phone, body, media_url, provider, provider_message_id, status, created_at, sent_at)
select
  rr.client_id,
  rr.campaign_id,
  cl.phone,
  'Bom dia! Segue a tabela de hoje da Cruzeiro do Sul...',
  null,
  'mock',
  'mock-msg-' || row_number() over (),
  'simulated_sent',
  now() - interval '2 hours',
  now() - interval '2 hours'
from recipient_rows rr
join public.clients cl on cl.id = rr.client_id;

with promo as (
  select id from public.campaigns where type = 'promotion' order by created_at desc limit 1
),
selected_clients as (
  select id, phone
  from public.clients
  where status = 'active' and receives_promotions = true
  order by created_at asc
  limit 3
),
inserted_recipients as (
  insert into public.campaign_recipients (campaign_id, client_id, status, sent_at, delivered_at)
  select promo.id, sc.id, 'sent', now() - interval '1 hour', now() - interval '55 minutes'
  from promo, selected_clients sc
  returning campaign_id, client_id
)
insert into public.outbound_messages (client_id, campaign_id, phone, body, media_url, provider, provider_message_id, status, created_at, sent_at)
select
  ir.client_id,
  ir.campaign_id,
  sc.phone,
  '🔥 Oferta do dia — Picanha...',
  null,
  'mock',
  'mock-promo-' || row_number() over (),
  'simulated_sent',
  now() - interval '1 hour',
  now() - interval '1 hour'
from inserted_recipients ir
join selected_clients sc on sc.id = ir.client_id;

with target_campaign as (
  select id from public.campaigns where type = 'table' order by created_at desc limit 1
),
target_client as (
  select id, phone from public.clients where business_name = 'Açougue Bom Fim' limit 1
),
inserted_inbound as (
  insert into public.inbound_messages (client_id, phone, body, provider_message_id, campaign_id, status, created_at)
  select
    tc.id,
    tc.phone,
    'Quero 15 caixas de picanha para hoje.',
    'mock-in-1',
    tca.id,
    'converted_to_order',
    now() - interval '40 minutes'
  from target_client tc, target_campaign tca
  returning id, campaign_id, client_id
)
insert into public.orders (date, client_id, product_id, product_name, quantity, unit, unit_price, status, notes, campaign_id, inbound_message_id)
select
  current_date,
  ii.client_id,
  p.id,
  p.name,
  15,
  'caixas',
  89.90,
  'verificar_estoque',
  'Gerado a partir da resposta mock.',
  ii.campaign_id,
  ii.id
from inserted_inbound ii
join public.products p on p.name = 'Picanha';

insert into public.settings (key, value)
values
  ('default_supplier', '"Cruzeiro do Sul"'::jsonb),
  (
    'default_table_message',
    to_jsonb(
      'Bom dia! Segue a tabela de hoje da Cruzeiro do Sul:

{{itens_da_tabela}}

Valores e disponibilidade sujeitos à confirmação.
Para consultar ou reservar, responda esta mensagem.'::text
    )
  ),
  (
    'default_promotion_message',
    to_jsonb(
      '🔥 Oferta do dia — {{produto}}

{{produto}} baixou hoje!

De R$ {{preco_anterior}}/{{unidade}}
Por R$ {{preco_atual}}/{{unidade}}

Oferta sujeita à disponibilidade.
Para consultar, responda esta mensagem.'::text
    )
  ),
  ('whatsapp_mode', '"mock"'::jsonb),
  ('integration_status', '{"provider":"mock","connected":true}'::jsonb)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();

commit;
