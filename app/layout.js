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
