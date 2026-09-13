"use client";

import { useFormContext } from "react-hook-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

export default function IOFormatCard() {
  const { control } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pencil className="h-5 w-5 text-primary" />
          Input & Output Format
        </CardTitle>
        <CardDescription>
          Define how inputs and outputs should be structured
        </CardDescription>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="inputFormat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Input Format</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="e.g., Two integers a and b"
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="outputFormat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Output Format</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="e.g., An integer representing their sum"
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
