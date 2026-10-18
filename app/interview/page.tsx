import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { InterviewApp } from "./interview-app";

export const metadata: Metadata = {
  title: "模擬面試 — Rehearse",
};

export default function InterviewPage() {
  return (
    <>
      <SiteHeader showNav={false} />
      <main className="flex-1">
        <InterviewApp />
      </main>
      <SiteFooter />
    </>
  );
}
