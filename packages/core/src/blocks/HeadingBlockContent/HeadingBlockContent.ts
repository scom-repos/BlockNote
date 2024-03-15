import { Editor, InputRule, PasteRule } from "@tiptap/core";
import {
  PropSchema,
  createBlockSpecFromStronglyTypedTiptapNode,
  createStronglyTypedTiptapNode,
} from "../../schema";
import { createDefaultBlockDOMOutputSpec } from "../defaultBlockHelpers";
import { defaultProps } from "../defaultProps";
import { markdownToBlocks } from "../../api/parsers/markdown/parseMarkdown";
import { getBlockInfoFromPos } from "../../api/getBlockInfoFromPos";
import { blockToNode } from "../../api/nodeConversions/nodeConversions";
// eslint-disable-next-line import/no-cycle
import {
  defaultBlockSchema,
  defaultInlineContentSchema,
  defaultStyleSchema,
} from "../defaultBlocks";
import { Fragment, Slice } from "prosemirror-model";

export const headingPropSchema = {
  ...defaultProps,
  level: { default: 1, values: [1, 2, 3, 4, 5, 6] as const },
} satisfies PropSchema;

const HeadingBlockContent = createStronglyTypedTiptapNode({
  name: "heading",
  content: "inline*",
  group: "blockContent",
  addAttributes() {
    return {
      level: {
        default: 1,
        // instead of "level" attributes, use "data-level"
        parseHTML: (element) => {
          const attr = element.getAttribute("data-level")!;
          const parsed = parseInt(attr);
          if (isFinite(parsed)) {
            return parsed;
          }
          return undefined;
        },
        renderHTML: (attributes) => {
          return {
            "data-level": (attributes.level as number).toString(),
          };
        },
      },
    };
  },

  addInputRules() {
    return [
      ...[1, 2, 3, 4, 5, 6].map((level) => {
        // Creates a heading of appropriate level when starting with "#", "##", or "###".
        return new InputRule({
          find: new RegExp(`^(#{${level}})\\s$`),
          handler: ({ state, chain, range }) => {
            chain()
              .BNUpdateBlock(state.selection.from, {
                type: "heading",
                props: {
                  level: level as any,
                },
              })
              // Removes the "#" character(s) used to set the heading.
              .deleteRange({ from: range.from, to: range.to });
          },
        });
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-1": () =>
        this.editor.commands.BNUpdateBlock(this.editor.state.selection.anchor, {
          type: "heading",
          props: {
            level: 1 as any,
          },
        }),
      "Mod-Alt-2": () =>
        this.editor.commands.BNUpdateBlock(this.editor.state.selection.anchor, {
          type: "heading",
          props: {
            level: 2 as any,
          },
        }),
      "Mod-Alt-3": () =>
        this.editor.commands.BNUpdateBlock(this.editor.state.selection.anchor, {
          type: "heading",
          props: {
            level: 3 as any,
          },
        }),
      "Mod-Alt-4": () =>
        this.editor.commands.BNUpdateBlock(this.editor.state.selection.anchor, {
          type: "heading",
          props: {
            level: 4 as any,
          },
        }),
      "Mod-Alt-5": () =>
        this.editor.commands.BNUpdateBlock(this.editor.state.selection.anchor, {
          type: "heading",
          props: {
            level: 5 as any,
          },
        }),
      "Mod-Alt-6": () =>
        this.editor.commands.BNUpdateBlock(this.editor.state.selection.anchor, {
          type: "heading",
          props: {
            level: 6 as any,
          },
        }),
    };
  },
  parseHTML() {
    return [
      {
        tag: "div[data-content-type=" + this.name + "]",
        getAttrs: (element) => {
          if (typeof element === "string") {
            return false;
          }

          return {
            level: element.getAttribute("data-level"),
          };
        },
      },
      {
        tag: "h1",
        attrs: { level: 1 },
        node: "heading",
      },
      {
        tag: "h2",
        attrs: { level: 2 },
        node: "heading",
      },
      {
        tag: "h3",
        attrs: { level: 3 },
        node: "heading",
      },
      {
        tag: "h4",
        attrs: { level: 4 },
        node: "heading",
      },
      {
        tag: "h5",
        attrs: { level: 5 },
        node: "heading",
      },
      {
        tag: "h6",
        attrs: { level: 6 },
        node: "heading",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return createDefaultBlockDOMOutputSpec(
      this.name,
      `h${node.attrs.level}`,
      {
        ...(this.options.domAttributes?.blockContent || {}),
        ...HTMLAttributes,
      },
      this.options.domAttributes?.inlineContent || {}
    );
  },

  addPasteRules() {
    return [
      new PasteRule({
        find: /.*/g,
        handler: ({ state, chain, range, pasteEvent }) => {
          const { node } = getBlockInfoFromPos(
            state.doc,
            state.selection.from
          )!;
          const text = pasteEvent?.clipboardData?.getData("text") || "";
          if (text) {
            parseMardown(text, this.editor, {
              state,
              chain,
              range,
              node,
            });
          }
        },
      }),
    ];
  },
});

export const Heading = createBlockSpecFromStronglyTypedTiptapNode(
  HeadingBlockContent,
  headingPropSchema
);

const parseMardown = async (content: string, editor: Editor, props: any) => {
  const { state, range } = props;
  const blocksToInsert = await markdownToBlocks(
    content,
    defaultBlockSchema,
    defaultInlineContentSchema,
    defaultStyleSchema,
    state.schema
  );

  if (blocksToInsert?.length) {
    const nodesToInsert = [];
    for (const blockSpec of blocksToInsert) {
      nodesToInsert.push(
        blockToNode(blockSpec as any, editor.schema, defaultStyleSchema)
      );
    }
    if (range.from !== range.to) {
      const slice = new Slice(Fragment.from(nodesToInsert), 0, 0);
      editor.view.dispatch(
        editor.state.tr.replaceRange(range.from, range.to, slice)
      );
    }
  }
};
