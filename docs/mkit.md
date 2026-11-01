# MKit: kit de marketing dos restaurantes

Cobre o que a issue #12 pede: conteúdo de marketing operacional, personalizável por restaurante e mensurável.

## O que existe

| Pedido da issue                      | Como ficou                                                                                                                                                                  | Onde                                                                          |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Categorias                           | Categorias da plataforma (cinco, vindas da migração) e categorias do próprio restaurante; material tem categoria opcional; ao remover a do restaurante, os materiais ficam sem categoria | `mkit_categories`, `GET/POST/DELETE .../mkit/categories`                      |
| Calendário                           | Datas nacionais calculadas (Páscoa, Dia das Mães...) somadas às datas do restaurante (única ou recorrente); exportação em `.ics`                                              | `apps/web/lib/mkit-calendar.ts`, `mkit_calendar_events`, `.../mkit/calendar`  |
| Materiais digitais e físicos         | Campo `medium` (`digital` ou `fisico`) além do tipo (post, cartaz, promoção)                                                                                                | `mkit_materials.medium`                                                       |
| Integrações                          | Link do WhatsApp (`wa.me`) e legenda pronta para copiar (Instagram, Facebook...). Sem credenciais: quem publica é a própria pessoa                                         | `apps/web/lib/mkit-share.ts`                                                  |
| Geração de conteúdo                  | Rascunho a partir de modelos fixos (promoção, novidade, data comemorativa) com os dados reais do restaurante e do produto. Determinístico, sem IA; passa pela mesma sanitização | `apps/casa-das-maquinas/src/mkit-templates.ts`, `POST .../materials/generate` |
| Dados editoriais separados do código | Materiais, categorias, datas e métricas ficam no banco, por restaurante. No código ficam só os modelos de texto e o cálculo das datas nacionais                              | migração `0010_mkit_editorial`                                                |

## Testes e aceite

| Critério da issue         | Evidência                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Permissões por tenant     | `mkit-editorial.test.ts` ("permissões por restaurante nas rotas novas": 401 sem sessão, 403 para cliente e para equipe de outro restaurante), `mkit.test.ts`   |
| Renderização              | `apps/web/tests/unit/mkit-render.test.ts` (quebra de linhas, HTML do PDF escapado), `mkit-share.test.ts`; o PNG é desenhado em canvas no navegador            |
| Exportação                | `mkit.test.ts` (texto), exportação em PNG e PDF pelo painel, contagem de exportações no servidor                                                              |
| Sanitização               | `sanitizeText` na entrada de título, corpo, nome de categoria, de data e do texto gerado; testes com `<script>`, `<img onerror>` e marcação aninhada          |
| Métricas de uso           | `mkit-metrics.test.ts`: totais, publicados, rascunhos, lixeira, por tipo, exportações e top 5                                                                |
| Dados incompletos         | produto sem descrição gera texto menor; restaurante sem materiais, sem datas ou sem categorias; atualização parcial; categoria inexistente; data inexistente (31/02, 29/02 em ano não bissexto) |
| Restauração               | lixeira com `?lixeira=1`, `POST .../restore`, exclusão definitiva só para quem está na lixeira (`?definitivo=1`) e limpeza automática após 30 dias pelo cron   |

## Regras que valem a pena lembrar

- Material excluído vai para a **lixeira** por 30 dias (`RETENTION_DAYS.mkitTrash`); o cron apaga depois. Item na lixeira não edita, não exporta e não entra nas métricas, exceto na contagem "na lixeira".
- A categoria precisa ser da plataforma ou do próprio restaurante; categoria de outro restaurante dá 400.
- Limites por restaurante: 200 materiais ativos, 30 categorias próprias, 100 datas próprias.
- O proxy do site repassa só os parâmetros `lixeira=1` e `definitivo=1`; qualquer outro parâmetro é descartado.
- A migração 0010 usa `ALTER TABLE ... ADD` sem índice nem chave estrangeira nas colunas novas, porque o SQLite só remove coluna assim; o gerador de rollback agora reverte esses `ADD`.

## Fora do escopo desta entrega

Publicação direta em redes sociais (exige contas e credenciais dos restaurantes), geração por IA e agendamento de postagens.
