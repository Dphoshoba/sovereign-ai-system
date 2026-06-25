export type BibleExtractionResult = {
    people: string[]
    places: string[]
    objects: string[]
    events: string[]
    dialogue: string[]
    themes: string[]
    applications: string[]
    claims: string[]
  }
  
  function unique(values: string[]) {
    return Array.from(new Set(values)).filter(Boolean)
  }
  
  function includesAny(text: string, terms: string[]) {
    return terms.some((term) => text.includes(term))
  }
  
  export function bibleExtractor(text: string): BibleExtractionResult {
    const lower = text.toLowerCase()
  
    const people: string[] = []
    const places: string[] = []
    const objects: string[] = []
    const events: string[] = []
    const dialogue: string[] = []
    const themes: string[] = []
    const applications: string[] = []
    const claims: string[] = []
  
    if (lower.includes("david")) people.push("David")
    if (lower.includes("goliath")) people.push("Goliath")
    if (lower.includes("saul")) people.push("Saul")
    if (lower.includes("jesse")) people.push("Jesse")
    if (lower.includes("philistine")) people.push("Philistines")
    if (lower.includes("israel")) people.push("Israel")
  
    if (lower.includes("elah")) places.push("Valley of Elah")
    if (lower.includes("bethlehem")) places.push("Bethlehem")
  
    if (includesAny(lower, ["sling", "stone", "staff"])) {
      objects.push("David's simple weapons")
    }
  
    if (includesAny(lower, ["armor", "sword", "spear", "shield"])) {
      objects.push("Conventional battle equipment")
    }
  
    if (includesAny(lower, ["fight", "battle", "war", "army", "camp"])) {
      events.push("David and Goliath is set within a military conflict.")
    }
  
    if (lower.includes("saul") && includesAny(lower, ["cannot", "not able", "boy", "youth"])) {
      events.push("Saul questions David's ability to fight Goliath.")
    }
  
    if (lower.includes("david") && lower.includes("goliath")) {
      events.push("David confronts Goliath.")
      claims.push("The account of David and Goliath centers on David confronting Goliath.")
    }
  
    if (lower.includes("philistine")) {
      themes.push("Conflict")
      claims.push("The David and Goliath account involves conflict with the Philistines.")
    }
  
    if (lower.includes("saul")) {
      claims.push("The David and Goliath account takes place during the reign of Saul.")
    }
  
    if (includesAny(lower, ["lord", "god", "faith", "trust"])) {
      themes.push("Trust in God")
      applications.push("Faith can shape courage in intimidating circumstances.")
      claims.push("The David and Goliath account highlights trust in God.")
    }
  
    if (includesAny(lower, ["heart fail", "afraid", "fear"])) {
      themes.push("Courage over fear")
      applications.push("Fear can be confronted through faithful action.")
    }
  
    if (includesAny(lower, ["go and fight", "will go", "fight him"])) {
      dialogue.push("David expresses willingness to confront the Philistine.")
      events.push("David volunteers to confront the Philistine.")
    }
  
    if (includesAny(lower, ["stone", "sling"])) {
      events.push("David uses simple weapons in the confrontation.")
      claims.push("David used simple weapons in the confrontation with Goliath.")
    }
  
    if (includesAny(lower, ["defy", "challenge"])) {
      events.push("Goliath challenges Israel.")
      claims.push("Goliath challenged Israel in the David and Goliath account.")
    }
  
    return {
      people: unique(people),
      places: unique(places),
      objects: unique(objects),
      events: unique(events),
      dialogue: unique(dialogue),
      themes: unique(themes),
      applications: unique(applications),
      claims: unique(claims),
    }
  }