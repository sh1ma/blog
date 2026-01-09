#!/usr/bin/env bash

set -e

JSON_MODE=false
SHORT_NAME=""
BRANCH_TYPE="feat"  # Default type for conventional commit format
ARGS=()
i=1
while [ $i -le $# ]; do
    arg="${!i}"
    case "$arg" in
        --json)
            JSON_MODE=true
            ;;
        --short-name)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --short-name requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            # Check if the next argument is another option (starts with --)
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --short-name requires a value' >&2
                exit 1
            fi
            SHORT_NAME="$next_arg"
            ;;
        --type)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --type requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            next_arg="${!i}"
            if [[ "$next_arg" == --* ]]; then
                echo 'Error: --type requires a value' >&2
                exit 1
            fi
            # Validate type
            case "$next_arg" in
                feat|fix|refactor|docs|chore|style|test|perf|ci|build)
                    BRANCH_TYPE="$next_arg"
                    ;;
                *)
                    echo "Error: Invalid type '$next_arg'. Valid types: feat, fix, refactor, docs, chore, style, test, perf, ci, build" >&2
                    exit 1
                    ;;
            esac
            ;;
        --help|-h)
            echo "Usage: $0 [--json] [--short-name <name>] [--type <type>] <feature_description>"
            echo ""
            echo "Options:"
            echo "  --json              Output in JSON format"
            echo "  --short-name <name> Provide a custom short name (2-4 words) for the branch"
            echo "  --type <type>       Branch type (default: feat)"
            echo "                      Valid types: feat, fix, refactor, docs, chore, style, test, perf, ci, build"
            echo "  --help, -h          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 'Add user authentication system' --short-name 'user-auth'"
            echo "  $0 'Refactor design system' --type refactor --short-name 'design-system'"
            exit 0
            ;;
        *)
            ARGS+=("$arg")
            ;;
    esac
    i=$((i + 1))
done

FEATURE_DESCRIPTION="${ARGS[*]}"
if [ -z "$FEATURE_DESCRIPTION" ]; then
    echo "Usage: $0 [--json] [--short-name <name>] [--number N] <feature_description>" >&2
    exit 1
fi

# Function to find the repository root by searching for existing project markers
find_repo_root() {
    local dir="$1"
    while [ "$dir" != "/" ]; do
        if [ -d "$dir/.git" ] || [ -d "$dir/.specify" ]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

# Function to clean and format a branch name
clean_branch_name() {
    local name="$1"
    echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-//' | sed 's/-$//'
}

# Resolve repository root. Prefer git information when available, but fall back
# to searching for repository markers so the workflow still functions in repositories that
# were initialised with --no-git.
SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if git rev-parse --show-toplevel >/dev/null 2>&1; then
    REPO_ROOT=$(git rev-parse --show-toplevel)
    HAS_GIT=true
else
    REPO_ROOT="$(find_repo_root "$SCRIPT_DIR")"
    if [ -z "$REPO_ROOT" ]; then
        echo "Error: Could not determine repository root. Please run this script from within the repository." >&2
        exit 1
    fi
    HAS_GIT=false
fi

cd "$REPO_ROOT"

SPECS_DIR="$REPO_ROOT/specs"
mkdir -p "$SPECS_DIR"

# Check if already on a feature branch (conventional commit format)
is_on_feature_branch() {
    if [ "$HAS_GIT" = true ]; then
        local current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
        if [[ "$current_branch" =~ ^(feat|fix|refactor|docs|chore|style|test|perf|ci|build)/ ]]; then
            echo "$current_branch"
            return 0
        fi
    fi
    return 1
}

# Function to generate branch name with stop word filtering and length filtering
generate_branch_name() {
    local description="$1"
    
    # Common stop words to filter out
    local stop_words="^(i|a|an|the|to|for|of|in|on|at|by|with|from|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|should|could|can|may|might|must|shall|this|that|these|those|my|your|our|their|want|need|add|get|set)$"
    
    # Convert to lowercase and split into words
    local clean_name=$(echo "$description" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/ /g')
    
    # Filter words: remove stop words and words shorter than 3 chars (unless they're uppercase acronyms in original)
    local meaningful_words=()
    for word in $clean_name; do
        # Skip empty words
        [ -z "$word" ] && continue
        
        # Keep words that are NOT stop words AND (length >= 3 OR are potential acronyms)
        if ! echo "$word" | grep -qiE "$stop_words"; then
            if [ ${#word} -ge 3 ]; then
                meaningful_words+=("$word")
            elif echo "$description" | grep -q "\b${word^^}\b"; then
                # Keep short words if they appear as uppercase in original (likely acronyms)
                meaningful_words+=("$word")
            fi
        fi
    done
    
    # If we have meaningful words, use first 3-4 of them
    if [ ${#meaningful_words[@]} -gt 0 ]; then
        local max_words=3
        if [ ${#meaningful_words[@]} -eq 4 ]; then max_words=4; fi
        
        local result=""
        local count=0
        for word in "${meaningful_words[@]}"; do
            if [ $count -ge $max_words ]; then break; fi
            if [ -n "$result" ]; then result="$result-"; fi
            result="$result$word"
            count=$((count + 1))
        done
        echo "$result"
    else
        # Fallback to original logic if no meaningful words found
        local cleaned=$(clean_branch_name "$description")
        echo "$cleaned" | tr '-' '\n' | grep -v '^$' | head -3 | tr '\n' '-' | sed 's/-$//'
    fi
}

# Check if already on a feature branch
EXISTING_BRANCH=$(is_on_feature_branch)
if [ -n "$EXISTING_BRANCH" ]; then
    # Already on a feature branch, use it instead of creating a new one
    BRANCH_NAME="$EXISTING_BRANCH"
    >&2 echo "[specify] Already on feature branch '$BRANCH_NAME', skipping branch creation"
else
    # Generate branch name
    if [ -n "$SHORT_NAME" ]; then
        # Use provided short name, just clean it up
        BRANCH_SUFFIX=$(clean_branch_name "$SHORT_NAME")
    else
        # Generate from description with smart filtering
        BRANCH_SUFFIX=$(generate_branch_name "$FEATURE_DESCRIPTION")
    fi

    # Create conventional commit format branch name: type/description
    BRANCH_NAME="${BRANCH_TYPE}/${BRANCH_SUFFIX}"

    # GitHub enforces a 244-byte limit on branch names
    # Validate and truncate if necessary
    MAX_BRANCH_LENGTH=244
    if [ ${#BRANCH_NAME} -gt $MAX_BRANCH_LENGTH ]; then
        # Calculate how much we need to trim from suffix
        # Account for: type + slash
        MAX_SUFFIX_LENGTH=$((MAX_BRANCH_LENGTH - ${#BRANCH_TYPE} - 1))

        # Truncate suffix at word boundary if possible
        TRUNCATED_SUFFIX=$(echo "$BRANCH_SUFFIX" | cut -c1-$MAX_SUFFIX_LENGTH)
        # Remove trailing hyphen if truncation created one
        TRUNCATED_SUFFIX=$(echo "$TRUNCATED_SUFFIX" | sed 's/-$//')

        ORIGINAL_BRANCH_NAME="$BRANCH_NAME"
        BRANCH_NAME="${BRANCH_TYPE}/${TRUNCATED_SUFFIX}"

        >&2 echo "[specify] Warning: Branch name exceeded GitHub's 244-byte limit"
        >&2 echo "[specify] Original: $ORIGINAL_BRANCH_NAME (${#ORIGINAL_BRANCH_NAME} bytes)"
        >&2 echo "[specify] Truncated to: $BRANCH_NAME (${#BRANCH_NAME} bytes)"
    fi

    if [ "$HAS_GIT" = true ]; then
        git checkout -b "$BRANCH_NAME"
    else
        >&2 echo "[specify] Warning: Git repository not detected; skipped branch creation for $BRANCH_NAME"
    fi
fi

# Convert branch name to directory name (replace / with -)
DIR_NAME="${BRANCH_NAME//\//-}"
FEATURE_DIR="$SPECS_DIR/$DIR_NAME"
mkdir -p "$FEATURE_DIR"

TEMPLATE="$REPO_ROOT/.specify/templates/spec-template.md"
SPEC_FILE="$FEATURE_DIR/spec.md"

# Only copy template if spec.md doesn't exist
if [ -f "$SPEC_FILE" ]; then
    >&2 echo "[specify] spec.md already exists at $SPEC_FILE, skipping template copy"
else
    if [ -f "$TEMPLATE" ]; then cp "$TEMPLATE" "$SPEC_FILE"; else touch "$SPEC_FILE"; fi
fi

# Set the SPECIFY_FEATURE environment variable for the current session
export SPECIFY_FEATURE="$BRANCH_NAME"

if $JSON_MODE; then
    printf '{"BRANCH_NAME":"%s","SPEC_FILE":"%s","FEATURE_DIR":"%s"}\n' "$BRANCH_NAME" "$SPEC_FILE" "$FEATURE_DIR"
else
    echo "BRANCH_NAME: $BRANCH_NAME"
    echo "SPEC_FILE: $SPEC_FILE"
    echo "FEATURE_DIR: $FEATURE_DIR"
    echo "SPECIFY_FEATURE environment variable set to: $BRANCH_NAME"
fi
