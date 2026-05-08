import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-6">
      <div className="space-y-4 max-w-md">
        <h2 className="text-3xl font-bold tracking-tight">Audit not found</h2>
        <p className="text-muted-foreground leading-relaxed">
          We couldn&apos;t find the audit you&apos;re looking for. The link may be invalid, or the audit might have been removed.
        </p>
        <div className="pt-4">
          <Link href="/audit" className={buttonVariants({ size: "lg" })}>
            Run a new audit
          </Link>
        </div>
      </div>
    </div>
  );
}
