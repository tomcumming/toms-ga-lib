import { arrayEqual, pick, range } from "./utils.ts";

export type Scalar = number;
export type MultiVector = [Scalar, ...Scalar[]];
export type VectorIdx = number;

export type Term = Scalar | [VectorIdx];

// Vectors are laid out in order zeros, positives, negatives (just like bivector.net)

export class Algebra {
    constructor(
        readonly positive: number,
        readonly negative: number,
        readonly zero: number
    ) {}

    blades(): VectorIdx[][][] {
        const vectorCount = this.positive + this.negative + this.zero;
        const vecs: VectorIdx[] = Array.from(range(0, vectorCount - 1));
        return Array.from(range(0, vectorCount)).map(n => pick(n, vecs));
    }

    basis(): VectorIdx[][] {
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
                        if(head[0] < this.zero) return tail;
                        else if(head[0] < this.zero + this.positive) return [1, ...tail];
                        else return [-1, ...tail];
                    } else return ts;
                }
            }
        };

        const simplified = inner(ts);
        if(simplified.length === 0) return [0];
        else if(typeof simplified[0] !== 'number') return [1, ...simplified.map(x => (x as [number])[0])];
        else return [simplified[0], ...simplified.slice(1).map(x => (x as [number])[0])];
    }

    elementBlade(elem: VectorIdx[]): number {
        return this.blades().findIndex(b => b.some(e => arrayEqual(elem, e)));
    }

    reverse(mv: MultiVector): MultiVector {
        return mv.map((x, idx) => x * (this.elementBlade(this.basis()[idx]) % 4 > 1 ? -1 : 1)) as MultiVector;
    }
}

const pga2 = new Algebra(2, 0, 1);
const pga3 = new Algebra(3, 0, 1);

console.log(pga2.reverse(pga2.basis().map(() => 1) as MultiVector));
console.log(pga3.reverse(pga3.basis().map(() => 1) as MultiVector));
