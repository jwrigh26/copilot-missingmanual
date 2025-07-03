import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { DocsItem } from "../providers/docs-tree-provider";

/**
 * Documentation search provider
 * Enables quick search across all documentations files in the workspace.
 */
export class DocsSearchProvider {
  /**
   * Search documenation and show quick pick results
   */
  async searchDocumentation(): Promise<DocsItem | undefined> {
    // Use the docs folders that get copied to out/docs on compilation
    const docsPath = path.join(__dirname, "..", "docs");

    if (!fs.existsSync(docsPath) || !fs.statSync(docsPath).isDirectory()) {
      vscode.window.showErrorMessage("Documentation folder not found.");
      return;
    }

    // Collect all markdown files in the docs folder
    const markdownFiles = this.collectMarkdownFiles(docsPath);

    if (markdownFiles.length === 0) {
      vscode.window.showErrorMessage("No documentation files found.");
      return;
    }

    // Create quick pick items
    const quickPickItems = markdownFiles.map((filePath) => {
      const relativePath = path.relative(docsPath, filePath);
      const fileName = path.basename(filePath, ".md");
      const folderPath = path.dirname(relativePath);

      return {
        label: `${fileName}`,
        description: folderPath === "." ? "docs" : `docs/(${folderPath})`,
        details: this.getFilePreview(filePath),
        filePath: filePath,
      };
    });

    // Show quick pick
    const selected = await vscode.window.showQuickPick(quickPickItems, {
      placeHolder: "Search documentation...",
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (selected) {
      const fileName = path.basename(selected.filePath, ".md");
      return new DocsItem(
        fileName,
        vscode.TreeItemCollapsibleState.None,
        selected.filePath,
        true
      );
    }

    return undefined;
  }

  /**
   * Search for a string in all markdown files and return results with file, line, and preview
   */
  async searchInFileContents(
    query: string
  ): Promise<Array<{ filePath: string; line: number; preview: string }>> {
    const docsPath = path.join(__dirname, "..", "docs");
    if (!fs.existsSync(docsPath) || !fs.statSync(docsPath).isDirectory()) {
      vscode.window.showErrorMessage("Documentation folder not found.");
      return [];
    }
    const markdownFiles = this.collectMarkdownFiles(docsPath);
    const results: Array<{ filePath: string; line: number; preview: string }> =
      [];
    for (const filePath of markdownFiles) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split(/\r?\n/);
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            // Show a preview with the match highlighted
            let preview = line.trim();
            if (preview.length > 120) preview = preview.slice(0, 117) + "...";
            results.push({
              filePath,
              line: idx,
              preview,
            });
          }
        });
      } catch (error) {
        /* ignore file errors */
      }
    }

    return results;
  }

  /**
   * Recursively collect all markdown files
   */
  private collectMarkdownFiles(dirPath: string): string[] {
    const files: string[] = [];

    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          files.push(...this.collectMarkdownFiles(itemPath));
        } else if (stat.isFile() && item.endsWith(".md")) {
          files.push(itemPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }

    return files;
  }

  /**
   * Get a preview of the file content for the quick pick details
   */
  private getFilePreview(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      // Get the first few lines, remove markdown formatting
      const lines = content.split("\n").slice(0, 3);
      let prevew = lines
        .join(" ")
        .replace(/#{1,6}\s/g, "") // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
        .replace(/\*(.*?)\*/g, "$1") // Remove italics
        .replace(/`(.*?)`/g, "$1") // Remove inline code
        .trim();
      // Limit to 100 characters
      if (prevew.length > 100) {
        prevew = prevew.substring(0, 100) + "...";
      }

      return prevew || "Documentation file";
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return "Error reading file content";
    }
  }
}
