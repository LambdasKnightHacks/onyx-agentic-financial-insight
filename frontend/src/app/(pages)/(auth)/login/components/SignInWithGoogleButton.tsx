"use client";
import { Button } from "@/src/components/ui/button";
import { createClient } from "@/src/utils/supabase/client";

const SignInWithGoogleButton = () => {
  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleGoogleSignIn}
    >
      Login with Google
    </Button>
  );
};

export default SignInWithGoogleButton;