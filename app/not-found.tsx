import Link from "next/link";
import { FileQuestion, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground/50" />
      <h1 className="mt-6 text-4xl font-bold tracking-tight">
        Hmm, this page doesn&apos;t exist.
      </h1>
      <p className="mt-3 max-w-md text-lg text-muted-foreground">
        You might have followed an old link or typed a wrong address.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">
            Go home <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/contact">
            Contact us <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
