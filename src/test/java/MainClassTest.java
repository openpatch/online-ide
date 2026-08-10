/**::
 * Test methods outside class definition
 * { "expectedOutput": "Success!\n" }
 */
test();

void test(){
   test1("Success!");
}


void test1(String s){
   println(s);
}

/**::
 * Test main method outside class definition (Java 25)
 * { "expectedOutput": "Success!\n" }
 */
void main(){
   IO.println("Success!");
}

/**::
 * Test public static void main(String[] args) inside class
 * { "expectedOutput": "Success!\n" }
 */
class Test1 {
   public static void main(String[] args){
      IO.println("Success!");
   }
}

/**::
 * Test non-static main method inside class (Java 25)
 * { "expectedOutput": "Success!\n" }
 */
class Test2 {
   public void main(){
      IO.println("Success!");
   }
}

/**::
 * Test non-static main method inside class with field initializer (Java 25)
 * { "expectedOutput": "Success!\n" }
 */
class Test3 {
   private String message = "Success!";

   void main(){
      IO.println(message);
   }
}

/**::
 * Test non-static main method with parameter inside class (Java 25)
 * { "expectedOutput": "Success!\n" }
 */
class Test4 {
   private int i;

   Test4(){
      i = 1;
   }

   void main(String[] args){
      IO.print("Succ");
      IO.print("ess");
      IO.println("!");
   }
}
