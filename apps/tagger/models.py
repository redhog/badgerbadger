import django.db.models
import idmapper.models
import django.contrib.auth.models
from django.db.models import Q, F
import fcdjangoutils.modelhelpers

class Object(django.db.models.Model, fcdjangoutils.modelhelpers.SubclasModelMixin):
    @fcdjangoutils.modelhelpers.subclassproxy
    def __unicode__(self):
        raise fcdjangoutils.modelhelpers.MustBeOverriddenError

class TagType(django.db.models.Model, fcdjangoutils.modelhelpers.SubclasModelMixin):
    name = django.db.models.CharField(max_length=255, unique=True, blank=False)

    def __unicode__(self):
        return self.name

class Tag(django.db.models.Model, fcdjangoutils.modelhelpers.SubclasModelMixin):
    name = django.db.models.CharField(max_length=1024, unique=True, blank=True)
    type = django.db.models.ForeignKey(TagType, related_name="tags", null=True, blank=True)

    def __unicode__(self):
        return self.name

class Tagging(django.db.models.Model, fcdjangoutils.modelhelpers.SubclasModelMixin):
    src = django.db.models.ForeignKey(Object, related_name="tags", null=False, blank=True)
    tag = django.db.models.ForeignKey(Tag, related_name="documents", null=False, blank=True)
    dst = django.db.models.ForeignKey(Object, related_name="links", null=True, blank=True)
    time = django.db.models.DateField(auto_now=True)

    def __unicode__(self):
        return "%s of %s" % (self.tag, self.src)

    class Meta:
        unique_together = (("src", "tag", "dst"),)

class Document(Object):
    url = django.db.models.CharField(max_length=1024, unique=True, blank=False)
    mime_type = django.db.models.CharField(max_length=1024, blank=True)

    def __unicode__(self):
        return self.url

class Range(Object):
    document = django.db.models.ForeignKey(Document, related_name="ranges", null=False)
    order = django.db.models.IntegerField(blank=False)
    selector = django.db.models.CharField(max_length=4048, blank=False)

    def __unicode__(self):
        return "%s: %s" % (self.document.url, self.selector)

    class Meta:
        unique_together = (("document", "order"),)
