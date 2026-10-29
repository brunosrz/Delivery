# Delivery Express - Documentação do Banco de Dados

Este pacote contém o schema e as funções de acesso ao banco de dados para o Delivery Express.

## Estrutura do Banco de Dados

### Tabelas Principais

#### restaurants
Armazena informações sobre os restaurantes.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único do restaurante |
| name | text | Nome do restaurante |
| restaurant_slug | text | Slug para URLs amigáveis |
| logo_url | text | URL do logotipo |
| cover_url | text | URL da imagem de capa |
| description | text | Descrição do restaurante |
| email | text | Email de contato |
| phone | text | Telefone de contato |
| cnpj | varchar | CNPJ do restaurante |
| address | text | Endereço completo |
| cep | text | CEP |
| latitude | numeric | Latitude para geolocalização |
| longitude | numeric | Longitude para geolocalização |
| frete_fixo | numeric | Valor fixo do frete |
| frete_limite_km | numeric | Limite de km para frete fixo |
| frete_por_km_excedente | numeric | Valor por km excedente |
| open_hours | jsonb | Horários de funcionamento |
| is_open | boolean | Se está aberto no momento |
| delivery_enabled | boolean | Se oferece entrega |
| pickup_enabled | boolean | Se oferece retirada |
| domain | varchar | Domínio personalizado |
| priority | integer | Prioridade para ordenação |

#### products
Armazena informações sobre os produtos/pratos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único do produto |
| restaurant_id | uuid | ID do restaurante |
| title | text | Nome do produto |
| description | text | Descrição do produto |
| image_url | text | URL da imagem |
| price | numeric | Preço atual |
| product_slug | text | Slug para URLs amigáveis |
| priority | integer | Prioridade para ordenação |
| available | boolean | Se está disponível |
| original_price | numeric | Preço original (antes do desconto) |
| discount_percentage | integer | Percentual de desconto |
| featured | boolean | Se é um produto em destaque |
| nutritional_info | jsonb | Informações nutricionais |
| ingredients | text[] | Lista de ingredientes |
| preparation_time | integer | Tempo de preparo em minutos |
| tags | text[] | Tags para categorização |

#### menu_sections
Armazena as categorias/seções do menu.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único da seção |
| restaurant_id | uuid | ID do restaurante |
| title | text | Nome da seção |
| is_recommended | boolean | Se é uma seção recomendada |
| priority | integer | Prioridade para ordenação |

#### menu_section_products
Relaciona produtos com seções do menu (muitos para muitos).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| section_id | uuid | ID da seção |
| product_id | uuid | ID do produto |

#### addon_groups
Armazena grupos de adicionais para produtos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único do grupo |
| product_id | uuid | ID do produto |
| title | text | Nome do grupo |
| min | integer | Mínimo de seleções |
| max | integer | Máximo de seleções |
| required | boolean | Se é obrigatório |

#### addons
Armazena os adicionais individuais.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único do adicional |
| group_id | uuid | ID do grupo |
| title | text | Nome do adicional |
| price | numeric | Preço do adicional |

### Tabelas de Pedidos

#### orders
Armazena os pedidos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único do pedido |
| restaurant_id | uuid | ID do restaurante |
| user_id | uuid | ID do usuário (opcional) |
| status | text | Status do pedido |
| total | numeric | Valor total |
| subtotal | numeric | Subtotal (sem taxas) |
| delivery_fee | numeric | Taxa de entrega |
| address | text | Endereço de entrega |
| payment_method | text | Método de pagamento |
| payment_status | text | Status do pagamento |
| notes | text | Observações |

#### order_items
Armazena os itens de cada pedido.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único do item |
| order_id | uuid | ID do pedido |
| product_id | uuid | ID do produto |
| quantity | integer | Quantidade |
| unit_price | numeric | Preço unitário |
| notes | text | Observações |
| addons_json | jsonb | Adicionais selecionados |

## Estratégia de Cache com Redis

O Redis é utilizado para:

1. **Cache de produtos**: Armazenar detalhes de produtos frequentemente acessados
2. **Cache de restaurantes**: Armazenar informações de restaurantes
3. **Carrinho de compras**: Armazenar carrinhos de compras temporários
4. **Rate limiting**: Limitar requisições por IP/usuário
5. **Sessões de usuário**: Armazenar dados de sessão

### Estrutura de chaves do Redis

- `product:{slug}` - Cache de produtos por slug
- `restaurant:{slug}` - Cache de restaurantes por slug
- `cart:{session_id}` - Carrinho de compras por sessão
- `user:{user_id}:session` - Dados de sessão do usuário
- `ratelimit:{ip}:{endpoint}` - Contador para rate limiting

### TTL (Time To Live)

- Produtos: 1 hora
- Restaurantes: 6 horas
- Carrinhos: 24 horas
- Sessões: 7 dias
- Rate limiting: 1 minuto
