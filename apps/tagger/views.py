import django.shortcuts
import django.template
import django.core.urlresolvers
import django.http
import django.contrib.auth.decorators
import contextlib
import urllib
import tagger.models
import json
import re

def get_mime_type_cache(url, mime_type = ''):
    caches = tagger.models.MimeTypeCache.objects.filter(url=url)
    if caches:
        return caches[0]
    cache = tagger.models.MimeTypeCache(url=url, mime_type=mime_type)
    cache.save()
    return cache

def get_mime_type(url):
    return get_mime_type_cache(url).mime_type

def get_document(url):
    docs = tagger.models.Document.objects.filter(url=url)
    if docs:
        return docs[0]
    doc = tagger.models.Document(url=url)
    doc.save()
    return doc

def get_tag(name):
    tags = tagger.models.Tag.objects.filter(name=name)
    if tags:
        return tags[0]
    tag = tagger.models.Tag(name=name)
    tag.save()
    return tag


def tags_json(request):
    term = request.GET['term']

    data = [{"id": tag.id, "label": tag.name, "value": tag.name}
            for tag in
            tagger.models.Tag.objects.filter(name__icontains = term)[:10]]
    
    return django.http.HttpResponse(json.dumps(data), "text/json")


def remove_tag(request):
    src = tagger.models.Object.objects.get(id=int(request.GET['id']))
    tag = get_tag(request.GET['tag'])

    for tagging in tagger.models.Tagging.objects.filter(src=src, tag=tag):
        tagging.delete()
    return django.http.HttpResponse("true", "text/json");

def add_tag(request):
    src = tagger.models.Object.objects.get(id=int(request.GET['id']))
    tag = get_tag(request.GET['tag'])

    tagging = tagger.models.Tagging(src=src, tag=tag)
    tagging.save()
    return django.http.HttpResponse("true", "text/json");


def select(request):
    url = urllib.unquote(request.GET['url'])
    doc = get_document(url)
    order = int(request.GET['order'])
    selector = request.GET['selector']
    excerpt = request.GET['excerpt']
    selectors = doc.ranges.order_by("-order")
    if selectors:
        old_order = selectors[0].order
        print old_order, order
        assert old_order + 1 == order
    else:
        assert order == 0

    rng = tagger.models.Range(document=doc, order=order, selector=selector, excerpt=excerpt)
    rng.save()
    return django.http.HttpResponse(json.dumps(rng.id), "text/json");

def data(request):
    url = urllib.unquote(request.GET['url'])
    doc = get_document(url)
    data = [{"selector":json.loads(rng.selector),
             "id": rng.id,
             "order": rng.order,
             "tags": [{'tag': tagging.tag.name, 'type': tagging.tag.type and tagging.tag.type.name, 'dst': tagging.dst and tagging.dst.id}
                      for tagging in rng.tags.all()]}
            for rng in doc.ranges.order_by("order")]
    data = django.template.loader.get_template('tagger/data.js').render(django.template.RequestContext(request, {"url": url, "selections": json.dumps(data)})).encode("utf-8")
    return django.http.HttpResponse(data, "text/javascript");


#@django.contrib.auth.decorators.login_required
def view(request):
    url = urllib.unquote(request.GET['url'])
    print "VIEW", url
    if not url.startswith("http://"):
        return django.shortcuts.redirect("/badgerbadger/tagger/view?url=" + urllib.quote_plus("http://" + url))

    mime_type = get_mime_type(url)
    if mime_type and mime_type not in ("text/html", "text/xhtml"):
        return django.shortcuts.redirect(url)

    try:
        with contextlib.closing(urllib.urlopen(url)) as f:
            info = f.info()
            document = f.read()
    except IOError, e:
        raise django.http.Http404("Unable to load the page at '%s'" % (url,))

    if not mime_type:
        mime_type = info.gettype()
        cache = get_mime_type_cache(url, info.gettype())

    if mime_type and mime_type not in ("text/html", "text/xhtml"):
        return django.shortcuts.redirect(url)

    # Ok, so not much we can do here... give up and give original page...
    if '</head>' not in document or '</body>' not in document:
        return django.shortcuts.redirect(url)

    header = django.template.loader.get_template('tagger/header.html').render(django.template.RequestContext(request, {"url": url})).encode("utf-8")
    body = django.template.loader.get_template('tagger/body.html').render(django.template.RequestContext(request, {})).encode("utf-8")

    a, b = document.split("</head>")
    document = a + header + "</head>" + b

    a, b = document.split("</body>")
    document = a + body + "</body>" + b

    return django.http.HttpResponse(document, mimetype=info['Content-Type'])

def search(request):
    results = tagger.models.Range.objects

    for name in request.GET.getlist('tags[]'):
        results = results.filter(tags__tag__name = name)

    results = results.all().order_by("tags__time")[:10]

    return django.shortcuts.render_to_response('tagger/search.html', {"results": results}, context_instance=django.template.RequestContext(request))


def index(request):
    return django.shortcuts.render_to_response('tagger/index.html', {}, context_instance=django.template.RequestContext(request))


def go(request, id):
    for obj in tagger.models.Object.objects.filter(id=int(id)):
        obj = obj.subclassobject
        if hasattr(obj, "range"):
            url = "/badgerbadger/tagger/view?url=%s#selection_%s" % (urllib.quote_plus(obj.document.url), obj.order)
            return django.shortcuts.redirect(url)

    raise django.http.Http404("Unable to find object with id %s" % (id,))


# The very very sneaky way to get absolute path-only URL:s to work...
def other(request):
    url = request.get_full_path()
    referer = None
    try:
        referer = request.META.get('HTTP_REFERER', '')
        match = re.match(r".*(/badgerbadger/tagger/view\?url=.*//[^/]*)(/.*)?", referer)
        if match:
            baseurl = match.groups()[0]
            url = baseurl + "/" + urllib.quote_plus(url)
            return django.shortcuts.redirect(url)
    except:
        import traceback
        traceback.print_exc()

    print "Unable to load the page at '%s' from '%s'" % (url, referer)
    raise django.http.Http404("Unable to load the page at '%s' from '%s'" % (url, referer))
