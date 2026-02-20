"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Syringe, LogIn, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <Card className="qdoc-card w-full max-w-md border-none">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#116cb6]">
            <Syringe className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl text-[#12455a]">
            Welcome back
          </CardTitle>
          <p className="mt-1 text-sm text-[#5a7d8e]">
            Sign in to access your vaccine records
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-[#fde8e8] px-4 py-3 text-sm text-[#d64545]">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-[#12455a]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
                className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-[#12455a]">
                Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="border-[#c2dcee] pr-10 focus:border-[#116cb6] focus:ring-[#116cb6]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a7d8e] hover:text-[#12455a]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#116cb6] text-white hover:bg-[#0d4d8b]"
              size="lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Sign In
            </Button>

            <p className="text-center text-sm text-[#5a7d8e]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-[#116cb6] hover:text-[#0d4d8b] hover:underline"
              >
                Create one
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
