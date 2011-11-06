import django.db.models
import idmapper.models
import django.contrib.auth.models
from django.db.models import Q, F
import django.db.models.query
import fcdjangoutils.modelhelpers
import fcdjangoutils.jsonview


@fcdjangoutils.jsonview.JsonEncodeRegistry.register(django.db.models.query.QuerySet)
def modelconv(self, obj):
    return list(obj)



class MimeTypeCache(django.db.models.Model, fcdjangoutils.modelhelpers.SubclasModelMixin):
    url = django.db.models.CharField(max_length=1024, unique=True, blank=False)
    mime_type = django.db.models.CharField(max_length=1024, blank=True)

    def __unicode__(self):
        return "%s (%s)" % (self.url, self.mime_type)



class Object(django.db.models.Model, fcdjangoutils.modelhelpers.SubclasModelMixin):
    @fcdjangoutils.modelhelpers.subclassproxy
    def __unicode__(self):
        raise fcdjangoutils.modelhelpers.MustBeOverriddenError


@fcdjangoutils.jsonview.JsonEncodeRegistry.register(Object)
def conv(self, obj):
    return {'__tagger_models_Object__': True,
            "id": obj.id}

@fcdjangoutils.jsonview.JsonDecodeRegistry.register('__tagger_models_Object__')
def conv(self, obj):
    del obj["__tagger_models_Object__"]
    try:
        return Object.objects.get(**obj)
    except:
        pass
    obj = Object(**obj)
    obj.save()
    return obj



class TagType(django.db.models.Model, fcdjangoutils.modelhelpers.SubclasModelMixin):
    name = django.db.models.CharField(max_length=255, unique=True, blank=False)

    def __unicode__(self):
        return self.name

@fcdjangoutils.jsonview.JsonEncodeRegistry.register(TagType)
def conv(self, obj):
    return {'__tagger_models_TagType__': True,
            "id": obj.id,
            "name": obj.name}

@fcdjangoutils.jsonview.JsonDecodeRegistry.register('__tagger_models_TagType__')
def conv(self, obj):
    del obj["__tagger_models_TagType__"]
    try:
        return TagType.objects.get(**obj)
    except:
        pass
    obj = TagType(**obj)
    obj.save()
    return obj



class Tag(django.db.models.Model, fcdjangoutils.modelhelpers.SubclasModelMixin):
    name = django.db.models.CharField(max_length=1024, unique=True, blank=True)
    type = django.db.models.ForeignKey(TagType, related_name="tags", null=True, blank=True)

    def __unicode__(self):
        return self.name

@fcdjangoutils.jsonview.JsonEncodeRegistry.register(Tag)
def conv(self, obj):
    return {'__tagger_models_Tag__': True,
            "id": obj.id,
            "label": obj.name,
            "value": obj.name,
            "name": obj.name,
            "type": obj.type}

@fcdjangoutils.jsonview.JsonDecodeRegistry.register('__tagger_models_Tag__')
def conv(self, obj):
    del obj["__tagger_models_Tag__"]
    try:
        return Tag.objects.get(**obj)
    except:
        pass
    if "label" in obj: del obj["label"]
    if "value" in obj: del obj["value"]
    obj = Tag(**obj)
    obj.save()
    return obj



class Tagging(django.db.models.Model, fcdjangoutils.modelhelpers.SubclasModelMixin):
    src = django.db.models.ForeignKey(Object, related_name="tags", null=False, blank=True)
    tag = django.db.models.ForeignKey(Tag, related_name="documents", null=False, blank=True)
    dst = django.db.models.ForeignKey(Object, related_name="links", null=True, blank=True)
    time = django.db.models.DateField(auto_now=True)

    def __unicode__(self):
        return "%s of %s" % (self.tag, self.src)

    class Meta:
        unique_together = (("src", "tag", "dst"),)

@fcdjangoutils.jsonview.JsonEncodeRegistry.register(Tagging)
def conv(self, obj):
    return {'__tagger_models_Tagging__': True,
            "id": obj.id,
            'src': {'__tagger_models_Object__': True, "id":obj.src.id},
            'tag': obj.tag,
            'dst': obj.dst}

@fcdjangoutils.jsonview.JsonDecodeRegistry.register('__tagger_models_Tagging__')
def conv(self, obj):
    del obj["__tagger_models_Tagging__"]
    try:
        return Tagging.objects.get(**obj)
    except:
        pass
    obj = Tagging(**obj)
    obj.save()
    return obj



class Document(Object):
    url = django.db.models.CharField(max_length=1024, unique=True, blank=False)

    def __unicode__(self):
        return self.url

@fcdjangoutils.jsonview.JsonEncodeRegistry.register(Document)
def conv(self, obj):
    return {'__tagger_models_Document__': True,
            "id": obj.id,
            "url": obj.url,
            "tags": obj.tags.all()}

@fcdjangoutils.jsonview.JsonDecodeRegistry.register('__tagger_models_Document__')
def conv(self, obj):
    del obj["__tagger_models_Document__"]
    try:
        return Document.objects.get(**obj)
    except:
        pass
    obj = Document(**obj)
    obj.save()
    return obj



class Range(Object):
    document = django.db.models.ForeignKey(Document, related_name="ranges", null=False)
    order = django.db.models.IntegerField(blank=False)
    selector = django.db.models.CharField(max_length=4048, blank=False)
    excerpt = django.db.models.CharField(max_length=4048, blank=False)

    def __unicode__(self):
        return "%s: %s" % (self.document.url, self.excerpt)

    class Meta:
        unique_together = (("document", "order"),)

@fcdjangoutils.jsonview.JsonEncodeRegistry.register(Range)
def conv(self, obj):
    return {'__tagger_models_Range__': True,
            "id": obj.id,
            "document": obj.document,
            "order": obj.order,
            "selector": fcdjangoutils.jsonview.from_json(obj.selector),
            "excerpt": obj.excerpt,
            "tags": obj.tags.all()}

@fcdjangoutils.jsonview.JsonDecodeRegistry.register('__tagger_models_Range__')
def conv(self, obj):
    del obj["__tagger_models_Range__"]
    try:
        return Range.objects.get(**obj)
    except:
        pass
    selectors = obj['document'].ranges.order_by("-order")
    if selectors:
        old_order = selectors[0].order
        print old_order, obj["order"]
        assert old_order + 1 == obj["order"]
    else:
        assert obj["order"] == 0
    obj["selector"] = fcdjangoutils.jsonview.to_json(obj["selector"])
    obj = Range(**obj)
    obj.save()
    return obj



class TimeStamp(Object):
    time = django.db.models.DateField()

    def __unicode__(self):
        return unicode(self.time)

@fcdjangoutils.jsonview.JsonEncodeRegistry.register(TimeStamp)
def conv(self, obj):
    return {'__tagger_models_TimeStamp__': True,
            "id": obj.id,
            "time": obj.time}

@fcdjangoutils.jsonview.JsonDecodeRegistry.register('__tagger_models_TimeStamp__')
def conv(self, obj):
    del obj["__tagger_models_TimeStamp__"]
    try:
        return TimeStamp.objects.get(**obj)
    except:
        pass
    obj = TimeStamp(**obj)
    obj.save()
    return obj
