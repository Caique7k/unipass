import * as React from "react";
import { cn } from "@/lib/utils";

export function Pagination({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

export function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

export function PaginationItem(props: React.ComponentProps<"li">) {
  return <li {...props} />;
}

export function PaginationLink({
  isActive,
  className,
  ...props
}: React.ComponentProps<"button"> & { isActive?: boolean }) {
  return (
    <button
      className={cn(
        "px-3 py-1 text-sm rounded-md border",
        isActive ? "bg-primary text-white" : "bg-background",
        className,
      )}
      {...props}
    />
  );
}

export function PaginationPrevious(props: React.ComponentProps<"button">) {
  return <PaginationLink {...props}>Anterior</PaginationLink>;
}

export function PaginationNext(props: React.ComponentProps<"button">) {
  return <PaginationLink {...props}>Próxima</PaginationLink>;
}
