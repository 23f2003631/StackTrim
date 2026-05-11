import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center shadow-sm border border-slate-300">
            <FileQuestion className="w-6 h-6 text-slate-700" />
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-medium text-slate-900">
              Page not found
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <p className="text-slate-500 text-sm">
              The audit or page you are looking for does not exist or has been removed.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-100 pt-6">
            <Link 
              href="/" 
              className={buttonVariants({ variant: "outline", className: "bg-white border-slate-200 text-slate-700 hover:bg-slate-50" })}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to home
            </Link>
          </CardFooter>
        </Card>
        
        <p className="text-center text-xs text-slate-400 mt-8">
          StackTrim Operational Intelligence
        </p>
      </div>
    </div>
  );
}
