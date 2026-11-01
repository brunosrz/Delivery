export type Block = { p: string } | { ul: string[] } | { table: { head: string[]; rows: string[][] } }

export type Section = { id: string; title: string; blocks: Block[] }

export type LegalContent = { title: string; intro: string; sections: Section[] }

export type LegalKind = "terms" | "privacy" | "cookies"
