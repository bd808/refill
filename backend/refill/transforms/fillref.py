import re

from .transform import Transform
from ..formatters import CiteTemplate
from ..dataparsers import DefaultChain
from ..models import Citation
from ..utils import Parser, NoTitleError

from concurrent.futures import as_completed
from urllib.parse import urlparse

import time

class FillRef(Transform):
    def __init__(self, ctx=None):
        super().__init__(ctx)
        self.formatter = CiteTemplate()

    def apply(self, wikicode):
        tags = wikicode.filter_tags()

        futures = set()

        refCount = 0
        completeCount = 0
        errored = False

        self._ctx.reportProgress('SCANNING', 0, {})
        for tag in tags:
            if tag.tag != 'ref' or tag.self_closing or not tag.contents:
                continue

            if 'Retrieved' in tag.contents:
                # Do not touch such citations
                continue

            citation = Parser.parse(tag.contents)
            if not citation or 'title' in citation:
                continue

            refCount += 1

            futures.add(self._ctx.executor.submit(self._fulfill, citation, tag))

        for future in as_completed(futures):
            try:
                result = future.result()
                if result['successful']:
                    completeCount += 1
                    changeId = self._ctx.reportChange(result['change'])

                    changeMarker = 'RFLc%dLFR' % changeId
                    result['tag'].contents = changeMarker + str(result['tag'].contents)
                else:
                    errored = True
                    errorId = self._ctx.reportError({
                        'type': type(result['error']).__name__,
                        'traceback': str(result['error'].__traceback__),
                    })

                    errorMarker = 'RFLe%dLFR' % errorId
                    result['tag'].contents = errorMarker + str(result['tag'].contents)
            except Exception as e:
                errored = True
                errorId = self._ctx.reportError({
                    'type': 'unknown',
                    'message': str(e),
                })

            self._ctx.reportProgress('FETCHING', completeCount / refCount, {
                'count': completeCount,
            })

        if not errored:
            linkrot_templates = [
                'bare',
                'bare links',
                'barelinks',
                'bare url',
                'bare references',
                'bare refs',
                'bare urls',
                'cleanup link rot',
                'cleanup link-rot',
                'cleanup-link-rot',
                'cleanup-linkrot',
                'link rot',
                'linkrot',
                'cleanup-bare urls',
            ]
            for template in wikicode.ifilter_templates():
                if template.name.lower() in linkrot_templates:
                    wikicode.remove(template)

        return wikicode

    def _fulfill(self, citation, tag):
        url = citation.url
        err = None

        citation.freezeOriginal()

        starttime = time.time()
        for p in DefaultChain:
            try:
                p.apply(citation)
            except Exception as e:
                err = e
                break

        endtime = time.time()
        print('took {}'.format(endtime-starttime))

        if 'url' in citation and 'title' in citation:
            old = tag.contents
            new = self.formatter.format(citation)
            tag.contents = new
            change = {
                "old": str(old),
                "new": str(new),
                "meta": {
                    "type": citation.type,
                },
            }
            return {
                "successful": True,
                "tag": tag,
                "change": change,
            }
        elif err:
            return {
                "successful": False,
                "tag": tag,
                "error": err,
            }
        else:
            return {
                "successful": False,
                "tag": tag,
                "error": NoTitleError(url),
            }

        return False
