/* eslint-disable @typescript-eslint/naming-convention */
import { url } from 'inspector';
import * as vscode from 'vscode';
import { WebSocketServer } from 'ws';
import { request } from 'https';

export function activate(context: vscode.ExtensionContext) {
	let toggled = false;
	let menu = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
	let connectionCount = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
	connectionCount.text = `Connections: 0`;;
	connectionCount.show();
	let wsServer: WebSocketServer | undefined;
	if(toggled){
	try {
		wsServer = new WebSocketServer({ port: vscode.workspace.getConfiguration("cc-websocket-reload").get('port') });
	} catch (e) {
		vscode.window.showErrorMessage("Failed to start websocket server" + " " + e);
	}
}
	if (wsServer) {
		wsServer.on('connection', (ws) => {
			vscode.window.showInformationMessage("Computer connected to websocket");
			connectionCount.text = `Connections: ${wsServer!.clients.size}`;
			connectionCount.show();
			ws.on("close", () => {
				vscode.window.showInformationMessage("Computer disconnected from websocket");
				connectionCount.text = `Connections: ${wsServer!.clients.size}`;
				connectionCount.show();
			});
		});
	}
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

	console.log('Congratulations, your extension "cc-websocket-reload" is now active!');

	let disposable = vscode.commands.registerCommand('cc-websocket-reload.toggle', async () => {
		if (!toggled && wsServer) {
			vscode.window.showInformationMessage("WebSocket server started on port " + vscode.workspace.getConfiguration("cc-websocket-reload").get('port'));
			if ((await vscode.workspace.findFiles("**/dist/**")).length > 0) {
				let watcher = vscode.workspace.createFileSystemWatcher("**/dist/**");
				watcher.onDidChange(async (e) => {
					let file = await vscode.workspace.fs.readFile(vscode.Uri.file(e.path));
					let url = e.path.split("/")[e.path.split("/").length - 1];
					wsServer!.clients.forEach((client) => {
						client.send(JSON.stringify({ url: url, data: file.toString(), type: "change" }));
					});
					vscode.window.showInformationMessage("File changed: " + url);
				});
				watcher.onDidCreate(async (e) => {
					let file = await vscode.workspace.fs.readFile(vscode.Uri.file(e.path));
					let url = e.path.split("/")[e.path.split("/").length - 1];
					wsServer!.clients.forEach((client) => {
						client.send(JSON.stringify({ url: url, data: file.toString(), type: "create" }));
					});
					vscode.window.showInformationMessage("File created: " + url);
				});
				watcher.onDidDelete(async (e) => {
					let file = await vscode.workspace.fs.readFile(vscode.Uri.file(e.path));
					let url = e.path.split("/")[e.path.split("/").length - 1];
					wsServer!.clients.forEach((client) => {
						client.send(JSON.stringify({ url: url, type: "delete" }));
					});
					vscode.window.showInformationMessage("File deleted");
				});
				vscode.window.showInformationMessage('WebSocket Reload Enabled');
			}
			else {
				vscode.window.showErrorMessage('WebSocket Reload Error: No dist folder found');
			}
		} else {
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
