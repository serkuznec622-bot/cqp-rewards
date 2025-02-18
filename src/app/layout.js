import {PT_Sans} from "next/font/google";
import "./globals.css";

const ptSans = PT_Sans({
    weight: ["400", "700"],
    subsets: ["latin", "cyrillic"],
    display: "swap"
});

export const metadata = {
  title: "CRYPTO QUEST DEMO"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={ptSans.className}>
        {children}
      </body>
    </html>
  );
}
