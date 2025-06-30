const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let serverProcess;

function createWindow() {
  // إنشاء النافذة الرئيسية
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // إضافة أيقونة التطبيق
    title: 'نظام إدارة المستشفى',
    show: false, // لا تظهر النافذة حتى تكون جاهزة
    titleBarStyle: 'default'
  });

  // إعداد القائمة
  createMenu();

  // تحميل التطبيق
  if (isDev) {
    // في وضع التطوير، نحمل من الخادم المحلي
    mainWindow.loadURL('http://localhost:5000');
    // فتح أدوات المطور في وضع التطوير
    mainWindow.webContents.openDevTools();
  } else {
    // في وضع الإنتاج، نحمل الملفات المحلية
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'public', 'index.html'));
  }

  // إظهار النافذة عند انتهاء التحميل
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // تركيز النافذة
    if (isDev) {
      mainWindow.focus();
    }
  });

  // التعامل مع إغلاق النافذة
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // منع التنقل لمواقع خارجية
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:5000' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });

  // فتح الروابط الخارجية في المتصفح الافتراضي
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createMenu() {
  const template = [
    {
      label: 'ملف',
      submenu: [
        {
          label: 'إعادة تحميل',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          }
        },
        {
          label: 'فرض إعادة التحميل',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.reloadIgnoringCache();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'إغلاق',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'عرض',
      submenu: [
        {
          label: 'تكبير',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            if (mainWindow) {
              const currentZoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
            }
          }
        },
        {
          label: 'تصغير',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            if (mainWindow) {
              const currentZoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
            }
          }
        },
        {
          label: 'الحجم الطبيعي',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.setZoomLevel(0);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'ملء الشاشة',
          accelerator: 'F11',
          click: () => {
            if (mainWindow) {
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          }
        }
      ]
    },
    {
      label: 'نافذة',
      submenu: [
        {
          label: 'تصغير',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            if (mainWindow) {
              mainWindow.minimize();
            }
          }
        },
        {
          label: 'إغلاق',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            if (mainWindow) {
              mainWindow.close();
            }
          }
        }
      ]
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'حول التطبيق',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'حول التطبيق',
              message: 'نظام إدارة المستشفى',
              detail: 'نظام شامل لإدارة المستشفيات والعيادات\nالإصدار: 1.0.0'
            });
          }
        }
      ]
    }
  ];

  // إعداد خاص بنظام macOS
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: 'حول ' + app.getName(),
          role: 'about'
        },
        { type: 'separator' },
        {
          label: 'إخفاء ' + app.getName(),
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'إخفاء الآخرين',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'إظهار الكل',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'إنهاء',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function startServer() {
  return new Promise((resolve, reject) => {
    // بدء الخادم
    serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let serverStarted = false;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Server:', output);
      
      if (output.includes('serving on port') && !serverStarted) {
        serverStarted = true;
        setTimeout(resolve, 2000); // انتظار ثانيتين للتأكد من بدء الخادم
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server Error:', data.toString());
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    // مهلة زمنية للخادم
    setTimeout(() => {
      if (!serverStarted) {
        reject(new Error('Server failed to start within timeout'));
      }
    }, 30000);
  });
}

// عند استعداد التطبيق
app.whenReady().then(async () => {
  if (isDev) {
    try {
      // بدء الخادم في وضع التطوير
      await startServer();
    } catch (error) {
      console.error('Failed to start server:', error);
      dialog.showErrorBox('خطأ في بدء الخادم', 'فشل في بدء خادم التطبيق. يرجى المحاولة مرة أخرى.');
      app.quit();
      return;
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// إنهاء التطبيق عند إغلاق جميع النوافذ
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// تنظيف العمليات عند إنهاء التطبيق
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

// منع إنشاء عدة نسخ من التطبيق
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // إذا حاول المستخدم فتح نسخة أخرى، ركز على النافذة الموجودة
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}