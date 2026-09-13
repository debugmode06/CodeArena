"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  title?: string;
  searchTerm?: string;
  entityName?: string;
  createUrl?: string;
  createLabel?: string;
  emptyDescription?: string;
  searchDescription?: string;
  showButton?: boolean;
}

export function EmptyState({
  title = "Nothing found",
  searchTerm = "",
  entityName = "item",
  createUrl = "/create",
  createLabel = "Create",
  emptyDescription,
  searchDescription,
  showButton = true,
}: EmptyStateProps) {
  const defaultEmpty = `Get started by creating your first ${entityName}.`;
  const defaultSearch = `Try adjusting your search terms or create a new ${entityName} to get started.`;

  return (
    <Card className="text-center py-8 sm:py-16 border-2 border-dashed border-border shadow-lg bg-card">
      <CardContent className="space-y-6 sm:space-y-8 px-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-full flex items-center justify-center mx-auto shadow-inner">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full opacity-80 animate-pulse" />
        </div>
        <div className="space-y-4">
          <p className="text-foreground text-2xl sm:text-3xl font-bold">
            {title}
          </p>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {searchTerm
              ? searchDescription || defaultSearch
              : emptyDescription || defaultEmpty}
          </p>
        </div>
        {!searchTerm && showButton && (
          <Link href={createUrl}>
            <Button>{createLabel}</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
