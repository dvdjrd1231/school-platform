"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Table as TableIcon,
  Underline,
  Undo2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  /** Minimum editing height in rem. */
  minHeight?: number
  className?: string
}

interface ToolButton {
  icon: typeof Bold
  label: string
  run: () => void
}

/**
 * A small rich-text editor for lesson content.
 *
 * Built on contentEditable and execCommand. execCommand is deprecated, but it
 * is implemented everywhere, needs no dependency, and produces exactly the
 * simple markup the sanitiser allows — headings, lists, links, images, tables.
 * A full editor framework would be several hundred kilobytes for a box teachers
 * type a lesson into.
 *
 * Whatever it produces is sanitised server-side before storage, so a paste from
 * Word can't smuggle anything through.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write the lesson…",
  minHeight = 16,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [isEmpty, setIsEmpty] = useState(!value)

  // Only write into the DOM when the incoming value differs from what's already
  // there. Assigning innerHTML on every render would reset the caret to the
  // start of the document on each keystroke.
  useEffect(() => {
    const element = ref.current
    if (element && element.innerHTML !== value) {
      element.innerHTML = value || ""
      setIsEmpty(!element.textContent?.trim())
    }
  }, [value])

  const emit = useCallback(() => {
    const element = ref.current
    if (!element) return
    setIsEmpty(!element.textContent?.trim() && !element.querySelector("img, table"))
    onChange(element.innerHTML)
  }, [onChange])

  /** Run a formatting command against the current selection. */
  const exec = useCallback(
    (command: string, argument?: string) => {
      ref.current?.focus()
      document.execCommand(command, false, argument)
      emit()
    },
    [emit],
  )

  const insertLink = useCallback(() => {
    const url = window.prompt("Link address", "https://")
    if (!url) return
    // Only http(s) and mailto survive sanitising; rejecting here too means the
    // teacher finds out immediately rather than on save.
    if (!/^(https?:|mailto:)/i.test(url)) {
      window.alert("Links must start with http://, https:// or mailto:")
      return
    }
    exec("createLink", url)
  }, [exec])

  const insertImage = useCallback(() => {
    const url = window.prompt("Image address", "https://")
    if (!url) return
    if (!/^https?:/i.test(url)) {
      window.alert("Image links must start with http:// or https://")
      return
    }
    exec("insertImage", url)
  }, [exec])

  const insertTable = useCallback(() => {
    const rows = Number(window.prompt("How many rows?", "3"))
    const columns = Number(window.prompt("How many columns?", "3"))
    if (!rows || !columns || rows < 1 || columns < 1) return

    const header = `<tr>${Array.from({ length: columns }, (_, i) => `<th>Column ${i + 1}</th>`).join("")}</tr>`
    const body = Array.from(
      { length: rows },
      () => `<tr>${Array.from({ length: columns }, () => "<td>&nbsp;</td>").join("")}</tr>`,
    ).join("")

    exec("insertHTML", `<table><thead>${header}</thead><tbody>${body}</tbody></table><p><br></p>`)
  }, [exec])

  const groups: ToolButton[][] = [
    [
      { icon: Undo2, label: "Undo", run: () => exec("undo") },
      { icon: Redo2, label: "Redo", run: () => exec("redo") },
    ],
    [
      { icon: Bold, label: "Bold", run: () => exec("bold") },
      { icon: Italic, label: "Italic", run: () => exec("italic") },
      { icon: Underline, label: "Underline", run: () => exec("underline") },
    ],
    [
      { icon: Heading1, label: "Heading 1", run: () => exec("formatBlock", "<h2>") },
      { icon: Heading2, label: "Heading 2", run: () => exec("formatBlock", "<h3>") },
      { icon: Heading3, label: "Heading 3", run: () => exec("formatBlock", "<h4>") },
      { icon: Quote, label: "Quote", run: () => exec("formatBlock", "<blockquote>") },
    ],
    [
      { icon: List, label: "Bulleted list", run: () => exec("insertUnorderedList") },
      { icon: ListOrdered, label: "Numbered list", run: () => exec("insertOrderedList") },
    ],
    [
      { icon: LinkIcon, label: "Insert link", run: insertLink },
      { icon: ImageIcon, label: "Insert image", run: insertImage },
      { icon: TableIcon, label: "Insert table", run: insertTable },
    ],
  ]

  return (
    <div className={cn("rounded-md border", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex items-center gap-0.5">
            {groupIndex > 0 && <span className="mx-1 h-5 w-px bg-border" aria-hidden />}
            {group.map((tool) => (
              <Button
                key={tool.label}
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title={tool.label}
                aria-label={tool.label}
                // Keep the selection: a button taking focus would collapse it,
                // and the command would then apply to nothing.
                onMouseDown={(e) => e.preventDefault()}
                onClick={tool.run}
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        ))}
      </div>

      <div className="relative">
        {isEmpty && (
          <p className="pointer-events-none absolute left-3 top-3 text-sm text-muted-foreground">
            {placeholder}
          </p>
        )}
        <div
          ref={ref}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label="Lesson content"
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          // Paste as plain text. Pasting from Word otherwise drags in a page of
          // inline styles and Office XML that the sanitiser strips anyway,
          // leaving the teacher wondering why their formatting vanished.
          onPaste={(e) => {
            e.preventDefault()
            const text = e.clipboardData.getData("text/plain")
            document.execCommand("insertText", false, text)
            emit()
          }}
          className="prose prose-sm prose-emerald max-w-none p-3 focus:outline-none"
          style={{ minHeight: `${minHeight}rem` }}
        />
      </div>
    </div>
  )
}

/**
 * Render stored lesson HTML.
 *
 * The value is sanitised on the way into the database, so this is displaying
 * content that has already been cleaned rather than trusting it here.
 */
export function RichTextContent({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn("prose prose-emerald max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
