"""Tarefas operacionais do SConstruct; importar este módulo não tem efeitos externos."""

import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

HELP = """Delivery - Node 22+, Bun 1.4, Python 3 e SCons no PATH.
scons [help|install|build|tests|coverage|lint|check|deploy-preview|deploy-prod|update|clean]
preview e prod sao aliases. Deploy publica somente apps/api na Cloudflare;
apps/web nao e publicado por estes alvos. Configure Cloudflare em .env.
update --latest pode alterar versoes major. Logs: .scons-logs/<alvo>.log.
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
    "apps/api/coverage",
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
        self.load_env_file(self.root / ".env")

    def load_env_file(self, path):
        """Load ignored local settings without overriding the caller's environment."""
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except FileNotFoundError:
            return
        for line in lines:
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            if stripped.startswith("export "):
                stripped = stripped[7:].lstrip()
            key, separator, value = stripped.partition("=")
            if not separator or not key.strip():
                continue
            key = key.strip()
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
                value = value[1:-1]
            self.env.setdefault(key, value)

    def resolve(self, name):
        candidates = (
            [name + ".cmd", name + ".exe", name] if sys.platform == "win32" else [name]
        )
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
                encoding = getattr(sys.stdout, "encoding", None) or "utf-8"
                console_message = message.encode(encoding, errors="replace").decode(
                    encoding, errors="replace"
                )
                print(console_message, end="", flush=True)
                log.write(message)
                log.flush()

            emit(f"\n[{self.name}] $ {' '.join(args)}\n")
            started = time.perf_counter()
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
                emit(
                    f"[{self.name}] exit={code} duration={time.perf_counter() - started:.1f}s\n"
                )
                if code:
                    raise RuntimeError(f"Comando falhou ({code}): {args[0]}")
            except OSError as error:
                emit(f"[{self.name}] {error}\n")
                raise
        return "".join(output) if capture else None

    def tests(self):
        # O script `test` da raiz já delega ao bun run --filter: raiz e workspaces rodam uma vez.
        self.run("bun", "run", "test")

    def lint(self):
        failed = False
        for script in ("lint", "format:check", "typecheck"):
            try:
                self.run("bun", "run", script)
            except (OSError, RuntimeError):
                failed = True
        if failed:
            raise RuntimeError("Lint: uma ou mais etapas falharam")

    def deploy(self, target):
        worker = self.root / "apps" / "api"
        if not worker.is_dir() or not any(
            (worker / name).is_file() for name in WORKER_CONFIGS
        ):
            raise RuntimeError("apps/api sem configuracao Wrangler")
        if not self.env.get("CLOUDFLARE_API_TOKEN") or not self.env.get(
            "CLOUDFLARE_ACCOUNT_ID"
        ):
            raise RuntimeError(
                "Configure CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID no ambiente ou .env"
            )
        expected = {
            "preview": ("delivery-preview", "7e64fb05-d729-4aae-9ff0-425831b69a31"),
            "production": (
                "delivery-production",
                "c24822ba-9107-4a97-bab3-0e5ba01bff32",
            ),
        }
        database = expected[target]
        configured_id = self.env.get(
            "PREVIEW_D1_DATABASE_ID"
            if target == "preview"
            else "PRODUCTION_D1_DATABASE_ID"
        )
        if configured_id != database[1]:
            raise RuntimeError(
                f"O ID D1 configurado para {target} não corresponde ao recurso isolado provisionado"
            )
        self.resolve("bunx")
        self.run("bunx", "wrangler", "whoami", cwd=worker)
        self.run(
            "bunx",
            "wrangler",
            "d1",
            "migrations",
            "apply",
            "DB",
            "--remote",
            "--env",
            target,
            cwd=worker,
        )
        self.run("bunx", "wrangler", "deploy", "--env", target, cwd=worker)

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
                self.run("bun", "install", "--frozen-lockfile")
            elif self.name == "build":
                self.run("bun", "run", "build")
            elif self.name == "coverage":
                self.run("bun", "run", "test:coverage")
            elif self.name == "update":
                # `-r` inclui a raiz e os workspaces configurados, sem duplicação.
                self.run("bun", "update", "-r", *(["--latest"] if self.latest else []))
            elif self.name == "check":
                self.lint()
                self.tests()
            elif self.name == "deploy-preview":
                self.deploy("preview")
            elif self.name in {"deploy-prod", "deploy"}:
                self.deploy("production")
            else:
                getattr(self, self.name)()
            return 0
        except (OSError, RuntimeError) as error:
            print(f"[{self.name}] {error}", file=sys.stderr)
            return 1
