import { getOrders } from "@/lib/store";
import { requireRight } from "@/lib/guard";
import OrdersAdmin from "@/components/admin/OrdersAdmin";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  await requireRight("orders");
  const orders = await getOrders();

  return (
    <div>
      <h1 className="font-serif text-2xl text-gray-900">Orders</h1>
      <p className="mt-1 text-sm text-gray-500">{orders.length} orders</p>
      <OrdersAdmin orders={orders} />
    </div>
  );
}
