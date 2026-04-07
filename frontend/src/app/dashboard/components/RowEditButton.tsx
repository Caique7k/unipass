"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RowEditButton({
  onClick,
  label = "Editar",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="cursor-pointer rounded-xl"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Pencil className="size-4" />
    </Button>
  );
}
