# Infraestrutura Cloudflare e publicação

## Isolamento por projeto e ambiente

Esta infraestrutura cobre a API e o web do Delivery. Ela usa a mesma conta/token
Cloudflare do ERP/PDV, mas todos os recursos abaixo são próprios do Delivery:

| Ambiente | Worker | D1 | R2 | KV |
| --- | --- | --- | --- | --- |
| Preview | `delivery-api-preview` | `delivery-preview` | `delivery-preview-private` | `delivery-preview-cache` |
| Production | `delivery-api` | `delivery-production` | `delivery-production-private` | `delivery-production-cache` |

O web (`apps/web`) é um Worker por ambiente, sem D1, R2 ou KV próprios:
`delivery-web-preview` e `delivery-web`. Ele chama a API pela variável
`API_URL` do `wrangler.jsonc`, e a origem do web precisa constar em
`TRUSTED_ORIGINS` da API do mesmo ambiente.

`RestaurantRoom` é o Durable Object da API Delivery. As migrações D1 são
aplicadas antes da publicação do Worker. Não apontar bindings para recursos do
ERP/PDV. O bucket R2 e o namespace KV estão provisionados para uso futuro e
não substituem armazenamento/cache implementados pela aplicação.

## Deploy da API e do web

`.github/workflows/deploy.yml` publica `apps/api` e, depois dela, `apps/web`
(jobs `web-preview` e `web-production`, que dependem do job da API):

- PR para `main`: deploy isolado em Preview após testes e migrations;
- push em `main`: deploy em Production;
- `workflow_dispatch`: Preview em qualquer ref ou Production somente em `main`.

Configure nos GitHub Environments `Preview` e `Production` os secrets
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` e `D1_DATABASE_ID`. O token e
account ID podem ser iguais aos usados pelo ERP/PDV; cada `D1_DATABASE_ID` deve
ser o ID Delivery correspondente à tabela acima. O workflow valida os IDs antes
de executar qualquer comando remoto.

O web é o app Next.js rodando em Workers com
[vinext](https://github.com/cloudflare/vinext): `vinext-cloudflare deploy --env
<preview|production>` faz o build com Vite, grava `dist/server/wrangler.json`
com o ambiente escolhido e publica. `next/image` é servido sem otimização
(`--image-optimization none`); o `next dev` e o `next build` continuam
funcionando lado a lado.

Os secrets de runtime do Worker (`BETTER_AUTH_SECRET`, Google, Asaas e
Turnstile) são independentes por aplicação e ambiente. Cadastre-os no Worker
com Wrangler quando os fluxos correspondentes forem ativados. Nunca reutilize
segredos de sessão ou pagamento do ERP/PDV.

## Domínios planejados

Os nomes reservados para os apps do ecossistema são:

- `delivery.brunosrz.com`
- `entregador.brunosrz.com`
- `institucional.brunosrz.com`
- `pedidos.brunosrz.com`

O deploy não cria registros DNS nem Workers Routes: o web responde no
`workers.dev` próprio. Esses nomes devem ser ligados às aplicações na etapa de
migração dos frontends.
O endpoint da API fica no domínio `workers.dev` próprio do Worker enquanto não
houver decisão e configuração de um subdomínio específico para API.

## Builds nativos

Os workflows de Android/iOS (Capacitor), desktop (Electron) e anexos de release
estão preparados, mas os jobs têm condição explícita controlada pela variável
de repositório `NATIVE_BUILDS_ENABLED`. Mantenha-a diferente de `true` até as
aplicações nativas existirem. Atualmente o repositório contém apenas `apps/web`
e `apps/api`; os diretórios Android, iOS e Electron ainda serão introduzidos.

## SCons local

Copie `.env.example` para `.env` e configure as credenciais compartilhadas da
conta Cloudflare. IDs D1 e nomes de recursos são específicos do Delivery.

```powershell
scons preview            # migrations + deploy de apps/api e depois de apps/web no Preview
scons prod               # migrations + deploy de apps/api e depois de apps/web em Production
scons web-preview        # só apps/web no Preview
scons web-prod           # só apps/web em Production
```

No Windows o `vinext-cloudflare deploy` pode falhar; nesse caso use o GitHub
Actions ou o WSL. Configure runtime secrets com Wrangler e
`apps/api/.dev.vars` apenas para desenvolvimento local; ambos são ignorados
pelo Git.

## Outros workflows

| Workflow | Finalidade |
| --- | --- |
| `quality.yml` | lint, tipos, testes e builds dos pacotes atuais |
| `d1-remote-check.yml` | migrations, rollback e reaplicação num D1 descartável |
| `deploy.yml` | deploy da API Delivery na Cloudflare, sem deploy web |
| `native-builds.yml` | builds nativos Capacitor/Electron desativados até a migração |
| `release-please.yml` | PRs, tags e GitHub Releases |
| `release-assets.yml` | anexar artefatos nativos após a migração, atualmente desativado |
