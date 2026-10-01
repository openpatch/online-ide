/**::
 * Test NRW class Graph with weighted edges
 * {"libraries": ["nrw"]}
 */
Graph welt = new Graph();
Vertex dorf = new Vertex("dorf");
Vertex wald = new Vertex("wald");
Vertex hoehle = new Vertex("hoehle");
welt.addVertex(dorf);
welt.addVertex(wald);
welt.addVertex(hoehle);

Edge e = new Edge(dorf, wald, 2);
welt.addEdge(e);
welt.addEdge(new Edge(dorf, hoehle, 5));

assertEquals(2.0, e.getWeight(), "Edge.getWeight broken");
e.setWeight(3);
assertEquals(3.0, welt.getEdge(dorf, wald).getWeight(), "Edge.setWeight or Graph.getEdge broken");
assertEquals(dorf, e.getVertices()[0], "Edge.getVertices broken");

List<Vertex> nachbarn = welt.getNeighbours(dorf);
String s = "";
nachbarn.toFirst();
while (nachbarn.hasAccess()) {
    s = s + nachbarn.getContent().getID() + " ";
    nachbarn.next();
}
assertEquals("wald hoehle ", s, "Graph.getNeighbours broken");
assertCodeReached("Graph test must run to its end.");

/**::
 * Test NRW class BinarySearchTree with a ComparableContent class
 * {"libraries": ["nrw"]}
 */
BinarySearchTree<Zahl> baum = new BinarySearchTree<Zahl>();
baum.insert(new Zahl(5));
baum.insert(new Zahl(2));
baum.insert(new Zahl(8));

assertEquals(2, baum.search(new Zahl(2)).getWert(), "BinarySearchTree.search broken");
assertEquals(null, baum.search(new Zahl(7)), "BinarySearchTree.search broken");
assertEquals(2, baum.getLeftTree().getContent().getWert(), "BinarySearchTree.insert broken");
assertCodeReached("BinarySearchTree test must run to its end.");

class Zahl implements ComparableContent<Zahl> {
    private int wert;

    public Zahl(int pWert) {
        wert = pWert;
    }

    public int getWert() {
        return wert;
    }

    public boolean isGreater(Zahl pAndere) {
        return wert > pAndere.getWert();
    }

    public boolean isEqual(Zahl pAndere) {
        return wert == pAndere.getWert();
    }

    public boolean isLess(Zahl pAndere) {
        return wert < pAndere.getWert();
    }
}
