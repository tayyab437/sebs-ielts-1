"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {}

function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <div
      data-slot="scroll-area"
      className={cn("relative overflow-y-auto overflow-x-hidden h-full w-full", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function ScrollBar({ ...props }: any) {
  return null
}

export { ScrollArea, ScrollBar }
