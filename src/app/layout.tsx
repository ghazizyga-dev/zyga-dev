import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { IamService } from "~/lib/domains/iam";
import { Header } from "~/app/_components/header";
import { LandingPage } from "~/app/_components/landing-page";

export const metadata: Metadata = {
  title: "Ai Boilerplate",
  description: "Automate your sales prospection with AI-powered messaging",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await IamService.getCurrentUser();

  if (!currentUser) {
    return (
      <html lang="en" className={`${geist.variable}`}>
        <body className="bg-gradient-to-b from-[#2e026d] to-[#15162c]">
          <LandingPage />
        </body>
      </html>
    );
  }

  const { remainingCredits } = await IamService.checkCredits(currentUser.id);

  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <Header
          userName={currentUser.name}
          userImage={currentUser.image ?? null}
          remainingCredits={remainingCredits}
        />
        {children}
      </body>
    </html>
  );
}
