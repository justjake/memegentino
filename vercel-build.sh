#!/bin/bash
set -eo pipefail

blitz build

if [[ -n "$DATABASE_URL_MIGRATE" ]]; then
  DATABASE_URL="$DATABASE_URL_MIGRATE" prisma migrate deploy
fi
