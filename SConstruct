"""Delivery operational targets (see scons help)."""
import sys

sys.path.insert(0, Dir("#").abspath)
from scripts.scons_tasks import HELP, Tasks

AddOption(
    "--latest",
    dest="latest",
    action="store_true",
    default=False,
    help="Somente update: permite versoes major novas",
)
root = Dir("#").abspath
env = Environment()
previous = None
# Serializa os alvos operacionais pedidos na linha de comando, mesmo com -j.
for name in ("help", "install", "build", "coverage", "lint", "tests", "check", "deploy", "update", "clean"):

    def action(target, source, env, name=name):
        return Tasks(root, name, GetOption("latest")).execute()

    node = env.Alias(name, [], Action(action, "[scons] " + name))
    AlwaysBuild(node)
    if name in COMMAND_LINE_TARGETS or (name == "deploy" and "prod" in COMMAND_LINE_TARGETS):
        if previous is not None:
            Requires(node, previous)
        previous = node
    if name == "deploy":
        env.Alias("prod", node)
Help(HELP)
Default("help")
