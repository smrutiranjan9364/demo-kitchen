import { api, body, sameOrigin } from "@/lib/api";
import { getCustomerId } from "@/lib/auth";
import { quoteOrder } from "@/lib/platform";
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    return Response.json(
      await quoteOrder(await body(request), await getCustomerId()),
    );
  });
}
