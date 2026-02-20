import Link from "next/link";
import { Users, Upload, Syringe, BarChart3, Bell, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Patient Profiles",
    description: "Add patients via form, CSV upload, or browse mock profiles.",
    icon: Users,
    href: "/patients",
    color: "#116cb6",
    bgColor: "#d6e6f2",
  },
  {
    title: "Vaccine Eligibility",
    description: "Rule-based engine determines which vaccines are due or overdue.",
    icon: Syringe,
    href: "/eligibility",
    color: "#8fc748",
    bgColor: "#e1f5c6",
  },
  {
    title: "Immunization Timeline",
    description: "Visual, color-coded timeline of vaccination history.",
    icon: BarChart3,
    href: "/timeline",
    color: "#f2c14e",
    bgColor: "#fef9e7",
  },
  {
    title: "Smart Reminders",
    description: "Automated alerts for upcoming and overdue vaccinations.",
    icon: Bell,
    href: "/reminders",
    color: "#d64545",
    bgColor: "#fde8e8",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#d6e6f2] px-4 py-1.5 text-sm font-medium text-[#116cb6]">
          <Syringe className="h-4 w-4" />
          Smart Vaccine Management
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#12455a] sm:text-5xl">
          QDoc{" "}
          <span className="text-[#116cb6]">Vaccine Eligibility</span>
          <br />& Reminder System
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-[#5a7d8e]">
          Determine vaccine eligibility, track immunization history, and never
          miss a booster again. Built for patients and clinics alike.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/patients">
            <Button
              size="lg"
              className="bg-[#116cb6] px-8 text-white hover:bg-[#0d4d8b] transition-colors"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <Card className="qdoc-card group h-full cursor-pointer border-none">
              <CardHeader className="pb-3">
                <div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: feature.bgColor }}
                >
                  <feature.icon
                    className="h-6 w-6"
                    style={{ color: feature.color }}
                  />
                </div>
                <CardTitle className="text-lg text-[#12455a]">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-[#5a7d8e]">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
