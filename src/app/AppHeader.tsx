import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function AppHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/quotes" className="text-lg font-bold text-stone-900">
          Handyman Quotes
        </Link>
        {user && (
          <div className="flex items-center gap-4 text-sm text-stone-600">
            <span>{user.name}</span>
            <form action={logoutAction}>
              <button type="submit" className="text-brand-700 hover:underline">
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
