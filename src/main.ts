const path = require("path");
import { IpcMainEvent } from 'electron';
import { readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';

const rootPath = process.cwd();
require("electron-reload")(rootPath, {
  electron: path.join(rootPath, "node_modules", ".bin", "electron"),
  awaitWriteFinish: true,
  ignored: /node_modules|[\/\\]\./,
  extensions: ["ts", "js"],
});

const { ipcMain } = require('electron');
const { app, BrowserWindow } = require("electron");

function createWindow() {
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreenable: true,
    resizable: true, // 设置为 true 以允许窗口调整大小
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true // This line enables the devtools
    },
  });

  win.loadFile(path.join(rootPath, 'index.html'));
  win.webContents.openDevTools(); // This line opens the devtools
  ipcMain.on('get-env-vars', (event: IpcMainEvent) => {
    const envVars = (JSON.stringify(process.env));
    event.returnValue = envVars;
  });
  ipcMain.on('get-homedir', (event) => {
    event.reply('homedir', homedir());
  });
  ipcMain.on('get-file-content', (event: IpcMainEvent, filePath: string) => {
    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      event.reply('file-content', filePath, fileContent);
    } catch (err) {
      console.error(`Failed to read ${filePath}: ${err}`);
      event.reply('file-content', filePath, `Failed to read ${filePath}: ${err}`);
    }
  });
  ipcMain.on('save-file-content', (event: IpcMainEvent, filePath: string, fileContent: string) => {
    try {
      console.log(filePath, fileContent);
      writeFileSync(filePath, fileContent, 'utf-8');
      event.reply('file-saved', filePath);
    } catch (error) {
      console.error(`Failed to save file at ${filePath}`, error);
    }
  });
}

app.on("ready", createWindow);