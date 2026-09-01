import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase-client";

type Profile = {
  id: string;
  full_name: string | null;
  role: "super_admin" | "staff";
  staff_id: string | null;
};

export function useAuth() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile(userId: string, userEmail: string | null) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, staff_id")
        .eq("id", userId)
        .single();

      if (!active) return;
      if (error) {
        console.error("[hooks/use-auth/loadProfile]", error);
        setProfile(null);
      } else {
        setProfile(data as Profile);
      }
      setEmail(userEmail);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        if (active) {
          setLoading(false);
          navigate({ to: "/" });
        }
        return;
      }
      loadProfile(session.user.id, session.user.email ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setProfile(null);
        setEmail(null);
        navigate({ to: "/" });
        return;
      }
      loadProfile(session.user.id, session.user.email ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return { profile, email, loading, signOut };
}
