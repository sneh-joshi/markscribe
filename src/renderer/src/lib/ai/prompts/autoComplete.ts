export interface AutoCompletePromptParams {
  /** Up to the cursor, not the whole doc. */
  contextBeforeCursor: string
  /** After the cursor, not the whole doc. */
  contextAfterCursor: string
}

export function buildMarkdownAutoCompletePrompt({
  contextBeforeCursor,
  contextAfterCursor
}: AutoCompletePromptParams): string {
  return `You are an AI writing assistant for a Markdown editor.

Task:
- Generate text to insert at the cursor so it flows naturally with both left and right context.

Rules (important):
- Output ONLY the continuation text. No explanations.
- Keep the same tone, tense, and formatting style.
- Do NOT repeat text already present before or after the cursor.
- Prefer a short continuation (1-2 lines, max ~20 words) unless more is clearly needed.
- Maintain Markdown structure (headings/lists/quotes/code blocks).
- If the context ends inside a list, continue the list.
- If the context ends inside a fenced code block, continue code ONLY (do not close the fence unless the user started closing it).
- Avoid adding citations, footnotes, or placeholders unless the context already uses them.
- Ensure the inserted text connects smoothly into the right-side context.
- Do NOT include any exact phrase that appears at the start of the right-side context.
- Stop generating before the right-side context would begin (no overlap).

Left context (before cursor):
---
${contextBeforeCursor}
---

Right context (after cursor):
---
${contextAfterCursor}
---

Text to insert at cursor:`

}
