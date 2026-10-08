/**::
 * import static of all static methods of a class
 * { "expectedOutput": "3\n2\n" }
 */
import static java.lang.Math.*;

System.out.println(sqrt(9));
System.out.println(Rechner.wurzel(4));

class Rechner {
    static double wurzel(double x) {
        return sqrt(x);
    }
}

/**::
 * import static of a single static method
 * { "expectedOutput": "5\n" }
 */
import static java.lang.Math.abs;

System.out.println(abs(-5));

/**::
 * import static of an unknown class is an error
 * { "expectedCompilationError": { "id": "importedTypesNotFound" } }
 */
import static gibt.es.Nicht.*;

System.out.println("x");
