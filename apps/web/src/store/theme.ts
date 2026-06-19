// Tema activo de la app (single-tenant). El tema NO es una preferencia del
// navegador ni del sistema: lo decide el contexto y lo aplica <ThemeController>.
//   - Administrador (/admin, /login): siempre claro.
//   - Páginas públicas: lo elige el rifero (publicDarkMode); por defecto claro.
// La clase `dark` activa los tokens de color oscuros de index.css (darkMode:'class').
const DARK_THEME_COLOR = '#0f172a';
const LIGHT_THEME_COLOR = '#1d4ed8';

export function applyTheme(dark: boolean): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
}
