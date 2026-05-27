type SceneTimelineInput = {
    scenePlan: any
  }
  
  export function timelineBuilderAgent(
    input: SceneTimelineInput
  ) {
    const {
      scenePlan,
    } = input
  
    let parsed: any = scenePlan
  
    if (typeof scenePlan === "string") {
      try {
        parsed = JSON.parse(scenePlan)
      } catch {
        parsed = {}
      }
    }
  
    const scenes =
      parsed.scene_timeline || []
  
    const renderTimeline = scenes.map(
      (
        scene: any,
        index: number
      ) => ({
        id: `scene_${index + 1}`,
  
        title:
          scene.scene || `Scene ${index + 1}`,
  
        start:
          scene.start || "0:00",
  
        end:
          scene.end || "0:00",
  
        description:
          scene.description || "",
  
        transition:
          parsed
            .transition_suggestions?.[
            scene.scene
          ] || "cut",
  
        emotionalTone:
          parsed.emotional_pacing?.[
            `${scene.start}-${scene.end}`
          ] || "neutral",
  
        visualIntensity:
          parsed.visual_intensity_map?.[
            `${scene.start}-${scene.end}`
          ] || "medium",
      })
    )
  
    const shortsMoments =
      parsed
        .shorts_extraction_timestamps ||
      []
  
    const retentionSpikes =
      parsed.retention_spikes || []
  
    return {
      renderTimeline,
      shortsMoments,
      retentionSpikes,
  
      renderingStrategy: {
        pacing:
          "Dynamic cinematic pacing",
  
        transitions:
          "Emotion-aware transitions",
  
        retentionFocus:
          "Increase scene changes near retention dips",
  
        shortsStrategy:
          "Extract high-emotion moments automatically",
      },
    }
  }