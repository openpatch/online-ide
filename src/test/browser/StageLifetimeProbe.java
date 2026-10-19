class LifetimeProbe extends Window {
  static SavedStage saved;
  LifetimeProbe() {
    super(320, 200);
    saved = new SavedStage();
    setStage(new DiscardedStage(saved));
  }
}

class SavedStage extends Stage {
  int visits;
  int presses;
  public void run() { visits++; }
  public void whenKeyPressed(KeyCode code) { presses++; }
}

class DiscardedStage extends Stage {
  Stage saved;
  boolean announced;
  DiscardedStage(Stage saved) {
    this.saved = saved;
    LifetimeSprite sprite = new LifetimeSprite();
    add(sprite);
    sprite.getText().showText("attached");
    add(new Pen());
    add(new Text("temporary", 0, 0, 100));
  }
  public void run() {
    if (!announced) {
      announced = true;
      println("LIFETIME_READY");
      Window.getInstance().pause();
    }
  }
  public void whenKeyPressed(KeyCode code) { }
}

class LifetimeSprite extends Sprite {
  public void run() { }
  public void whenKeyPressed(KeyCode code) { }
}

void main() { new LifetimeProbe(); }
