from django.conf.urls.defaults import *

urlpatterns = patterns('',
    (r'^404', "tagger.views.serve404"),

    (r'^badgerbadger/tagger/create', "tagger.views.create_object"),
    (r'^badgerbadger/tagger/delete', "tagger.views.delete_object"),

    (r'^badgerbadger/tagger/tags/json$', "tagger.views.tags_json"),

    (r'^badgerbadger/tagger/data', "tagger.views.data"),
    (r'^badgerbadger/tagger/view', "tagger.views.view"),

    (r'^badgerbadger/tagger/search/?$', "tagger.views.search"),
    (r'^/?$', "tagger.views.index"),
    (r'^test/?$', "tagger.views.test"),

    (r'^g/(?P<id>.*)/?$', "tagger.views.go"),
    (r'^', "tagger.views.other"),
)

