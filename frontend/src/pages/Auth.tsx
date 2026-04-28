import { SignIn, SignUp } from "@clerk/clerk-react";

export function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
}

export function SignUpPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}

