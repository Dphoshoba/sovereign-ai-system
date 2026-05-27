export type AudiencePersona =
  | "ministries"
  | "creators"
  | "entrepreneurs"
  | "educators"
  | "agencies"
  | "coaches"
  | "saas-founders"

type PersonaStrategy = {
  persona: AudiencePersona
  hookStyle: string
  titleStyle: string
  thumbnailStyle: string
  shortsStyle: string
  pacing: string
  cta: string
  emotionalAngle: string
}

const personaStrategies: Record<AudiencePersona, PersonaStrategy> = {
  ministries: {
    persona: "ministries",
    hookStyle: "Lead with service, burnout relief, and human connection.",
    titleStyle: "Faith-aware, practical, trust-building titles.",
    thumbnailStyle: "Warm, human, hopeful, ministry-focused visuals.",
    shortsStyle: "Encouraging clips with clear practical ministry wins.",
    pacing: "Calm but purposeful.",
    cta: "Invite viewers to serve better with wisdom and care.",
    emotionalAngle: "Stewardship, care, community, calling.",
  },

  creators: {
    persona: "creators",
    hookStyle: "Lead with growth, speed, monetization, and creative leverage.",
    titleStyle: "Curiosity-driven, benefit-heavy, high-energy titles.",
    thumbnailStyle: "Bold contrast, big text, expressive visuals.",
    shortsStyle: "Fast hooks, quick wins, punchy captions.",
    pacing: "Fast and energetic.",
    cta: "Invite viewers to subscribe for better creator systems.",
    emotionalAngle: "Freedom, growth, visibility, momentum.",
  },

  entrepreneurs: {
    persona: "entrepreneurs",
    hookStyle: "Lead with time savings, revenue, systems, and leverage.",
    titleStyle: "Outcome-focused business titles.",
    thumbnailStyle: "Clean, premium, high-value business visuals.",
    shortsStyle: "Problem-solution clips with clear business payoff.",
    pacing: "Direct and efficient.",
    cta: "Invite viewers to build smarter systems.",
    emotionalAngle: "Control, scale, profit, efficiency.",
  },

  educators: {
    persona: "educators",
    hookStyle: "Lead with clarity, learning outcomes, and student impact.",
    titleStyle: "Helpful, explanatory, curiosity-based titles.",
    thumbnailStyle: "Clean educational visuals with clear text.",
    shortsStyle: "Micro-lessons and simple takeaways.",
    pacing: "Clear and structured.",
    cta: "Invite viewers to learn and apply one idea today.",
    emotionalAngle: "Clarity, mastery, confidence, usefulness.",
  },

  agencies: {
    persona: "agencies",
    hookStyle: "Lead with client results, workflow speed, and scalable delivery.",
    titleStyle: "Authority-driven, ROI-focused titles.",
    thumbnailStyle: "Professional, polished, result-focused visuals.",
    shortsStyle: "Case-study clips and agency workflow wins.",
    pacing: "Confident and polished.",
    cta: "Invite viewers to scale client delivery.",
    emotionalAngle: "Authority, reliability, growth, efficiency.",
  },

  coaches: {
    persona: "coaches",
    hookStyle: "Lead with transformation, clarity, and personal breakthrough.",
    titleStyle: "Emotionally resonant, transformation-focused titles.",
    thumbnailStyle: "Personal, expressive, human-centered visuals.",
    shortsStyle: "Motivational clips with strong personal insight.",
    pacing: "Warm, clear, and motivating.",
    cta: "Invite viewers to take the next wise step.",
    emotionalAngle: "Breakthrough, confidence, identity, direction.",
  },

  "saas-founders": {
    persona: "saas-founders",
    hookStyle: "Lead with product growth, automation, retention, and systems.",
    titleStyle: "Sharp, strategic, growth-focused titles.",
    thumbnailStyle: "Modern tech visuals with bold product-oriented text.",
    shortsStyle: "Tactical growth clips and founder lessons.",
    pacing: "Sharp and insight-dense.",
    cta: "Invite viewers to build better product systems.",
    emotionalAngle: "Scale, product clarity, retention, leverage.",
  },
}

export function personaAgent(persona: AudiencePersona = "creators") {
  return personaStrategies[persona] || personaStrategies.creators
}