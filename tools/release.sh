#!/usr/bin/env bash
# Выпуск: коммит кода → в uma.json записываются новая версия "v" и "sha" этого коммита
# (загрузчик берёт файлы с jsDelivr по sha — неизменный адрес, без смешения версий) → push.
# Использование: tools/release.sh "сообщение коммита"
set -e
cd "$(dirname "$0")/.."
MSG="$1"; FOOT="$2"
git add -A
git diff --cached --quiet || git commit -qm "$MSG$FOOT"
SHA=$(git rev-parse HEAD)
python3 - "$SHA" <<'P'
import json,sys,datetime,re,collections
p='uma.json';m=json.load(open(p),object_pairs_hook=collections.OrderedDict)
d=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=3))).strftime('%Y-%m-%d')
v=m.get('v','');n=int(v.split('.')[-1])+1 if v.startswith(d) else 1
m['v']='%s.%02d'%(d,n); m['sha']=sys.argv[1]
m.move_to_end('sha',last=False); m.move_to_end('v',last=False)
open(p,'w').write(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
print(m['v'],m['sha'][:8])
P
git add uma.json && git commit -qm "uma.json: версия и sha кода$FOOT"
for i in 1 2 3 4 5 6; do git push -q origin main 2>&1|tail -1; git fetch -q origin; [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] && { echo pushed; break; }; sleep 20; done
git push -q -f origin main:fluid main:dev 2>&1|tail -1 || true
