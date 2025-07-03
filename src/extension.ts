import * as vscode from "vscode";
import { CopilotHelper } from "./helpers/copilot-helper";
import { DocsContentProvider } from "./providers/docs-content-provider";
import { DocsSearchProvider } from "./providers/docs-search-provider";
import { DocsTreeProvider } from "./providers/docs-tree-provider";

/**
 * Main extension activation function.
 * Initializes the extension, registers providers, and sets up commands.
 */

export function activate(context: vscode.ExtensionContext) {
  // Initialize the providers
  const docsTreeProvider = new DocsTreeProvider();
  const docsContentProvider = new DocsContentProvider(context);
  const docsSearchProvider = new DocsSearchProvider();

  // Register Tree View
  const treeView = vscode.window.createTreeView("copilot-missingmanual-view", {
    treeDataProvider: docsTreeProvider,
    showCollapseAll: true,
    canSelectMany: false,
    dragAndDropController: docsTreeProvider,
  });

  // Set context when docs folder is found
  docsTreeProvider.onDocsFound(() => {
    vscode.commands.executeCommand(
      "setContext",
      "copilot-missingmanual.docsFound",
      true
    );
  });

  // Add timeout to check if docs were found after initialization
  setTimeout(() => {
    if (!docsTreeProvider.hasDocsPath()) {
      vscode.window.showWarningMessage(
        "No documentation folder found. Please set the path in settings."
      );
      vscode.commands.executeCommand(
        "setContext",
        "copilot-missingmanual.docsFound",
        false
      );
    }
  }, 5000);

  // Register commands
  const refreshCommand = vscode.commands.registerCommand(
    "copilot-missingmanual.refreshDocs",
    () => {
      docsTreeProvider.refresh();
      vscode.window.showInformationMessage("Documentation refreshed.");
    }
  );

  const openDocsCommand = vscode.commands.registerCommand(
    "copilot-missingmanual.openDocs",
    (docItem) => {
      docsContentProvider.openDocument(docItem);
    }
  );

  const searchDocsCommand = vscode.commands.registerCommand(
    "copilot-missingmanual.searchDocs",
    async () => {
      const query = await vscode.window.showInputBox({
        prompt: "Search (file names or content)",
        placeHolder: "Search documentation...",
      });

      if (!query) {
        return;
      }

      // Search file contents
      const contentResults = await docsSearchProvider.searchInFileContents(
        query
      );
      if (contentResults.length === 0) {
        vscode.window.showInformationMessage(
          `No results found for "${query}".`
        );
        return;
      }

      // Show results in a quick pick
      const quickPickResults = contentResults.map((result) => {
        const fileName = require("path").basename(result.filePath);
        return {
          label: `${fileName}:${result.line + 1}`,
          description: result.preview,
          filePath: result.filePath,
          line: result.line,
        };
      });
      const selected = await vscode.window.showQuickPick(quickPickResults, {
        placeHolder: `Search results for "${query}" (select to open)`,
        matchOnDescription: true,
      });

      if (selected) {
        const doc = await vscode.workspace.openTextDocument(selected.filePath);
        const editor = await vscode.window.showTextDocument(doc, {
          preview: false,
        });
        const pos = new vscode.Position(selected.line, 0);
        editor.revealRange(
          new vscode.Range(pos, pos),
          vscode.TextEditorRevealType.InCenter
        );
        // Highlight the line
        const lineText = doc.lineAt(selected.line).text;
        const startIdx = lineText.toLowerCase().indexOf(query.toLowerCase());
        if (startIdx !== -1) {
          const highlightStart = new vscode.Position(selected.line, startIdx);
          const highlightEnd = new vscode.Position(
            selected.line,
            startIdx + query.length
          );
          editor.selection = new vscode.Selection(highlightStart, highlightEnd);
        }
      }
    }
  );

  const insertIntoCopilotCommand = vscode.commands.registerCommand(
    "copilot-missingmanual.insertIntoCopilot",
    async (docItem) => {
      if (docItem && docItem.filePath && docItem.isMarkdown) {
        await CopilotHelper.addDocumentToCopilot(docItem.filePath);
      }
    }
  );

  // Register the file system watcher for docs changes
  const docsWatcher =
    vscode.workspace.createFileSystemWatcher("**/docs/**/*.md");

  docsWatcher.onDidChange((uri) => {
    // Handle file changes
    docsTreeProvider.refresh();
  });

  docsWatcher.onDidCreate((uri) => {
    // Handle new files
    docsTreeProvider.refresh();
  });

  docsWatcher.onDidDelete((uri) => {
    // Handle file deletions
    docsTreeProvider.refresh();
  });
}

/**
 * Extension deactivation function.
 * Called when VS Code is closed or the extension is deactivated.
 */

export function deactivate() {
  console.log("copilot-missingmanual.extension deactivated.");
}
