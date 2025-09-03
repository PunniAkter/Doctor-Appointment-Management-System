// src/app/auth/login/page.tsx
import LoginClient from "./LoginClient";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const redirect =
    (Array.isArray(searchParams?.redirect)
      ? searchParams.redirect?.[0]
      : searchParams?.redirect) || "";

  return <LoginClient redirect={redirect} />;
}
