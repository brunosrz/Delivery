# Inventário da aplicação existente

Mapa verificável do que existe no repositório hoje. O estado de cada produto vem de [`apps/web/lib/ecosystem-status.ts`](../apps/web/lib/ecosystem-status.ts). Esse mesmo arquivo alimenta a página inicial, e o teste `apps/web/tests/unit/ecosystem-status.test.ts` falha se uma rota listada deixar de existir.

Legenda: **implementado** (funciona de ponta a ponta), **parcial** (funciona com limitações declaradas), **demonstração** (conteúdo estático), **em construção** (só a casca da página) e **planejado** (apenas desenho).

## Páginas

| Rota                                                              | Estado        | Fonte de dados                                        | Limitações e dono dos dados                                                  |
| ----------------------------------------------------------------- | ------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| `/`                                                               | implementado  | `lib/ecosystem-status.ts`                             | Hub com o estado real de cada produto                                        |
| `/delivery-express`                                               | parcial       | Supabase (`restaurants`)                              | Renderizada por requisição; mostra "Catálogo indisponível" se o banco falhar |
| `/delivery-express/restaurant/[slug]`                             | parcial       | Supabase (`restaurants`, `menu_sections`, `products`) | 404 quando o restaurante não existe ou o banco falha                         |
| `/delivery-express/restaurant/[slug]/product/[productSlug]`       | parcial       | Supabase (`products`, `addon_groups`, `addons`)       | `addToCart` só valida a entrada; não há carrinho persistido (#18)            |
| `/pedidos-na-mao`                                                 | em construção | —                                                     | Exige login; lista funcionalidades planejadas                                |
| `/ta-na-entrega`                                                  | em construção | —                                                     | Exige login; lista funcionalidades planejadas                                |
| `/site-institucional`                                             | em construção | —                                                     | Sem contato nem conteúdo comercial                                           |
| `/mkit`                                                           | demonstração  | —                                                     | Conceito estático (#12)                                                      |
| `/casa-das-maquinas`                                              | parcial       | —                                                     | Página da arquitetura; a API de catálogo vive em `apps/casa-das-maquinas`    |
| `/auth/login`                                                     | parcial       | NextAuth + Supabase Auth                              | O botão Google só aparece com o provider configurado                         |
| `/auth/register`, `/auth/forgot-password`, `/auth/reset-password` | parcial       | Supabase Auth no navegador                            | Sessão separada da do NextAuth; a unificação é a Fase 2                      |
| `/auth/error`, `/auth/verify-request`                             | implementado  | —                                                     | Páginas estáticas                                                            |

## Rotas de API

| Rota                               | Estado       | Observação                                     |
| ---------------------------------- | ------------ | ---------------------------------------------- |
| `GET /api/restaurants`             | implementado | Lista restaurantes do Supabase                 |
| `GET /api/restaurants/[slug]/menu` | implementado | Seções e produtos de um restaurante            |
| `GET /api/products/[slug]`         | implementado | Produto, adicionais, categorias e relacionados |
| `GET/POST /api/auth/[...nextauth]` | parcial      | Credenciais via Supabase; Google opcional      |

## Removido na Fase 0

Removido porque estava quebrado, simulado ou sem nenhum uso:

- rotas mock da Casa das Máquinas e o NextAuth de admin com senha via env;
- a rota `delivery-express/[food]`;
- o wrapper de cache Redis que não fazia cache;
- `packages/` sem `package.json`;
- 39 componentes shadcn sem uso;
- links para `/cart`, `/orders`, `/profile` e `/site-institucional/contato`, páginas que não existem.

## Prova automatizada

- `pnpm test`: unidades de preço, middleware de autenticação e catálogo de estado.
- `pnpm e2e`: smoke tests Playwright em desktop e mobile. Cobrem o hub, cada produto sem erro 5xx, o estado de catálogo indisponível, a resposta 404 e o redirecionamento de rota protegida para o login.
