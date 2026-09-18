"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, inputClass, Notice, useRemote } from "./UI";
import { useLocalStorageState } from "@/components/useLocalStorageState";
type Data = {
  restaurants: {
    id: string;
    name: string;
    description: string;
    cuisine: string;
    delivery_fee: number;
    eta_minutes: number;
    rating: number;
    open: boolean;
  }[];
  total: number;
  page: number;
};
export default function RestaurantSearch({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const [pincode, setPincode] = useLocalStorageState("ok-location", "");
  const [query, setQuery] = useState(initialQuery),
    [term, setTerm] = useState(initialQuery),
    [sort, setSort] = useState("name"),
    [open, setOpen] = useState(false),
    [page, setPage] = useState(1);
  const { data, error, refresh } = useRemote<Data>(
    `/api/restaurants?q=${encodeURIComponent(term)}&pincode=${encodeURIComponent(pincode)}&sort=${sort}&open=${open}&page=${page}`,
  );
  return (
    <div>
      <form
        className="mb-6 grid items-end gap-3 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          setTerm(query);
          setPage(1);
        }}
      >
        <label className="text-sm sm:col-span-2">
          Restaurant, food or cuisine
          <input
            type="search"
            className={inputClass}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Odia dishes, sweets, restaurants…"
          />
        </label>
        <label className="text-sm">
          Delivery pincode
          <input
            className={inputClass}
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value.replace(/\D/g, ""));
              setPage(1);
            }}
            placeholder="751001"
          />
        </label>
        <Button type="submit">Search</Button>
      </form>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-sm">
          Sort{" "}
          <select
            className="rounded-lg border border-black/10 p-2"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="name">Name</option>
            <option value="rating">Top rated</option>
            <option value="time">Fastest delivery</option>
            <option value="fee">Lowest delivery fee</option>
          </select>
        </label>
        <label className="text-sm">
          <input
            type="checkbox"
            checked={open}
            onChange={(e) => {
              setOpen(e.target.checked);
              setPage(1);
            }}
          />{" "}
          Open now
        </label>
      </div>
      <Notice error={error} loading={!data && !error} />
      {error ? <Button onClick={() => void refresh()}>Try again</Button> : null}
      {data ? (
        <>
          <p className="mb-4 text-sm text-gray-500">
            {data.total} restaurants{pincode ? ` delivering to ${pincode}` : ""}
          </p>
          {!data.restaurants.length ? (
            <div className="rounded-xl bg-white p-10 text-center">
              <h2 className="font-serif text-xl">No restaurants found</h2>
              <p className="mt-2 text-sm text-gray-500">
                Try another food, cuisine or delivery pincode.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.restaurants.map((r) => (
                <Link
                  key={r.id}
                  href={`/restaurants/${r.id}`}
                  className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:ring-brand/40"
                >
                  <div
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream text-3xl"
                    aria-hidden
                  >
                    🍲
                  </div>
                  <div className="flex justify-between gap-2">
                    <h2 className="font-serif text-xl">{r.name}</h2>
                    <span className="text-xs text-rating">
                      {r.rating > 0 ? `★ ${r.rating.toFixed(1)}` : "New"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{r.cuisine}</p>
                  <p className="mt-3 text-sm">
                    {r.eta_minutes} min · Delivery ₹{r.delivery_fee}
                  </p>
                  <p
                    className={`mt-2 text-xs font-semibold ${r.open ? "text-rating" : "text-red-700"}`}
                  >
                    {r.open ? "Open now" : "Currently closed"}
                  </p>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="py-2">Page {page}</span>
            <Button
              disabled={page * 12 >= data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
