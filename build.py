import os
import re
import shutil
import json

# Define source and backup directories
source_dir = "src"
backup_dir = "src.bak"
output_dir = "src"
package_json_path = "package.json"

# Rename the original source directory to backup
if os.path.exists(source_dir):
    shutil.move(source_dir, backup_dir)

# Directories and files to exclude from creation
excluded_paths = [
    os.path.join(output_dir, "bridge"),
    os.path.join(output_dir, "utils", "electron.jsx")
]

# Function to modify .jsx files
def modify_jsx_content(content):
    replacements = {
        r"^.*import \{ .*? \} from './utils/electron';.*\n": "",
        r"^.*import \{ .*? \} from '../utils/electron';.*\n": "",
        r"^.*import \{ .*? \} from '../../utils/electron';.*\n": "",
        r"\bloadAll\(\);": "window.ipcRenderer.invoke(\"loadAll\", null);",
        r"\bloadCase\(": "window.ipcRenderer.invoke(\"loadCase\", ",
        r"\bsaveCase\(": "window.ipcRenderer.invoke(\"saveCase\", ",
        r"\bfileDialog\(": "window.ipcRenderer.invoke(\"fileDialog\", ",
        r"\bnewCase\(": "window.ipcRenderer.invoke(\"newCase\", ",
        r"\bdeleteCase\(": "window.ipcRenderer.invoke(\"deleteCase\", ",
        r"\bcheckCase\(": "window.ipcRenderer.invoke(\"checkCase\", ",
        r"\bgetPdf\(": "window.ipcRenderer.invoke(\"getPdf\", ",
        r"\bgeneratePdf\(": "window.ipcRenderer.invoke(\"generatePdf\", ",
        r"\bonPdfGenStatus": "window.ipcRenderer.getProcStatus",
        r"\bonPdfGenFinished": "window.ipcRenderer.procFinished",
        r"\bonFilesDrop": "window.ipcRenderer.onFileDrop",

        
    }
    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    return content if content.strip() else "// File was modified but is now empty. Please check the regex patterns."

# Function to process files
def process_files(src_root, dest_root):
    for root, dirs, files in os.walk(src_root):
        relative_path = os.path.relpath(root, src_root)
        dest_path = os.path.join(dest_root, relative_path)

        # Skip excluded directories
        if any(dest_path.startswith(excluded) for excluded in excluded_paths):
            continue

        os.makedirs(dest_path, exist_ok=True)

        for file in files:
            src_file = os.path.join(root, file)
            dest_file = os.path.join(dest_path, file)
            
            # Skip excluded files
            if dest_file in excluded_paths:
                continue
            
            if file.endswith(".jsx"):
                with open(src_file, "r", encoding="utf-8") as f:
                    content = f.read()
                modified_content = modify_jsx_content(content)
                if modified_content.strip():  # Ensure empty content is not written
                    with open(dest_file, "w", encoding="utf-8") as f:
                        f.write(modified_content)
                else:
                    print(f"Warning: {file} was modified but is now empty.")
            else:
                shutil.copy2(src_file, dest_file)

# Function to modify package.json
def modify_package_json(file_path):
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                package_data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"Error parsing package.json: {e}")
            return
        
        if "scripts" not in package_data:
            package_data["scripts"] = {}
        
        if "electron" not in package_data["scripts"]:
            package_data["scripts"]["electron"] = "set ELECTRON_START_URL=http://localhost:3000 && electron ."
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(package_data, f, indent=2)
            print("Updated package.json with electron script.")
        else:
            print("Electron script already exists in package.json.")
    else:
        print("package.json not found.")

# Process files from backup to new src
process_files(backup_dir, output_dir)

# Modify package.json
modify_package_json(package_json_path)

print("Processing complete. Modified files are in 'src'")
