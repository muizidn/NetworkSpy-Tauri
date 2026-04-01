#!/bin/bash

# Safe, smart version bumping script with branch suffix and build metadata

set -e

# Parse command line arguments
DRY_RUN=false
COMMIT_TAG=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --commit-tag)
      COMMIT_TAG="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--dry-run] [--commit-tag <tag>]"
      echo "  --dry-run           Only output the next version, don't create git tag"
      echo "  --commit-tag <tag>  Create and push the specified git tag (used after successful build)"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Get current git branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Allow all branches
echo "ℹ️ Branch: $CURRENT_BRANCH" >&2

if [ "$CURRENT_BRANCH" == "main" ]; then
  SUFFIX=""
else
  SAFE_BRANCH=${CURRENT_BRANCH//\//-}
  SUFFIX="-${SAFE_BRANCH}"
fi

# Get latest semver tag (excluding build metadata)
LATEST_TAG=$(git tag --list "v*" --sort=-version:refname | grep -Ev '\-build\.' | head -1)

if [ -z "$LATEST_TAG" ]; then
  if [ "$DRY_RUN" != true ]; then
    echo "No existing tags found. Starting at v0.1.0" >&2
  fi
  BASE_VERSION="v0.1.0"
  TAG_COMMIT=""
else
  if [ "$DRY_RUN" != true ]; then
    echo "Latest tag: $LATEST_TAG" >&2
  fi
  BASE_VERSION="${LATEST_TAG%%-*}" # Strip suffix like -develop or -staging
  TAG_COMMIT=$(git rev-list -n 1 "$LATEST_TAG")
fi

# Get current commit hash
CURRENT_COMMIT=$(git rev-parse HEAD)

# Strip 'v' prefix for version parsing
VERSION=${BASE_VERSION#v}

# Check if current commit matches latest tag
if [ "$CURRENT_COMMIT" == "$TAG_COMMIT" ]; then
  DATE=$(date +%Y%m%d)
  EXISTING_TAGS=$(git tag --list "${BASE_VERSION}${SUFFIX}-build.${DATE}.*")

  if [ -z "$EXISTING_TAGS" ]; then
    COUNT=0
  else
    COUNT=$(echo "$EXISTING_TAGS" | grep -c .)
  fi

  NEXT_BUILD_NUM=$((COUNT + 1))
  NEW_TAG="${BASE_VERSION}${SUFFIX}-build.${DATE}.${NEXT_BUILD_NUM}"

  if [ "$DRY_RUN" = true ]; then
    echo "$NEW_TAG"
    exit 0
  elif [ -n "$COMMIT_TAG" ]; then
    echo "🔁 Creating build metadata tag: $COMMIT_TAG" >&2
    git tag "$COMMIT_TAG"
    git push origin "$COMMIT_TAG" 2>/dev/null || echo "⚠️ Warning: Could not push tag (may be running locally)"
    echo "✅ Tagged as: $COMMIT_TAG" >&2
    exit 0
  else
    echo "🔁 Same commit as latest tag. Creating build metadata tag: $NEW_TAG" >&2
    git tag "$NEW_TAG"
    git push origin "$NEW_TAG" 2>/dev/null || echo "⚠️ Warning: Could not push tag (may be running locally)"
    echo "✅ Tagged as: $NEW_TAG" >&2
    exit 0
  fi
fi

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"

if [ "$CURRENT_BRANCH" == "main" ]; then
  # On main: Bump patch version
  PATCH=$((PATCH + 1))
  NEW_TAG="v${MAJOR}.${MINOR}.${PATCH}"
  
  echo "🏷️ [main] New commit. Bumping version: $NEW_TAG" >&2
else
  # On other branches: Keep same version, append branch and build metadata
  # Sanitize branch name (replace / with -)
  SAFE_BRANCH=${CURRENT_BRANCH//\//-}
  
  DATE=$(date +%Y%m%d)
  
  # Prefix for searching existing build tags for this branch today
  SEARCH_PREFIX="v${MAJOR}.${MINOR}.${PATCH}-${SAFE_BRANCH}-build.${DATE}."
  
  EXISTING_TAGS=$(git tag --list "${SEARCH_PREFIX}*")
  
  if [ -z "$EXISTING_TAGS" ]; then
    COUNT=0
  else
    COUNT=$(echo "$EXISTING_TAGS" | wc -l)
  fi
  
  NEXT_BUILD_NUM=$((COUNT + 1))
  NEW_TAG="v${MAJOR}.${MINOR}.${PATCH}-${SAFE_BRANCH}-build.${DATE}.${NEXT_BUILD_NUM}"
  
  echo "🏷️ [${CURRENT_BRANCH}] New commit. Generated build tag: $NEW_TAG" >&2
fi

if [ "$DRY_RUN" = true ]; then
  echo "$NEW_TAG"
  exit 0
elif [ -n "$COMMIT_TAG" ]; then
  echo "🏷️ Creating tag: $COMMIT_TAG" >&2
  git tag "$COMMIT_TAG"
  git push origin "$COMMIT_TAG" 2>/dev/null || echo "⚠️ Warning: Could not push tag (may be running locally)"
  echo "✅ Tagged as: $COMMIT_TAG" >&2
else
  echo "🏷️ Creating tag: $NEW_TAG" >&2
  git tag "$NEW_TAG"
  git push origin "$NEW_TAG" 2>/dev/null || echo "⚠️ Warning: Could not push tag (may be running locally)"
  echo "✅ Tagged as: $NEW_TAG" >&2
fi
