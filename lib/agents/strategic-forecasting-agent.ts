type ForecastNode = {
  branchId: string
  futureSuccessProbability: number
  evolutionaryScore: number
}

type ForecastInput = {
  memoryNodes: ForecastNode[]
}

export function strategicForecastingAgent(
  input: ForecastInput
) {
  const nodes =
    input.memoryNodes || []

  const forecasts =
    nodes.map((node) => {
      let forecast = "Stable growth expected."

      if (
        node.futureSuccessProbability >= 85
      ) {
        forecast =
          "High viral expansion potential."
      }

      if (
        node.futureSuccessProbability < 80
      ) {
        forecast =
          "Potential saturation or decline risk."
      }

      return {
        branchId:
          node.branchId,

        forecast,

        projectedDominance:
          Math.min(
            99,
            node.futureSuccessProbability + 5
          ),

        saturationRisk:
          Math.max(
            1,
            100 -
              node.futureSuccessProbability
          ),
      }
    })

  const dominantForecast =
    forecasts.sort(
      (a, b) =>
        b.projectedDominance -
        a.projectedDominance
    )[0]

  return {
    autonomousStrategicForecasting: true,

    forecasts,

    dominantForecast,

    predictiveDirective:
      `Prioritize branch "${dominantForecast.branchId}" before market saturation occurs.`,

    nextStage:
      "Ready for predictive recursive evolution.",
  }
}
