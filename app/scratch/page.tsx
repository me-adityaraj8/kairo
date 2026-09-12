"use client";

import { useState } from "react";
import PixelPanel from "@/components/PixelPanel";
import PixelButton from "@/components/PixelButton";
import PixelInput from "@/components/PixelInput";

export default function ScratchPage() {
  const [value, setValue] = useState("");

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <h1 className="font-pixel text-lg text-gold">Primitives</h1>

      <PixelPanel title="Character">
        <p className="font-mono text-sm text-text">Level 3 Adventurer</p>
        <p className="font-mono text-xs text-muted">247 / 400 XP</p>
      </PixelPanel>

      <PixelPanel>
        <div className="flex flex-col gap-4">
          <PixelInput
            label="Quest title"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Slay the inbox dragon"
          />
          <PixelInput label="Broken field" error="This field cannot be empty" />
          <div className="flex gap-3">
            <PixelButton variant="primary">Post Quest</PixelButton>
            <PixelButton variant="ghost">Cancel</PixelButton>
            <PixelButton variant="danger">Delete</PixelButton>
            <PixelButton variant="primary" disabled>
              Disabled
            </PixelButton>
          </div>
        </div>
      </PixelPanel>
    </main>
  );
}
