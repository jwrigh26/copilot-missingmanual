import * as fs from "fs";
import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import * as path from "path";
import * as vscode from "vscode";
import { DocsItem } from "./docs-tree-provider";

/**
 * Content provider for rendering documentation in webview panels.
 * Handles markdown parsing, syntax highlighting, and custom styling
 * for documentation files.
 */

export class DocsContentProvider {
  private readonly md: MarkdownIt;

  constructor(private context: vscode.ExtensionContext) {
    // Initialize Markdown-it with syntax highlighting
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str: string, lang: string) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(str, { language: lang }).value;
          } catch (error) {
            console.error("Highlight.js error:", error);
          }
        }
        return ""; // Return empty string if highlighting fails
      },
    });

    // Add proper header IDs for table of contents links
    this.md.use(require("markdown-it-anchor"));
  }

  /**
   * Open a documentation file in a webview panel.
   */
  async openDocument(docItem: DocsItem): Promise<void> {
    if (!docItem.filePath || !docItem.isMarkdown) {
      vscode.window.showErrorMessage("Invalid documentation file");
      return;
    }

    try {
      const content = fs.readFileSync(docItem.filePath, "utf-8");
      const html = this.md.render(content);

      const panel = vscode.window.createWebviewPanel(
        "copilot-missingmanual",
        `${docItem.label}`,
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.file(path.dirname(docItem.filePath)),
            vscode.Uri.file(path.join(this.context.extensionPath, "resources")),
          ],
        }
      );

      panel.webview.html = this.getWebviewContent(html, docItem.label);

      // Update title when panel becomes active
      panel.onDidChangeViewState((e) => {
        if (panel.active) {
          panel.title = docItem.label;
        }
      });
    } catch (error) {
      console.error("Failed to open documentation:", error);
      vscode.window.showErrorMessage(`Failed to open documentation: ${error}`);
    }
  }

  /**
   * Generate HTML content for the webview
   */
  private getWebviewContent(markdownHtml: string, title: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              line-height: 1.6;
              color: var(--vscode-editor-foreground);
              background-color: var(--vscode-editor-background);
              padding: 20px;
              max-width: 900px;
              margin: 0 auto;
            }
            
            /* Headers */
            h1, h2, h3, h4, h5, h6 {
              color: var(--vscode-editor-foreground);
              margin-top: 24px;
              margin-bottom: 16px;
              font-weight: 600;
              line-height: 1.25;
              /* Add a small offset for anchor navigation to account for the fixed header */
              scroll-margin-top: 20px;
            }

            /* Target element highlighting for anchor navigation */
            .highlight-target {
              animation: highlight-section 2s ease-out;
            }

            @keyframes highlight-section {
              0% {
                background-color: var(--vscode-editor-selectionBackground);
              }
              100% {
                background-color: transparent;
              }
            }

            h1 {
              border-bottom: 1px solid var(--vscode-panel-border);
              padding-bottom: 8px;
              font-size: 2em;
            }

            h2 {
              border-bottom: 1px solid var(--vscode-panel-border);
              padding-bottom: 6px;
              font-size: 1.5em;
            }

            /* Code blocks */
            pre {
              background-color: var(--vscode-textCodeBlock-background);
              border: 1px solid var(--vscode-panel-border);
              border-radius: 6px;
              padding: 16px;
              overflow-x: auto;
              font-family: "Consolas", "Monaco", "Courier New", monospace;
              font-size: 14px;
              line-height: 1.45;
            }

            code {
              background-color: var(--vscode-textCodeBlock-background);
              border-radius: 3px;
              padding: 2px 4px;
              font-family: "Consolas", "Monaco", "Courier New", monospace;
              font-size: 85%;
            }

            pre code {
              background-color: transparent;
              padding: 0;
            }

            /* Lists */
            ul, ol {
              padding-left: 24px;
            }

            li {
              margin-bottom: 4px;
            }

            /* Links */
            a {
              color: var(--vscode-textLink-foreground);
              text-decoration: none;
            }
            
            a:hover {
              text-decoration: underline;
            }

            /* Blockquotes */
            blockquote {
              border-left: 4px solid var(--vscode-panel-border);
              margin: 16px 0;
              padding-left: 16px;
              color: var(--vscode-descriptionForeground);
            }
            
            /* Tables */
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 16px 0;
            }

            th, td {
              border: 1px solid var(--vscode-panel-border);
              padding: 8px 12px;
              text-align: left;
            }

            th {
              background-color: var(--vscode-editor-inactiveSelectionBackground);
              font-weight: 600;
            }

            /* Emojis and special characters */
            .emoji {
              font-size: 1.2em;
            }

            /* Custom badges/tags */
            .tag {
              background-color: var(--vscode-button-background);
              color: var(--vscode-button-foreground);
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 500;
            }

            /* Syntax highlighting improvements */
            .hljs {
              background: transparent !important;
            }

            .hljs-comment,
            .hljs-quote {
              color: var(--vscode-editor-foreground);
              opacity: 0.6;
            }

            .hljs-keyword,
            .hljs-selector-tag,
            .hljs-built_in,
            .hljs-tag {
              color: #569cd6;
            }

            .hljs-string,
            .hljs-title,
            .hljs-section,
            .hljs-attribute,
            .hljs-literal,
            .hljs-template-tag,
            .hljs-template-variable,
            .hljs-type,
            .hljs-addition {
              color: #ce9178;
            }

            .hljs-number,
            .hljs-symbol,
            .hljs-bullet,
            .hljs-variable,
            .hljs-template-variable,
            .hljs-link {
              color: #b5cea8;
            }

            .hljs-regexp,
            .hljs-link,
            .hljs-meta,
            .hljs-selector-attr,
            .hljs-selector-pseudo,
            .hljs-selector-class,
            .hljs-selector-id,
            .hljs-selector-tag {
              color: #d7ba7d;
            }

            /* Responsive design */
            @media (max-width: 768px) {
              body {
                padding: 12px;
              }
              pre {
                padding: 12px;
                font-size: 13px;
              }
            }

            /* Smooth scrolling for anchor links */
            html {
              scroll-behavior: smooth;
            }

            /* Highlight target section when navigating via table of contents */
            :target {
              animation: highlight 2s ease-in-out;
            }

            @keyframes highlight {
              0% {
                background-color: var(--vscode-editor-selectionBackground);
              }
              100% {
                background-color: transparent;
              }
            }
          </style>
        </head>
        <body>
          <div class="markdown-body">
            ${markdownHtml}
          </div>
          <script>
            // Add proper scroll handling for anchor links
            document.addEventListener("DOMContentLoaded", () => {
              // Check if there's a hash in the URL (from a table of contents link)
              const handleHashNavigation = () => {
                const hash = window.location.hash;
                if (hash) {
                  // Remove the # character
                  const targetId = hash.substring(1);
                  const targetElement = document.getElementById(targetId);
                  if (targetElement) {
                    // Scroll to the target element
                    targetElement.scrollIntoView({
                      behavior: "smooth",
                      block: "start", // Align to the top of the viewport
                    });

                    // Add a highlight effect
                    targetElement.classList.add("highlight-target");
                    setTimeout(() => {
                      targetElement.classList.remove("highlight-target");
                    }, 2000); // Remove highlight after 2 seconds
                  }
                }
              };

              // Handle initial hash if present
              handleHashNavigation();

              // Handle internal link clicks (table of contents)
              document.addEventListener("click", (event) => {
                const target = event.target;
                if (target.tagName === "A" && target.href) {
                  const url = new URL(target.href);
                  // If it's an anchor link within the same document
                  if (
                    url.hash &&
                    (url.pathname === location.pathname || url.pathname === "")
                  ) {
                    event.preventDefault();

                    // Update window location hash
                    window.location.hash = url.hash;

                    // Scroll to the target element
                    const targetId = url.hash.substring(1);
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                      targetElement.scrollIntoView({
                        behavior: "smooth",
                        block: "start", // Align to the top of the viewport
                      });

                      // Add a highlight effect
                      targetElement.classList.add("highlight-target");
                      setTimeout(() => {
                        targetElement.classList.remove("highlight-target");
                      }, 2000); // Remove highlight after 2 seconds
                    }
                  } else if (url.protocol === "file:" || url.hostname === "") {
                    // Block external file navigation
                    event.preventDefault();
                  }
                }
              });
            });

            // Add Copy buttons to code blocks
            document.querySelectorAll("pre code").forEach((block) => {
              const button = document.createElement("button");
              button.textContent = "Copy";
              button.style.cssText =
                "position: absolute; top: 8px; right: 8px; padding: 4px 8px; border: none; background: var(--vscode-button-background); color: var(--vscode-button-foreground); cursor: pointer; border-radius: 4px; font-size: 12px;";

              const pre = block.parentElement;
              pre.style.position = "relative";
              pre.appendChild(button);

              button.addEventListener("click", () => {
                navigator.clipboard.writeText(block.textContent || "");
                button.textContent = "Copied!";
                setTimeout(() => {
                  button.textContent = "Copy";
                }, 2000);
              });
            });
          </script>
        </body>
      </html>`;
  }
}
