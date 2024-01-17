import { uploadToTmpFilesDotOrg_DEV_ONLY } from "@blocknote/core";
import { BlockNoteView, useBlockNote } from "@blocknote/react";
import "@blocknote/react/style.css";

type WindowWithProseMirror = Window & typeof globalThis & { ProseMirror: any };

export function App() {
  const editor = useBlockNote({
    domAttributes: {
      editor: {
        class: "editor",
        "data-test": "editor",
      },
    },
    onEditorContentChange: async (editor) => {
      editor.topLevelBlocks.pop();
      const md = await editor.blocksToMarkdownLossy(editor.topLevelBlocks);
      console.log("mardown", { value: md });
      // console.log(
      //   "MAD BLOCKS",
      //   await editor.tryParseMarkdownToBlocks(
      //     "|                   |   |   |\n| ----------------- | - | - |\n| 1                 | 1 | 1 |\n| 1.  1\n2.  3\n3.  4 |   |   |\n"
      //   )
      // );
    },
    uploadFile: uploadToTmpFilesDotOrg_DEV_ONLY,
  });

  // Give tests a way to get prosemirror instance
  (window as WindowWithProseMirror).ProseMirror = editor?._tiptapEditor;

  return <BlockNoteView className="root" editor={editor} />;
}

export default App;
