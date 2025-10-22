#!/bin/bash
# Fix type errors in remaining server action files

for file in review-submittal.ts update-submittal.ts get-submittal-detail.ts get-my-pending-reviews.ts delete-attachment.ts upload-attachment.ts; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    # Add type assertion after .single()
    sed -i 's/\.single();$/.single()) as any;/g' "$file"
    # Add type assertion after .limit()
    sed -i 's/\.limit([0-9]*)$/&) as any/g' "$file" 
  fi
done
