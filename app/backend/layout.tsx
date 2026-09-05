import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata("/backend");

export default function BackendLayout({ children }: { children: React.ReactNode }) {
  return children;
}
