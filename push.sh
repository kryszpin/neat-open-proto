#!/bin/bash
# Skrypt do szybkiego wysyłania zmian na GitHub Pages

echo "🚀 Przygotowuję zmiany do wysłania..."

# 1. Dodaj wszystkie zmiany
git add .

# 2. Zatwierdź z aktualną datą i czasem
COMMIT_MSG="Update: $(date +'%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MSG"

# 3. Wyślij na serwer
echo "📦 Wysyłam na GitHub..."
git push

echo "✅ Gotowe! Zmiany powinny pojawić się na stronie za około minutę."
