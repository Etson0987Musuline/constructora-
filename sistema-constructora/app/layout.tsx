import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Constructora | Clientes y obras", description: "Sistema de gestión con Factory Method y Abstract Factory" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
