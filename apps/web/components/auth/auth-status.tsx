"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authClient } from "@/lib/auth-client"

function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"
  )
}

export function AuthStatus() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" aria-label="Carregando sessão" />
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/auth/login">Entrar</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/auth/register">Criar conta</Link>
        </Button>
      </div>
    )
  }

  // Permanece na página atual: rotas protegidas voltam a exigir login no próximo acesso.
  async function signOut() {
    await authClient.signOut()
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label={`Conta de ${session.user.name}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image ?? undefined} alt="" />
            <AvatarFallback>{initials(session.user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session.user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onSelect={signOut}>
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
