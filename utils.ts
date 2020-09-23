export function* range(start: number, end: number, step = 1): Iterable<number> {
    for(let x = start; x <= end; x += step)
        yield x;
}

export function pick<T>(n: number, xs: T[]): T[][] {
    if(xs.length < n) return [];
    else if(n === 0) return [[]];
    else {
        const [head, ...tail] = xs;
        return pick(n - 1, tail)
            .map(ys => [head, ...ys])
            .concat(pick(n, tail));
    }
}

export function arrayEqual<T>(xs: T[], ys: T[]): boolean {
    return xs.length === ys.length && xs.every((x, idx) => x === ys[idx]);
}
