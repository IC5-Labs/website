#!/usr/bin/env bash
# Local test helper: recreate the database, then migrate and seed.
set -euo pipefail
psql -h localhost -p 5433 -U app -d postgres -qc "drop database if exists ic5" -c "create database ic5"
npx tsx scripts/migrate.ts && npx tsx scripts/seed.ts
