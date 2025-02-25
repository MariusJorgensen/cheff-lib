
import { useHotkeys } from "react-hotkeys-hook";
import { useToast } from "@/components/ui/use-toast";

interface UseKeyboardShortcutsProps {
  onFilterChange: (filter: string) => void;
  onSearchFocus: () => void;
  onClearSearch: () => void;
  onOpenAddBook: () => void;
}

export function useKeyboardShortcuts({
  onFilterChange,
  onSearchFocus,
  onClearSearch,
  onOpenAddBook,
}: UseKeyboardShortcutsProps) {
  const { toast } = useToast();
  let lastKeyTime = 0;
  let lastKey = '';

  const showToast = (shortcut: string, action: string) => {
    toast({
      description: `Keyboard shortcut: ${shortcut} - ${action}`,
      duration: 1500,
    });
  };

  // Handle 'g' combination shortcuts
  useHotkeys('g', (event) => {
    lastKeyTime = Date.now();
    lastKey = 'g';
  }, { keyup: true });

  // My Borrowed Books
  useHotkeys('b', (event) => {
    if (lastKey === 'g' && Date.now() - lastKeyTime < 500) {
      onFilterChange('my-loans');
      showToast('g + b', 'Switched to My Borrowed Books');
    }
  }, { keyup: true });

  // All Books
  useHotkeys('a', (event) => {
    if (lastKey === 'g' && Date.now() - lastKeyTime < 500) {
      onFilterChange('all');
      showToast('g + a', 'Switched to All Books');
    }
  }, { keyup: true });

  // On Loan
  useHotkeys('l', (event) => {
    if (lastKey === 'g' && Date.now() - lastKeyTime < 500) {
      onFilterChange('borrowed');
      showToast('g + l', 'Switched to On Loan');
    }
  }, { keyup: true });

  // Focus search
  useHotkeys('/', (event) => {
    event.preventDefault();
    onSearchFocus();
    showToast('/', 'Focus search');
  });

  // Clear search
  useHotkeys('escape', () => {
    onClearSearch();
    showToast('Escape', 'Cleared search');
  });

  // Add new book
  useHotkeys('n', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    onOpenAddBook();
    showToast('n', 'Open Add Book dialog');
  });

  // Show help dialog
  useHotkeys('shift+?', () => {
    toast({
      title: "Keyboard Shortcuts",
      description: `
        g + b: My Borrowed Books
        g + a: All Books
        g + l: On Loan
        /: Focus search
        Escape: Clear search
        n: Add new book
        ?: Show this help
      `,
      duration: 5000,
    });
  });
}
