"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Syringe, UserPlus, Loader2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await register(firstName, lastName, email, password);
    } catch (err: any) {
      setError(err.message || "Registration failed");
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
            Create your account
          </CardTitle>
          <p className="mt-1 text-sm text-[#5a7d8e]">
            Join QDoc to track your immunization history
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-[#fde8e8] px-4 py-3 text-sm text-[#d64545]">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName" className="text-[#12455a]">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                  className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-[#12455a]">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                  className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
                />
              </div>
            </div>

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
                  placeholder="At least 6 characters"
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

            <div>
              <Label htmlFor="confirmPassword" className="text-[#12455a]">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                className="mt-1 border-[#c2dcee] focus:border-[#116cb6] focus:ring-[#116cb6]"
              />
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
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Create Account
            </Button>

            <p className="text-center text-sm text-[#5a7d8e]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-[#116cb6] hover:text-[#0d4d8b] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
