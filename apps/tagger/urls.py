from django.conf.urls.defaults import *

urlpatterns = patterns('',
    (r'^tagger/', "tagger.views.tagger"),
)
