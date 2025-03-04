import { visit } from 'unist-util-visit';
import { h } from 'hastscript';

export default function rehypeSectionHeadings() {
  return (tree: any) => {
    visit(tree, 'root', (rootNode) => {
      const sectionedChildren = [];
      let currentSection = null;
      for (const child of rootNode.children) {
        if (
          child.type === 'element' &&
          ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.tagName)
        ) {
          if (currentSection) {
            sectionedChildren.push(currentSection);
          }
          currentSection = h('section', [child]);
        } else {
          if (currentSection) {
            currentSection.children.push(child);
          } else {
            sectionedChildren.push(child);
          }
        }
      }
      if (currentSection) {
        sectionedChildren.push(currentSection);
      }
      rootNode.children = sectionedChildren;
    });
  };
}
