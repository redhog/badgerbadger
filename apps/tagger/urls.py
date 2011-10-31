from django.conf.urls.defaults import *

urlpatterns = patterns('',
    (r'^404', "tagger.views.serve404"),

    (r'^badgerbadger/tagger/tag/remove$', "tagger.views.remove_tag"),
    (r'^badgerbadger/tagger/tag/add$', "tagger.views.add_tag"),

    (r'^badgerbadger/tagger/tags/json$', "tagger.views.tags_json"),

    (r'^badgerbadger/tagger/select', "tagger.views.select"),
    (r'^badgerbadger/tagger/data', "tagger.views.data"),
    (r'^badgerbadger/tagger/view', "tagger.views.view"),

    (r'^badgerbadger/tagger/search/?$', "tagger.views.search"),
    (r'^/?$', "tagger.views.index"),

    (r'^g/(?P<id>.*)/?$', "tagger.views.go"),
    (r'^', "tagger.views.other"),
)

