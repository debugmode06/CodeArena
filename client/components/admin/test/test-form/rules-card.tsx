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
import { ScrollText, X, Plus } from "lucide-react";

export default function RulesCard() {
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "rules",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" />
          Rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, i) => (
          <FormField
            key={field.id}
            control={control}
            name={`rules.${i}`}
            render={({ field: fieldProps }) => (
              <FormItem className="relative">
                <FormControl>
                  <Input
                    {...fieldProps}
                    className="pr-10"
                    placeholder={`Rule ${i + 1}`}
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
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </CardContent>
    </Card>
  );
}
