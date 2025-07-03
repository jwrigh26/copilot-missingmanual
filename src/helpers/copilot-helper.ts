import * as vscode from "vscode";
import * as path from "path";

/**
 * Shared helper function fo adding documentation to Copilot chat.
 */

export class CopilotHelper {
  /**
   * Add documentation file to Copilot chat as attachment with reference message.
   */
  static async addDocumentToCopilot(filePath: string): Promise<void> {
    const fileName = path.basename(filePath, ".md");

    // Create a simple reference message
    const referenceMessage = `\nDocumentation file: ${fileName}\n\n`;
    try {
      // Focus Copilot chat first
      await vscode.commands.executeCommand(
        "workbench.panel.chat.view.copilot.focus"
      );

      // Try to attach file using different possible commands
      const fileUri = vscode.Uri.file(filePath);
      await vscode.commands.executeCommand(
        "workbench.action.chat.attachFile",
        fileUri
      );

      // Wait a moment to ensure the file is attached
      await new Promise((resolve) => setTimeout(resolve, 500));
      await vscode.env.clipboard.writeText(referenceMessage);
      await vscode.commands.executeCommand(
        "editor.action.clipboardPasteAction"
      );
    } catch (error) {
      console.error("Failed to add documentation to Copilot:", error);
      vscode.window.showErrorMessage(
        "Failed to add documentation file to Copilot."
      );
    }
  }
}
