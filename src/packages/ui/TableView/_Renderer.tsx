export interface Renderer<T> {
  render({ input }: { input: T }): React.ReactNode;
}
