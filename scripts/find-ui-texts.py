import re
from pathlib import Path
import json

texts = set()
for p in Path('src').rglob('*.tsx'):
    content = p.read_text(encoding='utf-8')
    matches = re.findall(r'tts\.speak\(\s*[\'"`]([^\n\r]+?)[\'"`]', content)
    for m in matches:
        if m and not m.startswith('$') and not m.startswith('{'):
            texts.add(m)

# Also feedback.json
feedback = json.loads(Path('src/content/feedback.json').read_text(encoding='utf-8'))
for v in feedback.values():
    for f in v:
        texts.add(f)

print(f"Total UI spoken texts: {len(texts)}")
for t in sorted(texts):
    print(f" * {t}")

