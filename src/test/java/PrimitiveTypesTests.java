/**::
 * Test casting primitive types
 */

char c = 'A';
int i = c;

assertEquals(65, i, "Casting char to int doesn't work.");
assertEquals(65, (int)c, "Casting char to int doesn't work.");

char c1 = (char)i;
assertEquals('A', c1, "Casting int to char doesn't work.");
assertEquals('A', (char)65, "Casting int to char doesn't work.");
assertEquals(77, (char)65 + 12, "Casting int to char doesn't work.");


/**::
 * modulo for chars
 */

char c = 'A';
assertEquals(5, c % 10, "char modulo int failed");
assertEquals(16, c % '1' ,"char modulo char failed");

/**::
 * int arithmetic overflows like in the java virtual machine
 */
assertEquals(2147483647, Integer.MAX_VALUE, "Integer.MAX_VALUE");
assertEquals(-2147483648, Integer.MIN_VALUE, "Integer.MIN_VALUE");

// binary operators:
int max = Integer.MAX_VALUE;
int min = Integer.MIN_VALUE;
assertEquals(min, max + 1, "int addition doesn't overflow");
assertEquals(max, min - 1, "int subtraction doesn't overflow");
assertEquals(1410065408, 100000 * 100000, "int multiplication doesn't overflow");
assertEquals(min, min / -1, "int division doesn't overflow");
assertEquals(0, min % -1, "int modulo doesn't overflow");

// ... and with constant folding at compile time:
assertEquals(min, 2147483647 + 1, "folded int addition doesn't overflow");
assertEquals(1410065408, 100000 * 100000, "folded int multiplication doesn't overflow");

// unary minus:
assertEquals(min, -min, "-Integer.MIN_VALUE doesn't overflow");

// assignment operators:
int a = max;
a += 1;
assertEquals(min, a, "+= doesn't overflow");
a = max;
a *= 2;
assertEquals(-2, a, "*= doesn't overflow");
a = min;
a -= 1;
assertEquals(max, a, "-= doesn't overflow");

// ++ and --:
int b = max;
b++;
assertEquals(min, b, "++ doesn't overflow");
b = max;
assertEquals(max, b++, "suffix ++ returns wrong value");
assertEquals(min, b, "suffix ++ doesn't overflow");
b = min;
assertEquals(min, b--, "suffix -- returns wrong value");
assertEquals(max, b, "suffix -- doesn't overflow");
b = min;
--b;
assertEquals(max, b, "prefix -- doesn't overflow");

// long and double don't overflow at 32 bits:
long l = 3000000000L;
assertEquals(3000000001L, l + 1, "long addition overflows at 32 bits");
double d = 2147483647.0;
assertEquals(2147483648.0, d + 1, "double addition overflows at 32 bits");


/**::
 * casting to byte, short and int keeps the lowest bits
 */
int i = 200;
byte b = (byte)i;
assertEquals(-56, b, "cast int -> byte");

i = -200;
b = (byte)i;
assertEquals(56, b, "cast negative int -> byte");

i = 70000;
short s = (short)i;
assertEquals(4464, s, "cast int -> short");

byte bConstant = (byte)200;
assertEquals(-56, bConstant, "cast of int constant -> byte");
short sConstant = (short)70000;
assertEquals(4464, sConstant, "cast of int constant -> short");

long l = 4294967296L + 7;
i = (int)l;
assertEquals(7, i, "cast long -> int");

double d = 3.99;
i = (int)d;
assertEquals(3, i, "cast double -> int truncates towards zero");
d = -3.99;
i = (int)d;
assertEquals(-3, i, "cast negative double -> int truncates towards zero");
