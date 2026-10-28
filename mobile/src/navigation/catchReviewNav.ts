type Listener = () => void;

let reviewActive = false;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function setCatchReviewActive(active: boolean): void {
  if (reviewActive === active) {
    return;
  }
  reviewActive = active;
  notify();
}

export function isCatchReviewActive(): boolean {
  return reviewActive;
}

export function subscribeCatchReview(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
