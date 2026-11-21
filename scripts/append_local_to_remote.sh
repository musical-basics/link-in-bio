#!/bin/bash

# --- CONFIGURATION ---

# 1. Local Docker Database (Source)
LOCAL_DB_URL="${LOCAL_DB_URL:-postgresql://postgres@localhost:5432/postgres}"  # no password in the file

# 2. Remote Supabase Database (Destination)
# Set REMOTE_DATABASE_URL in the environment (e.g. the DIRECT_URL from .env.production); never write it in this file.
if [ -z "$REMOTE_DATABASE_URL" ]; then
    echo "❌ Error: set REMOTE_DATABASE_URL to the remote Postgres URL before running this script."
    exit 2
fi
REMOTE_DB_URL="$REMOTE_DATABASE_URL"

# 3. Which tables do you want to sync?
# Order matters because of foreign keys (User first)
TABLES_TO_SYNC=("User" "Profile" "Group" "Link" "TimelineEvent")

# --- SCRIPT START ---

echo "--- 🚀 Starting Safe Merge: Local -> Remote ---"

# Manually constructing the command with correct quoting for sensitive shell environments
# Prisma uses PascalCase ("User", "Profile") which requires strict quoting in pg_dump
DUMP_CMD="docker exec -e PGPASSWORD=password local-db pg_dump -U postgres --data-only --column-inserts"

# Add tables individually with quotes preserved
DUMP_CMD="$DUMP_CMD -t '\"User\"' -t '\"Profile\"' -t '\"Group\"' -t '\"Link\"' -t '\"TimelineEvent\"'"

echo "1. Exporting data from Local Docker DB..."
# Execute the dump and save to a temporary file
eval $DUMP_CMD > temp_merge.sql

if [ ! -s temp_merge.sql ]; then
    echo "❌ Error: Dump file is empty. Check your local DB connection or table names."
    rm temp_merge.sql
    exit 1
fi

echo "2. Transforming data to 'Safe Append' mode..."
# Strictly match lines starting with "INSERT INTO" and modify their ending
# This avoids breaking system calls like "SELECT pg_catalog.set_config(...);"
sed -i '' '/^INSERT INTO/s/);$/) ON CONFLICT DO NOTHING;/g' temp_merge.sql

echo "3. Uploading to Remote Supabase DB..."
echo "   Target: $(printf '%s' "$REMOTE_DB_URL" | sed -E 's#(://[^:/@]+):[^@]*@#\1:****@#')"
echo "   Tables: ${TABLES_TO_SYNC[*]}"
read -p "⚠️  Are you sure you want to write to REMOTE? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "   Aborted."
    rm temp_merge.sql
    exit 1
fi

# Run psql to apply the file
# We use the local psql client since we confirmed it is installed (v18.1)
psql "$REMOTE_DB_URL" < temp_merge.sql

echo "✅ Merge Complete!"
echo "   - Existing rows on Remote were PRESERVED."
echo "   - New rows from Local were ADDED."

# Cleanup
rm temp_merge.sql
