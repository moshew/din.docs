'use strict';
const path = require('path')
const fs = require("fs");
const {ipcMain} = require('electron')

const db_filename = path.join(process.env.APPDATA, "din.docs", "db.json")
let db = null

function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';

  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    key += chars.charAt(randomIndex);
  }
  return key;
}

function getById(arr, id) {
	return arr.find(o => o.id === id);
}

function init() {
	if (!fs.existsSync(db_filename)) {
		db = {cases:[], case:[]}
		fs.mkdir(path.dirname(db_filename), { recursive: true }, err => {})
		fs.writeFile(db_filename, JSON.stringify(db), err => {});
	}
	else db = JSON.parse(fs.readFileSync(db_filename));

	register();
}

function register() {
	
	ipcMain.handle('newCase', (event, caseToAdd) => {
		var id = generateKey();
		db.cases.push({id:id, name:caseToAdd.name})
		let files = {'main':'', 'attachments': [], 'output':''}
		db.case.push({id:id, files:files});
		fs.writeFile(db_filename, JSON.stringify(db), err => {});
		return {status:'success', cases:db.cases, id: id}
	});
	
	ipcMain.handle('editCase', (event, caseToEdit) => {
		console.log(caseToEdit)
		getById(db.cases, caseToEdit.id).name = caseToEdit.name;
		fs.writeFile(db_filename, JSON.stringify(db), err => {});
		return {status:'success', cases:db.cases, id: caseToEdit.id}
	});
	
	ipcMain.handle('deleteCase', (event, caseId) => {
		db = {cases:db.cases.filter(o => {return o.id !== caseId}),
					case:db.case.filter(o => {return o.id !== caseId})}
		fs.writeFile(db_filename, JSON.stringify(db), err => {});
		return {status:'success', cases:db.cases, id: caseId}
	});
	
	ipcMain.handle('loadAll', (event, arg) => {
    return {'status':'success', 'cases':db.cases}
	});
	
	ipcMain.handle('loadCase', (event, caseId) => {
    let name = getById(db.cases, caseId).name;
    let files = getById(db.case, caseId).files;
    return {status:'success', case: {id:caseId, name:name, files:files}}
	});

	ipcMain.handle('saveCase', (event, caseToSave) => {
		getById(db.case, caseToSave.id).files = caseToSave.files;
		fs.writeFile(db_filename, JSON.stringify(db), err => {});
	});
}

module.exports = {
  init,
};
