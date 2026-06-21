declare module "@editorjs/embed" {
  import type { BlockToolConstructable } from "@editorjs/editorjs"
  const Embed: BlockToolConstructable
  export default Embed
}

declare module "editorjs-drag-drop" {
  import type EditorJS from "@editorjs/editorjs"
  export default class DragDrop {
    constructor(editor: EditorJS)
  }
}
