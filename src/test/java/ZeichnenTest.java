/**::
 * Zeichnen: Figuren, Farben und toString wie in der Desktop-Bibliothek
 * { "libraries": ["zeichnen"], "expectedOutput": "Rechteck       \t (50 | 50) \t [r=127,g=127,b=127]\tsichtbar\t200x300\tgefuellt\nOval           \t (100 | 100) \t braun\tsichtbar\t300x50\tnicht gefuellt\nLinie          \t (0 | 0) \t rot\tunsichtbar\t (500 | 500)\nDreieck        \t (1 | 2) \t schwarz\tsichtbar\t (3|4) (5|6)\tgefuellt\ngruen 0 255 0\nschwarz\n" }
 */
import zeichnen.*;

Zeichenflaeche meineFlaeche = new Zeichenflaeche();
Rechteck meinRechteck = new Rechteck(50, 50, 200, 300, true, 127, 127, 127);
meineFlaeche.fuegeHinzu(meinRechteck);
Oval o = new Oval(100, 100, 300, 50, false, "Braun");
meineFlaeche.fuegeHinzu(o);
Linie l = new Linie(0, 0, 500, 500, "rot");
l.setzeSichtbar(false);
meineFlaeche.fuegeHinzu(l);
Dreieck d = new Dreieck(1, 2, 3, 4, 5, 6, true, "gibtsnicht");
System.out.println(meinRechteck);
System.out.println(o.toString());
System.out.println(l);
System.out.println(d);
o.setzeFarbe("gruen");
System.out.println(o.getFarbe() + " " + o.getRot() + " " + o.getGruen() + " " + o.getBlau());
System.out.println(d.getFarbe());

/**::
 * Zeichnen: Reihenfolge der Figuren
 * { "libraries": ["zeichnen"], "expectedOutput": "a b c d \nb c d a \nd b c a \nb d c a \n-1\n3\n" }
 */
import zeichnen.*;

Zeichenflaeche f = new Zeichenflaeche(400, 300);
Rechteck a = new Rechteck(0, 0, 1, 1, true, "rot");
Rechteck b = new Rechteck(1, 0, 1, 1, true, "rot");
Rechteck c = new Rechteck(2, 0, 1, 1, true, "rot");
Rechteck dd = new Rechteck(3, 0, 1, 1, true, "rot");
f.fuegeHinzu(a); f.fuegeHinzu(b); f.fuegeHinzu(c); f.fuegeHinzu(dd);
zeige(f, a, b, c, dd);
a.kommeGanzVor();
zeige(f, a, b, c, dd);
dd.geheGanzZurueck();
zeige(f, a, b, c, dd);
dd.kommeEinsVor();
zeige(f, a, b, c, dd);
System.out.println(f.gibIndex(new Rechteck(0, 0, 1, 1, true, "rot")));
System.out.println(f.gibIndex(a));

void zeige(Zeichenflaeche f, Rechteck a, Rechteck b, Rechteck c, Rechteck d) {
    String s = "";
    for (Figur fig : f.gibFiguren()) {
        if (fig == a) s += "a ";
        if (fig == b) s += "b ";
        if (fig == c) s += "c ";
        if (fig == d) s += "d ";
    }
    System.out.println(s);
}

/**::
 * Zeichnen: Objekte mit Gettern werden über den Objektinterpreter gezeichnet
 * { "libraries": ["zeichnen"], "expectedOutput": "Turm\n * Rechteck       \t (200 | 400) \t orange\tsichtbar\t200x100\tgefuellt *\n * Rechteck       \t (200 | 300) \t rot\tsichtbar\t200x100\tgefuellt *\n * Rechteck       \t (200 | 500) \t gruen\tsichtbar\t200x100\tgefuellt *\n3\nEs wurde versucht ein Objekt hinzuzufuegen, bei dem es nichts zu zeichnen gibt. Eventuell wurden die get-Methoden vergessen bei: class Leer\n2\n" }
 */
import zeichnen.Rechteck;
import zeichnen.Zeichenflaeche;
import zeichnen.Objektinterpreter;

Zeichenflaeche meinBild = new Zeichenflaeche();
Turm turm = new Turm(200, 300, 300, 200);
System.out.println(Objektinterpreter.interpretiere(turm));
System.out.println(Objektinterpreter.objectToList(turm).size());
meinBild.fuegeHinzu(turm);
meinBild.fuegeHinzu(new Leer());
meinBild.fuegeHinzu(new Rechteck(0, 0, 10, 10, true, "rot"));
System.out.println(meinBild.gibFiguren().length + 1);

class Leer {
    public int getZahl() { return 3; }
}

class Turm {
  private int gesamthoehe;
  private Rechteck oben;
  private Rechteck mitte;
  private Rechteck unten;

  public Turm(int pXKoord, int pYKoord, int pGesamthoehe, int pBreite) {
    gesamthoehe = pGesamthoehe;
    oben = new Rechteck(pXKoord, pYKoord, pBreite, pGesamthoehe / 3, true, "rot");
    mitte = new Rechteck(pXKoord, pYKoord + pGesamthoehe / 3, pBreite, pGesamthoehe / 3, true, "orange");
    unten = new Rechteck(pXKoord, pYKoord + 2 * pGesamthoehe / 3, pBreite, pGesamthoehe / 3, true, "gruen");
  }
  public int getGesamthoehe() { return gesamthoehe; }
  public Rechteck getOben() { return oben; }
  public Rechteck getMitte() { return mitte; }
  public Rechteck getUnten() { return unten; }
}

/**::
 * Zeichnen: import static zeichnen.ImperativesZeichnen.*
 * { "libraries": ["zeichnen"], "expectedOutput": "fertig\n" }
 */
import static zeichnen.ImperativesZeichnen.*;

public class BeispielMethodeZeichnen {

  public static void main(String[] args) {
    starteZeichenflaeche();
    zeichneBaum(200, 300);
    zeichnePunkt(100, 100);
    zeichneLinie(0, 0, 500, 500);
    zeichneDreieck(0, 0, 10, 0, 5, 5, false);
    System.out.println("fertig");
  }

  private static void zeichneBaum(int xKoord, int yKoord) {
    zeichneRechteck(xKoord + 30, yKoord+80, 40, 100, true, "braun");
    zeichneOval(xKoord, yKoord, 100, 100, true, "gruen");
  }
}

/**::
 * Zeichnen: Unterklassen, ZusammengesetzteForm, Interfaces, Farbmanager
 * { "libraries": ["zeichnen"], "expectedOutput": "class Quadrat                 \t (50 | 400) \t gelb\tsichtbar\t100x100\tgefuellt\nnull\n * Oval           \t (300 | 300) \t rot\tsichtbar\t200x200\tgefuellt *\n * Oval           \t (350 | 350) \t gelb\tsichtbar\t100x100\tgefuellt *\nblau\ngruen 120\nbraun [r=1,g=2,b=3]\ntrue\n" }
 */
import zeichnen.*;
import farbmanagment.*;

Zeichenflaeche meinBild = new Zeichenflaeche();
Quadrat q = new Quadrat(50, 400, 100, true, "gelb");
meinBild.fuegeHinzu(q);
System.out.println(q);

ZusammengesetzteForm meineForm = new ZusammengesetzteForm(2);
meineForm.getFiguren()[0] = new Oval(300, 300, 200, 200, true, "rot");
meineForm.getFiguren()[1] = new Oval(350, 350, 100, 100, true, "gelb");
meinBild.fuegeHinzu(meineForm);
System.out.println(meineForm);

AgierendesRechteck ar = new AgierendesRechteck(100, 100, 200, 300, true, "gruen");
ar.agiere();
System.out.println(ar.getFarbe());
ar.agiere();
System.out.println(ar.getFarbe() + " " + ar.getXKoord());

System.out.println(Farbmanager.gibFarbname(Farbmanager.gibFarbe("BRAUN")) + " " + Farbmanager.gibFarbname(new Color(1, 2, 3)));
System.out.println(new Zuordnung("Rot", Farbmanager.gibFarbe("rot")).istGleich("rOT"));

class Quadrat extends Rechteck {
  public Quadrat(int pXKoord, int pYKoord, int pBreite, boolean pGefuellt, String pFarbe) {
    super(pXKoord, pYKoord, pBreite, pBreite, pGefuellt, pFarbe);
  }
}

class AgierendesRechteck extends Rechteck implements AgierendesObjekt {
  public AgierendesRechteck(int pXKoord, int pYKoord, int pBreite, int pHoehe, boolean pGefuellt, String pFarbe) {
    super(pXKoord, pYKoord, pBreite, pHoehe, pGefuellt, pFarbe);
  }
  public void bewegeDichZu(int pXKoord, int pYKoord) {
    xKoord = pXKoord;
    yKoord = pYKoord;
  }
  public void agiere() {
    if (getFarbe().equals("blau")) {
      setzeFarbe("gruen");
    } else {
      setzeFarbe("blau");
    }
    bewegeDichZu(xKoord + 10, yKoord + 10);
  }
}

/**::
 * Zeichnen: eigene Figur mit zeichneDich(Graphics) und KomplexeForm
 * { "libraries": ["zeichnen"], "expectedOutput": "class Kreuz                   \t (10 | 20) \t blau\tsichtbar\nclass Haus\n * Rechteck       \t (0 | 50) \t rot\tsichtbar\t100x100\tgefuellt *\n * Dreieck        \t (0 | 50) \t braun\tsichtbar\t (50|0) (100|50)\tgefuellt *\n" }
 */
import zeichnen.*;
import java.awt.Graphics;

Zeichenflaeche bild = new Zeichenflaeche();
Kreuz k = new Kreuz(10, 20);
bild.fuegeHinzu(k);
System.out.println(k);
Haus h = new Haus();
bild.fuegeHinzu(h);
System.out.println(h);

class Kreuz extends Figur {
    Kreuz(int x, int y) { super(x, y, "blau"); }
    protected void zeichneDich(Graphics stift) {
        stift.setColor(farbe);
        stift.drawLine(xKoord - 5, yKoord, xKoord + 5, yKoord);
        stift.drawLine(xKoord, yKoord - 5, xKoord, yKoord + 5);
    }
}

class Haus extends KomplexeForm {
    private Rechteck wand = new Rechteck(0, 50, 100, 100, true, "rot");
    private Dreieck dach = new Dreieck(0, 50, 50, 0, 100, 50, true, "braun");
    public Dreieck getDach() { return dach; }
    public Rechteck getAWand() { return wand; }
}
