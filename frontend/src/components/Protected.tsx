import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import type { PropsWithChildren } from "react";

export function Protected({ children }: PropsWithChildren) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

