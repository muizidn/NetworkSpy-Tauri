export interface Renderer<T> {
  render({ input, width }: { input: T; width: number }): React.ReactNode;
}
