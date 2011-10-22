from django.conf.urls.defaults import *

urlpatterns = patterns('',
    (r'^tagger/selections/(?P<url>.*)', "tagger.views.selections"),
    (r'^tagger/view/(?P<url>.*)', "tagger.views.view"),
)
