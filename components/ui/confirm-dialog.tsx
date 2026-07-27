"use client"

import { useCallback, useState, type ReactNode } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface ConfirmOptions {
  title?: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Styles the confirm button as destructive. Default true — most uses are deletes. */
  destructive?: boolean
  /**
   * When set, the confirm button stays disabled until the user types this
   * exact text. Used for the irreversible actions (deleting a class, promoting
   * a student) where a single click is too easy.
   */
  requireText?: string
}

type Resolver = (ok: boolean) => void

/**
 * Promise-based confirmation dialog.
 *
 *   const [confirm, confirmDialog] = useConfirm()
 *   if (!(await confirm({ title: "Delete this?" }))) return
 *   …
 *   return <>{confirmDialog}…</>
 *
 * Replaces `window.confirm`, which can't be styled, can't require typed
 * acknowledgement, and is suppressible by the browser. Chaining several calls
 * gives the multi-step confirmation the client asked for on student promotion.
 */
export function useConfirm(): [(options?: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [state, setState] = useState<{ options: ConfirmOptions; resolve: Resolver } | null>(null)
  const [typed, setTyped] = useState("")

  const confirm = useCallback(
    (options: ConfirmOptions = {}) =>
      new Promise<boolean>((resolve) => {
        setTyped("")
        setState({ options, resolve })
      }),
    [],
  )

  const close = (ok: boolean) => {
    state?.resolve(ok)
    setState(null)
    setTyped("")
  }

  const options = state?.options ?? {}
  const needsText = Boolean(options.requireText)
  const textMatches = !needsText || typed.trim() === options.requireText

  const dialog = (
    <AlertDialog open={state !== null} onOpenChange={(open) => !open && close(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title ?? "Are you sure?"}</AlertDialogTitle>
          {options.description && (
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">{options.description}</div>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {needsText && (
          <div className="space-y-2">
            <Label htmlFor="confirm-text">
              Type <span className="font-mono font-semibold">{options.requireText}</span> to confirm
            </Label>
            <Input
              id="confirm-text"
              value={typed}
              autoComplete="off"
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => close(false)}>
            {options.cancelLabel ?? "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={!textMatches}
            className={
              options.destructive === false ? undefined : "bg-red-600 hover:bg-red-700 text-white"
            }
            onClick={(e) => {
              // Radix closes on click; block it when the typed guard isn't met.
              if (!textMatches) {
                e.preventDefault()
                return
              }
              close(true)
            }}
          >
            {options.confirmLabel ?? "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return [confirm, dialog]
}
