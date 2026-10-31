Descreva o comportamento alterado e o motivo da mudança nesta PR.

## Linha de release

Escolha uma base e uma milestone antes de solicitar revisão (ver `.github/release-lines.json`):

- `release/0.2` + milestone `0.2`: desenvolvimento da próxima minor.
- `main` + milestone `0.1.x`: manutenção da série estável `0.1`.

O CI atribui a milestone da base automaticamente e exige exatamente uma milestone compatível com ela. PRs de sincronização entre `main` e `release/*` devem explicar a referência de origem.

## Checklist

- [ ] A base corresponde à linha de release pretendida.
- [ ] A milestone de release está atribuída e é compatível com a base.
- [ ] A mudança não depende de uma versão futura não documentada.
- [ ] Testes e gates de qualidade (`scons check`) passam.
