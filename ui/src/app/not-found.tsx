import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { AsciiGravity } from "@/components/ascii/ascii-gravity";

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 md:px-6">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-16 text-center">
        <AsciiGravity
          lines={["404"]}
          cellSize={8}
          mobileCellSize={5}
          className="h-[38vh] max-w-4xl"
          label="404"
        />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">
            The council couldn&apos;t find this page
          </h1>
          <p className="text-muted-foreground text-sm">
            It may have been moved or deleted.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
          <Button asChild>
            <Link href="/chat">Open Kakcil</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
