#!/bin/bash

# Script to migrate Next.js imports to next-intl routing

echo "🔄 Migrating imports to next-intl routing..."

# Find all TypeScript/TSX files excluding .history and node_modules
FILES=$(find app components -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/\.history/*" ! -path "*/node_modules/*")

for file in $FILES; do
  # Replace: import Link from 'next/link' → import { Link } from '@/i18n/routing'
  if grep -q "import Link from 'next/link'" "$file"; then
    sed -i '' "s|import Link from 'next/link'|import { Link } from '@/i18n/routing'|g" "$file"
    echo "✅ Updated Link import in: $file"
  fi

  # Replace: import { useRouter } from 'next/navigation' → import { useRouter } from '@/i18n/routing'
  if grep -q "import.*useRouter.*from 'next/navigation'" "$file"; then
    # Handle multiple imports from next/navigation
    if grep -q "import {.*useRouter.*,.*} from 'next/navigation'" "$file"; then
      # Multiple imports - more complex, skip for manual review
      echo "⚠️  Manual review needed for: $file (multiple imports from next/navigation)"
    else
      sed -i '' "s|import { useRouter } from 'next/navigation'|import { useRouter } from '@/i18n/routing'|g" "$file"
      sed -i '' "s|import {useRouter} from 'next/navigation'|import { useRouter } from '@/i18n/routing'|g" "$file"
      echo "✅ Updated useRouter import in: $file"
    fi
  fi

  # Replace: import { redirect } from 'next/navigation' → import { redirect } from '@/i18n/routing'
  if grep -q "import.*redirect.*from 'next/navigation'" "$file"; then
    if grep -q "import {.*redirect.*,.*} from 'next/navigation'" "$file"; then
      echo "⚠️  Manual review needed for: $file (multiple imports from next/navigation)"
    else
      sed -i '' "s|import { redirect } from 'next/navigation'|import { redirect } from '@/i18n/routing'|g" "$file"
      sed -i '' "s|import {redirect} from 'next/navigation'|import { redirect } from '@/i18n/routing'|g" "$file"
      echo "✅ Updated redirect import in: $file"
    fi
  fi
done

echo ""
echo "✨ Migration complete!"
echo "⚠️  Please review files marked for manual review"
echo "⚠️  Test your app to ensure everything works correctly"
