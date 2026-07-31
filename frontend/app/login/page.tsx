"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LoginModal } from "@/components/login/login-modal";

// Login now happens through the reflective card modal (opened from the header
// toggle over the hero). Hitting /login directly just opens that modal on a
// bare backdrop; closing it returns to the portfolio.
export default function LoginPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <main id="main-content" className="relative min-h-screen overflow-hidden bg-[#060a16]">
      <LoginModal
        open={open}
        onClose={() => {
          setOpen(false);
          router.push("/");
        }}
      />
    </main>
  );
}
