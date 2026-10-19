/**::
 * Lambda arguments select the functional interface overload for methods and constructors
 * { "expectedOutput": "method\nconstructor\nordinary\n" }
 */
interface Factory { String get(); }

class Choice {
  Choice(String value) { println("wrong constructor"); }
  Choice(Factory value) { println(value.get()); }

  static String pick(String value) { return value; }
  static String pick(Factory value) { return value.get(); }
}

println(Choice.pick(() -> "method"));
new Choice(() -> "constructor");
println(Choice.pick("ordinary"));
