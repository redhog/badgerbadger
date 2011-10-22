import django.shortcuts
import django.template
import django.core.urlresolvers
import django.http
import django.contrib.auth.decorators

#@django.contrib.auth.decorators.login_required
def tagger(request):
    return django.shortcuts.render_to_response(
        'tagger/index.html',
        context_instance=django.template.RequestContext(request))
