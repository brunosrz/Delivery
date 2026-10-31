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
            with self.assertRaisesRegex(OSError, "pnpm"):
                self.task.resolve("pnpm")

    def test_windows_resolution(self):
        with patch("sys.platform", "win32"), patch("shutil.which", side_effect=[None, "pnpm.exe"]) as which:
            self.assertEqual(self.task.resolve("pnpm"), "pnpm.exe")
            self.assertEqual(which.call_args.args, ("pnpm.exe",))

    def test_run_logs_environment_and_failure(self):
        process = Mock(stdout=io.StringIO("\x1b[31msecret\x1b[0m\n"))
        process.wait.return_value = 2
        self.task.env["API_TOKEN"] = "secret"
        with patch.object(self.task, "resolve", return_value="/pnpm"), patch(
            "subprocess.Popen", return_value=process
        ) as popen:
            with self.assertRaises(RuntimeError):
                self.task.run("pnpm", "test")
        self.assertEqual(popen.call_args.kwargs["cwd"], self.root)
        self.assertEqual(popen.call_args.kwargs["env"]["CI"], "true")
        self.assertFalse(popen.call_args.kwargs.get("shell", False))
        log = (self.root / ".scons-logs/tests.log").read_text(encoding="utf-8")
        self.assertIn("***", log)
        self.assertNotIn("\x1b", log)
        self.assertNotIn("secret", log)

    def test_interruption_waits(self):
        process = Mock(stdout=io.StringIO(""))
        process.wait.side_effect = [KeyboardInterrupt, 0]
        with patch.object(self.task, "resolve", return_value="/pnpm"), patch(
            "subprocess.Popen", return_value=process
        ):
            with self.assertRaises(KeyboardInterrupt):
                self.task.run("pnpm")
        process.terminate.assert_called_once()
        self.assertEqual(process.wait.call_count, 2)

    def test_tests_run_root_script_once(self):
        with patch.object(self.task, "run") as run:
            self.task.tests()
        run.assert_called_once_with("pnpm", "run", "test")

    def test_update_includes_latest_only_when_requested(self):
        task = Tasks(self.root, "update", True)
        with patch.object(task, "run") as run:
            self.assertEqual(task.execute(), 0)
        run.assert_called_once_with("pnpm", "update", "-r", "--latest")
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

    def _deploy_setup(self, worker):
        (self.root / ".vercel").mkdir()
        (self.root / ".vercel/project.json").write_text(json.dumps({"projectId": "p", "orgId": "o"}))
        self.task.env.update(VERCEL_PROJECT_ID="p", VERCEL_ORG_ID="o")
        if worker:
            folder = self.root / "apps/casa-das-maquinas"
            folder.mkdir(parents=True)
            (folder / "wrangler.jsonc").touch()

    def test_deploy_without_worker_skips_it(self):
        self._deploy_setup(False)
        with patch.object(self.task, "resolve"), patch.object(self.task, "run") as run:
            self.task.deploy()
        self.assertFalse(any("wrangler" in call.args for call in run.call_args_list))
        self.assertEqual(run.call_args_list[-1].args[:3], ("vercel", "deploy", "--prod"))

    def test_deploy_stops_after_worker_failure(self):
        self._deploy_setup(True)
        with patch.object(self.task, "resolve"), patch.object(
            self.task, "run", side_effect=[None, None, None, None, RuntimeError]
        ) as run:
            with self.assertRaises(RuntimeError):
                self.task.deploy()
        self.assertFalse(any(call.args[:2] == ("vercel", "deploy") for call in run.call_args_list))

    def test_deploy_rejects_diverging_link(self):
        self._deploy_setup(False)
        self.task.env["VERCEL_ORG_ID"] = "other"
        with patch.object(self.task, "resolve"), patch.object(self.task, "run") as run:
            with self.assertRaises(RuntimeError):
                self.task.deploy()
        run.assert_not_called()


if __name__ == "__main__":
    unittest.main()
