class TransitionProbe extends Window {
  static int factories;
  static int oldFrames;

  TransitionProbe() {
    super(320, 200);
    setStage(new SourceStage(this));
  }
}

class SourceStage extends Stage {
  private TransitionProbe window;
  SourceStage(TransitionProbe window) { this.window = window; }

  public void run() {
    TransitionProbe.oldFrames++;
    if (TransitionProbe.oldFrames != 1) throw new RuntimeException("Old stage ran during transition");
    Stage original = this;
    window.transitionToStage(() -> {
      TransitionProbe.factories++;
      if (!Window.isTransitioning() || window.getStage() != original) {
        throw new RuntimeException("Factory ran outside the reserved transition");
      }
      window.transitionToStage(() -> { throw new RuntimeException("Reentrant request ran"); }, 30);
      println("BUILDING");
      Stage destination = new DestinationStage(window);
      println("CREATED");
      return destination;
    }, 30);
    if (TransitionProbe.factories != 0 || !Window.isTransitioning()) {
      throw new RuntimeException("Factory ran before the fade");
    }
    window.transitionToStage(() -> { throw new RuntimeException("Busy request ran"); }, 30);
    println("REQUESTED");
  }
}

class DestinationStage extends Stage {
  private TransitionProbe window;
  private boolean sawFadeIn;
  DestinationStage(TransitionProbe window) {
    this.window = window;
    // An interpreted constructor can wait for assets while the screen stays black.
    this.wait(500);
  }

  public void run() {
    if (Window.isTransitioning()) {
      sawFadeIn = true;
      window.transitionToStage(() -> { throw new RuntimeException("Fade-in request ran"); }, 30);
      return;
    }
    if (!sawFadeIn || TransitionProbe.factories != 1 || TransitionProbe.oldFrames != 1) {
      throw new RuntimeException("Transition lifecycle mismatch");
    }
    println("TRANSITION_PASS");
    window.pause();
  }
}

void main() { new TransitionProbe(); }
