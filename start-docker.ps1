# Get IP address
$ipAddress = (Get-NetIPAddress | Where-Object {$_.AddressFamily -eq "IPv4" -and $_.PrefixOrigin -eq "Dhcp"}).IPAddress

if (-not $ipAddress) {
    Write-Host "Could not detect IP address. Using localhost."
    $ipAddress = "localhost"
} else {
    Write-Host "Using IP address: $ipAddress"
}

# Set environment variable
$env:HOST_IP = $ipAddress

# Run docker compose
docker-compose down
docker-compose up -d