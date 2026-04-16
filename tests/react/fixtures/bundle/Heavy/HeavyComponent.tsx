import moment from 'moment';
import { cloneDeep } from 'lodash';
import axios from 'axios';

export function HeavyComponent() {
  const date = moment().format('YYYY-MM-DD');
  const data = cloneDeep({ value: 42 });
  return <div>{date} {data.value}</div>;
}
