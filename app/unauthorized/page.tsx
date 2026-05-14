import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center space-y-4 text-center px-4">
      <div className="h-20 w-20 rounded-full bg-destructive/10 grid place-items-center mb-2">
        <ShieldAlert className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight">Access Denied</h1>
      <p className="text-muted-foreground max-w-[400px]">
        You do not have the required permissions to access this department. 
        Please contact your administrator if you believe this is a mistake.
      </p>
      <div className="pt-4 flex gap-3">
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
        <Link href="/login">
          <Button>Switch Account</Button>
        </Link>
      </div>
    </div>
  );
}
