/**
 * Documentation Webview Scripts Reference File
 *
 * NOTE: This code is actually inlined in the docs-content-provider.ts file.
 * This file is kept for reference and future updates.
 *
 * Features:
 * • Handles scrolling and anchor links in documentation files
 * • Provides smooth scrolling to anchor links and highlights the target element
 * • Adds copy buttons to code blocks with visual feedback
 * • Prevents external file navigation for security
 *
 * Usage: Copy the code below and inline it within the webview HTML script tags
 */

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
