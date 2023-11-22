// Credits: https://github.com/Garlic-Team/gcommands/blob/next/src/util/customId.ts

export function uid() {
  const head = Date.now().toString(36);
  const tail = Math.random().toString(36).substring(2);

  return head + tail;
}

export function customId(name: string, ...args: (string | number)[]) {
  return `${name}${args[0] ? `-${args.join('-')}` : ''}-${uid()}`;
}
