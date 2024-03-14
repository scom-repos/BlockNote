import { Mark } from "@tiptap/core";
import { createStyleSpecFromTipTapMark } from "../../schema";

const BackgroundColorMark = Mark.create({
  name: "backgroundColor",

  addAttributes() {
    return {
      stringValue: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-background-color"),
        renderHTML: (attributes) => ({
          "data-background-color": attributes.stringValue,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (element) => {
          if (typeof element === "string") {
            return false;
          }

          if (element.hasAttribute("data-background-color")) {
            return {
              stringValue: element.getAttribute("data-background-color"),
            };
          }

          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { "data-background-color": stringValue = "" } = HTMLAttributes;
    return [
      "span",
      { ...HTMLAttributes, style: `background-color: ${stringValue};` },
      0,
    ];
  },
});

export const BackgroundColor = createStyleSpecFromTipTapMark(
  BackgroundColorMark,
  "string"
);
