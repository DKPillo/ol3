goog.provide('ga.i18n');
goog.provide('ga.i18n.msg.en_UK');
goog.provide('ga.i18n.msg.de_CH');

/**
 * Message catalog in english.
 * @type {Object.<string,string>}
 */
ga.i18n.msg.en_UK = {};

/**
 * Message catalog in japanese.
 * @type {Object.<string,string>}
 */
ga.i18n.msg.de_CH = {
  // Tab labels.
  'Geocoding results':    'Geokodierung Ergebnisse'
};

/**
 * Message catalog in the current language.
 * @type {Object.<string,string>}
 */
ga.i18n.msg.current;

if(goog.LOCALE == 'de' || true) {
  ga.i18n.msg.current = ga.i18n.msg.de_CH;
} else {
  ga.i18n.msg.current = ga.i18n.msg.en_UK;
}

/**
 * Implementation of goog.getMsg for use with localized messages.
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  str = ga.i18n.msg.current[str] || str;
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};
