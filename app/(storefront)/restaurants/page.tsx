import RestaurantSearch from "@/components/platform/RestaurantSearch";
export const metadata = {
  title: "Restaurants & food delivery",
  description:
    "Find restaurants, explore Odia food, and check delivery availability in your area.",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <div className="bg-cream-soft">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="mb-2 font-serif text-3xl">Find your next meal</h1>
        <p className="mb-8 text-gray-500">
          Explore restaurants and food delivered to your neighborhood.
        </p>
        <RestaurantSearch initialQuery={q ?? ""} />
      </div>
    </div>
  );
}
