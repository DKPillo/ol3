#!/usr/bin/env python

from build import *

from pake import targets,TargetCollection, DuplicateTargetError

AVAILABLE_LANGS = ['en', 'de', 'fr', 'it', 'rm']

def prepend(name, template):
     f = open(name,'r')
     temp = f.read()
     f.close()
     ob = json.loads(temp) 
     open(name, "w").write( template % json.dumps(ob,sort_keys=True,indent=2))

def _build_require_list(dependencies, output_file_name):
    requires = set()
    for dependency in dependencies:
        for line in open(dependency):
            match = re.match(r'goog\.provide\(\'(.*)\'\);', line)
            if match:
                requires.add(match.group(1))
    with open(output_file_name, 'w') as f:
        for require in sorted(requires):
            f.write('goog.require(\'%s\');\n' % (require,))

# Monkey patching build.py to allow redefining targets by 
def add(self, target, force=True):
        """add adds a concrete target to self, overriding it if the target
        already exists.  If target is the first target to be added, it becomes
        the default for this TargetCollection."""
        if target.name in self.targets and not force:
            raise DuplicateTargetError(target)
        self.targets[target.name] = target
        if self.default is None:
            self.default = target

from types import MethodType
targets.add = MethodType(add, targets, TargetCollection)

# We redefine 'build'
virtual('build', 'build/ga.css', 'build/src/internal/src/requireallga.js', 'build/ga.js',
        'build/ga-whitespace.js','build/layersConfig', 'build/proj')

# Localized build
virtual('build/ga-whitespace.js', 'build/ga-whitespace-en.js', 'build/ga-whitespace-de.js', 
       'build/ga-whitespace-fr.js', 'build/ga-whitespace-it.js', 'build/ga-whitespace-rm.js')

virtual('build/ga.js', 'build/proj', 'build/ga-en.js', 'build/ga-de.js', 'build/ga-fr.js', 
       'build/ga-it.js',  'build/ga-rm.js')

# We redifine 'apidoc'
JSDOC = 'node_modules/.bin/jsdoc'

virtual('apidoc', 'node_modules/.bin/jsdoc' ,'build/jsdoc-%(BRANCH)s-timestamp' % vars(variables))

@target('node_modules/.bin/jsdoc')
def jsdoc_npm(t):
    t.run('npm', 'install', 'jsdoc@<=3.2.2')
    t.touch()

@target('build/jsdoc-%(BRANCH)s-timestamp' % vars(variables), JSDOC,'host-resources',
                'build/src/external/src/exports.js', 'build/src/external/src/types.js',
                        SRC, SHADER_SRC, ifind('apidoc/template'))
def jsdoc_BRANCH_timestamp(t):
    t.run(JSDOC, '-c', 'apidoc/conf.json', 'src', 'apidoc/ga-index.md',
       '-d', 'build/hosted/%(BRANCH)s/apidoc')
    t.touch()


# Adding ga custom source directoy

from build import SRC
SRC.extend([path for path in ifind('src/ga')
       if path.endswith('.js')
       if path not in SHADER_SRC])

AVAILABLE_LANGS = ['de','fr','en','it','rm']

# Custom target for ga
@target('build/src/internal/src/requireallga.js', SRC, SHADER_SRC,
        LIBTESS_JS_SRC)
def build_src_internal_src_requireall_js(t):
    _build_require_list(t.dependencies, t.name)

@target('build/ga.css', 'build/ga.js')
def build_ga_css(t):
    t.cp('css/ch_cross.png','build')
    t.cp('css/editortoolbar.png','build')
    t.touch()

@target('build/proj')
def build_proj(t):
    t.cp('resources/EPSG21781.js','build')
    t.cp('resources/EPSG2056.js','build')
    t.cp('resources/proj4js-compressed.js','build')

@target('build/ga-en.js', PLOVR_JAR, SRC, EXTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ga-en.json')
def build_ga_en_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'buildcfg/ga-en.json')
    report_sizes(t) 

@target('build/ga-de.js', PLOVR_JAR, SRC, EXTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ga-de.json')
def build_ga_de_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'buildcfg/ga-de.json')
    report_sizes(t) 

@target('build/ga-fr.js', PLOVR_JAR, SRC, EXTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ga-fr.json')
def build_ga_fr_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'buildcfg/ga-fr.json')
    report_sizes(t) 

@target('build/ga-it.js', PLOVR_JAR, SRC, EXTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ga-it.json')
def build_ga_it_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'buildcfg/ga-it.json')
    report_sizes(t) 

@target('build/ga-rm.js', PLOVR_JAR, SRC, EXTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ga-rm.json')
def build_ga_rm_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'buildcfg/ga-rm.json')
    report_sizes(t) 

@target('build/ga-whitespace-en.js', PLOVR_JAR, SRC, INTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ga.json',
        'buildcfg/ga-whitespace-en.json')
def build_ga_whitespace_en_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR,
             'build', 'buildcfg/ga-whitespace-en.json')
    report_sizes(t)

@target('build/ga-whitespace-de.js', PLOVR_JAR, SRC, INTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ga.json',
        'buildcfg/ga-whitespace-de.json')
def build_ga_whitespace_de_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR,
             'build', 'buildcfg/ga-whitespace-de.json')
    report_sizes(t)
    
@target('build/ga-whitespace-fr.js', PLOVR_JAR, SRC, INTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ga.json',
        'buildcfg/ga-whitespace-fr.json')
def build_ga_whitespace_fr_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR,
             'build', 'buildcfg/ga-whitespace-fr.json')
    report_sizes(t)

@target('build/ga-whitespace-it.js', PLOVR_JAR, SRC, INTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ga.json',
        'buildcfg/ga-whitespace-it.json')
def build_ga_whitespace_it_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR,
             'build', 'buildcfg/ga-whitespace-it.json')
    report_sizes(t)

@target('build/ga-whitespace-rm.js', PLOVR_JAR, SRC, INTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC,  'buildcfg/ga-whitespace-rm.json')
def build_ga_whitespace_rm_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR,
             'build', 'buildcfg/ga-whitespace-rm.json')
    report_sizes(t)

@target('build/layersConfig', AVAILABLE_LANGS)
def get_layersconfig(t):
    for lang in AVAILABLE_LANGS:
        name = "%s.%s.js" % (t.name, lang)
        t.info('downloading %r', t.name)
        t.download('http://api3.geo.admin.ch/rest/services/api/MapServer/layersconfig?lang=%s' % lang)
        os.rename(t.name, name)
        t.info('downloaded %r', name)
        prepend(name, """function getConfig(){ return %s } """)
        
@target('serve', PLOVR_JAR, 'test-deps', 'examples')
def serve(t):
    t.run('%(JAVA)s', '-jar', PLOVR_JAR, 'serve', 'buildcfg/ol.json',
          'buildcfg/ga-all.json', EXAMPLES_JSON, 'buildcfg/test.json')

if __name__ == '__main__':
    main()

