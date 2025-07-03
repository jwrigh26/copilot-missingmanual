import * as fs from "fs";
import path from "path";
import * as vscode from "vscode";
import { CopilotHelper } from "../helpers/copilot-helper";

export class DocsItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly filePath: string,
    public readonly isMarkdown: boolean = false
  ) {
    super(label, collapsibleState);

    if (isMarkdown) {
      this.command = {
        command: "copilot-missingmanual.openDocs",
        title: "Open Documentation",
        arguments: [this],
      };
      this.iconPath = new vscode.ThemeIcon("file-text");
      this.tooltip = `Documentation file: ${this.label}`;
    } else {
      // Use specfic icons based on folder name
      let iconName = "folder";
      let iconColor = undefined;
      switch (this.label.toLowerCase()) {
        case "getting-started":
          iconName = "rocket";
          iconColor = new vscode.ThemeColor("folderIcon.gettingStarted");
          break;
        case "vscode-extensions":
          iconName = "extensions";
          iconColor = new vscode.ThemeColor("folderIcon.vscodeExtensions");
          break;
        case "ai-development":
          iconName = "robot";
          iconColor = new vscode.ThemeColor("folderIcon.aiDevelopment");
          break;
        case "architecture":
          iconName = "architecture";
          iconColor = new vscode.ThemeColor("folderIcon.architecture");
          break;
        case "react":
          iconName = "react";
          iconColor = new vscode.ThemeColor("folderIcon.react");
          break;
        case "javascript":
          iconName = "javascript";
          iconColor = new vscode.ThemeColor("folderIcon.javascript");
          break;
        case "typescript":
          iconName = "typescript";
          iconColor = new vscode.ThemeColor("folderIcon.typescript");
          break;
        case "nodejs":
          iconName = "nodejs";
          iconColor = new vscode.ThemeColor("folderIcon.nodejs");
          break;
        case "python":
          iconName = "python";
          iconColor = new vscode.ThemeColor("folderIcon.python");
          break;
        case "java":
          iconName = "java";
          iconColor = new vscode.ThemeColor("folderIcon.java");
          break;
        case "csharp":
          iconName = "csharp";
          iconColor = new vscode.ThemeColor("folderIcon.csharp");
          break;
        case "golang":
          iconName = "golang";
          iconColor = new vscode.ThemeColor("folderIcon.golang");
          break;
        case "ruby":
          iconName = "ruby";
          iconColor = new vscode.ThemeColor("folderIcon.ruby");
          break;
        case "php":
          iconName = "php";
          iconColor = new vscode.ThemeColor("folderIcon.php");
          break;
        case "ui-components":
          iconName = "components";
          iconColor = new vscode.ThemeColor("folderIcon.uiComponents");
          break;
        case "api":
          iconName = "api";
          iconColor = new vscode.ThemeColor("folderIcon.api");
          break;
        case "guides":
          iconName = "book";
          iconColor = new vscode.ThemeColor("folderIcon.guides");
          break;
        case "tutorials":
          iconName = "play";
          iconColor = new vscode.ThemeColor("folderIcon.tutorials");
          break;
        case "references":
          iconName = "reference";
          iconColor = new vscode.ThemeColor("folderIcon.references");
          break;
        case "examples":
          iconName = "example";
          iconColor = new vscode.ThemeColor("folderIcon.examples");
          break;
        default:
          iconName = "folder";
          iconColor = new vscode.ThemeColor("folderIcon.default");
          break;
      }
      this.iconPath = new vscode.ThemeIcon(iconName, iconColor);
      this.tooltip = `Documentation folder: ${this.label}`;
    }

    this.contextValue = isMarkdown ? "docFile" : "docFolder";
  }
}

/**
 * Tree data provider for the documentation view
 * Scans workspace for the docs folders and provides a tree structure
 */

export class DocsTreeProvider
  implements
    vscode.TreeDataProvider<DocsItem>,
    vscode.TreeDragAndDropController<DocsItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    DocsItem | undefined | null | void
  > = new vscode.EventEmitter<DocsItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    DocsItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private _onDocsFound: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  readonly onDocsFound: vscode.Event<void> = this._onDocsFound.event;

  private docsPath: string | undefined;

  // Drag and drop support
  dropMimeTypes = ["application/vnd.code.tree.copilot-missingmanua"];
  dragMimeTypes = ["text/uri-list"];

  constructor() {
    console.log("Initializing DocsTreeProvider...");
    this.findDocsFolder();
  }

  /**
   * Set docs folder to src/docs in the current workspace
   */
  private findDocsFolder(): void {
    // Use the docs folder that gets copied to out/docs on compilation
    const docsPath = path.join(__dirname, "..", "docs");
    if (fs.existsSync(docsPath) && fs.statSync(docsPath).isDirectory()) {
      this.docsPath = docsPath;
      this._onDocsFound.fire();
      this.refresh();
      console.log("Found docs folder:", this.docsPath);
    } else {
      console.warn(
        "Documentation folder not found. Please set the path in settings."
      );
    }
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
    console.log("Docs tree view refreshed.");
  }

  /**
   * Check if docs path has been found
   */
  hasDocsPath(): boolean {
    return !!this.docsPath;
  }

  /**
   * Get tree item for display
   */
  getTreeItem(element: DocsItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  /**
   * Get children of a tree item
   */
  getChildren(element?: DocsItem): Thenable<DocsItem[]> {
    if (!this.docsPath) {
      return Promise.resolve([]);
    }

    const targetPath = element ? element.filePath : this.docsPath;
    return Promise.resolve(this.getDocsInDirectory(targetPath));
  }

  /**
   * Get dcoumentation files and folders in a directory
   */
  private getDocsInDirectory(dirPath: string): DocsItem[] {
    const items: DocsItem[] = [];

    try {
      const files = fs.readdirSync(dirPath);

      // Sort: folders first then files, both alphabetically
      files.sort((a, b) => {
        const aPath = path.join(dirPath, a);
        const bPath = path.join(dirPath, b);
        const aIsDir = fs.statSync(aPath).isDirectory();
        const bIsDir = fs.statSync(bPath).isDirectory();

        if (aIsDir && !bIsDir) return -1; // Folders first
        if (!aIsDir && bIsDir) return 1; // Files after folders
        return a.localeCompare(b); // Alphabetical order
      });

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Add folder item
          items.push(
            new DocsItem(
              file,
              vscode.TreeItemCollapsibleState.Collapsed,
              filePath,
              false
            )
          );
        } else if (stat.isFile() && file.endsWith(".md")) {
          // Markdown file
          const displayName = file.replace(/\.md$/, "");
          items.push(
            new DocsItem(
              displayName,
              vscode.TreeItemCollapsibleState.None,
              filePath,
              true
            )
          );
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }
    return items;
  }

  /**
   * Get all markdown files for search functionality
   */
  getAllMarkdownFiles(): string[] {
    if (!this.docsPath) {
      return [];
    }

    const files: string[] = [];
    this.collectMarkdownFiles(this.docsPath, files);
    return files;
  }

  /**
   * Recursively collect all markdown files in a directory
   */
  private collectMarkdownFiles(dirPath: string, files: string[]): void {
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          this.collectMarkdownFiles(itemPath, files);
        } else if (stat.isFile() && item.endsWith(".md")) {
          files.push(itemPath);
        }
      }
    } catch (error) {
      console.error(
        `Error reading markdown files in directory ${dirPath}:`,
        error
      );
    }
  }

  /**
   * Recursively check if a directory has any markdown files ( Not being used but cool )
   */

  private hasMarkdownFilesInDirectory(dirPath: string): boolean {
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isFile() && item.endsWith(".md")) {
          return true; // Found a markdown file
        } else if (stat.isDirectory()) {
          if (this.hasMarkdownFilesInDirectory(itemPath)) {
            return true; // Found markdown file in subdirectory
          }
        }
      }
    } catch (error) {
      console.error(
        `Error checking for markdown files in directory ${dirPath}:`,
        error
      );
    }
    return false; // No markdown files found
  }

  /**
   * Handle drag and drop of documentation items
   */
  public async handleDrag(
    source: DocsItem[],
    treeDataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): Promise<void> {
    if (source.length > 0 && source[0].isMarkdown && source[0].filePath) {
      const docItme = source[0];

      try {
        await CopilotHelper.addDocumentToCopilot(docItme.filePath);
        console.log(`Document ${docItme.label} added to Copilot.`);
      } catch (error) {
        console.error(
          `Failed to add document ${docItme.label} to Copilot:`,
          error
        );
        vscode.window.showErrorMessage(
          `Failed to add document ${docItme.label} to Copilot.`
        );
      }
    }
  }

  /**
   * Handle drop ( not used but required by interface )
   */
  public async handleDrop(
    target: DocsItem,
    treeDataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): Promise<void> {
    // Not implemented
  }
}
