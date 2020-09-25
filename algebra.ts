import { pick, range } from "./utils.ts";

export type Scalar = number;
/** Ordered, comma sep list of vectors */
export type BasisName = string;
export type MultiVector = {
    [basis: string]: Scalar; // BasisName -> Scalar
};
export type VectorIdx = number;

export type Term = Scalar | [VectorIdx];

export function vectorsOfBasisName(bn: BasisName): BasisName[] {
    return bn.split(',').filter(v => v !== '');
}

export function basisNameTerms(bn: BasisName): Term[] {
    return vectorsOfBasisName(bn).map(v => [parseInt(v, 10)]);
}

export class Algebra {
    constructor(
        readonly positive: number,
        readonly negative: number,
        readonly zero: number
    ) {}

    vectors(): BasisName[] {
        const vectorCount = this.positive + this.negative + this.zero;
        return Array.from(range(0, vectorCount - 1))
            .map(v => v.toString());
    }

    blades(): BasisName[][] {
        return Array.from(range(0, this.vectors().length))
            .map(n => pick(n, this.vectors()))
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
        return { [vecs.join()]: scalar };
    }

    basisBlade(basis: BasisName): number {
        return this.blades().findIndex(b => b.includes(basis));
    }

    reverse(mv: MultiVector): MultiVector {
        return Object.fromEntries(
            Object.entries(mv)
                .map(([bn, s]) => [bn, s * (this.basisBlade(bn) % 4 > 1 ? -1 : 1)])
        );
    }

    /** Hodge Star */
    dual(mv: MultiVector): MultiVector {
        // I think we need to solve `b * x = PSS` for x against each basis `b` of `mv`
        const mvs = Object
            .entries(mv)
            .map(([bn, s]) => {
                const vs = vectorsOfBasisName(bn);
                const rhs = this.vectors().filter(v => !vs.includes(v)).join();
                const result = this.simplify([s, ...basisNameTerms(bn), ...basisNameTerms(rhs)]);
                const sign = Math.sign(result[this.vectors().join()] || 0);
                return this.simplify([sign, Math.abs(s), ...basisNameTerms(rhs)]);
            });

        return this.sum(...mvs);
    }

    unDual(mv: MultiVector): MultiVector {
        // Like above but solve `x * b = PSS` for x against each basis `b` of `mv`?
        const mvs = Object
            .entries(mv)
            .map(([bn, s]) => {
                const vs = vectorsOfBasisName(bn);
                const rhs = this.vectors().filter(v => !vs.includes(v)).join();
                const result = this.simplify([s, ...basisNameTerms(rhs), ...basisNameTerms(bn)]);
                const sign = Math.sign(result[this.vectors().join()] || 0);
                return this.simplify([sign, Math.abs(s), ...basisNameTerms(rhs)]);
            });

        return this.sum(...mvs);
    }

    sum(...mvs: MultiVector[]): MultiVector {
        return mvs.flatMap(Object.entries)
            .reduce((p, [bn, s]) => ({ ...p, [bn]: (p[bn] || 0) + s }) , {} as any);
    }

    mul(...mvs: MultiVector[]): MultiVector {
        const mulTwo = (mv1: MultiVector, mv2: MultiVector): MultiVector => {
            const mvs = Object.entries(mv1).flatMap(([bn, s]) => {
                const left = [s, ...basisNameTerms(bn)];
                return Object.entries(mv2).map(([bn, s]) => {
                    const right = [s, ...basisNameTerms(bn)];
                    return this.simplify([...left, ...right]);
                })
            });
            return this.sum(...mvs);
        }

        return mvs.reduce(mulTwo, { "": 1 } as MultiVector);
    }

    selectGrade(mv: MultiVector, ...grades: number[]): MultiVector {
        const basis = new Set(grades.flatMap(k => this.blades()[k]));
        return Object.fromEntries(Object.entries(mv).filter(([bn, _s]) => basis.has(bn)));
    }
}
