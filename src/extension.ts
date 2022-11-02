/* eslint-disable @typescript-eslint/naming-convention */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { url } from 'inspector';
import * as vscode from 'vscode';
import { WebSocketServer } from 'ws';
import { request } from 'https';

function encode(data: any) {
	let string = "";
	for (const [key, value] of Object.entries(data)) {
		if (!value)
			// eslint-disable-next-line curly
			continue;
		string += `&${encodeURIComponent(key)}=${encodeURIComponent(`${value}`)}`;
	}
	return string.substring(1);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let toggled = false;
	let menu = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
	let wsServer = new WebSocketServer({ port: vscode.workspace.getConfiguration("cc-websocket-reload").get('port') });
	wsServer.close();
	if (toggled) {
		menu.text = "WebSocket Reload Enabled";
		menu.show();
	} else {
		menu.text = "WebSocket Reload Disabled";
		menu.show();
	}
	menu.command = 'cc-websocket-reload.toggle';
	context.subscriptions.push(menu);
	menu.show();
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "cc-websocket-reload" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('cc-websocket-reload.toggle', async () => {
		if (!toggled) {
			wsServer = new WebSocketServer({ port: vscode.workspace.getConfiguration("cc-websocket-reload").get('port') });
			vscode.window.showInformationMessage("WebSocket server started on port " + vscode.workspace.getConfiguration("cc-websocket-reload").get('port'));
			if ((await vscode.workspace.findFiles("**/dist/**")).length > 0) {
				let watcher = vscode.workspace.createFileSystemWatcher("**/dist/**");
				watcher.onDidChange(async (e) => {
					let file = await vscode.workspace.fs.readFile(vscode.Uri.file(e.path));
					let url = e.path.split("/")[e.path.split("/").length - 1];
					try {
					request("https://pastebin.com/api/api_post.php", {
						method: "POST",
						headers: {
							"Content-Type": "application/x-www-form-urlencoded"
						}
					}, (res) => {
						console.log("res recieved");
						res.setEncoding("utf8");
						res.on("data", (d: any) => {
							vscode.window.showInformationMessage(d);
						});
						res.on("error", (e: any) => {
							vscode.window.showErrorMessage(e);
						});
					}).end(JSON.stringify({
						api_dev_key: "3tEvadlShLxLBDoLJgyh8FL_IDPyD7Cm",
						api_option: "paste",
						api_paste_name: "Untitled",
						api_paste_code: 'print("cum")',
						api_paste_format: "lua",
						api_paste_private: 0,
						api_paste_expire_date: "N",
						api_user_key: "",
						api_folder_key: ""
					}));
				} catch (e: any) {
					vscode.window.showErrorMessage(e.toString());
				}
					vscode.window.showInformationMessage("res ended");
				});
				watcher.onDidCreate(async (e) => {
					vscode.window.showInformationMessage(e.toString());
				});
				watcher.onDidDelete(async (e) => {
					vscode.window.showInformationMessage(e.path);
				});
				vscode.window.showInformationMessage('WebSocket Reload Enabled');
			}
			else {
				vscode.window.showErrorMessage('WebSocket Reload Error: No dist folder found');
			}
		} else {
			wsServer.close();
			vscode.window.showInformationMessage("WebSocket Reload Disabled");
		}
		toggled = !toggled;
		menu.hide();
		if (toggled) {
			menu.text = "WebSocket Reload Enabled";
			menu.show();
		} else {
			menu.text = "WebSocket Reload Disabled";
			menu.show();
		}
	});
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
