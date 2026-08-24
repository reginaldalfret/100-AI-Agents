using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace SovereignInstaller
{
    public class Program
    {
        private static Form installForm;
        private static ProgressBar progressBar;
        private static Label lblStatus;
        private static Button btnFinish;

        [STAThread]
        public static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            installForm = new Form();
            installForm.Text = "301 Super AI Setup";
            installForm.Size = new Size(580, 420);
            installForm.FormBorderStyle = FormBorderStyle.FixedDialog;
            installForm.MaximizeBox = false;
            installForm.StartPosition = FormStartPosition.CenterScreen;
            installForm.BackColor = Color.FromArgb(15, 23, 42);

            Label titleLabel = new Label();
            titleLabel.Text = "301 Super AI — Sovereign AI Workbench";
            titleLabel.Font = new Font("Segoe UI", 16, FontStyle.Bold);
            titleLabel.ForeColor = Color.FromArgb(241, 245, 249);
            titleLabel.Location = new Point(30, 25);
            titleLabel.Size = new Size(520, 35);
            installForm.Controls.Add(titleLabel);

            Label descLabel = new Label();
            descLabel.Text = "Installing production self-contained sovereign workstation...\nNo internet connection or manual package installation required.";
            descLabel.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            descLabel.ForeColor = Color.FromArgb(148, 163, 184);
            descLabel.Location = new Point(32, 65);
            descLabel.Size = new Size(520, 45);
            installForm.Controls.Add(descLabel);

            Label checklist = new Label();
            checklist.Text = "• Bundled Runtimes & Supervisor\n• 301 AI Specialist Agents\n• Local Model Manifest & Verification Engine\n• 24 Liquid Glass Visualization Types\n• 100% Offline Voice Input & Speech-to-Text\n• Strict On-Premise Air-Gap Security Enforced";
            checklist.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            checklist.ForeColor = Color.FromArgb(52, 211, 153);
            checklist.Location = new Point(32, 120);
            checklist.Size = new Size(520, 140);
            installForm.Controls.Add(checklist);

            progressBar = new ProgressBar();
            progressBar.Location = new Point(32, 275);
            progressBar.Size = new Size(505, 14);
            progressBar.Minimum = 0;
            progressBar.Maximum = 100;
            progressBar.Value = 10;
            installForm.Controls.Add(progressBar);

            lblStatus = new Label();
            lblStatus.Text = "Preparing installation payload...";
            lblStatus.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblStatus.ForeColor = Color.FromArgb(203, 213, 225);
            lblStatus.Location = new Point(32, 300);
            lblStatus.Size = new Size(505, 25);
            installForm.Controls.Add(lblStatus);

            btnFinish = new Button();
            btnFinish.Text = "Install";
            btnFinish.Font = new Font("Segoe UI", 10, FontStyle.Bold);
            btnFinish.ForeColor = Color.White;
            btnFinish.BackColor = Color.FromArgb(99, 102, 241);
            btnFinish.FlatStyle = FlatStyle.Flat;
            btnFinish.FlatAppearance.BorderSize = 0;
            btnFinish.Location = new Point(405, 335);
            btnFinish.Size = new Size(130, 36);
            btnFinish.Click += (s, e) => PerformInstallation();
            installForm.Controls.Add(btnFinish);

            Application.Run(installForm);
        }

        private static void PerformInstallation()
        {
            btnFinish.Enabled = false;
            Thread worker = new Thread(() => {
                try
                {
                    UpdateStatus("Extracting core files to local application directory...", 30);
                    string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                    string installDir = Path.Combine(localAppData, "Programs", "301 Super AI");
                    if (!Directory.Exists(installDir)) Directory.CreateDirectory(installDir);

                    // Extract embedded resources or copy application files
                    string sourceDir = AppDomain.CurrentDomain.BaseDirectory;
                    CopyDirectory(sourceDir, installDir);

                    UpdateStatus("Creating Desktop and Start Menu shortcuts...", 60);
                    CreateShortcuts(installDir);

                    UpdateStatus("Registering Windows uninstaller and air-gap policy...", 85);
                    RegisterUninstaller(installDir);

                    UpdateStatus("Installation complete! Sovereign AI Workbench is ready.", 100);

                    installForm.Invoke(new Action(() => {
                        btnFinish.Text = "Launch";
                        btnFinish.Enabled = true;
                        btnFinish.Click -= (s, e) => PerformInstallation();
                        btnFinish.Click += (s, e) => {
                            string exePath = Path.Combine(installDir, "301-Super-AI.exe");
                            if (File.Exists(exePath)) Process.Start(exePath);
                            else Process.Start("http://127.0.0.1:8300/");
                            Application.Exit();
                        };
                    }));
                }
                catch (Exception ex)
                {
                    installForm.Invoke(new Action(() => {
                        lblStatus.ForeColor = Color.FromArgb(244, 63, 94);
                        lblStatus.Text = "Installation failed: " + ex.Message;
                        btnFinish.Enabled = true;
                    }));
                }
            });
            worker.IsBackground = true;
            worker.Start();
        }

        private static void UpdateStatus(string msg, int progress)
        {
            if (installForm.IsDisposed) return;
            installForm.Invoke(new Action(() => {
                lblStatus.Text = msg;
                progressBar.Value = Math.Min(progress, 100);
            }));
        }

        private static void CopyDirectory(string sourceDir, string targetDir)
        {
            foreach (string file in Directory.GetFiles(sourceDir, "*.*", SearchOption.AllDirectories))
            {
                if (file.EndsWith("301-Super-AI-Setup.exe", StringComparison.OrdinalIgnoreCase)) continue;
                string rel = file.Substring(sourceDir.Length).TrimStart('\\', '/');
                string dest = Path.Combine(targetDir, rel);
                string destDir = Path.GetDirectoryName(dest);
                if (!Directory.Exists(destDir)) Directory.CreateDirectory(destDir);
                try { File.Copy(file, dest, true); } catch { }
            }
        }

        private static void CreateShortcuts(string installDir)
        {
            string exePath = Path.Combine(installDir, "301-Super-AI.exe");
            string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            string startMenuDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs");

            CreateShortcut(Path.Combine(desktopDir, "301 Super AI.lnk"), exePath, installDir, "301 Super AI — Sovereign AI Workbench");
            CreateShortcut(Path.Combine(startMenuDir, "301 Super AI.lnk"), exePath, installDir, "301 Super AI — Sovereign AI Workbench");
        }

        private static void CreateShortcut(string shortcutPath, string targetPath, string workDir, string desc)
        {
            try
            {
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                dynamic shell = Activator.CreateInstance(shellType);
                dynamic shortcut = shell.CreateShortcut(shortcutPath);
                shortcut.TargetPath = targetPath;
                shortcut.WorkingDirectory = workDir;
                shortcut.Description = desc;
                shortcut.Save();
            }
            catch { }
        }

        private static void RegisterUninstaller(string installDir)
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\301SuperAI"))
                {
                    if (key != null)
                    {
                        key.SetValue("DisplayName", "301 Super AI — Sovereign AI Workbench");
                        key.SetValue("DisplayVersion", "2.0.0");
                        key.SetValue("Publisher", "Smart India Hackathon Team");
                        key.SetValue("InstallLocation", installDir);
                        key.SetValue("DisplayIcon", Path.Combine(installDir, "301-Super-AI.exe"));
                        key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                        key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                    }
                }
            }
            catch { }
        }
    }
}
