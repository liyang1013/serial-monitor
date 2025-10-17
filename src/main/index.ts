import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { SerialPort } from 'serialport';
import { SerialPortInfo } from './types'
const WebSocket = require('ws');

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 1250,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const serialConnections = new Map();
let wss = null;
const wsClients = new Set();

// 启动 WebSocket 服务器
function startWebSocketServer() {
  wss = new WebSocket.Server({ port: 8080 });

  wss.on('connection', (ws) => {
    console.log('新的 WebSocket 客户端连接');
    wsClients.add(ws);

    ws.on('close', () => {
      console.log('WebSocket 客户端断开连接');
      wsClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket 错误:', error);
      wsClients.delete(ws);
    });
  });

  console.log('WebSocket 服务器已启动，端口 8080');
}

function broadcastToClients(data) {
  const message = JSON.stringify(data);
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  //得到串口列表
  ipcMain.handle('getAvailableSerialPort', async () => {
    try {
      const ports: Array<SerialPortInfo> = await SerialPort.list()
      return ports.map((item: SerialPortInfo) => {
        return { path: item.path, name: `${item.path} ${item.manufacturer}` }
      })
    } catch (error) {
      console.error('获取串口列表失败:', error)
    }
  })

  //释放串口
  ipcMain.handle('disconnectPort', async (event, portPath) => {
    try {
      const port = serialConnections.get(portPath)
      return new Promise((resolve) => {
        port.close((err) => {
          if (err) {
            console.error(`关闭串口 ${portPath} 失败:`, err)
            resolve({ success: false, message: err.message })
          } else {
            console.log(`串口 ${portPath} 已关闭`)
            resolve({ success: true, message: '串口已关闭' })
          }
        })
      })
    } catch (error) {
      console.error(`断开串口 ${portPath} 失败:`, error)
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('connectPort', async (event, path) => {
    try {
      return new Promise((resolve, reject) => {
        const port = new SerialPort({
          path,
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          autoOpen: false
        });

        port.open((err) => {
          if (err) {
            console.error(`打开串口 ${path} 失败:`, err)
            reject({ success: false, message: err.message })
          }

          port.on('data', (data) => {
            const timestamp = new Date().toISOString();
            const serialData = {
              port: path,
              data: data.toString('ascii'),
              timestamp
            };
            event.sender.send('serial-data', serialData);
            // 广播到 WebSocket 客户端
            broadcastToClients({
              type: 'data',
              data: serialData
            });
          });

          // 监听错误
          port.on('error', (err) => {
            console.error(`串口 ${path} 错误:`, err);
            event.sender.send('serial-error', { port: path, error: err.message });
          });

          // 监听关闭
          port.on('close', () => {
            console.log(`串口 ${path} 已关闭`);
            serialConnections.delete(path);

            // 通知 WebSocket 客户端
            // broadcastToClients({
            //   type: 'port-closed',
            //   data: { port: path }
            // });
          });
        });
        serialConnections.set(path, port);
        resolve({ success: true, message: '串口连接成功' });
      })

    } catch (error) {
      // console.error(`连接串口 ${path} 失败:`, error);
      return { success: false, message: error.message };
    }
  });

  startWebSocketServer();
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


app.on('window-all-closed', () => {
  serialConnections.forEach((connection, path) => {
    connection.port.close();
  });
  if (wss) {
    wss.close();
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

