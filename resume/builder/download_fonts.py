#!/usr/bin/env python3
"""Download and verify DejaVu Sans 2.37 for local PDF builds."""

from hashlib import sha256
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen
from zipfile import ZipFile


BASE = Path(__file__).resolve().parent
DEST = BASE / 'fonts'
URL = ('https://downloads.sourceforge.net/project/dejavu/dejavu/2.37/'
       'dejavu-fonts-ttf-2.37.zip')
EXPECTED_SHA256 = '7576310b219e04159d35ff61dd4a4ec4cdba4f35c00e002a136f00e96a908b0a'
FILES = {
    'ttf/DejaVuSans.ttf': 'DejaVuSans.ttf',
    'ttf/DejaVuSans-Bold.ttf': 'DejaVuSans-Bold.ttf',
    'LICENSE': 'LICENSE.txt',
}


def install():
    request = Request(URL, headers={'User-Agent': 'LewisMotenResumeBuilder/1.0'})
    with urlopen(request, timeout=60) as response:
        archive = response.read()
    digest = sha256(archive).hexdigest()
    if digest != EXPECTED_SHA256:
        raise ValueError(f'DejaVu archive checksum mismatch: {digest}. No files installed.')

    with ZipFile(BytesIO(archive)) as zipped:
        contents = {}
        for suffix, destination in FILES.items():
            matches = [name for name in zipped.namelist()
                       if name.endswith('/' + suffix) or name == suffix]
            if len(matches) != 1:
                raise ValueError(f'Expected exactly one {suffix} in font archive')
            contents[destination] = zipped.read(matches[0])

    DEST.mkdir(exist_ok=True)
    for filename, data in contents.items():
        (DEST / filename).write_bytes(data)
        print(f'Installed {DEST / filename}')


if __name__ == '__main__':
    install()
