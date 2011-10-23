from django.conf.urls.defaults import *

urlpatterns = patterns('',
    (r'^tagger/untag$', "tagger.views.untag"),
    (r'^tagger/tag$', "tagger.views.tag"),
    (r'^tagger/tags$', "tagger.views.tags"),
    (r'^tagger/select/(?P<url>.*)', "tagger.views.select"),
    (r'^tagger/data/(?P<url>.*)', "tagger.views.data"),
    (r'^tagger/view/(?P<url>.*)', "tagger.views.view"),
    (r'^(?P<url>.*)', "tagger.views.other"),
)
