"""Summarize saved responses; unknown labels and failures never count as passes."""
import collections
import json
from pathlib import Path
import statistics

ROOT = Path(__file__).resolve().parent


def summarize(directory):
    manifest = json.loads((directory / 'manifest.json').read_text())
    path = directory / 'responses.jsonl'
    rows = [json.loads(line) for line in path.read_text().splitlines()] if path.exists() else []
    by_variant = collections.defaultdict(list)
    for row in rows:
        by_variant[row['variant']].append(row)
    variants = {}
    for variant, records in by_variant.items():
        scored = [r for r in records if r['expected'] is not None]
        variants[variant] = {
            'completed': len(records),
            'planned': len(manifest['cases']) * manifest['repeat'],
            'scored': len(scored),
            'matches': sum(r['valid'] and r['answer'] == str(r['expected']) for r in scored),
            'false_rejects': [r['case_id'] for r in scored if r['valid'] and r['expected'] == 1 and r['answer'] == '0'],
            'false_accepts': [r['case_id'] for r in scored if r['valid'] and r['expected'] == 0 and r['answer'] == '1'],
            'invalid': sum(not r['valid'] for r in records),
            'models': dict(collections.Counter(r['model'] for r in records)),
            'median_prompt_tokens': statistics.median(r['usage']['prompt_tokens'] for r in records),
            'median_seconds': round(statistics.median(r['seconds'] for r in records), 3),
            'reasoning_tokens': sorted({r['usage'].get('completion_tokens_details', {}).get('reasoning_tokens') for r in records}, key=str),
        }
    anchor = next((name for name in ['candidate', 'hardened', 'refined', 'compact'] if name in variants), None)
    paired = {}
    lookup = {(r['case_id'], r['repeat'], r['variant']): r for r in rows}
    for variant in variants:
        if variant == anchor:
            continue
        pairs = [(r, lookup.get((r['case_id'], r['repeat'], variant))) for r in rows if r['variant'] == anchor]
        comparable = [(a, b) for a, b in pairs if b and a['model'] == b['model'] and a['valid'] and b['valid']]
        paired[variant] = {'same_model_pairs': len(comparable),
                           'different_decisions': [{'case_id': a['case_id'], anchor: a['answer'], variant: b['answer']} for a, b in comparable if a['answer'] != b['answer']]}
    return {'run': directory.name, 'phase': manifest['phase'], 'variants': variants, 'paired_anchor': anchor, 'paired_comparisons': paired}


if __name__ == '__main__':
    print(json.dumps([summarize(p) for p in sorted((ROOT / 'results').iterdir()) if p.is_dir() and (p / 'manifest.json').exists()], ensure_ascii=False, indent=2))
