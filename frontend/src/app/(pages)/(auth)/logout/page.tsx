'use client';
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/utils/supabase/client";

const LogoutPage = () => {
    const router = useRouter();

    useEffect(() => {
        const handleLogout = async () => {
            const supabase = createClient();
            
            // Sign out with global scope to revoke all tokens
            await supabase.auth.signOut({ scope: 'global' });
            
            // Clear all Supabase-related items from storage
            if (typeof window !== 'undefined') {
                // Clear localStorage
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-')) {
                        localStorage.removeItem(key);
                    }
                });
                
                // Clear sessionStorage
                Object.keys(sessionStorage).forEach(key => {
                    if (key.startsWith('sb-')) {
                        sessionStorage.removeItem(key);
                    }
                });
            }
            
            // Small delay to ensure everything is cleared
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Force a hard navigation to login
            window.location.href = '/login';
        };

        handleLogout();
    }, [router]);

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