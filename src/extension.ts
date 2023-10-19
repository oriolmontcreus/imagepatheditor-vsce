import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.editImagePath', async () => {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        let selection = editor.selection;
        let selectedText = editor.document.getText(selection);

        // Check if selected text contains an image tag
        if (selectedText.includes('<img src=')) {
            const newFileName = await vscode.window.showInputBox({ prompt: "Enter the new image name" });
            if (!newFileName) {
                return; // User cancelled
            }

            const matches = /src="([^"]+)"/.exec(selectedText);

            if (!matches) {
                return; // Could not extract src attribute
            }

            const imagePath = matches[1];

            const currentDir = path.dirname(editor.document.fileName);
            const currentFilePath = path.join(currentDir, imagePath);
            const newFilePath = path.join(currentDir, newFileName);

            if (!fs.existsSync(currentFilePath)) {
                vscode.window.showErrorMessage(`The image file ${currentFilePath} does not exist.`);
                return;
            }

            fs.copyFile(currentFilePath, newFilePath, async (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Error copying file: ${err.message}`);
                    return;
                }

                fs.unlink(currentFilePath, (err) => {
                    if (err) {
                        vscode.window.showErrorMessage(`Error deleting old file: ${err.message}`);
                        return;
                    }

                    editor?.edit(editBuilder => {
                        // Replace the src attribute with the new file name
                        let newText = selectedText.replace(imagePath, newFileName);
                        editBuilder.replace(selection, newText);
                    });

                    vscode.window.showInformationMessage(`Image path changed to: ${newFileName}`);
                });
            });
        }
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
    // Clean up resources on deactivation
}