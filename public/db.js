import path from 'path';
import fs from 'fs';
import { ipcMain } from 'electron';

const dbFilename = path.join(process.env.APPDATA, 'din.docs', 'db.json');
let db = null;

function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

function getById(arr, id) {
  return arr.find(o => o.id === id);
}

function init() {
  if (!fs.existsSync(dbFilename)) {
    db = { cases: [], case: [] };
    fs.mkdirSync(path.dirname(dbFilename), { recursive: true });
    fs.writeFileSync(dbFilename, JSON.stringify(db));
  } else {
    db = JSON.parse(fs.readFileSync(dbFilename));
  }
  registerHandlers();
}

function registerHandlers() {
  ipcMain.handle('newCase', async (event, caseToAdd) => {
    const id = generateKey();
    const title = caseToAdd.title;
    db.cases.push({ id, title });
    db.case.push({ id, title, path: '', files: { main: '', attachments: [] } });
    fs.writeFileSync(dbFilename, JSON.stringify(db));
    return { status: 'success', cases: db.cases, id };
  });

  ipcMain.handle('duplicateCase', async (event, duplicateData) => {
    const id = generateKey();
    const title = duplicateData.title;
    const caseToDuplicate = duplicateData.caseToDuplicate;
    
    // Find the original case to duplicate
    const originalCase = getById(db.case, caseToDuplicate);
    
    // Create new case entry in cases list
    db.cases.push({ id, title });
    
    // Create new case with copied files from original
    const newCase = {
      id,
      title,
      path: '',
      files: {
        main: originalCase?.files?.main || '',
        attachments: originalCase?.files?.attachments ? [...originalCase.files.attachments] : []
      }
    };
    
    db.case.push(newCase);
    fs.writeFileSync(dbFilename, JSON.stringify(db));
    return { status: 'success', cases: db.cases, id };
  });

  ipcMain.handle('editCase', async (event, caseToEdit) => {
    const title = caseToEdit.title;
    const lc = getById(db.cases, caseToEdit.id);
    if (lc) {
      lc.title = title;
    }
    const full = getById(db.case, caseToEdit.id);
    if (full) full.title = title;
    fs.writeFileSync(dbFilename, JSON.stringify(db));
    return { status: 'success', cases: db.cases, id: caseToEdit.id };
  });

  ipcMain.handle('deleteCase', async (event, caseId) => {
    db = {
      cases: db.cases.filter(o => o.id !== caseId),
      case: db.case.filter(o => o.id !== caseId)
    };
    fs.writeFileSync(dbFilename, JSON.stringify(db));
    return { status: 'success', cases: db.cases, id: caseId };
  });

  ipcMain.handle('loadAll', async () => {
    return { status: 'success', cases: db.cases };
  });

  ipcMain.handle('loadCase', async (event, caseId) => {
    const caseData = getById(db.case, caseId) || { title: '', path: '', files: { main: '', attachments: [] } };
    const listData = getById(db.cases, caseId) || { title: '' };

    return {
      status: 'success',
      case: {
        id: caseId,
        title: listData.title,
        path: caseData.path || '',
        files: caseData.files,
        ud: typeof caseData.ud === 'string' ? caseData.ud : undefined
      },
    };
  });

  ipcMain.handle('saveCase', async (event, caseToSave) => {
    const current = getById(db.case, caseToSave.id);
    if (current) {
      if (caseToSave.files) {
        current.files = caseToSave.files;
      }
      const lc = getById(db.cases, caseToSave.id);
      if (typeof caseToSave.title === 'string') {
        current.title = caseToSave.title;
        lc.title = caseToSave.title;
      }
      if (typeof caseToSave.ud === 'string') {
        current.ud = caseToSave.ud;
        lc.ud = caseToSave.ud;
      }
      if (typeof caseToSave.path === 'string') current.path = caseToSave.path;
    }
    fs.writeFileSync(dbFilename, JSON.stringify(db));
    return { status: 'success' };
  });
}

export default {
  init
};