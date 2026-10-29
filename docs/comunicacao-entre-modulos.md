# Comunicação Entre Módulos

## Visão Geral

Embora atualmente todos os módulos estejam no mesmo projeto Next.js, a comunicação entre eles é feita através de APIs REST implementadas na Casa das Máquinas. Esta abordagem facilita a futura migração para uma arquitetura de monorepo, onde cada módulo será um projeto independente.

## Arquitetura de Comunicação

\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Delivery Express │     │ Pedidos na Mão  │     │   Tá na Entrega   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │                   │                   │
       │                   ▼                   │
       │           ┌─────────────┐             │
       └──────────►│  Casa das   │◄────────────┘
                   │  Máquinas   │
       ┌──────────►│    (API)    │◄────────────┐
       │           └─────────────┘             │
       │                   ▲                   │
       │                   │                   │
       │                   │                   │
┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐
│  Site institucional   │     │  Observabilidade externa   │     │    Outros   │
└─────────────┘     └─────────────┘     └─────────────┘
\`\`\`

## Cliente de API Centralizado

Para facilitar a comunicação com a Casa das Máquinas, implementamos um cliente de API centralizado em `lib/api-client.ts`. Este cliente:

1. Gerencia a autenticação
2. Lida com erros de forma consistente
3. Formata requisições e respostas
4. Implementa cache quando apropriado

### Exemplo de Uso

\`\`\`typescript
import { apiClient } from '@/lib/api-client';

// Obter lista de restaurantes
const restaurants = await apiClient.restaurants.list();

// Obter detalhes de um restaurante
const restaurant = await apiClient.restaurants.get(restaurantId);

// Criar um novo pedido
const order = await apiClient.orders.create({
  restaurantId,
  items: cartItems,
  deliveryAddress,
});
\`\`\`

## Endpoints da API

A Casa das Máquinas expõe os seguintes endpoints principais:

### Autenticação

- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de novo usuário
- `GET /api/auth/session` - Obter sessão atual
- `POST /api/auth/logout` - Logout de usuário

### Restaurantes

- `GET /api/restaurants` - Listar restaurantes
- `GET /api/restaurants/:id` - Obter detalhes de um restaurante
- `POST /api/restaurants` - Criar novo restaurante
- `PUT /api/restaurants/:id` - Atualizar restaurante
- `DELETE /api/restaurants/:id` - Excluir restaurante

### Cardápio

- `GET /api/menu/:restaurantId` - Obter cardápio de um restaurante
- `POST /api/menu/:restaurantId` - Adicionar item ao cardápio
- `PUT /api/menu/:restaurantId/:itemId` - Atualizar item do cardápio
- `DELETE /api/menu/:restaurantId/:itemId` - Remover item do cardápio

### Pedidos

- `GET /api/orders` - Listar pedidos
- `GET /api/orders/:id` - Obter detalhes de um pedido
- `POST /api/orders` - Criar novo pedido
- `PUT /api/orders/:id` - Atualizar status de um pedido
- `DELETE /api/orders/:id` - Cancelar pedido

### Usuários

- `GET /api/users/me` - Obter perfil do usuário atual
- `PUT /api/users/me` - Atualizar perfil do usuário atual
- `GET /api/users` - Listar usuários (admin)
- `GET /api/users/:id` - Obter detalhes de um usuário (admin)

## Autenticação e Autorização

A autenticação é implementada usando NextAuth.js, que fornece:

1. Autenticação via email/senha
2. Autenticação via OAuth (Google, Facebook)
3. Gerenciamento de sessões
4. Proteção de rotas

A autorização é baseada em papéis (roles) e permissões:

- **Cliente**: Acesso ao Delivery Express para fazer pedidos
- **Restaurante**: Acesso ao Pedidos na Mão para gerenciar seu restaurante
- **Entregador**: Acesso ao Tá na Entrega para gerenciar entregas
- **Admin**: Acesso ao Observabilidade externa para administrar a plataforma

## Tratamento de Erros

Erros da API são tratados de forma consistente:

1. Erros de validação (400) - Dados inválidos enviados
2. Erros de autenticação (401) - Usuário não autenticado
3. Erros de autorização (403) - Usuário sem permissão
4. Erros de recurso não encontrado (404) - Recurso não existe
5. Erros internos (500) - Erro no servidor

Cada erro retorna um objeto JSON com:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem de erro amigável",
    "details": { ... }
  }
}
\`\`\`

## Comunicação em Tempo Real

Para funcionalidades que exigem atualizações em tempo real (como status de pedidos), utilizamos WebSockets através do Pusher:

1. Cliente se inscreve em um canal específico
2. Servidor envia atualizações quando há mudanças
3. Cliente atualiza a interface em tempo real

Exemplo de uso:

\`\`\`typescript
// No cliente
const channel = pusher.subscribe(`order-${orderId}`);
channel.bind('status-update', (data) => {
  updateOrderStatus(data.status);
});

// No servidor
pusher.trigger(`order-${orderId}`, 'status-update', {
  status: 'preparing',
  updatedAt: new Date(),
});
\`\`\`
