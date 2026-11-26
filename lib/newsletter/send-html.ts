import { publicUnsubscribeUrl } from "./unsubscribe-token"

export function buildNewsletterHtml(input: {
  previewText: string | null | undefined
  content: string
  recipientEmail: string
  origin: string
  senderLabel: string
  env?: NodeJS.ProcessEnv
}): { html: string; listUnsubscribeUrl: string | null } {
  const unsubUrl = publicUnsubscribeUrl(
    input.recipientEmail,
    input.origin,
    input.env,
  )
  const unsubBlock = unsubUrl
    ? `<p style="font-size:13px;color:#6b7280;">
         <a href="${unsubUrl}">Unsubscribe</a> from Echoes &amp; Visions emails.
       </p>`
    : `<p style="font-size:13px;color:#6b7280;">
         To unsubscribe, reply with UNSUBSCRIBE.
       </p>`

  const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111827; max-width: 680px; margin: 0 auto;">
              <p style="color:#6b7280;">${input.previewText || ""}</p>
              ${input.content}
              <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;" />
              <p style="font-size:13px;color:#6b7280;">
                You are receiving this because you subscribed to Echoes &amp; Visions.
                Sender: ${input.senderLabel.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
              </p>
              ${unsubBlock}
            </div>
          `

  return { html, listUnsubscribeUrl: unsubUrl }
}
