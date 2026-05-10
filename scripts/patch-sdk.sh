#!/bin/bash
# Re-apply Anthropic SDK patch after openclaw update
# Run this after: openclaw update
# Reason: AIHub WAF blocks User-Agent: Anthropic/JS x.x.x

PATCH='    getUserAgent() {\n        return '"'"'PostmanRuntime/7.0'"'"';\n    }'

SDK_FILES=(
  "/home/openclaw/.npm-global/lib/node_modules/openclaw/node_modules/@anthropic-ai/sdk/client.js"
  "/home/openclaw/.npm-global/lib/node_modules/openclaw/node_modules/@mariozechner/pi-ai/node_modules/@anthropic-ai/sdk/client.js"
  "/home/openclaw/.npm-global/lib/node_modules/openclaw/node_modules/openai/client.js"
)

for FILE in "${SDK_FILES[@]}"; do
  if [ ! -f "$FILE" ]; then
    echo "SKIP (not found): $FILE"
    continue
  fi

  if grep -q "PostmanRuntime/7.0" "$FILE"; then
    echo "ALREADY PATCHED: $FILE"
    continue
  fi

  # Replace getUserAgent method
  node -e "
    const fs = require('fs');
    let content = fs.readFileSync('$FILE', 'utf8');
    const patched = content.replace(
      /getUserAgent\(\)\s*\{[\s\S]*?\}/,
      \`getUserAgent() {\n        return 'PostmanRuntime/7.0';\n    }\`
    );
    if (content === patched) {
      console.log('PATTERN NOT FOUND: $FILE');
    } else {
      fs.writeFileSync('$FILE', patched);
      console.log('PATCHED: $FILE');
    }
  "
done

echo "Done! Restart gateway: openclaw gateway restart"
