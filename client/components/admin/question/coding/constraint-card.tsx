"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Pencil, X } from "lucide-react";

export default function ConstraintsCard() {
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "constraints",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pencil className="h-5 w-5 text-primary" />
          Constraints
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, i) => (
          <FormField
            key={field.id}
            control={control}
            name={`constraints.${i}`}
            render={({ field: fieldProps }) => (
              <FormItem className="relative">
                <FormControl>
                  <Input
                    {...fieldProps}
                    className="pr-10"
                    placeholder={`Constraint ${i + 1}`}
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                >
                  <X size={16} />
                </button>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <Button
          type="button"
          onClick={() => append("")}
          variant="outline"
          size="sm"
        >
          + Add Constraint
        </Button>
      </CardContent>
    </Card>
  );
}
