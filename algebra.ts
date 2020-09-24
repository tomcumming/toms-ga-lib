import { pick, range } from "./utils.ts";

export type Scalar = number;
/** Ordered, comma sep list of vectors */
export type BasisName = string;
export type MultiVector = {
    [basis: string]: Scalar; // BasisName -> Scalar
};
export type VectorIdx = number;

export type Term = Scalar | [VectorIdx];

export class Algebra {
    constructor(
        readonly positive: number,
        readonly negative: number,
        readonly zero: number
    ) {}

    blades(): BasisName[][] {
        const vectorCount = this.positive + this.negative + this.zero;
        const vecs: VectorIdx[] = Array.from(range(0, vectorCount - 1));
        return Array.from(range(0, vectorCount))
            .map(n => pick(n, vecs))
            .map(vs => vs.map(vs2 => vs2.join()));
    }

    basis(): BasisName[] {
        return this.blades().flat();
    }

    simplify(ts: Term[]): MultiVector {
        const inner = (ts: Term[]): Term[] => {
            if(ts.length < 2) return ts;
            else {
                const [head, second, ...tail] = [ts[0], ...inner(ts.slice(1))];
                if(typeof head === 'number') {
                    if(typeof second === "number") return [head * second, ...tail];
                    else return ts;
                } else {
                    if(typeof second === 'number') return inner([second, head, ...tail]);
                    else if(head[0] > second[0]) return inner([-1, second, head, ...tail]);
                    else if(head[0] === second[0]) {
                        if(head[0] < this.zero) return [0, ...tail];
                        else if(head[0] < this.zero + this.positive) return [1, ...tail];
                        else return [-1, ...tail];
                    } else return ts;
                }
            }
        };

        const simplified = inner(ts);

        const scalar = simplified.length === 0
            ? 0
            : typeof simplified[0] === 'number' ? simplified[0] : 1;
        if (scalar === 0) return {};

        const vecs = typeof simplified[0] === 'number' ? simplified.slice(1) : simplified;
        const parts: [BasisName, Scalar][] = [
            ["", scalar],
            ...vecs.map<[BasisName, Scalar]>(v => [(v as [VectorIdx])[0].toString(), 1])
        ];

        return Object.fromEntries(parts.filter(([bn, s]) => s !== 0));
    }

    basisBlade(basis: BasisName): number {
        return this.blades().findIndex(b => b.includes(basis));
    }

    reverse(mv: MultiVector): MultiVector {
        return Object.fromEntries(
            Object.entries(mv)
                .map(([bn, s]) => [bn, s * this.basisBlade(bn) % 4 > 1 ? -1 : 1])
        );
    }
}

const pga2 = new Algebra(2, 0, 1);
const pga3 = new Algebra(3, 0, 1);

console.log('pga2 blades', pga2.blades());
console.log('pga3 blades', pga3.blades());

console.log('pga2 basis', pga2.basis());
console.log('pga3 basis', pga3.basis());

console.log('reverse pga2', pga2.reverse(Object.fromEntries(pga2.basis().map(bn => [bn, 1]))));
console.log('reverse pga3', pga3.reverse(Object.fromEntries(pga3.basis().map(bn => [bn, 1]))));

console.log('Simplify 1 * 2 * 3', pga2.simplify([1, 2, 3]));
console.log('Simplify e2 * 3 * e1', pga2.simplify([[2], 3, [1]]));
console.log('Simplify e2 * 3 * e1 * e2', pga2.simplify([[2], 3, [1], [2]]));
console.log('Simplify e0 * e0', pga2.simplify([[0], [0]]));
console.log('Simplify e0 * 3 * e1 * e0', pga2.simplify([[0], 3, [1], [0]]));
