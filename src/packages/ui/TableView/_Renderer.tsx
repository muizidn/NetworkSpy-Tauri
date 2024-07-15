export interface Renderer<T> {
    render: (input: T) => React.ReactNode;
  }
  