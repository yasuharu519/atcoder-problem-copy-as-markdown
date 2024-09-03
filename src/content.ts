import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import { visit } from "unist-util-visit";

interface HastElement {
  type: string;
  value?: string;
  tagName: string;
  children?: HastElement[];
  properties?: { [key: string]: string };
}

// 再帰的に annotation タグを探す関数
function findAnnotation(node: HastElement): string | null {
  if (
    node.tagName === "annotation" &&
    node.properties?.encoding === "application/x-tex"
  ) {
    return node.children?.[0]?.value || null;
  }

  if (node.children) {
    for (const child of node.children) {
      const result = findAnnotation(child);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

const processor = unified()
  .use(rehypeParse) // HTMLを解析
  .use(() => (tree) => {
    // <var> タグをカスタム処理
    visit(tree, "element", (node: HastElement) => {
      if (node.tagName === "var") {
        const mathContent = findAnnotation(node);
        if (mathContent) {
          // <var> タグの子ノードをテキストノードに置き換える
          node.type = "text"; // これにより、このノードはテキストとして扱われる
          node.value = `$${mathContent}$`;
          // delete node.children;
        }
      }
    });
  })
  .use(rehypeRemark) // Markdownに変換
  .use(remarkStringify); // Markdownを文字列化

interface PartComponents {
  problemPart: Element;
  restrictionPart: Element;
}

function getPartContent(): PartComponents | null {
  const parts = document.querySelectorAll(".part");
  if (!parts || parts.length < 2) {
    console.error("Parts not found.");
    return null;
  }

  return {
    problemPart: parts[0] as Element,
    restrictionPart: parts[1] as Element,
  };
}

function getComponentsOnSection(part: Element): [Element, Element[]] | null {
  const section = part.querySelector("section");
  if (!section) {
    console.error("Section not found.");
    return null;
  }

  // section 内のすべての子要素を取得
  const allElements = Array.from(section.children);

  if (allElements.length === 0) {
    console.error("No elements found in the section.");
    return null;
  }

  // 最初の要素と残りの要素に分ける
  const firstElement = allElements[0];
  const remainingElements = allElements.slice(1);

  return [firstElement, remainingElements];
}

function onClickCopyButton(elems: Element[]) {
  // 全ての `elems` の内容を一つにまとめる
  const combinedHtmlContent = elems.map((elem) => elem.outerHTML).join("\n");

  // まとめた HTML を Markdown に変換
  processor
    .process(combinedHtmlContent)
    .then((file) => {
      const textToCopy = String(file).trim();

      // クリップボードにコピー
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          alert("All sections copied to clipboard as Markdown!");
        })
        .catch((err) => {
          console.error("Failed to copy text:", err);
        });
    })
    .catch((err) => {
      console.error("Error processing HTML:", err);
    });
}

function createCopyButton() {
  const copyButton = document.createElement("span");
  copyButton.className = "btn btn-default btn-sm btn-copy ml-1";
  copyButton.textContent = "Copy";
  return copyButton;
}

function main() {
  const parts = getPartContent();
  if (!parts) {
    return;
  }

  for (const part of [parts.problemPart, parts.restrictionPart]) {
    const components = getComponentsOnSection(part);
    if (!components) {
      return;
    }

    const [firstElement, remainingElements] = components;
    const copyButton = createCopyButton();
    copyButton.addEventListener(
      "click",
      onClickCopyButton.bind(null, remainingElements)
    );
    firstElement.appendChild(copyButton);
  }
}

main();
