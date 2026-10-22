"""Read-only HTTP audit of every URL in the site's declared sitemaps.

Run: python scripts/verify-indexing.py --base http://127.0.0.1:4176 --output tmp/indexing-report.json
The canonical origin stays https://lnkmx.my when checking a local/preview build.
No JavaScript, credentials, model calls or search-engine submission is used.
"""
import argparse
import concurrent.futures
import json
import re
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path


class Head(HTMLParser):
    def __init__(self):
        super().__init__()
        self.titles, self.canonicals, self.robots, self.links = [], [], [], []
        self.in_title = False
        self.in_h1 = False
        self.h1 = []
        self.description = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title':
            self.in_title = True
            self.titles.append('')
        if tag == 'h1':
            self.in_h1 = True
            self.h1.append('')
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonicals.append(attrs.get('href', ''))
        if tag == 'meta' and attrs.get('name', '').lower() in ('robots', 'googlebot'):
            self.robots.append(attrs.get('content', ''))
        if tag == 'meta' and attrs.get('name') == 'description':
            self.description.append(attrs.get('content', ''))
        if tag == 'a':
            self.links.append(attrs.get('href', ''))

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        if tag == 'h1':
            self.in_h1 = False

    def handle_data(self, data):
        if self.in_title:
            self.titles[-1] += data
        if self.in_h1:
            self.h1[-1] += data


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', default='https://lnkmx.my')
    parser.add_argument('--canonical-origin', default='https://lnkmx.my')
    parser.add_argument('--output', default='tmp/indexing-report.json')
    args = parser.parse_args()
    base, origin = args.base.rstrip('/'), args.canonical_origin.rstrip('/')

    def request(path):
        try:
            req = urllib.request.Request(base + urllib.parse.quote(path, safe='/?=&%:+,'), headers={'User-Agent': 'Mozilla/5.0 (compatible; LinkMAX-Indexing-Readiness/1.0)'})
            with urllib.request.build_opener(NoRedirect).open(req, timeout=30) as response:
                return response.status, dict(response.headers), response.read().decode('utf-8', 'replace')
        except urllib.error.HTTPError as error:
            return error.code, dict(error.headers), error.read().decode('utf-8', 'replace')

    def header(headers, name):
        return next((v for k, v in headers.items() if k.lower() == name.lower()), '')

    errors, urls, sitemaps = [], set(), []
    status, _, robots = request('/robots.txt')
    if status != 200:
        errors.append('robots.txt: HTTP ' + str(status))
    queue = re.findall(r'^Sitemap:\s*(\S+)', robots, re.M)
    seen = set()
    while queue:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        parsed = urllib.parse.urlsplit(url)
        if parsed.netloc != urllib.parse.urlsplit(origin).netloc:
            errors.append('Off-origin sitemap: ' + url)
            continue
        path = parsed.path
        try:
            status, _, xml = request(path)
            if status != 200:
                raise ValueError('HTTP ' + str(status))
            root = ET.fromstring(xml)
            namespace = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
            entry = 'sitemap' if root.tag == namespace + 'sitemapindex' else 'url'
            locations = [e.text for e in root.findall(namespace + entry + '/' + namespace + 'loc') if e.text]
            sitemaps.append({'path': path, 'entries': len(locations)})
            if root.tag.endswith('sitemapindex'):
                queue.extend(locations)
            elif root.tag.endswith('urlset'):
                if not locations:
                    raise ValueError('Empty sitemap must not be advertised until it contains public URLs')
                urls.update(locations)
            else:
                raise ValueError('Not a sitemap document')
        except Exception as error:
            errors.append(path + ': ' + str(error))

    def check(url):
        parsed = urllib.parse.urlsplit(url)
        if parsed.netloc != urllib.parse.urlsplit(origin).netloc:
            return {'url': url, 'issues': ['Off-origin page in sitemap']}
        path = parsed.path + ('?' + parsed.query if parsed.query else '')
        issues = []
        try:
            status, headers, body = request(path)
            head = Head()
            head.feed(body)
            if status != 200:
                issues.append('HTTP ' + str(status))
            if len(head.titles) != 1 or not head.titles[0].strip():
                issues.append('Expected one non-empty title')
            if len(head.canonicals) != 1 or urllib.parse.unquote(head.canonicals[0]).rstrip('/') != urllib.parse.unquote(url).rstrip('/'):
                issues.append('Missing, duplicate or non-self canonical')
            if not any(head.h1):
                issues.append('No server-rendered H1/content')
            if len(head.description) != 1 or not head.description[0].strip():
                issues.append('Missing or duplicate description')
            if 'noindex' in ','.join(head.robots) + header(headers, 'X-Robots-Tag'):
                issues.append('Sitemap URL is noindex')
            if path in ('/experts', '/gallery') and not any(re.search(r'/(?:elazart|bcchub)(?:$|[?#])', link) for link in head.links):
                issues.append('No server-rendered profile links')
            for payload in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', body, re.S):
                json.loads(payload)
            return {'url': url, 'status': status, 'title': head.titles, 'canonical': head.canonicals, 'issues': issues}
        except Exception as error:
            return {'url': url, 'issues': [str(error)]}

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        pages = list(pool.map(check, sorted(urls)))
    for page in pages:
        errors.extend(page['url'] + ': ' + issue for issue in page['issues'])
    probes = []
    for path, expected in [('/indexing-missing-profile-20261022', 404), ('/dashboard', 200), ('/auth', 200)]:
        try:
            status, headers, body = request(path)
            noindex = 'noindex' in header(headers, 'X-Robots-Tag')
            probes.append({'path': path, 'status': status, 'noindex': noindex})
            if status != expected or not noindex:
                errors.append(path + ': unexpected status or missing noindex')
        except Exception as error:
            errors.append(path + ': ' + str(error))
    report = {'base': base, 'sitemaps': sitemaps, 'checked': len(pages), 'errors': errors, 'pages': pages, 'probes': probes}
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'checked': len(pages), 'sitemaps': sitemaps, 'errors': errors}, ensure_ascii=True))
    raise SystemExit(1 if errors else 0)


if __name__ == '__main__':
    main()
