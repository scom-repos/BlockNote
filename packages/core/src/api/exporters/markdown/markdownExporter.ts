import { Schema } from "prosemirror-model";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
// eslint-disable-next-line import/no-extraneous-dependencies
import { toHtml } from "hast-util-to-html";
import { unified } from "unified";
import type { BlockNoteEditor } from "../../../editor/BlockNoteEditor";
import {
  Block,
  BlockSchema,
  InlineContentSchema,
  StyleSchema,
} from "../../../schema";
import { createExternalHTMLExporter } from "../html/externalHTMLExporter";
import { removeUnderlines } from "./removeUnderlinesRehypePlugin";

export function cleanHTMLToMarkdown(cleanHTMLString: string) {
  const markdownString = unified()
    .use(rehypeParse, { fragment: true })
    .use(removeUnderlines)
    .use(rehypeRemark, {
      newlines: true,
      handlers: {
        span: (state, node) => {
          /** @type {Html} */
          const result: any = {
            type: "html",
            value: toHtml(node),
          };
          state(node, result);
          return result;
        },
      },
    })
    .use(remarkGfm)
    .use(remarkStringify)
    .processSync(cleanHTMLString);

  if (markdownString.value) {
    markdownString.value = (markdownString.value as string).replace(
      /\\<br>/g,
      "\n"
    );
  }
  return markdownString.value as string;
}

export function blocksToMarkdown<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema
>(
  blocks: Block<BSchema, I, S>[],
  schema: Schema,
  editor: BlockNoteEditor<BSchema, I, S>
): string {
  const exporter = createExternalHTMLExporter(schema, editor);
  const externalHTML = exporter.exportBlocks(blocks);

  return cleanHTMLToMarkdown(externalHTML);
}
