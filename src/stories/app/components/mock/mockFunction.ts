export const createMockFunction = () => {
  const fn: any = (...args: any[]) => fn.mock.calls.push(args);
  fn.mock = { calls: [] };
  return fn;
};
