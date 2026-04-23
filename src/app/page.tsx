import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "lucide-react";
import { PrivateTokenForm } from "@/components/auth/private-token-form";
import { ModeToggle } from "@/components/mode-toggle";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Navigation */}
      <header className="flex h-16 items-center justify-between border-b bg-background px-6 md:px-10">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-foreground">HS Toolkit</span>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="https://github.com/devadigax/hs-toolkit" target="_blank">
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">Open Source</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-4 md:p-10">
        <div className="grid w-full max-w-5xl grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">

          {/* Left Column: Value Prop */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                HubSpot Toolkit dashboard application.
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Search, analyze, and manage your contacts and deals with a crystal clear interface. Securely connect with your Private Access Token.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-base font-medium text-foreground">Secure Client-Side Storage</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-base font-medium text-foreground">Direct API Connection</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Privacy First:</span> Your token is stored locally in your browser. We never see or save your credentials on our servers.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="flex items-center justify-center lg:justify-end">
            <Card className="w-full max-w-md shadow-2xl">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                <CardDescription className="text-base">Login to access your HS Toolkit dashboard</CardDescription>
              </CardHeader>
              <CardContent className="pb-8 space-y-6">
                <Button asChild className="w-full h-11 text-base shadow-sm hover:shadow-md transition-all">
                  <Link href="/api/auth/login" prefetch={false}>Login with HubSpot (OAuth)</Link>
                </Button>

                <PrivateTokenForm />

                <div className="mt-6 text-center text-xs text-muted-foreground">
                  By clicking continue, you agree to our <span className="underline hover:text-foreground cursor-pointer">Terms of Service</span> and <span className="underline hover:text-foreground cursor-pointer">Privacy Policy</span>.
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} HS Toolkit. Open Source Software.</p>
      </footer>
    </div>
  );
}
