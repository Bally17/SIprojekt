/* NOSONAR: extending built-in is intentional and guarded */
if (!Object.hasOwn(String.prototype, "idUsing")) {
  Object.defineProperty(String.prototype, "idUsing", {
    value: function idUsing(this: string): string {
      const base = this.normalize("NFKD")
        .replaceAll(/[\u0300-\u036f]/g, "")
        .toLowerCase();

      return base
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
    },
    writable: false,
    configurable: false,
    enumerable: false,
  });
}

export const idUsingInstalled = true;
