"use client";

import { useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/src/components/ui/button";
import { Loader2 } from "lucide-react";

interface PlaidLinkButtonProps {
  onSuccess?: (accounts: any[]) => void;
  onExit?: () => void;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
}

export function PlaidLinkButton({
  onSuccess,
  onExit,
  className,
  variant = "default",
}: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch link token from API
  const fetchLinkToken = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/plaid/create-link-token", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create link token");
      }

      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (error) {
      console.error("Error fetching link token:", error);
      alert("Failed to initialize Plaid Link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle successful bank connection
  const handleOnSuccess = useCallback(
    async (public_token: string, metadata: any) => {
      console.log("Plaid Link Success:", { public_token, metadata });

      try {
        setIsLoading(true);

        // Exchange public token and save connection
        const response = await fetch("/api/plaid/connect-bank", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            publicToken: public_token,
            metadata,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to connect bank account");
        }

        const data = await response.json();
        console.log("Bank connected successfully:", data);

        // Call onSuccess callback with accounts
        if (onSuccess) {
          onSuccess(data.accounts || []);
        }

        alert(
          `✅ Successfully connected to ${
            metadata?.institution?.name || "your bank"
          }!`
        );
      } catch (error) {
        console.error("Error connecting bank:", error);
        alert("Failed to connect bank account. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess]
  );

  // Handle user exit
  const handleOnExit = useCallback(() => {
    console.log("Plaid Link exited");
    if (onExit) {
      onExit();
    }
  }, [onExit]);

  // Initialize Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handleOnSuccess,
    onExit: handleOnExit,
  });

  // Handle button click
  const handleClick = () => {
    if (linkToken && ready) {
      open();
    } else {
      fetchLinkToken();
    }
  };

  // Auto-open when link token is ready
  useState(() => {
    if (linkToken && ready && !isLoading) {
      open();
    }
  });

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || (!!linkToken && !ready)}
      variant={variant}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        "Connect Bank Account"
      )}
    </Button>
  );
}
