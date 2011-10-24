from django.conf.urls.defaults import *

urlpatterns = patterns('',
    (r'^badgerbadger/tagger/tag/remove$', "tagger.views.remove_tag"),
    (r'^badgerbadger/tagger/tag/add$', "tagger.views.add_tag"),

    (r'^badgerbadger/tagger/tags/json$', "tagger.views.tags_json"),

    (r'^badgerbadger/tagger/select/(?P<url>.*)', "tagger.views.select"),
    (r'^badgerbadger/tagger/data/(?P<url>.*)', "tagger.views.data"),
    (r'^badgerbadger/tagger/view/(?P<url>.*)', "tagger.views.view"),

    (r'^badgerbadger/tagger/search/?$', "tagger.views.search"),
    (r'^/?$', "tagger.views.index"),

    (r'^(?P<url>.*)', "tagger.views.other"),
)
