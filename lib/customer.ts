// The signed-in shopper, resolved once per request. Lives outside lib/store so
// the store stays free of next/headers (tests import the store directly).
import { cache } from "react";
import { getCustomerId } from "@/lib/auth";
import { getCustomer, type Customer } from "@/lib/store";

export const getCurrentCustomer = cache(async (): Promise<Customer | null> => {
  const id = await getCustomerId();
  return id ? ((await getCustomer(id)) ?? null) : null;
});
