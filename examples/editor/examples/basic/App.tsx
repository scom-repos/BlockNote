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
    uploadFile: uploadToTmpFilesDotOrg_DEV_ONLY,
  });

  // Give tests a way to get prosemirror instance
  (window as WindowWithProseMirror).ProseMirror = editor?._tiptapEditor;
  const value = async () => {
    const res = await editor.tryParseMarkdownToBlocks("123\n\n123");
    console.log(res);
  };
  console.log(value());

  return <BlockNoteView className="root" editor={editor} />;
}

export default App;
