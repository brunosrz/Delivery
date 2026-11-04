# Privacidade, proteção de dados e segurança

Este documento mostra **o que o código faz** para cumprir a LGPD (Brasil), o GDPR/UK GDPR (Europa) e a CCPA/CPRA e leis estaduais (EUA), onde está cada controle e o que ainda depende de decisão humana. Ele não é parecer jurídico: os textos publicados (`apps/web/lib/legal`) são um modelo técnico e **precisam de revisão de advogado** antes de operar com clientes reais.

## Mapa de obrigações

| Tema                                      | LGPD                  | GDPR              | CCPA/CPRA                | Onde está                                                                       |
| ----------------------------------------- | --------------------- | ----------------- | ------------------------ | ------------------------------------------------------------------------------- |
| Transparência, política de privacidade    | arts. 6º VI, 9º       | arts. 12-14       | aviso na coleta          | `/legal/privacidade`, `apps/web/lib/legal/privacy.ts`                            |
| Termos de Uso e aceite versionado         | art. 8º               | art. 7            | -                        | `/legal/termos`, `POST /v1/legal/acceptances`, `LEGAL_VERSIONS`                  |
| Consentimento de cookies (opt-in)         | art. 8º               | art. 7, ePrivacy  | -                        | `components/privacy/consent-manager.tsx`, `lib/consent.ts`                       |
| Prova do consentimento                    | art. 8º §2º           | art. 7(1)         | -                        | `consent_records`, `POST /v1/consents`                                           |
| Recusar tão fácil quanto aceitar          | art. 8º §5º           | EDPB 05/2020      | -                        | botões com o mesmo peso no banner; teste E2E compara as alturas                  |
| Revogar o consentimento a qualquer hora   | art. 8º §5º           | art. 7(3)         | -                        | "Preferências de cookies" no rodapé e na página de Privacidade                   |
| Global Privacy Control como recusa        | -                     | -                 | CPRA §1798.135           | `Sec-GPC` no servidor e `navigator.globalPrivacyControl` no cliente              |
| Não vender nem compartilhar dados         | -                     | -                 | §1798.120                | nenhum script de terceiros; teste garante o layout sem tags de analytics/ads     |
| Acesso e portabilidade                    | art. 18 II, V         | arts. 15, 20      | direito de saber         | `GET /v1/me/export` (JSON com conta, pedidos, aceites e consentimentos)          |
| Eliminação / apagamento                   | art. 18 IV, VI        | art. 17           | direito de apagar        | `DELETE /v1/me` (anonimiza em um lote), tela `/delivery-express/profile/privacidade` |
| Correção                                  | art. 18 III           | art. 16           | direito de corrigir      | pedido ao canal de privacidade; Better Auth `update-user` para o nome            |
| Registro das solicitações                 | art. 37               | art. 5(2)         | registro de 24 meses     | `data_requests` (só hash, sem dado pessoal)                                      |
| Limitação do armazenamento                | art. 6º III, 15-16    | art. 5(1)(e)      | -                        | `retention.ts` + cron; prazos na política                                        |
| Minimização                               | art. 6º III           | art. 5(1)(c)      | -                        | IP só em hash; CPF/cartão não ficam conosco; logs sem corpo/cookies               |
| Segurança                                 | art. 46               | art. 32           | §1798.150                | cabeçalhos, CSP, CSRF, `no-store`, sessão recente, limites de requisição         |
| Incidentes                                | art. 48               | arts. 33-34       | -                        | processo descrito na política; **falta runbook** (ver pendências)                |
| Crianças                                  | art. 14               | art. 8            | COPPA                    | maioridade declarada no cadastro; política diz que o serviço é para maiores de 18 |
| Transferência internacional               | art. 33               | cap. V            | -                        | descrita na política (Cloudflare, Vercel); salvaguardas do contrato dos provedores |

## Dados e retenção

| Dado                                     | Onde                        | Prazo (código)                                         |
| ---------------------------------------- | --------------------------- | ------------------------------------------------------ |
| Conta, credenciais                       | `user`, `account`           | até a exclusão da conta                                |
| Sessão                                   | `session`                   | 7 dias (`expiresIn`); expiradas apagadas no cron       |
| Pedidos                                  | `orders`, `order_events`    | mantidos; na exclusão o endereço vira valor fixo e o vínculo some |
| Mensagens de contato                     | `contact_messages`          | 365 dias (`RETENTION_DAYS`) ou antes, na exclusão      |
| Prova de consentimento                   | `consent_records`           | 5 anos; `user_id` é zerado na exclusão                 |
| Aceites dos termos                       | `legal_acceptances`         | até a exclusão da conta                                |
| Solicitações do titular                  | `data_requests`             | 5 anos; só hash                                        |
| Contadores de limite de requisição       | `rate_limit_buckets`        | 24 horas                                               |
| Verificações e tokens de senha           | `verification`              | até expirar; apagados na exclusão (por e-mail e por `value = user.id`) |

O cron (`scheduled`) roda `purgeExpired`, `pruneRateLimits` e o reenvio da caixa de saída.

## Camadas de segurança

- **API (Worker):** cabeçalhos (`nosniff`, `X-Frame-Options`, `Referrer-Policy: no-referrer`, HSTS, COOP, CSP `default-src 'none'`), `Cache-Control: no-store` em tudo que tem sessão ou dado pessoal, cookie de sessão `HttpOnly` + `SameSite=Lax` (+ `Secure` em HTTPS), limites de requisição por rota (exportar 10/min, excluir 5/min, consentir 30/min), validação com zod em toda entrada (`.strict()`), isolamento por restaurante, exclusão com **sessão recente (15 min)** e frase de confirmação.
- **Web (Next):** CSP restritiva (só a própria origem, sem frames, sem plugins), HSTS, `X-Frame-Options`, `Permissions-Policy`, `Cache-Control: private, no-store` nas áreas logadas, `poweredByHeader` desligado, proxy com **checagem de origem** contra CSRF (`lib/origin.ts`) e lista fechada de rotas.
- **Banco:** nenhuma tabela de privacidade guarda IP em claro (hash com sal secreto), `data_requests` não tem chave estrangeira nem dado pessoal, `legal_acceptances` some com a conta, migrações com rollback testado.
- **Testes:** `apps/api/test/privacy.test.ts` (consentimento, GPC, aceite, exportação, exclusão, sessão recente, retenção, cabeçalhos, cookie), `apps/web/tests/unit/{consent,locale,legal,security}.test.ts` e `apps/web/tests/e2e/privacy.spec.ts`.

## Idiomas (Paraglide)

As mensagens da interface de privacidade ficam em `apps/web/messages/{pt-BR,en}.json` e são compiladas pelo Paraglide JS (`bun run i18n`, saída ignorada pelo git em `lib/paraglide`). O idioma vem do cookie `PARAGLIDE_LOCALE`, depois do `Accept-Language`, depois do padrão pt-BR; o rodapé tem o seletor. Os textos longos dos documentos legais ficam em `apps/web/lib/legal` (um módulo por documento e idioma), e um teste exige as mesmas seções nos dois idiomas. O restante do site ainda está só em português.

## Configuração por instalação

| Variável                         | Para quê                                                        |
| -------------------------------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_CONTROLLER_NAME`    | razão social do controlador (aparece nas páginas legais)         |
| `NEXT_PUBLIC_CONTROLLER_TAX_ID`  | CNPJ/CPF do controlador                                         |
| `NEXT_PUBLIC_PRIVACY_EMAIL`      | canal do encarregado (DPO) e das solicitações                   |

Sem nome e e-mail válidos, as páginas legais mostram um aviso de que o controlador não foi configurado.

## Como mexer sem quebrar

- **Novo cookie ou armazenamento:** inclua em `COOKIE_REGISTRY` e na política de cookies; se não for essencial, só carregue depois de `hasConsent`. O teste `legal.test.ts` reprova cookie gravado fora dos dois pontos conhecidos.
- **Nova categoria de cookies ou finalidade:** suba `CONSENT_VERSION` (todos precisam consentir de novo).
- **Mudança relevante nos textos:** suba `LEGAL_VERSIONS`; o aceite é por versão.
- **Novo prazo de retenção:** `retention.ts`, política (`privacy.ts`) e esta tabela; `legal.test.ts` confere os números.

## Pendências que dependem de pessoas

1. **Revisão jurídica** dos três documentos e preenchimento do controlador (nome, CNPJ, e-mail do encarregado).
2. **Representante na UE (GDPR art. 27)** e escolha da autoridade, se o serviço for oferecido a pessoas na UE; **RIPD/DPIA** se houver tratamento de alto risco.
3. **Asaas:** o cadastro remoto do cliente fica retido; se a política exigir apagá-lo, é preciso uma operação própria no cliente Asaas antes da anonimização.
4. **Runbook de incidentes** (quem decide, prazo de 72 h para a autoridade europeia, comunicação à ANPD e aos titulares).
5. **CSP com nonce:** hoje permite scripts e estilos inline por causa do Next; o endurecimento é nonce por requisição.
6. **Novo aceite:** quem já tem conta e ainda não aceitou a versão vigente (inclusive login social) vê um aviso bloqueante no próximo acesso (`LegalReacceptance`, `GET /v1/legal/acceptances`). Se o backend estiver fora do ar, o aviso não aparece, para não travar o site.
7. **Equipe e entregadores:** a exclusão automática vale para clientes; as demais contas saem pelo administrador (ainda sem tela).
8. **Tradução** das demais telas do site para inglês.
