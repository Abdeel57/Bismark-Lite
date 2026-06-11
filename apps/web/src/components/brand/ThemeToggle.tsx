import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/store/theme';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useThemeStore();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} className={className} aria-label="Cambiar tema">
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
