import { callOrReturn, Extension, getExtensionField } from "@tiptap/core";
import { columnResizing, tableEditing } from "prosemirror-tables";
import { getBlockInfoFromPos } from "../../api/getBlockInfoFromPos";

export const TableExtension = Extension.create({
  name: "BlockNoteTableExtension",

  addProseMirrorPlugins: () => {
    return [
      columnResizing({
        cellMinWidth: 100,
      }),
      tableEditing(),
    ];
  },

  addKeyboardShortcuts() {
    return {
      // Makes enter create a new line within the cell.
      Enter: () => {
        // const { node } = getBlockInfoFromPos(
        //   this.editor.state.doc,
        //   this.editor.state.selection.from
        // )!;
        // const currentEl = this.editor.view.domAtPos(
        //   this.editor.state.selection.from
        // ).node as Element;
        // if (currentEl.tagName === "TD") {
        //   this.editor.commands.setHardBreak();
        //   return true;
        // }
        // if (
        //   this.editor.state.selection.empty &&
        //   this.editor.state.selection.$head.parent.type.name ===
        //     "tableParagraph"
        // ) {
        //   this.editor.commands.setHardBreak();
        //   return true;
        // }

        return false;
      },
      // Ensures that backspace won't delete the table if the text cursor is at
      // the start of a cell and the selection is empty.
      Backspace: () => {
        return this.editor.commands.first(({ commands }) => [
          // Deletes the selection if it's not empty.
          () => commands.deleteSelection(),
          // Undoes an input rule if one was triggered in the last editor state change.
          () => commands.undoInputRule(),
          // Reverts block content type to a paragraph if the selection is at the start of the block.
          () =>
            commands.command(({ state }) => {
              const { contentType } = getBlockInfoFromPos(
                state.doc,
                state.selection.from
              )!;

              const selectionAtBlockStart =
                state.selection.$anchor.parentOffset === 0;
              const isParagraph = contentType.name === "paragraph";

              if (selectionAtBlockStart && !isParagraph) {
                return commands.BNUpdateBlock(state.selection.from, {
                  type: "paragraph",
                  props: {},
                });
              }

              return false;
            }),
          // Removes a level of nesting if the block is indented if the selection is at the start of the block.
          () =>
            commands.command(({ state }) => {
              const selectionAtBlockStart =
                state.selection.$anchor.parentOffset === 0;

              if (selectionAtBlockStart) {
                return commands.liftListItem("blockContainer");
              }

              return false;
            }),
          // Merges block with the previous one if it isn't indented, isn't the first block in the doc, and the selection
          // is at the start of the block.
          () =>
            commands.command(({ state }) => {
              const { depth, startPos } = getBlockInfoFromPos(
                state.doc,
                state.selection.from
              )!;

              const selectionAtBlockStart =
                state.selection.$anchor.parentOffset === 0;
              const selectionEmpty =
                state.selection.anchor === state.selection.head;
              const blockAtDocStart = startPos === 2;

              const posBetweenBlocks = startPos - 1;

              if (
                !blockAtDocStart &&
                selectionAtBlockStart &&
                selectionEmpty &&
                depth > 1
              ) {
                return commands.BNMergeBlocks(posBetweenBlocks);
              }

              return false;
            }),
        ]);

        // const selection = this.editor.state.selection;
        // const selectionIsEmpty = selection.empty;
        // const selectionIsAtStartOfNode = selection.$head.parentOffset === 0;
        // const selectionIsInTableParagraphNode =
        //   selection.$head.node().type.name === "tableParagraph";

        // return (
        //   selectionIsEmpty &&
        //   selectionIsAtStartOfNode &&
        //   selectionIsInTableParagraphNode
        // );
      },
    };
  },

  extendNodeSchema(extension) {
    const context = {
      name: extension.name,
      options: extension.options,
      storage: extension.storage,
    };

    return {
      tableRole: callOrReturn(
        getExtensionField(extension, "tableRole", context)
      ),
    };
  },
});
