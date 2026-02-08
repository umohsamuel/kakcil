export type ParamCtx = {
  values: (string | number | boolean)[];
  count: number;
};

export default function addField(
  ctx: ParamCtx,
  column: string,
  value: string | number | boolean | undefined,
): string | null {
  if (value === undefined) return null;

  ctx.count += 1;
  ctx.values.push(value);
  return `${column} = $${ctx.count}`;
}
