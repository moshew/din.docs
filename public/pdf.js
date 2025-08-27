import path from 'path';
import isDev from 'electron-is-dev';
import net from 'net';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//const executablePath = path.join(__dirname, isDev ? '' : '../', '../srv/PdfGen.exe');
const executablePath = path.join(__dirname, isDev ? '' : '../', '../PdfGen/PdfGen.py');
const PIPE_PATH = "\\\\.\\pipe\\pdfpipe";

function generate(mainWindow, files) {
	files = typeof files === 'string' ? files : JSON.stringify(files)
  //const app = spawn(executablePath, [files]);
  const app = spawn('python', [executablePath, files]);
  app.stdout.on('data', data => {
    mainWindow.webContents.send("pdfGenFinished", {detail: JSON.parse(data.toString())});
  });

  const server = net.createServer(function (stream) {
    stream.on('data', function (data) {
      mainWindow.webContents.send("pdfGenStatus", {detail: JSON.parse(data.toString())});
    });

    stream.on('end', function () {
      server.close();
    });
  });

  server.listen(PIPE_PATH);
}

export default {
  generate
};

