import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { ipcMain, dialog } from 'electron';

import db from './db.js';
import pdf from './pdf.js';

export function register(mainWindow) {
  db.init();
	
  ipcMain.handle('fileDialog', async (event, args) => {
    let result = null;
    const opType = args.type;
    
    if (opType === "main") {
      const options = {
        title: "File to open",
        buttonLabel: 'Select',
        filters: [{ name: 'din.docs', extensions: ['pdf', 'docx'] }],
        properties: ['openFile']
      };
      if ("defaultPath" in args) options.defaultPath = args.defaultPath;
      result = dialog.showOpenDialogSync(mainWindow, options);
    } else if (opType === "attachments") {
      result = dialog.showOpenDialogSync(mainWindow, {
        title: "File to open",
        buttonLabel: 'Select',
        filters: [{ name: 'din.docs', extensions: ['pdf', 'docx'] }],
        properties: ['openFile', 'multiSelections']
      });
      if (result) {
        result.forEach(filePath => {
          if (fs.statSync(filePath).size === 0) throw new Error("Error in files size");
        });
      }
    } else if (opType === "output") {
      const options = {
        title: "File to save",
        buttonLabel: 'Save',
        filters: [{ name: 'din.docs', extensions: ['pdf'] }]
      };
      if ("defaultPath" in args) options.defaultPath = args.defaultPath;
      result = dialog.showSaveDialogSync(mainWindow, options);
    }
    
    return result;
  });

  ipcMain.handle('checkCase', async (event, args) => {
    let missingPath = null;
    let firstMissingPath = true;
    let doc = args.case;
    let reCheck = args.reCheck;
    let newPath = reCheck && reCheck.applyForAll ? path.dirname(reCheck.fixedPath) : null;

    if (doc.files && doc.files.main && !fs.existsSync(doc.files.main)) {
      missingPath = reCheck ? (doc.files.main = reCheck.fixedPath) : doc.files.main;
      firstMissingPath = false;
    }

    if (!missingPath && doc.files && Array.isArray(doc.files.attachments)) {
      for (let attachment of doc.files.attachments) {
        let attachmentPath = attachment.path;
        if (!fs.existsSync(attachmentPath)) {
          if (!reCheck) {
            missingPath = attachmentPath;
            break;
          } else {
            if (firstMissingPath) {
              attachment.path = reCheck.fixedPath;
              firstMissingPath = false;
            } else if (reCheck.applyForAll) {
              attachmentPath = path.join(newPath, path.basename(attachment.path));
              if (!fs.existsSync(attachmentPath)) {
                missingPath = attachment.path;
                break;
              } else {
                attachment.path = attachmentPath;
              }
            } else {
              missingPath = attachment.path;
              break;
            }
          }
        }
      }
    }
    
    return { case: doc, missingPath };
  });

	ipcMain.handle('getPdf', async (event, filePath) => {
    try {
        if (!filePath) {
            return { result: 'error', msg: 'File path is missing' };
        }

        const extension = path.extname(filePath).toLowerCase();

        if (extension === '.pdf') {
            if (!fs.existsSync(filePath)) {
                return { result: 'notExists' };
            }
            try {
                const fileContent = fs.readFileSync(filePath);
                return fileContent;
            } catch (readError) {
                return { result: 'error', msg: 'Error reading PDF file' };
            }
        }

        if (!fs.existsSync(filePath)) {
            return { result: 'notExists' };
        }

        exec(`start "" "${filePath}"`, (err) => {
            if (err) {
                return { result: 'error', msg: 'Error opening file' };
            }
        });

        return { result: 'docx' };
    } catch (error) {
        return { result: 'error', msg: error.message };
    }
});

  ipcMain.handle('generatePdf', async (event, files) => {
    pdf.generate(mainWindow, files);
		return { status: 'success' }
  });

  // Window controls
  ipcMain.handle('window:minimize', () => {
    if (!mainWindow) return { status: 'error' };
    mainWindow.minimize();
    return { status: 'success' };
  });

  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return { status: 'error' };
    if (!mainWindow.isMaximized()) {
      mainWindow.maximize();
    }
    return { status: 'success' };
  });

  ipcMain.handle('window:close', () => {
    if (!mainWindow) return { status: 'error' };
    mainWindow.close();
    return { status: 'success' };
  });
}
