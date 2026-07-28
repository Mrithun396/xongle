export function withTimeout<T = any>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error('timeout')), ms);
    Promise.resolve(promise).then(
      (val) => { clearTimeout(timeoutId); resolve(val); },
      (err) => { clearTimeout(timeoutId); reject(err); }
    );
  });
}