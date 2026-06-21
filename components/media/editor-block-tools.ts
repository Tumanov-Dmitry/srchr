import type {
  API,
  BlockAPI,
  BlockTune,
  BlockTool,
  BlockToolConstructorOptions,
  ToolboxConfig,
} from "@editorjs/editorjs"

type ToolData = Record<string, unknown>

function text(value: unknown) {
  return typeof value === "string" ? value : ""
}

function field(
  name: string,
  placeholder: string,
  value: unknown,
  multiline = false,
) {
  const element = multiline
    ? document.createElement("textarea")
    : document.createElement("input")
  element.dataset.field = name
  element.className =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
  element.placeholder = placeholder
  element.value = text(value)
  if (element instanceof HTMLTextAreaElement) element.rows = 4
  return element
}

abstract class FormBlockTool implements BlockTool {
  protected data: ToolData
  protected wrapper: HTMLDivElement | null = null

  constructor({ data }: BlockToolConstructorOptions<ToolData>) {
    this.data = data
  }

  abstract render(): HTMLElement

  save(block: HTMLElement) {
    const result: ToolData = {}
    block
      .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-field]")
      .forEach((item) => {
        if (item.dataset.field) result[item.dataset.field] = item.value
      })
    return result
  }
}

export class SectionTool extends FormBlockTool {
  static get isReadOnlySupported() {
    return true
  }

  render() {
    const wrapper = document.createElement("div")
    wrapper.className = "border-b pb-3 pt-7"
    const title = document.createElement("h2")
    title.className = "text-2xl font-semibold"
    title.textContent = text(this.data.title) || "Раздел"
    const key = document.createElement("input")
    key.type = "hidden"
    key.dataset.field = "key"
    key.value = text(this.data.key)
    const titleInput = document.createElement("input")
    titleInput.type = "hidden"
    titleInput.dataset.field = "title"
    titleInput.value = title.textContent
    wrapper.append(title, key, titleInput)
    return wrapper
  }
}

export class CalloutTool extends FormBlockTool {
  static get toolbox(): ToolboxConfig {
    return { title: "Врезка", icon: "<b>!</b>" }
  }

  render() {
    const wrapper = document.createElement("div")
    wrapper.className = "rounded-lg border-l-4 border-primary bg-primary/5 p-4"
    wrapper.append(field("text", "Важная мысль", this.data.text, true))
    return wrapper
  }
}

export class MetricTool extends FormBlockTool {
  static get toolbox(): ToolboxConfig {
    return { title: "Результат", icon: "<b>42</b>" }
  }

  render() {
    const wrapper = document.createElement("div")
    wrapper.className =
      "grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2"
    wrapper.append(
      field("value", "24%", this.data.value),
      field("label", "Рост eNPS", this.data.label),
    )
    return wrapper
  }
}

export class ButtonTool extends FormBlockTool {
  static get toolbox(): ToolboxConfig {
    return { title: "Кнопка", icon: "<b>CTA</b>" }
  }

  render() {
    const wrapper = document.createElement("div")
    wrapper.className = "grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
    wrapper.append(
      field("label", "Текст кнопки", this.data.label),
      field("url", "https://...", this.data.url),
    )
    return wrapper
  }
}

export class LinkCardTool extends FormBlockTool {
  static get toolbox(): ToolboxConfig {
    return { title: "Ссылка", icon: "<b>↗</b>" }
  }

  render() {
    const wrapper = document.createElement("div")
    wrapper.className = "grid gap-3 rounded-lg border p-4"
    wrapper.append(
      field("title", "Название ссылки", this.data.title),
      field("url", "https://...", this.data.url),
    )
    return wrapper
  }
}

async function uploadImage(file: File) {
  const body = new FormData()
  body.append("image", file)
  const response = await fetch("/api/materials/upload", {
    method: "POST",
    body,
  })
  const result = (await response.json()) as {
    success?: number
    file?: { url?: string }
    error?: string
  }
  if (!response.ok || !result.file?.url) {
    throw new Error(result.error ?? "Не удалось загрузить изображение")
  }
  return result.file.url
}

export class GalleryTool extends FormBlockTool {
  private images: string[]

  static get toolbox(): ToolboxConfig {
    return { title: "Галерея", icon: "<b>▦</b>" }
  }

  constructor(options: BlockToolConstructorOptions<ToolData>) {
    super(options)
    this.images = Array.isArray(options.data.images)
      ? options.data.images.filter(
          (item): item is string => typeof item === "string",
        )
      : []
  }

  private renderImages(container: HTMLElement) {
    container.innerHTML = ""
    for (const [index, url] of this.images.entries()) {
      const item = document.createElement("div")
      item.className =
        "relative aspect-video overflow-hidden rounded-md bg-muted"
      const image = document.createElement("img")
      image.src = url
      image.alt = ""
      image.className = "h-full w-full object-cover"
      const remove = document.createElement("button")
      remove.type = "button"
      remove.className =
        "absolute right-2 top-2 rounded-md bg-background px-2 py-1 text-xs shadow"
      remove.textContent = "Удалить"
      remove.addEventListener("click", () => {
        this.images.splice(index, 1)
        this.renderImages(container)
      })
      item.append(image, remove)
      container.append(item)
    }
  }

  render() {
    const wrapper = document.createElement("div")
    wrapper.className = "rounded-lg border p-4"
    const grid = document.createElement("div")
    grid.className = "grid gap-3 sm:grid-cols-2"
    this.renderImages(grid)
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.multiple = true
    input.className = "mt-3 block w-full text-sm"
    input.addEventListener("change", async () => {
      const files = [...(input.files ?? [])]
      for (const file of files) this.images.push(await uploadImage(file))
      this.renderImages(grid)
      input.value = ""
    })
    wrapper.append(grid, input)
    this.wrapper = wrapper
    return wrapper
  }

  save() {
    return { images: this.images }
  }
}

export class DuplicateTune implements BlockTune {
  static get isTune() {
    return true
  }

  private api: API
  private block: BlockAPI

  constructor({ api, block }: { api: API; block: BlockAPI }) {
    this.api = api
    this.block = block
  }

  render() {
    return {
      icon: "<b>⧉</b>",
      title: "Дублировать",
      onActivate: () => {
        void this.duplicate()
      },
    }
  }

  private async duplicate() {
    const saved = await this.block.save()
    if (!saved) return
    const index = this.api.blocks.getBlockIndex(this.block.id)
    this.api.blocks.insert(saved.tool, saved.data, {}, index + 1, true)
  }
}
