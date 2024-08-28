interface Response<T extends string | object> {
  status: number;
  headers: Record<string, string>;
  body: T;
}
