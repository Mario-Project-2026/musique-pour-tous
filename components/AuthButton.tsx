"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <button disabled className="px-4 py-2 bg-gray-400 text-white rounded">Loading...</button>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm">{session.user?.email}</span>
        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Dashboard
        </Link>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("github")}
      className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 flex items-center gap-2"
    >
      <span>Login with GitHub</span>
    </button>
  );
}
