/**::
 * HashMap keys that reach a map as primitive strings (static fields, parameters)
 * { "libraries": ["scratch"], "expectedOutput": "Hello World!\nNOT_FOUND\n" }
 */

class I18n {
  private static String[] allowedLocales = { "en", "de" };
  private static String locale = allowedLocales[0];
  private static HashMap<String, HashMap<String, String>> messages;

  public static void setup() {
    messages = new HashMap<>();

    for (var allowedLocale : allowedLocales) {
      messages.put(allowedLocale, new HashMap<>());
    }

    var en = messages.get("en");
    en.put("hello", "Hello {0}!");
    en.put("bye", "Bye");
  }

  public static void select(String newLocale) {
    for (var allowedLocale : allowedLocales) {
      if (allowedLocale.equals(newLocale)) {
        I18n.locale = newLocale;
        return;
      }
    }
  }

  public static String get(String key, String... args) {
    var message = messages.get(locale).get(key);
    if (message == null) {
      return "NOT_FOUND";
    }
    for (int i = 0; i < args.length; i++) {
      message = message.replace("{" + i + "}", args[i]);
    }
    return message;
  }
}

void main() {
  I18n.setup();
  println(I18n.get("hello", "World"));
  I18n.select("de");
  println(I18n.get("missing-key"));
}

/**::
 * Varargs method called without varargs arguments
 * { "libraries": ["scratch"], "expectedOutput": "Hello {0}!\nBye\n" }
 */

class Greeter {
  public static String get(String key, String... args) {
    var messages = new HashMap<String, String>();
    messages.put("hello", "Hello {0}!");
    messages.put("bye", "Bye");
    var message = messages.get(key);
    if (message == null) {
      return "NOT_FOUND";
    }
    for (int i = 0; i < args.length; i++) {
      message = message.replace("{" + i + "}", args[i]);
    }
    return message;
  }
}

void main() {
  println(Greeter.get("hello"));
  println(Greeter.get("bye", "unused"));
}
