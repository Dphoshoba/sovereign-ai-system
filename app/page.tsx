import { redirect } from "next/navigation"
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup"

export default function HomePage() {
  redirect("/sovereign-ai")
}

<NewsletterSignup />