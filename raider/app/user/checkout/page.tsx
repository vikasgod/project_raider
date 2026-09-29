import CheckOutContent from "@/components/checkOutContent";
import React, { Suspense } from "react";

function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckOutContent />
    </Suspense>
  );
}

export default Page;
