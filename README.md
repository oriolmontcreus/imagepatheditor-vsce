# 🖼️ Image Path Editor Extension

Elevate your coding efficiency in Visual Studio Code with **Image Path Editor**! This extension simplifies the editing of image paths directly within your HTML files, making your development process smoother and more productive.

## ✨ Features

- **Streamlined Editing:** Instantly adjust image paths in your HTML files without breaking your coding flow.
- **Smart Renaming:** Rename image assets effortlessly—the extension updates the paths automatically.
- **Undo Path Changes:** Undo path changes with the shortcut `Ctrl+Shift+Z`

## 🚀 Usage

1. Open your desired HTML file in Visual Studio Code.
2. Highlight the text that contains the image tag (e.g., `<img src="path/to/image.jpg" alt="description">`).
3. Right-click to access the context menu and select the `Edit Image Path` command.
4. Promptly input the new image name.
5. Voilà! The extension takes care of renaming the image file and correspondingly updates the path in your editor and file system.

## 🔧 Installation

Follow these steps to integrate **Image Path Editor** into your VS Code:

1. Initiate Visual Studio Code.
2. Access the Extensions view by using the shortcut `Ctrl+Shift+X`.
3. Input "Image Path Editor" in the search bar.
4. Hit **Install** and watch the extension become part of your VS Code.

## ⌨️ Commands

- `Edit Image Path`: Initiates the path editing process.

## 🔒 Requirements

- Ensure you're running Visual Studio Code version 1.83.0 or later.

## ⚙️ Extension Settings

Currently, this extension operates without any need for additional configuration settings.

## 🐞 Known Issues

At this moment, there are no identified issues affecting the extension.

## 📣 Release Notes

### 1️⃣ Version 0.0.1

Celebrating the initial release of Image Path Editor!

### 🔢 Version 0.0.2 & 0.0.3 ###

Minor changes to extension overview, description, and GitHub Repository.

### 4️⃣ Version 0.0.4 (MAJOR UPDATE) ###

[+] **Smart Format Completion**

 If you forget to specify a file extension (e.g., .png), don't worry! Our extension now cleverly adopts the format of the last used image.

[+] **Enhanced Context Menu**

Pre-filled 'default/before' option for the image src attribute right in the context menu, so you can say goodbye to staring at a blank input box.

[+] **Robust Error Handling**

Optimized code and more error handling.

[+] **Directory Path Support** 

 Want to save an image in a non-existent directory? No problem. Enter any path, and if the directory is missing, we'll prompt you with the option to create it on the fly.

[+] **Quick Access Shortcut**

Now you can use the shortcut `Shift + F2` to activate the extension's main functionality "Edit Image Path"

[+] **Undo Functionality**

Made a mistake? Take a step back with our new undo feature, giving you the safety net you need to edit paths confidently. Also you can use the shortcut `Ctrl+Shift+Z`


**Enjoy coding!** Encountered a glitch or have ideas to enhance the extension? We encourage you to [report them](https://github.com/oriolmontcreus/imagepatheditor-vsce/issues) on our issues page.