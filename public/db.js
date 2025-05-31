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
    db.cases.push({ id, name: caseToAdd.name });
    db.case.push({ id, files: { main: '', attachments: [], output: '' } });
    fs.writeFileSync(dbFilename, JSON.stringify(db));
    return { status: 'success', cases: db.cases, id };
  });

  ipcMain.handle('editCase', async (event, caseToEdit) => {
    getById(db.cases, caseToEdit.id).name = caseToEdit.name;
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
    const caseData = getById(db.case, caseId);
    return { status: 'success', case: { id: caseId, name: getById(db.cases, caseId).name, files: caseData.files } };
  });

  ipcMain.handle('saveCase', async (event, caseToSave) => {
		console.log('saveCase')
    getById(db.case, caseToSave.id).files = caseToSave.files;
    fs.writeFileSync(dbFilename, JSON.stringify(db));
		console.log('saveCase', JSON.stringify(caseToSave))
		return { status: 'success' }
  });
}

export default {
  init
};