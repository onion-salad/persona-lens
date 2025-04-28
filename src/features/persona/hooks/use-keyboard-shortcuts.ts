import { useEffect, useCallback } from "react"

interface UseKeyboardShortcutsProps {
  onSearch?: () => void
  onFilter?: () => void
  onClose?: () => void
  onCompare?: () => void
  onToggleExpand?: () => void
}

export function useKeyboardShortcuts({
  onSearch,
  onFilter,
  onClose,
  onCompare,
  onToggleExpand,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // メタキー（MacのCommand、WindowsのCtrl）が押されているか
      const isMeta = event.metaKey || event.ctrlKey

      if (isMeta && event.key === "f") {
        event.preventDefault()
        if (event.shiftKey) {
          onFilter?.()
        } else {
          onSearch?.()
        }
      }

      if (event.key === "Escape") {
        onClose?.()
      }

      if (isMeta && event.key === "c") {
        event.preventDefault()
        onCompare?.()
      }

      if (isMeta && event.key === "e") {
        event.preventDefault()
        onToggleExpand?.()
      }
    },
    [onSearch, onFilter, onClose, onCompare, onToggleExpand]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])
} 