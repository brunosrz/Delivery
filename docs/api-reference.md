# Referência da API

> **Documento histórico.** A referência operacional é a OpenAPI servida em `/v1/openapi.json` pela Casa das Máquinas (gerada dos schemas em `packages/contracts`). As seções abaixo descrevem um desenho anterior: envelope de resposta incompleto, paginação de `/restaurants` e preços decimais **não** correspondem à API v1, que usa envelope `{data, error, meta}`, sem paginação e preços em centavos. Pagamento online: [`pagamentos-asaas.md`](./pagamentos-asaas.md).

## Visão Geral

A API da Casa das Máquinas é o backend centralizado que fornece serviços para todos os módulos do ecossistema Delivery Express. Esta referência documenta os endpoints disponíveis, parâmetros, respostas e exemplos de uso.

## Base URL

> Estado atual: os contratos da API v1 são código em [`packages/contracts`](../packages/contracts/src) (schemas zod com testes), a fonte de verdade desta referência. A API que os implementa será a Casa das Máquinas em Cloudflare Workers (issue #4), que publicará a OpenAPI gerada desses schemas em `/v1/openapi.json`. O texto abaixo é o desenho histórico e será substituído por essa OpenAPI.

- **Desenvolvimento**: planejado, via `wrangler dev`
- **Produção**: planejado, em Cloudflare Workers

## Autenticação

A maioria dos endpoints requer autenticação. Utilize o header `Authorization` com um token JWT:

\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

Para obter um token, utilize o endpoint de login.

## Formato de Resposta

Todas as respostas são retornadas no formato JSON. Respostas de sucesso seguem o formato:

\`\`\`json
{
"data": { ... },
"meta": { ... }
}
\`\`\`

Respostas de erro seguem o formato:

\`\`\`json
{
"error": {
"code": "ERROR_CODE",
"message": "Mensagem de erro",
"details": { ... }
}
}
\`\`\`

## Endpoints

### Autenticação

#### Login

\`\`\`
POST /auth/login
\`\`\`

Autentica um usuário e retorna um token JWT.

**Corpo da Requisição:**
\`\`\`json
{
"email": "usuario@exemplo.com",
"password": "senha123"
}
\`\`\`

**Resposta de Sucesso (200):**
\`\`\`json
{
"data": {
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"user": {
"id": "user_123",
"name": "Nome do Usuário",
"email": "usuario@exemplo.com",
"role": "CUSTOMER"
}
}
}
\`\`\`

#### Registro

\`\`\`
POST /auth/register
\`\`\`

Registra um novo usuário.

**Corpo da Requisição:**
\`\`\`json
{
"name": "Nome do Usuário",
"email": "usuario@exemplo.com",
"password": "senha123",
"passwordConfirmation": "senha123"
}
\`\`\`

**Resposta de Sucesso (201):**
\`\`\`json
{
"data": {
"id": "user_123",
"name": "Nome do Usuário",
"email": "usuario@exemplo.com",
"createdAt": "2023-05-17T12:00:00Z"
}
}
\`\`\`

#### Obter Usuário Atual

\`\`\`
GET /auth/me
\`\`\`

Retorna informações sobre o usuário autenticado.

**Resposta de Sucesso (200):**
\`\`\`json
{
"data": {
"id": "user_123",
"name": "Nome do Usuário",
"email": "usuario@exemplo.com",
"role": "CUSTOMER",
"tenants": [
{
"id": "tenant_456",
"name": "Restaurante A",
"role": "CUSTOMER"
}
]
}
}
\`\`\`

### Restaurantes

#### Listar Restaurantes

\`\`\`
GET /restaurants
\`\`\`

Retorna uma lista de restaurantes.

**Parâmetros de Query:**

- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)
- `search` (opcional): Termo de busca
- `category` (opcional): Filtrar por categoria

**Resposta de Sucesso (200):**
\`\`\`json
{
"data": [
{
"id": "restaurant_123",
"name": "Restaurante A",
"description": "Descrição do restaurante",
"logo": "https://storage.delivery-express.example/logos/restaurant_123.png",
"rating": 4.5,
"categories": ["Pizza", "Italiana"]
},
{
"id": "restaurant_456",
"name": "Restaurante B",
"description": "Descrição do restaurante",
"logo": "https://storage.delivery-express.example/logos/restaurant_456.png",
"rating": 4.2,
"categories": ["Hambúrguer", "Americana"]
}
],
"meta": {
"total": 50,
"page": 1,
"limit": 10,
"pages": 5
}
}
\`\`\`

#### Obter Restaurante

\`\`\`
GET /restaurants/:id
\`\`\`

Retorna detalhes de um restaurante específico.

**Parâmetros de URL:**

- `id`: ID do restaurante

**Resposta de Sucesso (200):**
\`\`\`json
{
"data": {
"id": "restaurant_123",
"name": "Restaurante A",
"description": "Descrição detalhada do restaurante",
"logo": "https://storage.delivery-express.example/logos/restaurant_123.png",
"cover": "https://storage.delivery-express.example/covers/restaurant_123.png",
"address": {
"street": "Rua Exemplo",
"number": "123",
"neighborhood": "Centro",
"city": "São Paulo",
"state": "SP",
"zipCode": "01001-000"
},
"contact": {
"phone": "+55 11 99999-9999",
"email": "contato@restaurantea.com.br",
"website": "https://restaurantea.com.br"
},
"hours": [
{
"day": "monday",
"open": "11:00",
"close": "22:00"
},
{
"day": "tuesday",
"open": "11:00",
"close": "22:00"
}
],
"rating": 4.5,
"reviewCount": 120,
"categories": ["Pizza", "Italiana"],
"features": ["Delivery", "Takeout", "Outdoor Seating"]
}
}
\`\`\`

#### Criar Restaurante

\`\`\`
POST /restaurants
\`\`\`

Cria um novo restaurante.

**Corpo da Requisição:**
\`\`\`json
{
"name": "Novo Restaurante",
"description": "Descrição do novo restaurante",
"address": {
"street": "Rua Exemplo",
"number": "123",
"neighborhood": "Centro",
"city": "São Paulo",
"state": "SP",
"zipCode": "01001-000"
},
"contact": {
"phone": "+55 11 99999-9999",
"email": "contato@novorestaurante.com.br"
},
"categories": ["Japonesa", "Sushi"]
}
\`\`\`

**Resposta de Sucesso (201):**
\`\`\`json
{
"data": {
"id": "restaurant_789",
"name": "Novo Restaurante",
"description": "Descrição do novo restaurante",
"createdAt": "2023-05-17T12:00:00Z"
}
}
\`\`\`

#### Atualizar Restaurante

\`\`\`
PUT /restaurants/:id
\`\`\`

Atualiza um restaurante existente.

**Parâmetros de URL:**

- `id`: ID do restaurante

**Corpo da Requisição:**
\`\`\`json
{
"name": "Restaurante Atualizado",
"description": "Nova descrição do restaurante",
"address": {
"street": "Nova Rua",
"number": "456",
"neighborhood": "Novo Bairro",
"city": "São Paulo",
"state": "SP",
"zipCode": "02002-000"
}
}
\`\`\`

**Resposta de Sucesso (200):**
\`\`\`json
{
"data": {
"id": "restaurant_123",
"name": "Restaurante Atualizado",
"description": "Nova descrição do restaurante",
"updatedAt": "2023-05-17T14:00:00Z"
}
}
\`\`\`

#### Excluir Restaurante

\`\`\`
DELETE /restaurants/:id
\`\`\`

Exclui um restaurante.

**Parâmetros de URL:**

- `id`: ID do restaurante

**Resposta de Sucesso (204):**
\`\`\`
(No content)
\`\`\`

### Cardápio

#### Listar Categorias

\`\`\`
GET /menu/:restaurantId/categories
\`\`\`

Retorna as categorias do cardápio de um restaurante.

**Parâmetros de URL:**

- `restaurantId`: ID do restaurante

**Resposta de Sucesso (200):**
\`\`\`json
{
"data": [
{
"id": "category_123",
"name": "Entradas",
"description": "Pratos para começar",
"order": 1
},
{
"id": "category_456",
"name": "Pratos Principais",
"description": "Especialidades da casa",
"order": 2
},
{
"id": "category_789",
"name": "Sobremesas",
"description": "Doces e sobremesas",
"order": 3
}
]
}
\`\`\`

#### Listar Produtos

\`\`\`
GET /menu/:restaurantId/products
\`\`\`

Retorna os produtos do cardápio de um restaurante.

**Parâmetros de URL:**

- `restaurantId`: ID do restaurante

**Parâmetros de Query:**

- `category` (opcional): Filtrar por categoria
- `search` (opcional): Termo de busca
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20)

**Resposta de Sucesso (200):**
\`\`\`json
{
"data": [
{
"id": "product_123",
"name": "Pizza Margherita",
"description": "Molho de tomate, mussarela, manjericão",
"price": 45.90,
"image": "https://storage.delivery-express.example/products/product_123.png",
"categoryId": "category_456",
"categoryName": "Pizzas",
"available": true,
"options": [
{
"id": "option_123",
"name": "Tamanho",
"required": true,
"multiple": false,
"items": [
{
"id": "item_123",
"name": "Pequena",
"price": 0
},
{
"id": "item_456",
"name": "Média",
"price": 10
},
{
"id": "item_789",
"name": "Grande",
"price": 20
}
]
}
]
}
],
"meta": {
"total": 50,
"page": 1,
"limit": 20,
"pages": 3
}
}
\`\`\`

#### Obter Produto

\`\`\`
GET /menu/:restaurantId/products/:productId
\`\`\`

Retorna detalhes de um produto específico.

**Parâmetros de URL:**

- `restaurantId`: ID do restaurante
- `productId`: ID do produto

**Resposta de Sucesso (200):**
\`\`\`json
{
"data": {
"id": "product_123",
"name": "Pizza Margherita",
"description": "Molho de tomate, mussarela, manjericão fresco e azeite extra virgem",
"price": 45.90,
"image": "https://storage.delivery-express.example/products/product_123.png",
"categoryId": "category_456",
"categoryName": "Pizzas",
"available": true,
"nutritionalInfo": {
"calories": 250,
"proteins": 12,
"carbs": 30,
"fats": 10
},
"allergens": ["Glúten", "Laticínios"],
"options": [
{
"id": "option_123",
"name": "Tamanho",
"required": true,
"multiple": false,
"items": [
{
"id": "item_123",
"name": "Pequena",
"price": 0
},
{
"id": "item_456",
"name": "Média",
"price": 10
},
{
"id": "item_789",
"name": "Grande",
"price": 20
}
]
},
{
"id": "option_456",
"name": "Extras",
"required": false,
"multiple": true,
"items": [
{
"id": "item_101",
"name": "Borda Recheada",
"price": 8
},
{
"id": "item_102",
"name": "Mussarela Extra",
"price": 5
}
]
}
]
}
}
\`\`\`

### Pedidos

#### Criar Pedido

\`\`\`
POST /orders
\`\`\`

Cria um novo pedido.

**Corpo da Requisição:**
\`\`\`json
{
"restaurantId": "restaurant_123",
"items": [
{
"productId": "product_123",
"quantity": 1,
"options": [
{
"optionId": "option_123",
"items": ["item_456"]
},
{
"optionId": "option_456",
"items": ["item_101", "item_102"]
}
],
"notes": "Sem cebola, por favor"
},
{
"productId": "product_456",
"quantity": 2,
"options": [],
"notes": ""
}
],
"delivery": {
"address": {
"street": "Rua do Cliente",
"number": "789",
"complement": "Apto 123",
"neighborhood": "Jardins",
"city": "São Paulo",
"state": "SP",
"zipCode": "01410-000"
},
"instructions": "Tocar o interfone 123"
},
"payment": {
"method": "CREDIT_CARD",
"cardId": "card_123"
},
"coupon": "WELCOME10"
}
\`\`\`

**Resposta de Sucesso (201):**
\`\`\`json
{
"data": {
"id": "order_123",
"number": "#12345",
"status": "PENDING",
"subtotal": 105.80,
"deliveryFee": 8.90,
"discount": 10.58,
"total": 104.12,
"createdAt": "2023-05-17T18:30:00Z",
"estimatedDeliveryTime": "2023-05-17T19:15:00Z"
}
}
\`\`\`

#### Listar Pedidos

\`\`\`
GET /orders
\`\`\`

Retorna os pedidos do usuário ou restaurante.

**Parâmetros de Query:**

- `role` (obrigatório): "customer" ou "restaurant"
- `restaurantId` (opcional): Filtrar por restaurante (obrigatório se role=restaurant)
- `status` (opcional): Filtrar por status
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)

**Resposta de Sucesso (200):**
\`\`\`json
{
"data": [
{
"id": "order_123",
"number": "#12345",
"restaurantId": "restaurant_123",
"restaurantName": "Restaurante A",
"status": "DELIVERED",
"total": 104.12,
"createdAt": "2023-05-17T18:30:00Z",
"deliveredAt": "2023-05-17T19:20:00Z"
},
{
"id": "order_456",
"number": "#12346",
"restaurantId": "restaurant_456",
"restaurantName": "Restaurante B",
"status": "PREPARING",
"total": 78.50,
"createdAt": "2023-05-17T20:15:00Z",
"estimatedDeliveryTime": "2023-05-17T21:00:00Z"
}
],
"meta": {
"total": 25,
"page": 1,
"limit": 10,
"pages": 3
}
}
\`\`\`

#### Obter Pedido

\`\`\`
GET /orders/:id
\`\`\`

Retorna detalhes de um pedido específico.

**Parâmetros de URL:**

- `id`: ID do pedido

**Resposta de Sucesso (200):**
\`\`\`json
{
"data": {
"id": "order_123",
"number": "#12345",
"status": "DELIVERED",
"restaurant": {
"id": "restaurant_123",
"name": "Restaurante A",
"logo": "https://storage.delivery-express.example/logos/restaurant_123.png",
"phone": "+55 11 99999-9999"
},
"items": [
{
"id": "item_123",
"name": "Pizza Margherita",
"quantity": 1,
"unitPrice": 45.90,
"totalPrice": 63.90,
"options": [
{
"name": "Tamanho",
"items": ["Média (+R$ 10,00)"]
},
{
"name": "Extras",
"items": ["Borda Recheada (+R$ 8,00)"]
}
],
"notes": "Sem cebola, por favor"
},
{
"id": "item_456",
"name": "Refrigerante Cola",
"quantity": 2,
"unitPrice": 8.90,
"totalPrice": 17.80,
"options": [],
"notes": ""
}
],
"subtotal": 81.70,
"deliveryFee": 8.90,
"discount": 8.17,
"total": 82.43,
"payment": {
"method": "CREDIT_CARD",
"card": {
"brand": "Visa",
"last4": "1234"
},
"status": "PAID"
},
"delivery": {
"address": {
"street": "Rua do Cliente",
"number": "789",
"complement": "Apto 123",
"neighborhood": "Jardins",
"city": "São Paulo",
"state": "SP",
"zipCode": "01410-000"
},
"instructions": "Tocar o interfone 123",
"status": "DELIVERED",
"deliveredAt": "2023-05-17T19:20:00Z",
"deliveryPerson": {
"name": "João Entregador",
"phone": "+55 11 98888-8888"
}
},
"timeline": [
{
"status": "PENDING",
"timestamp": "2023-05-17T18:30:00Z"
},
{
"status": "CONFIRMED",
"timestamp": "2023-05-17T18:32:00Z"
},
{
"status": "PREPARING",
"timestamp": "2023-05-17T18:40:00Z"
},
{
"status": "READY",
"timestamp": "2023-05-17T19:00:00Z"
},
{
"status": "OUT_FOR_DELIVERY",
"timestamp": "2023-05-17T19:05:00Z"
},
{
"status": "DELIVERED",
"timestamp": "2023-05-17T19:20:00Z"
}
],
"createdAt": "2023-05-17T18:30:00Z"
}
}
\`\`\`

#### Atualizar Status do Pedido

\`\`\`
PUT /orders/:id/status
\`\`\`

Atualiza o status de um pedido.

**Parâmetros de URL:**

- `id`: ID do pedido

**Corpo da Requisição:**
\`\`\`json
{
"status": "PREPARING",
"estimatedTime": 30
}
\`\`\`

**Resposta de Sucesso (200):**
\`\`\`json
{
"data": {
"id": "order_123",
"status": "PREPARING",
"estimatedDeliveryTime": "2023-05-17T19:15:00Z",
"updatedAt": "2023-05-17T18:45:00Z"
}
}
\`\`\`

### Usuários

#### Listar Usuários

\`\`\`
GET /users
\`\`\`

Retorna uma lista de usuários (apenas para administradores).

**Parâmetros de Query:**

- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)
- `search` (opcional): Termo de busca
- `role` (opcional): Filtrar por papel

**Resposta de Sucesso (200):**
\`\`\`json
{
"data": [
{
"id": "user_123",
"name": "Nome do Usuário",
"email": "usuario@exemplo.com",
"role": "CUSTOMER",
"createdAt": "2023-04-10T14:30:00Z"
},
{
"id": "user_456",
"name": "Outro Usuário",
"email": "outro@exemplo.com",
"role": "RESTAURANT_OWNER",
"createdAt": "2023-05-05T10:15:00Z"
}
],
"meta": {
"total": 120,
"page": 1,
"limit": 10,
"pages": 12
}
}
\`\`\`

#### Obter Usuário

\`\`\`
GET /users/:id
\`\`\`

Retorna detalhes de um usuário específico.

**Parâmetros de URL:**

- `id`: ID do usuário

**Resposta de Sucesso (200):**
\`\`\`json
{
"data": {
"id": "user_123",
"name": "Nome do Usuário",
"email": "usuario@exemplo.com",
"phone": "+55 11 99999-9999",
"role": "CUSTOMER",
"addresses": [
{
"id": "address_123",
"name": "Casa",
"street": "Rua do Cliente",
"number": "789",
"complement": "Apto 123",
"neighborhood": "Jardins",
"city": "São Paulo",
"state": "SP",
"zipCode": "01410-000",
"isDefault": true
}
],
"paymentMethods": [
{
"id": "card_123",
"type": "CREDIT_CARD",
"brand": "Visa",
"last4": "1234",
"expiryMonth": 12,
"expiryYear": 2025

Criei uma documentação abrangente para o projeto na pasta `/docs/` com os seguintes arquivos:

1. **estrutura-atual.md**
   - Explica a estrutura atual do projeto usando o App Router
   - Detalha a organização de pastas e arquivos
   - Descreve como os diferentes módulos (Delivery Express, Pedidos na Mão, etc.) estão organizados

2. **comunicacao-entre-modulos.md**
   - Documenta como os diferentes módulos se comunicam entre si
   - Explica o funcionamento do cliente de API centralizado
   - Detalha os endpoints disponíveis na Casa das Máquinas

3. **migracao-para-monorepo.md**
   - Descreve o plano de migração para um monorepo no futuro
   - Explica como a estrutura atual facilita essa migração
   - Fornece um guia passo a passo para a migração

4. **guia-desenvolvimento.md**
   - Oferece diretrizes para o desenvolvimento do projeto
   - Explica as convenções de código e boas práticas
   - Fornece exemplos de como implementar novos recursos

5. **multi-tenancy.md**
   - Detalha a implementação do sistema multi-tenant
   - Explica como os restaurantes são isolados uns dos outros
   - Descreve como funciona a personalização por tenant

6. **api-reference.md**
   - Documenta todos os endpoints da API
   - Fornece exemplos de requisições e respostas
   - Explica os diferentes status codes e mensagens de erro

Esta documentação servirá como referência para o desenvolvimento do projeto, facilitando a compreensão da arquitetura e a implementação de novos recursos. Ela também será útil para novos desenvolvedores que se juntarem ao projeto, pois fornece uma visão geral do sistema e explica como tudo funciona.
