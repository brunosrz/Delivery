# Implementação de Multi-Tenancy

## Visão Geral

O sistema Sorz é projetado como uma plataforma multi-tenant, onde cada restaurante é um tenant separado com seus próprios dados, configurações e, opcionalmente, domínio personalizado. Esta abordagem permite:

1. Isolamento de dados entre restaurantes
2. Personalização por restaurante
3. Escalabilidade para milhares de restaurantes
4. Gerenciamento centralizado da plataforma

## Estratégia de Multi-Tenancy

### Identificação de Tenant

O sistema identifica o tenant atual através de três métodos principais:

1. **Domínio Personalizado**: Quando o cliente acessa um domínio próprio do restaurante
   - Exemplo: `restaurante-a.com.br` → Tenant: Restaurante A

2. **Subdomínio**: Quando o cliente acessa um subdomínio da plataforma
   - Exemplo: `restaurante-b.sorz.com.br` → Tenant: Restaurante B

3. **Parâmetro/Path**: Quando o cliente acessa via slug na URL
   - Exemplo: `sorz.com.br/r/restaurante-c` → Tenant: Restaurante C

### Middleware de Tenant

Um middleware especializado intercepta todas as requisições para:

1. Identificar o tenant com base na URL
2. Carregar as configurações do tenant
3. Configurar o contexto de tenant para a requisição
4. Aplicar personalizações visuais e de marca

\`\`\`typescript
// Exemplo simplificado do middleware de tenant
export async function middleware(request: NextRequest) {
  // 1. Extrair informações da URL
  const { hostname, pathname } = request.nextUrl;

  // 2. Identificar o tenant
  let tenantId: string | null = null;

  // Verificar domínio personalizado
  const customDomain = await db.customDomains.findUnique({
    where: { domain: hostname },
  });

  if (customDomain) {
    tenantId = customDomain.tenantId;
  }
  // Verificar subdomínio
  else if (hostname.includes('.sorz.com.br')) {
    const subdomain = hostname.split('.')[0];
    if (subdomain !== 'www') {
      const tenant = await db.tenants.findUnique({
        where: { slug: subdomain },
      });
      if (tenant) tenantId = tenant.id;
    }
  }
  // Verificar path
  else if (pathname.startsWith('/r/')) {
    const slug = pathname.split('/')[2];
    const tenant = await db.tenants.findUnique({
      where: { slug },
    });
    if (tenant) tenantId = tenant.id;
  }

  // 3. Configurar o contexto de tenant
  if (tenantId) {
    // Carregar configurações do tenant
    const tenantConfig = await loadTenantConfig(tenantId);

    // Adicionar headers com informações do tenant
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', tenantId);
    response.headers.set('x-tenant-config', JSON.stringify(tenantConfig));

    return response;
  }

  return NextResponse.next();
}
\`\`\`

## Isolamento de Dados

### Estratégia de Banco de Dados

Utilizamos uma abordagem de isolamento por schema no PostgreSQL:

1. **Schema `public`**: Contém tabelas globais como:
   - `users`: Todos os usuários do sistema
   - `tenants`: Informações dos restaurantes
   - `tenant_users`: Relacionamento entre usuários e tenants

2. **Schema por tenant** (ex: `tenant_123`): Contém tabelas específicas como:
   - `products`: Produtos/cardápio do restaurante
   - `categories`: Categorias de produtos
   - `orders`: Pedidos feitos neste restaurante
   - `order_items`: Itens dos pedidos
   - `settings`: Configurações específicas do restaurante

### Prisma e Multi-Tenancy

Utilizamos o Prisma como ORM, com uma configuração especial para suportar multi-tenancy:

\`\`\`typescript
// Exemplo de configuração do Prisma para multi-tenancy
import { PrismaClient } from '@prisma/client';

// Cliente Prisma base
const prismaBase = new PrismaClient();

// Função para obter cliente Prisma específico para um tenant
export function getTenantPrisma(tenantId: string) {
  return prismaBase.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query, model }) {
          // Modelos globais não precisam de schema específico
          if (['User', 'Tenant', 'TenantUser'].includes(model)) {
            return query(args);
          }

          // Para modelos específicos de tenant, use o schema do tenant
          const result = await prismaBase.$queryRawUnsafe(
            `SET search_path TO tenant_${tenantId}; ${query}`
          );

          return result;
        },
      },
    },
  });
}

// Exemplo de uso
async function getRestaurantProducts(tenantId: string) {
  const tenantPrisma = getTenantPrisma(tenantId);
  return tenantPrisma.product.findMany();
}
\`\`\`

### Criação de Novos Tenants

Quando um novo restaurante se cadastra na plataforma:

1. Criamos um registro na tabela `tenants`
2. Criamos um novo schema no banco de dados
3. Aplicamos as migrações para criar as tabelas no novo schema
4. Configuramos as permissões e relações necessárias

\`\`\`typescript
// Exemplo de criação de novo tenant
async function createNewTenant(tenantData: TenantCreateInput) {
  // 1. Criar registro na tabela tenants
  const tenant = await prisma.tenant.create({
    data: tenantData,
  });

  // 2. Criar novo schema no banco de dados
  await prisma.$executeRawUnsafe(
    `CREATE SCHEMA IF NOT EXISTS tenant_${tenant.id}`
  );

  // 3. Aplicar migrações no novo schema
  await applyMigrationsToSchema(`tenant_${tenant.id}`);

  // 4. Criar dados iniciais
  const tenantPrisma = getTenantPrisma(tenant.id);
  await createInitialData(tenantPrisma);

  return tenant;
}
\`\`\`

## Personalização por Tenant

### Personalização Visual

Cada tenant pode personalizar:

1. **Cores**: Cores primárias, secundárias, de fundo, etc.
2. **Logo**: Logo do restaurante em diferentes formatos
3. **Imagens**: Banners, heróis, fundos, etc.
4. **Tipografia**: Fontes para títulos e textos

Estas personalizações são aplicadas através de:

1. Variáveis CSS dinâmicas
2. Classes Tailwind personalizadas
3. Componentes adaptáveis

\`\`\`typescript
// Exemplo de aplicação de tema personalizado
function TenantThemeProvider({ children, tenant }) {
  // Gerar CSS com variáveis personalizadas
  const customCss = `
    :root {
      --primary: ${tenant.theme.primaryColor};
      --secondary: ${tenant.theme.secondaryColor};
      --background: ${tenant.theme.backgroundColor};
      --text: ${tenant.theme.textColor};
      --font-heading: ${tenant.theme.headingFont};
      --font-body: ${tenant.theme.bodyFont};
    }
  `;

  return (
    <>
      <style jsx global>{customCss}</style>
      <div className="tenant-theme">{children}</div>
    </>
  );
}
\`\`\`

### Personalização de Domínio

Os restaurantes podem escolher entre:

1. **Subdomínio da plataforma**: `restaurante.sorz.com.br`
2. **Domínio próprio**: `restaurante.com.br`

Para domínios próprios, será usado um provider de DNS/edge definido por ambiente:

1. O restaurante configura os registros DNS necessários
2. Verificamos a propriedade do domínio
3. Configuramos o domínio no provider escolhido
4. Associamos o domínio ao tenant no banco de dados

## Autenticação Multi-Tenant

### Modelo de Usuário

Um usuário pode pertencer a múltiplos tenants com diferentes papéis:

1. Um cliente pode fazer pedidos em vários restaurantes
2. Um funcionário pode trabalhar em mais de um restaurante
3. Um administrador pode gerenciar múltiplos restaurantes

### Fluxo de Autenticação

1. Usuário faz login através de qualquer aplicação frontend
2. Casa das Máquinas valida credenciais e emite JWT
3. Token contém claims básicas (ID, email) mas não informações de tenant
4. Ao acessar um tenant específico, middleware adiciona contexto de tenant
5. Permissões são verificadas com base no contexto de tenant atual

### Autorização por Tenant

Utilizamos CASL para implementar autorização baseada em habilidades:

\`\`\`typescript
// Exemplo de definição de habilidades por tenant
function defineAbilitiesForUser(user: User, tenantId: string | null) {
  const { can, cannot, build } = new AbilityBuilder(Ability);

  // Verificar relação do usuário com o tenant
  const tenantUser = user.tenantUsers.find(tu => tu.tenantId === tenantId);

  if (!tenantId) {
    // Habilidades globais (sem contexto de tenant)
    can('read', 'Restaurant');
    can('create', 'Order');
  } else if (tenantUser) {
    // Habilidades baseadas no papel do usuário no tenant
    switch (tenantUser.role) {
      case 'OWNER':
        can('manage', 'all');
        break;
      case 'MANAGER':
        can('manage', ['Product', 'Category', 'Order']);
        cannot('delete', 'Restaurant');
        break;
      case 'STAFF':
        can('read', ['Product', 'Category']);
        can('update', 'Order');
        break;
      case 'CUSTOMER':
        can('read', ['Product', 'Category']);
        can('create', 'Order');
        can('read', 'Order', { userId: user.id });
        break;
    }
  }

  return build();
}
\`\`\`

## Considerações de Escalabilidade

### Banco de Dados

1. **Conexões Pooling**: Gerenciamento eficiente de conexões por tenant
2. **Índices Específicos**: Otimização de índices por tenant
3. **Particionamento**: Para tenants muito grandes ou com muitos dados
4. **Read Replicas**: Para operações de leitura intensivas

### Cache

1. **Cache por Tenant**: Isolamento de cache entre tenants
2. **Invalidação Seletiva**: Invalidar apenas o cache do tenant afetado
3. **Cache Distribuído**: Redis com namespaces por tenant

### Armazenamento

1. **Buckets Separados**: Armazenamento de arquivos isolado por tenant
2. **CDN**: Distribuição eficiente de assets estáticos
3. **Políticas de Retenção**: Gerenciamento de espaço por tenant

## Monitoramento e Observabilidade

### Métricas por Tenant

1. **Uso de Recursos**: CPU, memória, armazenamento
2. **Performance**: Tempos de resposta, throughput
3. **Negócio**: Pedidos, valores, taxas de conversão

### Alertas

1. **Alertas Globais**: Problemas que afetam toda a plataforma
2. **Alertas por Tenant**: Problemas específicos de um tenant
3. **Limites Personalizados**: Thresholds baseados no plano do tenant

### Logs

1. **Contexto de Tenant**: Todos os logs incluem o ID do tenant
2. **Filtragem**: Capacidade de filtrar logs por tenant
3. **Retenção**: Políticas de retenção baseadas no plano do tenant

## Considerações de Segurança

### Isolamento

1. **Isolamento de Dados**: Garantir que um tenant não acesse dados de outro
2. **Isolamento de Recursos**: Evitar que um tenant consuma recursos excessivos
3. **Isolamento de Cache**: Evitar vazamento de informações via cache

### Auditoria

1. **Logs de Auditoria**: Registrar todas as operações sensíveis
2. **Trilha de Auditoria**: Manter histórico de alterações
3. **Alertas de Segurança**: Detectar padrões suspeitos

### Conformidade

1. **LGPD**: Garantir conformidade com a Lei Geral de Proteção de Dados
2. **Exportação de Dados**: Permitir que tenants exportem seus dados
3. **Exclusão de Dados**: Processo seguro para exclusão de dados de tenant
\`\`\`
