import React from "react";
import ConstraintsCard from "./constraint-card";
import BoilerplateCard from "./boilerplate-card";
import IOFormatCard from "./ioformat-card";
import TestCaseCard from "./test-case-card";

export default function CodingCard() {
  return (
    <div className="space-y-6">
      <ConstraintsCard />
      <BoilerplateCard />
      <IOFormatCard />
      <TestCaseCard />
    </div>
  );
}
