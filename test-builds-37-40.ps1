$routes = @(
  '/execution',
  '/execution/womanhood',
  '/prioritization',
  '/prioritization/womanhood',
  '/ceo-center',
  '/ceo-center/womanhood'
)

$passed = 0
$failed = 0

foreach ($route in $routes) {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000$route" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
      Write-Host "PASS: $route"
      $passed++
    } else {
      Write-Host "FAIL: $route (status: $($response.StatusCode))"
      $failed++
    }
  } catch {
    Write-Host "FAIL: $route (error: $_)"
    $failed++
  }
}

Write-Host ""
Write-Host "Summary: $passed passed, $failed failed"
