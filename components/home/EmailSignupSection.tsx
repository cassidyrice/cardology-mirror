import { NewsletterSignupForm } from "@/components/seo/NewsletterSignupForm";
import { SectionShell } from "@/components/ui";

export function EmailSignupSection() {
  return (
    <SectionShell tone="paper" id="monday-card" width="narrow">
      <NewsletterSignupForm
        source="home-monday"
        heading="Your card, every Monday."
        body="One email a week: the card of the week, what it's pressing on, and one thing worth trying. That's it."
        buttonLabel="Send me Monday's card"
        finePrint="Unsubscribe anytime."
      />
    </SectionShell>
  );
}
