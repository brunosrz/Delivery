-- Dados sintéticos de demonstração. Nunca usar dados reais de restaurantes ou clientes.
INSERT INTO restaurants (id, slug, name, description, delivery_fee_cents, minimum_order_cents, priority)
VALUES
  ('rest_pizzaria', 'pizzaria-da-praca', 'Pizzaria da Praça', 'Pizzas de massa fina assadas na pedra.', 790, 2500, 2),
  ('rest_burger', 'burger-do-bairro', 'Burger do Bairro', 'Hambúrgueres artesanais e porções.', 590, 2000, 1);

INSERT INTO opening_hours (id, restaurant_id, weekday, opens_at, closes_at)
VALUES
  ('oh_pz_5', 'rest_pizzaria', 5, 1080, 1380),
  ('oh_pz_6', 'rest_pizzaria', 6, 1080, 1410),
  ('oh_bg_5', 'rest_burger', 5, 1110, 1380);

INSERT INTO menu_sections (id, restaurant_id, name, position)
VALUES
  ('sec_pz_pizzas', 'rest_pizzaria', 'Pizzas', 0),
  ('sec_pz_bebidas', 'rest_pizzaria', 'Bebidas', 1),
  ('sec_bg_burgers', 'rest_burger', 'Hambúrgueres', 0);

INSERT INTO products (id, restaurant_id, section_id, slug, name, description, price_cents, original_price_cents, max_quantity, position)
VALUES
  ('prod_pz_frango', 'rest_pizzaria', 'sec_pz_pizzas', 'pizza-de-frango', 'Pizza de frango', 'Frango desfiado, catupiry e milho.', 4590, NULL, 10, 0),
  ('prod_pz_carne', 'rest_pizzaria', 'sec_pz_pizzas', 'pizza-de-carne-seca', 'Pizza de carne seca', 'Carne seca, cebola roxa e mussarela.', 5290, 5890, 10, 1),
  ('prod_pz_refri', 'rest_pizzaria', 'sec_pz_bebidas', 'refrigerante-lata', 'Refrigerante lata', '350 ml.', 650, NULL, 12, 0),
  ('prod_bg_classico', 'rest_burger', 'sec_bg_burgers', 'burger-classico', 'Burger clássico', 'Pão brioche, 160 g, queijo e salada.', 3290, NULL, 8, 0);

INSERT INTO addon_groups (id, restaurant_id, product_id, name, min_selections, max_selections, position)
VALUES
  ('grp_pz_frango_borda', 'rest_pizzaria', 'prod_pz_frango', 'Borda', 0, 1, 0),
  ('grp_bg_ponto', 'rest_burger', 'prod_bg_classico', 'Ponto da carne', 1, 1, 0),
  ('grp_bg_extras', 'rest_burger', 'prod_bg_classico', 'Adicionais', 0, 3, 1);

INSERT INTO addon_options (id, restaurant_id, group_id, name, price_cents, position)
VALUES
  ('opt_pz_catupiry', 'rest_pizzaria', 'grp_pz_frango_borda', 'Catupiry', 800, 0),
  ('opt_pz_cheddar', 'rest_pizzaria', 'grp_pz_frango_borda', 'Cheddar', 800, 1),
  ('opt_bg_mal', 'rest_burger', 'grp_bg_ponto', 'Mal passado', 0, 0),
  ('opt_bg_ponto', 'rest_burger', 'grp_bg_ponto', 'Ao ponto', 0, 1),
  ('opt_bg_bacon', 'rest_burger', 'grp_bg_extras', 'Bacon', 500, 0),
  ('opt_bg_ovo', 'rest_burger', 'grp_bg_extras', 'Ovo', 300, 1);
