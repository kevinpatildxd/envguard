export function InlineFunction({ id }: { id: number }) {
  return <button onClick={() => console.log(id)}>Click</button>;
}
