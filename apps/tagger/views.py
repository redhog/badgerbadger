import django.shortcuts
import django.template
import django.core.urlresolvers
import django.http
import django.contrib.auth.decorators
import contextlib
import urllib
import tagger.models
import json


def selections(request, url):
    docs = tagger.models.Document.objects.filter(url=url)
    data = []

    if len(docs):
        for rng in docs[0].ranges.order_by("order"):
            data.append({"selector": json.loads(rng.selector), "tags":[]})

    data = django.template.loader.get_template('tagger/selections.js').render(django.template.RequestContext(request, {"selections": json.dumps(data)})).encode("utf-8")

    return django.http.HttpResponse(data, "text/javascript");


#@django.contrib.auth.decorators.login_required
def view(request, url):
    with contextlib.closing(urllib.urlopen(url)) as f:
        info = f.info()
        document = f.read()

    if info.gettype() in ("text/html", "text/xhtml"):
        header = django.template.loader.get_template('tagger/header.html').render(django.template.RequestContext(request, {"url": url})).encode("utf-8")
        body = django.template.loader.get_template('tagger/body.html').render(django.template.RequestContext(request, {})).encode("utf-8")

        a, b = document.split("</head>")
        document = a + header + "</head>" + b

        a, b = document.split("</body>")
        document = a + body + "</body>" + b

    return django.http.HttpResponse(document, mimetype=info['Content-Type'])
