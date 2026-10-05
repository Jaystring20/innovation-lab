'use client'

import React, { ReactNode } from 'react'

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
  className?: string
}

interface TabsListProps {
  children: ReactNode
  className?: string
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
}

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export function Tabs({
  value,
  onValueChange,
  children,
  className = '',
}: TabsProps) {
  return (
    <div className={`w-full ${className}`} data-value={value}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { value, onValueChange })
        }
        return child
      })}
    </div>
  )
}

export function TabsList({
  children,
  className = '',
}: TabsListProps) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 dark:bg-gray-800 ${className}`}
      role="tablist"
    >
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  children,
  className = '',
}: TabsTriggerProps & { value?: string; onValueChange?: (v: string) => void }) {
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm data-[state=active]:focus-visible:ring-gray-950 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-gray-50 dark:data-[state=active]:focus-visible:ring-gray-300 ${className}`}
      role="tab"
      aria-selected={false}
      onClick={() => {
        // This will be handled by parent Tabs component
      }}
      data-value={value}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  children,
  className = '',
}: TabsContentProps & { value?: string }) {
  return (
    <div
      className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 ${className}`}
      role="tabpanel"
      data-value={value}
    >
      {children}
    </div>
  )
}
