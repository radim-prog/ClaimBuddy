#!/bin/bash
# Nightly deploy: dev-features → main → build → restart
# Run via cron at 2:00 AM

LOG="/var/log/ucetni-deploy.log"
APP_DIR="/root/Projects/UcetniWebApp"
SERVICE="ucetni-webapp"

echo "$(date) — Starting nightly deploy" >> $LOG

cd $APP_DIR || exit 1

# 1. Fetch latest
git fetch origin >> $LOG 2>&1

# 2. Check if dev-features has new commits vs main
LOCAL_MAIN=$(git rev-parse main)
REMOTE_DEV=$(git rev-parse origin/dev-features)
if [ "$LOCAL_MAIN" = "$REMOTE_DEV" ]; then
  echo "$(date) — No changes, skipping" >> $LOG
  exit 0
fi

# 3. Merge dev-features into main
git checkout main >> $LOG 2>&1
git merge origin/dev-features --no-edit >> $LOG 2>&1
if [ $? -ne 0 ]; then
  echo "$(date) — MERGE FAILED, aborting" >> $LOG
  git merge --abort
  exit 1
fi

# 4. Build
npm run build >> $LOG 2>&1
if [ $? -ne 0 ]; then
  echo "$(date) — BUILD FAILED, reverting" >> $LOG
  git reset --hard $LOCAL_MAIN
  exit 1
fi

# 5. Copy static assets for standalone mode
cp -r .next/static .next/standalone/.next/static >> $LOG 2>&1

# 6. Push + restart
git push origin main >> $LOG 2>&1
systemctl restart $SERVICE
sleep 10

# 7. Health check
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/)
if [ "$HTTP_CODE" != "200" ]; then
  echo "$(date) — HEALTH CHECK FAILED ($HTTP_CODE), rolling back" >> $LOG
  systemctl stop $SERVICE
  git reset --hard $LOCAL_MAIN
  npm run build >> $LOG 2>&1
  cp -r .next/static .next/standalone/.next/static >> $LOG 2>&1
  systemctl start $SERVICE
  exit 1
fi

echo "$(date) — Deploy successful: $LOCAL_MAIN → $REMOTE_DEV" >> $LOG
