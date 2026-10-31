"""
Delivery — SConstruct (SCons build file)

Uso (a partir da raiz do repositório):
    scons                 - exibe ajuda
    scons install         - pnpm install --frozen-lockfile
    scons tests           - vitest (raiz e, se existirem, apps/ e packages/)
    scons lint            - eslint + prettier --check + tsc --noEmit
    scons deploy          - deploy: Worker da Casa das Máquinas (se existir) + web na Vercel
    scons update          - atualiza dependências respeitando os ranges do package.json
    scons update --latest - ignora os ranges (pnpm --latest cruza majors); revisar cada
                            breaking change antes de commitar

Pré-requisitos: Node 22, pnpm 11 e SCons (pip install scons) no PATH.
O deploy exige `vercel` e, para o Worker, `wrangler` autenticados.
"""

import os
import subprocess
import sys

AddOption(
    "--latest",
    dest="latest",
    action="store_true",
    default=False,
    help="scons update --latest: ignora ranges, força o major mais novo",
)

ROOT = Dir("#").abspath
WORKER = os.path.join(ROOT, "apps", "casa-das-maquinas")
PNPM = "pnpm.cmd" if sys.platform == "win32" else "pnpm"


def run(*cmd, cwd=ROOT):
    print(f"\n$ {' '.join(cmd)}")
    return subprocess.call(cmd, cwd=cwd) == 0


def steps(*results):
    """Executa cada passo mesmo após falha e devolve 0 só se todos passaram."""
    return 0 if all(results) else 1


def has_workspace():
    return os.path.exists(os.path.join(ROOT, "pnpm-workspace.yaml")) and os.path.isdir(
        os.path.join(ROOT, "apps")
    )


def install(target, source, env):
    return steps(run(PNPM, "install", "--frozen-lockfile"))


def tests(target, source, env):
    results = [run(PNPM, "test")]
    if has_workspace():
        results.append(run(PNPM, "-r", "--if-present", "test", "--filter", "./apps/*", "--filter", "./packages/*"))
    return steps(*results)


def lint(target, source, env):
    return steps(
        run(PNPM, "lint"),
        run(PNPM, "format:check"),
        run(PNPM, "typecheck"),
    )


def deploy(target, source, env):
    results = []
    if os.path.isdir(WORKER):
        results.append(run(PNPM, "exec", "wrangler", "deploy", cwd=WORKER))
    results.append(run(PNPM, "exec", "vercel", "deploy", "--prod"))
    return steps(*results)


def update(target, source, env):
    cmd = [PNPM, "update", "-r"]
    if GetOption("latest"):
        cmd.append("--latest")
    return steps(run(*cmd))


PHONY = {
    "install": install,
    "tests": tests,
    "lint": lint,
    "deploy": deploy,
    "update": update,
}

env = Environment()
for name, fn in PHONY.items():
    alias = env.Alias(name, [], Action(fn, f"[scons] {name}"))
    AlwaysBuild(alias)

Help(__doc__)
Default(None)
