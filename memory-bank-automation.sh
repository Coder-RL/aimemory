#!/bin/bash

# Memory Bank Automation & Validation - Production Implementation
# Senior Software Engineer: Automation Layer

set -euo pipefail

# Configuration
readonly AUTOMATION_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly MEMORY_BANK_DIR="memory-bank"
readonly BACKUP_DIR=".memory-bank-backups"
readonly CONFIG_FILE=".memory-bank-config.json"

# Logging functions (independent)
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "memory-bank.log"

    case "$level" in
        ERROR) echo -e "\033[0;31m❌ $message\033[0m" ;;
        WARN)  echo -e "\033[1;33m⚠️  $message\033[0m" ;;
        INFO)  echo -e "\033[0;32mℹ️  $message\033[0m" ;;
    esac
}

# Validation Engine
validate_memory_bank_integrity() {
    log "INFO" "Running memory bank integrity validation..."
    
    local validation_errors=0
    
    # Check directory structure
    if [[ ! -d "$MEMORY_BANK_DIR" ]]; then
        log "ERROR" "Memory bank directory not found: $MEMORY_BANK_DIR"
        ((validation_errors++))
    fi
    
    # Check required files
    local required_files=(
        "projectbrief.md"
        "activeContext.md"
        "progress.md"
        "techContext.md"
        "systemPatterns.md"
        "productContext.md"
    )
    
    for file in "${required_files[@]}"; do
        local file_path="$MEMORY_BANK_DIR/$file"
        if [[ ! -f "$file_path" ]]; then
            log "ERROR" "Missing required file: $file"
            ((validation_errors++))
        else
            # Check file is not empty
            if [[ ! -s "$file_path" ]]; then
                log "WARN" "File is empty: $file"
            fi
            
            # Check file has proper markdown structure
            if ! grep -q "^# " "$file_path"; then
                log "WARN" "File missing main heading: $file"
            fi
        fi
    done
    
    # Check configuration file
    if [[ -f "$CONFIG_FILE" ]]; then
        if ! python3 -c "import json; json.load(open('$CONFIG_FILE'))" 2>/dev/null; then
            log "ERROR" "Invalid JSON in configuration file: $CONFIG_FILE"
            ((validation_errors++))
        fi
    fi
    
    # Report validation results
    if [[ $validation_errors -eq 0 ]]; then
        log "INFO" "Memory bank integrity validation passed ✅"
        return 0
    else
        log "ERROR" "Memory bank integrity validation failed with $validation_errors errors ❌"
        return 1
    fi
}

# Backup System
create_backup() {
    log "INFO" "Creating memory bank backup..."
    
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_name="memory-bank-backup-$timestamp"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Create backup
    if cp -r "$MEMORY_BANK_DIR" "$BACKUP_DIR/$backup_name"; then
        log "INFO" "Backup created successfully: $BACKUP_DIR/$backup_name"
        
        # Update config with backup info
        if [[ -f "$CONFIG_FILE" ]]; then
            local temp_config=$(mktemp)
            python3 -c "
import json
import sys
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    
    if 'backups' not in config:
        config['backups'] = []
    
    config['backups'].append({
        'timestamp': '$timestamp',
        'path': '$BACKUP_DIR/$backup_name',
        'size': $(du -s "$BACKUP_DIR/$backup_name" | cut -f1)
    })
    
    # Keep only last 10 backups in config
    config['backups'] = config['backups'][-10:]
    
    with open('$temp_config', 'w') as f:
        json.dump(config, f, indent=2)
    
    print('Backup info updated in config')
except Exception as e:
    print(f'Error updating config: {e}', file=sys.stderr)
    sys.exit(1)
" && mv "$temp_config" "$CONFIG_FILE"
        fi
        
        # Clean old backups (keep last 5)
        ls -t "$BACKUP_DIR" | tail -n +6 | xargs -I {} rm -rf "$BACKUP_DIR/{}" 2>/dev/null || true
        
        return 0
    else
        log "ERROR" "Failed to create backup"
        return 1
    fi
}

# Auto-update functionality
auto_update_context() {
    log "INFO" "Running auto-update for memory bank context..."
    
    local current_time=$(date '+%Y-%m-%d %H:%M')
    local git_changes=""
    
    # Check for git changes if in a git repository
    if git rev-parse --git-dir > /dev/null 2>&1; then
        git_changes=$(git status --porcelain 2>/dev/null || echo "")
        
        if [[ -n "$git_changes" ]]; then
            # Update active context with recent changes
            echo "" >> "$MEMORY_BANK_DIR/activeContext.md"
            echo "### Auto-Update ($current_time)" >> "$MEMORY_BANK_DIR/activeContext.md"
            echo "Recent file changes detected:" >> "$MEMORY_BANK_DIR/activeContext.md"
            echo '```' >> "$MEMORY_BANK_DIR/activeContext.md"
            echo "$git_changes" >> "$MEMORY_BANK_DIR/activeContext.md"
            echo '```' >> "$MEMORY_BANK_DIR/activeContext.md"
            
            log "INFO" "Auto-updated active context with recent changes"
        fi
    fi
    
    # Update last modified timestamp in config
    if [[ -f "$CONFIG_FILE" ]]; then
        local temp_config=$(mktemp)
        python3 -c "
import json
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    
    config['lastUpdated'] = '$(date -u +"%Y-%m-%dT%H:%M:%SZ")'
    config['autoUpdateCount'] = config.get('autoUpdateCount', 0) + 1
    
    with open('$temp_config', 'w') as f:
        json.dump(config, f, indent=2)
    
    print('Config updated with auto-update info')
except Exception as e:
    print(f'Error updating config: {e}', file=sys.stderr)
    sys.exit(1)
" && mv "$temp_config" "$CONFIG_FILE"
    fi
}

# Context optimization
optimize_context() {
    log "INFO" "Optimizing memory bank context..."
    
    local max_length=5000  # Maximum context length
    
    for file in "$MEMORY_BANK_DIR"/*.md; do
        if [[ -f "$file" ]]; then
            local file_size=$(wc -c < "$file")
            local filename=$(basename "$file")
            
            if [[ $file_size -gt $max_length ]]; then
                log "WARN" "File $filename exceeds recommended size ($file_size > $max_length chars)"
                
                # Create optimized version
                local temp_file=$(mktemp)
                {
                    head -20 "$file"
                    echo ""
                    echo "... (content optimized for AI context) ..."
                    echo ""
                    tail -10 "$file"
                } > "$temp_file"
                
                # Backup original and replace with optimized version
                cp "$file" "$file.backup"
                mv "$temp_file" "$file"
                
                log "INFO" "Optimized $filename (backup saved as $filename.backup)"
            fi
        fi
    done
}

# Health check system
health_check() {
    log "INFO" "Running memory bank health check..."
    
    local health_score=100
    local issues=()
    
    # Check file freshness
    for file in "$MEMORY_BANK_DIR"/*.md; do
        if [[ -f "$file" ]]; then
            local file_age=$(( $(date +%s) - $(stat -f %m "$file" 2>/dev/null || stat -c %Y "$file" 2>/dev/null || echo 0) ))
            local days_old=$(( file_age / 86400 ))
            
            if [[ $days_old -gt 7 ]]; then
                issues+=("$(basename "$file") is $days_old days old")
                ((health_score -= 10))
            fi
        fi
    done
    
    # Check content quality
    if ! grep -q "Last Updated" "$MEMORY_BANK_DIR/activeContext.md" 2>/dev/null; then
        issues+=("activeContext.md missing update timestamps")
        ((health_score -= 15))
    fi
    
    # Check for empty sections
    local empty_files=0
    for file in "$MEMORY_BANK_DIR"/*.md; do
        if [[ -f "$file" && $(wc -l < "$file") -lt 5 ]]; then
            ((empty_files++))
        fi
    done
    
    if [[ $empty_files -gt 0 ]]; then
        issues+=("$empty_files files have minimal content")
        ((health_score -= $((empty_files * 5))))
    fi
    
    # Report health status
    echo ""
    echo "🏥 Memory Bank Health Report"
    echo "============================"
    echo "Health Score: $health_score/100"
    
    if [[ ${#issues[@]} -eq 0 ]]; then
        echo "✅ All checks passed - Memory bank is healthy!"
    else
        echo "⚠️  Issues found:"
        for issue in "${issues[@]}"; do
            echo "   - $issue"
        done
    fi
    
    echo ""
    
    # Return health score
    return $((100 - health_score))
}

# Analytics collection
collect_analytics() {
    if [[ -f "$CONFIG_FILE" ]]; then
        local analytics_enabled=$(python3 -c "
import json
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    print(config.get('settings', {}).get('enableAnalytics', False))
except:
    print(False)
" 2>/dev/null)
        
        if [[ "$analytics_enabled" == "True" ]]; then
            log "INFO" "Collecting usage analytics..."
            
            # Collect basic usage stats
            local stats=$(cat << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "fileCount": $(find "$MEMORY_BANK_DIR" -name "*.md" | wc -l),
  "totalSize": $(du -s "$MEMORY_BANK_DIR" | cut -f1),
  "lastModified": "$(stat -f %m "$MEMORY_BANK_DIR" 2>/dev/null || stat -c %Y "$MEMORY_BANK_DIR" 2>/dev/null || echo 0)"
}
EOF
            )
            
            # Append to analytics file
            echo "$stats" >> ".memory-bank-analytics.jsonl"
            log "INFO" "Analytics data collected"
        fi
    fi
}

# Main automation function
run_automation() {
    log "INFO" "Running memory bank automation suite..."
    
    # Create backup before any operations
    create_backup
    
    # Run validation
    if ! validate_memory_bank_integrity; then
        log "ERROR" "Validation failed - stopping automation"
        return 1
    fi
    
    # Auto-update context
    auto_update_context
    
    # Run health check
    health_check
    
    # Collect analytics if enabled
    collect_analytics
    
    log "INFO" "Automation suite completed successfully"
}

# Main execution
main() {
    local command="${1:-run}"
    
    case "$command" in
        "run")
            run_automation
            ;;
        "validate")
            validate_memory_bank_integrity
            ;;
        "backup")
            create_backup
            ;;
        "health")
            health_check
            ;;
        "optimize")
            optimize_context
            ;;
        "update")
            auto_update_context
            ;;
        *)
            echo "Usage: $0 {run|validate|backup|health|optimize|update}"
            exit 1
            ;;
    esac
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
