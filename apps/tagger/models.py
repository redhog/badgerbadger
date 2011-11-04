import django.db.models
import idmapper.models
import django.contrib.auth.models
from django.db.models import Q, F
import fcdjangoutils.modelhelpers
import fcdjangoutils.jsonview


class MimeTypeCache(django.db.models.Model, fcdjangoutils.modelhelpers.SubclasModelMixin):
    url = django.db.models.CharField(max_length=1024, unique=True, blank=False)
    mime_type = django.db.models.CharField(max_length=1024, blank=True)

    def __unicode__(self):
        return "%s (%s)" % (self.url, self.mime_type)

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

    def __unicode__(self):
        return self.url

class Range(Object):
    document = django.db.models.ForeignKey(Document, related_name="ranges", null=False)
    order = django.db.models.IntegerField(blank=False)
    selector = django.db.models.CharField(max_length=4048, blank=False)
    excerpt = django.db.models.CharField(max_length=4048, blank=False)

    def __unicode__(self):
        return "%s: %s" % (self.document.url, self.selector)

    class Meta:
        unique_together = (("document", "order"),)

class TimeStamp(Object):
    time = django.db.models.DateField()

    def __unicode__(self):
        return unicode(self.time)



# @fcdjangoutils.jsonview.JsonEncodeRegistry.register(Object)
# def conv(self, obj):
#     sub = obj.subclassobject
#     if type(sub) is not type(obj) return sub
 
#     return {'__cliqueclique_document_models_Document__': True,
#             'document_id': obj.document_id,
#             'parent_document_id': obj.parent_document_id,
#             'child_document_id': obj.child_document_id,
#             'content': obj.content.as_mime}

# @fcdjangoutils.jsonview.JsonDecodeRegistry.register('__cliqueclique_document_models_DocumentSubscription_export__')
# def conv(self, obj):
#     return DocumentSubscription.objects.get(document__document_id = obj['document_id']).export()

@fcdjangoutils.jsonview.JsonEncodeRegistry.register(Tagging)
def conv(self, obj):
    return {'tag': obj.tag.name,
            'type': obj.tag.type and obj.tag.type.name,
            'dst': obj.dst and obj.dst.id}

@fcdjangoutils.jsonview.JsonEncodeRegistry.register(Range)
def conv(self, obj):
    return {"selector": fcdjangoutils.jsonview.from_json(obj.selector),
             "id": obj.id,
             "order": obj.order,
             "tags": obj.tags.all()}
