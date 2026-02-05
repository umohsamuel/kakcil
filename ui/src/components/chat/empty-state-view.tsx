"use client";

import Image from "next/image";

export function EmptyStateView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-8 text-center">
      <div className="bg-foreground/5 mb-4 flex h-20 w-20 items-center justify-center rounded-full">
        <Image
          src="/logo.png"
          alt="Kakcil Logo"
          width={40}
          height={40}
          className="invert-100 dark:invert-0"
        />
      </div>
      <h2 className="text-2xl font-bold">No Messages Yet</h2>
      <p className="text-foreground/60 max-w-md">
        Start the conversation by sending a message below.
      </p>
    </div>
  );
}
