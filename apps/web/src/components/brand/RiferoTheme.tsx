import { useEffect } from 'react';

// Aplica los colores de marca del rifero como variables CSS en un contenedor.
// Las páginas públicas del rifero usan estos colores para sentirse "propias".
export function RiferoTheme({
  primaryColor,
  secondaryColor,
  children,
}: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const root = document.documentElement;
    if (primaryColor) root.style.setProperty('--rifero-primary', primaryColor);
    if (secondaryColor) root.style.setProperty('--rifero-secondary', secondaryColor);
    return () => {
      root.style.removeProperty('--rifero-primary');
      root.style.removeProperty('--rifero-secondary');
    };
  }, [primaryColor, secondaryColor]);

  return (
    <div
      style={
        {
          '--rifero-primary': primaryColor ?? '#1d4ed8',
          '--rifero-secondary': secondaryColor ?? '#0f172a',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
