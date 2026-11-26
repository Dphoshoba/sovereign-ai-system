import { section } from "./continuation-claims";

export const COUNTRY_RESTRICTION = "It is restricted to the United States.";

export const HELP_ME_WRITE_ANTECEDENT =
  "Google describes “Help me write” on a personal Gmail account.";

export const AI_INBOX_ANTECEDENT =
  "Google’s page for Gmail “AI Inbox” says the feature is in beta.";

export const QUICKBOOKS_ANTECEDENT =
  "Intuit’s QuickBooks page says Payments AI can suggest a reminder.";

export const OUTLOOK_ANTECEDENT =
  "Microsoft’s Outlook help says Copilot can draft a message from a prompt.";

export const EMAIL_HEADING = "1. Customer email drafting";
export const SCHEDULE_HEADING = "2. Appointment scheduling";
export const SOCIAL_HEADING = "3. Social media content preparation";
export const MEETINGS_HEADING = "4. Meeting summaries";
export const INBOX_HEADING = "5. Customer enquiry triage";
export const INVOICE_HEADING = "6. Invoice and payment reminder preparation";
export const REPORTING_HEADING = "7. Business reporting";

export const ORDINARY_COUNT = 30;

export const PRIVACY_RETENTION =
  "Prompt retention on that hub is admin-controlled.";

export const SOCIAL_ELIGIBILITY = "An eligible Workspace plan is required.";

export const MEETINGS_CONSENT =
  "The page does not describe a recording-consent rule.";

export const INBOX_EXCLUSION = "It does not include Social.";

export const INVOICE_APPROVAL =
  "That schedule is reviewed before it is approved.";

export const REPORTING_LIMIT = "Unstructured data is not supported.";

export const SCHEDULE_ANTECEDENT =
  "Google’s Gmail page for “Help me schedule” requires an eligible Workspace or Google AI plan.";

export const SOCIAL_ANTECEDENT =
  "Google’s prompt help for Gemini in Docs says the samples are illustrative.";

export const MEETINGS_ANTECEDENT =
  "Microsoft’s short Teams recap page says Copilot can say what you missed.";

export const REPORTING_ANTECEDENT =
  "Microsoft’s Excel help says Copilot can answer questions about a table.";

export const PRIORITY_EXCERPTS = [
  PRIVACY_RETENTION,
  SOCIAL_ELIGIBILITY,
  MEETINGS_CONSENT,
  INBOX_EXCLUSION,
  INVOICE_APPROVAL,
  REPORTING_LIMIT,
] as const;

export function ordinaryClaim(index: number): string {
  return `The draft can mention ledger alpha${String(index).padStart(2, "0")}.`;
}

export function countryRestrictionArticle(): string {
  return [
    section(EMAIL_HEADING, [
      [HELP_ME_WRITE_ANTECEDENT, COUNTRY_RESTRICTION, COUNTRY_RESTRICTION].join(" "),
    ]),
    section(INBOX_HEADING, [[AI_INBOX_ANTECEDENT, COUNTRY_RESTRICTION].join(" ")]),
    section(INVOICE_HEADING, [[QUICKBOOKS_ANTECEDENT, COUNTRY_RESTRICTION].join(" ")]),
    section("Outlook drafts", [[OUTLOOK_ANTECEDENT, COUNTRY_RESTRICTION].join(" ")]),
  ].join("\n\n");
}

export function balancedSelectionArticle(): string {
  const ordinary = Array.from({ length: ORDINARY_COUNT }, (_, index) =>
    ordinaryClaim(index + 1),
  );
  return [
    section(EMAIL_HEADING, [
      [OUTLOOK_ANTECEDENT, ...ordinary, PRIVACY_RETENTION].join(" "),
    ]),
    section(SCHEDULE_HEADING, [SCHEDULE_ANTECEDENT]),
    section(SOCIAL_HEADING, [[SOCIAL_ANTECEDENT, SOCIAL_ELIGIBILITY].join(" ")]),
    section(MEETINGS_HEADING, [[MEETINGS_ANTECEDENT, MEETINGS_CONSENT].join(" ")]),
    section(INBOX_HEADING, [[AI_INBOX_ANTECEDENT, INBOX_EXCLUSION].join(" ")]),
    section(INVOICE_HEADING, [[QUICKBOOKS_ANTECEDENT, INVOICE_APPROVAL].join(" ")]),
    section(REPORTING_HEADING, [[REPORTING_ANTECEDENT, REPORTING_LIMIT].join(" ")]),
  ].join("\n\n");
}

export function documentOrderArticle(): string {
  return section(EMAIL_HEADING, [
    [OUTLOOK_ANTECEDENT, ordinaryClaim(1), ordinaryClaim(2)].join(" "),
  ]);
}
