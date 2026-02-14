const defaultOptions = {
  markupOnly: true,
  ignoreAttribute: [],
  ignorePattern: "",
};

function isStringLiteral(node) {
  return node && node.type === "Literal" && typeof node.value === "string";
}

function getAttributeName(node) {
  if (!node || !node.name) return "";
  if (node.name.type === "JSXIdentifier") return node.name.name;
  if (node.name.type === "JSXNamespacedName") return node.name.name.name;
  return "";
}

function isIgnoredText(text, ignorePattern) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (!ignorePattern) return false;
  const regex = new RegExp(ignorePattern);
  return regex.test(trimmed);
}

const noLiteralStringRule = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow hardcoded strings in JSX markup",
    },
    schema: [
      {
        type: "object",
        properties: {
          markupOnly: { type: "boolean" },
          ignoreAttribute: { type: "array", items: { type: "string" } },
          ignorePattern: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = { ...defaultOptions, ...(context.options[0] || {}) };
    const ignoreAttributes = new Set(options.ignoreAttribute || []);

    function report(node, text) {
      context.report({
        node,
        message: "Hardcoded UI string detected. Use i18n key instead.",
        data: { text },
      });
    }

    return {
      JSXText(node) {
        if (!options.markupOnly) return;
        const value = node.value || "";
        if (isIgnoredText(value, options.ignorePattern)) return;
        report(node, value);
      },
      JSXAttribute(node) {
        if (!options.markupOnly) return;
        const attrName = getAttributeName(node);
        if (!attrName || ignoreAttributes.has(attrName)) return;
        if (!node.value) return;
        if (isStringLiteral(node.value)) {
          if (isIgnoredText(node.value.value, options.ignorePattern)) return;
          report(node, node.value.value);
        }
        if (node.value.type === "JSXExpressionContainer" && isStringLiteral(node.value.expression)) {
          if (isIgnoredText(node.value.expression.value, options.ignorePattern)) return;
          report(node, node.value.expression.value);
        }
      },
    };
  },
};

export default {
  rules: {
    "no-literal-string": noLiteralStringRule,
  },
};
