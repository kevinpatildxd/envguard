import { format } from 'date-fns';

export function CleanComponent() {
  const date = format(new Date(), 'yyyy-MM-dd');
  return <div>{date}</div>;
}
