# API Routes for Versioning System

## Summary
Implements all 6 REST API endpoints needed for the Git-like versioning system. These routes handle commits, branches, history, and project cloning.

## Routes Created

### 1. POST `/api/commits`
- Create new commit with stems
- Handles multipart file upload
- Implements SHA-256 deduplication
- Updates branch head pointer
- Supports dry stems with FX metadata

### 2. GET `/api/commits/[id]`
- Retrieve specific commit with all stems
- Includes author profile data
- Returns audio file references
- Verifies user access

### 3. GET `/api/repositories/[id]/commits`
- Get commit history for repository
- Optional branch filter via `?branchId=xxx`
- Ordered by creation date (newest first)
- Includes author and branch info

### 4. POST `/api/branches`
- Create new branch from existing commit
- Validates branch name uniqueness
- Checks commit exists in repository
- Sets initial HEAD to source commit

### 5. GET `/api/branches/[id]/commits`
- Get all commits for specific branch
- Returns branch metadata
- Includes stem summaries (no full audio data)
- Ordered chronologically

### 6. POST `/api/repositories/[id]/clone`
- Download entire project as ZIP
- Includes all commits and stems
- Generates project.json metadata
- Optional branch selection
- Max duration: 5 minutes for large projects

## Changes

**New Files:**
- `app/api/commits/route.ts`
- `app/api/commits/[id]/route.ts`
- `app/api/repositories/[id]/commits/route.ts`
- `app/api/branches/route.ts`
- `app/api/branches/[id]/commits/route.ts`
- `app/api/repositories/[id]/clone/route.ts`

**Modified:**
- `package.json` - Added `archiver` (^7.0.1) and `@types/archiver` for ZIP export

## Testing Needed

After merge:
1. Test commit creation with file upload
2. Verify deduplication works (upload same file twice)
3. Test branch creation and history retrieval
4. Test clone endpoint with small project
5. Verify RLS policies block unauthorized access

## Next Steps (Week 2)

After this PR merges:
- Implement FX chain in audio engine (Tone.js)
- Modify upload flow to calculate file hashes
- Connect UI to new commit endpoints

---

Branch: `feature/api-versioning-routes`
Base: `main`

🤖 Generated with Claude Sonnet 4.5
