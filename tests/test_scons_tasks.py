import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from scripts.scons_tasks import Tasks


class TaskTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.task = Tasks(self.root, "tests")

    def test_resolution_missing(self):
        with patch("shutil.which", return_value=None):
            with self.assertRaisesRegex(OSError, "bun"):
                self.task.resolve("bun")

    def test_windows_resolution(self):
        with patch("sys.platform", "win32"), patch("shutil.which", side_effect=[None, "bun.exe"]) as which:
            self.assertEqual(self.task.resolve("bun"), "bun.exe")
            self.assertEqual(which.call_args.args, ("bun.exe",))

    def test_run_logs_environment_and_failure(self):
        process = Mock(stdout=io.StringIO("\x1b[31msecret\x1b[0m\n"))
        process.wait.return_value = 2
        self.task.env["API_TOKEN"] = "secret"
        with patch.object(self.task, "resolve", return_value="/bun"), patch(
            "subprocess.Popen", return_value=process
        ) as popen:
            with self.assertRaises(RuntimeError):
                self.task.run("bun", "test")
        self.assertEqual(popen.call_args.kwargs["cwd"], self.root)
        self.assertEqual(popen.call_args.kwargs["env"]["CI"], "true")
        self.assertFalse(popen.call_args.kwargs.get("shell", False))
        log = (self.root / ".scons-logs/tests.log").read_text(encoding="utf-8")
        self.assertIn("***", log)
        self.assertNotIn("\x1b", log)
        self.assertNotIn("secret", log)
        self.assertRegex(log, r"exit=2 duration=\d+\.\d+s")

    def test_interruption_waits(self):
        process = Mock(stdout=io.StringIO(""))
        process.wait.side_effect = [KeyboardInterrupt, 0]
        with patch.object(self.task, "resolve", return_value="/bun"), patch(
            "subprocess.Popen", return_value=process
        ):
            with self.assertRaises(KeyboardInterrupt):
                self.task.run("bun")
        process.terminate.assert_called_once()
        self.assertEqual(process.wait.call_count, 2)

    def test_tests_run_root_script_once(self):
        with patch.object(self.task, "run") as run:
            self.task.tests()
        run.assert_called_once_with("bun", "run", "test")

    def test_update_includes_latest_only_when_requested(self):
        task = Tasks(self.root, "update", True)
        with patch.object(task, "run") as run:
            self.assertEqual(task.execute(), 0)
        run.assert_called_once_with("bun", "update", "-r", "--latest")
        with patch.object(self.task, "run"):
            self.task.latest = True
            self.assertEqual(self.task.execute(), 1)

    def test_clean_refuses_symlinks(self):
        try:
            (self.root / "coverage").symlink_to(self.root.parent, target_is_directory=True)
        except OSError:
            self.skipTest("symlinks exigem privilegio neste sistema")
        with self.assertRaises(RuntimeError):
            self.task.clean()

    def test_clean_removes_listed_outputs_only(self):
        (self.root / "coverage").mkdir()
        (self.root / ".env").write_text("A=1")
        self.task.clean()
        self.assertFalse((self.root / "coverage").exists())
        self.assertTrue((self.root / ".env").exists())

    def test_help_has_no_effects(self):
        self.task.name = "help"
        with patch.object(self.task, "run") as run:
            self.assertEqual(self.task.execute(), 0)
        run.assert_not_called()
        self.assertFalse((self.root / ".scons-logs").exists())

    def test_lint_attempts_all_steps(self):
        with patch.object(self.task, "run", side_effect=RuntimeError) as run:
            with self.assertRaises(RuntimeError):
                self.task.lint()
        self.assertEqual(run.call_count, 3)

    PREVIEW_ID = "7e64fb05-d729-4aae-9ff0-425831b69a31"
    PRODUCTION_ID = "c24822ba-9107-4a97-bab3-0e5ba01bff32"

    def _deploy_setup(self, worker=True, **env):
        if worker:
            folder = self.root / "apps/api"
            folder.mkdir(parents=True)
            (folder / "wrangler.jsonc").touch()
        values = {
            "CLOUDFLARE_API_TOKEN": "token",
            "CLOUDFLARE_ACCOUNT_ID": "conta",
            "PREVIEW_D1_DATABASE_ID": self.PREVIEW_ID,
            "PRODUCTION_D1_DATABASE_ID": self.PRODUCTION_ID,
        }
        values.update(env)
        self.task.env.clear()
        self.task.env.update({key: value for key, value in values.items() if value is not None})

    def test_deploy_requires_the_worker_config(self):
        self._deploy_setup(worker=False)
        with patch.object(self.task, "resolve"), patch.object(self.task, "run") as run:
            with self.assertRaises(RuntimeError):
                self.task.deploy("preview")
        run.assert_not_called()

    def test_deploy_requires_cloudflare_credentials(self):
        self._deploy_setup(CLOUDFLARE_API_TOKEN=None)
        with patch.object(self.task, "resolve"), patch.object(self.task, "run") as run:
            with self.assertRaises(RuntimeError):
                self.task.deploy("preview")
        run.assert_not_called()

    def test_deploy_rejects_a_database_id_of_another_environment(self):
        self._deploy_setup(PREVIEW_D1_DATABASE_ID=self.PRODUCTION_ID)
        with patch.object(self.task, "resolve"), patch.object(self.task, "run") as run:
            with self.assertRaises(RuntimeError):
                self.task.deploy("preview")
        run.assert_not_called()

    def test_deploy_migrates_then_publishes_the_chosen_environment(self):
        self._deploy_setup()
        with patch.object(self.task, "resolve"), patch.object(self.task, "run") as run:
            self.task.deploy("production")
        commands = [call.args for call in run.call_args_list]
        self.assertEqual(commands[0][:3], ("bunx", "wrangler", "whoami"))
        self.assertIn("migrations", commands[1])
        self.assertEqual(commands[1][-2:], ("--env", "production"))
        self.assertEqual(commands[2], ("bunx", "wrangler", "deploy", "--env", "production"))

    def test_deploy_stops_when_the_migration_fails(self):
        self._deploy_setup()
        with patch.object(self.task, "resolve"), patch.object(
            self.task, "run", side_effect=[None, RuntimeError]
        ) as run:
            with self.assertRaises(RuntimeError):
                self.task.deploy("preview")
        self.assertFalse(any(call.args[:3] == ("bunx", "wrangler", "deploy") for call in run.call_args_list))

    def _web_setup(self, **env):
        folder = self.root / "apps/web"
        folder.mkdir(parents=True)
        (folder / "wrangler.jsonc").touch()
        values = {"CLOUDFLARE_API_TOKEN": "token", "CLOUDFLARE_ACCOUNT_ID": "conta"}
        values.update(env)
        self.task.env.clear()
        self.task.env.update({key: value for key, value in values.items() if value is not None})

    def test_deploy_web_requires_the_wrangler_config(self):
        with patch.object(self.task, "resolve"), patch.object(self.task, "run") as run:
            with self.assertRaises(RuntimeError):
                self.task.deploy_web("preview")
        run.assert_not_called()

    def test_deploy_web_requires_cloudflare_credentials(self):
        self._web_setup(CLOUDFLARE_ACCOUNT_ID=None)
        with patch.object(self.task, "resolve"), patch.object(self.task, "run") as run:
            with self.assertRaises(RuntimeError):
                self.task.deploy_web("preview")
        run.assert_not_called()

    def test_deploy_web_builds_and_publishes_the_chosen_environment(self):
        self._web_setup()
        with patch.object(self.task, "resolve"), patch.object(self.task, "run") as run:
            self.task.deploy_web("production")
        commands = [call.args for call in run.call_args_list]
        self.assertEqual(commands[0], ("bun", "run", "i18n"))
        self.assertEqual(commands[1], ("bunx", "vinext-cloudflare", "deploy", "--env", "production"))
        self.assertEqual(run.call_args_list[1].kwargs["cwd"], self.root / "apps/web")

    def test_deploy_preview_publishes_api_before_web(self):
        self.task.name = "deploy-preview"
        calls = []
        with patch.object(self.task, "deploy", side_effect=lambda t: calls.append(("api", t))), patch.object(
            self.task, "deploy_web", side_effect=lambda t: calls.append(("web", t))
        ):
            self.assertEqual(self.task.execute(), 0)
        self.assertEqual(calls, [("api", "preview"), ("web", "preview")])

    def test_deploy_web_prod_does_not_touch_the_api(self):
        self.task.name = "deploy-web-prod"
        with patch.object(self.task, "deploy") as api, patch.object(self.task, "deploy_web") as web:
            self.assertEqual(self.task.execute(), 0)
        api.assert_not_called()
        web.assert_called_once_with("production")


if __name__ == "__main__":
    unittest.main()
