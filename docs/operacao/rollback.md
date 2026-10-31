# Rollback

## Worker (código)

```bash
cd apps/casa-das-maquinas
pnpm exec wrangler rollback        # volta o Worker para a versão anterior publicada
```

Ou republique o commit anterior com `workflow_dispatch` em `.github/workflows/deploy.yml`.

## Schema D1 (migrações)

O D1 não tem "down" nativo. Cada migração tem um script compensatório em `apps/casa-das-maquinas/migrations-rollback/`, gerado por `node scripts/generate-rollbacks.mjs`: remove os objetos criados (filhos antes dos pais) e apaga a linha da migração em `d1_migrations`, para que ela possa ser reaplicada.

Para desfazer a última migração (exemplo, `0003_asaas.sql`):

```bash
pnpm exec wrangler d1 execute DB --remote --file=migrations-rollback/0003_asaas.sql
```

Desfaça sempre na ordem inversa (3, 2, 1, 0). **Isso apaga os dados das tabelas removidas.** Em produção, anote o bookmark do Time Travel antes (abaixo).

Evidência: `scripts/tests/migrations-rollback.test.mjs` aplica, reverte e reaplica todas as migrações num SQLite real e confere que os scripts estão em dia. O workflow `d1-remote-check.yml` faz o mesmo em um banco D1 remoto descartável (execução manual, ainda não executada).

## Dados (Time Travel)

```bash
pnpm exec wrangler d1 time-travel info DB            # bookmark atual
pnpm exec wrangler d1 time-travel restore DB --bookmark=<id>
```

Time Travel restaura o **banco inteiro** para um ponto no tempo (últimos 30 dias); não é um rollback seletivo. Use para recuperar dados; use os scripts compensatórios para desfazer schema.
