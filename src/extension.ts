import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface ImageEdit {
    oldPath: string;
    newPath: string;
}

let undoStack: ImageEdit[] = [];

function isImagePath(text: string): boolean {
    return /<img src=/.test(text);
}

function extractImagePath(text: string): string | null {
    const matches = /src="([^"]+)"/.exec(text);
    return matches ? matches[1] : null;
}

function ensureFileExtension(originalPath: string, newPath: string): string {
    const originalExtension = path.extname(originalPath);
    if (originalExtension && !path.extname(newPath)) {
        return `${newPath}${originalExtension}`;
    }
    return newPath;
}

function getRelativePathForEditor(document: vscode.TextDocument, newPath: string): string {
    return vscode.workspace.asRelativePath(newPath, false);
}

function copyFileAsync(src: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.copyFile(src, dest, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function deleteFileAsync(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function convertImgSrcToRelative() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showErrorMessage('No active HTML editor detected.');
        return;
    }

    const document = activeEditor.document;
    const text = document.getText();
    const imgTagRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/g;
    let match;
    let edit = new vscode.WorkspaceEdit();

    while ((match = imgTagRegex.exec(text))) {
        const imgSrc = match[1];
        const imgTagIndex = match.index;

        // Skip if the match index is not a number
        if (typeof imgTagIndex !== 'number') {
            continue;
        }

        // Make path relative if it's not already relative to the current document
        if (path.isAbsolute(imgSrc) || !imgSrc.startsWith('.')) {
            // Determine the directory of the current document
            const documentDir = path.dirname(document.uri.fsPath);

            // Create a relative path from the document to the image source
            let relativeImgPath = path.relative(documentDir, path.join(documentDir, imgSrc)).split(path.sep).join('/');

            // Ensure the relative path starts with './'
            if (!relativeImgPath.startsWith('.')) {
                relativeImgPath = './' + relativeImgPath;
            }

            const newImgTag = match[0].replace(`"${imgSrc}"`, `"${relativeImgPath}"`);
            const imgTagRange = new vscode.Range(
                document.positionAt(imgTagIndex),
                document.positionAt(imgTagIndex + match[0].length)
            );

            edit.replace(document.uri, imgTagRange, newImgTag);
        }
    }

    if (edit.size === 0) {
        vscode.window.showInformationMessage('All image paths are already relative to the current document.');
        return;
    }

    const success = await vscode.workspace.applyEdit(edit);
    if (success) {
        vscode.window.showInformationMessage('All image paths have been converted to relative paths.');
    } else {
        vscode.window.showErrorMessage('Failed to convert image paths.');
    }
}


export function activate(context: vscode.ExtensionContext) {
    let editImageDisposable = vscode.commands.registerCommand('extension.editImagePath', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage('No active text editor detected.');
            return;
        }

        let selection = activeEditor.selection;
        let selectedText = activeEditor.document.getText(selection);

        if (isImagePath(selectedText)) {
            const imagePath = extractImagePath(selectedText);
            const defaultValue = imagePath ? imagePath : '';
            const newFileName = await vscode.window.showInputBox({
                prompt: "Enter the new image name",
                value: defaultValue
            });

            if (!newFileName) {
                vscode.window.showWarningMessage('Image rename cancelled.');
                return;
            }

            if (!imagePath) {
                vscode.window.showErrorMessage('Could not extract image path from the selected text.');
                return;
            }

            const currentDir = path.dirname(activeEditor.document.fileName);
            const currentFilePath = path.join(currentDir, imagePath);
            let newFilePath = path.join(currentDir, newFileName);
            newFilePath = ensureFileExtension(currentFilePath, newFilePath);

            try {
                if (!fs.existsSync(currentFilePath)) {
                    throw new Error(`The image file ${currentFilePath} does not exist.`);
                }

                const newFileDir = path.dirname(newFilePath);
                if (!fs.existsSync(newFileDir)) {
                    const answer = await vscode.window.showInformationMessage(
                        `The directory ${newFileDir} does not exist. Do you want to create it?`,
                        'Yes',
                        'No'
                    );
                    if (answer === 'Yes') {
                        fs.mkdirSync(newFileDir, { recursive: true });
                    } else {
                        vscode.window.showWarningMessage('Operation cancelled.');
                        return;
                    }
                }

                undoStack.push({ oldPath: imagePath, newPath: getRelativePathForEditor(activeEditor.document, newFilePath) });

                await copyFileAsync(currentFilePath, newFilePath);
                await deleteFileAsync(currentFilePath);

                activeEditor.edit(editBuilder => {
                    const relativeNewFilePath = getRelativePathForEditor(activeEditor.document, newFilePath);
                    let newText = selectedText.replace(imagePath, relativeNewFilePath);
                    editBuilder.replace(selection, newText);
                }).then(() => {
                    vscode.window.showInformationMessage(`Image path changed to: ${getRelativePathForEditor(activeEditor.document, newFilePath)}`);
                });

            } catch (error: unknown) {
                vscode.window.showErrorMessage(`Error editing image path: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        } else {
            vscode.window.showErrorMessage('No image path detected in the selected text.');
        }
    });

    let undoDisposable = vscode.commands.registerCommand('extension.undoImagePath', async () => {
        if (undoStack.length === 0) {
            vscode.window.showWarningMessage('No image path edits to undo.');
            return;
        }

        const { oldPath, newPath } = undoStack.pop()!;
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && oldPath && newPath) {

            const currentDir = path.dirname(activeEditor.document.fileName);
            const oldFilePath = path.join(currentDir, oldPath);
            const newFilePath = path.join(currentDir, newPath);

            try {
                await copyFileAsync(newFilePath, oldFilePath);
                await deleteFileAsync(newFilePath);

                activeEditor.edit(editBuilder => {
                    let text = activeEditor.document.getText();
                    let newText = text.replace(newPath, oldPath);
                    const fullRange = new vscode.Range(
                        activeEditor.document.positionAt(0),
                        activeEditor.document.positionAt(text.length)
                    );
                    editBuilder.replace(fullRange, newText);
                }).then(() => {
                    vscode.window.showInformationMessage(`Undid image path change: ${oldPath}`);
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    });

    let convertImgSrcDisposable = vscode.commands.registerCommand('extension.convertImgSrcToRelative', convertImgSrcToRelative);

    context.subscriptions.push(editImageDisposable, undoDisposable, convertImgSrcDisposable);
}

export function deactivate() {}