import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CONTACT } from "@/data/site";

export const metadata: Metadata = {
  title: "Odia Courses — Rosy's Kitchen",
  description:
    "Learn authentic Odia cooking through hands-on courses from Rosy's Kitchen.",
};

const courseImg = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;

type Course = {
  id: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  lessons: number;
  price: number;
  rating: number;
  image: string;
  description: string;
};

const COURSES: Course[] = [
  {
    id: "odia-basics",
    title: "Odia Cooking Basics",
    level: "Beginner",
    duration: "4 weeks",
    lessons: 12,
    price: 1499,
    rating: 4.8,
    image: courseImg("1556910103-1c02745aae4d"),
    description: "Master everyday Odia staples — dalma, santula, pakhala and more.",
  },
  {
    id: "festival-sweets",
    title: "Festival Sweets & Pitha",
    level: "Intermediate",
    duration: "3 weeks",
    lessons: 9,
    price: 1899,
    rating: 4.9,
    image: courseImg("1607013251379-e6eecfffe234"),
    description: "Make khaja, chhena poda, arisa and traditional pithas at home.",
  },
  {
    id: "spices-masterclass",
    title: "Spices & Masala Masterclass",
    level: "Intermediate",
    duration: "2 weeks",
    lessons: 6,
    price: 999,
    rating: 4.7,
    image: courseImg("1514986888952-8cd320577b68"),
    description: "Blend authentic Odia spice mixes and understand every flavour.",
  },
  {
    id: "thali-feast",
    title: "The Complete Odia Thali",
    level: "Advanced",
    duration: "5 weeks",
    lessons: 15,
    price: 2499,
    rating: 4.9,
    image: courseImg("1543353071-873f17a7a088"),
    description: "Cook a full festive thali — from starters to sweets — with confidence.",
  },
];

const HIGHLIGHTS = [
  { icon: "🎥", title: "Live & recorded", text: "Attend live sessions or learn at your own pace." },
  { icon: "👩‍🍳", title: "Taught by Rosy", text: "Guided by our head chef and her family recipes." },
  { icon: "📜", title: "Certificate", text: "Earn a completion certificate for every course." },
];

const levelColor: Record<Course["level"], string> = {
  Beginner: "bg-rating/10 text-rating",
  Intermediate: "bg-amber-100 text-amber-700",
  Advanced: "bg-brand/10 text-brand",
};

export default function CoursesPage() {
  return (
    <div className="bg-cream-soft">
      {/* Hero */}
      <div className="bg-brand text-cream">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <nav className="mb-3 text-xs text-cream/70">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-cream">Odia Courses</span>
          </nav>
          <h1 className="max-w-2xl font-serif text-3xl leading-tight sm:text-5xl">
            Learn to cook authentic Odia food
          </h1>
          <p className="mt-4 max-w-xl text-sm text-cream/85 sm:text-base">
            Hands-on courses that pass down generations of heritage recipes — from
            everyday classics to festive feasts.
          </p>
        </div>
      </div>

      {/* Highlights */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {HIGHLIGHTS.map((h) => (
            <div
              key={h.title}
              className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cream-soft text-xl">
                {h.icon}
              </span>
              <div>
                <h3 className="font-serif text-base text-gray-900">{h.title}</h3>
                <p className="mt-0.5 text-sm text-gray-500">{h.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Course list */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <h2 className="mb-6 font-serif text-2xl text-gray-900">Available courses</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {COURSES.map((c) => (
            <article
              key={c.id}
              className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={c.image}
                  alt={c.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold ${levelColor[c.level]}`}
                >
                  {c.level}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-serif text-lg leading-tight text-gray-900">
                  {c.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                  {c.description}
                </p>

                <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                  <span>⏱ {c.duration}</span>
                  <span>📚 {c.lessons} lessons</span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
                  <span className="flex items-center gap-1 text-xs">
                    <span className="rounded bg-rating px-1.5 py-0.5 font-semibold text-white">
                      ★ {c.rating.toFixed(1)}
                    </span>
                  </span>
                  <span className="font-bold text-gray-900">₹{c.price}</span>
                </div>

                <button className="mt-4 w-full bg-brand py-2.5 text-[11px] font-semibold tracking-widest text-cream transition hover:bg-brand-light">
                  ENROLL NOW
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <h2 className="font-serif text-2xl text-gray-900">
            Want a custom or group class?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600">
            We offer private and corporate cooking sessions. Reach out and we&apos;ll
            tailor a course for you.
          </p>
          <a
            href={`mailto:${CONTACT.email}?subject=Odia Course Enquiry`}
            className="mt-6 inline-block bg-brand px-6 py-3 text-xs font-semibold tracking-widest text-cream transition hover:bg-brand-light"
          >
            CONTACT US
          </a>
        </div>
      </section>
    </div>
  );
}
