const STATIC_TAGS = new Set(['div', 'span', 'section', 'article', 'li', 'ul', 'ol']);

function getAttribute(node, name) {
  return node.attributes?.find(
    (attr) => attr.type === 'JSXAttribute' && attr.name?.name === name,
  );
}

function hasAttribute(node, name) {
  return Boolean(getAttribute(node, name));
}

function isInteractiveRole(node) {
  const role = getAttribute(node, 'role');
  if (!role || !role.value || role.value.type !== 'Literal') return false;
  return ['button', 'link', 'checkbox', 'menuitem', 'option', 'switch', 'tab'].includes(String(role.value.value));
}

function hasKeyboardHandler(node) {
  return hasAttribute(node, 'onKeyDown') || hasAttribute(node, 'onKeyUp') || hasAttribute(node, 'onKeyPress');
}

function isStaticWithClick(node) {
  const tagName = node.name?.type === 'JSXIdentifier' ? node.name.name : null;
  if (!tagName || !STATIC_TAGS.has(tagName)) return false;
  return hasAttribute(node, 'onClick');
}

const rules = {
  'click-events-have-key-events': {
    meta: {
      type: 'problem',
      docs: {
        description: 'enforce keyboard handlers for clickable non-interactive elements',
      },
      schema: [],
    },
    create(context) {
      return {
        JSXOpeningElement(node) {
          if (!isStaticWithClick(node)) return;
          if (!hasKeyboardHandler(node)) {
            context.report({
              node,
              message: 'Visible non-interactive elements with onClick must have at least one keyboard listener.',
            });
          }
        },
      };
    },
  },
  'interactive-supports-focus': {
    meta: {
      type: 'problem',
      docs: {
        description: 'enforce tabIndex or interactive role on clickable static elements',
      },
      schema: [],
    },
    create(context) {
      return {
        JSXOpeningElement(node) {
          if (!isStaticWithClick(node)) return;
          if (!hasAttribute(node, 'tabIndex') && !isInteractiveRole(node)) {
            context.report({
              node,
              message: 'Clickable non-interactive elements must be focusable (tabIndex) or have an interactive role.',
            });
          }
        },
      };
    },
  },
  'no-static-element-interactions': {
    meta: {
      type: 'problem',
      docs: {
        description: 'disallow static element interactions without role',
      },
      schema: [],
    },
    create(context) {
      return {
        JSXOpeningElement(node) {
          if (!isStaticWithClick(node)) return;
          if (!isInteractiveRole(node)) {
            context.report({
              node,
              message: 'Avoid static elements with onClick. Use semantic button/link or add an interactive role.',
            });
          }
        },
      };
    },
  },
};

export default {
  rules,
  configs: {
    recommended: {
      plugins: ['jsx-a11y'],
      rules: {
        'jsx-a11y/click-events-have-key-events': 'error',
        'jsx-a11y/interactive-supports-focus': 'error',
        'jsx-a11y/no-static-element-interactions': 'error',
      },
    },
  },
};
