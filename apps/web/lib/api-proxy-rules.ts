// Lista fechada das rotas da Casa das Máquinas que o navegador pode chamar pelo proxy /api/v1.
// Fica fora de route.ts porque o Next só aceita exports de rota (GET, POST...) nesse arquivo.

type Allowed = { methods: readonly string[]; pattern: RegExp }

/** Lista fechada: qualquer outro caminho (inclusive /v1/manage, /v1/me e o webhook) é recusado. */
const ALLOWED: readonly Allowed[] = [
  { methods: ["POST"], pattern: /^quotes$/ },
  // Formulário de contato do site institucional (público; o backend limita por IP e usa armadilha anti-robô).
  { methods: ["POST"], pattern: /^contact$/ },
  { methods: ["POST"], pattern: /^orders$/ },
  { methods: ["GET"], pattern: /^orders$/ },
  { methods: ["GET"], pattern: /^orders\/[A-Za-z0-9_-]{1,64}$/ },
  { methods: ["POST"], pattern: /^orders\/[A-Za-z0-9_-]{1,64}\/payment$/ },
  // Equipe do restaurante e entregadores; o backend valida papel e vínculo com o restaurante.
  { methods: ["POST"], pattern: /^orders\/[A-Za-z0-9_-]{1,64}\/transitions$/ },
  // MKit: materiais de marketing do restaurante (o backend exige equipe do restaurante ou admin).
  { methods: ["GET", "POST"], pattern: /^manage\/restaurants\/[A-Za-z0-9_-]{1,64}\/mkit\/materials$/ },
  {
    methods: ["PATCH", "DELETE"],
    pattern: /^manage\/restaurants\/[A-Za-z0-9_-]{1,64}\/mkit\/materials\/[A-Za-z0-9_-]{1,64}$/,
  },
  {
    methods: ["GET"],
    pattern: /^manage\/restaurants\/[A-Za-z0-9_-]{1,64}\/mkit\/materials\/[A-Za-z0-9_-]{1,64}\/export$/,
  },
]

export function isAllowed(method: string, path: readonly string[]): boolean {
  const joined = path.join("/")
  return ALLOWED.some((rule) => rule.methods.includes(method) && rule.pattern.test(joined))
}
