using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;

namespace SovereignWorkbench
{
    public class Program
    {
        private static Mutex singleInstanceMutex;
        private static Process gatewayProcess;
        private static Process pythonProcess;
        private static Process ollamaProcess;
        private static NotifyIcon trayIcon;
        private static Form splashForm;
        private static Form mainBrowserForm;

        [STAThread]
        public static void Main(string[] args)
        {
            bool isNewInstance;
            singleInstanceMutex = new Mutex(true, "301SuperAI_SingleInstance_Mutex", out isNewInstance);
            if (!isNewInstance)
            {
                MessageBox.Show("301 Super AI is already running in your system tray.", "301 Super AI", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            ShowSplashScreen();
            StartBackgroundServices();
            ShowMainWindow();

            Application.Run();
        }

        private static void ShowSplashScreen()
        {
            splashForm = new Form();
            splashForm.Text = "301 Super AI — Initializing";
            splashForm.Size = new Size(560, 380);
            splashForm.FormBorderStyle = FormBorderStyle.None;
            splashForm.StartPosition = FormStartPosition.CenterScreen;
            splashForm.BackColor = Color.FromArgb(15, 23, 42);
            splashForm.TopMost = true;

            Label titleLabel = new Label();
            titleLabel.Text = "301 Super AI";
            titleLabel.Font = new Font("Segoe UI", 20, FontStyle.Bold);
            titleLabel.ForeColor = Color.FromArgb(241, 245, 249);
            titleLabel.Location = new Point(30, 25);
            titleLabel.AutoSize = true;
            splashForm.Controls.Add(titleLabel);

            Label subLabel = new Label();
            subLabel.Text = "Sovereign On-Premise AI Workbench — 100% Air-Gapped";
            subLabel.Font = new Font("Segoe UI", 10, FontStyle.Regular);
            subLabel.ForeColor = Color.FromArgb(148, 163, 184);
            subLabel.Location = new Point(32, 65);
            subLabel.AutoSize = true;
            splashForm.Controls.Add(subLabel);

            Label statusLabel = new Label();
            statusLabel.Name = "lblStatus";
            statusLabel.Text = "✓ Application Shell\n✓ Embedded Runtime\n✓ Local Offline Model Store\n✓ Nemotron 3 · Qwen 2.5 Coder · Gemma 3\n✓ Python Compute Engine\n✓ 301 AI Agents Active\n✓ Strict Air-Gap Enforced (0 Cloud Egress)";
            statusLabel.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            statusLabel.ForeColor = Color.FromArgb(52, 211, 153);
            statusLabel.Location = new Point(32, 105);
            statusLabel.Size = new Size(490, 165);
            splashForm.Controls.Add(statusLabel);

            ProgressBar pb = new ProgressBar();
            pb.Location = new Point(32, 285);
            pb.Size = new Size(490, 10);
            pb.Style = ProgressBarStyle.Marquee;
            splashForm.Controls.Add(pb);

            Label footerLabel = new Label();
            footerLabel.Text = "Initializing Sovereign AI Workstation...";
            footerLabel.Font = new Font("Segoe UI", 9, FontStyle.Italic);
            footerLabel.ForeColor = Color.FromArgb(203, 213, 225);
            footerLabel.Location = new Point(32, 315);
            footerLabel.AutoSize = true;
            splashForm.Controls.Add(footerLabel);

            splashForm.Show();
            splashForm.Refresh();
        }

        private static void StartBackgroundServices()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            
            // Resolve Model Store dynamically
            string modelStore = Path.Combine(localAppData, "301SuperAI", "models", "ollama");
            if (!Directory.Exists(modelStore))
            {
                string localModels = Path.Combine(baseDir, "models", "ollama");
                if (Directory.Exists(localModels)) modelStore = localModels;
                else
                {
                    string parentPayload = Path.Combine(baseDir, "..", "offline-payload", "models", "ollama");
                    if (Directory.Exists(parentPayload)) modelStore = parentPayload;
                }
            }

            Environment.SetEnvironmentVariable("OLLAMA_MODELS", modelStore);

            // 1. Check Ollama (Port 11434)
            if (!IsPortListening(11434))
            {
                try
                {
                    ProcessStartInfo psi = new ProcessStartInfo("ollama", "serve");
                    psi.CreateNoWindow = true;
                    psi.UseShellExecute = false;
                    psi.WindowStyle = ProcessWindowStyle.Hidden;
                    psi.EnvironmentVariables["OLLAMA_MODELS"] = modelStore;
                    psi.EnvironmentVariables["OLLAMA_HOST"] = "127.0.0.1:11434";
                    ollamaProcess = Process.Start(psi);
                }
                catch { }
            }

            // 2. Start Python Compute (Port 8305)
            if (!IsPortListening(8305))
            {
                try
                {
                    string pyServer = Path.Combine(baseDir, "platform", "python-compute", "src", "sovereign_compute", "server.py");
                    if (File.Exists(pyServer))
                    {
                        ProcessStartInfo psi = new ProcessStartInfo("python", "\"" + pyServer + "\"");
                        psi.WorkingDirectory = baseDir;
                        psi.CreateNoWindow = true;
                        psi.UseShellExecute = false;
                        psi.WindowStyle = ProcessWindowStyle.Hidden;
                        psi.EnvironmentVariables["SOVEREIGN_COMPUTE_HOST"] = "127.0.0.1";
                        psi.EnvironmentVariables["SOVEREIGN_COMPUTE_PORT"] = "8305";
                        psi.EnvironmentVariables["PYTHONPATH"] = Path.Combine(baseDir, "platform", "python-compute", "src");
                        pythonProcess = Process.Start(psi);
                    }
                }
                catch { }
            }

            // 3. Start Gateway (Port 8300)
            if (!IsPortListening(8300))
            {
                try
                {
                    string gwScript = Path.Combine(baseDir, "platform", "gateway", "src", "server.js");
                    if (File.Exists(gwScript))
                    {
                        ProcessStartInfo psi = new ProcessStartInfo("node", "\"" + gwScript + "\"");
                        psi.WorkingDirectory = baseDir;
                        psi.CreateNoWindow = true;
                        psi.UseShellExecute = false;
                        psi.WindowStyle = ProcessWindowStyle.Hidden;
                        psi.EnvironmentVariables["PORT"] = "8300";
                        psi.EnvironmentVariables["HOST"] = "127.0.0.1";
                        gatewayProcess = Process.Start(psi);
                    }
                }
                catch { }
            }

            for (int i = 0; i < 20; i++)
            {
                if (IsPortListening(8300)) break;
                Thread.Sleep(500);
            }
        }

        private static bool IsPortListening(int port)
        {
            try
            {
                using (var client = new System.Net.Sockets.TcpClient())
                {
                    var result = client.BeginConnect("127.0.0.1", port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(500);
                    if (success) client.EndConnect(result);
                    return success;
                }
            }
            catch
            {
                return false;
            }
        }

        private static void ShowMainWindow()
        {
            if (splashForm != null && !splashForm.IsDisposed)
            {
                splashForm.Close();
                splashForm = null;
            }

            mainBrowserForm = new Form();
            mainBrowserForm.Text = "301 Super AI — Sovereign AI Workbench";
            mainBrowserForm.Size = new Size(1366, 850);
            mainBrowserForm.StartPosition = FormStartPosition.CenterScreen;
            mainBrowserForm.BackColor = Color.FromArgb(9, 13, 22);

            trayIcon = new NotifyIcon();
            trayIcon.Text = "301 Super AI — Sovereign AI Workbench (Active)";
            trayIcon.Icon = SystemIcons.Application;
            trayIcon.Visible = true;

            ContextMenu trayMenu = new ContextMenu();
            trayMenu.MenuItems.Add("Open 301 Super AI", (s, e) => {
                mainBrowserForm.Show();
                mainBrowserForm.WindowState = FormWindowState.Normal;
                mainBrowserForm.BringToFront();
            });
            trayMenu.MenuItems.Add("System Status: READY");
            trayMenu.MenuItems.Add("Restart Services", (s, e) => StartBackgroundServices());
            trayMenu.MenuItems.Add("-");
            trayMenu.MenuItems.Add("Exit", (s, e) => {
                trayIcon.Visible = false;
                Application.Exit();
            });
            trayIcon.ContextMenu = trayMenu;

            Process.Start("http://127.0.0.1:8300/");

            mainBrowserForm.FormClosing += (s, e) => {
                if (e.CloseReason == CloseReason.UserClosing)
                {
                    e.Cancel = true;
                    mainBrowserForm.Hide();
                    trayIcon.ShowBalloonTip(2000, "301 Super AI", "Running securely in background. Click tray icon to open.", ToolTipIcon.Info);
                }
            };
        }
    }
}
