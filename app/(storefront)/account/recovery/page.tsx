import EmailChallenge from "@/components/platform/EmailChallenge";
export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-6 font-serif text-3xl">Reset your password</h1>
      <EmailChallenge />
    </div>
  );
}
