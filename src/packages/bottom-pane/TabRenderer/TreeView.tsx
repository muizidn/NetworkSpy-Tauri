export const TreeView = ({ data }: { data: string }) => <pre>{JSON.stringify(JSON.parse(data), null, 2)}</pre>;
