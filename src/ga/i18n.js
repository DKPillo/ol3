goog.provide('ga.i18n');
goog.require('ga.i18n.msg.de');
goog.require('ga.i18n.msg.en');
goog.require('ga.i18n.msg.fr');
goog.require('ga.i18n.msg.it');
goog.require('ga.i18n.msg.rm');


/**
 * @define {string} lang application language
 */
ga.lang = 'de';


/**
 * Message catalog in the current language.
 * @type {Object.<string,string>}
 */
ga.i18n.msg.current;


if (ga.lang && ga.lang == 'en') {
  ga.i18n.msg.current = ga.i18n.msg.en;
} else if (ga.lang && ga.lang == 'de') {
  ga.i18n.msg.current = ga.i18n.msg.de;
} else if (ga.lang && ga.lang == 'fr') {
  ga.i18n.msg.current = ga.i18n.msg.fr;
} else if (ga.lang && ga.lang == 'it') {
  ga.i18n.msg.current = ga.i18n.msg.it;
} else if (ga.lang && ga.lang == 'rm') {
  ga.i18n.msg.current = ga.i18n.msg.rm;
} else {
  ga.i18n.msg.current = ga.i18n.msg.de;
}


/**
 * Implementation of goog.getMsg for use with localized messages.
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
ga.i18n.getMsg = function(str, opt_values) {
  str = ga.i18n.msg.current[str] || str;
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};
