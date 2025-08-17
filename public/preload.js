const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
    /**
     * Register listener for PDF generation status updates.
     * Returns a cleanup function to remove the listener.
     * @param {Function} listener - Callback to handle incoming status updates.
     * @returns {Function} Cleanup function.
     */
    getProcStatus: (listener) => {
        const handler = (event, ...args) => listener(...args);
        ipcRenderer.on("pdfGenStatus", handler);
        return () => ipcRenderer.removeListener("pdfGenStatus", handler);
    },

    /**
     * Register listener for PDF generation finished event.
     * Returns a cleanup function to remove the listener.
     * @param {Function} listener - Callback to handle completion event.
     * @returns {Function} Cleanup function.
     */
    procFinished: (listener) => {
        const handler = (event, ...args) => listener(...args);
        ipcRenderer.on("pdfGenFinished", handler);
        return () => ipcRenderer.removeListener("pdfGenFinished", handler);
    },

    /**
     * General invoke method to communicate with the main process.
     * @param {string} op - The name of the IPC channel.
     * @param {any} args - Arguments to send to the main process.
     * @returns {Promise<any>} - Result returned from the main process.
     */
    invoke: (op, args) => {
        return ipcRenderer.invoke(op, args);
    },

    /**
     * Enable drag & drop support for files.
     * Registers event listeners for 'drop' and 'dragover' events at the window level.
     * Provides a callback that receives the list of dropped files (with path and name).
     * Returns a cleanup function to remove these listeners if needed.
     * @param {Function} callback - Function to handle dropped files.
     * @returns {Function} Cleanup function to unregister the listeners.
     */
    onFileDrop: (callback) => {
			const handler = (e) => {
				e.preventDefault();
				e.stopPropagation();
				const files = Array.from(event.dataTransfer.files).map(file => ({
					path: webUtils.getPathForFile(file),
					name: file.name
				}));
				callback(files);
				
			};
			window.addEventListener('drop', handler);

			// Return cleanup to remove listener
			return () => {
					window.removeEventListener('drop', handler);
			};
    }
});