//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

//	Variables __________________________________________________________________

const Selection = vscode.Selection;
const Position = vscode.Position;
const LINE_BREAKS = ['', '\n', '\r\n'];

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate () {

	vscode.commands.registerCommand('l13Duplicate.after', () => duplicate(false));
	vscode.commands.registerCommand('l13Duplicate.before', () => duplicate(true));
	
}

export function deactivate () {
	
	//
	
}

//	Functions __________________________________________________________________

/**
 * Duplicates multiple selections and/or lines and moves or keeps the position 
 * of the carets and selections.
 * @param moveSelection If true the selection or caret will move to its copy 
 * otherwise it will stay.
 */

function duplicate (moveSelection:boolean) {
	
	const activeTextEditor = vscode.window.activeTextEditor;
	
	if (!activeTextEditor) return;
	
	const document = activeTextEditor.document;
	
	activeTextEditor.edit((textEdit:vscode.TextEditorEdit) => {
	
		const selections = sortSelections(document, activeTextEditor.selections);
		const eol = LINE_BREAKS[document.eol];
		
		selections.forEach((selection:vscode.Selection) => {
			
			if (selection.isEmpty) {
				const line = selection.start.line;
				const position = new Position(line + (moveSelection ? 0 : 1), 0);
				let text = document.lineAt(line).text;
			//	If a caret is in the last line and the caret should not move, a 
			//	line break has to be added before the text or the copy will be 
			//	in the same line.
				text = !moveSelection && line + 1 === document.lineCount ? eol + text : text + eol;
				textEdit.insert(position, text);
			} else {
				const text = document.getText(selection);
				textEdit.insert(selection.start, text);
			}
			
			return selection;
			
		});
		
	}).then(() => {
		
		if (moveSelection) return;
		
		const selections = sortSelections(document, activeTextEditor.selections);
		
		activeTextEditor.selections = selections.map((selection:vscode.Selection) => {
			
			if (selection.isEmpty) {
				const line = selection.start.line ;
				if (line + 1 !== document.lineCount) return selection;
			//	If a caret is in the last line it will always move with "textEdit.insert"
			//	to the next line. This fix sets the position of the caret to the line above.
				const position = new Position(line - 1, selection.start.character);
				return new Selection(position, position);
			}
			
		//	If a text is insert with "textEdit.insert" right after a selection, 
		//	the selection will be extend with the copied text. This fixes the 
		//	behaviour and recreates the original selection.
			const text = document.getText(selection);
			const startOffset = document.offsetAt(selection.start) - text.length;
			
			return new Selection(document.positionAt(startOffset), selection.start);
			
		});
		
	});
}

/**
 * Sorts an array of selections by the start offset.
 * @param document The active document in the editor.
 * @param selections An array with selections.
 * @returns Returns a sorted array with selections by position.
 */

function sortSelections (document:vscode.TextDocument, selections:vscode.Selection[]) {
	
	return selections.sort((selectionA, selectionB) => {
		
		const offsetA = document.offsetAt(selectionA.start);
		const offsetB = document.offsetAt(selectionB.start);
		
		return -(offsetA < offsetB) || +(offsetA > offsetB) || 0;
		
	});
	
}