/**::
 * java.util imports resolve to the standard classes
 * { "expectedOutput": "[1, 2]\n" }
 */
import java.util.ArrayList;
import java.util.List;
import java.util.*;
import java.util.Scanner;
import java.util.Arrays;

ArrayList<Integer> l = new ArrayList<>();
l.add(1); l.add(2);
List<Integer> alsListe = l;
System.out.println(l);

/**::
 * Arrays.equals, toString, sort and fill
 * { "expectedOutput": "false\ntrue\nfalse\ntrue\n[1, 2, 3]\n[a, b, c]\n[7, 7]\ntrue\nfalse\n" }
 */
import java.util.Arrays;

int[] erstes = {2, 4, 6};
int[] zweites = {2, 4, 6};
System.out.println(erstes == zweites);
System.out.println(Arrays.equals(erstes, zweites));
erstes[2] = 8;
System.out.println(Arrays.equals(erstes, zweites));
zweites = erstes;
System.out.println(Arrays.equals(erstes, zweites));
int[] z = {3, 1, 2};
Arrays.sort(z);
System.out.println(Arrays.toString(z));
String[] s = {"c", "a", "b"};
Arrays.sort(s);
System.out.println(Arrays.toString(s));
int[] f = new int[2];
Arrays.fill(f, 7);
System.out.println(Arrays.toString(f));
String[] w1 = {"x", "y"};
String[] w2 = {"x", "y"};
System.out.println(Arrays.equals(w1, w2));
w2[1] = "z";
System.out.println(Arrays.equals(w1, w2));

/**::
 * Integer helpers of the book
 * { "expectedOutput": "19\n10011\n1e\n23\n-5\n-ff\n2147483647\n-2147483648\n" }
 */
System.out.println(Integer.toString(19));
System.out.println(Integer.toBinaryString(19));
System.out.println(Integer.toHexString(30));
System.out.println(Integer.toOctalString(19));
System.out.println(Integer.toString(-5));
System.out.println(Integer.toString(-255, 16));
System.out.println(Integer.MAX_VALUE);
System.out.println(Integer.MIN_VALUE);

/**::
 * Scanner reads words, numbers and lines like java.util.Scanner
 * { "expectedOutput": "12|Hallo|2.5|true|| Rest der Zeile|letzte|false\nfalsch\n" }
 */
import java.util.Scanner;
import java.util.InputMismatchException;

Scanner sc = new Scanner("12 Hallo 2,5\ntrue\n Rest der Zeile\nletzte");
int i = sc.nextInt();
String wort = sc.next();
double d = sc.nextDouble();
boolean b = sc.nextBoolean();
String leer = sc.nextLine();        // the end of the line after true
String rest = sc.nextLine();
String letzte = sc.nextLine();
System.out.println(i + "|" + wort + "|" + d + "|" + b + "|" + leer + "|" + rest + "|" + letzte + "|" + sc.hasNext());
Scanner falsch = new Scanner("abc");
try {
    falsch.nextInt();
} catch (InputMismatchException e) {
    System.out.println(falsch.next() == null ? "?" : "falsch");
}
