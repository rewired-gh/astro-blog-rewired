"""Offline experiment files only. Never submits comments or modifies production.
Python 3.11+; API key from ARK_API_KEY or LLM_API_KEY, never written to results.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import random
import time
import tomllib
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--phase', choices=['development', 'heldout', 'boundary', 'verification'], required=True)
    parser.add_argument('--variants', nargs='+', required=True)
    parser.add_argument('--run', required=True, help='Unique run name, reused only for resume')
    parser.add_argument('--case-ids', nargs='+', help='Optional subset for repeat probes')
    parser.add_argument('--seed', type=int, default=9173)
    parser.add_argument('--repeat', type=int, default=1)
    args = parser.parse_args()
    if Path(args.run).name != args.run or args.run in ('.', '..'):
        parser.error('run must be a single directory name')
    if args.repeat < 1:
        parser.error('repeat must be positive')
    key = os.environ.get('ARK_API_KEY') or os.environ.get('LLM_API_KEY')
    if not key:
        parser.error('set ARK_API_KEY or LLM_API_KEY')
    config = tomllib.loads((ROOT.parent.parent / 'wrangler.toml').read_text())['vars']
    endpoint = config['LLM_API_ENDPOINT'].rstrip('/') + '/chat/completions'
    if endpoint != 'https://ark.cn-beijing.volces.com/api/v3/chat/completions':
        parser.error('This experiment is scoped to the configured Ark endpoint')
    model = config['LLM_MODEL']
    variants = {}
    for name in args.variants:
        if Path(name).name != name:
            parser.error('variant must be a prompt file stem')
        variants[name] = (ROOT / 'prompts' / (name + '.txt')).read_text().strip()
    cases = [c for c in json.loads((ROOT / 'cases.json').read_text()) if c['split'] == args.phase]
    if args.case_ids:
        if not set(args.case_ids).issubset({c['id'] for c in cases}):
            parser.error('Unknown case ID for this phase')
        cases = [c for c in cases if c['id'] in args.case_ids]
    if not cases or len({c['id'] for c in cases}) != len(cases):
        parser.error('empty phase or duplicate case IDs')
    settings = {'model': model, 'thinking': {'type': 'disabled'}, 'max_tokens': 8, 'temperature': 0}
    spec = {'phase': args.phase, 'variants': variants, 'cases': cases,
            'settings': settings, 'endpoint': endpoint, 'seed': args.seed, 'repeat': args.repeat}
    fingerprint = digest(spec)
    out = ROOT / 'results' / args.run
    out.mkdir(parents=True, exist_ok=True)
    manifest = out / 'manifest.json'
    if manifest.exists():
        if json.loads(manifest.read_text())['fingerprint'] != fingerprint:
            parser.error('Run inputs changed; use a new run name')
    else:
        manifest.write_text(json.dumps({'fingerprint': fingerprint, **spec}, ensure_ascii=False, indent=2) + '\n')
    results = out / 'responses.jsonl'
    done = {json.loads(line)['trial_id'] for line in results.read_text().splitlines()} if results.exists() else set()
    rng = random.Random(args.seed)
    rng.shuffle(cases)
    trials = []
    for repeat in range(args.repeat):
        for case in cases:
            names = list(variants)
            rng.shuffle(names)
            trials.extend((repeat, case, name) for name in names)
    errors = out / 'errors.jsonl'
    completed = 0
    for repeat, case, name in trials:
        trial_id = f"{repeat}:{case['id']}:{name}"
        if trial_id in done:
            continue
        user = json.dumps({'昵称': case['name'], '邮箱': case['email'], '评论': case['content']}, ensure_ascii=False)
        body = {**settings, 'messages': [{'role': 'system', 'content': variants[name]},
                                       {'role': 'user', 'content': user}]}
        for attempt in range(3):
            start = time.monotonic()
            req = urllib.request.Request(endpoint, data=json.dumps(body).encode(),
                  headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key})
            try:
                with urllib.request.urlopen(req, timeout=25) as response:
                    data = json.load(response)
                choice = data['choices'][0]
                answer = (choice['message'].get('content') or '').strip()
                usage = data.get('usage', {})
                record = {'trial_id': trial_id, 'variant': name, 'case_id': case['id'],
                          'repeat': repeat, 'expected': case['expected'], 'answer': answer,
                          'valid': answer in ('0', '1') and choice.get('finish_reason') == 'stop',
                          'model': data.get('model'), 'finish_reason': choice.get('finish_reason'),
                          'usage': usage, 'seconds': round(time.monotonic() - start, 3),
                          'timestamp_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
                with results.open('a') as f:
                    f.write(json.dumps(record, ensure_ascii=False) + '\n')
                completed += 1
                if completed % 10 == 0:
                    print(json.dumps({'run': args.run, 'completed_this_process': completed,
                                      'last_model': record['model']}, ensure_ascii=False), flush=True)
                break
            except (urllib.error.URLError, TimeoutError, KeyError, IndexError, ValueError) as error:
                code = error.code if isinstance(error, urllib.error.HTTPError) else None
                event = {'trial_id': trial_id, 'attempt': attempt + 1,
                         'error_type': type(error).__name__, 'http_status': code}
                with errors.open('a') as f:
                    f.write(json.dumps(event) + '\n')
                print(json.dumps(event), flush=True)
                if code == 429 and attempt < 2:
                    time.sleep(60)
                else:
                    raise SystemExit('No verdict recorded; resume this run after resolving the API failure') from None
        time.sleep(0.3)
    print(json.dumps({'run': args.run, 'complete': True, 'total_trials': len(trials)}), flush=True)


if __name__ == '__main__':
    main()
