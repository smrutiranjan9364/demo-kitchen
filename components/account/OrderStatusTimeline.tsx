import { ORDER_STATUSES, STATUS_STYLE } from "@/lib/orders";

// The happy path, in order. Cancelled is a terminal branch shown separately.
const STEPS = ORDER_STATUSES.filter((s) => s !== "Cancelled");

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        STATUS_STYLE[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function OrderStatusTimeline({ status }: { status: string }) {
  if (status === "Cancelled") {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
        This order was cancelled. If that&apos;s unexpected, please get in touch and we&apos;ll sort it out.
      </div>
    );
  }
  const current = STEPS.indexOf(status as (typeof STEPS)[number]);
  return (
    <ol className="flex items-start gap-0">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : done || active ? "bg-brand" : "bg-black/10"}`} />
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-brand text-cream"
                    : active
                      ? "bg-white text-brand ring-2 ring-brand"
                      : "bg-white text-gray-400 ring-1 ring-black/10"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? "bg-transparent" : done ? "bg-brand" : "bg-black/10"}`} />
            </div>
            <span className={`mt-2 text-[11px] font-medium sm:text-xs ${active ? "text-brand" : done ? "text-gray-700" : "text-gray-400"}`}>
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
