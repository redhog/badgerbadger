from django.conf.urls.defaults import *

urlpatterns = patterns('',
    (r'^tagger/tag/remove$', "tagger.views.remove_tag"),
    (r'^tagger/tag/add$', "tagger.views.add_tag"),

    (r'^tagger/tags/json$', "tagger.views.tags_json"),

    (r'^tagger/select/(?P<url>.*)', "tagger.views.select"),
    (r'^tagger/data/(?P<url>.*)', "tagger.views.data"),
    (r'^tagger/view/(?P<url>.*)', "tagger.views.view"),

    (r'^tagger/search/?$', "tagger.views.search"),
    (r'^tagger/?$', "tagger.views.index"),

    (r'^(?P<url>.*)', "tagger.views.other"),
)
