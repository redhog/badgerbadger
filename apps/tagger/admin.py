import django.contrib.admin
import tagger.models

django.contrib.admin.site.register(tagger.models.Object)
django.contrib.admin.site.register(tagger.models.TagType)
django.contrib.admin.site.register(tagger.models.Tag)
django.contrib.admin.site.register(tagger.models.Tagging)
django.contrib.admin.site.register(tagger.models.Document)
django.contrib.admin.site.register(tagger.models.Range)
