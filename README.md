# PDF Viewer

A modern, cross-platform PDF viewer built with React, Electron, and Tailwind CSS.

## Features

- 📄 View PDF documents with high quality rendering using browser's native PDF capabilities
- 🖥️ Cross-platform desktop application (Windows, macOS, Linux)
- ⚡ Fast performance with Vite build system
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔍 Standard PDF viewing with iframe implementation
- 🔄 Zoom controls, refresh, and download functionality
- 📱 Clean, intuitive user interface

## Technologies Used

- **Frontend**: React 18.3.1
- **Desktop Framework**: Electron 34.2.0
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.1
- **PDF Rendering**: Native browser PDF viewer with iframe
- **PDF Processing**: pdfjs-dist 3.11.174 (for PDF data handling)
- **Icons**: Lucide React 0.344.0

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 16 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pdf-viewer
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Development Mode

To run the application in development mode:

1. Start the Vite development server:
```bash
npm run dev
```

2. In a separate terminal, start the Electron application:
```bash
npm run electron
```

The application will open in a new window, and you can make changes to the code with hot reload enabled.

### Production Build

To build the application for production:

```bash
npm run build
```

### Other Scripts

- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview the production build locally

## Project Structure

```
pdf-viewer/
├── public/
│   └── electron.js          # Electron main process
├── src/                     # React application source
├── package.json             # Project dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # This file
```

## Development

This project uses:
- **ES Modules** (`"type": "module"` in package.json)
- **React** for the user interface
- **Electron** for desktop application capabilities
- **Vite** for fast development and building
- **Tailwind CSS** for styling

## Configuration

The Electron application is configured to load the development server at `http://localhost:3000` during development. The main Electron process file is located at `public/electron.js`.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is private and proprietary.

## Support

If you encounter any issues or have questions, please create an issue in the repository. 