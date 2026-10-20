/**::
 * Enum declared inside a class
 */

Bat bat = new Bat(Bat.Type.AI);
assertEquals("AI", bat.type.name(), "Nested enum constant from outside");
assertTrue(bat.isComputer(), "Nested enum constant from inside");

class Bat {
   enum Type {
      P1, P2, AI
   }

   Type type;

   Bat(Type type) {
      this.type = type;
   }

   boolean isComputer() {
      return type == Type.AI;
   }
}

/**::
 * Interface declared inside a class
 */

Row row = new Row(() -> 7);
assertEquals(7, row.factory.create(), "Nested interface");

class Row {
   interface Factory {
      int create();
   }

   Factory factory;

   Row(Factory factory) {
      this.factory = factory;
   }
}
