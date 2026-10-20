export function mountBenchStage(): () => void {
  let stop = () => {};
  let disposed = false;

  import('../scripts/workbench-stage').then(({ mountWorkbenchStage }) => {
    if (!disposed) {
      stop = mountWorkbenchStage();
    }
  });

  return () => {
    disposed = true;
    stop();
  };
}
