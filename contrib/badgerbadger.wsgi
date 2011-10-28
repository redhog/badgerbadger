import os
import sys

projectroot = os.path.dirname(os.path.dirname(__file__))
virtualenvs = [os.path.join(projectroot, 'deps/bin/activate_this.py'),
              "/srv/www/badgerbadger.redhog.org/badgerbadger/deps/bin/activate_this.py"]
for virtualenv in virtualenvs:
   if os.path.exists(virtualenv):
      execfile(virtualenv, dict(__file__ = virtualenv))
      break

sys.path.append(os.path.dirname(projectroot))
sys.path.append(projectroot)
sys.path.append(os.path.join(projectroot, 'apps'))

sys.stdout = open(os.path.join(projectroot, "stdout.log"), "a")

os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()
