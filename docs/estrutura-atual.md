# Inventário da aplicação existente

Mapa verificável do que existe no repositório hoje. O estado de cada produto vem de [`apps/web/lib/ecosystem-status.ts`](../apps/web/lib/ecosystem-status.ts). Esse mesmo arquivo alimenta a página inicial, e o teste `apps/web/tests/unit/ecosystem-status.test.ts` falha se uma rota listada deixar de existir.

Legenda: **implementado** (funciona de ponta a ponta), **parcial** (funciona com limitações declaradas), **demonstração** (conteúdo estático), **em construção** (só a casca da página) e **planejado** (apenas desenho).

## Páginas

| Rota                                                        | Estado        | Fonte de dados                                          | Limitações e dono dos dados                                                                           |
| ----------------------------------------------------------- | ------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/`                                                         | implementado  | `lib/ecosystem-status.ts`                               | Hub com o estado real de cada produto                                                                 |
| `/delivery-express`                                         | parcial       | Casa das Máquinas (`GET /v1/restaurants`)               | Renderizada por requisição; mostra "Catálogo indisponível" se a API falhar ou não estiver configurada |
| `/delivery-express/restaurant/[slug]`                       | parcial       | Casa das Máquinas (`GET /v1/restaurants/{slug}/menu`)   | 404 real para restaurante inexistente                                                                 |
| `/delivery-express/restaurant/[slug]/product/[productSlug]` | parcial       | Cardápio da Casa das Máquinas                           | Adicionais com regra de seleção; sacola desabilitada até a #18                                        |
| `/pedidos-na-mao`                                           | em construção | Sessão via Casa das Máquinas                            | Exige login e papel de equipe ou administração; lista funcionalidades planejadas                      |
| `/ta-na-entrega`                                            | em construção | Sessão via Casa das Máquinas                            | Exige login e papel de entregador ou administração; lista funcionalidades planejadas                  |
| `/site-institucional`                                       | em construção | —                                                       | Sem contato nem conteúdo comercial                                                                    |
| `/mkit`                                                     | demonstração  | —                                                       | Conceito estático (#12)                                                                               |
| `/casa-das-maquinas`                                        | parcial       | —                                                       | Página da arquitetura; a API de catálogo vive em `apps/casa-das-maquinas`                             |
| `/auth/login`, `/auth/register`                             | implementado  | Better Auth na Casa das Máquinas, via proxy `/api/auth` | E-mail e senha; recuperação de senha depende de envio de e-mail (planejado)                           |

## Rotas de API

O catálogo é servido pela Casa das Máquinas (`apps/casa-das-maquinas`, rotas `/v1`). No app web resta apenas o proxy `GET/POST /api/auth/*`, que repassa login, cadastro e sessão ao Better Auth da Casa das Máquinas para manter o cookie no domínio do site.

## Removido na Fase 0

Removido porque estava quebrado, simulado ou sem nenhum uso:

- rotas mock da Casa das Máquinas e o NextAuth de admin com senha via env;
- a rota `delivery-express/[food]`;
- o wrapper de cache Redis que não fazia cache;
- `packages/` sem `package.json`;
- 39 componentes shadcn sem uso;
- as rotas `/api/restaurants` e `/api/products` do Next, que duplicavam o catálogo da Casa das Máquinas;
- NextAuth, o adapter e o cliente Supabase, e as páginas de recuperação de senha que dependiam do Supabase Auth;
- links para `/cart`, `/orders`, `/profile` e `/site-institucional/contato`, páginas que não existem.

## Prova automatizada

- `pnpm test`: unidades de preço, middleware de autenticação e catálogo de estado.
- `pnpm e2e`: Playwright em desktop e mobile contra a Casa das Máquinas real (`wrangler dev` com D1 local e seed sintético). Cobrem o hub, cada produto sem erro 5xx, o estado de catálogo indisponível, a resposta 404 e o redirecionamento de rota protegida para o login.
