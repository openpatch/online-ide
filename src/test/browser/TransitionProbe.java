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
      if (!window.isTransitioning() || window.getStage() != original) {
        throw new RuntimeException("Factory ran outside the reserved transition");
      }
      window.transitionToStage(() -> { throw new RuntimeException("Reentrant request ran"); }, 0.03);
      println("BUILDING");
      Stage destination = new DestinationStage(window);
      println("CREATED");
      return destination;
    }, 0.03);
    if (TransitionProbe.factories != 0 || !window.isTransitioning()) {
      throw new RuntimeException("Factory ran before the fade");
    }
    window.transitionToStage(() -> { throw new RuntimeException("Busy request ran"); }, 0.03);
    println("REQUESTED");
  }
}

class DestinationStage extends Stage {
  private TransitionProbe window;
  private boolean passed;
  DestinationStage(TransitionProbe window) {
    this.window = window;
    // An interpreted constructor can wait for assets while the old stage stands still.
    this.waitSeconds(0.5);
  }

  public void run() {
    // pause() holds the next batch of ticks; the rest of this one still runs, as upstream
    if (passed) return;
    // 7.0: the new stage's run() starts once the transition is over
    if (window.isTransitioning()) {
      throw new RuntimeException("New stage ran during the transition");
    }
    if (TransitionProbe.factories != 1 || TransitionProbe.oldFrames != 1) {
      throw new RuntimeException("Transition lifecycle mismatch");
    }
    println("TRANSITION_PASS");
    passed = true;
    window.pause();
  }
}

void main() { new TransitionProbe(); }
