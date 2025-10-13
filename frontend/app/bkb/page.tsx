"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BKBPage() {
  return (
    <div className="flex flex-col items-start gap-4 p-8">
      <h1 className="text-2xl font-bold">BKB</h1>
      <div className="flex flex-col gap-2">
        <Link href="/bkb/input">
          <Button variant="outline">Input BKB</Button>
        </Link>
        <Link href="/bkb/monitoring">
          <Button variant="outline">Monitoring BKB</Button>
        </Link>
      </div>
    </div>
  );
}
