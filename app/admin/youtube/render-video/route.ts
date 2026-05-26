const scenesDir = path.join(
    process.cwd(),
    "public",
    "backgrounds",
    "scenes"
  )
  
  const sceneFiles = fs.existsSync(scenesDir)
    ? fs
        .readdirSync(scenesDir)
        .filter((file) => file.endsWith(".mp4"))
        .map((file) => path.join(scenesDir, file))
    : []
  
  const fallbackBackgroundPath = path.join(
    process.cwd(),
    "public",
    "backgrounds",
    "default.mp4"
  )
  
  const videoInputs =
    sceneFiles.length > 0 ? sceneFiles : [fallbackBackgroundPath]