"""Tarefas operacionais do SConstruct; importar este módulo não tem efeitos externos."""

import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

HELP = """Delivery - Node 22+, pnpm 11, Python 3 e SCons no PATH.
scons [help|install|build|tests|coverage|lint|check|deploy|prod|update|clean]
update --latest pode alterar versoes major. Logs: .scons-logs/<alvo>.log.
Deploy exige vercel no PATH, VERCEL_PROJECT_ID e VERCEL_ORG_ID.
"""
ANSI = re.compile(r"\x1b(?:\[[0-9;?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1b\\))")
SECRET_ENV = ("TOKEN", "SECRET", "PASSWORD", "API_KEY")
SECRET_ARG = re.compile(r"(--(?:token|password|secret)(?:=|\s+))\S+")
CLEAN_PATHS = (
    "apps/web/.next",
    "apps/web/out",
    "apps/web/coverage",
    "apps/web/test-results",
    "apps/web/playwright-report",
    "apps/web/tsconfig.tsbuildinfo",
    "apps/web/next-env.d.ts",
    "apps/casa-das-maquinas/coverage",
    "packages/contracts/coverage",
    "packages/domain/coverage",
    "coverage",
    "test-results",
    "playwright-report",
)
WORKER_CONFIGS = ("wrangler.toml", "wrangler.json", "wrangler.jsonc")


class Tasks:
    def __init__(self, root, name, latest=False):
        self.root = Path(root).resolve()
        self.name = name
        self.latest = latest
        self.env = dict(os.environ, CI="true", NO_COLOR="1", FORCE_COLOR="0")

    def resolve(self, name):
        candidates = [name + ".cmd", name + ".exe", name] if sys.platform == "win32" else [name]
        for candidate in candidates:
            found = shutil.which(candidate)
            if found:
                return found
        raise OSError(f"Executavel ausente no PATH: {name}")

    def redact(self, text):
        for key, value in self.env.items():
            if value and any(word in key.upper() for word in SECRET_ENV):
                text = text.replace(value, "***")
        return SECRET_ARG.sub(r"\1***", text)

    def run(self, *args, cwd=None, capture=False):
        logdir = self.root / ".scons-logs"
        logdir.mkdir(exist_ok=True)
        output = []
        with (logdir / (self.name + ".log")).open("a", encoding="utf-8") as log:

            def emit(message):
                message = self.redact(ANSI.sub("", message))
                print(message, end="", flush=True)
                log.write(message)
                log.flush()

            emit(f"\n[{self.name}] $ {' '.join(args)}\n")
            try:
                command = [self.resolve(args[0]), *args[1:]]
                proc = subprocess.Popen(
                    command,
                    cwd=cwd or self.root,
                    env=self.env,
                    stdin=subprocess.DEVNULL,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                )
                stream = proc.stdout
                assert stream is not None
                try:
                    for line in stream:
                        output.append(line)
                        emit(line)
                    code = proc.wait()
                except KeyboardInterrupt:
                    proc.terminate()
                    try:
                        proc.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        proc.kill()
                        proc.wait()
                    raise
                finally:
                    stream.close()
                emit(f"[{self.name}] exit={code}\n")
                if code:
                    raise RuntimeError(f"Comando falhou ({code}): {args[0]}")
            except OSError as error:
                emit(f"[{self.name}] {error}\n")
                raise
        return "".join(output) if capture else None

    def tests(self):
        # O script `test` da raiz já delega ao pnpm -r: raiz e workspaces rodam uma vez.
        self.run("pnpm", "run", "test")

    def lint(self):
        failed = False
        for script in ("lint", "format:check", "typecheck"):
            try:
                self.run("pnpm", "run", script)
            except (OSError, RuntimeError):
                failed = True
        if failed:
            raise RuntimeError("Lint: uma ou mais etapas falharam")

    def deploy(self):
        worker = self.root / "apps" / "casa-das-maquinas"
        has_worker = worker.is_dir()
        self.resolve("vercel")
        project = self.env.get("VERCEL_PROJECT_ID")
        org = self.env.get("VERCEL_ORG_ID")
        if not project or not org:
            raise RuntimeError("Configure VERCEL_PROJECT_ID e VERCEL_ORG_ID")
        link = self.root / ".vercel" / "project.json"
        try:
            data = json.loads(link.read_text(encoding="utf-8"))
        except (OSError, ValueError) as error:
            raise RuntimeError(f"Vinculo Vercel ilegivel: {link}") from error
        if data.get("projectId") != project or data.get("orgId") != org:
            raise RuntimeError("Vinculo Vercel diverge dos identificadores configurados")
        if has_worker:
            self.resolve("pnpm")
            if not any((worker / name).is_file() for name in WORKER_CONFIGS):
                raise RuntimeError("Worker sem configuracao Wrangler")
        else:
            print("Worker ausente: etapa omitida.")
        # whoami nao prova permissao de deploy; qualquer falha interrompe a publicacao.
        self.run("vercel", "whoami")
        self.run("vercel", "project", "inspect", project, "--scope", org)
        if has_worker:
            self.run("pnpm", "exec", "wrangler", "whoami", cwd=worker)
            self.run("pnpm", "exec", "wrangler", "deploy", "--dry-run", cwd=worker)
            self.run("pnpm", "exec", "wrangler", "deploy", cwd=worker)
        self.run("vercel", "deploy", "--prod", "--yes", "--scope", org)

    def clean(self):
        paths = [self.root / name for name in CLEAN_PATHS]
        for path in paths:
            if path.is_symlink() or not path.resolve().is_relative_to(self.root):
                raise RuntimeError(f"Caminho inseguro: {path}")
        for path in paths:
            if path.is_dir():
                shutil.rmtree(path)
            elif path.exists():
                path.unlink()

    def execute(self):
        try:
            if self.latest and self.name != "update":
                raise RuntimeError("--latest e exclusivo de update")
            if self.name == "help":
                print(HELP)
            elif self.name == "install":
                self.run("pnpm", "install", "--frozen-lockfile")
            elif self.name == "build":
                self.run("pnpm", "run", "build")
            elif self.name == "coverage":
                self.run("pnpm", "run", "test:coverage")
            elif self.name == "update":
                # `-r` inclui a raiz e os workspaces configurados, sem duplicação.
                self.run("pnpm", "update", "-r", *(["--latest"] if self.latest else []))
            elif self.name == "check":
                self.lint()
                self.tests()
            else:
                getattr(self, self.name)()
            return 0
        except (OSError, RuntimeError) as error:
            print(f"[{self.name}] {error}", file=sys.stderr)
            return 1
