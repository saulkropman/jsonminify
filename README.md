# JSON Token Optimizer

A browser-based tool to reduce token count in JSON conversation files by removing unnecessary data while preserving semantic content.

## Features

- **Token Reduction**: Achieve 50-80% reduction in token count
- **Drag & Drop**: Easy file upload with drag-and-drop support
- **Real-time Stats**: See before/after token counts and reduction percentage
- **Export Options**: Download optimized JSON or copy to clipboard
- **Idempotent**: Safe to run multiple times on the same file
- **Client-Side**: All processing happens in your browser (no server needed)

## What It Does

The optimizer processes JSON conversation files by:

1. **Removing metadata**: Deletes `chatStart`, `id`, and `sessionId` fields
2. **Stripping images**: Replaces base64-encoded `imageUrl` data with `[removed]` placeholder
3. **Deduplicating messages**: Creates content references for repeated system and assistant messages
4. **Minifying JSON**: Removes whitespace and formatting to minimize file size

## Live Demo

🚀 [Try it now](https://saulkropman.github.io/jsonminify/)

## Example

### Before (139 tokens):
```json
{
  "chatStart": "2024-01-15T10:30:00Z",
  "id": "8ded6272-c521-4ef3-8cda-229483affb34",
  "messages": [
    {
      "id": "msg_001",
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "id": "msg_002",
      "role": "user",
      "content": "Show me a cat",
      "imageUrl": "data:image/png;base64,iVBORw0KGgo..."
    },
    {
      "id": "msg_003",
      "role": "system",
      "content": "You are a helpful assistant."
    }
  ]
}
```

### After (48 tokens, 65% reduction):
```json
{"messages":[{"role":"system","content":"You are a helpful assistant.","_id":"sys_0"},{"role":"user","content":"Show me a cat","imageUrl":"[removed]"},{"role":"system","contentRef":"sys_0"}]}
```

## Usage

1. Visit the [live demo](https://saulkropman.github.io/jsonminify/)
2. Drag and drop your JSON file or click "Browse Files"
3. View the optimization statistics
4. Download the optimized file or copy to clipboard

## Deploying to GitHub Pages

To deploy your own instance:

1. **Fork this repository**
2. **Enable GitHub Pages**:
   - Go to repository Settings
   - Navigate to "Pages" section
   - Under "Source", select the branch (e.g., `main`)
   - Save the settings
3. **Access your site** at `https://[your-username].github.io/jsonminify/`

## Local Development

To test locally:

```bash
# Clone the repository
git clone https://github.com/saulkropman/jsonminify.git
cd jsonminify

# Open index.html in your browser
open index.html  # macOS
# or
start index.html  # Windows
# or
xdg-open index.html  # Linux
```

## Testing

Run the test script to verify optimization logic:

```bash
node test.js
```

This will process `test-example.json` and display the optimization results.

## Technical Details

- **Language**: Pure JavaScript (no dependencies)
- **Token Estimation**: ~4 characters per token (approximation)
- **Browser Support**: Modern browsers with ES6+ support
- **File Size**: Optimized for files up to 10MB

## Use Cases

- Reducing chat history for context window limitations
- Preparing conversation datasets for analysis
- Minimizing API costs when processing chat logs
- Archiving conversation data efficiently

## Contributing

See [PRD.md](PRD.md) for the full product requirements document.

## License

MIT License - See LICENSE file for details

## Built With

[Claude Code](https://claude.com/claude-code)
