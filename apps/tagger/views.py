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
import sys
import fcdjangoutils.jsonview

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

# Returns data useful for both tab-completion and getting tag metadata
@fcdjangoutils.jsonview.json_view
def tags_json(request):
    return tagger.models.Tag.objects.filter(name__icontains = request.GET['term'])[:10]

@fcdjangoutils.jsonview.json_view
def remove_tag(request):
    src = tagger.models.Object.objects.get(id=int(request.GET['id']))
    tag = get_tag(request.GET['tag'])

    for tagging in tagger.models.Tagging.objects.filter(src=src, tag=tag):
        tagging.delete()
    return True


@fcdjangoutils.jsonview.json_view
def create_object(request):
    obj = fcdjangoutils.jsonview.from_json(request.GET['obj'])
    obj.save()
    return obj

@fcdjangoutils.jsonview.json_view
def delete_object(request):
    obj = fcdjangoutils.jsonview.from_json(request.GET['obj'])
    obj.delete()

def data(request):
    url = urllib.unquote(request.GET['url'])
    doc = get_document(url)
    data = doc.ranges.order_by("order")
    data = fcdjangoutils.jsonview.to_json(data)
    data = django.template.loader.get_template('tagger/data.js').render(django.template.RequestContext(request, {"url": url, "selections": data})).encode("utf-8")
    return django.http.HttpResponse(data, "text/javascript");


#@django.contrib.auth.decorators.login_required
def view(request):
    url = urllib.unquote(request.GET['url'])
    print "VIEW", url
    if not url.startswith("http://") or url.startswith("https://"):
        if ':/' in url:
            raise django.http.Http404("Sorry, we only dig http and https:// urls, not ones like your '%s'" % (url,))
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

def test(request):
    return django.shortcuts.render_to_response('tagger/test.html', {}, context_instance=django.template.RequestContext(request))


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
    baseurl = None
    try:
        referer = request.META.get('HTTP_REFERER', '')
        match = re.match(r"(.*/badgerbadger/tagger/view\?url=)(.*//[^/]*)(/.*)?", urllib.unquote(referer))
        if match:
            server = match.groups()[0]
            baseurl = match.groups()[1]
            url = server + urllib.quote_plus(baseurl + "/" + url)
            return django.shortcuts.redirect(url)
    except:
        import traceback
        traceback.print_exc()

    print "Unable to load the page at '%s' from '%s' (from referer '%s')" % (url, baseurl, referer)
    raise django.http.Http404("Unable to load the page at '%s' from '%s' (from referer '%s')" % (url, baseurl, referer))

def serve404(request):
    res = django.shortcuts.render_to_response('tagger/404.html', {"exception": sys.exc_info()[1]}, context_instance=django.template.RequestContext(request))
    res.status_code = 404
    return res

def serve500(request):
    res = django.shortcuts.render_to_response('tagger/500.html', {"exception": sys.exc_info()[1]}, context_instance=django.template.RequestContext(request))
    res.status_code = 500
    return res
