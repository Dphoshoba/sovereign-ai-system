export const SCHEDULE_ANTECEDENT =
  "Google’s Gmail page for “Help me schedule” requires an eligible Workspace or Google AI plan.";

export const GUEST_LIMIT =
  "The page states a maximum of 20 guests and four proposed slots by default.";

export const INACCURATE_SUGGESTIONS =
  "It also says suggestions may be inaccurate and are not professional advice.";

export const SMART_FEATURES = "Smart features must be on.";

export const EXCEL_ANTECEDENT =
  "Microsoft’s Excel help says Copilot can answer questions about data in one or more tables, or in ranges laid out like tables.";

export const UNSTRUCTURED_DATA = "Unstructured data is not supported.";

export const AI_INBOX_SCOPE =
  "It is not documented as a system that classifies customer complaints or chooses a refund.";

export const ATTACHMENT_LIMIT =
  "It does not support attachments, delegated inboxes, or encrypted email.";

export const NAMED_PERSON_ADVICE =
  "A named person still checks the facts and decides what is sent.";

export const PRACTICAL_INSTRUCTION =
  "Draft one reply in the email tool the business already uses.";

export const HYPOTHETICAL_EXAMPLE =
  "Suppose a café owner pastes a prompt and the draft adds a discount they are not offering.";

export const FICTIONAL_ILLUSTRATION =
  "Fictional illustration. A consultant drafting a reply to two clients clicks Help me schedule, sees one amber slot, drops that slot, and sends the remaining times.";

export function section(heading: string, paragraphs: string[]): string {
  return [`## ${heading}`, "", ...paragraphs].join("\n\n");
}
