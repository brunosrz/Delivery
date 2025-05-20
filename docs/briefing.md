# Briefing: Delivery Express

## Visão Geral

O Delivery Express é uma plataforma de delivery de alimentos que permite aos clientes finais realizarem pedidos diretamente dos restaurantes, sem intermediários. A plataforma faz parte do ecossistema Sorz, que inclui outros módulos como Vitrine, Pedidos na Mão, Tá na Entrega e Administrativo.

## Objetivos

- Criar uma experiência de usuário intuitiva e agradável para pedidos de delivery
- Permitir que restaurantes ofereçam seus produtos diretamente aos clientes
- Reduzir custos operacionais eliminando intermediários
- Proporcionar uma plataforma multi-tenant onde cada restaurante tem seu próprio ambiente

## Público-Alvo

- **Clientes finais**: Pessoas que desejam pedir comida para entrega ou retirada
- **Restaurantes**: Estabelecimentos que desejam oferecer delivery sem depender de marketplaces

## Arquitetura e Tecnologias

### Frontend
- **Framework**: Next.js (App Router)
- **Estilização**: CSS Modules e Flexbox
- **Componentes**: Biblioteca de componentes própria e shadcn/ui
- **Estado**: React Hooks e Context API

### Backend
- **API**: Next.js API Routes e tRPC
- **Banco de Dados**: PostgreSQL com schema por tenant
- **Cache**: Redis para sessões, carrinhos e cache
- **Autenticação**: NextAuth.js

### Infraestrutura
- **Hospedagem**: Vercel
- **Banco de Dados**: Neon (PostgreSQL serverless)
- **Cache**: Upstash Redis
- **CDN**: Vercel Edge Network
- **Armazenamento**: Vercel Blob Storage

## Estrutura Multi-Tenant

O Delivery Express utiliza uma arquitetura multi-tenant com schema por restaurante:

1. **Schema Público (public)**
   - Contém tabelas compartilhadas entre todos os tenants
   - Gerencia metadados dos restaurantes e usuários globais

2. **Schema por Tenant (`restaurant_{id}`)**
   - Cada restaurante tem seu próprio schema isolado
   - Contém dados específicos como produtos, pedidos e configurações

## Componentes Principais

### Interface do Usuário

1. **Header**
   - Barra de pesquisa
   - Navegação por categorias
   - Logo do restaurante

2. **FoodCard**
   - Layout responsivo (vertical em mobile, horizontal em desktop)
   - 3 cards por linha em mobile (largura mínima 106px)
   - Exibe imagem, título, descrição, preço e badges

3. **FoodGrid**
   - Grid flexível baseado em Flexbox
   - Adaptável a diferentes tamanhos de tela
   - Organiza os cards em linhas responsivas

4. **AppBar**
   - Navegação fixa na parte inferior (mobile)
   - Acesso rápido a Início, Pedidos e Perfil

5. **Carrinho**
   - Persistente via Redis
   - Exibe itens, quantidades e total
   - Opções de finalização de pedido

### Páginas Principais

1. **Home**
   - Lista de categorias e produtos em destaque
   - Navegação por seções (Destaques, Pizzas, Lanches, etc.)
   - Busca de produtos

2. **Detalhes do Produto**
   - Informações detalhadas do produto
   - Opções de personalização (adicionais)
   - Botão de adicionar ao carrinho

3. **Carrinho**
   - Lista de itens selecionados
   - Ajuste de quantidades
   - Cálculo de subtotal, taxas e total

4. **Checkout**
   - Endereço de entrega
   - Método de pagamento
   - Resumo do pedido
   - Finalização da compra

5. **Perfil do Usuário**
   - Dados pessoais
   - Endereços salvos
   - Histórico de pedidos
   - Métodos de pagamento

## Estrutura do Banco de Dados

### Tabelas Principais

1. **restaurants**
   - Informações do restaurante (nome, endereço, logo, etc.)
   - Configurações de entrega e funcionamento
   - Domínio personalizado

2. **products**
   - Detalhes do produto (nome, descrição, preço, etc.)
   - Imagens e informações nutricionais
   - Disponibilidade e destaque

3. **menu_sections**
   - Categorias de produtos
   - Ordenação e destaque

4. **addon_groups** e **addons**
   - Grupos de opções adicionais
   - Itens individuais com preços

5. **orders** e **order_items**
   - Pedidos dos clientes
   - Itens individuais de cada pedido
   - Status e informações de entrega

### Campos Adicionados

- **original_price**: Preço original antes de descontos
- **discount_percentage**: Percentual de desconto
- **featured**: Se o produto é destaque
- **nutritional_info**: Informações nutricionais (JSONB)
- **ingredients**: Lista de ingredientes (array)
- **preparation_time**: Tempo de preparo em minutos
- **tags**: Tags para categorização (array)

## Estratégia de Cache com Redis

1. **Cache de Produtos**
   - Chave: `tenant:{tenant_id}:product:{product_id}`
   - TTL: 1 hora
   - Invalidação: Ao atualizar um produto

2. **Carrinho de Compras**
   - Chave: `session:{session_id}:cart`
   - TTL: 24 horas
   - Operações: Adicionar, remover, atualizar itens

3. **Cache de Restaurantes**
   - Chave: `tenant:{tenant_id}:config`
   - TTL: 6 horas

4. **Sessões de Usuário**
   - Chave: `user:{user_id}:sessions`
   - TTL: 7 dias

5. **Contadores e Estatísticas**
   - Chave: `tenant:{tenant_id}:stats:*`
   - Persistentes com backup periódico

## Fluxos de Usuário

### Fluxo de Pedido

1. Usuário acessa o site do restaurante
2. Navega pelas categorias ou usa a busca
3. Seleciona um produto para ver detalhes
4. Personaliza o produto (se aplicável)
5. Adiciona ao carrinho
6. Repete os passos 2-5 conforme necessário
7. Acessa o carrinho para revisar itens
8. Prossegue para o checkout
9. Informa/seleciona endereço de entrega
10. Escolhe método de pagamento
11. Confirma o pedido
12. Recebe confirmação e acompanha status

### Fluxo de Cadastro

1. Usuário clica em "Entrar" ou tenta finalizar um pedido
2. Escolhe entre login ou cadastro
3. Preenche informações básicas (nome, email, telefone)
4. Verifica email/telefone via código
5. Completa perfil com endereços
6. Acessa funcionalidades de usuário logado

## Roadmap de Desenvolvimento

### Fase 1: MVP (Minimum Viable Product)
- [x] Estrutura básica do projeto
- [x] Componentes principais (FoodCard, FoodGrid)
- [x] Navegação por categorias
- [x] Página de listagem de produtos
- [ ] Página de detalhes do produto
- [ ] Carrinho básico

### Fase 2: Funcionalidades Essenciais
- [ ] Autenticação de usuários
- [ ] Checkout completo
- [ ] Integração com pagamentos
- [ ] Sistema de pedidos
- [ ] Perfil do usuário

### Fase 3: Aprimoramentos
- [ ] Busca avançada com filtros
- [ ] Sistema de avaliações
- [ ] Favoritos
- [ ] Histórico de pedidos detalhado
- [ ] Notificações em tempo real

### Fase 4: Expansão
- [ ] Aplicativo móvel (PWA)
- [ ] Programa de fidelidade
- [ ] Cupons e promoções
- [ ] Integração com sistemas de entrega
- [ ] Analytics e relatórios

## Considerações de Design

### Princípios
- **Simplicidade**: Interface limpa e intuitiva
- **Responsividade**: Experiência otimizada em todos os dispositivos
- **Acessibilidade**: Seguir padrões WCAG para inclusão
- **Performance**: Carregamento rápido e interações fluidas

### Identidade Visual
- **Cores**: Laranja (#f97316) como cor principal, com tons neutros de apoio
- **Tipografia**: Fontes sem serifa para melhor legibilidade
- **Iconografia**: Ícones simples e reconhecíveis
- **Imagens**: Fotos de alta qualidade dos produtos

## Métricas de Sucesso

- Taxa de conversão (visitantes → pedidos)
- Valor médio de pedido
- Taxa de retenção de clientes
- Tempo médio para conclusão de pedido
- Avaliações dos usuários
- Número de restaurantes ativos na plataforma

## Integrações

- **Pagamentos**: Stripe, Mercado Pago
- **Mapas**: Google Maps para endereços e rastreamento
- **Notificações**: Push, Email, SMS
- **Analytics**: Google Analytics, Hotjar
- **CRM**: Integração com sistemas de gestão de restaurantes

## Considerações Técnicas

- **SEO**: Otimização para mecanismos de busca
- **Performance**: Otimização de imagens, code splitting, lazy loading
- **Segurança**: Proteção contra CSRF, XSS, injeção SQL
- **Monitoramento**: Logs, alertas e métricas de desempenho
- **Backup**: Estratégia de backup e recuperação de dados

---

Este documento serve como referência para o desenvolvimento do Delivery Express e pode ser atualizado conforme o projeto evolui.
