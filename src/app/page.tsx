import Link from "next/link";

import { LatestPost } from "~/app/_components/post";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <main style={{display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #2e026d, #15162c)', color: 'white'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3rem', padding: '4rem 1rem'}}>
          <h1 style={{fontSize: '3rem', fontWeight: '800', letterSpacing: '-0.025em'}}>
            Create <span style={{color: 'hsl(280,100%,70%)'}}>T3</span> App
          </h1>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem'}}>
            <Link
              style={{display: 'flex', maxWidth: '20rem', flexDirection: 'column', gap: '1rem', borderRadius: '0.75rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '1rem', textDecoration: 'none', color: 'inherit', transition: 'background-color 0.2s'}}
              href="https://create.t3.gg/en/usage/first-steps"
              target="_blank"
            >
              <h3 style={{fontSize: '1.5rem', fontWeight: '700'}}>First Steps →</h3>
              <div style={{fontSize: '1.125rem'}}>
                Just the basics - Everything you need to know to set up your
                database and authentication.
              </div>
            </Link>
            <Link
              style={{display: 'flex', maxWidth: '20rem', flexDirection: 'column', gap: '1rem', borderRadius: '0.75rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '1rem', textDecoration: 'none', color: 'inherit', transition: 'background-color 0.2s'}}
              href="https://create.t3.gg/en/introduction"
              target="_blank"
            >
              <h3 style={{fontSize: '1.5rem', fontWeight: '700'}}>Documentation →</h3>
              <div style={{fontSize: '1.125rem'}}>
                Learn more about Create T3 App, the libraries it uses, and how
                to deploy it.
              </div>
            </Link>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'}}>
            <p style={{fontSize: '1.5rem', color: 'white'}}>
              {hello ? hello.greeting : "Loading tRPC query..."}
            </p>

            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem'}}>
              <p style={{textAlign: 'center', fontSize: '1.5rem', color: 'white'}}>
                {session && <span>Logged in as {session.user?.name}</span>}
              </p>
              <Link
                href={session ? "/api/auth/signout" : "/api/auth/signin"}
                style={{borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.75rem 2.5rem', fontWeight: '600', textDecoration: 'none', color: 'inherit', transition: 'background-color 0.2s'}}
              >
                {session ? "Sign out" : "Sign in"}
              </Link>
            </div>
          </div>

          {session?.user && <LatestPost />}
        </div>
      </main>
    </HydrateClient>
  );
}