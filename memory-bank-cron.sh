#!/bin/bash
# Memory Bank Automation Cron Job
# Add to crontab with: crontab -e
# 0 */6 * * * /path/to/your/project/memory-bank-cron.sh

cd "$(dirname "$0")"
./memory-bank-automation.sh run >> memory-bank-automation.log 2>&1
