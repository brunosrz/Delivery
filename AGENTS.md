# Instruções para agentes

Estas regras se aplicam ao repositório Delivery inteiro. Arquivos `AGENTS.md`
em subpastas podem acrescentar regras específicas.

## Ambientes Cloudflare

- `local` é exclusivamente o simulador de desenvolvimento na máquina. Use
  `wrangler dev --env local`; ele deve apontar apenas para bindings locais.
- `preview` é o ambiente Cloudflare remoto usado para validação. O comando
  `scons preview` aplica as migrations no D1 de Preview e publica somente
  `apps/api` nesse ambiente.
- `production` é reservado para publicação da API após integração na branch
  padrão ou acionamento explícito do workflow de produção.
- Não use `local` como destino de deploy nem descreva Preview como local.
- D1, KV, R2 e demais recursos do Delivery devem ser independentes dos recursos
  ERP/PDV. Podem compartilhar as credenciais da conta Cloudflare quando
  autorizado, mas não os recursos nem segredos de runtime da aplicação.
- Não publique `apps/web` enquanto essa etapa estiver desativada. Preserve
  apenas a configuração de domínios planejados até a migração e autorização do
  deploy dos frontends.

## Branches e pull requests

- Use branches `feat/`, `fix/` ou `chore/`, com nomes formais, sem números de
  issues e sem o termo `codex`.
- Escreva títulos e corpos de PR em português. Todo PR deve incluir resumo,
  validação e referências às issues relacionadas.
- Inclua `Closes #N` somente para issues concluídas pelo PR; use referências
  comuns para dependências ou trabalho futuro.
- Ao solicitar `@coderabbitai full review`, publique um único comentário de
  topo com walkthrough específico, relações de issues e comando de revisão
  juntos. Nunca divida walkthrough e comando em comentários separados.
