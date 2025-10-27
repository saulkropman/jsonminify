# Product Requirements Document: JSON Token Optimizer for Claude Code

**Document Status:** Draft v1.0  
**Date:** October 27, 2025  
**Target Product:** Claude Code

---

## Overview

A Claude Code tool that reduces token count in standardized JSON chat/conversation files by removing unnecessary data while preserving semantic content.

## Problem Statement

Chat history JSON files contain verbose data that inflates token counts unnecessarily:

- Redundant session metadata (IDs, timestamps)
- Base64-encoded images consuming thousands of tokens
- Repeated system messages/greetings
- Unminified JSON with excessive whitespace

This bloat makes files expensive to process and may exceed context windows.

## Goals

- **Primary**: Reduce JSON file token count by 50-80% without losing meaningful conversation data
- **Secondary**: Create a reusable tool for batch processing multiple files
- Make the tool idempotent (safe to run multiple times)

## Target Users

- Developers processing chat logs for analysis
- Teams building conversation datasets
- Anyone needing to fit large conversation histories into context windows

## Functional Requirements

### 1. Remove Chat Metadata

**Input:**
```json
{
  "chatStart": "2024-01-15T10:30:00Z",
  "messages": [...]
}
```

**Output:**
```json
{
  "messages": [...]
}
```

- Delete top-level `chatStart` field
- Preserve all other top-level fields

### 2. Strip Image Data

**Input:**
```json
{
  "role": "user",
  "content": "Look at this",
  "imageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
}
```

**Output:**
```json
{
  "role": "user",
  "content": "Look at this",
  "imageUrl": "[removed]"
}
```

- Replace all `imageUrl` field values with placeholder `"[removed]"`
- Preserve the field structure (don't delete key, just replace value)
- Handle nested `imageUrl` anywhere in the JSON tree

### 3. Deduplicate System Messages

**Input:**
```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant. Be concise."},
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"},
    {"role": "system", "content": "You are a helpful assistant. Be concise."},
    {"role": "user", "content": "What's the weather?"}
  ]
}
```

**Output:**
```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant. Be concise.", "_id": "sys_0"},
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"},
    {"role": "system", "contentRef": "sys_0"},
    {"role": "user", "content": "What's the weather?"}
  ]
}
```

- Track unique system message contents
- First occurrence gets an ID (`sys_0`, `sys_1`, etc.)
- Subsequent duplicates replaced with `{"role": "system", "contentRef": "sys_X"}`

### 4. Remove Session IDs

**Input:**
```json
{
  "id": "8ded6272-c521-4ef3-8cda-229483affb34",
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "messages": [
    {
      "id": "msg_9876543210",
      "content": "Hello"
    }
  ]
}
```

**Output:**
```json
{
  "messages": [
    {
      "content": "Hello"
    }
  ]
}
```

- Remove all `id` and `sessionId` fields at any nesting level
- Preserve `_id` fields created by deduplication process

### 5. Minify JSON

- Remove all whitespace/indentation
- Output single-line JSON
- No functional changes to data structure

## Non-Functional Requirements

### Performance

- Process files up to 10MB in under 5 seconds
- Memory efficient (streaming for very large files optional)

### Reliability

- **Idempotent**: Running tool twice produces same output as running once
- Validate JSON before processing (fail fast on malformed input)
- Preserve JSON structure (arrays stay arrays, objects stay objects)

### Usability

```bash
# Basic usage
claude-code-tool optimize-json input.json output.json

# Batch processing
claude-code-tool optimize-json conversations/*.json --output-dir ./optimized

# Dry run (show token reduction without writing)
claude-code-tool optimize-json input.json --dry-run
```

## Success Metrics

- ✅ Token reduction of 50-80% on typical conversation files
- ✅ Zero data loss for conversation content (messages, roles, text)
- ✅ Tool completes in <5 seconds for files under 10MB
- ✅ No JSON parsing errors on valid input files

## Out of Scope (V1)

- Custom transformation rules
- Compression/encoding
- Support for non-JSON formats
- Selective field preservation UI
- Reversing the optimization (restoring removed data)

## Technical Considerations

### Implementation Language

- **Python** (recommended): Excellent JSON handling, good for Claude Code tools
- Alternative: JavaScript/Node.js if team prefers

### Key Libraries

- `json` (Python stdlib) - parsing/serialization
- `pathlib` - file handling
- Optional: `orjson` for faster large file processing

### Error Handling

- Invalid JSON → Clear error message with line number
- Missing input file → Friendly error
- Permission issues → Suggest chmod/permissions fix
- Malformed `imageUrl` (not a string) → Log warning, skip

## Example Transformation

### Before (1,245 tokens):

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
      "imageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    },
    {
      "id": "msg_003",
      "role": "system", 
      "content": "You are a helpful assistant."
    }
  ]
}
```

### After (312 tokens, 75% reduction):

```json
{"messages":[{"role":"system","content":"You are a helpful assistant.","_id":"sys_0"},{"role":"user","content":"Show me a cat","imageUrl":"[removed]"},{"role":"system","contentRef":"sys_0"}]}
```

## Future Enhancements (V2+)

- Configuration file for custom rules
- Token counting/reporting (show before/after)
- Preserve specific image URLs based on size threshold
- Support for XML/YAML formats
- Undo file generation

## Questions for Stakeholders

1. Should we preserve any metadata fields beyond `messages`?
2. For imageUrl: replace with placeholder or delete field entirely?
3. Should deduplication apply to assistant messages too (if repeated)?
4. Preference for output: overwrite original vs. new file vs. `.optimized.json` suffix?

---

**Document Status**: Draft v1.0  
**Author**: [Your Name]  
**Date**: October 27, 2025  
**Reviewers**: [Engineering, Product]