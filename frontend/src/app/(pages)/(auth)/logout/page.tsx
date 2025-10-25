'use client';
import { useEffect } from "react";
import { signout } from "@/src/lib/auth-actions";

const LogoutPage = () => {
    useEffect(() => {
        // Call the signout server action
        signout();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Signing you out...</p>
            </div>
        </div>
    );
};

export default LogoutPage;