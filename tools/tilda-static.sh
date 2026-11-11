#!/usr/bin/env bash
# Статичный сайт для Тильды: сборка → ветка static (файлы для jsDelivr) → вставки tilda/static-head.html и tilda/static-body.html.
# Использование: tools/tilda-static.sh   (FOOT — необязательная приписка к сообщению коммита)
set -e
cd "$(dirname "$0")/.."
node site/build.mjs
node tools/tilda-embed.mjs assets
WT=$(mktemp -d)
git fetch -q origin static 2>/dev/null && git worktree add -q "$WT" origin/static 2>/dev/null || { git worktree add -q --detach "$WT"; (cd "$WT" && git checkout -q --orphan static-tmp && git rm -rqf . >/dev/null 2>&1 || true); }
(cd "$WT" && find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} + && cp -R "$OLDPWD/site/dist-tilda/." . && git add -A && { git diff --cached --quiet || git commit -qm "Статичный сайт для Тильды (собрано из main $(git -C "$OLDPWD" rev-parse --short HEAD))${FOOT:-}"; } && git push -q origin HEAD:refs/heads/static)
SHA=$(git -C "$WT" rev-parse HEAD)
git worktree remove --force "$WT"
node tools/tilda-embed.mjs snippets "https://cdn.jsdelivr.net/gh/UlyanaNechipor/uma_studio@$SHA/"
echo "static: $SHA"
