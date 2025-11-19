#!/bin/bash
# Build script for Render static site
# This script can inject environment variables into config.js

# Get API_BASE_URL from environment variable or use default
API_URL="${API_BASE_URL:-https://kidney-clinic-e2f6c7fnf0cxg5dy.eastus-01.azurewebsites.net}"

# Create/update config.js with the API URL
cat > config.js << EOF
// Configuration file for API endpoints
// Auto-generated during Render deployment
window.__CONFIG__ = window.__CONFIG__ || {};
window.__CONFIG__.API_BASE_URL = '${API_URL}';
EOF

echo "Config file created with API URL: ${API_URL}"

