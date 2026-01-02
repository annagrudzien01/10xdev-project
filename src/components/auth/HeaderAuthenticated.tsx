import { useState } from "react";
import { Button } from "@/components/ui/button";

interface HeaderAuthenticatedProps {
  userEmail: string;
}

export default function HeaderAuthenticated({ userEmail }: HeaderAuthenticatedProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // TODO: Replace with actual API call
      // await fetch('/api/auth/logout', {
      //   method: 'POST',
      //   credentials: 'include',
      // });

      // Simulate logout for now
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Redirect anyway for better UX
      window.location.href = "/";
    }
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and app name */}
          <div className="flex items-center space-x-2">
            <a href="/profiles" className="flex items-center space-x-2 hover:opacity-80">
              <span className="text-2xl font-bold text-primary">Rytmik</span>
            </a>
          </div>

          {/* User info and logout */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">{userEmail}</span>
            <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
