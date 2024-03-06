import {
  findParentNodeClosestToPos,
  KeyboardShortcutCommand,
  Node,
} from "@tiptap/core";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import {
  createBlockSpecFromStronglyTypedTiptapNode,
  createStronglyTypedTiptapNode,
} from "../../schema";
import { createDefaultBlockDOMOutputSpec } from "../defaultBlockHelpers";
import { defaultProps } from "../defaultProps";
import { TableExtension } from "./TableExtension";
import {
  addRowAfter,
  addRowBefore,
  CellSelection,
  deleteTable,
  goToNextCell,
} from "prosemirror-tables";
import { mergeCSSClasses } from "../../util/browser";

export const tablePropSchema = {
  ...defaultProps,
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    table: {
      addRowBefore: () => ReturnType;
      addRowAfter: () => ReturnType;
      goToNextCell: () => ReturnType;
      goToPreviousCell: () => ReturnType;
      deleteTable: () => ReturnType;
    };
  }
}

export const TableBlockContent = createStronglyTypedTiptapNode({
  name: "table",
  content: "tableRow+",
  group: "blockContent",
  tableRole: "table",

  isolating: true,

  parseHTML() {
    return [{ tag: "table" }];
  },

  renderHTML({ HTMLAttributes }) {
    return createDefaultBlockDOMOutputSpec(
      this.name,
      "table",
      {
        ...(this.options.domAttributes?.blockContent || {}),
        ...HTMLAttributes,
      },
      this.options.domAttributes?.inlineContent || {}
    );
  },

  addCommands() {
    return {
      goToNextCell:
        () =>
        ({ state, dispatch }) => {
          return goToNextCell(1)(state, dispatch);
        },
      goToPreviousCell:
        () =>
        ({ state, dispatch }) => {
          return goToNextCell(-1)(state, dispatch);
        },
      addRowBefore:
        () =>
        ({ state, dispatch }) => {
          return addRowBefore(state, dispatch);
        },
      addRowAfter:
        () =>
        ({ state, dispatch }) => {
          return addRowAfter(state, dispatch);
        },
      deleteTable:
        () =>
        ({ state, dispatch }) => {
          return deleteTable(state, dispatch);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Shift-Tab": () => this.editor.commands.goToPreviousCell(),
      Backspace: deleteTableWhenAllCellsSelected,
      "Mod-Backspace": deleteTableWhenAllCellsSelected,
      Delete: deleteTableWhenAllCellsSelected,
      "Mod-Delete": deleteTableWhenAllCellsSelected,
    };
  },
});

const TableParagraph = Node.create({
  name: "tableParagraph",
  group: "tableContent",
  content: "blockContainer+",

  parseHTML() {
    return [{ tag: "div[data-node-type=" + this.name + "]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const blockGroupHTMLAttributes = {
      ...(this.options.domAttributes?.blockGroup || {}),
      ...HTMLAttributes,
    };
    const blockGroup = document.createElement("div");
    blockGroup.className = mergeCSSClasses(
      "bn-block-table-paragraph",
      blockGroupHTMLAttributes.class
    );
    blockGroup.setAttribute("data-node-type", "tableParagraph");
    for (const [attribute, value] of Object.entries(blockGroupHTMLAttributes)) {
      if (attribute !== "class") {
        blockGroup.setAttribute(attribute, value as string);
      }
    }
    return {
      dom: blockGroup,
      contentDOM: blockGroup,
    };
  },
});

export const Table = createBlockSpecFromStronglyTypedTiptapNode(
  TableBlockContent,
  tablePropSchema,
  [
    TableExtension,
    TableParagraph,
    TableHeader.extend({
      content: "tableContent",
    }),
    TableCell.extend({
      content: "tableContent",
    }),
    TableRow,
  ]
);

function isCellSelection(value: unknown): value is CellSelection {
  return value instanceof CellSelection;
}

const deleteTableWhenAllCellsSelected: KeyboardShortcutCommand = ({
  editor,
}) => {
  const { selection } = editor.state;

  if (!isCellSelection(selection)) {
    return false;
  }

  let cellCount = 0;
  const table = findParentNodeClosestToPos(
    selection.ranges[0].$from,
    (node) => {
      return node.type.name === "table";
    }
  );

  table?.node.descendants((node) => {
    if (["tableCell", "tableHeader"].includes(node.type.name)) {
      cellCount += 1;
    }
  });

  const allCellsSelected = cellCount === selection.ranges.length;

  if (!allCellsSelected) {
    return false;
  }

  editor.commands.deleteTable();

  return true;
};
