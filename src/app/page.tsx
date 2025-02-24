import { auth } from "@/auth";
import React from "react";

export default async function UserPage() {
  const session = await auth();

  return (
    <div>
      {session ? (
        <>
          <h1>Welcome, {session.user?.firstName || session.user?.username}!</h1>

          <pre>{JSON.stringify(session, null, 2)}</pre>
        </>
      ) : (
        <p>You are not logged in zzz.</p>
      )}
    </div>
  );
}
