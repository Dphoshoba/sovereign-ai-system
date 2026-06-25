export type BibleExtractionResult = {
    people: string[]
    places: string[]
    events: string[]
    themes: string[]
    claims: string[]
  }
  
  function unique(values: string[]) {
    return Array.from(new Set(values)).filter(Boolean)
  }
  
  export function bibleExtractor(text: string): BibleExtractionResult {
    const lower = text.toLowerCase()
  
    const people: string[] = []
    const places: string[] = []
    const events: string[] = []
    const themes: string[] = []
    const claims: string[] = []
  
    if (lower.includes("david")) people.push("David")
    if (lower.includes("goliath")) people.push("Goliath")
    if (lower.includes("saul")) people.push("Saul")
    if (lower.includes("philistine")) people.push("Philistines")
    if (lower.includes("israel")) people.push("Israel")
  
    if (lower.includes("elah")) places.push("Valley of Elah")
  
    if (lower.includes("fight") || lower.includes("battle")) {
      events.push("David confronts Goliath in battle.")
    }
  
    if (lower.includes("saul") && lower.includes("cannot")) {
      events.push("Saul questions David's ability to fight Goliath.")
    }
  
    if (lower.includes("stone") || lower.includes("sling")) {
      events.push("David uses simple weapons in the confrontation.")
    }
  
    if (lower.includes("lord") || lower.includes("god")) {
      themes.push("Trust in God")
      claims.push("The David and Goliath account highlights trust in God.")
    }
  
    if (lower.includes("philistine")) {
      themes.push("Conflict")
      claims.push("The David and Goliath account involves conflict with the Philistines.")
    }
  
    if (lower.includes("saul")) {
      claims.push("The David and Goliath account takes place during the reign of Saul.")
    }
  
    return {
      people: unique(people),
      places: unique(places),
      events: unique(events),
      themes: unique(themes),
      claims: unique(claims),
    }
  }