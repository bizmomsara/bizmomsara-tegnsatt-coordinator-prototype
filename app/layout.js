import "./globals.css";

export const metadata = {
  title: "Tegnsatt – Koordinator prototype",
  description: "Klikkbar prototype for filtre og sortering",
};

export default function RootLayout({ children }) {
  return (
    <html lang="no">
      <body>{children}</body>
    </html>
  );
}

// app/layout.js
import './globals.css'
import { Toaster } from 'sonner'

export default function RootLayout({ children }) {
  return (
    <html lang="no">
      <body>
        <Toaster richColors position="top-center" />
        {children}
      </body>
    </html>
  )
}
